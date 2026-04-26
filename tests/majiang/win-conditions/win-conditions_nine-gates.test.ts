import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, HuType } from '../../../src/majiang/core/rule-types';
import { NineGatesDetector } from '../../../src/majiang/core/win-conditions/win-conditions_nine-gates';
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

// 创建标准九莲宝灯牌型：1112345678999 + 任意同花色牌
function createValidNineGatesHand(): Tile[] {
  return [
    // 标准九莲宝灯牌型
    ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]),
    // 额外的一张同花色牌
    new Tile(TileType.WAN, 5, 14)
  ];
}

describe('NineGatesDetector', () => {
  let detector: NineGatesDetector;
  let mockPlayer: Player;

  beforeEach(() => {
    detector = new NineGatesDetector();
    mockPlayer = {} as Player;
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('九莲宝灯');
    expect(detector.getDescription()).to.equal('由一种花色的1112345678999加任意一张同花色牌组成的特殊和牌');
    expect(detector.getScore()).to.equal(88);
    expect(detector.getHuType()).to.equal(HuType.NINE_GATES);
  });

  // 测试九莲宝灯的有效组合
  describe('Valid Nine Gates patterns', () => {
    // 0副吃，0副碰，0副杠 - 门前清
    it('should detect with 0 chows, 0 pungs, 0 kongs - standard pattern', () => {
      const handTiles = createValidNineGatesHand();
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 测试九莲宝灯的所有可能变种
    it('should detect with 0 chows, 0 pungs, 0 kongs - variants with different extra tiles', () => {
      for (let extraTile = 1; extraTile <= 9; extraTile++) {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]),
          new Tile(TileType.WAN, extraTile, 14)
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      }
    });

    // 测试不同花色的九莲宝灯
    it('should detect with 0 chows, 0 pungs, 0 kongs - different suits', () => {
      const tileTypes = [TileType.WAN, TileType.TIAO, TileType.TONG];
      
      for (const type of tileTypes) {
        const handTiles = [
          ...createTiles(type, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]),
          new Tile(type, 5, 14)
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      }
    });
  });

  // 测试无效的九莲宝灯组合
  describe('Invalid Nine Gates patterns', () => {
    // 非门前清的情况 - 有明牌的情况
    describe('Invalid combinations with revealed sets', () => {
      // 1副吃
      it('should not detect with 1 chow, 0 pungs, 0 kongs', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 8, 9, 9])
        ];
        
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 7)  // 7-8-9万
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1副碰
      it('should not detect with 0 chows, 1 pung, 0 kongs', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        ];
        
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 9)  // 九万碰
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 1副杠
      it('should not detect with 0 chows, 0 pungs, 1 kong', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        ];
        
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1)  // 一万杠
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      // 组合明牌的情况
      it('should not detect with 1 chow, 1 pung, 1 kong', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 4, 5])
        ];
        
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 6),  // 6-7-8万
          createPung(TileType.WAN, 9),  // 九万碰
          createKong(TileType.WAN, 1)   // 一万杠
        ];
        
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 非同花色的情况
    describe('Invalid combinations with mixed suits', () => {
      it('should not detect with mixed suits', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9]),
          ...createTiles(TileType.TONG, [9])  // 一张不同花色的牌
        ];
        
        expect(detector.detect(handTiles, [])).to.be.false;
      });
    });

    // 缺少关键牌的情况
    describe('Invalid combinations missing key tiles', () => {
      it('should not detect when missing a key tile', () => {
        // 缺少一个1（只有两个1）
        const missingOne = [
          ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5, 5])
        ];
        expect(detector.detect(missingOne, [])).to.be.false;
        
        // 缺少一个9（只有两个9）
        const missingNine = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 5, 5])
        ];
        expect(detector.detect(missingNine, [])).to.be.false;
        
        // 缺少中间数字5
        const missingMiddle = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 4, 6, 7, 8, 9, 9, 9, 2])
        ];
        expect(detector.detect(missingMiddle, [])).to.be.false;
      });
    });

    // 包含字牌的情况
    it('should not detect when containing honor tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9]),
        ...createTiles(TileType.FENG, [1])  // 一张风牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 牌数不对的情况
    it('should not detect when tile count is incorrect', () => {
      // 少一张牌
      const tooFewTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9])
      ];
      expect(detector.detect(tooFewTiles, [])).to.be.false;
      
      // 多一张牌
      const tooManyTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]),
        new Tile(TileType.WAN, 5, 14),
        new Tile(TileType.WAN, 5, 15)
      ];
      expect(detector.detect(tooManyTiles, [])).to.be.false;
    });
  });

  // 枚举所有可能的牌型组合 (x副吃，y副碰，z副杠，其中x+y+z<=4)
  describe('All possible combinations (x chows, y pungs, z kongs, where x+y+z<=4)', () => {
    // 九莲宝灯必须是门前清，所以所有明牌的组合都是无效的
    
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
        if (pungs === 0 && kongs === 0) {
          // 唯一有效的情况 - 门前清
          it(`should detect with 0 chows, ${pungs} pungs, ${kongs} kongs - the only valid case`, () => {
            const handTiles = createValidNineGatesHand();
            expect(detector.detect(handTiles, [])).to.be.true;
          });
        } else {
          it(`should not detect with 0 chows, ${pungs} pungs, ${kongs} kongs`, () => {
            // 构建基本的九莲宝灯牌型，但缺少一些牌
            const baseHandTiles = createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]).slice(0, 14 - pungs * 3 - kongs * 4);
            
            // 添加碰和杠
            const revealedSets: TileSet[] = [];
            
            // 添加碰
            for (let i = 0; i < pungs; i++) {
              if (i === 0) {
                revealedSets.push(createPung(TileType.WAN, 1, i * 3 + 20)); // 一万碰
              } else if (i === 1) {
                revealedSets.push(createPung(TileType.WAN, 9, i * 3 + 20)); // 九万碰
              } else {
                revealedSets.push(createPung(TileType.WAN, 2 + i, i * 3 + 20)); // 其他万牌碰
              }
            }
            
            // 添加杠
            for (let i = 0; i < kongs; i++) {
              if (i === 0) {
                revealedSets.push(createKong(TileType.WAN, 1, i * 4 + 50, 'ming')); // 一万杠
              } else if (i === 1) {
                revealedSets.push(createKong(TileType.WAN, 9, i * 4 + 50, 'ming')); // 九万杠
              } else {
                revealedSets.push(createKong(TileType.WAN, 2 + i, i * 4 + 50, 'ming')); // 其他万牌杠
              }
            }
            
            expect(detector.detect(baseHandTiles, revealedSets)).to.be.false;
          });
        }
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
        it(`should not detect with 1 chow, ${pungs} pungs, ${kongs} kongs`, () => {
          // 构建部分九莲宝灯牌型
          const baseHandTiles = createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]).slice(0, 14 - 3 - pungs * 3 - kongs * 4);
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 7) // 7-8-9万
          ];
          
          // 添加碰
          for (let i = 0; i < pungs; i++) {
            if (i === 0) {
              revealedSets.push(createPung(TileType.WAN, 1, i * 3 + 20)); // 一万碰
            } else {
              revealedSets.push(createPung(TileType.WAN, 2 + i, i * 3 + 20)); // 其他万牌碰
            }
          }
          
          // 添加杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.WAN, 1 + i, i * 4 + 50, 'ming')); // 万牌杠
          }
          
          expect(detector.detect(baseHandTiles, revealedSets)).to.be.false;
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
        it(`should not detect with 2 chows, ${pungs} pungs, ${kongs} kongs`, () => {
          // 构建部分九莲宝灯牌型
          const baseHandTiles = createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 9, 9, 9]).slice(0, 14 - 6 - pungs * 3 - kongs * 4);
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1), // 1-2-3万
            createChow(TileType.WAN, 6)  // 6-7-8万
          ];
          
          // 添加碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.WAN, 1 + i * 2, i * 3 + 20)); // 万牌碰
          }
          
          // 添加杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.WAN, 9, i * 4 + 50, 'ming')); // 九万杠
          }
          
          expect(detector.detect(baseHandTiles, revealedSets)).to.be.false;
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
        it(`should not detect with 3 chows, ${pungs} pungs, ${kongs} kongs`, () => {
          // 构建部分九莲宝灯牌型
          const baseHandTiles = createTiles(TileType.WAN, [1, 1, 9, 9, 9]).slice(0, 14 - 9 - pungs * 3 - kongs * 4);
          
          // 添加碰、杠和吃
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1), // 1-2-3万
            createChow(TileType.WAN, 4), // 4-5-6万
            createChow(TileType.WAN, 7)  // 7-8-9万
          ];
          
          // 添加碰
          for (let i = 0; i < pungs; i++) {
            revealedSets.push(createPung(TileType.WAN, 1, i * 3 + 20)); // 一万碰
          }
          
          // 添加杠
          for (let i = 0; i < kongs; i++) {
            revealedSets.push(createKong(TileType.WAN, 9, i * 4 + 50, 'ming')); // 九万杠
          }
          
          expect(detector.detect(baseHandTiles, revealedSets)).to.be.false;
        });
      });
    });

    // 4副吃的情况 (1种组合)
    describe('Invalid combinations with 4 chows', () => {
      it('should not detect with 4 chows, 0 pungs, 0 kongs', () => {
        // 构建部分九莲宝灯牌型
        const baseHandTiles = createTiles(TileType.WAN, [1, 1]).slice(0, 14 - 12);
        
        // 添加碰、杠和吃
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1), // 1-2-3万
          createChow(TileType.WAN, 3), // 3-4-5万
          createChow(TileType.WAN, 5), // 5-6-7万
          createChow(TileType.WAN, 7)  // 7-8-9万
        ];
        
        expect(detector.detect(baseHandTiles, revealedSets)).to.be.false;
      });
    });

    // 测试有效的可能牌型变种 (只有0副吃，0副碰，0副杠 - 门前清的情况是有效的)
    describe('Valid combinations with basic Nine Gates pattern', () => {
      it('should detect standard Nine Gates pattern with 0 chows, 0 pungs, 0 kongs', () => {
        const handTiles = createValidNineGatesHand();
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      // 测试不同花色
      it('should detect Nine Gates pattern in different suits', () => {
        // 万子
        const wanTiles = [
          ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5])
        ];
        expect(detector.detect(wanTiles, [])).to.be.true;

        // 条子
        const tiaoTiles = [
          ...createTiles(TileType.TIAO, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5])
        ];
        expect(detector.detect(tiaoTiles, [])).to.be.true;

        // 筒子
        const tongTiles = [
          ...createTiles(TileType.TONG, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5])
        ];
        expect(detector.detect(tongTiles, [])).to.be.true;
      });

      // 测试不同的额外牌
      it('should detect Nine Gates pattern with different extra tiles', () => {
        for (let extraTile = 1; extraTile <= 9; extraTile++) {
          const handTiles = [
            ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, extraTile])
          ];
          expect(detector.detect(handTiles, [])).to.be.true;
        }
      });
    });
  });
}); 