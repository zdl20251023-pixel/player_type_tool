import Decimal from 'decimal.js'
import { buildPots, potPayouts, type TablePot } from './pots'
import type { PlayerConfig } from '../contracts/workbench'
import type { AIActionEntry } from '../contracts/lookup'

export const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
export const streets = ['preflop', 'flop', 'turn', 'river'] as const
export const add = (a: number, b: number) => new Decimal(a).plus(b).toNumber()
export const sub = (a: number, b: number) => new Decimal(a).minus(b).toNumber()
export const sum = (values: number[]) => values.reduce(add, 0)
export interface TableAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin'
  to?: number
}
export interface TablePlayer {
  seat: number
  position: string
  config: PlayerConfig
  cards: string[]
  initial: number
  stack: number
  contribution: number
  streetContribution: number
  folded: boolean
  pending: boolean
  actedAt: number | null
  preflopActed: boolean
  vpip: boolean
  pfr: boolean
  sawFlop: boolean
  bets: number
  raises: number
  calls: number
  lastAction: string
}
export interface TableEvent {
  sequence: number
  type: 'deal' | 'action' | 'board' | 'settle'
  seat: number | null
  text: string
  cards?: string[]
}
export interface TableHand {
  number: number
  button: number
  players: TablePlayer[]
  deck: string[]
  board: string[]
  burned: string[]
  street: number
  highest: number
  lastRaise: number
  actor: number | null
  entries: AIActionEntry[]
  complete: boolean
  showdown: boolean
  pots: TablePot[]
  awards: number[]
  refunds: number[]
  ranks: (string | null)[]
  events: TableEvent[]
  actions: number
}
export function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let x = state
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffled(seed: number) {
  const deck = [...'23456789TJQKA'].flatMap((rank) => [...'cdhs'].map((suit) => rank + suit))
  const rng = random(seed)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
export function compareRanks(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0)
    if (delta) {
      return delta
    }
  }
  return 0
}
export function rankCards(cards: string[]) {
  if (
    cards.length < 5 ||
    cards.length > 7 ||
    new Set(cards).size !== cards.length ||
    cards.some((c) => !/^[2-9TJQKA][cdhs]$/.test(c))
  ) {
    throw new Error('牌型计算需要 5..7 张不重复牌')
  }
  const values = cards.map((c) => '23456789TJQKA'.indexOf(c[0]) + 2)
  const counts = new Map<number, number>()
  for (const n of values) {
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }
  const descending = [...counts.keys()].sort((a, b) => b - a)
  const ofCount = (n: number) => descending.filter((r) => counts.get(r)! >= n)
  const straight = (ranks: number[]) => {
    const set = new Set(ranks)
    if (set.has(14)) {
      set.add(1)
    }
    for (let high = 14; high >= 5; high--) {
      if ([0, 1, 2, 3, 4].every((d) => set.has(high - d))) {
        return high
      }
    }
    return 0
  }
  const flushSuit = [...'cdhs'].find((s) => cards.filter((c) => c[1] === s).length >= 5)
  const flush = flushSuit
    ? cards
        .filter((c) => c[1] === flushSuit)
        .map((c) => '23456789TJQKA'.indexOf(c[0]) + 2)
        .sort((a, b) => b - a)
    : []
  let rank: number[]
  let name: string
  if (flush.length && straight(flush)) {
    rank = [8, straight(flush)]
    name = '同花顺'
  } else if (ofCount(4).length) {
    const r = ofCount(4)[0]
    rank = [7, r, descending.find((n) => n !== r)!]
    name = '四条'
  } else if (ofCount(3).some((r) => ofCount(2).some((p) => p !== r))) {
    const r = ofCount(3)[0]
    rank = [6, r, ofCount(2).find((p) => p !== r)!]
    name = '葫芦'
  } else if (flush.length) {
    rank = [5, ...flush.slice(0, 5)]
    name = '同花'
  } else if (straight(descending)) {
    rank = [4, straight(descending)]
    name = '顺子'
  } else if (ofCount(3).length) {
    const r = ofCount(3)[0]
    rank = [3, r, ...descending.filter((n) => n !== r).slice(0, 2)]
    name = '三条'
  } else if (ofCount(2).length >= 2) {
    const pairs = ofCount(2).slice(0, 2)
    rank = [2, ...pairs, descending.find((n) => !pairs.includes(n))!]
    name = '两对'
  } else if (ofCount(2).length) {
    const r = ofCount(2)[0]
    rank = [1, r, ...descending.filter((n) => n !== r).slice(0, 3)]
    name = '一对'
  } else {
    rank = [0, ...descending.slice(0, 5)]
    name = '高牌'
  }
  return { rank, name }
}
function event(
  hand: TableHand,
  type: TableEvent['type'],
  text: string,
  seat: number | null = null,
  cards?: string[]
) {
  hand.events.push({ sequence: hand.events.length, type, text, seat, ...(cards ? { cards } : {}) })
}
function pay(p: TablePlayer, amount: number) {
  p.stack = sub(p.stack, amount)
  p.contribution = add(p.contribution, amount)
  p.streetContribution = add(p.streetContribution, amount)
}
export function newHand(
  number: number,
  button: number,
  configs: PlayerConfig[],
  stacks: number[],
  seed: number,
  deck = shuffled(seed)
): TableHand {
  if (
    !Number.isInteger(button) ||
    button < 0 ||
    button > 5 ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    configs.length !== 6 ||
    stacks.length !== 6 ||
    stacks.some((s) => !Number.isSafeInteger(s) || s <= 0) ||
    deck.length !== 52 ||
    new Set(deck).size !== 52 ||
    deck.some((c) => !/^[2-9TJQKA][cdhs]$/.test(c))
  ) {
    throw new Error('六人桌需要合法筹码及完整不重复的牌堆')
  }
  const players = configs.map((config, seat): TablePlayer => ({
    seat,
    position: positions[(seat - button + 6) % 6],
    config: structuredClone(config),
    cards: [],
    initial: stacks[seat],
    stack: stacks[seat],
    contribution: 0,
    streetContribution: 0,
    folded: false,
    pending: true,
    actedAt: null,
    preflopActed: false,
    vpip: false,
    pfr: false,
    sawFlop: false,
    bets: 0,
    raises: 0,
    calls: 0,
    lastAction: '',
  }))
  const hand: TableHand = {
    number,
    button,
    players,
    deck: [...deck],
    board: [],
    burned: [],
    street: 0,
    highest: 100,
    lastRaise: 100,
    actor: null,
    entries: [],
    complete: false,
    showdown: false,
    pots: [],
    awards: Array<number>(6).fill(0),
    refunds: Array<number>(6).fill(0),
    ranks: Array<string | null>(6).fill(null),
    events: [],
    actions: 0,
  }
  for (let round = 0; round < 2; round++) {
    for (let offset = 1; offset <= 6; offset++) {
      players[(button + offset) % 6].cards.push(hand.deck.shift()!)
    }
  }
  for (const [offset, blind] of [
    [1, 50],
    [2, 100],
  ]) {
    const p = players[(button + offset) % 6]
    pay(p, Math.min(blind, p.stack))
    p.lastAction = offset === 1 ? '小盲' : '大盲'
  }
  event(hand, 'deal', `第 ${number} 手 · BTN 座位 ${button + 1} · 发底牌并支付盲注`)
  chooseActor(hand, (button + 2) % 6)
  return hand
}
export function legalActions(hand: TableHand) {
  if (hand.complete || hand.actor === null) {
    throw new Error('当前没有待行动玩家')
  }
  const p = hand.players[hand.actor]
  const owed = Math.max(0, sub(hand.highest, p.streetContribution))
  const maxTo = add(p.streetContribution, p.stack)
  const reopened = p.actedAt === null || sub(hand.highest, p.actedAt) >= hand.lastRaise
  const canRaise =
    reopened &&
    maxTo > hand.highest &&
    hand.players.some((o) => o.seat !== p.seat && !o.folded && o.stack > 0)
  return {
    owed,
    call: Math.min(owed, p.stack),
    check: owed === 0,
    minTo: add(hand.highest, hand.lastRaise),
    maxTo,
    canRaise,
  }
}
function chooseActor(hand: TableHand, after: number) {
  const live = hand.players.filter((p) => !p.folded)
  const actionable = live.filter((p) => p.stack > 0)
  if (
    live.length === 1 ||
    !actionable.length ||
    (actionable.length === 1 && actionable[0].streetContribution >= hand.highest)
  ) {
    hand.actor = null
    return
  }
  for (let offset = 1; offset <= 6; offset++) {
    const p = hand.players[(after + offset) % 6]
    if (!p.folded && p.stack > 0 && p.pending) {
      hand.actor = p.seat
      return
    }
  }
  hand.actor = null
}
export function applyAction(hand: TableHand, action: TableAction) {
  const legal = legalActions(hand),
    p = hand.players[hand.actor!]
  const opening = hand.highest === 0
  if (!['fold', 'check', 'call', 'bet', 'raise', 'allin'].includes(action.type)) {
    throw new Error('未知动作')
  }
  const target = action.type === 'allin' ? legal.maxTo : action.to
  if (action.type === 'allin' && action.to !== undefined && action.to !== legal.maxTo) {
    throw new Error('全下金额不一致')
  }
  const aggressive =
    action.type === 'bet' ||
    action.type === 'raise' ||
    (action.type === 'allin' && legal.maxTo > hand.highest)
  let amount = 0
  if (action.type === 'check' && !legal.check) {
    throw new Error('存在待跟注金额，不能过牌')
  }
  if (action.type === 'call' && legal.owed === 0) {
    throw new Error('无待跟注金额，应过牌')
  }
  if (aggressive) {
    if (
      !legal.canRaise ||
      !Number.isSafeInteger(target) ||
      target! <= hand.highest ||
      target! > legal.maxTo
    ) {
      throw new Error('加注权限或金额无效')
    }
    if (action.type === 'bet' && hand.highest !== 0) {
      throw new Error('已有下注，应使用加注')
    }
    if (action.type === 'raise' && hand.highest === 0) {
      throw new Error('无人下注，应使用下注')
    }
    if (target! < legal.minTo && target !== legal.maxTo) {
      throw new Error('未达到最小完整加注，只有全下可不足额')
    }
    amount = sub(target!, p.streetContribution)
  } else if (action.type === 'call' || action.type === 'allin') {
    amount = legal.call
  }
  // Validation above is atomic: rejected actions never alter the hand.
  if (hand.street === 0) {
    p.preflopActed = true
  }
  if (action.type === 'fold') {
    p.folded = true
  }
  if (amount) {
    pay(p, amount)
    if (hand.street === 0) {
      p.vpip = true
    }
  }
  if (aggressive) {
    const increase = sub(target!, hand.highest)
    if (increase >= hand.lastRaise) {
      hand.lastRaise = increase
    }
    hand.highest = target!
    for (const other of hand.players) {
      if (
        other.seat !== p.seat &&
        !other.folded &&
        other.stack > 0 &&
        other.streetContribution < hand.highest
      ) {
        other.pending = true
      }
    }
    if (hand.street === 0) {
      p.pfr = true
    } else if (opening) {
      p.bets++
    } else {
      p.raises++
    }
  } else if (hand.street > 0 && amount > 0) {
    p.calls++
  }
  p.pending = false
  p.actedAt = action.type === 'check' && hand.highest === 0 ? null : hand.highest
  const allin = p.stack === 0 && amount > 0
  p.lastAction =
    action.type === 'fold'
      ? '弃牌'
      : action.type === 'check'
        ? '过牌'
        : `${allin ? '全下 ' : aggressive ? (action.type === 'bet' ? '下注 ' : '加注到 ') : '跟注 '}${new Decimal(aggressive ? target! : amount).div(100).toString()}BB`
  const historyType = allin ? 'allin' : action.type
  hand.entries.push({
    seat_no: p.seat,
    action: historyType,
    amount: allin || aggressive ? p.streetContribution : 0,
  })
  hand.actions++
  event(hand, 'action', `${p.position} / ${p.config.label} ${p.lastAction}`, p.seat)
  chooseActor(hand, p.seat)
  assertConservation(hand)
}
function refundUncalled(hand: TableHand, street = false) {
  const key = street ? 'streetContribution' : 'contribution'
  const sorted = [...hand.players].sort((a, b) => b[key] - a[key])
  if (sorted[0][key] > sorted[1][key]) {
    const refund = sub(sorted[0][key], sorted[1][key])
    sorted[0].stack = add(sorted[0].stack, refund)
    sorted[0].contribution = sub(sorted[0].contribution, refund)
    sorted[0].streetContribution = sub(
      sorted[0].streetContribution,
      Math.min(refund, sorted[0].streetContribution)
    )
    hand.refunds[sorted[0].seat] = add(hand.refunds[sorted[0].seat], refund)
  }
}
function settle(hand: TableHand) {
  refundUncalled(hand)
  const live = hand.players.filter((p) => !p.folded)
  hand.showdown = live.length > 1
  const ranked = new Map(
    live.map((p) => [p.seat, hand.showdown ? rankCards([...p.cards, ...hand.board]) : null])
  )
  for (const p of live) {
    hand.ranks[p.seat] = ranked.get(p.seat)?.name ?? '其他玩家弃牌'
  }
  for (const pot of buildPots(hand.players)) {
    const eligible = pot.eligible.map((seat) => hand.players[seat])
    if (!eligible.length) {
      throw new Error('底池不存在有效赢家')
    }
    let winners = eligible.map((p) => p.seat)
    if (hand.showdown) {
      const best = eligible
        .map((p) => ranked.get(p.seat)!)
        .sort((a, b) => compareRanks(b.rank, a.rank))[0]
      winners = winners.filter((seat) => compareRanks(ranked.get(seat)!.rank, best.rank) === 0)
    }
    const payouts = potPayouts({ ...pot, winners }, hand.button)
    for (const { seat, amount } of payouts) {
      hand.awards[seat] = add(hand.awards[seat], amount)
      hand.players[seat].stack = add(hand.players[seat].stack, amount)
    }
    hand.pots.push({ ...pot, winners, payouts })
  }
  hand.complete = true
  hand.actor = null
  event(
    hand,
    'settle',
    hand.players
      .filter((p) => hand.awards[p.seat] > 0)
      .map(
        (p) =>
          `${p.position} ${p.config.label} 获得 ${new Decimal(hand.awards[p.seat]).div(100).toString()}BB（${hand.ranks[p.seat]}）`
      )
      .join('；')
  )
  assertConservation(hand)
}
export function advanceHand(hand: TableHand) {
  if (hand.complete || hand.actor !== null) {
    return
  }
  refundUncalled(hand, true)
  assertConservation(hand)
  if (hand.players.filter((p) => !p.folded).length === 1 || hand.street === 3) {
    settle(hand)
    return
  }
  hand.burned.push(hand.deck.shift()!)
  const cards = hand.deck.splice(0, hand.street === 0 ? 3 : 1)
  hand.board.push(...cards)
  hand.street++
  hand.highest = 0
  hand.lastRaise = 100
  hand.entries.push({ seat_no: -1, action: cards.join(''), amount: 0 })
  for (const p of hand.players) {
    p.streetContribution = 0
    p.actedAt = null
    p.pending = !p.folded && p.stack > 0
    if (hand.street === 1 && !p.folded) {
      p.sawFlop = true
    }
  }
  event(
    hand,
    'board',
    `发出${['', '翻牌', '转牌', '河牌'][hand.street]}：${cards.join(' ')}`,
    null,
    cards
  )
  chooseActor(hand, hand.button)
}
export function assertConservation(hand: TableHand) {
  const initial = sum(hand.players.map((p) => p.initial))
  const actual = sum(hand.players.map((p) => add(p.stack, hand.complete ? 0 : p.contribution)))
  if (
    initial !== actual ||
    hand.players.some((p) => !Number.isSafeInteger(p.stack) || p.stack < 0)
  ) {
    throw new Error('筹码守恒检查失败')
  }
}
export function replayTableHand(hand: TableHand, seed: number) {
  const replay = newHand(
    hand.number,
    hand.button,
    hand.players.map((p) => p.config),
    hand.players.map((p) => p.initial),
    seed
  )
  for (const entry of hand.entries) {
    if (entry.seat_no === -1) {
      if (replay.actor !== null) {
        throw new Error('重放校验：下注轮尚未结束')
      }
      const count = replay.board.length
      advanceHand(replay)
      if (replay.board.slice(count).join('') !== entry.action) {
        throw new Error('重放校验：发牌与种子不一致')
      }
    } else {
      if (replay.actor !== entry.seat_no) {
        throw new Error('重放校验：行动位置不一致')
      }
      applyAction(replay, {
        type: entry.action as TableAction['type'],
        ...(['raise', 'bet', 'allin'].includes(entry.action)
          ? { to: entry.amount ?? undefined }
          : {}),
      })
    }
  }
  const state = (h: TableHand) =>
    JSON.stringify({
      actor: h.actor,
      board: h.board,
      highest: h.highest,
      lastRaise: h.lastRaise,
      players: h.players.map((p) => ({
        cards: p.cards,
        stack: p.stack,
        contribution: p.contribution,
        street: p.streetContribution,
        folded: p.folded,
        pending: p.pending,
        actedAt: p.actedAt,
      })),
    })
  if (state(replay) !== state(hand)) {
    throw new Error('重放校验：检查点与历史不一致，未发送请求')
  }
}
