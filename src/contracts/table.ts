import type { PlayerConfig } from './workbench'
import type { TableHand, TableEvent } from '../table/engine'
import type { TableStatistics } from '../analysis/table-stats'

export interface TableConfig {
  mode: 'watch' | 'fast'
  seats: PlayerConfig[]
  hands: number | null
  seed: number
  actionDelayMs: number
  handDelayMs: number
  animations: boolean
  autoNext: boolean
  autoRebuy: boolean
}
export interface TableHandReview {
  number: number
  button: number
  complete: boolean
  board: string[]
  players: {
    seat: number
    position: string
    label: string
    cards: string[]
    initial: number
    stack: number
    folded: boolean
    lastAction: string
  }[]
  events: TableEvent[]
  profit: number[]
  winners: number[]
}
export interface TableRun {
  version: 1
  id: string
  createdAt: string
  updatedAt: string
  config: TableConfig
  nextSeats: PlayerConfig[] | null
  status: 'paused' | 'running' | 'waiting' | 'completed' | 'failed' | 'interrupted' | 'stopped'
  phase: 'idle' | 'action-delay' | 'requesting' | 'next-hand' | 'paused' | 'settling'
  settlement?: { hand: number; startedAt: string; durationMs: number }
  dueAt: string | null
  problem: string | null
  completed: number
  requests: number
  reused: number
  errors: number
  hand: TableHand | null
  stacks: number[]
  rebuys: number[]
  stats: TableStatistics
  statsNotice?: string
  events: (TableEvent & { hand: number })[]
  recentHands: { number: number; board: string[]; profit: number[]; winners: number[] }[]
  lastDecision: { requestId: string; actionIndex: number; elapsedMs: number } | null
}
