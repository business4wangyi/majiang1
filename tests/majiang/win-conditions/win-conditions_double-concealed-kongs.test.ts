import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet, TileSetType } from '../../src/majiang/rule-types';
import { DoubleConcealedKongsDetector } from '../../src/majiang/win-conditions/win-conditions_double-concealed-kongs';
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

describe('DoubleConcealedKongsDetector', () => {
  let detector: DoubleConcealedKongsDetector;

  beforeEach(() => {
    detector = new DoubleConcealedKongsDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('双暗杠');
    expect(detector.getDescription()).to.equal('和牌中有两副暗杠');
    expect(detector.getScore()).to.equal(16);
  });
  
  describe('Valid Double Concealed Kongs Patterns', () => {
    // 1. 两个暗杠 + 一个对子
    it('should detect with two concealed kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 2. 两个暗杠 + 一个明杠 + 一个对子
    it('should detect with two concealed kongs, one exposed kong, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createKong(TileType.WAN, 4, 11, 'ming')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 3. 两个暗杠 + 一个刻子 + 一个对子
    it('should detect with two concealed kongs, one pung, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createPung(TileType.WAN, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 4. 两个暗杠 + 一个顺子 + 一个对子
    it('should detect with two concealed kongs, one chow, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createChow(TileType.WAN, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 5. 三个暗杠 + 一个对子
    it('should detect with three concealed kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createKong(TileType.WAN, 4, 11, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 6. 四个暗杠 + 一个对子 (理论上可能，实际麻将中不常见)
    it('should detect with four concealed kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createKong(TileType.WAN, 4, 11, 'an'),
        createKong(TileType.WAN, 5, 15, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 7. 两个暗杠 + 两个刻子 + 一个对子
    it('should detect with two concealed kongs, two pungs, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createPung(TileType.WAN, 4, 11),
        createPung(TileType.WAN, 5, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 8. 两个暗杠 + 两个顺子 + 一个对子
    it('should detect with two concealed kongs, two chows, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createChow(TileType.WAN, 4, 11),
        createChow(TileType.WAN, 7, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 9. 两个暗杠 + 一个刻子 + 一个顺子 + 一个对子
    it('should detect with two concealed kongs, one pung, one chow, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createPung(TileType.WAN, 4, 11),
        createChow(TileType.WAN, 5, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 10. 两个暗杠（不同花色）+ 一个对子
    it('should detect with two concealed kongs of different suits and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 11. 两个暗杠 + 一个对子（风牌）
    it('should detect with two concealed kongs and a wind pair', () => {
      const handTiles = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 12. 两个暗杠（风牌）+ 一个对子
    it('should detect with two concealed wind kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets: TileSet[] = [
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.FENG, 1, 3),
            new Tile(TileType.FENG, 1, 4),
            new Tile(TileType.FENG, 1, 5),
            new Tile(TileType.FENG, 1, 6)
          ]
        },
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.FENG, 2, 7),
            new Tile(TileType.FENG, 2, 8),
            new Tile(TileType.FENG, 2, 9),
            new Tile(TileType.FENG, 2, 10)
          ]
        }
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 13. 两个暗杠 + 一个补杠 + 一个对子
    it('should detect with two concealed kongs, one added kong, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an'),
        createKong(TileType.WAN, 4, 11, 'bu')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 14. 两个暗杠 + 混合组合（刻子+顺子）+ 一个对子
    it('should detect with two concealed kongs, mixed combinations, and a pair', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.TIAO, [2, 3, 4])
      ];
      const revealedSets = [
        createKong(TileType.WAN, 2, 6, 'an'),
        createKong(TileType.WAN, 3, 10, 'an'),
        createPung(TileType.WAN, 4, 14)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 15. 两个暗杠（同一数值，不同花色）+ 一个对子
    it('should detect with two concealed kongs of same value but different suits and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 5, 3, 'an'),
        createKong(TileType.TIAO, 5, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 16. 两个暗杠 + 一个对子（混合牌型和花色）
    it('should detect with two concealed kongs with mixed suits and values and a pair', () => {
      const handTiles = createPair(TileType.TONG, 9);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createKong(TileType.TIAO, 9, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 17. 两个暗杠（三元牌）+ 一个对子
    it('should detect with two concealed dragon kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets: TileSet[] = [
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.JIAN, 1, 3),
            new Tile(TileType.JIAN, 1, 4),
            new Tile(TileType.JIAN, 1, 5),
            new Tile(TileType.JIAN, 1, 6)
          ]
        },
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.JIAN, 2, 7),
            new Tile(TileType.JIAN, 2, 8),
            new Tile(TileType.JIAN, 2, 9),
            new Tile(TileType.JIAN, 2, 10)
          ]
        }
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 18. 两个暗杠（一个风牌一个三元牌）+ 一个对子
    it('should detect with one wind concealed kong, one dragon concealed kong, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets: TileSet[] = [
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.FENG, 1, 3),
            new Tile(TileType.FENG, 1, 4),
            new Tile(TileType.FENG, 1, 5),
            new Tile(TileType.FENG, 1, 6)
          ]
        },
        {
          type: 'GANG' as TileSetType,
          source: 'an',
          tiles: [
            new Tile(TileType.JIAN, 1, 7),
            new Tile(TileType.JIAN, 1, 8),
            new Tile(TileType.JIAN, 1, 9),
            new Tile(TileType.JIAN, 1, 10)
          ]
        }
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 19. 两个暗杠（三种花色混合）+ 一个对子
    it('should detect with two concealed kongs of mixed suits and a pair', () => {
      const handTiles = createPair(TileType.TONG, 5);
      const revealedSets = [
        createKong(TileType.WAN, 3, 3, 'an'),
        createKong(TileType.TIAO, 7, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 20. 两个暗杠 + 一个对子（在最后一张牌胡牌）
    it('should detect with two concealed kongs and a pair on the last tile', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      const gameState = {
        isLastTile: true
      };
      expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.true;
    });
    
    // 21. 两个暗杠 + 一个对子（自摸）
    it('should detect with two concealed kongs and a pair with self-drawn win', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      const gameState = {
        isDrawn: true
      };
      expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.true;
    });
    
    // 22. 两个暗杠 + 一个对子（抢杠）
    it('should detect with two concealed kongs and a pair with robbing kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      const gameState = {
        isRobbingKong: true
      };
      expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.true;
    });
    
    // 23. 两个暗杠 + 一个对子（杠上开花）
    it('should detect with two concealed kongs and a pair with win after kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.WAN, 3, 7, 'an')
      ];
      const gameState = {
        isAfterKong: true
      };
      expect(detector.detect(handTiles, revealedSets, null, gameState)).to.be.true;
    });
    
    // 24. 两个暗杠（数值连续）+ 一个对子
    it('should detect with two consecutive value concealed kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 4, 3, 'an'),
        createKong(TileType.WAN, 5, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 25. 两个暗杠（边张值1和9）+ 一个对子
    it('should detect with two terminal value concealed kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 5);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createKong(TileType.WAN, 9, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 26. 两个暗杠 + 一个对子 + 特殊场景
    it('should detect with two concealed kongs and a pair with special arrangement', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 9),
        ...createTiles(TileType.FENG, [1, 2, 3])
      ];
      const revealedSets = [
        createKong(TileType.WAN, 1, 6, 'an'),
        createKong(TileType.TIAO, 1, 10, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 27. 两个暗杠 + 三个不同花色对子
    it('should detect with two concealed kongs and three pairs of different suits', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createPair(TileType.TIAO, 2),
        ...createPair(TileType.TONG, 3)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 5, 7, 'an'),
        createKong(TileType.TIAO, 5, 11, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 28. 两个暗杠 + 一个七对子形式的手牌
    it('should detect with two concealed kongs and seven pairs hand', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createPair(TileType.WAN, 2),
        ...createPair(TileType.WAN, 3),
        ...createPair(TileType.WAN, 4),
        ...createPair(TileType.WAN, 5),
        ...createPair(TileType.WAN, 6),
        ...createPair(TileType.WAN, 7)
      ];
      const revealedSets = [
        createKong(TileType.TIAO, 1, 15, 'an'),
        createKong(TileType.TIAO, 2, 19, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 29. 三个暗杠（不同花色）+ 一个对子
    it('should detect with three concealed kongs of different suits and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'an'),
        createKong(TileType.TONG, 4, 11, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 30. 四个暗杠（不同花色）+ 一个对子
    it('should detect with four concealed kongs of different suits and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'an'),
        createKong(TileType.TONG, 4, 11, 'an'),
        createKong(TileType.FENG, 1, 15, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 31. 两个暗杠 + 一个明杠 + 一个暗刻 + 一个对子
    it('should detect with two concealed kongs, one exposed kong, one concealed pung, and a pair', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.WAN, [6, 6, 6])
      ];
      const revealedSets = [
        createKong(TileType.WAN, 2, 6, 'an'),
        createKong(TileType.WAN, 3, 10, 'an'),
        createKong(TileType.WAN, 4, 14, 'ming')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 32. 两个暗杠（所有牌均为1或9）+ 一个对子
    it('should detect with two concealed kongs all terminal values and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.TIAO, 1, 3, 'an'),
        createKong(TileType.TONG, 9, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 33. 两个暗杠 + 两对对子 + 两张单牌
    it('should detect with two concealed kongs, two pairs, and two single tiles', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createPair(TileType.TIAO, 2),
        new Tile(TileType.TONG, 3, 6),
        new Tile(TileType.TONG, 5, 7)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 7, 8, 'an'),
        createKong(TileType.TIAO, 9, 12, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 34. 两个暗杠 + 三个不同类型的牌组合
    it('should detect with two concealed kongs and a mixed hand', () => {
      const handTiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 2),
        new Tile(TileType.WAN, 3, 3),
        new Tile(TileType.TIAO, 5, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.FENG, 1, 6)
      ];
      const revealedSets = [
        createKong(TileType.JIAN, 1, 7, 'an'),
        createKong(TileType.JIAN, 2, 11, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
    
    // 35. 两个暗杠（由一万到九万的序列）+ 一个对子
    it('should detect with two concealed kongs in sequence from 1 to 9 and a pair', () => {
      const handTiles = createPair(TileType.WAN, 5);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createKong(TileType.WAN, 9, 7, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });
  
  describe('Invalid Double Concealed Kongs Patterns', () => {
    // 1. 没有杠 + 一个对子 + 四个刻子
    it('should not detect without any kongs, with one pair and four pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.WAN, 2, 3),
        createPung(TileType.TIAO, 3, 6),
        createPung(TileType.TONG, 4, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 2. 没有杠 + 一个对子 + 四个顺子
    it('should not detect without any kongs, with one pair and four chows', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.WAN, 5, 6),
        createChow(TileType.TIAO, 3, 9),
        createChow(TileType.TIAO, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 3. 没有杠 + 混合组合
    it('should not detect without any kongs, with mixed combinations', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.WAN, 2, 3),
        createPung(TileType.TIAO, 3, 6),
        createChow(TileType.TONG, 4, 9),
        createChow(TileType.TONG, 7, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 4. 一个暗杠 + 一个对子 + 三个刻子
    it('should not detect with only one concealed kong, one pair, and three pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createPung(TileType.TIAO, 3, 7),
        createPung(TileType.TONG, 4, 10),
        createPung(TileType.FENG, 1, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 5. 一个暗杠 + 一个对子 + 三个顺子
    it('should not detect with only one concealed kong, one pair, and three chows', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createChow(TileType.TIAO, 3, 7),
        createChow(TileType.TIAO, 6, 10),
        createChow(TileType.TONG, 4, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 6. 一个暗杠 + 混合组合
    it('should not detect with only one concealed kong and mixed combinations', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createPung(TileType.TIAO, 3, 7),
        createChow(TileType.TONG, 4, 10),
        createChow(TileType.TONG, 7, 13)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 7. 两个明杠 + 一个对子 + 一个刻子
    it('should not detect with two exposed kongs (not concealed), one pair, and one pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createPung(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 8. 两个明杠 + 一个对子 + 一个顺子
    it('should not detect with two exposed kongs (not concealed), one pair, and one chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createChow(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 9. 一个暗杠 + 一个明杠 + 一个对子 + 一个刻子
    it('should not detect with one concealed kong, one exposed kong, one pair, and one pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createPung(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 10. 一个暗杠 + 一个明杠 + 一个对子 + 一个顺子
    it('should not detect with one concealed kong, one exposed kong, one pair, and one chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createChow(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 11. 一个暗杠 + 一个补杠 + 一个对子 + 一个刻子
    it('should not detect with one concealed kong, one added kong, one pair, and one pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createPung(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 12. 一个暗杠 + 一个补杠 + 一个对子 + 一个顺子
    it('should not detect with one concealed kong, one added kong, one pair, and one chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createChow(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 13. 两个补杠 + 一个对子 + 一个刻子
    it('should not detect with two added kongs (not concealed), one pair, and one pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'bu'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createPung(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 14. 两个补杠 + 一个对子 + 一个顺子
    it('should not detect with two added kongs (not concealed), one pair, and one chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'bu'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createChow(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 15. 一个明杠 + 一个补杠 + 一个对子 + 一个刻子
    it('should not detect with one exposed kong, one added kong, one pair, and one pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createPung(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 16. 一个明杠 + 一个补杠 + 一个对子 + 一个顺子
    it('should not detect with one exposed kong, one added kong, one pair, and one chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createChow(TileType.TONG, 4, 11)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 17. 一个暗杠 + 一个对子 + 其他单牌（不合法的手牌）
    it('should not detect with one concealed kong, one pair, and other unformed sets', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.TIAO, [2, 3, 4, 5, 6, 7, 8])
      ];
      const revealedSets = [
        createKong(TileType.WAN, 2, 9, 'an')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 18. 空手牌，空revealedSets
    it('should not detect with empty hand and empty revealed sets', () => {
      expect(detector.detect([], [])).to.be.false;
    });
    
    // 19. 只有一个对子，没有杠
    it('should not detect with only a pair and no kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 20. 只有一些单牌，没有杠
    it('should not detect with only some tiles and no kongs', () => {
      const handTiles = createTiles(TileType.WAN, [1, 2, 3, 4, 5]);
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 21. 一个暗杠 + 一个明杠 + 一个补杠 + 一个对子
    it('should not detect with one each of concealed, exposed, and added kongs and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createKong(TileType.TONG, 4, 11, 'bu')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 22. 一个暗杠 + 三个明杠 + 一个对子
    it('should not detect with one concealed kong, three exposed kongs, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createKong(TileType.TONG, 4, 11, 'ming'),
        createKong(TileType.FENG, 1, 15, 'ming')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 23. 一个暗杠 + 一个刻子 + 一个顺子 + 一个对子
    it('should not detect with one concealed kong, one pung, one chow, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createPung(TileType.TIAO, 3, 7),
        createChow(TileType.TONG, 4, 10)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 24. 没有杠 + 一个对子 + 单张牌
    it('should not detect with a pair and single tiles but no kongs', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.TIAO, [2, 3, 5, 6, 7, 8, 9])
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 25. 四个明杠 + 一个对子（没有暗杠）
    it('should not detect with four exposed kongs (not concealed) and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createKong(TileType.TONG, 4, 11, 'ming'),
        createKong(TileType.FENG, 1, 15, 'ming')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 26. 四个补杠 + 一个对子（没有暗杠）
    it('should not detect with four added kongs (not concealed) and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'bu'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createKong(TileType.TONG, 4, 11, 'bu'),
        createKong(TileType.FENG, 1, 15, 'bu')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 27. 一个暗杠 + 三个补杠 + 一个对子
    it('should not detect with one concealed kong, three added kongs, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'an'),
        createKong(TileType.TIAO, 3, 7, 'bu'),
        createKong(TileType.TONG, 4, 11, 'bu'),
        createKong(TileType.FENG, 1, 15, 'bu')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 28. 两个明杠 + 两个补杠 + 一个对子
    it('should not detect with two exposed kongs, two added kongs, and a pair', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.WAN, 2, 3, 'ming'),
        createKong(TileType.TIAO, 3, 7, 'ming'),
        createKong(TileType.TONG, 4, 11, 'bu'),
        createKong(TileType.FENG, 1, 15, 'bu')
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 29. 只有单张牌，没有成形的牌组
    it('should not detect with only single tiles and no sets', () => {
      const handTiles = createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 30. 只有刻子，没有杠
    it('should not detect with only pungs and no kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.WAN, 2, 3),
        createPung(TileType.TIAO, 3, 6),
        createPung(TileType.TONG, 4, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 31. 只有顺子，没有杠
    it('should not detect with only chows and no kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.WAN, 2, 3),
        createChow(TileType.TIAO, 3, 6),
        createChow(TileType.TONG, 4, 9),
        createChow(TileType.WAN, 6, 12)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 32. 一个暗杠 + 四个刻子 + 一个对子
    it('should not detect with one concealed kong, four pungs, and a pair', () => {
      const handTiles = createPair(TileType.FENG, 1);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createPung(TileType.WAN, 2, 7),
        createPung(TileType.TIAO, 3, 10),
        createPung(TileType.TONG, 4, 13),
        createPung(TileType.FENG, 2, 16)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 33. 一个暗杠 + 一个明杠 + 三个刻子 + 一个对子
    it('should not detect with one concealed kong, one exposed kong, three pungs, and a pair', () => {
      const handTiles = createPair(TileType.FENG, 1);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createKong(TileType.WAN, 2, 7, 'ming'),
        createPung(TileType.TIAO, 3, 11),
        createPung(TileType.TONG, 4, 14),
        createPung(TileType.FENG, 2, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 34. 一个暗杠 + 一个补杠 + 三个刻子 + 一个对子
    it('should not detect with one concealed kong, one added kong, three pungs, and a pair', () => {
      const handTiles = createPair(TileType.FENG, 1);
      const revealedSets = [
        createKong(TileType.WAN, 1, 3, 'an'),
        createKong(TileType.WAN, 2, 7, 'bu'),
        createPung(TileType.TIAO, 3, 11),
        createPung(TileType.TONG, 4, 14),
        createPung(TileType.FENG, 2, 17)
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
    
    // 35. 暗刻 + 一个对子（暗刻形式不是杠）
    it('should not detect with concealed pungs that are not kongs and a pair', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.WAN, [2, 2, 2]),
        ...createTiles(TileType.TIAO, [3, 3, 3])
      ];
      expect(detector.detect(handTiles, [])).to.be.false;
    });
  });
}); 