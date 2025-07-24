import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { SevenPairsDetector } from '../../src/majiang/win-conditions/win-conditions_seven-pairs';
import { expect } from 'chai';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
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

describe('SevenPairsDetector', () => {
  let detector: SevenPairsDetector;

  beforeEach(() => {
    detector = new SevenPairsDetector();
  });

  // === 有效七对子场景测试 ===
  describe('Valid seven pairs scenarios', () => {
    it('should detect valid seven pairs with all WAN tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with all TIAO tiles', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with all TONG tiles', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with mixed suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1),
        ...createTiles(TileType.TIAO, [3, 3, 4, 4], 5),
        ...createTiles(TileType.TONG, [5, 5, 6, 6, 7, 7], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with wind tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1),
        ...createTiles(TileType.TONG, [3, 3, 4, 4], 5),
        ...createTiles(TileType.FENG, [1, 1, 2, 2, 3, 3], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with arrow tiles', () => {
      // 测试用七对牌：1万对、2万对、3万对、4万对、5万对、中箭对、发箭对
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 1),
        ...createTiles(TileType.JIAN, [1, 1, 2, 2], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven pairs with non-consecutive numbers', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 3, 3, 5, 5, 7, 7, 9, 9], 1),
        ...createTiles(TileType.TIAO, [2, 2], 11),
        ...createTiles(TileType.TONG, [8, 8], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // === 无效七对子场景测试 ===
  describe('Invalid seven pairs scenarios', () => {
    it('should not detect with less than seven pairs', () => {
      // 六对子加两个单张
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with CHI revealed set', () => {
      // 手牌：六对子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1)
      ];
      
      // 明牌：一个顺子
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 7, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('should not detect with PENG revealed set', () => {
      // 手牌：六对子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1)
      ];
      
      // 明牌：一个刻子
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 7, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('should not detect with GANG revealed set', () => {
      // 手牌：六对子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1)
      ];
      
      // 明牌：一个杠
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 7, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('should not detect with multiple revealed sets', () => {
      // 手牌：四对子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4], 1)
      ];
      
      // 明牌：一个顺子和一个刻子
      const revealedSets: TileSet[] = [
        createChow(TileType.TIAO, 1, 9),
        createPung(TileType.TONG, 5, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('should not detect with one triplet', () => {
      // 五对子加一个刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6], 1),
        new Tile(TileType.WAN, 7, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with multiple triplets', () => {
      // 三对子加两个刻子加一张单牌
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6], 1),
        new Tile(TileType.WAN, 7, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with one sequence', () => {
      // 五对子加一个顺子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8], 1),
        new Tile(TileType.WAN, 9, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with multiple sequences', () => {
      // 三对子加两个顺子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9], 1),
        ...createTiles(TileType.TIAO, [1, 2], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with eight pairs', () => {
      // 八对子（超过七对）
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with mixed pairs and singles', () => {
      // 四对子加六个单张
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9], 1),
        new Tile(TileType.TIAO, 1, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with 13 tiles', () => {
      // 只有13张牌（少于14张）
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with 15 tiles', () => {
      // 15张牌（超过14张）
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });

  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('七对子');
    expect(detector.getDescription()).to.equal('由七个对子组成的和牌');
    expect(detector.getScore()).to.equal(24);
  });
}); 