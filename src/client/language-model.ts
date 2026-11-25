import { record } from '../analysis/strategy'
import { text } from '../profiles/catalog'
import type { ModelSettings, ModelImage, ModelOption } from '../contracts/workbench'
import { modelPresets } from './model-options'
import {
  readModelStream,
  ModelRequestError,
  type ModelProgressCallback,
  type ModelResult,
} from './model-stream'
export type { ModelResult } from './model-stream'

export const defaultModel: ModelSettings = {
  provider: 'deepseek',
  model: 'deepseek-flash',
  baseUrl: 'https://api.deepseek.com',
  temperature: 0.3,
  maxTokens: 8192,
  timeoutMs: 600000,
}

export function validModel(value: unknown): ModelSettings {
  const obj = record(value)
  if (obj.provider !== 'deepseek' && obj.provider !== 'gemini') {
    throw new Error('请选择 DeepSeek 或 Gemini')
  }
  const model = text(obj.model, '模型名称', 120)
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
    throw new Error('模型名称格式无效')
  }
  const baseUrl = text(obj.baseUrl, '模型 API 根地址', 400).replace(/\/+$/, '')
  const url = new URL(baseUrl)
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))
  ) {
    throw new Error('API 根地址使用 HTTPS，本机测试可使用 HTTP；不得内嵌密钥')
  }
  if (
    typeof obj.temperature !== 'number' ||
    obj.temperature < 0 ||
    obj.temperature > 2 ||
    !Number.isFinite(obj.temperature)
  ) {
    throw new Error('temperature 必须为 0..2')
  }
  for (const [key, min, max] of [
    ['maxTokens', 256, 32768],
    ['timeoutMs', 1000, 900000],
  ] as const) {
    if (!Number.isInteger(obj[key]) || Number(obj[key]) < min || Number(obj[key]) > max) {
      throw new Error(`${key} 必须为 ${min}..${max} 的整数`)
    }
  }
  return {
    provider: obj.provider,
    model,
    baseUrl,
    temperature: obj.temperature,
    maxTokens: Number(obj.maxTokens),
    timeoutMs: Number(obj.timeoutMs),
  }
}

