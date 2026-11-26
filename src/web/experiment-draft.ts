import type { PlayerConfig } from '../contracts/workbench'
import type { ScenarioFixture } from '../scenarios'
import { validPlayer } from '../profiles/catalog'

export interface ExperimentDraft {
  key?: string
  savedAt?: string
  name: string
  requirements: string
  count: number
  repeats: number
  playerIds: string[]
  fixtures: ScenarioFixture[]
  rolePlayers?: PlayerConfig[]
  hiddenPlayerIds?: string[]
  generationId?: string
  appliedGenerationId?: string
  origins?: Record<string, string>
}
export function emptyExperimentDraft(): ExperimentDraft {
  return {
    key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    name: '',
    requirements: '',
    count: 5,
    repeats: 1,
    playerIds: [],
    fixtures: [],
    rolePlayers: [],
    hiddenPlayerIds: [],
    origins: {},
  }
}
export const routeIdentity = (f: ScenarioFixture) =>
  JSON.stringify([f.hero, f.cards, f.line.trim()])

export function readExperimentDraft(value: unknown): ExperimentDraft | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const raw = value as Partial<ExperimentDraft>
  if (
    !Array.isArray(raw.fixtures) ||
    raw.fixtures.length > 100 ||
    !Array.isArray(raw.playerIds) ||
    !raw.fixtures.every(
      (f) =>
        f &&
        typeof f.id === 'string' &&
        typeof f.description === 'string' &&
        typeof f.cards === 'string' &&
        typeof f.line === 'string' &&
        typeof f.category === 'string' &&
        typeof f.history === 'string' &&
        ['preflop', 'flop', 'turn', 'river'].includes(f.street) &&
        Number.isInteger(f.hero) &&
        f.hero >= 0 &&
        f.hero <= 5
    )
  ) {
    return null
  }
  try {
    return {
      ...emptyExperimentDraft(),
      key:
        typeof raw.key === 'string' && raw.key.length <= 80 ? raw.key : emptyExperimentDraft().key,
      name: typeof raw.name === 'string' ? raw.name.slice(0, 200) : '',
      requirements: typeof raw.requirements === 'string' ? raw.requirements.slice(0, 4000) : '',
      count: Number.isInteger(raw.count) && raw.count! >= 1 && raw.count! <= 100 ? raw.count! : 5,
      repeats:
        Number.isInteger(raw.repeats) && raw.repeats! >= 1 && raw.repeats! <= 10 ? raw.repeats! : 1,
      fixtures: structuredClone(raw.fixtures),
      playerIds: [
        ...new Set(
          raw.playerIds.filter((id) => typeof id === 'string' && /^[A-Za-z0-9-]{1,60}$/.test(id))
        ),
      ],
      rolePlayers: Array.isArray(raw.rolePlayers)
        ? raw.rolePlayers.slice(0, 75).map(validPlayer)
        : [],
      hiddenPlayerIds: Array.isArray(raw.hiddenPlayerIds)
        ? raw.hiddenPlayerIds
            .filter((id) => typeof id === 'string' && /^[A-Za-z0-9-]{1,60}$/.test(id))
            .slice(0, 100)
        : [],
      origins:
        raw.origins && typeof raw.origins === 'object'
          ? Object.fromEntries(
              Object.entries(raw.origins)
                .filter(([id, label]) => typeof id === 'string' && typeof label === 'string')
                .map(([id, label]) => [id, label.slice(0, 100)])
            )
          : {},
      generationId:
        typeof raw.generationId === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(raw.generationId)
          ? raw.generationId
          : undefined,
      appliedGenerationId:
        typeof raw.appliedGenerationId === 'string' &&
        /^[A-Za-z0-9-]{1,80}$/.test(raw.appliedGenerationId)
          ? raw.appliedGenerationId
          : undefined,
      savedAt: raw.savedAt,
    }
  } catch {
    return null
  }
}
export function mergeDraftScenes(
  existing: ScenarioFixture[],
  added: ScenarioFixture[],
  mode: 'append' | 'replace'
) {
  const fixtures = structuredClone(mode === 'append' ? existing : [])
  const keys = new Set(fixtures.map(routeIdentity))
  const ids = new Set(fixtures.map((f) => f.id))
  let duplicates = 0,
    renamed = 0
  for (const original of added) {
    const key = routeIdentity(original)
    if (keys.has(key)) {
      duplicates++
      continue
    }
    const f = structuredClone(original)
    let suffix = 2
    while (ids.has(f.id)) {
      f.id = `${original.id.slice(0, 32)}-${suffix++}`
    }
    if (f.id !== original.id) {
      renamed++
    }
    fixtures.push(f)
    keys.add(key)
    ids.add(f.id)
  }
  if (fixtures.length > 100) {
    throw new Error('本次实验最多 100 条场景，请减少选择或使用替换模式')
  }
  return { fixtures, duplicates, renamed }
}
