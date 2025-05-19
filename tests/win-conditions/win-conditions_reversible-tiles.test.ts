import { expect } from 'chai';
import { ReversibleTilesDetector } from '../../src/win-conditions/win-conditions_reversible-tiles';
import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';

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

// 为推不倒创建合法的可倒置牌组合
function createReversibleChow(startId = 1): TileSet {
  // 条子牌2, 4, 5是对称的，所以使用2, 4, 5组成顺子
  return {
    type: 'CHI',
    tiles: [
      new Tile(TileType.TIAO, 2, startId),
      new Tile(TileType.TIAO, 4, startId + 1),
      new Tile(TileType.TIAO, 5, startId + 2)
    ]
  };
}

function createReversiblePung(startId = 1): TileSet {
  // 筒子牌2是对称的
  return createPung(TileType.TONG, 2, startId);
}

function createReversibleKong(startId = 1): TileSet {
  // 筒子牌5是对称的
  return createKong(TileType.TONG, 5, startId);
}

function createReversiblePair(startId = 1): Tile[] {
  // 白板是对称的
  return [
    new Tile(TileType.JIAN, 3, startId),
    new Tile(TileType.JIAN, 3, startId + 1)
  ];
}

function createNonReversibleTile(startId = 1): Tile {
  // 万子牌不是对称的
  return new Tile(TileType.WAN, 1, startId);
}

describe('ReversibleTilesDetector', () => {
  const detector = new ReversibleTilesDetector();
  
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
  
  // 确保总共有35种牌型组合
  expect(cases.length).to.equal(35);

  let caseIdx = 1;
  cases.forEach(([chiCount, pengCount, kongCount]) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;
    
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 创建指定数量的吃、碰、杠组合，都使用可倒置牌
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createReversibleChow(id));
        id += 3;
      }
      
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createReversiblePung(id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createReversibleKong(id));
        id += 4;
      }
      
      // 手牌：补足4组可倒置的牌型+1对可倒置对子
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      // 添加可倒置的牌组合
      for (let i = 0; i < setsNeeded; i++) {
        if (i % 2 === 0) {
          // 添加可倒置的顺子
          handTiles.push(new Tile(TileType.TIAO, 2, id));
          handTiles.push(new Tile(TileType.TIAO, 4, id + 1));
          handTiles.push(new Tile(TileType.TIAO, 5, id + 2));
        } else {
          // 添加可倒置的刻子
          handTiles.push(new Tile(TileType.TONG, 8, id));
          handTiles.push(new Tile(TileType.TONG, 8, id + 1));
          handTiles.push(new Tile(TileType.TONG, 8, id + 2));
        }
        id += 3;
      }
      
      // 添加可倒置的对子
      handTiles = handTiles.concat(createReversiblePair(id));
      
      // 执行检测
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 创建指定数量的吃、碰、杠组合，绝大部分使用可倒置牌
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createReversibleChow(id));
        id += 3;
      }
      
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createReversiblePung(id));
        id += 3;
      }
      
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createReversibleKong(id));
        id += 4;
      }
      
      // 手牌：补足4组牌型+1对对子，但包含一张不可倒置的牌
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      
      // 添加牌组合
      for (let i = 0; i < setsNeeded; i++) {
        if (i === 0) {
          // 添加包含不可倒置牌的组合（使用万子牌，它们不是可倒置的）
          handTiles.push(new Tile(TileType.WAN, 1, id));
          handTiles.push(new Tile(TileType.WAN, 2, id + 1));
          handTiles.push(new Tile(TileType.WAN, 3, id + 2));
        } else {
          // 添加可倒置的顺子
          handTiles.push(new Tile(TileType.TIAO, 2, id));
          handTiles.push(new Tile(TileType.TIAO, 4, id + 1));
          handTiles.push(new Tile(TileType.TIAO, 5, id + 2));
        }
        id += 3;
      }
      
      // 添加可倒置的对子
      handTiles = handTiles.concat(createReversiblePair(id));
      
      // 如果没有手牌组合（即全部是明牌），则在对子中添加一张不可倒置的牌
      if (setsNeeded === 0) {
        handTiles = [createNonReversibleTile(id), new Tile(TileType.TIAO, 2, id + 1)];
      }
      
      // 执行检测
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 