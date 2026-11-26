import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { comparisonCss } from '../reports/comparison-style'
import { comparisonScript } from '../reports/comparison-view'
import { record } from '../analysis/strategy'
import { diagnoseModel, type ModelResult } from '../client/model-stream'
import { Workbench } from '../runner/workbench'
import { TableRunner } from '../runner/table'
import { readdir } from 'node:fs/promises'
import { readScenarioLibrary, reuseLibraryScenarios } from '../storage/scenario-library'
import { defaultPrompts } from '../analysis/prompts'
import { fixtures } from '../scenarios/fixtures'
import { representativeFixtures } from '../scenarios/representative'
import { validFixtures } from '../scenarios/generated'
import { fromFixture } from '../scenarios'
import { validateScenario } from '../scenarios/validate'
import type { PromptTask } from '../contracts/workbench'

const publicRoot = resolve(import.meta.dir, 'public')
const reportScriptHash = createHash('sha256').update(comparisonScript).digest('base64')

export function createWebHandler(
  workbench = new Workbench(),
  appScript?: string | Blob,
  tables = new TableRunner(workbench.store)
) {
  const json = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  // 串行保存设置，防止不同页面更新覆盖；网络执行不占用此队列。
  let mutation: Promise<unknown> = Promise.resolve()
  const save = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = mutation.then(fn)
    mutation = next.catch(() => undefined)
    return next
  }
  return async (request: Request): Promise<Response> => {
    try {
      const url = new URL(request.url)
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
        return json({ error: '仅支持本机访问' }, 403)
      }
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) {
        return json({ error: '拒绝跨来源请求' }, 403)
      }
      const path = decodeURIComponent(url.pathname)
      if (request.method === 'GET') {
        const tableHand = /^\/api\/table-runs\/([A-Za-z0-9-]+)\/hands\/(\d+)$/.exec(path)
        if (tableHand) {
          return json(await tables.review(tableHand[1], Number(tableHand[2])))
        }
        if (path === '/api/table-runs') {
          return json(await tables.list())
        }
        const table =
          /^\/api\/table-runs\/([A-Za-z0-9-]+)(?:\/(stats\.csv|decision|logs)(?:\/(hands-\d{6}\.jsonl))?)?$/.exec(
            path
          )
        if (table) {
          if (!table[2]) {
            return json(await tables.detail(table[1]))
          }
          if (table[2] === 'stats.csv') {
            return new Response(await tables.csv(table[1]), {
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="table-stats.csv"',
                'Cache-Control': 'no-store',
              },
            })
          }
          if (table[2] === 'decision') {
            return json(
              await workbench.store.read(['table-runs', table[1], 'pending-decision.json'], null)
            )
          }
          if (table[3]) {
            return new Response(
              Bun.file(workbench.store.path('table-runs', table[1], 'logs', table[3])),
              { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' } }
            )
          }
          const files = await readdir(workbench.store.path('table-runs', table[1], 'logs')).catch(
            () => [] as string[]
          )
          return json(files.filter((f) => /^hands-\d{6}\.jsonl$/.test(f)).sort())
        }
        if (path === '/api/bootstrap') {
          return json({
            settings: await workbench.publicSettings(),
            catalog: workbench.catalog(),
            fixtures: [...fixtures, ...representativeFixtures],
            defaults: defaultPrompts(),
            features: { modelJobs: true, scenarioBatches: true },
          })
        }
        if (path === '/api/experiments') {
          return json(await workbench.list())
        }
        if (path === '/api/scenario-library') {
          return json(await readScenarioLibrary(workbench.store))
        }
        if (path === '/api/scenario-generations') {
          return json(await workbench.scenarioBatches.list())
        }
        const generation = /^\/api\/scenario-generations\/([A-Za-z0-9-]+)$/.exec(path)
        if (generation) {
          return json(await workbench.scenarioBatches.detail(generation[1]))
        }
        const diagnosis = /^\/api\/calls\/([A-Za-z0-9-]+)\/diagnostic$/.exec(path)
        if (diagnosis) {
          const response = await workbench.store.read<ModelResult>([
            'calls',
            diagnosis[1],
            'response.json',
          ])
          return json(diagnoseModel(response))
        }
        if (path === '/api/calls') {
          const ids = await workbench.store.list('calls')
          const calls = await Promise.all(
            ids.map(async (id) => {
              const req = await workbench.store.read<Record<string, unknown>>([
                'calls',
                id,
                'request.json',
              ])
              const result = await workbench.store.read<Record<string, unknown>>(
                ['calls', id, 'result.json'],
                { ok: null }
              )
              return {
                id,
                task: req.task,
                model: req.model,
                createdAt: req.createdAt,
                ok: result.ok,
                problem: result.problem,
              }
            })
          )
          return json(
            calls
              .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
              .slice(0, 100)
          )
        }
        if (path === '/api/prompts/history') {
          return json(
            await Promise.all(
              (await workbench.store.list('prompts')).map((id) =>
                workbench.store.read(['prompts', id, 'version.json'])
              )
            )
          )
        }
        const modelJob = /^\/api\/model\/jobs\/([A-Za-z0-9-]+)$/.exec(path)
        if (modelJob) {
          return json(await workbench.modelJob(modelJob[1]))
        }
        const call = /^\/api\/calls\/([A-Za-z0-9-]+)\/(request|response|result)$/.exec(path)
        if (call) {
          return json(await workbench.store.read(['calls', call[1], `${call[2]}.json`]))
        }
        const experiment =
          /^\/api\/experiments\/([A-Za-z0-9-]+)(?:\/(report\.html|(?:raw\/)?([A-Za-z0-9-]+\.json)))?$/.exec(
            path
          )
        if (experiment) {
          if (!experiment[2]) {
            return json(await workbench.detail(experiment[1]))
          }
          if (experiment[3]) {
            const session = await workbench.store.read<{ plan: { id: string }[] }>([
              'runs',
              experiment[1],
              'session.json',
            ])
            if (
              !['session.json', 'validation.json', 'horizontal.json', 'progress.json'].includes(
                experiment[3]
              ) &&
              !session.plan.some((p) => `${p.id}.json` === experiment[3])
            ) {
              return json({ error: '未知实验文件' }, 404)
            }
            return json(await workbench.store.read(['runs', experiment[1], experiment[3]]))
          }
          return new Response(
            Bun.file(workbench.store.path('runs', experiment[1], 'report.html')),
            {
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
                'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-${reportScriptHash}'; base-uri 'none'`,
              },
            }
          )
        }
        if (['/', '/app.js', '/style.css'].includes(path)) {
          const file =
            path === '/'
              ? Bun.file(resolve(publicRoot, 'index.html'))
              : path === '/style.css'
                ? `${await Bun.file(resolve(publicRoot, 'style.css')).text()}\n${comparisonCss}\n${await Bun.file(resolve(publicRoot, 'table.css')).text()}\n${await Bun.file(resolve(publicRoot, 'roles.css')).text()}\n${await Bun.file(resolve(publicRoot, 'preparation.css')).text()}`
                : appScript
                  ? typeof appScript === 'string'
                    ? Bun.file(appScript)
                    : appScript
                  : null
          if (!file) {
            return json({ error: '前端尚未构建' }, 503)
          }
          return new Response(file, {
            headers: {
              'Content-Type':
                path === '/'
                  ? 'text/html; charset=utf-8'
                  : path === '/style.css'
                    ? 'text/css'
                    : 'application/javascript',
              'Cache-Control': 'no-store',
              'Content-Security-Policy':
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
              'X-Content-Type-Options': 'nosniff',
            },
          })
        }
      }
      if (request.method !== 'POST' || !path.startsWith('/api/')) {
        return json({ error: '资源不存在' }, 404)
      }
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
        return json({ error: '仅接受 JSON 请求' }, 415)
      }
      const bodyText = await request.text()
      if (bodyText.length > 12000000) {
        return json({ error: '请求体过大' }, 413)
      }
      const body: unknown = JSON.parse(bodyText)
      const obj = record(body)
      if (path === '/api/table-runs') {
        const table = await tables.create(body)
        return json(await tables.start(table.id), 202)
      }
      const tableAction =
        /^\/api\/table-runs\/([A-Za-z0-9-]+)\/(resume|pause|step|stop|configure)$/.exec(path)
      if (tableAction) {
        return json(
          await save(() =>
            tableAction[2] === 'configure'
              ? tables.configure(tableAction[1], body)
              : tableAction[2] === 'pause' || tableAction[2] === 'stop'
                ? tables.pause(tableAction[1], tableAction[2] === 'stop')
                : tables.start(tableAction[1], tableAction[2] === 'step')
          ),
          202
        )
      }
      if (path === '/api/scenario-library/reuse') {
        return json(await reuseLibraryScenarios(workbench.store, body))
      }
      if (path === '/api/scenario-generations/preview') {
        return json(await workbench.scenarioBatches.preview(body))
      }
      if (path === '/api/scenario-generations') {
        return json(await workbench.scenarioBatches.create(body), 202)
      }
      const generationAction =
        /^\/api\/scenario-generations\/([A-Za-z0-9-]+)\/(resume|pause)$/.exec(path)
      if (generationAction) {
        return json(
          generationAction[2] === 'pause'
            ? await workbench.scenarioBatches.pause(generationAction[1])
            : await workbench.scenarioBatches.resume(generationAction[1], body),
          202
        )
      }
      if (path === '/api/settings') {
        return json(await save(() => workbench.saveSettings(body)))
      }
      const prompt = /^\/api\/prompts\/(player|scenarios|analysis)$/.exec(path)
      if (prompt) {
        return json(await save(() => workbench.savePrompt(prompt[1] as PromptTask, body)))
      }
      if (path === '/api/model/preview') {
        return json(await workbench.preview(body))
      }
      if (path === '/api/model/run') {
        return json(await workbench.runModel(body))
      }
      if (path === '/api/model/start') {
        return json(await workbench.startModel(body), 202)
      }
      if (path === '/api/model/test') {
        return json(await workbench.testModel(body))
      }
      if (path === '/api/model/models') {
        return json(await workbench.refreshModels(body))
      }
      if (path === '/api/scenarios/validate') {
        const selected = validFixtures(obj.fixtures)
        return json({
          fixtures: selected,
          validation: selected.map((f) => ({ id: f.id, ...validateScenario(fromFixture(f)) })),
        })
      }
      if (path === '/api/experiments') {
        return json(await workbench.create(body), 201)
      }
      const action = /^\/api\/experiments\/([A-Za-z0-9-]+)\/(execute|render)$/.exec(path)
      if (action) {
        return json(
          action[2] === 'render'
            ? await workbench.render(action[1])
            : await workbench.execute(action[1], obj.retryFailed === true),
          action[2] === 'execute' ? 202 : 200
        )
      }
      return json({ error: '资源不存在' }, 404)
    } catch (error) {
      if (record(error).code === 'ENOENT') {
        return json({ error: '本地记录不存在' }, 404)
      }
      return json({ error: error instanceof Error ? error.message : '操作失败' }, 400)
    }
  }
}

if (import.meta.main) {
  const workbench = new Workbench()
  const built = await Bun.build({
    entrypoints: [resolve(import.meta.dir, 'app.ts')],
    target: 'browser',
    minify: false,
  })
  if (!built.success) {
    throw new Error(`前端构建失败：${built.logs.map(String).join('\n')}`)
  }
  const appBundle = built.outputs.find((output) => output.path.endsWith('app.js'))
  if (!appBundle) {
    throw new Error('前端构建缺少入口文件')
  }
  const port = Number(process.env.WEB_PORT || '3210')
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('WEB_PORT 必须为有效端口')
  }
  Bun.serve({
    hostname: '127.0.0.1',
    port,
    idleTimeout: 255,
    maxRequestBodySize: 12000000,
    fetch: createWebHandler(workbench, appBundle),
  })
  process.stdout.write(
    `Strategy Lab 已启动：http://127.0.0.1:${port}\n仅在显式点击执行时调用大模型或 solver。\n`
  )
}
