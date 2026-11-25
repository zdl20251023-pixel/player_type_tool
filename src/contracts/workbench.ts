import type { ScenarioFixture } from '../scenarios'

export type Provider = 'deepseek' | 'gemini'
export type PromptTask = 'player' | 'scenarios' | 'analysis'
export interface ModelProgress {
  phase: 'connecting' | 'receiving' | 'validating'
  contentChars: number
  reasoningChars: number
  lastResponseAt: string | null
}
export interface ModelJob {
  callId: string
  task: PromptTask
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  createdAt: string
  updatedAt: string
  elapsedMs: number
  timeoutMs: number
  progress: ModelProgress
  problem: string | null
}
export interface ModelImage {
  name: string
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  data: string
}
export interface ModelOption {
  id: string
  label: string
  vision: boolean | null
  note: string
  source: 'preset' | 'remote'
}
export interface ModelSettings {
  provider: Provider
  model: string
  baseUrl: string
  temperature: number
  maxTokens: number
  timeoutMs: number
}
export interface ScenarioBatch {
  index: number
  targets: { id: string; stage: 'preflop' | 'postflop' | null }[]
  status: 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'interrupted'
  fixtures: ScenarioFixture[]
  attempts: { callId: string; accepted: number; problem: string | null }[]
  problem: string | null
  progress: ModelProgress | null
}
export interface ScenarioGeneration {
  id: string
  createdAt: string
  updatedAt: string
  status: 'paused' | 'running' | 'pausing' | 'completed' | 'partial' | 'interrupted'
  count: number
  batchSize: number
  concurrency: number
  requirements: string
  players: PlayerConfig[]
  model: ModelSettings
  prompt: PromptVersion
  images: ModelImage[]
  thinking: 'enabled' | 'disabled'
  stagePlan: 'auto' | 'balanced' | 'preflop' | 'postflop'
  batches: ScenarioBatch[]
}
export interface PlayerConfig {
  id: string
  label: string
  description: string
  preflop: string
  postflop: string
}
export interface PromptVersion {
  id: string
  task: PromptTask
  createdAt: string
  system: string
  template: string
}
export interface WorkbenchSettings {
  model: ModelSettings
  players: PlayerConfig[]
  prompts: Record<PromptTask, PromptVersion>
}
export interface ExperimentInput {
  name: string
  requirements: string
  players: PlayerConfig[]
  fixtures: ScenarioFixture[]
  repeats: number
}
export interface ExperimentMeta extends ExperimentInput {
  id: string
  createdAt: string
  baselineId: string
  status: 'draft' | 'running' | 'completed' | 'failed' | 'interrupted'
  problem: string | null
  completed: number
  total: number
  successful: number
  analysisIds: string[]
}
