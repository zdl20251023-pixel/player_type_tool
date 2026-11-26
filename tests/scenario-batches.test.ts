import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'
import { Workbench } from '../src/runner/workbench'
import { WorkbenchStore } from '../src/storage/workbench'
import { recoverScenarioObjects } from '../src/runner/scenario-batches'
import { diagnoseModel } from '../src/client/model-stream'
import { defaultModel } from '../src/client/language-model'
import { fixtures } from '../src/scenarios/fixtures'
import { validFixtures } from '../src/scenarios/generated'
import { createWebHandler } from '../src/web/server'
import { record } from '../src/analysis/strategy'

test('diagnosis identifies reasoning-only exhaustion and recovery never invents an unfinished object', () => {
  const diagnosis = diagnoseModel({
    content: '',
    usage: { completion_tokens: 8192, completion_tokens_details: { reasoning_tokens: 8192 } },
    raw: { chunks: [{ choices: [{ finish_reason: 'length' }] }] },
  })
  expect(diagnosis.kind).toBe('output-limit')
  expect(diagnosis.problem).toContain('思考耗尽输出额度')
  expect(diagnosis.problem).toContain('不是请求超时')
  expect(diagnosis.reasoningTokens).toBe(8192)
  const candidate = { ...fixtures[0], history: '字符串中的 } 和 \\" 引号不应切断对象' }
  const partial = `{"scenarios":[${JSON.stringify(candidate)},{"id":"unfinished","line":"`
  expect(recoverScenarioObjects(partial)).toEqual([candidate])
  expect(recoverScenarioObjects('{"scenarios":[{"id":')).toEqual([])
  expect(recoverScenarioObjects('{"unrelated":[]}')).toEqual([])
})

