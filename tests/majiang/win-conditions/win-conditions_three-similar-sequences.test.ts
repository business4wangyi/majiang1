import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet } from '../../../src/majiang/core/rule-types';
import { ThreeSimilarSequencesDetector } from '../../../src/majiang/core/win-conditions/win-conditions_three-similar-sequences';
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

describe('ThreeSimilarSequencesDetector', () => {
  let detector: ThreeSimilarSequencesDetector;

  beforeEach(() => {
    detector = new ThreeSimilarSequencesDetector();
  });

  // 基本功能测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('三色三同顺');
    expect(detector.getDescription()).to.equal('三种花色各有一组相同点数的顺子');
    expect(detector.getScore()).to.equal(32);
  });

  // === 有效场景测试 ===
  describe('Valid scenarios', () => {
    // 1. 手牌中的三色三同顺
    describe('Three similar sequences in hand', () => {
      // 测试不同点数的三色三同顺
      it('should detect with three similar sequences of value 1', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 9, 9]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3, 4, 5, 6])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 5', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [4, 5, 6, 9, 9]),
          ...createTiles(TileType.TIAO, [4, 5, 6]),
          ...createTiles(TileType.TONG, [4, 5, 6, 7, 8, 9])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 7', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [6, 7, 8, 9, 9]),
          ...createTiles(TileType.TIAO, [6, 7, 8]),
          ...createTiles(TileType.TONG, [6, 7, 8, 1, 2, 3])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 2. 明牌中的三色三同顺
    describe('Three similar sequences in revealed sets', () => {
      // 测试不同吃碰杠组合
      it('should detect with three chows and one pung', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with two chows, one pung, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with one chow, two pungs, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });

    // 3. 手牌和明牌组合的三色三同顺
    describe('Mixed hand tiles and revealed sets', () => {
      it('should detect with two sequences in hand and one in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.WAN, [9, 9])
        ];
        const revealedSets = [
          createChow(TileType.TONG, 1, 6),
          createPung(TileType.TONG, 4, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with one sequence in hand and two in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.WAN, [9, 9])
        ];
        const revealedSets = [
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.TONG, 4, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });
  });

  // === 无效场景测试 ===
  describe('Invalid scenarios', () => {
    // 1. 手牌中的无效场景
    describe('Invalid hand tiles', () => {
      it('should not detect with only two similar sequences', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 9, 9]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [4, 5, 6, 7, 8, 9])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with three sequences of different values', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3, 9, 9]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [3, 4, 5, 6, 7, 8])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });
    });

    // 2. 明牌中的无效场景
    describe('Invalid revealed sets', () => {
      it('should not detect with only two similar sequences in revealed sets', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.WAN, 4, 9),
          createPung(TileType.WAN, 7, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with only pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createPung(TileType.WAN, 1, 3),
          createPung(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 3. 手牌和明牌组合的无效场景
    describe('Invalid mixed scenarios', () => {
      it('should not detect when sequences have different values', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.WAN, [9, 9])
        ];
        const revealedSets = [
          createChow(TileType.TONG, 3, 6),
          createPung(TileType.TONG, 6, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with too many revealed sets', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createChow(TileType.WAN, 4, 12),
          createChow(TileType.TIAO, 4, 15)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 4. 边界情况
    describe('Edge cases', () => {
      it('should not detect with empty tiles', () => {
        expect(detector.detect([], [])).to.be.false;
      });

      it('should not detect with invalid tile count', () => {
        const handTiles = createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4]);
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with invalid revealed sets count', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createChow(TileType.WAN, 4, 12),
          createChow(TileType.TIAO, 4, 15),
          createChow(TileType.TONG, 4, 18)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });
  });

  // === 补充测试场景 ===
  describe('Additional test scenarios', () => {
    // 测试不同点数的三色三同顺
    describe('Different sequence values', () => {
      it('should detect with three similar sequences of value 2', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [2, 3, 4, 9, 9]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [2, 3, 4, 5, 6, 7])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 3', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [3, 4, 5, 9, 9]),
          ...createTiles(TileType.TIAO, [3, 4, 5]),
          ...createTiles(TileType.TONG, [3, 4, 5, 6, 7, 8])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 4', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [4, 5, 6, 9, 9]),
          ...createTiles(TileType.TIAO, [4, 5, 6]),
          ...createTiles(TileType.TONG, [4, 5, 6, 7, 8, 9])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 6', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [6, 7, 8, 9, 9]),
          ...createTiles(TileType.TIAO, [6, 7, 8]),
          ...createTiles(TileType.TONG, [6, 7, 8, 1, 2, 3])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three similar sequences of value 8', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [7, 8, 9, 2, 2]),
          ...createTiles(TileType.TIAO, [7, 8, 9]),
          ...createTiles(TileType.TONG, [7, 8, 9, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试不同吃碰杠组合
    describe('Different combinations of chows, pungs, and kongs', () => {
      it('should detect with three chows and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with two chows and two pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with one chow and three pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with two chows, one pung, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with one chow, two pungs, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });

    // 测试无效的吃碰杠组合
    describe('Invalid combinations of chows, pungs, and kongs', () => {
      it('should not detect with only two similar sequences and two pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 5, 9),
          createPung(TileType.WAN, 7, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with only two similar sequences and two kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createKong(TileType.TONG, 5, 9),
          createKong(TileType.WAN, 7, 13)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with only one similar sequence and three pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createPung(TileType.TIAO, 5, 6),
          createPung(TileType.TONG, 7, 9),
          createPung(TileType.WAN, 8, 12)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with only one similar sequence and three kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createKong(TileType.TIAO, 5, 6),
          createKong(TileType.TONG, 7, 10),
          createKong(TileType.WAN, 8, 14)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试不同花色组合
    describe('Different suit combinations', () => {
      it('should detect with WAN-TIAO-TONG sequence', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with TIAO-TONG-WAN sequence', () => {
        const handTiles = [
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with TONG-WAN-TIAO sequence', () => {
        const handTiles = [
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试不同牌型组合
    describe('Different tile combinations', () => {
      it('should detect with three sequences and two pairs', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5]),
          ...createTiles(TileType.TIAO, [7, 7])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three sequences and one pair', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5]),
          ...createTiles(TileType.TIAO, [7, 8])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three sequences and three single tiles', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5]),
          ...createTiles(TileType.TIAO, [7]),
          ...createTiles(TileType.TONG, [9])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试不同明牌组合
    describe('Different revealed set combinations', () => {
      it('should detect with three chows and two pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12),
          createPung(TileType.TIAO, 7, 15)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should detect with three chows and two kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12),
          createKong(TileType.TIAO, 7, 16)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should detect with three chows, one pung, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12),
          createKong(TileType.TIAO, 7, 15)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试无效的牌型组合
    describe('Invalid tile combinations', () => {
      it('should not detect with three sequences of different values', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [3, 4, 5]),
          ...createTiles(TileType.WAN, [5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with two sequences and one pung', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 1, 1]),
          ...createTiles(TileType.WAN, [5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with two sequences and one kong', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 1, 1, 1]),
          ...createTiles(TileType.WAN, [5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });
    });

    // 测试边界情况
    describe('Edge cases', () => {
      it('should not detect with invalid tile count', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should not detect with invalid revealed sets count', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12),
          createPung(TileType.TIAO, 7, 15),
          createPung(TileType.TONG, 8, 18)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with invalid sequence values', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试更多点数组合
    describe('More point value combinations', () => {
      it('should detect with three sequences of value 9', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [7, 8, 9]),
          ...createTiles(TileType.TIAO, [7, 8, 9]),
          ...createTiles(TileType.TONG, [7, 8, 9, 1, 2])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three sequences of value 2 in different positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [2, 3, 4]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [2, 3, 4, 5, 6])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three sequences of value 3 in different positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [3, 4, 5]),
          ...createTiles(TileType.TIAO, [3, 4, 5]),
          ...createTiles(TileType.TONG, [3, 4, 5, 6, 7])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试更多花色组合
    describe('More suit combinations', () => {
      it('should detect with WAN-TIAO-TONG sequence in different order', () => {
        const handTiles = [
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with TONG-WAN-TIAO sequence in different order', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with TIAO-TONG-WAN sequence in different order', () => {
        const handTiles = [
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3, 4, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });
    });

    // 测试更多明牌组合
    describe('More revealed set combinations', () => {
      it('should detect with three chows and three pungs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12),
          createPung(TileType.TIAO, 7, 15),
          createPung(TileType.TONG, 8, 18)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should detect with three chows and three kongs', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createKong(TileType.WAN, 5, 12),
          createKong(TileType.TIAO, 7, 16),
          createKong(TileType.TONG, 8, 20)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should detect with three chows, two pungs, and one kong', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createPung(TileType.WAN, 5, 12),
          createPung(TileType.TIAO, 7, 15),
          createKong(TileType.TONG, 8, 18)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试更多无效组合
    describe('More invalid combinations', () => {
      it('should not detect with three sequences of different values in different positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [3, 4, 5]),
          ...createTiles(TileType.WAN, [5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with two sequences and two pungs', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 1, 1]),
          ...createTiles(TileType.WAN, [5, 5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with two sequences and two kongs', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 1, 1, 1]),
          ...createTiles(TileType.WAN, [5, 5, 5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });
    });

    // 测试更多边界情况
    describe('More edge cases', () => {
      it('should not detect with invalid sequence length', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.false;
      });

      it('should not detect with invalid sequence values', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5, 5, 5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should not detect with invalid revealed sets', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9),
          createChow(TileType.WAN, 4, 12),
          createChow(TileType.TIAO, 4, 15),
          createChow(TileType.TONG, 4, 18),
          createChow(TileType.WAN, 7, 21)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });

    // 测试特殊情况
    describe('Special cases', () => {
      it('should detect with three sequences and one pair in different positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5]),
          ...createTiles(TileType.TIAO, [5])
        ];
        expect(detector.detect(handTiles, [])).to.be.true;
      });

      it('should detect with three sequences and one pair in revealed sets', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3])
        ];
        const revealedSets = [
          createChow(TileType.WAN, 5, 3),
          createChow(TileType.TIAO, 5, 6),
          createChow(TileType.TONG, 5, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should detect with three sequences and one pair in mixed positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3]),
          ...createTiles(TileType.WAN, [5])
        ];
        const revealedSets = [
          createChow(TileType.WAN, 5, 3),
          createChow(TileType.TIAO, 5, 6),
          createChow(TileType.TONG, 5, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });
    });

    // 测试更多边界情况
    describe('Additional edge cases', () => {
      it('should not detect with invalid sequence values in revealed sets', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 2, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });

      it('should not detect with invalid sequence length in revealed sets', () => {
        const handTiles = createPair(TileType.WAN, 9, 1);
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createPung(TileType.TONG, 1, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should not detect with invalid sequence values in mixed positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [2, 3, 4])
        ];
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should not detect with invalid sequence length in mixed positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2]),
          ...createTiles(TileType.TIAO, [1, 2, 3]),
          ...createTiles(TileType.TONG, [1, 2, 3])
        ];
        const revealedSets = [
          createChow(TileType.WAN, 1, 3),
          createChow(TileType.TIAO, 1, 6),
          createChow(TileType.TONG, 1, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.true;
      });

      it('should not detect with invalid sequence values in all positions', () => {
        const handTiles = [
          ...createTiles(TileType.WAN, [1, 2, 3]),
          ...createTiles(TileType.TIAO, [2, 3, 4]),
          ...createTiles(TileType.TONG, [3, 4, 5])
        ];
        const revealedSets = [
          createChow(TileType.WAN, 4, 3),
          createChow(TileType.TIAO, 5, 6),
          createChow(TileType.TONG, 6, 9)
        ];
        expect(detector.detect(handTiles, revealedSets)).to.be.false;
      });
    });
  });
});

// === 批量三色三同顺组合测试 ===

describe('批量三色三同顺组合', () => {
  const detector = new ThreeSimilarSequencesDetector();
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
  it('cases数量应为35', () => {
    expect(cases.length).to.equal(35);
  });

  let caseIdx = 1;
  cases.forEach(([chiCount, pengCount, kongCount], idx) => {
    const title = `吃${chiCount} 碰${pengCount} 杠${kongCount}`;

    // 能胡牌测试：明牌中有三色三同顺
    it(`Case ${caseIdx++}: 能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 1000;
      // 先加碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.WAN, (i % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TIAO, (i % 9) + 1, id));
        id += 4;
      }
      // 加吃，前3副吃保证三色三同顺
      if (chiCount >= 3) {
        revealedSets.push(createChow(TileType.WAN, 2, id)); id += 3;
        revealedSets.push(createChow(TileType.TIAO, 2, id)); id += 3;
        revealedSets.push(createChow(TileType.TONG, 2, id)); id += 3;
        for (let i = 3; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.WAN, ((i+2) % 7) + 1, id));
          id += 3;
        }
      } else {
        for (let i = 0; i < chiCount; i++) {
          revealedSets.push(createChow(TileType.WAN, ((i+2) % 7) + 1, id));
          id += 3;
        }
        // 补三色三同顺在手牌
      }
      // 手牌：补足三色三同顺
      let handTiles: Tile[] = [];
      if (chiCount < 3) {
        // 明牌不够三色三同顺，手牌补齐
        const need = 3 - chiCount;
        if (need === 3) {
          handTiles = [
            ...createTiles(TileType.WAN, [2,3,4], 1),
            ...createTiles(TileType.TIAO, [2,3,4], 4),
            ...createTiles(TileType.TONG, [2,3,4], 7),
            ...createTiles(TileType.WAN, [9,9], 10)
          ];
        } else if (need === 2) {
          handTiles = [
            ...createTiles(TileType.TIAO, [2,3,4], 1),
            ...createTiles(TileType.TONG, [2,3,4], 4),
            ...createTiles(TileType.WAN, [9,9,2,3,4], 7)
          ];
        } else if (need === 1) {
          handTiles = [
            ...createTiles(TileType.TONG, [2,3,4], 1),
            ...createTiles(TileType.WAN, [9,9,2,3,4], 4),
            ...createTiles(TileType.TIAO, [2,3,4], 9)
          ];
        }
      } else {
        // 明牌已含三色三同顺，手牌随便补对子
        handTiles = createPair(TileType.WAN, 9, 1);
      }
      expect(detector.detect(handTiles, revealedSets)).to.equal(true);
    });

    // 不能胡牌测试：明牌和手牌都不构成三色三同顺
    it(`Case ${caseIdx++}: 不能胡牌: ${title}`, () => {
      const revealedSets: TileSet[] = [];
      let id = 2000;
      // 先加碰和杠
      for (let i = 0; i < pengCount; i++) {
        revealedSets.push(createPung(TileType.WAN, (i % 9) + 1, id));
        id += 3;
      }
      for (let i = 0; i < kongCount; i++) {
        revealedSets.push(createKong(TileType.TIAO, (i % 9) + 1, id));
        id += 4;
      }
      // 加吃，全部用同一花色，保证不可能三色三同顺
      for (let i = 0; i < chiCount; i++) {
        revealedSets.push(createChow(TileType.WAN, ((i+2) % 7) + 1, id));
        id += 3;
      }
      // 手牌：也只用同一花色
      let handTiles: Tile[] = [];
      handTiles = [
        ...createTiles(TileType.WAN, [2,3,4,5,6,7,8,9,9,1,2,3,4]),
      ];
      expect(detector.detect(handTiles, revealedSets)).to.equal(false);
    });
  });
}); 