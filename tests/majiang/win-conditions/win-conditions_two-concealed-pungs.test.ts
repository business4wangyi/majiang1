import { expect } from 'chai';
import { TwoConcealedPungsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_two-concealed-pungs';
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

// 构造能胡牌的手牌（两组暗刻+7张单牌）
function createHuHand(startId = 1): Tile[] {
  let id = startId;
  // 3张1万，3张2万，7张不同的单牌
  const tiles: Tile[] = [
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 2, id++),
    new Tile(TileType.WAN, 2, id++),
    new Tile(TileType.WAN, 2, id++),
    new Tile(TileType.WAN, 3, id++),
    new Tile(TileType.WAN, 4, id++),
    new Tile(TileType.WAN, 5, id++),
    new Tile(TileType.WAN, 6, id++),
    new Tile(TileType.WAN, 7, id++),
    new Tile(TileType.WAN, 8, id++),
    new Tile(TileType.WAN, 9, id++),
    new Tile(TileType.TIAO, 1, id++) // 14张
  ];
  return tiles;
}

// 构造不能胡牌的手牌（一组暗刻+11张单牌）
function createNotHuHand(startId = 1): Tile[] {
  let id = startId;
  // 3张1万，11张不同的单牌
  const tiles: Tile[] = [
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 1, id++),
    new Tile(TileType.WAN, 2, id++),
    new Tile(TileType.WAN, 3, id++),
    new Tile(TileType.WAN, 4, id++),
    new Tile(TileType.WAN, 5, id++),
    new Tile(TileType.WAN, 6, id++),
    new Tile(TileType.WAN, 7, id++),
    new Tile(TileType.WAN, 8, id++),
    new Tile(TileType.WAN, 9, id++),
    new Tile(TileType.TIAO, 1, id++),
    new Tile(TileType.TIAO, 2, id++),
    new Tile(TileType.TIAO, 3, id++) // 14张
  ];
  return tiles;
}

describe('TwoConcealedPungsDetector', () => {
  const detector = new TwoConcealedPungsDetector();
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
  expect(cases.length).to.equal(35);

  let caseIdx = 1;
  cases.forEach(([chiCount, pengCount, kongCount]) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;

    // 能胡牌测试：手牌有两组暗刻
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 1000;
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TONG, (i % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.WAN, (i % 9) + 1, id));
        id += 4;
      }
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TIAO, ((i % 7) + 1), id));
        id += 3;
      }
      const handTiles = createHuHand(1);
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });

    // 不能胡牌测试：手牌只有一组暗刻
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 2000;
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TONG, (i % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.WAN, (i % 9) + 1, id));
        id += 4;
      }
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TIAO, ((i % 7) + 1), id));
        id += 3;
      }
      const handTiles = createNotHuHand(1);
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 