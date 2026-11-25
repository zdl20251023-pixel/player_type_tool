import { expect, test } from 'bun:test'
import { mkdtemp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, relative, isAbsolute } from 'node:path'
import { defaultModel, listModels, requestModel } from '../src/client/language-model'
import { modelPresets, validImages } from '../src/client/model-options'
import { Workbench } from '../src/runner/workbench'
import { WorkbenchStore } from '../src/storage/workbench'
import { createWebHandler } from '../src/web/server'
import { record } from '../src/analysis/strategy'
import type { ModelImage } from '../src/contracts/workbench'

const image: ModelImage = {
  name: 'test.png',
  mimeType: 'image/png',
  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSf8AAAAASUVORK5CYII=',
}

test('image validation rejects unsupported models, false file types, malformed data and oversized uploads', () => {
  expect(modelPresets.deepseek.some((m) => m.id === 'deepseek-v4-pro')).toBe(true)
  expect(validImages([image], defaultModel)).toEqual([image])
  expect(() => validImages([image], { ...defaultModel, model: 'deepseek-v4-pro' })).toThrow(
    '不支持图片'
  )
  expect(() => validImages([{ ...image, mimeType: 'image/jpeg' }])).toThrow('格式一致')
  expect(() => validImages([{ ...image, data: 'not-base64' }])).toThrow('编码无效')
  expect(() => validImages(Array(5).fill(image))).toThrow('最多上传')
  expect(() =>
    validImages([{ ...image, data: Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64') }])
  ).toThrow('2 MiB')
})

test('provider model discovery authenticates, follows Gemini pages and filters unsupported API methods', async () => {
  const pages: string[] = []
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(req) {
      const url = new URL(req.url)
      expect(url.searchParams.has('key')).toBe(false)
      if (url.pathname === '/models') {
        expect(req.headers.get('authorization')).toBe('Bearer local-key')
        return Response.json({
          data: [
            { id: 'deepseek-v4-pro', name: 'Pro', input_modalities: ['text'] },
            { id: 'future-vision', input_modalities: ['text', 'image'] },
          ],
        })
      }
      expect(url.pathname).toBe('/v1beta/models')
      expect(req.headers.get('x-goog-api-key')).toBe('local-key')
      pages.push(url.searchParams.get('pageToken') ?? '')
      return pages.length === 1
        ? Response.json({
            models: [
              {
                name: 'models/gemini-4-carbon',
                displayName: 'Carbon',
                supportedGenerationMethods: ['generateContent'],
              },
              { name: 'models/embedding', supportedGenerationMethods: ['embedContent'] },
            ],
            nextPageToken: 'page+2',
          })
        : Response.json({
            models: [
              { name: 'models/new-gemini-vision', supportedGenerationMethods: ['generateContent'] },
            ],
          })
    },
  })
  try {
    const base = `http://127.0.0.1:${server.port}`
    const deepseek = await listModels({ ...defaultModel, baseUrl: base }, 'local-key')
    expect(deepseek.map((m) => [m.id, m.vision])).toEqual([
      ['deepseek-v4-pro', false],
      ['future-vision', true],
    ])
    const gemini = await listModels(
      { ...defaultModel, provider: 'gemini', baseUrl: `${base}/v1beta` },
      'local-key'
    )
    expect(pages).toEqual(['', 'page+2'])
    expect(gemini.map((m) => m.id)).toEqual(['gemini-4-carbon', 'new-gemini-vision'])
    expect(gemini[1].vision).toBeNull()
  } finally {
    await server.stop(true)
  }
})

test('Gemini image requests send inlineData alongside text and preserve structured response handling', async () => {
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      expect(req.headers.get('x-goog-api-key')).toBe('local-key')
      const body = record(await req.json())
      const contents = body.contents as { parts: unknown[] }[]
      expect(contents[0].parts).toEqual([
        { text: '识别截图' },
        { inlineData: { mimeType: 'image/png', data: image.data } },
      ])
      return Response.json({
        modelVersion: 'test-vision',
        candidates: [
          { finishReason: 'STOP', content: { parts: [{ text: '{"reply":"识别完成"}' }] } },
        ],
      })
    },
  })
  try {
    const result = await requestModel(
      {
        ...defaultModel,
        provider: 'gemini',
        model: 'test-vision',
        baseUrl: `http://127.0.0.1:${server.port}`,
      },
      'local-key',
      { system: 'JSON', user: '识别截图', images: [image] }
    )
    expect(JSON.parse(result.content)).toEqual({ reply: '识别完成' })
  } finally {
    await server.stop(true)
  }
})

