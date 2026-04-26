import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, TileSetType, TileSetSource } from '../../../src/majiang/core/rule-types';
import { KnittedStraightDetector } from '../../../src/majiang/core/win-conditions/win-conditions_knitted-straight';
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
    type: 'PENG' as TileSetType,
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
    type: 'CHI' as TileSetType,
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
    type: 'GANG' as TileSetType,
    source,
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2),
      new Tile(type, value, startId + 3)
    ]
  };
}

/**
 * 用于调试的辅助函数，输出手牌和明牌的内容
 */
function debugPrintTiles(handTiles: Tile[], revealedSets: TileSet[] = []) {
  console.log("手牌:", handTiles.map(t => `${t.type}${t.value}`).join(", "));
  
  if (revealedSets.length > 0) {
    console.log("明牌组合:");
    revealedSets.forEach((set, i) => {
      console.log(`  组合${i+1} (${set.type}):`, set.tiles.map(t => `${t.type}${t.value}`).join(", "));
    });
  }
}

describe('KnittedStraightDetector', () => {
  let detector: KnittedStraightDetector;

  beforeEach(() => {
    detector = new KnittedStraightDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('组合龙');
    expect(detector.getDescription()).to.equal('三种花色的数牌按照特定组合形成的特殊牌型');
    expect(detector.getScore()).to.equal(24);
  });

  // 基本组合龙牌型测试
  describe('Basic Knitted Straight patterns', () => {
    // 组合1: 万(1,4,7) + 条(2,5,8) + 筒(3,6,9)
    it('should detect Pattern 1: WAN(1,4,7) + TIAO(2,5,8) + TONG(3,6,9)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合2: 万(2,5,8) + 条(3,6,9) + 筒(1,4,7)
    it('should detect Pattern 2: WAN(2,5,8) + TIAO(3,6,9) + TONG(1,4,7)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 5, 8], 1),
        ...createTiles(TileType.TIAO, [3, 6, 9], 4),
        ...createTiles(TileType.TONG, [1, 4, 7], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合3: 万(3,6,9) + 条(1,4,7) + 筒(2,5,8)
    it('should detect Pattern 3: WAN(3,6,9) + TIAO(1,4,7) + TONG(2,5,8)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 6, 9], 1),
        ...createTiles(TileType.TIAO, [1, 4, 7], 4),
        ...createTiles(TileType.TONG, [2, 5, 8], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 添加更多能胡牌的组合龙模式变种
    // 组合1变种: 万(1,4,7) + 条(2,5,8) + 筒(3,6,9) + 不同位置的对子
    it('should detect Pattern 1 with pair in different position', () => {
      const handTiles = [
        ...createPair(TileType.FENG, 1, 1), // 对子在前面
        ...createTiles(TileType.WAN, [1, 4, 7], 3),
        ...createTiles(TileType.TIAO, [2, 5, 8], 6),
        ...createTiles(TileType.TONG, [3, 6, 9], 9)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合2变种: 万(2,5,8) + 条(3,6,9) + 筒(1,4,7) + 混乱顺序
    it('should detect Pattern 2 with shuffled tiles', () => {
      const handTiles = [
        new Tile(TileType.TONG, 1, 1),
        new Tile(TileType.WAN, 2, 2),
        new Tile(TileType.TIAO, 3, 3),
        new Tile(TileType.TONG, 4, 4),
        new Tile(TileType.WAN, 5, 5),
        new Tile(TileType.TIAO, 6, 6),
        new Tile(TileType.TONG, 7, 7),
        new Tile(TileType.WAN, 8, 8),
        new Tile(TileType.TIAO, 9, 9),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合3变种: 万(3,6,9) + 条(1,4,7) + 筒(2,5,8) + 牌有重复
    it('should detect Pattern 3 with duplicate tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 6, 9, 3], 1), // 万3重复
        ...createTiles(TileType.TIAO, [1, 4, 7], 5),
        ...createTiles(TileType.TONG, [2, 5, 8], 8),
        ...createPair(TileType.FENG, 1, 11) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 不符合组合龙的牌型
    it('should not detect non-knitted straight pattern', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 8], 1), // 7 变成 8
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 有明牌的情况（组合龙要求门前清）
    it('should not detect with revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createPair(TileType.FENG, 1, 9) // 对子
      ];
      
      const revealedSets = [
        createPung(TileType.WAN, 7, 11) // 万7刻子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  // 对子变化测试
  describe('Different pairs with knitted straight', () => {
    // 数牌对子
    it('should detect with a numbered pair (WAN)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 2, 2], 1), // 带万2对子
        ...createTiles(TileType.TIAO, [2, 5, 8], 6),
        ...createTiles(TileType.TONG, [3, 6, 9], 9)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 数牌对子 (条)
    it('should detect with a numbered pair (TIAO)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8, 3, 3], 4), // 带条3对子
        ...createTiles(TileType.TONG, [3, 6, 9], 9)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 数牌对子 (筒)
    it('should detect with a numbered pair (TONG)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9, 5, 5], 7) // 带筒5对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 风牌对子
    it('should detect with a wind pair', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 2, 10) // 东风对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 箭牌对子
    it('should detect with a dragon pair', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.JIAN, 1, 10) // 中对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // 新增：更多对子变化测试
  describe('Additional pair variations', () => {
    // 相同花色不同数值的对子
    it('should detect with different numbered pairs in same suit (WAN)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 3, 3], 1), // 带万3对子
        ...createTiles(TileType.TIAO, [2, 5, 8], 6),
        ...createTiles(TileType.TONG, [3, 6, 9], 9)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 不同风牌对子
    it('should detect with different wind pairs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 3, 10) // 西风对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 不同箭牌对子
    it('should detect with different dragon pairs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.JIAN, 2, 10) // 发对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙中的牌作为对子 (1)
    it('should detect with pair from knitted straight (WAN 1)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 1], 1), // 额外的万1
        ...createTiles(TileType.TIAO, [2, 5, 8], 5),
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        new Tile(TileType.WAN, 1, 11) // 第三个万1，形成对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙中的牌作为对子 (2)
    it('should detect with pair from knitted straight (TIAO 5)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8, 5], 4), // 额外的条5
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        new Tile(TileType.TIAO, 5, 11) // 第三个条5，形成对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙中的牌作为对子 (3)
    it('should detect with pair from knitted straight (TONG 9)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9, 9], 7), // 额外的筒9
        new Tile(TileType.TONG, 9, 11) // 第三个筒9，形成对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // 额外测试 - 缺失牌测试
  describe('Missing tiles tests', () => {
    // 缺少一张组合龙牌
    it('should not detect with one missing tile', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createPair(TileType.FENG, 1, 9), // 对子
        new Tile(TileType.WAN, 2, 11) // 额外的牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 缺少多张组合龙牌
    it('should not detect with multiple missing tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5], 3), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 5),
        ...createPair(TileType.FENG, 1, 8), // 对子
        ...createTiles(TileType.WAN, [2, 2], 10) // 额外的牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });

  // 新增：更多混合牌型测试
  describe('Additional mixed pattern tests', () => {
    // 组合龙 + 刻子（万）
    it('should detect with extra pung (WAN)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 2, 2, 2], 1), // 额外的万2刻子
        ...createTiles(TileType.TIAO, [2, 5, 8], 7),
        ...createTiles(TileType.TONG, [3, 6, 9], 10)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 刻子（条）
    it('should detect with extra pung (TIAO)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8, 4, 4, 4], 4), // 额外的条4刻子
        ...createTiles(TileType.TONG, [3, 6, 9], 10)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 刻子（筒）
    it('should detect with extra pung (TONG)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9, 1, 1, 1], 7) // 额外的筒1刻子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 刻子（风）
    it('should detect with extra pung (wind)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [1, 1, 1], 10) // 额外的东风刻子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 刻子（箭）
    it('should detect with extra pung (dragon)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.JIAN, [1, 1, 1], 10) // 额外的中刻子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 顺子（万）
    it('should detect with extra chow (WAN 1-2-3)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 1, 2, 3], 1), // 额外的1-2-3万顺子
        ...createTiles(TileType.TIAO, [2, 5, 8], 7),
        ...createTiles(TileType.TONG, [3, 6, 9], 10)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 顺子（条）
    it('should detect with extra chow (TIAO 4-5-6)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8, 4, 5, 6], 4), // 额外的4-5-6条顺子
        ...createTiles(TileType.TONG, [3, 6, 9], 10)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 顺子（筒）
    it('should detect with extra chow (TONG 7-8-9)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9, 7, 8, 9], 7) // 额外的7-8-9筒顺子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // 新增：更多不能胡牌的测试
  describe('Additional invalid patterns (should not detect)', () => {
    // 部分组合龙 + 无关的牌
    it('should not detect with partial knitted straight and unrelated tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 9) // 四张不同的风牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 不符合任何组合龙模式，但总数正确
    it('should not detect with wrong pattern but correct count', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 9], 1), // 错误：9代替7
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 7], 7), // 错误：7代替9
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 花色不符合组合龙要求
    it('should not detect with wrong suit arrangement', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [3, 6, 9], 4), // 错误：应该是2,5,8
        ...createTiles(TileType.TONG, [2, 5, 8], 7), // 错误：应该是3,6,9
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 组合龙数字顺序错误
    it('should not detect with wrong number sequence', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 8], 1), // 错误：8代替7
        ...createTiles(TileType.TIAO, [2, 6, 8], 4), // 错误：6代替5
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 重复花色
    it('should not detect with duplicate suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.WAN, [2, 5, 8], 4), // 错误：应该是条，不是万
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 缺少花色
    it('should not detect with missing suit', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.WAN, [2, 5, 8], 4), // 错误：应该是条，不是万
        ...createTiles(TileType.WAN, [3, 6, 9], 7), // 错误：应该是筒，不是万
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 组合龙牌 + 多个对子
    it('should not detect with multiple pairs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5], 4), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createPair(TileType.FENG, 1, 9), // 对子1
        ...createPair(TileType.FENG, 2, 11) // 对子2
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 异常和边界情况
    it('should not detect with too many tiles', () => {
      // 创建15张牌（超过正常的14张）
      const handTiles = [
        // 不完整的组合龙牌型
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        // 额外的牌，使其无法构成有效牌型
        ...createTiles(TileType.WAN, [2, 2, 2, 3, 3, 3], 9) // 两组刻子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 组合龙牌型不完整（缺少多张）
    it('should not detect with multiple missing tiles in different suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 7], 1), // 缺少万4
        ...createTiles(TileType.TIAO, [2, 8], 3), // 缺少条5
        ...createTiles(TileType.TONG, [3, 6], 5), // 缺少筒9
        ...createPair(TileType.FENG, 1, 7), // 对子
        ...createTiles(TileType.FENG, [2, 3, 4], 9) // 随机风牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 组合龙缺少部分但有顺子代替
    it('should not detect with missing parts replaced by chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 3], 1), // 缺少万4和7
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createTiles(TileType.WAN, [6, 7, 8], 9), // 顺子代替万7
        ...createPair(TileType.FENG, 1, 12) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 牌数不足
    it('should not detect with insufficient tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        // 缺少对子
      ];
      
      // 虽然没有对子，但是组合龙牌已经有9张，已经可以胡牌了
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 添加更多明牌测试
    // 组合龙 + 明牌（1副补杠）
    it('should not detect with 1 revealed added kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5], 4), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createPair(TileType.FENG, 1, 9) // 对子
      ];
      const revealedSets = [
        {
          type: 'GANG' as TileSetType,
          source: 'bu' as TileSetSource,
          tiles: [
            new Tile(TileType.TIAO, 8, 11),
            new Tile(TileType.TIAO, 8, 12),
            new Tile(TileType.TIAO, 8, 13),
            new Tile(TileType.TIAO, 8, 14)
          ]
        }
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 组合龙 + 明牌（1副暗杠）
    it('should not detect with 1 revealed concealed kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5], 4), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 6),
        ...createPair(TileType.FENG, 1, 9) // 对子
      ];
      const revealedSets = [
        {
          type: 'GANG' as TileSetType,
          source: 'an' as TileSetSource,
          tiles: [
            new Tile(TileType.TIAO, 8, 11),
            new Tile(TileType.TIAO, 8, 12),
            new Tile(TileType.TIAO, 8, 13),
            new Tile(TileType.TIAO, 8, 14)
          ]
        }
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 组合龙 + 明牌（混合杠类型）
    it('should not detect with mixed kong types', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5], 3), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 5),
        ...createPair(TileType.FENG, 1, 8) // 对子
      ];
      const revealedSets = [
        createKong(TileType.WAN, 7, 10, 'ming'),
        createKong(TileType.TIAO, 8, 14, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 组合龙 + 明牌（4副混合）
    it('should not detect with 4 revealed sets', () => {
      const handTiles = [
        ...createPair(TileType.FENG, 1, 1) // 只有对子
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 3, 6),
        createPung(TileType.TONG, 6, 9),
        createKong(TileType.FENG, 2, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  // 特殊牌型和边界情况测试
  describe('Special cases and edge conditions', () => {
    // 空手牌
    it('should not detect with empty hand tiles', () => {
      expect(detector.detect([], [])).to.be.false;
    });
    
    // 只有组合龙的牌，没有对子
    it('should detect with only knitted straight tiles and no pair', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
    
    // 组合龙重复牌测试
    it('should detect with duplicate knitted straight tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 4, 7], 1), // 两个1万
        ...createTiles(TileType.TIAO, [2, 5, 8], 5),
        ...createTiles(TileType.TONG, [3, 6, 9], 8),
        ...createPair(TileType.FENG, 1, 11) // 对子
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
    
    // 特殊牌序
    it('should detect knitted straight with tiles in special order', () => {
      // 牌的顺序是乱的
      const handTiles = [
        new Tile(TileType.FENG, 1, 1), // 对子的第一张
        new Tile(TileType.WAN, 7, 2),
        new Tile(TileType.TONG, 3, 3),
        new Tile(TileType.TIAO, 8, 4),
        new Tile(TileType.WAN, 1, 5),
        new Tile(TileType.TONG, 9, 6),
        new Tile(TileType.TIAO, 2, 7),
        new Tile(TileType.WAN, 4, 8),
        new Tile(TileType.TONG, 6, 9),
        new Tile(TileType.TIAO, 5, 10),
        new Tile(TileType.FENG, 1, 11) // 对子的第二张
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
    
    // 组合龙 + 额外的暗杠
    it('should detect with extra concealed kong in hand tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.FENG, [2, 2, 2, 2], 10) // 额外的四个东风牌
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // 新增：更多能胡牌场景
  describe('Additional win scenarios', () => {
    // 组合龙 + 暗杠（数牌）
    it('should detect with concealed kong (numbered tile) in hand', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createTiles(TileType.WAN, [2, 2, 2, 2], 10) // 万2暗杠
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 顺子 + 对子
    it('should detect with chow and pair', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7, 1, 2, 3], 1), // 万1-2-3顺子
        ...createTiles(TileType.TIAO, [2, 5, 8], 7),
        ...createTiles(TileType.TONG, [3, 6, 9], 10),
        ...createPair(TileType.FENG, 1, 13) // 东风对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 刻子 + 对子
    it('should detect with pung and pair', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9, 4, 4, 4], 7), // 筒4刻子
        ...createPair(TileType.FENG, 1, 13) // 东风对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 完整组合龙 + 不同位置的对子
    it('should detect with pair in the middle', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1),
        ...createPair(TileType.FENG, 1, 3), // 对子在中间
        ...createTiles(TileType.WAN, [7], 5),
        ...createTiles(TileType.TIAO, [2, 5, 8], 6),
        ...createTiles(TileType.TONG, [3, 6, 9], 9)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 组合龙 + 特殊牌序（每种花色交替）
    it('should detect with alternating suit order', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.TIAO, 2, 2),
        new Tile(TileType.TONG, 3, 3),
        new Tile(TileType.WAN, 4, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.TONG, 6, 6),
        new Tile(TileType.WAN, 7, 7),
        new Tile(TileType.TIAO, 8, 8),
        new Tile(TileType.TONG, 9, 9),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.true;
    });
  });

  // 新增：更多不能胡牌场景
  describe('Additional invalid scenarios', () => {
    // 部分组合龙 + 部分其他牌型
    it('should not detect with partial knitted straight and partial other pattern', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5], 3), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6, 9], 5),
        ...createTiles(TileType.WAN, [5, 6, 7], 8), // 部分顺子
        ...createPair(TileType.FENG, 1, 11) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 数值错误的组合龙
    it('should not detect with wrong values in pattern 1', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 5, 7], 1), // 错误：5代替4
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 数值错误的组合龙 2
    it('should not detect with wrong values in pattern 2', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 5, 9], 1), // 错误：9代替8
        ...createTiles(TileType.TIAO, [3, 6, 9], 4),
        ...createTiles(TileType.TONG, [1, 4, 7], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 数值错误的组合龙 3
    it('should not detect with wrong values in pattern 3', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 7, 9], 1), // 错误：7代替6
        ...createTiles(TileType.TIAO, [1, 4, 7], 4),
        ...createTiles(TileType.TONG, [2, 5, 8], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 混合了两种组合龙模式但都不完整
    it('should not detect with mixed incomplete patterns', () => {
      const handTiles = [
        // 部分模式1
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5], 3), // 缺少条8
        // 部分模式2
        ...createTiles(TileType.TONG, [1, 4], 5), // 缺少筒7
        ...createTiles(TileType.WAN, [2, 5], 7), // 缺少万8
        ...createPair(TileType.FENG, 1, 9) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 花色完全错误
    it('should not detect with completely wrong suits', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 2, 3], 1), // 风牌代替万
        ...createTiles(TileType.JIAN, [1, 2, 3], 4), // 箭牌代替条
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 4, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 部分花色错误
    it('should not detect with partially wrong suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4, 7], 1),
        ...createTiles(TileType.FENG, [1, 2, 3], 4), // 风牌代替条
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 4, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 所有牌都是正确花色和数值，但每种只有一张
    it('should not detect with single tiles of correct pattern', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 4, 2),
        new Tile(TileType.WAN, 7, 3),
        new Tile(TileType.TIAO, 2, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.TIAO, 8, 6),
        new Tile(TileType.TONG, 3, 7),
        new Tile(TileType.TONG, 6, 8),
        // 缺少筒9
        ...createPair(TileType.FENG, 1, 9), // 对子
        ...createTiles(TileType.WAN, [8, 8, 8], 11) // 额外的刻子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 完全杂乱的手牌
    it('should not detect with completely random tiles', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.TIAO, 9, 2),
        new Tile(TileType.TONG, 5, 3),
        new Tile(TileType.FENG, 2, 4),
        new Tile(TileType.JIAN, 3, 5),
        new Tile(TileType.WAN, 6, 6),
        new Tile(TileType.TIAO, 3, 7),
        new Tile(TileType.TONG, 7, 8),
        new Tile(TileType.FENG, 3, 9),
        new Tile(TileType.JIAN, 1, 10),
        new Tile(TileType.WAN, 8, 11),
        new Tile(TileType.TIAO, 4, 12),
        new Tile(TileType.TONG, 2, 13),
        new Tile(TileType.FENG, 4, 14)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 正确花色，全错数值
    it('should not detect with correct suits but all wrong values', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 6, 8], 1), // 应该是1,4,7
        ...createTiles(TileType.TIAO, [1, 6, 9], 4), // 应该是2,5,8
        ...createTiles(TileType.TONG, [2, 5, 7], 7), // 应该是3,6,9
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 部分数牌，部分字牌
    it('should not detect with mix of numbered and honor tiles instead of knitted straight', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 万牌
        ...createTiles(TileType.TIAO, [2, 5], 3), // 条牌
        ...createTiles(TileType.TONG, [3], 5), // 筒牌
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 6), // 风牌
        ...createTiles(TileType.JIAN, [1, 2, 3], 10) // 箭牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 非法牌型 + 明杠
    it('should not detect invalid pattern with a revealed kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5, 8], 3),
        ...createTiles(TileType.TONG, [3, 6], 6), // 缺少筒9
        ...createPair(TileType.FENG, 1, 8) // 对子
      ];
      const revealedSets = [
        createKong(TileType.WAN, 3, 10, 'ming'), // 无关的明杠
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 换牌测试：用其它牌代替组合龙中的特定牌
    it('should not detect with replacement tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 4, 7], 1), // 错误：2代替1
        ...createTiles(TileType.TIAO, [2, 5, 8], 4),
        ...createTiles(TileType.TONG, [3, 6, 9], 7),
        ...createPair(TileType.FENG, 1, 10) // 对子
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 与七对子混合
    it('should not detect with seven pairs style', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1), new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 4, 3), new Tile(TileType.WAN, 4, 4),
        new Tile(TileType.WAN, 7, 5), new Tile(TileType.WAN, 7, 6),
        new Tile(TileType.TIAO, 2, 7), new Tile(TileType.TIAO, 2, 8),
        new Tile(TileType.TIAO, 5, 9), new Tile(TileType.TIAO, 5, 10),
        new Tile(TileType.TIAO, 8, 11), new Tile(TileType.TIAO, 8, 12),
        new Tile(TileType.TONG, 3, 13), new Tile(TileType.TONG, 3, 14)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 与清一色混合
    it('should not detect with pure suit', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1), new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 2, 3), new Tile(TileType.WAN, 3, 4),
        new Tile(TileType.WAN, 4, 5), new Tile(TileType.WAN, 5, 6),
        new Tile(TileType.WAN, 6, 7), new Tile(TileType.WAN, 7, 8),
        new Tile(TileType.WAN, 7, 9), new Tile(TileType.WAN, 8, 10),
        new Tile(TileType.WAN, 8, 11), new Tile(TileType.WAN, 9, 12),
        new Tile(TileType.WAN, 9, 13), new Tile(TileType.WAN, 9, 14)
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 字牌过多
    it('should not detect with too many honor tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 4], 1), // 缺少万7
        ...createTiles(TileType.TIAO, [2, 5], 3), // 缺少条8
        ...createTiles(TileType.TONG, [3, 6], 5), // 缺少筒9
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3], 7) // 太多字牌
      ];
      
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
}); 