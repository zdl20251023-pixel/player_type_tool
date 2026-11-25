import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { randomUUID } from 'node:crypto'
import axios from 'axios'
import { compare, responseProblem, summarize } from '../analysis/strategy'
import { buildRequest, scenarios, representativeScenarios, styles, profileFor } from '../scenarios'
import { validateScenario } from '../scenarios/validate'
import { styleSummary } from '../reports/markdown-summary'
import { renderHtml } from '../reports/html'
import {
  readSession,
  readCachedRun,
  writeJson,
  profileProblem,
  type SessionType,
  type PlanType,
  type CachedRunType,
} from '../storage/session'

import type { RunType } from '../contracts/experiment'

interface ComparisonType {
  kind: 'profile-vs-baseline' | 'within-profile-repeat'
  base: string
  candidate: string
  detail: ReturnType<typeof compare>
}

const help = `真实 lookup 风格对比：100 场景 × 3 风格 × 默认 2 次
  bun --env-file=.env run lookup
  bun run lookup --dry-run
  bun run lookup --render-only artifacts/runs/<run-id>
  bun --env-file=.env run lookup --resume artifacts/runs/<run-id>

--repeat <1..10>    每组次数，默认 2；仅新建实验可用
--scenario <ids>    逗号分隔，例如 S01,S02,S03；默认原有 100 条
--dry-run           校验历史、保存计划和场景快照，不请求网络
--render-only <dir> 仅从指定缓存离线重建 HTML/Markdown，不加载 AI 客户端
--resume <dir>      复用指定实验的计划与缓存，仅请求尚未保存的条目
--retry-failed      配合 --resume，仅重试失败缓存；成功缓存始终复用
--help             查看帮助

每个响应先原子落盘，再生成报告；结果位于 artifacts/runs/<run-id>/report.html。`

const cell = (value: unknown): string =>
  JSON.stringify(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

function markdown(runs: RunType[], comparisons: ComparisonType[]): string {
  const lines = [
    '# lookup strategy_profile 对比报告',
    '',
    '参数仅改变 strategy_profile 和 request_id；request_profile 始终省略。概率差值为百分点，EV 保留接口原始单位（当前业务按 BB 使用）。',
    '新增/删除动作仅在概率差值中按 0 对齐；EV 不补 0。动作按类型、金额、底池比例、座位对齐。',
    '诊断字段仅为服务端回显；没有明确回显时不能断言档位已生效。模型来源变化时不能将差异全部归因于风格调整。',
    '',
    '| 场景 | 档位 | 次数 | 结果 | 耗时 ms | 动作/精简菜单 | 来源 | 建议动作 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const run of runs) {
    const summary = run.ok ? summarize(run.response) : null
    lines.push(
      `| ${run.scenario} | ${run.profile} | ${run.repeat} | ${run.ok ? '成功' : cell(run.problem)} | ${run.elapsedMs} | ${summary ? `${summary.actionCount}/${summary.reducedActionCount ?? '缺失'}` : '-'} | ${cell(summary?.source ?? null)} | ${cell(summary?.suggestedAction ?? null)} |`
    )
  }
  for (const comparison of comparisons) {
    const { detail } = comparison
    lines.push(
      '',
      `## ${comparison.kind}: ${comparison.base} → ${comparison.candidate}`,
      '',
      `最大动作概率差：${detail.maxProbabilityDeltaPp.toFixed(6)} pp；结构差异：${detail.schema.length}；来源变化：${detail.sourceChanged}；建议动作变化：${detail.suggestedActionChanged}。`,
      '',
      `策略配置回显：${cell(detail.after.profileConfig)}`,
      '',
      `警告：${cell(detail.after.warnings)}`,
      '',
      '| 动作 [类型,金额,底池比例,座位] | 状态 | 基线概率 | 当前概率 | 差值 pp | 基线 EV | 当前 EV | EV 差值 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      ...detail.rows.map(
        (row) =>
          `| ${cell(row.action)} | ${row.presence} | ${row.baseProbability ?? '-'} | ${row.probability ?? '-'} | ${row.deltaPp.toFixed(6)} | ${row.baseEv ?? '-'} | ${row.ev ?? '-'} | ${row.deltaEv ?? '-'} |`
      ),
      '',
      '| 字段路径 | 原类型 | 当前类型 |',
      '| --- | --- | --- |',
      ...detail.schema.map(
        (change) => `| ${change.path} | ${cell(change.before)} | ${cell(change.after)} |`
      )
    )
  }
  lines.push(
    '',
    '失败请求不参与对比；缺少可用基线时不生成对应对比。原始请求和响应见各请求 JSON，完整差异见 report.json。',
    ''
  )
  return lines.join('\n')
}

