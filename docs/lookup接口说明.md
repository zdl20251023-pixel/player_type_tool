# lookup 接口说明

`lookup` 根据牌局初始状态、行动历史和当前玩家底牌，返回当前决策点的策略，包括可选动作、动作概率、EV 和建议动作。

## 1. 接口地址

```http
POST /lookup
Content-Type: application/json
```

项目实际请求路径为 `/lookup?services=RL`，服务器地址从 `AI_SERVICE_URL` 读取，代理和认证按接入环境配置。

普通模式 `normal` 和鱿鱼模式 `squid` 均已完成样本请求验证。

## 2. 请求参数

### 2.1 主要参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `request_id` | string | 请求追踪标识，用于关联请求、响应和日志 |
| `hand` | object | 完整牌局上下文 |
| `request_profile` | string | 三方请求预设名称，例如 `h2n` |
| `strategy_min_threshold` | number | 概率过滤阈值，例如 `0.05` 表示将低于 5% 的动作概率归零，其余重新归一化 |
| `disable_bet_randomness` | boolean | 是否关闭下注尺寸随机扰动 |
| `reduced_actions_tier` | number | 精简动作菜单档位，支持 `1`、`2`、`3` |
| `show_labels` | boolean | 是否返回动作的 `ev_rank` 标签 |
| `player_action` | string | 玩家实际动作，用于匹配菜单和计算 EV 损失 |
| `strategy_profile` | object | 玩家策略风格配置，例如目标 VPIP、PFR、WTSD、AF |

常规查询以 `request_id`、`hand` 为核心，其余参数按需要设置，也可以通过 `request_profile` 应用预设。

### 2.2 牌局上下文 hand

服务器通过初始状态和行动历史重放牌局，确定当前街道和行动玩家。

| 参数 | 类型 | 说明 |
|---|---|---|
| `gameuuid` | string | 手牌标识 |
| `game_type` | string | 牌种，例如 `nlhe` |
| `game_mode_code` | string | 玩法模式，普通局为 `normal`，鱿鱼游戏为 `squid` |
| `players` | array | 本手参与玩家的初始信息 |
| `players[].seat_no` | number | 玩家座位编号 |
| `players[].stack` | number | 本手开始、扣除盲注和前注之前的筹码 |
| `players[].hole_cards` | string | 待查询玩家的底牌，例如 `AsKh` |
| `big_blind` | number | 大盲金额 |
| `ante` | number | 前注金额 |
| `dealer_seat` | number | BTN 座位 |
| `sb_seat` / `bb_seat` | number | 小盲、大盲座位 |
| `straddle_seat` | number | Straddle 座位，没有时填 `-1` |
| `actions.entries` | array | 截止当前决策点的完整行动历史 |

查询某个决策时，历史应截止到该动作发生之前。底牌放在待查询玩家的 `players[]` 条目中。

### 2.3 行动历史 actions.entries

| 参数 | 说明 |
|---|---|
| `seat_no` | 执行动作的玩家座位 |
| `action` | `fold`、`check`、`call`、`bet`、`raise`、`allin`，或者公共牌字符串 |
| `amount` | 动作金额，按请求采用的金额编码解释 |

例如下面表示 BTN 加注到 500、BB 跟注，再发出翻牌。

```json
[
  { "seat_no": 0, "action": "raise", "amount": 500 },
  { "seat_no": 2, "action": "call", "amount": 0 },
  { "seat_no": -1, "action": "AcQdJd", "amount": 0 }
]
```

项目常规筹码编码下，Raise 使用本街累计加注到的金额，Bet 使用本次下注量。现有实测样本中 Call 使用 `amount=0`。

### 2.4 其他参数

`mode`、`protocol_ver` 用于场景和协议设置，B2C 文档采用 `bot`、`v2.1`。`hints` 为附加提示，`bet_profile` 为下注配置，`mtt` 用于传入锦标赛奖金、排名和盲注结构。

`hand` 还支持牌种代码、房间标识、补盲座位及行动金额编码等辅助字段，包括 `game_type_code`、`roomid`、`roomuuid`、`post_seats`、`actions.pot_sizings`、`actions.big_blind_sizings`、`actions.big_blind_size`，按接入需要设置。

## 3. Request Profile 配置组

### 3.1 h2n 的作用

`h2n` 是三方服务器维护的请求预设名称。传入 `request_profile: "h2n"` 后，服务器为本次请求补齐对应配置。

B2C 文档给出的标准配置组如下。

