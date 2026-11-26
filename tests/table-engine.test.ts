import { expect, test } from 'bun:test'
import {
  newHand,
  applyAction,
  advanceHand,
  legalActions,
  shuffled,
  random,
  assertConservation,
  rankCards,
  compareRanks,
  sum,
} from '../src/table/engine'
import { emptyTableStats, addTableStats, tableStatValues } from '../src/analysis/table-stats'
import { styles } from '../src/profiles/styles'
import { tablePotState, payoutPlan, potPayouts } from '../src/table/pots'
const configs = Array.from({ length: 6 }, (_, i) => ({ ...styles[i % 3], description: '规则测试' }))
const finish = (hand: ReturnType<typeof newHand>) => {
  while (!hand.complete) {
    if (hand.actor !== null) {
      applyAction(hand, { type: legalActions(hand).check ? 'check' : 'call' })
    } else {
      advanceHand(hand)
    }
  }
}

test('folded contributions stay in one main pot; unmatched raises do not invent side pots', () => {
  const h = newHand(1, 0, configs, Array<number>(6).fill(10000), 42)
  for (const a of [
    { type: 'call' },
    { type: 'raise', to: 300 },
    { type: 'fold' },
    { type: 'call' },
    { type: 'fold' },
    { type: 'call' },
    { type: 'fold' },
  ] as const) {
    applyAction(h, a)
  }
  expect(tablePotState(h).pots).toHaveLength(1)
  finish(h)
  expect(h.pots).toHaveLength(1)
  expect(h.pots[0].amount).toBe(1050)
  expect(sum(payoutPlan(h).flatMap((p) => p.payouts.map((v) => v.amount)))).toBe(1050)
  const pending = newHand(1, 0, configs, Array<number>(6).fill(10000), 44)
  applyAction(pending, { type: 'raise', to: 1000 })
  const state = tablePotState(pending)
  expect(state.pots).toHaveLength(1)
  expect(state.pending!.amount).toBe(900)
  expect(sum(state.pots.map((p) => p.amount)) + state.pending!.amount).toBe(state.total)
})

test('different stack all-ins have separate winners; each tied pot allocates its own odd chips', () => {
  const prefix = [
    'Kc',
    'Qc',
    '5c',
    '6c',
    '7c',
    'Ac',
    'Kd',
    'Qd',
    '5d',
    '6d',
    '7d',
    'Ad',
    '2c',
    '2s',
    '7h',
    '8c',
    '3c',
    '9d',
    '4c',
    'Ts',
  ]
  const deck = [...prefix, ...shuffled(1).filter((c) => !prefix.includes(c))]
  const h = newHand(1, 0, configs, [1000, 2000, 3000, 10000, 10000, 10000], 1, deck)
  for (let i = 0; i < 3; i++) {
    applyAction(h, { type: 'fold' })
  }
  applyAction(h, { type: 'allin' })
  applyAction(h, { type: 'allin' })
  applyAction(h, { type: 'call' })
  const preview = tablePotState(h)
  expect(preview.pots.map((p) => p.amount)).toEqual([3000, 2000])
  finish(h)
  expect(h.pots.map((p) => p.winners)).toEqual([[0], [1]])
  expect(h.awards).toEqual([3000, 2000, 0, 0, 0, 0])
  const plan = payoutPlan(h)
  expect(plan.map((p) => p.payouts)).toEqual([
    [{ seat: 0, amount: 3000 }],
    [{ seat: 1, amount: 2000 }],
  ])
  expect(plan[1].startMs).toBe(plan[0].endMs)
  expect(potPayouts({ amount: 101, winners: [0, 1] }, 0)).toEqual([
    { seat: 1, amount: 51 },
    { seat: 0, amount: 50 },
  ])
  expect(potPayouts({ amount: 103, winners: [0, 1] }, 0)).toEqual([
    { seat: 1, amount: 52 },
    { seat: 0, amount: 51 },
  ])
})

test('old settlement layers retain their saved distribution when combined for display', () => {
  const h = newHand(1, 0, configs, Array<number>(6).fill(10000), 11)
  h.complete = true
  h.pots = [
    { amount: 1, eligible: [0, 1, 2], winners: [0, 1, 2] },
    { amount: 1, eligible: [0, 1, 2], winners: [0, 1, 2] },
  ]
  const pots = tablePotState(h).pots
  expect(pots).toHaveLength(1)
  expect(pots[0].payouts!.find((p) => p.seat === 1)!.amount).toBe(2)
  expect(pots[0].amount).toBe(2)
})

