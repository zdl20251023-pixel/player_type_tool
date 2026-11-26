import { randomUUID } from 'node:crypto'
import { record } from '../analysis/strategy'
import { requestModel } from '../client/language-model'
import { diagnoseModel, ModelRequestError, type ModelResult } from '../client/model-stream'
import { validFixtures } from '../scenarios/generated'
import {
  describedStreetQuota,
  generationConflict,
  generationPlan,
} from '../scenarios/generation-plan'
import type { ScenarioFixture } from '../scenarios'
import type { ScenarioGeneration, ScenarioBatch } from '../contracts/workbench'
import type { WorkbenchStore } from '../storage/workbench'
import type { Workbench } from './workbench'

// Only complete JSON objects are recoverable. Never repair or invent a truncated route.
export function recoverScenarioObjects(content: string): unknown[] {
  const clean = content.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '')
  try {
    const parsed = record(JSON.parse(clean) as unknown)
    return Array.isArray(parsed.scenarios) ? (parsed.scenarios as unknown[]) : []
  } catch {
    /* Scan the scenarios array, keeping string escapes and nested objects intact. */
  }
  const match = /"scenarios"\s*:\s*\[/.exec(clean)
  if (!match) {
    return []
  }
  const results: unknown[] = []
  let start = -1,
    depth = 0,
    quoted = false,
    escaped = false
  for (let i = match.index + match[0].length; i < clean.length; i++) {
    const c = clean[i]
    if (quoted) {
      if (escaped) {
        escaped = false
      } else if (c === '\\') {
        escaped = true
      } else if (c === '"') {
        quoted = false
      }
      continue
    }
    if (c === '"') {
      quoted = true
      continue
    }
    if (!depth && c === ']') {
      break
    }
    if (c === '{') {
      if (!depth) {
        start = i
      }
      depth++
    }
    if (c === '}' && depth) {
      depth--
      if (!depth) {
        try {
          results.push(JSON.parse(clean.slice(start, i + 1)) as unknown)
        } catch {
          /* Invalid objects are not recovered. */
        }
      }
    }
  }
  return results.slice(0, 100)
}

const routeKey = (f: ScenarioFixture) => JSON.stringify([f.hero, f.cards, f.line])
const fixturesOf = (job: ScenarioGeneration) => job.batches.flatMap((b) => b.fixtures)
type Host = Pick<Workbench, 'preview' | 'key'>

export class ScenarioBatchRunner {
  private readonly active = new Map<string, { paused: boolean; job: ScenarioGeneration }>()
  private readonly starting = new Set<string>()
  private readonly mutations = new Map<string, Promise<unknown>>()
  constructor(
    private readonly store: WorkbenchStore,
    private readonly host: Host
  ) {}

