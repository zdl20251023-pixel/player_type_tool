import { expect, test } from 'bun:test'
import { compare, responseProblem, shape } from '../src/analysis/strategy'
import {
  buildRequest,
  scenarios,
  representativeScenarios,
  styles,
  profileFor,
  entry,
} from '../src/scenarios'
import { validateScenario } from '../src/scenarios/validate'
import { styleSummary, verdict } from '../src/reports/markdown-summary'

const action = (type: string, probability: number, ev = 1, amount: number | null = null) => ({
  action: { action: type, amount, pot_size: null, seat_no: 0 },
  hand_strategy: probability,
  hand_ev: ev,
})
const response = (actions: unknown[]) => ({ strategy: { actions } })

test('representative routes replay to the expected pot, call and remaining stack', () => {
  expect(representativeScenarios.map(validateScenario)).toEqual([
    { hero: 0, board: [], potBb: 14, toCallBb: 8.5, stackBb: 97.5 },
    { hero: 2, board: ['Qh', '9h', '2c'], potBb: 9, toCallBb: 3.5, stackBb: 97.5 },
    { hero: 2, board: ['As', '8c', '4d', '6s', '2h'], potBb: 53.5, toCallBb: 30, stackBb: 88.5 },
  ])
})

test('100 legal 6-max 100BB fixtures cover fifty preflop and fifty postflop decisions', () => {
  expect(scenarios).toHaveLength(100)
  expect(new Set(scenarios.map((s) => s.id)).size).toBe(100)
  expect(scenarios.filter((s) => s.street === 'preflop')).toHaveLength(50)
  expect(scenarios.filter((s) => s.street !== 'preflop')).toHaveLength(50)
  expect(scenarios.filter((s) => s.street === 'flop')).toHaveLength(24)
  expect(scenarios.filter((s) => s.street === 'turn')).toHaveLength(16)
  expect(scenarios.filter((s) => s.street === 'river')).toHaveLength(10)
  for (const scenario of scenarios) {
    expect(validateScenario(scenario).hero).toBe(scenario.hero)
    for (const style of styles) {
      expect(profileFor(style, scenario.street)).toBe(
        scenario.street === 'preflop' ? style.preflop : style.postflop
      )
    }
  }
  expect(validateScenario(scenarios.find((s) => s.id === 'T01')!)).toMatchObject({
    potBb: 15.5,
    toCallBb: 6,
    stackBb: 95.5,
  })
  expect(validateScenario(scenarios.find((s) => s.id === 'R02')!)).toMatchObject({
    potBb: 21.5,
    toCallBb: 0,
    stackBb: 89.5,
  })
  expect(validateScenario(scenarios.find((s) => s.id === 'P45')!).toCallBb).toBe(0)
})

test('fixture replay rejects wrong order, illegal raises, unfinished betting and duplicated cards', () => {
  const wrongOrder = structuredClone(scenarios[0])
  wrongOrder.hand.actions.entries = [entry(4, 'fold')]
  expect(() => validateScenario(wrongOrder)).toThrow('行动顺序')
  const smallRaise = structuredClone(scenarios[0])
  smallRaise.hand.actions.entries = [entry(3, 'raise', 150)]
  expect(() => validateScenario(smallRaise)).toThrow('最小合法尺寸')
  const unfinished = structuredClone(scenarios[0])
  unfinished.hand.actions.entries = [entry(-1, 'AcQdJd')]
  expect(() => validateScenario(unfinished)).toThrow('下注轮未结束')
  const duplicate = structuredClone(scenarios.find((s) => s.id === 'F05')!)
  duplicate.hand.players[2].hole_cards = 'QhJd'
  expect(() => validateScenario(duplicate)).toThrow('重复牌张')
  const overStack = structuredClone(scenarios[0])
  overStack.hand.actions.entries = [entry(3, 'raise', 10100)]
  expect(() => validateScenario(overStack)).toThrow('超额下注')
})

test('summary does not label missing requests as style-consistent', () => {
  expect(styleSummary([scenarios[0]], [])).toContain('数据不全 1 条')
})

