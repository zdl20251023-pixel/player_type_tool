import type {
  ExperimentMeta,
  PlayerConfig,
  PromptTask,
  PromptVersion,
  WorkbenchSettings,
  ModelImage,
  ModelOption,
  Provider,
  ModelJob,
} from '../contracts/workbench'
import type { ScenarioFixture } from '../scenarios'
import type { catalogOptions } from '../profiles/catalog'
import type { horizontalResults } from '../reports/workbench'
import Decimal from 'decimal.js'
import {
  comparisonSummary,
  comparisonOverview,
  comparisonDetails,
  installComparisonInteractions,
  rawRunView,
} from '../reports/comparison-view'
import { modelPresets } from '../client/model-presets'
import { ScenarioBatchUI } from './scenario-batches'

type Settings = WorkbenchSettings & {
  keys: Record<string, boolean>
  solverConfigured: boolean
  modelPresets?: Partial<Record<Provider, ModelOption[]>>
}
type Boot = {
  settings: Settings
  catalog: ReturnType<typeof catalogOptions>
  fixtures: ScenarioFixture[]
  defaults: WorkbenchSettings['prompts']
  features?: { modelJobs?: boolean; scenarioBatches?: boolean }
}
type Detail = {
  analysisStale: boolean
  meta: ExperimentMeta
  data: ReturnType<typeof horizontalResults>
  analysis: {
    summary: string
    scenes: { id: string; conclusion: string }[]
    limitations: string[]
  } | null
}
type Draft = {
  name: string
  requirements: string
  count: number
  repeats: number
  playerIds: string[]
  fixtures: ScenarioFixture[]
}

const app = document.querySelector<HTMLElement>('#app')!
const e = (v: unknown) =>
  (typeof v === 'string'
    ? v
    : typeof v === 'number' || typeof v === 'boolean'
      ? String(v)
      : (JSON.stringify(v) ?? '')
  ).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
const percent = (v: number) => new Decimal(v).mul(100).toNumber()
const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T
const val = (id: string) => $<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id).value
const date = (v: string) =>
  new Date(v).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
