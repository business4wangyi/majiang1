import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, HuType } from '../../../src/majiang/core/rule-types';
import { LastTileDetector } from '../../../src/majiang/core/win-conditions/win-conditions_last-tile';
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

describe('LastTileDetector', () => {
  let detector: LastTileDetector;
  let mockPlayer: Player;

  beforeEach(() => {
    detector = new LastTileDetector();
    mockPlayer = {} as Player;
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('海底捞月');
    expect(detector.getDescription()).to.equal('和别人打出的最后一张牌');
    expect(detector.getScore()).to.equal(8);
    expect(detector.getHuType()).to.equal(HuType.LAST_TILE);
  });
  
  // 基本功能测试
  describe('Basic functionality', () => {
    it('should detect when isLastTile is true and isDrawn is not true', () => {
      const handTiles = createPair(TileType.WAN, 1, 1);
      const revealedSets: TileSet[] = [];
      const gameState = {
        isLastTile: true,
        isDrawn: false
      };
      
      expect(detector.detect(handTiles, revealedSets, mockPlayer, gameState)).to.be.true;
    });
    
    it('should not detect when isLastTile is true but isDrawn is also true', () => {
      const handTiles = createPair(TileType.WAN, 1, 1);
      const revealedSets: TileSet[] = [];
      const gameState = {
        isLastTile: true,
        isDrawn: true
      };
      
      expect(detector.detect(handTiles, revealedSets, mockPlayer, gameState)).to.be.false;
    });
    
    it('should not detect when isLastTile is false', () => {
      const handTiles = createPair(TileType.WAN, 1, 1);
      const revealedSets: TileSet[] = [];
      const gameState = {
        isLastTile: false
      };
      
      expect(detector.detect(handTiles, revealedSets, mockPlayer, gameState)).to.be.false;
    });
    
    it('should not detect when gameState is undefined', () => {
      const handTiles = createPair(TileType.WAN, 1, 1);
      const revealedSets: TileSet[] = [];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 海底捞月的有效牌型测试 - 各种组合
  describe('Valid combinations for Last Tile (isLastTile = true, isDrawn = false)', () => {
    const validGameState = {
      isLastTile: true,
      isDrawn: false
    };
    
    // 0副吃的组合
    describe('0 Chows combinations', () => {
      it('should detect with 0 chows, 0 pungs, 0 kongs (seven pairs)', () => {
        const handTiles = [
          ...createPair(TileType.WAN, 1, 1),
          ...createPair(TileType.WAN, 2, 3),
          ...createPair(TileType.WAN, 3, 5),
          ...createPair(TileType.WAN, 4, 7),
          ...createPair(TileType.WAN, 5, 9),
          ...createPair(TileType.WAN, 6, 11),
          ...createPair(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, [], mockPlayer, validGameState)).to.be.true;
      });
      
      // 测试0吃1碰0杠到0吃4碰0杠
      const pungCombinations = [1, 2, 3, 4];
      pungCombinations.forEach(numPungs => {
        it(`should detect with 0 chows, ${numPungs} pungs, 0 kongs`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [];
          
          for (let i = 0; i < numPungs; i++) {
            revealedSets.push(createPung(TileType.WAN, i + 1, i * 3 + 3));
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
        });
      });
      
      // 测试0吃0碰1杠到0吃0碰4杠
      const kongCombinations = [1, 2, 3, 4];
      kongCombinations.forEach(numKongs => {
        it(`should detect with 0 chows, 0 pungs, ${numKongs} kongs`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [];
          
          for (let i = 0; i < numKongs; i++) {
            revealedSets.push(createKong(TileType.WAN, i + 1, i * 4 + 3));
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
        });
      });
      
      // 测试混合杠碰组合
      it('should detect with 0 chows, 1 pung, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 2, 6)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 0 chows, 2 pungs, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 2, 6),
          createKong(TileType.WAN, 3, 9)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 0 chows, 3 pungs, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 2, 6),
          createPung(TileType.WAN, 3, 9),
          createKong(TileType.WAN, 4, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 0 chows, 1 pung, 2 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 2, 6),
          createKong(TileType.WAN, 3, 10)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 0 chows, 2 pungs, 2 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 2, 6),
          createKong(TileType.WAN, 3, 9),
          createKong(TileType.WAN, 4, 13)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 0 chows, 1 pung, 3 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 2, 6),
          createKong(TileType.WAN, 3, 10),
          createKong(TileType.WAN, 4, 14)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
    });
    
    // 1副吃的组合
    describe('1 Chow combinations', () => {
      // 1吃0碰0杠
      it('should detect with 1 chow, 0 pungs, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 测试1吃x碰0杠
      const pungCountsFor1Chow = [1, 2, 3];
      pungCountsFor1Chow.forEach(numPungs => {
        it(`should detect with 1 chow, ${numPungs} pungs, 0 kongs`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1, 3)
          ];
          
          for (let i = 0; i < numPungs; i++) {
            revealedSets.push(createPung(TileType.WAN, i + 4, i * 3 + 6));
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
        });
      });
      
      // 测试1吃0碰y杠
      const kongCountsFor1Chow = [1, 2, 3];
      kongCountsFor1Chow.forEach(numKongs => {
        it(`should detect with 1 chow, 0 pungs, ${numKongs} kongs`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [
            createChow(TileType.WAN, 1, 3)
          ];
          
          for (let i = 0; i < numKongs; i++) {
            revealedSets.push(createKong(TileType.WAN, i + 4, i * 4 + 6));
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
        });
      });
      
      // 测试1吃混合杠碰组合
      it('should detect with 1 chow, 1 pung, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 5, 9)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 1 chow, 2 pungs, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 6, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      it('should detect with 1 chow, 1 pung, 2 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 6, 13)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
    });
    
    // 2副吃的组合
    describe('2 Chows combinations', () => {
      // 2吃0碰0杠
      it('should detect with 2 chows, 0 pungs, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 2吃1碰0杠
      it('should detect with 2 chows, 1 pung, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 2吃2碰0杠
      it('should detect with 2 chows, 2 pungs, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9),
          createPung(TileType.TIAO, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 2吃0碰1杠
      it('should detect with 2 chows, 0 pungs, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 9)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 2吃1碰1杠
      it('should detect with 2 chows, 1 pung, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9),
          createKong(TileType.TIAO, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 2吃0碰2杠
      it('should detect with 2 chows, 0 pungs, 2 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 7, 9),
          createKong(TileType.TIAO, 1, 13)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
    });
    
    // 3副吃的组合
    describe('3 Chows combinations', () => {
      // 3吃0碰0杠
      it('should detect with 3 chows, 0 pungs, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 3吃1碰0杠
      it('should detect with 3 chows, 1 pung, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createPung(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
      
      // 3吃0碰1杠
      it('should detect with 3 chows, 0 pungs, 1 kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createKong(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
    });
    
    // 4副吃的组合
    describe('4 Chows combinations', () => {
      // 4吃0碰0杠
      it('should detect with 4 chows, 0 pungs, 0 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createChow(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, validGameState)).to.be.true;
      });
    });
  });
  
  // 不能海底捞月的测试（同样的牌型，但isLastTile = false或isDrawn = true）
  describe('Invalid combinations for Last Tile (isLastTile = false or isDrawn = true)', () => {
    // isLastTile = false的情况
    const invalidGameStateNotLastTile = {
      isLastTile: false,
      isDrawn: false
    };
    
    // isLastTile = true但isDrawn = true的情况
    const invalidGameStateIsDrawn = {
      isLastTile: true,
      isDrawn: true
    };
    
    // 各种不同牌型组合的测试 (isLastTile = false)
    describe('Various combinations (isLastTile = false)', () => {
      // 七对子牌型
      it('should not detect with seven pairs', () => {
        const handTiles = [
          ...createPair(TileType.WAN, 1, 1),
          ...createPair(TileType.WAN, 2, 3),
          ...createPair(TileType.WAN, 3, 5),
          ...createPair(TileType.WAN, 4, 7),
          ...createPair(TileType.WAN, 5, 9),
          ...createPair(TileType.WAN, 6, 11),
          ...createPair(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, [], mockPlayer, invalidGameStateNotLastTile)).to.be.false;
      });
      
      // 纯刻子牌型
      it('should not detect with 4 pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 2, 6),
          createPung(TileType.WAN, 3, 9),
          createPung(TileType.WAN, 4, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateNotLastTile)).to.be.false;
      });
      
      // 纯顺子牌型
      it('should not detect with 4 chows', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createChow(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateNotLastTile)).to.be.false;
      });
      
      // 纯杠牌型
      it('should not detect with 4 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 2, 7),
          createKong(TileType.WAN, 3, 11),
          createKong(TileType.WAN, 4, 15)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateNotLastTile)).to.be.false;
      });
      
      // 混合牌型测试
      it('should not detect with mixed combinations (1 chow, 1 pung, 2 kongs)', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 4, 6),
          createKong(TileType.WAN, 5, 9),
          createKong(TileType.WAN, 6, 13)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateNotLastTile)).to.be.false;
      });
      
      // 0-4副吃的测试
      [0, 1, 2, 3, 4].forEach(numChows => {
        if (numChows === 4) {
          // 已经测试过4副吃的情况
          return;
        }
        
        it(`should not detect with ${numChows} chows and complementary sets`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [];
          
          // 添加吃
          for (let i = 0; i < numChows; i++) {
            revealedSets.push(createChow(i % 2 === 0 ? TileType.WAN : TileType.TIAO, 1 + i * 3, i * 3 + 3));
          }
          
          // 添加碰和杠来补充到4副
          const remainingSets = 4 - numChows;
          if (remainingSets >= 1) {
            revealedSets.push(createPung(TileType.TONG, 1, 20));
          }
          if (remainingSets >= 2) {
            revealedSets.push(createPung(TileType.TONG, 4, 23));
          }
          if (remainingSets >= 3) {
            revealedSets.push(createKong(TileType.TONG, 7, 26));
          }
          if (remainingSets >= 4) {
            revealedSets.push(createKong(TileType.FENG, 1, 30));
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateNotLastTile)).to.be.false;
        });
      });
    });
    
    // 各种不同牌型组合的测试 (isDrawn = true)
    describe('Various combinations (isDrawn = true)', () => {
      // 七对子牌型
      it('should not detect with seven pairs', () => {
        const handTiles = [
          ...createPair(TileType.WAN, 1, 1),
          ...createPair(TileType.WAN, 2, 3),
          ...createPair(TileType.WAN, 3, 5),
          ...createPair(TileType.WAN, 4, 7),
          ...createPair(TileType.WAN, 5, 9),
          ...createPair(TileType.WAN, 6, 11),
          ...createPair(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, [], mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      // 纯刻子牌型
      it('should not detect with 4 pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.WAN, 2, 6),
          createPung(TileType.WAN, 3, 9),
          createPung(TileType.WAN, 4, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      // 纯顺子牌型
      it('should not detect with 4 chows', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createChow(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      // 纯杠牌型
      it('should not detect with 4 kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createKong(TileType.WAN, 1, 3),
          createKong(TileType.WAN, 2, 7),
          createKong(TileType.WAN, 3, 11),
          createKong(TileType.WAN, 4, 15)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      // 混合牌型测试
      it('should not detect with mixed combinations (2 chows, 1 pung, 1 kong)', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createPung(TileType.WAN, 7, 9),
          createKong(TileType.TIAO, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      it('should not detect with mixed combinations (3 chows, 1 pung)', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets: TileSet[] = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.WAN, 4, 6),
          createChow(TileType.TIAO, 1, 9),
          createPung(TileType.TONG, 1, 12)
        ];
        expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
      });
      
      // 各种带杠的组合
      [1, 2, 3, 4].forEach(numKongs => {
        if (numKongs === 4) {
          // 已经测试过4杠的情况
          return;
        }
        
        it(`should not detect with ${numKongs} kongs and complementary sets`, () => {
          const handTiles = createPair(TileType.WAN, 9, 1);
          const revealedSets: TileSet[] = [];
          
          // 添加杠
          for (let i = 0; i < numKongs; i++) {
            revealedSets.push(createKong(TileType.WAN, 1 + i, i * 4 + 3));
          }
          
          // 添加碰和吃来补充到4副
          const remainingSets = 4 - numKongs;
          for (let i = 0; i < remainingSets; i++) {
            if (i % 2 === 0) {
              revealedSets.push(createPung(TileType.TIAO, 1 + i, 20 + i * 3));
            } else {
              revealedSets.push(createChow(TileType.TONG, 1 + i, 30 + i * 3));
            }
          }
          
          expect(detector.detect(handTiles, revealedSets, mockPlayer, invalidGameStateIsDrawn)).to.be.false;
        });
      });
    });
  });
}); 