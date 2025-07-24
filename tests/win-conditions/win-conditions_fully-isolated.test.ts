import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet } from '../../src/majiang/rule-types';
import { FullyIsolatedDetector } from '../../src/majiang/win-conditions/win-conditions_fully-isolated';
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

describe('FullyIsolatedDetector', () => {
  let detector: FullyIsolatedDetector;

  beforeEach(() => {
    detector = new FullyIsolatedDetector();
  });

  // === 有效全不靠场景测试 ===
  describe('有效全不靠场景', () => {
    // 3. 全不靠 - 只有箭牌
    it('应检测出全不靠牌型 - 只有箭牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 10),
        ...createTiles(TileType.FENG, [1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 12. 全不靠 - 字牌最少数量
    it('应检测出全不靠牌型 - 字牌最少数量', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 3], 10),
        ...createTiles(TileType.JIAN, [1, 2], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 13. 全不靠 - 间隔为3的组合
    it('应检测出全不靠牌型 - 间隔为3的组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 14. 全不靠 - 间隔为4的组合
    it('应检测出全不靠牌型 - 间隔为4的组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 5, 9], 1),
        ...createTiles(TileType.TIAO, [2, 6], 4),
        ...createTiles(TileType.TONG, [3, 7], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 16. 全不靠 - 只使用偶数牌
    it('应检测出全不靠牌型 - 只使用偶数牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 6], 1),
        ...createTiles(TileType.TIAO, [2, 6], 3),
        ...createTiles(TileType.TONG, [4, 8], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 17. 全不靠 - 大数牌组合
    it('应检测出全不靠牌型 - 大数牌组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [4, 7], 1),
        ...createTiles(TileType.TIAO, [4, 7], 3),
        ...createTiles(TileType.TONG, [4, 7], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 18. 全不靠 - 小数牌组合
    it('应检测出全不靠牌型 - 小数牌组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 9], 1),
        ...createTiles(TileType.TIAO, [2, 5], 4),
        ...createTiles(TileType.TONG, [3, 6], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 20. 全不靠 - 混合各种点数
    it('应检测出全不靠牌型 - 混合各种点数', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 5, 9], 1),
        ...createTiles(TileType.TIAO, [1, 6], 4),
        ...createTiles(TileType.TONG, [3, 7], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 23. 全不靠 - 混合万子组合
    it('应检测出全不靠牌型 - 混合万子组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 5, 9], 1),
        ...createTiles(TileType.TIAO, [2, 6], 4),
        ...createTiles(TileType.TONG, [3, 7], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 24. 全不靠 - 混合条子组合
    it('应检测出全不靠牌型 - 混合条子组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 5], 1),
        ...createTiles(TileType.TIAO, [2, 6, 9], 3),
        ...createTiles(TileType.TONG, [3, 7], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 25. 全不靠 - 混合筒子组合
    it('应检测出全不靠牌型 - 混合筒子组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 5], 1),
        ...createTiles(TileType.TIAO, [2, 6], 3),
        ...createTiles(TileType.TONG, [1, 4, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 26. 全不靠 - 全风牌字牌
    it('应检测出全不靠牌型 - 全风牌字牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3], 10),
        ...createTiles(TileType.JIAN, [1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 27. 全不靠 - 混合字牌最多
    it('应检测出全不靠牌型 - 混合字牌最多', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1),
        ...createTiles(TileType.TIAO, [2, 5], 3),
        ...createTiles(TileType.TONG, [3, 6], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 28. 全不靠 - 混合数牌最多
    it('应检测出全不靠牌型 - 混合数牌最多', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2], 10),
        ...createTiles(TileType.JIAN, [1, 2], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 29. 全不靠 - 特殊间隔组合
    it('应检测出全不靠牌型 - 特殊间隔组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 9], 1),
        ...createTiles(TileType.TIAO, [2, 7], 4),
        ...createTiles(TileType.TONG, [3, 8], 6),
        ...createTiles(TileType.FENG, [1, 2, 3], 8),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // === 无效全不靠场景测试 ===
  describe('无效全不靠场景', () => {
    // 1. 牌数不足13张
    it('不应检测出牌数不足13张的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 2. 含有重复牌
    it('不应检测出含有重复牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 5),
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        ...createTiles(TileType.FENG, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 3. 某一花色超过3张
    it('不应检测出某一花色超过3张的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 9], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 5),
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        ...createTiles(TileType.FENG, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 4. 没有字牌
    it('不应检测出没有字牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.WAN, [2, 5, 8], 10),
        ...createTiles(TileType.TIAO, [3, 6, 9], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 5. 数牌不是互不相邻（间隔小于等于2）
    it('不应检测出万子相邻的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 3, 7], 1), // 1和3相邻
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出条子相邻的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 4, 8], 4), // 2和4相邻
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出筒子相邻的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 5, 9], 7), // 3和5相邻
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 6. 有明牌
    it('不应检测出含有明牌的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3], 7)
      ];
      
      const revealedSets = [
        createChow(TileType.TONG, 6, 8)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 7. 混合不符合规则的组合
    it('不应检测出有刻子的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1], 1), // 刻子
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出有对子的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 2], 4), // 对子
        ...createTiles(TileType.TIAO, [5, 8], 6),
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        ...createTiles(TileType.FENG, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出包含顺子组合的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1), // 顺子
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 8. 边界情况
    it('不应检测出牌数超过13张的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10),
        ...createTiles(TileType.JIAN, [1], 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出字牌数为0的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.WAN, [2, 5, 8], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 9. 各种组合情况
    it('不应检测出七对子牌型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 3, 3], 1),
        ...createTiles(TileType.TIAO, [5, 5, 7, 7], 5),
        ...createTiles(TileType.TONG, [2, 2], 9),
        ...createTiles(TileType.FENG, [1, 1, 3, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出清一色牌型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出标准胡牌牌型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1], 1), // 刻子
        ...createTiles(TileType.TIAO, [2, 3, 4], 4), // 顺子
        ...createTiles(TileType.TONG, [5, 5, 5], 7), // 刻子
        ...createTiles(TileType.FENG, [1, 1, 1], 10), // 刻子
        ...createTiles(TileType.JIAN, [2, 2], 13) // 雀头
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 10. 特殊情况
    it('不应检测出每种花色只有1张的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1], 1),
        ...createTiles(TileType.TIAO, [2], 2),
        ...createTiles(TileType.TONG, [3], 3),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 4),
        ...createTiles(TileType.JIAN, [1, 2, 3, 1, 2, 3], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出部分牌值连续的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [4, 5, 6], 4), // 连续的条子
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出字牌超过限制的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1], 1),
        ...createTiles(TileType.TIAO, [2], 2),
        ...createTiles(TileType.TONG, [3], 3),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 4),
        ...createTiles(TileType.JIAN, [1, 2, 3, 1, 2, 3], 8) // 超过限制的箭牌
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出14张牌的情况', () => {
      const handTiles = [
        new Tile(TileType.WAN, 3, 1),
        new Tile(TileType.WAN, 7, 2),
        new Tile(TileType.WAN, 8, 3),
        new Tile(TileType.WAN, 8, 4),
        new Tile(TileType.TIAO, 4, 5),
        new Tile(TileType.TIAO, 4, 6),
        new Tile(TileType.TIAO, 6, 7),
        new Tile(TileType.TONG, 1, 8),
        new Tile(TileType.TONG, 3, 9),
        new Tile(TileType.TONG, 5, 10),
        new Tile(TileType.TONG, 6, 11),
        new Tile(TileType.TONG, 9, 12),
        new Tile(TileType.FENG, 2, 13),
        new Tile(TileType.JIAN, 3, 14),
      ];
      const detector = new FullyIsolatedDetector();
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
});