const pretty = (v: unknown) => JSON.stringify(v, null, 2)
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toFixed(2)}%`)
const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
const stages: Record<string, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
  postflop: '翻后',
}
const statuses: Record<string, string> = {
  draft: '待执行',
  running: '执行中',
  completed: '已完成',
  failed: '需复核',
  interrupted: '执行中断',
}
const taskLabels: Record<PromptTask, string> = {
  player: '风格推荐',
  scenarios: '场景生成',
  analysis: '结论分析',
}
let boot: Boot
let draft: Draft
let page = 'experiment'
let experimentTab = 'new'
let detail: Detail | null = null
let experiments: ExperimentMeta[] = []
let promptTask: PromptTask = 'player'
let promptDrafts: WorkbenchSettings['prompts']
let validation: Record<
  string,
  { board: string[]; potBb: number; toCallBb: number; stackBb: number }
> = {}
let playerRecommendation: PlayerConfig | null = null
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let pollTimer: ReturnType<typeof setTimeout> | undefined
let catalogPage = 0
const images: Record<PromptTask | 'test', ModelImage[]> = {
  player: [],
  scenarios: [],
  analysis: [],
  test: [],
}
const remoteModels = new Map<string, ModelOption[]>()
const callTaskLabels = { ...taskLabels, test: '快速测试' }
type PendingModel = {
  callId: string
  task: PromptTask
  operation: 'generate' | 'regenerate' | 'recommend' | 'analyze'
  routeId?: string
  experimentId?: string
  signature?: string
}
let pendingModel: PendingModel | null = null
let finishedModelResult: unknown = null
let modelSubmitting = false
const scenarioBatches = new ScenarioBatchUI({
  api,
  input: () => inputFor('scenarios'),
  enabled: () => Boolean(boot?.features?.scenarioBatches),
  notice,
  preview: (content) => {
    $('preview-content').textContent = content
    $<HTMLDialogElement>('preview-dialog').showModal()
  },
  apply: (fixtures) => {
    captureDraft()
    draft.fixtures = fixtures
    validation = {}
    persist()
    render()
    notice(`已将 ${fixtures.length} 条已校验临时结果放入草稿，可独立执行 solver`)
  },
})

function draftSignature() {
  return pretty([draft.requirements, draft.count, draft.playerIds, draft.fixtures])
}
function savePendingModel() {
  try {
    if (pendingModel) {
      localStorage.setItem('strategy-lab-model-job', pretty(pendingModel))
    } else {
      localStorage.removeItem('strategy-lab-model-job')
    }
  } catch {
    /* 服务端记录仍可查询 */
  }
}
function modelPanel(html: string) {
  const panel = document.getElementById('model-progress')
  if (panel) {
    panel.hidden = false
    panel.innerHTML = html
  }
}
async function applyModelResult(pending: PendingModel, result: unknown) {
  captureDraft()
  if (pending.operation === 'generate') {
    draft.fixtures = result as ScenarioFixture[]
    validation = {}
    persist()
  }
  if (pending.operation === 'regenerate') {
    const index = draft.fixtures.findIndex((s) => s.id === pending.routeId)
    if (index < 0) {
      throw new Error('原路线已移除，请从调用记录查看生成结果')
    }
    draft.fixtures[index] = { ...(result as ScenarioFixture[])[0], id: pending.routeId! }
    validation = {}
    persist()
  }
  const description = document.getElementById('player-description') as HTMLTextAreaElement | null
  const descriptionValue = description?.value
  if (pending.operation === 'recommend') {
    playerRecommendation = result as PlayerConfig
  }
  if (pending.operation === 'analyze' && detail?.meta.id === pending.experimentId) {
    await refreshDetail()
  }
  pendingModel = null
  finishedModelResult = null
  savePendingModel()
  render()
  if (descriptionValue && page === 'players') {
    $<HTMLTextAreaElement>('player-description').value = descriptionValue
  }
  modelPanel(
    `<h3>${taskLabels[pending.task]}已完成</h3><p class="muted">结果已保存并应用。调用 ${e(pending.callId)}</p>`
  )
  notice(`${taskLabels[pending.task]}已完成，调用记录 ${pending.callId}`)
}
async function watchModelJob(pending: PendingModel) {
  let failures = 0
  while (pendingModel?.callId === pending.callId) {
    let job: ModelJob & { result: unknown }
    try {
      job = await api(`/model/jobs/${pending.callId}`)
      failures = 0
    } catch (error) {
      if (++failures >= 3) {
        modelPanel(
          '<p class="error">暂时无法读取任务状态。任务不会因页面断线而重发；刷新页面可继续查看。</p>'
        )
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }
    if (job.status === 'failed' || job.status === 'interrupted') {
      pendingModel = null
      savePendingModel()
      modelPanel(
        `<h3>${taskLabels[pending.task]}未完成</h3><p class="error">${e(job.problem)}</p><p class="muted">耗时 ${Math.round(job.elapsedMs / 1000)} 秒；请求和已接收片段已保留。不会自动重试。</p>`
      )
      throw new Error(job.problem ?? '大模型任务未完成')
    }
    if (job.status === 'completed') {
      captureDraft()
      if (pending.signature && pending.signature !== draftSignature()) {
        finishedModelResult = job.result
        modelPanel(
          `<h3>生成已完成，草稿已修改</h3><p class="muted">结果已保存，尚未覆盖当前草稿。调用 ${e(pending.callId)}</p><div class="actions">${button('应用生成结果', 'apply-model-result')}${button('保留当前草稿', 'dismiss-model-result', true)}</div>`
        )
      } else {
        await applyModelResult(pending, job.result)
      }
      return
    }
    const phase =
      job.progress.phase === 'connecting'
        ? '正在连接并等待模型响应'
        : job.progress.phase === 'validating'
          ? '正在校验模型输出'
          : job.progress.contentChars
            ? '正在接收输出'
            : '模型正在处理 / 思考'
    modelPanel(
      `<h3>${taskLabels[pending.task]} · ${phase}</h3><p class="muted">已等待 ${Math.round(job.elapsedMs / 1000)} 秒 / 上限 ${job.timeoutMs / 1000} 秒 · 输出 ${job.progress.contentChars} 字符 · 思考内容 ${job.progress.reasoningChars} 字符</p><p class="muted">任务在后台运行，刷新页面可继续查看；不要重复点击生成。调用 ${e(pending.callId)}</p>`
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
async function runModelJob(input: unknown, context: Omit<PendingModel, 'callId' | 'task'>) {
  if (pendingModel || modelSubmitting) {
    throw new Error('已有大模型任务，请等待完成或处理已生成结果')
  }
  if (!boot.features?.modelJobs) {
    throw new Error('当前 Web 服务尚未启用后台模型任务，请重启 bun run web 后刷新页面')
  }
  const task = (input as { task: PromptTask }).task
  const signature =
    context.operation === 'generate' || context.operation === 'regenerate'
      ? draftSignature()
      : undefined
  modelPanel(`<h3>正在提交${taskLabels[task]}任务…</h3>`)
  modelSubmitting = true
  let started: { callId: string }
  try {
    started = await api<{ callId: string }>('/model/start', input)
  } catch (error) {
    modelPanel(`<p class="error">${e(error instanceof Error ? error.message : '任务提交失败')}</p>`)
    throw error
  } finally {
    modelSubmitting = false
  }
  pendingModel = { ...context, signature, task, callId: started.callId }
  savePendingModel()
  await watchModelJob(pendingModel)
}

function imageCards(task: keyof typeof images) {
  return images[task]
    .map(
      (image, i) =>
        `<div class="image-item"><img src="data:${image.mimeType};base64,${image.data}" alt="${e(image.name)}"><span>${e(image.name)}</span>${button('移除', 'remove-image', true, `data-task="${task}" data-index="${i}"`)}</div>`
    )
    .join('')
}
function imagePicker(task: keyof typeof images) {
  return `<div class="image-picker"><label class="field">参考图片（可选）<input type="file" accept="image/png,image/jpeg,image/webp" multiple data-image-task="${task}"></label><p class="muted">PNG / JPEG / WebP，每张最多 2 MiB，最多 4 张、总计 6 MiB。仅在点击 AI 执行或测试时发送给当前模型服务商；预览不发送。</p><div id="images-${task}" class="image-previews">${imageCards(task)}</div></div>`
}
async function loadImages(input: HTMLInputElement) {
  const task = input.dataset.imageTask as keyof typeof images
  const selected = Array.from(input.files ?? [])
  if (images[task].length + selected.length > 4) {
    throw new Error('最多上传 4 张图片')
  }
  const added: ModelImage[] = []
  for (const file of selected) {
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024 ||
      !file.size
    ) {
      throw new Error('请选择不超过 2 MiB 的 PNG、JPEG、WebP 图片')
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('图片读取失败'))
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(file)
    })
    added.push({
      name: file.name,
      mimeType: file.type as ModelImage['mimeType'],
      data: dataUrl.split(',')[1],
    })
  }
  const combined = [...images[task], ...added]
  if (combined.reduce((sum, image) => sum + image.data.length, 0) > 8 * 1024 * 1024) {
    throw new Error('图片总大小不能超过 6 MiB')
  }
  images[task] = combined
  input.value = ''
  $(`images-${task}`).innerHTML = imageCards(task)
}
function modelForm() {
  return {
    model: {
      provider: val('model-provider'),
      model: val('model-name'),
      baseUrl: val('model-base'),
      temperature: Number(val('model-temperature')),
      maxTokens: Number(val('model-tokens')),
      timeoutMs: Number(val('model-timeout')) * 1000,
    },
    ...(val('model-key') ? { apiKey: val('model-key') } : {}),
  }
}
function modelChoices(provider: Provider, baseUrl: string) {
  return (
    remoteModels.get(`${provider}:${baseUrl.replace(/\/+$/, '')}`) ??
    boot.settings.modelPresets?.[provider] ??
    modelPresets[provider]
  )
}
function choiceOptions(provider: Provider, baseUrl: string, current: string) {
  return options(
    [
      { value: '', label: '自定义模型 ID（在下方填写）' },
      ...modelChoices(provider, baseUrl).map((m) => ({
        value: m.id,
        label: `${m.label} · ${m.id} · ${m.vision === true ? '支持图片' : m.vision === false ? '仅文本' : '图片能力待确认'}`,
      })),
    ],
    modelChoices(provider, baseUrl).some((m) => m.id === current) ? current : ''
  )
}
function modelInfo() {
  if (!$('model-info')) {
    return
  }
  const list = modelChoices(val('model-provider') as Provider, val('model-base'))
  const selected = list.find((m) => m.id === val('model-name'))
  $('model-info').textContent = selected
    ? `${selected.source === 'remote' ? '服务端列表' : '内置参考列表'} · ${selected.note}`
    : '自定义模型：图片和 JSON 输出能力由 API 服务决定，可使用下方快速测试确认。'
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    `/api${path}`,
    body === undefined
      ? { cache: 'no-store' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
  )
  const data: unknown = await response.json()
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`)
  }
  return data as T
}
function notice(message: string) {
  clearTimeout(noticeTimer)
  $('notice').textContent = message
  $('notice').hidden = false
  noticeTimer = setTimeout(() => {
    $('notice').hidden = true
  }, 12000)
}
function persist() {
  try {
    localStorage.setItem('strategy-lab-draft-v1', pretty(draft))
  } catch {
    /* 浏览器存储不可用时仍可操作 */
  }
}
function selectedPlayers() {
  return boot.settings.players.filter((p) => draft.playerIds.includes(p.id))
}
function button(label: string, action: string, secondary = false, extra = '') {
  return `<button data-action="${action}" class="${secondary ? 'secondary' : ''}" ${extra}>${label}</button>`
}
function header(title: string, subtitle: string, actions = '') {
  return `<header><div><h1>${title}</h1><p>${subtitle}</p></div><div class="header-buttons">${actions}</div></header>`
}
function options(values: { value: string; label: string }[], selected = '') {
  return values
    .map(
      (v) =>
        `<option value="${e(v.value)}" ${v.value === selected ? 'selected' : ''}>${e(v.label)}</option>`
    )
    .join('')
}
function field(label: string, id: string, value: unknown, type = 'text', extra = '') {
  return `<label class="field">${label}<input id="${id}" type="${type}" value="${e(value)}" ${extra}></label>`
}
function area(label: string, id: string, value: string, code = false, extra = '') {
  return `<label class="field">${label}<textarea id="${id}" class="${code ? 'code' : ''}" ${extra}>${e(value)}</textarea></label>`
}
function profileSelect(stage: string, id: string, selected: string) {
  return `<label class="field">${stage === 'preflop' ? '翻前' : '翻后'} profileName<select id="${id}">${options(
    boot.catalog
      .filter((p) => p.executable && p.stage === stage)
      .map((p) => ({
        value: p.name,
        label: `${p.name} · VPIP ${pct(percent(p.vpip))} / PFR ${pct(percent(p.pfr))} / AF ${p.af} / WTSD ${pct(percent(p.wtsd))}`,
      })),
    selected
  )}</select></label>`
}
function playerCards(selectable: boolean) {
  return boot.settings.players
    .map(
      (p) =>
        `<div class="player-card ${selectable && draft.playerIds.includes(p.id) ? 'selected' : ''}"><label>${selectable ? `<input type="checkbox" data-player="${e(p.id)}" ${draft.playerIds.includes(p.id) ? 'checked' : ''}>` : ''}${e(p.label)}</label><p>${e(p.description)}</p><code>翻前 ${e(p.preflop)}<br>翻后 ${e(p.postflop)}</code>${!selectable ? `<div class="actions">${button('编辑', 'edit-player', true, `data-id="${e(p.id)}"`)}${button('删除', 'delete-player', true, `data-id="${e(p.id)}"`)}</div>` : ''}</div>`
    )
    .join('')
}
function routeCards() {
  return (
    draft.fixtures
      .map((f, i) => {
        const v = validation[f.id]
        return `<article class="route-card"><div class="panel-header"><h3>${e(f.id)} · ${e(f.description)}</h3><span class="badge ${v ? '' : 'warn'}">${v ? '已校验' : '待校验'}</span></div><p>${positions[f.hero]} · ${e(f.cards)} · ${stages[f.street]} · ${e(f.category)}</p><pre>${e(f.line || '尚无自愿行动')}</pre><p>${e(f.history)}</p>${v ? `<span class="chip">底池 ${v.potBb}BB</span><span class="chip">待跟 ${v.toCallBb}BB</span><span class="chip">剩余 ${v.stackBb}BB</span>` : ''}
    <details><summary>编辑此路线</summary><div class="grid">${field('场景编号', `route-${i}-id`, f.id, 'text', `data-route="${i}" data-key="id"`)}${field('Hero 底牌', `route-${i}-cards`, f.cards, 'text', `data-route="${i}" data-key="cards"`)}<label class="field">Hero 位置<select data-route="${i}" data-key="hero">${options(
      positions.map((p, j) => ({ value: String(j), label: p })),
      String(f.hero)
    )}</select></label><label class="field">街道<select data-route="${i}" data-key="street">${options(
      ['preflop', 'flop', 'turn', 'river'].map((s) => ({ value: s, label: stages[s] })),
      f.street
    )}</select></label></div>${field('设计目的', `route-${i}-description`, f.description, 'text', `data-route="${i}" data-key="description"`)}${field('场景类型', `route-${i}-category`, f.category, 'text', `data-route="${i}" data-key="category"`)}${area('完整行动线（金额 BB）', `route-${i}-line`, f.line, false, `data-route="${i}" data-key="line"`)}${area('路线说明', `route-${i}-history`, f.history, false, `data-route="${i}" data-key="history"`)}</details><div class="actions">${button('重新生成这条', 'regenerate-route', true, `data-index="${i}"`)}${button('移除此路线', 'remove-route', true, `data-index="${i}"`)}</div></article>`
      })
      .join('') || '<div class="empty">尚无场景。使用已有路线，或让大模型按要求生成。</div>'
  )
}
function newExperiment() {
  return `<div class="steps"><div class="step active"><b>01</b>配置玩家</div><div class="step active"><b>02</b>设计场景</div><div class="step"><b>03</b>执行求解</div><div class="step"><b>04</b>对比与分析</div></div>
  <section class="panel"><div class="panel-header"><h2>实验设置 <small>Experiment setup</small></h2><span class="chip">6 人 · 100BB · 无前注 · 无抓注</span></div><div class="grid">${field('实验名称', 'experiment-name', draft.name)}${field('每组重复次数', 'repeats', draft.repeats, 'number', 'min="1" max="10"')}</div><div class="grid three">${playerCards(true)}</div><p class="muted">需要自定义风格？在「玩家配置库」描述、推荐并保存，再回到这里选择。</p></section>
  <section class="panel"><div class="panel-header"><h2>场景设计 <small>Scenario design</small></h2><span class="muted">先预览、再校验，执行前保留完整快照</span></div><div class="split"><div>${area('描述实验要求', 'requirements', draft.requirements)}${imagePicker('scenarios')}<div class="grid">${field('生成数量', 'scenario-count', draft.count, 'number', 'min="1" max="100"')}<label class="field">已有场景街道筛选<select id="fixture-stage">${options([{ value: 'all', label: '全部街道' }, ...['preflop', 'flop', 'turn', 'river'].map((s) => ({ value: s, label: stages[s] }))])}</select></label></div>${scenarioBatches.controls()}<div class="actions">${button('预览分批计划与提示词', 'preview-scenarios', true)}${button('AI 分批生成场景', 'generate-scenarios')}${button('使用代表路线', 'use-representative', true)}${button('选用已有场景', 'use-existing', true)}</div></div><aside class="aside-panel"><h3>一组场景，多种风格</h3><p>所有玩家使用相同底牌、公共牌和历史，只改变当前决策玩家的策略档位。</p><p>先比较概率、EV 与动作尺寸，再让大模型解释差异。</p><p>${boot.settings.keys[boot.settings.model.provider] ? '● 大模型密钥已配置' : '○ 请先配置大模型密钥'}<br>${boot.settings.solverConfigured ? '● Solver 地址已配置' : '○ 请在 .env 配置 solver 地址'}</p><a href="#settings">管理模型与提示词 →</a></aside></div></section>
  <section id="scenario-batch-panel" class="panel">${scenarioBatches.view()}</section><section class="panel"><div class="panel-header"><h2>场景预览 <small>${draft.fixtures.length} routes</small></h2>${button('校验全部路线', 'validate-routes', true)}</div><p class="muted">f 弃牌 / c 跟注 / x 过牌 / r 加注到 / b 下注 / @ 发公共牌。BTN=0、SB=1、BB=2、UTG=3、HJ=4、CO=5。</p>${routeCards()}<details><summary>批量 JSON 编辑 / 导入</summary>${area('场景数组', 'fixtures-json', pretty(draft.fixtures), true)}${button('应用 JSON', 'apply-json', true)}</details><div class="actions">${button('保存实验并查看请求计划', 'create-experiment')}<span class="hint">${draft.fixtures.length} 场景 × ${selectedPlayers().length} 玩家 × ${draft.repeats} 次 = ${draft.fixtures.length * selectedPlayers().length * draft.repeats} 次 solver 请求</span></div></section>`
}
function history() {
  return `<section class="panel"><div class="panel-header"><h2>实验记录</h2>${button('刷新', 'refresh-experiments', true)}</div>${experiments.length ? `<div class="table-wrap"><table><thead><tr><th>实验</th><th>创建时间（上海）</th><th>场景 / 玩家</th><th>进度</th><th>状态</th><th></th></tr></thead><tbody>${experiments.map((m) => `<tr><td>${e(m.name)}<small>${e(m.id.slice(0, 8))}</small></td><td>${date(m.createdAt)}</td><td>${m.fixtures.length} / ${m.players.length}</td><td>${m.completed}/${m.total}<small>${m.successful} 成功</small></td><td><span class="badge">${statuses[m.status]}</span></td><td>${button('查看结果', 'open-experiment', true, `data-id="${e(m.id)}"`)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">还没有 Web 实验。可从新建实验开始。</div>'}</section>`
}
function results() {
  if (!detail) {
    return '<div class="empty">从实验记录选择一个实验。</div>'
  }
  const { meta: m, data, analysis } = detail
  const busy = m.status === 'running'
  return `<section class="panel"><div class="panel-header"><div><h2>${e(m.name)} <small>${statuses[m.status]}</small></h2><span class="muted">${date(m.createdAt)} · 基线 ${e(m.players.find((p) => p.id === m.baselineId)?.label)}</span></div><a class="chip" href="/api/experiments/${m.id}/report.html" target="_blank" rel="noopener">打开 / 导出 HTML ↗</a></div><p>${e(m.requirements)}</p><div class="wb-experiment-meta"><span>6 人桌</span><span>初始 100BB</span><span>无前注 · 无抓注</span><span>${data.totalScenes} 条行动线</span><span>${data.styles.length} 个玩家配置</span><span>每组重复 ${data.repeats} 次</span></div></section><div data-comparison data-run-id="${e(m.id)}">${comparisonOverview(data)}<section class="panel wb-analysis-panel"><h2>执行与数据</h2><div class="progress"><progress max="${m.total}" value="${m.completed}"></progress></div>${m.problem ? `<p class="error">${e(m.problem)}</p>` : ''}<div class="actions">${button(busy ? '正在求解…' : m.completed ? '继续未完成请求' : `执行 ${m.total} 次 solver 请求`, 'execute-experiment', false, busy ? 'disabled' : '')}${button('重试失败项', 'retry-experiment', true, busy ? 'disabled' : '')}${button('离线重建报告', 'render-experiment', true, busy ? 'disabled' : '')}${button('复制为新实验', 'clone-experiment', true)}${button('刷新状态', 'refresh-detail', true)}</div><p class="muted">成功缓存始终复用。只有点击执行才发送 solver 请求；报告和结论分析可以独立重跑。</p><details><summary>不可变请求计划与原始数据</summary><p><a href="/api/experiments/${m.id}/raw/session.json" target="_blank" rel="noopener">场景与请求计划 JSON</a> · <a href="/api/experiments/${m.id}/raw/validation.json" target="_blank" rel="noopener">合法性校验</a> · <a href="/api/experiments/${m.id}/raw/horizontal.json" target="_blank" rel="noopener">横向结果</a></p><pre>${e(pretty(m.players))}</pre></details></section>
  ${comparisonSummary(data)}
  <section class="panel wb-analysis-panel"><div class="panel-header"><h2>大模型结论 <small>${e(boot.settings.model.provider)} / ${e(boot.settings.model.model)}</small></h2><div class="actions">${button('预览分析提示词', 'preview-analysis', true, busy ? 'disabled' : '')}${button('生成 / 重新分析', 'analyze-experiment', false, busy || !data.successful ? 'disabled' : '')}</div></div><p class="muted">使用已保存的 solver 结果，每次分析单独留存提示词、模型、输入与原始输出。</p>${analysis ? `<div class="analysis-text">${e(analysis.summary)}</div>${analysis.scenes.map((s) => `<div class="callout"><strong>${e(s.id)}</strong><p>${e(s.conclusion)}</p></div>`).join('')}<p>${analysis.limitations.map(e).join('；')}</p>` : `<div class="empty">${detail.analysisStale ? '求解结果已更新，历史分析已过期，请重新分析。旧版本仍可查看。' : '尚未生成分析。solver 数据足够后，可独立运行此步骤。'}</div>`}<details><summary>历史分析版本</summary>${m.analysisIds.map((id) => `<p><a href="/api/calls/${id}/request" target="_blank" rel="noopener">${e(id)} · 完整提示词</a> · <a href="/api/calls/${id}/result" target="_blank" rel="noopener">分析结果</a></p>`).join('') || '<p>暂无记录</p>'}</details></section>
  ${comparisonDetails(data, { experimentId: m.id })}</div>`
}
function experimentPage() {
  return (
    header('玩家风格实验工作台', '从风格描述到策略证据，让每次对比都有据可查。') +
    `<div class="tabbar">${[
      ['new', '新建实验'],
      ['history', '实验记录'],
      ['result', '结果与分析'],
    ]
      .map(([id, label]) =>
        button(label, 'experiment-tab', experimentTab !== id, `data-tab="${id}"`)
      )
      .join('')}</div>` +
    (experimentTab === 'new'
      ? newExperiment()
      : experimentTab === 'history'
        ? history()
        : results())
  )
}
function playersPage() {
  return (
    header('玩家配置库', '用自然语言描述风格，或直接组合翻前和翻后档位。') +
    `<section class="panel"><h2>描述一个玩家 <small>AI assisted configuration</small></h2>${area('玩家描述', 'player-description', '翻前很松，喜欢跟注和跛入，很少主动加注；翻后偏被动，愿意跟到底。')}${imagePicker('player')}<div class="actions">${button('预览推荐提示词', 'preview-player', true)}${button('AI 推荐档位', 'recommend-player')}</div>${playerRecommendation ? `<div class="callout"><strong>${e(playerRecommendation.label)}</strong><p>${e(playerRecommendation.description)}</p><code>${e(playerRecommendation.preflop)} / ${e(playerRecommendation.postflop)}</code><div class="actions">${button('填入编辑器', 'accept-player', true)}</div></div>` : ''}</section><section class="panel"><h2>已保存的玩家 <small>最多 8 个，可跨实验复用</small></h2><div class="grid three">${playerCards(false)}</div></section><section class="panel"><h2>玩家编辑器</h2><div class="grid">${field('唯一 ID（字母、数字、连字符）', 'player-id', 'custom-player')}${field('玩家名称', 'player-label', '自定义玩家')}</div>${area('风格说明 / 推荐理由', 'player-summary', '描述此配置的风格和观察目标。')}<div class="grid">${profileSelect('preflop', 'player-preflop', 'gto')}${profileSelect('postflop', 'player-postflop', 'gto')}</div><div id="player-metrics"></div><div class="actions">${button('保存玩家配置', 'save-player')}<span class="hint">相同 ID 更新配置；已有实验快照保持原值。</span></div></section>`
  )
}
function catalogPageView() {
  const formats = [...new Set(boot.catalog.map((p) => p.format))]
  return (
    header('策略档位浏览', '读取上游 catalog 快照，预览全部 profileName 和对应实测指标。') +
    `<div class="callout">所有桌型均可浏览。首版执行支持 2-0 / 4-6p；名称中的数字与实测指标可能不同，请以表格数值为准。WTSD 按上游字段原名展示。</div><section class="panel"><div class="toolbar"><input class="search" id="catalog-search" placeholder="搜索 profileName…" aria-label="搜索档位"><select id="catalog-stage" aria-label="筛选阶段">${options(
      [
        { value: 'all', label: '翻前 + 翻后' },
        { value: 'preflop', label: '翻前' },
        { value: 'postflop', label: '翻后' },
      ]
    )}</select><select id="catalog-format" aria-label="盲注结构">${options(
      formats.map((f) => ({ value: f, label: f })),
      '2-0'
    )}</select><select id="catalog-seats" aria-label="人数范围">${options(
      ['2-3p', '4-6p', '7-9p'].map((s) => ({ value: s, label: s })),
      '4-6p'
    )}</select></div><div id="catalog-results"></div></section>`
  )
}
function settingsPage() {
  const m = boot.settings.model
  const prompt = promptDrafts[promptTask]
  return (
    header('模型与提示词', '三个环节独立配置与预览，每次调用保留可追溯的输入输出。') +
    (!boot.settings.modelPresets
      ? '<div class="callout" role="status">检测到旧版 Web 服务，已使用内置模型列表恢复页面。请在原终端停止并重新执行 bun run web，再刷新页面，以启用模型刷新与快速测试接口。</div>'
      : '') +
    `<section class="panel"><h2>大模型连接 <small>Server-side credentials</small></h2><div class="grid"><label class="field">服务商<select id="model-provider">${options(
      [
        { value: 'deepseek', label: 'DeepSeek' },
        { value: 'gemini', label: 'Gemini' },
      ],
      m.provider
    )}</select></label><label class="field">可选模型<select id="model-choice">${choiceOptions(m.provider, m.baseUrl, m.model)}</select></label>${field('模型 ID（可手动填写）', 'model-name', m.model)}${field('API 根地址', 'model-base', m.baseUrl)}${field('API Key（留空保留当前密钥）', 'model-key', '', 'password', 'autocomplete="new-password"')}</div><div class="grid three">${field('Temperature', 'model-temperature', m.temperature, 'number', 'min="0" max="2" step="0.1"')}${field('输出 token 上限', 'model-tokens', m.maxTokens, 'number', 'min="256" max="32768"')}${field('调用超时（秒，生成场景建议 600）', 'model-timeout', m.timeoutMs / 1000, 'number', 'min="1" max="900"')}</div><p class="muted">DeepSeek：${boot.settings.keys.deepseek ? '已配置' : '未配置'} · Gemini：${boot.settings.keys.gemini ? '已配置' : '未配置'}。密钥只保存在服务端环境变量或本机忽略目录，不返回浏览器。</p><p class="callout" id="model-info"></p><div class="actions">${button('保存模型设置', 'save-model')}${button('从服务端刷新模型', 'refresh-models', true)}</div><p class="muted">列表是参考选项，实际可用模型取决于当前 API 和账号。刷新与测试使用表单当前值，无需先保存；不会自动保存新填入的密钥。</p><hr class="section-divider"><h2>快速测试 <small>文本 / 图片理解</small></h2>${area('测试内容', 'model-test-message', '请简短回复连接正常；如果附有图片，请描述图片中的主要内容。')}${imagePicker('test')}<div class="actions">${button('快速测试大模型', 'test-model')}<span class="hint">一次独立模型请求，不生成场景、不调用 solver</span></div><div id="model-test-result"></div></section><section class="panel"><div class="panel-header"><h2>提示词工作室 <small>Prompt studio</small></h2><span class="chip">版本 ${e(prompt.id.slice(0, 18))}</span></div><div class="tabbar">${Object.entries(
      taskLabels
    )
      .map(([task, label]) =>
        button(label, 'prompt-tab', promptTask !== task, `data-task="${task}"`)
      )
      .join(
        ''
      )}</div>${area('系统提示词（固定部分）', 'prompt-system', prompt.system, true)}${area('输入模板', 'prompt-template', prompt.template, true)}<p class="muted">必需变量：${promptTask === 'player' ? '{{input}}、{{catalog}}' : promptTask === 'scenarios' ? '{{input}}、{{examples}}' : '{{input}}、{{results}}'}。可在这里预览未保存的编辑；保存后业务调用使用当前版本。固定输出约定自动追加。</p><div class="actions">${button('保存为新版本', 'save-prompt')}${button('预览当前模板', 'preview-template', true)}${button('恢复默认模板', 'reset-prompt', true)}${button('查看历史版本', 'prompt-history', true)}</div><div id="prompt-history"></div></section><section class="panel"><div class="panel-header"><h2>大模型调用记录</h2>${button('刷新调用记录', 'load-calls', true)}</div><div id="calls"><p class="muted">查看每次调用使用的完整提示词、模型、原始响应和校验结果。</p></div></section>`
  )
}
function render() {
  document
    .querySelectorAll<HTMLAnchorElement>('nav a')
    .forEach((link) => link.classList.toggle('active', link.dataset.page === page))
  app.innerHTML =
    page === 'players'
      ? playersPage()
      : page === 'catalog'
        ? catalogPageView()
        : page === 'settings'
          ? settingsPage()
          : experimentPage()
  if (page === 'catalog') {
    filterCatalog()
  }
  if (page === 'players') {
    playerMetrics()
  }
  if (page === 'settings') {
    modelInfo()
  }
  if (page === 'experiment' && experimentTab === 'result') {
    installComparisonInteractions(document, async (entry) => {
      if (entry.dataset.loaded || entry.dataset.loading) {
        return
      }
      const body = entry.querySelector<HTMLElement>('[data-wb-raw-body]')
      if (!body) {
        return
      }
      entry.dataset.loading = 'true'
      body.innerHTML = '<p class="wb-muted">正在读取本机原始响应…</p>'
      try {
        const response = await fetch(entry.dataset.wbRawUrl!, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`原始缓存读取失败：HTTP ${response.status}`)
        }
        const raw: unknown = await response.json()
        body.innerHTML = rawRunView(raw)
        entry.dataset.loaded = 'true'
      } catch (error) {
        body.innerHTML = `<p class="error">${e(error instanceof Error ? error.message : '原始缓存读取失败')}；关闭后重新展开可重试。</p>`
      } finally {
        delete entry.dataset.loading
      }
    })
  }
}
function filterCatalog() {
  const matched = boot.catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(val('catalog-search').toLowerCase()) &&
      (val('catalog-stage') === 'all' || p.stage === val('catalog-stage')) &&
      p.format === val('catalog-format') &&
      p.seats === val('catalog-seats')
  )
  const rows = matched.slice(catalogPage * 50, (catalogPage + 1) * 50)
  $('catalog-results').innerHTML =
    `<p class="muted">${matched.length} 个档位 · 第 ${catalogPage + 1} / ${Math.max(1, Math.ceil(matched.length / 50))} 页</p><div class="table-wrap"><table><thead><tr><th>profileName</th><th>阶段</th><th>VPIP</th><th>PFR</th><th>AF</th><th>WTSD</th><th>执行支持</th></tr></thead><tbody>${rows.map((p) => `<tr><td><code>${e(p.name)}</code></td><td>${stages[p.stage]}</td><td>${pct(percent(p.vpip))}</td><td>${pct(percent(p.pfr))}</td><td>${p.af}</td><td>${pct(percent(p.wtsd))}</td><td><span class="badge ${p.executable ? '' : 'warn'}">${p.executable ? '可选' : '仅预览'}</span></td></tr>`).join('')}</tbody></table></div><div class="actions">${button('上一页', 'catalog-prev', true, catalogPage === 0 ? 'disabled' : '')}${button('下一页', 'catalog-next', true, (catalogPage + 1) * 50 >= matched.length ? 'disabled' : '')}</div>`
}
function playerMetrics() {
  const profiles = ['preflop', 'postflop'].map((stage) =>
    boot.catalog.find((p) => p.executable && p.stage === stage && p.name === val(`player-${stage}`))
  )
  $('player-metrics').innerHTML = profiles
    .map((p) =>
      p
        ? `<span class="chip">${stages[p.stage]}：VPIP ${pct(percent(p.vpip))} · PFR ${pct(percent(p.pfr))} · AF ${p.af} · WTSD ${pct(percent(p.wtsd))}</span>`
        : ''
    )
    .join('')
}
function capturePrompt() {
  const system = document.getElementById('prompt-system') as HTMLTextAreaElement | null
  const template = document.getElementById('prompt-template') as HTMLTextAreaElement | null
  if (page === 'settings' && promptDrafts && system && template) {
    promptDrafts[promptTask] = {
      ...promptDrafts[promptTask],
      system: system.value,
      template: template.value,
    }
  }
}
function captureDraft() {
  if (
    page === 'experiment' &&
    experimentTab === 'new' &&
    draft &&
    document.getElementById('experiment-name') &&
    document.getElementById('requirements') &&
    document.getElementById('scenario-count') &&
    document.getElementById('repeats')
  ) {
    draft.name = val('experiment-name')
    draft.requirements = val('requirements')
    draft.count = Number(val('scenario-count'))
    draft.repeats = Number(val('repeats'))
    persist()
  }
}
function inputFor(task: PromptTask) {
  captureDraft()
  return task === 'player'
    ? { task, description: val('player-description'), images: images.player }
    : task === 'scenarios'
      ? {
          task,
          count: draft.count,
          requirements: draft.requirements,
          players: selectedPlayers(),
          images: images.scenarios,
        }
      : { task, experimentId: detail?.meta.id }
}
async function preview(task: PromptTask) {
  const result = await api<{ system: string; user: string; model: unknown; images: ModelImage[] }>(
    '/model/preview',
    inputFor(task)
  )
  $('preview-content').textContent =
    `模型：${pretty(result.model)}\n\nSYSTEM\n${result.system}\n\nUSER\n${result.user}\n\n参考图片：${pretty(result.images.map((image) => ({ name: image.name, mimeType: image.mimeType })))}`
  $<HTMLDialogElement>('preview-dialog').showModal()
}
async function refreshDetail() {
  if (!detail) {
    return
  }
  detail = await api<Detail>(`/experiments/${detail.meta.id}`)
  if (page === 'experiment' && experimentTab === 'result') {
    render()
  }
  clearTimeout(pollTimer)
  if (detail.meta.status === 'running') {
    pollTimer = setTimeout(() => {
      void refreshDetail().catch((error: unknown) =>
        notice(error instanceof Error ? error.message : '读取状态失败')
      )
    }, 1500)
  }
}
async function loadHistory() {
  experiments = await api('/experiments')
}
function fillPlayer(p: PlayerConfig) {
  $('player-id').setAttribute('data-editing', p.id)
  for (const [id, value] of [
    ['player-id', p.id],
    ['player-label', p.label],
    ['player-summary', p.description],
    ['player-preflop', p.preflop],
    ['player-postflop', p.postflop],
  ]) {
    $<HTMLInputElement>(id).value = value
  }
  playerMetrics()
  $('player-id').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const actions: Record<string, (button: HTMLButtonElement) => void | Promise<void>> = {
  'apply-model-result': async () => {
    if (pendingModel) {
      await applyModelResult(pendingModel, finishedModelResult)
    }
  },
  'dismiss-model-result': () => {
    pendingModel = null
    finishedModelResult = null
    savePendingModel()
    modelPanel('<p>已保留当前草稿，生成结果仍在调用记录中。</p>')
  },
  'remove-image': (b) => {
    const task = b.dataset.task as keyof typeof images
    images[task].splice(Number(b.dataset.index), 1)
    $(`images-${task}`).innerHTML = imageCards(task)
  },
  'refresh-models': async () => {
    const connection = modelForm()
    const result = await api<{ models: ModelOption[]; fetchedAt: string }>(
      '/model/models',
      connection
    )
    remoteModels.set(
      `${connection.model.provider}:${connection.model.baseUrl.replace(/\/+$/, '')}`,
      result.models
    )
    $<HTMLSelectElement>('model-choice').innerHTML = choiceOptions(
      connection.model.provider as Provider,
      connection.model.baseUrl,
      val('model-name')
    )
    modelInfo()
    notice(`已从服务端获取 ${result.models.length} 个模型 · ${date(result.fetchedAt)}`)
  },
  'test-model': async () => {
    const output = $('model-test-result')
    output.innerHTML = '<p class="busy-note">正在测试当前表单配置，最长等待 60 秒…</p>'
    try {
      const response = await api<{
        callId: string
        result: {
          reply: string
          elapsedMs: number
          requestedModel: string
          returnedModel: unknown
          usage: unknown
          imageCount: number
        }
      }>('/model/test', { ...modelForm(), message: val('model-test-message'), images: images.test })
      const r = response.result
      output.innerHTML = `<div class="callout"><strong>连接与 JSON 输出测试成功</strong><p>${e(r.reply)}</p><span class="chip">${r.elapsedMs} ms</span><span class="chip">${e(r.requestedModel)}</span><span class="chip">${r.imageCount} 张图片</span><details><summary>返回模型与 token 用量</summary><pre>${e(pretty({ returnedModel: r.returnedModel, usage: r.usage }))}</pre><a href="/api/calls/${response.callId}/request" target="_blank" rel="noopener">查看测试输入快照</a> · <a href="/api/calls/${response.callId}/response" target="_blank" rel="noopener">查看原始响应</a></details></div>`
    } catch (error) {
      output.innerHTML = `<p class="error">${e(error instanceof Error ? error.message : '快速测试失败')}</p>`
      throw error
    }
  },
  'experiment-tab': async (b) => {
    captureDraft()
    experimentTab = b.dataset.tab!
    if (experimentTab === 'history') {
      await loadHistory()
    }
    render()
  },
  'use-representative': () => {
    captureDraft()
    draft.fixtures = structuredClone(boot.fixtures.filter((f) => /^S\d+$/.test(f.id)))
    validation = {}
    persist()
    render()
  },
  'use-existing': () => {
    captureDraft()
    const stage = val('fixture-stage')
    const pool = boot.fixtures.filter(
      (f) => !/^S\d+$/.test(f.id) && (stage === 'all' || f.street === stage)
    )
    if (pool.length < draft.count) {
      throw new Error(`当前筛选仅有 ${pool.length} 条，请减少数量`)
    }
    draft.fixtures = structuredClone(pool.slice(0, draft.count))
    validation = {}
    persist()
    render()
  },
  'preview-scenarios': () => scenarioBatches.preview(),
  'preview-player': () => preview('player'),
  'preview-analysis': () => preview('analysis'),
  'generate-scenarios': () => scenarioBatches.start(),
  'batch-history': () => scenarioBatches.loadHistory(),
  'batch-open': (b) => scenarioBatches.open(b.dataset.id!),
  'batch-apply': () => scenarioBatches.apply(),
  'batch-resume': () => scenarioBatches.resume(),
  'batch-retry': (b) => scenarioBatches.resume(Number(b.dataset.index)),
  'batch-pause': () => scenarioBatches.pause(),
  'batch-refresh': () => scenarioBatches.refresh(),
  'diagnose-call': async (b) => {
    const diagnosis = await api<{ problem: string | null }>(`/calls/${b.dataset.id}/diagnostic`)
    $('preview-content').textContent = pretty(diagnosis)
    $<HTMLDialogElement>('preview-dialog').showModal()
  },
  'regenerate-route': async (b) => {
    captureDraft()
    const index = Number(b.dataset.index)
    const original = draft.fixtures[index]
    await runModelJob(
      {
        task: 'scenarios',
        count: 1,
        players: selectedPlayers(),
        requirements: `${draft.requirements}\n替换以下路线，保持同一决策主题，输出1条合法的新路线：${pretty(original)}`,
        images: images.scenarios,
      },
      { operation: 'regenerate', routeId: original.id }
    )
  },
  'remove-route': (b) => {
    captureDraft()
    draft.fixtures.splice(Number(b.dataset.index), 1)
    validation = {}
    persist()
    render()
  },
  'apply-json': async () => {
    const parsed: unknown = JSON.parse(val('fixtures-json'))
    const checked = await api<{ fixtures: ScenarioFixture[] }>('/scenarios/validate', {
      fixtures: parsed,
    })
    draft.fixtures = checked.fixtures
    validation = {}
    persist()
    render()
    notice('已校验并应用 JSON')
  },
  'validate-routes': async () => {
    captureDraft()
    const result = await api<{
      fixtures: ScenarioFixture[]
      validation: ((typeof validation)[string] & { id: string })[]
    }>('/scenarios/validate', { fixtures: draft.fixtures })
    draft.fixtures = result.fixtures
    validation = Object.fromEntries(result.validation.map((v) => [v.id, v]))
    persist()
    render()
    notice('全部路线合法，可保存实验')
  },
  'create-experiment': async () => {
    captureDraft()
    const meta = await api<ExperimentMeta>('/experiments', {
      name: draft.name,
      requirements: draft.requirements,
      players: selectedPlayers(),
      fixtures: draft.fixtures,
      repeats: draft.repeats,
    })
    detail = await api(`/experiments/${meta.id}`)
    experimentTab = 'result'
    render()
    notice(`请求计划已保存：${meta.total} 次。点击执行开始求解。`)
  },
  'open-experiment': async (b) => {
    detail = await api(`/experiments/${b.dataset.id}`)
    experimentTab = 'result'
    render()
    await refreshDetail()
  },
  'refresh-experiments': async () => {
    await loadHistory()
    render()
  },
  'refresh-detail': () => refreshDetail(),
  'execute-experiment': async () => {
    await api(`/experiments/${detail!.meta.id}/execute`, {})
    await refreshDetail()
  },
  'retry-experiment': async () => {
    await api(`/experiments/${detail!.meta.id}/execute`, { retryFailed: true })
    await refreshDetail()
  },
  'render-experiment': async () => {
    detail = await api(`/experiments/${detail!.meta.id}/render`, {})
    render()
    notice('报告已离线重建，没有新增 solver 请求')
  },
  'clone-experiment': () => {
    const m = detail!.meta
    draft = {
      name: `${m.name}（副本）`,
      requirements: m.requirements,
      repeats: m.repeats,
      count: m.fixtures.length,
      fixtures: structuredClone(m.fixtures),
      playerIds: m.players.map((p) => p.id),
    }
    experimentTab = 'new'
    validation = {}
    persist()
    render()
    notice('已复制场景；玩家使用配置库中的当前版本，请核对后保存')
  },
  'analyze-experiment': () =>
    runModelJob(inputFor('analysis'), { operation: 'analyze', experimentId: detail!.meta.id }),
  'recommend-player': () => runModelJob(inputFor('player'), { operation: 'recommend' }),
  'accept-player': () => fillPlayer(playerRecommendation!),
  'edit-player': (b) => fillPlayer(boot.settings.players.find((p) => p.id === b.dataset.id)!),
  'save-player': async () => {
    const p: PlayerConfig = {
      id: val('player-id'),
      label: val('player-label'),
      description: val('player-summary'),
      preflop: val('player-preflop'),
      postflop: val('player-postflop'),
    }
    const oldId = $('player-id').getAttribute('data-editing') || p.id
    const players = boot.settings.players.filter((v) => v.id !== oldId && v.id !== p.id).concat(p)
    boot.settings = await api('/settings', { players })
    render()
    notice('玩家配置已保存')
  },
  'delete-player': async (b) => {
    const id = b.dataset.id!
    boot.settings = await api('/settings', {
      players: boot.settings.players.filter((p) => p.id !== id),
    })
    draft.playerIds = draft.playerIds.filter((p) => p !== id)
    persist()
    render()
  },
  'catalog-prev': () => {
    catalogPage--
    filterCatalog()
  },
  'catalog-next': () => {
    catalogPage++
    filterCatalog()
  },
  'save-model': async () => {
    capturePrompt()
    boot.settings = await api('/settings', modelForm())
    render()
    notice('模型设置已保存，密钥未返回浏览器')
  },
  'prompt-tab': (b) => {
    capturePrompt()
    promptTask = b.dataset.task as PromptTask
    render()
  },
  'preview-template': async () => {
    capturePrompt()
    const input =
      promptTask === 'player'
        ? { task: promptTask, description: '翻前偏松，翻后被动，喜欢跟注。' }
        : promptTask === 'scenarios'
          ? {
              task: promptTask,
              count: draft.count,
              requirements: draft.requirements,
              players: selectedPlayers(),
            }
          : { task: promptTask, experimentId: detail?.meta.id }
    if (promptTask === 'analysis' && !detail) {
      throw new Error('请先在结果页选择一个已有 solver 结果的实验，再预览分析模板')
    }
    const result = await api<{ system: string; user: string; model: unknown }>('/model/preview', {
      ...input,
      prompt: promptDrafts[promptTask],
    })
    $('preview-content').textContent =
      `模型：${pretty(result.model)}\n\nSYSTEM\n${result.system}\n\nUSER\n${result.user}\n\n参考图片：${pretty(('images' in result ? (result.images as ModelImage[]) : []).map((image) => ({ name: image.name, mimeType: image.mimeType })))}`
    $<HTMLDialogElement>('preview-dialog').showModal()
  },
  'save-prompt': async () => {
    capturePrompt()
    const p = await api<PromptVersion>(`/prompts/${promptTask}`, promptDrafts[promptTask])
    boot.settings.prompts[promptTask] = p
    promptDrafts[promptTask] = p
    render()
    notice('提示词已保存为新版本')
  },
  'reset-prompt': async () => {
    const p = await api<PromptVersion>(`/prompts/${promptTask}`, { reset: true })
    boot.settings.prompts[promptTask] = p
    promptDrafts[promptTask] = p
    render()
    notice('默认模板已保存为新版本，历史版本仍保留')
  },
  'prompt-history': async () => {
    const versions = (await api<PromptVersion[]>('/prompts/history'))
      .filter((p) => p.task === promptTask)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    $('prompt-history').innerHTML =
      versions
        .map(
          (p) =>
            `<details><summary>${date(p.createdAt)} · ${e(p.id)}</summary><pre>${e(p.system)}\n\n${e(p.template)}</pre>${button('载入此版本到编辑器', 'restore-prompt', true, `data-id="${p.id}"`)}</details>`
        )
        .join('') || '<p class="muted">尚无保存的版本。</p>'
  },
  'restore-prompt': async (b) => {
    const versions = await api<PromptVersion[]>('/prompts/history')
    const p = versions.find((p) => p.id === b.dataset.id)!
    promptDrafts[promptTask] = p
    render()
    notice('已载入历史版本，点击保存创建新的当前版本')
  },
  'load-calls': async () => {
    const calls = await api<
      {
        id: string
        task: PromptTask | 'test'
        model: { provider: string; model: string }
        createdAt: string
        ok: boolean | null
        problem?: string
      }[]
    >('/calls')
    $('calls').innerHTML =
      calls
        .map(
          (c) =>
            `<details><summary>${date(c.createdAt)} · ${callTaskLabels[c.task]} · ${e(c.model.provider)} / ${e(c.model.model)} · ${c.ok === null ? '未完成' : c.ok ? '成功' : '失败'}</summary><p>${e(c.problem || '')}</p>${c.ok === false ? button('定位失败原因', 'diagnose-call', true, `data-id="${e(c.id)}"`) : ''}<p><a href="/api/calls/${c.id}/request" target="_blank" rel="noopener">完整提示词 / 设置</a> · <a href="/api/calls/${c.id}/response" target="_blank" rel="noopener">原始模型响应</a> · <a href="/api/calls/${c.id}/result" target="_blank" rel="noopener">解析与校验结果</a></p></details>`
        )
        .join('') || '<p class="muted">暂无大模型调用。</p>'
  },
}

document.addEventListener('click', (event) => {
  const b = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]')
  if (!b || b.disabled) {
    return
  }
  const action = actions[b.dataset.action!]
  if (!action) {
    return
  }
  const label = b.textContent
  b.disabled = true
  b.textContent = '处理中…'
  void Promise.resolve()
    .then(() => action(b))
    .catch((error: unknown) => notice(error instanceof Error ? error.message : '操作失败'))
    .finally(() => {
      b.disabled = false
      b.textContent = label
    })
})
app.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement
  if (input.dataset.imageTask) {
    void loadImages(input).catch((error: unknown) =>
      notice(error instanceof Error ? error.message : '图片读取失败')
    )
    return
  }
  if (input.id === 'model-choice') {
    if (input.value) {
      $<HTMLInputElement>('model-name').value = input.value
    }
    modelInfo()
  }
  if (input.id === 'model-name' || input.id === 'model-base') {
    $<HTMLSelectElement>('model-choice').innerHTML = choiceOptions(
      val('model-provider') as Provider,
      val('model-base'),
      val('model-name')
    )
    modelInfo()
  }
  if (input.dataset.player) {
    draft.playerIds = input.checked
      ? [...draft.playerIds, input.dataset.player]
      : draft.playerIds.filter((id) => id !== input.dataset.player)
    captureDraft()
    render()
    return
  }
  if (input.dataset.route !== undefined) {
    const index = Number(input.dataset.route)
    const key = input.dataset.key as keyof ScenarioFixture
    const route = draft.fixtures[index]
    draft.fixtures[index] = { ...route, [key]: key === 'hero' ? Number(input.value) : input.value }
    validation = {}
    persist()
    const badge = input.closest('.route-card')?.querySelector('.badge')
    if (badge) {
      badge.textContent = '待校验'
      badge.classList.add('warn')
    }
    return
  }
  if (input.id.startsWith('catalog-')) {
    catalogPage = 0
    filterCatalog()
  }
  if (input.id === 'player-preflop' || input.id === 'player-postflop') {
    playerMetrics()
  }
  if (input.id === 'model-provider') {
    $<HTMLInputElement>('model-name').value =
      input.value === 'gemini' ? 'gemini-4-hydrogen' : 'deepseek-flash'
    $<HTMLInputElement>('model-base').value =
      input.value === 'gemini'
        ? 'https://generativelanguage.googleapis.com/v1beta'
        : 'https://api.deepseek.com'
    $<HTMLInputElement>('model-key').value = ''
    $<HTMLSelectElement>('model-choice').innerHTML = choiceOptions(
      input.value as Provider,
      val('model-base'),
      val('model-name')
    )
    modelInfo()
    if ($('model-test-result')) {
      $('model-test-result').innerHTML = ''
    }
  }
  captureDraft()
})
app.addEventListener('input', (event) => {
  if ((event.target as HTMLElement).id === 'catalog-search') {
    catalogPage = 0
    filterCatalog()
  }
})
$('close-preview').addEventListener('click', () => $<HTMLDialogElement>('preview-dialog').close())
window.addEventListener('hashchange', () => {
  if (!boot || !draft || !promptDrafts) {
    return
  }
  const next = location.hash.slice(1)
  if (!['experiment', 'players', 'catalog', 'settings'].includes(next)) {
    return
  }
  captureDraft()
  capturePrompt()
  page = next
  render()
  window.scrollTo(0, 0)
})
window.addEventListener('beforeunload', captureDraft)

