import { expect, test } from 'bun:test'
import { runInNewContext } from 'node:vm'
import { defaultPrompts } from '../src/analysis/prompts'
import { defaultModel } from '../src/client/language-model'
import { styles } from '../src/profiles/styles'
import { representativeFixtures } from '../src/scenarios/representative'
import { catalogOptions } from '../src/profiles/catalog'
import { createWebHandler } from '../src/web/server'

test('current browser bundle renders settings against old bootstrap and recovers navigation without missing form fields', async () => {
  const built = await Bun.build({
    entrypoints: ['src/web/app.ts'],
    target: 'browser',
  })
  expect(built.success).toBe(true)
  const script = await built.outputs[0].text()
  // 模拟旧服务的响应：没有 modelPresets 字段。
  const bootstrap = {
    settings: {
      model: defaultModel,
      players: styles.map((s) => ({ ...s, description: '测试玩家' })),
      prompts: defaultPrompts(),
      keys: { deepseek: false, gemini: false },
      solverConfigured: false,
    },
    catalog: catalogOptions(),
    fixtures: representativeFixtures,
    defaults: defaultPrompts(),
  }
  const listeners = new Map<string, () => void>()
  const documentListeners = new Map<string, (event: MouseEvent) => void>()
  let failTableRender = false
  const fields = new Map<
    string,
    { value: string; textContent: string; hidden: boolean; addEventListener: () => void }
  >()
  let html = ''
  let errorText = ''
  const root = {
    addEventListener() {},
    set innerHTML(value: string) {
      if (failTableRender && value.includes('六人 AI 牌桌')) {
        failTableRender = false
        throw new Error('测试渲染中断')
      }
      html = value
      fields.clear()
      // 仅实现应用访问的表单 DOM。未渲染的控件返回 null，复现原始第二次异常。
      const controls = [
        ...value.matchAll(/<(textarea|select)\b([^>]*\bid="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g),
        ...value.matchAll(/<(input)\b([^>]*\bid="([^"]+)"[^>]*)>/g),
      ]
      for (const match of controls) {
        const tag = match[1]
        const body = match[4] ?? ''
        const options = [
          ...body.matchAll(/<option\b([^>]*)value="([^"]*)"([^>]*)>([\s\S]*?)<\/option>/g),
        ]
        const selected = options.find((m) => `${m[1]}${m[3]}`.includes('selected')) ?? options[0]
        const content =
          tag === 'select'
            ? (selected?.[2] ?? '')
            : tag === 'textarea'
              ? body
              : (/\bvalue="([^"]*)"/.exec(match[2])?.[1] ?? '')
        fields.set(match[3], {
          value: content,
          textContent: '',
          hidden: false,
          addEventListener() {},
        })
      }
      for (const [, id] of value.matchAll(/\bid="([^"]+)"/g)) {
        if (fields.has(id)) {
          continue
        }
        fields.set(id, { value: '', textContent: '', hidden: false, addEventListener() {} })
      }
    },
    get innerHTML() {
      return html
    },
    set textContent(value: string) {
      errorText = value
    },
  }
  const location = { hash: '#experiment' }
  const document = {
    querySelector: () => root,
    querySelectorAll: () => [],
    addEventListener(event: string, listener: (event: MouseEvent) => void) {
      documentListeners.set(event, listener)
    },
    getElementById: (id: string) =>
      id === 'close-preview' ? { addEventListener() {} } : (fields.get(id) ?? null),
  }
  runInNewContext(script, {
    document,
    location,
    window: {
      addEventListener: (event: string, listener: () => void) => listeners.set(event, listener),
      scrollTo() {},
    },
    fetch: () => Promise.resolve(Response.json(bootstrap)),
    structuredClone,
    Error,
    console,
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout,
    clearTimeout,
  })
  for (let i = 0; i < 30 && !html; i++) {
    await Bun.sleep(5)
  }
  expect(errorText).toBe('')
  expect(html).toContain('玩家风格实验工作台')
  location.hash = '#settings'
  expect(() => listeners.get('hashchange')!()).not.toThrow()
  expect(html).toContain('DeepSeek V4 Pro')
  expect(html).toContain('快速测试大模型')
  location.hash = '#table'
  expect(() => listeners.get('hashchange')!()).not.toThrow()
  expect(html).toContain('牌桌设置')
  let prevented = false
  const navClick = {
    button: 0,
    preventDefault() {
      prevented = true
    },
    target: {
      closest(selector: string) {
        return selector === 'nav a[data-page]' ? { dataset: { page: 'table' } } : null
      },
    },
  } as unknown as MouseEvent
  failTableRender = true
  documentListeners.get('click')!(navClick)
  expect(prevented).toBe(true)
  expect(html).toContain('页面未能加载')
  expect(html).toContain('测试渲染中断')
  // The hash is unchanged: clicking the same navigation must recover the page.
  documentListeners.get('click')!(navClick)
  expect(html).toContain('六人 AI 牌桌')
  expect(html).toContain('牌桌设置')
  location.hash = '#settings'
  expect(() => listeners.get('hashchange')!()).not.toThrow()
  // 模拟已失败的设置页，随后切换回其他导航。
  fields.delete('prompt-system')
  fields.delete('prompt-template')
  location.hash = '#catalog'
  expect(() => listeners.get('hashchange')!()).not.toThrow()
  expect(html).toContain('策略档位浏览')
  location.hash = '#settings'
  expect(() => listeners.get('hashchange')!()).not.toThrow()
  expect(html).toContain('快速测试大模型')
})

test('each server handler serves its own immutable frontend bundle', async () => {
  const first = createWebHandler(undefined, new Blob(['first-bundle']))
  const second = createWebHandler(undefined, new Blob(['second-bundle']))
  const request = () => new Request('http://127.0.0.1:3217/app.js')
  expect(await (await first(request())).text()).toBe('first-bundle')
  expect(await (await second(request())).text()).toBe('second-bundle')
  expect(await (await first(request())).text()).toBe('first-bundle')
})
