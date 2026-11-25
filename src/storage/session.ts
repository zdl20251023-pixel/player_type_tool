import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { RunType } from '../contracts/experiment'
import type { AIRequestBody } from '../contracts/lookup'
import { record, responseProblem } from '../analysis/strategy'
import { buildRequest, type ScenarioType } from '../scenarios'
import { validateScenario } from '../scenarios/validate'

export interface PlanType {
  id: string
  scenario: string
  description: string
  style: string
  profile: string
  repeat: number
  request: AIRequestBody
}
export interface SessionType {
  version: 1
  runId: string
  createdAt: string
  repeats: number
  scenarios: ScenarioType[]
  plan: PlanType[]
}
export interface CachedRunType extends RunType {
  request: AIRequestBody
  httpStatus: number | null
}

export async function writeJson(directory: string, name: string, value: unknown): Promise<void> {
  await mkdir(directory, { recursive: true })
  const target = resolve(directory, name)
  await writeFile(`${target}.tmp`, JSON.stringify(value, null, 2))
  await rename(`${target}.tmp`, target)
}

export function profileProblem(response: unknown, plan: PlanType): string | null {
  const config = record(record(response).solution_information).strategy_profile_config
  const matched = record(config).matched_profile_name
  if (
    plan.profile === 'gto'
      ? matched !== 'gto' && matched !== 'no_profile_applied'
      : matched !== plan.profile
  ) {
    return `档位未确认匹配：requested=${plan.profile}; matched=${String(matched)}`
  }
  const raw = record(record(response).strategy).actions as unknown[]
  const hero = plan.request.hand.players.find((player) => player.hole_cards)?.seat_no
  if (raw.some((item) => record(record(item).action).seat_no !== hero)) {
    return '返回候选的行动玩家与 Hero 不一致'
  }
  return null
}

export async function readSession(directory: string): Promise<SessionType> {
  const value: unknown = JSON.parse(await readFile(resolve(directory, 'session.json'), 'utf8'))
  const obj = record(value)
  if (
    obj.version !== 1 ||
    !Array.isArray(obj.scenarios) ||
    !Array.isArray(obj.plan) ||
    typeof obj.repeats !== 'number' ||
    obj.repeats < 1 ||
    !Number.isInteger(obj.repeats)
  ) {
    throw new Error('不支持或损坏的本地 session.json；未发起请求')
  }
  const session = value as SessionType
  const ids = new Set<string>()
  for (const scenario of session.scenarios) {
    validateScenario(scenario)
  }
  for (const plan of session.plan) {
    const scenario = session.scenarios.find((s) => s.id === plan.scenario)
    if (
      !/^[A-Za-z0-9-]+$/.test(plan.id) ||
      ids.has(plan.id) ||
      !scenario ||
      JSON.stringify(plan.request) !==
        JSON.stringify(buildRequest(scenario, plan.profile, plan.request.request_id))
    ) {
      throw new Error('本地请求计划不一致；未发起请求')
    }
    ids.add(plan.id)
  }
  return session
}

export async function readCachedRun(
  directory: string,
  plan: PlanType
): Promise<CachedRunType | null> {
  let text: string
  try {
    text = await readFile(resolve(directory, `${plan.id}.json`), 'utf8')
  } catch (error) {
    if (record(error).code === 'ENOENT') {
      return null
    }
    throw error
  }
  const value: unknown = JSON.parse(text)
  const run = value as CachedRunType
  if (
    JSON.stringify(record(value).request) !== JSON.stringify(plan.request) ||
    run.id !== plan.id ||
    run.scenario !== plan.scenario ||
    run.style !== plan.style ||
    run.profile !== plan.profile ||
    run.repeat !== plan.repeat ||
    typeof run.ok !== 'boolean' ||
    !('response' in record(value))
  ) {
    throw new Error(`缓存 ${plan.id} 与请求计划不匹配；未重新请求`)
  }
  if (run.ok && (responseProblem(run.response) || profileProblem(run.response, plan))) {
    throw new Error(`缓存 ${plan.id} 的成功响应无效；未重新请求`)
  }
  return run
}
