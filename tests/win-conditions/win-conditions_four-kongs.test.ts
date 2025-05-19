import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { FourKongsDetector } from '../../src/win-conditions/win-conditions_four-kongs';
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

describe('FourKongsDetector', () => {
  let detector: FourKongsDetector;

  beforeEach(() => {
    detector = new FourKongsDetector();
  });

  // === 有效四杠子场景测试 ===
  describe('Valid Four Kongs scenarios', () => {
    // 场景 1：四个明杠 - 全部是万子
    it('should detect four revealed kongs with all WAN tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.WAN, 2, 7),
        createKong(TileType.WAN, 3, 11),
        createKong(TileType.WAN, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 2：四个明杠 - 全部是条子
    it('should detect four revealed kongs with all TIAO tiles', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [9, 9], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 1, 3),
        createKong(TileType.TIAO, 3, 7),
        createKong(TileType.TIAO, 5, 11),
        createKong(TileType.TIAO, 7, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 3：四个明杠 - 全部是筒子
    it('should detect four revealed kongs with all TONG tiles', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 1], 1)
      ];
      const revealedSets = [
        createKong(TileType.TONG, 2, 3),
        createKong(TileType.TONG, 4, 7),
        createKong(TileType.TONG, 6, 11),
        createKong(TileType.TONG, 8, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 4：四个明杠 - 混合花色
    it('should detect four revealed kongs with mixed suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 3, 7),
        createKong(TileType.TONG, 5, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 5：四个明杠 - 全部是风牌
    it('should detect four revealed kongs with all wind tiles', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1], 1)
      ];
      const revealedSets = [
        createKong(TileType.FENG, 1, 3),
        createKong(TileType.FENG, 2, 7),
        createKong(TileType.FENG, 3, 11),
        createKong(TileType.FENG, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 6：四个明杠 - 全部是箭牌
    it('should detect four revealed kongs with all dragon tiles', () => {
      const handTiles = [
        ...createTiles(TileType.FENG, [1, 1], 1)
      ];
      const revealedSets = [
        createKong(TileType.JIAN, 1, 3),
        createKong(TileType.JIAN, 2, 7),
        createKong(TileType.JIAN, 3, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 7：四个明杠 - 混合风牌和箭牌
    it('should detect four revealed kongs with mixed wind and dragon tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.FENG, 1, 3),
        createKong(TileType.FENG, 2, 7),
        createKong(TileType.JIAN, 1, 11),
        createKong(TileType.JIAN, 2, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 8：四个明杠 - 混合数牌和字牌
    it('should detect four revealed kongs with mixed number and honor tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.FENG, 1, 11),
        createKong(TileType.JIAN, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 9：四个明杠 - 相同数值不同花色
    it('should detect four revealed kongs with same values across different suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 1, 7),
        createKong(TileType.TONG, 1, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 10：四个明杠 - 连续数值
    it('should detect four revealed kongs with consecutive values', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.WAN, 2, 7),
        createKong(TileType.WAN, 3, 11),
        createKong(TileType.WAN, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 11：三个明杠一个暗杠
    it('should detect three revealed kongs and one concealed kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false; // 暗杠未显露，不计入明杠
    });
    
    // 场景 12：两个明杠两个暗杠
    it('should detect two revealed kongs and two concealed kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 3, 11),
        createKong(TileType.TONG, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false; // 暗杠未显露，不计入
    });
    
    // 场景 13：一个明杠三个暗杠
    it('should detect one revealed kong and three concealed kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false; // 暗杠未显露，不计入
    });
    
    // 场景 14：全部暗杠
    it('should not detect four concealed kongs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5], 1)
      ];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.false; // 暗杠未显露，检测不到
    });
    
    // 场景 15：四个明杠 - 最小值
    it('should detect four revealed kongs with minimum values', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 1, 7),
        createKong(TileType.TONG, 1, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 16：四个明杠 - 最大值
    it('should detect four revealed kongs with maximum values', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 9, 3),
        createKong(TileType.TIAO, 9, 7),
        createKong(TileType.TONG, 9, 11),
        createKong(TileType.FENG, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 17：四个明杠 - 混合碰和杠
    it('should detect four revealed kongs with a mix of pungs and kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 18：三个明杠一个碰 - 刚好不符合
    it('should not detect three revealed kongs and one pung as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createPung(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 19：三个明杠一个吃
    it('should not detect three revealed kongs and one chow as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 20：两个明杠两个碰
    it('should not detect two revealed kongs and two pungs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 11),
        createPung(TileType.FENG, 1, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 21：两个明杠一个碰一个吃
    it('should not detect two kongs, one pung and one chow as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 22：两个明杠两个吃
    it('should not detect two kongs and two chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 23：一个明杠三个碰
    it('should not detect one kong and three pungs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 10),
        createPung(TileType.FENG, 1, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 24：一个明杠两个碰一个吃
    it('should not detect one kong, two pungs and one chow as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 25：一个明杠一个碰两个吃
    it('should not detect one kong, one pung and two chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 26：一个明杠三个吃
    it('should not detect one kong and three chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 27：四个碰 - 没有杠
    it('should not detect four pungs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createPung(TileType.TONG, 3, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 28：三个碰一个吃
    it('should not detect three pungs and one chow as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createPung(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 29：两个碰两个吃
    it('should not detect two pungs and two chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 30：一个碰三个吃
    it('should not detect one pung and three chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 31：四个吃 - 完全没有杠
    it('should not detect four chows as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 32：五个杠（超过四个）
    it('should detect more than four kongs as valid', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15),
        createKong(TileType.JIAN, 1, 19)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false; // 超过四个杠，不符合四杠子定义
    });
    
    // 场景 33：四个不同类型的杠
    it('should detect four different types of kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),    // 万
        createKong(TileType.TIAO, 2, 7),   // 条
        createKong(TileType.TONG, 3, 11),  // 筒
        createKong(TileType.FENG, 1, 15)   // 风
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 34：空手牌，四个明杠
    it('should detect four revealed kongs with empty hand', () => {
      const handTiles: Tile[] = []; // 空手牌
      const revealedSets = [
        createKong(TileType.WAN, 1, 1),
        createKong(TileType.TIAO, 2, 5),
        createKong(TileType.TONG, 3, 9),
        createKong(TileType.FENG, 1, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 场景 35：四个杠 - 全相同类型，如大三元杠
    it('should detect four kongs of same type like big three dragons', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.JIAN, 1, 3),  // 中
        createKong(TileType.JIAN, 2, 7),  // 发
        createKong(TileType.JIAN, 3, 11), // 白
        createKong(TileType.FENG, 1, 15)  // 东
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });

  // === 无效四杠子场景测试 ===
  describe('Invalid Four Kongs scenarios', () => {
    // 场景 1：三个杠 - 数量不足
    it('should not detect three kongs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 2：两个杠 - 数量不足
    it('should not detect two kongs as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 3：一个杠 - 数量不足
    it('should not detect one kong as four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 4：没有杠 - 空明牌区
    it('should not detect with no kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5], 1)
      ];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 5：三个杠一个暗刻 - 手牌中的暗刻不算杠
    it('should not detect three kongs and one concealed pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 2, 6),
        createKong(TileType.TONG, 3, 10),
        createKong(TileType.FENG, 1, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 6：三个杠加手牌中的暗杠 - 手牌中的暗杠不计入
    it('should not detect three kongs and one concealed kong in hand', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 7：三个杠一个明刻
    it('should not detect three kongs and one revealed pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createPung(TileType.FENG, 1, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 8：两个杠两个明刻
    it('should not detect two kongs and two revealed pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 11),
        createPung(TileType.FENG, 1, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 9：一个杠三个明刻
    it('should not detect one kong and three revealed pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 10),
        createPung(TileType.FENG, 1, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 10：四个明刻没有杠
    it('should not detect four revealed pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createPung(TileType.TONG, 3, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 11：三个杠一个顺子
    it('should not detect three kongs and one chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 12：两个杠两个顺子
    it('should not detect two kongs and two chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 13：一个杠三个顺子
    it('should not detect one kong and three chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 14：四个顺子没有杠
    it('should not detect four chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 15：两个杠一个刻一个顺子
    it('should not detect two kongs, one pung and one chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 11),
        createChow(TileType.WAN, 6, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 16：一个杠两个刻一个顺子
    it('should not detect one kong, two pungs and one chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createPung(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 17：一个杠一个刻两个顺子
    it('should not detect one kong, one pung and two chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 7),
        createChow(TileType.TONG, 3, 10),
        createChow(TileType.WAN, 6, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 18：三个刻一个顺子
    it('should not detect three pungs and one chow', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createPung(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 19：两个刻两个顺子
    it('should not detect two pungs and two chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createPung(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 20：一个刻三个顺子
    it('should not detect one pung and three chows', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 1, 3),
        createChow(TileType.TIAO, 2, 6),
        createChow(TileType.TONG, 3, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 21：空牌库
    it('should not detect with empty tiles', () => {
      const handTiles: Tile[] = [];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 22：非法牌型 - 超过四副组合
    it('should handle more than four sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createPung(TileType.FENG, 1, 15),
        createChow(TileType.WAN, 6, 18)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 23：五个杠（超过四个）
    it('should not detect with five kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 2, 7),
        createKong(TileType.TONG, 3, 11),
        createKong(TileType.FENG, 1, 15),
        createKong(TileType.JIAN, 1, 19)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 24：手牌中有杠的形式但未被显露
    it('should not detect with kong pattern in hand but not revealed', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 3, 11),
        createKong(TileType.TONG, 4, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 25：混合牌型但杠不足四个
    it('should not detect with mixed patterns but less than four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 2, 11),
        createKong(TileType.TONG, 3, 15),
        createPung(TileType.FENG, 1, 19)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 26：相同花色但不同数值的三个杠
    it('should not detect three kongs of same suit but different values', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.WAN, 2, 7),
        createKong(TileType.WAN, 3, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 27：相同数值但不同花色的三个杠
    it('should not detect three kongs of same value but different suits', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 1, 7),
        createKong(TileType.TONG, 1, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 28：大三元（三个箭牌刻子）和一个风牌刻子
    it('should not detect big three dragons as four kongs when they are pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.JIAN, 1, 3),
        createPung(TileType.JIAN, 2, 6),
        createPung(TileType.JIAN, 3, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 29：大四喜（四个风牌刻子）
    it('should not detect big four winds as four kongs when they are pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createPung(TileType.FENG, 1, 3),
        createPung(TileType.FENG, 2, 6),
        createPung(TileType.FENG, 3, 9),
        createPung(TileType.FENG, 4, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 30：三个明杠加一个暗刻（看起来像杠但实际是刻）
    it('should not detect three kongs and one concealed pung that looks like kong', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 2, 6),
        createKong(TileType.TONG, 3, 10),
        createKong(TileType.FENG, 1, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 31：只有手牌，没有明牌
    it('should not detect with only hand tiles and no revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4], 1)
      ];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 32：一个杠和七对子
    it('should not detect one kong and seven pairs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7], 1)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 8, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 33：三个杠和十三幺
    it('should not detect three kongs and thirteen orphans', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 2, 14),
        createKong(TileType.TIAO, 2, 18),
        createKong(TileType.TONG, 2, 22)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 34：三个杠一个顺子（看似合规的牌型）
    it('should not detect three kongs and one chow even if it looks valid', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [5, 5], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 3),
        createKong(TileType.TIAO, 3, 7),
        createKong(TileType.TONG, 5, 11),
        createChow(TileType.WAN, 6, 15)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 场景 35：手牌缺少，不够和牌但有四副组合（非四杠）
    it('should not detect with four sets but not all kongs', () => {
      const handTiles: Tile[] = []; // 空手牌
      const revealedSets = [
        createKong(TileType.WAN, 1, 1),
        createKong(TileType.TIAO, 2, 5),
        createPung(TileType.TONG, 3, 9),
        createChow(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
}); 