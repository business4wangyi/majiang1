import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet } from '../../../src/majiang/core/rule-types';
import { AllLowNumbersDetector } from '../../../src/majiang/core/win-conditions/win-conditions_all-low-numbers';
import { expect } from 'chai';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
}

// 创建对子
function createPair(type: TileType, value: number, startId = 1): Tile[] {
  return [
    new Tile(type, value, startId),
    new Tile(type, value, startId + 1)
  ];
}

// 创建刻子
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

// 创建顺子
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

// 创建杠
function createKong(type: TileType, value: number, startId = 1, source: 'ming' | 'an' | 'bu' = 'ming'): TileSet {
  return {
    type: 'GANG',
    source,
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2),
      new Tile(type, value, startId + 3)
    ]
  };
}

describe('AllLowNumbersDetector', () => {
  let detector: AllLowNumbersDetector;

  beforeEach(() => {
    detector = new AllLowNumbersDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全小');
    expect(detector.getDescription()).to.equal('和牌时，所有数牌都是123');
    expect(detector.getScore()).to.equal(24);
  });

  // =================== 符合条件的组合测试 ===================
  // 组合1：4副吃 + 1对子（全小）
  it('should detect with 4 chows and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 1], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合2：3副吃 + 1副碰 + 1对子（全小）
  it('should detect with 3 chows, 1 pung and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 1, 1, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合3：3副吃 + 1副杠 + 1对子（全小）
  it('should detect with 3 chows, 1 kong and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 2, 2], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 1, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合4：2副吃 + 2副碰 + 1对子（全小）
  it('should detect with 2 chows, 2 pungs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 1, 1, 2, 2, 2, 3, 3], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合5：2副吃 + 1副碰 + 1副杠 + 1对子（全小）
  it('should detect with 2 chows, 1 pung, 1 kong and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 1, 1, 3, 3], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 2, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合6：2副吃 + 2副杠 + 1对子（全小）
  it('should detect with 2 chows, 2 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 3, 3], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 7),
      createKong(TileType.WAN, 2, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合7：1副吃 + 3副碰 + 1对子（全小）
  it('should detect with 1 chow, 3 pungs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3, 1, 1], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合8：1副吃 + 2副碰 + 1副杠 + 1对子（全小）
  it('should detect with 1 chow, 2 pungs, 1 kong and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 1, 1, 2, 2, 2, 1, 1], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 3, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合9：1副吃 + 1副碰 + 2副杠 + 1对子（全小）
  it('should detect with 1 chow, 1 pung, 2 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 1, 1, 3, 3], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 2, 7),
      createKong(TileType.WAN, 3, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合10：1副吃 + 3副杠 + 1对子（全小）
  it('should detect with 1 chow, 3 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 2, 2], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 4),
      createKong(TileType.WAN, 2, 8),
      createKong(TileType.WAN, 3, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合11：4副碰 + 1对子（全小）
  it('should detect with 4 pungs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 1, 1, 1, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 组合12：3副碰 + 1副杠 + 1对子（全小）
  it('should detect with 3 pungs, 1 kong and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 2, 2], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 1, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合13：2副碰 + 2副杠 + 1对子（全小）
  it('should detect with 2 pungs, 2 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 10),
      createKong(TileType.WAN, 3, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合14：1副碰 + 3副杠 + 1对子（全小）
  it('should detect with 1 pung, 3 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 4),
      createKong(TileType.WAN, 2, 8),
      createKong(TileType.WAN, 3, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 组合15：4副杠 + 1对子（全小）
  it('should detect with 4 kongs and 1 pair of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 3),
      createKong(TileType.WAN, 2, 7),
      createKong(TileType.WAN, 2, 11),
      createKong(TileType.WAN, 3, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 混合花色测试（全小）
  it('should detect with mixed suits of low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.TONG, [1, 1, 1, 2, 2, 2, 3, 3], 7)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // =================== 不符合条件的组合测试 ===================
  // 组合1：4副吃 + 1对子（非全小）
  it('should not detect with 4 chows and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 7], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合2：3副吃 + 1副碰 + 1对子（非全小）
  it('should not detect with 3 chows, 1 pung and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 4, 4, 4, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合3：3副吃 + 1副杠 + 1对子（非全小）
  it('should not detect with 3 chows, 1 kong and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 4, 4], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 5, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合4：2副吃 + 2副碰 + 1对子（非全小）
  it('should not detect with 2 chows, 2 pungs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合5：2副吃 + 1副碰 + 1副杠 + 1对子（非全小）
  it('should not detect with 2 chows, 1 pung, 1 kong and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 4, 4, 4, 5, 5], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 6, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合6：2副吃 + 2副杠 + 1对子（非全小）
  it('should not detect with 2 chows, 2 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 4, 4], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 6, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合7：1副吃 + 3副碰 + 1对子（非全小）
  it('should not detect with 1 chow, 3 pungs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合8：1副吃 + 2副碰 + 1副杠 + 1对子（非全小）
  it('should not detect with 1 chow, 2 pungs, 1 kong and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 7, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合9：1副吃 + 1副碰 + 2副杠 + 1对子（非全小）
  it('should not detect with 1 chow, 1 pung, 2 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 4, 4, 4, 5, 5], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 6, 7),
      createKong(TileType.WAN, 7, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合10：1副吃 + 3副杠 + 1对子（非全小）
  it('should not detect with 1 chow, 3 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [4, 5, 6, 7, 7], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 4),
      createKong(TileType.WAN, 2, 8),
      createKong(TileType.WAN, 8, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合11：4副碰 + 1对子（非全小）
  it('should not detect with 4 pungs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 组合12：3副碰 + 1副杠 + 1对子（非全小）
  it('should not detect with 3 pungs, 1 kong and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 5, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合13：2副碰 + 2副杠 + 1对子（非全小）
  it('should not detect with 2 pungs, 2 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 4, 4], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 5, 10),
      createKong(TileType.WAN, 6, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合14：1副碰 + 3副杠 + 1对子（非全小）
  it('should not detect with 1 pung, 3 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 4, 4], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 2, 4),
      createKong(TileType.WAN, 5, 8),
      createKong(TileType.WAN, 6, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 组合15：4副杠 + 1对子（非全小）
  it('should not detect with 4 kongs and 1 pair of non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [4, 4], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 1, 3),
      createKong(TileType.WAN, 2, 7),
      createKong(TileType.WAN, 3, 11),
      createKong(TileType.WAN, 5, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 混合花色包含非小牌
  it('should not detect with mixed suits containing non-low numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.TONG, [7, 7, 7, 8, 8, 8, 9, 9], 7)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 额外的一些测试
  // 用例：混合花色（部分低张，部分高张）
  it('should not detect with mixed suits and mixed values', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.TONG, [3, 3, 3], 7),
      ...createTiles(TileType.TIAO, [4, 5, 6, 7, 7], 10)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 用例：只有123但不是有效的胡牌结构
  it('should detect all low numbers even with invalid winning pattern', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 1, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 空手牌测试
  it('should not detect without any tiles', () => {
    expect(detector.detect([], [])).to.be.false;
  });

  // 只有对子
  it('should not detect with only pairs', () => {
    const handTiles = [
      ...createPair(TileType.WAN, 1, 1),
      ...createPair(TileType.WAN, 2, 3),
      ...createPair(TileType.WAN, 3, 5),
      ...createPair(TileType.TONG, 1, 7),
      ...createPair(TileType.TONG, 2, 9),
      ...createPair(TileType.TONG, 3, 11),
      ...createPair(TileType.TIAO, 1, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 混合字牌和低数牌测试
  it('should not detect with mix of honor tiles and low number tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1),
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 9)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
}); 