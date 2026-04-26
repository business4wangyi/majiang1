import { expect } from 'chai';
import { ThreeSimilarPungsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_three-similar-pungs';
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

// 构造三色三节高的手牌（如：万3、条3、筒3各3张，外加任意对子）
function createThreeSimilarPungsHand(pungValue: number, pairType: TileType, pairValue: number, startId = 1): Tile[] {
  const tiles: Tile[] = [];
  let id = startId;
  // 三种花色的同一点数刻子
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  tiles.push(new Tile(TileType.TONG, pungValue, id++));
  tiles.push(new Tile(TileType.TONG, pungValue, id++));
  tiles.push(new Tile(TileType.TONG, pungValue, id++));
  // 加入对子
  tiles.push(new Tile(pairType, pairValue, id++));
  tiles.push(new Tile(pairType, pairValue, id++));
  return tiles;
}

describe('ThreeSimilarPungsDetector', () => {
  const detector = new ThreeSimilarPungsDetector();
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
    // 能胡牌测试：手牌为三色三节高，明牌为任意组合
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 1000;
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.WAN, ((i+1) % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TIAO, ((i+2) % 9) + 1, id));
        id += 4;
      }
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TONG, ((i+3) % 7) + 1, id));
        id += 3;
      }
      // 手牌：三色三节高（点数随idx变化，防止重复）
      const pungValue = (idx % 7) + 1;
      const handTiles = createThreeSimilarPungsHand(pungValue, TileType.WAN, 1, 1);
      // 明牌不影响三色三节高成立
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });

    // 不能胡牌测试：手牌缺少一种花色的刻子
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 2000;
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.WAN, ((i+1) % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TIAO, ((i+2) % 9) + 1, id));
        id += 4;
      }
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TONG, ((i+3) % 7) + 1, id));
        id += 3;
      }
      // 手牌：只给两种花色的刻子+对子
      const pungValue = (idx % 7) + 1;
      const tiles: Tile[] = [];
      let tid = 1;
      // 万、条各3张，筒缺失
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.TIAO, pungValue, tid++));
      tiles.push(new Tile(TileType.TIAO, pungValue, tid++));
      tiles.push(new Tile(TileType.TIAO, pungValue, tid++));
      // 缺少筒色刻子
      tiles.push(new Tile(TileType.WAN, 1, tid++));
      tiles.push(new Tile(TileType.WAN, 1, tid++));
      // 明牌不影响三色三节高不成立
      expect(detector.detect(tiles, revealedSets)).to.equal(false);
    });
  });
}); 