import { metrics, verdict } from '../analysis/style'
export { metrics, verdict } from '../analysis/style'
import Decimal from 'decimal.js'
import type { RunType } from '../contracts/experiment'
import { actions, record, summarize } from '../analysis/strategy'
import { styles, type ScenarioType } from '../scenarios'
import { validateScenario } from '../scenarios/validate'

const percent = (value: number) => `${new Decimal(value).mul(100).toFixed(2)}%`
const labels: Record<string, string> = {
  fold: '弃牌',
  check: '过牌',
  call: '跟注',
  bet: '下注',
  raise: '加注',
  allin: '全下',
}
function actionLabel(value: unknown): string {
  const a = record(value)
  return `${labels[String(a.action)] ?? String(a.action)}${typeof a.amount === 'number' && a.amount > 0 ? ` ${new Decimal(a.amount).div(100).toFixed(2)}BB` : ''}`
}

export function styleSummary(scenarios: ScenarioType[], runs: RunType[], detailed = true): string {
  const groupFor = (scenario: ScenarioType, style: string) =>
    runs.filter((r) => r.ok && r.scenario === scenario.id && r.style === style)
  const counts = new Map<string, number>()
  for (const scenario of scenarios) {
    const result = verdict(
      scenario,
      styles.map((s) => groupFor(scenario, s.id))
    )
    counts.set(result, (counts.get(result) ?? 0) + 1)
  }
  const lines = [
    `# 三种玩家风格：${scenarios.length} 条行动线对比`,
    '',
    `本次选取 ${scenarios.length} 条，完成 ${runs.length} 次请求，成功 ${runs.filter((r) => r.ok).length} 次。6 人桌、每人初始 100BB、无前注、无抓注；1BB=100 筹码。`,
    '仅改变决策玩家的 strategy_profile；其他五人的策略并未分别设置。历史为固定反事实场景，不要求三种风格此前都按这条历史行动。',
    '',
    '| 风格 | 翻前 | 翻后 |',
    '| --- | --- | --- |',
    ...styles.map((s) => `| ${s.label} | ${s.preflop} | ${s.postflop} |`),
    '',
    `场景方向检查：${[...counts].map(([key, count]) => `${key} ${count} 条`).join('；')}。`,
    '以下为有限样本的相对 GTO 方向检查，不是风格认证：翻前检查松弱更多继续且少主动、紧凶更少继续且继续后的主动比例更高；任一侧继续概率低于 1% 时不使用条件比例作反向判断。翻后检查松弱主动率更低、紧凶更高。容差 0.5 个百分点；“差异不明显”不等于未生效。',
    '最高概率动作与 suggested_action 分开列出。推荐可能抽样，并非每次都应等于最高概率动作；单次推荐不能证明或否定风格。',
    '',
    '## 同一决策点并排比较',
    '',
    '每格为平均概率：弃牌/跟注/过牌/主动（下注+加注+全下）。金额统一为 BB，加注金额为本街加注到的总额。',
    '',
    '| 场景 | 松弱：弃/跟/过/主动 | 紧凶：弃/跟/过/主动 | GTO：弃/跟/过/主动 | 方向检查 |',
    '| --- | --- | --- | --- | --- |',
  ]
  for (const scenario of scenarios) {
    const groups = styles.map((s) => groupFor(scenario, s.id))
    const cells = groups.map((group) => {
      const m = metrics(group)
      return group.length
        ? [m.fold, m.call, m.check, m.aggressive].map(percent).join(' / ')
        : '缺失'
    })
    lines.push(`| ${scenario.id} | ${cells.join(' | ')} | ${verdict(scenario, groups)} |`)
  }
  lines.push(
    '',
    '## 分阶段平均（等权决策样本，不是玩家真实 VPIP/PFR 统计）',
    '',
    '| 阶段 | 风格 | 弃牌 | 跟注 | 过牌 | 主动 |',
    '| --- | --- | --- | --- | --- | --- |'
  )
  for (const pre of [true, false]) {
    for (const style of styles) {
      const ids = new Set(
        scenarios.filter((s) => (s.street === 'preflop') === pre).map((s) => s.id)
      )
      const group = runs.filter((r) => r.ok && r.style === style.id && ids.has(r.scenario))
      const m = metrics(group)
      lines.push(
        `| ${pre ? '翻前' : '翻后'} | ${style.label} | ${[m.fold, m.call, m.check, m.aggressive].map(percent).join(' | ')} |`
      )
    }
  }
  lines.push(
    '',
    '## 实际推荐动作并排比较',
    '',
    '| 行动线 | 松弱（逐次推荐） | 紧凶（逐次推荐） | GTO（逐次推荐） |',
    '| --- | --- | --- | --- |'
  )
  for (const scenario of scenarios) {
    const cells = styles.map(
      (style) =>
        groupFor(scenario, style.id)
          .map((r) => actionLabel(summarize(r.response).suggestedAction))
          .join(' / ') || '缺失'
    )
    lines.push(`| ${scenario.id}：${scenario.description} | ${cells.join(' | ')} |`)
  }
  lines.push(
    '',
    'GTO 是均衡基线，不要求介于另两种风格之间。紧凶的“凶”应结合继续后的主动比例理解，不能要求每手牌的加注概率都高于 GTO。',
    '',
    `方向检查中的“差异不明显”仅指所检查的指标；翻后只检查主动率，跟注/弃牌仍可能差异很大，请结合概率表阅读。结论仅限这 ${scenarios.length} 个指定决策点，不代表所有牌局。`,
    ''
  )
  if (!detailed) {
    return lines.join('\n')
  }
  for (const scenario of scenarios) {
    const validation = validateScenario(scenario)
    lines.push(
      '',
      `## ${scenario.id}`,
      '',
      scenario.description,
      '',
      `底牌 ${scenario.hand.players[scenario.hero].hole_cards}；公共牌 ${validation.board.join(' ') || '无'}；行动前底池 ${validation.potBb}BB；待跟注 ${validation.toCallBb}BB；Hero 剩余 ${validation.stackBb}BB。`,
      '',
      '| 风格 | 实际匹配档位 | 每次最高概率动作 | 每次接口推荐 | 推荐在完整策略中的概率 |',
      '| --- | --- | --- | --- | --- |'
    )
    for (const style of styles) {
      const group = groupFor(scenario, style.id)
      const highest = group.map((r) => {
        const a = actions(r.response).sort((a, b) => b.probability - a.probability)[0]
        const k = JSON.parse(a.key) as unknown[]
        return `${actionLabel({ action: k[0], amount: k[1] })} (${percent(a.probability)})`
      })
      const suggestions = group.map((r) => actionLabel(summarize(r.response).suggestedAction))
      const matched = group.map((r) =>
        String(record(summarize(r.response).profileConfig).matched_profile_name)
      )
      const recommendationProbabilities = group.map((r) => {
        const suggested = record(summarize(r.response).suggestedAction)
        const a = actions(r.response).find((a) => {
          const k = JSON.parse(a.key) as unknown[]
          return k[0] === suggested.action && k[1] === (suggested.amount ?? null)
        })
        return a ? percent(a.probability) : '未匹配候选动作'
      })
      lines.push(
        `| ${style.label} | ${matched.join(' / ') || '缺失'} | ${highest.join(' / ') || '缺失'} | ${suggestions.join(' / ') || '缺失'} | ${recommendationProbabilities.join(' / ') || '缺失'} |`
      )
      const failures = runs.filter(
        (r) => r.scenario === scenario.id && r.style === style.id && !r.ok
      )
      if (failures.length) {
        lines.push(`\n${style.label} 失败：${failures.map((r) => r.problem).join('；')}\n`)
      }
    }
    lines.push(
      '',
      '| 风格 | 候选动作（首轮成功结果） | 概率 | EV（原接口单位） |',
      '| --- | --- | --- | --- |'
    )
    for (const style of styles) {
      const first = groupFor(scenario, style.id)[0]
      if (!first) {
        continue
      }
      for (const a of actions(first.response)) {
        const k = JSON.parse(a.key) as unknown[]
        lines.push(
          `| ${style.label} | ${actionLabel({ action: k[0], amount: k[1] })} | ${percent(a.probability)} | ${a.ev} |`
        )
      }
    }
  }
  lines.push(
    '',
    '完整逐次响应、结构差异、EV 差值与重复波动见 report.md、report.json 和各请求 JSON。GTO 回显 no_profile_applied 按均衡基线处理，不能据此声称应用了风格调整。',
    ''
  )
  return lines.join('\n')
}
