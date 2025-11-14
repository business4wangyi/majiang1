import { expect } from 'chai';
import { PureTerminalChowDetector } from '../../src/majiang/win-conditions/win-conditions_pure-terminal-chow';
import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';

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

function createTerminalTiles(type: TileType, startId = 1): Tile[] {
  // 创建1和9的牌
  return [
    new Tile(type, 1, startId),
    new Tile(type, 1, startId + 1),
    new Tile(type, 1, startId + 2),
    new Tile(type, 9, startId + 3),
    new Tile(type, 9, startId + 4),
    new Tile(type, 9, startId + 5)
  ];
}

describe('PureTerminalChowDetector', () => {
  const detector = new PureTerminalChowDetector();
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
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 构建清幺九牌型（所有牌都是1或9）
      
      // 添加吃
      for (let i = 0; i < chiCount; i++) {
        // 清幺九不可能有顺子，因为顺子必然包含非1非9的牌
        // 所以这里不添加吃，而是稍后在手牌中添加对应数量的刻子
      }
      
      // 添加碰
      for (let i = 0; i < pengCount; i++) {
        if (i % 2 === 0) {
          revealedSets.push(createPung(TileType.WAN, 1, id));
        } else {
          revealedSets.push(createPung(TileType.WAN, 9, id));
        }
        id += 3;
      }
      
      // 添加杠
      for (let i = 0; i < kongCount; i++) {
        if (i % 2 === 0) {
          revealedSets.push(createKong(TileType.TIAO, 1, id));
        } else {
          revealedSets.push(createKong(TileType.TIAO, 9, id));
        }
        id += 4;
      }
      
      // 手牌：补足4组+1对
      // 在清幺九中，只能用刻子和对子，不能有顺子
      const setsNeeded = 4 - (pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      // 添加刻子（包括原本应该是吃的部分）
      for (let i = 0; i < setsNeeded; i++) {
        if (i % 2 === 0) {
          handTiles.push(new Tile(TileType.TONG, 1, id++));
          handTiles.push(new Tile(TileType.TONG, 1, id++));
          handTiles.push(new Tile(TileType.TONG, 1, id++));
        } else {
          handTiles.push(new Tile(TileType.TONG, 9, id++));
          handTiles.push(new Tile(TileType.TONG, 9, id++));
          handTiles.push(new Tile(TileType.TONG, 9, id++));
        }
      }
      
      // 添加对子
      if (setsNeeded % 2 === 0) {
        handTiles = handTiles.concat(createPair(TileType.WAN, 1, id));
      } else {
        handTiles = handTiles.concat(createPair(TileType.WAN, 9, id));
      }
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 故意构建不满足清幺九的牌型
      
      // 添加吃（造成不符合，因为包含非1非9的牌）
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1, id));
        id += 3;
      }
      
      // 添加碰
      for (let i = 0; i < pengCount; i++) {
        // 故意使用2或8，不是1或9
        if (i % 2 === 0) {
          revealedSets.push(createPung(TileType.TIAO, 2, id));
        } else {
          revealedSets.push(createPung(TileType.TIAO, 8, id));
        }
        id += 3;
      }
      
      // 添加杠
      for (let i = 0; i < kongCount; i++) {
        // 如果是最后一个杠，则故意使用1或9以确保不全部是非1非9
        if (i === kongCount - 1 && kongCount > 0) {
          revealedSets.push(createKong(TileType.TONG, 1, id));
        } else {
          revealedSets.push(createKong(TileType.TONG, 5, id));
        }
        id += 4;
      }
      
      // 手牌：补足4组+1对
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      // 添加刻子，但不全是1或9
      for (let i = 0; i < setsNeeded; i++) {
        // 最后一组故意使用1或9确保不全部是非1非9
        if (i === setsNeeded - 1 && setsNeeded > 0) {
          handTiles.push(new Tile(TileType.TONG, 9, id++));
          handTiles.push(new Tile(TileType.TONG, 9, id++));
          handTiles.push(new Tile(TileType.TONG, 9, id++));
        } else {
          handTiles.push(new Tile(TileType.TONG, 3 + i, id++));
          handTiles.push(new Tile(TileType.TONG, 3 + i, id++));
          handTiles.push(new Tile(TileType.TONG, 3 + i, id++));
        }
      }
      
      // 添加对子
      handTiles = handTiles.concat(createPair(TileType.TONG, 5, id));
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 