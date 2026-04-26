import { expect } from 'chai';
import { AllTerminalsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_all-terminals';
import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, TileSetType } from '../../../src/majiang/core/rule-types';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
}

// 创建对子
function createPair(type: TileType, value: number, startId = 1): Tile[] {
  return [
    new Tile(type, value, startId),
    new Tile(type, value, startId + 1)
  ];
}

// 创建刻子
function createPung(type: TileType, value: number, startId = 1): TileSet {
  return {
    type: 'PENG',
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2)
    ]
  };
}

// 创建顺子
function createChow(type: TileType, startValue: number, startId = 1): TileSet {
  return {
    type: 'CHI',
    tiles: [
      new Tile(type, startValue, startId),
      new Tile(type, startValue + 1, startId + 1),
      new Tile(type, startValue + 2, startId + 2)
    ]
  };
}

// 创建杠
function createKong(type: TileType, value: number, startId = 1, source: 'ming' | 'an' | 'bu' = 'ming'): TileSet {
  return {
    type: 'GANG',
    source,
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2),
      new Tile(type, value, startId + 3)
    ]
  };
}

describe('全幺九检测器', () => {
  let detector: AllTerminalsDetector;

  beforeEach(() => {
    detector = new AllTerminalsDetector();
  });

  // 辅助函数：创建牌
  const createTile = (type: TileType, value: number): Tile => {
    return new Tile(type, value, 0);
  };

  // 辅助函数：创建面子
  const createSet = (type: TileSetType, tiles: Tile[]): TileSet => {
    return { type, tiles };
  };

  // 基本属性测试
  it('应该返回正确的名称、描述和分数', () => {
    expect(detector.getName()).to.equal('全幺九');
    expect(detector.getDescription()).to.equal('由幺九牌组成的和牌');
    expect(detector.getScore()).to.equal(32);
  });

  // =================== 符合条件的组合测试 ===================
  // 组合1：4副吃 + 1对子（全幺九）
  it('应该能识别4副刻子+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1, 9, 9, 9], 7),
      ...createTiles(TileType.FENG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合2：3副刻子 + 1副吃 + 1对子（全幺九）
  it('应该能识别3副刻子+1副刻子吃+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合3：3副刻子 + 1副杠 + 1对子（全幺九）
  it('应该能识别3副刻子+1副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.JIAN, 1, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合4：2副刻子 + 2副吃 + 1对子（全幺九）
  it('应该能识别2副刻子+2副刻子吃+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.TONG, [9, 9, 9], 10),
      ...createTiles(TileType.FENG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合5：2副刻子 + 1副吃 + 1副杠 + 1对子（全幺九）
  it('应该能识别2副刻子+1副刻子吃+1副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合6：2副刻子 + 2副杠 + 1对子（全幺九）
  it('应该能识别2副刻子+2副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.FENG, [1, 1], 7)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 1, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合7：1副刻子 + 3副吃 + 1对子（全幺九）
  it('应该能识别1副刻子+3副刻子吃+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合8：1副刻子 + 2副吃 + 1副杠 + 1对子（全幺九）
  it('应该能识别1副刻子+2副刻子吃+1副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.JIAN, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合9：1副刻子 + 1副吃 + 2副杠 + 1对子（全幺九）
  it('应该能识别1副刻子+1副刻子吃+2副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.JIAN, [1, 1], 7)
    ];
    const revealedSets = [
      createKong(TileType.TONG, 9, 9),
      createKong(TileType.FENG, 1, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合10：1副刻子 + 3副杠 + 1对子（全幺九）
  it('应该能识别1副刻子+3副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.JIAN, [1, 1], 4)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 1, 6),
      createKong(TileType.TONG, 9, 10),
      createKong(TileType.FENG, 1, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合11：4副杠 + 1对子（全幺九）
  it('应该能识别4副杠+1对子的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 9, 3),
      createKong(TileType.TIAO, 1, 7),
      createKong(TileType.TONG, 9, 11),
      createKong(TileType.FENG, 1, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 混合花色测试（全幺九）
  it('应该能识别混合花色的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 纯字牌测试（全幺九）
  it('应该能识别纯字牌的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4], 1),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 七对子测试（全幺九）
  it('应该能识别七对子的全幺九组合', () => {
    const handTiles = [
      ...createPair(TileType.WAN, 1, 1),
      ...createPair(TileType.WAN, 9, 3),
      ...createPair(TileType.TIAO, 1, 5),
      ...createPair(TileType.TIAO, 9, 7),
      ...createPair(TileType.TONG, 1, 9),
      ...createPair(TileType.TONG, 9, 11),
      ...createPair(TileType.FENG, 1, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  describe('基本牌型测试', () => {
    it('应该能识别纯幺九牌型 - 七对子', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9), createTile(TileType.TIAO, 9),
        createTile(TileType.TONG, 1), createTile(TileType.TONG, 1),
        createTile(TileType.TONG, 9), createTile(TileType.TONG, 9),
        createTile(TileType.FENG, 1), createTile(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles)).to.be.true;
    });

    it('不应该识别非幺九牌型 - 七对子', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9), createTile(TileType.TIAO, 9),
        createTile(TileType.TONG, 1), createTile(TileType.TONG, 1),
        createTile(TileType.TONG, 9), createTile(TileType.TONG, 9),
        createTile(TileType.WAN, 2), createTile(TileType.WAN, 2)
      ];
      expect(detector.detect(handTiles)).to.be.false;
    });
  });

  describe('带吃碰杠的牌型测试', () => {
    it('应该能识别带一个吃的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9), createTile(TileType.TIAO, 9),
        createTile(TileType.TONG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 1),
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应该识别带非幺九吃的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9), createTile(TileType.TIAO, 9),
        createTile(TileType.TONG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带一个碰的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带非幺九碰的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 9)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带一个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  describe('复杂牌型测试', () => {
    it('应该能识别带多个吃碰杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 1),
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应该识别带非幺九牌的组合', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  describe('更多复杂牌型测试', () => {
    it('应该能识别带两个吃的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 1),
          createTile(TileType.TONG, 1),
          createTile(TileType.TONG, 1)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带两个非幺九吃的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带两个碰的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带两个非幺九碰的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带两个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带两个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带一个碰一个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带一个非幺九碰一个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  describe('三个碰杠组合测试', () => {
    it('应该能识别带三个碰的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带三个非幺九碰的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带三个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('GANG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带三个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带两个碰一个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('GANG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带两个非幺九碰一个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  describe('四个碰杠组合测试', () => {
    it('应该能识别带四个碰的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带四个非幺九碰的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带四个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('GANG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ]),
        createSet('GANG', [
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带四个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别带三个碰一个杠的幺九牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9),
          createTile(TileType.TIAO, 9)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ]),
        createSet('GANG', [
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别带三个非幺九碰一个非幺九杠的牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1), createTile(TileType.WAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  // =================== 不符合条件的组合测试 ===================
  // 组合1：4副刻子 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的4副刻子+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1, 9, 9, 9], 7),
      ...createTiles(TileType.FENG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合2：3副刻子 + 1副吃 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的3副刻子+1副刻子吃+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [3, 3, 3], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合3：3副刻子 + 1副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的3副刻子+1副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 5, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合4：2副刻子 + 2副吃 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的2副刻子+2副刻子吃+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [4, 4, 4], 7),
      ...createTiles(TileType.TONG, [6, 6, 6], 10),
      ...createTiles(TileType.FENG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合5：2副刻子 + 1副吃 + 1副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的2副刻子+1副刻子吃+1副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合6：2副刻子 + 2副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的2副刻子+2副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
      ...createTiles(TileType.FENG, [1, 1], 7)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 5, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合7：1副刻子 + 3副吃 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的1副刻子+3副刻子吃+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.TONG, [3, 3, 3], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合8：1副刻子 + 2副吃 + 1副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的1副刻子+2副刻子吃+1副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [4, 4, 4], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.JIAN, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合9：1副刻子 + 1副吃 + 2副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的1副刻子+1副刻子吃+2副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [5, 5, 5], 4),
      ...createTiles(TileType.JIAN, [1, 1], 7)
    ];
    const revealedSets = [
      createKong(TileType.TONG, 9, 9),
      createKong(TileType.FENG, 1, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合10：1副刻子 + 3副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的1副刻子+3副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [2, 2, 2], 1),
      ...createTiles(TileType.JIAN, [1, 1], 4)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 1, 6),
      createKong(TileType.TONG, 9, 10),
      createKong(TileType.FENG, 1, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合11：4副杠 + 1对子（非全幺九）
  it('不应该识别含有非幺九牌的4副杠+1对子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 3, 3),
      createKong(TileType.TIAO, 1, 7),
      createKong(TileType.TONG, 9, 11),
      createKong(TileType.FENG, 1, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 混合花色测试（非全幺九）
  it('不应该识别含有非幺九牌的混合花色组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [2, 2, 2], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 顺子测试（非全幺九）
  it('不应该识别含有顺子的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 七对子测试（非全幺九）
  it('不应该识别含有非幺九牌的七对子组合', () => {
    const handTiles = [
      ...createPair(TileType.WAN, 1, 1),
      ...createPair(TileType.WAN, 9, 3),
      ...createPair(TileType.TIAO, 1, 5),
      ...createPair(TileType.TIAO, 5, 7),
      ...createPair(TileType.TONG, 1, 9),
      ...createPair(TileType.TONG, 9, 11),
      ...createPair(TileType.FENG, 1, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 额外的边界测试
  it('不应该识别空手牌', () => {
    expect(detector.detect([], [])).to.be.false;
  });

  it('不应该识别只有对子的非完整牌型', () => {
    const handTiles = [
      ...createPair(TileType.WAN, 1, 1),
      ...createPair(TileType.WAN, 9, 3),
      ...createPair(TileType.TIAO, 1, 5)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
  
  // 1-9数牌组合测试（非全幺九）
  it('不应该识别1-9连续数牌的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 全刻子但非幺九牌测试
  it('不应该识别非幺九牌全刻子的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [2, 2, 2, 3, 3, 3], 1),
      ...createTiles(TileType.TIAO, [4, 4, 4, 5, 5, 5], 7),
      ...createTiles(TileType.TONG, [6, 6], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 混合测试 - 各种组合方式
  // 补充测试: 混合花色的全幺九和非全幺九对比
  it('应该能识别混合花色的全幺九组合(变体)', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 7),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('不应该识别混合花色中含有非幺九牌的组合(变体)', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [5, 5, 5], 4),
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 7),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 补充测试: 所有花色的1和9的组合
  it('应该能识别所有花色的1和9的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.WAN, [9, 9, 9], 4),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.TIAO, [9, 9, 9], 10),
      ...createTiles(TileType.TONG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('不应该识别所有花色中含有非1和9的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.WAN, [9, 9, 9], 4),
      ...createTiles(TileType.TIAO, [1, 1, 1], 7),
      ...createTiles(TileType.TIAO, [8, 8, 8], 10),
      ...createTiles(TileType.TONG, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 补充测试: 幺九牌结合字牌的组合
  it('应该能识别幺九牌结合字牌的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [2, 2, 2], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('不应该识别幺九牌结合字牌但包含非幺九数牌的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [2, 2, 2], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [2, 2, 2], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 补充测试: 不同的杠组合
  it('应该能识别含有明杠的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.JIAN, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12, 'ming')];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  it('应该能识别含有暗杠的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.JIAN, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12, 'an')];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  it('应该能识别含有补杠的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1, 1], 7),
      ...createTiles(TileType.JIAN, [1, 1], 10)
    ];
    const revealedSets = [createKong(TileType.TONG, 9, 12, 'bu')];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 补充测试: 特殊牌型结合
  it('应该能识别刻子和杠的组合方式的全幺九', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.FENG, [1, 1], 7)
    ];
    const revealedSets = [
      createPung(TileType.TONG, 1, 9),
      createKong(TileType.FENG, 2, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  it('不应该识别刻子和杠的组合但包含非幺九牌', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [5, 5, 5], 4),
      ...createTiles(TileType.FENG, [1, 1], 7)
    ];
    const revealedSets = [
      createPung(TileType.TONG, 1, 9),
      createKong(TileType.FENG, 2, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 补充测试: 多种杠的组合
  it('应该能识别含有多种杠的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.JIAN, [1, 1], 4)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 1, 6, 'ming'),
      createKong(TileType.TONG, 9, 10, 'an'),
      createKong(TileType.FENG, 1, 14, 'bu')
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  it('不应该识别含有多种杠但包含非幺九牌的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.JIAN, [1, 1], 4)
    ];
    const revealedSets = [
      createKong(TileType.TIAO, 1, 6, 'ming'),
      createKong(TileType.TONG, 5, 10, 'an'),
      createKong(TileType.FENG, 1, 14, 'bu')
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 补充测试: 极端刻子组合
  it('应该能识别全部为数字1的刻子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    // 全部是1和字牌，属于幺九牌
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('应该能识别全部为数字9的刻子组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    // 全部是9和字牌，属于幺九牌
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('应该能识别全部为风牌的刻子组合', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1], 1),
      ...createTiles(TileType.FENG, [2, 2, 2], 4),
      ...createTiles(TileType.FENG, [3, 3, 3], 7),
      ...createTiles(TileType.FENG, [4, 4, 4], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 补充测试: 极端七对子组合
  it('应该能识别全部为数字1的七对子组合', () => {
    const handTiles = [
      // 使用七个不同的对子，而不是重复的对子
      createTile(TileType.WAN, 1), createTile(TileType.WAN, 1),
      createTile(TileType.TIAO, 1), createTile(TileType.TIAO, 1),
      createTile(TileType.TONG, 1), createTile(TileType.TONG, 1),
      createTile(TileType.FENG, 1), createTile(TileType.FENG, 1),
      createTile(TileType.FENG, 2), createTile(TileType.FENG, 2),
      createTile(TileType.FENG, 3), createTile(TileType.FENG, 3),
      createTile(TileType.FENG, 4), createTile(TileType.FENG, 4)
    ];
    // 全部是1和字牌，属于幺九牌
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('应该能识别全部为数字9的七对子组合', () => {
    const handTiles = [
      // 使用七个不同的对子，而不是重复的对子
      createTile(TileType.WAN, 9), createTile(TileType.WAN, 9),
      createTile(TileType.TIAO, 9), createTile(TileType.TIAO, 9),
      createTile(TileType.TONG, 9), createTile(TileType.TONG, 9),
      createTile(TileType.FENG, 1), createTile(TileType.FENG, 1),
      createTile(TileType.FENG, 2), createTile(TileType.FENG, 2),
      createTile(TileType.JIAN, 1), createTile(TileType.JIAN, 1),
      createTile(TileType.JIAN, 2), createTile(TileType.JIAN, 2)
    ];
    // 全部是9和字牌，属于幺九牌
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('应该能识别全部为字牌的七对子组合', () => {
    const handTiles = [
      ...createPair(TileType.FENG, 1, 1),
      ...createPair(TileType.FENG, 2, 3),
      ...createPair(TileType.FENG, 3, 5),
      ...createPair(TileType.FENG, 4, 7),
      ...createPair(TileType.JIAN, 1, 9),
      ...createPair(TileType.JIAN, 2, 11),
      ...createPair(TileType.JIAN, 3, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 补充边界测试
  it('不应该识别包含顺子的手牌', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3], 1),
      ...createTiles(TileType.TIAO, [1, 1, 1], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  it('不应该识别包含非传统麻将牌的组合', () => {
    // 非传统麻将牌在现实测试环境中无法模拟，因此改变测试场景
    // 使用一个有效的手牌，但破坏了胡牌结构
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      // 剩下3张牌而不是2张，破坏了胡牌结构
      ...createTiles(TileType.FENG, [1, 1, 1], 10)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 补充可行性测试
  it('应该能识别刚好满足条件的全幺九组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('不应该识别只差一张牌满足条件的组合', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      // 少一张对子的牌
      new Tile(TileType.JIAN, 1, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
}); 