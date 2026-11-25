import {
  GAME_FORMATS,
  SEAT_RANGES,
  PREFLOP_PROFILE_META_BY_FORMAT,
  POSTFLOP_PROFILE_META_BY_FORMAT,
} from './strategyProfile.catalog'
import { record } from '../analysis/strategy'
import type { PlayerConfig } from '../contracts/workbench'

export function catalogOptions() {
  return (['preflop', 'postflop'] as const).flatMap((stage) =>
    GAME_FORMATS.flatMap((format) =>
      SEAT_RANGES.flatMap(
        (seats) =>
          (stage === 'preflop' ? PREFLOP_PROFILE_META_BY_FORMAT : POSTFLOP_PROFILE_META_BY_FORMAT)[
            format
          ]?.[seats]?.map((meta) => ({
            stage,
            format,
            seats,
            ...meta,
            executable: format === '2-0' && seats === '4-6p',
          })) ?? []
      )
    )
  )
}

export function text(value: unknown, label: string, max = 4000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(`${label} 必须为 1..${max} 字符`)
  }
  return value.trim()
}

export function validPlayer(value: unknown): PlayerConfig {
  const obj = record(value)
  const id = text(obj.id, '玩家 ID', 60)
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new Error('玩家 ID 仅允许字母、数字和连字符')
  }
  const preflop = text(obj.preflop, '翻前档位', 80)
  const postflop = text(obj.postflop, '翻后档位', 80)
  for (const [stage, name] of [
    ['preflop', preflop],
    ['postflop', postflop],
  ]) {
    if (!catalogOptions().some((p) => p.executable && p.stage === stage && p.name === name)) {
      throw new Error(`${stage} 档位不适用于当前 2-0 / 4-6p：${name}`)
    }
  }
  return {
    id,
    label: text(obj.label, '玩家名称', 80),
    description: text(obj.description, '风格说明'),
    preflop,
    postflop,
  }
}
