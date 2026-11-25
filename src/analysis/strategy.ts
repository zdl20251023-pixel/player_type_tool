import Decimal from 'decimal.js'

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function items(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : []
}

interface ActionType {
  key: string
  probability: number
  ev: number
}

function actionKey(value: unknown): string {
  const action = record(value)
  return JSON.stringify([
    action.action,
    action.amount ?? null,
    action.pot_size ?? null,
    action.seat_no,
  ])
}

export function actions(response: unknown): ActionType[] {
  return items(record(record(response).strategy).actions).map((value) => {
    const entry = record(value)
    return {
      key: actionKey(entry.action),
      probability: Number(entry.hand_strategy),
      ev: Number(entry.hand_ev),
    }
  })
}

// HTTP 200 也可能是引擎错误；失败响应保存原文，但不参与数值比较。
export function responseProblem(response: unknown): string | null {
  const root = record(response)
  const info = record(root.solution_information)
  for (const obj of [root, info]) {
    if (obj.success === false) {
      return 'success=false'
    }
    for (const key of ['error', 'errors', 'error_code']) {
      const value = obj[key]
      if (
        value !== undefined &&
        value !== null &&
        value !== false &&
        value !== '' &&
        value !== 0 &&
        value !== '0' &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        return `${key}=${JSON.stringify(value)}`
      }
    }
  }
  const raw = record(root.strategy).actions
  if (!Array.isArray(raw) || raw.length === 0) {
    return '缺少非空 strategy.actions'
  }
  for (const value of raw as unknown[]) {
    const entry = record(value)
    if (
      typeof record(entry.action).action !== 'string' ||
      typeof entry.hand_strategy !== 'number' ||
      !Number.isFinite(entry.hand_strategy) ||
      entry.hand_strategy < 0 ||
      entry.hand_strategy > 1 ||
      typeof entry.hand_ev !== 'number' ||
      !Number.isFinite(entry.hand_ev)
    ) {
      return '动作、概率或 EV 无效'
    }
  }
  const parsed = actions(response)
  if (new Set(parsed.map((a) => a.key)).size !== parsed.length) {
    return '存在重复动作，无法可靠对齐'
  }
  return null
}

// 数组元素按 [] 汇总字段类型，避免动作顺序或数量变化被误报为 schema 变化。
export function shape(value: unknown): Record<string, string> {
  const result = new Map<string, Set<string>>()
  const visit = (current: unknown, path: string): void => {
    const type = current === null ? 'null' : Array.isArray(current) ? 'array' : typeof current
    const types = result.get(path) ?? new Set<string>()
    types.add(type)
    result.set(path, types)
    if (Array.isArray(current)) {
      for (const item of current as unknown[]) {
        visit(item, `${path}[]`)
      }
    } else if (current !== null && typeof current === 'object') {
      for (const [key, item] of Object.entries(record(current))) {
        visit(item, `${path}.${key}`)
      }
    }
  }
  visit(value, '$')
  return Object.fromEntries(
    [...result]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, types]) => [key, [...types].sort().join('|')])
  )
}

export function summarize(response: unknown) {
  const root = record(response)
  const strategy = record(root.strategy)
  const info = record(root.solution_information)
  return {
    actionCount: actions(response).length,
    reducedActionCount: Array.isArray(root.reduced_actions) ? root.reduced_actions.length : null,
    suggestedAction: strategy.suggested_action ?? null,
    source: info.source ?? null,
    profileConfig: info.strategy_profile_config ?? null,
    warnings: { warnings: root.warnings ?? null, softWarnings: info.soft_warnings ?? null },
  }
}

export function compare(base: unknown, candidate: unknown) {
  const left = shape(base)
  const right = shape(candidate)
  const schema = [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .filter((path) => left[path] !== right[path])
    .map((path) => ({ path, before: left[path] ?? 'missing', after: right[path] ?? 'missing' }))
  const baseActions = new Map(actions(base).map((a) => [a.key, a]))
  const nextActions = new Map(actions(candidate).map((a) => [a.key, a]))
  const rows = [...new Set([...baseActions.keys(), ...nextActions.keys()])].sort().map((key) => {
    const a = baseActions.get(key)
    const b = nextActions.get(key)
    return {
      action: key,
      presence: !a ? 'added' : !b ? 'removed' : 'both',
      baseProbability: a?.probability ?? null,
      probability: b?.probability ?? null,
      deltaPp: new Decimal(b?.probability ?? 0)
        .minus(a?.probability ?? 0)
        .mul(100)
        .toNumber(),
      baseEv: a?.ev ?? null,
      ev: b?.ev ?? null,
      deltaEv: a && b ? new Decimal(b.ev).minus(a.ev).toNumber() : null,
    }
  })
  const before = summarize(base)
  const after = summarize(candidate)
  return {
    schema,
    before,
    after,
    sourceChanged: JSON.stringify(before.source) !== JSON.stringify(after.source),
    suggestedActionChanged: actionKey(before.suggestedAction) !== actionKey(after.suggestedAction),
    maxProbabilityDeltaPp: Math.max(0, ...rows.map((row) => Math.abs(row.deltaPp))),
    rows,
  }
}