test('dead-money tiers do not distribute odd chips repeatedly within the same tied main pot', () => {
  const prefix = [
    '2c',
    '3c',
    '4c',
    '5c',
    '6c',
    '7c',
    '8c',
    '9c',
    'Tc',
    'Jc',
    'Qc',
    'Kc',
    'Ac',
    'Ts',
    'Js',
    'Qs',
    '2d',
    'Ks',
    '3d',
    'As',
  ]
  const h = newHand(1, 0, configs, [10000, 10000, 10000, 10000, 150, 10000], 1, [
    ...prefix,
    ...shuffled(1).filter((c) => !prefix.includes(c)),
  ])
  for (const action of [
    { type: 'call' },
    { type: 'allin' },
    { type: 'fold' },
    { type: 'call' },
    { type: 'fold' },
    { type: 'call' },
    { type: 'fold' },
  ] as const) {
    applyAction(h, action)
  }
  finish(h)
  expect(h.pots).toHaveLength(1)
  expect(h.pots[0].amount).toBe(600)
  expect(h.awards).toEqual([200, 0, 200, 0, 200, 0])
})

test('seven-card evaluator handles wheel, flush kickers, double trips, three pairs and board ties', () => {
  const cases: [string, string][] = [
    ['As2d3c4h5sKdQc', '顺子'],
    ['AsKsQsJsTs2d3c', '同花顺'],
    ['AcAdAhAsKdQc2h', '四条'],
    ['AcAdAhKcKdKh2s', '葫芦'],
    ['AcJc9c7c3cKdQh', '同花'],
    ['AcAdKcKdQcQd2s', '两对'],
    ['AcAdAhKsQd9c2s', '三条'],
    ['AcAdKsQdJc9s2h', '一对'],
    ['AcKdJs9h7c5s2d', '高牌'],
  ]
  for (const [cards, name] of cases) {
    expect(rankCards(cards.match(/../g)!).name).toBe(name)
  }
  expect(
    compareRanks(
      rankCards('As2d3c4h5sKdQc'.match(/../g)!).rank,
      rankCards('2s3d4c5h6sKdQc'.match(/../g)!).rank
    )
  ).toBeLessThan(0)
  expect(rankCards('AcAdAhKcKdKh2s'.match(/../g)!).rank).toEqual([6, 14, 13])
  expect(rankCards('AcAdKcKdQcQd2s'.match(/../g)!).rank).toEqual([2, 14, 13, 12])
  expect(
    compareRanks(
      rankCards('AsKsQsJsTs2d3c'.match(/../g)!).rank,
      rankCards('AsKsQsJsTs4d5c'.match(/../g)!).rank
    )
  ).toBe(0)
})
test('incomplete all-ins only reopen betting once accumulated raises reach a full raise', () => {
  const make = () => newHand(1, 0, configs, [10000, 10000, 10000, 10000, 400, 500], 42)
  const h = make()
  applyAction(h, { type: 'raise', to: 300 })
  applyAction(h, { type: 'allin' })
  applyAction(h, { type: 'allin' })
  applyAction(h, { type: 'call' })
  applyAction(h, { type: 'fold' })
  applyAction(h, { type: 'fold' })
  expect(h.actor).toBe(3)
  expect(legalActions(h).canRaise).toBe(true)
  expect(legalActions(h).minTo).toBe(700)
  applyAction(h, { type: 'raise', to: 700 })
  expect(h.actor).toBe(0)
  const single = make()
  applyAction(single, { type: 'raise', to: 300 })
  applyAction(single, { type: 'allin' })
  applyAction(single, { type: 'fold' })
  applyAction(single, { type: 'call' })
  applyAction(single, { type: 'fold' })
  applyAction(single, { type: 'fold' })
  expect(legalActions(single).canRaise).toBe(false)
  const before = JSON.stringify(single)
  expect(() => applyAction(single, { type: 'raise', to: 600 })).toThrow()
  expect(JSON.stringify(single)).toBe(before)
  applyAction(single, { type: 'call' })
  finish(single)
  assertConservation(single)
})
test('six-way all-ins build independent side pots, return uncalled money and split a board tie', () => {
  const prefix = [
    '2c',
    '3c',
    '4c',
    '5c',
    '6c',
    '7c',
    '8c',
    '9c',
    'Tc',
    'Jc',
    'Qc',
    'Kc',
    'Ac',
    'Ts',
    'Js',
    'Qs',
    '2d',
    'Ks',
    '3d',
    'As',
  ]
  const deck = [...prefix, ...shuffled(9).filter((c) => !prefix.includes(c))]
  const stacks = [1000, 2000, 3000, 4000, 5000, 6000]
  const hand = newHand(1, 0, configs, stacks, 9, deck)
  while (hand.actor !== null) {
    applyAction(hand, { type: 'allin' })
  }
  finish(hand)
  expect(hand.board).toEqual(['Ts', 'Js', 'Qs', 'Ks', 'As'])
  expect(hand.pots.map((p) => p.eligible.length)).toEqual([6, 5, 4, 3, 2])
  expect(hand.refunds[5]).toBe(1000)
  expect(hand.players.map((p) => p.stack)).toEqual(stacks)
  expect(sum(hand.awards) + sum(hand.refunds)).toBe(sum(stacks))
  expect(hand.burned).toHaveLength(3)
})
test('walks do not count as VPIP opportunities and forced blinds do not count as voluntary investment', () => {
  const hand = newHand(1, 0, configs, Array<number>(6).fill(10000), 77)
  while (hand.actor !== null) {
    applyAction(hand, { type: 'fold' })
  }
  finish(hand)
  const stats = emptyTableStats()
  addTableStats(stats, hand)
  expect(hand.showdown).toBe(false)
  expect(hand.board).toHaveLength(0)
  expect(stats.position.BB.hands).toBe(1)
  expect(stats.position.BB.opportunities).toBe(0)
  expect(stats.position.SB.vpip).toBe(0)
  expect(stats.position.SB.pfr).toBe(0)
  expect(tableStatValues(stats.position.BB).vpipPercent).toBe('—')
  expect(sum(Object.values(stats.position).map((r) => r.profit))).toBe(0)
})

