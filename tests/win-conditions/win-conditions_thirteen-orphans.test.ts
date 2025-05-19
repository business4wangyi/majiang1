import { expect } from 'chai';
import { ThirteenOrphansDetector } from '../../src/win-conditions/win-conditions_thirteen-orphans';
import { Tile, TileType, FengValue, JianValue } from '../../src/tile';
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

// 十三幺需要的所有牌
const thirteenOrphansTiles = [
  { type: TileType.WAN, value: 1 },
  { type: TileType.WAN, value: 9 },
  { type: TileType.TIAO, value: 1 },
  { type: TileType.TIAO, value: 9 },
  { type: TileType.TONG, value: 1 },
  { type: TileType.TONG, value: 9 },
  { type: TileType.FENG, value: FengValue.DONG },
  { type: TileType.FENG, value: FengValue.NAN },
  { type: TileType.FENG, value: FengValue.XI },
  { type: TileType.FENG, value: FengValue.BEI },
  { type: TileType.JIAN, value: JianValue.ZHONG },
  { type: TileType.JIAN, value: JianValue.FA },
  { type: TileType.JIAN, value: JianValue.BAI }
];

function createThirteenOrphansHand(pairIdx: number, startId = 1): Tile[] {
  // 13种牌各一张 + 其中一种再来一张做对子
  const tiles: Tile[] = [];
  let id = startId;
  for (let i = 0; i < thirteenOrphansTiles.length; i++) {
    const { type, value } = thirteenOrphansTiles[i];
    tiles.push(new Tile(type, value, id++));
  }
  // 加入对子
  const pair = thirteenOrphansTiles[pairIdx];
  tiles.push(new Tile(pair.type, pair.value, id++));
  return tiles;
}

describe('ThirteenOrphansDetector', () => {
  const detector = new ThirteenOrphansDetector();
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

    // 能胡牌测试：手牌为十三幺，明牌为任意组合
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1000;
      // 先加碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.TONG, (i % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.WAN, (i % 9) + 1, id));
        id += 4;
      }
      // 加吃
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TIAO, ((i % 7) + 1), id));
        id += 3;
      }
      // 手牌
      const handTiles = createThirteenOrphansHand(idx % 13, 1);
      // 明牌为空才能胡十三幺
      if (revealedSets.length === 0) {
        expect(detector.detect(handTiles, revealedSets)).to.equal(true);
      } else {
        expect(detector.detect(handTiles, revealedSets)).to.equal(false);
      }
    });

    // 不能胡牌测试：手牌缺少一种十三幺必需牌
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
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
      // 手牌：去掉最后一种必需牌
      const handTiles = createThirteenOrphansHand(idx % 13, 1).slice(0, 13);
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 