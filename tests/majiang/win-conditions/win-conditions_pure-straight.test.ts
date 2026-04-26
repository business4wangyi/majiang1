import { expect } from 'chai';
import { PureStraightDetector } from '../../../src/majiang/core/win-conditions/win-conditions_pure-straight';
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

function createPair(type: TileType, value: number, startId = 1): Tile[] {
  return [
    new Tile(type, value, startId),
    new Tile(type, value, startId + 1)
  ];
}

function createHandTilesForChow(type: TileType, startValue: number, startId = 1): Tile[] {
  return [
    new Tile(type, startValue, startId),
    new Tile(type, startValue + 1, startId + 1),
    new Tile(type, startValue + 2, startId + 2)
  ];
}

// 创建一条龙的手牌（1-9）
function createPureStraightHandTiles(type: TileType, startId = 1): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 1; i <= 9; i++) {
    tiles.push(new Tile(type, i, startId++));
  }
  return tiles;
}

describe('PureStraightDetector', () => {
  const detector = new PureStraightDetector();
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
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 构建一色三同顺的牌型
      // 确保至少有三个顺子1-3，4-6，7-9，且花色相同
      let hasThreeChows = false;
      
      if (chiCount >= 3) {
        // 如果吃的数量大于等于3，直接使用吃来构建一条龙
        revealedSets.push(createChow(TileType.WAN, 1, id)); // 1-2-3
        id += 3;
        revealedSets.push(createChow(TileType.WAN, 4, id)); // 4-5-6
        id += 3;
        revealedSets.push(createChow(TileType.WAN, 7, id)); // 7-8-9
        id += 3;
        
        // 添加剩余的吃
        for (let i = 0; i < chiCount - 3; i++) {
          revealedSets.push(createChow(TileType.TIAO, 1 + i, id));
          id += 3;
        }
        hasThreeChows = true;
      } else {
        // 添加现有的吃
        for (let i = 0; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.WAN, 1 + i * 3, id));
          id += 3;
        }
      }
      
      // 添加碰
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      // 添加杠
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 手牌：补足4组+1对
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      if (!hasThreeChows && setsNeeded >= 3) {
        // 如果明牌中没有完整的一条龙，且手牌中有足够空间，在手牌中添加三个连续顺子
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 1, id));
        id += 3;
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 4, id));
        id += 3;
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 7, id));
        id += 3;
        
        // 补充剩余的集合
        for (let i = 0; i < setsNeeded - 3; i++) {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.TIAO, 1 + i, id));
          id += 3;
        }
      } else if (!hasThreeChows) {
        // 如果明牌中没有完整的一条龙，且手牌空间不足，直接添加完整的1-9序列
        const pureStraightTiles = createPureStraightHandTiles(TileType.WAN, id);
        handTiles = handTiles.concat(pureStraightTiles);
        id += 9;
        
        // 再补充其他牌型以达到所需集合数
        for (let i = 0; i < setsNeeded - 3; i++) {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.TIAO, 1 + i, id));
          id += 3;
        }
      } else {
        // 如果明牌中已有一条龙，补充其他牌型
        for (let i = 0; i < setsNeeded; i++) {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.TIAO, 1 + i, id));
          id += 3;
        }
      }
      
      // 添加对子
      handTiles = handTiles.concat(createPair(TileType.TONG, 9, id));
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 故意构建不满足一色三同顺的牌型
      for (let i = 0; i < chiCount; i++) {
        // 使用不同花色的顺子，或者不连续的顺子
        if (i % 3 === 0) {
          revealedSets.push(createChow(TileType.WAN, 1, id));
        } else if (i % 3 === 1) {
          revealedSets.push(createChow(TileType.TIAO, 1, id));
        } else {
          revealedSets.push(createChow(TileType.TONG, 1, id));
        }
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
      
      // 手牌：补足4组+1对，但不形成一条龙
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      // 使用不同花色或不连续的顺子，确保不能构成一条龙
      for (let i = 0; i < setsNeeded; i++) {
        if (i % 3 === 0) {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 1, id));
        } else if (i % 3 === 1) {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.TIAO, 1, id));
        } else {
          handTiles = handTiles.concat(createHandTilesForChow(TileType.TONG, 1, id));
        }
        id += 3;
      }
      
      // 添加对子
      handTiles = handTiles.concat(createPair(TileType.TONG, 9, id));
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 