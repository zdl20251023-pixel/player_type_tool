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
import { ScenarioLibraryUI } from './scenario-library'
import { TableUI } from './table'
import { RoleLibraryUI } from './roles'
import { roleToPlayer, addRoleToDraft } from '../profiles/roles'
import { ExperimentSetupUI } from './experiment-setup'
import {
  emptyExperimentDraft,
  readExperimentDraft,
  type ExperimentDraft as Draft,
} from './experiment-draft'

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
let recoverableDraft: Draft | null = null
let resultView = 'overview'
let historySearch = ''
let historyStatus = ''
let experimentStarting = false
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
let playersTab = 'roles'
let playerEditorSource: PlayerConfig['sourceRole']
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
  apply: (fixtures) => setup.setGenerated(fixtures),
  changed: () => setup.batchChanged(),
})

const scenarioLibrary = new ScenarioLibraryUI({
  api,
  existing: () => {
    captureDraft()
    return draft.fixtures
  },
  notice,
  apply: (fixtures, message) => {
    captureDraft()
    draft.fixtures = fixtures
    draft.count = fixtures.length
    validation = {}
    persist()
    page = 'experiment'
    experimentTab = 'new'
    location.hash = 'experiment'
    render()
    window.scrollTo(0, 0)
    notice(message)
  },
})

const tableExperience = new TableUI({ api, players: () => boot.settings.players, notice })
const roleLibrary = new RoleLibraryUI({
  notice,
  copy: (role) => {
    playersTab = 'mine'
    render()
    fillPlayer({
      ...roleToPlayer(role),
      id: `role-${role.id.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`,
    })
    $('player-id').removeAttribute('data-editing')
    notice('已复制到玩家编辑器；修改后点击保存，不会覆盖内置角色或已有配置')
  },
  experiment: (role) => {
    const player = roleToPlayer(role)
    const collision = [...boot.settings.players, ...(draft.rolePlayers ?? [])].find(
      (p) => p.id === player.id
    )
    if (collision) {
      addRoleToDraft([collision], role)
    }
    const selected = selectedPlayers()
    const next = addRoleToDraft(selected, role)
    if (
      !draft.rolePlayers?.some((p) => p.id === player.id) &&
      !boot.settings.players.some((p) => p.id === player.id)
    ) {
      draft.rolePlayers = [...(draft.rolePlayers ?? []), player]
    }
    draft.playerIds = next.map((p) => p.id)
    draft.hiddenPlayerIds = draft.hiddenPlayerIds?.filter((id) => id !== player.id)
    persist()
    notice(`已将 ${role.id} 加入实验草稿（已选 ${next.length}/8）；未改变已保存的实验`)
  },
  table: async (role, seat) => {
    await tableExperience.prepareRole(roleToPlayer(role), seat)
    location.hash = 'table'
    notice(`已填入座位 ${seat + 1}：${role.id}。请在牌桌保存设置或开始新体验`)
  },
})

const setup = new ExperimentSetupUI({
  draft: () => draft,
  selected: selectedPlayers,
  players: () => boot.settings.players,
  catalog: () => boot.catalog,
  fixtures: () => boot.fixtures,
  validation: () => validation,
  validate: (value) => {
    validation = value
  },
  changed: () => {
    captureDraft()
    persist()
    if (page === 'experiment' && experimentTab === 'new') {
      render()
    }
  },
  api,
  notice,
  batches: () => scenarioBatches,
  recoverable: () => recoverableDraft,
  reset: () => {
    if (draft.playerIds.length || draft.fixtures.length || draft.name || draft.requirements) {
      recoverableDraft = structuredClone(draft)
      localStorage.setItem('strategy-lab-previous-draft-v1', pretty(recoverableDraft))
    }
    scenarioBatches.detach()
    draft = emptyExperimentDraft()
    images.scenarios = []
    validation = {}
    persist()
    render()
    notice('已新建空白草稿；旧内容可通过“继续上次草稿”恢复')
  },
  recover: () => {
    if (!recoverableDraft) {
      throw new Error('没有可恢复的草稿')
    }
    scenarioBatches.detach()
    const previous = structuredClone(draft)
    draft = structuredClone(recoverableDraft)
    draft.key ??= emptyExperimentDraft().key
    recoverableDraft =
      previous.playerIds.length || previous.fixtures.length || previous.name ? previous : null
    validation = {}
    persist()
    render()
    if (draft.generationId) {
      void scenarioBatches.open(draft.generationId).catch((error) => notice(String(error)))
    }
  },
  imagePicker: () => imagePicker('scenarios'),
  starting: () => experimentStarting,
})

