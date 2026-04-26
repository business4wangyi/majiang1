import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet } from '../../../src/majiang/core/rule-types';
import { PureSameChowDetector } from '../../../src/majiang/core/win-conditions/win-conditions_pure-same-chow';
import { expect } from 'chai';

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

/**
 * 用于调试的辅助函数，输出手牌和明牌的内容
 */
function debugPrintTiles(handTiles: Tile[], revealedSets: TileSet[] = []) {
  console.log("手牌:", handTiles.map(t => `${t.type}${t.value}`).join(", "));
  
  if (revealedSets.length > 0) {
    console.log("明牌组合:");
    revealedSets.forEach((set, i) => {
      console.log(`  组合${i+1} (${set.type}):`, set.tiles.map(t => `${t.type}${t.value}`).join(", "));
    });
  }
}

describe('PureSameChowDetector', () => {
  let detector: PureSameChowDetector;

  beforeEach(() => {
    detector = new PureSameChowDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('一色四同顺');
    expect(detector.getDescription()).to.equal('和牌中有四组完全相同的顺子，且花色相同');
    expect(detector.getScore()).to.equal(64);
  });
  
  // 仅手牌测试（无明牌）
  describe('Hand tiles only (no revealed sets)', () => {
    it('should detect with four identical chows in hand', () => {
      // 四组1-2-3万的顺子加一对9万
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 9, 9], 1)
      ];
      
      console.log("测试案例：手牌中有四组1-2-3万的顺子");
      debugPrintTiles(handTiles);
      
      const result = detector.detect(handTiles, []);
      console.log("检测结果:", result);
      
      expect(result).to.be.true;
    });
    
    it('should not detect with only three identical chows in hand', () => {
      // 三组1-2-3万的顺子，一组4-5-6万的顺子，加一对9万
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 6, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('should not detect with four identical chows of different suits', () => {
      // 万、条、筒、风各一组1-2-3的顺子，加一对9万
      // 注意：风牌没有顺子，这里仅为演示
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 9, 9], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3], 6),
        ...createTiles(TileType.TONG, [1, 2, 3], 9),
        ...createTiles(TileType.FENG, [1, 2, 3], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
  
  // 仅明牌测试
  describe('Revealed sets only', () => {
    it('should detect with four identical chows in revealed sets', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：四组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12)
      ];
      
      console.log("测试案例：明牌中有四组1-2-3万的顺子");
      debugPrintTiles(handTiles, revealedSets);
      
      const result = detector.detect(handTiles, revealedSets);
      console.log("检测结果:", result);
      
      expect(result).to.be.true;
    });
    
    it('should not detect with only three identical chows in revealed sets', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：三组1-2-3万的顺子，一组4-5-6万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 4, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('should not detect with four identical chows of different suits', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：万、条、筒、风各一组1-2-3的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 1, 6),
        createChow(TileType.TONG, 1, 9),
        createChow(TileType.FENG, 1, 12) // 注：实际上风牌没有顺子，仅为测试
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 混合手牌和明牌测试
  describe('Mixed hand tiles and revealed sets', () => {
    it('should detect with four identical chows split between hand and revealed sets', () => {
      // 手牌：两组1-2-3万的顺子和一对9万
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 9, 9], 1)
      ];
      
      // 明牌：两组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12)
      ];
      
      console.log("测试案例：手牌和明牌组合有四组1-2-3万的顺子");
      debugPrintTiles(handTiles, revealedSets);
      
      const result = detector.detect(handTiles, revealedSets);
      console.log("检测结果:", result);
      
      expect(result).to.be.true;
    });
    
    it('should not detect with three identical chows split between hand and revealed sets', () => {
      // 手牌：一组1-2-3万的顺子，一组4-5-6万的顺子，一对9万
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 9, 9], 1)
      ];
      
      // 明牌：两组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 各种吃碰杠组合测试
  describe('Various combinations of chows, pungs, and kongs', () => {
    // 4吃0碰0杠 - 四组相同顺子
    it('should detect with 4 chows, 0 pungs, 0 kongs - all identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：四组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 3吃1碰0杠 - 三组相同顺子
    it('should not detect with 3 chows, 1 pung, 0 kongs - only three identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：三组1-2-3万的顺子，一个5万刻子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createPung(TileType.WAN, 5, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 3吃0碰1杠 - 三组相同顺子
    it('should not detect with 3 chows, 0 pungs, 1 kong - only three identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：三组1-2-3万的顺子，一个5万杠
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createKong(TileType.WAN, 5, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 2吃2碰0杠 - 两组相同顺子
    it('should not detect with 2 chows, 2 pungs, 0 kongs - only two identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：两组1-2-3万的顺子，两个刻子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createPung(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 2吃1碰1杠 - 两组相同顺子
    it('should not detect with 2 chows, 1 pung, 1 kong - only two identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：两组1-2-3万的顺子，一个刻子，一个杠
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createPung(TileType.WAN, 5, 9),
        createKong(TileType.WAN, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 1吃3碰0杠 - 一组顺子
    it('should not detect with 1 chow, 3 pungs, 0 kongs - only one chow', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：一组1-2-3万的顺子，三个刻子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createPung(TileType.WAN, 4, 6),
        createPung(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 0吃4碰0杠 - 没有顺子
    it('should not detect with 0 chows, 4 pungs, 0 kongs - no chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：四个刻子
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.WAN, 3, 6),
        createPung(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 边界情况测试
  describe('Edge cases', () => {
    it('should not detect without any tiles', () => {
      expect(detector.detect([], [])).to.be.false;
    });
    
    it('should detect with exactly four identical chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：四组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    it('should detect with more than four identical chows', () => {
      // 手牌：一组1-2-3万的顺子和一对9万
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 9, 9], 1)
      ];
      
      // 明牌：四组1-2-3万的顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        createChow(TileType.WAN, 1, 12),
        createChow(TileType.WAN, 1, 15)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    it('should not detect with honor tiles trying to form chows', () => {
      // 手牌：一对9万
      const handTiles = createTiles(TileType.WAN, [9, 9], 1);
      
      // 明牌：四组顺子，其中一组是风牌（实际上风牌不能组成顺子）
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.WAN, 1, 9),
        {
          type: 'CHI',
          tiles: [
            new Tile(TileType.FENG, 1, 12),
            new Tile(TileType.FENG, 2, 13),
            new Tile(TileType.FENG, 3, 14)
          ]
        }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  // 添加更多各种吃碰杠组合测试
  describe('Complete combinations of chows, pungs, and kongs', () => {
    // 可以胡牌的组合（必须有4个相同顺子）
    describe('Valid winning combinations (with exactly four identical chows)', () => {
      // 2吃0碰2杠 - 两组相同顺子，加两个杠 - 因只有两组相同顺子，不能胡牌
      it('should not detect with 2 chows, 0 pungs, 2 kongs - only two identical chows', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6),
          createKong(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 7, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 1吃2碰1杠 - 一组顺子 - 不能胡牌
      it('should not detect with 1 chow, 2 pungs, 1 kong - only one chow', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 7, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 1吃1碰2杠 - 一组顺子 - 不能胡牌
      it('should not detect with 1 chow, 1 pung, 2 kongs - only one chow', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 1吃0碰3杠 - 一组顺子 - 不能胡牌
      it('should not detect with 1 chow, 0 pungs, 3 kongs - only one chow', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 5, 10),
          createKong(TileType.WAN, 7, 14)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 0吃3碰1杠 - 没有顺子 - 不能胡牌
      it('should not detect with 0 chows, 3 pungs, 1 kong - no chows', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 3, 6),
          createPung(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 7, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 0吃2碰2杠 - 没有顺子 - 不能胡牌
      it('should not detect with 0 chows, 2 pungs, 2 kongs - no chows', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 3, 6),
          createKong(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 0吃1碰3杠 - 没有顺子 - 不能胡牌
      it('should not detect with 0 chows, 1 pung, 3 kongs - no chows', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 3, 6),
          createKong(TileType.WAN, 5, 10),
          createKong(TileType.WAN, 7, 14)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
      
      // 0吃0碰4杠 - 没有顺子 - 不能胡牌
      it('should not detect with 0 chows, 0 pungs, 4 kongs - no chows', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 3, 7),
          createKong(TileType.WAN, 5, 11),
          createKong(TileType.WAN, 7, 15)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试x+y+z<4的组合
    describe('Combinations with fewer than 4 sets', () => {
      // 可以胡牌的组合（手牌中有足够的相同顺子，加上明牌总共有4个相同顺子）
      it('should detect with 2 revealed chows and 2 identical chows in hand', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 9, 9], 1)
        ];
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 9),
          createChow(TileType.WAN, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 手牌中4个相同顺子，无明牌
      it('should detect with 4 identical chows all in hand, no revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 9, 9], 1)
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      // 不能胡牌的组合（不足4个相同顺子）
      it('should not detect with 3 identical chows, no revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 9, 9, 9], 1)
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with 2 identical chows, no revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 9, 9], 1)
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with 1 chow, no revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 9, 9], 1)
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with 0 chows, no revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 3, 3, 3, 5, 5, 5, 7, 7, 7, 9, 9], 1)
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      // 3吃0碰0杠
      it('should not detect with 3 identical chows, 0 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6),
          createChow(TileType.WAN, 1, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 2吃1碰0杠
      it('should not detect with 2 identical chows, 1 pung, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6),
          createPung(TileType.WAN, 5, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 2吃0碰1杠
      it('should not detect with 2 identical chows, 0 pungs, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6),
          createKong(TileType.WAN, 5, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1吃2碰0杠
      it('should not detect with 1 chow, 2 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1吃1碰1杠
      it('should not detect with 1 chow, 1 pung, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1吃0碰2杠
      it('should not detect with 1 chow, 0 pungs, 2 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 10)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃3碰0杠
      it('should not detect with 0 chows, 3 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃2碰1杠
      it('should not detect with 0 chows, 2 pungs, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃1碰2杠
      it('should not detect with 0 chows, 1 pung, 2 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 10)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃0碰3杠
      it('should not detect with 0 chows, 0 pungs, 3 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 4, 7),
          createKong(TileType.WAN, 7, 11)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 补充x+y+z=2的组合测试
      // 2吃0碰0杠
      it('should not detect with 2 identical chows, 0 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1吃1碰0杠
      it('should not detect with 1 chow, 1 pung, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 5, 6)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1吃0碰1杠
      it('should not detect with 1 chow, 0 pungs, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 5, 6)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃2碰0杠
      it('should not detect with 0 chows, 2 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 5, 6)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃1碰1杠
      it('should not detect with 0 chows, 1 pung, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 5, 6)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃0碰2杠
      it('should not detect with 0 chows, 0 pungs, 2 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 5, 7)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 补充x+y+z=1的组合测试
      // 1吃0碰0杠
      it('should not detect with 1 chow, 0 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃1碰0杠
      it('should not detect with 0 chows, 1 pung, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 0吃0碰1杠
      it('should not detect with 0 chows, 0 pungs, 1 kong', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试各种可能胡牌的组合
    describe('Valid winning combinations with four identical chows', () => {
      // 4吃0碰0杠 - 四组相同顺子 - 可以胡牌
      it('should detect with 4 identical chows, 0 pungs, 0 kongs', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 1, 6),
          createChow(TileType.WAN, 1, 9),
          createChow(TileType.WAN, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试不同位置的四组相同顺子
      it('should detect with 4 identical chows at different positions (2-3-4)', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 2, 3),
          createChow(TileType.WAN, 2, 6),
          createChow(TileType.WAN, 2, 9),
          createChow(TileType.WAN, 2, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试不同花色（同样是四组相同顺子）
      it('should detect with 4 identical chows of TIAO suit', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.TIAO, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TIAO, 1, 9),
          createChow(TileType.TIAO, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试不同花色（同样是四组相同顺子）
      it('should detect with 4 identical chows of TONG suit', () => {
        const handTiles = createTiles(TileType.WAN, [9, 9], 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.TONG, 1, 3),
          createChow(TileType.TONG, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createChow(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试混合手牌和明牌中的四组相同顺子
      it('should detect with 2 identical chows in hand and 2 identical chows in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 9, 9], 1)
        ];
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 9),
          createChow(TileType.WAN, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试手牌中有3个相同顺子，明牌中有1个相同顺子
      it('should detect with 3 identical chows in hand and 1 identical chow in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 9, 9], 1)
        ];
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      // 测试手牌中有1个顺子，明牌中有3个相同顺子
      it('should detect with 1 chow in hand and 3 identical chows in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 9, 9], 1)
        ];
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 6),
          createChow(TileType.WAN, 1, 9),
          createChow(TileType.WAN, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });
  });
}); 