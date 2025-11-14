import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { AllFivesDetector } from '../../src/majiang/win-conditions/win-conditions_all-fives';
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

describe('AllFivesDetector', () => {
  let detector: AllFivesDetector;

  beforeEach(() => {
    detector = new AllFivesDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全带五');
    expect(detector.getDescription()).to.equal('和牌时，每组牌都包含数字5');
    expect(detector.getScore()).to.equal(16);
  });

  // 测试用例1：手牌中只有对子（包含5）
  it('should detect with only pairs containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5);
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例2：手牌中只有对子（不包含5）
  it('should not detect with only pairs not containing 5', () => {
    const handTiles = createPair(TileType.WAN, 1);
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例3：手牌中有一个刻子（包含5）和一个对子（包含5）
  it('should detect with one pung containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [5, 5, 5, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例4：手牌中有一个刻子（不包含5）和一个对子（包含5）
  it('should not detect with one pung not containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例5：手牌中有一个顺子（包含5）和一个对子（包含5）
  it('should detect with one chow containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [3, 4, 5, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例6：手牌中有一个顺子（不包含5）和一个对子（包含5）
  it('should not detect with one chow not containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例7：明牌中有一个刻子（包含5）和手牌中有一个对子（包含5）
  it('should detect with one pung containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createPung(TileType.WAN, 5, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例8：明牌中有一个刻子（不包含5）和手牌中有一个对子（包含5）
  it('should not detect with one pung not containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createPung(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例9：明牌中有一个顺子（包含5）和手牌中有一个对子（包含5）
  it('should detect with one chow containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createChow(TileType.WAN, 3, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例10：明牌中有一个顺子（不包含5）和手牌中有一个对子（包含5）
  it('should not detect with one chow not containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createChow(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例11：手牌中有一个杠（包含5）和一个对子（包含5）
  it('should detect with one kong containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [5, 5, 5, 5, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  // 测试用例12：手牌中有一个杠（不包含5）和一个对子（包含5）
  it('should not detect with one kong not containing 5 and one pair containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 1, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  // 测试用例13：明牌中有一个杠（包含5）和手牌中有一个对子（包含5）
  it('should detect with one kong containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createKong(TileType.WAN, 5, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例14：明牌中有一个杠（不包含5）和手牌中有一个对子（包含5）
  it('should not detect with one kong not containing 5 in revealed sets and one pair containing 5 in hand', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [createKong(TileType.WAN, 1, 3)];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例15：混合组合（包含5）
  it('should detect with mixed combinations all containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [3, 4, 5, 5, 5], 1)
    ];
    const revealedSets = [
      createPung(TileType.WAN, 5, 6),
      createChow(TileType.WAN, 3, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例16：混合组合（不包含5）
  it('should not detect with mixed combinations not containing 5', () => {
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 2, 3, 5, 5], 1)
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

  // 测试用例19：两个顺子（都包含5）
  it('should detect with two chows both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例20：两个顺子（一个包含5，一个不包含5）
  it('should not detect with two chows where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 1, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例21：两个刻子（都包含5）
  it('should detect with two pungs both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例22：两个刻子（一个包含5，一个不包含5）
  it('should not detect with two pungs where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 1, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例23：两个杠（都包含5）
  it('should detect with two kongs both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例24：两个杠（一个包含5，一个不包含5）
  it('should not detect with two kongs where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 1, 7)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例25：一个顺子一个刻子（都包含5）
  it('should detect with one chow and one pung both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createPung(TileType.WAN, 5, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例26：一个顺子一个刻子（一个包含5，一个不包含5）
  it('should not detect with one chow and one pung where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createPung(TileType.WAN, 1, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例27：一个顺子一个杠（都包含5）
  it('should detect with one chow and one kong both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createKong(TileType.WAN, 5, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例28：一个顺子一个杠（一个包含5，一个不包含5）
  it('should not detect with one chow and one kong where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createKong(TileType.WAN, 1, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例29：一个刻子一个杠（都包含5）
  it('should detect with one pung and one kong both containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例30：一个刻子一个杠（一个包含5，一个不包含5）
  it('should not detect with one pung and one kong where only one contains 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 1, 6)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例31：三个顺子（都包含5）
  it('should detect with three chows all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例32：三个顺子（两个包含5，一个不包含5）
  it('should not detect with three chows where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例33：三个刻子（都包含5）
  it('should detect with three pungs all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例34：三个刻子（两个包含5，一个不包含5）
  it('should not detect with three pungs where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例35：三个杠（都包含5）
  it('should detect with three kongs all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例36：三个杠（两个包含5，一个不包含5）
  it('should not detect with three kongs where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 1, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例37：四个顺子（都包含5）
  it('should detect with four chows all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createChow(TileType.WAN, 4, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例38：四个顺子（三个包含5，一个不包含5）
  it('should not detect with four chows where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createChow(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例39：四个刻子（都包含5）
  it('should detect with four pungs all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createPung(TileType.WAN, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例40：四个刻子（三个包含5，一个不包含5）
  it('should not detect with four pungs where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createPung(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例41：四个杠（都包含5）
  it('should detect with four kongs all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createKong(TileType.WAN, 5, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例42：四个杠（三个包含5，一个不包含5）
  it('should not detect with four kongs where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createKong(TileType.WAN, 1, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例43：混合组合（两个顺子一个刻子，都包含5）
  it('should detect with mixed combinations (two chows one pung) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createPung(TileType.WAN, 5, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例44：混合组合（两个顺子一个刻子，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two chows one pung) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createPung(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例45：混合组合（两个顺子一个杠，都包含5）
  it('should detect with mixed combinations (two chows one kong) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createKong(TileType.WAN, 5, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例46：混合组合（两个顺子一个杠，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two chows one kong) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createKong(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例47：混合组合（两个刻子一个顺子，都包含5）
  it('should detect with mixed combinations (two pungs one chow) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createChow(TileType.WAN, 3, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例48：混合组合（两个刻子一个顺子，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two pungs one chow) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createChow(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例49：混合组合（两个刻子一个杠，都包含5）
  it('should detect with mixed combinations (two pungs one kong) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createKong(TileType.WAN, 5, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例50：混合组合（两个刻子一个杠，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two pungs one kong) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createKong(TileType.WAN, 1, 9)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例51：混合组合（两个杠一个顺子，都包含5）
  it('should detect with mixed combinations (two kongs one chow) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createChow(TileType.WAN, 3, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例52：混合组合（两个杠一个顺子，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two kongs one chow) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createChow(TileType.WAN, 1, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例53：混合组合（两个杠一个刻子，都包含5）
  it('should detect with mixed combinations (two kongs one pung) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createPung(TileType.WAN, 5, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例54：混合组合（两个杠一个刻子，两个包含5，一个不包含5）
  it('should not detect with mixed combinations (two kongs one pung) where only two contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createPung(TileType.WAN, 1, 11)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例55：混合组合（三个顺子一个刻子，都包含5）
  it('should detect with mixed combinations (three chows one pung) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createPung(TileType.WAN, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例56：混合组合（三个顺子一个刻子，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three chows one pung) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createPung(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例57：混合组合（三个顺子一个杠，都包含5）
  it('should detect with mixed combinations (three chows one kong) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createKong(TileType.WAN, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例58：混合组合（三个顺子一个杠，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three chows one kong) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createChow(TileType.WAN, 3, 9),
      createKong(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例59：混合组合（三个刻子一个顺子，都包含5）
  it('should detect with mixed combinations (three pungs one chow) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createChow(TileType.WAN, 3, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例60：混合组合（三个刻子一个顺子，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three pungs one chow) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createChow(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例61：混合组合（三个刻子一个杠，都包含5）
  it('should detect with mixed combinations (three pungs one kong) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createKong(TileType.WAN, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例62：混合组合（三个刻子一个杠，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three pungs one kong) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createPung(TileType.WAN, 5, 3),
      createPung(TileType.WAN, 5, 6),
      createPung(TileType.WAN, 5, 9),
      createKong(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例63：混合组合（三个杠一个顺子，都包含5）
  it('should detect with mixed combinations (three kongs one chow) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createChow(TileType.WAN, 3, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例64：混合组合（三个杠一个顺子，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three kongs one chow) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createChow(TileType.WAN, 1, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例65：混合组合（三个杠一个刻子，都包含5）
  it('should detect with mixed combinations (three kongs one pung) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createPung(TileType.WAN, 5, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例66：混合组合（三个杠一个刻子，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (three kongs one pung) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createKong(TileType.WAN, 5, 3),
      createKong(TileType.WAN, 5, 7),
      createKong(TileType.WAN, 5, 11),
      createPung(TileType.WAN, 1, 15)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例67：混合组合（两个顺子两个刻子，都包含5）
  it('should detect with mixed combinations (two chows two pungs) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createPung(TileType.WAN, 5, 9),
      createPung(TileType.WAN, 5, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例68：混合组合（两个顺子两个刻子，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (two chows two pungs) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createPung(TileType.WAN, 5, 9),
      createPung(TileType.WAN, 1, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  // 测试用例69：混合组合（两个顺子两个杠，都包含5）
  it('should detect with mixed combinations (two chows two kongs) all containing 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createKong(TileType.WAN, 5, 9),
      createKong(TileType.WAN, 5, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  // 测试用例70：混合组合（两个顺子两个杠，三个包含5，一个不包含5）
  it('should not detect with mixed combinations (two chows two kongs) where only three contain 5', () => {
    const handTiles = createPair(TileType.WAN, 5, 1);
    const revealedSets = [
      createChow(TileType.WAN, 3, 3),
      createChow(TileType.WAN, 4, 6),
      createKong(TileType.WAN, 5, 9),
      createKong(TileType.WAN, 1, 13)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
}); 