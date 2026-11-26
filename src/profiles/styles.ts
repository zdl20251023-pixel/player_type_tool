import {
  POSTFLOP_PROFILE_META_BY_FORMAT,
  PREFLOP_PROFILE_META_BY_FORMAT,
} from './strategyProfile.catalog'
export type Street = 'preflop' | 'flop' | 'turn' | 'river'

export const styles = [
  { id: 'loose-weak', label: '松弱', preflop: 'vpip68-pfr7', postflop: 'af0.5-wtsd79' },
  { id: 'tight-aggressive', label: '紧凶', preflop: 'vpip22-pfr16', postflop: 'af5.8-wtsd46' },
  { id: 'gto', label: 'GTO', preflop: 'gto', postflop: 'gto' },
] as const

// 代表档位方案 v1；指标始终从 catalog 的 2-0 / 4-6p 读取。
export const rolePreflopProfiles = [
  ['vpip25-pfr8', 'vpip20-pfr10', 'vpip22-pfr16'],
  ['vpip37-pfr9', 'vpip31-pfr16', 'vpip33-pfr23'],
  ['vpip41-pfr10', 'gto', 'vpip35-pfr30'],
  ['vpip68-pfr7', 'vpip64-pfr25', 'vpip69-pfr53'],
  ['vpip80-pfr16', 'vpip72-pfr30', 'vpip75-pfr43'],
] as const
export const rolePostflopProfiles = [
  'af0.5-wtsd79',
  'af1.1-wtsd63',
  'gto',
  'af3.9-wtsd51',
  'af5.8-wtsd46',
] as const

export function profileFor(style: (typeof styles)[number], street: Street): string {
  const name = street === 'preflop' ? style.preflop : style.postflop
  const catalog =
    street === 'preflop' ? PREFLOP_PROFILE_META_BY_FORMAT : POSTFLOP_PROFILE_META_BY_FORMAT
  if (!catalog['2-0']?.['4-6p']?.some((item) => item.name === name)) {
    throw new Error(`档位不属于 2-0 / 4-6p：${name}`)
  }
  return name
}
