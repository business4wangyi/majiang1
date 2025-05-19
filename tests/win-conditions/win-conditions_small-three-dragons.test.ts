import { expect } from 'chai';
import { SmallThreeDragonsDetector } from '../../src/win-conditions/win-conditions_small-three-dragons';
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

function createHandTilesForPung(type: TileType, value: number, startId = 1): Tile[] {
  return [
    new Tile(type, value, startId),
    new Tile(type, value, startId + 1),
    new Tile(type, value, startId + 2)
  ];
}

describe('SmallThreeDragonsDetector', () => {
  const detector = new SmallThreeDragonsDetector();
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
    
    // 能胡牌测试：保证有2种箭牌的刻子/杠和1种箭牌的对子
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 先添加箭牌组合，优先添加到明牌中
      let dragonPungCount = 0;
      
      // 添加箭牌刻子和杠到明牌中
      const maxRevealedDragons = Math.min(2, pengCount + kongCount);
      for (let i = 0; i < maxRevealedDragons; i++) {
        if (dragonPungCount < 2) {
          if (i < kongCount) {
            revealedSets.push(createKong(TileType.JIAN, i + 1, id));
          } else {
            revealedSets.push(createPung(TileType.JIAN, i + 1, id));
          }
          dragonPungCount++;
          id += i < kongCount ? 4 : 3;
        }
      }
      
      // 添加剩余的非箭牌明牌
      const remainingRevealedSets = (pengCount + kongCount) - maxRevealedDragons;
      for (let i = 0; i < remainingRevealedSets; i++) {
        if (i < (kongCount - maxRevealedDragons)) {
          revealedSets.push(createKong(TileType.TONG, i + 1, id));
          id += 4;
        } else {
          revealedSets.push(createPung(TileType.TIAO, i + 1, id));
          id += 3;
        }
      }
      
      // 添加吃的明牌
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 计算手牌中需要的箭牌刻子数量
      const neededDragonPungs = 2 - dragonPungCount;
      
      // 生成手牌
      let handTiles: Tile[] = [];
      
      // 添加箭牌刻子到手牌
      for (let i = 0; i < neededDragonPungs; i++) {
        // 确保箭牌值在1-3之间
        const dragonValue = (maxRevealedDragons + i) % 3 + 1;
        handTiles = handTiles.concat(createHandTilesForPung(TileType.JIAN, dragonValue, id));
        id += 3;
      }
      
      // 添加箭牌对子
      // 找一个没有使用过的箭牌值（1-3之间）
      let pairDragonValue = 1;
      while (pairDragonValue <= 3) {
        let used = false;
        
        // 检查明牌中是否已使用此箭牌值
        for (const set of revealedSets) {
          if (set.tiles.length > 0 && 
              set.tiles[0].type === TileType.JIAN && 
              set.tiles[0].value === pairDragonValue) {
            used = true;
            break;
          }
        }
        
        // 检查手牌中刻子是否已使用此箭牌值
        if (!used) {
          for (let i = 0; i < neededDragonPungs; i++) {
            const dragonValue = (maxRevealedDragons + i) % 3 + 1;
            if (dragonValue === pairDragonValue) {
              used = true;
              break;
            }
          }
        }
        
        if (!used) break;
        pairDragonValue++;
      }
      
      handTiles = handTiles.concat(createPair(TileType.JIAN, pairDragonValue, id));
      id += 2;
      
      // 计算还需要多少组
      const remainingSets = 4 - (chiCount + pengCount + kongCount + neededDragonPungs);
      
      // 添加其他组合到手牌
      for (let i = 0; i < remainingSets; i++) {
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 5 + i, id));
        id += 3;
      }
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });
    
    // 不能胡牌测试：故意破坏小三元的特性（如只有1种箭牌刻子和2种箭牌对子）
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      // 明牌组合
      const revealedSets: TileSet[] = [];
      let id = 1;
      
      // 添加明牌
      let dragonPungCount = 0;
      
      // 添加刻子和杠到明牌中 - 故意只添加1种箭牌刻子
      const maxRevealedDragons = Math.min(1, pengCount + kongCount);
      for (let i = 0; i < maxRevealedDragons; i++) {
        if (dragonPungCount < 1) {
          if (i < kongCount) {
            revealedSets.push(createKong(TileType.JIAN, i + 1, id));
          } else {
            revealedSets.push(createPung(TileType.JIAN, i + 1, id));
          }
          dragonPungCount++;
          id += i < kongCount ? 4 : 3;
        }
      }
      
      // 添加剩余的非箭牌明牌
      const remainingRevealedSets = (pengCount + kongCount) - maxRevealedDragons;
      for (let i = 0; i < remainingRevealedSets; i++) {
        if (i < (kongCount - maxRevealedDragons)) {
          revealedSets.push(createKong(TileType.TONG, i + 1, id));
          id += 4;
        } else {
          revealedSets.push(createPung(TileType.TIAO, i + 1, id));
          id += 3;
        }
      }
      
      // 添加吃的明牌
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, 1 + i, id));
        id += 3;
      }
      
      // 生成手牌
      let handTiles: Tile[] = [];
      
      // 只在手牌中添加一种箭牌刻子
      if (dragonPungCount < 1) {
        handTiles = handTiles.concat(createHandTilesForPung(TileType.JIAN, 1, id));
        id += 3;
        dragonPungCount++;
      }
      
      // 添加两对箭牌对子，而不是一对 - 这会破坏小三元
      handTiles = handTiles.concat(createPair(TileType.JIAN, 2, id));
      id += 2;
      handTiles = handTiles.concat(createPair(TileType.JIAN, 3, id));
      id += 2;
      
      // 计算还需要多少组
      const remainingSets = 4 - (chiCount + pengCount + kongCount + (dragonPungCount < 1 ? 1 : 0));
      
      // 添加其他组合到手牌
      for (let i = 0; i < remainingSets; i++) {
        handTiles = handTiles.concat(createHandTilesForChow(TileType.WAN, 5 + i, id));
        id += 3;
      }
      
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 