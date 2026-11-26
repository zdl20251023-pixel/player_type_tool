import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import {
  builtinRoles,
  roleToPlayer,
  roleById,
  rolePercent,
  roleRatio,
  roleBoundaries,
  addRoleToDraft,
  ROLE_VERSION,
} from '../src/profiles/roles'
import { validPlayer } from '../src/profiles/catalog'
import { Workbench } from '../src/runner/workbench'
import { WorkbenchStore } from '../src/storage/workbench'
import { representativeFixtures } from '../src/scenarios/representative'
import { validTableConfig } from '../src/runner/table'

test('all 75 built-in roles exactly match the documented profiles and reference metrics', async () => {
  const doc = await Bun.file('docs/玩家风格75种组合档位方案.md').text()
  const rows = doc
    .split('\n')
    .filter((line) => /^\| L\d-A\d-F\d \|/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll('`', ''))
    )
  expect(rows).toHaveLength(75)
  expect(builtinRoles).toHaveLength(75)
  expect(new Set(builtinRoles.map((r) => r.id)).size).toBe(75)
  expect(new Set(builtinRoles.map((r) => `${r.preflop.name}/${r.postflop.name}`)).size).toBe(75)
  for (const row of rows) {
    const role = roleById(row[0])
    expect([
      role.preflop.name,
      rolePercent(role.preflop.vpip),
      rolePercent(role.preflop.pfr),
      rolePercent(roleRatio(role.preflop)),
      role.postflop.name,
      role.postflop.af.toFixed(4),
      rolePercent(role.postflop.wtsd),
    ]).toEqual(row.slice(4))
    expect(validPlayer(roleToPlayer(role))).toEqual(roleToPlayer(role))
    expect(role.version).toBe(ROLE_VERSION)
    expect(role.preflop.vpip).toBeGreaterThanOrEqual(roleBoundaries[role.l - 1].toNumber())
    expect(role.preflop.vpip).toBeLessThanOrEqual(roleBoundaries[role.l].toNumber())
  }
  expect(roleById('L3-A2-F3').preflop.name).toBe('gto')
  expect(roleById('L3-A2-F3').postflop.name).toBe('gto')
  expect(() =>
    validPlayer({
      ...roleToPlayer(builtinRoles[0]),
      sourceRole: { id: 'invented', version: ROLE_VERSION },
    })
  ).toThrow('来源角色')
})

test('draft selection is idempotent, bounded and does not overwrite collisions or mutate built-in templates', () => {
  const role = roleById('L4-A1-F1')
  const initial = JSON.stringify(builtinRoles)
  const selected = addRoleToDraft([], role)
  expect(addRoleToDraft(selected, role)).toBe(selected)
  expect(() => addRoleToDraft(selected, builtinRoles[0], 1)).toThrow('最多选择')
  expect(() => addRoleToDraft([{ ...selected[0], label: '现有用户配置' }], role)).toThrow(
    '不同配置'
  )
  selected[0].preflop = 'gto'
  selected[0].sourceRole!.version = 'edited'
  expect(JSON.stringify(builtinRoles)).toBe(initial)
})

test('role experiments and editable copies preserve saved players and historical experiment files', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'role-library-'))
  try {
    const store = new WorkbenchStore(root)
    const workbench = new Workbench(store)
    const settings = await workbench.settings()
    await store.write(['settings.json'], settings)
    const old = await workbench.create({
      name: '历史实验',
      requirements: '本机测试',
      players: settings.players,
      fixtures: [representativeFixtures[0]],
      repeats: 1,
    })
    const files = ['experiment.json', 'session.json', 'horizontal.json', 'report.html']
    const snapshots = await Promise.all(
      files.map((name) => readFile(store.path('runs', old.id, name), 'utf8'))
    )
    const settingsBytes = await readFile(store.path('settings.json'), 'utf8')
    const role = roleToPlayer(roleById('L5-A3-F5'))
    const next = await workbench.create({
      name: '角色实验',
      requirements: '本机测试',
      players: [role],
      fixtures: [representativeFixtures[0]],
      repeats: 1,
    })
    expect((await workbench.meta(next.id)).players[0]).toEqual(role)
    expect(await readFile(store.path('settings.json'), 'utf8')).toBe(settingsBytes)
    const copy = { ...role, id: 'my-role-copy', label: '可编辑副本', preflop: 'gto' }
    await workbench.saveSettings({ players: [...settings.players, copy] })
    expect((await workbench.settings()).players.slice(0, settings.players.length)).toEqual(
      settings.players
    )
    expect((await workbench.settings()).players.at(-1)?.sourceRole).toEqual(role.sourceRole)
    expect((await workbench.meta(next.id)).players[0]).toEqual(role)
    for (let i = 0; i < files.length; i++) {
      expect(await readFile(store.path('runs', old.id, files[i]), 'utf8')).toBe(snapshots[i])
    }
    const table = validTableConfig({ mode: 'watch', seats: Array.from({ length: 6 }, () => role) })
    expect(table.seats[0].sourceRole).toEqual(role.sourceRole)
    expect((await store.list('calls')).length).toBe(0)
    expect(next.status).toBe('draft')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
