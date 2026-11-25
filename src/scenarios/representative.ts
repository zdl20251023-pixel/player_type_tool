// 按需运行的补充路线，不计入默认 100 条；编码与 fixtures.ts 相同。
export const representativeFixtures = [
  {
    id: 'S01',
    hero: 0,
    cards: 'As5s',
    street: 'preflop',
    category: '代表路线 / 轻 4bet',
    description: 'BTN 同花小 A 面对 BB 3bet：弃牌、跟注与轻 4bet',
    history: 'UTG、HJ、CO 弃牌；Hero 开池到 2.5BB；SB 弃牌；BB 3bet 到 11BB，回到 Hero。',
    line: '3:f 4:f 5:f 0:r2.5 1:f 2:r11',
  },
  {
    id: 'S02',
    hero: 2,
    cards: 'JhTh',
    street: 'flop',
    category: '代表路线 / 组合听牌',
    description: 'BB 同花听牌加两头顺听牌：被动跟注或过牌加注半诈唬',
    history:
      'UTG、HJ、CO 弃牌；BTN 开池到 2.5BB；SB 弃牌；Hero 跟注。翻牌 Qh9h2c：Hero 过牌，BTN 下注 3.5BB，轮到 Hero。',
    line: '3:f 4:f 5:f 0:r2.5 1:f 2:c @Qh9h2c 2:x 0:b3.5',
  },
  {
    id: 'S03',
    hero: 2,
    cards: 'AcJd',
    street: 'river',
    category: '代表路线 / 超池抓诈唬',
    description: '顶对 J 踢脚面对河牌超池第三枪：跟注倾向与弃牌纪律',
    history:
      'UTG、HJ、CO 弃牌；BTN 开池到 2.5BB；SB 弃牌；Hero 跟注。翻牌 As8c4d：Hero 过牌，BTN 下注 2BB，Hero 跟注。转牌 6s：Hero 过牌，BTN 下注 7BB，Hero 跟注。河牌 2h：Hero 过牌，BTN 下注 30BB，轮到 Hero。',
    line: '3:f 4:f 5:f 0:r2.5 1:f 2:c @As8c4d 2:x 0:b2 2:c @6s 2:x 0:b7 2:c @2h 2:x 0:b30',
  },
] as const
