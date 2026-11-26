import type { ScenarioGeneration } from '../contracts/workbench'
import type { ScenarioFixture } from '../scenarios'
import { escapeHtml as e } from '../reports/comparison-view'

type View = Omit<ScenarioGeneration, 'images'> & {
  fixtures: ScenarioFixture[]
  imageCount: number
  preflop: number
  postflop: number
}
type Preferences = {
  batchSize: number
  concurrency: number
  thinking: 'enabled' | 'disabled'
  stagePlan: ScenarioGeneration['stagePlan']
}
type Host = {
  api: <T>(path: string, body?: unknown) => Promise<T>
  input: () => unknown
  apply: (fixtures: ScenarioFixture[]) => void
  notice: (message: string) => void
  preview: (content: string) => void
  enabled: () => boolean
}
const labels: Record<string, string> = {
  running: '执行中',
  pausing: '等待当前批次结束',
  completed: '已完成',
  partial: '已保存部分结果',
  failed: '失败，可单独补跑',
  pending: '待执行',
  paused: '已暂停',
  interrupted: '已中断，可继续',
}

export class ScenarioBatchUI {
  private current: View | null = null
  private history: View[] = []
  private watching: string | null = null
  private preferences: Preferences = {
    batchSize: 3,
    concurrency: 2,
    thinking: 'disabled',
    stagePlan: 'auto',
  }
  constructor(private readonly host: Host) {
    try {
      const saved = JSON.parse(
        localStorage.getItem('strategy-lab-batch-preferences') ?? '{}'
      ) as Partial<Preferences>
      this.preferences = { ...this.preferences, ...saved }
    } catch {
      /* Defaults remain usable. */
    }
  }
  controls() {
    const select = (id: string, label: string, values: [string, string][], selected: unknown) =>
      `<label class="field">${label}<select id="${id}">${values.map(([value, title]) => `<option value="${value}" ${String(selected) === value ? 'selected' : ''}>${title}</option>`).join('')}</select></label>`
    return `<div class="grid">${select(
      'batch-size',
      '每批场景数',
      [1, 2, 3, 4, 5].map((n) => [String(n), `${n} 条${n === 3 ? '（推荐）' : ''}`]),
      this.preferences.batchSize
    )}${select(
      'batch-concurrency',
      '同时执行批次',
      [1, 2, 3].map((n) => [String(n), `${n} 批`]),
      this.preferences.concurrency
    )}${select(
      'batch-thinking',
      'DeepSeek 场景生成思考模式',
      [
        ['disabled', '关闭（推荐，优先输出场景）'],
        ['enabled', '开启（占用输出额度）'],
      ],
      this.preferences.thinking
    )}${select(
      'batch-stage-plan',
      '街道配额',
      [
        ['auto', '按描述（识别翻前翻后各 N 条）'],
        ['balanced', '翻前／翻后均分'],
        ['preflop', '全部翻前'],
        ['postflop', '全部翻后'],
      ],
      this.preferences.stagePlan
    )}</div><p class="muted">每批独立保存并校验，失败不阻断其他批次。成功临时结果可随时使用。Gemini 和不支持思考切换的旧模型沿用服务商行为。</p>`
  }
  private input() {
    for (const [key, id] of [
      ['batchSize', 'batch-size'],
      ['concurrency', 'batch-concurrency'],
      ['thinking', 'batch-thinking'],
      ['stagePlan', 'batch-stage-plan'],
    ] as const) {
      const field = document.getElementById(id) as HTMLSelectElement | null
      if (field) {
        Object.assign(this.preferences, {
          [key]: ['batchSize', 'concurrency'].includes(key) ? Number(field.value) : field.value,
        })
      }
    }
    try {
      localStorage.setItem('strategy-lab-batch-preferences', JSON.stringify(this.preferences))
    } catch {
      /* Server snapshots remain available. */
    }
    return { ...(this.host.input() as Record<string, unknown>), ...this.preferences }
  }
  view() {
    const job = this.current
    const busy = job && ['running', 'pausing'].includes(job.status)
    const button = (label: string, action: string, attributes = '', disabled = false) =>
      `<button type="button" class="secondary" data-action="${action}" ${attributes} ${disabled ? 'disabled' : ''}>${label}</button>`
    return `<div class="panel-header"><h2>分批生成与临时结果</h2><div class="actions">${button('查看已保存任务', 'batch-history')}<a class="chip" href="#library">打开场景库 ↗</a></div></div>${job ? `<div class="batch-task-header"><strong>${e(labels[job.status])}</strong><b>${job.fixtures.length} / ${job.count} 条已通过校验</b><span>翻前 ${job.preflop} / 翻后 ${job.postflop}</span></div><p class="muted">${e(job.requirements)}<br>每批 ${job.batchSize} 条 · 并发 ${job.concurrency} 批 · ${e(job.model.model)} · 思考${job.thinking === 'disabled' ? '关闭' : '开启'} · 任务 ${e(job.id)}</p><div class="actions">${button(`使用已生成 ${job.fixtures.length} 条临时结果`, 'batch-apply', '', !job.fixtures.length)}${button('继续／补齐未完成批次', 'batch-resume', '', Boolean(busy) || job.fixtures.length === job.count)}${button('暂停后续批次', 'batch-pause', '', !busy)}${button('刷新分批状态', 'batch-refresh')}</div><p class="muted">使用临时结果会替换当前路线草稿，可继续编辑、校验并独立运行 solver。补跑使用当前模型与提示词设置，保留成功场景，只补剩余数量。所有模型请求与 solver 执行均需点击对应按钮。</p><div class="table-wrap"><table><thead><tr><th>批次 / 目标</th><th>已保存 / 计划</th><th>状态与问题</th><th>操作及调用记录</th></tr></thead><tbody>${job.batches.map((b) => `<tr><td>第 ${b.index + 1} 批<small>${e(b.targets.map((t) => `${t.id}${t.stage ? ` / ${t.stage === 'preflop' ? '翻前' : '翻后'}` : ''}`).join('，'))}</small></td><td><strong>${b.fixtures.length} / ${b.targets.length}</strong>${b.progress && b.status === 'running' ? `<small>输出 ${b.progress.contentChars} 字符 · 思考 ${b.progress.reasoningChars} 字符</small>` : ''}</td><td>${e(labels[b.status])}${b.problem ? `<p class="batch-problem">${e(b.problem)}</p>` : ''}</td><td>${button('补跑本批剩余', 'batch-retry', `data-index="${b.index}"`, Boolean(busy) || b.fixtures.length === b.targets.length)}${b.attempts.map((a, i) => `<p>第 ${i + 1} 次 · 接收 ${a.accepted} 条<br><a href="/api/calls/${a.callId}/request" target="_blank" rel="noopener">提示词与设置</a> · <a href="/api/calls/${a.callId}/response" target="_blank" rel="noopener">原始响应</a> · <a href="/api/calls/${a.callId}/result" target="_blank" rel="noopener">校验结果</a></p>`).join('')}</td></tr>`).join('')}</tbody></table></div><details><summary>已校验临时结果 JSON（${job.fixtures.length} 条）</summary><pre>${e(JSON.stringify(job.fixtures, null, 2))}</pre></details>` : '<p class="muted">生成后逐批展示进度与可用结果。任务保存在本机，刷新或重启后可恢复；不会自动重发请求。</p>'}${this.history.length ? `<details open><summary>已保存的生成任务</summary>${this.history.map((h) => `<p>${button(`${new Date(h.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · ${h.fixtures.length}/${h.count} 条 · ${labels[h.status]}`, 'batch-open', `data-id="${e(h.id)}"`)}</p>`).join('')}</details>` : ''}`
  }
  private paint() {
    const panel = document.getElementById('scenario-batch-panel')
    if (panel) {
      panel.innerHTML = this.view()
    }
  }
  async start() {
    if (!this.host.enabled()) {
      throw new Error('请重启 Web 服务并刷新页面，启用分批生成功能')
    }
    if (this.current && ['running', 'pausing'].includes(this.current.status)) {
      throw new Error('当前分批任务正在运行，可使用临时结果或暂停后续批次')
    }
    this.current = await this.host.api<View>('/scenario-generations', this.input())
    this.remember()
    this.paint()
    this.watch()
  }
  async preview() {
    if (!this.host.enabled()) {
      throw new Error('请重启 Web 服务后预览分批计划')
    }
    const preview = await this.host.api<unknown>('/scenario-generations/preview', this.input())
    this.host.preview(JSON.stringify(preview, null, 2))
  }
  private remember() {
    try {
      if (this.current) {
        localStorage.setItem('strategy-lab-scenario-generation', this.current.id)
      }
    } catch {
      /* History remains available on the server. */
    }
  }
  async open(id: string) {
    this.current = await this.host.api<View>(`/scenario-generations/${id}`)
    this.remember()
    this.paint()
    this.watch()
  }
  async restore() {
    if (!this.host.enabled()) {
      return
    }
    const saved = localStorage.getItem('strategy-lab-scenario-generation')
    if (saved && /^[A-Za-z0-9-]+$/.test(saved)) {
      await this.open(saved)
    }
  }
  async refresh() {
    if (this.current) {
      await this.open(this.current.id)
    }
  }
  async loadHistory() {
    this.history = await this.host.api<View[]>('/scenario-generations')
    this.paint()
  }
  async resume(batchIndex?: number) {
    if (!this.current) {
      return
    }
    this.current = await this.host.api<View>(`/scenario-generations/${this.current.id}/resume`, {
      batchIndex,
      useCurrentSettings: true,
      thinking: this.input().thinking,
    })
    this.paint()
    this.watch()
  }
  async pause() {
    if (this.current) {
      await this.host.api(`/scenario-generations/${this.current.id}/pause`, {})
      await this.refresh()
    }
  }
  apply() {
    if (!this.current?.fixtures.length) {
      throw new Error('尚无已校验临时结果')
    }
    this.host.apply(structuredClone(this.current.fixtures))
  }
  private watch() {
    const id = this.current?.id
    if (!id || this.watching === id || !['running', 'pausing'].includes(this.current!.status)) {
      return
    }
    this.watching = id
    void (async () => {
      let failures = 0
      while (this.current?.id === id && ['running', 'pausing'].includes(this.current.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        try {
          const latest = await this.host.api<View>(`/scenario-generations/${id}`)
          if (this.current?.id !== id) {
            break
          }
          this.current = latest
          failures = 0
          this.paint()
        } catch {
          if (++failures >= 3) {
            this.host.notice('分批状态读取失败，已保存结果保留；刷新状态可继续查看')
            break
          }
        }
      }
    })().finally(() => {
      if (this.watching === id) {
        this.watching = null
      }
    })
  }
}
