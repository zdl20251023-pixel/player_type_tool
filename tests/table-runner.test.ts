import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative, isAbsolute } from 'node:path'
import Decimal from 'decimal.js'
import { TableRunner, validTableConfig } from '../src/runner/table'
import { WorkbenchStore } from '../src/storage/workbench'
import { Workbench } from '../src/runner/workbench'
import { createWebHandler } from '../src/web/server'
import { styles } from '../src/profiles/styles'
import { tableRequest, sampleTableAction } from '../src/client/table-solver'
import { newHand, legalActions, applyAction } from '../src/table/engine'
import type { AIRequestBody } from '../src/contracts/lookup'
import type { TableRun } from '../src/contracts/table'

const seats = Array.from({ length: 6 }, (_, i) => ({ ...styles[i % 3], description: '本机测试' }))
const config = (mode: 'watch' | 'fast') => ({
  mode,
  seats,
  hands: 3,
  seed: 12345,
  actionDelayMs: 0,
  handDelayMs: 0,
  autoNext: true,
  autoRebuy: true,
  animations: false,
})
export function localCallResponse(request: AIRequestBody) {
  const hero = request.hand.players.find((p) => p.hole_cards)!.seat_no
  const contribution = Array<number>(6).fill(0)
  contribution[1] = 50
  contribution[2] = 100
  let highest = 100
  for (const action of request.hand.actions.entries) {
    if (action.seat_no === -1) {
      contribution.fill(0)
      highest = 0
      continue
    }
    const seat = action.seat_no!
    if (action.action === 'call') {
      contribution[seat] = highest
    } else if (['raise', 'bet', 'allin'].includes(action.action)) {
      contribution[seat] = action.amount!
      highest = Math.max(highest, action.amount!)
    }
  }
  const type = new Decimal(highest).minus(contribution[hero]).gt(0) ? 'call' : 'check'
  return {
    strategy: {
      actions: [
        {
          action: { action: type, seat_no: hero, amount: null, pot_size: null },
          hand_strategy: 1,
          hand_ev: 0,
        },
      ],
    },
    solution_information: {
      source: 'local-rule-test',
      strategy_profile_config: {
        matched_profile_name: String(request.strategy_profile!.target_profile_name),
      },
    },
  }
}
async function settled(runner: TableRunner, id: string) {
  let run = await runner.detail(id)
  for (let i = 0; i < 1000 && ['running', 'waiting'].includes(run.status); i++) {
    await Bun.sleep(5)
    run = await runner.detail(id)
  }
  return run
}
async function cleanup(root: string) {
  const inside = relative(tmpdir(), root)
  if (inside && !inside.startsWith('..') && !isAbsolute(inside)) {
    await rm(root, { recursive: true, force: true })
  }
}

