import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { SevenConnectedPairsDetector } from '../../src/majiang/win-conditions/win-conditions_seven-connected-pairs';
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

describe('SevenConnectedPairsDetector', () => {
  let detector: SevenConnectedPairsDetector;

  beforeEach(() => {
    detector = new SevenConnectedPairsDetector();
  });

  // === 有效连七对场景测试 ===
  describe('Valid seven connected pairs scenarios', () => {
    it('should detect valid seven connected pairs with WAN 1-7', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with WAN 2-8', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with WAN 3-9', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TIAO 1-7', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TIAO 2-8', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TIAO 3-9', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TONG 1-7', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TONG 2-8', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should detect valid seven connected pairs with TONG 3-9', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // === 无效连七对场景测试 ===
  describe('Invalid seven connected pairs scenarios', () => {
    it('should not detect with non-continuous pairs', () => {
      // 七对但不连续
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 5, 5, 6, 6, 7, 7, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with mixed suit pairs', () => {
      // 七对但混合了不同花色
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4], 1),
        ...createTiles(TileType.TIAO, [5, 5, 6, 6, 7, 7], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with honor tiles', () => {
      // 七对但包含字牌
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1),
        ...createTiles(TileType.FENG, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

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

    it('should not detect with one triplet', () => {
      // 五对子加一个刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6], 1),
        new Tile(TileType.WAN, 7, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with one sequence in hand', () => {
      // 五对子加一个顺子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8], 1),
        new Tile(TileType.WAN, 9, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });

  // === 多种明牌组合的测试场景 ===
  describe('Scenarios with multiple revealed sets', () => {
    // 每个测试用例，我们都使用各种明牌组合，但保持总牌数为14张

    // 测试1副吃的情况
    it('should not detect with 1 Chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试2副吃的情况
    it('should not detect with 2 Chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 5, 9),
        createChow(TileType.WAN, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试3副吃的情况
    it('should not detect with 3 Chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 3, 5),
        createChow(TileType.WAN, 5, 8),
        createChow(TileType.WAN, 7, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试4副吃的情况
    it('should not detect with 4 Chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.WAN, 4, 6),
        createChow(TileType.WAN, 6, 9),
        createChow(TileType.WAN, 8, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试1副碰的情况
    it('should not detect with 1 Pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试2副碰的情况
    it('should not detect with 2 Pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试3副碰的情况
    it('should not detect with 3 Pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 3, 5),
        createPung(TileType.WAN, 4, 8),
        createPung(TileType.WAN, 5, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试4副碰的情况
    it('should not detect with 4 Pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 3),
        createPung(TileType.WAN, 3, 6),
        createPung(TileType.WAN, 4, 9),
        createPung(TileType.WAN, 5, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试1副杠的情况
    it('should not detect with 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 6, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试2副杠的情况
    it('should not detect with 2 Kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 4, 7),
        createKong(TileType.WAN, 5, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试3副杠的情况
    it('should not detect with 3 Kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 2, 3),
        createKong(TileType.WAN, 3, 7),
        createKong(TileType.WAN, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副吃 + 1副碰
    it('should not detect with 1 Chow + 1 Pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副吃 + 1副杠
    it('should not detect with 1 Chow + 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 5, 8),
        createKong(TileType.WAN, 7, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副碰 + 1副杠
    it('should not detect with 1 Pung + 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 5, 8),
        createKong(TileType.WAN, 6, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副吃 + 1副碰 + 1副杠
    it('should not detect with 1 Chow + 1 Pung + 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 3, 5),
        createPung(TileType.WAN, 5, 8),
        createKong(TileType.WAN, 6, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：2副吃 + 1副碰
    it('should not detect with 2 Chows + 1 Pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 3, 5),
        createChow(TileType.WAN, 5, 8),
        createPung(TileType.WAN, 7, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：2副吃 + 1副杠
    it('should not detect with 2 Chows + 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.WAN, 4, 6),
        createKong(TileType.WAN, 6, 9)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副吃 + 2副碰
    it('should not detect with 1 Chow + 2 Pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 3, 5),
        createPung(TileType.WAN, 5, 8),
        createPung(TileType.WAN, 6, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：1副碰 + 2副杠
    it('should not detect with 1 Pung + 2 Kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 3),
        createKong(TileType.WAN, 3, 6),
        createKong(TileType.WAN, 4, 10)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试混合组合：4副各种组合
    it('should not detect with 2 Chows + 1 Pung + 1 Kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.WAN, 4, 6),
        createPung(TileType.WAN, 6, 9),
        createKong(TileType.WAN, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  // === 边界情况测试 ===
  describe('Edge cases', () => {
    it('should not detect with too few tiles', () => {
      // 只有13张牌
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with too many tiles', () => {
      // 15张牌
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect non-connected pairs even if all pairs are same suit', () => {
      // 七对，同花色但不连续
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 3, 3, 5, 5, 7, 7, 8, 8, 9, 9], 1),
        ...createTiles(TileType.WAN, [4, 4], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect connected but with different suits', () => {
      // 七对，连续但不同花色
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.TIAO, [4, 4, 5, 5], 7),
        ...createTiles(TileType.TONG, [6, 6, 7, 7], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect if any pair is not a pair', () => {
      // 六对一单独
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7], 1),
        new Tile(TileType.WAN, 8, 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
}); 