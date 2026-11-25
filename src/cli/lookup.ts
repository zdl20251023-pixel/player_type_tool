import { runExperiment } from '../runner/experiment'

runExperiment(Bun.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : '执行失败'}\n`)
  process.exitCode = 1
})
