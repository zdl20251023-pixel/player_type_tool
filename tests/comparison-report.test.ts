import { expect, test } from 'bun:test'
import { Script } from 'node:vm'
import { horizontalResults, workbenchHtml } from '../src/reports/workbench'
import {
  comparisonDetails,
  comparisonSummary,
  comparisonOverview,
  rawRunView,
  comparisonScript,
  installComparisonInteractions,
} from '../src/reports/comparison-view'
import { buildRequest, scenarios } from '../src/scenarios'
import { styles } from '../src/profiles/styles'
import type { CachedRunType, SessionType } from '../src/storage/session'
import type { ExperimentMeta } from '../src/contracts/workbench'

function fixture() {
  const scenario = scenarios.find((s) => s.id === 'P02')!
  const players = [
    ...styles.map((p) => ({ ...p, description: p.label })),
    { id: 'extra', label: '自定义四号', description: '额外玩家', preflop: 'gto', postflop: 'gto' },
  ]
  const makeAction = (
    name: string,
    probability: number,
    value: number,
    amount: number | null = null
  ) => ({
    action: { action: name, amount, pot_size: null, seat_no: 3 },
    hand_strategy: probability,
    hand_ev: value,
  })
  const runs: CachedRunType[] = players.flatMap((player, i) =>
    [1, 2].map((repeat) => ({
      id: `P02-${repeat}-${i}`,
      scenario: 'P02',
      description: scenario.description,
      style: player.id,
      profile: player.preflop,
      repeat,
      elapsedMs: 25,
      httpStatus: 200,
      request: buildRequest(scenario, player.preflop, `req-${repeat}-${i}`),
      ok: i !== 3,
      problem: i === 3 ? '测试失败' : null,
      response:
        i === 3
          ? { error: '</pre><script>alert(1)</script>' }
          : {
              note: '</pre><script>alert(1)</script>',
              solution_information: {
                source: 'local-only',
                strategy_profile_config: { matched_profile_name: player.preflop },
              },
              strategy: {
                suggested_action: { action: 'call', amount: 100, seat_no: 3 },
                actions:
                  repeat === 1
                    ? [
                        makeAction('fold', 0.2, 0),
                        makeAction('call', 0.5, 1.2, 100),
                        makeAction('raise', 0.3, 1.4, 250),
                      ]
                    : [makeAction('fold', 0.6, 0), makeAction('raise', 0.4, 1.5, 350)],
              },
            },
    }))
  )
  const session: SessionType = {
    version: 1,
    runId: 'local-comparison',
    createdAt: '2026-11-25T00:00:00.000Z',
    repeats: 2,
    scenarios: [scenario],
    plan: runs.map((run) => ({
      id: run.id,
      scenario: run.scenario,
      description: scenario.description,
      style: run.style,
      profile: run.profile,
      repeat: run.repeat,
      request: run.request,
    })),
  }
  const meta: ExperimentMeta = {
    id: session.runId,
    createdAt: session.createdAt,
    name: '对比测试',
    requirements: '只使用本机数据',
    fixtures: [],
    players,
    repeats: 2,
    baselineId: 'gto',
    status: 'failed',
    completed: 8,
    total: 8,
    successful: 6,
    analysisIds: [],
    problem: null,
  }
  return { session, meta, runs }
}

