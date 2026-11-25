import Decimal from 'decimal.js'
import { record } from '../analysis/strategy'
import type { horizontalResults } from './workbench'
import type { CachedRunType } from '../storage/session'

export type ComparisonData = ReturnType<typeof horizontalResults>
type Scene = ComparisonData['scenes'][number]
type Group = Scene['styles'][number]
export const escapeHtml = (value: unknown) =>
  (typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : (JSON.stringify(value) ?? '')
  ).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
const e = escapeHtml
const percent = (value: number | null, precise = false) =>
  value === null
    ? '—'
    : value > 0 && value < 0.000001
      ? '&lt;0.000001%'
      : `${new Decimal(value).toFixed(precise ? 6 : 2)}%`
const ev = (value: number | null) => (value === null ? '—' : new Decimal(value).toFixed(4))
const rateNames = ['弃牌', '跟注', '过牌', '主动']
const outcomeNames: Record<string, string> = {
  fits: '方向符合预期',
  same: '方向指标差异不明显',
  counter: '存在反向变化',
  incomplete: '数据不全',
  source: '来源变化',
  ready: '自定义玩家对比',
}

function stackedRates(rates: number[]) {
  let x = new Decimal(0)
  const bars = rates
    .map((rate, i) => {
      const width = Decimal.max(0, Decimal.min(100, rate, new Decimal(100).minus(x)))
      const rect = `<rect x="${x.toString()}" y="0" width="${width.toString()}" height="6" class="wb-rate-${i}"></rect>`
      x = x.plus(width)
      return rect
    })
    .join('')
  return `<svg class="wb-segments" viewBox="0 0 100 6" preserveAspectRatio="none" role="img" aria-label="${e(rates.map((r, i) => `${rateNames[i]} ${r}%`).join('，'))}">${bars}</svg>`
}
function probabilityBar(value: number | null) {
  return `<svg class="wb-prob-bar" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="4" class="wb-track"></rect><rect width="${value === null ? 0 : Decimal.max(0, Decimal.min(100, value)).toString()}" height="4" class="wb-fill"></rect></svg>`
}
function ratesCell(group: Group, repeats: number, index: number) {
  return `<div class="wb-style-${index}">${group.rates ? `${stackedRates(group.rates)}<div class="wb-frequencies">${group.rates.map((r, i) => `<div><span>${rateNames[i]}</span><b title="${r}%">${percent(r)}</b></div>`).join('')}</div>` : '<p class="wb-missing">尚无有效结果</p>'}<div class="wb-recommend"><span>实际推荐 / ${group.successful} 次成功 · 计划 ${repeats} 次</span>${group.picks.map((p) => `<strong class="${p.ok ? '' : 'wb-failed'}">第 ${p.repeat} 次 ${e(p.label)}</strong>`).join('') || '<strong>尚未执行</strong>'}</div></div>`
}
function filterOptions(values: string[], labels?: Record<string, string>) {
  return values
    .map((value) => `<option value="${e(value)}">${e(labels?.[value] ?? value)}</option>`)
    .join('')
}