function draftSignature() {
  return pretty([draft.key, draft.requirements, draft.count, draft.playerIds, draft.fixtures])
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
    setup.setGenerated(result as ScenarioFixture[])
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
  draft.savedAt = new Date().toISOString()
  try {
    localStorage.setItem('strategy-lab-draft-v1', pretty(draft))
  } catch {
    /* 浏览器存储不可用时仍可操作 */
  }
}
function selectedPlayers() {
  return draftPlayers().filter((p) => draft.playerIds.includes(p.id))
}
function draftPlayers() {
  return [
    ...boot.settings.players,
    ...(draft.rolePlayers ?? []).filter(
      (p) => !boot.settings.players.some((saved) => saved.id === p.id)
    ),
  ].filter((p) => !draft.hiddenPlayerIds?.includes(p.id))
}
function button(label: string, action: string, secondary = false, extra = '') {
  return `<button data-action="${action}" class="${secondary ? 'secondary' : ''}" ${extra}>${label}</button>`
}
function metricsHelpButton() {
  return button(
    '指标说明',
    'show-metrics-help',
    true,
    'type="button" aria-haspopup="dialog" aria-controls="hud-help-dialog"'
  )
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
  const cards = (selectable ? draftPlayers() : boot.settings.players)
    .map(
      (p) =>
        `<div class="player-card ${selectable && draft.playerIds.includes(p.id) ? 'selected' : ''}"><label>${selectable ? `<input type="checkbox" data-player="${e(p.id)}" ${draft.playerIds.includes(p.id) ? 'checked' : ''}>` : ''}${e(p.label)}</label><p>${e(p.description)}</p><code>翻前 ${e(p.preflop)}<br>翻后 ${e(p.postflop)}</code>${!selectable ? `<div class="actions">${button('编辑', 'edit-player', true, `data-id="${e(p.id)}"`)}${button('删除', 'delete-player', true, `data-id="${e(p.id)}"`)}</div>` : `<div class="actions">${button('从草稿移除', 'remove-draft-role', true, `data-id="${e(p.id)}"`)}</div><small class="muted">仅移出当前草稿，保留个人配置和历史实验。</small>`}</div>`
    )
    .join('')
  const hidden = selectable
    ? boot.settings.players.filter((p) => draft.hiddenPlayerIds?.includes(p.id)).length
    : 0
  return (
    cards +
    (hidden
      ? `<div class="draft-player-restore">${button(`恢复已移除的个人玩家（${hidden}）`, 'restore-draft-players', true)}<p class="muted">恢复后可重新勾选；临时角色可从内置库再次添加。</p></div>`
      : '')
  )
}
function newExperiment() {
  return setup.view()
}
function historyRows() {
  const rows = experiments.filter(
    (m) =>
      (!historyStatus || m.status === historyStatus) &&
      (!historySearch ||
        `${m.name} ${m.id} ${m.players.map((p) => p.label).join(' ')}`
          .toLowerCase()
          .includes(historySearch.toLowerCase()))
  )
  return rows.length
    ? `<div class="table-wrap"><table><thead><tr><th>实验</th><th>创建时间（上海）</th><th>场景 / 玩家</th><th>进度</th><th>状态</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr><td>${e(m.name)}<small>${e(m.id.slice(0, 8))}</small></td><td>${date(m.createdAt)}</td><td>${m.fixtures.length} / ${m.players.length}</td><td>${m.completed}/${m.total}<small>${m.successful} 成功</small></td><td><span class="badge">${statuses[m.status] ?? m.status}</span></td><td>${button('查看结果', 'open-experiment', true, `data-id="${e(m.id)}"`)}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">没有匹配的实验记录。</div>'
}
function history() {
  return `<section class="panel"><div class="panel-header"><h2>实验记录</h2>${button('刷新', 'refresh-experiments', true)}</div><div class="setup-history-filters">${field('搜索名称、玩家或实验编号', 'history-search', historySearch)}<label class="field">实验状态<select id="history-status"><option value="">全部状态</option>${Object.entries(
    statuses
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${historyStatus === id ? 'selected' : ''}>${label}</option>`
    )
    .join(
      ''
    )}</select></label></div><div id="experiment-history-list">${historyRows()}</div></section>`
}
function results() {
  if (!detail) {
    return `<section class="panel prepare-empty"><h2>尚未选择实验</h2><p>从实验记录选择一项，或新建实验并开始对比。</p>${button('选择实验', 'experiment-tab', false, 'data-tab="history"')}</section>`
  }
  const { meta: m, data, analysis } = detail
  const busy = m.status === 'running'
  const overview = resultView === 'overview' ? comparisonOverview(data) : ''
  const compare =
    resultView === 'compare'
      ? comparisonSummary(data) + comparisonDetails(data, { experimentId: m.id })
      : ''
  const ai =
    resultView === 'analysis'
      ? `<section class="panel wb-analysis-panel"><div class="panel-header"><h2>大模型结论 <small>${e(boot.settings.model.provider)} / ${e(boot.settings.model.model)}</small></h2><div class="actions">${button('预览分析提示词', 'preview-analysis', true, busy ? 'disabled' : '')}${button('生成 / 重新分析', 'analyze-experiment', false, busy || !data.successful ? 'disabled' : '')}</div></div><p class="muted">只分析已保存的 solver 结果，分析请求独立留存。</p>${analysis ? `<div class="analysis-text">${e(analysis.summary)}</div>${analysis.scenes.map((scene) => `<div class="callout"><strong>${e(scene.id)}</strong><p>${e(scene.conclusion)}</p></div>`).join('')}<p>${analysis.limitations.map(e).join('；')}</p>` : `<div class="empty">${detail.analysisStale ? '求解结果已更新，请重新分析；旧版本仍保留。' : '尚未生成分析，获得 solver 结果后可独立运行。'}</div>`}<details><summary>历史分析版本</summary>${m.analysisIds.map((id) => `<p><a href="/api/calls/${id}/request" target="_blank" rel="noopener">${e(id)} · 提示词</a> · <a href="/api/calls/${id}/result" target="_blank" rel="noopener">分析结果</a></p>`).join('') || '<p>暂无记录</p>'}</details></section>`
      : ''
  const raw =
    resultView === 'raw'
      ? `<section class="panel"><h2>执行与原始数据</h2><div class="actions">${button('重试失败项', 'retry-experiment', true, busy ? 'disabled' : '')}${button('离线重建报告', 'render-experiment', true, busy ? 'disabled' : '')}</div><p>成功结果始终复用；离线重建不请求 solver。</p><p><a href="/api/experiments/${m.id}/raw/session.json" target="_blank" rel="noopener">场景与不可变请求计划 JSON</a> · <a href="/api/experiments/${m.id}/raw/validation.json" target="_blank" rel="noopener">合法性校验</a> · <a href="/api/experiments/${m.id}/raw/horizontal.json" target="_blank" rel="noopener">横向结果 JSON</a></p><details><summary>玩家配置快照</summary><pre>${e(pretty(m.players))}</pre></details><p>逐次原始响应在“场景对比 → 场景详情”中查看。</p></section>`
      : ''
  return `<section class="panel setup-result-heading"><div class="panel-header"><div><h2>${e(m.name)} <small>${statuses[m.status]}</small></h2><span class="muted">${date(m.createdAt)} · 实验 ${e(m.id.slice(0, 8))} · 基线 ${e(m.players.find((p) => p.id === m.baselineId)?.label)}</span></div><a class="chip" href="/api/experiments/${m.id}/report.html" target="_blank" rel="noopener">打开 / 导出 HTML ↗</a></div><div class="setup-result-progress"><strong>${m.completed} / ${m.total} 次已完成 · ${m.successful} 次成功</strong><div class="progress"><progress max="${m.total}" value="${m.completed}"></progress></div><div class="actions">${button(busy ? '正在求解…' : m.completed === m.total && m.successful === m.total ? '已全部完成' : m.completed ? '继续未完成请求' : `执行 ${m.total} 次 solver 请求`, 'execute-experiment', false, busy || (m.completed === m.total && m.successful === m.total) ? 'disabled' : '')}${button('刷新状态', 'refresh-detail', true)}${button('复制为新实验', 'clone-experiment', true)}</div></div>${m.problem ? `<p class="error">${e(m.problem)}</p>` : ''}<p class="muted">${data.styles.length} 个玩家 · ${data.totalScenes} 条场景 · 每组重复 ${data.repeats} 次 · 6 人 / 100BB / 无前注、无抓注</p></section><div class="tabbar setup-result-tabs">${[
    ['overview', '总体结论'],
    ['compare', '场景对比'],
    ['analysis', 'AI 分析'],
    ['raw', '原始数据'],
  ]
    .map(([id, label]) => button(label, 'result-tab', resultView !== id, `data-view="${id}"`))
    .join(
      ''
    )}</div><div data-comparison data-run-id="${e(m.id)}">${overview}${compare}${ai}${raw}</div>`
}
function experimentPage() {
  return (
    '<div class="experiment-shell">' +
    header(
      '玩家风格实验工作台',
      '从风格描述到策略证据，让每次对比都有据可查。',
      metricsHelpButton()
    ) +
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
        : results()) +
    '</div>'
  )
}
function playersPage() {
  const tabs = `<div class="tabbar">${button('内置角色库 · 75', 'players-tab', playersTab !== 'roles', 'data-tab="roles"')}${button('我的玩家配置', 'players-tab', playersTab !== 'mine', 'data-tab="mine"')}</div>`
  if (playersTab === 'roles') {
    return (
      header('玩家配置库', '从内置角色开始，或维护自己的玩家配置。', metricsHelpButton()) +
      tabs +
      `<div id="role-library">${roleLibrary.view()}</div>`
    )
  }
  playerEditorSource = undefined
  return (
    header('玩家配置库', '用自然语言描述风格，或直接组合翻前和翻后档位。', metricsHelpButton()) +
    tabs +
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
      : page === 'table'
        ? header('牌桌体验', '六位 AI 对战 · 观看过程或快速累计真实策略统计', metricsHelpButton()) +
          tableExperience.view()
        : page === 'library'
          ? header(
              '场景库',
              '统一查看本机保存的场景，按需复用到实验工作台。',
              metricsHelpButton()
            ) + `<div id="library-panel">${scenarioLibrary.view()}</div>`
          : page === 'catalog'
            ? catalogPageView()
            : page === 'settings'
              ? settingsPage()
              : experimentPage()
  if (page === 'table') {
    tableExperience.mount()
  }
  if (page === 'library') {
    scenarioLibrary.mount()
  }
  if (page === 'catalog') {
    filterCatalog()
  }
  if (page === 'players') {
    if (playersTab === 'mine') {
      playerMetrics()
    } else {
      roleLibrary.mount()
    }
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
  if (draft && page === 'experiment' && experimentTab === 'new') {
    setup.capture()
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
  playerEditorSource = p.sourceRole ? structuredClone(p.sourceRole) : undefined
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
  'players-tab': (b) => {
    playersTab = b.dataset.tab!
    render()
  },
  'browse-roles': () => {
    captureDraft()
    playersTab = 'roles'
    location.hash = 'players'
  },
  'retry-navigation': () => navigate(page),
  'reload-page': () => window.location.reload(),
  'table-choose-player': (b) => tableExperience.choosePlayer(Number(b.dataset.seat)),
  'table-player-details': (b) => tableExperience.choosePlayer(Number(b.dataset.seat), true),
  'table-create': () => tableExperience.create(),
  'table-configure': () => tableExperience.configure(),
  'table-resume': () => tableExperience.control('resume'),
  'table-payout': () => tableExperience.replayPayout(),
  'table-pause': () => tableExperience.control('pause'),
  'table-step': () => tableExperience.control('step'),
  'table-stop': () => tableExperience.control('stop'),
  'table-refresh': () => tableExperience.refresh(),
  'table-history': () => tableExperience.loadHistory(),
  'table-open': (b) => tableExperience.open(b.dataset.id!),
  'table-logs': () => tableExperience.logs(),
  'table-hand': (b) => tableExperience.loadHand(Number(b.dataset.number)),
  'library-refresh': () => scenarioLibrary.load(),
  'library-reset': () => scenarioLibrary.reset(),
  'library-clear': () => scenarioLibrary.clear(),
  'library-select-page': () => scenarioLibrary.selectPage(),
  'library-select-filtered': () => scenarioLibrary.selectPage(true),
  'library-page': (b) => scenarioLibrary.changePage(Number(b.dataset.delta)),
  'library-replace': () => scenarioLibrary.reuse('replace'),
  'library-append': () => scenarioLibrary.reuse('append'),
  'show-metrics-help': (opener) => {
    const dialog = $<HTMLDialogElement>('hud-help-dialog')
    dialog.showModal()
    dialog.querySelector<HTMLElement>('.hud-help-content')!.scrollTop = 0
    dialog.addEventListener('close', () => opener.focus(), { once: true })
  },
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
  'result-tab': (b) => {
    resultView = b.dataset.view!
    render()
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
  'batch-auto': () => {
    setup.reportError('')
    scenarioBatches.auto()
  },
  'batch-history': () => scenarioBatches.loadHistory(),
  'batch-open': (b) => setup.followBatch(b.dataset.id!),
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
  'start-comparison': async () => {
    if (experimentStarting) {
      return
    }
    captureDraft()
    if (!draft.name.trim()) {
      setup.setProblem('请先填写实验名称')
      return
    }
    if (!selectedPlayers().length || !draft.fixtures.length) {
      setup.setProblem('请添加对比玩家和场景')
      return
    }
    experimentStarting = true
    render()
    const signature = draftSignature()
    const snapshot = structuredClone({
      name: draft.name,
      requirements:
        draft.requirements.trim() ||
        `对比 ${selectedPlayers()
          .map((p) => p.label)
          .join('、')} 在 ${draft.fixtures.length} 条相同行动路线中的策略表现。`,
      players: selectedPlayers(),
      fixtures: draft.fixtures,
      repeats: draft.repeats,
    })
    let savedId: string | null = null
    try {
      const checked = await api<{
        fixtures: ScenarioFixture[]
        validation: ((typeof validation)[string] & { id: string })[]
      }>('/scenarios/validate', { fixtures: snapshot.fixtures })
      captureDraft()
      if (signature !== draftSignature()) {
        throw new Error('草稿已变化，请核对后重新开始')
      }
      validation = Object.fromEntries(checked.validation.map((v) => [v.id, v]))
      const meta = await api<ExperimentMeta>('/experiments', {
        ...snapshot,
        fixtures: checked.fixtures,
      })
      savedId = meta.id
      detail = await api(`/experiments/${meta.id}`)
      experimentTab = 'result'
      resultView = 'overview'
      render()
      await api(`/experiments/${meta.id}/execute`, {})
      await refreshDetail()
    } catch (error) {
      const message = error instanceof Error ? error.message : '开始对比失败'
      if (savedId) {
        notice(`实验快照已保存；${message}。可从实验记录继续，不必重新创建。`)
        await refreshDetail().catch(() => undefined)
      } else {
        setup.setProblem(message)
      }
    } finally {
      experimentStarting = false
      if (page === 'experiment' && experimentTab === 'new') {
        render()
      }
    }
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
    resultView = 'overview'
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
      rolePlayers: m.players
        .filter((p) => p.sourceRole && !boot.settings.players.some((saved) => saved.id === p.id))
        .map((p) => structuredClone(p)),
    }
    draft.key = emptyExperimentDraft().key
    scenarioBatches.detach()
    setup.detached()
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
      ...(playerEditorSource ? { sourceRole: structuredClone(playerEditorSource) } : {}),
    }
    const oldId = $('player-id').getAttribute('data-editing')
    if (boot.settings.players.some((saved) => saved.id === p.id && saved.id !== oldId)) {
      throw new Error('该 ID 已被其他玩家使用，请使用新的唯一 ID，或点击该玩家的编辑按钮')
    }
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
  'remove-draft-role': (b) => {
    const id = b.dataset.id!
    if (!draftPlayers().some((p) => p.id === id)) {
      throw new Error('该玩家不在当前草稿中')
    }
    captureDraft()
    if (boot.settings.players.some((p) => p.id === id)) {
      draft.hiddenPlayerIds = [...new Set([...(draft.hiddenPlayerIds ?? []), id])]
    }
    draft.rolePlayers = draft.rolePlayers?.filter((p) => p.id !== id)
    draft.playerIds = draft.playerIds.filter((p) => p !== id)
    persist()
    render()
    notice('已从当前草稿移除角色；内置库、个人玩家配置和历史实验保持不变')
  },
  'restore-draft-players': () => {
    captureDraft()
    draft.hiddenPlayerIds = []
    persist()
    render()
    notice('已恢复个人玩家卡片，请勾选需要参与本次实验的玩家')
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
  const sceneLink = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#scene-"]')
  if (
    sceneLink &&
    page === 'experiment' &&
    experimentTab === 'result' &&
    resultView !== 'compare'
  ) {
    event.preventDefault()
    resultView = 'compare'
    render()
    document
      .getElementById(sceneLink.getAttribute('href')!.slice(1))
      ?.scrollIntoView({ block: 'start' })
    return
  }
  const nav = (event.target as HTMLElement).closest<HTMLAnchorElement>('nav a[data-page]')
  if (
    nav &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  ) {
    if (!boot || !draft || !promptDrafts) {
      return
    }
    event.preventDefault()
    const next = nav.dataset.page!
    if (location.hash === `#${next}`) {
      navigate(next)
    } else {
      location.hash = next
    }
    return
  }
  const b = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]')
  if (!b || b.disabled) {
    return
  }
  const action = actions[b.dataset.action!]
  const roleAction = b.dataset.action!.startsWith('role-')
  const setupAction = b.dataset.action!.startsWith('setup-')
  const seatAction = b.dataset.action!.startsWith('seat-picker-')
  if (!action && !roleAction && !setupAction && !seatAction) {
    return
  }
  const label = b.textContent
  b.disabled = true
  b.textContent = '处理中…'
  void Promise.resolve()
    .then(() =>
      seatAction
        ? tableExperience.pickerClick(b.dataset.action!, b)
        : setupAction
          ? setup.click(b.dataset.action!, b)
          : roleAction
            ? roleLibrary.click(b.dataset.action!, b)
            : action(b)
    )
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : '操作失败'
      setup.reportError(message)
      tableExperience.reportPickerError(message)
      notice(message)
    })
    .finally(() => {
      b.disabled = false
      b.textContent = label
    })
})
app.addEventListener(
  'toggle',
  (event) => {
    const target = event.target as HTMLDetailsElement
    if (target.open && target.dataset.tableHand) {
      void tableExperience.loadHand(Number(target.dataset.tableHand))
    }
  },
  true
)
document.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement
  if (input.id.startsWith('seat-picker-') || input.dataset.seatPickerKey) {
    tableExperience.pickerChange(input)
    return
  }
  if (input.id.startsWith('batch-')) {
    setup.reportError('')
    scenarioBatches.update(input)
    return
  }
  if (input.id === 'scenario-count' || input.id === 'requirements') {
    setup.reportError('')
    captureDraft()
    scenarioBatches.update()
    persist()
    return
  }
  if (input.id === 'history-status') {
    historyStatus = input.value
    $('experiment-history-list').innerHTML = historyRows()
    return
  }
  if (input.id.startsWith('setup-') || input.dataset.setupPlayer || input.dataset.setupScene) {
    setup.change(input)
    return
  }
  if (input.id.startsWith('role-') || input.dataset.roleCompare) {
    roleLibrary.change(input)
    return
  }
  if (input.id.startsWith('table-')) {
    tableExperience.changed()
    return
  }
  if (input.dataset.libraryKey) {
    scenarioLibrary.select(input.dataset.libraryKey, input.checked)
    return
  }
  if (['library-stage', 'library-source'].includes(input.id)) {
    scenarioLibrary.filter()
    return
  }
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
document.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement
  if (input.id === 'seat-picker-search') {
    tableExperience.pickerChange(input)
    return
  }
  if (input.id === 'history-search') {
    historySearch = input.value
    $('experiment-history-list').innerHTML = historyRows()
    return
  }
  if (input.id.startsWith('setup-')) {
    setup.change(input)
    return
  }
  if (['experiment-name', 'requirements', 'scenario-count'].includes(input.id)) {
    captureDraft()
    if (input.id === 'scenario-count' || input.id === 'requirements') {
      setup.reportError('')
      scenarioBatches.update()
    }
    persist()
    return
  }
  if ((event.target as HTMLElement).id === 'role-search') {
    roleLibrary.change(event.target as HTMLInputElement)
    return
  }
  if ((event.target as HTMLElement).id === 'library-search') {
    scenarioLibrary.filter()
    return
  }
  if ((event.target as HTMLElement).id === 'catalog-search') {
    catalogPage = 0
    filterCatalog()
  }
})
$('close-preview').addEventListener('click', () => $<HTMLDialogElement>('preview-dialog').close())
function navigate(next: string) {
  if (!boot || !draft || !promptDrafts) {
    return
  }
  if (!['experiment', 'players', 'library', 'catalog', 'settings', 'table'].includes(next)) {
    return
  }
  try {
    captureDraft()
    capturePrompt()
    if (page === 'table') {
      tableExperience.leave()
    }
  } catch (error) {
    notice(
      `保存当前表单失败：${error instanceof Error ? error.message : '未知错误'}；已继续切换页面`
    )
  }
  page = next
  try {
    render()
  } catch (error) {
    app.innerHTML =
      header('页面未能加载', '可重试当前页面，或切换左侧其他功能。') +
      `<section class="panel"><p class="error">${e(error instanceof Error ? error.message : '页面渲染失败')}</p><div class="actions">${button('重试打开页面', 'retry-navigation')}${button('刷新页面', 'reload-page', true)}</div></section>`
  }
  window.scrollTo(0, 0)
}
window.addEventListener('hashchange', () => navigate(location.hash.slice(1)))
window.addEventListener('beforeunload', captureDraft)

async function start() {
  boot = await api<Boot>('/bootstrap')
  promptDrafts = structuredClone(boot.settings.prompts)
  draft = emptyExperimentDraft()
  try {
    const parse = (raw: string | null) => {
      try {
        return raw ? readExperimentDraft(JSON.parse(raw)) : null
      } catch {
        return null
      }
    }
    const recent = parse(localStorage.getItem('strategy-lab-draft-v1'))
    const backup = parse(localStorage.getItem('strategy-lab-previous-draft-v1'))
    recoverableDraft =
      recent &&
      (recent.playerIds.length || recent.fixtures.length || recent.name || recent.requirements)
        ? recent
        : backup
    if (recoverableDraft) {
      localStorage.setItem('strategy-lab-previous-draft-v1', pretty(recoverableDraft))
    }
  } catch {
    /* The blank workspace remains usable without local storage. */
  }
  page = ['experiment', 'players', 'library', 'catalog', 'settings', 'table'].includes(
    location.hash.slice(1)
  )
    ? location.hash.slice(1)
    : 'experiment'
  render()

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
