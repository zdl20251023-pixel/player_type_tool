// ==================== /lookup 接口相关类型 ====================

/** AI 玩家信息 */
export interface AIPlayerInfo {
  seat_no: number
  stack: number
  hole_cards?: string
  name?: string
}

/** AI 行动条目 */
export interface AIActionEntry {
  seat_no?: number | null
  action: string
  amount?: number | null
}

/** AI 手牌数据，包含牌局完整信息 */
export interface AIHandData {
  gameuuid: string
  game_type: string
  game_type_code: string
  game_mode_code: string
  players: AIPlayerInfo[]
  big_blind: number
  ante: number
  dealer_seat: number
  sb_seat: number
  bb_seat: number
  roomid: string
  // 用于原传原回的字段，JSON格式，可以任意扩展【给外部函数调用的参数名叫optional_data】
  roomuuid?: string
  straddle_seat: number
  post_seats: number[]
  actions: {
    entries: AIActionEntry[]
    pot_sizings: boolean
    big_blind_size: number
    big_blind_sizings: boolean
  }
  /** 可选鱿鱼策略上下文；发送 /lookup 时会放在请求体顶层，不属于 hand。 */
  squid?: AISquidData
}

/** 鱿鱼策略的奖金曲线：固定 16 项，第一项 f(0) 必须为 0。 */
export type AISquidPenaltyTable = [
  0,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

/** 鱿鱼策略中的单个座位持鱼信息。players 建议覆盖每个座位，无鱼时 squid_count 传 0。 */
export interface AISquidPlayer {
  seat_no: number
  squid_count: number
}

/**
 * /lookup 请求体的顶层 squid 参数。
 * 文档没有定义 squid.mode；玩法通过 is_standup 或 penalty_table 表达。
 */
export interface AISquidData {
  /** 单条鱿鱼价值（BB）；服务端仅接受文档列出的档位。 */
  squid_value_in_bb: 0.5 | 1 | 2 | 2.5 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  /** true 表示 Standup 基础玩法；倍率玩法不设置。 */
  is_standup?: boolean
  /** 倍率玩法的 f(n) 奖金权重，必须 16 项且首项为 0。 */
  penalty_table?: AISquidPenaltyTable
  /** 本手赢家是否获得两条鱿鱼；血战或倍率玩法触发首鱼/尾鱼翻倍时可设为 true。 */
  is_super_squid?: boolean
  /** 各座位持鱼数量；建议列出每个座位，无鱼填 0。 */
  players?: AISquidPlayer[]
  /** 本轮鱿鱼总数；Standup 使用 N-1，倍率玩法使用 N+3 或 N+4。 */
  total_squids?: number
}

/** /lookup 请求体结构 */
export interface AIRequestBody {
  request_id: string
  mode: string
  disable_bet_randomness: boolean
  hand: AIHandData
  hints: string[]
  strategy_profile?: Record<string, any>
  request_profile?: string
  mtt?: AIMttData
  player_action?: string
  reduced_actions_tier?: number
  strategy_min_threshold?: number
  show_labels?: boolean
  protocol_ver?: string
  /** 鱿鱼玩法参数；需同时将 hand.game_mode_code 设为 squid。 */
  squid?: AISquidData
}

// MTT 锦标赛相关数据结构

/** MTT 锦标赛玩家信息 */
export interface AIMttPlayer {
  stack: number
  rank: number
}

/** MTT 锦标赛名次奖金 */
export interface AIPositionPayout {
  position: number
  prize_value: number
}

/** MTT 锦标赛盲注级别 */
export interface AIMttBlind {
  level: number
  ante: number
  big_blind: number
  small_blind: number
}

/** MTT 锦标赛数据 */
export interface AIMttData {
  prize_pool: number
  total_registered_players: number
  current_level: number
  players: AIMttPlayer[]
  payout_structure: AIPositionPayout[]
  blind_structure: AIMttBlind[]
}

/** AI 动作推荐结构 */
export interface AIActionRecommendation {
  action: {
    action: string
    amount: number | null
    pot_size: number | null
    player_position: string | null
    seat_no: number
    action_time: string | null
  }
  action_name: string
  hand_strategy: number
  hand_ev: number
}

/** /lookup 接口的响应数据 */
export interface AIResponseData {
  request_id: string
  gameuuid: string
  roomid?: string
  roomuuid?: string
  actions: AIActionRecommendation[]
  suggested_action: {
    action: string
    amount: number | null
    pot_size: number | null
    player_position: string | null
    seat_no: number
    action_time: string | null
  }
}

/** /lookup 接口的完整响应（包含外层包装字段） */
export interface AIDecisionResponse {
  request_id?: string
  gameuuid?: string
  roomid?: string
  optional_data?: string
  strategy: AIResponseData
  model_closest_action?: string
  solution_information?: {
    ev_mistake_score: number
    [key: string]: any
  }
  [key: string]: any
}