export function comparisonOverview(data: ComparisonData) {
  const counts = data.counts
  const standard =
    data.styles.length === 3 &&
    data.styles.every(
      (style, i) =>
        style.id === ['loose-weak', 'tight-aggressive', 'gto'][i] &&
        style.preflop === ['vpip68-pfr7', 'vpip22-pfr16', 'gto'][i] &&
        style.postflop === ['af0.5-wtsd79', 'af5.8-wtsd46', 'gto'][i]
    )
  const preflop = data.scenes.filter((s) => s.stage === 'preflop').length
  const missing = Math.max(0, data.totalRequests - data.successful - data.failed)
  const review = counts.counter + counts.incomplete + counts.source
  const comparable = data.scenes.filter((s) => s.complete && s.sourceValues.length === 1).length
  const title = !data.totalScenes
    ? '尚无对照场景。'
    : !data.successful
      ? '尚无有效求解结果，等待完成请求。'
      : review
        ? `本组有 ${review} 条场景需要复核。`
        : !standard
          ? `已完成 ${comparable} 条自定义玩家场景对比。`
          : counts.fits
            ? `本组 ${counts.fits} 条场景概率方向符合预期。`
            : '本组场景的方向指标差异不明显。'
  const summary = standard
    ? `${counts.fits} 条概率方向符合预期，${counts.same} 条方向指标差异不明显，${counts.counter} 条有反向变化，${counts.incomplete} 条数据不全，${counts.source} 条来源变化。`
    : `${comparable} 条场景结果完整且来源一致，${counts.incomplete} 条数据不全，${counts.source} 条来源变化。当前使用自定义玩家组合，不套用预设三风格的方向判定。`
  const interpretation = standard
    ? '翻前检查松弱更愿继续且少主动、紧凶更少继续且继续后的主动比例更高；翻后检查松弱更少主动、紧凶更主动。“方向指标差异不明显”不代表所有动作概率相同；GTO 也不必始终介于两者之间。'
    : '结合各玩家的动作概率、尺寸、EV 与实际推荐判断差异；不从玩家名称推断策略强弱。'
  const priorities = ['counter', 'source', 'incomplete']
  const reviewScenes = data.scenes
    .filter((s) => priorities.includes(s.outcome))
    .sort((a, b) => priorities.indexOf(a.outcome) - priorities.indexOf(b.outcome))
  const links = (reviewScenes.length ? reviewScenes : data.scenes).slice(0, 4)
  const stat = (label: string, value: string, description: string) =>
    `<div class="wb-overall-stat"><span>${e(label)}</span><strong>${e(value)}</strong><p>${e(description)}</p></div>`
  return `<section class="wb-overall" id="overview" aria-label="总体结论"><div class="wb-overall-heading"><h2>总体结论 <small>Overview</small></h2><span>基于本机已保存结果 · 自动汇总</span></div><div class="wb-overall-stats">${stat('对照场景', String(data.totalScenes), `翻前 ${preflop} / 翻后 ${data.totalScenes - preflop} · 每组重复 ${data.repeats} 次`)}${stat('请求成功 / 计划', `${data.successful} / ${data.totalRequests}`, `失败 ${data.failed} 次 · 未完成 ${missing} 次 · 已有响应保存在本机`)}${stat(standard ? '概率方向符合预期' : '完整可比场景', `${standard ? counts.fits : comparable} / ${data.totalScenes}`, standard ? `反向 ${counts.counter} · 指标差异不明显 ${counts.same} · 不全 ${counts.incomplete} · 来源变化 ${counts.source}` : `自定义玩家 ${data.styles.length} 个 · 不全 ${counts.incomplete} · 来源变化 ${counts.source}`)}</div><div class="wb-overall-conclusion ${!data.successful || review ? 'wb-overall-review' : ''}"><div><span class="wb-overall-eyebrow">整体判断</span><h3>${e(title)}</h3><p>${e(summary)}</p><p>${e(interpretation)}</p><span class="wb-overall-footnote">按场景概率作方向检查；不是玩家长期 VPIP / PFR，也不等同于大模型结论。</span></div><aside><h4>${reviewScenes.length ? `优先复核 · ${reviewScenes.length} 条` : '场景快捷入口'}</h4>${links.map((s) => `<a href="#scene-${e(s.id)}"><b>${e(s.id)}</b><span>${e(s.purpose)}</span><em>${e(outcomeNames[s.outcome])} ↗</em></a>`).join('') || '<p>保存场景后可在此进入明细。</p>'}${reviewScenes.length > links.length ? `<small>先显示前 ${links.length} 条；全部待复核项可在汇总表按结论筛选。</small>` : ''}</aside></div><div class="wb-overall-players">${data.styles.map((player, i) => `<div class="wb-overall-player wb-style-${i}"><h3 class="wb-style-label"><i></i>${e(player.label)}</h3><p><span>翻前</span><code>${e(player.preflop)}</code></p><p><span>翻后</span><code>${e(player.postflop)}</code></p></div>`).join('')}</div></section>`
}

