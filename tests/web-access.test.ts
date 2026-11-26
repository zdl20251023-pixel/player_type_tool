import { expect, test } from 'bun:test'
import { webAccess } from '../src/web/access'
import { createWebHandler } from '../src/web/server'

test('LAN binding is explicit, accepts exact IP addresses and keeps default access local', () => {
  expect(webAccess().hostname).toBe('127.0.0.1')
  expect(webAccess().allowedHosts).not.toContain('10.10.1.12')
  expect(webAccess('0.0.0.0', '10.10.1.12, 10.10.1.12').allowedHosts).toEqual([
    'localhost',
    '127.0.0.1',
    '[::1]',
    '10.10.1.12',
  ])
  expect(webAccess('10.10.1.12').allowedHosts).toContain('10.10.1.12')
  expect(webAccess('::', 'fe80::1').allowedHosts).toContain('[fe80::1]')
  expect(() => webAccess('0.0.0.0')).toThrow('WEB_ALLOWED_HOSTS')
  expect(() => webAccess('0.0.0.0', '*')).toThrow('IP 地址')
  expect(() => webAccess('0.0.0.0', '0.0.0.0')).toThrow('实际访问 IP')
  expect(() => webAccess('https://10.10.1.12')).toThrow('IP 地址')
})

test('local HTTP accepts configured LAN hosts and same-origin requests, rejects unrelated hosts and cross-origin writes', async () => {
  const handler = createWebHandler(
    undefined,
    new Blob(['lan-test-bundle']),
    undefined,
    webAccess('0.0.0.0', '10.10.1.12')
  )
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: handler })
  const base = `http://127.0.0.1:${server.port}`
  try {
    const local = await fetch(`${base}/app.js`)
    expect(local.status).toBe(200)
    const lanHost = `10.10.1.12:${server.port}`
    const lan = await fetch(`${base}/app.js`, {
      headers: { Host: lanHost, Origin: `http://${lanHost}` },
    })
    expect(lan.status).toBe(200)
    expect(await lan.text()).toContain('lan-test-bundle')
    const denied = await fetch(`${base}/app.js`, { headers: { Host: `10.10.1.13:${server.port}` } })
    expect(denied.status).toBe(403)
    const cross = await fetch(`${base}/api/model/test`, {
      method: 'POST',
      headers: {
        Host: lanHost,
        Origin: 'http://unrelated.invalid',
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    expect(cross.status).toBe(403)
    expect(await cross.text()).toContain('拒绝跨来源请求')
    const defaultOnly = createWebHandler(undefined, new Blob(['local-only']))
    expect((await defaultOnly(new Request('http://10.10.1.12:3210/app.js'))).status).toBe(403)
  } finally {
    await server.stop(true)
  }
})
