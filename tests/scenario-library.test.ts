import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'
import { WorkbenchStore } from '../src/storage/workbench'
import { readScenarioLibrary, reuseLibraryScenarios } from '../src/storage/scenario-library'
import { fixtures } from '../src/scenarios/fixtures'
import { fromFixture } from '../src/scenarios'
import { Workbench } from '../src/runner/workbench'
import { createWebHandler } from '../src/web/server'

test('scenario library unifies partial generation, historical calls and session v1 without exposing prompts or changing caches', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'scenario-library-'))
  const store = new WorkbenchStore(root)
  const first = { ...fixtures[0], id: 'G001' }
  const second = { ...fixtures[1], id: 'G001' }
  const third = { ...fixtures[2], id: 'G003' }
  try {
    await store.write(['generations', 'batch-a', 'generation.json'], {
      createdAt: '2026-11-25T10:00:00.000Z',
      requirements: '较新生成任务',
      status: 'partial',
      model: { model: 'local-model' },
      images: [{ data: 'never-export-image' }],
      batches: [{ fixtures: [first, { ...fixtures[3], line: '0:x' }] }],
    })
    await store.write(['calls', 'old-call', 'request.json'], {
      task: 'scenarios',
      createdAt: '2026-11-24T00:00:00.000Z',
      system: 'never-export-prompt',
      input: { requirements: '历史生成' },
    })
    await store.write(['calls', 'old-call', 'result.json'], {
      ok: true,
      result: [{ ...first, description: '旧说明' }, second],
    })
    await store.write(['calls', 'batch-call', 'request.json'], {
      task: 'scenarios',
      generationId: 'batch-a',
    })
    await store.write(['calls', 'batch-call', 'result.json'], { ok: false, result: [first] })
    await store.write(['runs', 'web-run', 'experiment.json'], {
      name: '已保存实验',
      createdAt: '2026-11-25T09:00:00.000Z',
      fixtures: [first, third],
    })
    await store.write(['runs', 'flat-session', 'session.json'], {
      version: 1,
      createdAt: '2026-11-23T00:00:00.000Z',
      scenarios: [fromFixture(third)],
    })
    await store.write(['generations', 'broken', 'generation.json'], {})
    await writeFile(store.path('generations', 'broken', 'generation.json'), 'broken-json')
    const originalPath = store.path('generations', 'batch-a', 'generation.json')
    const original = await readFile(originalPath, 'utf8')
    const library = await readScenarioLibrary(store)
    expect(library.entries).toHaveLength(3)
    expect(library.sources).toHaveLength(4)
    expect(library.entries[0].fixture.description).toBe(first.description)
    expect(library.entries.find((e) => e.fixture.cards === first.cards)?.sources).toHaveLength(3)
    expect(library.sources.some((s) => s.id === 'batch-call')).toBe(false)
    expect(library.warnings).toHaveLength(2)
    expect(JSON.stringify(library)).not.toContain('never-export')
    const keys = library.entries.map((e) => e.key)
    const reuse = await reuseLibraryScenarios(store, { keys, mode: 'replace' })
    expect(reuse.fixtures).toHaveLength(3)
    expect(reuse.renamed).toHaveLength(1)
    expect(new Set(reuse.fixtures.map((f) => f.id)).size).toBe(3)
    const appended = await reuseLibraryScenarios(store, { keys, mode: 'append', existing: [first] })
    expect(appended.fixtures).toHaveLength(3)
    expect(appended.added).toBe(2)
    expect(appended.duplicates).toBe(1)
    expect(await readFile(originalPath, 'utf8')).toBe(original)
    await assert.rejects(
      reuseLibraryScenarios(store, { keys: ['missing'], mode: 'replace' }),
      /已变化/
    )
    await assert.rejects(
      reuseLibraryScenarios(store, { keys, mode: 'append', existing: 'bad' }),
      /数组/
    )
    const handler = createWebHandler(new Workbench(store))
    const read = await handler(new Request('http://127.0.0.1:3217/api/scenario-library'))
    expect(read.status).toBe(200)
    expect(await read.text()).not.toContain('never-export')
    const imported = await handler(
      new Request('http://127.0.0.1:3217/api/scenario-library/reuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys, mode: 'replace' }),
      })
    )
    expect(imported.status).toBe(200)
  } finally {
    const inside = relative(tmpdir(), root)
    if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})

test('reuse enforces the hundred scene limit before replacing a draft', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'scenario-library-limit-'))
  const store = new WorkbenchStore(root)
  try {
    await store.write(['calls', 'one', 'request.json'], { task: 'scenarios' })
    await store.write(['calls', 'one', 'result.json'], { ok: true, result: [fixtures[99]] })
    const library = await readScenarioLibrary(store)
    const existing = fixtures.slice(0, 99)
    const combined = await reuseLibraryScenarios(store, {
      keys: [library.entries[0].key],
      mode: 'append',
      existing,
    })
    expect(combined.fixtures).toHaveLength(100)
    // A distinct legal route on top of a full draft must be rejected atomically.
    const extra = { ...fixtures[99], id: 'extra', cards: 'AhAd' }
    await store.write(['calls', 'two', 'request.json'], { task: 'scenarios' })
    await store.write(['calls', 'two', 'result.json'], { ok: true, result: [extra] })
    const current = await readScenarioLibrary(store)
    const entry = current.entries.find((e) => e.fixture.id === 'extra')!
    expect(entry).toBeDefined()
    await assert.rejects(
      reuseLibraryScenarios(store, {
        keys: [entry.key],
        mode: 'append',
        existing: combined.fixtures,
      }),
      /超过 100/
    )
    expect(existing).toHaveLength(99)
  } finally {
    const inside = relative(tmpdir(), root)
    if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})