export function comparisonSummary(data: ComparisonData) {
  return `<section class="panel wb-summary" id="comparison"><div class="wb-section-head"><h2>汇总对照表 <small>Strategy comparison</small></h2><div class="wb-legend">${rateNames.map((name, i) => `<span><i class="wb-rate-${i}"></i>${name}</span>`).join('')}</div></div><div class="wb-toolbar"><input type="search" data-wb-filter="search" aria-label="搜索结果场景" placeholder="编号、位置、手牌或场景…"><select data-wb-filter="stage" aria-label="筛选结果街道"><option value="all">全部街道</option>${filterOptions([...new Set(data.scenes.map((s) => s.stage))], { preflop: '翻前', flop: '翻牌', turn: '转牌', river: '河牌' })}</select><select data-wb-filter="hero" aria-label="筛选结果位置"><option value="all">全部位置</option>${filterOptions([...new Set(data.scenes.map((s) => s.hero))])}</select><select data-wb-filter="category" aria-label="筛选结果类型"><option value="all">全部类型</option>${filterOptions([...new Set(data.scenes.map((s) => s.category))])}</select><select data-wb-filter="outcome" aria-label="筛选结果结论"><option value="all">全部结论</option>${filterOptions([...new Set(data.scenes.map((s) => s.outcome))], outcomeNames)}</select><button type="button" data-wb-reset class="wb-reset">重置</button><span class="wb-result-count" data-wb-count>显示 ${data.scenes.length} / ${data.scenes.length} 个场景</span></div><div class="wb-table-wrap"><table class="wb-overview"><thead><tr><th>场景 / 快捷跳转</th>${data.styles.map((p, i) => `<th class="wb-style-${i}"><span class="wb-style-label"><i></i>${e(p.label)}</span><small>弃 / 跟 / 过 / 主动</small><code>翻前 ${e(p.preflop)}<br>翻后 ${e(p.postflop)}</code></th>`).join('')}<th>方向检查</th></tr></thead><tbody>${data.scenes.map((s) => `<tr data-wb-row="${e(s.id)}" data-search="${e([s.id, s.title, s.description, s.purpose, s.hero, s.hole.join(' '), s.board.join(' ')].join(' ').toLowerCase())}" data-stage="${s.stage}" data-hero="${e(s.hero)}" data-category="${e(s.category)}" data-outcome="${s.outcome}"><td><a class="wb-scene-link" href="#scene-${e(s.id)}">${e(s.id)} ↗</a><p class="wb-scene-desc">${e(s.title)}</p><span class="wb-chip">${e(s.stageName)} · ${e(s.hole.join(' '))}</span>${s.board.length ? `<small>公共牌 ${e(s.board.join(' '))}</small>` : ''}<a class="wb-detail-link" href="#scene-${e(s.id)}">查看动作尺寸、概率与 EV →</a></td>${s.styles.map((g, i) => `<td>${ratesCell(g, data.repeats, i)}</td>`).join('')}<td><span class="wb-status wb-outcome-${s.outcome}" title="${e(s.judgement)}">${e(outcomeNames[s.outcome])}</span><small>${e(s.category)}</small><small>${s.complete ? '完整重复样本' : '含未完成或失败条目'}</small></td></tr>`).join('')}</tbody></table></div><p class="wb-empty" data-wb-empty hidden>没有匹配的场景，请调整筛选条件。</p><div class="wb-table-note">主动 = 下注 + 加注 + 全下。各格为有效重复的平均概率；推荐与最高概率动作分开显示。方向检查只针对既定指标，不能据此忽略跟注与弃牌差异。</div></section>`
}

function cards(values: string[]) {
  const suits: Record<string, string> = { c: '♣', d: '♦', h: '♥', s: '♠' }
  return values.length
    ? `<div class="wb-cards">${values.map((card) => `<span class="wb-card ${['h', 'd'].includes(card[1]) ? 'wb-red' : ''}"><b>${e(card[0])}</b><span>${suits[card[1]] ?? ''}</span></span>`).join('')}</div>`
    : '<span class="wb-muted">尚未发出公共牌</span>'
}
function rawId(id: string) {
  return `wb-raw-${id}`
}
function rawBody(value: unknown) {
  return `<h4>原始响应 JSON</h4><pre class="wb-raw-json">${e(JSON.stringify(record(value).response, null, 2))}</pre><details><summary>查看完整请求 JSON</summary><pre class="wb-raw-json">${e(JSON.stringify(record(value).request, null, 2))}</pre></details><details><summary>查看完整缓存记录（含状态与耗时）</summary><pre class="wb-raw-json">${e(JSON.stringify(value, null, 2))}</pre></details>`
}

