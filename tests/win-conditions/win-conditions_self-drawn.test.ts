import { Tile, TileType } from '../../src/tile';
import { TileSet, HuType } from '../../src/rule-types';
import { SelfDrawnDetector } from '../../src/win-conditions/win-conditions_self-drawn';
import { expect } from 'chai';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
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
function createKong(type: TileType, value: number, startId = 1): TileSet {
  return {
    type: 'GANG',
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2),
      new Tile(type, value, startId + 3)
    ]
  };
}

// 组合牌型
function generateHandTiles(chowCount: number, pungCount: number, kongCount: number): [Tile[], TileSet[]] {
  let handTiles: Tile[] = [];
  let revealedSets: TileSet[] = [];
  
  let idCounter = 1;
  let meldTypes = ['WAN', 'TIAO', 'TONG'];
  let meldIndex = 0;
  let meldValue = 1;
  
  // 添加顺子
  for (let i = 0; i < chowCount; i++) {
    revealedSets.push(createChow(TileType[meldTypes[meldIndex] as keyof typeof TileType], meldValue, idCounter));
    idCounter += 3;
    meldIndex = (meldIndex + 1) % meldTypes.length;
    meldValue = meldValue === 7 ? 1 : meldValue + 1;
  }
  
  // 添加刻子
  for (let i = 0; i < pungCount; i++) {
    revealedSets.push(createPung(TileType[meldTypes[meldIndex] as keyof typeof TileType], meldValue, idCounter));
    idCounter += 3;
    meldIndex = (meldIndex + 1) % meldTypes.length;
    meldValue = meldValue === 9 ? 1 : meldValue + 1;
  }
  
  // 添加杠
  for (let i = 0; i < kongCount; i++) {
    revealedSets.push(createKong(TileType[meldTypes[meldIndex] as keyof typeof TileType], meldValue, idCounter));
    idCounter += 4;
    meldIndex = (meldIndex + 1) % meldTypes.length;
    meldValue = meldValue === 9 ? 1 : meldValue + 1;
  }
  
  // 添加雀头
  handTiles.push(...createTiles(TileType.WAN, [1, 1], idCounter));
  idCounter += 2;
  
  // 根据已有的顺子、刻子、杠，计算还需要多少张牌才够14张
  const existingTileCount = chowCount * 3 + pungCount * 3 + kongCount * 4 + 2;
  const remainingTileCount = 14 - existingTileCount;
  
  // 再添加足够数量的牌，确保总数为14张
  if (remainingTileCount > 0) {
    handTiles.push(...createTiles(TileType.TIAO, Array(remainingTileCount).fill(2), idCounter));
  }
  
  return [handTiles, revealedSets];
}

describe('SelfDrawnDetector', () => {
  let detector: SelfDrawnDetector;
  
  beforeEach(() => {
    detector = new SelfDrawnDetector();
  });

  describe('Valid self-drawn scenarios', () => {
    // 测试35种牌型组合 (x副吃，y副碰，z副杠，且x+y+z<=4)
    const validCombinations = [
      // 0副吃的组合
      [0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4],
      [0, 1, 0], [0, 1, 1], [0, 1, 2], [0, 1, 3],
      [0, 2, 0], [0, 2, 1], [0, 2, 2],
      [0, 3, 0], [0, 3, 1],
      [0, 4, 0],
      
      // 1副吃的组合
      [1, 0, 0], [1, 0, 1], [1, 0, 2], [1, 0, 3],
      [1, 1, 0], [1, 1, 1], [1, 1, 2],
      [1, 2, 0], [1, 2, 1],
      [1, 3, 0],
      
      // 2副吃的组合
      [2, 0, 0], [2, 0, 1], [2, 0, 2],
      [2, 1, 0], [2, 1, 1],
      [2, 2, 0],
      
      // 3副吃的组合
      [3, 0, 0], [3, 0, 1],
      [3, 1, 0],
      
      // 4副吃的组合
      [4, 0, 0]
    ];
    
    validCombinations.forEach(([chowCount, pungCount, kongCount]) => {
      it(`should detect valid self-drawn with ${chowCount} chow(s), ${pungCount} pung(s), and ${kongCount} kong(s)`, () => {
        const [handTiles, revealedSets] = generateHandTiles(chowCount, pungCount, kongCount);
        
        // 模拟自摸的游戏状态
        const gameState = {
          isDrawn: true,
          isLastTile: false,
          isAfterKong: false,
          isRobbingKong: false
        };
        
        expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.true;
      });
    });
  });

  describe('Invalid self-drawn scenarios', () => {
    // 测试35种牌型组合，但不是自摸的情况
    const invalidCombinations = [
      // 同样的35种组合，但isDrawn为false
      [0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4],
      [0, 1, 0], [0, 1, 1], [0, 1, 2], [0, 1, 3],
      [0, 2, 0], [0, 2, 1], [0, 2, 2],
      [0, 3, 0], [0, 3, 1],
      [0, 4, 0],
      
      // 1副吃的组合
      [1, 0, 0], [1, 0, 1], [1, 0, 2], [1, 0, 3],
      [1, 1, 0], [1, 1, 1], [1, 1, 2],
      [1, 2, 0], [1, 2, 1],
      [1, 3, 0],
      
      // 2副吃的组合
      [2, 0, 0], [2, 0, 1], [2, 0, 2],
      [2, 1, 0], [2, 1, 1],
      [2, 2, 0],
      
      // 3副吃的组合
      [3, 0, 0], [3, 0, 1],
      [3, 1, 0],
      
      // 4副吃的组合
      [4, 0, 0]
    ];
    
    invalidCombinations.forEach(([chowCount, pungCount, kongCount]) => {
      it(`should not detect self-drawn with ${chowCount} chow(s), ${pungCount} pung(s), and ${kongCount} kong(s) when not a self-drawn tile`, () => {
        const [handTiles, revealedSets] = generateHandTiles(chowCount, pungCount, kongCount);
        
        // 非自摸的游戏状态
        const gameState = {
          isDrawn: false,
          isLastTile: false,
          isAfterKong: false,
          isRobbingKong: false
        };
        
        expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.false;
      });
    });
    
    it('should not detect self-drawn when gameState is undefined', () => {
      const [handTiles, revealedSets] = generateHandTiles(0, 0, 0);
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('should not detect self-drawn when isDrawn is undefined', () => {
      const [handTiles, revealedSets] = generateHandTiles(0, 0, 0);
      const gameState = {
        isLastTile: false,
        isAfterKong: false,
        isRobbingKong: false
      };
      expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.false;
    });
  });

  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('自摸');
    expect(detector.getDescription()).to.equal('自己摸牌和牌，不求人');
    expect(detector.getScore()).to.equal(8);
    expect(detector.getHuType()).to.equal(HuType.SELF_DRAWN);
  });
}); 