test('watch and fast modes share identical dealing, decisions, payouts and position statistics', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'table-parity-'))
  const store = new WorkbenchStore(root)
  let calls = 0
  const runner = new TableRunner(store, (request) => {
    calls++
    expect(request.hand.players.filter((p) => p.hole_cards)).toHaveLength(1)
    return Promise.resolve(localCallResponse(request))
  })
  try {
    const fast = await runner.create({
        ...config('fast'),
        actionDelayMs: 60000,
        handDelayMs: 60000,
        animations: true,
        autoNext: false,
      }),
      watch = await runner.create(config('watch'))
    expect(calls).toBe(0)
    await runner.start(fast.id)
    const fastResult = await settled(runner, fast.id)
    await runner.start(watch.id)
    const watchResult = await settled(runner, watch.id)
    expect(fastResult.status).toBe('completed')
    expect(watchResult.status).toBe('completed')
    expect(fastResult.completed).toBe(3)
    expect(fastResult.stats).toEqual(watchResult.stats)
    expect(fastResult.recentHands).toEqual(watchResult.recentHands)
    expect(fastResult.stacks).toEqual(watchResult.stacks)
    expect(fastResult.requests).toBe(72)
    expect(Object.values(fastResult.stats.position).map((r) => r.hands)).toEqual([3, 3, 3, 3, 3, 3])
    const log = await readFile(
      store.path('table-runs', fast.id, 'logs', 'hands-000000.jsonl'),
      'utf8'
    )
    expect(log).toContain('"kind":"decision"')
    expect(log).toContain('"kind":"hand"')
    expect((log.match(/"kind":"hand"/g) ?? []).length).toBe(3)
    const beforeReview = calls
    const firstHand = await runner.review(fast.id, 1)
    expect(firstHand.players).toHaveLength(6)
    expect(new Set(firstHand.players.flatMap((p) => p.cards)).size).toBe(12)
    expect(firstHand.events.filter((v) => v.type === 'action')).toHaveLength(24)
    expect(firstHand.players[0].position).toBe('BTN')
    expect((await runner.review(fast.id, 2)).players[0].position).toBe('CO')
    // Old journals had no event list: recover with the shared core, without rewriting the cache.
    const legacyLog =
      log
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const row = JSON.parse(line) as Record<string, unknown>
          if (row.kind === 'hand') {
            delete row.events
          }
          return JSON.stringify(row)
        })
        .join('\n') + '\n'
    const logPath = store.path('table-runs', fast.id, 'logs', 'hands-000000.jsonl')
    await writeFile(logPath, legacyLog)
    expect(await runner.review(fast.id, 1)).toEqual(firstHand)
    expect(await readFile(logPath, 'utf8')).toBe(legacyLog)
    const incompleteLog =
      legacyLog
        .split('\n')
        .filter((line) => {
          if (!line) {
            return false
          }
          const row = JSON.parse(line) as { kind: string; hand?: number; actionIndex?: number }
          return !(row.kind === 'decision' && row.hand === 1 && row.actionIndex === 0)
        })
        .join('\n') + '\n'
    await writeFile(logPath, incompleteLog)
    await assert.rejects(runner.review(fast.id, 1), /旧行动日志不完整/)
    await writeFile(logPath, legacyLog)
    expect((await runner.review(fast.id, 3)).players.map((p) => p.cards)).toEqual(
      fastResult.hand!.players.map((p) => p.cards)
    )
    const handler = createWebHandler(new Workbench(store), undefined, runner)
    expect(
      (await handler(new Request(`http://127.0.0.1:3217/api/table-runs/${fast.id}/hands/1`))).status
    ).toBe(200)
    expect(
      (await handler(new Request(`http://127.0.0.1:3217/api/table-runs/${fast.id}/hands/0`))).status
    ).toBe(400)
    expect(calls).toBe(beforeReview)
    const stats = await runner.csv(fast.id)
    expect(stats).toContain('VPIP%')
    expect(stats).toContain('position')
    expect(fastResult.hand!.deck).toEqual([])
    const internal = await store.read<TableRun>(['table-runs', fast.id, 'checkpoint.json'])
    expect(internal.hand!.deck.length).toBeGreaterThan(0)
  } finally {
    await cleanup(root)
  }
}, 15000)

test('watch mode keeps the final settled hand visible for payouts before marking the run complete', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'table-payout-'))
  const store = new WorkbenchStore(root)
  let id = '',
    calls = 0
  const runner = new TableRunner(store, async (request) => {
    if (++calls === 24) {
      await runner.configure(id, { animations: true })
    }
    return localCallResponse(request)
  })
  try {
    const created = await runner.create({ ...config('watch'), hands: 1 })
    id = created.id
    await runner.start(id)
    let paying = await runner.detail(id)
    for (let i = 0; i < 500 && paying.phase !== 'settling'; i++) {
      await Bun.sleep(5)
      paying = await runner.detail(id)
    }
    expect(paying.phase).toBe('settling')
    expect(paying.status).toBe('running')
    expect(paying.completed).toBe(1)
    expect(paying.hand!.complete).toBe(true)
    expect(paying.settlement!.durationMs).toBeGreaterThan(1000)
    const done = await settled(runner, id)
    expect(done.status).toBe('completed')
    expect(done.requests).toBe(24)
    expect(done.stacks).toEqual(paying.stacks)
  } finally {
    await cleanup(root)
  }
}, 15000)

test('weighted strategy sampling supports absent EV without replacing the saved response', () => {
  const h = newHand(1, 0, seats, Array<number>(6).fill(10000), 456)
  const request = tableRequest(h, 'sampling')
  const response = localCallResponse(request)
  const mixed = {
    ...response,
    strategy: {
      actions: [
        { ...response.strategy.actions[0], hand_strategy: 0.3, hand_ev: null },
        {
          ...response.strategy.actions[0],
          action: { ...response.strategy.actions[0].action, action: 'fold' },
          hand_strategy: 0.7,
          hand_ev: null,
        },
      ],
    },
  }
  let calls = 0
  for (let seed = 0; seed < 2000; seed++) {
    if (sampleTableAction(h, request, mixed, seed).type === 'call') {
      calls++
    }
  }
  expect(calls).toBeGreaterThan(500)
  expect(calls).toBeLessThan(700)
  expect(mixed.strategy.actions[0].hand_ev).toBeNull()
  expect(h.actions).toBe(0)
})

