import Decimal from 'decimal.js'
import type { ScenarioType } from './index'

// 仅校验本实验使用的完整加注、非 all-in 历史；不替代生产牌桌引擎。
export function validateScenario(scenario: ScenarioType) {
  const { hand, hero } = scenario
  const fail = (message: string): never => {
    throw new Error(`${scenario.id}: ${message}`)
  }
  if (
    hand.players.length !== 6 ||
    hand.big_blind !== 100 ||
    hand.ante !== 0 ||
    hand.straddle_seat !== -1 ||
    hand.post_seats.length ||
    hand.dealer_seat !== 0 ||
    hand.sb_seat !== 1 ||
    hand.bb_seat !== 2
  ) {
    fail('必须为固定座位的 6 人无前注无抓注桌')
  }
  if (hand.actions.pot_sizings || hand.actions.big_blind_sizings) {
    fail('必须采用筹码金额编码')
  }
  const seen = new Set<string>()
  const addCards = (cards: string, count: number) => {
    if (!new RegExp(`^(?:[2-9TJQKA][cdhs]){${count}}$`).test(cards)) {
      fail(`牌张编码非法：${cards}`)
    }
    for (const card of cards.match(/../g) ?? []) {
      if (seen.has(card)) {
        fail(`重复牌张：${card}`)
      }
      seen.add(card)
    }
  }
  for (let seat = 0; seat < 6; seat++) {
    const player = hand.players[seat]
    if (player.seat_no !== seat || player.stack !== 10000) {
      fail('座位或初始 100BB 配置不正确')
    }
    if (seat === hero) {
      addCards(player.hole_cards ?? '', 2)
    } else if (player.hole_cards) {
      fail('仅设置待决策玩家底牌')
    }
  }
  const stacks = [10000, 9950, 9900, 10000, 10000, 10000]
  let committed = [0, 50, 100, 0, 0, 0]
  const active = new Set([0, 1, 2, 3, 4, 5])
  let pending = new Set(active)
  let next = 3
  let highest = 100
  let minimumRaise = 100
  let pot = new Decimal(150)
  const board: string[] = []
  let streetIndex = 0
  const advance = (from: number) => {
    for (let i = 1; i <= 6; i++) {
      if (pending.has((from + i) % 6)) {
        return (from + i) % 6
      }
    }
    return -1
  }
  for (const entry of hand.actions.entries) {
    const seat = entry.seat_no
    if (seat === -1) {
      if (pending.size || active.size < 2 || streetIndex >= 3) {
        fail('下注轮未结束或无法继续发牌')
      }
      addCards(entry.action, streetIndex === 0 ? 3 : 1)
      board.push(...(entry.action.match(/../g) ?? []))
      streetIndex++
      committed = Array<number>(6).fill(0)
      highest = 0
      minimumRaise = 100
      pending = new Set(active)
      next = advance(0)
      continue
    }
    if (seat === undefined || seat === null || seat !== next || !pending.has(seat)) {
      fail(`行动顺序错误：期望 ${next}，实际 ${seat}`)
    }
    const actor = seat as number
    const toCall = new Decimal(highest).minus(committed[actor]).toNumber()
    const amount = entry.amount ?? 0
    let pay = 0
    if (entry.action === 'fold') {
      active.delete(actor)
    } else if (entry.action === 'check') {
      if (toCall !== 0 || amount !== 0) {
        fail('存在待跟注金额时不能过牌')
      }
    } else if (entry.action === 'call') {
      if (toCall <= 0 || amount !== 0) {
        fail('Call 必须有待跟注金额且编码 amount=0')
      }
      pay = toCall
    } else if (entry.action === 'raise' || entry.action === 'bet') {
      if (
        !Number.isSafeInteger(amount) ||
        (entry.action === 'bet' ? highest !== 0 : highest === 0) ||
        amount < new Decimal(highest).plus(minimumRaise).toNumber()
      ) {
        fail('下注/加注未达到最小合法尺寸')
      }
      pay = new Decimal(amount).minus(committed[actor]).toNumber()
      minimumRaise = new Decimal(amount).minus(highest).toNumber()
      highest = amount
      pending = new Set(active)
    } else {
      fail(`不支持的历史动作：${entry.action}`)
    }
    if (pay >= stacks[actor]) {
      fail('本实验历史不使用 all-in 或超额下注')
    }
    stacks[actor] = new Decimal(stacks[actor]).minus(pay).toNumber()
    committed[actor] = new Decimal(committed[actor]).plus(pay).toNumber()
    pot = pot.plus(pay)
    pending.delete(actor)
    next = advance(actor)
  }
  if (active.size < 2 || next !== hero || !pending.has(hero)) {
    fail('历史必须截止到 Hero 的有效决策点')
  }
  if (['preflop', 'flop', 'turn', 'river'][streetIndex] !== scenario.street) {
    fail('街道与公共牌不一致')
  }
  return {
    hero,
    board,
    potBb: pot.div(100).toNumber(),
    toCallBb: new Decimal(highest).minus(committed[hero]).div(100).toNumber(),
    stackBb: new Decimal(stacks[hero]).div(100).toNumber(),
  }
}
