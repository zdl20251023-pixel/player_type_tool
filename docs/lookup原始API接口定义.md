# 德州扑克AI决策建议接口



## 请求

请求的`url`和headers中的`token`均配置在环境变量中，以及是否使用proxy去访问AI接口，以及proxy的地址



### 主要参数说明

body中的`request_id`用于定位请求和响应的关联

`hand.roomid`用于表示牌局发生在哪张牌桌上（主要用于区分是哪个用户）

`hand.gameuuid`则用于区分独立的每一手牌

上述字段在封装发送请求的接口时，需要暴露参数以供设置



`hand.players`是牌桌上所有玩家的初始状态设置（起始筹码量，座位号）、`hold_cards`表示hero（也就是玩家自己）的底牌，有且仅有一位玩家可以设置底牌

`hand.actions`表示牌局的进程，也就是这手牌是怎么打的

更详细的参数介绍，可以参考《Strategy+API+Documentation.md》



发送请求的示例代码如下：

```javascript
const headers = {
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const body = {
  request_id: "nlhe_cash_sample_1",
  mode: "bot",
  hand: {
    gameuuid: "nlhe_cash_67890",
    game_type: "No-Limit Hold'em",
    game_type_code: "nlhe",
    game_mode_code: "normal",
    players: [
      { seat_no: 0, stack: 9850 }, // SB
      { seat_no: 1, stack: 10200 }, // BB
      { seat_no: 2, stack: 10000, hole_cards: "AsKd" }, // UTG - Hero
      { seat_no: 3, stack: 9500 }, // MP
      { seat_no: 4, stack: 11300 }, // CO
      { seat_no: 5, stack: 8900 }, // BTN
    ],
    big_blind: 100,
    ante: 0, // No ante in cash games typically
    dealer_seat: 5,
    sb_seat: 0,
    bb_seat: 1,
    roomid: "cash_room_456",
    straddle_seat: -1, // No straddle
    post_seats: [],
      
    actions: {
      entries: [
        // Preflop action
        { seat_no: 2, action: "raise", amount: 300 }, // Hero raises 3x BB
        { seat_no: 3, action: "fold" },
        { seat_no: 4, action: "call" }, // CO calls
        { seat_no: 5, action: "fold" }, // BTN folds
        { seat_no: 0, action: "fold" }, // SB folds
        { seat_no: 1, action: "call" }, // BB calls
        // Flop
        { action: "Ah8c5s" },
        { seat_no: 1, action: "check" }, // BB checks
        { seat_no: 2, action: "bet", amount: 450 }, // Hero c-bets
        { seat_no: 4, action: "call" }, // CO calls
        { seat_no: 1, action: "fold" }, // BB folds
        // Turn
        { action: "2h" },
        { seat_no: 2, action: "bet", amount: 1100 }, // Hero bets
        { seat_no: 4, action: "raise", amount: 3200 }, // CO raises
        // Hero's decision point - facing a turn raise
      ],
      pot_sizings: false,
      big_blind_size: 100,
      big_blind_sizings: false,
    },
  },
  hints: [],
};

console.log("Sending NL Hold'em Cash Game data fetch request...");
console.log("Cash Game Info:");
console.log(`- Game Type: ${body.hand.game_type}`);
console.log(`- Stakes: $${body.hand.big_blind / 2}/$${body.hand.big_blind}`);
console.log(`- Players at table: ${body.hand.players.length}`);
console.log(
  `- Hero Position: UTG (seat ${
    body.hand.players.find((p) => p.hole_cards).seat_no
  })`
);
console.log(
  `- Hero Stack: $${body.hand.players.find((p) => p.hole_cards).stack}`
);
console.log(
  `- Hero Cards: ${body.hand.players.find((p) => p.hole_cards).hole_cards}`
);

fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("\n=== NL Hold'em Cash Game Strategy Response ===");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```



## 响应

针对上面的示例，轮到hero行动了，请求的接口返回响应如下：

