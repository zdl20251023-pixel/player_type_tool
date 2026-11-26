export type BatchMode = 'auto' | 'manual'

export function generationPlan(
  count: number,
  options: { batchMode?: BatchMode; batchSize?: number; concurrency?: number } = {}
) {
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error('场景数量必须为 1..100')
  }
  const auto =
    options.batchMode === 'auto' ||
    (options.batchMode === undefined &&
      options.batchSize === undefined &&
      options.concurrency === undefined)
  const size = auto ? 3 : (options.batchSize ?? 3)
  const parallel = auto ? 2 : (options.concurrency ?? 2)
  if (!Number.isInteger(size) || size < 1 || size > 5) {
    throw new Error('每批数量必须为 1..5')
  }
  if (!Number.isInteger(parallel) || parallel < 1 || parallel > 3) {
    throw new Error('并发批次必须为 1..3')
  }
  const batchSize = Math.min(size, count)
  const batchCount = Math.ceil(count / batchSize)
  return { batchSize, batchCount, concurrency: Math.min(parallel, batchCount) }
}

// Only explicit street quotas are interpreted; other prose remains model input.
export function describedStreetQuota(requirements: string) {
  const number = '(\\d+|[零一二两三四五六七八九十百]+)'
  const toNumber = (value: string) => {
    if (/^\d+$/.test(value)) {
      return Number(value)
    }
    const digits: Record<string, number> = {
      零: 0,
      一: 1,
      二: 2,
      两: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
    }
    if (value === '一百' || value === '百') {
      return 100
    }
    const parts = value.split('十')
    return parts.length === 2
      ? (parts[0] ? digits[parts[0]] : 1) * 10 + (parts[1] ? digits[parts[1]] : 0)
      : digits[value]
  }
  const each = new RegExp(
    `(?:翻前[和与及、/\\s]*翻后|翻后[和与及、/\\s]*翻前).{0,8}?各\\s*${number}`
  ).exec(requirements)
  if (each) {
    const n = toNumber(each[1])
    return Number.isFinite(n) ? { preflop: n, postflop: n } : null
  }
  const before = new RegExp(`翻前\\s*${number}\\s*(?:条|种|个)`).exec(requirements)
  const after = new RegExp(`翻后\\s*${number}\\s*(?:条|种|个)`).exec(requirements)
  if (!before || !after) {
    return null
  }
  const preflop = toNumber(before[1]),
    postflop = toNumber(after[1])
  return Number.isFinite(preflop) && Number.isFinite(postflop) ? { preflop, postflop } : null
}

export function generationConflict(count: number, requirements: string) {
  const quota = describedStreetQuota(requirements)
  return quota && quota.preflop + quota.postflop !== count
    ? `描述要求翻前 ${quota.preflop} 条、翻后 ${quota.postflop} 条，共 ${quota.preflop + quota.postflop} 条，当前生成数量为 ${count} 条，请统一后生成。`
    : null
}
