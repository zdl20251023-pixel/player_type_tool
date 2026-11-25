export interface RunType {
  id: string
  scenario: string
  profile: string
  style: string
  repeat: number
  ok: boolean
  elapsedMs: number
  problem: string | null
  response: unknown
}
