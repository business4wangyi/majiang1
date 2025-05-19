import { expect } from 'chai';
import { ThreeKongsDetector } from '../../src/win-conditions/win-conditions_three-kongs';
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

describe('ThreeKongsDetector', () => {
  const detector = new ThreeKongsDetector();
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

    // 能胡牌测试：明牌中杠数为3
    if (kongCount === 3) {
      it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
        const revealedSets: TileSet[] = [];
        let id = 1000;
        // 先加杠
        for (let i = 0; i < kongCount; i++) {
          revealedSets.push(createKong(TileType.WAN, (i % 9) + 1, id));
          id += 4;
        }
        // 再加碰
        for (let i = 0; i < pengCount; i++) {
          revealedSets.push(createPung(TileType.TONG, (i % 9) + 1, id));
          id += 3;
        }
        // 再加吃
        for (let i = 0; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.TIAO, ((i % 7) + 1), id));
          id += 3;
        }
        expect(detector.detect([], revealedSets)).to.equal(true);
      });
    } else {
      // 不能胡牌测试：明牌中杠数不是3
      it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
        const revealedSets: TileSet[] = [];
        let id = 2000;
        // 先加杠
        for (let i = 0; i < kongCount; i++) {
          revealedSets.push(createKong(TileType.WAN, (i % 9) + 1, id));
          id += 4;
        }
        // 再加碰
        for (let i = 0; i < pengCount; i++) {
          revealedSets.push(createPung(TileType.TONG, (i % 9) + 1, id));
          id += 3;
        }
        // 再加吃
        for (let i = 0; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.TIAO, ((i % 7) + 1), id));
          id += 3;
        }
        expect(detector.detect([], revealedSets)).to.equal(false);
      });
    }
  });
}); 