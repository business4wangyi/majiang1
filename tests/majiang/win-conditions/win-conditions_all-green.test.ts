import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { AllGreenDetector } from '../../src/majiang/win-conditions/win-conditions_all-green';
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

// 创建绿色顺子 - 只创建2,3,4的顺子，因为这是唯一全绿的顺子
function createGreenChow(startId = 1): TileSet {
  return {
    type: 'CHI',
    tiles: [
      new Tile(TileType.TIAO, 2, startId),
      new Tile(TileType.TIAO, 3, startId + 1),
      new Tile(TileType.TIAO, 4, startId + 2)
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

// 创建发财
function createFa(startId = 1): Tile {
  return new Tile(TileType.JIAN, 2, startId); // 发财是JIAN类型，值为2
}

describe('AllGreenDetector', () => {
  let detector: AllGreenDetector;

  beforeEach(() => {
    detector = new AllGreenDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全绿');
    expect(detector.getDescription()).to.equal('和牌时，所有牌都是绿色的');
    expect(detector.getScore()).to.equal(88);
  });

  // 测试用例1：手牌中只有对子（绿色）
  it('should detect with only pairs of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2);
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例2：手牌中只有对子（非绿色）
  it('should not detect with only pairs of non-green tiles', () => {
    const handTiles = createPair(TileType.WAN, 1);
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例3：手牌中有一个刻子（绿色）和一个对子（绿色）
  it('should detect with one pung of green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 2, 2, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例4：手牌中有一个刻子（非绿色）和一个对子（绿色）
  it('should not detect with one pung of non-green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例5：手牌中有一个顺子（绿色）和一个对子（绿色）
  it('should detect with one chow of green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 3, 4, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例6：手牌中有一个顺子（非绿色）和一个对子（绿色）
  it('should not detect with one chow of non-green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例7：明牌中有一个刻子（绿色）和手牌中有一个对子（绿色）
  it('should detect with one pung of green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createPung(TileType.TIAO, 2, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例8：明牌中有一个刻子（非绿色）和手牌中有一个对子（绿色）
  it('should not detect with one pung of non-green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createPung(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例9：明牌中有一个顺子（绿色）和手牌中有一个对子（绿色）
  it('should detect with one chow of green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createGreenChow(3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例10：明牌中有一个顺子（非绿色）和手牌中有一个对子（绿色）
  it('should not detect with one chow of non-green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createChow(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例11：手牌中有一个杠（绿色）和一个对子（绿色）
  it('should detect with one kong of green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 2, 2, 2, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例12：手牌中有一个杠（非绿色）和一个对子（绿色）
  it('should not detect with one kong of non-green tiles and one pair of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例13：明牌中有一个杠（绿色）和手牌中有一个对子（绿色）
  it('should detect with one kong of green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createKong(TileType.TIAO, 2, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例14：明牌中有一个杠（非绿色）和手牌中有一个对子（绿色）
  it('should not detect with one kong of non-green tiles in revealed sets and one pair of green tiles in hand', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [createKong(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例15：混合组合（绿色）
  it('should detect with mixed combinations of green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 3, 4, 2, 2], 1)
    ];
    const revealedSets = [
      createPung(TileType.TIAO, 2, 6),
      createGreenChow(9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例16：混合组合（非绿色）
  it('should not detect with mixed combinations of non-green tiles', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 2, 2], 1)
    ];
    const revealedSets = [
      createPung(TileType.WAN, 1, 6),
      createChow(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
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
  
  // 以下添加更多的测试场景，覆盖各种组合情况
  
  // 2副吃（绿色）+ 对子（绿色）
  it('should detect with two chows of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 2副吃（非绿色）+ 对子（绿色）
  it('should not detect with two chows of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createChow(TileType.WAN, 4, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 3副吃（绿色）+ 对子（绿色）
  it('should detect with three chows of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createGreenChow(9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 3副吃（非绿色）+ 对子（绿色）
  it('should not detect with three chows of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 7, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 4副吃（绿色）+ 对子（绿色）
  it('should detect with four chows of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createGreenChow(9),
      createGreenChow(12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 4副吃（非绿色）+ 对子（绿色）
  it('should not detect with four chows of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 7, 9),
      createChow(TileType.TONG, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 2副碰（绿色）+ 对子（绿色）
  it('should detect with two pungs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.TIAO, 2, 3),
      createPung(TileType.TIAO, 4, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 2副碰（非绿色）+ 对子（绿色）
  it('should not detect with two pungs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.WAN, 1, 3),
      createPung(TileType.WAN, 5, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 3副碰（绿色）+ 对子（绿色）
  it('should detect with three pungs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.TIAO, 2, 3),
      createPung(TileType.TIAO, 4, 6),
      createPung(TileType.TIAO, 6, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 3副碰（非绿色）+ 对子（绿色）
  it('should not detect with three pungs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.WAN, 1, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 9, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 4副碰（绿色）+ 对子（绿色）
  it('should detect with four pungs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.TIAO, 2, 3),
      createPung(TileType.TIAO, 4, 6),
      createPung(TileType.TIAO, 6, 9),
      createPung(TileType.TIAO, 8, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 4副碰（非绿色）+ 对子（绿色）
  it('should not detect with four pungs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.WAN, 1, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 9, 9),
      createPung(TileType.TONG, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 2副杠（绿色）+ 对子（绿色）
  it('should detect with two kongs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.TIAO, 2, 3),
      createKong(TileType.TIAO, 4, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 2副杠（非绿色）+ 对子（绿色）
  it('should not detect with two kongs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.WAN, 1, 3),
      createKong(TileType.WAN, 5, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 3副杠（绿色）+ 对子（绿色）
  it('should detect with three kongs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.TIAO, 2, 3),
      createKong(TileType.TIAO, 4, 7),
      createKong(TileType.TIAO, 6, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 3副杠（非绿色）+ 对子（绿色）
  it('should not detect with three kongs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.WAN, 1, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 9, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 4副杠（绿色）+ 对子（绿色）
  it('should detect with four kongs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.TIAO, 2, 3),
      createKong(TileType.TIAO, 4, 7),
      createKong(TileType.TIAO, 6, 11),
      createKong(TileType.TIAO, 8, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 4副杠（非绿色）+ 对子（绿色）
  it('should not detect with four kongs of non-green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createKong(TileType.WAN, 1, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 9, 11),
      createKong(TileType.TONG, 5, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 1副吃（绿色）+ 1副碰（绿色）+ 对子（绿色）
  it('should detect with one chow, one pung of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createPung(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 1副吃（非绿色）+ 1副碰（绿色）+ 对子（绿色）
  it('should not detect with one non-green chow, one green pung and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createPung(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 1副吃（绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should detect with one chow, one kong of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createKong(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 1副吃（非绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should not detect with one non-green chow, one green kong and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createKong(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 1副碰（绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should detect with one pung, one kong of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.TIAO, 4, 3),
      createKong(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 1副碰（非绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should not detect with one non-green pung, one green kong and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createPung(TileType.WAN, 1, 3),
      createKong(TileType.TIAO, 6, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 2副吃（绿色）+ 1副碰（绿色）+ 对子（绿色）
  it('should detect with two chows, one pung of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createPung(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 2副吃（绿色）+ 1副碰（非绿色）+ 对子（绿色）
  it('should not detect with two green chows, one non-green pung and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createPung(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 2副吃（绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should detect with two chows, one kong of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createKong(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 2副吃（绿色）+ 1副杠（非绿色）+ 对子（绿色）
  it('should not detect with two green chows, one non-green kong and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createGreenChow(6),
      createKong(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 1副吃（绿色）+ 2副碰（绿色）+ 对子（绿色）
  it('should detect with one chow, two pungs of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createPung(TileType.TIAO, 6, 6),
      createPung(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 1副吃（非绿色）+ 2副碰（绿色）+ 对子（绿色）
  it('should not detect with one non-green chow, two green pungs and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createPung(TileType.TIAO, 6, 6),
      createPung(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 1副吃（绿色）+ 1副碰（绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should detect with one chow, one pung, one kong of green tiles and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createPung(TileType.TIAO, 6, 6),
      createKong(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 1副吃（非绿色）+ 1副碰（绿色）+ 1副杠（绿色）+ 对子（绿色）
  it('should not detect with one non-green chow, one green pung, one green kong and one pair of green tiles', () => {
    const handTiles = createPair(TileType.TIAO, 2, 1);
    const revealedSets = [
      createChow(TileType.WAN, 1, 3),
      createPung(TileType.TIAO, 6, 6),
      createKong(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 使用发财牌的测试
  
  // 发财牌作为对子
  it('should detect with fa tiles as pair', () => {
    const handTiles = [
      new Tile(TileType.JIAN, 2, 1),
      new Tile(TileType.JIAN, 2, 2)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 发财牌作为刻子
  it('should detect with fa tiles as pung', () => {
    const handTiles = [
      new Tile(TileType.JIAN, 2, 1),
      new Tile(TileType.JIAN, 2, 2),
      new Tile(TileType.JIAN, 2, 3)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 发财牌作为杠
  it('should detect with fa tiles as kong', () => {
    const handTiles = [
      new Tile(TileType.JIAN, 2, 1),
      new Tile(TileType.JIAN, 2, 2),
      new Tile(TileType.JIAN, 2, 3),
      new Tile(TileType.JIAN, 2, 4)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 混合发财牌和条子
  it('should detect with mixture of fa tiles and bamboo tiles', () => {
    const handTiles = createPair(TileType.JIAN, 2, 1);
    const revealedSets = [
      createGreenChow(3),
      createPung(TileType.TIAO, 6, 6),
      createKong(TileType.TIAO, 8, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 边界情况：七对子全绿
  it('should detect seven pairs of green tiles', () => {
    const handTiles = [
      ...createPair(TileType.TIAO, 2, 1),
      ...createPair(TileType.TIAO, 3, 3),
      ...createPair(TileType.TIAO, 4, 5),
      ...createPair(TileType.TIAO, 6, 7),
      ...createPair(TileType.TIAO, 8, 9),
      ...createPair(TileType.JIAN, 2, 11),
      ...createPair(TileType.JIAN, 2, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 边界情况：七对子非全绿
  it('should not detect seven pairs with at least one non-green tile', () => {
    const handTiles = [
      ...createPair(TileType.TIAO, 2, 1),
      ...createPair(TileType.TIAO, 3, 3),
      ...createPair(TileType.TIAO, 4, 5),
      ...createPair(TileType.TIAO, 6, 7),
      ...createPair(TileType.TIAO, 8, 9),
      ...createPair(TileType.JIAN, 2, 11),
      ...createPair(TileType.WAN, 1, 13) // 非绿色牌
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
  
  // 十三幺全绿（理论上不可能，但测试边界情况）
  it('should detect thirteen orphans of green tiles (theoretical test)', () => {
    const handTiles = [
      new Tile(TileType.TIAO, 2, 1),
      new Tile(TileType.TIAO, 3, 2),
      new Tile(TileType.TIAO, 4, 3),
      new Tile(TileType.TIAO, 6, 4),
      new Tile(TileType.TIAO, 8, 5),
      new Tile(TileType.TIAO, 2, 6),
      new Tile(TileType.TIAO, 3, 7),
      new Tile(TileType.TIAO, 4, 8),
      new Tile(TileType.TIAO, 6, 9),
      new Tile(TileType.TIAO, 8, 10),
      new Tile(TileType.JIAN, 2, 11),
      new Tile(TileType.JIAN, 2, 12),
      new Tile(TileType.JIAN, 2, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 十三幺非全绿
  it('should not detect thirteen orphans with non-green tiles', () => {
    const handTiles = [
      new Tile(TileType.WAN, 1, 1),
      new Tile(TileType.WAN, 9, 2),
      new Tile(TileType.TIAO, 1, 3),
      new Tile(TileType.TIAO, 9, 4),
      new Tile(TileType.TONG, 1, 5),
      new Tile(TileType.TONG, 9, 6),
      new Tile(TileType.FENG, 1, 7),
      new Tile(TileType.FENG, 2, 8),
      new Tile(TileType.FENG, 3, 9),
      new Tile(TileType.FENG, 4, 10),
      new Tile(TileType.JIAN, 1, 11),
      new Tile(TileType.JIAN, 2, 12),
      new Tile(TileType.JIAN, 3, 13)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });
  
  // 非标准手牌组合但全是绿色牌
  it('should detect with non-standard hand combinations of all green tiles', () => {
    const handTiles = [
      new Tile(TileType.TIAO, 2, 1),
      new Tile(TileType.TIAO, 3, 2),
      new Tile(TileType.TIAO, 4, 3),
      new Tile(TileType.TIAO, 6, 4),
      new Tile(TileType.TIAO, 8, 5),
      new Tile(TileType.JIAN, 2, 6)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 全绿门清
  it('should detect with concealed green hand', () => {
    const handTiles = [
      ...createPair(TileType.TIAO, 2, 1),
      ...createTiles(TileType.TIAO, [2, 2, 2], 3),
      ...createTiles(TileType.TIAO, [2, 3, 4], 6),
      ...createTiles(TileType.TIAO, [6, 6, 6], 9),
      ...createTiles(TileType.TIAO, [6, 8, 8], 12)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });
  
  // 混合组合3：1吃1碰1杠+对子全绿
  it('should detect with one chow, one pung, one kong of green tiles and one pair of green tiles (hand + revealed)', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 3, 4, 8, 8], 1)
    ];
    const revealedSets = [
      createPung(TileType.TIAO, 2, 6),
      createKong(TileType.TIAO, 6, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 混合组合4：1吃1碰1杠+对子非全绿
  it('should not detect with one chow, one pung, one kong with at least one non-green tile', () => {
    const handTiles = [
      ...createTiles(TileType.TIAO, [2, 3, 4, 8, 8], 1)
    ];
    const revealedSets = [
      createPung(TileType.TIAO, 2, 6),
      createKong(TileType.WAN, 5, 9) // 非绿色杠
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
  
  // 发财牌和条子组合
  it('should detect with combination of fa and bamboo', () => {
    const handTiles = [...createPair(TileType.JIAN, 2, 1)];  // 发财对子
    const revealedSets = [
      createPung(TileType.TIAO, 2, 3),  // 二条刻子
      createGreenChow(6),  // 234条顺子
      createPung(TileType.TIAO, 8, 9)   // 八条刻子
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
  
  // 混合发财杠和条子
  it('should detect with kong of fa and bamboo tiles', () => {
    const handTiles = [...createPair(TileType.TIAO, 2, 1)];
    const revealedSets = [
      createGreenChow(3), 
      createPung(TileType.TIAO, 8, 6),
      createKong(TileType.JIAN, 2, 9)  // 发财杠
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });
}); 