async function writeReports(
  directory: string,
  session: SessionType,
  runs: RunType[]
): Promise<void> {
  const comparisons: ComparisonType[] = []
  for (const run of runs.filter((r) => r.ok)) {
    const baseline = runs.find(
      (r) => r.ok && r.scenario === run.scenario && r.style === 'gto' && r.repeat === run.repeat
    )
    if (baseline && run.style !== 'gto') {
      comparisons.push({
        kind: 'profile-vs-baseline',
        base: baseline.id,
        candidate: run.id,
        detail: compare(baseline.response, run.response),
      })
    }
    const first = runs.find((r) => r.ok && r.scenario === run.scenario && r.style === run.style)
    if (first && first.id !== run.id) {
      comparisons.push({
        kind: 'within-profile-repeat',
        base: first.id,
        candidate: run.id,
        detail: compare(first.response, run.response),
      })
    }
  }
  await writeJson(directory, 'report.json', {
    runs: runs.map(({ response, ...info }) => ({
      ...info,
      summary: info.ok ? summarize(response) : null,
    })),
    comparisons,
  })
  await writeFile(resolve(directory, 'report.md'), markdown(runs, comparisons))
  await writeFile(resolve(directory, 'summary.md'), styleSummary(session.scenarios, runs))
  await writeFile(resolve(directory, 'conclusion.md'), styleSummary(session.scenarios, runs, false))
  await writeFile(resolve(directory, 'report.html'), await renderHtml(session, runs))
}