| 配置项 | 文档标准值 | 作用 |
|---|---|---|
| `strategy_min_threshold` | `0.05` | 过滤低概率动作 |
| `disable_bet_randomness` | `true` | 关闭下注尺寸随机扰动 |
| `reduced_actions_tier` | `3` | 生成标准精简菜单，最多六个动作 |
| `show_labels` | `true` | 返回 EV 分类标签 |
| `mode` | `"bot"` | 使用场景标记 |
| `protocol_ver` | `"v2.1"` | 协议版本 |

具体 profile 的配置由三方按客户接入约定维护，表中的标准值需要与实际配置核对。

### 3.2 参数覆盖规则

显式传入的非空参数优先，省略或传 `null` 的字段由 profile 补齐。例如使用 `h2n`，同时希望保留低概率动作，可以额外传入以下字段。

```json
{
  "request_profile": "h2n",
  "strategy_min_threshold": 0
}
```

profile 按每次请求应用。名称无法识别时，服务器可能正常响应但不应用预设，需要检查响应回显或配置诊断。

### 3.3 当前服务器实测

2026 年 11 月 13 日，在项目配置的 lookup 服务器上，使用同一场景仅传入 `request_id`、`hand` 和 `request_profile: "h2n"`，观察到以下结果。

- 返回精简菜单 `reduced_actions` 和动作标签 `ev_rank`。
- 回显关闭下注尺寸随机扰动。
- 回显 `all_actions_zero_threshold=0.05`，该底牌的低概率动作被归零。
- 本次未返回完整 `request` 回显，六项预设的完整取值仍需以三方配置为准。

省略 profile 时使用 `moe_dynamic_703...` 模型，仅传 `h2n` 时使用 `moe_dynamic_472...` 模型。当前服务器的 `h2n` 还影响模型选择路径，两次策略差异不能全部归因于概率过滤。

### 3.4 与 strategy_profile 的区别

| 参数 | 作用 |
|---|---|
| `request_profile` | 应用请求预设，控制阈值、菜单、标签和协议等 |
| `strategy_profile` | 调整玩家策略风格 |

例如 `strategy_profile.target_profile_name` 可以选择三方提供的策略档位。项目的玩家策略钩子使用该能力。

## 4. 返回参数

### 4.1 主要返回字段

| 字段 | 说明 |
|---|---|
| `strategy.actions[]` | 当前底牌的完整候选动作 |
| `strategy.suggested_action` | 本次建议动作 |
| `reduced_actions[]` | 精简后的展示菜单 |
| `model_closest_action` | 与玩家实际动作匹配的精简菜单动作 |
| `solution_information.ev_mistake_score` | 玩家匹配动作相对菜单最优动作的 EV 损失 |
| `solution_information.source` | 实际使用的模型或策略来源 |
| `solution_information.strategy_profile_config` | 玩家策略配置应用情况 |
| `request` | 应用 profile 后的请求回显，实际可能缺失 |

请求标识、房间信息、版本、耗时、警告和模型原始输出等辅助信息按服务版本返回。需要同时检查 HTTP 状态和业务响应，HTTP 200 可能包含引擎错误。

### 4.2 动作条目

`strategy.actions[]` 的重要字段如下。

| 字段 | 说明 |
|---|---|
| `action_name` | 动作编码，例如 `f`、`x`、`b76` |
| `action.action` | 动作类型 |
| `action.amount` | 动作筹码金额 |
| `action.pot_size` | 动作的底池比例 |
| `action.seat_no` | 行动玩家座位 |
| `hand_strategy` | 动作概率，范围 `0～1` |
| `hand_ev` | 动作 EV，当前 B2C 业务按 BB 使用 |
| `ev_rank` | 开启标签时返回的 EV 分类 |

`action_name` 中的数字不能直接当作 BB 或筹码。动作执行和尺寸展示应使用结构化的 `amount`、`pot_size`。

仓库旧文档对 EV 单位存在不同描述，接入不同版本时需要核对。`player_position`、`action_time` 等辅助字段可能为 `null`。

### 4.3 精简菜单 reduced_actions

精简菜单合并部分下注尺寸，便于展示操作按钮。完整策略分析仍可读取 `strategy.actions`。

| reduced_actions_tier | 菜单形式 |
|---|---|
| `1` | 一档加注代表，加上合法的 Fold、Call、Check |
| `2` | 大小两档加注代表，加上合法的非加注动作 |
| `3` | 标准菜单，最多六个动作 |