test('odd chips in tied pots go clockwise from the button independently per side pot', () => {
  const prefix = [
    '2c',
    '3c',
    '4c',
    '5c',
    '6c',
    '7c',
    '8c',
    '9c',
    'Tc',
    'Jc',
    'Qc',
    'Kc',
    'Ac',
    'Ts',
    'Js',
    'Qs',
    '2d',
    'Ks',
    '3d',
    'As',
  ]
  const deck = [...prefix, ...shuffled(1).filter((c) => !prefix.includes(c))]
  const hand = newHand(1, 0, configs, Array<number>(6).fill(10000), 1, deck)
  applyAction(hand, { type: 'call' })
  applyAction(hand, { type: 'call' })
  applyAction(hand, { type: 'fold' })
  applyAction(hand, { type: 'fold' })
  applyAction(hand, { type: 'fold' })
  applyAction(hand, { type: 'check' })
  finish(hand)
  expect(hand.awards).toEqual([0, 0, 117, 117, 116, 0])
  expect(sum(hand.awards)).toBe(350)
})
test('random legal multi-street play preserves chips and never duplicates cards across 1000 hands', () => {
  const rng = random(999)
  for (let i = 0; i < 1000; i++) {
    const hand = newHand(
      i + 1,
      i % 6,
      configs,
      Array.from({ length: 6 }, () => 50 + Math.floor(rng() * 15000)),
      i + 100
    )
    while (!hand.complete) {
      if (hand.actor === null) {
        advanceHand(hand)
        continue
      }
      const legal = legalActions(hand),
        roll = rng()
      if (roll < 0.15) {
        applyAction(hand, { type: 'fold' })
      } else if (roll < 0.3 && legal.canRaise) {
        applyAction(hand, { type: 'allin' })
      } else if (roll < 0.45 && legal.canRaise && legal.maxTo >= legal.minTo) {
        applyAction(hand, { type: hand.highest === 0 ? 'bet' : 'raise', to: legal.minTo })
      } else {
        applyAction(hand, { type: legal.check ? 'check' : 'call' })
      }
      assertConservation(hand)
      expect(hand.actions).toBeLessThan(512)
    }
    expect(
      new Set([
        ...hand.players.flatMap((p) => p.cards),
        ...hand.board,
        ...hand.burned,
        ...hand.deck,
      ]).size
    ).toBe(52)
    expect(sum(hand.players.map((p) => p.stack))).toBe(sum(hand.players.map((p) => p.initial)))
  }
}, 20000)
