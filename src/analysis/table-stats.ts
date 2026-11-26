import Decimal from 'decimal.js'
import { add, sub, type TableHand } from '../table/engine'

export interface TableStatPlayer {
  label: string
  preflop: string
  postflop: string
  hands: number
}
export interface TableStat {
  hands: number
  opportunities: number
  vpip: number
  pfr: number
  sawFlop: number
  showdowns: number
  bets: number
  raises: number
  calls: number
  profit: number
  players?: Record<string, TableStatPlayer>
}
export type TableStatistics = {
  position: Record<string, TableStat>
  seat: Record<string, TableStat>
  type: Record<string, TableStat>
}
export const emptyTableStats = (): TableStatistics => ({ position: {}, seat: {}, type: {} })
export function addTableStats(stats: TableStatistics, hand: TableHand) {
  if (!hand.complete) {
    throw new Error('只统计已结算手牌')
  }
  for (const p of hand.players) {
    for (const [group, key] of [
      [stats.position, p.position],
      [stats.seat, String(p.seat)],
      [stats.type, `${p.config.id}|${p.config.preflop}|${p.config.postflop}`],
    ] as const) {
      const row =
        group[key] ??
        (group[key] = {
          hands: 0,
          opportunities: 0,
          vpip: 0,
          pfr: 0,
          sawFlop: 0,
          showdowns: 0,
          bets: 0,
          raises: 0,
          calls: 0,
          profit: 0,
          players: {},
        })
      // A legacy row without membership must stay unknown until its journal is verified.
      if (row.players) {
        const key = JSON.stringify([
          p.config.id,
          p.config.label,
          p.config.preflop,
          p.config.postflop,
        ])
        const member =
          row.players[key] ??
          (row.players[key] = {
            label: p.config.label,
            preflop: p.config.preflop,
            postflop: p.config.postflop,
            hands: 0,
          })
        member.hands++
      }
      row.hands++
      row.opportunities += Number(p.preflopActed)
      row.vpip += Number(p.vpip)
      row.pfr += Number(p.pfr)
      row.sawFlop += Number(p.sawFlop)
      row.showdowns += Number(hand.showdown && !p.folded && p.sawFlop)
      row.bets += p.bets
      row.raises += p.raises
      row.calls += p.calls
      row.profit = add(row.profit, sub(p.stack, p.initial))
    }
  }
}
export function tableStatPlayers(row: TableStat) {
  return Object.values(row.players ?? {})
    .map((p) => `${p.label} · ${p.hands} 手`)
    .join('；')
}
export function tableStatValues(row: TableStat) {
  const percent = (a: number, b: number) => (b ? new Decimal(a).div(b).mul(100).toFixed(2) : '—')
  return {
    ...row,
    vpipPercent: percent(row.vpip, row.opportunities),
    pfrPercent: percent(row.pfr, row.opportunities),
    wtsdPercent: percent(row.showdowns, row.sawFlop),
    af: row.calls
      ? new Decimal(row.bets).plus(row.raises).div(row.calls).toFixed(2)
      : row.bets + row.raises
        ? '∞'
        : '—',
    profitBb: new Decimal(row.profit).div(100).toFixed(2),
  }
}