export function rawRunView(value: unknown) {
  const run = record(value)
  const raw = record(record(run.response).strategy).actions
  const labels: Record<string, string> = {
    fold: '弃牌',
    call: '跟注',
    check: '过牌',
    raise: '加注到',
    bet: '下注',
    allin: '全下',
  }
  const actionRows = Array.isArray(raw)
    ? (raw as unknown[])
        .map((item) => {
          const candidate = record(item)
          const action = record(candidate.action)
          const probability =
            typeof candidate.hand_strategy === 'number' && Number.isFinite(candidate.hand_strategy)
              ? new Decimal(candidate.hand_strategy).mul(100).toNumber()
              : null
          return `<tr><td>${e(labels[String(action.action)] ?? action.action)}</td><td>${e(action.amount ?? '—')}</td><td>${typeof action.amount === 'number' && Number.isFinite(action.amount) ? new Decimal(action.amount).div(100).toString() : '—'} BB</td><td>${e(action.pot_size ?? '—')}</td><td>${e(action.seat_no ?? '—')}</td><td>${percent(probability, true)}<small>原值 ${e(candidate.hand_strategy ?? '—')}</small></td><td>${e(candidate.hand_ev ?? '—')}</td></tr>`
        })
        .join('')
    : ''
  return `<p class="wb-muted">${run.ok ? '成功响应' : '失败或无效响应'} · ${e(run.elapsedMs)} ms${run.problem ? ` · ${e(run.problem)}` : ''}</p>${actionRows ? `<h4>本次响应的动作与具体数值</h4><div class="wb-table-wrap"><table class="wb-raw-actions"><thead><tr><th>操作</th><th>amount 原值</th><th>amount / BB</th><th>pot_size 原值</th><th>seat_no</th><th>hand_strategy / 概率</th><th>hand_ev 原值</th></tr></thead><tbody>${actionRows}</tbody></table></div>` : ''}${rawBody(value)}`
}

