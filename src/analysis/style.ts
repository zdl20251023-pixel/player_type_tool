import Decimal from 'decimal.js'
import type { RunType } from '../contracts/experiment'
import type { ScenarioType } from '../scenarios'
import { actions } from './strategy'
const mean = (values: number[]) =>
  values.length
    ? Decimal.sum(...values)
        .div(values.length)
        .toNumber()
    : 0

export function metrics(runs: RunType[]) {
  const probability = (types: string[]) =>
    mean(
      runs.map((run) => {
        const values = actions(run.response)
          .filter((a) => types.includes((JSON.parse(a.key) as unknown[])[0] as string))
          .map((a) => a.probability)
        return values.length ? Decimal.sum(...values).toNumber() : 0
      })
    )
  const fold = probability(['fold'])
  const aggressive = probability(['bet', 'raise', 'allin'])
  const call = probability(['call'])
  const check = probability(['check'])
  // 直接累加继续概率，避免 fold 舍入到 1 后抹掉极小的剩余概率。
  const voluntary = Decimal.sum(call, check, aggressive).toNumber()
  return {
    fold,
    call,
    check,
    aggressive,
    voluntary,
    conditionalAggression: voluntary > 0 ? new Decimal(aggressive).div(voluntary).toNumber() : 0,
  }
}

export function verdict(scenario: ScenarioType, groups: RunType[][]): string {
  if (groups.some((group) => !group.length)) {
    return '数据不全'
  }
  const [loose, tight, gto] = groups.map(metrics)
  const tolerance = 0.005 // 0.5 个百分点内不作风格偏离判断。
  const pressureOK =
    loose.aggressive <= gto.aggressive + tolerance && tight.aggressive >= gto.aggressive - tolerance
  const fits =
    scenario.street === 'preflop'
      ? loose.voluntary >= gto.voluntary - tolerance &&
        loose.aggressive <= gto.aggressive + tolerance &&
        tight.voluntary <= gto.voluntary + tolerance &&
        (Math.min(tight.voluntary, gto.voluntary) < 0.01 ||
          tight.conditionalAggression >= gto.conditionalAggression - tolerance)
      : pressureOK
  const clear =
    Math.max(
      Math.abs(loose.aggressive - gto.aggressive),
      Math.abs(tight.aggressive - gto.aggressive),
      ...(scenario.street === 'preflop'
        ? [Math.abs(loose.voluntary - gto.voluntary), Math.abs(tight.voluntary - gto.voluntary)]
        : [])
    ) > tolerance
  return !clear ? '差异不明显' : fits ? '概率方向符合预期' : '存在反向变化，需复核'
}
