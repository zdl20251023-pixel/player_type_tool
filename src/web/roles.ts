import Decimal from 'decimal.js'
import {
  builtinRoles,
  roleById,
  roleTargets,
  roleBoundaries,
  roleRatio,
  rolePercent,
  looseness,
  activity,
  postflopStyles,
  ROLE_VERSION,
  type BuiltinRole,
} from '../profiles/roles'
import { escapeHtml as e } from '../reports/comparison-view'

type Host = {
  notice: (message: string) => void
  copy: (role: BuiltinRole) => void
  experiment: (role: BuiltinRole) => void
  table: (role: BuiltinRole, seat: number) => Promise<void>
}
const button = (label: string, action: string, extra = '') =>
  `<button class="secondary" data-action="role-${action}" ${extra}>${label}</button>`
const attrs = (role: BuiltinRole) => `data-role="${role.id}"`
const metrics = (role: BuiltinRole) => [
  rolePercent(role.preflop.vpip),
  rolePercent(role.preflop.pfr),
  rolePercent(roleRatio(role.preflop)),
  new Decimal(role.postflop.af).toFixed(4),
  rolePercent(role.postflop.wtsd),
]
const metricNames = ['VPIP', 'PFR', 'PFR/VPIP', 'AF', 'WTSD']
function avatar(role: BuiltinRole) {
  const colors = ['#526389', '#376b8b', '#087867', '#a16a20', '#a4434e']
  return `<svg class="role-avatar" viewBox="0 0 64 64" role="img" aria-label="${e(role.name)}角色头像"><circle cx="32" cy="32" r="30" fill="${colors[role.l - 1]}"/><circle cx="32" cy="25" r="10" fill="#f5ddc4"/><path d="M14 53c1-13 9-18 18-18s17 5 18 18" fill="#e7f0f6"/><path d="M22 23c-2-15 23-15 20 1-4-1-8-6-10-7-2 4-5 5-10 6" fill="#243647"/><text x="32" y="59" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">${role.l} · ${role.a} · ${role.f}</text></svg>`
}