```json
{
  "request": {
    "request_id": "nlhe_cash_sample_1",
    "hand": {
      "gameuuid": "nlhe_cash_67890",
      "game_mode_code": "normal",
      "players": [
        {
          "seat_no": 0,
          "stack": 9850,
          "uid": null,
          "hole_cards": null,
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        },
        {
          "seat_no": 1,
          "stack": 10200,
          "uid": null,
          "hole_cards": null,
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        },
        {
          "seat_no": 2,
          "stack": 10000,
          "uid": null,
          "hole_cards": "AsKd",
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        },
        {
          "seat_no": 3,
          "stack": 9500,
          "uid": null,
          "hole_cards": null,
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        },
        {
          "seat_no": 4,
          "stack": 11300,
          "uid": null,
          "hole_cards": null,
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        },
        {
          "seat_no": 5,
          "stack": 8900,
          "uid": null,
          "hole_cards": null,
          "position": null,
          "win_amount": 0,
          "rake_amount": 0,
          "platform": null,
          "bounty": null,
          "rank": 0
        }
      ],
      "actions": {
        "entries": [
          {
            "action": "raise",
            "amount": 300,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 3,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 5,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 0,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "Ah8c5s",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "check",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 450,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "2h",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 1100,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "raise",
            "amount": 3200,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          }
        ],
        "pot_sizings": false,
        "big_blind_size": 100,
        "big_blind_sizings": false
      },
      "big_blind": 100,
      "ante": 0,
      "dealer_seat": 5,
      "sb_seat": 0,
      "bb_seat": 1,
      "game_type": "No-Limit Hold'em",
      "game_type_code": "nlhe",
      "game_group": null,
      "date": null,
      "roomid": "cash_room_456",
      "roomuuid": null,
      "straddle_seat": -1,
      "flop_pot": null,
      "turn_pot": null,
      "river_pot": null,
      "final_pot": null,
      "post_seats": [],
      "currency": null,
      "small_blind": 50,
      "tournament_id": null,
      "live_ante": null
    },
    "subsystem": null,
    "hints": [],
    "mtt": null,
    "version": "2.0.0",
    "services": [
      "RL"
    ],
    "mode": "bot",
    "strategy_profile": null,
    "bet_profile": null,
    "exploiting_info": null,
    "client_alias": null
  },
  "solution_information": {
    "situation_key": {
      "game_type": "cash__nlhe__8max_ante",
      "bb_depth": 100,
      "players_bin": "6",
      "street": "turn",
      "flop": "Ah8c5s",
      "action_pot_seq": {
        "entries": [
          {
            "action": "raise",
            "amount": 300,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 3,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 5,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 0,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "Ah8c5s",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "check",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 450,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "2h",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 1100,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "raise",
            "amount": 3200,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          }
        ],
        "pot_sizings": true,
        "big_blind_size": 100,
        "big_blind_sizings": false
      },
      "action_pot_seq_search": "r:f:c:f:f:c:Ah8c5s:x:b:c:f:2h:b:r",
      "decision_action_pot_seq": {
        "entries": [
          {
            "action": "raise",
            "amount": 300,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 3,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 5,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 0,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "Ah8c5s",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "check",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 450,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          },
          {
            "action": "call",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 1,
            "action_time": null
          },
          {
            "action": "fold",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": 2,
            "action_time": null
          },
          {
            "action": "2h",
            "amount": null,
            "pot_size": null,
            "player_position": null,
            "seat_no": null,
            "action_time": null
          },
          {
            "action": "bet",
            "amount": 1100,
            "pot_size": null,
            "player_position": null,
            "seat_no": 4,
            "action_time": null
          }
        ],
        "pot_sizings": true,
        "big_blind_size": 100,
        "big_blind_sizings": false
      },
      "decision_action_pot_seq_search": "r:f:c:f:f:c:Ah8c5s:x:b:c:f:2h:b"
    },
    "source": "rlserv:ded3d30-89f4ddf3---2-0-702---20250519_051512",
    "version": "2.0.0",
    "soft_warnings": null,
    "table": "+----------------------+-------------+-------------+------------+-------+--------+\n|         CUR:2        |   Preflop   | Flop Ah8c5s |   Turn 2h  | River | Profit |\n+----------------------+-------------+-------------+------------+-------+--------+\n|   SB+0 5d7h|50/9850  | [50] #5_f   |             |            |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n|  SB+1 Qs5c|300/10200 | [100] #6_c  | #7_c #10_f  |            |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n| SB+2 AsKd|1850/10000 | [0] #1_r300 | #8_r750     | #11_r1850  |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n|   SB+3 6s7d|0/9500   | [0] #2_f    |             |            |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n| SB+4 6h8h|3950/11300 | [0] #3_c    | #9_c        | #12_r3950  |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n|   SB+5 5h4d|0/8900   | [0] #4_f    |             |            |       |        |\n+----------------------+-------------+-------------+------------+-------+--------+\n",
    "build_date": "Jul 17 2025 20:50:45",
    "obs_string": "[blinds=2|bb=100|ante=0|format=normal]r2p2 STATE:0:r300fcffc/cr750cf/r1850r3950:5d7h|Qs5c|AsKd|6s7d|6h8h|5h4d/Ah8c5s/2h:9850|10200|10000|9500|11300|8900:50|300|1850|0|3950|0",
    "bet_profile_config": {
      "bet_profile": "no_profile_applied",
      "bet_profile_config_id": -1,
      "bet_size_mapping_result": "no_profile_applied",
      "betsize_threshold": 0.75,
      "called_pot": -1,
      "is_open_raise": false,
      "pot": -1
    },
    "strategy_profile_config": {
      "strategy_after_adjust": "no_profile_applied",
      "strategy_before_adjust": "no_profile_applied",
      "strategy_config": "no_profile_applied",
      "strategy_config_name": "no_profile_applied"
    }
  },
  "strategy": {
    "decision_action_seq": {
      "entries": [
        {
          "action": "raise",
          "amount": 300,
          "pot_size": 0.8,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        {
          "action": "fold",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 3,
          "action_time": null
        },
        {
          "action": "call",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 4,
          "action_time": null
        },
        {
          "action": "fold",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 5,
          "action_time": null
        },
        {
          "action": "fold",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 0,
          "action_time": null
        },
        {
          "action": "call",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 1,
          "action_time": null
        },
        {
          "action": "Ah8c5s",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 1,
          "action_time": null
        },
        {
          "action": "check",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 1,
          "action_time": null
        },
        {
          "action": "bet",
          "amount": 450,
          "pot_size": 0.4736842105263157,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        {
          "action": "call",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 4,
          "action_time": null
        },
        {
          "action": "fold",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 1,
          "action_time": null
        },
        {
          "action": "2h",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        {
          "action": "bet",
          "amount": 1100,
          "pot_size": 0.5945945945945945,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        {
          "action": "raise",
          "amount": 3200,
          "pot_size": 0.5185185185185186,
          "player_position": null,
          "seat_no": 4,
          "action_time": null
        }
      ],
      "pot_sizings": false,
      "big_blind_size": 100,
      "big_blind_sizings": false
    },
    "actions": [
      {
        "action": {
          "action": "fold",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        "action_name": "f",
        "action_seq": null,
        "hand_strategy": 0.010900100693106651,
        "hand_ev": null,
        "strategy": [],
        "ev": []
      },
      {
        "action": {
          "action": "call",
          "amount": null,
          "pot_size": null,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        "action_name": "c",
        "action_seq": null,
        "hand_strategy": 0.9881504774093628,
        "hand_ev": null,
        "strategy": [],
        "ev": []
      },
      {
        "action": {
          "action": "allin",
          "amount": 9250,
          "pot_size": 0.7333333333333334,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        "action_name": "allin73",
        "action_seq": null,
        "hand_strategy": 0.00003599521005526185,
        "hand_ev": null,
        "strategy": [],
        "ev": []
      },
      {
        "action": {
          "action": "raise",
          "amount": 6700,
          "pot_size": 0.4242424242424243,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        "action_name": "r34",
        "action_seq": null,
        "hand_strategy": 0.0008681057370267808,
        "hand_ev": null,
        "strategy": [],
        "ev": []
      },
      {
        "action": {
          "action": "raise",
          "amount": 6650,
          "pot_size": 0.4181818181818182,
          "player_position": null,
          "seat_no": 2,
          "action_time": null
        },
        "action_name": "r33",
        "action_seq": null,
        "hand_strategy": 0.000045391258026938885,
        "hand_ev": null,
        "strategy": [],
        "ev": []
      }
    ],
    "suggested_action": {
      "action": "call",
      "amount": null,
      "pot_size": null,
      "player_position": null,
      "seat_no": 2,
      "action_time": null
    }
  },
  "flags": [],
  "strategy_profile": null,
  "warnings": []
}
```



响应中最主要关心的部分是`strategy`部分，其中的`actions`数组下的每个元素就是经过AI分析后的操作建议：

`action.action`对象是AI推荐的动作，`action.hand_strategy`是这个动作的推荐度（百分比的小数形式，0.01 = 1%）

`action.suggested_action`是所有推荐的动作中，推荐度最高的操作

接口只需要把这些参数返回出来就可以了，上面响应实例中的其他字段主要用于定位问题的。