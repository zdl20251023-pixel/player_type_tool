import Decimal from 'decimal.js'
import type { PlayerConfig } from '../contracts/workbench'
import type { ScenarioFixture } from '../scenarios'
import type { ScenarioLibrary } from '../storage/scenario-library'
import type { catalogOptions } from '../profiles/catalog'
import { builtinRoles, roleToPlayer, looseness, activity, postflopStyles } from '../profiles/roles'
import { escapeHtml as e } from '../reports/comparison-view'
import { mergeDraftScenes, routeIdentity, type ExperimentDraft } from './experiment-draft'
import type { ScenarioBatchUI } from './scenario-batches'

type Validation = Record<
  string,
  { board: string[]; potBb: number; toCallBb: number; stackBb: number }
>
type Host = {
  draft: () => ExperimentDraft
  selected: () => PlayerConfig[]
  players: () => PlayerConfig[]
  catalog: () => ReturnType<typeof catalogOptions>
  fixtures: () => ScenarioFixture[]
  validation: () => Validation
  validate: (value: Validation) => void
  changed: () => void
  api: <T>(path: string, body?: unknown) => Promise<T>
  notice: (text: string) => void
  batches: () => ScenarioBatchUI
  recoverable: () => ExperimentDraft | null
  reset: () => void
  recover: () => void
  imagePicker: () => string
  starting?: () => boolean
}
const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
const streets: Record<string, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
}
const b = (label: string, action: string, extra = '', primary = false) =>
  `<button type="button" class="${primary ? '' : 'secondary'}" data-action="setup-${action}" ${extra}>${label}</button>`
const input = (id: string, label: string, value: string | number, type = 'text', attrs = '') =>
  `<label class="field">${label}<input id="${id}" type="${type}" value="${e(String(value))}" ${attrs}></label>`
const area = (id: string, label: string, value: string) =>
  `<label class="field">${label}<textarea id="${id}">${e(value)}</textarea></label>`