export class RoleLibraryUI {
  private query = ''
  private l = ''
  private a = ''
  private f = ''
  private mode = 'cards'
  private sort = 'id'
  private compare = new Set<string>()
  constructor(private readonly host: Host) {}
  view() {
    const select = (id: string, label: string, labels: readonly string[], selected: string) =>
      `<label class="field">${label}<select id="role-${id}"><option value="">全部</option>${labels.map((label, i) => `<option value="${i + 1}" ${selected === String(i + 1) ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`
    return `<section class="panel role-intro"><div><span class="role-eyebrow">BUILT-IN / 75 ARCHETYPES</span><h2>找到你想观察的玩家</h2><p>5 档翻前松紧 × 3 档翻前主动程度 × 5 档翻后风格。先看参数，再加入实验或安排牌桌座位。</p></div><div class="actions">${button('划分标准', 'standards', 'aria-haspopup="dialog"')}${button('定位 GTO', 'gto')}${button('查看原松弱', 'detail', 'data-role="L4-A1-F1"')}${button('查看原紧凶', 'detail', 'data-role="L1-A3-F5"')}</div><p class="role-source">方案 ${ROLE_VERSION} · catalog 2-0 / 4-6p · 执行上下文：6 人 / 100BB / 无前注、无抓注</p><p class="role-reference">以下是翻前、翻后各自的档位参考数据，75 种完整组合尚未全部实测验证。实际牌局 HUD 需另看对应 Session 和样本量。</p></section><section class="panel" id="role-browser"><div class="role-filters"><label class="field">搜索角色<input id="role-search" value="${e(this.query)}" placeholder="编号、名称、profileName…"></label>${select('l', '翻前松紧', looseness, this.l)}${select('a', '翻前主动程度', activity, this.a)}${select('f', '翻后风格', postflopStyles, this.f)}<label class="field">排序<select id="role-sort">${[
      ['id', '组合编号'],
      ['vpip', 'VPIP 从低到高'],
      ['pfr', 'PFR 从低到高'],
      ['ratio', 'PFR/VPIP 从低到高'],
      ['af', 'AF 从低到高'],
      ['wtsd', 'WTSD 从低到高'],
    ]
      .map(
        ([value, label]) =>
          `<option value="${value}" ${this.sort === value ? 'selected' : ''}>${label}</option>`
      )
      .join('')}</select></label></div><div class="role-viewbar"><div class="tabbar">${[
      ['cards', '角色卡片'],
      ['table', '完整参数表'],
      ['matrix', '组合矩阵'],
    ]
      .map(([value, label]) =>
        button(label, 'view', `data-mode="${value}" aria-pressed="${this.mode === value}"`)
      )
      .join(
        ''
      )}</div>${button('重置筛选', 'reset')}${button('查看对比', 'jump')}<span id="role-compare-count" class="muted">已选 ${this.compare.size}/4</span><span id="role-count" class="muted"></span></div><div id="role-results">${this.results()}</div></section><section id="role-comparison" class="panel">${this.comparison()}</section>`
  }
  private filtered() {
    return builtinRoles
      .filter(
        (r) =>
          (!this.l || r.l === Number(this.l)) &&
          (!this.a || r.a === Number(this.a)) &&
          (!this.f || r.f === Number(this.f)) &&
          `${r.id} ${r.name} ${r.alias} ${r.preflop.name} ${r.postflop.name}`
            .toLowerCase()
            .includes(this.query.toLowerCase())
      )
      .slice()
      .sort((x, y) => {
        const value = (r: BuiltinRole) =>
          this.sort === 'vpip'
            ? new Decimal(r.preflop.vpip)
            : this.sort === 'pfr'
              ? new Decimal(r.preflop.pfr)
              : this.sort === 'ratio'
                ? roleRatio(r.preflop)
                : this.sort === 'af'
                  ? new Decimal(r.postflop.af)
                  : new Decimal(r.postflop.wtsd)
        return this.sort === 'id' ? 0 : value(x).comparedTo(value(y))
      })
  }
  private selection(role: BuiltinRole) {
    return `<label class="role-compare-check"><input type="checkbox" data-role-compare="${role.id}" ${this.compare.has(role.id) ? 'checked' : ''}>加入对比</label>`
  }
  private card(role: BuiltinRole) {
    return `<article class="role-card"><div class="role-card-head">${avatar(role)}<div><small>${role.id}${role.alias ? ' · ' + role.alias : ''}</small><h3>${e(role.name)}</h3></div></div><div class="role-metrics">${metrics(
      role
    )
      .map((value, i) => `<div><span>${metricNames[i]}</span><b>${value}</b></div>`)
      .join(
        ''
      )}</div><p class="role-profiles">翻前 <code>${role.preflop.name}</code><br>翻后 <code>${role.postflop.name}</code></p><div class="role-card-foot">${this.selection(role)}${button('详情与使用 →', 'detail', attrs(role))}</div></article>`
  }
  private results() {
    const rows = this.filtered()
    if (!rows.length) {
      return '<p class="empty">没有匹配的角色，请调整筛选条件。</p>'
    }
    if (this.mode === 'matrix') {
      const f = Number(this.f || 3)
      return `<p class="role-reference">当前展示翻后「${postflopStyles[f - 1]}」的 15 格。使用上方“翻后风格”切换其余组合；松紧和主动程度在各自分区内取相对代表。</p><div class="table-wrap"><table class="role-matrix"><thead><tr><th>翻前松紧</th>${activity.map((a) => `<th>翻前${a}</th>`).join('')}</tr></thead><tbody>${looseness
        .map(
          (label, l) =>
            `<tr><th>${label}</th>${activity
              .map((_, a) => {
                const role = rows.find((r) => r.l === l + 1 && r.a === a + 1 && r.f === f)
                return `<td>${role ? this.card(role) : '<span class="muted">已被筛选隐藏</span>'}</td>`
              })
              .join('')}</tr>`
        )
        .join('')}</tbody></table></div>`
    }
    if (this.mode === 'table') {
      return `<div class="table-wrap"><table class="role-data-table"><thead><tr><th>角色 / 对比</th><th>翻前松紧</th><th>翻前主动</th><th>翻后风格</th>${metricNames.map((n) => `<th>${n}</th>`).join('')}<th>翻前 profileName</th><th>翻后 profileName</th><th>详情</th></tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr><td><strong>${r.id}</strong>${this.selection(r)}</td><td>${looseness[r.l - 1]}</td><td>${activity[r.a - 1]}</td><td>${postflopStyles[r.f - 1]}</td>${metrics(
              r
            )
              .map((v) => `<td>${v}</td>`)
              .join(
                ''
              )}<td><code>${r.preflop.name}</code></td><td><code>${r.postflop.name}</code></td><td>${button('查看', 'detail', attrs(r))}</td></tr>`
        )
        .join('')}</tbody></table></div>`
    }
    return `<div class="role-card-grid">${rows.map((r) => this.card(r)).join('')}</div>`
  }
  private comparison() {
    const roles = [...this.compare].map(roleById)
    if (!roles.length) {
      return '<h2>角色对比 <small>最多 4 个</small></h2><p>勾选角色卡片或参数表中的“加入对比”，并排查看档位参考数据与参数差异。</p>'
    }
    const rows = [...metricNames, '翻前 profileName', '翻后 profileName']
    return `<div class="panel-header"><h2>角色对比 <small>${roles.length} / 4</small></h2>${button('清空对比', 'clear')}</div><p>不同值所在行高亮；保留原始档位精度。不代表完整组合的实测差异。</p><div class="table-wrap"><table><thead><tr><th>档位参考参数</th>${roles.map((r) => `<th>${r.id}<br>${e(r.name)}<br>${button('移除', 'remove', attrs(r))}</th>`).join('')}</tr></thead><tbody>${rows
      .map((name, i) => {
        const values = roles.map((r) => [...metrics(r), r.preflop.name, r.postflop.name][i])
        return `<tr class="${new Set(values).size > 1 ? 'role-difference' : ''}"><th>${name}</th>${values.map((v) => `<td>${v}</td>`).join('')}</tr>`
      })
      .join('')}</tbody></table></div>`
  }
  private paint() {
    const result = document.getElementById('role-results')
    if (result) {
      result.innerHTML = this.results()
    }
    const count = document.getElementById('role-count')
    if (count) {
      count.textContent = `显示 ${this.mode === 'matrix' ? this.filtered().filter((r) => r.f === Number(this.f || 3)).length : this.filtered().length} / 75 个角色`
    }
    const comparison = document.getElementById('role-comparison')
    if (comparison) {
      comparison.innerHTML = this.comparison()
    }
    const compareCount = document.getElementById('role-compare-count')
    if (compareCount) {
      compareCount.textContent = `已选 ${this.compare.size}/4`
    }
  }
  mount() {
    this.paint()
  }
  change(input: HTMLInputElement | HTMLSelectElement) {
    if (input.dataset.roleCompare) {
      if ((input as HTMLInputElement).checked) {
        if (this.compare.size >= 4) {
          ;(input as HTMLInputElement).checked = false
          this.host.notice('最多同时对比 4 个角色')
          return
        }
        this.compare.add(input.dataset.roleCompare)
      } else {
        this.compare.delete(input.dataset.roleCompare)
      }
    } else if (input.id === 'role-search') {
      this.query = input.value
    } else if (input.id === 'role-l') {
      this.l = input.value
    } else if (input.id === 'role-a') {
      this.a = input.value
    } else if (input.id === 'role-f') {
      this.f = input.value
    } else if (input.id === 'role-sort') {
      this.sort = input.value
    }
    this.paint()
  }
  private dialog(title: string, content: string) {
    const dialog = document.getElementById('role-dialog') as HTMLDialogElement
    dialog.innerHTML = `<div class="dialog-head"><h2 id="role-dialog-title">${title}</h2><form method="dialog"><button class="secondary" autofocus>关闭</button></form></div>${content}`
    if (!dialog.open) {
      dialog.showModal()
    }
    dialog.scrollTop = 0
  }
  close() {
    ;(document.getElementById('role-dialog') as HTMLDialogElement).close()
  }
  private standards() {
    this.dialog(
      '角色划分标准',
      `<p>版本 ${ROLE_VERSION} · 数据取自本仓库 catalog 的 2-0 / 4-6p 分组。这是本工具的代表档位方案，不是扑克通用分类标准。</p><div class="role-reference">档位参考数据 ≠ 完整角色实测 HUD；名称中的数字不替代 catalog 数值。75 种配置唯一，不等于已经验证 75 种可区分行为。</div><h3>一、翻前松紧：VPIP 五档</h3><p>以最低 VPIP、GTO、最高 VPIP 为锚点，两侧采用算术中点；相邻目标中点形成候选分区。</p><div class="table-wrap"><table><thead><tr><th>档位</th><th>VPIP 目标</th><th>候选分区（左闭右开，最后一档含上限）</th></tr></thead><tbody>${looseness.map((l, i) => `<tr><td>${l}</td><td>${rolePercent(roleTargets[i], 3)}</td><td>${rolePercent(roleBoundaries[i], 4)} ～ ${rolePercent(roleBoundaries[i + 1], 4)}</td></tr>`).join('')}</tbody></table></div><h3>二、翻前主动：PFR/VPIP 三档</h3><p>先归入松紧分区，再选择被动、中间、主动代表。保留全局最低比值 5.07%、最高比值 95.38% 与 GTO 比值 53.04%。每行被动 &lt; 中间 &lt; 主动，但不同松紧行的“主动”并不是相同比值，没有统一三段阈值。</p><p>PFR/VPIP = 翻前 PFR ÷ VPIP，表示自愿入池手牌中包含加注的比例参考；不是单个决策点的加注概率，也不衡量技术水平。</p><h3>三、翻后风格：AF 与 WTSD 五档</h3><p>两端取 AF 最低、最高的档位，中间用 GTO；过渡档按未舍入 AF 与两侧算术中点的绝对距离选择。AF 目标：0.5696、1.2047、1.8398、4.76215、7.6845。AF 不是百分比，WTSD 是看过翻牌后进入摊牌的比例，不是摊牌胜率。五档同时改变 AF 和 WTSD，不能当作只改变激进程度的旋钮。</p><h3>15 个翻前代表与取舍</h3><div class="table-wrap"><table><thead><tr><th>分区</th><th>主动档</th><th>profileName</th><th>VPIP / PFR</th><th>PFR/VPIP</th><th>选择理由</th></tr></thead><tbody>${builtinRoles
        .filter((r) => r.f === 3)
        .map(
          (r) =>
            `<tr><td>${looseness[r.l - 1]}</td><td>${activity[r.a - 1]}</td><td>${r.preflop.name}</td><td>${rolePercent(r.preflop.vpip)} / ${rolePercent(r.preflop.pfr)}</td><td>${rolePercent(roleRatio(r.preflop))}</td><td>${r.reason}</td></tr>`
        )
        .join(
          ''
        )}</tbody></table></div><h3>阅读边界</h3><p>横向切换主动档也会改变 VPIP；偏松档为保留端点而偏离中点；很松区域缺少接近 95% 主动比值的候选。完整组合在翻前和翻后分别切换 profile，不混合概率或创造新策略。只有翻前、翻后均为 gto 的 L3-A2-F3 是整套 GTO。</p>${button('查看 VPIP / PFR / AF / WTSD 说明', 'hud')}`
    )
  }
  private detail(role: BuiltinRole) {
    const target = roleTargets[role.l - 1]
    const delta = new Decimal(role.preflop.vpip).minus(target).mul(100).toFixed(3)
    this.dialog(
      `${role.id} · ${role.alias || '内置角色'}`,
      `<div class="role-detail-heading">${avatar(role)}<div><h3>${e(role.name)}</h3><p>${e(role.description)}</p></div></div><p class="role-reference">档位参考数据 · 组合实测状态：尚未验证；没有绑定实测 Session 或样本量。</p><div class="role-metrics">${metrics(
        role
      )
        .map(
          (v, i) =>
            `<div><span>${metricNames[i]} · ${i < 3 ? '翻前' : '翻后'}</span><b>${v}</b></div>`
        )
        .join(
          ''
        )}</div><div class="role-detail-profiles"><p><strong>翻前 profileName</strong><code>${role.preflop.name}</code></p><p><strong>翻后 profileName</strong><code>${role.postflop.name}</code></p></div><h3>为什么选这个档位</h3><p>翻前：${role.reason} 松紧目标 ${rolePercent(target, 3)}，实际档位 ${rolePercent(role.preflop.vpip)}，偏差 ${delta} 个百分点。候选分区 ${rolePercent(roleBoundaries[role.l - 1], 4)} ～ ${rolePercent(roleBoundaries[role.l], 4)}。</p><p>翻后：${role.postReason}</p><p class="role-source">来源：strategyProfile.catalog.ts / 2-0 / 4-6p · 方案 ${role.version}<br>6 人、初始 100BB、无前注、无抓注。参考指标来自两个不同街道的档位，不能拼接为完整角色实测 HUD。</p><hr><h3>使用此角色</h3><div class="actions">${button('复制为我的玩家配置', 'copy', attrs(role))}${button('加入实验草稿', 'experiment', attrs(role))}</div><div class="role-table-apply"><label class="field">应用到牌桌座位<select id="role-target-seat">${['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'].map((p, i) => `<option value="${i}">座位 ${i + 1}（首手 ${p}）</option>`).join('')}</select></label>${button('填入此座位设置', 'table', attrs(role))}</div><p class="muted">复制后可编辑并保存；加入实验只改变草稿；填入座位后需点击牌桌的“保存设置／下手生效”或“开始新体验”。以上操作均不启动 AI 请求。</p>`
    )
  }
  async click(action: string, b: HTMLButtonElement) {
    if (action === 'role-jump') {
      document
        .getElementById('role-comparison')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (action === 'role-detail') {
      this.detail(roleById(b.dataset.role!))
    } else if (action === 'role-standards') {
      this.standards()
    } else if (action === 'role-hud') {
      this.close()
      ;(document.getElementById('hud-help-dialog') as HTMLDialogElement).showModal()
    } else if (action === 'role-copy') {
      const r = roleById(b.dataset.role!)
      this.close()
      this.host.copy(r)
    } else if (action === 'role-experiment') {
      this.host.experiment(roleById(b.dataset.role!))
      this.close()
    } else if (action === 'role-table') {
      const seat = Number((document.getElementById('role-target-seat') as HTMLSelectElement).value)
      await this.host.table(roleById(b.dataset.role!), seat)
      this.close()
    } else if (action === 'role-clear' || action === 'role-remove') {
      if (action === 'role-clear') {
        this.compare.clear()
      } else {
        this.compare.delete(b.dataset.role!)
      }
      this.paint()
    } else if (action === 'role-reset' || action === 'role-view' || action === 'role-gto') {
      if (action === 'role-reset') {
        this.l = this.a = this.f = this.query = ''
        this.sort = 'id'
      }
      if (action === 'role-view') {
        this.mode = b.dataset.mode!
        if (this.mode === 'matrix' && !this.f) {
          this.f = '3'
        }
      }
      if (action === 'role-gto') {
        this.l = '3'
        this.a = '2'
        this.f = '3'
        this.query = ''
        this.mode = 'cards'
      }
      const root = document.getElementById('role-library')
      if (root) {
        root.innerHTML = this.view()
      }
      this.paint()
    }
  }
}
