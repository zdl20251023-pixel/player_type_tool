import Decimal from 'decimal.js'
import type { PlayerConfig } from '../contracts/workbench'
import { catalogOptions } from '../profiles/catalog'
import { builtinRoles, roleToPlayer } from '../profiles/roles'
import { escapeHtml as e } from '../reports/comparison-view'

export const tablePlayerKey = (p: PlayerConfig) =>
  JSON.stringify([
    p.id,
    p.label,
    p.description,
    p.preflop,
    p.postflop,
    p.sourceRole?.id,
    p.sourceRole?.version,
  ])
export const sameTablePlayer = (a: PlayerConfig, b: PlayerConfig) =>
  tablePlayerKey(a) === tablePlayerKey(b)

export function tableSeatState(player: PlayerConfig, saved?: PlayerConfig, active?: PlayerConfig) {
  if (!saved) {
    return 'new'
  }
  if (!sameTablePlayer(player, saved)) {
    return 'dirty'
  }
  return active && !sameTablePlayer(player, active) ? 'queued' : 'active'
}

export function mergeTableSeats(
  local: PlayerConfig[],
  previous: PlayerConfig[],
  next: PlayerConfig[]
) {
  return local.map((p, i) => structuredClone(sameTablePlayer(p, previous[i]) ? next[i] : p))
}

export function tablePlayerOrigin(p: PlayerConfig) {
  const role = builtinRoles.find((r) => r.id === p.sourceRole?.id)
  if (role && sameTablePlayer(p, roleToPlayer(role))) {
    return `内置角色 · ${role.id}`
  }
  return p.sourceRole ? `个人配置 · 来源 ${p.sourceRole.id}` : '个人配置'
}

const catalog = catalogOptions().filter((p) => p.executable)
export function tablePlayerMetrics(p: PlayerConfig) {
  const pre = catalog.find((m) => m.stage === 'preflop' && m.name === p.preflop)
  const post = catalog.find((m) => m.stage === 'postflop' && m.name === p.postflop)
  const pct = (n?: number) => (n === undefined ? '—' : new Decimal(n).mul(100).toFixed(2) + '%')
  return `<div class="seat-picker-metrics">${[
    ['VPIP', pct(pre?.vpip)],
    ['PFR', pct(pre?.pfr)],
    ['AF', post ? new Decimal(post.af).toFixed(4) : '—'],
    ['WTSD', pct(post?.wtsd)],
  ]
    .map(([label, value]) => `<div><span>${label}</span><b>${e(value)}</b></div>`)
    .join('')}</div>`
}