export function comparisonDetails(
  data: ComparisonData,
  options: { experimentId?: string; rawRuns?: CachedRunType[] } = {}
) {
  const baseline = data.styles.findIndex((p) => p.id === data.baselineId)
  return data.scenes
    .map(
      (s, sceneIndex) =>
        `<article class="panel wb-scene" id="scene-${e(s.id)}" data-wb-scene="${e(s.id)}"><div class="wb-section-head"><div><h2><span class="wb-big-id">${e(s.id)}</span>${e(s.purpose)}</h2><p class="wb-muted">${e(s.hero)} · ${e(s.stageName)} · ${e(s.category)}</p></div><a href="#comparison" class="wb-back">返回汇总 ↑</a></div><div class="wb-hand"><div><span class="wb-mini-label">HERO / ${e(s.hero)}</span>${cards(s.hole)}</div><div><span class="wb-mini-label">BOARD / 公共牌</span>${cards(s.board)}</div><div class="wb-pot"><div><small>当前底池</small><strong>${s.pot}<em>BB</em></strong></div><div><small>待跟注</small><strong>${s.call}<em>BB</em></strong></div><div><small>Hero 剩余</small><strong>${s.stack}<em>BB</em></strong></div></div></div><details class="wb-timeline"><summary>完整行动路线 / 决策点</summary><div>${s.timeline.map(([stage, action]) => `<p><span>${e(stage)}</span>${e(action)}</p>`).join('')}</div></details><div class="wb-decisions">${s.styles.map((g, i) => `<div class="wb-decision wb-style-${i}"><h3 class="wb-style-label"><i></i>${e(data.styles[i].label)}</h3><div class="wb-picked">${g.picks.map((p) => `<strong>第 ${p.repeat} 次 ${e(p.label)}</strong>`).join('') || '尚未执行'}</div><p class="wb-muted">最高概率候选${g.tops.map((p) => `<span>第 ${p.repeat} 次 ${e(p.label)} · ${percent(p.probability)}</span>`).join('')}</p><div class="wb-decision-meta"><span>有效重复 / 计划</span><b>${g.successful} / ${data.repeats}</b></div><div class="wb-decision-meta"><span>最大单动作重复差</span><b>${g.maxRepeatDeltaPp === null ? '样本不足' : `${g.maxRepeatDeltaPp.toFixed(6)} pp`}</b></div>${g.diagnostics.map((d) => `<button type="button" class="wb-raw-link" data-wb-open-raw="${rawId(d.id)}">查看第 ${d.repeat} 次原始响应 ↗</button>`).join('')}</div>`).join('')}</div><div class="wb-insight"><strong>${e(s.judgement)}。</strong> 候选金额采用接口原值换算为 BB；实际补入金额以“待跟注”为准。各风格仅改变当前决策玩家的档位。</div><details class="wb-candidates" id="wb-options-${e(s.id)}" open><summary>完整行动选项、尺寸、概率与 EV <span>· ${s.actions.length} 个对齐候选 · 默认展开</span></summary><div class="wb-table-wrap"><table class="wb-candidate-table"><thead><tr><th>动作 / 尺寸</th>${data.styles.map((p, i) => `<th class="wb-style-${i}">${e(p.label)}<small>平均概率 / EV${baseline >= 0 ? ` / 相对 ${e(data.styles[baseline].label)}` : ''}</small></th>`).join('')}</tr></thead><tbody>${s.actions
          .map(
            (action) =>
              `<tr><td class="wb-action-name">${e(action.label)}</td>${action.cells
                .map((cell, i) => {
                  const base = baseline >= 0 ? action.cells[baseline].probability : null
                  const delta =
                    cell.probability !== null && base !== null && i !== baseline
                      ? new Decimal(cell.probability).minus(base)
                      : null
                  return `<td class="wb-style-${i}"><div class="wb-candidate-number"><b title="${cell.probability ?? '缺失'}%">${percent(cell.probability, true)}</b><span title="${cell.ev ?? '缺失'}">EV ${ev(cell.ev)}</span>${delta ? `<small>Δ ${delta.isPositive() ? '+' : ''}${delta.toFixed(4)} pp</small>` : ''}</div>${probabilityBar(cell.probability)}</td>`
                })
                .join('')}</tr>`
          )
          .join(
            ''
          )}</tbody></table></div><div class="wb-table-note">相同动作的不同尺寸分别列出，按类型、金额、底池比例、座位对齐。概率对有效重复取平均；有效响应中缺少某候选按 0 计概率，EV 不补 0。失败 / 缺失不是 0。EV 保留原接口单位。悬停数值可查看更多精度。</div></details><details class="wb-raw-section" id="wb-raw-section-${e(s.id)}"><summary>档位匹配、重复波动、失败与原始响应 <span>· ${s.styles.reduce((sum, g) => sum + g.diagnostics.length, 0)} 条缓存</span></summary><div class="wb-raw-groups">${s.styles
          .map(
            (g, i) =>
              `<div class="wb-raw-group wb-style-${i}"><h3 class="wb-style-label"><i></i>${e(data.styles[i].label)}</h3>${
                g.diagnostics
                  .map((d) => {
                    const cached = options.rawRuns?.find((r) => r.id === d.id)
                    const url = options.experimentId
                      ? `/api/experiments/${encodeURIComponent(options.experimentId)}/raw/${encodeURIComponent(d.id)}.json`
                      : `${encodeURIComponent(d.id)}.json`
                    return `<details id="${rawId(d.id)}" class="wb-raw-entry" ${options.experimentId ? `data-wb-raw-url="${url}"` : ''}><summary>第 ${d.repeat} 次 · ${d.ok ? '成功' : '失败'} · ${e(d.profile)} · ${d.elapsedMs} ms</summary><p class="wb-muted">模型来源：${e(d.source ?? '缺失')}<br>档位回显：${e(JSON.stringify(d.profileConfig ?? null))}${d.problem ? `<br>问题：${e(d.problem)}` : ''}</p><details><summary>查看诊断字段</summary><pre class="wb-raw-json">${e(JSON.stringify(d, null, 2))}</pre></details><div data-wb-raw-body>${cached ? rawRunView(cached) : options.experimentId ? '<p class="wb-muted">展开后读取本机缓存，不请求 solver。</p>' : '<p class="wb-muted">本条原始缓存未嵌入。</p>'}</div><a class="wb-download" href="${url}" target="_blank" rel="noopener">打开完整原始 JSON ↗</a></details>`
                  })
                  .join('') || '<p class="wb-muted">暂无缓存</p>'
              }</div>`
          )
          .join(
            ''
          )}</div></details><div class="wb-scene-footer"><a href="${sceneIndex ? `#scene-${e(data.scenes[sceneIndex - 1].id)}` : '#comparison'}">← ${sceneIndex ? '上一局' : '汇总表'}</a><span>${sceneIndex + 1} / ${data.scenes.length}</span><a href="${sceneIndex + 1 < data.scenes.length ? `#scene-${e(data.scenes[sceneIndex + 1].id)}` : '#comparison'}">${sceneIndex + 1 < data.scenes.length ? '下一局' : '汇总表'} →</a></div></article>`
    )
    .join('')
}

