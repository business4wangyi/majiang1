import { expect } from 'chai';
import { TwoIdenticalPungsDetector } from '../../src/win-conditions/win-conditions_two-identical-pungs';
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

// 构造双同刻的手牌（如：万3、条3各3张，外加任意刻子和对子）
function createTwoIdenticalPungsHand(pungValue: number, thirdType: TileType, thirdValue: number, pairType: TileType, pairValue: number, startId = 1): Tile[] {
  const tiles: Tile[] = [];
  let id = startId;
  // 两种花色的同一点数刻子
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.WAN, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  tiles.push(new Tile(TileType.TIAO, pungValue, id++));
  // 另一个刻子
  tiles.push(new Tile(thirdType, thirdValue, id++));
  tiles.push(new Tile(thirdType, thirdValue, id++));
  tiles.push(new Tile(thirdType, thirdValue, id++));
  // 加入对子
  tiles.push(new Tile(pairType, pairValue, id++));
  tiles.push(new Tile(pairType, pairValue, id++));
  return tiles;
}

describe('TwoIdenticalPungsDetector', () => {
  const detector = new TwoIdenticalPungsDetector();
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
    // 能胡牌测试：手牌为双同刻，明牌为任意组合
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
      // 手牌：双同刻（点数随idx变化，防止重复）
      const pungValue = (idx % 7) + 1;
      const handTiles = createTwoIdenticalPungsHand(pungValue, TileType.TONG, 1, TileType.WAN, 1, 1);
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });

    // 不能胡牌测试：手牌没有两组不同花色同点数的刻子
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 2000;
      // 明牌点数固定为9，所有碰和杠都用万色，避免不同花色同点数
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.WAN, 9, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.WAN, 9, id));
        id += 4;
      }
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.TONG, 1, id));
        id += 3;
      }
      // 手牌：只有万色的两个刻子+条色顺子+对子
      const pungValue = (idx % 7) + 1;
      const tiles: Tile[] = [];
      let tid = 1;
      // 万色两个刻子
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue + 1 > 9 ? 1 : pungValue + 1, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue + 1 > 9 ? 1 : pungValue + 1, tid++));
      tiles.push(new Tile(TileType.WAN, pungValue + 1 > 9 ? 1 : pungValue + 1, tid++));
      // 条色顺子
      let chowStart = pungValue <= 7 ? pungValue : 1;
      tiles.push(new Tile(TileType.TIAO, chowStart, tid++));
      tiles.push(new Tile(TileType.TIAO, chowStart + 1, tid++));
      tiles.push(new Tile(TileType.TIAO, chowStart + 2, tid++));
      // 加入对子
      tiles.push(new Tile(TileType.WAN, 1, tid++));
      tiles.push(new Tile(TileType.WAN, 1, tid++));
      expect(detector.detect(tiles, revealedSets)).to.equal(false);
    });
  });
}); 