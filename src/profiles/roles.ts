import Decimal from 'decimal.js'
import type { PlayerConfig } from '../contracts/workbench'
import {
  PREFLOP_PROFILE_META_BY_FORMAT,
  POSTFLOP_PROFILE_META_BY_FORMAT,
  type ProfileMeta,
} from './strategyProfile.catalog'
import { rolePreflopProfiles, rolePostflopProfiles } from './styles'

export const ROLE_VERSION = '2026-11-26-v1'
export const looseness = ['很紧', '偏紧', '中间', '偏松', '很松'] as const
export const activity = ['被动', '中间', '主动'] as const
export const postflopStyles = ['很被动', '偏被动', '基线', '偏凶', '很凶'] as const
const pre = PREFLOP_PROFILE_META_BY_FORMAT['2-0']!['4-6p']!
const post = POSTFLOP_PROFILE_META_BY_FORMAT['2-0']!['4-6p']!
const meta = (rows: ProfileMeta[], name: string) => {
  const found = rows.find((p) => p.name === name)
  if (!found) {
    throw new Error(`内置角色缺少档位：${name}`)
  }
  return { ...found }
}
const midpoint = (a: Decimal.Value, b: Decimal.Value) => new Decimal(a).plus(b).div(2)
const gto = meta(pre, 'gto')
const lowest = Decimal.min(...pre.map((p) => p.vpip))
const highest = Decimal.max(...pre.map((p) => p.vpip))
export const roleTargets = [
  lowest,
  midpoint(lowest, gto.vpip),
  new Decimal(gto.vpip),
  midpoint(gto.vpip, highest),
  highest,
]
export const roleBoundaries = [
  lowest,
  ...roleTargets.slice(1).map((t, i) => midpoint(roleTargets[i], t)),
  highest,
]
export const rolePercent = (value: Decimal.Value, digits = 2) =>
  new Decimal(value).mul(100).toFixed(digits) + '%'
export const roleRatio = (p: ProfileMeta) => new Decimal(p.pfr).div(p.vpip)
const preReasons = [
  [
    '分区内取最低 PFR/VPIP，作为被动代表。',
    '保留全局最低 VPIP；该档主动比值约 44%，并非精确等于 GTO。',
    '保留原紧凶翻前档，优先更低 VPIP，而非该区最高主动比值。',
  ],
  [
    '取该分区最被动的候选。',
    '优先贴近偏紧 VPIP 中点，并接近 GTO 主动比值。',
    '兼顾偏紧中点和约 78% 的主动比值。',
  ],
  [
    '兼顾接近 GTO VPIP 和低主动比值，未选择更松的最低比值候选。',
    '以 GTO 为松紧与主动程度的共同锚点。',
    '保留全局最高 PFR/VPIP；VPIP 随之低于 GTO。',
  ],
  [
    '保留全局最低 PFR/VPIP，是原松弱翻前档。',
    '兼顾松紧中点和接近 GTO 的主动比值。',
    '保留该分区最高主动比值，VPIP 比中点高 8.385 个百分点。',
  ],
  [
    '保留全局最高 VPIP，并非该区最低主动比值。',
    '取比值更接近 GTO 的代表。',
    '取该分区最高主动比值，但仍低于中间行的主动代表。',
  ],
] as const
const postReasons = [
  '保留 AF 最低、WTSD 最高的端点。',
  '按 AF 与“很被动、GTO”算术中点的距离选取最近档位；同时改变 WTSD。',
  '以翻后 GTO 为基线；仅翻前也使用 gto 时，整套组合才是 GTO。',
  '按 AF 与“GTO、很凶”算术中点的距离选取最近档位；同时改变 WTSD。',
  '保留 AF 最高、WTSD 最低的端点。',
] as const
export interface BuiltinRole {
  id: string
  version: string
  l: number
  a: number
  f: number
  name: string
  description: string
  preflop: ProfileMeta
  postflop: ProfileMeta
  reason: string
  postReason: string
  alias: string
}
export const builtinRoles: readonly BuiltinRole[] = rolePreflopProfiles.flatMap((names, l) =>
  names.flatMap((name, a) =>
    rolePostflopProfiles.map((postName, f) => {
      const id = `L${l + 1}-A${a + 1}-F${f + 1}`
      const alias =
        id === 'L3-A2-F3'
          ? 'GTO 基线'
          : id === 'L1-A3-F5'
            ? '原紧凶'
            : id === 'L4-A1-F1'
              ? '原松弱'
              : ''
      return {
        id,
        version: ROLE_VERSION,
        l: l + 1,
        a: a + 1,
        f: f + 1,
        name: `${looseness[l]} · 翻前${activity[a]} · 翻后${postflopStyles[f]}`,
        description: `翻前范围${looseness[l]}，在同一松紧分区中采用${activity[a]}的主动程度；翻后风格${postflopStyles[f]}。这是档位参考倾向，实际行为需结合场景和牌局样本观察。`,
        preflop: meta(pre, name),
        postflop: meta(post, postName),
        reason: preReasons[l][a],
        postReason: postReasons[f],
        alias,
      }
    })
  )
)
export function roleById(id: string): BuiltinRole {
  const role = builtinRoles.find((r) => r.id === id)
  if (!role) {
    throw new Error('内置角色不存在')
  }
  return role
}
export function roleToPlayer(role: BuiltinRole): PlayerConfig {
  return {
    id: `builtin-${role.id.toLowerCase()}-v1`,
    label:
      role.alias === 'GTO 基线'
        ? 'GTO 基线'
        : `${looseness[role.l - 1]}-${activity[role.a - 1]}-${postflopStyles[role.f - 1]}`,
    description: `${role.description}\n来源：内置角色 ${role.id}，方案 ${role.version}。`,
    preflop: role.preflop.name,
    postflop: role.postflop.name,
    sourceRole: { id: role.id, version: role.version },
  }
}
export function addRoleToDraft(
  players: PlayerConfig[],
  role: BuiltinRole,
  limit = 8
): PlayerConfig[] {
  const player = roleToPlayer(role)
  const existing = players.find((p) => p.id === player.id)
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(player)) {
      throw new Error('该角色 ID 已被不同配置使用，请复制为新的玩家 ID')
    }
    return players
  }
  if (players.length >= limit) {
    throw new Error(`实验最多选择 ${limit} 个玩家，请先取消部分玩家再加入角色`)
  }
  return [...players, player]
}
