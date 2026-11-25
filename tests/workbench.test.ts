import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative, isAbsolute } from 'node:path'
import { Workbench } from '../src/runner/workbench'
import { WorkbenchStore } from '../src/storage/workbench'
import { createWebHandler } from '../src/web/server'
import { catalogOptions, validPlayer } from '../src/profiles/catalog'
import { validFixtures } from '../src/scenarios/generated'
import { representativeFixtures } from '../src/scenarios/representative'
import { defaultModel, requestModel, parseModelJson } from '../src/client/language-model'
import { defaultPrompts, renderPrompt } from '../src/analysis/prompts'
import { record } from '../src/analysis/strategy'
import type { AIRequestBody } from '../src/contracts/lookup'
import type { ExperimentMeta, PlayerConfig } from '../src/contracts/workbench'

test('catalog restricts executable profiles by stage and format; generated routes must replay and be unique', () => {
  const options = catalogOptions()
  expect(new Set(options.map((p) => p.format)).size).toBe(5)
  expect(new Set(options.map((p) => p.seats)).size).toBe(3)
  expect(
    options.filter((p) => p.executable).every((p) => p.format === '2-0' && p.seats === '4-6p')
  ).toBe(true)
  expect(() =>
    validPlayer({
      id: 'custom',
      label: '测试',
      description: '测试',
      preflop: 'invented',
      postflop: 'gto',
    })
  ).toThrow('不适用')
  expect(() => validFixtures([{ ...representativeFixtures[0], line: '4:f' }])).toThrow('行动顺序')
  expect(() =>
    validFixtures([representativeFixtures[0], { ...representativeFixtures[0], id: 'Other' }])
  ).toThrow('重复场景路线')
  expect(() => validFixtures([representativeFixtures[0]], 2)).toThrow('数量')
  expect(() =>
    renderPrompt(
      'analysis',
      { ...defaultPrompts().analysis, template: '{{input}}' },
      { input: {}, results: {} }
    )
  ).toThrow('必须包含变量')
})

test('Gemini REST uses header authentication, JSON mode, excludes thoughts and rejects truncated output', async () => {
  let truncated = false
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      expect(new URL(req.url).pathname).toBe('/v1beta/models/test-gemini:generateContent')
      expect(req.headers.get('x-goog-api-key')).toBe('local-test-key')
      expect(new URL(req.url).search).toBe('')
      const body = record(await req.json())
      expect(record(body.generationConfig).responseMimeType).toBe('application/json')
      expect(record(body.systemInstruction).parts).toEqual([{ text: 'system JSON' }])
      return Response.json({
        candidates: [
          {
            finishReason: truncated ? 'MAX_TOKENS' : 'STOP',
            content: {
              parts: [{ thought: true, text: 'private thought' }, { text: '{"ok":true}' }],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 20 },
      })
    },
  })
  try {
    const settings = {
      ...defaultModel,
      provider: 'gemini' as const,
      model: 'test-gemini',
      baseUrl: `http://127.0.0.1:${server.port}/v1beta`,
    }
    const result = await requestModel(settings, 'local-test-key', {
      system: 'system JSON',
      user: 'user',
    })
    expect(parseModelJson(result.content)).toEqual({ ok: true })
    expect(result.content).not.toContain('thought')
    truncated = true
    const short = await requestModel(settings, 'local-test-key', {
      system: 'system JSON',
      user: 'user',
    })
    expect(() => parseModelJson(short.content)).toThrow('未返回完整内容')
    expect(short.raw).toBeDefined()
  } finally {
    await server.stop(true)
  }
})

