export { styles, profileFor } from '../profiles/styles'
import Decimal from 'decimal.js'
import { fixtures } from './fixtures'
import { representativeFixtures } from './representative'
import type { AIActionEntry, AIHandData, AIRequestBody } from '../contracts/lookup'

export interface ScenarioType {
  id: string
  description: string
  street: 'preflop' | 'flop' | 'turn' | 'river'
  hero: number
  hand: AIHandData
  category: string
  history: string
}

export const entry = (seat_no: number, action: string, amount = 0): AIActionEntry => ({
  seat_no,
  action,
  amount,
})

function scenario(
  id: string,
  description: string,
  hero: number,
  cards: string,
  street: ScenarioType['street'],
  entries: AIActionEntry[]
): ScenarioType {
  return {
    id,
    description,
    hero,
    street,
    category: '',
    history: '',
    hand: {
      gameuuid: `profile-${id}`,
      roomid: 'profile-compare-room',
      game_type: "No-Limit Hold'em",
      game_type_code: 'nlhe',
      game_mode_code: 'normal',
      players: Array.from({ length: 6 }, (_, seat_no) => ({
        seat_no,
        stack: 10000,
        ...(seat_no === hero ? { hole_cards: cards } : {}),
      })),
      big_blind: 100,
      ante: 0,
      dealer_seat: 0,
      sb_seat: 1,
      bb_seat: 2,
      straddle_seat: -1,
      post_seats: [],
      actions: {
        entries: structuredClone(entries),
        pot_sizings: false,
        big_blind_sizings: false,
        big_blind_size: 100,
      },
    },
  }
}

// 座位：BTN=0、SB=1、BB=2、UTG=3、HJ=4、CO=5；100 筹码=1BB。
function parseLine(line: string): AIActionEntry[] {
  if (!line) {
    return []
  }
  return line.split(' ').map((token) => {
    if (token.startsWith('@')) {
      return entry(-1, token.slice(1))
    }
    const match = /^([0-5]):([fcx]|[br]\d+(?:\.\d+)?)$/.exec(token)
    if (!match) {
      throw new Error(`非法场景行动：${token}`)
    }
    const code = match[2][0]
    const names: Record<string, string> = { f: 'fold', c: 'call', x: 'check', b: 'bet', r: 'raise' }
    return entry(
      Number(match[1]),
      names[code],
      code === 'b' || code === 'r' ? new Decimal(match[2].slice(1)).mul(100).toNumber() : 0
    )
  })
}

function fromFixture(
  fixture: (typeof fixtures)[number] | (typeof representativeFixtures)[number]
): ScenarioType {
  return {
    ...scenario(
      fixture.id,
      fixture.description,
      fixture.hero,
      fixture.cards,
      fixture.street,
      parseLine(fixture.line)
    ),
    category: fixture.category,
    history: fixture.history,
  }
}

export const scenarios: ScenarioType[] = fixtures.map(fromFixture)
export const representativeScenarios: ScenarioType[] = representativeFixtures.map(fromFixture)

export function buildRequest(
  scenario: ScenarioType,
  profile: string | undefined,
  requestId: string
): AIRequestBody {
  return {
    protocol_ver: 'v2.1',
    reduced_actions_tier: 3,
    strategy_min_threshold: 0,
    request_id: requestId,
    mode: 'bot',
    disable_bet_randomness: true,
    hand: structuredClone(scenario.hand),
    hints: [],
    ...(profile === undefined ? {} : { strategy_profile: { target_profile_name: profile } }),
  }
}
