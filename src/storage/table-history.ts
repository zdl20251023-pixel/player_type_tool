import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { reviewTableHand } from '../analysis/table-history'
import {
  newHand,
  applyAction,
  advanceHand,
  type TableAction,
  type TableHand,
} from '../table/engine'
import type { WorkbenchStore } from './workbench'
import type { TableHandReview } from '../contracts/table'

type HandRecord = Pick<TableHand, 'number' | 'button' | 'players' | 'board' | 'awards'> & {
  kind: 'hand'
  events?: TableHand['events']
}
type DecisionRecord = {
  kind: 'decision'
  hand: number
  actionIndex: number
  action: TableAction | null
  problem: string | null
}

// Stream one local shard. Expanding a hand never calls the solver or rewrites legacy caches.
export async function readTableHandReview(
  store: WorkbenchStore,
  id: string,
  number: number,
  seed: number
): Promise<TableHandReview> {
  const shard = `hands-${String(Math.floor((number - 1) / 1000)).padStart(6, '0')}.jsonl`
  const stream = createReadStream(store.path('table-runs', id, 'logs', shard), { encoding: 'utf8' })
  const lines = createInterface({ input: stream, crlfDelay: Infinity })
  const actions = new Map<number, TableAction>()
  let saved: HandRecord | undefined
  try {
    for await (const line of lines) {
      if (!line.trim()) {
        continue
      }
      const row = JSON.parse(line) as HandRecord | DecisionRecord
      if (row.kind === 'decision' && row.hand === number && row.action && !row.problem) {
        actions.set(row.actionIndex, row.action)
      } else if (row.kind === 'hand' && row.number === number) {
        saved = row
        break
      }
    }
  } finally {
    lines.close()
    stream.destroy()
  }
  if (!saved) {
    throw new Error('该手牌尚无已保存的结算记录')
  }
  if (saved.events) {
    return reviewTableHand({ ...saved, complete: true, events: saved.events })
  }
  // Older journals contain decisions and settlement snapshots, but no event list.
  const replay = newHand(
    number,
    saved.button,
    saved.players.map((p) => p.config),
    saved.players.map((p) => p.initial),
    (seed ^ Math.imul(number, 0x9e3779b9)) >>> 0
  )
  for (const [index, action] of [...actions].sort((a, b) => a[0] - b[0])) {
    while (!replay.complete && replay.actor === null) {
      advanceHand(replay)
    }
    if (replay.complete || replay.actions !== index) {
      throw new Error('旧行动日志不完整，无法可靠还原本手过程')
    }
    applyAction(replay, action)
  }
  while (!replay.complete && replay.actor === null) {
    advanceHand(replay)
  }
  const state = (hand: Pick<TableHand, 'board' | 'players' | 'awards'>) =>
    JSON.stringify([hand.board, hand.awards, hand.players.map((p) => [p.cards, p.stack, p.folded])])
  if (!replay.complete || state(replay) !== state(saved)) {
    throw new Error('旧行动日志与结算快照不一致，未展示推测内容')
  }
  return reviewTableHand(replay)
}