test('Web workflow saves prompt/model snapshots, runs custom players against only a local solver, resumes and analyzes cached results', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'player-workbench-'))
  const oldEnv = {
    AI_SERVICE_URL: process.env.AI_SERVICE_URL,
    AI_USE_PROXY: process.env.AI_USE_PROXY,
    AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
  }
  let solverRequests = 0
  let modelRequests = 0
  let failSolver = true
  let badModel = false
  let lastPrompt = ''
  const upstream = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/lookup') {
        solverRequests++
        const body = (await req.json()) as AIRequestBody
        if (failSolver && solverRequests === 1) {
          return Response.json({ error: 'local failure' }, { status: 503 })
        }
        const hero: number = body.hand.players.find((p) => p.hole_cards)!.seat_no
        const profile: unknown = record(body.strategy_profile).target_profile_name
        const raise = profile === 'gto' ? 0.6 : 0.1
        return Response.json({
          solution_information: {
            source: 'local-test-only',
            strategy_profile_config: {
              matched_profile_name: profile === 'gto' ? 'no_profile_applied' : profile,
            },
          },
          strategy: {
            actions: [
              {
                action: { action: 'call', amount: 1100, seat_no: hero },
                hand_strategy: 1 - raise,
                hand_ev: 0.5,
              },
              {
                action: { action: 'raise', amount: 2250, seat_no: hero },
                hand_strategy: raise,
                hand_ev: 0.4,
              },
            ],
            suggested_action: { action: 'call', amount: 1100, seat_no: hero },
          },
        })
      }
      expect(url.pathname).toBe('/chat/completions')
      expect(req.headers.get('authorization')).toBe('Bearer local-only-secret')
      modelRequests++
      const body = record(await req.json())
      expect(record(body.response_format).type).toBe('json_object')
      const messages = body.messages as { role: string; content: string }[]
      lastPrompt = messages.map((m) => m.content).join('\n')
      const result = badModel
        ? {
            player: {
              id: 'bad',
              label: 'bad',
              description: 'bad',
              preflop: 'fake',
              postflop: 'fake',
            },
          }
        : lastPrompt.includes('固定输出与校验约定：\n返回 JSON 对象 {"player"')
          ? {
              player: {
                id: 'custom-loose',
                label: '自定义松弱',
                description: '仅选择已有档位',
                preflop: 'vpip68-pfr7',
                postflop: 'af0.5-wtsd79',
              },
            }
          : lastPrompt.includes('固定输出与校验约定：\n返回 JSON 对象 {"scenarios"')
            ? { scenarios: [representativeFixtures[0]] }
            : {
                summary: 'S01：本机数据，样本有限。',
                scenes: [{ id: 'S01', conclusion: '自定义松弱主动率10%，均衡60%。' }],
                limitations: ['本机测试样本'],
              }
      return Response.json({
        choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(result) } }],
        usage: { total_tokens: 100 },
      })
    },
  })
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${upstream.port}`
  process.env.AI_USE_PROXY = 'false'
  process.env.AI_REQUEST_TIMEOUT_MS = '3000'
  const workbench = new Workbench(new WorkbenchStore(root))
  const web = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: createWebHandler(workbench) })
  const base = `http://127.0.0.1:${web.port}`
  const post = async (path: string, body: unknown) => {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify(body),
    })
    return { status: response.status, value: (await response.json()) as Record<string, unknown> }
  }
  try {
    const settings = await workbench.settings()
    const saved = await post('/api/settings', {
      model: { ...settings.model, baseUrl: `http://127.0.0.1:${upstream.port}` },
      apiKey: 'local-only-secret',
    })
    expect(saved.status).toBe(200)
    expect(JSON.stringify(saved.value)).not.toContain('local-only-secret')
    const denied = await fetch(`${base}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.invalid' },
      body: '{}',
    })
    expect(denied.status).toBe(403)
    expect((await fetch(`${base}/api/settings`, { method: 'POST', body: '{}' })).status).toBe(415)
    const prompt = await workbench.savePrompt('player', {
      ...settings.prompts.player,
      system: '自定义系统提示词 JSON',
    })
    const input = { task: 'player', description: '松弱玩家' }
    const preview = await post('/api/model/preview', input)
    expect(modelRequests).toBe(0)
    expect(String(preview.value.system)).toContain('自定义系统提示词')
    const recommend = await post('/api/model/run', input)
    expect(recommend.status).toBe(200)
    const player = recommend.value.result as PlayerConfig
    expect(player.preflop).toBe('vpip68-pfr7')
    const call = await workbench.store.read<Record<string, unknown>>([
      'calls',
      String(recommend.value.callId),
      'request.json',
    ])
    expect(record(call.prompt).id).toBe(prompt.id)
    expect(JSON.stringify(call)).not.toContain('local-only-secret')
    const generated = await post('/api/model/run', {
      task: 'scenarios',
      count: 1,
      requirements: '翻前轻4bet',
      players: [player],
    })
    expect(generated.status).toBe(200)
    expect((generated.value.result as unknown[]).length).toBe(1)
    badModel = true
    expect((await post('/api/model/run', input)).status).toBe(400)
    badModel = false
    const players = [
      player,
      {
        id: 'my-equilibrium',
        label: '自定义均衡',
        description: '自定义ID的GTO',
        preflop: 'gto',
        postflop: 'gto',
      },
    ]
    const invalid = await post('/api/experiments', {
      name: 'bad',
      requirements: 'bad',
      players,
      fixtures: [{ ...representativeFixtures[0], line: '4:f' }],
      repeats: 1,
    })
    expect(invalid.status).toBe(400)
    expect(solverRequests).toBe(0)
    const created = await post('/api/experiments', {
      name: '<script>测试</script>',
      requirements: '横向对比',
      players,
      fixtures: generated.value.result,
      repeats: 1,
    })
    expect(created.status).toBe(201)
    const meta = created.value as unknown as ExperimentMeta
    expect(meta.baselineId).toBe('my-equilibrium')
    const settle = async () => {
      for (let i = 0; i < 200 && workbench.active.has(meta.id); i++) {
        await Bun.sleep(10)
      }
      expect(workbench.active.has(meta.id)).toBe(false)
      return workbench.detail(meta.id)
    }
    await post(`/api/experiments/${meta.id}/execute`, {})
    let detail = await settle()
    expect(detail.meta.status).toBe('failed')
    expect(detail.data.successful).toBe(1)
    expect(detail.data.scenes[0].styles[0].rates).toBeNull()
    expect(solverRequests).toBe(2)
    expect((await post('/api/model/run', { task: 'analysis', experimentId: meta.id })).status).toBe(
      200
    )
    expect((await workbench.detail(meta.id)).analysis).not.toBeNull()
    await workbench.execute(meta.id)
    await settle()
    expect(solverRequests).toBe(2)
    failSolver = false
    await post(`/api/experiments/${meta.id}/execute`, { retryFailed: true })
    detail = await settle()
    expect(detail.meta.status).toBe('completed')
    expect(solverRequests).toBe(3)
    expect(detail.data.comparisons).toHaveLength(1)
    expect(detail.data.scenes[0].styles).toHaveLength(2)
    expect(detail.data.scenes[0].styles[0].rates).toEqual([0, 90, 0, 10])
    expect(detail.analysisStale).toBe(true)
    expect(detail.analysis).toBeNull()
    expect(detail.data.counts.counter).toBe(0)
    expect(detail.data.counts.ready).toBe(1)
    const analyzed = await post('/api/model/run', { task: 'analysis', experimentId: meta.id })
    expect(analyzed.status).toBe(200)
    expect(lastPrompt).toContain('maxProbabilityDeltaPp')
    expect(lastPrompt).toContain('local-test-only')
    expect((await workbench.detail(meta.id)).meta.analysisIds).toHaveLength(2)
    badModel = true
    expect((await post('/api/model/run', { task: 'analysis', experimentId: meta.id })).status).toBe(
      400
    )
    expect((await workbench.detail(meta.id)).meta.analysisIds).toHaveLength(2)
    badModel = false
    const htmlResponse = await fetch(`${base}/api/experiments/${meta.id}/report.html`)
    const html = await htmlResponse.text()
    const embeddedScript = /<script>([\s\S]*?)<\/script>/.exec(html)![1]
    expect(htmlResponse.headers.get('Content-Security-Policy')).toContain(
      `sha256-${createHash('sha256').update(embeddedScript).digest('base64')}`
    )
    expect(html).toContain('&lt;script&gt;测试&lt;/script&gt;')
    expect(html).not.toContain('<script>测试</script>')
    expect(html).toContain('本机数据')
    const relativeRaw = /class="wb-download" href="([A-Za-z0-9-]+\.json)"/.exec(html)![1]
    const linkedRaw = await fetch(`${base}/api/experiments/${meta.id}/${relativeRaw}`)
    expect(linkedRaw.status).toBe(200)
    expect(await linkedRaw.json()).toEqual(
      await (await fetch(`${base}/api/experiments/${meta.id}/raw/${relativeRaw}`)).json()
    )
    expect((await fetch(`${base}/api/experiments/${meta.id}/secrets.json`)).status).toBe(404)
    await post(`/api/experiments/${meta.id}/render`, {})
    expect(solverRequests).toBe(3)
    const replay = new Workbench(new WorkbenchStore(root))
    expect((await replay.detail(meta.id)).analysis).not.toBeNull()
    expect((await replay.settings()).prompts.player.id).toBe(prompt.id)
    await replay.execute(meta.id)
    for (let i = 0; i < 200 && replay.active.has(meta.id); i++) {
      await Bun.sleep(10)
    }
    expect(solverRequests).toBe(3)
    const calls = await (await fetch(`${base}/api/calls`)).text()
    expect(calls).not.toContain('local-only-secret')
    expect((await fetch(`${base}/api/experiments/${meta.id}/raw/secrets.json`)).status).toBe(404)
  } finally {
    await web.stop(true)
    await upstream.stop(true)
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    const insideTemp = relative(tmpdir(), root)
    if (insideTemp && !insideTemp.startsWith('..') && !isAbsolute(insideTemp)) {
      await rm(root, { recursive: true, force: true })
    }
  }
}, 20000)
