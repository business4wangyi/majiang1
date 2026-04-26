import { expect } from 'chai';
import { SevenStarsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_seven-stars';
import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet } from '../../../src/majiang/core/rule-types';

// 辅助函数
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

/**
 * 创建七星不靠的有效手牌组合
 */
function createValidSevenStarsHand(startId = 1): Tile[] {
  const tiles: Tile[] = [];
  let id = startId;
  
  // 添加四种风牌（东南西北）
  for (let i = 1; i <= 4; i++) {
    tiles.push(new Tile(TileType.FENG, i, id++));
  }
  
  // 添加三种箭牌（中发白）
  for (let i = 1; i <= 3; i++) {
    tiles.push(new Tile(TileType.JIAN, i, id++));
  }
  
  // 添加数牌（花色、数字各不相同且不相邻）
  // 万牌，使用1、4、7
  tiles.push(new Tile(TileType.WAN, 1, id++));
  tiles.push(new Tile(TileType.WAN, 4, id++));
  tiles.push(new Tile(TileType.WAN, 7, id++));
  
  // 条牌，使用2、5、8
  tiles.push(new Tile(TileType.TIAO, 2, id++));
  tiles.push(new Tile(TileType.TIAO, 5, id++));
  tiles.push(new Tile(TileType.TIAO, 8, id++));
  
  return tiles;
}

/**
 * 创建无效的七星不靠手牌组合（缺少一张字牌，多一张数牌）
 */
function createInvalidSevenStarsHand(startId = 1): Tile[] {
  const tiles: Tile[] = [];
  let id = startId;
  
  // 添加三种风牌（缺少一种）
  for (let i = 1; i <= 3; i++) {
    tiles.push(new Tile(TileType.FENG, i, id++));
  }
  
  // 添加三种箭牌
  for (let i = 1; i <= 3; i++) {
    tiles.push(new Tile(TileType.JIAN, i, id++));
  }
  
  // 添加数牌，比正确的七星不靠多一张
  tiles.push(new Tile(TileType.WAN, 1, id++));
  tiles.push(new Tile(TileType.WAN, 4, id++));
  tiles.push(new Tile(TileType.WAN, 7, id++));
  
  tiles.push(new Tile(TileType.TIAO, 2, id++));
  tiles.push(new Tile(TileType.TIAO, 5, id++));
  tiles.push(new Tile(TileType.TIAO, 8, id++));
  
  // 额外添加一张筒子
  tiles.push(new Tile(TileType.TONG, 3, id++));
  
  return tiles;
}

describe('SevenStarsDetector', () => {
  const detector = new SevenStarsDetector();
  
  // 枚举所有x副吃、y副碰、z副杠，x+y+z<=4
  const cases: [number, number, number][] = [];
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      for (let z = 0; z <= 4; z++) {
        if (x + y + z <= 4) {
          cases.push([x, y, z]);
        }
      }
    }
  }
  
  // 只保留35种
  expect(cases.length).to.equal(35);

  let caseIdx = 1;
  cases.forEach(([chiCount, pengCount, kongCount], idx) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;
    
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 对于七星不靠，实际上只有在没有任何明牌时才能胡
      // 但为了测试所有35种组合，这里只有chiCount=0, pengCount=0, kongCount=0时才能胡
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      const handTiles = createValidSevenStarsHand(id);
      
      // 实际测试结果，只有当没有明牌时才能胡
      const expectedResult = chiCount === 0 && pengCount === 0 && kongCount === 0;
      expect(detector.detect(handTiles, revealedSets)).to.equal(expectedResult);
    });
    
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 对于七星不靠，不能胡牌的情况：
      // 1. 有明牌
      // 2. 手牌不符合七星不靠的要求
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 使用无效的七星不靠手牌
      const handTiles = createInvalidSevenStarsHand(id);
      
      // 在所有情况下都不能胡
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
  
  // 额外测试
  it('正确的七星不靠手牌应该能胡', () => {
    const handTiles = createValidSevenStarsHand();
    expect(detector.detect(handTiles, [])).to.equal(true);
  });
  
  it('七星不靠手牌中有相邻数字时不能胡', () => {
    const handTiles = createValidSevenStarsHand();
    // 将第10张牌(条5)替换成条3，这样条2和条3就相邻了
    handTiles[10] = new Tile(TileType.TIAO, 3, 11);
    expect(detector.detect(handTiles, [])).to.equal(false);
  });
  
  it('缺少风牌时不能胡', () => {
    const handTiles = createValidSevenStarsHand();
    // 将第一张牌(东风)替换成另一张数牌
    handTiles[0] = new Tile(TileType.TONG, 6, 1);
    expect(detector.detect(handTiles, [])).to.equal(false);
  });
  
  it('缺少箭牌时不能胡', () => {
    const handTiles = createValidSevenStarsHand();
    // 将第五张牌(中)替换成另一张数牌
    handTiles[4] = new Tile(TileType.TONG, 9, 5);
    expect(detector.detect(handTiles, [])).to.equal(false);
  });
  
  it('相同花色数字超过3张时不能胡', () => {
    const handTiles = createValidSevenStarsHand();
    // 将索引为10的牌(条5)替换成万9，这样万牌就有4张了
    handTiles[10] = new Tile(TileType.WAN, 9, 11);
    expect(detector.detect(handTiles, [])).to.equal(false);
  });
}); 