type Source = 'ai' | 'examples' | 'builtin' | 'library'
const sources: Record<Source, string> = {
  ai: 'AI 生成新场景',
  examples: '示例路线',
  builtin: '内置场景集',
  library: '我的场景库',
}
export class ExperimentSetupUI {
  private kind = ''
  private source: Source = 'ai'
  private selectedPlayers = new Map<string, PlayerConfig>()
  private playerSource = 'builtin'
  private playerSearch = ''
  private levels = ['', '', '']
  private candidates: ScenarioFixture[] = []
  private candidateSelection = new Set<string>()
  private sceneSearch = ''
  private sceneStage = ''
  private candidatePage = 0
  private library: ScenarioLibrary | null = null
  private libraryLoading = false
  private libraryProblem = ''
  private generated: ScenarioFixture[] = []
  private generationDraftKey: string | null = null
  private openingDraftKey: string | undefined
  private editing: ScenarioFixture | null = null
  private editIndex = -1
  private editOriginal = ''
  private problem = ''
  private highlighted = new Set<string>()
  constructor(private readonly host: Host) {}
  view() {
    const d = this.host.draft(),
      players = this.host.selected(),
      old = this.host.recoverable()
    const job = this.host.batches().snapshot
    const linkedJob =
      job &&
      d.generationId === job.id &&
      (['running', 'pausing'].includes(job.status) || d.appliedGenerationId !== job.id)
        ? job
        : null
    const count = d.fixtures.length * players.length * d.repeats
    return `<div class="preparation"><div class="prepare-toolbar"><label class="prepare-name">实验名称<input id="experiment-name" placeholder="为本次实验命名" value="${e(d.name)}"></label><div class="actions">${b(`实验设置 · 重复 ${d.repeats} 次`, 'settings')}${b('重置草稿', 'reset')}</div></div>${old ? `<div class="prepare-recovery"><span>有一份上次草稿：${e(old.name || '未命名实验')} · ${old.playerIds.length} 个玩家 / ${old.fixtures.length} 条场景</span>${b('继续上次草稿', 'recover')}</div>` : ''}${this.problem ? `<p class="error" role="alert">${e(this.problem)}</p>` : ''}<div class="prepare-panels"><section class="panel prepare-panel"><div class="panel-header"><h2>已选对比玩家 <small>${players.length} / 8</small></h2>${b('＋ 添加玩家', 'players')}</div><div class="prepare-list" id="prepare-player-list">${players.map((p, i) => `<article class="prepare-player"><span class="prepare-avatar tone-${i % 3}">${e(p.label.slice(0, 1))}</span><div class="prepare-player-info"><strong>${e(p.label)}</strong><small title="${e(p.description)}">${e(p.description.split('\n')[0])}</small><code>翻前 ${e(p.preflop)} / 翻后 ${e(p.postflop)}</code></div><div class="prepare-row-actions">${b('详情', 'player-info', `data-id="${e(p.id)}"`)}${b('移除', 'remove-player', `data-id="${e(p.id)}"`)}</div></article>`).join('') || `<div class="prepare-empty"><span>♧</span><h3>还没有对比玩家</h3><p>从 75 种内置角色或个人配置中选择。</p>${b('添加对比玩家', 'players', '', true)}</div>`}</div></section><section class="panel prepare-panel"><div class="panel-header"><h2>本次实验场景 <small>${d.fixtures.length} / 100</small></h2>${b('＋ 添加场景', 'scenes')}</div><div class="prepare-list" id="prepare-scene-list">${d.fixtures.map((f, i) => `<article class="prepare-scene ${this.highlighted.has(f.id) ? 'prepare-new' : ''}"><span class="prepare-scene-id">${e(f.id)}</span><div class="prepare-scene-info"><strong>${e(f.description)}</strong><small>${streets[f.street]} · ${positions[f.hero]} · ${e(f.cards)} <span>来源：${e(d.origins?.[f.id] || '历史草稿')}</span></small></div><span class="badge ${this.host.validation()[f.id] ? '' : 'warn'}">${this.host.validation()[f.id] ? '已校验' : '待校验'}</span><div class="prepare-row-actions">${b('查看／编辑', 'edit-scene', `data-index="${i}"`)}${b('移除', 'remove-scene', `data-index="${i}"`)}</div></article>`).join('') || `<div class="prepare-empty"><span>▤</span><h3>还没有对比场景</h3><p>生成新场景，或选用示例、内置和历史路线。</p>${b('添加对比场景', 'scenes', '', true)}</div>`}</div><div class="prepare-panel-note">所有玩家使用相同的底牌、公共牌和行动历史。</div></section></div>${linkedJob ? `<div class="prepare-job"><span>${['running', 'pausing'].includes(linkedJob.status) ? '场景生成中' : '生成任务已保存'} · ${linkedJob.fixtures.length} / ${linkedJob.count} 条可用候选 · 尚未自动加入实验</span>${b('查看生成任务', 'scenes')}</div>` : ''}<div class="prepare-start"><div><strong>${players.length} 个玩家 × ${d.fixtures.length} 条场景 × ${d.repeats} 次重复 = ${count} 次请求</strong><small>${players.length && d.fixtures.length ? '开始前校验路线并保存实验快照。点击后调用 solver。' : '先添加玩家和场景，再开始对比。'}</small></div><button data-action="start-comparison" ${!players.length || !d.fixtures.length || this.host.starting?.() ? 'disabled' : ''}>${this.host.starting?.() ? '正在保存并开始…' : '▶ 开始对比'}</button></div></div>`
  }
  setProblem(text: string) {
    this.problem = text
    this.host.changed()
  }
  reportError(text: string) {
    const dialog = document.getElementById('setup-dialog') as HTMLDialogElement | null
    const error = document.getElementById('setup-error')
    if (dialog?.open && error) {
      error.textContent = text
      error.hidden = !text
    }
  }
  private dialog(title: string, content: string) {
    const dialog = document.getElementById('setup-dialog') as HTMLDialogElement
    dialog.innerHTML = `<div class="setup-dialog-head"><div><span>EXPERIMENT / PREPARATION</span><h2 id="setup-dialog-title">${title}</h2></div>${b('关闭', 'close', 'aria-label="关闭弹窗"')}</div><div class="setup-dialog-body"><p id="setup-error" class="error" role="alert" hidden></p>${content}</div>`
    if (!dialog.open) {
      dialog.showModal()
    }
    dialog.scrollTop = 0
  }
  close() {
    this.capture()
    ;(document.getElementById('setup-dialog') as HTMLDialogElement).close()
    this.kind = ''
  }
  capture() {
    const d = this.host.draft()
    const name = document.getElementById('experiment-name') as HTMLInputElement | null
    if (name) {
      d.name = name.value
    }
    for (const [id, key] of [
      ['requirements', 'requirements'],
      ['scenario-count', 'count'],
    ] as const) {
      const field = document.getElementById(id) as HTMLInputElement | null
      if (field && this.kind === 'scenes' && this.source === 'ai') {
        if (key === 'count') {
          d.count = Number(field.value)
        } else {
          d.requirements = field.value
        }
      }
    }
  }
  private playerPool() {
    const saved = this.host.players()
    if (this.playerSource === 'personal') {
      return [
        ...saved,
        ...(this.host.draft().rolePlayers ?? []).filter((p) => !saved.some((s) => s.id === p.id)),
      ]
    }
    return builtinRoles.map(roleToPlayer)
  }
  private playerMetrics(p: PlayerConfig) {
    const pre = this.host
      .catalog()
      .find((m) => m.executable && m.stage === 'preflop' && m.name === p.preflop)
    const post = this.host
      .catalog()
      .find((m) => m.executable && m.stage === 'postflop' && m.name === p.postflop)
    const pct = (v: number | undefined) =>
      v === undefined ? '—' : new Decimal(v).mul(100).toFixed(2) + '%'
    return `<div class="setup-player-metrics">${[
      ['VPIP', pct(pre?.vpip)],
      ['PFR', pct(pre?.pfr)],
      ['PFR/VPIP', pre ? new Decimal(pre.pfr).div(pre.vpip).mul(100).toFixed(2) + '%' : '—'],
      ['AF', post ? new Decimal(post.af).toFixed(4) : '—'],
      ['WTSD', pct(post?.wtsd)],
    ]
      .map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`)
      .join('')}</div>`
  }
  private playerResults() {
    const rows = this.playerPool().filter((p) => {
      const role = builtinRoles.find((r) => r.id === p.sourceRole?.id)
      return (
        (!this.playerSearch ||
          `${p.id} ${p.label} ${p.sourceRole?.id ?? ''} ${p.preflop} ${p.postflop}`
            .toLowerCase()
            .includes(this.playerSearch.toLowerCase())) &&
        (this.playerSource === 'personal' ||
          this.levels.every((v, i) => !v || [role?.l, role?.a, role?.f][i] === Number(v)))
      )
    })
    return `<p class="muted">${rows.length} 个可选配置 · 数值为档位参考，非完整组合实测 HUD。</p><div class="setup-player-grid">${
      rows
        .map((p, i) => {
          const collision = this.host.players().find((s) => s.id === p.id)
          const blocked =
            this.playerSource === 'builtin' &&
            collision &&
            JSON.stringify(collision) !== JSON.stringify(p)
          return `<article class="setup-player-card ${this.selectedPlayers.has(p.id) ? 'selected' : ''}"><div class="setup-player-heading"><label><input type="checkbox" data-setup-player="${e(p.id)}" ${this.selectedPlayers.has(p.id) ? 'checked' : ''} ${blocked ? 'disabled' : ''}><span class="prepare-avatar tone-${i % 3}">${e(p.label.slice(0, 1))}</span><strong>${e(p.label)}</strong></label>${b('参数详情', 'picker-player-info', `data-id="${e(p.id)}"`)}</div><small>${e(p.sourceRole?.id ?? '个人配置')} · ${e(p.preflop)} / ${e(p.postflop)}</small>${this.playerMetrics(p)}${blocked ? '<p class="error">ID 与个人配置冲突，请在角色库复制为新 ID。</p>' : ''}</article>`
        })
        .join('') || '<p class="empty">没有匹配的玩家配置。</p>'
    }</div>`
  }
  private openPlayers() {
    this.capture()
    this.kind = 'players'
    this.openingDraftKey = this.host.draft().key
    this.selectedPlayers = new Map(this.host.selected().map((p) => [p.id, structuredClone(p)]))
    this.paintPlayerDialog()
  }
  private paintPlayerDialog() {
    const select = (i: number, label: string, values: readonly string[]) =>
      `<label class="field">${label}<select id="setup-level-${i}"><option value="">全部</option>${values.map((v, n) => `<option value="${n + 1}" ${this.levels[i] === String(n + 1) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`
    this.dialog(
      '添加对比玩家',
      `<div class="tabbar">${b('内置角色库 · 75', 'player-source', 'data-source="builtin"', this.playerSource === 'builtin')}${b('我的玩家配置', 'player-source', 'data-source="personal"', this.playerSource === 'personal')}<button class="secondary" data-action="role-standards">划分标准</button></div><div class="setup-player-filters">${input('setup-player-search', '搜索名称或编号', this.playerSearch)}${this.playerSource === 'builtin' ? select(0, '翻前松紧', looseness) + select(1, '翻前主动', activity) + select(2, '翻后风格', postflopStyles) : ''}</div><div class="setup-scroll" id="setup-player-results">${this.playerResults()}</div><div class="setup-dialog-footer"><strong id="setup-player-count">已选择 ${this.selectedPlayers.size} / 8 个玩家</strong><div class="actions">${b('取消', 'close')}${b('加入本次实验', 'apply-players', '', true)}</div></div>`
    )
  }
  private playerDetail(player: PlayerConfig, back: boolean) {
    this.kind = back ? 'picker-detail' : 'player-detail'
    this.dialog(
      '玩家参数详情',
      `<h3>${e(player.label)}</h3><p>${e(player.description)}</p>${this.playerMetrics(player)}<p class="muted">指标来自 2-0 / 4-6p 对应街道档位，仅作风格参考。</p><p>翻前 <code>${e(player.preflop)}</code></p><p>翻后 <code>${e(player.postflop)}</code></p>${player.sourceRole ? `<p>来源角色 ${e(player.sourceRole.id)} · 方案 ${e(player.sourceRole.version)}</p>` : ''}<div class="setup-dialog-footer"><span>不会修改个人配置或历史快照。</span>${b(back ? '返回选择玩家' : '关闭', back ? 'back-players' : 'close')}</div>`
    )
  }
  private candidateRows() {
    return this.candidates.filter(
      (f) =>
        (!this.sceneStage || f.street === this.sceneStage) &&
        (!this.sceneSearch ||
          `${f.id} ${f.description} ${positions[f.hero]} ${f.cards}`
            .toLowerCase()
            .includes(this.sceneSearch.toLowerCase()))
    )
  }
  private candidateResults() {
    if (this.source === 'library' && this.libraryLoading) {
      return '<p class="empty">正在读取本机场景库…</p>'
    }
    if (this.source === 'library' && this.libraryProblem) {
      return `<p class="error">${e(this.libraryProblem)}</p>${b('重新读取场景库', 'reload-library')}`
    }
    const rows = this.candidateRows(),
      pages = Math.max(1, Math.ceil(rows.length / 10))
    this.candidatePage = Math.min(this.candidatePage, pages - 1)
    return `<div class="setup-candidate-tools"><span>候选场景 · ${rows.length}</span>${b('选择本页', 'select-scenes')}${b('清空选择', 'clear-scenes')}</div>${
      rows
        .slice(this.candidatePage * 10, this.candidatePage * 10 + 10)
        .map(
          (f) =>
            `<article class="setup-candidate"><label><input type="checkbox" data-setup-scene="${e(routeIdentity(f))}" ${this.candidateSelection.has(routeIdentity(f)) ? 'checked' : ''}><div><strong>${e(f.id)} · ${e(f.description)}</strong><small>${streets[f.street]} · ${positions[f.hero]} · ${e(f.cards)}</small></div></label><details><summary>路线详情</summary><pre>${e(f.line || '尚无自愿行动')}</pre><p>${e(f.history)}</p></details><small class="muted">加入前统一进行合法性重放校验</small></article>`
        )
        .join('') ||
      `<div class="prepare-empty"><h3>${this.source === 'ai' ? '还没有候选场景' : '没有匹配的场景'}</h3><p>${this.source === 'ai' ? '填写要求并生成，或通过生成记录选用历史任务。' : '可调整搜索和街道筛选。'}</p></div>`
    }<div class="setup-pagination">${b('上一页', 'candidate-page', 'data-delta="-1" ' + (this.candidatePage === 0 ? 'disabled' : ''))}<span>${this.candidatePage + 1} / ${pages}</span>${b('下一页', 'candidate-page', 'data-delta="1" ' + (this.candidatePage + 1 === pages ? 'disabled' : ''))}</div>`
  }
  private paintCandidates() {
    const target = document.getElementById('setup-candidate-results')
    if (target) {
      target.innerHTML = this.candidateResults()
    }
    const count = document.getElementById('setup-scene-count')
    if (count) {
      count.textContent = `已选 ${this.candidateSelection.size} 条`
    }
    const action = document.getElementById('setup-add-scenes') as HTMLButtonElement | null
    if (action) {
      action.disabled = !this.candidateSelection.size
    }
  }
  private paintSceneDialog() {
    const d = this.host.draft(),
      job = this.host.batches().snapshot
    const linked = job && job.id === d.generationId ? job : null
    this.dialog(
      '添加对比场景',
      `<div class="setup-scene-layout"><nav class="setup-sources" aria-label="场景来源">${Object.entries(
        sources
      )
        .map(([id, label]) => b(label, 'scene-source', `data-source="${id}"`, this.source === id))
        .join(
          ''
        )}</nav><div class="setup-scene-content ${this.source === 'ai' ? 'with-generator' : ''}">${this.source === 'ai' ? `<div class="setup-generator">${area('requirements', '描述需要的场景', d.requirements)}${input('scenario-count', '生成数量', d.count, 'number', 'min="1" max="100"')}<details><summary>高级设置（分批、图片与提示词）</summary>${this.host.batches().controls()}${this.host.imagePicker()}<div class="actions"><button class="secondary" data-action="preview-scenarios">预览计划与提示词</button></div></details><div id="batch-plan-summary" class="setup-batch-plan">${this.host.batches().planSummary()}</div>${b('生成候选场景', 'generate', '', true)}<p class="muted">生成只产生候选，勾选后再加入本次实验。${this.host.selected().length ? '' : '请先在主页添加对比玩家。'}</p><p id="setup-generation-state">${linked ? `${linked.fixtures.length} / ${linked.count} 条可用候选` : ''}</p><details><summary>生成记录与批次详情</summary><div id="scenario-batch-panel">${linked ? this.host.batches().view() : '<button class="secondary" data-action="batch-history">查看已保存任务</button>'}</div></details></div>` : ''}<div class="setup-candidates"><div class="setup-candidate-filters">${input('setup-scene-search', '搜索候选场景', this.sceneSearch)}<label class="field">街道<select id="setup-scene-stage"><option value="">全部街道</option>${Object.entries(
        streets
      )
        .map(
          ([v, label]) =>
            `<option value="${v}" ${this.sceneStage === v ? 'selected' : ''}>${label}</option>`
        )
        .join(
          ''
        )}</select></label></div><div class="setup-scroll" id="setup-candidate-results">${this.candidateResults()}</div><p class="muted">候选结果尚未加入当前实验。</p></div></div></div><div class="setup-dialog-footer"><strong id="setup-scene-count">已选 ${this.candidateSelection.size} 条</strong><label class="setup-radio"><input type="radio" name="setup-scene-mode" value="append" checked>追加到当前草稿</label><label class="setup-radio"><input type="radio" name="setup-scene-mode" value="replace">替换当前场景</label><div class="actions">${b('取消', 'close')}${b('加入本次实验', 'apply-scenes', `id="setup-add-scenes" ${!this.candidateSelection.size ? 'disabled' : ''}`, true)}</div></div>`
    )
  }
  private async sourceChanged(source: Source) {
    this.capture()
    this.source = source
    this.candidateSelection.clear()
    this.candidatePage = 0
    if (source === 'examples') {
      this.candidates = this.host.fixtures().filter((f) => /^S\d+$/.test(f.id))
    } else if (source === 'builtin') {
      this.candidates = this.host.fixtures().filter((f) => !/^S\d+$/.test(f.id))
    } else if (source === 'ai') {
      this.candidates = this.generated
    } else {
      this.candidates = this.library?.entries.map((row) => row.fixture) ?? []
    }
    this.paintSceneDialog()
    if (source === 'library' && !this.library) {
      await this.loadLibrary()
    }
  }
  private async loadLibrary() {
    this.libraryLoading = true
    this.libraryProblem = ''
    this.paintCandidates()
    try {
      this.library = await this.host.api<ScenarioLibrary>('/scenario-library')
      if (this.kind === 'scenes' && this.source === 'library') {
        this.candidates = this.library.entries.map((row) => row.fixture)
      }
    } catch (error) {
      this.libraryProblem = error instanceof Error ? error.message : '场景库读取失败'
    } finally {
      this.libraryLoading = false
      if (this.kind === 'scenes' && this.source === 'library') {
        this.paintCandidates()
      }
    }
  }
  batchChanged() {
    const d = this.host.draft(),
      job = this.host.batches().snapshot
    if (!job) {
      return
    }
    if (this.generationDraftKey === d.key) {
      d.generationId = job.id
      this.generationDraftKey = null
    }
    if (d.generationId !== job.id) {
      return
    }
    this.generated = structuredClone(job.fixtures)
    if (this.kind === 'scenes' && this.source === 'ai') {
      this.candidates = this.generated
      this.paintCandidates()
      const state = document.getElementById('setup-generation-state')
      if (state) {
        state.textContent = `${job.fixtures.length} / ${job.count} 条已通过校验 · ${job.status === 'running' ? '生成中' : '已保存'}`
      }
    }
    this.host.changed()
  }
  async followBatch(id: string) {
    this.candidateSelection.clear()
    this.host.draft().generationId = id
    this.host.changed()
    await this.host.batches().open(id)
  }
  setGenerated(fixtures: ScenarioFixture[]) {
    this.generated = structuredClone(fixtures)
    if (this.kind === 'scenes' && this.source === 'ai') {
      this.candidates = this.generated
      this.paintCandidates()
    }
    this.host.notice('已载入可用候选，请勾选并加入本次实验')
  }
  detached() {
    this.generated = []
    this.generationDraftKey = null
    this.candidates = []
    this.candidateSelection.clear()
    this.problem = ''
    this.highlighted.clear()
  }
  private ensureCurrent() {
    if (this.openingDraftKey !== this.host.draft().key) {
      throw new Error('草稿已切换，请关闭弹窗后重新打开')
    }
  }
  private checked(result: { validation: (Validation[string] & { id: string })[] }) {
    this.host.validate(Object.fromEntries(result.validation.map((v) => [v.id, v])))
  }
  private async applyScenes() {
    this.ensureCurrent()
    const d = this.host.draft(),
      before = JSON.stringify(d.fixtures),
      selected = this.candidates.filter((f) => this.candidateSelection.has(routeIdentity(f)))
    if (!selected.length) {
      throw new Error('请先勾选候选场景')
    }
    const mode = (document.querySelector<HTMLInputElement>('input[name="setup-scene-mode"]:checked')
      ?.value ?? 'append') as 'append' | 'replace'
    const merged = mergeDraftScenes(d.fixtures, selected, mode)
    const checked = await this.host.api<{
      fixtures: ScenarioFixture[]
      validation: (Validation[string] & { id: string })[]
    }>('/scenarios/validate', { fixtures: merged.fixtures })
    this.ensureCurrent()
    if (JSON.stringify(d.fixtures) !== before) {
      throw new Error('当前路线已变化，请重新选择后加入')
    }
    const oldOrigins = mode === 'append' ? (d.origins ?? {}) : {}
    const oldKeys = new Set(mode === 'append' ? d.fixtures.map(routeIdentity) : [])
    d.fixtures = checked.fixtures
    if (this.source === 'ai') {
      d.appliedGenerationId = d.generationId
    }
    d.origins = Object.fromEntries(
      d.fixtures.map((f) => [
        f.id,
        oldKeys.has(routeIdentity(f)) ? (oldOrigins[f.id] ?? '历史草稿') : sources[this.source],
      ])
    )
    this.highlighted = new Set(
      d.fixtures.filter((f) => !oldKeys.has(routeIdentity(f))).map((f) => f.id)
    )
    this.checked(checked)
    this.close()
    this.host.changed()
    this.host.notice(
      `当前实验已选 ${d.fixtures.length} 条场景${merged.duplicates ? `，跳过 ${merged.duplicates} 条重复路线` : ''}${merged.renamed ? `，调整 ${merged.renamed} 个冲突编号` : ''}`
    )
  }
  private editScene(index: number) {
    const f = this.host.draft().fixtures[index]
    if (!f) {
      throw new Error('场景已移除')
    }
    this.kind = 'edit-scene'
    this.openingDraftKey = this.host.draft().key
    this.editIndex = index
    this.editOriginal = JSON.stringify(f)
    this.editing = structuredClone(f)
    this.dialog(
      '查看／编辑场景路线',
      `<p class="muted">编辑后点击保存并校验才会更新当前实验，取消不会应用修改。f 弃牌 / c 跟注 / x 过牌 / r 加注到 / b 下注 / @ 发公共牌。</p><div class="grid">${input('setup-edit-id', '场景编号', f.id)}${input('setup-edit-description', '场景名称 / 决策问题', f.description)}${input('setup-edit-cards', 'Hero 底牌', f.cards)}<label class="field">Hero 位置<select id="setup-edit-hero">${positions.map((p, i) => `<option value="${i}" ${f.hero === i ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label class="field">街道<select id="setup-edit-street">${Object.entries(
        streets
      )
        .map(
          ([s, label]) =>
            `<option value="${s}" ${s === f.street ? 'selected' : ''}>${label}</option>`
        )
        .join(
          ''
        )}</select></label>${input('setup-edit-category', '场景类型', f.category)}</div>${area('setup-edit-line', '完整行动线（金额 BB）', f.line)}${area('setup-edit-history', '路线说明', f.history)}<div class="setup-dialog-footer"><span>仅修改当前草稿，不改写来源场景。</span><div class="actions">${b('取消', 'close')}${b('保存并校验', 'save-scene', '', true)}</div></div>`
    )
  }
  async click(action: string, target: HTMLButtonElement) {
    const d = this.host.draft()
    if (action === 'setup-close') {
      this.close()
      return
    }
    if (action === 'setup-players') {
      this.openPlayers()
      return
    }
    if (action === 'setup-player-source') {
      this.playerSource = target.dataset.source!
      this.paintPlayerDialog()
      return
    }
    if (action === 'setup-back-players') {
      this.kind = 'players'
      this.paintPlayerDialog()
      return
    }
    if (action === 'setup-player-info' || action === 'setup-picker-player-info') {
      const p =
        action === 'setup-player-info'
          ? this.host.selected().find((p) => p.id === target.dataset.id)
          : this.playerPool().find((p) => p.id === target.dataset.id)
      if (p) {
        this.playerDetail(p, action === 'setup-picker-player-info')
      }
      return
    }
    if (action === 'setup-apply-players') {
      this.ensureCurrent()
      if (this.selectedPlayers.size > 8) {
        throw new Error('最多选择 8 个玩家')
      }
      d.playerIds = [...this.selectedPlayers.keys()]
      d.rolePlayers = [...this.selectedPlayers.values()].filter(
        (p) => !this.host.players().some((s) => s.id === p.id)
      )
      d.hiddenPlayerIds = []
      this.close()
      this.host.changed()
      this.host.notice(`已选择 ${d.playerIds.length} 个对比玩家`)
      return
    }
    if (action === 'setup-remove-player') {
      d.playerIds = d.playerIds.filter((id) => id !== target.dataset.id)
      this.host.changed()
      return
    }
    if (action === 'setup-scenes') {
      this.capture()
      this.kind = 'scenes'
      this.openingDraftKey = d.key
      this.candidateSelection.clear()
      const job = this.host.batches().snapshot
      this.generated = job && job.id === d.generationId ? structuredClone(job.fixtures) : []
      await this.sourceChanged('ai')
      return
    }
    if (action === 'setup-scene-source') {
      await this.sourceChanged(target.dataset.source as Source)
      return
    }
    if (action === 'setup-reload-library') {
      await this.loadLibrary()
      return
    }
    if (action === 'setup-apply-scenes') {
      await this.applyScenes()
      return
    }
    if (action === 'setup-select-scenes') {
      for (const f of this.candidateRows().slice(
        this.candidatePage * 10,
        this.candidatePage * 10 + 10
      )) {
        this.candidateSelection.add(routeIdentity(f))
      }
      this.paintCandidates()
      return
    }
    if (action === 'setup-clear-scenes') {
      this.candidateSelection.clear()
      this.paintCandidates()
      return
    }
    if (action === 'setup-candidate-page') {
      this.candidatePage = Math.max(0, this.candidatePage + Number(target.dataset.delta))
      this.paintCandidates()
      return
    }
    if (action === 'setup-generate') {
      this.capture()
      if (!this.host.selected().length) {
        throw new Error('请先在主页添加至少一个对比玩家')
      }
      if (!d.requirements.trim()) {
        throw new Error('请填写需要生成的场景描述')
      }
      this.generationDraftKey = d.key ?? null
      this.host.changed()
      try {
        await this.host.batches().start()
      } catch (error) {
        this.generationDraftKey = null
        throw error
      }
      return
    }
    if (action === 'setup-remove-scene') {
      const [f] = d.fixtures.splice(Number(target.dataset.index), 1)
      if (f && d.origins) {
        delete d.origins[f.id]
      }
      this.host.changed()
      return
    }
    if (action === 'setup-edit-scene') {
      this.editScene(Number(target.dataset.index))
      return
    }
    if (action === 'setup-save-scene') {
      this.ensureCurrent()
      if (JSON.stringify(d.fixtures[this.editIndex]) !== this.editOriginal) {
        throw new Error('该场景已变化，请重新打开编辑')
      }
      const f = { ...this.editing! }
      for (const key of [
        'id',
        'description',
        'cards',
        'hero',
        'street',
        'category',
        'line',
        'history',
      ] as const) {
        const value = (document.getElementById(`setup-edit-${key}`) as HTMLInputElement).value
        Object.assign(f, { [key]: key === 'hero' ? Number(value) : value })
      }
      const fixtures = d.fixtures.map((old, i) => (i === this.editIndex ? f : old))
      const result = await this.host.api<{
        fixtures: ScenarioFixture[]
        validation: (Validation[string] & { id: string })[]
      }>('/scenarios/validate', { fixtures })
      this.ensureCurrent()
      if (JSON.stringify(d.fixtures[this.editIndex]) !== this.editOriginal) {
        throw new Error('该场景已变化，请重新打开编辑')
      }
      d.fixtures = result.fixtures
      d.origins = { ...d.origins, [f.id]: '当前草稿编辑' }
      this.highlighted = new Set([f.id])
      this.checked(result)
      this.close()
      this.host.changed()
      return
    }
    if (action === 'setup-settings') {
      this.capture()
      this.kind = 'settings'
      this.dialog(
        '实验设置',
        `${input('setup-repeats', '每组重复次数', d.repeats, 'number', 'min="1" max="10"')}${area('setup-experiment-note', '实验说明（可选）', d.requirements)}<p>6 人 · 初始 100BB · 无前注、无抓注。同一场景在所有已选玩家之间对比。</p><div class="setup-dialog-footer"><span>重复次数影响请求总数。</span>${b('保存设置', 'save-settings', '', true)}</div>`
      )
      return
    }
    if (action === 'setup-save-settings') {
      const n = Number((document.getElementById('setup-repeats') as HTMLInputElement).value)
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        throw new Error('重复次数为 1..10')
      }
      d.repeats = n
      d.requirements = (
        document.getElementById('setup-experiment-note') as HTMLTextAreaElement
      ).value
      this.close()
      this.host.changed()
      return
    }
    if (action === 'setup-reset' || action === 'setup-recover') {
      this.capture()
      this.kind = 'confirm'
      const old = this.host.recoverable()
      this.dialog(
        action === 'setup-reset' ? '重置当前草稿' : '恢复上次草稿',
        `<p>${action === 'setup-reset' ? `将清空本次实验的 ${d.playerIds.length} 个玩家、${d.fixtures.length} 条场景及生成任务关联。` : `将载入“${e(old?.name || '未命名实验')}”，替换当前草稿。`}</p><p>个人配置、场景库和历史实验保持不变；当前草稿保留一份恢复副本。后台生成任务继续保存，不会自动填入新草稿。</p><div class="setup-dialog-footer">${b('取消', 'close')}${b(action === 'setup-reset' ? '确认清空' : '确认恢复', action === 'setup-reset' ? 'confirm-reset' : 'confirm-recover', '', true)}</div>`
      )
      return
    }
    if (action === 'setup-confirm-reset' || action === 'setup-confirm-recover') {
      this.close()
      this.detached()
      if (action === 'setup-confirm-reset') {
        this.host.reset()
      } else {
        this.host.recover()
      }
      return
    }
  }
  change(field: HTMLInputElement | HTMLSelectElement) {
    if (field.dataset.setupPlayer) {
      const id = field.dataset.setupPlayer
      if ((field as HTMLInputElement).checked) {
        if (this.selectedPlayers.size >= 8) {
          ;(field as HTMLInputElement).checked = false
          this.host.notice('最多选择 8 个玩家')
          return
        }
        const p = this.playerPool().find((p) => p.id === id)
        if (p) {
          this.selectedPlayers.set(id, structuredClone(p))
        }
      } else {
        this.selectedPlayers.delete(id)
      }
      const count = document.getElementById('setup-player-count')
      if (count) {
        count.textContent = `已选择 ${this.selectedPlayers.size} / 8 个玩家`
      }
      field
        .closest('.setup-player-card')
        ?.classList.toggle('selected', (field as HTMLInputElement).checked)
      return
    }
    if (field.dataset.setupScene) {
      if ((field as HTMLInputElement).checked) {
        this.candidateSelection.add(field.dataset.setupScene)
      } else {
        this.candidateSelection.delete(field.dataset.setupScene)
      }
      this.paintCandidates()
      return
    }
    if (field.id === 'setup-player-search' || field.id.startsWith('setup-level-')) {
      if (field.id === 'setup-player-search') {
        this.playerSearch = field.value
      } else {
        this.levels[Number(field.id.at(-1))] = field.value
      }
      const rows = document.getElementById('setup-player-results')
      if (rows) {
        rows.innerHTML = this.playerResults()
      }
      return
    }
    if (field.id === 'setup-scene-search' || field.id === 'setup-scene-stage') {
      if (field.id === 'setup-scene-search') {
        this.sceneSearch = field.value
      } else {
        this.sceneStage = field.value
      }
      this.candidatePage = 0
      this.paintCandidates()
      return
    }
  }
}
