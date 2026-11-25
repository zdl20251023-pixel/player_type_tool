import { expect, test } from 'bun:test'
import { readFile, rm } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
import type { AIRequestBody } from '../src/contracts/lookup'

test('standalone CLI calls only a local stub, saves raw results and reuses them for render and resume', async () => {
  let requests = 0
  const received: AIRequestBody[] = []
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      if (
        request.method !== 'POST' ||
        url.pathname !== '/lookup' ||
        url.search !== '?services=RL'
      ) {
        return new Response('wrong route', { status: 404 })
      }
      const body = (await request.json()) as AIRequestBody
      requests++
      received.push(body)
      const hero = body.hand.players.find((p) => p.hole_cards)!.seat_no
      return Response.json({
        request_id: body.request_id,
        solution_information: {
          source: 'local-test-only',
          strategy_profile_config: {
            matched_profile_name: body.strategy_profile?.target_profile_name as unknown,
          },
        },
        strategy: {
          actions: [
            {
              action: { action: 'fold', amount: null, pot_size: null, seat_no: hero },
              hand_strategy: 1,
              hand_ev: 0,
            },
          ],
          suggested_action: { action: 'fold', amount: null, pot_size: null, seat_no: hero },
        },
      })
    },
  })
  let runDirectory: string | undefined
  const invoke = async (args: string[]) => {
    const child = Bun.spawn([process.execPath, 'run', 'src/cli/lookup.ts', ...args], {
      env: {
        ...process.env,
        AI_SERVICE_URL: `http://127.0.0.1:${server.port}`,
        AI_USE_PROXY: 'false',
        AI_PROXY_URL: '',
        AI_REQUEST_TIMEOUT_MS: '3000',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    return { stdout, stderr, code }
  }
  try {
    const invalid = await invoke(['--scenario', 'S01,unknown', '--repeat', '1'])
    expect(invalid.code).toBe(1)
    expect(requests).toBe(0)
    const result = await invoke(['--scenario', 'S01,S02,S03', '--repeat', '1'])
    const match = /结果目录：([^\r\n]+)/.exec(result.stdout)
    if (match) {
      runDirectory = match[1].trim()
    }
    expect(result.code).toBe(0)
    expect(requests).toBe(9)
    expect(
      received.every(
        (r) => r.protocol_ver === 'v2.1' && r.disable_bet_randomness && r.hand.players.length === 6
      )
    ).toBe(true)
    expect(
      new Set(received.map((r) => r.strategy_profile?.target_profile_name as unknown))
    ).toEqual(new Set(['gto', 'vpip68-pfr7', 'vpip22-pfr16', 'af0.5-wtsd79', 'af5.8-wtsd46']))
    expect(runDirectory).toBeDefined()
    const session = JSON.parse(await readFile(resolve(runDirectory!, 'session.json'), 'utf8')) as {
      plan: { id: string }[]
    }
    const before = await Promise.all(
      session.plan.map((p) => readFile(resolve(runDirectory!, `${p.id}.json`), 'utf8'))
    )
    for (const mode of ['--render-only', '--resume']) {
      const reused = await invoke([mode, runDirectory!])
      expect(reused.code).toBe(0)
      expect(reused.stdout).toContain('新请求 0，复用 9')
      expect(requests).toBe(9)
    }
    const after = await Promise.all(
      session.plan.map((p) => readFile(resolve(runDirectory!, `${p.id}.json`), 'utf8'))
    )
    expect(after).toEqual(before)
    expect(await readFile(resolve(runDirectory!, 'report.html'), 'utf8')).toContain('LIVE DATA')
  } finally {
    await server.stop(true)
    if (runDirectory) {
      const withinRuns = relative(resolve('artifacts', 'runs'), resolve(runDirectory))
      if (withinRuns && !withinRuns.startsWith('..') && !isAbsolute(withinRuns)) {
        await rm(resolve(runDirectory), { recursive: true, force: true })
      }
    }
  }
}, 20000)
