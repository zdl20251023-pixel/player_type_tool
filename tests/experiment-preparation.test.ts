import { expect, test } from 'bun:test'
import {
  emptyExperimentDraft,
  readExperimentDraft,
  mergeDraftScenes,
  routeIdentity,
} from '../src/web/experiment-draft'
import { ExperimentSetupUI } from '../src/web/experiment-setup'
import type { ScenarioBatchUI } from '../src/web/scenario-batches'
import { representativeFixtures } from '../src/scenarios/representative'
import { validFixtures } from '../src/scenarios/generated'
import { catalogOptions } from '../src/profiles/catalog'
import { roleById, roleToPlayer } from '../src/profiles/roles'
import type { ScenarioFixture } from '../src/scenarios'

test('blank drafts stay empty; legacy drafts are read without mutating their snapshots', () => {
  const blank = emptyExperimentDraft()
  expect(blank.playerIds).toEqual([])
  expect(blank.fixtures).toEqual([])
  expect(blank.name).toBe('')
  expect(blank.key).not.toBe(emptyExperimentDraft().key)
  const legacy = {
    name: '原草稿',
    requirements: '复用测试',
    count: 3,
    repeats: 2,
    playerIds: ['old-player'],
    fixtures: representativeFixtures,
    rolePlayers: [roleToPlayer(roleById('L4-A1-F1'))],
  }
  const original = JSON.stringify(legacy)
  const recovered = readExperimentDraft(legacy)!
  expect(recovered.fixtures).toEqual([...legacy.fixtures])
  expect(recovered.playerIds).toEqual(['old-player'])
  expect(recovered.key).toBeDefined()
  recovered.fixtures[0].description = 'edited'
  expect(JSON.stringify(legacy)).toBe(original)
  expect(readExperimentDraft({ fixtures: [{}], playerIds: [] })).toBeNull()
  expect(
    readExperimentDraft({ fixtures: [], playerIds: [], rolePlayers: [{ id: 'bad' }] })
  ).toBeNull()
})

test('append deduplicates routes and renames conflicting IDs; replacement and capacity are explicit', () => {
  const existing = [representativeFixtures[0]]
  const before = JSON.stringify(existing)
  const result = mergeDraftScenes(
    existing,
    [representativeFixtures[0], { ...representativeFixtures[1], id: existing[0].id }],
    'append'
  )
  expect(result.fixtures).toHaveLength(2)
  expect(result.duplicates).toBe(1)
  expect(result.renamed).toBe(1)
  expect(result.fixtures[1].id).toBe('S01-2')
  expect(validFixtures(result.fixtures)).toHaveLength(2)
  expect(JSON.stringify(existing)).toBe(before)
  expect(mergeDraftScenes(existing, [representativeFixtures[1]], 'replace').fixtures).toEqual([
    representativeFixtures[1],
  ])
  expect(() =>
    mergeDraftScenes(
      [],
      Array.from({ length: 101 }, (_, i) => ({
        ...representativeFixtures[0],
        id: `A${i}`,
        line: `3:r${i}`,
      })),
      'append'
    )
  ).toThrow('最多 100')
})

test('scene candidates apply only after explicit confirmation; late model output cannot populate a reset draft', async () => {
  const originalDocument = globalThis.document
  const fields = new Map<string, unknown>()
  const dialog = {
    innerHTML: '',
    open: false,
    scrollTop: 0,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  fields.set('setup-dialog', dialog)
  fields.set('requirements', { value: '生成一个翻前场景' })
  fields.set('scenario-count', { value: '1' })
  const document = {
    getElementById: (id: string) => fields.get(id) ?? null,
    querySelector: () => ({ value: 'append' }),
  }
  globalThis.document = document as unknown as Document
  let draft = emptyExperimentDraft()
  const player = roleToPlayer(roleById('L4-A1-F1'))
  let current: { id: string; fixtures: ScenarioFixture[]; count: number; status: string } | null =
    null
  let changes = 0,
    validations = 0
  const batches = {
    get snapshot() {
      return current
    },
    controls: () => '',
    planSummary: () => '',
    view: () => '',
    start() {
      current = {
        id: 'qa-job',
        fixtures: [structuredClone(representativeFixtures[0])],
        count: 1,
        status: 'running',
      }
      ui.batchChanged()
      return Promise.resolve()
    },
  }
  const ui = new ExperimentSetupUI({
    draft: () => draft,
    selected: () => (draft.playerIds.length ? [player] : []),
    players: () => [player],
    catalog: catalogOptions,
    fixtures: () => [...representativeFixtures],
    validation: () => ({}),
    validate: () => {},
    changed: () => {
      changes++
    },
    api: <T>(_path: string, body?: unknown) => {
      validations++
      const selected = validFixtures((body as { fixtures: ScenarioFixture[] }).fixtures)
      return Promise.resolve({ fixtures: selected, validation: [] } as T)
    },
    notice: () => {},
    batches: () => batches as unknown as ScenarioBatchUI,
    recoverable: () => null,
    reset: () => {},
    recover: () => {},
    imagePicker: () => '',
  })
  const button = (source?: string) => ({ dataset: { source } }) as unknown as HTMLButtonElement
  try {
    expect(ui.view()).toContain('还没有对比场景')
    expect(ui.view()).not.toContain('scenario-batch-panel')
    await ui.click('setup-scenes', button())
    await ui.click('setup-scene-source', button('examples'))
    ui.change({
      id: '',
      dataset: { setupScene: routeIdentity(representativeFixtures[0]) },
      checked: true,
    } as unknown as HTMLInputElement)
    expect(draft.fixtures).toHaveLength(0)
    expect(validations).toBe(0)
    await ui.click('setup-close', button())
    expect(draft.fixtures).toHaveLength(0)
    await ui.click('setup-scenes', button())
    await ui.click('setup-scene-source', button('examples'))
    ui.change({
      id: '',
      dataset: { setupScene: routeIdentity(representativeFixtures[0]) },
      checked: true,
    } as unknown as HTMLInputElement)
    await ui.click('setup-apply-scenes', button())
    expect(draft.fixtures).toHaveLength(1)
    expect(validations).toBe(1)
    expect(draft.origins?.S01).toBe('示例路线')
    draft.playerIds = [player.id]
    await ui.click('setup-scenes', button())
    await ui.click('setup-generate', button())
    expect(draft.generationId).toBe('qa-job')
    expect(draft.fixtures).toHaveLength(1) // generated content is still only a candidate
    await ui.click('setup-close', button())
    ui.detached()
    draft = emptyExperimentDraft()
    const beforeLate = changes
    ui.batchChanged()
    expect(changes).toBe(beforeLate)
    expect(draft.fixtures).toEqual([])
    expect(draft.generationId).toBeUndefined()
    expect(ui.view()).not.toContain('qa-job')
  } finally {
    globalThis.document = originalDocument
  }
})
