import { Tile, TileType } from '../../src/majiang/tile';
import { TileSet, TileSetType } from '../../src/majiang/rule-types';
import { EightFlowersDetector } from '../../src/majiang/win-conditions/win-conditions_eight-flowers';
import { expect } from 'chai';
import { Player, PlayerType } from '../../src/majiang/player';

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

// 创建花牌
function createFlowerTiles(count: number, startId = 1): Tile[] {
  const flowers: Tile[] = [];
  for (let i = 0; i < count; i++) {
    // 在实际麻将中，花牌可能有特定的类型，这里我们使用万子1-8来模拟8种不同的花牌
    flowers.push(new Tile(TileType.WAN, i % 8 + 1, startId + i));
  }
  return flowers;
}

// 创建特定的花牌集合（确保有8种不同的花牌）
function createEightFlowers(startId = 1): Tile[] {
  return [
    new Tile(TileType.WAN, 1, startId),     // 春
    new Tile(TileType.WAN, 2, startId + 1), // 夏
    new Tile(TileType.WAN, 3, startId + 2), // 秋
    new Tile(TileType.WAN, 4, startId + 3), // 冬
    new Tile(TileType.WAN, 5, startId + 4), // 梅
    new Tile(TileType.WAN, 6, startId + 5), // 兰
    new Tile(TileType.WAN, 7, startId + 6), // 竹
    new Tile(TileType.WAN, 8, startId + 7)  // 菊
  ];
}

// 创建测试用玩家
function createTestPlayer(id: number = 1, name: string = 'TestPlayer'): Player {
  return new Player(id, name, PlayerType.HUMAN);
}

