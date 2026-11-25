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

export function profileFor(style: (typeof styles)[number], street: Street): string {
  const name = street === 'preflop' ? style.preflop : style.postflop
  const catalog =
    street === 'preflop' ? PREFLOP_PROFILE_META_BY_FORMAT : POSTFLOP_PROFILE_META_BY_FORMAT
  if (!catalog['2-0']?.['4-6p']?.some((item) => item.name === name)) {
    throw new Error(`档位不属于 2-0 / 4-6p：${name}`)
  }
  return name
}
