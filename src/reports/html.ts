import { readFile } from 'node:fs/promises'
import Decimal from 'decimal.js'
import type { RunType } from '../contracts/experiment'
import { actions, compare, record, summarize } from '../analysis/strategy'
import { metrics, verdict } from '../analysis/style'
import { styles, type ScenarioType } from '../scenarios'
import type { SessionType } from '../storage/session'
import { validateScenario } from '../scenarios/validate'

const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
const streetNames = { preflop: '翻前', flop: '翻牌', turn: '转牌', river: '河牌' }
const labels: Record<string, string> = {
  fold: '弃牌',
  call: '跟注',
  check: '过牌',
  raise: '加注到',
  bet: '下注',
  allin: '全下',
}
const average = (values: number[]) =>
  values.length
    ? Decimal.sum(...values)
        .div(values.length)
        .toNumber()
    : null
function actionLabel(value: unknown): string {
  const a = record(value)
  const amount =
    typeof a.amount === 'number' && a.amount > 0
      ? ` ${new Decimal(a.amount).div(100).toNumber()}BB`
      : ''
  return `${labels[String(a.action)] ?? '缺少推荐动作'}${amount}`
}
function keyLabel(key: string): string {
  const parts = JSON.parse(key) as unknown[]
  return actionLabel({ action: parts[0], amount: parts[1] })
}
function timeline(scenario: ScenarioType): string[][] {
  const result: string[][] = []
  let stage = 0
  for (const a of scenario.hand.actions.entries) {
    if (a.seat_no === -1) {
      stage++
      result.push([
        ['翻前', '翻牌', '转牌', '河牌'][stage],
        `发出 ${a.action.match(/../g)?.join(' ')}`,
      ])
    } else {
      const who =
        a.seat_no === scenario.hero
          ? `Hero（${positions[scenario.hero]}）`
          : positions[a.seat_no as number]
      result.push([
        ['翻前', '翻牌', '转牌', '河牌'][stage],
        `${who} ${actionLabel({ action: a.action, amount: a.amount })}`,
      ])
    }
  }
  if (!result.length) {
    result.push(['翻前', '尚无玩家自愿行动，已投入 SB 0.5BB、BB 1BB。'])
  }
  result.push(['决策', `轮到 Hero（${positions[scenario.hero]}）行动，历史到此为止。`])
  return result
}

