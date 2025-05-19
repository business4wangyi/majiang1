import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { HalfFlushDetector } from '../../src/win-conditions/win-conditions_half-flush';
import { expect } from 'chai';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
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

describe('HalfFlushDetector', () => {
  let detector: HalfFlushDetector;

  beforeEach(() => {
    detector = new HalfFlushDetector();
  });

  // === 有效半混场景测试 ===
  describe('有效半混场景', () => {
    // 1. 基本半混牌型 - 万子+字牌
    it('应检测出基本半混牌型 - 万子+字牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], 1),
        ...createTiles(TileType.FENG, [1, 1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 2. 基本半混牌型 - 条子+字牌
    it('应检测出基本半混牌型 - 条子+字牌', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5], 1),
        ...createTiles(TileType.JIAN, [1, 1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 3. 基本半混牌型 - 筒子+字牌
    it('应检测出基本半混牌型 - 筒子+字牌', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [3, 3, 3, 4, 4, 4, 7, 7, 7, 9, 9], 1),
        ...createTiles(TileType.FENG, [2, 2], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 4. 半混 - 带1副吃
    it('应检测出半混牌型 - 带1副吃', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [4, 4, 4, 6, 6, 6, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1], 9)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 5. 半混 - 带2副吃
    it('应检测出半混牌型 - 带2副吃', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5, 5, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1], 6)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 8),
        createChow(TileType.WAN, 6, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 6. 半混 - 带3副吃
    it('应检测出半混牌型 - 带3副吃', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [8, 8], 1),
        ...createTiles(TileType.FENG, [1, 1], 3)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 5),
        createChow(TileType.WAN, 4, 8),
        createChow(TileType.WAN, 6, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 7. 半混 - 带4副吃
    it('应检测出半混牌型 - 带4副吃', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [3, 3], 1)
      ];
      
      const revealedSets = [
        createChow(TileType.TIAO, 1, 3),
        createChow(TileType.TIAO, 3, 6),
        createChow(TileType.TIAO, 5, 9),
        createChow(TileType.TIAO, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 8. 半混 - 带1副碰
    it('应检测出半混牌型 - 带1副碰', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8], 1),
        ...createTiles(TileType.JIAN, [2, 2], 11)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 9. 半混 - 带2副碰
    it('应检测出半混牌型 - 带2副碰', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 2, 3, 4, 5, 6, 7], 1),
        ...createTiles(TileType.JIAN, [2, 2], 8)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 8, 10),
        createPung(TileType.TONG, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 10. 半混 - 带3副碰
    it('应检测出半混牌型 - 带3副碰', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 2, 3, 4], 1),
        ...createTiles(TileType.FENG, [4, 4], 5)
      ];
      
      const revealedSets = [
        createPung(TileType.TIAO, 5, 7),
        createPung(TileType.TIAO, 7, 10),
        createPung(TileType.TIAO, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 11. 半混 - 带4副碰
    it('应检测出半混牌型 - 带4副碰', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [2, 2], 1)
      ];
      
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.WAN, 3, 6),
        createPung(TileType.WAN, 5, 9),
        createPung(TileType.WAN, 9, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 12. 半混 - 带1副杠
    it('应检测出半混牌型 - 带1副杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 1),
        ...createTiles(TileType.JIAN, [3, 3], 11)
      ];
      
      const revealedSets = [
        createKong(TileType.WAN, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 13. 半混 - 带2副杠
    it('应检测出半混牌型 - 带2副杠', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 1, 2, 2, 2, 3], 1),
        ...createTiles(TileType.FENG, [1, 1], 8)
      ];
      
      const revealedSets = [
        createKong(TileType.TIAO, 6, 10),
        createKong(TileType.TIAO, 9, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 14. 半混 - 带3副杠
    it('应检测出半混牌型 - 带3副杠', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [5, 5, 5, 6], 1),
        ...createTiles(TileType.JIAN, [2, 2], 5)
      ];
      
      const revealedSets = [
        createKong(TileType.TONG, 1, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.TONG, 9, 15)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 15. 半混 - 带4副杠
    it('应检测出半混牌型 - 带4副杠', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [3, 3], 1)
      ];
      
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.WAN, 3, 7),
        createKong(TileType.WAN, 5, 11),
        createKong(TileType.WAN, 9, 15)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 16. 半混 - 1副吃1副碰
    it('应检测出半混牌型 - 1副吃1副碰', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 1, 5, 5, 5, 9, 9], 1),
        ...createTiles(TileType.JIAN, [1, 1], 9)
      ];
      
      const revealedSets = [
        createChow(TileType.TIAO, 2, 11),
        createPung(TileType.TIAO, 8, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 17. 半混 - 1副吃1副杠
    it('应检测出半混牌型 - 1副吃1副杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 4, 5, 6, 9, 9], 1),
        ...createTiles(TileType.FENG, [2, 2], 9)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 2, 11),
        createKong(TileType.WAN, 8, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 18. 半混 - 1副碰1副杠
    it('应检测出半混牌型 - 1副碰1副杠', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [2, 2, 2, 3, 4, 5, 8, 8], 1),
        ...createTiles(TileType.JIAN, [3, 3], 9)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 6, 11),
        createKong(TileType.TONG, 9, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 19. 半混 - 2副吃1副碰
    it('应检测出半混牌型 - 2副吃1副碰', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2, 9, 9], 1),
        ...createTiles(TileType.FENG, [4, 4], 6)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 3, 8),
        createChow(TileType.WAN, 6, 11),
        createPung(TileType.WAN, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 20. 半混 - 2副吃1副杠
    it('应检测出半混牌型 - 2副吃1副杠', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [4, 5, 6, 9, 9], 1),
        ...createTiles(TileType.JIAN, [2, 2], 6)
      ];
      
      const revealedSets = [
        createChow(TileType.TIAO, 1, 8),
        createChow(TileType.TIAO, 7, 11),
        createKong(TileType.TIAO, 3, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 21. 半混 - 2副碰1副杠
    it('应检测出半混牌型 - 2副碰1副杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [7, 8, 9, 9, 9], 1),
        ...createTiles(TileType.JIAN, [1, 1], 6)
      ];
      
      const revealedSets = [
        createPung(TileType.WAN, 1, 8),
        createPung(TileType.WAN, 4, 11),
        createKong(TileType.WAN, 6, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 22. 半混 - 3副吃1副碰
    it('应检测出半混牌型 - 3副吃1副碰', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [9, 9], 1),
        ...createTiles(TileType.FENG, [3, 3], 3)
      ];
      
      const revealedSets = [
        createChow(TileType.TONG, 1, 5),
        createChow(TileType.TONG, 3, 8),
        createChow(TileType.TONG, 6, 11),
        createPung(TileType.FENG, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 23. 半混 - 3副碰1副吃
    it('应检测出半混牌型 - 3副碰1副吃', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1], 1),
        ...createTiles(TileType.JIAN, [2, 2], 3)
      ];
      
      const revealedSets = [
        createPung(TileType.TIAO, 3, 5),
        createPung(TileType.TIAO, 6, 8),
        createPung(TileType.TIAO, 9, 11),
        createChow(TileType.TIAO, 4, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 24. 半混 - 2副吃2副碰
    it('应检测出半混牌型 - 2副吃2副碰', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1),
        ...createTiles(TileType.FENG, [2, 2], 3)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 5),
        createChow(TileType.WAN, 4, 8),
        createPung(TileType.WAN, 6, 11),
        createPung(TileType.WAN, 8, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 25. 半混 - 2副碰2副杠
    it('应检测出半混牌型 - 2副碰2副杠', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [3, 3], 1)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 1, 3),
        createPung(TileType.TONG, 4, 6),
        createKong(TileType.TONG, 7, 9),
        createKong(TileType.TONG, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 26. 半混 - 2副吃2副杠
    it('应检测出半混牌型 - 2副吃2副杠', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1], 1)
      ];
      
      const revealedSets = [
        createChow(TileType.TIAO, 1, 3),
        createChow(TileType.TIAO, 4, 6),
        createKong(TileType.TIAO, 7, 9),
        createKong(TileType.TIAO, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 27. 半混 - 带字牌刻子
    it('应检测出半混牌型 - 带字牌刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 3, 3, 3, 5, 5, 5, 9], 1),
        ...createTiles(TileType.FENG, [1, 1, 1], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 28. 半混 - 带字牌杠
    it('应检测出半混牌型 - 带字牌杠', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [2, 2, 2, 5, 5, 5, 8, 8, 8], 1)
      ];
      
      const revealedSets = [
        createKong(TileType.JIAN, 1, 10)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 29. 半混 - 带多种字牌
    it('应检测出半混牌型 - 带多种字牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1),
        ...createTiles(TileType.FENG, [1, 1], 9),
        ...createTiles(TileType.JIAN, [2, 2], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 30. 半混 - 万子七对
    it('应检测出半混牌型 - 万子七对', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 5, 5, 7, 7, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 31. 半混 - 条子混合牌型
    it('应检测出半混牌型 - 条子混合牌型', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 2, 3, 4, 4, 4, 7, 7, 7], 1),
        ...createTiles(TileType.FENG, [2, 2, 2, 3], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 32. 半混 - 筒子龙七对
    it('应检测出半混牌型 - 筒子龙七对', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1),
        ...createTiles(TileType.JIAN, [3, 3], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 33. 半混 - 1-9筒
    it('应检测出半混牌型 - 1-9筒', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9], 1)
      ];
      
      const revealedSets = [
        createPung(TileType.FENG, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 34. 半混 - 带风牌碰和箭牌杠
    it('应检测出半混牌型 - 带风牌碰和箭牌杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 3, 4, 5, 6, 7, 9], 1)
      ];
      
      const revealedSets = [
        createPung(TileType.FENG, 2, 8),
        createKong(TileType.JIAN, 1, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 35. 半混 - 字牌多且数牌少
    it('应检测出半混牌型 - 字牌多且数牌少', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 1, 9, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 7),
        ...createTiles(TileType.JIAN, [3, 3], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // === 无效半混场景测试 ===
  describe('无效半混场景', () => {
    // 1. 清一色（没有字牌）
    it('不应检测出清一色牌型（没有字牌）', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 2. 多种花色数牌
    it('不应检测出多种花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 9, 9, 9], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2, 8, 8, 8], 7),
        ...createTiles(TileType.JIAN, [3, 3], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 3. 三种花色数牌
    it('不应检测出三种花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [3, 3, 3], 4),
        ...createTiles(TileType.TONG, [5, 5, 5], 7),
        ...createTiles(TileType.FENG, [1, 1, 1, 3], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 4. 万子和条子混合
    it('不应检测出万子和条子混合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3, 7, 8, 9], 7),
        ...createTiles(TileType.FENG, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 5. 万子和筒子混合
    it('不应检测出万子和筒子混合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.TONG, [3, 3, 3, 4, 4, 4], 7),
        ...createTiles(TileType.JIAN, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 6. 条子和筒子混合
    it('不应检测出条子和筒子混合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [5, 5, 5, 6, 6, 6], 1),
        ...createTiles(TileType.TONG, [7, 7, 7, 8, 8, 8], 7),
        ...createTiles(TileType.FENG, [4, 4], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 7. 只有风牌
    it('不应检测出只有风牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 8. 只有箭牌
    it('不应检测出只有箭牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 9. 风牌和箭牌混合
    it('不应检测出风牌和箭牌混合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.JIAN, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 10. 带吃的多花色数牌
    it('不应检测出带吃的多花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4], 1),
        ...createTiles(TileType.TIAO, [5, 5, 5, 9, 9], 7),
        ...createTiles(TileType.JIAN, [1, 1], 12)
      ];
      
      const revealedSets = [
        createChow(TileType.TONG, 2, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 11. 带碰的多花色数牌
    it('不应检测出带碰的多花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2, 3, 4, 5], 1),
        ...createTiles(TileType.TIAO, [6, 7, 8, 9, 9], 7),
        ...createTiles(TileType.FENG, [2, 2], 12)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 12. 带杠的多花色数牌
    it('不应检测出带杠的多花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5, 5, 6, 7, 8], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4, 9, 9], 7),
        ...createTiles(TileType.JIAN, [3, 3], 12)
      ];
      
      const revealedSets = [
        createKong(TileType.TONG, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 13. 多种花色明牌
    it('不应检测出多种花色明牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5], 1),
        ...createTiles(TileType.JIAN, [2, 2], 8)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 6, 10),
        createPung(TileType.TIAO, 9, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 14. 一色三种花色明牌
    it('不应检测出三种花色明牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1], 1)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 3, 6),
        createKong(TileType.TONG, 5, 9),
        createPung(TileType.JIAN, 2, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 15. 清一色明牌
    it('不应检测出清一色明牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1])
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.WAN, 5, 6),
        createPung(TileType.WAN, 8, 9),
        createPung(TileType.WAN, 9, 12)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 16. 三种花色组合
    it('不应检测出三种花色组合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TIAO, [4, 5, 6], 4),
        ...createTiles(TileType.TONG, [7, 8, 9], 7),
        ...createTiles(TileType.FENG, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 17. 两种花色搭配无字牌
    it('不应检测出两种花色搭配无字牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.TIAO, [4, 4, 4, 5], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 18. 四副吃多种花色
    it('不应检测出四副吃多种花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1], 1)
      ];
      
      const revealedSets = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.WAN, 4, 6),
        createChow(TileType.TIAO, 2, 9),
        createChow(TileType.TIAO, 5, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 19. 四副碰多种花色
    it('不应检测出四副碰多种花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [3, 3], 1)
      ];
      
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.WAN, 9, 6),
        createPung(TileType.TIAO, 5, 9),
        createPung(TileType.TONG, 8, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 20. 四副杠多种花色
    it('不应检测出四副杠多种花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [4, 4], 1)
      ];
      
      const revealedSets = [
        createKong(TileType.WAN, 2, 3),
        createKong(TileType.TIAO, 3, 7),
        createKong(TileType.TONG, 5, 11),
        createKong(TileType.JIAN, 1, 15)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 21. 混合型明暗牌多花色
    it('不应检测出混合型明暗牌多花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 9, 9], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4], 6),
        ...createTiles(TileType.FENG, [2, 2], 9)
      ];
      
      const revealedSets = [
        createPung(TileType.TONG, 6, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 22. 万筒+字牌，明牌为条
    it('不应检测出万筒+字牌，明牌为条的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4], 1),
        ...createTiles(TileType.TONG, [5, 6, 7], 7),
        ...createTiles(TileType.FENG, [1, 1], 10)
      ];
      
      const revealedSets = [
        createChow(TileType.TIAO, 7, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 23. 字一色（全字牌）
    it('不应检测出字一色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], 1),
        ...createTiles(TileType.JIAN, [1, 1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 24. 混合风箭牌七对
    it('不应检测出混合风箭牌七对的情况', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 2, 2, 3, 3, 4, 4], 1),
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 25. 混合碰杠多种花色
    it('不应检测出混合碰杠多种花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1),
        ...createTiles(TileType.FENG, [1, 1], 3)
      ];
      
      const revealedSets = [
        createPung(TileType.WAN, 9, 5),
        createPung(TileType.TIAO, 5, 8),
        createKong(TileType.TONG, 3, 11)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 26. 七对子多花色
    it('不应检测出七对子多花色的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 3, 3, 5, 5], 1),
        ...createTiles(TileType.TIAO, [2, 2, 4, 4], 7),
        ...createTiles(TileType.TONG, [6, 6], 11),
        ...createTiles(TileType.FENG, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 27. 多种花色暗杠
    it('不应检测出多种花色暗杠的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [3, 3, 3, 3], 5),
        ...createTiles(TileType.TONG, [5, 5, 5, 5], 9),
        ...createTiles(TileType.JIAN, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 28. 多种花色不同点数的刻子
    it('不应检测出多种花色不同点数的刻子的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2, 5, 5, 5], 1),
        ...createTiles(TileType.TIAO, [3, 3, 3, 8, 8, 8], 7),
        ...createTiles(TileType.FENG, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 29. 三色同顺
    it('不应检测出三色同顺的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 3, 4, 8, 8], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4, 9, 9], 6),
        ...createTiles(TileType.TONG, [2, 3, 4], 11),
        ...createTiles(TileType.FENG, [1, 1], 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 30. 三色同刻
    it('不应检测出三色同刻的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5, 5, 9, 9], 1),
        ...createTiles(TileType.TIAO, [5, 5, 5], 6),
        ...createTiles(TileType.TONG, [5, 5, 5], 9),
        ...createTiles(TileType.FENG, [1, 1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 31. 混合风牌和多种花色数牌
    it('不应检测出混合风牌和多种花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TIAO, [4, 5, 6], 4),
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 32. 混合箭牌和多种花色数牌
    it('不应检测出混合箭牌和多种花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [7, 8, 9], 1),
        ...createTiles(TileType.TONG, [1, 2, 3], 4),
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 33. 混合风箭牌和多种花色数牌
    it('不应检测出混合风箭牌和多种花色数牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2], 4),
        ...createTiles(TileType.FENG, [1, 1, 1, 2], 7),
        ...createTiles(TileType.JIAN, [1, 1, 1, 2], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 34. 混合多花色牌型
    it('不应检测出极端混合多花色牌型的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 35. 十三幺牌型
    it('不应检测出十三幺牌型的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
}); 