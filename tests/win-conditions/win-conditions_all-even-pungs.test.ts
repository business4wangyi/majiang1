import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { AllEvenPungsDetector } from '../../src/win-conditions/win-conditions_all-even-pungs';
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

describe('AllEvenPungsDetector', () => {
  let detector: AllEvenPungsDetector;

  beforeEach(() => {
    detector = new AllEvenPungsDetector();
  });

  // 基本功能测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全双刻');
    expect(detector.getDescription()).to.equal('由序数牌2，4，6，8组成的刻子（杠）构成的和牌');
    expect(detector.getScore()).to.equal(24);
  });
  
  // 成功案例：只有手牌，没有明牌
  describe('Hand tiles only (no revealed sets)', () => {
    it('should detect with only even-numbered pungs in hand', () => {
      // 四副偶数刻子（2万、4万、6条、8筒）和一对2条
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2], 1),
        ...createTiles(TileType.WAN, [4, 4, 4], 4),
        ...createTiles(TileType.TIAO, [6, 6, 6], 7),
        ...createTiles(TileType.TONG, [8, 8, 8], 10),
        ...createTiles(TileType.TIAO, [2, 2], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.true;
    });

    it('should not detect with non-even-numbered pungs in hand', () => {
      // 三副偶数刻子（2万、4万、6条）和一副奇数刻子（1筒）和一对2条
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2], 1),
        ...createTiles(TileType.WAN, [4, 4, 4], 4),
        ...createTiles(TileType.TIAO, [6, 6, 6], 7),
        ...createTiles(TileType.TONG, [1, 1, 1], 10),
        ...createTiles(TileType.TIAO, [2, 2], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    it('should not detect with no pungs in hand', () => {
      // 全部是顺子，没有刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TIAO, [2, 3, 4], 7),
        ...createTiles(TileType.TIAO, [5, 6, 7], 10),
        ...createTiles(TileType.TONG, [8, 8], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
  
  // 成功案例：只有明牌，没有手牌刻子
  describe('Revealed sets only', () => {
    it('should detect with only even-numbered pungs and kongs as revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1), // 顺子
        ...createTiles(TileType.TIAO, [9, 9], 4) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 2, 6),  // 2条刻子
        createPung(TileType.TONG, 4, 9),  // 4筒刻子
        createKong(TileType.WAN, 6, 12)   // 6万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    it('should not detect with non-even-numbered pungs in revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1), // 顺子
        ...createTiles(TileType.TIAO, [9, 9], 4) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 2, 6),  // 2条刻子
        createPung(TileType.TONG, 3, 9),  // 3筒刻子 (非偶数)
        createKong(TileType.WAN, 6, 12)   // 6万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('should not detect with no pungs or kongs in revealed sets', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2], 1), // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.TIAO, 1, 3),  // 123条顺子
        createChow(TileType.TONG, 4, 6),  // 456筒顺子
        createChow(TileType.WAN, 6, 9),   // 678万顺子
        createChow(TileType.TIAO, 7, 12)  // 789条顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 混合案例：手牌和明牌组合
  describe('Mixed hand tiles and revealed sets', () => {
    it('should detect with even-numbered pungs in both hand and revealed sets', () => {
      // 手牌中有一个偶数刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2], 1), // 2万刻子
        ...createTiles(TileType.TIAO, [9, 9], 4) // 对子
      ];
      
      // 明牌中有两个偶数刻子/杠
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createKong(TileType.TONG, 8, 9)   // 8筒杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    it('should not detect with non-even-numbered pung in hand', () => {
      // 手牌中有一个非偶数刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 3, 3], 1), // 3万刻子 (非偶数)
        ...createTiles(TileType.TIAO, [9, 9], 4) // 对子
      ];
      
      // 明牌中全是偶数刻子/杠
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createKong(TileType.TONG, 8, 9)   // 8筒杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('should not detect with non-even-numbered pung in revealed sets', () => {
      // 手牌中有一个偶数刻子
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2], 1), // 2万刻子
        ...createTiles(TileType.TIAO, [9, 9], 4) // 对子
      ];
      
      // 明牌中有一个非偶数刻子
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 5, 6),  // 5条刻子 (非偶数)
        createKong(TileType.TONG, 8, 9)   // 8筒杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 测试各种组合的吃、碰、杠情况
  describe('Various combinations of chows, pungs, and kongs', () => {
    // 0吃4碰0杠
    it('should detect with 0 chows, 4 pungs, 0 kongs - all even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 3),  // 2万刻子
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createPung(TileType.TONG, 6, 9),  // 6筒刻子
        createPung(TileType.WAN, 8, 12)   // 8万刻子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 1吃2碰1杠
    it('should detect with 1 chow, 2 pungs, 1 kong - all pungs/kongs even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),   // 123万顺子
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createPung(TileType.TONG, 6, 9),  // 6筒刻子
        createKong(TileType.WAN, 8, 12)   // 8万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 2吃1碰1杠
    it('should detect with 2 chows, 1 pung, 1 kong - pung and kong even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),   // 123万顺子
        createChow(TileType.TIAO, 5, 6),  // 567条顺子
        createPung(TileType.TONG, 4, 9),  // 4筒刻子
        createKong(TileType.WAN, 8, 12)   // 8万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 3吃1碰0杠
    it('should detect with 3 chows, 1 pung, 0 kongs - pung even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),   // 123万顺子
        createChow(TileType.TIAO, 5, 6),  // 567条顺子
        createChow(TileType.TONG, 7, 9),  // 789筒顺子
        createPung(TileType.WAN, 4, 12)   // 4万刻子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 4吃0碰0杠
    it('should not detect with 4 chows, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 1, 3),   // 123万顺子
        createChow(TileType.TIAO, 4, 6),  // 456条顺子
        createChow(TileType.TONG, 7, 9),  // 789筒顺子
        createChow(TileType.WAN, 4, 12)   // 456万顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 0吃0碰4杠
    it('should detect with 0 chows, 0 pungs, 4 kongs - all even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.WAN, 2, 3),   // 2万杠
        createKong(TileType.TIAO, 4, 7),  // 4条杠
        createKong(TileType.TONG, 6, 11), // 6筒杠
        createKong(TileType.WAN, 8, 15)   // 8万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 混合手牌刻子和明牌
    it('should detect with hand pungs and revealed pungs - all even-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2, 2], 1), // 2万刻子
        ...createTiles(TileType.TIAO, [4, 4, 4], 4), // 4条刻子
        ...createTiles(TileType.WAN, [9, 9], 7) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TONG, 6, 9),  // 6筒刻子
        createKong(TileType.WAN, 8, 12)   // 8万杠
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 特殊情况：只有一个偶数刻子
    it('should detect with only one even-numbered pung', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1), // 123万顺子
        ...createTiles(TileType.TIAO, [4, 5, 6], 4), // 456条顺子
        ...createTiles(TileType.TONG, [7, 8, 9], 7), // 789筒顺子
        ...createTiles(TileType.WAN, [9, 9], 10) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 8, 12)  // 8条刻子 (偶数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 0吃0碰0杠 - 不能胡
    it('should not detect with 0 chows, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TIAO, [2, 3, 4], 7),
        ...createTiles(TileType.TIAO, [5, 6, 7], 10),
        ...createTiles(TileType.TONG, [8, 8], 13)
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });

    // 0吃0碰1杠 - 不能胡
    it('should not detect with 0 chows, 0 pungs, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TIAO, [2, 3, 4], 7),
        ...createTiles(TileType.TONG, [8, 8], 10)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 5, 12)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃1碰0杠 - 不能胡
    it('should not detect with 0 chows, 1 pung, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TIAO, [2, 3, 4], 7),
        ...createTiles(TileType.TONG, [8, 8], 10)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 5, 12)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃0碰0杠 - 不能胡
    it('should not detect with 1 chow, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4], 4),
        ...createTiles(TileType.TONG, [8, 8], 7)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 10)  // 456万顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃2碰0杠 - 不能胡
    it('should not detect with 0 chows, 2 pungs, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TONG, [8, 8], 7)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 3, 9),  // 3条刻子 (奇数)
        createPung(TileType.TIAO, 5, 12)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃0碰2杠 - 不能胡
    it('should not detect with 0 chows, 0 pungs, 2 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.WAN, [4, 5, 6], 4),
        ...createTiles(TileType.TONG, [8, 8], 7)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 9),  // 3条杠 (奇数)
        createKong(TileType.TIAO, 5, 13)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃1碰0杠 - 不能胡
    it('should not detect with 1 chow, 1 pung, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4], 4),
        ...createTiles(TileType.TONG, [8, 8], 7)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 9),  // 456万顺子
        createPung(TileType.TIAO, 5, 12)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃0碰1杠 - 不能胡
    it('should not detect with 1 chow, 0 pungs, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4], 4),
        ...createTiles(TileType.TONG, [8, 8], 7)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 9),  // 456万顺子
        createKong(TileType.TIAO, 5, 12)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2吃0碰0杠 - 不能胡
    it('should not detect with 2 chows, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createChow(TileType.TIAO, 5, 12)  // 567条顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃3碰0杠 - 不能胡
    it('should not detect with 0 chows, 3 pungs, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 3, 6),  // 3条刻子 (奇数)
        createPung(TileType.TIAO, 5, 9),  // 5条刻子 (奇数)
        createPung(TileType.TIAO, 7, 12)  // 7条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃0碰3杠 - 不能胡
    it('should not detect with 0 chows, 0 pungs, 3 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createKong(TileType.TIAO, 3, 6),  // 3条杠 (奇数)
        createKong(TileType.TIAO, 5, 10),  // 5条杠 (奇数)
        createKong(TileType.TIAO, 7, 14)  // 7条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃2碰0杠 - 不能胡
    it('should not detect with 1 chow, 2 pungs, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createPung(TileType.TIAO, 3, 9),  // 3条刻子 (奇数)
        createPung(TileType.TIAO, 5, 12)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃0碰2杠 - 不能胡
    it('should not detect with 1 chow, 0 pungs, 2 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createKong(TileType.TIAO, 3, 9),  // 3条杠 (奇数)
        createKong(TileType.TIAO, 5, 13)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2吃1碰0杠 - 不能胡
    it('should not detect with 2 chows, 1 pung, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createPung(TileType.TIAO, 5, 12)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2吃0碰1杠 - 不能胡
    it('should not detect with 2 chows, 0 pungs, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createKong(TileType.TIAO, 5, 12)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 3吃0碰0杠 - 不能胡
    it('should not detect with 3 chows, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createChow(TileType.TIAO, 5, 12)  // 567条顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃2碰1杠 - 不能胡
    it('should not detect with 0 chows, 2 pungs, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 3, 6),  // 3条刻子 (奇数)
        createPung(TileType.TIAO, 5, 9),  // 5条刻子 (奇数)
        createKong(TileType.TIAO, 7, 12)  // 7条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0吃1碰2杠 - 不能胡
    it('should not detect with 0 chows, 1 pung, 2 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.TIAO, 3, 6),  // 3条刻子 (奇数)
        createKong(TileType.TIAO, 5, 9),  // 5条杠 (奇数)
        createKong(TileType.TIAO, 7, 13)  // 7条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1吃1碰1杠 - 不能胡
    it('should not detect with 1 chow, 1 pung, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createPung(TileType.TIAO, 3, 9),  // 3条刻子 (奇数)
        createKong(TileType.TIAO, 5, 12)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2吃2碰0杠 - 不能胡
    it('should not detect with 2 chows, 2 pungs, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createPung(TileType.TIAO, 3, 12),  // 3条刻子 (奇数)
        createPung(TileType.TIAO, 5, 15)  // 5条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2吃0碰2杠 - 不能胡
    it('should not detect with 2 chows, 0 pungs, 2 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createKong(TileType.TIAO, 3, 12),  // 3条杠 (奇数)
        createKong(TileType.TIAO, 5, 16)  // 5条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 3吃1碰0杠 - 不能胡
    it('should not detect with 3 chows, 1 pung, 0 kongs - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createChow(TileType.TIAO, 5, 12),  // 567条顺子
        createPung(TileType.TIAO, 7, 15)  // 7条刻子 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 3吃0碰1杠 - 不能胡
    it('should not detect with 3 chows, 0 pungs, 1 kong - odd-numbered', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createChow(TileType.TIAO, 5, 12),  // 567条顺子
        createKong(TileType.TIAO, 7, 15)  // 7条杠 (奇数)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 4吃0碰0杠 - 不能胡
    it('should not detect with 4 chows, 0 pungs, 0 kongs - no pungs or kongs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3], 1),
        ...createTiles(TileType.TONG, [8, 8], 4)
      ];
      
      const revealedSets: TileSet[] = [
        createChow(TileType.WAN, 4, 6),  // 456万顺子
        createChow(TileType.TIAO, 2, 9),  // 234条顺子
        createChow(TileType.TIAO, 5, 12),  // 567条顺子
        createChow(TileType.TIAO, 7, 15)  // 789条顺子
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
  
  // 测试边界情况
  describe('Edge cases', () => {
    it('should not detect without any tiles', () => {
      expect(detector.detect([], [])).to.be.false;
    });
    
    it('should not detect with only pairs', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2], 1),
        ...createTiles(TileType.TIAO, [4, 4], 3),
        ...createTiles(TileType.TONG, [6, 6], 5),
        ...createTiles(TileType.WAN, [8, 8], 7),
        ...createTiles(TileType.TIAO, [2, 2], 9),
        ...createTiles(TileType.TONG, [4, 4], 11),
        ...createTiles(TileType.WAN, [6, 6], 13),
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    it('should not detect with 9 value tiles (out of range)', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 3),  // 2万刻子
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createPung(TileType.TONG, 6, 9),  // 6筒刻子
        createPung(TileType.WAN, 9, 12)   // 9万刻子 (非偶数2468范围)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    it('should not detect with honor tiles', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [9, 9], 1) // 对子
      ];
      
      const revealedSets: TileSet[] = [
        createPung(TileType.WAN, 2, 3),   // 2万刻子
        createPung(TileType.TIAO, 4, 6),  // 4条刻子
        createPung(TileType.TONG, 6, 9),  // 6筒刻子
        createPung(TileType.FENG, 1, 12)  // 东风刻子 (字牌)
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
}); 