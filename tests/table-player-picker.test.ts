import { expect, test } from 'bun:test'
import { TableUI } from '../src/web/table'
import { roleById, roleToPlayer } from '../src/profiles/roles'
import { styles } from '../src/profiles/styles'
import { emptyTableStats } from '../src/analysis/table-stats'
import { newHand } from '../src/table/engine'
import { validTableConfig } from '../src/runner/table'
import { mergeTableSeats, sameTablePlayer, tableSeatState } from '../src/web/table-players'
import type { TableRun, TableConfig } from '../src/contracts/table'
import type { PlayerConfig } from '../src/contracts/workbench'
import { TablePlayerPicker } from '../src/web/table-player-picker'

test('seat snapshots distinguish unsaved, queued and active players while polls preserve local edits', () => {
  const old = roleToPlayer(roleById('L4-A1-F1'))
  const next = roleToPlayer(roleById('L1-A3-F5'))
  const local = roleToPlayer(roleById('L3-A2-F3'))
  expect(tableSeatState(next)).toBe('new')
  expect(tableSeatState(next, old, old)).toBe('dirty')
  expect(tableSeatState(next, next, old)).toBe('queued')
  expect(tableSeatState(next, next, next)).toBe('active')
  const saved = [old, old],
    draft = [local, old]
  const original = JSON.stringify([saved, draft])
  const merged = mergeTableSeats(draft, saved, [next, next])
  expect(merged).toEqual([local, next])
  merged[0].label = 'changed'
  expect(JSON.stringify([saved, draft])).toBe(original)
  expect(sameTablePlayer(old, { ...old, label: '同 ID 的编辑配置' })).toBe(false)
})

test('seat picker commits only on confirmation; save queues snapshots and refresh preserves pending and historical data', async () => {
  const oldDocument = globalThis.document,
    oldStorage = globalThis.localStorage
  const dialog = {
    innerHTML: '',
    open: false,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  globalThis.document = {
    getElementById: (id: string) => (id === 'table-player-dialog' ? dialog : null),
    querySelector: () => null,
  } as unknown as Document
  globalThis.localStorage = { getItem: () => null, setItem: () => {} } as unknown as Storage
  const players: PlayerConfig[] = styles.map((s) => ({ ...s, description: '个人预设' }))
  const originalPlayers = JSON.stringify(players)
  const config: TableConfig = {
    mode: 'watch',
    seats: Array.from({ length: 6 }, (_, i) => players[i % 3]),
    hands: 10,
    seed: 1,
    actionDelayMs: 2000,
    handDelayMs: 5000,
    animations: false,
    autoNext: false,
    autoRebuy: false,
  }
  let server: TableRun = {
    version: 1,
    id: 'picker-qa',
    createdAt: '2026-11-26T00:00:00.000Z',
    updatedAt: '2026-11-26T00:00:00.000Z',
    config: structuredClone(config),
    nextSeats: null,
    status: 'paused',
    phase: 'paused',
    dueAt: null,
    problem: null,
    completed: 0,
    requests: 0,
    reused: 0,
    errors: 0,
    hand: newHand(1, 0, config.seats, Array<number>(6).fill(10000), 1),
    stacks: Array<number>(6).fill(10000),
    rebuys: Array<number>(6).fill(0),
    stats: emptyTableStats(),
    events: [],
    recentHands: [],
    lastDecision: null,
  }
  const originalHand = JSON.stringify(server.hand)
  const posts: TableConfig[] = []
  const ui = new TableUI({
    players: () => players,
    notice: () => {},
    api: <T>(path: string, value?: unknown) => {
      if (path.endsWith('/configure')) {
        posts.push(structuredClone(value as TableConfig))
        server.nextSeats = structuredClone((value as TableConfig).seats)
        server.updatedAt = '2026-11-26T00:00:01.000Z'
      }
      return Promise.resolve(structuredClone(server) as T)
    },
  })
  const role = roleToPlayer(roleById('L5-A3-F5'))
  const choose = () =>
    ui.pickerChange({
      dataset: { seatPickerKey: 'builtin:L5-A3-F5' },
    } as unknown as HTMLInputElement)
  const btn = { dataset: {} } as unknown as HTMLButtonElement
  try {
    await ui.open(server.id)
    await ui.choosePlayer(0)
    expect(dialog.innerHTML).toContain('75 个可选配置')
    choose()
    ui.pickerClick('seat-picker-close', btn)
    expect(ui.view()).not.toContain(role.label)
    expect(posts).toHaveLength(0)
    for (const seat of [0, 1]) {
      await ui.choosePlayer(seat)
      choose()
      ui.pickerClick('seat-picker-apply', btn)
    }
    expect(ui.view()).toContain('state-dirty')
    expect(posts).toHaveLength(0)
    expect(JSON.stringify(server.hand)).toBe(originalHand)
    await ui.refresh()
    expect(ui.view()).toContain(role.label)
    await ui.configure()
    expect(posts).toHaveLength(1)
    expect(validTableConfig(posts[0]).seats.slice(0, 2)).toEqual([role, role])
    expect(ui.view()).toContain('已保存，下手生效')
    expect(JSON.stringify(server.hand)).toBe(originalHand)
    await ui.open(server.id)
    expect(ui.view()).toContain('已保存，下手生效')
    const stale = structuredClone(server)
    server.config.seats = structuredClone(server.nextSeats!)
    server.nextSeats = null
    server.hand = newHand(2, 1, server.config.seats, Array<number>(6).fill(10000), 2)
    server.updatedAt = '2026-11-26T00:00:02.000Z'
    await ui.refresh()
    expect(ui.view()).not.toContain('已保存，下手生效')
    expect(ui.view()).toContain('当前 CO')
    server = stale
    await ui.refresh()
    expect(ui.view()).not.toContain('已保存，下手生效')
    expect(JSON.stringify(players)).toBe(originalPlayers)
  } finally {
    globalThis.document = oldDocument
    globalThis.localStorage = oldStorage
  }
})

test('personal picker retains an exact legacy snapshot and rejects applying into a different table context', () => {
  const oldDocument = globalThis.document
  const dialog = {
    innerHTML: '',
    open: false,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  globalThis.document = {
    getElementById: (id: string) => (id === 'table-player-dialog' ? dialog : null),
  } as unknown as Document
  const legacy = { ...roleToPlayer(roleById('L4-A1-F1')), label: '历史配置快照' }
  let context = 'first',
    applied = 0
  const picker = new TablePlayerPicker({
    players: () => [{ ...legacy, label: '同 ID 的新配置' }],
    current: () => legacy,
    context: () => context,
    apply: () => {
      applied++
    },
  })
  try {
    picker.open(3)
    picker.click('seat-picker-source', {
      dataset: { source: 'personal' },
    } as unknown as HTMLButtonElement)
    expect(dialog.innerHTML).toContain('历史配置快照')
    expect(dialog.innerHTML).toContain('同 ID 的新配置')
    picker.click('seat-picker-detail', {
      dataset: { key: 'current' },
    } as unknown as HTMLButtonElement)
    expect(dialog.innerHTML).toContain('当前座位快照')
    context = 'other'
    expect(() =>
      picker.click('seat-picker-apply', { dataset: {} } as unknown as HTMLButtonElement)
    ).toThrow('牌桌已切换')
    expect(applied).toBe(0)
  } finally {
    globalThis.document = oldDocument
  }
})
