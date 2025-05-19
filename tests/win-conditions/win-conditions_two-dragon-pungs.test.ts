import { expect } from 'chai';
import { TwoDragonPungsDetector } from '../../src/win-conditions/win-conditions_two-dragon-pungs';
import { Tile, TileType, JianValue } from '../../src/tile';
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

// 构造两副箭牌刻子的手牌
function createTwoDragonPungsHand(startId = 1): Tile[] {
  // 红中、发财各3张，其他随便补满14张
  const tiles: Tile[] = [];
  let id = startId;
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.JIAN, JianValue.ZHONG, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.JIAN, JianValue.FA, id++));
  // 补充一组对子和一组顺子
  for (let i = 0; i < 2; i++) tiles.push(new Tile(TileType.WAN, 1, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.TIAO, i + 1, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.TONG, i + 1, id++));
  return tiles;
}

// 构造只有一副箭牌刻子的手牌
function createOneDragonPungHand(startId = 1): Tile[] {
  // 红中3张，其他随便补满14张
  const tiles: Tile[] = [];
  let id = startId;
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.JIAN, JianValue.ZHONG, id++));
  // 补充一组对子和三组顺子
  for (let i = 0; i < 2; i++) tiles.push(new Tile(TileType.WAN, 1, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.TIAO, i + 1, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.TONG, i + 1, id++));
  for (let i = 0; i < 3; i++) tiles.push(new Tile(TileType.WAN, i + 2, id++));
  return tiles;
}

describe('TwoDragonPungsDetector', () => {
  const detector = new TwoDragonPungsDetector();
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
  cases.forEach(([chiCount, pengCount, kongCount], idx) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;

    // 能胡牌测试：手牌有两副箭刻，明牌为任意组合
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
      const handTiles = createTwoDragonPungsHand(1);
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });

    // 不能胡牌测试：手牌只有一副箭刻，明牌为任意组合
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
      const handTiles = createOneDragonPungHand(1);
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 