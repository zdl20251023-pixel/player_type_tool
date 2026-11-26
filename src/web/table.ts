import Decimal from 'decimal.js'
import type { PlayerConfig } from '../contracts/workbench'
import type { TableConfig, TableRun, TableHandReview } from '../contracts/table'
import { tablePotState } from '../table/pots'
import { TablePayout } from './table-payout'
import type { TableHand } from '../table/engine'
import { reviewTableHand } from '../analysis/table-history'
import { tableStatValues, type TableStat } from '../analysis/table-stats'
import { escapeHtml as e } from '../reports/comparison-view'

type Host = {
  api: <T>(path: string, body?: unknown) => Promise<T>
  players: () => PlayerConfig[]
  notice: (message: string) => void
}
type History = {
  id: string
  createdAt: string
  status: string
  mode: string
  completed: number
  hands: number | null
  requests: number
  seats: string[]
}
const statuses: Record<string, string> = {
  paused: '已暂停',
  running: '运行中',
  waiting: '等待当前请求保存',
  completed: '已完成',
  failed: '异常暂停',
  interrupted: '已中断，可恢复',
  stopped: '已结束',
}
const stages = ['翻前', '翻牌', '转牌', '河牌']
const bb = (n: number) => new Decimal(n).div(100).toFixed(2)
export class TableUI {
  private run: TableRun | null = null
  private config: TableConfig | null = null
  private history: History[] = []
  private mounted = false
  private watching = false
  private revision = ''
  private metricsRevision = ''
  private logFiles: string[] = []
  private handReviews = new Map<number, TableHandReview>()
  private loadingHands = new Set<number>()
  private handIssues = new Map<number, string>()
  private handReviewRevision = 0
  private readonly payout = new TablePayout()
  private readonly seenPayouts = new Set<string>()
  constructor(private readonly host: Host) {}
  private defaults(): TableConfig {
    const players = this.host.players()
    return {
      mode: 'watch',
      seats: Array.from({ length: 6 }, (_, i) => players[i % players.length]),
      hands: 100,
      seed: Date.now() >>> 0,
      actionDelayMs: 2000,
      handDelayMs: 5000,
      animations: true,
      autoNext: true,
      autoRebuy: true,
    }
  }
  private button(label: string, action: string, disabled = false, extra = '') {
    return `<button type="button" class="secondary" data-action="table-${action}" ${disabled ? 'disabled' : ''} ${extra}>${label}</button>`
  }
  private settings() {
    const c = (this.config ??= this.defaults())
    const field = (id: string, label: string, value: number, min: number, max: number) =>
      `<label class="field">${label}<input id="table-${id}" type="number" value="${value}" min="${min}" max="${max}"></label>`
    const check = (id: string, label: string, value: boolean) =>
      `<label class="table-checkbox"><input id="table-${id}" type="checkbox" ${value ? 'checked' : ''}>${label}</label>`
    const busy = this.run && ['running', 'waiting'].includes(this.run.status)
    return `<aside class="panel table-settings"><h2>牌桌设置</h2><p class="muted">6 人 · 初始 100BB · 0.5/1BB · 无前注、无抓注、无抽水。座位固定，位置每手轮转。</p><div class="actions">${this.button('开始新体验（真实 solver）', 'create', Boolean(busy))}${this.button('保存设置／下手生效', 'configure', !this.run)}</div><label class="field">运行模式<select id="table-mode"><option value="watch" ${c.mode === 'watch' ? 'selected' : ''}>观看模式 · 动画与行动延迟</option><option value="fast" ${c.mode === 'fast' ? 'selected' : ''}>快速模式 · 无动画、无等待</option></select></label><div class="table-seat-selectors">${c.seats.map((p, i) => `<label class="field">座位 ${i + 1}（首手 ${['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'][i]}）<select id="table-seat-${i}">${[...this.host.players(), ...(!this.host.players().some((o) => o.id === p.id) ? [p] : [])].map((o) => `<option value="${e(o.id)}" ${o.id === p.id ? 'selected' : ''}>${e(o.label)} · ${e(o.preflop)} / ${e(o.postflop)}</option>`).join('')}</select></label>`).join('')}</div>${field('hands', '目标手数（最高 1 亿手）', c.hands ?? 100, 1, 100000000)}${check('continuous', '观看时持续运行，直到手动停止', c.hands === null)}<label class="field">行动延迟（秒）<select id="table-action-delay">${[0, 1, 2, 3, 5, 10, 30, 60].map((n) => `<option value="${n}" ${c.actionDelayMs === n * 1000 ? 'selected' : ''}>${n} 秒</option>`).join('')}<option value="custom" ${![0, 1, 2, 3, 5, 10, 30, 60].includes(c.actionDelayMs / 1000) ? 'selected' : ''}>自定义</option></select></label><label class="field" id="table-custom-delay-field" ${[0, 1, 2, 3, 5, 10, 30, 60].includes(c.actionDelayMs / 1000) ? 'hidden' : ''}>自定义行动延迟（秒）<input id="table-action-custom" type="number" min="0" max="60" step="0.1" value="${c.actionDelayMs / 1000}"></label>${field('hand-delay', '每手结算后等待（秒）', c.handDelayMs / 1000, 0, 60)}${check('auto-next', '观看时自动开始下一手', c.autoNext)}${check('animations', '观看时播放牌桌动画', c.animations)}${check('rebuy', '筹码耗尽后自动补回 100BB', c.autoRebuy)}${field('seed', '随机种子（仅新体验可修改）', c.seed, 0, 4294967295)}<p class="muted">快速模式忽略所有展示等待。仍逐次请求真实 solver；耗时取决于接口与本地存盘。固定六人，无并行桌和静默随机代打。</p><p class="muted">玩家类型下手生效；节奏设置作用于后续等待。原始请求与响应先保存，再推进动作。异常默认暂停。</p></aside>`
  }
  view() {
    return `<div class="table-experience"><section id="table-live" class="panel table-view"><div id="table-status">${this.status()}</div><div id="table-surface">${this.surface()}</div></section><div id="table-settings">${this.settings()}</div><section id="table-metrics" class="panel table-statistics">${this.metrics()}</section><section class="panel table-session-history"><div class="panel-header"><h2>体验记录</h2>${this.button('刷新记录', 'history')}</div><div id="table-history">${this.historyView()}</div></section></div>`
  }
  private status() {
    const r = this.run,
      busy = r && ['running', 'waiting'].includes(r.status),
      done = r && ['completed', 'stopped'].includes(r.status)
    const remaining = r?.dueAt
      ? Math.max(0, Math.ceil((Date.parse(r.dueAt) - Date.now()) / 1000))
      : 0
    return `<div class="panel-header"><h2>${r?.config.mode === 'fast' ? '快速模拟' : '六人 AI 牌桌'} <small>${r ? statuses[r.status] : '尚未开始'}</small></h2>${r ? `<span class="chip">${r.config.mode === 'watch' ? '观看' : '快速'} · 真实 solver</span>` : ''}</div>${r ? `<div class="table-counters"><span>已完成 <b>${r.completed.toLocaleString()} / ${r.config.hands?.toLocaleString() ?? '持续'}</b></span><span>请求 <b>${r.requests}</b> · 缓存恢复 ${r.reused} · 异常 ${r.errors}</span></div><div class="actions">${this.button('继续／重试当前决策', 'resume', Boolean(busy || done))}${this.button('暂停', 'pause', !busy)}${this.button('单步行动／推进', 'step', Boolean(busy || done))}${this.button('结束体验', 'stop', Boolean(done))}${this.button('刷新状态', 'refresh')}${r.hand?.complete && r.config.mode === 'watch' ? this.button('重播本手派奖', 'payout', Boolean(busy || !r.config.animations)) : ''}<a href="/api/table-runs/${r.id}/stats.csv" class="chip">导出统计 CSV</a></div><p class="table-phase">${r.phase === 'settling' ? '正在逐池派奖' : r.phase === 'requesting' ? '正在请求当前玩家决策' : r.phase === 'next-hand' ? '结算后等待下一手' : r.phase === 'action-delay' ? '当前玩家行动展示等待' : r.hand?.complete ? '本手已结算' : '等待推进'}${remaining ? ` · 剩余约 ${remaining} 秒` : ''}${r.nextSeats ? ' · 玩家配置将在下手更新' : ''}</p>${r.problem ? `<p class="error">${e(r.problem)}</p>` : ''}` : '<p>为右侧六个座位选择玩家类型，开始后观看 AI 相互对战。</p>'}`
  }
  private card(card?: string, animate = false) {
    const suit = card ? { c: '♣', d: '♦', h: '♥', s: '♠' }[card[1]] : ''
    return `<span class="table-card ${card && ['h', 'd'].includes(card[1]) ? 'red' : ''} ${animate ? 'reveal' : ''} ${card ? '' : 'empty'}">${card ? `<b>${e(card[0])}</b><i>${suit}</i>` : '♠'}</span>`
  }
  private surface() {
    const r = this.run,
      c = r?.config ?? this.config ?? this.defaults(),
      h = r?.hand
    if (c.mode === 'fast') {
      return `<div class="table-fast"><span>HEADLESS SIMULATION</span><strong>${r?.completed.toLocaleString() ?? 0}</strong><p>已结算手牌 · 无动画 · 无行动延迟 · 无手间等待</p><p>当前第 ${h?.number ?? 1} / ${c.hands?.toLocaleString() ?? '不限'} 手；统计只纳入完整结算的手牌。目标可配置至 100,000,000 手。</p>${r?.config.hands ? `<progress max="${r.config.hands}" value="${r.completed}"></progress>` : ''}</div>`
    }
    const event = h?.events.at(-1),
      animate = c.animations
    const potState = h ? tablePotState(h) : { pots: [], total: 0, pending: null }
    return `<div class="poker-table ${h?.complete ? 'settled-table' : ''} ${animate ? 'animated' : ''} ${potState.pots.length > 2 ? 'multiple-pots' : ''}"><div class="table-felt"></div><div class="table-board"><span class="table-hand-count"><b>第 ${h?.number ?? 1} / ${c.hands?.toLocaleString() ?? '不限'} 手</b><small>${h ? stages[h.street] : '准备发牌'}</small></span><div class="table-community">${Array.from({ length: 5 }, (_, i) => this.card(h?.board[i], Boolean(animate && event?.type === 'board' && i >= (h?.board.length ?? 0) - (event.cards?.length ?? 0)))).join('')}</div>${this.potsView(h)}${h?.complete ? `<b class="table-showdown">${h.showdown ? '摊牌结算' : '其余玩家弃牌，提前结束'}</b>` : ''}</div>${Array.from(
      { length: 6 },
      (_, seat) => {
        const p = h?.players[seat],
          config = p?.config ?? c.seats[seat]
        const position = p?.position ?? ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'][seat]
        const won = Boolean(h?.complete && h.awards[seat] > 0)
        const onTurn = h?.actor === seat && !h.complete
        const actionText = p?.folded
          ? '已弃牌'
          : onTurn
            ? '待行动'
            : p?.stack === 0 && !h?.complete
              ? '全下'
              : (/^(全下|跟注|下注|加注|过牌)/.exec(p?.lastAction ?? '')?.[1] ?? '未行动')
        const actionKind = p?.folded
          ? 'fold'
          : onTurn
            ? 'pending'
            : actionText === '全下'
              ? 'allin'
              : /^(下注|加注)/.test(actionText)
                ? 'aggressive'
                : actionText === '跟注'
                  ? 'call'
                  : actionText === '过牌'
                    ? 'check'
                    : 'waiting'

        return `<article class="table-seat seat-${seat} ${p?.folded ? 'folded' : ''} ${onTurn ? 'acting' : ''} ${won ? 'winner' : ''} ${animate && event?.type === 'action' && event.seat === seat ? 'acted' : ''}" aria-label="座位 ${seat + 1} · ${e(config.label)} · ${position}"><div class="table-seat-head"><div class="table-avatar avatar-tone-${seat}"><span class="table-position" data-position="${position}">${position}</span><svg role="img" aria-label="${e(config.label)}玩家头像" viewBox="0 0 64 64"><path class="avatar-shoulders" d="M5 64c0-16 10-24 27-24s27 8 27 24Z"/><path class="avatar-neck" d="M25 34h14v13l-7 6-7-6Z"/><ellipse class="avatar-face" cx="32" cy="26" rx="13" ry="16"/><path class="avatar-hair" d="M18 27c-5-21 26-26 28-8l-1 9-5-11c-6 5-13 4-18 1l-2 11Z"/></svg><span class="table-player-action" data-action-kind="${actionKind}">${e(actionText)}</span></div><div class="table-hole">${[0, 1].map((i) => this.card(p?.cards[i], Boolean(animate && h?.actions === 0 && h.street === 0))).join('')}</div></div><div class="table-nameplate"><div class="table-player-name"><b>${e(config.label)}</b></div><strong class="table-stack">${bb(p?.stack ?? 10000)} <small>BB</small></strong></div><div class="table-front">${p?.streetContribution && !h?.complete ? `<span class="table-wager" title="本街累计投入，已计入底池"><i aria-hidden="true"></i><b>${bb(p.streetContribution)}</b> BB</span>` : ''}${won ? `<span class="table-wager table-award" title="本手获奖金额"><i aria-hidden="true"></i><b>${bb(h!.awards[seat])}</b> BB</span>` : ''}</div></article>`
      }
    ).join(
      ''
    )}${animate && event?.type === 'action' && event.seat !== null && /跟注|下注|加注|全下/.test(h!.players[event.seat].lastAction) ? `<i class="table-chip-flight flight-${event.seat}">●</i>` : ''}</div>${h ? this.potDetails(h) : ''}<p class="muted">观看界面显示所有底牌；每次 solver 请求只发送当前行动者底牌。动作按策略概率抽样，非固定选最高概率。</p>`
  }
  private potsView(hand?: TableHand | null) {
    const state = hand ? tablePotState(hand) : { pots: [], total: 0, pending: null }
    const pots = state.pots.length ? state.pots : [{ amount: 0, eligible: [], winners: [] }]
    return `<div class="table-pot-area">${pots.length > 1 || state.pending ? `<div class="table-pot-total">总底池 <b>${bb(state.total)} BB</b></div>` : ''}<div class="table-pot-grid ${pots.length === 1 ? 'single' : ''}">${pots.map((pot, index) => `<div class="table-pot-card" data-table-pot="${index}" title="${hand ? pot.eligible.map((seat) => `${hand.players[seat].position} / 座位 ${seat + 1}`).join('、') : ''}"><span>${index === 0 ? '主池' : `边池 ${index}`}</span><b>${bb(pot.amount)} <small>BB</small></b>${hand?.complete ? '<small class="table-pot-award-status">已结算</small>' : ''}</div>`).join('')}</div>${state.pending ? `<span class="table-pending-pot">${state.pending.refund ? '待退回' : '待跟注'} ${bb(state.pending.amount)} BB · ${hand!.players[state.pending.seat].position}</span>` : ''}</div>`
  }
  private potDetails(hand: TableHand) {
    const state = tablePotState(hand)
    const refunds = hand.refunds
      .map((amount, seat) => ({ amount, seat }))
      .filter((p) => p.amount > 0)
    return `<details class="table-pot-details"><summary>主池、边池与${hand.complete ? '派奖' : '争夺资格'}明细 · ${state.pots.length} 个池</summary><p>${hand.complete ? '各池独立结算；平分后的零头从庄家左侧起分配。' : '全下投入形成分池上限；本街尚未被跟注的超额筹码单列，未形成可派发边池。进行中金额与资格会随行动更新。'}</p>${state.pots.map((pot, index) => `<div><b>${index === 0 ? '主池' : `边池 ${index}`} · ${bb(pot.amount)} BB</b><span>可争夺：${pot.eligible.map((seat) => `${hand.players[seat].position} / 座位 ${seat + 1}`).join('、')}</span>${hand.complete ? `<strong>${(pot.payouts ?? []).map((p) => `${hand.players[p.seat].position} / ${e(hand.players[p.seat].config.label)} +${bb(p.amount)} BB`).join('；')}</strong>` : ''}</div>`).join('')}${refunds.length ? `<p>已退回未被跟注筹码（不计为奖金）：${refunds.map((p) => `座位 ${p.seat + 1} ${bb(p.amount)} BB`).join('；')}</p>` : ''}</details>`
  }
  replayPayout() {
    const surface = document.getElementById('table-surface')
    if (
      surface &&
      this.run?.hand?.complete &&
      this.run.config.mode === 'watch' &&
      this.run.config.animations
    ) {
      this.payout.play(surface, this.run.hand)
    }
  }
  private animateSettlement() {
    const r = this.run,
      hand = r?.hand,
      surface = document.getElementById('table-surface')
    if (
      !r ||
      !hand?.complete ||
      !surface ||
      r.config.mode !== 'watch' ||
      !r.config.animations ||
      r.settlement?.hand !== hand.number
    ) {
      return
    }
    const key = `${r.id}:${hand.number}`,
      elapsed = Date.now() - Date.parse(r.settlement.startedAt)
    if (this.seenPayouts.has(key) || elapsed < 0 || elapsed >= r.settlement.durationMs) {
      return
    }
    this.seenPayouts.add(key)
    if (this.seenPayouts.size > 32) {
      this.seenPayouts.delete(this.seenPayouts.values().next().value!)
    }
    this.payout.play(surface, hand, elapsed)
  }
  leave() {
    this.capture()
    this.payout.cancel()
  }
  private statsTable(title: string, group: Record<string, TableStat>, kind: string) {
    return `<h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>${kind}</th><th>玩家类型 · 已发牌手数</th><th>已发牌手数</th><th>翻前有效机会</th><th>VPIP</th><th>PFR</th><th>AF</th><th>WTSD</th><th>净赢 BB</th></tr></thead><tbody>${
      Object.entries(group)
        .map(([key, row]) => {
          const s = tableStatValues(row)
          const label =
            kind === '座位'
              ? `座位 ${Number(key) + 1}`
              : kind === '玩家类型'
                ? `${[...new Set(Object.values(row.players ?? {}).map((p) => p.label))].join(' / ') || key.split('|')[0]} · ${key.split('|').slice(1).join(' / ')}`
                : key
          const players =
            Object.values(row.players ?? {})
              .map(
                (p) =>
                  `<span class="table-stat-player" title="${e(`翻前 ${p.preflop} / 翻后 ${p.postflop}`)}"><b>${e(p.label)}</b> · ${p.hands} 手</span>`
              )
              .join('') || '<span class="muted">历史类型未核实</span>'
          return `<tr><td>${e(label)}</td><td class="table-stat-players">${players}</td><td>${s.hands}</td><td>${s.opportunities}</td><td>${s.vpipPercent === '—' ? '—' : s.vpipPercent + '%'}<small class="table-stat-count">${s.vpip} / ${s.opportunities} 手</small></td><td>${s.pfrPercent === '—' ? '—' : s.pfrPercent + '%'}<small class="table-stat-count">${s.pfr} / ${s.opportunities} 手</small></td><td title="(下注 ${s.bets} + 加注 ${s.raises}) / 跟注 ${s.calls}">${s.af}</td><td title="摊牌 ${s.showdowns} / 看过翻牌 ${s.sawFlop} 手">${s.wtsdPercent === '—' ? '—' : s.wtsdPercent + '%'}</td><td>${s.profitBb}</td></tr>`
        })
        .join('') || '<tr><td colspan="9">尚无已结算样本</td></tr>'
    }</tbody></table></div>`
  }
  private metrics() {
    const r = this.run
    return `<h2>已结算样本统计</h2><div class="table-stats-scope"><strong>仅当前选中的 Session · 已结算 ${r?.completed ?? 0} 手</strong><p>三种分组共用同一批已结算手牌、同一套公式；未结算手牌不计入，不合并其他 Session。</p>${r ? `<small>Session：${e(r.id)}</small>` : ''}</div>${r?.statsNotice ? `<p class="error">${e(r.statsNotice)}</p>` : ''}<p>位置（BTN / SB / BB 等）每手轮转，按位置会汇集不同固定座位的玩家；按固定座位则跟随该座位跨位置累计，因此两表同一行不应直接对应。玩家类型列来自每手结算时保存的配置，手数为各类型在该行的已发牌样本数；修改下手配置不会改写历史类型。</p><p class="muted">VPIP/PFR 分母为实际获得翻前行动机会的手数，排除大盲 walk 与被迫盲注全下；每手最多计一次，数值下方显示分子 / 分母。AF=(翻后下注+加注)/跟注。WTSD 分母为看过翻牌的手数。盈亏扣除本手初始筹码，补充筹码不算赢利。不同分组的原始计数总和一致，百分比不能直接相加或简单平均。</p>${this.statsTable('按轮转位置汇总（可能包含多种玩家类型）', r?.stats.position ?? {}, '位置')}<details id="table-detail-stats"><summary>按固定座位与玩家类型查看 · 同一 Session</summary>${this.statsTable('按固定座位汇总（跨轮转位置）', r?.stats.seat ?? {}, '座位')}${this.statsTable('按玩家类型和档位', r?.stats.type ?? {}, '玩家类型')}</details><details id="table-detail-actions" open><summary>最近行动 · 按手牌查看（最近 20 手）</summary>${this.handHistory()}</details>${
      r
        ? `<details id="table-detail-raw"><summary>最近结算与完整原始日志</summary>${r.recentHands
            .slice()
            .reverse()
            .map(
              (h) =>
                `<p>第 ${h.number} 手 · ${e(h.board.join(' '))} · 各座位净赢 ${h.profit.map(bb).join(' / ')} BB</p>`
            )
            .join(
              ''
            )}<p><a href="/api/table-runs/${r.id}/decision" target="_blank" rel="noopener">最近原始请求与响应 ↗</a></p>${this.button('查看全部日志分片', 'logs')}<div id="table-logs">${this.logFiles.map((f) => `<p><a href="/api/table-runs/${r.id}/logs/${e(f)}" target="_blank" rel="noopener">${e(f)} ↗</a></p>`).join('')}</div></details>`
        : ''
    }`
  }
  private handHistory() {
    const r = this.run
    if (!r?.hand) {
      return '<p class="muted">开始体验后，这里按手牌编号展示记录；展开查看六个位置底牌与行动过程。</p>'
    }
    const hands = new Map(r.recentHands.map((h) => [h.number, { ...h, complete: true }]))
    hands.set(r.hand.number, {
      number: r.hand.number,
      board: r.hand.board,
      profit: [],
      winners: [],
      complete: r.hand.complete,
    })
    return `<div class="table-hand-list">${[...hands.values()]
      .sort((a, b) => b.number - a.number)
      .slice(0, 20)
      .map((item) => {
        const review =
          item.number === r.hand!.number
            ? reviewTableHand(r.hand!)
            : this.handReviews.get(item.number)
        const status = review?.complete ?? item.complete
        return `<details class="table-hand" id="table-hand-${item.number}" data-table-hand="${item.number}"><summary><b>第 ${item.number} 手</b><span class="table-hand-state ${status ? '' : 'in-progress'}">${status ? '已结算' : '进行中'}</span><span class="table-hand-board">${item.board.length ? item.board.map((c) => this.card(c)).join('') : '翻前'}</span><small>${review ? `${review.events.filter((v) => v.type === 'action').length} 次行动` : '查看底牌与行动'} <span aria-hidden="true">⌄</span></small></summary><div class="table-hand-content">${review ? this.handContent(review) : `<p class="muted">${this.handIssues.has(item.number) ? e(this.handIssues.get(item.number)) : this.loadingHands.has(item.number) ? '正在读取本机手牌记录…' : '展开后从本机日志读取详情，不发送 solver 请求。'}</p>${this.handIssues.has(item.number) ? this.button('重新读取本手', 'hand', false, `data-number="${item.number}"`) : ''}`}</div></details>`
      })
      .join('')}</div>`
  }
  private handContent(hand: TableHandReview) {
    let street = 0
    return `<h4>六个位置的底牌与玩家类型</h4><div class="table-hand-players">${hand.players.map((p) => `<div class="table-hand-player"><div><b>${e(p.position)}</b><span>座位 ${p.seat + 1}${p.seat === hand.button ? ' · D' : ''}</span></div><strong>${e(p.label)}</strong><div class="table-review-cards">${p.cards.map((c) => this.card(c)).join('')}</div><small>${p.folded ? '已弃牌' : hand.complete ? '进入结算' : '仍在本手'}${hand.complete ? ` · 净赢 ${bb(hand.profit[p.seat])} BB` : ''}</small></div>`).join('')}</div><h4>行动过程 <small>按实际发生顺序</small></h4><ol class="table-hand-events">${hand.events
      .map((v) => {
        if (v.type === 'board') {
          street++
        }
        const player = v.seat === null ? null : hand.players.find((p) => p.seat === v.seat)
        return `<li class="event-${v.type}"><span class="table-event-street">${stages[street] ?? '结算'}</span><div><b>${e(v.text)}</b>${player ? `<span class="table-event-player">座位 ${player.seat + 1} · ${e(player.position)} · ${player.cards.map((c) => this.card(c)).join('')}</span>` : ''}</div></li>`
      })
      .join('')}</ol>`
  }
  async loadHand(number: number) {
    const r = this.run
    if (
      !r ||
      r.hand?.number === number ||
      this.handReviews.has(number) ||
      this.loadingHands.has(number)
    ) {
      return
    }
    const id = r.id
    this.loadingHands.add(number)
    this.handIssues.delete(number)
    this.handReviewRevision++
    this.paint()
    try {
      const hand = await this.host.api<TableHandReview>(`/table-runs/${id}/hands/${number}`)
      if (this.run?.id === id) {
        this.handReviews.set(number, hand)
      }
    } catch (error) {
      if (this.run?.id === id) {
        this.handIssues.set(number, error instanceof Error ? error.message : '读取本手失败')
      }
    } finally {
      if (this.run?.id === id) {
        this.loadingHands.delete(number)
        this.handReviewRevision++
        this.paint()
      }
    }
  }
  private historyView() {
    return (
      this.history
        .map(
          (h) =>
            `<p>${this.button(`${new Date(h.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · ${h.mode === 'watch' ? '观看' : '快速'} · ${h.completed}/${h.hands ?? '持续'} 手 · ${statuses[h.status]}`, 'open', false, `data-id="${h.id}"`)}</p>`
        )
        .join('') || '<p class="muted">暂无已保存体验，可刷新或开始新体验。</p>'
    )
  }
  capture() {
    const get = (id: string) =>
      document.getElementById(`table-${id}`) as HTMLInputElement | HTMLSelectElement | null
    if (!get('mode')) {
      return
    }
    const old = this.config ?? this.defaults()
    const configs = this.host.players()
    this.config = {
      mode: get('mode')!.value as TableConfig['mode'],
      seats: Array.from(
        { length: 6 },
        (_, i) => configs.find((p) => p.id === get(`seat-${i}`)?.value) ?? old.seats[i]
      ),
      hands:
        get('mode')!.value === 'watch' && (get('continuous') as HTMLInputElement).checked
          ? null
          : Number(get('hands')!.value),
      seed: Number(get('seed')!.value),
      actionDelayMs: new Decimal(
        get('action-delay')!.value === 'custom'
          ? get('action-custom')!.value
          : get('action-delay')!.value
      )
        .mul(1000)
        .toNumber(),
      handDelayMs: Number(get('hand-delay')!.value) * 1000,
      animations: (get('animations') as HTMLInputElement).checked,
      autoNext: (get('auto-next') as HTMLInputElement).checked,
      autoRebuy: (get('rebuy') as HTMLInputElement).checked,
    }
  }
  changed() {
    this.capture()
    const custom = document.getElementById('table-custom-delay-field')
    if (custom) {
      custom.hidden =
        (document.getElementById('table-action-delay') as HTMLSelectElement).value !== 'custom'
    }
    if (!this.run) {
      this.paint()
    }
  }
  private paint(settings = false) {
    const status = document.getElementById('table-status'),
      surface = document.getElementById('table-surface'),
      metrics = document.getElementById('table-metrics')
    if (status) {
      status.innerHTML = this.status()
    }
    const h = this.run?.hand
    const revision = JSON.stringify([
      this.run?.id,
      h?.number,
      h?.actions,
      h?.street,
      h?.complete,
      h?.complete ? 'settled' : this.run?.status,
      (this.run?.config ?? this.config)?.hands,
      this.run?.config.mode ?? this.config?.mode,
      this.run?.config.animations ?? this.config?.animations,
    ])
    if (surface && revision !== this.revision) {
      const potDetailsOpen =
        surface.querySelector<HTMLDetailsElement>('.table-pot-details')?.open ?? false
      this.payout.cancel()
      surface.innerHTML = this.surface()
      const potDetails = surface.querySelector<HTMLDetailsElement>('.table-pot-details')
      if (potDetails) {
        potDetails.open = potDetailsOpen
      }
      this.revision = revision
    }
    this.animateSettlement()
    const metricsRevision = JSON.stringify([
      this.run?.id,
      this.run?.completed,
      this.run?.hand?.number,
      this.run?.hand?.actions,
      this.run?.hand?.street,
      this.run?.hand?.complete,
      this.handReviewRevision,
      this.logFiles,
      this.run?.statsNotice,
    ])
    if (metrics && metricsRevision !== this.metricsRevision) {
      const logScroll = metrics.querySelector('.table-hand-list')?.scrollTop ?? 0
      const open = new Map(
        Array.from(metrics.querySelectorAll('details')).map((d) => [d.id, d.open])
      )
      metrics.innerHTML = this.metrics()
      Array.from(metrics.querySelectorAll('details')).forEach((d) => {
        if (open.has(d.id)) {
          d.open = open.get(d.id)!
        }
      })
      const log = metrics.querySelector('.table-hand-list')
      if (log) {
        log.scrollTop = logScroll
      }
      this.metricsRevision = metricsRevision
    }
    if (settings && document.getElementById('table-settings')) {
      document.getElementById('table-settings')!.innerHTML = this.settings()
    }
    const create = document.querySelector<HTMLButtonElement>('[data-action="table-create"]')
    if (create) {
      create.disabled = Boolean(this.run && ['running', 'waiting'].includes(this.run.status))
    }
    const configure = document.querySelector<HTMLButtonElement>('[data-action="table-configure"]')
    if (configure) {
      configure.disabled = !this.run
    }
  }
  mount() {
    this.revision = ''
    this.metricsRevision = ''
    if (!this.mounted) {
      this.mounted = true
      const id = localStorage.getItem('strategy-lab-table')
      if (id && /^[A-Za-z0-9-]+$/.test(id)) {
        void this.open(id).catch((error) =>
          this.host.notice(error instanceof Error ? error.message : '读取牌桌失败')
        )
      }
      void this.loadHistory().catch(() => undefined)
    } else if (this.run) {
      void this.refresh().catch(() => undefined)
    }
  }
  async create() {
    if (this.run && ['running', 'waiting'].includes(this.run.status)) {
      throw new Error('已有运行中的牌桌，请先暂停或结束')
    }
    this.capture()
    this.logFiles = []
    this.handReviews.clear()
    this.loadingHands.clear()
    this.handIssues.clear()
    this.handReviewRevision++
    this.run = await this.host.api<TableRun>('/table-runs', this.config)
    localStorage.setItem('strategy-lab-table', this.run.id)
    this.paint(true)
    this.watch()
  }
  async prepareRole(player: PlayerConfig, seat: number) {
    if (!Number.isInteger(seat) || seat < 0 || seat > 5) {
      throw new Error('请选择座位 1–6')
    }
    const collision = this.host.players().find((p) => p.id === player.id)
    if (collision && JSON.stringify(collision) !== JSON.stringify(player)) {
      throw new Error('该角色 ID 已被其他玩家配置使用，请复制为新的玩家 ID 后再选择')
    }
    // Restore the selected local table before editing, avoiding an asynchronous mount overwrite.
    if (!this.mounted) {
      this.mounted = true
      const id = localStorage.getItem('strategy-lab-table')
      if (id && /^[A-Za-z0-9-]+$/.test(id)) {
        try {
          await this.open(id)
        } catch {
          this.host.notice('上次牌桌无法载入，角色将填入新体验设置')
        }
      }
      await this.loadHistory()
    }
    this.capture()
    this.config ??= this.defaults()
    this.config.seats[seat] = structuredClone(player)
  }
  async control(action: string) {
    if (!this.run) {
      return
    }
    this.run = await this.host.api<TableRun>(`/table-runs/${this.run.id}/${action}`, {})
    this.paint()
    this.watch()
  }
  async configure() {
    this.capture()
    if (this.run) {
      this.run = await this.host.api<TableRun>(`/table-runs/${this.run.id}/configure`, this.config)
      this.paint()
      this.host.notice('设置已保存；玩家档位将在下一手生效')
    }
  }
  async open(id: string) {
    this.payout.cancel()
    this.logFiles = []
    this.handReviews.clear()
    this.loadingHands.clear()
    this.handIssues.clear()
    this.handReviewRevision++
    this.run = await this.host.api<TableRun>(`/table-runs/${id}`)
    this.config = structuredClone(this.run.config)
    localStorage.setItem('strategy-lab-table', id)
    this.paint(true)
    this.watch()
  }
  async refresh() {
    if (this.run) {
      this.run = await this.host.api<TableRun>(`/table-runs/${this.run.id}`)
      this.paint()
      this.watch()
    }
  }
  async loadHistory() {
    this.history = await this.host.api<History[]>('/table-runs')
    const el = document.getElementById('table-history')
    if (el) {
      el.innerHTML = this.historyView()
    }
  }
  async logs() {
    if (!this.run) {
      return
    }
    const id = this.run.id,
      files = await this.host.api<string[]>(`/table-runs/${id}/logs`)
    this.logFiles = files
    const el = document.getElementById('table-logs')
    if (el) {
      el.innerHTML =
        files
          .map(
            (f) =>
              `<p><a href="/api/table-runs/${id}/logs/${e(f)}" target="_blank" rel="noopener">${e(f)} ↗</a></p>`
          )
          .join('') || '<p>尚无已保存的请求日志</p>'
    }
  }
  private watch() {
    if (this.watching || !this.run || !['running', 'waiting'].includes(this.run.status)) {
      return
    }
    this.watching = true
    const id = this.run.id
    void (async () => {
      while (
        this.run?.id === id &&
        this.run &&
        ['running', 'waiting'].includes(this.run.status) &&
        document.getElementById('table-live')
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.run!.config.mode === 'watch' ? 250 : 1000)
        )
        const next = await this.host.api<TableRun>(`/table-runs/${id}`)
        if (this.run?.id !== id) {
          break
        }
        this.run = next
        this.paint()
      }
    })()
      .catch((error) =>
        this.host.notice(error instanceof Error ? error.message : '状态读取失败，可刷新恢复')
      )
      .finally(() => {
        this.watching = false
        if (this.run?.id !== id) {
          this.watch()
        }
      })
  }
}
