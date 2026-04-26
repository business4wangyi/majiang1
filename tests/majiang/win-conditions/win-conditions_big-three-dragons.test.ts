import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet } from '../../../src/majiang/core/rule-types';
import { BigThreeDragonsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_big-three-dragons';
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

describe('BigThreeDragonsDetector', () => {
  let detector: BigThreeDragonsDetector;

  beforeEach(() => {
    detector = new BigThreeDragonsDetector();
  });

  // === 有效大三元场景测试 ===
  describe('Valid Big Three Dragons scenarios', () => {
    // 场景 1: 三个箭牌刻子都在手牌中
    it('should detect with all dragon pungs in hand', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 2: 三个箭牌刻子都在明牌中
    it('should detect with all dragon pungs revealed', () => {
      const handTiles = createTiles(TileType.WAN, [1, 1, 1, 2], 1);
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 1, 5),  // 中
        createPung(TileType.JIAN, 2, 8),  // 发
        createPung(TileType.JIAN, 3, 11)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 3: 部分箭牌刻子在手牌，部分在明牌
    it('should detect with some dragon pungs in hand and some revealed', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 7)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 3, 11)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 4: 一个箭牌刻子，两个箭牌杠
    it('should detect with one dragon pung and two dragon kongs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 4)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 2, 8),  // 发
        createKong(TileType.JIAN, 3, 12)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 5: 三个箭牌杠
    it('should detect with all dragon kongs', () => {
      const handTiles = createTiles(TileType.WAN, [1, 1, 1, 2], 1);
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 1, 5),  // 中
        createKong(TileType.JIAN, 2, 9),  // 发
        createKong(TileType.JIAN, 3, 13)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 6: 手牌中的箭牌刻子 + 明牌中的顺子
    it('should detect with dragon pungs in hand and chow revealed', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [5], 10)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 7: 大三元 + 其他杠
    it('should detect with big three dragons and additional kong', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 1, 10)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 8: 大三元 + 风牌刻子
    it('should detect with big three dragons and wind pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.FENG, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.FENG, 1, 11)  // 东风
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 9: 大三元 + 多个顺子
    it('should detect with big three dragons and multiple chows', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 10),
        createChow(TileType.TIAO, 3, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 10: 大三元混合刻子和杠
    it('should detect with mix of dragon pungs and kongs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1], 7)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 2, 9),  // 发
        createChow(TileType.WAN, 2, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 11: 一刻两杠 + 一对
    it('should detect with one pung, two kongs and a pair', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1], 1),
        ...createTiles(TileType.WAN, [1, 1], 4)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 2, 6),  // 发
        createKong(TileType.JIAN, 3, 10)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 12: 三刻 + 一刻一顺
    it('should detect with three dragon pungs and one pung, one chow', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [5, 5, 5], 10)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 13: 三刻 + 全清一色
    it('should detect with three dragon pungs and pure suited tiles', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 14: 三刻 + 单吊
    it('should detect with three dragon pungs and a waiting tile', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 11),
        createPung(TileType.WAN, 3, 14),
        createPung(TileType.WAN, 4, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 15: 中发在手牌，白在杠
    it('should detect with zhong and fa in hand, bai in kong', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.WAN, [1, 1], 7)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 3, 9),  // 白
        createPung(TileType.WAN, 2, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 16: 中在手牌，发白在杠
    it('should detect with zhong in hand, fa and bai in kongs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1], 1),
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 2], 4)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 2, 9),  // 发
        createKong(TileType.JIAN, 3, 13)  // 白
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 17: 中发在明刻，白在手刻
    it('should detect with zhong and fa in revealed pungs, bai in hand', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 4)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 1, 12),  // 中
        createPung(TileType.JIAN, 2, 15)   // 发
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 18: 大三元 + 边张听牌
    it('should detect with big three dragons and edge waiting', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 2, 3, 3], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 19: 大三元 + 嵌张听牌
    it('should detect with big three dragons and middle waiting', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 3, 4, 6], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 20: 大三元 + 两种花色
    it('should detect with big three dragons and tiles of two suits', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1], 10),
        ...createTiles(TileType.TIAO, [1, 1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 21: 大三元 + 三种花色
    it('should detect with big three dragons and tiles of three suits', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10),
        ...createTiles(TileType.TIAO, [1], 11),
        ...createTiles(TileType.TONG, [1], 12)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 22: 大三元 + 四副明牌
    it('should detect with big three dragons in hand and four revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 2, 11),
        createChow(TileType.TIAO, 3, 14),
        createChow(TileType.TONG, 4, 17),
        createPung(TileType.FENG, 1, 20)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 23: 大三元 + 混一色
    it('should detect with big three dragons and half flush', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 24: 大三元 + 一色三同顺
    it('should detect with big three dragons and three identical chows', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 10),
        createChow(TileType.WAN, 1, 13),
        createChow(TileType.WAN, 1, 16)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 25: 大三元 + 碰碰胡
    it('should detect with big three dragons and all pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 11),
        createPung(TileType.WAN, 3, 14),
        createPung(TileType.WAN, 4, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 26: 大三元 + 全风刻
    it('should detect with big three dragons and all wind pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.FENG, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.FENG, 2, 11),
        createPung(TileType.FENG, 3, 14),
        createPung(TileType.FENG, 4, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 27: 大三元 + 门前清
    it('should detect with big three dragons and concealed hand', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1], 10),
        ...createTiles(TileType.WAN, [2, 3, 4], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    // 场景 28: 大三元 + 一色四同顺
    it('should detect with big three dragons and four identical chows', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 10),
        createChow(TileType.WAN, 1, 13),
        createChow(TileType.WAN, 1, 16),
        createChow(TileType.WAN, 1, 19)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 29: 大三元 + 小三元
    it('should detect with big three dragons and little three dragons', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.FENG, 1, 10),
        createPung(TileType.FENG, 2, 13),
        createPung(TileType.FENG, 3, 16),
        createPung(TileType.FENG, 4, 19)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 30: 大三元 + 全大
    it('should detect with big three dragons and all big numbers', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [7], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 8, 11),
        createPung(TileType.WAN, 9, 14),
        createChow(TileType.TIAO, 7, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 31: 大三元 + 全中
    it('should detect with big three dragons and all middle numbers', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [4], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 5, 11),
        createPung(TileType.WAN, 6, 14),
        createChow(TileType.TIAO, 4, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 32: 大三元 + 全小
    it('should detect with big three dragons and all small numbers', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 11),
        createPung(TileType.WAN, 3, 14),
        createChow(TileType.TIAO, 1, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 33: 大三元 + 一色三步高
    it('should detect with big three dragons and three step chows', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 10),
        createChow(TileType.WAN, 2, 13),
        createChow(TileType.WAN, 3, 16)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 34: 大三元 + 全带幺
    it('should detect with big three dragons and all terminal tiles', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 1, 11),
        createPung(TileType.TIAO, 9, 14),
        createChow(TileType.TONG, 1, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 场景 35: 大三元 + 四杠
    it('should detect with big three dragons and four kongs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1], 10)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 2, 11),
        createKong(TileType.WAN, 3, 15),
        createKong(TileType.WAN, 4, 19),
        createKong(TileType.WAN, 5, 23)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });

  // === 无效大三元场景测试 ===
  describe('Invalid Big Three Dragons scenarios', () => {
    // 场景 1: 只有两种箭牌刻子
    it('should not detect with only two dragon pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 3, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 2: 只有一种箭牌刻子
    it('should not detect with only one dragon pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], 4)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 3: 没有箭牌刻子
    it('should not detect with no dragon pungs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 1)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 4: 有箭牌对子但不是刻子
    it('should not detect with dragon pairs instead of pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 5: 有中发但没有白刻子
    it('should not detect with zhong and fa pungs but no bai pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 6: 有中白但没有发刻子
    it('should not detect with zhong and bai pungs but no fa pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 7: 有发白但没有中刻子
    it('should not detect with fa and bai pungs but no zhong pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 8: 有2种箭牌刻子和1种只有2张
    it('should not detect with two dragon pungs and one dragon pair', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 9: 有1种箭牌刻子和2种只有2张
    it('should not detect with one dragon pung and two dragon pairs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 3], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 10: 有1种箭牌刻子，1种箭牌对子，还有1种只有1张
    it('should not detect with one dragon pung, one dragon pair and one single dragon', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 11: 手牌中有两种箭牌刻子，明牌中没有第三种
    it('should not detect with two dragon pungs in hand and no third dragon in revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 7)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 3, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 12: 有两种箭牌刻子和一种箭牌单张
    it('should not detect with two dragon pungs and one single dragon', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 3], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 13: 箭牌数量不足以组成三种刻子
    it('should not detect with insufficient dragon tiles', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 14: 只有中发白各一张
    it('should not detect with only one of each dragon', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], 4)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 15: 只有中发各两张，白一张
    it('should not detect with two zhong, two fa, one bai', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 6)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 16: 有两种箭牌杠，没有第三种
    it('should not detect with two dragon kongs but no third dragon pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 1, 14),
        createKong(TileType.JIAN, 2, 18)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 17: 有两种箭牌刻子，一种风牌刻子
    it('should not detect with two dragon pungs and one wind pung', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2], 1),
        ...createTiles(TileType.FENG, [1, 1, 1], 7),
        ...createTiles(TileType.WAN, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 18: 手牌中没有箭牌，明牌中只有两种
    it('should not detect with no dragons in hand and only two types in revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 1, 9),
        createPung(TileType.JIAN, 2, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 19: 三种箭牌都只有两张
    it('should not detect with all three dragons as pairs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 20: 完全没有箭牌
    it('should not detect with no dragon tiles at all', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.TIAO, [1, 1, 1, 2], 10)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 21: 只有一种箭牌刻子和一种箭牌杠
    it('should not detect with only one dragon pung and one dragon kong', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3], 4)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 2, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 22: 两种箭牌各只有一张，一种有刻子
    it('should not detect with one dragon pung and two single dragons', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 6)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 23: 三种箭牌各只有一张
    it('should not detect with only one of each dragon type', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], 4)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 24: 有一种箭牌杠，其他两种都没有
    it('should not detect with one dragon kong but no other dragons', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], 5)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 1, 1)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 25: 三种箭牌共只有8张，不足以组成三刻
    it('should not detect with eight dragon tiles but not forming three pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2], 9)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 26: 手牌和明牌中分散的箭牌，没有组成完整的三种刻子
    it('should not detect with scattered dragon tiles between hand and revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 6)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 2, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 27: 有中发白各一张和其他各一张，共六张
    it('should not detect with six dragon tiles (two of each type)', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 28: 有两种箭牌杠，第三种一张都没有
    it('should not detect with two dragon kongs but missing the third type', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 1)
      ];
      const revealedSets: TileSet[] = [
        createKong(TileType.JIAN, 1, 14),
        createKong(TileType.JIAN, 2, 18)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 29: 有一种箭牌四张但分散在手牌和明牌中
    it('should not detect with one dragon type scattered between hand and revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 3, 3, 3], 1), // 只有2张中，3张白
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6], 6)
      ];
      const revealedSets: TileSet[] = [
        createChow(TileType.TIAO, 1, 14),
        createPung(TileType.JIAN, 2, 17) // 发牌刻子
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 30: 箭牌杠被拆分成不同组合
    it('should not detect with dragon kongs split into different combinations', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      const revealedSets: TileSet[] = [
        createPung(TileType.JIAN, 1, 14) // 已经有两张中，再加三张，总共五张
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 场景 31: 三种箭牌都只有对子
    it('should not detect with only pairs of all three dragons', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 32: 三种箭牌分别有1、2、3张
    it('should not detect with one, two, and three tiles of each dragon type', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3], 7)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 33: 只有一张中，但有发白刻子
    it('should not detect with only one zhong but fa and bai pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 34: 只有一张发，但有中白刻子
    it('should not detect with only one fa but zhong and bai pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 3, 3, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 场景 35: 只有一张白，但有中发刻子
    it('should not detect with only one bai but zhong and fa pungs', () => {
      const handTiles = [
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2, 2, 3], 1),
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2], 8)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
}); 