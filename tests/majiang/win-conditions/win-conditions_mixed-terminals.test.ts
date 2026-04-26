import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, HuType } from '../../../src/majiang/core/rule-types';
import { MixedTerminalsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_mixed-terminals';
import { expect } from 'chai';
import { Player } from '../../../src/majiang/core/player';

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

describe('MixedTerminalsDetector', () => {
  let detector: MixedTerminalsDetector;
  let mockPlayer: Player;

  beforeEach(() => {
    detector = new MixedTerminalsDetector();
    mockPlayer = {} as Player;
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('混幺九');
    expect(detector.getDescription()).to.equal('由幺九牌和字牌组成的和牌');
    expect(detector.getScore()).to.equal(40);
    expect(detector.getHuType()).to.equal(HuType.MIXED_TERMINALS);
  });

  // 测试混幺九的有效组合
  describe('Valid Mixed Terminals patterns', () => {
    // 创建有效混幺九牌型的辅助函数 - 幺九牌(1或9)和字牌的组合
    function createMixedTerminalsValidHand(): Tile[] {
      return [
        ...createTiles(TileType.WAN, [1, 1, 1]),  // 一万刻子
        ...createTiles(TileType.TONG, [9, 9, 9]), // 九筒刻子
        ...createTiles(TileType.FENG, [1, 1, 1]), // 东风刻子
        ...createPair(TileType.JIAN, 1)           // 红中对子
      ];
    }

    // 创建无效的混幺九牌型 - 包含中间数牌(2-8)
    function createMixedTerminalsInvalidHand(): Tile[] {
      return [
        ...createTiles(TileType.WAN, [1, 1, 1]),  // 一万刻子
        ...createTiles(TileType.TONG, [5, 5, 5]), // 五筒刻子（无效，不是幺九牌）
        ...createTiles(TileType.FENG, [1, 1, 1]), // 东风刻子
        ...createPair(TileType.JIAN, 1)           // 红中对子
      ];
    }

    // 测试所有有效的X副吃，Y副碰，Z副杠组合（共35种组合）
    
    // 0副吃的情况 (15种组合)
    describe('Valid combinations with 0 chows', () => {
      // 所有0副吃的组合
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 }, { pungs: 0, kongs: 4 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 }, { pungs: 1, kongs: 3 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 }, { pungs: 2, kongs: 2 },
        { pungs: 3, kongs: 0 }, { pungs: 3, kongs: 1 },
        { pungs: 4, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 0 chows, ${pungs} pungs, ${kongs} kongs`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 4 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            if (i % 2 === 0) {
              handTiles.push(...createTiles(TileType.WAN, [1, 1, 1])); // 一万刻子
            } else {
              handTiles.push(...createTiles(TileType.TONG, [9, 9, 9])); // 九筒刻子
            }
          }
          
          // 添加碰和杠
          const revealedSets: TileSet[] = [];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createPung(TileType.WAN, 1, i * 3 + 20)); // 一万碰
            } else {
              revealedSets.push(createPung(TileType.FENG, (i % 4) + 1, i * 3 + 20)); // 风牌碰
            }
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createKong(TileType.TONG, 9, i * 4 + 50, 'ming')); // 九筒杠
            } else {
              revealedSets.push(createKong(TileType.JIAN, (i % 3) + 1, i * 4 + 50, 'ming')); // 箭牌杠
            }
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });
    });

    // 1副吃的情况 (10种组合)
    describe('Valid combinations with 1 chow', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 },
        { pungs: 3, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 1 chow, ${pungs} pungs, ${kongs} kongs`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 3 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            if (i % 2 === 0) {
              handTiles.push(...createTiles(TileType.WAN, [1, 1, 1])); // 一万刻子
            } else {
              handTiles.push(...createTiles(TileType.TONG, [9, 9, 9])); // 九筒刻子
            }
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 7) // 7-8-9万 (包含幺九牌9万)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createPung(TileType.WAN, 1, i * 3 + 20)); // 一万碰
            } else {
              revealedSets.push(createPung(TileType.FENG, (i % 4) + 1, i * 3 + 20)); // 风牌碰
            }
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createKong(TileType.TONG, 9, i * 4 + 50, 'ming')); // 九筒杠
            } else {
              revealedSets.push(createKong(TileType.JIAN, (i % 3) + 1, i * 4 + 50, 'ming')); // 箭牌杠
            }
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });
    });

    // 2副吃的情况 (6种组合)
    describe('Valid combinations with 2 chows', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 },
        { pungs: 2, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 2 chows, ${pungs} pungs, ${kongs} kongs`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 2 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            handTiles.push(...createTiles(TileType.FENG, [(i % 4) + 1, (i % 4) + 1, (i % 4) + 1])); // 风牌刻子
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 7), // 7-8-9万 (包含幺九牌9万)
            createChow(TileType.TIAO, 7)  // 7-8-9条 (包含幺九牌9条)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.JIAN, (i % 3) + 1, i * 3 + 20)); // 箭牌碰
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.TONG, 1, i * 4 + 50, 'ming')); // 一筒杠
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });
    });

    // 3副吃的情况 (3种组合)
    describe('Valid combinations with 3 chows', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 },
        { pungs: 1, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should detect with 3 chows, ${pungs} pungs, ${kongs} kongs`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 1 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            handTiles.push(...createTiles(TileType.FENG, [(i % 4) + 1, (i % 4) + 1, (i % 4) + 1])); // 风牌刻子
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 7), // 7-8-9万 (包含幺九牌9万)
            createChow(TileType.TIAO, 7), // 7-8-9条 (包含幺九牌9条)
            createChow(TileType.TONG, 7)  // 7-8-9筒 (包含幺九牌9筒)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.JIAN, (i % 3) + 1, i * 3 + 20)); // 箭牌碰
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, (i % 4) + 1, i * 4 + 50, 'ming')); // 风牌杠
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.true;
        });
      });
    });

    // 4副吃的情况 (1种组合)
    describe('Valid combinations with 4 chows', () => {
      it('should detect with 4 chows, 0 pungs, 0 kongs', () => {
        // 基本的幺九和字牌
        const handTiles = [
          ...createPair(TileType.JIAN, 1) // 红中对子
        ];
        
        // 添加吃
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 7), // 7-8-9万 (包含幺九牌9万)
          createChow(TileType.TIAO, 7), // 7-8-9条 (包含幺九牌9条)
          createChow(TileType.TONG, 7), // 7-8-9筒 (包含幺九牌9筒)
          createChow(TileType.WAN, 1)   // 1-2-3万 (包含幺九牌1万)
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });
  });

  // 测试无效的混幺九组合
  describe('Invalid Mixed Terminals patterns', () => {
    // 不符合混幺九条件的牌型测试
    
    // 测试缺少幺九牌的情况
    it('should not detect when only having honor tiles', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1]),     // 东风刻子
        ...createTiles(TileType.FENG, [2, 2, 2]),     // 南风刻子
        ...createTiles(TileType.JIAN, [1, 1, 1]),     // 红中刻子
        ...createTiles(TileType.JIAN, [2, 2, 2]),     // 发财刻子
        ...createPair(TileType.FENG, 3)               // 西风对子
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 测试缺少字牌的情况
    it('should not detect when only having terminal tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1]),      // 一万刻子
        ...createTiles(TileType.WAN, [9, 9, 9]),      // 九万刻子
        ...createTiles(TileType.TIAO, [1, 1, 1]),     // 一条刻子
        ...createTiles(TileType.TONG, [9, 9, 9]),     // 九筒刻子
        ...createPair(TileType.TIAO, 9)               // 九条对子
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 测试包含中间数牌的情况
    it('should not detect when containing middle number tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1]),      // 一万刻子
        ...createTiles(TileType.TIAO, [5, 5, 5]),     // 五条刻子 (非幺九牌)
        ...createTiles(TileType.FENG, [1, 1, 1]),     // 东风刻子
        ...createPair(TileType.JIAN, 1)               // 红中对子
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 测试不同牌型组合下的无效情况
    
    // 0副吃的情况 (15种组合)
    describe('Invalid combinations with 0 chows', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 }, { pungs: 0, kongs: 4 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 }, { pungs: 1, kongs: 3 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 }, { pungs: 2, kongs: 2 },
        { pungs: 3, kongs: 0 }, { pungs: 3, kongs: 1 },
        { pungs: 4, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 0 chows, ${pungs} pungs, ${kongs} kongs when containing middle number tiles`, () => {
          // 包含中间数字的牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1), // 红中对子
            ...createTiles(TileType.WAN, [5, 5, 5]) // 五万刻子 (非幺九牌)
          ];
          
          // 添加更多牌到手牌
          const remainingSets = 3 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            if (i % 2 === 0) {
              handTiles.push(...createTiles(TileType.WAN, [1, 1, 1])); // 一万刻子
            } else {
              handTiles.push(...createTiles(TileType.FENG, [(i % 4) + 1, (i % 4) + 1, (i % 4) + 1])); // 风牌刻子
            }
          }
          
          // 添加碰和杠
          const revealedSets: TileSet[] = [];
          
          // 添加碰
          for (let i = 0; i < pungs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createPung(TileType.WAN, 9, i * 3 + 20)); // 九万碰
            } else {
              revealedSets.push(createPung(TileType.JIAN, (i % 3) + 1, i * 3 + 20)); // 箭牌碰
            }
          }
          
          // 添加杠
          for (let i = 0; i < kongs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createKong(TileType.TONG, 1, i * 4 + 50, 'ming')); // 一筒杠
            } else {
              revealedSets.push(createKong(TileType.FENG, (i % 4) + 1, i * 4 + 50, 'ming')); // 风牌杠
            }
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });
    });

    // 1副吃的情况 (10种组合)
    describe('Invalid combinations with 1 chow', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 }, { pungs: 0, kongs: 3 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 }, { pungs: 1, kongs: 2 },
        { pungs: 2, kongs: 0 }, { pungs: 2, kongs: 1 },
        { pungs: 3, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 1 chow, ${pungs} pungs, ${kongs} kongs when containing only middle number tiles in chow`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 3 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            if (i % 2 === 0) {
              handTiles.push(...createTiles(TileType.WAN, [1, 1, 1])); // 一万刻子
            } else {
              handTiles.push(...createTiles(TileType.TONG, [9, 9, 9])); // 九筒刻子
            }
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 4) // 4-5-6万 (不包含幺九牌)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createPung(TileType.WAN, 9, i * 3 + 20)); // 九万碰
            } else {
              revealedSets.push(createPung(TileType.FENG, (i % 4) + 1, i * 3 + 20)); // 风牌碰
            }
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createKong(TileType.TONG, 1, i * 4 + 50, 'ming')); // 一筒杠
            } else {
              revealedSets.push(createKong(TileType.JIAN, (i % 3) + 1, i * 4 + 50, 'ming')); // 箭牌杠
            }
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });
    });

    // 2副吃的情况 (6种组合)
    describe('Invalid combinations with 2 chows', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 }, { pungs: 0, kongs: 2 },
        { pungs: 1, kongs: 0 }, { pungs: 1, kongs: 1 },
        { pungs: 2, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 2 chows, ${pungs} pungs, ${kongs} kongs when one chow contains only middle number tiles`, () => {
          // 基本的幺九和字牌
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 2 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            handTiles.push(...createTiles(TileType.FENG, [(i % 4) + 1, (i % 4) + 1, (i % 4) + 1])); // 风牌刻子
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 7), // 7-8-9万 (包含幺九牌9万)
            createChow(TileType.TIAO, 3)  // 3-4-5条 (不包含幺九牌)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.JIAN, (i % 3) + 1, i * 3 + 20)); // 箭牌碰
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.TONG, 9, i * 4 + 50, 'ming')); // 九筒杠
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });
    });

    // 3副吃的情况 (3种组合)
    describe('Invalid combinations with 3 chows', () => {
      const pungKongCombinations = [
        { pungs: 0, kongs: 0 }, { pungs: 0, kongs: 1 },
        { pungs: 1, kongs: 0 }
      ];

      pungKongCombinations.forEach(({ pungs, kongs }) => {
        it(`should not detect with 3 chows, ${pungs} pungs, ${kongs} kongs when all chows contain middle number tiles`, () => {
          // A
          const handTiles = [
            ...createPair(TileType.JIAN, 1) // 红中对子
          ];
          
          // 添加足够的幺九牌和字牌到手牌
          const remainingSets = 1 - pungs - kongs;
          for (let i = 0; i < remainingSets; i++) {
            handTiles.push(...createTiles(TileType.FENG, [(i % 4) + 1, (i % 4) + 1, (i % 4) + 1])); // 风牌刻子
          }
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 3), // 3-4-5万 (不包含幺九牌)
            createChow(TileType.TIAO, 4), // 4-5-6条 (不包含幺九牌)
            createChow(TileType.TONG, 5)  // 5-6-7筒 (不包含幺九牌)
          ];
          
          // 添加幺九牌的碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.JIAN, (i % 3) + 1, i * 3 + 20)); // 箭牌碰
          }
          
          // 添加幺九牌的杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.FENG, (i % 4) + 1, i * 4 + 50, 'ming')); // 风牌杠
          }
          
          expect(detector.detect(handTiles, revealedSets)).to.be.false;
        });
      });
    });

    // 4副吃的情况 (1种组合)
    describe('Invalid combinations with 4 chows', () => {
      it('should not detect with 4 chows, 0 pungs, 0 kongs when most chows contain only middle number tiles', () => {
        // 基本的幺九和字牌
        const handTiles = [
          ...createPair(TileType.JIAN, 1) // 红中对子
        ];
        
        // 添加吃
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 3), // 3-4-5万 (不包含幺九牌)
          createChow(TileType.TIAO, 4), // 4-5-6条 (不包含幺九牌)
          createChow(TileType.TONG, 5), // 5-6-7筒 (不包含幺九牌)
          createChow(TileType.WAN, 2)   // 2-3-4万 (不包含幺九牌)
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });
  });
}); 