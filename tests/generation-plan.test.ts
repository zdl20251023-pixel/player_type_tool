import { expect, test } from 'bun:test'
import {
  generationConflict,
  generationPlan,
  describedStreetQuota,
} from '../src/scenarios/generation-plan'
import { ScenarioBatchUI } from '../src/web/scenario-batches'

test('batch planning scales with quantity, clamps manual limits, and identifies explicit conflicting quotas', () => {
  for (const [count, size, batches, concurrent] of [
    [1, 1, 1, 1],
    [2, 2, 1, 1],
    [5, 3, 2, 2],
    [10, 3, 4, 2],
    [100, 3, 34, 2],
  ]) {
    expect(generationPlan(count)).toEqual({
      batchSize: size,
      batchCount: batches,
      concurrency: concurrent,
    })
  }
  expect(generationPlan(2, { batchMode: 'manual', batchSize: 5, concurrency: 3 })).toEqual({
    batchSize: 2,
    batchCount: 1,
    concurrency: 1,
  })
  expect(generationPlan(10, { batchMode: 'manual', batchSize: 2, concurrency: 3 })).toEqual({
    batchSize: 2,
    batchCount: 5,
    concurrency: 3,
  })
  for (const count of [0, 101, NaN, 1.5]) {
    expect(() => generationPlan(count)).toThrow('场景数量')
  }
  for (const text of ['翻前和翻后各3条', '翻前翻后的情况各3种', '翻后、翻前各三条']) {
    expect(generationConflict(2, text)).toContain('共 6 条')
    expect(generationConflict(6, text)).toBeNull()
  }
  expect(describedStreetQuota('翻前2条，翻后四条')).toEqual({ preflop: 2, postflop: 4 })
  expect(describedStreetQuota('翻前和翻后各十条')).toEqual({ preflop: 10, postflop: 10 })
  expect(generationConflict(6, '翻前2条，翻后4条')).toBeNull()
  expect(generationConflict(2, '包括翻前和翻后，3bet 面对4bet')).toBeNull()
})

test('generator controls update without requests; explicit settings persist and conflicts block preview and generation', async () => {
  const originalDocument = globalThis.document
  const originalStorage = globalThis.localStorage
  const storage = new Map<string, string>([
    [
      'strategy-lab-batch-preferences',
      JSON.stringify({ batchSize: 3, concurrency: 2, thinking: 'disabled' }),
    ],
  ])
  const controls = { innerHTML: '' },
    summary = { innerHTML: '' }
  globalThis.document = {
    getElementById: (id: string) =>
      id === 'batch-controls' ? controls : id === 'batch-plan-summary' ? summary : null,
  } as unknown as Document
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } as unknown as Storage
  let count = 2,
    requirements = '翻前路线'
  const requests: { path: string; body: unknown }[] = []
  const ui = () =>
    new ScenarioBatchUI({
      input: () => ({ count, requirements }),
      api: <T>(path: string, body?: unknown) => {
        requests.push({ path, body })
        return Promise.resolve({} as T)
      },
      enabled: () => true,
      apply: () => {},
      notice: () => {},
      preview: () => {},
    })
  const change = (id: string, value: string) => ({ id, value }) as HTMLSelectElement
  try {
    const batch = ui()
    batch.update()
    expect(controls.innerHTML).toContain('value="2" selected')
    expect(summary.innerHTML).toContain('分 1 批，每批最多 2 条，同时执行 1 批')
    expect(summary.innerHTML).toContain('思考模式开启')
    count = 10
    batch.update()
    expect(summary.innerHTML).toContain('分 4 批，每批最多 3 条，同时执行 2 批')
    batch.update(change('batch-size', '2'))
    batch.update(change('batch-concurrency', '3'))
    expect(summary.innerHTML).toContain('分 5 批，每批最多 2 条，同时执行 3 批')
    expect(controls.innerHTML).toContain('恢复自动分批')
    expect(requests).toHaveLength(0)
    batch.update(change('batch-thinking', 'disabled'))
    await batch.preview()
    expect(requests[0].body).toMatchObject({
      count: 10,
      batchMode: 'manual',
      batchSize: 2,
      concurrency: 3,
      thinking: 'disabled',
    })
    const reopened = ui()
    expect(reopened.planSummary()).toContain('思考模式关闭')
    expect(reopened.planSummary()).toContain('手动设置')
    count = 1
    reopened.update()
    expect(summary.innerHTML).toContain('分 1 批，每批最多 1 条，同时执行 1 批')
    count = 10
    reopened.auto()
    expect(summary.innerHTML).toContain('分 4 批，每批最多 3 条，同时执行 2 批')
    requirements = '翻前和翻后各3条'
    count = 2
    reopened.update()
    expect(summary.innerHTML).toContain('共 6 条，当前生成数量为 2 条')
    expect(reopened.preview()).rejects.toThrow('请统一后生成')
    expect(reopened.start()).rejects.toThrow('请统一后生成')
    expect(requests).toHaveLength(1)
    count = 0
    reopened.update()
    expect(summary.innerHTML).toContain('场景数量必须为 1..100')
    expect(reopened.preview()).rejects.toThrow('场景数量')
  } finally {
    globalThis.document = originalDocument
    globalThis.localStorage = originalStorage
  }
})