test('near-pure folds do not produce false reversals from an unstable conditional ratio', () => {
  const make = (fold: number, call: number, raise: number) => [
    {
      id: 'x',
      scenario: 'P25',
      profile: 'x',
      style: 'x',
      repeat: 1,
      ok: true,
      elapsedMs: 1,
      problem: null,
      response: response([action('fold', fold), action('call', call), action('raise', raise)]),
    },
  ]
  const groups = [
    make(0.97634, 0.023659, 0.000001),
    make(1, 0.00000004, 0),
    make(0.999836, 0.000163, 0.000001),
  ]
  expect(
    verdict(
      scenarios.find((s) => s.id === 'P25')!,
      groups
    )
  ).toBe('概率方向符合预期')
})

test('only strategy_profile differs between controlled requests and hand data is isolated', () => {
  for (const scenario of scenarios) {
    const baseline = buildRequest(scenario, undefined, 'same-id')
    const { strategy_profile, ...rest } = buildRequest(scenario, 'gto', 'same-id')
    expect(strategy_profile).toEqual({ target_profile_name: 'gto' })
    expect(rest).toEqual(baseline)
    expect(baseline).not.toHaveProperty('request_profile')
    expect(baseline.hand).not.toBe(scenario.hand)
  }
})

test('aligns actions regardless of order; missing action EV stays null; uses exact decimal deltas', () => {
  const base = response([action('fold', 0.3), action('raise', 0.7, 2, 300)])
  const next = response([action('raise', 0.8, 2.1, 300), action('call', 0.2)])
  const result = compare(base, next)
  expect(result.rows.find((row) => row.presence === 'removed')).toMatchObject({
    deltaPp: -30,
    deltaEv: null,
  })
  expect(result.rows.find((row) => row.presence === 'added')).toMatchObject({
    deltaPp: 20,
    baseEv: null,
  })
  expect(result.rows.find((row) => row.presence === 'both')).toMatchObject({
    deltaPp: 10,
    deltaEv: 0.1,
  })
  expect(compare(base, response([...base.strategy.actions].reverse())).maxProbabilityDeltaPp).toBe(
    0
  )
})

test('reports null/type/missing changes without treating array lengths as schema changes', () => {
  expect(shape([{ x: null }, { x: 1 }])).toEqual(shape([{ x: 1 }, { x: null }, { x: 1 }]))
  const base = { ...response([action('check', 1)]), extra: null }
  const next = { ...response([action('check', 1)]), extra: { value: 1 }, warnings: [] }
  expect(compare(base, next).schema).toContainEqual({
    path: '$.extra',
    before: 'null',
    after: 'object',
  })
  expect(compare(base, next).schema).toContainEqual({
    path: '$.warnings',
    before: 'missing',
    after: 'array',
  })
})

test('rejects HTTP 200 engine errors, empty/invalid strategies and duplicate action keys', () => {
  const valid = response([action('check', 1)])
  expect(responseProblem(valid)).toBeNull()
  expect(responseProblem({ ...valid, error: 'engine failure' })).not.toBeNull()
  expect(
    responseProblem({ ...valid, solution_information: { errors: ['invalid profile'] } })
  ).not.toBeNull()
  expect(responseProblem(response([]))).not.toBeNull()
  expect(responseProblem(response([action('check', NaN)]))).not.toBeNull()
  expect(responseProblem(response([action('check', 1, null as unknown as number)]))).not.toBeNull()
  expect(responseProblem(response([action('check', 0.5), action('check', 0.5)]))).not.toBeNull()
})

test('retains model and profile diagnostics for attribution', () => {
  const base = response([action('check', 1)])
  const next = {
    ...base,
    solution_information: {
      source: 'model-b',
      strategy_profile_config: { strategy_config_name: 'gto' },
    },
  }
  expect(compare(base, next)).toMatchObject({
    sourceChanged: true,
    after: { profileConfig: { strategy_config_name: 'gto' } },
  })
})
