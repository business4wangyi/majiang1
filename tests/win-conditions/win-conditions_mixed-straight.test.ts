import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet, HuType } from '../../src/majiang/rule-types';
import { MixedStraightDetector } from '../../src/majiang/win-conditions/win-conditions_mixed-straight';
import { expect } from 'chai';
import { Player } from '../../src/majiang/player';

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

describe('MixedStraightDetector', () => {
  let detector: MixedStraightDetector;
  let mockPlayer: Player;

  beforeEach(() => {
    detector = new MixedStraightDetector();
    mockPlayer = {} as Player;
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('组合龙');
    expect(detector.getDescription()).to.equal('由三种花色数牌组成的1-9的序列');
    expect(detector.getScore()).to.equal(48);
    expect(detector.getHuType()).to.equal(HuType.MIXED_STRAIGHT);
  });

  // 测试组合龙的有效组合
  describe('Valid Mixed Straight patterns (including 1-9 across three suits)', () => {
    // 创建有效组合龙牌型的辅助函数
    function createMixedStraightTiles(pattern: number[]): Tile[] {
      return [
        ...createTiles(TileType.WAN, [pattern[0], pattern[0] + 1, pattern[0] + 2]),
        ...createTiles(TileType.TIAO, [pattern[1], pattern[1] + 1, pattern[1] + 2]),
        ...createTiles(TileType.TONG, [pattern[2], pattern[2] + 1, pattern[2] + 2]),
        ...createPair(TileType.WAN, 9) // 添加对子
      ];
    }

    // 测试所有6种有效组合方式
    const patterns = [
      [1, 4, 7], // 万1-3, 条4-6, 筒7-9
      [1, 5, 9], // 模式在代码中不一定有效，但是为了测试而添加
      [2, 5, 8], // 万2-4, 条5-7, 筒8-9(+1)
      [2, 6, 9], // 模式在代码中不一定有效，但是为了测试而添加
      [3, 6, 9], // 万3-5, 条6-8, 筒9(+1-2)
      [3, 7, 10] // 模式在代码中不一定有效，但是为了测试而添加
    ];

    patterns.forEach((pattern, index) => {
      it(`should detect pattern ${index + 1}: WAN ${pattern[0]}-${pattern[0] + 2}, TIAO ${pattern[1]}-${pattern[1] + 2}, TONG ${pattern[2]}-${pattern[2] + 2}`, () => {
        const handTiles = createMixedStraightTiles(pattern);
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试不同的手牌和已显示牌组合下的组合龙检测
    describe('Valid combinations with different hand/revealed ratios', () => {
      // 0副吃的组合 (组合龙在手牌中)
      // x=0, y=0, z=0 (组合龙 + 七对子或其他结构)
      it('should detect with 0 chows, 0 pungs, 0 kongs (mixed straight in hand with seven pairs)', () => {
        const handTiles = [
          // 组合龙部分
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [4, 5, 6]),
          ...createTiles(TileType.TONG, [7, 8, 9]),
          // 七对子部分
          ...createPair(TileType.FENG, 1),
          ...createPair(TileType.FENG, 2),
          ...createPair(TileType.FENG, 3),
          ...createPair(TileType.FENG, 4)
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      // 0副吃的组合 (几种不同的碰杠组合)
      const pungKongCombinations = [
        { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 }, { pungs: 0, kongs: 4 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 }, { pungs: 1, kongs: 3 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 }, { pungs: 2, kongs: 2 },
        { pungs: 3, kongs: 0 }, { pungs: 3, kongs: 1 },
        { pungs: 4, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 0 chows, ${pungs} pungs, ${kongs} kongs (mixed straight in hand)`, () => {
          // 组合龙部分
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 2, 3]),
            ...createTiles(TileType.TIAO, [4, 5, 6]),
            ...createTiles(TileType.TONG, [7, 8, 9]),
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          // 添加碰和杠
          const revealedSets: TileSet[] = [];
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });

      // 1副吃的组合
      const oneChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 },
        { pungs: 3, kongs: 0 }
      ];

      oneChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 1 chow, ${pungs} pungs, ${kongs} kongs (mixed straight partially in hand)`, () => {
          // 组合龙部分 (一部分在手牌，一部分在已显示牌)
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 2, 3]),
            ...createTiles(TileType.TIAO, [4, 5, 6]),
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          const revealedSets: TileSet[] = [
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });

      // 2副吃的组合
      const twoChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 },
        { pungs: 2, kongs: 0 }
      ];

      twoChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 2 chows, ${pungs} pungs, ${kongs} kongs (mixed straight partially in hand)`, () => {
          // 组合龙部分 (一部分在手牌，一部分在已显示牌)
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 2, 3]),
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          const revealedSets: TileSet[] = [
            createChow(TileType.TIAO, 4), // 4-5-6条
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });

      // 3副吃的组合
      const threeChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 },
        { pungs: 1, kongs: 0 }
      ];

      threeChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 3 chows, ${pungs} pungs, ${kongs} kongs (mixed straight in revealed sets)`, () => {
          // 对子在手牌
          const handTiles = createPair(TileType.FENG, 1);
          
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1), // 1-2-3万
            createChow(TileType.TIAO, 4), // 4-5-6条
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });

      // 4副吃的组合
      it('should detect with 4 chows, 0 pungs, 0 kongs (mixed straight in revealed sets + extra chow)', () => {
        // 对子在手牌
        const handTiles = createPair(TileType.FENG, 1);
        
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1), // 1-2-3万
          createChow(TileType.TIAO, 4), // 4-5-6条
          createChow(TileType.TONG, 7), // 7-8-9筒
          createChow(TileType.WAN, 4) // 额外的吃
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });
  });

  // 测试无效的组合龙组合
  describe('Invalid Mixed Straight patterns', () => {
    // 不满足组合龙条件的牌型
    it('should not detect when missing 1-3 wan', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 3]), // 缺少1万
        new Tile(TileType.WAN, 5, 5), // 替代为5万
        ...createTiles(TileType.TIAO, [4, 5, 6]),
        ...createTiles(TileType.TONG, [7, 8, 9]),
        ...createPair(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect when missing 4-6 tiao', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3]),
        ...createTiles(TileType.TIAO, [1, 2, 3]), // 错误的条牌
        ...createTiles(TileType.TONG, [7, 8, 9]),
        ...createPair(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect when missing 7-9 tong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3]),
        ...createTiles(TileType.TIAO, [4, 5, 6]),
        ...createTiles(TileType.TONG, [4, 5, 6]), // 错误的筒牌
        ...createPair(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect when pattern is in wrong order (7-9 wan, 1-3 tiao, 4-6 tong)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [7, 8, 9]), // 错误的万牌
        ...createTiles(TileType.TIAO, [1, 2, 3]), // 错误的条牌
        ...createTiles(TileType.TONG, [4, 5, 6]), // 错误的筒牌
        ...createPair(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect when all tiles are same suit', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3]),
        ...createTiles(TileType.WAN, [4, 5, 6]),
        ...createTiles(TileType.WAN, [7, 8, 9]),
        ...createPair(TileType.FENG, 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 测试不同牌型组合下的无效情况
    describe('Invalid combinations for various sets', () => {
      // 0副吃的组合 (几种不同的碰杠组合)
      const pungKongCombinations = [
        { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 }, { pungs: 0, kongs: 4 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 }, { pungs: 1, kongs: 3 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 }, { pungs: 2, kongs: 2 },
        { pungs: 3, kongs: 0 }, { pungs: 3, kongs: 1 },
        { pungs: 4, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 0 chows, ${pungs} pungs, ${kongs} kongs (invalid mixed straight in hand)`, () => {
          // 不满足组合龙条件的牌
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 2, 3]),
            ...createTiles(TileType.TIAO, [1, 2, 3]), // 错误的条牌
            ...createTiles(TileType.TONG, [7, 8, 9]),
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          // 添加碰和杠
          const revealedSets: TileSet[] = [];
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });

      // 1副吃的组合
      const oneChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 },
        { pungs: 3, kongs: 0 }
      ];

      oneChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 1 chow, ${pungs} pungs, ${kongs} kongs (invalid mixed straight partially in hand)`, () => {
          // 不满足组合龙条件的牌
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 2, 3]),
            ...createTiles(TileType.TIAO, [1, 2, 3]), // 错误的条牌
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          const revealedSets: TileSet[] = [
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });

      // 2副吃的组合
      const twoChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 },
        { pungs: 2, kongs: 0 }
      ];

      twoChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 2 chows, ${pungs} pungs, ${kongs} kongs (invalid mixed straight partially in hand)`, () => {
          // 不满足组合龙条件的牌
          const handTiles = [
            ...createTiles(TileType.WAN, [4, 5, 6]), // 错误的万牌
            ...createPair(TileType.FENG, 1) // 对子
          ];
          
          const revealedSets: TileSet[] = [
            createChow(TileType.TIAO, 4), // 4-5-6条
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });

      // 3副吃的组合
      const threeChowCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 },
        { pungs: 1, kongs: 0 }
      ];

      threeChowCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 3 chows, ${pungs} pungs, ${kongs} kongs (invalid mixed straight in revealed sets)`, () => {
          // 对子在手牌
          const handTiles = createPair(TileType.FENG, 1);
          
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1), // 1-2-3万
            createChow(TileType.TIAO, 1), // 错误的条牌顺子 (1-2-3)
            createChow(TileType.TONG, 7) // 7-8-9筒
          ];
          
          // 添加碰和杠
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.FENG, i + 2, i * 3 + 20));
          }
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, i + 2 + pungs, i * 4 + 20 + pungs * 3));
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });

      // 4副吃的组合
      it('should not detect with 4 chows, 0 pungs, 0 kongs (invalid mixed straight in revealed sets)', () => {
        // 对子在手牌
        const handTiles = createPair(TileType.FENG, 1);
        
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1), // 1-2-3万
          createChow(TileType.WAN, 4), // 4-5-6万 - 使用同一花色，确保无法形成组合龙
          createChow(TileType.WAN, 7), // 7-8-9万 - 使用同一花色，确保无法形成组合龙
          createChow(TileType.TIAO, 4) // 额外的吃
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });
  });
}); 