test('independent batches preserve valid partial routes, continue after a failure, deduplicate and retry only missing slots', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'scenario-batch-'))
  const store = new WorkbenchStore(root)
  const workbench = new Workbench(store)
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const attempts = new Map<number, number>()
  const outputs = fixtures.slice(0, 8)
  let inFlight = 0,
    peak = 0
  const upstream = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const body = record(await req.json())
      const messages = body.messages as { content: string }[]
      const context = record(JSON.parse(messages[1].content.split('批次上下文：')[1]))
      const index = Number(context.batchIndex)
      attempts.set(index, (attempts.get(index) ?? 0) + 1)
      const attempt = attempts.get(index)!
      expect(body.thinking).toEqual({ type: 'enabled' })
      expect(body.max_tokens).toBe(8192)
      inFlight++
      peak = Math.max(peak, inFlight)
      try {
        if (index === 2 && attempt === 1) {
          return Response.json({ error: 'local failure' }, { status: 503 })
        }
        let content: string
        let finish = 'stop'
        if (index === 1 && attempt === 1) {
          finish = 'length'
          content = `{"scenarios":[${JSON.stringify(outputs[0])},${JSON.stringify({ ...outputs[1], line: '0:x' })},{"id":`
        } else if (index === 3) {
          await gate
          content = JSON.stringify({ scenarios: [outputs[4]] })
        } else if (index === 1) {
          expect((context.remainingTargets as unknown[]).length).toBe(1)
          content = JSON.stringify({ scenarios: [outputs[1]] })
        } else if (attempt === 2) {
          content = JSON.stringify({ scenarios: [outputs[0], outputs[2]] })
        } else {
          expect((context.remainingTargets as unknown[]).length).toBe(1)
          content = JSON.stringify({ scenarios: [outputs[3]] })
        }
        return Response.json({
          choices: [{ finish_reason: finish, message: { content } }],
          usage: { completion_tokens: 250 },
        })
      } finally {
        inFlight--
      }
    },
  })
  const handler = createWebHandler(workbench)
  const request = (path: string, body?: unknown) =>
    handler(
      new Request(
        `http://127.0.0.1:3217/api${path}`,
        body === undefined
          ? undefined
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }
      )
    )
  try {
    await workbench.saveSettings({
      model: {
        ...defaultModel,
        model: 'deepseek-v4-pro',
        baseUrl: `http://127.0.0.1:${upstream.port}`,
      },
      apiKey: 'local-only',
    })
    const input = {
      count: 5,
      requirements: '不同翻前路线',
      players: (await workbench.settings()).players,
      batchSize: 2,
      concurrency: 2,
    }
    const preview = record(await (await request('/scenario-generations/preview', input)).json())
    expect(preview.plannedRequests).toBe(3)
    expect(attempts.size).toBe(0)
    const started = await request('/scenario-generations', input)
    expect(started.status).toBe(202)
    const id = String(record(await started.json()).id)
    let job = await workbench.scenarioBatches.detail(id)
    for (
      let i = 0;
      i < 200 &&
      (!job.fixtures.length ||
        job.batches[1].status !== 'failed' ||
        job.batches[2].status !== 'running');
      i++
    ) {
      await Bun.sleep(5)
      job = await workbench.scenarioBatches.detail(id)
    }
    expect(job.status).toBe('running')
    expect(job.fixtures.map((f) => f.id)).toEqual(['G001'])
    expect(job.batches[0].status).toBe('partial')
    expect(job.batches[1].status).toBe('failed')
    expect(job.batches[2].status).toBe('running')
    expect(peak).toBeLessThanOrEqual(2)
    expect(validFixtures(job.fixtures)).toHaveLength(1)
    // Usable temporary results can become a solver experiment while another model request is blocked.
    const experiment = await workbench.create({
      name: '临时场景',
      requirements: '独立执行',
      players: input.players,
      fixtures: job.fixtures,
      repeats: 1,
    })
    expect(experiment.fixtures).toHaveLength(1)
    expect(experiment.status).toBe('draft')
    const reopened = new Workbench(store)
    expect((await reopened.scenarioBatches.detail(id)).status).toBe('interrupted')
    expect((await reopened.scenarioBatches.detail(id)).fixtures).toHaveLength(1)
    release()
    for (let i = 0; i < 200 && job.status === 'running'; i++) {
      await Bun.sleep(5)
      job = await workbench.scenarioBatches.detail(id)
    }
    expect(job.status).toBe('partial')
    expect(job.fixtures).toHaveLength(2)
    const wait = async () => {
      let current = await workbench.scenarioBatches.detail(id)
      for (let i = 0; i < 200 && current.status === 'running'; i++) {
        await Bun.sleep(5)
        current = await workbench.scenarioBatches.detail(id)
      }
      return current
    }
    await workbench.scenarioBatches.resume(id, { batchIndex: 0 })
    job = await wait()
    expect(job.fixtures).toHaveLength(3)
    expect(attempts.get(3)).toBe(1)
    await workbench.scenarioBatches.resume(id, { batchIndex: 1 })
    job = await wait()
    expect(job.batches[1].status, JSON.stringify(job.batches[1])).toBe('partial')
    expect(job.batches[1].problem).toContain('重复')
    expect(job.fixtures).toHaveLength(4)
    await workbench.scenarioBatches.resume(id, { batchIndex: 1 })
    job = await wait()
    expect(job.status).toBe('completed')
    expect(job.fixtures).toHaveLength(5)
    expect(validFixtures(job.fixtures)).toHaveLength(5)
    expect(new Set(job.fixtures.map((f) => f.id)).size).toBe(5)
    expect(attempts.get(1)).toBe(2)
    expect(attempts.get(2)).toBe(3)
    expect(attempts.get(3)).toBe(1)
    const firstCall = job.batches[0].attempts[0].callId
    const diagnostic: unknown = await (await request(`/calls/${firstCall}/diagnostic`)).json()
    expect(record(diagnostic).finishReason).toBe('length')
    expect(
      record(await store.read(['calls', firstCall, 'response.json'])).partialContent
    ).toContain('"id":')
    const calls = await request('/calls')
    expect(calls.status).toBe(200)
    expect(await calls.text()).not.toContain('local-only')
    const balanced = await workbench.scenarioBatches.plan({
      ...input,
      count: 10,
      requirements: '翻前翻后的情况各5种',
    })
    expect(
      balanced.batches.flatMap((b) => b.targets).filter((t) => t.stage === 'preflop')
    ).toHaveLength(5)
    expect(
      balanced.batches.flatMap((b) => b.targets).filter((t) => t.stage === 'postflop')
    ).toHaveLength(5)
    const automatic = await workbench.scenarioBatches.plan({
      ...input,
      count: 10,
      batchMode: 'auto',
      batchSize: 5,
      concurrency: 3,
    })
    expect(automatic.batches.map((b) => b.targets.length)).toEqual([3, 3, 3, 1])
    expect(automatic.concurrency).toBe(2)
    expect(automatic.thinking).toBe('enabled')
    const small = await workbench.scenarioBatches.plan({ ...input, count: 1, thinking: 'disabled' })
    expect(small.batchSize).toBe(1)
    expect(small.concurrency).toBe(1)
    expect(small.thinking).toBe('disabled')
    const prior = JSON.stringify(await workbench.scenarioBatches.detail(id))
    const conflict = { ...input, count: 2, requirements: '翻前和翻后各3条' }
    const callsBefore = [...attempts.values()].reduce((a, b) => a + b, 0)
    expect(workbench.scenarioBatches.preview(conflict)).rejects.toThrow('共 6 条')
    expect(workbench.scenarioBatches.create(conflict)).rejects.toThrow('共 6 条')
    expect([...attempts.values()].reduce((a, b) => a + b, 0)).toBe(callsBefore)
    expect(JSON.stringify(await workbench.scenarioBatches.detail(id))).toBe(prior)
  } finally {
    release()
    await upstream.stop(true)
    const inside = relative(tmpdir(), root)
    if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})

