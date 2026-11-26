import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import { record } from '../analysis/strategy'
import { payoutDuration } from '../table/pots'
import { reviewTableHand } from '../analysis/table-history'
import { readTableHandReview } from '../storage/table-history'
import { readTableStatsPlayers } from '../storage/table-stats'
import {
  emptyTableStats,
  addTableStats,
  tableStatValues,
  tableStatPlayers,
  type TableStatistics,
} from '../analysis/table-stats'
import { tableRequest, sampleTableAction } from '../client/table-solver'
import { createLookupService } from '../client/lookup'
import { validPlayer } from '../profiles/catalog'
import {
  newHand,
  applyAction,
  advanceHand,
  replayTableHand,
  sub,
  add,
  type TableAction,
} from '../table/engine'
import type { TableConfig, TableRun } from '../contracts/table'
import type { AIRequestBody } from '../contracts/lookup'
import type { WorkbenchStore } from '../storage/workbench'

type Packet = {
  requestId: string
  request: AIRequestBody
  response: unknown
  action: TableAction | null
  problem: string | null
  elapsedMs: number
}
type Control = { run: TableRun; pause: boolean; stop: boolean; budget: number | null }
export function validTableConfig(value: unknown): TableConfig {
  const obj = record(value)
  if (obj.mode !== 'watch' && obj.mode !== 'fast') {
    throw new Error('请选择观看或快速模式')
  }
  if (!Array.isArray(obj.seats) || obj.seats.length !== 6) {
    throw new Error('请为六个座位分别配置玩家类型')
  }
  const hands = obj.hands === null ? null : Number(obj.hands ?? 100)
  if (
    hands === null
      ? obj.mode === 'fast'
      : !Number.isInteger(hands) || hands < 1 || hands > 100000000
  ) {
    throw new Error('手数为 1..100000000；持续运行只适用于观看模式')
  }
  const number = (key: string, fallback: number, max: number) => {
    const n = Number(obj[key] ?? fallback)
    if (!Number.isInteger(n) || n < 0 || n > max) {
      throw new Error(`${key} 超出范围`)
    }
    return n
  }
  return {
    mode: obj.mode,
    seats: (obj.seats as unknown[]).map(validPlayer),
    hands,
    seed: number('seed', Date.now() >>> 0, 4294967295),
    actionDelayMs: number('actionDelayMs', 2000, 60000),
    handDelayMs: number('handDelayMs', 5000, 60000),
    animations: obj.animations !== false,
    autoNext: obj.autoNext !== false,
    autoRebuy: obj.autoRebuy !== false,
  }
}
export class TableRunner {
  private readonly active = new Map<string, Control>()
  private readonly starting = new Set<string>()
  private readonly writes = new Map<string, Promise<unknown>>()
  private readonly statsCache = new Map<
    string,
    { completed: number; stats: TableStatistics; notice?: string }
  >()
  private solver: ReturnType<typeof createLookupService> | null = null
  constructor(
    private readonly store: WorkbenchStore,
    private readonly solve?: (request: AIRequestBody) => Promise<unknown>
  ) {}
  private async persist(run: TableRun) {
    run.updatedAt = new Date().toISOString()
    const snapshot = structuredClone(run)
    const next = (this.writes.get(run.id) ?? Promise.resolve()).then(() =>
      this.store.write(['table-runs', run.id, 'checkpoint.json'], snapshot)
    )
    this.writes.set(
      run.id,
      next.catch(() => undefined)
    )
    await next
  }
  private async journal(run: TableRun, value: unknown) {
    const shard = `hands-${String(Math.floor((run.hand!.number - 1) / 1000)).padStart(6, '0')}.jsonl`
    await mkdir(this.store.path('table-runs', run.id, 'logs'), { recursive: true })
    await appendFile(
      this.store.path('table-runs', run.id, 'logs', shard),
      `${JSON.stringify(value)}\n`
    )
  }
  async create(value: unknown) {
    const config = validTableConfig(value),
      id = randomUUID(),
      time = new Date().toISOString()
    const run: TableRun = {
      version: 1,
      id,
      createdAt: time,
      updatedAt: time,
      config,
      nextSeats: null,
      status: 'paused',
      phase: 'idle',
      dueAt: null,
      problem: null,
      completed: 0,
      requests: 0,
      reused: 0,
      errors: 0,
      hand: null,
      stacks: Array<number>(6).fill(10000),
      rebuys: Array<number>(6).fill(0),
      stats: emptyTableStats(),
      events: [],
      recentHands: [],
      lastDecision: null,
    }
    run.hand = newHand(
      1,
      0,
      config.seats,
      run.stacks,
      (config.seed ^ Math.imul(1, 0x9e3779b9)) >>> 0
    )
    this.event(run)
    await this.persist(run)
    return this.detail(id)
  }
  private async enrichStats(run: TableRun) {
    if (
      !Object.values(run.stats).some((group) => Object.values(group).some((row) => !row.players))
    ) {
      return
    }
    let cached = this.statsCache.get(run.id)
    if (!cached || cached.completed !== run.completed) {
      try {
        cached = {
          completed: run.completed,
          stats: await readTableStatsPlayers(this.store, run.id, run.completed, run.stats),
        }
      } catch (error) {
        cached = {
          completed: run.completed,
          stats: run.stats,
          notice: `${error instanceof Error ? error.message : '历史玩家类型读取失败'}；保留原统计，不推测玩家类型。`,
        }
      }
      this.statsCache.delete(run.id)
      this.statsCache.set(run.id, cached)
      if (this.statsCache.size > 16) {
        this.statsCache.delete(this.statsCache.keys().next().value!)
      }
    }
    run.stats = structuredClone(cached.stats)
    run.statsNotice = cached.notice
  }
  async detail(id: string, withPlayers = true) {
    const run = structuredClone(
      this.active.get(id)?.run ??
        (await this.store.read<TableRun>(['table-runs', id, 'checkpoint.json']))
    )
    if (run.status === 'running' || run.status === 'waiting') {
      if (!this.active.has(id)) {
        run.status = 'interrupted'
        run.phase = 'paused'
        run.problem = '服务已重启；已保存检查点，点击继续后恢复，不自动请求'
      }
    }
    if (run.hand) {
      run.hand.deck = []
      run.hand.burned = []
    }
    if (withPlayers) {
      await this.enrichStats(run)
    }
    return run
  }
  async list() {
    const rows = await Promise.all(
      (await this.store.list('table-runs')).map(async (id) => {
        try {
          const run = await this.detail(id, false)
          return {
            id,
            createdAt: run.createdAt,
            status: run.status,
            mode: run.config.mode,
            completed: run.completed,
            hands: run.config.hands,
            requests: run.requests,
            seats: run.config.seats.map((s) => s.label),
          }
        } catch {
          return null
        }
      })
    )
    return rows.filter((row) => row !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async review(id: string, number: number) {
    if (!Number.isSafeInteger(number) || number < 1 || number > 100000000) {
      throw new Error('无效的手牌编号')
    }
    const run = await this.detail(id)
    if (run.hand?.number === number) {
      return reviewTableHand(run.hand)
    }
    if (number > run.completed) {
      throw new Error('该手牌尚未开始')
    }
    return readTableHandReview(this.store, id, number, run.config.seed)
  }
  async start(id: string, step = false) {
    if (this.active.has(id) || this.starting.has(id)) {
      throw new Error('牌桌已有执行任务，请等待暂停完成')
    }
    this.starting.add(id)
    try {
      const run = await this.store.read<TableRun>(['table-runs', id, 'checkpoint.json'])
      if (['completed', 'stopped'].includes(run.status)) {
        throw new Error('本次体验已结束，请新建牌桌')
      }
      await this.enrichStats(run)
      run.status = 'running'
      run.problem = null
      const control: Control = { run, pause: false, stop: false, budget: step ? 1 : null }
      this.active.set(id, control)
      void this.loop(control)
        .catch(async (error: unknown) => {
          run.status = 'failed'
          run.phase = 'paused'
          run.dueAt = null
          run.errors++
          run.problem = error instanceof Error ? error.message : '牌桌执行失败'
          await this.persist(run)
        })
        .finally(() => {
          this.active.delete(id)
          this.writes.delete(id)
        })
        .catch(() => undefined)
      return this.detail(id)
    } finally {
      this.starting.delete(id)
    }
  }
  async pause(id: string, stop = false) {
    const control = this.active.get(id)
    if (control) {
      control.pause = true
      control.stop = stop
      control.run.status = 'waiting'
      control.run.dueAt = null
      await this.persist(control.run)
    } else {
      const run = await this.store.read<TableRun>(['table-runs', id, 'checkpoint.json'])
      if (!['completed', 'stopped'].includes(run.status)) {
        run.status = stop ? 'stopped' : 'paused'
        run.phase = 'paused'
        run.dueAt = null
        await this.persist(run)
      }
    }
    return this.detail(id)
  }
  async configure(id: string, value: unknown) {
    const run =
      this.active.get(id)?.run ??
      (await this.store.read<TableRun>(['table-runs', id, 'checkpoint.json']))
    const config = validTableConfig({ ...run.config, ...record(value) })
    if (config.seed !== run.config.seed) {
      throw new Error('随机种子在本次体验中固定；更换种子请开始新体验')
    }
    if (
      config.hands !== null &&
      config.hands < run.completed + (run.hand && !run.hand.complete ? 1 : 0)
    ) {
      throw new Error('目标手数不能小于当前已开始的手数')
    }
    run.nextSeats = config.seats
    config.seats = run.config.seats
    run.config = config
    await this.persist(run)
    return this.detail(id)
  }
  private event(run: TableRun) {
    const latest = run.hand!.events.at(-1)!
    run.events.push({ ...latest, hand: run.hand!.number })
    run.events = run.events.slice(-160)
  }
  private async delay(control: Control, until: number, phase: TableRun['phase']) {
    if (control.run.config.mode === 'fast') {
      return
    }
    control.run.phase = phase
    control.run.dueAt = new Date(until).toISOString()
    while (Date.now() < until && !control.pause && control.run.config.mode === 'watch') {
      await new Promise((resolve) => setTimeout(resolve, Math.min(50, until - Date.now())))
    }
    control.run.dueAt = null
  }
  private async packet(run: TableRun) {
    replayTableHand(run.hand!, (run.config.seed ^ Math.imul(run.hand!.number, 0x9e3779b9)) >>> 0)
    const request = tableRequest(run.hand!, run.id)
    const cached = await this.store.read<Packet | null>(
      ['table-runs', run.id, 'pending-decision.json'],
      null
    )
    if (
      cached?.requestId === request.request_id &&
      JSON.stringify(cached.request) !== JSON.stringify(request)
    ) {
      throw new Error('当前请求与缓存不一致，已停止；请新建体验')
    }
    if (cached?.requestId === request.request_id && !cached.problem && cached.action) {
      run.reused++
      // A crash can occur after the pending packet is durable but before its journal append.
      await this.journal(run, {
        kind: 'decision',
        reused: true,
        hand: run.hand!.number,
        actionIndex: run.hand!.actions,
        ...cached,
      })
      return cached
    }
    run.requests++
    run.phase = 'requesting'
    await this.persist(run)
    const started = performance.now()
    let response: unknown = null,
      action: TableAction | null = null,
      problem: string | null = null
    try {
      if (this.solve) {
        response = await this.solve(request)
      } else {
        if (!process.env.AI_SERVICE_URL) {
          throw new Error('缺少 AI_SERVICE_URL')
        }
        this.solver ??= createLookupService()
        response = await this.solver.requestRaw(request)
      }
      action = sampleTableAction(
        run.hand!,
        request,
        response,
        (run.config.seed ^
          Math.imul(run.hand!.number, 0x85ebca6b) ^
          Math.imul(run.hand!.actions + 1, 0xc2b2ae35)) >>>
          0
      )
    } catch (error) {
      const obj = record(error)
      response = record(obj.response).data ?? response
      problem = error instanceof Error ? error.message : '第三方决策失败'
    }
    const packet: Packet = {
      requestId: request.request_id,
      request,
      response,
      action,
      problem,
      elapsedMs: Math.round(performance.now() - started),
    }
    await this.store.write(['table-runs', run.id, 'pending-decision.json'], packet)
    await this.journal(run, {
      kind: 'decision',
      hand: run.hand!.number,
      actionIndex: run.hand!.actions,
      ...packet,
    })
    return packet
  }
  private async loop(control: Control) {
    const run = control.run
    let iterations = 0
    while (!control.pause) {
      const hand = run.hand!
      if (hand.complete) {
        if (
          run.config.mode === 'watch' &&
          run.config.animations &&
          run.settlement?.hand === hand.number
        ) {
          await this.delay(
            control,
            Date.parse(run.settlement.startedAt) + run.settlement.durationMs,
            'settling'
          )
          if (control.pause) {
            break
          }
        }
        if (run.config.hands !== null && run.completed >= run.config.hands) {
          run.status = 'completed'
          break
        }
        await this.delay(control, Date.now() + run.config.handDelayMs, 'next-hand')
        if (control.pause) {
          break
        }
        if (run.nextSeats) {
          run.config.seats = run.nextSeats
          run.nextSeats = null
        }
        for (let i = 0; i < 6; i++) {
          if (run.stacks[i] === 0) {
            if (!run.config.autoRebuy) {
              throw new Error(`座位 ${i + 1} 筹码耗尽；开启自动补充筹码后继续`)
            }
            run.stacks[i] = 10000
            run.rebuys[i] = add(run.rebuys[i], 10000)
          }
        }
        run.hand = newHand(
          run.completed + 1,
          (hand.button + 1) % 6,
          run.config.seats,
          run.stacks,
          (run.config.seed ^ Math.imul(run.completed + 1, 0x9e3779b9)) >>> 0
        )
        delete run.settlement
        this.event(run)
      } else if (hand.actor === null) {
        advanceHand(hand)
        this.event(run)
        if (hand.complete) {
          if (run.config.mode === 'watch' && run.config.animations) {
            run.settlement = {
              hand: hand.number,
              startedAt: new Date().toISOString(),
              durationMs: payoutDuration(hand),
            }
            run.phase = 'settling'
          }
          addTableStats(run.stats, hand)
          run.completed++
          run.stacks = hand.players.map((p) => p.stack)
          run.recentHands.push({
            number: hand.number,
            board: hand.board,
            profit: hand.players.map((p) => sub(p.stack, p.initial)),
            winners: hand.players.filter((p) => hand.awards[p.seat] > 0).map((p) => p.seat),
          })
          run.recentHands = run.recentHands.slice(-20)
          await this.journal(run, {
            kind: 'hand',
            number: hand.number,
            button: hand.button,
            players: hand.players,
            board: hand.board,
            pots: hand.pots,
            awards: hand.awards,
            refunds: hand.refunds,
            showdown: hand.showdown,
            events: hand.events,
          })
        }
      } else {
        if (hand.actions > 512) {
          throw new Error('单手行动次数异常，已暂停保护牌局')
        }
        const due = Date.now() + (run.config.mode === 'watch' ? run.config.actionDelayMs : 0)
        run.dueAt = new Date(due).toISOString()
        const packet = await this.packet(run)
        if (packet.problem || !packet.action) {
          throw new Error(
            `${packet.problem ?? '未返回可执行动作'}；请求 ${packet.requestId} 已保存，可显式重试`
          )
        }
        await this.delay(control, due, 'action-delay')
        if (control.pause) {
          break
        }
        applyAction(hand, packet.action)
        this.event(run)
        run.lastDecision = {
          requestId: packet.requestId,
          actionIndex: hand.actions - 1,
          elapsedMs: packet.elapsedMs,
        }
      }
      await this.persist(run)
      if (
        run.hand!.complete &&
        run.config.mode === 'watch' &&
        run.config.animations &&
        run.settlement
      ) {
        await this.delay(
          control,
          Date.parse(run.settlement.startedAt) + run.settlement.durationMs,
          'settling'
        )
      }
      if (run.hand!.complete && run.config.hands !== null && run.completed >= run.config.hands) {
        run.status = 'completed'
        break
      }
      if (control.budget !== null && --control.budget <= 0) {
        control.pause = true
      }
      if (run.hand!.complete && run.config.mode === 'watch' && !run.config.autoNext) {
        control.pause = true
      }
      if (run.config.mode === 'watch' && run.config.animations && !control.pause) {
        await this.delay(control, Date.now() + 450, 'action-delay')
      }
      if (++iterations % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    if (run.status !== 'completed') {
      run.status = control.stop ? 'stopped' : 'paused'
    }
    run.phase = run.status === 'completed' ? 'idle' : 'paused'
    run.dueAt = null
    await this.persist(run)
  }
  async csv(id: string) {
    const run = await this.detail(id)
    const quote = (value: string) =>
      `"${(/^[=+@-]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`
    const rows = [
      'Session,已结算手数,分组,位置或类型,玩家类型及已发牌手数,样本手数,翻前有效机会,VPIP%,PFR%,AF,WTSD%,净赢BB',
    ]
    for (const [kind, group] of Object.entries(run.stats)) {
      for (const [key, row] of Object.entries(group)) {
        const v = tableStatValues(row)
        rows.push(
          [
            run.id,
            run.completed,
            kind,
            quote(key),
            quote(tableStatPlayers(row) || '历史玩家类型未核实'),
            v.hands,
            v.opportunities,
            v.vpipPercent,
            v.pfrPercent,
            v.af,
            v.wtsdPercent,
            v.profitBb,
          ].join(',')
        )
      }
    }
    return '\ufeff' + rows.join('\r\n')
  }
}
