import Decimal from 'decimal.js'
import { record, responseProblem } from '../analysis/strategy'
import { profileProblem } from '../storage/session'
import { buildRequest } from '../scenarios'
import {
  applyAction,
  legalActions,
  random,
  streets,
  type TableAction,
  type TableHand,
} from '../table/engine'
import type { AIRequestBody } from '../contracts/lookup'

export function tableRequest(hand: TableHand, runId: string): AIRequestBody {
  if (hand.actor === null) {
    throw new Error('无当前行动玩家')
  }
  const canonical = (seat: number) => (seat - hand.button + 6) % 6
  const actor = hand.players[hand.actor]
  const profile = hand.street === 0 ? actor.config.preflop : actor.config.postflop
  return buildRequest(
    {
      id: `h${hand.number}`,
      description: '六人 AI 对战',
      street: streets[hand.street],
      hero: canonical(actor.seat),
      category: '牌桌体验',
      history: '',
      hand: {
        gameuuid: `${runId}-h${hand.number}`,
        roomid: `table-${runId}`,
        game_type: "No-Limit Hold'em",
        game_type_code: 'nlhe',
        game_mode_code: 'normal',
        players: hand.players
          .map((p) => ({
            seat_no: canonical(p.seat),
            stack: p.initial,
            ...(p.seat === actor.seat ? { hole_cards: p.cards.join('') } : {}),
          }))
          .sort((a, b) => a.seat_no - b.seat_no),
        big_blind: 100,
        ante: 0,
        dealer_seat: 0,
        sb_seat: 1,
        bb_seat: 2,
        straddle_seat: -1,
        post_seats: [],
        actions: {
          entries: hand.entries.map((a) => ({
            ...a,
            seat_no: a.seat_no === -1 ? -1 : canonical(a.seat_no!),
          })),
          pot_sizings: false,
          big_blind_sizings: false,
          big_blind_size: 100,
        },
      },
    },
    profile,
    `${runId}-h${hand.number}-a${hand.actions}`
  )
}
export function sampleTableAction(
  hand: TableHand,
  request: AIRequestBody,
  response: unknown,
  seed: number
) {
  const root = record(response),
    strategy = record(root.strategy)
  // Table decisions only require probabilities. Some solver sources omit EV;
  // validate the remaining schema without inventing values in the saved response.
  const schemaInput = Array.isArray(strategy.actions)
    ? {
        ...root,
        strategy: {
          ...strategy,
          actions: (strategy.actions as unknown[]).map((value) => {
            const entry = record(value)
            return { ...entry, hand_ev: entry.hand_ev ?? 0 }
          }),
        },
      }
    : response
  const problem =
    responseProblem(schemaInput) ??
    profileProblem(response, {
      id: 'table',
      scenario: 'table',
      description: '',
      style: hand.players[hand.actor!].config.id,
      profile: String(request.strategy_profile!.target_profile_name),
      repeat: 1,
      request,
    })
  if (problem) {
    throw new Error(problem)
  }
  const candidates = record(record(response).strategy).actions as unknown[]
  const parsed = candidates.map((candidate) => {
    const entry = record(candidate),
      a = record(entry.action)
    const type = a.action as TableAction['type']
    const action: TableAction = {
      type,
      ...(['raise', 'bet', 'allin'].includes(type) ? { to: Number(a.amount) } : {}),
    }
    const probability = new Decimal(Number(entry.hand_strategy))
    if (probability.gt(0)) {
      if (['raise', 'bet', 'allin'].includes(type) && !Number.isSafeInteger(action.to)) {
        throw new Error('接口动作金额不是整数筹码')
      }
      if (type === 'allin' && action.to !== legalActions(hand).maxTo) {
        throw new Error('接口全下金额与当前街总筹码不符')
      }
      applyAction(structuredClone(hand), action)
    }
    return { action, probability }
  })
  const total = Decimal.sum(...parsed.map((p) => p.probability))
  if (total.lte(0) || total.minus(1).abs().gt(0.02)) {
    throw new Error('策略概率总和无效，停止推进并保留原响应')
  }
  const draw = new Decimal(random(seed)()).mul(total)
  let cumulative = new Decimal(0)
  for (const item of parsed) {
    cumulative = cumulative.plus(item.probability)
    if (draw.lt(cumulative)) {
      return item.action
    }
  }
  return parsed.findLast((p) => p.probability.gt(0))!.action
}