test('pausing keeps running results, restart resumes only pending batches and street quotas reject mismatches', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'scenario-batch-pause-'))
  const store = new WorkbenchStore(root)
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const seen: number[] = []
  const upstream = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const body = record(await req.json())
      const context = record(
        JSON.parse((body.messages as { content: string }[])[1].content.split('批次上下文：')[1])
      )
      const index = Number(context.batchIndex)
      seen.push(index)
      if (seen.length === 1) {
        await gate
      }
      return Response.json({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: JSON.stringify({ scenarios: [fixtures[index - 1]] }) },
          },
        ],
      })
    },
  })
  try {
    const wb = new Workbench(store)
    await wb.saveSettings({
      model: { ...defaultModel, baseUrl: `http://127.0.0.1:${upstream.port}` },
      apiKey: 'local-only',
    })
    const input = {
      count: 3,
      batchSize: 1,
      concurrency: 1,
      requirements: '不同路线',
      players: (await wb.settings()).players,
    }
    const initial = await wb.scenarioBatches.create(input)
    for (let i = 0; i < 100 && !seen.length; i++) {
      await Bun.sleep(5)
    }
    await wb.scenarioBatches.pause(initial.id)
    expect((await wb.scenarioBatches.detail(initial.id)).status).toBe('pausing')
    release()
    let job = await wb.scenarioBatches.detail(initial.id)
    for (let i = 0; i < 200 && job.status === 'pausing'; i++) {
      await Bun.sleep(5)
      job = await wb.scenarioBatches.detail(initial.id)
    }
    expect(job.status).toBe('paused')
    expect(job.fixtures).toHaveLength(1)
    expect(seen).toEqual([1])
    const reopened = new Workbench(store)
    await reopened.scenarioBatches.resume(initial.id, {})
    job = await reopened.scenarioBatches.detail(initial.id)
    for (let i = 0; i < 200 && job.status === 'running'; i++) {
      await Bun.sleep(5)
      job = await reopened.scenarioBatches.detail(initial.id)
    }
    expect(job.status).toBe('completed')
    expect(job.fixtures).toHaveLength(3)
    expect(seen).toEqual([1, 2, 3])
    const mismatch = await reopened.scenarioBatches.create({
      ...input,
      count: 1,
      stagePlan: 'postflop',
    })
    let mismatchJob = await reopened.scenarioBatches.detail(mismatch.id)
    for (let i = 0; i < 200 && mismatchJob.status === 'running'; i++) {
      await Bun.sleep(5)
      mismatchJob = await reopened.scenarioBatches.detail(mismatch.id)
    }
    expect(mismatchJob.fixtures).toHaveLength(0)
    expect(mismatchJob.batches[0].problem).toContain('街道配额')
  } finally {
    release()
    await upstream.stop(true)
    const inside = relative(tmpdir(), root)
    if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})
