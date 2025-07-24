import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { AllHighNumbersDetector } from '../../src/majiang/win-conditions/win-conditions_all-high-numbers';
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

describe('AllHighNumbersDetector', () => {
  let detector: AllHighNumbersDetector;

  beforeEach(() => {
    detector = new AllHighNumbersDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全大');
    expect(detector.getDescription()).to.equal('和牌时，所有数牌都是789');
    expect(detector.getScore()).to.equal(24);
  });

  // 测试用例1：4副顺子 + 1对子（全大）
  it('should detect with 4 chows and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 7], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例2：4副顺子 + 1对子（非全大）
  it('should not detect with 4 chows and 1 pair of non-high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 1], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例3：3副顺子 + 1副刻子 + 1对子（全大）
  it('should detect with 3 chows, 1 pung and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 7, 7, 8, 8], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例4：2副顺子 + 2副刻子 + 1对子（全大）
  it('should detect with 2 chows, 2 pungs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 7, 7, 8, 8, 8, 9, 9], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例5：1副顺子 + 3副刻子 + 1对子（全大）
  it('should detect with 1 chow, 3 pungs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 7, 7, 8, 8, 8, 9, 9, 9, 7, 7], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例6：4副刻子 + 1对子（全大）
  it('should detect with 4 pungs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7, 8, 8, 8, 9, 9, 9, 7, 7, 7, 8, 8], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例7：3副顺子 + 1副杠子 + 1对子（全大）
  it('should detect with 3 chows, 1 kong and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 8, 9, 7, 7, 7, 7, 8, 8], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 7, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例8：2副顺子 + 1副刻子 + 1副杠子 + 1对子（全大）
  it('should detect with 2 chows, 1 pung, 1 kong and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 7, 7, 8, 8, 8, 8, 9, 9], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 8, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例9：1副顺子 + 2副刻子 + 1副杠子 + 1对子（全大）
  it('should detect with 1 chow, 2 pungs, 1 kong and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 7, 7], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例10：3副刻子 + 1副杠子 + 1对子（全大）
  it('should detect with 3 pungs, 1 kong and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7, 8, 8, 8, 9, 9, 9, 7, 7, 7, 7, 8, 8], 1)
    ];
    const revealedSets = [createKong(TileType.WAN, 7, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例11：2副顺子 + 2副杠子 + 1对子（全大）
  it('should detect with 2 chows, 2 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 8, 9, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 7),
      createKong(TileType.WAN, 8, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例12：1副顺子 + 1副刻子 + 2副杠子 + 1对子（全大）
  it('should detect with 1 chow, 1 pung, 2 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 7, 7], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 8, 7),
      createKong(TileType.WAN, 9, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例13：2副刻子 + 2副杠子 + 1对子（全大）
  it('should detect with 2 pungs, 2 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 7, 7, 7, 7, 8, 8], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 10),
      createKong(TileType.WAN, 9, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例14：1副顺子 + 3副杠子 + 1对子（全大）
  it('should detect with 1 chow, 3 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 7, 7], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 4),
      createKong(TileType.WAN, 8, 8),
      createKong(TileType.WAN, 9, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例15：1副刻子 + 3副杠子 + 1对子（全大）
  it('should detect with 1 pung, 3 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 7, 7, 7, 7, 8, 8], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 12),
      createKong(TileType.WAN, 8, 4),
      createKong(TileType.WAN, 9, 8)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例16：4副杠子 + 1对子（全大）
  it('should detect with 4 kongs and 1 pair of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 7, 7, 7, 7, 8, 8], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 1),
      createKong(TileType.WAN, 7, 5),
      createKong(TileType.WAN, 8, 9),
      createKong(TileType.WAN, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例17：边界情况 - 空手牌
  it('should not detect without any tiles', () => {
    expect(detector.detect([], [])).to.be.false;
  });

  // 测试用例18：边界情况 - 字牌
  it('should not detect with honor tiles', () => {
    const handTiles = [
      new Tile(TileType.FENG, 1, 1),
      new Tile(TileType.FENG, 1, 2)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例19：混合花色（全大）
  it('should detect with mixed suits of high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [7, 8, 9], 10),
      ...createTiles(TileType.WAN, [7, 7], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例20：混合花色（非全大）
  it('should not detect with mixed suits containing non-high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [1, 2, 3], 10),
      ...createTiles(TileType.WAN, [7, 7], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例21：顺子(吃)牌型变体1 (全大)
  it('should detect with 4 chows and 1 pair (variant 1) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [7, 8, 9], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例22：顺子(吃)牌型变体2 (非全大)
  it('should not detect with 4 chows and 1 pair (variant 2) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [4, 5, 6], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [7, 8, 9], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例23：3副顺子(吃) + 1副刻子(碰)变体 (全大)
  it('should detect with 3 chows and 1 pung (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [9, 9, 9], 10),
      ...createTiles(TileType.TIAO, [8, 8], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例24：3副顺子(吃) + 1副刻子(碰)变体 (非全大)
  it('should not detect with 3 chows and 1 pung (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.WAN, [5, 5, 5], 10),
      ...createTiles(TileType.TIAO, [8, 8], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例25：2副顺子(吃) + 2副刻子(碰)变体 (全大)
  it('should detect with 2 chows and 2 pungs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 7, 7], 7),
      ...createTiles(TileType.WAN, [8, 8, 8], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例26：2副顺子(吃) + 2副刻子(碰)变体 (非全大)
  it('should not detect with 2 chows and 2 pungs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [2, 2, 2], 7),
      ...createTiles(TileType.WAN, [8, 8, 8], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例27：1副顺子(吃) + 3副刻子(碰)变体 (全大)
  it('should detect with 1 chow and 3 pungs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 7, 7], 4),
      ...createTiles(TileType.TONG, [8, 8, 8], 7),
      ...createTiles(TileType.WAN, [9, 9, 9], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例28：1副顺子(吃) + 3副刻子(碰)变体 (非全大)
  it('should not detect with 1 chow and 3 pungs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [4, 4, 4], 4),
      ...createTiles(TileType.TONG, [8, 8, 8], 7),
      ...createTiles(TileType.WAN, [9, 9, 9], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例29：4副刻子(碰)变体 (全大)
  it('should detect with 4 pungs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.WAN, [8, 8, 8], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例30：4副刻子(碰)变体 (非全大)
  it('should not detect with 4 pungs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.WAN, [3, 3, 3], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例31：3副顺子(吃) + 1副杠子变体 (全大)
  it('should detect with 3 chows and 1 kong (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.TIAO, [8, 8], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例32：3副顺子(吃) + 1副杠子变体 (非全大)
  it('should not detect with 3 chows and 1 kong (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [4, 5, 6], 7),
      ...createTiles(TileType.TIAO, [8, 8], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例33：2副顺子(吃) + 1副刻子(碰) + 1副杠子变体 (全大)
  it('should detect with 2 chows, 1 pung and 1 kong (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 7, 7], 7),
      ...createTiles(TileType.TIAO, [8, 8], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例34：2副顺子(吃) + 1副刻子(碰) + 1副杠子变体 (非全大)
  it('should not detect with 2 chows, 1 pung and 1 kong (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [3, 3, 3], 7),
      ...createTiles(TileType.TIAO, [8, 8], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例35：1副顺子(吃) + 2副刻子(碰) + 1副杠子变体 (全大)
  it('should detect with 1 chow, 2 pungs and 1 kong (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 7, 7], 4),
      ...createTiles(TileType.TONG, [8, 8, 8], 7),
      ...createTiles(TileType.TIAO, [9, 9], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例36：1副顺子(吃) + 2副刻子(碰) + 1副杠子变体 (非全大)
  it('should not detect with 1 chow, 2 pungs and 1 kong (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 7, 7], 4),
      ...createTiles(TileType.TONG, [1, 1, 1], 7),
      ...createTiles(TileType.TIAO, [9, 9], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 9, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例37：3副刻子(碰) + 1副杠子变体 (全大)
  it('should detect with 3 pungs and 1 kong (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.TIAO, [7, 7], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 8, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例38：3副刻子(碰) + 1副杠子变体 (非全大)
  it('should not detect with 3 pungs and 1 kong (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TONG, [6, 6, 6], 7),
      ...createTiles(TileType.TIAO, [7, 7], 10)
    ];
    const revealedSets = [createKong(TileType.WAN, 8, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例39：2副顺子(吃) + 2副杠子变体 (全大)
  it('should detect with 2 chows and 2 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TIAO, [9, 9], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 8, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例40：2副顺子(吃) + 2副杠子变体 (非全大)
  it('should not detect with 2 chows and 2 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [1, 2, 3], 4),
      ...createTiles(TileType.TIAO, [9, 9], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 8, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例41：1副顺子(吃) + 1副刻子(碰) + 2副杠子变体 (全大)
  it('should detect with 1 chow, 1 pung and 2 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TIAO, [9, 9], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例42：1副顺子(吃) + 1副刻子(碰) + 2副杠子变体 (非全大)
  it('should not detect with 1 chow, 1 pung and 2 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [5, 5, 5], 4),
      ...createTiles(TileType.TIAO, [9, 9], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例43：2副刻子(碰) + 2副杠子变体 (全大)
  it('should detect with 2 pungs and 2 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [8, 8, 8], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TIAO, [7, 7], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例44：2副刻子(碰) + 2副杠子变体 (非全大)
  it('should not detect with 2 pungs and 2 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [8, 8, 8], 1),
      ...createTiles(TileType.TIAO, [2, 2, 2], 4),
      ...createTiles(TileType.TIAO, [7, 7], 7)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 9),
      createKong(TileType.TONG, 9, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例45：1副顺子(吃) + 3副杠子变体 (全大)
  it('should detect with 1 chow and 3 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 7], 4)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 6),
      createKong(TileType.TIAO, 8, 10),
      createKong(TileType.TONG, 9, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例46：1副顺子(吃) + 3副杠子变体 (非全大)
  it('should not detect with 1 chow and 3 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [4, 5, 6], 1),
      ...createTiles(TileType.TIAO, [7, 7], 4)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 6),
      createKong(TileType.TIAO, 8, 10),
      createKong(TileType.TONG, 9, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例47：1副刻子(碰) + 3副杠子变体 (全大)
  it('should detect with 1 pung and 3 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [8, 8], 4)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 8, 6),
      createKong(TileType.TIAO, 9, 10),
      createKong(TileType.TONG, 7, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例48：1副刻子(碰) + 3副杠子变体 (非全大)
  it('should not detect with 1 pung and 3 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [3, 3, 3], 1),
      ...createTiles(TileType.TIAO, [8, 8], 4)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 8, 6),
      createKong(TileType.TIAO, 9, 10),
      createKong(TileType.TONG, 7, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例49：4副杠子变体 (全大)
  it('should detect with 4 kongs (variant) - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [9, 9], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 3),
      createKong(TileType.TIAO, 8, 7),
      createKong(TileType.TONG, 9, 11),
      createKong(TileType.WAN, 9, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例50：4副杠子变体 (非全大)
  it('should not detect with 4 kongs (variant) - not all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [9, 9], 1)
    ];
    const revealedSets = [
      createKong(TileType.WAN, 7, 3),
      createKong(TileType.TIAO, 8, 7),
      createKong(TileType.TONG, 9, 11),
      createKong(TileType.WAN, 5, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例51：边界情况 - 只有7的牌 (全大)
  it('should detect with all tiles being 7 - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 7, 7], 1),
      ...createTiles(TileType.TIAO, [7, 7, 7], 4),
      ...createTiles(TileType.TONG, [7, 7, 7], 7),
      ...createTiles(TileType.WAN, [7, 7, 7], 10),
      ...createTiles(TileType.TIAO, [7, 7], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例52：边界情况 - 只有8的牌 (全大)
  it('should detect with all tiles being 8 - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [8, 8, 8], 1),
      ...createTiles(TileType.TIAO, [8, 8, 8], 4),
      ...createTiles(TileType.TONG, [8, 8, 8], 7),
      ...createTiles(TileType.WAN, [8, 8, 8], 10),
      ...createTiles(TileType.TIAO, [8, 8], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例53：边界情况 - 只有9的牌 (全大)
  it('should detect with all tiles being 9 - all high numbers', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [9, 9, 9], 1),
      ...createTiles(TileType.TIAO, [9, 9, 9], 4),
      ...createTiles(TileType.TONG, [9, 9, 9], 7),
      ...createTiles(TileType.WAN, [9, 9, 9], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例54：边界情况 - 部分牌是字牌 (非全大)
  it('should not detect when some tiles are honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [7, 8, 9], 1),
      ...createTiles(TileType.TIAO, [7, 8, 9], 4),
      ...createTiles(TileType.TONG, [7, 8, 9], 7),
      ...createTiles(TileType.FENG, [1, 1, 1], 10),
      ...createTiles(TileType.TIAO, [9, 9], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例55：边界情况 - 全是字牌 (非全大)
  it('should not detect when all tiles are honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1], 1),
      ...createTiles(TileType.FENG, [2, 2, 2], 4),
      ...createTiles(TileType.FENG, [3, 3, 3], 7),
      ...createTiles(TileType.FENG, [4, 4, 4], 10),
      ...createTiles(TileType.JIAN, [1, 1], 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
}); 