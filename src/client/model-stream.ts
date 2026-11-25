import { record } from '../analysis/strategy'
import type { ModelProgress } from '../contracts/workbench'

export interface ModelResult {
  raw: unknown
  content: string
  usage: unknown
  finishReason?: string | null
  partialContent?: string
  incomplete?: boolean
}
export class ModelRequestError extends Error {
  constructor(
    message: string,
    readonly kind: 'timeout' | 'connection' | 'interrupted' | 'output-limit' | 'filtered' | 'empty',
    readonly partial: ModelResult | null = null
  ) {
    super(message)
    this.name = 'ModelRequestError'
  }
}
export type ModelProgressCallback = (
  progress: ModelProgress,
  partial?: ModelResult
) => Promise<void>

export async function readModelStream(
  response: Response,
  signal: AbortSignal,
  timeoutMs: number,
  onProgress: ModelProgressCallback
): Promise<ModelResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  let reasoningChars = 0
  let finishReason: string | null = null
  let usage: unknown = null
  let model: unknown = null
  let lastProgress = -Infinity
  const chunks: unknown[] = []
  const snapshot = (): ModelResult => ({
    raw: { stream: true, complete: finishReason === 'stop', model, chunks },
    content,
    usage,
  })
  const consume = async (event: string) => {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
      .trim()
    if (!data || data === '[DONE]') {
      return
    }
    let chunk: unknown
    try {
      chunk = JSON.parse(data) as unknown
    } catch {
      throw new ModelRequestError('模型流式响应格式无效，已保留接收片段', 'interrupted', snapshot())
    }
    chunks.push(chunk)
    const obj = record(chunk)
    if (obj.error) {
      throw new ModelRequestError(
        '模型在输出过程中返回错误，已保留接收片段',
        'interrupted',
        snapshot()
      )
    }
    const choice = record(Array.isArray(obj.choices) ? obj.choices[0] : undefined)
    const delta = record(choice.delta)
    if (typeof delta.content === 'string') {
      content += delta.content
    }
    if (typeof delta.reasoning_content === 'string') {
      reasoningChars += delta.reasoning_content.length
    }
    if (typeof choice.finish_reason === 'string') {
      finishReason = choice.finish_reason
    }
    if (obj.usage) {
      usage = obj.usage
    }
    if (obj.model) {
      model = obj.model
    }
    if (performance.now() - lastProgress >= 1000 || finishReason !== null) {
      lastProgress = performance.now()
      await onProgress(
        {
          phase: 'receiving',
          contentChars: content.length,
          reasoningChars,
          lastResponseAt: new Date().toISOString(),
        },
        snapshot()
      )
    }
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let boundary: RegExpExecArray | null
      while ((boundary = /\r?\n\r?\n/.exec(buffer)) !== null) {
        const event = buffer.slice(0, boundary.index)
        buffer = buffer.slice(boundary.index + boundary[0].length)
        await consume(event)
      }
      if (done) {
        if (buffer.trim()) {
          await consume(buffer)
        }
        break
      }
    }
  } catch (error) {
    if (error instanceof ModelRequestError) {
      throw error
    }
    throw new ModelRequestError(
      signal.aborted
        ? `大模型接收响应超时（上限 ${timeoutMs / 1000} 秒），已保留接收片段；可增加超时或减少场景后手动重试`
        : '大模型响应中途断开，已保留接收片段；请检查网络后手动重试',
      signal.aborted ? 'timeout' : 'connection',
      snapshot()
    )
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* 已中断的连接无需再次读取 */
    }
    reader.releaseLock()
  }
  if (finishReason === null) {
    throw new ModelRequestError(
      '大模型流式响应未完整结束，已保留接收片段',
      'interrupted',
      snapshot()
    )
  }
  return {
    ...snapshot(),
    finishReason,
    incomplete: finishReason !== 'stop',
    partialContent: finishReason === 'stop' ? undefined : content,
    content: finishReason === 'stop' ? content : '',
  }
}

export function diagnoseModel(result: ModelResult) {
  const raw = record(result.raw)
  const chunks = Array.isArray(raw.chunks) ? raw.chunks : []
  const lastChoice = chunks
    .flatMap((chunk) =>
      Array.isArray(record(chunk).choices) ? (record(chunk).choices as unknown[]) : []
    )
    .map(record)
    .findLast((choice) => typeof choice.finish_reason === 'string')
  const choice = record(Array.isArray(raw.choices) ? raw.choices[0] : undefined)
  const candidate = record(Array.isArray(raw.candidates) ? raw.candidates[0] : undefined)
  const rawFinish =
    result.finishReason ??
    lastChoice?.finish_reason ??
    choice.finish_reason ??
    candidate.finishReason
  const finishReason = typeof rawFinish === 'string' ? rawFinish : null
  const block = record(raw.promptFeedback).blockReason
  const blockReason = typeof block === 'string' ? block : null
  const usage = record(result.usage)
  const reasoningTokens = Number(
    record(usage.completion_tokens_details).reasoning_tokens ?? usage.thoughtsTokenCount ?? 0
  )
  const completionTokens = Number(usage.completion_tokens ?? usage.candidatesTokenCount ?? 0)
  const contentChars = (result.partialContent ?? result.content).length
  const limited = finishReason === 'length' || finishReason === 'MAX_TOKENS'
  const filtered =
    ['content_filter', 'SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT'].includes(
      String(finishReason)
    ) || Boolean(blockReason)
  const incomplete =
    result.incomplete || (finishReason !== null && !['stop', 'STOP'].includes(String(finishReason)))
  const kind: ModelRequestError['kind'] = limited
    ? 'output-limit'
    : filtered
      ? 'filtered'
      : incomplete
        ? 'interrupted'
        : 'empty'
  const problem = limited
    ? contentChars === 0 && reasoningTokens > 0
      ? `思考耗尽输出额度：结束原因 ${finishReason}，思考 ${reasoningTokens} / 输出 ${completionTokens} token，正文 0 字符。请关闭思考，或增加输出上限并分批生成；这不是请求超时`
      : `模型输出达到上限（${finishReason}，输出 ${completionTokens} token），已保留完整对象和截断片段；请分批生成或增加输出上限`
    : filtered
      ? `模型输出被服务商拦截（${finishReason ?? blockReason}），请调整输入；原始响应已保存`
      : incomplete
        ? `模型未完整结束（${finishReason ?? '连接中断'}），原始响应和可恢复对象已保存`
        : !result.content.trim()
          ? '模型未返回正文，原始响应已保存；请检查模型能力、思考设置与输出上限'
          : null
  return { finishReason, reasoningTokens, completionTokens, contentChars, kind, problem }
}