export async function requestModel(
  settings: ModelSettings,
  apiKey: string,
  prompt: { system: string; user: string; images?: ModelImage[] },
  options: {
    quick?: boolean
    thinking?: 'enabled' | 'disabled'
    onProgress?: ModelProgressCallback
  } = {}
): Promise<ModelResult> {
  if (!apiKey) {
    throw new Error(`请配置 ${settings.provider} API Key（服务端环境或模型设置）`)
  }
  const gemini = settings.provider === 'gemini'
  const endpoint = gemini ? `/models/${settings.model}:generateContent` : '/chat/completions'
  const body = gemini
    ? {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt.user },
              ...(prompt.images ?? []).map((image) => ({
                inlineData: { mimeType: image.mimeType, data: image.data },
              })),
            ],
          },
        ],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens,
          responseMimeType: 'application/json',
        },
      }
    : {
        model: settings.model,
        messages: [
          { role: 'system', content: prompt.system },
          {
            role: 'user',
            content: prompt.images?.length
              ? [
                  { type: 'text', text: prompt.user },
                  ...prompt.images.map((image) => ({
                    type: 'image_url',
                    image_url: { url: `data:${image.mimeType};base64,${image.data}` },
                  })),
                ]
              : prompt.user,
          },
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: Boolean(options.onProgress),
        ...(options.onProgress ? { stream_options: { include_usage: true } } : {}),
        response_format: { type: 'json_object' },
        ...((options.quick || options.thinking) &&
        (settings.model === 'deepseek-flash' || settings.model.startsWith('deepseek-v4-'))
          ? { thinking: { type: options.quick ? 'disabled' : options.thinking } }
          : {}),
      }
  let response: Response
  const signal = AbortSignal.timeout(settings.timeoutMs)
  try {
    response = await fetch(`${settings.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(gemini ? { 'x-goog-api-key': apiKey } : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(body),
      signal,
      redirect: 'error',
    })
  } catch {
    throw new ModelRequestError(
      signal.aborted
        ? `大模型连接或等待响应超时（上限 ${settings.timeoutMs / 1000} 秒），请增加超时或稍后手动重试`
        : '大模型连接失败，请检查网络与服务配置后手动重试',
      signal.aborted ? 'timeout' : 'connection'
    )
  }
  // HTTP 错误正文可能回显密钥，不写入可下载记录或错误消息。
  if (!response.ok) {
    throw new Error(`大模型请求失败：HTTP ${response.status}`)
  }
  if (
    !gemini &&
    options.onProgress &&
    response.headers.get('content-type')?.includes('text/event-stream')
  ) {
    return readModelStream(response, signal, settings.timeoutMs, options.onProgress)
  }
  await options.onProgress?.({
    phase: 'receiving',
    contentChars: 0,
    reasoningChars: 0,
    lastResponseAt: new Date().toISOString(),
  })
  let responseText: string
  try {
    responseText = await response.text()
  } catch {
    throw new ModelRequestError(
      signal.aborted
        ? `大模型读取响应超时（上限 ${settings.timeoutMs / 1000} 秒），请增加超时或减少场景后手动重试`
        : '大模型读取响应时连接中断，请检查网络后手动重试',
      signal.aborted ? 'timeout' : 'connection'
    )
  }
  let raw: unknown
  try {
    raw = JSON.parse(responseText) as unknown
  } catch {
    return { raw: { unparsedBody: responseText }, content: '', usage: null }
  }
  const root = record(raw)
  const candidates = root.candidates as unknown[] | undefined
  const choices = root.choices as unknown[] | undefined
  const candidate = record(candidates?.[0])
  const choice = record(choices?.[0])
  const parts = record(candidate.content).parts
  const content = gemini
    ? Array.isArray(parts)
      ? (parts as unknown[])
          .filter((p) => !record(p).thought)
          .map((p) => (typeof record(p).text === 'string' ? (record(p).text as string) : ''))
          .join('')
      : ''
    : record(choice.message).content
  if (typeof content !== 'string' || !content.trim()) {
    return {
      raw,
      content: '',
      usage: root.usageMetadata ?? root.usage ?? null,
      finishReason: gemini ? (candidate.finishReason as string) : (choice.finish_reason as string),
    }
  }
  if (
    (gemini && candidate.finishReason !== 'STOP') ||
    (!gemini && choice.finish_reason !== 'stop')
  ) {
    // 保留原响应，后续解析会收到明确截断状态。
    return {
      raw,
      content: '',
      partialContent: content,
      incomplete: true,
      finishReason: String(gemini ? candidate.finishReason : choice.finish_reason),
      usage: root.usageMetadata ?? root.usage ?? null,
    }
  }
  return { raw, content, usage: root.usageMetadata ?? root.usage ?? null }
}

export async function listModels(settings: ModelSettings, apiKey: string): Promise<ModelOption[]> {
  if (!apiKey) {
    throw new Error('请填写对应服务商 API Key，或使用服务端已保存密钥')
  }
  const found = new Map<string, ModelOption>()
  let nextPage = ''
  const seenTokens = new Set<string>()
  const signal = AbortSignal.timeout(Math.min(settings.timeoutMs, 60000))
  for (let page = 0; page < 20; page++) {
    const url = new URL(`${settings.baseUrl}/models`)
    if (settings.provider === 'gemini') {
      url.searchParams.set('pageSize', '1000')
      if (nextPage) {
        url.searchParams.set('pageToken', nextPage)
      }
    }
    let response: Response
    try {
      response = await fetch(url, {
        headers:
          settings.provider === 'gemini'
            ? { 'x-goog-api-key': apiKey }
            : { Authorization: `Bearer ${apiKey}` },
        signal,
        redirect: 'error',
      })
    } catch {
      throw new Error('获取模型列表失败：连接失败或超时')
    }
    if (!response.ok) {
      throw new Error(`获取模型列表失败：HTTP ${response.status}`)
    }
    let body: Record<string, unknown>
    try {
      body = record(await response.json())
    } catch {
      throw new Error('模型列表响应不是有效 JSON')
    }
    const entries = settings.provider === 'gemini' ? body.models : body.data
    if (!Array.isArray(entries)) {
      throw new Error('模型列表响应格式无效')
    }
    for (const entry of entries as unknown[]) {
      const obj = record(entry)
      const id =
        settings.provider === 'gemini'
          ? typeof obj.name === 'string'
            ? obj.name.replace(/^models\//, '')
            : ''
          : obj.id
      if (typeof id !== 'string' || !/^[A-Za-z0-9._-]{1,120}$/.test(id)) {
        continue
      }
      if (
        settings.provider === 'gemini' &&
        !(
          Array.isArray(obj.supportedGenerationMethods) &&
          obj.supportedGenerationMethods.includes('generateContent')
        )
      ) {
        continue
      }
      const known = modelPresets[settings.provider].find((p) => p.id === id)
      const modalities = obj.input_modalities
      found.set(id, {
        id,
        label:
          typeof obj.displayName === 'string'
            ? obj.displayName
            : typeof obj.name === 'string' && settings.provider === 'deepseek'
              ? obj.name
              : (known?.label ?? id),
        vision: Array.isArray(modalities) ? modalities.includes('image') : (known?.vision ?? null),
        note: Array.isArray(modalities)
          ? `服务端声明输入：${modalities.filter((m): m is string => typeof m === 'string').join('、')}`
          : (known?.note ?? '服务端未声明图片能力，可通过图片测试确认'),
        source: 'remote',
      })
    }
    if (settings.provider !== 'gemini' || !body.nextPageToken) {
      return [...found.values()]
    }
    if (typeof body.nextPageToken !== 'string' || seenTokens.has(body.nextPageToken)) {
      throw new Error('模型列表分页无效')
    }
    nextPage = body.nextPageToken
    seenTokens.add(nextPage)
  }
  throw new Error('模型列表分页过多，请检查 API 服务')
}

export function parseModelJson(content: string): unknown {
  if (!content) {
    throw new Error(
      '模型未返回完整内容（可能截断或被拦截），原始响应已保存；请调整输出上限或减少数量'
    )
  }
  try {
    return JSON.parse(
      content.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '')
    ) as unknown
  } catch {
    throw new Error('模型返回的 JSON 无效，原始响应已保存；请调整提示词后重试')
  }
}
