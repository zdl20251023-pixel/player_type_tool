import { randomUUID, createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { record } from '../analysis/strategy'
import { defaultPrompts, renderPrompt, validPrompt } from '../analysis/prompts'
import {
  defaultModel,
  validModel,
  requestModel,
  parseModelJson,
  listModels,
} from '../client/language-model'
import { modelPresets, validImages } from '../client/model-options'
import {
  ModelRequestError,
  diagnoseModel,
  type ModelProgressCallback,
} from '../client/model-stream'
import { ScenarioBatchRunner } from './scenario-batches'
import { catalogOptions, validPlayer, text } from '../profiles/catalog'
import { styles } from '../profiles/styles'
import { fromFixture } from '../scenarios'
import { representativeFixtures } from '../scenarios/representative'
import { validFixtures } from '../scenarios/generated'
import { validateScenario } from '../scenarios/validate'
import { WorkbenchStore } from '../storage/workbench'
import { buildRequest } from '../scenarios'
import { readSession, readCachedRun, type SessionType } from '../storage/session'
import { executeSession } from './solve'
import { horizontalResults, workbenchHtml } from '../reports/workbench'
import type {
  WorkbenchSettings,
  PromptTask,
  ExperimentMeta,
  Provider,
  ModelOption,
  ModelJob,
} from '../contracts/workbench'

export class Workbench {
  readonly active = new Set<string>()
  readonly analyzing = new Set<string>()
  readonly discoveredModels = new Map<string, ModelOption[]>()
  readonly modelJobs = new Set<string>()
  readonly scenarioBatches: ScenarioBatchRunner
  constructor(readonly store = new WorkbenchStore()) {
    this.scenarioBatches = new ScenarioBatchRunner(store, this)
  }

  async settings(): Promise<WorkbenchSettings> {
    const provider = process.env.LLM_PROVIDER === 'gemini' ? 'gemini' : 'deepseek'
    return this.store.read(['settings.json'], {
      model: {
        ...defaultModel,
        provider,
        model:
          process.env.LLM_MODEL ||
          (provider === 'gemini' ? 'gemini-4-hydrogen' : defaultModel.model),
        baseUrl:
          process.env.LLM_BASE_URL ||
          (provider === 'gemini'
            ? 'https://generativelanguage.googleapis.com/v1beta'
            : defaultModel.baseUrl),
      },
      players: styles.map((s) => ({
        ...s,
        description: `${s.label}预设；可分别选择翻前和翻后档位。`,
      })),
      prompts: defaultPrompts(),
    })
  }
  async key(provider: Provider) {
    const secrets = await this.store.read<Partial<Record<Provider, string>>>(['secrets.json'], {})
    return (
      secrets[provider] ||
      process.env[provider === 'gemini' ? 'GEMINI_API_KEY' : 'DEEPSEEK_API_KEY'] ||
      ''
    )
  }
  async publicSettings() {
    const settings = await this.settings()
    return {
      ...settings,
      keys: {
        deepseek: Boolean(await this.key('deepseek')),
        gemini: Boolean(await this.key('gemini')),
      },
      solverConfigured: Boolean(process.env.AI_SERVICE_URL),
      modelPresets,
    }
  }
  async modelConnection(value: unknown) {
    const obj = record(value)
    const settings = await this.settings()
    const model = validModel(obj.model ?? settings.model)
    const key = obj.apiKey ? text(obj.apiKey, 'API Key', 1000) : await this.key(model.provider)
    if (!key) {
      throw new Error('请填写对应服务商 API Key，或使用服务端已保存密钥')
    }
    return { model, key }
  }
  async refreshModels(value: unknown) {
    const { model, key } = await this.modelConnection(value)
    const models = await listModels(model, key)
    this.discoveredModels.set(`${model.provider}:${model.baseUrl}`, models)
    return {
      provider: model.provider,
      baseUrl: model.baseUrl,
      models,
      fetchedAt: new Date().toISOString(),
    }
  }
  images(value: unknown, model: WorkbenchSettings['model']) {
    const capability = this.discoveredModels
      .get(`${model.provider}:${model.baseUrl}`)
      ?.find((m) => m.id === model.model)?.vision
    return validImages(value, model, capability)
  }
  async testModel(value: unknown) {
    const { model, key } = await this.modelConnection(value)
    const obj = record(value)
    const prompt = {
      system:
        '执行用户的简短测试。输出 JSON 对象 {"reply":"中文回答"}。若有图片，根据图片中可见内容回答，不编造看不清的信息。',
      user: text(obj.message ?? '请简短回复：连接正常。', '测试内容', 4000),
      images: this.images(obj.images, model),
    }
    const effective = {
      ...model,
      maxTokens: Math.min(model.maxTokens, 2048),
      timeoutMs: Math.min(model.timeoutMs, 60000),
    }
    const id = randomUUID()
    await this.store.write(['calls', id, 'request.json'], {
      id,
      task: 'test',
      createdAt: new Date().toISOString(),
      model: effective,
      ...prompt,
    })
    const started = performance.now()
    try {
      const response = await requestModel(effective, key, prompt, { quick: true })
      await this.store.write(['calls', id, 'response.json'], response)
      const diagnostic = diagnoseModel(response)
      if (diagnostic.problem) {
        throw new ModelRequestError(diagnostic.problem, diagnostic.kind, response)
      }
      const parsed = record(parseModelJson(response.content))
      const result = {
        reply: text(parsed.reply, '模型测试回复', 20000),
        elapsedMs: Math.round(performance.now() - started),
        requestedModel: model.model,
        returnedModel: record(response.raw).model ?? record(response.raw).modelVersion ?? null,
        usage: response.usage,
        imageCount: prompt.images.length,
      }
      await this.store.write(['calls', id, 'result.json'], { ok: true, result })
      return { callId: id, result }
    } catch (error) {
      const problem = error instanceof Error ? error.message : '快速测试失败'
      await this.store.write(['calls', id, 'result.json'], {
        ok: false,
        problem,
        elapsedMs: Math.round(performance.now() - started),
      })
      throw new Error(`${problem}；调用记录 ${id}`)
    }
  }
  async saveSettings(value: unknown) {
    const obj = record(value)
    const old = await this.settings()
    const model = validModel(obj.model ?? old.model)
    const players = obj.players === undefined ? old.players : this.players(obj.players)
    if (obj.apiKey !== undefined) {
      const key = text(obj.apiKey, 'API Key', 1000)
      const secrets = await this.store.read<Partial<Record<Provider, string>>>(['secrets.json'], {})
      secrets[model.provider] = key
      await this.store.write(['secrets.json'], secrets)
    }
    await this.store.write(['settings.json'], { ...old, model, players })
    return this.publicSettings()
  }
  players(value: unknown) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
      throw new Error('请选择 1..8 个玩家配置')
    }
    const players = (value as unknown[]).map(validPlayer)
    if (new Set(players.map((p) => p.id)).size !== players.length) {
      throw new Error('玩家 ID 不得重复')
    }
    return players
  }
  async savePrompt(task: PromptTask, value: unknown) {
    const settings = await this.settings()
    const obj = record(value)
    const prompt = validPrompt(task, obj.reset === true ? defaultPrompts()[task] : value)
    // 保存前验证变量；版本始终追加保留，恢复也是新版本。
    renderPrompt(task, prompt, { input: {}, results: {}, examples: [] })
    await this.store.write(['prompts', prompt.id, 'version.json'], prompt)
    settings.prompts[task] = prompt
    await this.store.write(['settings.json'], settings)
    return prompt
  }
  async preview(value: unknown, overrides: { model?: WorkbenchSettings['model'] } = {}) {
    const obj = record(value)
    const task = obj.task as PromptTask
    if (!['player', 'scenarios', 'analysis'].includes(task)) {
      throw new Error('未知提示词任务')
    }
    const settings = await this.settings()
    if (overrides.model) {
      settings.model = overrides.model
    }
    const prompt = obj.prompt ? validPrompt(task, obj.prompt) : settings.prompts[task]
    let input: unknown
    let results: unknown = null
    let resultFingerprint: string | null = null
    if (task === 'analysis') {
      const id = text(obj.experimentId, '实验 ID', 60)
      if (this.active.has(id)) {
        throw new Error('请等待 solver 执行完成后分析')
      }
      const detail = await this.detail(id)
      if (!detail.data.successful) {
        throw new Error('尚无成功的 solver 结果，不能分析')
      }
      input = {
        name: detail.meta.name,
        requirements: detail.meta.requirements,
        players: detail.meta.players,
      }
      results = detail.data
      resultFingerprint = createHash('sha256').update(JSON.stringify(results)).digest('hex')
    } else if (task === 'player') {
      input = text(obj.description, '玩家描述')
    } else {
      const count = Number(obj.count)
      if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new Error('场景数量必须为 1..100')
      }
      input = {
        count,
        requirements: text(obj.requirements, '场景要求'),
        players: this.players(obj.players),
        table: '6人 / 100BB / 无前注无抓注',
      }
    }
    const rendered = renderPrompt(task, prompt, {
      input,
      results,
      examples: representativeFixtures,
    })
    if (rendered.user.length > 600000) {
      throw new Error('输入过长，请减少实验场景数量或拆分实验；未发送请求')
    }
    return {
      task,
      model: settings.model,
      prompt,
      input,
      thinking:
        task === 'scenarios'
          ? obj.thinking === 'enabled'
            ? ('enabled' as const)
            : ('disabled' as const)
          : undefined,
      ...rendered,
      experimentId: task === 'analysis' ? String(obj.experimentId) : null,
      resultFingerprint,
      images: this.images(obj.images, settings.model),
    }
  }
  async runModel(
    value: unknown,
    hooks: { onStarted?: (id: string) => Promise<void>; onProgress?: ModelProgressCallback } = {}
  ): Promise<{ callId: string; result: unknown }> {
    const preview = await this.preview(value)
    const key = await this.key(preview.model.provider)
    if (!key) {
      throw new Error('请先在模型设置中配置对应 API Key')
    }
    const id = randomUUID()
    const snapshot = { id, createdAt: new Date().toISOString(), ...preview }
    const experimentId = preview.experimentId
    if (experimentId && (this.active.has(experimentId) || this.analyzing.has(experimentId))) {
      throw new Error('该实验正在求解或分析，请等待完成')
    }
    if (experimentId) {
      this.analyzing.add(experimentId)
    }
    const started = performance.now()
    try {
      await this.store.write(['calls', id, 'request.json'], snapshot)
      await hooks.onStarted?.(id)
      const response = await requestModel(preview.model, key, preview, {
        onProgress: hooks.onProgress,
        thinking: preview.thinking,
      })
      await this.store.write(['calls', id, 'response.json'], response)
      const diagnostic = diagnoseModel(response)
      if (diagnostic.problem) {
        throw new ModelRequestError(diagnostic.problem, diagnostic.kind, response)
      }
      await hooks.onProgress?.({
        phase: 'validating',
        contentChars: response.content.length,
        reasoningChars: 0,
        lastResponseAt: new Date().toISOString(),
      })
      const parsed = record(parseModelJson(response.content))
      let result: unknown
      if (preview.task === 'player') {
        result = validPlayer(parsed.player)
      } else if (preview.task === 'scenarios') {
        result = validFixtures(parsed.scenarios, Number(record(value).count))
      } else {
        const expected = (await this.detail(preview.experimentId!)).meta.fixtures.map((s) => s.id)
        if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== expected.length) {
          throw new Error('分析结果必须覆盖全部场景')
        }
        const scenes = (parsed.scenes as unknown[]).map((s) => ({
          id: text(record(s).id, '分析场景 ID', 40),
          conclusion: text(record(s).conclusion, '场景结论', 20000),
        }))
        if (
          new Set(scenes.map((s) => s.id)).size !== expected.length ||
          scenes.some((s) => !expected.includes(s.id))
        ) {
          throw new Error('分析包含未知或重复场景 ID')
        }
        if (!Array.isArray(parsed.limitations)) {
          throw new Error('分析缺少 limitations 列表')
        }
        result = {
          summary: text(parsed.summary, '总体结论', 30000),
          scenes,
          limitations: (parsed.limitations as unknown[]).map((s) => text(s, '分析限制', 4000)),
        }
      }
      await this.store.write(['calls', id, 'result.json'], {
        ok: true,
        result,
        elapsedMs: Math.round(performance.now() - started),
      })
      if (preview.task === 'analysis') {
        const meta = await this.meta(preview.experimentId!)
        meta.analysisIds.push(id)
        await this.store.write(['runs', meta.id, 'experiment.json'], meta)
        await this.render(meta.id)
      }
      return { callId: id, result }
    } catch (error) {
      const problem = error instanceof Error ? error.message : '大模型步骤失败'
      if (error instanceof ModelRequestError && error.partial) {
        await this.store.write(['calls', id, 'response.json'], {
          ...error.partial,
          incomplete: true,
        })
      }
      await this.store.write(['calls', id, 'result.json'], {
        ok: false,
        problem,
        elapsedMs: Math.round(performance.now() - started),
        failureKind: error instanceof ModelRequestError ? error.kind : 'validation-or-service',
        timeoutMs: preview.model.timeoutMs,
      })
      throw new Error(`${problem}；调用记录 ${id}`)
    } finally {
      if (experimentId) {
        this.analyzing.delete(experimentId)
      }
    }
  }
  async startModel(value: unknown): Promise<{ callId: string }> {
    let job: ModelJob | undefined
    let delivered = false
    return new Promise((resolve, reject) => {
      void this.runModel(value, {
        onStarted: async (id) => {
          const request = await this.store.read<{
            task: ModelJob['task']
            createdAt: string
            model: { timeoutMs: number }
          }>(['calls', id, 'request.json'])
          job = {
            callId: id,
            task: request.task,
            status: 'running',
            createdAt: request.createdAt,
            updatedAt: new Date().toISOString(),
            elapsedMs: 0,
            timeoutMs: request.model.timeoutMs,
            progress: {
              phase: 'connecting',
              contentChars: 0,
              reasoningChars: 0,
              lastResponseAt: null,
            },
            problem: null,
          }
          this.modelJobs.add(id)
          await this.store.write(['calls', id, 'job.json'], job)
          delivered = true
          resolve({ callId: id })
        },
        onProgress: async (progress, partial) => {
          if (!job) {
            return
          }
          job.progress = progress
          job.updatedAt = new Date().toISOString()
          job.elapsedMs = Date.now() - Date.parse(job.createdAt)
          if (partial) {
            await this.store.write(['calls', job.callId, 'response.json'], {
              ...partial,
              incomplete: true,
            })
          }
          await this.store.write(['calls', job.callId, 'job.json'], job)
        },
      })
        .then(async () => {
          if (job) {
            job.status = 'completed'
            job.updatedAt = new Date().toISOString()
            job.elapsedMs = Date.now() - Date.parse(job.createdAt)
            await this.store.write(['calls', job.callId, 'job.json'], job)
          }
        })
        .catch(async (error: unknown) => {
          if (!delivered) {
            reject(error instanceof Error ? error : new Error('大模型任务启动失败'))
          }
          if (job) {
            job.status = 'failed'
            job.problem = error instanceof Error ? error.message : '大模型任务失败'
            job.updatedAt = new Date().toISOString()
            job.elapsedMs = Date.now() - Date.parse(job.createdAt)
            await this.store.write(['calls', job.callId, 'job.json'], job)
          }
        })
        .finally(() => {
          if (job) {
            this.modelJobs.delete(job.callId)
          }
        })
        .catch(() => {
          if (!delivered) {
            reject(new Error('模型任务记录写入失败'))
          }
        })
    })
  }
  async modelJob(id: string) {
    const job = await this.store.read<ModelJob>(['calls', id, 'job.json'])
    if (job.status === 'running') {
      job.elapsedMs = Date.now() - Date.parse(job.createdAt)
      if (!this.modelJobs.has(id)) {
        job.status = 'interrupted'
        job.problem = '服务已重启，任务中断；已保留请求和接收片段，不会自动重发'
      }
    }
    const result =
      job.status === 'completed'
        ? await this.store.read<{ result: unknown }>(['calls', id, 'result.json'])
        : null
    return { ...job, result: result?.result ?? null }
  }
  async create(value: unknown) {
    const obj = record(value)
    const players = this.players(obj.players)
    const fixtures = validFixtures(obj.fixtures)
    const repeats = Number(obj.repeats)
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) {
      throw new Error('重复次数必须为 1..10')
    }
    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const scenes = fixtures.map(fromFixture)
    const session: SessionType = {
      version: 1,
      runId: id,
      createdAt,
      repeats,
      scenarios: scenes,
      plan: scenes.flatMap((s) =>
        Array.from({ length: repeats }, (_, i) =>
          players.map((player, j) => {
            const profile = s.street === 'preflop' ? player.preflop : player.postflop
            return {
              id: `${s.id}-${i + 1}-${j}`,
              scenario: s.id,
              description: s.description,
              style: player.id,
              profile,
              repeat: i + 1,
              request: buildRequest(s, profile, `${id}-${s.id}-${i + 1}-${j}`),
            }
          })
        ).flat()
      ),
    }
    const meta: ExperimentMeta = {
      id,
      createdAt,
      name: text(obj.name, '实验名称', 120),
      requirements: text(obj.requirements, '实验要求'),
      players,
      fixtures,
      repeats,
      baselineId:
        players.find((p) => p.preflop === 'gto' && p.postflop === 'gto')?.id ?? players[0].id,
      status: 'draft',
      problem: null,
      completed: 0,
      total: session.plan.length,
      successful: 0,
      analysisIds: [],
    }
    await this.store.write(['runs', id, 'session.json'], session)
    await this.store.write(
      ['runs', id, 'validation.json'],
      scenes.map((s) => ({ id: s.id, ...validateScenario(s) }))
    )
    await this.store.write(['runs', id, 'experiment.json'], meta)
    await this.render(id)
    return meta
  }
  async meta(id: string) {
    return this.store.read<ExperimentMeta>(['runs', id, 'experiment.json'])
  }
  async detail(id: string, includeRaw = false) {
    const meta = await this.meta(id)
    if (meta.status === 'running' && !this.active.has(id)) {
      meta.status = 'interrupted'
    }
    const session = await readSession(this.store.path('runs', id))
    const runs = (
      await Promise.all(session.plan.map((p) => readCachedRun(this.store.path('runs', id), p)))
    ).filter((r) => r !== null)
    let analysis: unknown = null
    let analysisStale = false
    const data = horizontalResults(meta, session, runs)
    if (meta.analysisIds.length) {
      const callId = meta.analysisIds.at(-1)!
      const snapshot = await this.store.read<{ resultFingerprint?: string }>([
        'calls',
        callId,
        'request.json',
      ])
      analysisStale =
        snapshot.resultFingerprint !==
        createHash('sha256').update(JSON.stringify(data)).digest('hex')
      if (!analysisStale) {
        analysis = (await this.store.read<{ result: unknown }>(['calls', callId, 'result.json']))
          .result
      }
    }
    return { meta, data, analysis, analysisStale, ...(includeRaw ? { rawRuns: runs } : {}) }
  }
  async render(id: string) {
    const detail = await this.detail(id, true)
    await this.store.write(['runs', id, 'horizontal.json'], detail.data)
    await writeFile(
      this.store.path('runs', id, 'report.html'),
      workbenchHtml(detail.meta, detail.data, detail.analysis, detail.rawRuns ?? [])
    )
    return {
      meta: detail.meta,
      data: detail.data,
      analysis: detail.analysis,
      analysisStale: detail.analysisStale,
    }
  }
  async execute(id: string, retryFailed = false) {
    if (this.active.has(id)) {
      throw new Error('实验正在执行')
    }
    const meta = await this.meta(id)
    const session = await readSession(this.store.path('runs', id))
    const needsRequest = (
      await Promise.all(session.plan.map((p) => readCachedRun(this.store.path('runs', id), p)))
    ).some((r) => !r || (retryFailed && !r.ok))
    if (needsRequest && !process.env.AI_SERVICE_URL) {
      throw new Error('请在本项目 .env 中配置 AI_SERVICE_URL 后重启服务')
    }
    if (this.active.has(id) || this.analyzing.has(id)) {
      throw new Error('该实验正在求解或分析')
    }
    this.active.add(id)
    meta.status = 'running'
    meta.problem = null
    try {
      await this.store.write(['runs', id, 'experiment.json'], meta)
    } catch (error) {
      this.active.delete(id)
      throw error
    }
    // 启动后立即返回，由状态接口读取落盘进度。
    void (async () => {
      try {
        const { runs } = await executeSession(this.store.path('runs', id), session, {
          retryFailed,
          onProgress: async () => {
            const progress = await this.store.read<{ completed: number; successful: number }>([
              'runs',
              id,
              'progress.json',
            ])
            meta.completed = progress.completed
            meta.successful = progress.successful
            await this.store.write(['runs', id, 'experiment.json'], meta)
          },
        })
        meta.completed = runs.length
        meta.successful = runs.filter((r) => r.ok).length
        meta.status = meta.successful === meta.total ? 'completed' : 'failed'
      } catch (error) {
        meta.status = 'failed'
        meta.problem = error instanceof Error ? error.message : '实验失败'
      } finally {
        try {
          await this.store.write(['runs', id, 'experiment.json'], meta)
          await this.render(id)
        } catch {
          meta.status = 'failed'
          meta.problem = '结果已缓存，报告生成失败；请离线重建'
          await this.store.write(['runs', id, 'experiment.json'], meta)
        } finally {
          this.active.delete(id)
        }
      }
    })()
    return meta
  }
  async list() {
    const ids = await this.store.list('runs')
    const records = await Promise.all(
      ids.map(async (id) => {
        const meta = await this.meta(id)
        return {
          ...meta,
          status: meta.status === 'running' && !this.active.has(id) ? 'interrupted' : meta.status,
        }
      })
    )
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  catalog() {
    return catalogOptions()
  }
}