async function start() {
  boot = await api<Boot>('/bootstrap')
  promptDrafts = structuredClone(boot.settings.prompts)
  draft = {
    name: '玩家风格代表性对比',
    requirements:
      '覆盖翻前边缘牌面对再加注、翻牌组合听牌与河牌抓诈唬，比较松弱、紧凶和 GTO 的概率、尺寸与 EV 差异。',
    count: 3,
    repeats: 2,
    playerIds: boot.settings.players.map((p) => p.id),
    fixtures: structuredClone(boot.fixtures.filter((f) => /^S\d+$/.test(f.id))),
  }
  try {
    const saved = localStorage.getItem('strategy-lab-draft-v1')
    if (saved) {
      const parsed = JSON.parse(saved) as Draft
      if (
        Array.isArray(parsed.fixtures) &&
        parsed.fixtures.length <= 100 &&
        parsed.fixtures.every(
          (f) =>
            f &&
            typeof f.id === 'string' &&
            typeof f.cards === 'string' &&
            typeof f.line === 'string' &&
            typeof f.description === 'string' &&
            typeof f.category === 'string' &&
            typeof f.history === 'string' &&
            ['preflop', 'flop', 'turn', 'river'].includes(f.street) &&
            Number.isInteger(f.hero) &&
            f.hero >= 0 &&
            f.hero <= 5
        ) &&
        Array.isArray(parsed.playerIds)
      ) {
        draft = { ...draft, ...parsed }
      }
    }
  } catch {
    /* 使用默认草稿 */
  }
  page = ['experiment', 'players', 'catalog', 'settings'].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : 'experiment'
  render()
  void scenarioBatches
    .restore()
    .catch((error: unknown) => notice(error instanceof Error ? error.message : '无法恢复分批任务'))
  try {
    const savedJob = localStorage.getItem('strategy-lab-model-job')
    if (savedJob) {
      const saved = JSON.parse(savedJob) as PendingModel
      if (
        /^[A-Za-z0-9-]+$/.test(saved.callId) &&
        ['player', 'scenarios', 'analysis'].includes(saved.task) &&
        ['generate', 'regenerate', 'recommend', 'analyze'].includes(saved.operation)
      ) {
        pendingModel = saved
        void watchModelJob(saved).catch((error: unknown) =>
          notice(error instanceof Error ? error.message : '无法恢复模型任务')
        )
      }
    }
  } catch {
    /* 忽略损坏的浏览器任务引用，服务端记录保留 */
  }
}
void start().catch((error: unknown) => {
  app.textContent = error instanceof Error ? error.message : '工作台加载失败'
})