test('quick model API uses unsaved form configuration, sends images, records results without credentials and never calls solver', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'player-model-tools-'))
  let requests = 0
  let unauthorized = false
  const upstream = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      requests++
      const url = new URL(req.url)
      if (url.pathname === '/models') {
        return Response.json({
          data: [
            { id: 'deepseek-flash', input_modalities: ['text', 'image'] },
            { id: 'deepseek-v4-pro', input_modalities: ['text'] },
          ],
        })
      }
      expect(url.pathname).toBe('/chat/completions')
      expect(req.headers.get('authorization')).toBe('Bearer ephemeral-local-key')
      if (unauthorized) {
        return Response.json({ error: 'ephemeral-local-key' }, { status: 401 })
      }
      const body = record(await req.json())
      expect(body.model).toBe('deepseek-flash')
      expect(Number(body.max_tokens)).toBeLessThanOrEqual(2048)
      expect(body.thinking).toEqual({ type: 'disabled' })
      const messages = body.messages as { content: unknown }[]
      expect(messages[1].content).toEqual([
        { type: 'text', text: '识别测试图' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${image.data}` } },
      ])
      return Response.json({
        model: 'test-flash-version',
        choices: [{ finish_reason: 'stop', message: { content: '{"reply":"已读取测试图"}' } }],
        usage: { prompt_tokens: 30, completion_tokens: 8 },
      })
    },
  })
  const store = new WorkbenchStore(root)
  const workbench = new Workbench(store)
  const handler = createWebHandler(workbench)
  const post = async (path: string, body: unknown) => {
    const response = await handler(
      new Request(`http://127.0.0.1:3217/api${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
    return { status: response.status, value: record(await response.json()) }
  }
  const form = {
    model: { ...defaultModel, baseUrl: `http://127.0.0.1:${upstream.port}` },
    apiKey: 'ephemeral-local-key',
  }
  try {
    const before = await workbench.settings()
    expect((await post('/model/models', form)).status).toBe(200)
    const result = await post('/model/test', { ...form, message: '识别测试图', images: [image] })
    expect(result.status).toBe(200)
    expect(record(result.value.result).reply).toBe('已读取测试图')
    expect(record(result.value.result).returnedModel).toBe('test-flash-version')
    expect(record(result.value.result).imageCount).toBe(1)
    expect((await workbench.settings()).model).toEqual(before.model)
    expect(await readdir(root)).not.toContain('settings.json')
    expect(await readdir(root)).not.toContain('secrets.json')
    const snapshot = await store.read<Record<string, unknown>>([
      'calls',
      String(result.value.callId),
      'request.json',
    ])
    expect(snapshot.task).toBe('test')
    expect(snapshot.images).toEqual([image])
    expect(JSON.stringify(snapshot)).not.toContain('ephemeral-local-key')
    expect(requests).toBe(2)
    const pro = await post('/model/test', {
      ...form,
      model: { ...form.model, model: 'deepseek-v4-pro' },
      images: [image],
    })
    expect(pro.status).toBe(400)
    expect(requests).toBe(2)
    await workbench.saveSettings({ model: form.model })
    const preview = await post('/model/preview', {
      task: 'player',
      description: '根据截图推荐玩家风格',
      images: [image],
    })
    expect(preview.status).toBe(200)
    expect(preview.value.images).toEqual([image])
    expect(requests).toBe(2)
    unauthorized = true
    const failed = await post('/model/test', { ...form, images: [image], message: '识别测试图' })
    expect(failed.status).toBe(400)
    expect(String(failed.value.error)).toContain('HTTP 401')
    expect(JSON.stringify(failed.value)).not.toContain('ephemeral-local-key')
    expect(requests).toBe(3)
  } finally {
    await upstream.stop(true)
    const insideTemp = relative(tmpdir(), root)
    if (insideTemp && !insideTemp.startsWith('..') && !isAbsolute(insideTemp)) {
      await rm(root, { recursive: true, force: true })
    }
  }
})
