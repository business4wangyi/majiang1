import { expect } from 'chai';
import { PureShiftedPungsDetector } from '../../src/majiang/win-conditions/win-conditions_pure-shifted-pungs';
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

function createHandPungs(type: TileType, value: number, startId = 1): Tile[] {
  return [
    new Tile(type, value, startId),
    new Tile(type, value, startId + 1),
    new Tile(type, value, startId + 2)
  ];
}

describe('PureShiftedPungsDetector', () => {
  const detector = new PureShiftedPungsDetector();
  
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
  
  // 应该有35种组合
  expect(cases.length).to.equal(35);

  let caseIdx = 1;
  cases.forEach(([chiCount, pengCount, kongCount]) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;
    
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 创建连续的四个刻子/杠子（一色四节高）
      // 使用统一的花色 TONG
      
      // 创建吃（虽然对一色四节高的判断没有影响）
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 创建连续的刻子，确保即使有吃也总共能构成4个连续的同花色刻子
      const needPungsInRevealed = Math.min(4, pengCount);
      for (let i = 0; i < needPungsInRevealed; i++) {
        revealedSets.push(createPung(TileType.TONG, 1 + i, id));
        id += 3;
      }
      
      // 创建连续的杠子
      const needKongsInRevealed = Math.min(4 - needPungsInRevealed, kongCount);
      for (let i = 0; i < needKongsInRevealed; i++) {
        revealedSets.push(createKong(TileType.TONG, needPungsInRevealed + 1 + i, id));
        id += 4;
      }
      
      // 手牌：用同一花色，补足剩余需要的刻子
      let handTiles: Tile[] = [];
      const remainingPungsNeeded = 4 - (needPungsInRevealed + needKongsInRevealed);
      
      for (let i = 0; i < remainingPungsNeeded; i++) {
        handTiles = handTiles.concat(createHandPungs(TileType.TONG, needPungsInRevealed + needKongsInRevealed + 1 + i, id));
        id += 3;
      }
      
      // 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.WAN, 9, id));
      
      // 确保有四个连续的同花色刻子/杠
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 创建指定数量的吃
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 创建不连续的碰子（故意破坏一色四节高）
      for (let i = 0; i < pengCount; i++) {
        // 不连续的值
        revealedSets.push(createPung(TileType.TONG, i * 2 + 1, id));
        id += 3;
      }
      
      // 创建不连续的杠子
      for (let i = 0; i < kongCount; i++) {
        // 不连续的值
        revealedSets.push(createKong(TileType.TONG, pengCount * 2 + i * 2 + 1, id));
        id += 4;
      }
      
      // 手牌：包含剩余需要的刻子，但故意使其不连续
      let handTiles: Tile[] = [];
      for (let i = 0; i < 4 - (chiCount + pengCount + kongCount); i++) {
        // 不连续的值
        handTiles = handTiles.concat(createHandPungs(TileType.TIAO, i * 2 + 1, id));
        id += 3;
      }
      
      // 添加一个对子
      handTiles = handTiles.concat(createPair(TileType.WAN, 9, id));
      
      // 确认无法胡牌
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 