import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative, isAbsolute } from 'node:path'
import { defaultModel, requestModel, validModel } from '../src/client/language-model'
import { ModelRequestError, type ModelResult } from '../src/client/model-stream'
import { Workbench } from '../src/runner/workbench'
import { WorkbenchStore } from '../src/storage/workbench'
import { createWebHandler } from '../src/web/server'
import { representativeFixtures } from '../src/scenarios/representative'
import { record } from '../src/analysis/strategy'

const encoder = new TextEncoder()
const event = (content: unknown) => `data: ${JSON.stringify(content)}\r\n\r\n`

test('stream reader preserves split UTF-8 and CRLF events, reasoning counts and final usage', async () => {
  const wire =
    event({
      model: 'local-pro',
      choices: [{ delta: { reasoning_content: '计划路线' }, finish_reason: null }],
    }) +
    event({ choices: [{ delta: { content: '{"reply":"中文结果"}' }, finish_reason: null }] }) +
    event({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: { total_tokens: 40 } }) +
    'data: [DONE]\r\n\r\n'
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const body = record(await req.json())
      expect(body.stream).toBe(true)
      const bytes = encoder.encode(wire)
      return new Response(
        new ReadableStream({
          start(controller) {
            for (let i = 0; i < bytes.length; i += 7) {
              controller.enqueue(bytes.slice(i, i + 7))
            }
            controller.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    },
  })
  const progress: number[] = []
  try {
    const result = await requestModel(
      { ...defaultModel, baseUrl: `http://127.0.0.1:${server.port}` },
      'local-only',
      { system: 'JSON', user: 'test' },
      {
        onProgress: (value) => {
          progress.push(value.reasoningChars)
          return Promise.resolve()
        },
      }
    )
    expect(JSON.parse(result.content)).toEqual({ reply: '中文结果' })
    expect(progress).toContain(4)
    expect(result.usage).toEqual({ total_tokens: 40 })
    expect(record(result.raw).complete).toBe(true)
  } finally {
    await server.stop(true)
  }
})

test('timeout while reading a non-streaming body is classified and described instead of leaking a raw timeout', async () => {
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch() {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(' '))
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    },
  })
  try {
    let failure: unknown
    try {
      await requestModel(
        { ...defaultModel, timeoutMs: 150, baseUrl: `http://127.0.0.1:${server.port}` },
        'local-only',
        { system: 'JSON', user: 'test' }
      )
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(ModelRequestError)
    expect((failure as Error).message).toContain('读取响应超时')
    expect(validModel({ ...defaultModel, timeoutMs: 600000 }).timeoutMs).toBe(600000)
    expect(() => validModel({ ...defaultModel, timeoutMs: 900001 })).toThrow('900000')
  } finally {
    await server.stop(true)
  }
})

test('streaming timeout retains partial output and raw chunks', async () => {
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch() {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                event({ choices: [{ delta: { content: '{"scenarios":[' }, finish_reason: null }] })
              )
            )
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    },
  })
  try {
    let partial: ModelResult | null = null
    try {
      await requestModel(
        { ...defaultModel, timeoutMs: 80, baseUrl: `http://127.0.0.1:${server.port}` },
        'local-only',
        { system: 'JSON', user: 'test' },
        { onProgress: () => Promise.resolve() }
      )
    } catch (error) {
      expect(error).toBeInstanceOf(ModelRequestError)
      const failure = error as ModelRequestError
      expect(failure.kind).toBe('timeout')
      partial = failure.partial
    }
    expect(partial?.content).toBe('{"scenarios":[')
    expect(record(partial?.raw).chunks).toHaveLength(1)
    expect(record(partial?.raw).complete).toBe(false)
  } finally {
    await server.stop(true)
  }
})

test('model jobs return immediately, expose progress, survive page polling and store final results without reissuing requests', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'player-model-job-'))
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let requests = 0
  let holdForever = false
  const payload = JSON.stringify({ scenarios: [representativeFixtures[0]] })
  const upstream = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      requests++
      const body = record(await req.json())
      expect(body.stream).toBe(true)
      return new Response(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(
              encoder.encode(
                event({
                  choices: [{ delta: { content: payload.slice(0, 20) }, finish_reason: null }],
                })
              )
            )
            if (holdForever) {
              return
            }
            await gate
            controller.enqueue(
              encoder.encode(
                event({
                  choices: [{ delta: { content: payload.slice(20) }, finish_reason: 'stop' }],
                })
              )
            )
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    },
  })
  const store = new WorkbenchStore(root)
  const workbench = new Workbench(store)
  const handler = createWebHandler(workbench)
  try {
    await workbench.saveSettings({
      model: { ...defaultModel, baseUrl: `http://127.0.0.1:${upstream.port}` },
      apiKey: 'local-only',
    })
    const players = (await workbench.settings()).players
    const started = await handler(
      new Request('http://127.0.0.1:3217/api/model/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'scenarios',
          requirements: '生成一条合法翻前路线',
          count: 1,
          players,
        }),
      })
    )
    expect(started.status).toBe(202)
    const id = String(record(await started.json()).callId)
    let job = await workbench.modelJob(id)
    for (let i = 0; i < 100 && !job.progress.contentChars; i++) {
      await Bun.sleep(5)
      job = await workbench.modelJob(id)
    }
    expect(job.status).toBe('running')
    expect(job.progress.contentChars).toBe(20)
    expect(
      (await store.read<{ incomplete: boolean }>(['calls', id, 'response.json'])).incomplete
    ).toBe(true)
    const reopened = new Workbench(store)
    expect((await reopened.modelJob(id)).status).toBe('interrupted')
    expect(requests).toBe(1)
    holdForever = true
    await workbench.saveSettings({
      model: { ...(await workbench.settings()).model, timeoutMs: 1000 },
    })
    const failed = await workbench.startModel({
      task: 'scenarios',
      requirements: '超时测试',
      count: 1,
      players,
    })
    let timedOut = await workbench.modelJob(failed.callId)
    for (let i = 0; i < 150 && timedOut.status === 'running'; i++) {
      await Bun.sleep(10)
      timedOut = await workbench.modelJob(failed.callId)
    }
    expect(timedOut.status).toBe('failed')
    expect(timedOut.problem).toContain('超时')
    expect(
      (await store.read<{ failureKind: string }>(['calls', failed.callId, 'result.json']))
        .failureKind
    ).toBe('timeout')
    expect(
      (await store.read<{ incomplete: boolean }>(['calls', failed.callId, 'response.json']))
        .incomplete
    ).toBe(true)
    expect(requests).toBe(2)
    release()
    for (let i = 0; i < 100 && job.status === 'running'; i++) {
      await Bun.sleep(10)
      job = await workbench.modelJob(id)
    }
    expect(job.status).toBe('completed')
    expect(job.result).toEqual([representativeFixtures[0]])
    const polled = await handler(new Request(`http://127.0.0.1:3217/api/model/jobs/${id}`))
    expect(polled.status).toBe(200)
    expect(record(await polled.json()).status).toBe('completed')
    expect((await reopened.modelJob(id)).result).toEqual([representativeFixtures[0]])
    expect(requests).toBe(2)
  } finally {
    release()
    await upstream.stop(true)
    const inside = relative(tmpdir(), root)
    if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})
