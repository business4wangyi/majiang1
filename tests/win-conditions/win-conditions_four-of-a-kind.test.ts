import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { FourOfAKindDetector } from '../../src/win-conditions/win-conditions_four-of-a-kind';
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

describe('FourOfAKindDetector', () => {
  let detector: FourOfAKindDetector;

  beforeEach(() => {
    detector = new FourOfAKindDetector();
  });

  // === 有效四归一场景测试 ===
  describe('有效四归一场景', () => {
    // 1. 全部手牌中含有4组四归一
    it('应检测出手牌中有4组四归一 - 万子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出手牌中有4组四归一 - 条子', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出手牌中有4组四归一 - 筒子', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出手牌中有4组四归一 - 混合花色', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2, 2], 5),
        ...createTiles(TileType.TONG, [3, 3, 3, 3], 9),
        ...createTiles(TileType.FENG, [1, 1, 1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出手牌中有4组四归一 - 包含箭牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2, 2], 5),
        ...createTiles(TileType.FENG, [1, 1, 1, 1], 9),
        ...createTiles(TileType.JIAN, [1, 1, 1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
    
    // 2. 手牌和明牌组合中含有4组四归一
    it('应检测出手牌和杠中有4组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出手牌和杠中有5组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 5),
        createKong(TileType.TONG, 4, 9),
        createKong(TileType.FENG, 1, 13),
        createKong(TileType.JIAN, 1, 17)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 3. 不同组合的杠和手牌
    it('应检测出手牌中有3组四归一和1个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出手牌中有2组四归一和2个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出手牌中有1组四归一和3个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9),
        createKong(TileType.FENG, 1, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出手牌中有0组四归一和4个杠', () => {
      const handTiles: Tile[] = [];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 1, 1),
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9),
        createKong(TileType.FENG, 1, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 4. 包含刻子和顺子
    it('应检测出手牌中有4组四归一 - 包含额外的刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出手牌中有4组四归一 - 包含额外的顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 6, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 5. 明牌中包含刻子和顺子
    it('应检测出手牌有2组四归一，明牌有2组四归一和1个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13),
        createPung(TileType.FENG, 1, 17)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出手牌有2组四归一，明牌有2组四归一和1个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13),
        createChow(TileType.FENG, 1, 17)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 6. 复杂组合
    it('应检测出手牌有2组四归一，明牌有2个杠，1个刻子和1个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13),
        createPung(TileType.FENG, 1, 17),
        createChow(TileType.WAN, 3, 20)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出超过4组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 7. 测试不同花色组合
    it('应检测出四归一 - 全万子不同点数', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 3, 3, 3, 3, 5, 5, 5, 5, 7, 7, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出四归一 - 全筒子不同点数', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出四归一 - 全条子不同点数', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 1, 1, 1, 3, 3, 3, 3, 7, 7, 7, 7, 9, 9, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 8. 测试风牌组合
    it('应检测出四归一 - 全风牌', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 9. 测试箭牌组合
    it('应检测出四归一 - 全箭牌', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
        ...createTiles(TileType.FENG, [1, 1, 1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 10. 测试字牌和数牌混合
    it('应检测出四归一 - 字牌和数牌混合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.FENG, [1, 1, 1, 1], 5),
        ...createTiles(TileType.JIAN, [1, 1, 1, 1], 9),
        ...createTiles(TileType.TIAO, [9, 9, 9, 9], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 11. 测试不同明暗杠组合
    it('应检测出四归一 - 2个暗杠和2个明杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应检测出四归一 - 4个明杠', () => {
      const handTiles: Tile[] = [];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 1, 1),
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9),
        createKong(TileType.FENG, 1, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 12. 测试边界情况
    it('应检测出四归一 - 恰好4组', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出四归一 - 超过4组(5组)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 13. 测试复杂明暗组合
    it('应检测出四归一 - 手牌2组明牌2组复杂组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createKong(TileType.TONG, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    it('应检测出四归一 - 手牌1组明牌3组复杂组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [9, 9], 5)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15),
        createPung(TileType.WAN, 9, 19)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 14. 测试特殊点数组合
    it('应检测出四归一 - 全部1点', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [1, 1, 1, 1], 5),
        ...createTiles(TileType.TONG, [1, 1, 1, 1], 9),
        ...createTiles(TileType.FENG, [1, 1, 1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
    
    it('应检测出四归一 - 全部9点', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9, 9, 9], 1),
        ...createTiles(TileType.TIAO, [9, 9, 9, 9], 5),
        ...createTiles(TileType.TONG, [9, 9, 9, 9], 9),
        ...createTiles(TileType.JIAN, [3, 3, 3, 3], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 15. 测试额外的四归一组合
    it('应检测出四归一 - 手牌中连续数字四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出四归一 - 手牌中跳跃数字四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 3, 3, 3, 3, 5, 5, 5, 5, 7, 7, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('应检测出四归一 - 混合杠顺子刻子但符合四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3], 9)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TONG, 3, 12),
        createKong(TileType.FENG, 1, 16),
        createPung(TileType.JIAN, 1, 20)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });

  // === 无效四归一场景测试 ===
  describe('无效四归一场景', () => {
    // 1. 少于4组四归一
    it('不应检测出只有3组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出只有2组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出只有1组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出没有四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 2. 刻子不算四归一
    it('不应检测出3组四归一和1组刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出2组四归一和2组刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出1组四归一和3组刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 3. 手牌和明牌组合少于4组四归一
    it('不应检测出手牌有2组四归一和1个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应检测出手牌有1组四归一和2个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应检测出手牌有0组四归一和3个杠', () => {
      const handTiles: Tile[] = [];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 1, 1),
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 4. 混合刻子和顺子的情况
    it('不应检测出手牌有2组四归一，明牌有1个杠，1个刻子和1个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createPung(TileType.TONG, 4, 13),
        createChow(TileType.FENG, 1, 16)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应检测出手牌有1组四归一，明牌有1个杠，2个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 2, 5),
        createPung(TileType.TONG, 3, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 5. 四归一不成立的其他组合
    it('不应检测出手牌全是刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出手牌全是顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出手牌是七对', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出手牌是普通和牌', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 7, 7, 8, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 6. 测试刻子和杠的边界情况
    it('不应检测出手牌有3组四归一，明牌有1个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应检测出手牌有3组四归一，明牌有1个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.TIAO, 4, 13)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 7. 测试更多不满足条件的组合
    it('不应检测出全部花色但只有3组四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2, 2], 5),
        ...createTiles(TileType.TONG, [3, 3, 3, 3], 9),
        ...createTiles(TileType.FENG, [1, 1], 13),
        ...createTiles(TileType.JIAN, [1, 1], 15)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出混合刻子和四归一但不足4组', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.TIAO, [3, 3, 3, 4, 4, 4], 8),
        ...createTiles(TileType.TONG, [5, 5], 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 8. 测试更多杠、刻子和顺子组合
    it('不应检测出1组四归一，1个杠，2个刻子和1个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 2, 5),
        createPung(TileType.TONG, 3, 9),
        createPung(TileType.FENG, 1, 12),
        createChow(TileType.WAN, 4, 15)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('不应检测出2组四归一，2个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1),
        ...createTiles(TileType.TIAO, [3, 3, 3, 4, 4, 4], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 9. 测试更多边界条件
    it('不应检测出只有3组四归一但一组三张', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出有3组四归一但还有单张', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 10. 测试不同花色类型组合
    it('不应检测出3组风牌四归一', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出3组箭牌四归一', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 11. 测试混合牌型
    it('不应检测出混合多种牌型但四归一不足', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3, 4, 5, 6], 8),
        ...createTiles(TileType.FENG, [1, 1], 14)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出普通麻将和牌型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 12. 测试完全不相关的牌型
    it('不应检测出清一色顺子型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8, 9, 7, 8, 9], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出混一色顺子刻子组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 7, 8, 9], 1),
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 13. 测试特殊组合
    it('不应检测出13幺九牌型', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出全双刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2, 4, 4, 4, 6, 6, 6, 8, 8, 8, 8, 8], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 14. 测试看似四归一但实际不是的情况
    it('不应检测出不同种类的牌恰好都有4张', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3, 4], 5),
        ...createTiles(TileType.TONG, [1, 2, 3, 4], 9),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('不应检测出有3组四归一但其余牌不成套', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
        ...createTiles(TileType.TIAO, [1, 2, 3, 4], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 15. 测试明杠组合不足四组
    it('不应检测出手牌有2组四归一，明牌有1个杠和各种碰', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),
        createPung(TileType.TONG, 4, 13),
        createPung(TileType.FENG, 1, 16),
        createPung(TileType.JIAN, 1, 19)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('不应检测出手牌有1组四归一，明牌有0个杠和4个碰', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 2, 5),
        createPung(TileType.TONG, 3, 8),
        createPung(TileType.FENG, 1, 11),
        createPung(TileType.JIAN, 1, 14)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 16. 更多无效场景
    it('不应检测出手牌含有3组三归一和1个单张', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出含有3组三张加1组对子的组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('不应检测出手牌有1组四归一，明牌有2组非四归一组合', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 2, 5),
        createChow(TileType.TONG, 3, 8)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('不应检测出手牌有0组四归一，明牌有复杂组合但无四归一', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 2, 3),
        createPung(TileType.TONG, 3, 6),
        createPung(TileType.FENG, 1, 9),
        createChow(TileType.WAN, 2, 12)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
}); 