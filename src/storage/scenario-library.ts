import { createHash } from 'node:crypto'
import Decimal from 'decimal.js'
import { record } from '../analysis/strategy'
import { validFixtures } from '../scenarios/generated'
import type { ScenarioFixture } from '../scenarios'
import type { WorkbenchStore } from './workbench'

export interface ScenarioLibrarySource {
  key: string
  id: string
  kind: 'generation' | 'call' | 'experiment'
  title: string
  createdAt: string
  status: string
  model: string | null
  count: number
}
export interface ScenarioLibraryEntry {
  key: string
  fixture: ScenarioFixture
  sources: string[]
  latestAt: string
}
export interface ScenarioLibrary {
  entries: ScenarioLibraryEntry[]
  sources: ScenarioLibrarySource[]
  warnings: { source: string; problem: string }[]
}
export const scenarioRouteKey = (f: ScenarioFixture) =>
  createHash('sha256')
    .update(JSON.stringify([f.hero, f.cards, f.street, f.line]))
    .digest('hex')

function fixtureFromSession(value: unknown) {
  const scene = record(value),
    hand = record(scene.hand)
  const players = Array.isArray(hand.players) ? hand.players : []
  const player = players.map(record).find((p) => p.seat_no === scene.hero)
  const actions = record(hand.actions).entries
  if (!Array.isArray(actions)) {
    throw new Error('场景缺少行动历史')
  }
  const codes: Record<string, string> = { fold: 'f', call: 'c', check: 'x', bet: 'b', raise: 'r' }
  const line = (actions as unknown[])
    .map((item) => {
      const a = record(item)
      if (a.seat_no === -1) {
        return `@${String(a.action)}`
      }
      const code = typeof a.action === 'string' ? codes[a.action] : undefined
      if (!code || typeof a.seat_no !== 'number') {
        throw new Error('未知历史动作')
      }
      const amount =
        code === 'b' || code === 'r' ? new Decimal(Number(a.amount)).div(100).toString() : ''
      return `${a.seat_no}:${code}${amount}`
    })
    .join(' ')
  return {
    id: scene.id,
    description: scene.description,
    category: scene.category || '历史实验',
    history: scene.history || '从已保存的 session v1 牌局历史还原。',
    hero: scene.hero,
    cards: player?.hole_cards,
    street: scene.street,
    line,
  }
}