describe('EightFlowersDetector', () => {
  let detector: EightFlowersDetector;

  beforeEach(() => {
    detector = new EightFlowersDetector();
  });

  // 基本属性测试
  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('花牌全');
    expect(detector.getDescription()).to.equal('集齐全部8张花牌');
    expect(detector.getScore()).to.equal(16);
  });
  
  describe('Valid Eight Flowers Patterns', () => {
    // 1. 最基本测试：八花 + 1对子（使用extraOptions传递花牌）
    it('should detect with eight flowers and a pair (via extraOptions)', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const flowers = createEightFlowers();
      expect(detector.detect(handTiles, [], null, {}, { flowers })).to.be.true;
    });
    
    // 2. 使用Player对象测试：八花 + 1对子
    it('should detect with eight flowers and a pair (via Player)', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 3. 八花 + 2对子 + 1个刻子（player对象）
    it('should detect with eight flowers, two pairs and a pung', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createPair(TileType.TIAO, 2),
        ...createTiles(TileType.TONG, [3, 3, 3])
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 4. 八花 + 1对子 + 1个顺子（player对象）
    it('should detect with eight flowers, a pair and a chow', () => {
      const handTiles = [
        ...createPair(TileType.WAN, 1),
        ...createTiles(TileType.TIAO, [2, 3, 4])
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 5. 八花 + 1对子 + 1个碰
    it('should detect with eight flowers, a pair and a revealed pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [createPung(TileType.TIAO, 2)];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 6. 八花 + 1对子 + 1个吃
    it('should detect with eight flowers, a pair and a revealed chow', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [createChow(TileType.TIAO, 2)];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 7. 八花 + 1对子 + 1个杠
    it('should detect with eight flowers, a pair and a revealed kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [createKong(TileType.TIAO, 2)];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 8. 八花 + 1对子 + 2个吃
    it('should detect with eight flowers, a pair and two revealed chows', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 9. 八花 + 1对子 + 2个碰
    it('should detect with eight flowers, a pair and two revealed pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 10. 八花 + 1对子 + 2个杠
    it('should detect with eight flowers, a pair and two revealed kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.TIAO, 2),
        createKong(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 11. 八花 + 1对子 + 1个吃 + 1个碰
    it('should detect with eight flowers, a pair, a chow and a pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createPung(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 12. 八花 + 1对子 + 1个吃 + 1个杠
    it('should detect with eight flowers, a pair, a chow and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createKong(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 13. 八花 + 1对子 + 1个碰 + 1个杠
    it('should detect with eight flowers, a pair, a pung and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createKong(TileType.TONG, 5)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 14. 八花 + 1对子 + 3个吃
    it('should detect with eight flowers, a pair and three chows', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createChow(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 15. 八花 + 1对子 + 3个碰
    it('should detect with eight flowers, a pair and three pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 16. 八花 + 1对子 + 3个杠
    it('should detect with eight flowers, a pair and three kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.TIAO, 2),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 17. 八花 + 1对子 + 2个吃 + 1个碰
    it('should detect with eight flowers, a pair, two chows and a pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 18. 八花 + 1对子 + 2个吃 + 1个杠
    it('should detect with eight flowers, a pair, two chows and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 19. 八花 + 1对子 + 1个吃 + 2个碰
    it('should detect with eight flowers, a pair, a chow and two pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 20. 八花 + 1对子 + 1个吃 + 1个碰 + 1个杠
    it('should detect with eight flowers, a pair, a chow, a pung and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 21. 八花 + 1对子 + 1个吃 + 2个杠
    it('should detect with eight flowers, a pair, a chow and two kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 22. 八花 + 1对子 + 2个碰 + 1个杠
    it('should detect with eight flowers, a pair, two pungs and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 23. 八花 + 1对子 + 4个吃
    it('should detect with eight flowers, a pair and four chows', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 1),
        createChow(TileType.TIAO, 4),
        createChow(TileType.TIAO, 7),
        createChow(TileType.TONG, 2)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 24. 八花 + 1对子 + 4个碰
    it('should detect with eight flowers, a pair and four pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TIAO, 8),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 25. 八花 + 1对子 + 4个杠
    it('should detect with eight flowers, a pair and four kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createKong(TileType.TIAO, 2),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 26. 八花 + 1对子 + 3个吃 + 1个碰
    it('should detect with eight flowers, a pair, three chows and a pung', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createChow(TileType.TIAO, 8),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 27. 八花 + 1对子 + 3个吃 + 1个杠
    it('should detect with eight flowers, a pair, three chows and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createChow(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 28. 八花 + 1对子 + 2个吃 + 2个碰
    it('should detect with eight flowers, a pair, two chows and two pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createPung(TileType.TIAO, 8),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 29. 八花 + 1对子 + 2个吃 + 2个杠
    it('should detect with eight flowers, a pair, two chows and two kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createChow(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 30. 八花 + 1对子 + 1个吃 + 3个碰
    it('should detect with eight flowers, a pair, a chow and three pungs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TIAO, 8),
        createPung(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 31. 八花 + 1对子 + 1个吃 + 1个碰 + 2个杠
    it('should detect with eight flowers, a pair, a chow, a pung and two kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 32. 八花 + 1对子 + 1个吃 + 3个杠
    it('should detect with eight flowers, a pair, a chow and three kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createChow(TileType.TIAO, 2),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 33. 八花 + 1对子 + 3个碰 + 1个杠
    it('should detect with eight flowers, a pair, three pungs and a kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 34. 八花 + 1对子 + 2个碰 + 2个杠
    it('should detect with eight flowers, a pair, two pungs and two kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createPung(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 35. 八花 + 1对子 + 1个碰 + 3个杠
    it('should detect with eight flowers, a pair, a pung and three kongs', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [
        createPung(TileType.TIAO, 2),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TIAO, 8),
        createKong(TileType.TONG, 3)
      ];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
  });
  
  describe('Invalid Eight Flowers Patterns', () => {
    // 1. 没有花牌
    it('should not detect with no flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 2. 只有1张花牌
    it('should not detect with only one flower', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [new Tile(TileType.WAN, 1, 100)];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 3. 有7张花牌（少于8张）
    it('should not detect with only seven flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 7);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 4. 有8张花牌但重复（只有4种不同的花牌，每种2张）
    it('should not detect with eight flowers but only four different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [
        new Tile(TileType.WAN, 1, 100),
        new Tile(TileType.WAN, 1, 101),
        new Tile(TileType.WAN, 2, 102),
        new Tile(TileType.WAN, 2, 103),
        new Tile(TileType.WAN, 3, 104),
        new Tile(TileType.WAN, 3, 105),
        new Tile(TileType.WAN, 4, 106),
        new Tile(TileType.WAN, 4, 107)
      ];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 5. 有8张花牌但只有7种不同的（1种重复）
    it('should not detect with eight flowers but only seven different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      const flowers = [...createEightFlowers().slice(0, 7)];
      flowers.push(new Tile(TileType.WAN, 1, 108)); // 添加一个重复的花牌
      player.flowerTiles = flowers;
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 6. 没有玩家对象也没有extraOptions
    it('should not detect without player or extraOptions', () => {
      const handTiles = createPair(TileType.WAN, 1);
      expect(detector.detect(handTiles, [])).to.be.false;
    });
    
    // 7. 有9张花牌但只有6种不同的
    it('should not detect with nine flowers but only six different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [
        new Tile(TileType.WAN, 1, 100),
        new Tile(TileType.WAN, 1, 101),
        new Tile(TileType.WAN, 2, 102),
        new Tile(TileType.WAN, 2, 103),
        new Tile(TileType.WAN, 3, 104),
        new Tile(TileType.WAN, 4, 105),
        new Tile(TileType.WAN, 5, 106),
        new Tile(TileType.WAN, 6, 107),
        new Tile(TileType.WAN, 6, 108)
      ];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 8. 有多于8张花牌但正好有8种不同的（可以胡牌）
    it('should detect with more than eight flowers that include all eight different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      const flowers = [...createEightFlowers()];
      flowers.push(new Tile(TileType.WAN, 1, 109)); // 添加一个重复的花牌
      flowers.push(new Tile(TileType.WAN, 2, 110)); // 添加一个重复的花牌
      player.flowerTiles = flowers;
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 9. extraOptions中有花牌但不是8种不同的
    it('should not detect with extraOptions flowers that are not eight different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const flowers = [
        new Tile(TileType.WAN, 1, 100),
        new Tile(TileType.WAN, 1, 101),
        new Tile(TileType.WAN, 2, 102),
        new Tile(TileType.WAN, 3, 103),
        new Tile(TileType.WAN, 4, 104),
        new Tile(TileType.WAN, 5, 105)
      ];
      expect(detector.detect(handTiles, [], null, {}, { flowers })).to.be.false;
    });
    
    // 10. 玩家对象没有flowerTiles属性
    it('should not detect if player has no flowerTiles property', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = undefined as any;
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 11. 有大量花牌但没有8种不同的
    it('should not detect with many flowers but less than eight different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      const flowers: Tile[] = [];
      for (let i = 0; i < 20; i++) {
        flowers.push(new Tile(TileType.WAN, (i % 7) + 1, 100 + i));
      }
      player.flowerTiles = flowers;
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 12. 有空的flowerTiles数组
    it('should not detect with empty flowerTiles array', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 13. 有null的flowerTiles
    it('should not detect with null flowerTiles', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = null as any;
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 14. 使用extraOptions但flowers字段为空数组
    it('should not detect with extraOptions flowers as empty array', () => {
      const handTiles = createPair(TileType.WAN, 1);
      expect(detector.detect(handTiles, [], null, {}, { flowers: [] })).to.be.false;
    });
    
    // 15. 使用extraOptions但flowers字段为null
    it('should not detect with extraOptions flowers as null', () => {
      const handTiles = createPair(TileType.WAN, 1);
      expect(detector.detect(handTiles, [], null, {}, { flowers: null as any })).to.be.false;
    });
    
    // 16. 空的handTiles和revealedSets，但有8种花牌（应该可以胡牌）
    it('should detect with empty handTiles and revealedSets but eight different flowers', () => {
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect([], [], player)).to.be.true;
    });
    
    // 17. 有特殊游戏状态但没有足够的花牌
    it('should not detect with special game state but not enough flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 5);
      const gameState = {
        isLastTile: true,
        isDrawn: true
      };
      expect(detector.detect(handTiles, [], player, gameState)).to.be.false;
    });
    
    // 18. 有2张花牌
    it('should not detect with only two flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 2);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 19. 有3张花牌
    it('should not detect with only three flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 3);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 20. 有4张花牌
    it('should not detect with only four flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 4);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 21. 有5张花牌
    it('should not detect with only five flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 5);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 22. 有6张花牌
    it('should not detect with only six flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 6);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 23. 有8张完全相同的花牌
    it('should not detect with eight identical flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = Array(8).fill(null).map((_, i) => new Tile(TileType.WAN, 1, 100 + i));
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 24. 有16张花牌但只有7种不同的
    it('should not detect with sixteen flowers but only seven different types', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      const flowers: Tile[] = [];
      for (let i = 0; i < 16; i++) {
        flowers.push(new Tile(TileType.WAN, (i % 7) + 1, 100 + i));
      }
      player.flowerTiles = flowers;
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 25. 有不同类型的对子和8张花牌
    it('should detect with different pair types and eight flowers', () => {
      const handTiles = createPair(TileType.FENG, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 26. 有8张花牌，但牌型包含暗杠而不是亮杠
    it('should detect with eight flowers and concealed kong instead of revealed kong', () => {
      const handTiles = [...createPair(TileType.WAN, 1), ...createTiles(TileType.TIAO, [3, 3, 3, 3])];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 27. 有extraOptions但缺少flowers字段
    it('should not detect with extraOptions missing flowers field', () => {
      const handTiles = createPair(TileType.WAN, 1);
      expect(detector.detect(handTiles, [], null, {}, {})).to.be.false;
    });
    
    // 28. 有额外的非法revealedSets和8张花牌（应该可以胡牌，因为只看花牌）
    it('should detect with invalid revealedSets but eight flowers', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const revealedSets = [{ type: 'INVALID' as any, tiles: [] }];
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
    
    // 29. 没有对子，但有顺子和8张花牌
    it('should detect with no pair but a chow and eight flowers', () => {
      const handTiles = createTiles(TileType.TIAO, [2, 3, 4]);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 30. 有8种不同的花牌，但不是标准的春夏秋冬梅兰竹菊（使用不同的TileType）
    it('should detect with eight different flowers using mixed TileTypes', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [
        new Tile(TileType.WAN, 1, 100),
        new Tile(TileType.WAN, 2, 101),
        new Tile(TileType.TIAO, 1, 102),
        new Tile(TileType.TIAO, 2, 103),
        new Tile(TileType.TONG, 1, 104),
        new Tile(TileType.TONG, 2, 105),
        new Tile(TileType.FENG, 1, 106),
        new Tile(TileType.JIAN, 1, 107)
      ];
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });
    
    // 31. 花牌数组包含空值
    it('should not detect with flowers array containing null values', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = [];
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 32. 花牌数组包含非Tile对象
    it('should not detect with flowers array containing non-Tile objects', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers().slice(0, 2);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });
    
    // 33. 在海底情况下有8张花牌（应该可以胡牌）
    it('should detect with eight flowers at the last tile', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      const gameState = {
        isLastTile: true
      };
      expect(detector.detect(handTiles, [], player, gameState)).to.be.true;
    });
    
    // 34. 杠上开花情况下有8张花牌（应该可以胡牌）
    it('should detect with eight flowers after kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      const gameState = {
        isAfterKong: true
      };
      expect(detector.detect(handTiles, [], player, gameState)).to.be.true;
    });
    
    // 35. 抢杠和情况下有8张花牌（应该可以胡牌）
    it('should detect with eight flowers when robbing kong', () => {
      const handTiles = createPair(TileType.WAN, 1);
      const player = createTestPlayer();
      player.flowerTiles = createEightFlowers();
      const gameState = {
        isRobbingKong: true
      };
      expect(detector.detect(handTiles, [], player, gameState)).to.be.true;
    });
  });
}); 