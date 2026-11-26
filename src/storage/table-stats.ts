import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { addTableStats, emptyTableStats, type TableStatistics } from '../analysis/table-stats'
import type { TableHand } from '../table/engine'
import type { WorkbenchStore } from './workbench'

// Enrich legacy statistics from settlement snapshots only. Never rewrite the original journal.
export async function readTableStatsPlayers(
  store: WorkbenchStore,
  id: string,
  completed: number,
  saved: TableStatistics
): Promise<TableStatistics> {
  const rebuilt = emptyTableStats()
  let expected = 1
  for (let index = 0; index < Math.ceil(completed / 1000); index++) {
    const shard = `hands-${String(index).padStart(6, '0')}.jsonl`
    const stream = createReadStream(store.path('table-runs', id, 'logs', shard), {
      encoding: 'utf8',
    })
    const lines = createInterface({ input: stream, crlfDelay: Infinity })
    try {
      for await (const line of lines) {
        // Decision packets may be large; only settlement snapshots are needed here.
        if (!line.startsWith('{"kind":"hand",')) {
          continue
        }
        const hand = JSON.parse(line) as TableHand
        if (hand.number > completed) {
          break
        }
        if (hand.number < expected) {
          continue
        } // A recovery may append a settlement twice.
        if (hand.number !== expected) {
          throw new Error('结算日志缺少手牌，无法核对历史玩家类型')
        }
        addTableStats(rebuilt, { ...hand, complete: true })
        expected++
      }
    } finally {
      lines.close()
      stream.destroy()
    }
  }
  if (expected !== completed + 1) {
    throw new Error('结算日志不完整，无法核对历史玩家类型')
  }
  for (const kind of ['position', 'seat', 'type'] as const) {
    if (Object.keys(saved[kind]).length !== Object.keys(rebuilt[kind]).length) {
      throw new Error('结算日志与已保存统计不一致，无法核对历史玩家类型')
    }
    for (const [key, row] of Object.entries(saved[kind])) {
      const actual = rebuilt[kind][key]
      if (
        !actual ||
        Object.entries(row).some(
          ([field, value]) => field !== 'players' && value !== actual[field as keyof typeof actual]
        )
      ) {
        throw new Error('结算日志与已保存统计不一致，无法核对历史玩家类型')
      }
    }
  }
  return rebuilt
}
