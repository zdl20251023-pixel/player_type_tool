import { expect, test } from 'bun:test'
import { requestTimeoutMs } from '../src/client/config'

test('standalone timeout defaults to the original experiment setting and rejects invalid values', () => {
  const original = process.env.AI_REQUEST_TIMEOUT_MS
  try {
    delete process.env.AI_REQUEST_TIMEOUT_MS
    expect(requestTimeoutMs()).toBe(3000)
    process.env.AI_REQUEST_TIMEOUT_MS = '7500'
    expect(requestTimeoutMs()).toBe(7500)
    for (const value of ['0', '-1', 'NaN', '1.5', '']) {
      process.env.AI_REQUEST_TIMEOUT_MS = value
      expect(() => requestTimeoutMs()).toThrow('正整数')
    }
  } finally {
    if (original === undefined) {
      delete process.env.AI_REQUEST_TIMEOUT_MS
    } else {
      process.env.AI_REQUEST_TIMEOUT_MS = original
    }
  }
})

test('copied HTTP client retains explicit proxy and timeout configuration without a backend config table', async () => {
  const { AIServiceClient } = await import('../src/client/client')
  const direct = new AIServiceClient({
    rawBaseUrl: 'http://127.0.0.1:1',
    useProxy: false,
    proxyUrl: '',
  })
  expect(direct.isConfigured()).toBe(true)
  expect(direct.getAxiosInstance().defaults.proxy).toBe(false)
  expect(direct.getRequestTimeoutMs('lookup')).toBe(requestTimeoutMs())
  const proxied = new AIServiceClient({
    rawBaseUrl: 'https://solver.example.invalid',
    useProxy: true,
    proxyUrl: 'http://test-user:test-pass@127.0.0.1:9999',
  })
  expect(proxied.getAxiosInstance().defaults.baseURL).toBe('http://solver.example.invalid/')
  expect(proxied.getAxiosInstance().defaults.proxy).toMatchObject({
    protocol: 'http',
    host: '127.0.0.1',
    port: 9999,
    auth: { username: 'test-user', password: 'test-pass' },
  })
})