实际数量受当前合法动作和候选分组限制。`reduced_action_sizing` 的单位在现有文档与示例中存在差异，展示金额优先使用结构化动作金额。

### 4.4 EV 标签与实际动作评分

`ev_rank` 包含 `EVR_0`～`EVR_4`。其中 `EVR_4` 表示策略采用该动作，其余标签根据未采用动作的 EV 分档。

传入 `player_action` 后，服务器匹配精简菜单，并计算评分。

```text
ev_mistake_score = 精简菜单最优动作 EV − 匹配动作 EV
```

评分单位为 BB，`0` 表示匹配动作没有 EV 损失。此功能依赖精简菜单，没有生成菜单时 `player_action` 可能被忽略。

## 5. 请求与响应示例

六人桌，每人初始 100 BB。BTN 开池到 5 BB，BB 跟注，翻牌为 `Ac Qd Jd`，查询 BB 持有 `AsKh` 时的策略。

### 5.1 完整请求

```json
{
  "request_id": "lookup-example",
  "request_profile": "h2n",
  "hand": {
    "gameuuid": "example-hand",
    "game_type": "nlhe",
    "game_mode_code": "normal",
    "players": [
      { "seat_no": 0, "stack": 10000 },
      { "seat_no": 1, "stack": 10000 },
      { "seat_no": 2, "stack": 10000, "hole_cards": "AsKh" },
      { "seat_no": 3, "stack": 10000 },
      { "seat_no": 4, "stack": 10000 },
      { "seat_no": 5, "stack": 10000 }
    ],
    "big_blind": 100,
    "ante": 0,
    "dealer_seat": 0,
    "sb_seat": 1,
    "bb_seat": 2,
    "straddle_seat": -1,
    "actions": {
      "entries": [
        { "seat_no": 3, "action": "fold", "amount": 0 },
        { "seat_no": 4, "action": "fold", "amount": 0 },
        { "seat_no": 5, "action": "fold", "amount": 0 },
        { "seat_no": 0, "action": "raise", "amount": 500 },
        { "seat_no": 1, "action": "fold", "amount": 0 },
        { "seat_no": 2, "action": "call", "amount": 0 },
        { "seat_no": -1, "action": "AcQdJd", "amount": 0 }
      ]
    }
  }
}
```

### 5.2 响应片段

以下摘取仅使用 `h2n` 时的 Check 动作，省略其他候选及诊断字段。

```json
{
  "strategy": {
    "actions": [
      {
        "action_name": "x",
        "action": {
          "action": "check",
          "amount": null,
          "pot_size": null,
          "seat_no": 2
        },
        "hand_strategy": 1,
        "hand_ev": 7.878798484802246,
        "ev_rank": "EVR_4"
      }
    ],
    "suggested_action": {
      "action": "check",
      "amount": null,
      "pot_size": null,
      "seat_no": 2
    }
  }
}
```

若显式设置 `strategy_min_threshold=0`，本场景保留低概率动作，Check 概率约为 `98.8161%`。

## 6. 鱿鱼模式

将 `hand.game_mode_code` 设置为 `squid`，服务器会使用鱿鱼模型。

2026 年 11 月 13 日，同一场景、显式阈值为 `0` 时的实测结果如下。

| 项目 | normal | squid |
|---|---|---|
| 模型 | `moe_dynamic_472...` | `mv2-holdem-squid...` |
| 建议动作 | Check | Bet 8 BB |
| Check 概率 | 98.8161% | 约 0.0000274% |
| Bet 8 BB 概率 | 0.2588% | 88.6544% |
| 返回字段 | 与 squid 相同 | 无新增或删减 |

squid 响应中，完整动作与精简菜单的 EV 存在基准差异。本次 Check 完整 EV 约为 `3.74018`，精简菜单 EV 约为 `43.74018`，Fold EV 为 `-40`，具体定义仍需三方明确。

本次测试使用服务器默认鱿鱼配置，没有传入额外轮次或奖惩状态。

## 7. 独立工具中的使用

本仓库通过 `src/client/lookup.ts` 原样请求 `/lookup?services=RL`，HTTP 实现位于 `src/client/client.ts`，不执行原业务的玩家钩子，不依赖牌桌服务。地址、代理和超时通过本地环境配置。运行命令见项目 README。

三种风格及指标见《三种玩家风格与档位》，行动历史见《100条行动线场景设计》。原始响应完整保存后，由 analysis 与 reports 模块离线分析和生成页面，顶层模型诊断、策略档位回显和精简菜单不会在客户端被裁掉。
