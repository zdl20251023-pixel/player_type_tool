import { responseProblem } from '../analysis/strategy'
import axios from 'axios'
import { randomUUID } from 'node:crypto'
import {
  readCachedRun,
  writeJson,
  profileProblem,
  type CachedRunType,
  type SessionType,
} from '../storage/session'
import type { RunType } from '../contracts/experiment'

export async function executeSession(
  directory: string,
  session: SessionType,
  options: {
    renderOnly?: boolean
    retryFailed?: boolean
    onProgress?: (run: CachedRunType, completed: number) => void | Promise<void>
  } = {}
) {
  // 先校验所有缓存；损坏时中止，避免半途才发现缓存问题而发出部分新请求。
  const cachedRuns = await Promise.all(session.plan.map((plan) => readCachedRun(directory, plan)))
  const runs: RunType[] = []
  let lookupService: ReturnType<typeof import('../client/lookup').createLookupService> | undefined
  let requested = 0
  let reused = 0
  for (let index = 0; index < session.plan.length; index++) {
    const plan = session.plan[index]
    const cached = cachedRuns[index]
    if (cached && (!options.retryFailed || cached.ok || options.renderOnly)) {
      runs.push(cached)
      reused++
      continue
    }
    if (options.renderOnly) {
      runs.push({
        ...plan,
        ok: false,
        elapsedMs: 0,
        problem: '未执行：缺少本地响应缓存',
        response: null,
      })
      continue
    }
    if (!lookupService) {
      if (!process.env.AI_SERVICE_URL) {
        throw new Error('缺少 AI_SERVICE_URL；已完成缓存可用 --render-only 离线重建')
      }
      lookupService = (await import('../client/lookup')).createLookupService()
    }
    const started = performance.now()
    let response: unknown = null
    let problem: string | null = null
    let httpStatus: number | null = null
    try {
      response = await lookupService.requestRaw(plan.request)
      problem = responseProblem(response) ?? profileProblem(response, plan)
    } catch (error) {
      if (axios.isAxiosError<unknown>(error)) {
        response = error.response?.data ?? null
        httpStatus = error.response?.status ?? null
        problem = `请求失败：${error.code ?? 'AXIOS_ERROR'}；HTTP=${httpStatus ?? '无响应'}`
      } else {
        problem = `请求失败：${error instanceof Error ? error.name : 'UnknownError'}`
      }
    }
    const run: CachedRunType = {
      ...plan,
      httpStatus,
      ok: problem === null,
      elapsedMs: Math.round(performance.now() - started),
      problem,
      response,
    }
    if (cached && !cached.ok && options.retryFailed) {
      await writeJson(directory, `${plan.id}-failed-${randomUUID()}.json`, cached)
    }
    await writeJson(directory, `${plan.id}.json`, run)
    runs.push(run)
    requested++
    await writeJson(directory, 'progress.json', {
      completed: runs.length,
      total: session.plan.length,
      requested,
      reused,
      successful: runs.filter((r) => r.ok).length,
    })
    await options.onProgress?.(run, runs.length)
  }
  return { runs, requested, reused }
}
