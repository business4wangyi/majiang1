import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { AllHonorsDetector } from '../../src/majiang/win-conditions/win-conditions_all-honors';
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

describe('AllHonorsDetector', () => {
  let detector: AllHonorsDetector;

  beforeEach(() => {
    detector = new AllHonorsDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('字一色');
    expect(detector.getDescription()).to.equal('和牌时，所有牌都是字牌');
    expect(detector.getScore()).to.equal(64);
  });

  // 测试用例1：4副刻子 + 1对子（全是字牌）
  it('should detect with 4 pungs and 1 pair of honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 1, 1], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例2：4副刻子 + 1对子（非字牌）
  it('should not detect with 4 pungs and 1 pair of non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 1, 1], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例3：3副刻子 + 1副杠子 + 1对子（全是字牌）
  it('should detect with 3 pungs, 1 kong and 1 pair of honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 1, 1], 1)
    ];
    const revealedSets = [createKong(TileType.FENG, 4, 10)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例4：2副刻子 + 2副杠子 + 1对子（全是字牌）
  it('should detect with 2 pungs, 2 kongs and 1 pair of honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 1, 1], 1)
    ];
    const revealedSets = [
      createKong(TileType.FENG, 3, 7),
      createKong(TileType.FENG, 4, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例5：1副刻子 + 3副杠子 + 1对子（全是字牌）
  it('should detect with 1 pung, 3 kongs and 1 pair of honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2], 1)
    ];
    const revealedSets = [
      createKong(TileType.FENG, 2, 4),
      createKong(TileType.FENG, 3, 8),
      createKong(TileType.FENG, 4, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例6：4副杠子 + 1对子（全是字牌）
  it('should detect with 4 kongs and 1 pair of honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1], 1)
    ];
    const revealedSets = [
      createKong(TileType.FENG, 1, 3),
      createKong(TileType.FENG, 2, 7),
      createKong(TileType.FENG, 3, 11),
      createKong(TileType.FENG, 4, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例7：混合字牌（风牌和箭牌）
  it('should detect with mixed honor tiles (winds and dragons)', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3], 7)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例8：混合字牌和非字牌
  it('should not detect with mixed honor and non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 7)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例9：空手牌
  it('should not detect without any tiles', () => {
    expect(detector.detect([], [])).to.be.false;
  });

  // 测试用例10：只有对子
  it('should not detect with only pairs', () => {
    const handTiles = [
      ...createPair(TileType.FENG, 1, 1),
      ...createPair(TileType.FENG, 2, 3),
      ...createPair(TileType.FENG, 3, 5),
      ...createPair(TileType.FENG, 4, 7),
      ...createPair(TileType.JIAN, 1, 9),
      ...createPair(TileType.JIAN, 2, 11),
      ...createPair(TileType.JIAN, 3, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例11：3副刻子 + 1副杠子 + 1对子（包含非字牌）
  it('should not detect with 3 pungs, 1 kong and 1 pair with some non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 1),
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2], 7) // 非字牌
    ];
    const revealedSets = [createKong(TileType.FENG, 4, 12)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例12：2副刻子 + 2副杠子 + 1对子（包含非字牌）
  it('should not detect with 2 pungs, 2 kongs and 1 pair with some non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1], 1),
      ...createTiles(TileType.WAN, [2, 2, 2, 3, 3], 4) // 非字牌
    ];
    const revealedSets = [
      createKong(TileType.FENG, 3, 9),
      createKong(TileType.FENG, 4, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例13：1副刻子 + 3副杠子 + 1对子（包含非字牌）
  it('should not detect with 1 pung, 3 kongs and 1 pair with some non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2], 1) // 非字牌
    ];
    const revealedSets = [
      createKong(TileType.FENG, 2, 6),
      createKong(TileType.FENG, 3, 10),
      createKong(TileType.FENG, 4, 14)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例14：4副杠子 + 1对子（包含非字牌）
  it('should not detect with 4 kongs and 1 pair with some non-honor tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1], 1) // 非字牌对子
    ];
    const revealedSets = [
      createKong(TileType.FENG, 1, 3),
      createKong(TileType.FENG, 2, 7),
      createKong(TileType.FENG, 3, 11),
      createKong(TileType.FENG, 4, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例15：不同类型的字牌组合（风牌和箭牌的混合杠和刻）
  it('should detect with mixed types of honor tiles pungs and kongs', () => {
    const handTiles = [
      ...createTiles(TileType.FENG, [1, 1, 1], 1),
      ...createTiles(TileType.JIAN, [2, 2, 2, 3, 3], 4)
    ];
    const revealedSets = [
      createKong(TileType.FENG, 2, 7),
      createKong(TileType.JIAN, 1, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
}); 