import { reportData } from './html'
import { compare } from '../analysis/strategy'
import type { SessionType } from '../storage/session'
import type { RunType } from '../contracts/experiment'
import type { ExperimentMeta } from '../contracts/workbench'

import {
  escapeHtml,
  comparisonSummary,
  comparisonOverview,
  comparisonDetails,
  comparisonScript,
} from './comparison-view'
import { comparisonCss } from './comparison-style'
import { record } from '../analysis/strategy'
import type { CachedRunType } from '../storage/session'
export { escapeHtml } from './comparison-view'

export function horizontalResults(meta: ExperimentMeta, session: SessionType, runs: RunType[]) {
  const comparisons = runs
    .filter((r) => r.ok && r.style !== meta.baselineId)
    .flatMap((r) => {
      const base = runs.find(
        (b) =>
          b.ok && b.style === meta.baselineId && b.scenario === r.scenario && b.repeat === r.repeat
      )
      return base
        ? [
            {
              scenario: r.scenario,
              repeat: r.repeat,
              baseline: base.style,
              candidate: r.style,
              detail: compare(base.response, r.response),
            },
          ]
        : []
    })
  return {
    ...reportData(session, runs, meta.players),
    name: meta.name,
    requirements: meta.requirements,
    baselineId: meta.baselineId,
    comparisons,
  }
}

export function workbenchHtml(
  meta: ExperimentMeta,
  data: ReturnType<typeof horizontalResults>,
  analysis: unknown,
  rawRuns: CachedRunType[] = []
) {
  const e = escapeHtml
  const content = record(analysis)
  const analysisHtml =
    typeof content.summary === 'string'
      ? `<div class="report-analysis">${e(content.summary)}</div>${Array.isArray(content.scenes) ? (content.scenes as unknown[]).map((value) => `<p><strong>${e(record(value).id)}</strong> ${e(record(value).conclusion)}</p>`).join('') : ''}${Array.isArray(content.limitations) ? `<p class="report-note">${content.limitations.map((value: unknown) => e(value)).join('；')}</p>` : ''}`
      : '<p class="report-note">尚无适用于当前结果的大模型结论。可以在工具中独立分析，不需要重新求解。</p>'
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(meta.name)}</title><style>
body{margin:0;background:#eef2f6;color:#172b45;font:15px/1.7 'Segoe UI','Microsoft YaHei',sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}main{max-width:1680px;margin:auto;padding:35px 40px 65px}button,input,select{font:inherit}button{cursor:pointer}a{text-decoration:none;color:#187e69}header h1{font-size:29px;margin:20px 0 9px}header p,.report-note{font-size:13px;color:#526176}.report-label{font-size:12px;letter-spacing:1.5px;color:#24634d}.report-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin:24px 0}.report-stat{padding:18px 22px;border:1px solid #e2e8ef;border-radius:9px;background:white}.report-stat strong{font-size:25px;display:block}.report-stat span{font-size:10px;color:#92a0b1}.report-analysis-section{padding:22px;background:#eef6f2;border:1px solid #d8e8df;border-radius:9px;margin:24px 0;color:#294f43;font-size:14px}.report-analysis-section h2{font-size:16px;margin:0 0 10px;color:#285a46}.report-analysis{white-space:pre-wrap;line-height:1.9}.report-footer{border-top:1px solid #e3e9f0;margin-top:30px;padding-top:15px;font-size:12px;color:#526176}.report-links{display:flex;gap:15px;font-size:13px;margin-top:15px}@media(max-width:700px){main{padding:22px 14px}.report-stats{gap:8px}.report-stat{padding:12px}.report-stat strong{font-size:20px}}@media print{main{padding:0}.report-links{display:none}}
${comparisonCss}</style></head><body><main><header><span class="report-label">STRATEGY LAB / PLAYER STYLE RESEARCH</span><h1>${e(meta.name)}</h1><p>${e(new Date(meta.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }))}（上海） · 6 人 / 100BB / 无前注 / 无抓注</p><p>${e(meta.requirements)}</p><div class="report-links"><a href="#comparison">汇总对照表 ↓</a><a href="#report-analysis">大模型结论 ↓</a><span>全部动作、数值与原始响应均可离线查看</span></div></header><div data-comparison data-run-id="${e(meta.id)}">${comparisonOverview(data)}<section id="report-analysis" class="report-analysis-section"><h2>大模型结论</h2>${analysisHtml}</section>${comparisonSummary(data)}${comparisonDetails(data, { rawRuns })}</div><p class="report-footer">实验 ${e(meta.id)} · 报告基于本机缓存生成，未重新请求 solver 或大模型。原始 JSON 链接指向同目录文件；完整内容已嵌入本页。</p></main><script>${comparisonScript}</script></body></html>`
}