test('comparison shows each size separately, preserves EV averaging and exposes raw data for every player/repeat', () => {
  const { session, meta, runs } = fixture()
  const data = horizontalResults(meta, session, runs)
  const call = data.scenes[0].actions.find((a) => a.label === '跟注 1BB')!
  expect(call.cells[0].probability).toBe(25)
  expect(call.cells[0].ev).toBe(1.2)
  expect(call.cells[3].probability).toBeNull()
  const summary = comparisonSummary(data)
  expect(summary).toContain('wb-segments')
  expect(summary).toContain('弃牌')
  expect(summary).toContain('自定义四号')
  expect(summary).toContain('data-wb-filter="stage"')
  const view = comparisonDetails(data, { experimentId: meta.id })
  expect(view).toContain('加注到 2.5BB')
  expect(view).toContain('加注到 3.5BB')
  expect(view).toContain('25.000000%')
  expect(view).toContain('EV 1.2000')
  expect(view).toContain('id="wb-options-P02" open')
  expect((view.match(/data-wb-raw-url=/g) ?? []).length).toBe(8)
  expect(view).toContain('/api/experiments/local-comparison/raw/P02-2-3.json')
  const offline = workbenchHtml(meta, data, null, runs)
  expect(offline).toContain('hand_strategy')
  expect(offline).toContain('hand_ev')
  expect(offline).toContain('req-2-3')
  expect(offline).toContain('&lt;/pre&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
  expect(offline).not.toContain('</pre><script>alert(1)</script>')
  expect(() => new Script(comparisonScript)).not.toThrow()
  expect(offline).toContain(comparisonScript)
  expect(offline).toContain('id="overview"')
  expect(offline.indexOf('id="overview"')).toBeLessThan(offline.indexOf('id="report-analysis"'))
  const raw = rawRunView(runs[0])
  expect(raw).toContain('amount 原值')
  expect(raw).toContain('50.000000%')
  expect(raw).toContain('原值 0.5')
  expect(raw).toContain('原始响应 JSON')
})

test('overall conclusions distinguish custom players, failures, missing requests and priority review links', () => {
  const { session, meta, runs } = fixture()
  const partial = horizontalResults(meta, session, runs.slice(0, -1))
  const view = comparisonOverview(partial)
  expect(view).toContain('总体结论')
  expect(view).toContain('6 / 8')
  expect(view).toContain('失败 1 次 · 未完成 1 次')
  expect(view).toContain('完整可比场景')
  expect(view).toContain('不套用预设三风格的方向判定')
  expect(view).not.toContain('条场景概率方向符合预期')
  expect(view).toContain('优先复核 · 1 条')
  expect(view).toContain('href="#scene-P02"')
  const escaped = comparisonOverview({
    ...partial,
    styles: partial.styles.map((p) => ({ ...p, label: '<script>危险</script>' })),
  })
  expect(escaped).not.toContain('<script>危险</script>')
  expect(escaped).toContain('&lt;script&gt;危险&lt;/script&gt;')
})

test('overall conclusions do not infer visible style differences from absent or near-identical results', () => {
  const { session, meta, runs } = fixture()
  const selectedMeta = { ...meta, players: meta.players.slice(0, 3) }
  const selectedSession = { ...session, plan: session.plan.filter((p) => p.style !== 'extra') }
  const standard = horizontalResults(
    selectedMeta,
    selectedSession,
    runs.filter((r) => r.style !== 'extra')
  )
  expect(standard.counts.same).toBe(1)
  expect(comparisonOverview(standard)).toContain('本组场景的方向指标差异不明显')
  expect(comparisonOverview(standard)).toContain('概率方向符合预期')
  const empty = comparisonOverview(horizontalResults(selectedMeta, selectedSession, []))
  expect(empty).toContain('尚无有效求解结果，等待完成请求')
  expect(empty).toContain('失败 0 次 · 未完成 6 次')
  expect(empty).not.toContain('整体可见风格差异')
})

test('shared comparison filters hide matching details as well as rows and report an empty result', () => {
  const listeners = new Map<string, (event: Event) => void>()
  const fields = [
    { dataset: { wbFilter: 'search' }, value: 'missing' },
    { dataset: { wbFilter: 'stage' }, value: 'all' },
  ]
  const row = {
    dataset: {
      wbRow: 'P02',
      search: 'p02 utg as 5s',
      stage: 'preflop',
      hero: 'UTG',
      category: '未开池',
      outcome: 'ready',
    },
    hidden: false,
  }
  const detail = { hidden: false }
  const count = { textContent: '' }
  const empty = { hidden: true }
  const container = {
    querySelectorAll: (selector: string) => (selector === '[data-wb-filter]' ? fields : [row]),
    querySelector: (selector: string) => (selector === '[data-wb-count]' ? count : empty),
  }
  const document = {
    documentElement: { dataset: {} },
    addEventListener: (type: string, callback: (event: Event) => void) =>
      listeners.set(type, callback),
    getElementById: () => detail,
  }
  installComparisonInteractions(document as unknown as Document)
  const target = { matches: () => true, closest: () => container }
  listeners.get('input')!({ target } as unknown as Event)
  expect(row.hidden).toBe(true)
  expect(detail.hidden).toBe(true)
  expect(count.textContent).toBe('显示 0 / 1 个场景')
  expect(empty.hidden).toBe(false)
  fields[0].value = 'p02'
  listeners.get('input')!({ target } as unknown as Event)
  expect(row.hidden).toBe(false)
  expect(detail.hidden).toBe(false)
  expect(count.textContent).toBe('显示 1 / 1 个场景')
})
