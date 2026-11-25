/** 本工具默认沿用原正式实验的 3000ms 超时，可按调试环境覆盖。 */
export function requestTimeoutMs(): number {
  const value = process.env.AI_REQUEST_TIMEOUT_MS ?? '3000'
  const timeout = Number(value)
  if (!Number.isSafeInteger(timeout) || timeout <= 0) {
    throw new Error('AI_REQUEST_TIMEOUT_MS 必须是正整数毫秒')
  }
  return timeout
}
