import type { ScenarioLibrary, ScenarioLibraryEntry } from '../storage/scenario-library'
import type { ScenarioFixture } from '../scenarios'
import { escapeHtml as e } from '../reports/comparison-view'

type Host = {
  api: <T>(path: string, body?: unknown) => Promise<T>
  existing: () => ScenarioFixture[]
  apply: (fixtures: ScenarioFixture[], message: string) => void
  notice: (message: string) => void
}
const stages: Record<string, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
}
const kinds = { generation: '分批生成', call: '历史模型调用', experiment: '已保存实验' }
const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
const date = (value: string) =>
  new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })

export class ScenarioLibraryUI {
  private data: ScenarioLibrary | null = null
  private loading = false
  private search = ''
  private stage = 'all'
  private source = 'all'
  private page = 0
  private readonly selected = new Set<string>()
  constructor(private readonly host: Host) {}
  private button(label: string, action: string, extra = '', disabled = false) {
    return `<button type="button" data-action="${action}" class="secondary" ${extra} ${disabled ? 'disabled' : ''}>${label}</button>`
  }
  view() {
    return `<section class="panel"><div class="panel-header"><h2>已保存场景 <small>本机历史快照</small></h2>${this.button('刷新场景库', 'library-refresh')}</div><p>汇集分批生成、早期场景调用和已保存实验中的合法路线；相同路线合并展示并保留全部来源。浏览与复用不请求大模型或 solver。</p><div class="library-toolbar"><label>搜索场景<input id="library-search" type="search" placeholder="编号、底牌、位置、描述或行动线…" value="${e(this.search)}"></label><label>街道<select id="library-stage"><option value="all">全部街道</option>${Object.entries(
      stages
    )
      .map(
        ([key, label]) =>
          `<option value="${key}" ${this.stage === key ? 'selected' : ''}>${label}</option>`
      )
      .join(
        ''
      )}</select></label><label>来源任务<select id="library-source"><option value="all">全部来源</option>${this.data?.sources.map((s) => `<option value="${e(s.key)}" ${this.source === s.key ? 'selected' : ''}>${kinds[s.kind]} · ${date(s.createdAt)} · ${e(s.title.slice(0, 55))}（${s.count} 条）</option>`).join('') ?? ''}</select></label>${this.button('重置筛选', 'library-reset')}</div><div id="library-results">${this.results()}</div></section>`
  }
  private filtered() {
    const search = this.search.trim().toLowerCase()
    return (this.data?.entries ?? []).filter((entry) => {
      const f = entry.fixture
      return (
        (this.stage === 'all' || f.street === this.stage) &&
        (this.source === 'all' || entry.sources.includes(this.source)) &&
        (!search ||
          [f.id, f.description, f.category, f.history, f.cards, f.line, positions[f.hero]]
            .join(' ')
            .toLowerCase()
            .includes(search))
      )
    })
  }
  private sourceLink(key: string) {
    const s = this.data?.sources.find((s) => s.key === key)
    if (!s) {
      return ''
    }
    const url =
      s.kind === 'generation'
        ? `/api/scenario-generations/${s.id}`
        : s.kind === 'call'
          ? `/api/calls/${s.id}/result`
          : `/api/experiments/${s.id}/raw/session.json`
    return `<a href="${url}" target="_blank" rel="noopener">${e(kinds[s.kind])} · ${e(date(s.createdAt))} · ${e(s.title)} ↗</a>`
  }
  private card(entry: ScenarioLibraryEntry) {
    const f = entry.fixture
    return `<article class="library-card"><div class="library-card-heading"><label><input type="checkbox" data-library-key="${entry.key}" ${this.selected.has(entry.key) ? 'checked' : ''} aria-label="选择场景 ${e(f.id)} ${e(f.description)}"><strong>${e(f.id)} · ${e(f.description)}</strong></label><span class="chip">${stages[f.street]}</span></div><p>${positions[f.hero]} · <b>${e(f.cards)}</b> · ${e(f.category)}</p><details><summary>预览行动路线与说明</summary><pre>${e(f.line || '尚无自愿行动')}</pre><p>${e(f.history)}</p></details><details><summary>${entry.sources.length} 个保存来源 · 最近 ${e(date(entry.latestAt))}</summary><div class="library-origins">${entry.sources.map((s) => this.sourceLink(s)).join('')}</div></details></article>`
  }
  private results() {
    if (this.loading && !this.data) {
      return '<p class="muted">正在读取本机历史场景…</p>'
    }
    if (!this.data) {
      return '<p class="muted">进入场景库后自动读取，可点击刷新重试。</p>'
    }
    const filtered = this.filtered()
    const pages = Math.max(1, Math.ceil(filtered.length / 12))
    this.page = Math.min(this.page, pages - 1)
    const rows = filtered.slice(this.page * 12, (this.page + 1) * 12)
    const allSelected = rows.length > 0 && rows.every((r) => this.selected.has(r.key))
    return `<div class="library-stats"><span><b>${this.data.entries.length}</b> 条去重场景</span><span><b>${this.data.sources.length}</b> 个保存来源</span><span><b>${this.selected.size}</b> 条已选（跨页保留）</span></div><div class="library-actions"><div>${this.button('替换工作台路线', 'library-replace', '', !this.selected.size)}${this.button('追加到工作台', 'library-append', '', !this.selected.size)}</div><div>${this.button(allSelected ? '取消选择本页' : '选择本页', 'library-select-page', '', !rows.length)}${this.button('选择筛选结果', 'library-select-filtered', '', !filtered.length || filtered.length > 100)}${this.button('清空选择', 'library-clear', '', !this.selected.size)}</div></div><p class="muted">筛选后 ${filtered.length} / ${this.data.entries.length} 条；每次最多复用 100 条。追加时跳过重复路线，编号冲突自动改名。原始记录保持不变。</p>${filtered.length > 100 ? '<p class="muted">筛选结果超过 100 条，请缩小范围或逐页勾选。</p>' : ''}<div class="library-cards">${rows.map((r) => this.card(r)).join('') || '<p class="empty">没有匹配的已保存场景，请调整筛选或刷新。</p>'}</div><div class="library-pagination">${this.button('上一页', 'library-page', 'data-delta="-1"', this.page === 0)}<span>第 ${this.page + 1} / ${pages} 页</span>${this.button('下一页', 'library-page', 'data-delta="1"', this.page + 1 >= pages)}</div>${this.data.warnings.length ? `<details class="library-warnings"><summary>${this.data.warnings.length} 条记录读取或校验异常，其余场景仍可复用</summary>${this.data.warnings.map((w) => `<p>${e(w.source)}：${e(w.problem)}</p>`).join('')}</details>` : ''}`
  }
  private paint(full = false) {
    const panel = document.getElementById('library-panel')
    if (full && panel) {
      panel.innerHTML = this.view()
      return
    }
    const result = document.getElementById('library-results')
    if (result) {
      result.innerHTML = this.results()
    }
  }
  mount() {
    if (!this.data && !this.loading) {
      void this.load().catch((error) =>
        this.host.notice(error instanceof Error ? error.message : '场景库读取失败')
      )
    }
  }
  async load() {
    if (this.loading) {
      return
    }
    this.loading = true
    this.paint()
    try {
      this.data = await this.host.api<ScenarioLibrary>('/scenario-library')
      const valid = new Set(this.data.entries.map((e) => e.key))
      for (const key of this.selected) {
        if (!valid.has(key)) {
          this.selected.delete(key)
        }
      }
      if (this.source !== 'all' && !this.data.sources.some((s) => s.key === this.source)) {
        this.source = 'all'
      }
    } finally {
      this.loading = false
      this.paint(true)
    }
  }
  filter() {
    const field = (id: string) =>
      document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    this.search = field('library-search')?.value ?? this.search
    this.stage = field('library-stage')?.value ?? this.stage
    this.source = field('library-source')?.value ?? this.source
    this.page = 0
    this.paint()
  }
  reset() {
    this.search = ''
    this.stage = 'all'
    this.source = 'all'
    this.page = 0
    this.paint(true)
  }
  select(key: string, checked: boolean) {
    if (checked && this.selected.size >= 100 && !this.selected.has(key)) {
      this.host.notice('最多选择 100 条场景')
      this.paint()
      return
    }
    if (checked) {
      this.selected.add(key)
    } else {
      this.selected.delete(key)
    }
    this.paint()
  }
  selectPage(all = false) {
    const filtered = this.filtered()
    const rows = all ? filtered : filtered.slice(this.page * 12, (this.page + 1) * 12)
    const remove = !all && rows.every((r) => this.selected.has(r.key))
    if (!remove && new Set([...this.selected, ...rows.map((r) => r.key)]).size > 100) {
      this.host.notice('合计超过 100 条，请减少选择')
      return
    }
    for (const row of rows) {
      if (remove) {
        this.selected.delete(row.key)
      } else {
        this.selected.add(row.key)
      }
    }
    this.paint()
  }
  clear() {
    this.selected.clear()
    this.paint()
  }
  changePage(delta: number) {
    this.page = Math.max(0, this.page + delta)
    this.paint()
  }
  async reuse(mode: 'replace' | 'append') {
    const result = await this.host.api<{
      fixtures: ScenarioFixture[]
      added: number
      duplicates: number
      renamed: unknown[]
    }>('/scenario-library/reuse', {
      keys: [...this.selected],
      mode,
      existing: mode === 'append' ? this.host.existing() : [],
    })
    this.host.apply(
      result.fixtures,
      `已${mode === 'append' ? '追加' : '选用'} ${result.added} 条场景${result.duplicates ? `，跳过 ${result.duplicates} 条重复路线` : ''}${result.renamed.length ? `，${result.renamed.length} 个编号已自动调整` : ''}`
    )
  }
}
