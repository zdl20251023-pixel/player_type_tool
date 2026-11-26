import Decimal from 'decimal.js'
import type { TableHand, TablePlayer } from './engine'

export interface PotPayout {
  seat: number
  amount: number
}
export interface TablePot {
  amount: number
  eligible: number[]
  winners: number[]
  payouts?: PotPayout[]
}
export const PAYOUT_POT_MS = 1100

export function potPayouts(pot: Pick<TablePot, 'amount' | 'winners'>, button: number): PotPayout[] {
  if (!pot.winners.length) {
    return []
  }
  const winners = [...pot.winners].sort((a, b) => ((a - button + 5) % 6) - ((b - button + 5) % 6))
  const share = new Decimal(pot.amount).div(winners.length).floor()
  const remainder = new Decimal(pot.amount).mod(winners.length).toNumber()
  return winners.map((seat, i) => ({ seat, amount: share.plus(i < remainder ? 1 : 0).toNumber() }))
}
function merge(pots: TablePot[]): TablePot[] {
  const result: TablePot[] = []
  for (const pot of pots) {
    const last = result.at(-1)
    if (
      last &&
      JSON.stringify([last.eligible, last.winners]) === JSON.stringify([pot.eligible, pot.winners])
    ) {
      last.amount = new Decimal(last.amount).plus(pot.amount).toNumber()
      if (last.payouts && pot.payouts) {
        for (const payout of pot.payouts) {
          const previous = last.payouts.find((p) => p.seat === payout.seat)
          if (previous) {
            previous.amount = new Decimal(previous.amount).plus(payout.amount).toNumber()
          } else {
            last.payouts.push({ ...payout })
          }
        }
      }
    } else {
      result.push(structuredClone(pot))
    }
  }
  return result
}
// Folded money remains in the pot; equal eligibility means one pot, not another side pot.
export function buildPots(
  players: Pick<TablePlayer, 'seat' | 'contribution' | 'folded' | 'stack'>[],
  preview = false
): TablePot[] {
  const highest = Math.max(0, ...players.map((p) => p.contribution))
  const caps = [
    ...new Set(
      preview
        ? [...players.filter((p) => !p.folded && p.stack === 0).map((p) => p.contribution), highest]
        : players.map((p) => p.contribution)
    ),
  ]
    .filter((n) => n > 0 && n <= highest)
    .sort((a, b) => a - b)
  let previous = 0
  const pots: TablePot[] = []
  for (const cap of caps) {
    const amount = Decimal.sum(
      ...players.map((p) => Decimal.max(0, Decimal.min(p.contribution, cap).minus(previous)))
    ).toNumber()
    previous = cap
    if (!amount) {
      continue
    }
    const eligible = players
      .filter((p) => !p.folded && (p.contribution >= cap || (preview && p.stack > 0)))
      .map((p) => p.seat)
    pots.push({ amount, eligible, winners: [] })
  }
  return merge(pots)
}
export function tablePotState(hand: TableHand) {
  if (hand.complete) {
    const pots = merge(
      hand.pots.map((p) => ({ ...p, payouts: p.payouts ?? potPayouts(p, hand.button) }))
    )
    return {
      pots,
      total: Decimal.sum(0, ...pots.map((p) => p.amount)).toNumber(),
      pending: null as { seat: number; amount: number; refund: boolean } | null,
    }
  }
  const players = hand.players.map((p) => ({ ...p }))
  const sorted = [...players].sort((a, b) => b.streetContribution - a.streetContribution)
  const unmatched = new Decimal(sorted[0].streetContribution)
    .minus(sorted[1].streetContribution)
    .toNumber()
  const pending =
    unmatched > 0 ? { seat: sorted[0].seat, amount: unmatched, refund: hand.actor === null } : null
  if (pending) {
    players[pending.seat].contribution = new Decimal(players[pending.seat].contribution)
      .minus(pending.amount)
      .toNumber()
  }
  return {
    pots: buildPots(players, true),
    total: Decimal.sum(0, ...hand.players.map((p) => p.contribution)).toNumber(),
    pending,
  }
}
export function payoutPlan(hand: TableHand) {
  const pots = tablePotState(hand).pots
  return pots.map((pot, index) => ({
    index,
    name: index === 0 ? '主池' : `边池 ${index}`,
    amount: pot.amount,
    payouts: pot.payouts ?? potPayouts(pot, hand.button),
    startMs: index * PAYOUT_POT_MS,
    endMs: (index + 1) * PAYOUT_POT_MS,
  }))
}
export function payoutDuration(hand: TableHand) {
  return hand.complete ? payoutPlan(hand).length * PAYOUT_POT_MS + 350 : 0
}