test('watch mode waits from turn start and a corrupted checkpoint cannot send another request', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'table-delay-'))
  const store = new WorkbenchStore(root)
  let calls = 0
  const runner = new TableRunner(store, (request) => {
    calls++
    return Promise.resolve(localCallResponse(request))
  })
  try {
    const run = await runner.create({ ...config('watch'), actionDelayMs: 200 })
    const started = performance.now()
    await runner.start(run.id, true)
    const paused = await settled(runner, run.id)
    expect(paused.hand!.actions).toBe(1)
    expect(performance.now() - started).toBeGreaterThanOrEqual(190)
    const saved = await store.read<TableRun>(['table-runs', run.id, 'checkpoint.json'])
    saved.hand!.players[0].cards = ['As', 'As']
    await store.write(['table-runs', run.id, 'checkpoint.json'], saved)
    await runner.start(run.id, true)
    expect((await settled(runner, run.id)).status).toBe('failed')
    expect(calls).toBe(1)
  } finally {
    await cleanup(root)
  }
}, 15000)

test('pause during solver request preserves successful response and restart reuses it before taking another action', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'table-resume-'))
  const store = new WorkbenchStore(root)
  let release: () => void = () => undefined,
    calls = 0
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const runner = new TableRunner(store, async (request) => {
    calls++
    await gate
    return localCallResponse(request)
  })
  try {
    const initial = await runner.create(config('fast'))
    await runner.start(initial.id)
    for (let i = 0; i < 100 && !calls; i++) {
      await Bun.sleep(5)
    }
    const waiting = await runner.pause(initial.id)
    expect(waiting.status).toBe('waiting')
    release()
    const paused = await settled(runner, initial.id)
    expect(paused.status).toBe('paused')
    expect(paused.hand!.actions).toBe(0)
    const reopened = new TableRunner(store, (request) => {
      calls++
      return Promise.resolve(localCallResponse(request))
    })
    await reopened.start(initial.id, true)
    const one = await settled(reopened, initial.id)
    expect(one.hand!.actions).toBe(1)
    expect(calls).toBe(1)
    expect(one.reused).toBe(1)
    expect(one.status).toBe('paused')
    await assert.rejects(reopened.configure(initial.id, { seed: 222 }), /种子/)
    const updated = await reopened.configure(initial.id, {
      seats: seats.map((p) => ({ ...p, ...styles[2], description: '下手使用' })),
      mode: 'fast',
      autoNext: true,
    })
    expect(updated.nextSeats![0].id).toBe('gto')
    expect(updated.hand!.players[0].config.id).toBe(seats[0].id)
    await reopened.start(initial.id)
    const done = await settled(reopened, initial.id)
    expect(done.completed).toBe(3)
    expect(done.hand!.players.every((p) => p.config.id === 'gto')).toBe(true)
  } finally {
    release()
    await cleanup(root)
  }
}, 15000)

test('request seats rotate canonically without leaking opponents cards; invalid solver actions pause instead of random fallback', async () => {
  const h = newHand(1, 4, seats, Array<number>(6).fill(10000), 55)
  const request = tableRequest(h, 'local-test')
  expect(request.hand.dealer_seat).toBe(0)
  expect(request.hand.players.find((p) => p.hole_cards)!.seat_no).toBe(3)
  expect(request.hand.players.find((p) => p.hole_cards)!.hole_cards).toBe(
    h.players[h.actor!].cards.join('')
  )
  const invalid = localCallResponse(request)
  invalid.strategy.actions[0].action.action = 'check'
  expect(() => sampleTableAction(h, request, invalid, 1)).toThrow('不能过牌')
  const wrongSeat = localCallResponse(request)
  wrongSeat.strategy.actions[0].action.seat_no = 0
  expect(() => sampleTableAction(h, request, wrongSeat, 1)).toThrow('行动玩家与 Hero 不一致')
  const response = localCallResponse(request)
  response.strategy.actions[0].action.action = 'call'
  const chosen = sampleTableAction(h, request, response, 1)
  applyAction(h, chosen)
  expect(legalActions(h).owed).toBe(100)
  const root = await mkdtemp(resolve(tmpdir(), 'table-failure-'))
  try {
    const store = new WorkbenchStore(root),
      runner = new TableRunner(store, () => Promise.resolve(invalid))
    const created = await runner.create(config('fast'))
    await runner.start(created.id)
    const failed = await settled(runner, created.id)
    expect(failed.status).toBe('failed')
    expect(failed.completed).toBe(0)
    expect(failed.hand!.actions).toBe(0)
    expect(await store.read(['table-runs', created.id, 'pending-decision.json'])).toBeDefined()
    const handler = createWebHandler(new Workbench(store), undefined, runner)
    expect(
      (await handler(new Request(`http://127.0.0.1:3217/api/table-runs/${created.id}`))).status
    ).toBe(200)
    expect(
      (
        await handler(new Request(`http://127.0.0.1:3217/api/table-runs/${created.id}/stats.csv`))
      ).headers.get('Content-Type')
    ).toContain('text/csv')
    await assert.rejects(runner.configure(created.id, { hands: 100000001 }), /手数/)
    expect(validTableConfig({ ...config('fast'), hands: 100000000 }).hands).toBe(100000000)
  } finally {
    await cleanup(root)
  }
}, 15000)