export async function runExperiment(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    strict: true,
    options: {
      repeat: { type: 'string' },
      scenario: { type: 'string' },
      'dry-run': { type: 'boolean' },
      'render-only': { type: 'string' },
      resume: { type: 'string' },
      'retry-failed': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })
  if (values.help) {
    process.stdout.write(`${help}\n`)
    return
  }
  if (values['render-only'] && values.resume) {
    throw new Error('--render-only 与 --resume 不能同时使用')
  }
  const existing = values['render-only'] ?? values.resume
  if (existing && (values.repeat || values.scenario || values['dry-run'])) {
    throw new Error('复用实验时使用缓存中的次数和场景，请勿另传 --repeat/--scenario/--dry-run')
  }
  if (values['retry-failed'] && !values.resume) {
    throw new Error('--retry-failed 必须配合 --resume')
  }
  let session: SessionType
  let directory: string
  if (existing) {
    directory = resolve(existing)
    session = await readSession(directory)
  } else {
    const repeats = Number(values.repeat ?? '2')
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) {
      throw new Error('--repeat 必须为 1..10 的整数')
    }
    const ids = values.scenario?.split(',').map((id) => id.trim())
    const catalog = [...scenarios, ...representativeScenarios]
    if (ids?.some((id) => !catalog.some((s) => s.id === id))) {
      throw new Error('未知场景；请使用 P01..P50、F01..F24、T01..T16、R01..R10、S01..S03')
    }
    const selected = ids ? catalog.filter((s) => ids.includes(s.id)) : scenarios
    const validation = selected.map((s) => ({ id: s.id, ...validateScenario(s) }))
    const runId = randomUUID()
    directory = resolve('artifacts', 'runs', runId)
    const plan: PlanType[] = selected.flatMap((scenario) =>
      Array.from({ length: repeats }, (_, i) =>
        [...styles]
          .sort((a, b) => Number(b.id === 'gto') - Number(a.id === 'gto'))
          .map((style, variant) => ({
            id: `${scenario.id}-${i + 1}-${variant}`,
            scenario: scenario.id,
            description: scenario.description,
            style: style.id,
            profile: profileFor(style, scenario.street),
            repeat: i + 1,
            request: buildRequest(
              scenario,
              profileFor(style, scenario.street),
              `${runId}-${scenario.id}-${i + 1}-${variant}`
            ),
          }))
      ).flat()
    )
    session = {
      version: 1,
      runId,
      createdAt: new Date().toISOString(),
      repeats,
      scenarios: selected,
      plan,
    }
    await mkdir(directory, { recursive: true })
    await writeJson(directory, 'session.json', session)
    await writeJson(directory, 'plan.json', plan)
    await writeJson(directory, 'validation.json', validation)
  }
  process.stdout.write(`请求计划：${session.plan.length}；结果目录：${directory}\n`)
  if (values['dry-run']) {
    return
  }
  // 先校验所有缓存；损坏时中止，避免半途才发现缓存问题而发出部分新请求。
  const cachedRuns = await Promise.all(session.plan.map((plan) => readCachedRun(directory, plan)))
  const runs: RunType[] = []
  let lookupService: typeof import('../client/lookup').lookupService | undefined
  let requested = 0
  let reused = 0
  for (let index = 0; index < session.plan.length; index++) {
    const plan = session.plan[index]
    const cached = cachedRuns[index]
    if (cached && (!values['retry-failed'] || cached.ok || values['render-only'])) {
      runs.push(cached)
      reused++
      continue
    }
    if (values['render-only']) {
      runs.push({
        ...plan,
        ok: false,
        elapsedMs: 0,
        problem: '未执行：缺少本地响应缓存',
        response: null,
      })
      continue
    }
    if (!lookupService) {
      if (!process.env.AI_SERVICE_URL) {
        throw new Error('缺少 AI_SERVICE_URL；已完成缓存可用 --render-only 离线重建')
      }
      lookupService = (await import('../client/lookup')).lookupService
    }
    const started = performance.now()
    let response: unknown = null
    let problem: string | null = null
    let httpStatus: number | null = null
    try {
      response = await lookupService.requestRaw(plan.request)
      problem = responseProblem(response) ?? profileProblem(response, plan)
    } catch (error) {
      if (axios.isAxiosError<unknown>(error)) {
        response = error.response?.data ?? null
        httpStatus = error.response?.status ?? null
        problem = `请求失败：${error.code ?? 'AXIOS_ERROR'}；HTTP=${httpStatus ?? '无响应'}`
      } else {
        problem = `请求失败：${error instanceof Error ? error.name : 'UnknownError'}`
      }
    }
    const run: CachedRunType = {
      ...plan,
      httpStatus,
      ok: problem === null,
      elapsedMs: Math.round(performance.now() - started),
      problem,
      response,
    }
    await writeJson(directory, `${plan.id}.json`, run)
    runs.push(run)
    requested++
    await writeJson(directory, 'progress.json', {
      completed: runs.length,
      total: session.plan.length,
      requested,
      reused,
      successful: runs.filter((r) => r.ok).length,
    })
    process.stdout.write(
      `${plan.id} ${run.ok ? 'OK' : 'FAILED'} ${run.elapsedMs}ms [${runs.length}/${session.plan.length}]\n`
    )
  }
  // HTML 渲染失败不影响已保存的原始响应，后续仅需 --render-only。
  await writeReports(directory, session, runs)
  const failures = runs.filter((r) => !r.ok).length
  process.stdout.write(
    `完成：${runs.length - failures} 成功，${failures} 失败；新请求 ${requested}，复用 ${reused}；HTML ${resolve(directory, 'report.html')}\n`
  )
  if (failures) {
    process.exitCode = 1
  }
}
