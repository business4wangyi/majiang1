import { expect } from 'chai';
import { PureShiftedChowsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_pure-shifted-chows';
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

function createShiftedChows(type: TileType, startValue: number, step: number, startId = 1): TileSet[] {
  const chows: TileSet[] = [];
  let id = startId;
  
  for (let i = 0; i < 4; i++) {
    chows.push(createChow(type, startValue + i * step, id));
    id += 3;
  }
  
  return chows;
}

// 创建连续顺子手牌
function createChowsInHand(type: TileType, startValues: number[], startId = 1): Tile[] {
  const tiles: Tile[] = [];
  let id = startId;
  
  for (const startValue of startValues) {
    tiles.push(
      new Tile(type, startValue, id),
      new Tile(type, startValue + 1, id + 1),
      new Tile(type, startValue + 2, id + 2)
    );
    id += 3;
  }
  
  return tiles;
}

describe('PureShiftedChowsDetector', () => {
  const detector = new PureShiftedChowsDetector();
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
  cases.forEach(([chiCount, pengCount, kongCount]) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;
    
    // 一步高测试（相邻顺子间隔为1）
    it(`Case ${caseIdx++}: 能胡牌: ${title} - 一步高`, () => {
      // 准备明牌
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 1. 准备四个连续的顺子（一步高）
      // 如果要求的吃数量大于0，添加到明牌中
      for (let i = 0; i < Math.min(chiCount, 4); i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 2. 如果需要，准备手牌中的顺子
      let handTiles: Tile[] = [];
      if (chiCount < 4) {
        // 需要在手牌中准备剩余的顺子
        for (let i = chiCount; i < 4; i++) {
          handTiles = handTiles.concat([
            new Tile(TileType.WAN, 1 + i, id),
            new Tile(TileType.WAN, 2 + i, id + 1),
            new Tile(TileType.WAN, 3 + i, id + 2)
          ]);
          id += 3;
        }
      }
      
      // 3. 准备额外的碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 4. 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.TIAO, 9, id));
      
      // 5. 如果还有多余的吃，添加到明牌中
      for (let i = 4; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TIAO, 5, id));
        id += 3;
      }
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    // 二步高测试（相邻顺子间隔为2）
    it(`Case ${caseIdx++}: 能胡牌: ${title} - 二步高`, () => {
      // 准备明牌
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 1. 准备四个间隔为2的顺子（二步高）
      // 如果要求的吃数量大于0，添加到明牌中
      for (let i = 0; i < Math.min(chiCount, 4); i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i * 2, id));
        id += 3;
      }
      
      // 2. 如果需要，准备手牌中的顺子
      let handTiles: Tile[] = [];
      if (chiCount < 4) {
        // 需要在手牌中准备剩余的顺子
        for (let i = chiCount; i < 4; i++) {
          handTiles = handTiles.concat([
            new Tile(TileType.WAN, 1 + i * 2, id),
            new Tile(TileType.WAN, 2 + i * 2, id + 1),
            new Tile(TileType.WAN, 3 + i * 2, id + 2)
          ]);
          id += 3;
        }
      }
      
      // 3. 准备额外的碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 4. 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.TIAO, 9, id));
      
      // 5. 如果还有多余的吃，添加到明牌中
      for (let i = 4; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TIAO, 5, id));
        id += 3;
      }
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    // 一步高不成立测试
    it(`Case ${caseIdx++}: 不能胡牌: ${title} - 打破一步高`, () => {
      // 准备明牌
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 只准备三个连续的顺子，然后打破连续性
      for (let i = 0; i < Math.min(chiCount, 3); i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 如果需要第四个顺子，添加一个不连续的
      if (chiCount >= 4) {
        revealedSets.push(createChow(TileType.WAN, 5, id));
        id += 3;
        
        // 添加额外的顺子
        for (let i = 4; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.TIAO, 5, id));
          id += 3;
        }
      }
      
      // 准备手牌
      let handTiles: Tile[] = [];
      
      // 如果明牌中的顺子不足三个，在手牌中补充
      if (chiCount < 3) {
        // 添加连续的顺子
        for (let i = chiCount; i < 3; i++) {
          handTiles = handTiles.concat([
            new Tile(TileType.WAN, 1 + i, id),
            new Tile(TileType.WAN, 2 + i, id + 1),
            new Tile(TileType.WAN, 3 + i, id + 2)
          ]);
          id += 3;
        }
        
        // 添加一个不连续的顺子
        handTiles = handTiles.concat([
          new Tile(TileType.WAN, 5, id),
          new Tile(TileType.WAN, 6, id + 1),
          new Tile(TileType.WAN, 7, id + 2)
        ]);
        id += 3;
      }
      
      // 准备额外的碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.TIAO, 9, id));
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
    
    // 二步高不成立测试
    it(`Case ${caseIdx++}: 不能胡牌: ${title} - 打破二步高`, () => {
      // 准备明牌
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 只准备三个符合二步高规则的顺子，然后打破连续性
      for (let i = 0; i < Math.min(chiCount, 3); i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i * 2, id));
        id += 3;
      }
      
      // 如果需要第四个顺子，添加一个不连续的
      if (chiCount >= 4) {
        revealedSets.push(createChow(TileType.WAN, 8, id)); // 应该是7才对
        id += 3;
        
        // 添加额外的顺子
        for (let i = 4; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.TIAO, 5, id));
          id += 3;
        }
      }
      
      // 准备手牌
      let handTiles: Tile[] = [];
      
      // 如果明牌中的顺子不足三个，在手牌中补充
      if (chiCount < 3) {
        // 添加符合二步高规则的顺子
        for (let i = chiCount; i < 3; i++) {
          handTiles = handTiles.concat([
            new Tile(TileType.WAN, 1 + i * 2, id),
            new Tile(TileType.WAN, 2 + i * 2, id + 1),
            new Tile(TileType.WAN, 3 + i * 2, id + 2)
          ]);
          id += 3;
        }
        
        // 添加一个不符合二步高规则的顺子
        handTiles = handTiles.concat([
          new Tile(TileType.WAN, 8, id), // 应该是7才对
          new Tile(TileType.WAN, 9, id + 1),
          new Tile(TileType.WAN, 1, id + 2)
        ]);
        id += 3;
      }
      
      // 准备额外的碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TIAO, 1 + i, id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TONG, 1 + i, id));
        id += 4;
      }
      
      // 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.TIAO, 9, id));
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 