import assert from 'node:assert/strict'
import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { buildRequest, scenarios, styles, profileFor } from '../src/scenarios'
import {
  readSession,
  readCachedRun,
  writeJson,
  type SessionType,
  type CachedRunType,
} from '../src/storage/session'
import { reportData, renderHtml } from '../src/reports/html'

function fixture() {
  const scenario = structuredClone(scenarios.find((s) => s.id === 'P02')!)
  const plan = styles.map((style, index) => ({
    id: `P02-1-${index}`,
    scenario: 'P02',
    description: scenario.description,
    style: style.id,
    profile: profileFor(style, scenario.street),
    repeat: 1,
    request: buildRequest(scenario, profileFor(style, scenario.street), `request-${index}`),
  }))
  const session: SessionType = {
    version: 1,
    runId: 'offline-test',
    createdAt: '2026-11-25T00:00:00Z',
    repeats: 1,
    scenarios: [scenario],
    plan,
  }
  const runs: CachedRunType[] = plan.map((p) => ({
    ...p,
    httpStatus: 200,
    ok: true,
    elapsedMs: 1,
    problem: null,
    response: {
      solution_information: {
        source: 'test-model',
        strategy_profile_config: { matched_profile_name: p.profile },
      },
      strategy: {
        actions: [
          {
            action: { action: 'fold', amount: null, pot_size: null, seat_no: scenario.hero },
            hand_strategy: 1,
            hand_ev: 0,
          },
        ],
        suggested_action: { action: 'fold', amount: null, seat_no: scenario.hero },
      },
    },
  }))
  return { session, runs }
}

test('render-only and fully cached resume run without an AI URL or client initialization', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'lookup-report-'))
  try {
    const { session, runs } = fixture()
    await writeJson(directory, 'session.json', session)
    for (const run of runs) {
      await writeJson(directory, `${run.id}.json`, run)
    }
    for (const option of ['--render-only', '--resume']) {
      const child = Bun.spawn([process.execPath, 'run', 'src/cli/lookup.ts', option, directory], {
        env: { ...process.env, AI_SERVICE_URL: '' },
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ])
      expect(code).toBe(0)
      expect(stderr).not.toContain('AI Service')
      expect(stdout).toContain('新请求 0，复用 3')
      const html = await readFile(resolve(directory, 'report.html'), 'utf8')
      expect(html).toContain('"id":"P02"')
      expect(html).toContain('LIVE DATA')
    }
    const saved = await readSession(directory)
    expect(saved.scenarios).toEqual(session.scenarios)
    const corrupted = { ...runs[0], request: { ...runs[0].request, request_id: 'wrong' } }
    await writeJson(directory, `${runs[0].id}.json`, corrupted)
    await assert.rejects(readCachedRun(directory, session.plan[0]), /不匹配/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 20000)

test('missing styles stay missing; partial samples never count as style-confirmed', () => {
  const { session, runs } = fixture()
  const partial = reportData(session, [runs[0]])
  expect(partial.counts.incomplete).toBe(1)
  expect(partial.scenes[0].styles[1].rates).toBeNull()
  expect(partial.scenes[0].actions[0].cells[1].probability).toBeNull()
  expect(partial.aggregates[0].samples).toBe(0)
})

test('embedded solver content cannot close the JSON script element', async () => {
  const { session, runs } = fixture()
  session.scenarios[0].description = '</script><img src=x onerror=alert(1)>'
  const html = await renderHtml(session, runs)
  expect(html).not.toContain('</script><img')
  expect(html).toContain('\\u003c/script>')
})

test('structured fixtures match approved document IDs, hole cards, boards and positions', async () => {
  const md = await readFile(resolve('docs/100条行动线场景设计.md'), 'utf8')
  const rows = md
    .split('\n')
    .filter((line) => /^\| [PFTR]\d{2} \|/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    )
  const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']
  expect(rows).toHaveLength(100)
  for (const row of rows) {
    const s = scenarios.find((s) => s.id === row[0])!
    const hole = s.hand.players[s.hero].hole_cards!
    expect(row[2]).toContain(hole)
    expect(row[s.street === 'preflop' ? 1 : 2]).toContain(positions[s.hero])
    if (s.street !== 'preflop') {
      const board = s.hand.actions.entries
        .filter((a) => a.seat_no === -1)
        .map((a) => a.action)
        .join('')
      expect(row[3].replace(/[` /]/g, '')).toBe(board)
    }
  }
})
