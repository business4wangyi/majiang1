import { expect } from 'chai';
import { PingHuDetector } from '../../../src/majiang/core/win-conditions/win-conditions_ping-hu';
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

describe('PingHuDetector', () => {
  const detector = new PingHuDetector();
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
      // 手牌：补足4组顺子或刻子+1对
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      for (let i = 0; i < setsNeeded; i++) {
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 5 + i, id));
        id += 3;
      }
      handTiles = handTiles.concat(createPair(TileType.TIAO, 9, id));
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
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
      // 手牌：故意破坏一组（如对子变成单张）
      const setsNeeded = 4 - (chiCount + pengCount + kongCount);
      let handTiles: Tile[] = [];
      for (let i = 0; i < setsNeeded; i++) {
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 5 + i, id));
        id += 3;
      }
      // 破坏对子
      handTiles.push(new Tile(TileType.TIAO, 9, id));
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 