export function reportData(
  session: SessionType,
  runs: RunType[],
  styleConfigs: readonly { id: string; label: string; preflop: string; postflop: string }[] = styles
) {
  const styles = styleConfigs
  const standardStyles =
    styles.length === 3 &&
    styles.every(
      (style, i) =>
        style.id === ['loose-weak', 'tight-aggressive', 'gto'][i] &&
        style.preflop === ['vpip68-pfr7', 'vpip22-pfr16', 'gto'][i] &&
        style.postflop === ['af0.5-wtsd79', 'af5.8-wtsd46', 'gto'][i]
    )
  const scenes = session.scenarios.map((scenario) => {
    const groupRuns = styles.map((style) =>
      runs.filter((r) => r.scenario === scenario.id && r.style === style.id)
    )
    const groups = groupRuns.map((group) => group.filter((r) => r.ok))
    const complete = groups.every((g) => g.length === session.repeats)
    const sourceValues = [
      ...new Set(groups.flat().map((r) => JSON.stringify(summarize(r.response).source))),
    ]
    const judgement = !complete
      ? '数据不全'
      : sourceValues.length > 1
        ? '来源变化，谨慎归因'
        : standardStyles
          ? verdict(scenario, groups)
          : '自定义玩家对比，请结合概率表分析'
    const outcome =
      judgement === '概率方向符合预期'
        ? 'fits'
        : judgement === '差异不明显'
          ? 'same'
          : judgement === '数据不全'
            ? 'incomplete'
            : judgement.startsWith('来源')
              ? 'source'
              : judgement.startsWith('自定义')
                ? 'ready'
                : 'counter'
    const validation = validateScenario(scenario)
    const actionKeys = [
      ...new Set(groups.flat().flatMap((r) => actions(r.response).map((a) => a.key))),
    ].sort()
    const styleData = groups.map((group, index) => {
      const m = metrics(group)
      const allRuns = groupRuns[index].sort((a, b) => a.repeat - b.repeat)
      return {
        rates: group.length
          ? [m.fold, m.call, m.check, m.aggressive].map((v) => new Decimal(v).mul(100).toNumber())
          : null,
        voluntary: group.length ? new Decimal(m.voluntary).mul(100).toNumber() : null,
        conditionalAggression: group.length
          ? new Decimal(m.conditionalAggression).mul(100).toNumber()
          : null,
        successful: group.length,
        picks: allRuns.map((r) => ({
          repeat: r.repeat,
          label: r.ok ? actionLabel(summarize(r.response).suggestedAction) : '请求失败',
          ok: r.ok,
        })),
        tops: allRuns.map((r) => {
          if (!r.ok) {
            return { repeat: r.repeat, label: '无有效策略', probability: null }
          }
          const top = actions(r.response).sort((a, b) => b.probability - a.probability)[0]
          return {
            repeat: r.repeat,
            label: keyLabel(top.key),
            probability: new Decimal(top.probability).mul(100).toNumber(),
          }
        }),
        diagnostics: allRuns.map((r) => ({
          id: r.id,
          repeat: r.repeat,
          ok: r.ok,
          problem: r.problem,
          profile: r.profile,
          elapsedMs: r.elapsedMs,
          ...(r.ok ? summarize(r.response) : {}),
        })),
        maxRepeatDeltaPp:
          group.length > 1
            ? Math.max(
                ...group
                  .slice(1)
                  .map((r) => compare(group[0].response, r.response).maxProbabilityDeltaPp)
              )
            : null,
      }
    })
    return {
      id: scenario.id,
      stage: scenario.street,
      stageName: streetNames[scenario.street],
      title: `${positions[scenario.hero]} · ${scenario.description}`,
      description: scenario.history,
      purpose: scenario.description,
      category: scenario.category,
      hero: positions[scenario.hero],
      hole: scenario.hand.players[scenario.hero].hole_cards?.match(/../g) ?? [],
      board: validation.board,
      pot: validation.potBb,
      call: validation.toCallBb,
      stack: validation.stackBb,
      timeline: timeline(scenario),
      outcome,
      judgement,
      complete,
      sourceValues,
      styles: styleData,
      actions: actionKeys.map((key) => ({
        key,
        label: keyLabel(key),
        cells: groups.map((group) => {
          if (!group.length) {
            return { probability: null, ev: null }
          }
          const candidates = group.map((r) => actions(r.response).find((a) => a.key === key))
          const probability = average(candidates.map((a) => a?.probability ?? 0))
          return {
            probability: probability === null ? null : new Decimal(probability).mul(100).toNumber(),
            ev: average(candidates.flatMap((a) => (a ? [a.ev] : []))),
          }
        }),
      })),
    }
  })
  const counts = Object.fromEntries(
    ['fits', 'same', 'counter', 'incomplete', 'source', 'ready'].map((key) => [
      key,
      scenes.filter((s) => s.outcome === key).length,
    ])
  )
  const aggregates = [true, false].flatMap((pre) =>
    styles.map((style, index) => {
      const selected = scenes.filter((s) => s.complete && (s.stage === 'preflop') === pre)
      return {
        stage: pre ? '翻前' : '翻后',
        style: style.label,
        samples: selected.length,
        rates: [0, 1, 2, 3].map((i) =>
          average(selected.map((s) => s.styles[index].rates?.[i] ?? 0))
        ),
      }
    })
  )
  return {
    runId: session.runId,
    createdAt: session.createdAt,
    repeats: session.repeats,
    totalScenes: session.scenarios.length,
    totalRequests: session.plan.length,
    successful: runs.filter((r) => r.ok).length,
    failed: runs.filter((r) => !r.ok).length,
    counts,
    aggregates,
    styles,
    scenes,
  }
}

export async function renderHtml(session: SessionType, runs: RunType[]): Promise<string> {
  const template = await readFile(new URL('./templates/report.html', import.meta.url), 'utf8')
  const payload = JSON.stringify(reportData(session, runs))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return template.replace(
    '<!-- REPORT_PAYLOAD -->',
    `<script id="report-data" type="application/json">${payload}</script>`
  )
}