export function installComparisonInteractions(
  root: Document,
  onRaw?: (entry: HTMLDetailsElement) => Promise<void>
) {
  if (root.documentElement.dataset.wbComparisonInstalled) {
    return
  }
  root.documentElement.dataset.wbComparisonInstalled = 'true'
  const apply = (container: HTMLElement) => {
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-wb-filter]')
    )
    const values = Object.fromEntries(
      inputs.map((input) => [input.dataset.wbFilter!, input.value.trim().toLowerCase()])
    )
    let visible = 0
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-wb-row]'))
    for (const row of rows) {
      const match =
        (!values.search || row.dataset.search?.includes(values.search)) &&
        ['stage', 'hero', 'category', 'outcome'].every(
          (key) =>
            !values[key] || values[key] === 'all' || row.dataset[key]?.toLowerCase() === values[key]
        )
      row.hidden = !match
      const detail = root.getElementById(`scene-${row.dataset.wbRow}`)
      if (detail) {
        detail.hidden = !match
      }
      if (match) {
        visible++
      }
    }
    const count = container.querySelector('[data-wb-count]')
    if (count) {
      count.textContent = `显示 ${visible} / ${rows.length} 个场景`
    }
    const empty = container.querySelector<HTMLElement>('[data-wb-empty]')
    if (empty) {
      empty.hidden = visible > 0
    }
  }
  const filter = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.matches('[data-wb-filter]')) {
      const container = target.closest<HTMLElement>('[data-comparison]')
      if (container) {
        apply(container)
      }
    }
  }
  root.addEventListener('input', filter)
  root.addEventListener('change', filter)
  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const reset = target.closest('[data-wb-reset]')
    const sceneLink = target.closest<HTMLAnchorElement>('a[href^="#scene-"]')
    const hiddenScene = sceneLink && root.getElementById(sceneLink.hash.slice(1))?.hidden
    if (reset || hiddenScene) {
      const container = (reset ?? sceneLink)?.closest<HTMLElement>('[data-comparison]')
      if (container) {
        container
          .querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-wb-filter]')
          .forEach((input) => {
            input.value = input.dataset.wbFilter === 'search' ? '' : 'all'
          })
        apply(container)
      }
    }
    const opener = target.closest<HTMLElement>('[data-wb-open-raw]')
    if (opener) {
      const entry = root.getElementById(opener.dataset.wbOpenRaw!) as HTMLDetailsElement | null
      if (entry) {
        let parent: HTMLElement | null = entry
        while (parent) {
          if (parent.tagName === 'DETAILS') {
            ;(parent as HTMLDetailsElement).open = true
          }
          parent = parent.parentElement
        }
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
  root.addEventListener(
    'toggle',
    (event) => {
      const entry = event.target as HTMLDetailsElement
      if (entry.open && entry.dataset.wbRawUrl && onRaw) {
        void onRaw(entry)
      }
    },
    true
  )
}

export const comparisonScript = `(${installComparisonInteractions.toString()})(document);`