export async function readScenarioLibrary(store: WorkbenchStore): Promise<ScenarioLibrary> {
  const result: ScenarioLibrary = { entries: [], sources: [], warnings: [] }
  const entries = new Map<string, ScenarioLibraryEntry>()
  const generationIds = new Set<string>()
  const add = (source: Omit<ScenarioLibrarySource, 'count'>, candidates: unknown[]) => {
    const seen = new Set<string>()
    for (const [index, item] of candidates.entries()) {
      try {
        const fixture = validFixtures([item], 1)[0]
        const key = scenarioRouteKey(fixture)
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        const existing = entries.get(key)
        if (existing) {
          if (!existing.sources.includes(source.key)) {
            existing.sources.push(source.key)
          }
          if (source.createdAt > existing.latestAt) {
            existing.latestAt = source.createdAt
            existing.fixture = fixture
          }
        } else {
          entries.set(key, { key, fixture, sources: [source.key], latestAt: source.createdAt })
        }
      } catch {
        result.warnings.push({
          source: source.key,
          problem: `第 ${index + 1} 条路线未通过合法性校验，未入库`,
        })
      }
    }
    if (seen.size) {
      result.sources.push({ ...source, count: seen.size })
    }
  }
  const info = (
    kind: ScenarioLibrarySource['kind'],
    id: string,
    data: Record<string, unknown>,
    title: unknown
  ): Omit<ScenarioLibrarySource, 'count'> => ({
    key: `${kind}-${id}`,
    id,
    kind,
    title:
      typeof title === 'string' && title
        ? title
        : `历史${kind === 'generation' ? '生成任务' : kind === 'call' ? '场景调用' : '实验'}`,
    createdAt:
      typeof data.createdAt === 'string' && Number.isFinite(Date.parse(data.createdAt))
        ? data.createdAt
        : '1970-01-01T00:00:00.000Z',
    status: typeof data.status === 'string' ? data.status : 'saved',
    model: typeof record(data.model).model === 'string' ? String(record(data.model).model) : null,
  })
  // Read snapshots only; do not rewrite caches or read provider responses/secrets.
  for (const id of await store.list('generations')) {
    try {
      const job = await store.read<Record<string, unknown>>(['generations', id, 'generation.json'])
      generationIds.add(id)
      const batches = Array.isArray(job.batches) ? (job.batches as unknown[]) : []
      add(
        info('generation', id, job, job.requirements),
        batches.flatMap((b) =>
          Array.isArray(record(b).fixtures) ? (record(b).fixtures as unknown[]) : []
        )
      )
    } catch {
      result.warnings.push({
        source: `generation-${id}`,
        problem: '生成任务快照读取失败，其余记录仍可使用',
      })
    }
  }
  for (const id of await store.list('calls')) {
    try {
      const req = await store.read<Record<string, unknown>>(['calls', id, 'request.json'])
      if (
        req.task !== 'scenarios' ||
        (typeof req.generationId === 'string' && generationIds.has(req.generationId))
      ) {
        continue
      }
      const output = await store.read<Record<string, unknown>>(['calls', id, 'result.json'], {})
      const candidates = Array.isArray(output.result) ? (output.result as unknown[]) : []
      if (candidates.length) {
        add(
          info('call', id, req, record(req.input).requirements ?? '早期场景生成 / 单条重生'),
          candidates
        )
      }
    } catch {
      result.warnings.push({ source: `call-${id}`, problem: '调用结果读取失败，其余记录仍可使用' })
    }
  }
  for (const id of await store.list('runs')) {
    try {
      const meta = await store.read<Record<string, unknown>>(['runs', id, 'experiment.json'], {})
      if (Array.isArray(meta.fixtures)) {
        add(info('experiment', id, meta, meta.name), meta.fixtures as unknown[])
      } else {
        const session = await store.read<Record<string, unknown>>(['runs', id, 'session.json'])
        const scenes = Array.isArray(session.scenarios) ? (session.scenarios as unknown[]) : []
        const candidates = scenes.flatMap((scene) => {
          try {
            return [fixtureFromSession(scene)]
          } catch {
            result.warnings.push({
              source: `experiment-${id}`,
              problem: '一条历史场景无法还原，已跳过',
            })
            return []
          }
        })
        add(info('experiment', id, session, meta.name), candidates)
      }
    } catch {
      result.warnings.push({
        source: `experiment-${id}`,
        problem: '实验快照读取失败，其余记录仍可使用',
      })
    }
  }
  result.entries = [...entries.values()].sort(
    (a, b) => b.latestAt.localeCompare(a.latestAt) || a.fixture.id.localeCompare(b.fixture.id)
  )
  result.sources.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return result
}

export async function reuseLibraryScenarios(store: WorkbenchStore, value: unknown) {
  const obj = record(value)
  if (
    !Array.isArray(obj.keys) ||
    !obj.keys.length ||
    obj.keys.length > 100 ||
    obj.keys.some((k) => typeof k !== 'string')
  ) {
    throw new Error('请选择 1..100 条场景')
  }
  if (obj.mode !== 'replace' && obj.mode !== 'append') {
    throw new Error('请选择替换或追加')
  }
  if (obj.mode === 'append' && obj.existing !== undefined && !Array.isArray(obj.existing)) {
    throw new Error('当前草稿路线必须为数组')
  }
  const library = await readScenarioLibrary(store)
  const keys = [...new Set(obj.keys as string[])]
  const selected = keys.map((key) => library.entries.find((entry) => entry.key === key)?.fixture)
  if (selected.some((f) => !f)) {
    throw new Error('所选场景已变化，请刷新场景库后重试')
  }
  const existing =
    obj.mode === 'append' && Array.isArray(obj.existing) && obj.existing.length
      ? validFixtures(obj.existing)
      : []
  const fixtures = structuredClone(existing)
  const routes = new Set(fixtures.map(scenarioRouteKey))
  const ids = new Set(fixtures.map((f) => f.id))
  const reserved = new Set([...ids, ...selected.map((f) => f!.id)])
  const renamed: { from: string; to: string }[] = []
  let duplicates = 0,
    counter = 1
  for (const candidate of selected) {
    const fixture = structuredClone(candidate!)
    const key = scenarioRouteKey(fixture)
    if (routes.has(key)) {
      duplicates++
      continue
    }
    if (ids.has(fixture.id)) {
      let id: string
      do {
        id = `LIB${String(counter++).padStart(3, '0')}`
      } while (reserved.has(id))
      renamed.push({ from: fixture.id, to: id })
      fixture.id = id
      reserved.add(id)
    }
    ids.add(fixture.id)
    routes.add(key)
    fixtures.push(fixture)
  }
  if (fixtures.length > 100) {
    throw new Error('复用后超过 100 条，请减少选择数量；当前草稿未改变')
  }
  return {
    fixtures: validFixtures(fixtures),
    added: fixtures.length - existing.length,
    duplicates,
    renamed,
  }
}