  private commit(job: ScenarioGeneration) {
    job.updatedAt = new Date().toISOString()
    const snapshot = structuredClone(job)
    const next = (this.mutations.get(job.id) ?? Promise.resolve()).then(() =>
      this.store.write(['generations', job.id, 'generation.json'], snapshot)
    )
    this.mutations.set(
      job.id,
      next.catch(() => undefined)
    )
    return next
  }
  async plan(value: unknown) {
    const obj = record(value)
    const preview = await this.host.preview({ ...obj, task: 'scenarios' })
    const input = record(preview.input)
    const count = Number(input.count)
    if (obj.batchMode !== undefined && obj.batchMode !== 'auto' && obj.batchMode !== 'manual') {
      throw new Error('分批模式无效')
    }
    const { batchSize, concurrency } = generationPlan(count, {
      batchMode: obj.batchMode,
      batchSize: obj.batchSize === undefined ? undefined : Number(obj.batchSize),
      concurrency: obj.concurrency === undefined ? undefined : Number(obj.concurrency),
    })
    const stagePlan = (obj.stagePlan ?? 'auto') as ScenarioGeneration['stagePlan']
    if (!['auto', 'balanced', 'preflop', 'postflop'].includes(stagePlan)) {
      throw new Error('街道分配无效')
    }
    const requirements = String(input.requirements)
    const conflict = generationConflict(count, requirements)
    if (conflict) {
      throw new Error(conflict)
    }
    const quota = describedStreetQuota(requirements)
    const preflopCount =
      stagePlan === 'balanced'
        ? Math.floor(count / 2)
        : stagePlan === 'auto' && quota
          ? quota.preflop
          : null
    const targets: ScenarioBatch['targets'] = Array.from({ length: count }, (_, i) => ({
      id: `G${String(i + 1).padStart(3, '0')}`,
      stage:
        stagePlan === 'preflop'
          ? 'preflop'
          : stagePlan === 'postflop'
            ? 'postflop'
            : preflopCount !== null
              ? i < preflopCount
                ? 'preflop'
                : 'postflop'
              : null,
    }))
    const job: ScenarioGeneration = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'paused',
      count,
      batchSize,
      concurrency,
      requirements,
      players: input.players as ScenarioGeneration['players'],
      model: preview.model,
      prompt: preview.prompt,
      images: preview.images,
      thinking: preview.thinking ?? 'enabled',
      stagePlan,
      batches: Array.from({ length: Math.ceil(count / batchSize) }, (_, index) => ({
        index,
        targets: targets.slice(index * batchSize, (index + 1) * batchSize),
        status: 'pending',
        fixtures: [],
        attempts: [],
        problem: null,
        progress: null,
      })),
    }
    return job
  }
  async create(value: unknown) {
    const job = await this.plan(value)
    if (!(await this.host.key(job.model.provider))) {
      throw new Error('请先配置模型 API Key')
    }
    job.status = 'running'
    await this.commit(job)
    this.launch(job, job.batches)
    return this.detail(job.id)
  }
  private async prepare(job: ScenarioGeneration, batch: ScenarioBatch) {
    const remaining = batch.targets.filter((t) => !batch.fixtures.some((f) => f.id === t.id))
    const prepared = await this.host.preview(
      {
        task: 'scenarios',
        count: remaining.length,
        requirements: job.requirements,
        players: job.players,
        prompt: job.prompt,
        images: job.images,
        thinking: job.thinking,
      },
      { model: job.model }
    )
    prepared.model = job.model
    prepared.prompt = job.prompt
    prepared.system +=
      '\n\n分批执行：整体要求中的数量属于全任务，本次只输出批次上下文指定的剩余场景。遵守每个目标的街道约束，使用短而具体的说明，不输出规划过程。不得重复已保存路线。'
    prepared.user += `\n\n批次上下文：${JSON.stringify({ total: job.count, batchIndex: batch.index + 1, batchCount: job.batches.length, remainingTargets: remaining, saved: fixturesOf(job).map((f) => ({ id: f.id, hero: f.hero, cards: f.cards, line: f.line, street: f.street })) })}`
    if (prepared.user.length > 600000) {
      throw new Error('批次提示词过长，请减少数量')
    }
    return prepared
  }
  async preview(value: unknown) {
    const job = await this.plan(value)
    const prepared = await this.prepare(job, job.batches[0])
    return {
      count: job.count,
      batchSize: job.batchSize,
      concurrency: job.concurrency,
      plannedRequests: job.batches.length,
      thinking: job.thinking,
      model: job.model,
      targets: job.batches.map((b) => b.targets),
      firstBatch: { system: prepared.system, user: prepared.user },
      images: job.images.map((image) => ({ name: image.name, mimeType: image.mimeType })),
    }
  }
  async list() {
    const ids = await this.store.list('generations')
    const jobs = await Promise.all(ids.map((id) => this.detail(id)))
    return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
  }
  async detail(id: string) {
    const job = await this.store.read<ScenarioGeneration>(['generations', id, 'generation.json'])
    if (['running', 'pausing'].includes(job.status) && !this.active.has(id)) {
      job.status = 'interrupted'
      for (const batch of job.batches) {
        if (batch.status === 'running') {
          batch.status = 'interrupted'
          batch.problem = '服务已重启；已保存结果保留，点击继续或单独补跑此批'
        }
      }
    }
    const { images, ...publicJob } = job
    const fixtures = fixturesOf(job)
    return {
      ...publicJob,
      imageCount: images.length,
      fixtures,
      preflop: fixtures.filter((f) => f.street === 'preflop').length,
      postflop: fixtures.filter((f) => f.street !== 'preflop').length,
    }
  }
  async resume(id: string, value: unknown) {
    if (this.active.has(id) || this.starting.has(id)) {
      throw new Error('该分批任务正在运行，请等待或暂停后续批次')
    }
    this.starting.add(id)
    try {
      const job = await this.store.read<ScenarioGeneration>(['generations', id, 'generation.json'])
      const obj = record(value)
      if (obj.thinking !== undefined) {
        if (obj.thinking !== 'enabled' && obj.thinking !== 'disabled') {
          throw new Error('思考模式无效')
        }
        job.thinking = obj.thinking
      }
      const index = obj.batchIndex
      if (
        index !== undefined &&
        (!Number.isInteger(index) || Number(index) < 0 || Number(index) >= job.batches.length)
      ) {
        throw new Error('批次编号无效')
      }
      const selected = job.batches.filter(
        (b) => b.fixtures.length < b.targets.length && (index === undefined || b.index === index)
      )
      if (!selected.length) {
        return this.detail(id)
      }
      // An explicit retry can use corrected settings; every attempt keeps its own immutable snapshot.
      if (obj.useCurrentSettings === true) {
        const preview = await this.host.preview({
          task: 'scenarios',
          count: job.count,
          requirements: job.requirements,
          players: job.players,
          images: job.images,
          thinking: job.thinking,
        })
        job.model = preview.model
        job.prompt = preview.prompt
      }
      if (!(await this.host.key(job.model.provider))) {
        throw new Error('请先配置模型 API Key')
      }
      job.status = 'running'
      await this.commit(job)
      this.launch(job, selected)
      return this.detail(id)
    } finally {
      this.starting.delete(id)
    }
  }
  async pause(id: string) {
    const active = this.active.get(id)
    if (active) {
      active.paused = true
      active.job.status = 'pausing'
      await this.commit(active.job)
    }
    return {
      paused: Boolean(active),
      message: '当前批次完成后停止，不再发起后续批次；成功结果保留',
    }
  }
  private launch(job: ScenarioGeneration, selected: ScenarioBatch[]) {
    const control = { paused: false, job }
    this.active.set(job.id, control)
    void (async () => {
      job.status = 'running'
      await this.commit(job)
      let cursor = 0
      await Promise.all(
        Array.from({ length: Math.min(job.concurrency, selected.length) }, async () => {
          while (!control.paused) {
            const batch = selected[cursor++]
            if (!batch) {
              break
            }
            await this.runBatch(job, batch)
          }
        })
      )
      job.status =
        fixturesOf(job).length === job.count ? 'completed' : control.paused ? 'paused' : 'partial'
      await this.commit(job)
    })()
      .catch(async (error: unknown) => {
        job.status = 'interrupted'
        for (const batch of selected) {
          if (batch.status === 'running') {
            batch.status = 'interrupted'
            batch.problem = error instanceof Error ? error.message : '批次执行中断'
          }
        }
        await this.commit(job)
      })
      .finally(() => {
        this.active.delete(job.id)
        this.mutations.delete(job.id)
      })
      .catch(() => undefined)
  }
  private async runBatch(job: ScenarioGeneration, batch: ScenarioBatch) {
    const callId = randomUUID()
    const attempt = { callId, accepted: 0, problem: null as string | null }
    batch.attempts.push(attempt)
    batch.status = 'running'
    batch.problem = null
    batch.progress = null
    let response: ModelResult | undefined
    const started = performance.now()
    const remaining = batch.targets.filter((t) => !batch.fixtures.some((f) => f.id === t.id))
    try {
      await this.store.write(['calls', callId, 'request.json'], {
        id: callId,
        createdAt: new Date().toISOString(),
        task: 'scenarios',
        model: job.model,
        prompt: job.prompt,
        input: { count: remaining.length, requirements: job.requirements, players: job.players },
        thinking: job.thinking,
        generationId: job.id,
        batchIndex: batch.index,
      })
      await this.commit(job)
      const prepared = await this.prepare(job, batch)
      await this.store.write(['calls', callId, 'request.json'], {
        id: callId,
        createdAt: new Date().toISOString(),
        ...prepared,
        generationId: job.id,
        batchIndex: batch.index,
      })
      response = await requestModel(job.model, await this.host.key(job.model.provider), prepared, {
        thinking: job.thinking,
        onProgress: async (progress, partial) => {
          batch.progress = progress
          if (partial) {
            await this.store.write(['calls', callId, 'response.json'], {
              ...partial,
              incomplete: true,
            })
          }
          await this.commit(job)
        },
      })
    } catch (error) {
      response = error instanceof ModelRequestError ? (error.partial ?? response) : response
      attempt.problem = error instanceof Error ? error.message : '批次请求失败'
    }
    try {
      const rejected: string[] = []
      if (!response) {
        await this.store.write(['calls', callId, 'response.json'], {
          raw: null,
          content: '',
          usage: null,
          unavailable: true,
          problem: attempt.problem,
          note: '未取得成功响应；不保存可能包含凭据的上游错误正文',
        })
      }
      const diagnostic = response ? diagnoseModel(response) : null
      if (response) {
        await this.store.write(['calls', callId, 'response.json'], response)
        attempt.problem ??= diagnostic?.problem ?? null
        const candidates = recoverScenarioObjects(response.partialContent ?? response.content)
        // No await inside acceptance: concurrent workers cannot accept duplicate routes.
        const known = new Set(fixturesOf(job).map(routeKey))
        for (const [index, candidate] of candidates.entries()) {
          try {
            const fixture = validFixtures([{ ...record(candidate), id: 'candidate' }], 1)[0]
            const target = remaining.find(
              (t) =>
                !batch.fixtures.some((f) => f.id === t.id) &&
                (t.stage === null ||
                  (fixture.street === 'preflop' ? 'preflop' : 'postflop') === t.stage)
            )
            if (!target) {
              throw new Error('返回场景超出本批数量或不符合剩余街道配额')
            }
            if (known.has(routeKey(fixture))) {
              throw new Error('与已保存场景重复')
            }
            known.add(routeKey(fixture))
            batch.fixtures.push({ ...fixture, id: target.id })
            attempt.accepted++
          } catch (error) {
            rejected.push(
              `第 ${index + 1} 项：${error instanceof Error ? error.message : '路线无效'}`
            )
          }
        }
        if (!candidates.length) {
          rejected.push('未找到完整场景对象；不补写截断内容')
        }
      }
      if (rejected.length) {
        attempt.problem = [attempt.problem, ...rejected].filter(Boolean).join('；')
      }
      batch.fixtures.sort((a, b) => a.id.localeCompare(b.id))
      batch.status =
        batch.fixtures.length === batch.targets.length
          ? 'completed'
          : batch.fixtures.length
            ? 'partial'
            : 'failed'
      batch.problem =
        attempt.problem ??
        (batch.status === 'completed' ? null : '返回数量不足，可单独补跑剩余场景')
      await this.store.write(['calls', callId, 'result.json'], {
        ok: batch.status === 'completed' && !attempt.problem,
        result: batch.fixtures,
        generationId: job.id,
        batchIndex: batch.index,
        accepted: attempt.accepted,
        rejected,
        problem: batch.problem,
        diagnostic,
        elapsedMs: Math.round(performance.now() - started),
      })
      await this.commit(job)
    } catch (error) {
      batch.status = 'interrupted'
      batch.problem = error instanceof Error ? error.message : '本机结果保存失败'
      await this.commit(job)
    }
  }
}
