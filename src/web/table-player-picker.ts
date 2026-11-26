import type { PlayerConfig } from '../contracts/workbench'
import { builtinRoles, roleToPlayer, looseness, activity, postflopStyles } from '../profiles/roles'
import { escapeHtml as e } from '../reports/comparison-view'
import { sameTablePlayer, tablePlayerMetrics, tablePlayerOrigin } from './table-players'

type Candidate = { key: string; player: PlayerConfig; source: string; levels?: number[] }
type Host = {
  players: () => PlayerConfig[]
  current: (seat: number) => PlayerConfig
  context: () => string
  apply: (seat: number, player: PlayerConfig) => void
}
const button = (label: string, action: string, extra = '') =>
  `<button type="button" class="secondary" data-action="seat-picker-${action}" ${extra}>${label}</button>`

export class TablePlayerPicker {
  private seat = 0
  private source = 'builtin'
  private query = ''
  private levels = ['', '', '']
  private page = 0
  private selected: Candidate | null = null
  private detail: Candidate | null = null
  private readonlyMode = false
  private context = ''
  constructor(private readonly host: Host) {}
  private dialog() {
    return document.getElementById('table-player-dialog') as HTMLDialogElement | null
  }
  open(seat: number, readonlyMode = false) {
    if (!Number.isInteger(seat) || seat < 0 || seat > 5) {
      throw new Error('请选择座位 1–6')
    }
    this.seat = seat
    this.context = this.host.context()
    this.source = 'builtin'
    this.query = ''
    this.levels = ['', '', '']
    this.page = 0
    this.readonlyMode = readonlyMode
    const p = structuredClone(this.host.current(seat))
    this.selected = { key: 'current', player: p, source: '当前座位快照' }
    this.detail = readonlyMode ? this.selected : null
    this.render()
    this.dialog()!.showModal()
  }
  close() {
    this.dialog()?.close()
    this.selected = null
    this.detail = null
  }
  reportError(message: string) {
    const target = document.getElementById('seat-picker-error')
    if (this.dialog()?.open && target) {
      target.textContent = message
      target.hidden = !message
    }
  }
  private candidates(): Candidate[] {
    if (this.source === 'builtin') {
      return builtinRoles.map((r) => ({
        key: `builtin:${r.id}`,
        player: roleToPlayer(r),
        source: `内置角色 · ${r.id}${r.alias ? ` · ${r.alias}` : ''}`,
        levels: [r.l, r.a, r.f],
      }))
    }
    const rows = this.host
      .players()
      .map((p) => ({ key: `personal:${p.id}`, player: structuredClone(p), source: '我的玩家配置' }))
    const current = this.host.current(this.seat)
    if (!rows.some((r) => sameTablePlayer(r.player, current))) {
      rows.unshift({
        key: 'current',
        player: structuredClone(current),
        source: '当前座位快照（不在个人配置库中）',
      })
    }
    return rows
  }
  private filtered() {
    return this.candidates().filter(
      (r) =>
        (!this.query ||
          `${r.player.label} ${r.player.id} ${r.player.description} ${r.player.preflop} ${r.player.postflop} ${r.source}`
            .toLowerCase()
            .includes(this.query.toLowerCase())) &&
        (this.source !== 'builtin' ||
          this.levels.every((v, i) => !v || r.levels?.[i] === Number(v)))
    )
  }
  private help() {
    return '<div class="actions"><button type="button" class="secondary" data-action="role-standards">划分标准</button><button type="button" class="secondary" data-action="show-metrics-help">四项指标说明</button></div>'
  }
  private render() {
    const dialog = this.dialog()!
    const select = (i: number, label: string, values: readonly string[]) =>
      `<label class="field">${label}<select id="seat-picker-level-${i}"><option value="">全部</option>${values.map((v, n) => `<option value="${n + 1}" ${this.levels[i] === String(n + 1) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`
    dialog.innerHTML = `<div class="seat-picker-head"><div><small>固定座位 · 首手 ${['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'][this.seat]}</small><h2 id="table-player-dialog-title">${this.readonlyMode ? '座位玩家参数' : '选择玩家'} · 座位 ${this.seat + 1}</h2></div>${button('关闭', 'close', 'aria-label="关闭玩家选择"')}</div><div class="seat-picker-body"><p id="seat-picker-error" class="error" role="alert" hidden></p>${this.detail ? this.details() : `<div class="seat-picker-toolbar"><div class="tabbar">${button('内置角色库 · 75', 'source', `data-source="builtin" aria-pressed="${this.source === 'builtin'}"`)}${button('我的玩家配置', 'source', `data-source="personal" aria-pressed="${this.source === 'personal'}"`)}${button('定位 GTO', 'gto')}</div>${this.help()}</div><div class="seat-picker-filters"><label class="field">搜索玩家<input id="seat-picker-search" placeholder="名称、编号或 profileName" value="${e(this.query)}"></label>${this.source === 'builtin' ? select(0, '翻前松紧', looseness) + select(1, '翻前主动程度', activity) + select(2, '翻后风格', postflopStyles) : ''}</div><div id="seat-picker-results">${this.results()}</div>`}</div><div id="seat-picker-footer" class="seat-picker-footer">${this.footer()}</div>`
  }
  private results() {
    const rows = this.filtered()
    this.page = Math.min(this.page, Math.max(0, Math.ceil(rows.length / 12) - 1))
    return `<p class="muted">${rows.length} 个可选配置 · 档位参考数据，不是完整角色实测 HUD。</p><div class="seat-picker-grid">${
      rows
        .slice(this.page * 12, this.page * 12 + 12)
        .map(
          (r) =>
            `<article class="seat-picker-card ${this.selected && sameTablePlayer(this.selected.player, r.player) ? 'selected' : ''}"><label class="seat-picker-choice"><input type="radio" name="seat-player-choice" data-seat-picker-key="${e(r.key)}" ${this.selected && sameTablePlayer(this.selected.player, r.player) ? 'checked' : ''}><strong>${e(r.player.label)}</strong></label><small>${e(r.source)}</small><code>翻前 ${e(r.player.preflop)}<br>翻后 ${e(r.player.postflop)}</code>${tablePlayerMetrics(r.player)}${button('查看详情', 'detail', `data-key="${e(r.key)}"`)}</article>`
        )
        .join('') || '<p class="empty">没有匹配的玩家，请调整筛选条件。</p>'
    }</div><div class="seat-picker-pagination">${button('上一页', 'page', `data-delta="-1" ${!this.page ? 'disabled' : ''}`)}<span>${this.page + 1} / ${Math.max(1, Math.ceil(rows.length / 12))}</span>${button('下一页', 'page', `data-delta="1" ${(this.page + 1) * 12 >= rows.length ? 'disabled' : ''}`)}</div>`
  }
  private details() {
    const r = this.detail!,
      p = r.player
    const role = builtinRoles.find(
      (v) =>
        r.key === `builtin:${v.id}` ||
        (p.sourceRole?.id === v.id && sameTablePlayer(p, roleToPlayer(v)))
    )
    return `${this.readonlyMode ? '' : button('返回玩家列表', 'back')}<h3>${e(p.label)}</h3><p>${e(r.source)} · ${e(tablePlayerOrigin(p))}</p><p class="seat-picker-description">${e(p.description)}</p><p class="seat-picker-reference">以下为翻前、翻后档位各自的参考值，不代表该组合已验证的实测统计。</p>${tablePlayerMetrics(p)}<p><b>翻前 profileName</b><code class="seat-picker-profile">${e(p.preflop)}</code></p><p><b>翻后 profileName</b><code class="seat-picker-profile">${e(p.postflop)}</code></p>${role ? `<h3>选择依据</h3><p>翻前：${e(role.reason)}</p><p>翻后：${e(role.postReason)}</p>` : ''}${this.help()}${this.readonlyMode ? '' : button('选择此玩家', 'choose-detail')}`
  }
  private footer() {
    if (this.readonlyMode) {
      return `<span>查看参数不会更改配置。</span>${button('关闭', 'close')}`
    }
    return `<div><strong>座位 ${this.seat + 1}：${e(this.host.current(this.seat).label)} → ${e(this.selected?.player.label ?? '请选择')}</strong><small>确认后更新座位设置；已有牌桌需再保存，下手生效。</small></div><div class="actions">${button('取消', 'close')}${button(`应用到座位 ${this.seat + 1}`, 'apply', !this.selected ? 'disabled' : '')}</div>`
  }
  private paintResults() {
    const rows = document.getElementById('seat-picker-results')
    if (rows) {
      rows.innerHTML = this.results()
    }
    const footer = document.getElementById('seat-picker-footer')
    if (footer) {
      footer.innerHTML = this.footer()
    }
  }
  change(field: HTMLInputElement | HTMLSelectElement) {
    if (!this.dialog()?.open) {
      return
    }
    if (field.dataset.seatPickerKey) {
      const row = this.candidates().find((r) => r.key === field.dataset.seatPickerKey)
      if (row) {
        this.selected = structuredClone(row)
      }
    } else if (field.id === 'seat-picker-search') {
      this.query = field.value
      this.page = 0
    } else if (field.id.startsWith('seat-picker-level-')) {
      this.levels[Number(field.id.at(-1))] = field.value
      this.page = 0
    }
    this.paintResults()
  }
  click(action: string, target: HTMLButtonElement) {
    if (!this.dialog()?.open) {
      return
    }
    if (action === 'seat-picker-close') {
      this.close()
      return
    }
    if (this.context !== this.host.context()) {
      throw new Error('牌桌已切换，请关闭弹窗后重新选择')
    }
    if (action === 'seat-picker-source' || action === 'seat-picker-gto') {
      this.source = action === 'seat-picker-gto' ? 'builtin' : target.dataset.source!
      this.query = action === 'seat-picker-gto' ? 'GTO 基线' : ''
      this.levels = ['', '', '']
      this.page = 0
      this.detail = null
      this.render()
    } else if (action === 'seat-picker-page') {
      this.page = Math.max(0, this.page + Number(target.dataset.delta))
      this.paintResults()
    } else if (action === 'seat-picker-detail') {
      this.detail = this.candidates().find((r) => r.key === target.dataset.key) ?? null
      this.render()
    } else if (action === 'seat-picker-back') {
      this.detail = null
      this.render()
    } else if (action === 'seat-picker-choose-detail') {
      this.selected = structuredClone(this.detail)
      this.detail = null
      this.render()
    } else if (action === 'seat-picker-apply' && this.selected) {
      this.host.apply(this.seat, structuredClone(this.selected.player))
      this.close()
    }
  }
}
