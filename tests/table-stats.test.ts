import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import {
  addTableStats,
  emptyTableStats,
  tableStatValues,
  type TableStat,
} from '../src/analysis/table-stats'
import { newHand, applyAction, advanceHand, legalActions } from '../src/table/engine'
import { readTableStatsPlayers } from '../src/storage/table-stats'
import { WorkbenchStore } from '../src/storage/workbench'
import { TableRunner } from '../src/runner/table'
import { styles } from '../src/profiles/styles'
import type { PlayerConfig } from '../src/contracts/workbench'

function samples() {
  const seats: PlayerConfig[] = Array.from({ length: 6 }, (_, i) => ({
    ...styles[i % 3],
    description: '本机测试',
  }))
  return Array.from({ length: 4 }, (_, i) => {
    // Seat 1 changes type after two hands; the snapshots retain both labels.
    if (i === 2) {
      seats[0] = { ...seats[0], label: '历史更名测试' }
    }
    const hand = newHand(i + 1, i, structuredClone(seats), Array<number>(6).fill(10000), i + 9)
    while (!hand.complete) {
      if (hand.actor === null) {
        advanceHand(hand)
      } else {
        applyAction(
          hand,
          hand.actor === 0 ? { type: legalActions(hand).owed ? 'call' : 'check' } : { type: 'fold' }
        )
      }
    }
    return hand
  })
}
const fields = [
  'hands',
  'opportunities',
  'vpip',
  'pfr',
  'sawFlop',
  'showdowns',
  'bets',
  'raises',
  'calls',
  'profit',
] as const
const totals = (group: Record<string, TableStat>) =>
  fields.map((field) => Object.values(group).reduce((sum, row) => sum + row[field], 0))

test('rotating position and fixed seat share counters and formulas but have different sample membership', () => {
  const stats = emptyTableStats()
  for (const hand of samples()) {
    addTableStats(stats, hand)
  }
  expect(tableStatValues(stats.seat['0']).vpipPercent).toBe('100.00')
  expect(tableStatValues(stats.position.BTN).vpipPercent).toBe('25.00')
  expect(stats.seat['0'].opportunities).toBe(4)
  expect(totals(stats.position)).toEqual(totals(stats.seat))
  expect(totals(stats.type)).toEqual(totals(stats.seat))
  expect(Object.values(stats.seat['0'].players!).map((p) => [p.label, p.hands])).toEqual([
    [styles[0].label, 2],
    ['历史更名测试', 2],
  ])
  for (const group of Object.values(stats)) {
    for (const row of Object.values(group)) {
      expect(Object.values(row.players!).reduce((sum, p) => sum + p.hands, 0)).toBe(row.hands)
    }
  }
})

test('legacy type membership is rebuilt per session without modifying journals or making solver requests', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'table-stats-'))
  try {
    const store = new WorkbenchStore(root)
    const runner = new TableRunner(store, () => {
      throw new Error('必须只读')
    })
    const run = await runner.create({
      mode: 'fast',
      seats: samples()[0].players.map((p) => p.config),
      hands: 4,
    })
    const stats = emptyTableStats()
    const hands = samples()
    for (const hand of hands) {
      addTableStats(stats, hand)
    }
    run.completed = 4
    run.stats = structuredClone(stats)
    for (const group of Object.values(run.stats)) {
      for (const row of Object.values(group)) {
        delete row.players
      }
    }
    await store.write(['table-runs', run.id, 'checkpoint.json'], run)
    const { mkdir, writeFile } = await import('node:fs/promises')
    await mkdir(store.path('table-runs', run.id, 'logs'))
    const path = store.path('table-runs', run.id, 'logs', 'hands-000000.jsonl')
    // A repeated settlement and an uncommitted next hand must not be counted.
    const journal =
      [...hands, hands[3], { ...hands[3], number: 5 }]
        .map((hand) => JSON.stringify({ kind: 'hand', ...hand }))
        .join('\n') + '\n'
    await writeFile(path, journal)
    const checkpoint = await readFile(store.path('table-runs', run.id, 'checkpoint.json'), 'utf8')
    const detail = await runner.detail(run.id)
    expect(detail.stats).toEqual(stats)
    expect(detail.statsNotice).toBeUndefined()
    expect(detail.requests).toBe(0)
    expect(await readFile(path, 'utf8')).toBe(journal)
    expect(await readFile(store.path('table-runs', run.id, 'checkpoint.json'), 'utf8')).toBe(
      checkpoint
    )
    const csv = await runner.csv(run.id)
    expect(csv).toContain('Session,已结算手数')
    expect(csv).toContain('历史更名测试 · 2 手')
    // A changed counter cannot be silently replaced with a reconstruction.
    const bad = structuredClone(run.stats)
    bad.position.BTN.vpip++
    await assert.rejects(readTableStatsPlayers(store, run.id, 4, bad), /不一致/)
    await writeFile(path, '')
    const unavailable = await new TableRunner(store).detail(run.id)
    expect(unavailable.stats).toEqual(run.stats)
    expect(unavailable.statsNotice).toContain('不完整')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
