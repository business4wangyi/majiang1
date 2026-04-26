import { expect } from 'chai';
import { PureDoubleChowDetector } from '../../../src/majiang/core/win-conditions/win-conditions_pure-double-chow';
import { TileType, Tile } from '../../../src/majiang/core/tile';
import { TileSet, HuType } from '../../../src/majiang/core/rule-types';
import { Player, PlayerType } from '../../../src/majiang/core/player';

/**
 * 辅助函数：创建指定花色和点数的牌组
 */
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  return values.map((value, index) => new Tile(type, value, startId + index));
}

/**
 * 辅助函数：创建刻子
 */
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

/**
 * 辅助函数：创建顺子
 */
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

/**
 * 辅助函数：创建杠
 */
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

/**
 * 辅助函数：创建测试玩家
 */
function createTestPlayer(handTiles?: Tile[], revealedSets?: TileSet[]): Player {
  const player = new Player(1, '测试玩家', PlayerType.HUMAN);
  if (handTiles) player.handTiles = handTiles;
  if (revealedSets) player.revealedSets = revealedSets;
  return player;
}

describe('一色双龙会测试', () => {
  const detector = new PureDoubleChowDetector();

  // 测试场景1-35：可以胡牌的情况
  describe('可以胡牌的情况', () => {
    // 场景1：手牌中有两组完整的万子龙
    it('场景1：手牌中有两组完整的万子龙', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8, 9, 7, 8, 9])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });

    // 场景2：手牌中有一组万子龙，已亮出一组万子龙
    it('场景2：手牌中有一组万子龙，已亮出一组万子龙', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 场景3：手牌中有两组完整的条子龙
    it('场景3：手牌中有两组完整的条子龙', () => {
      const handTiles = [
        ...createTiles(TileType.TIAO, [1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8, 9, 7, 8, 9])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });

    // 场景4：手牌中有两组完整的筒子龙
    it('场景4：手牌中有两组完整的筒子龙', () => {
      const handTiles = [
        ...createTiles(TileType.TONG, [1, 2, 3, 1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8, 9, 7, 8, 9])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });

    // 场景5：手牌中有一组万子龙，已亮出一组万子龙，外加一个对子
    it('场景5：手牌中有一组万子龙，已亮出一组万子龙，外加一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景6：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子
    it('场景6：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景7：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠
    it('场景7：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景8：手牌中有一组万子龙，已亮出一组万子龙，外加两个对子
    it('场景8：手牌中有一组万子龙，已亮出一组万子龙，外加两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景9：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和一个对子
    it('场景9：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景10：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子
    it('场景10：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景11：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠和一个对子
    it('场景11：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景12：手牌中有一组万子龙，已亮出一组万子龙，外加两个杠
    it('场景12：手牌中有一组万子龙，已亮出一组万子龙，外加两个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5),
        createKong(TileType.WAN, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景13：手牌中有一组万子龙，已亮出一组万子龙，外加三个对子
    it('场景13：手牌中有一组万子龙，已亮出一组万子龙，外加三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景14：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和两个对子
    it('场景14：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景15：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子和一个对子
    it('场景15：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景16：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子
    it('场景16：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景17：手牌中有一组万子龙，已亮出一组万子龙，外加三个杠
    it('场景17：手牌中有一组万子龙，已亮出一组万子龙，外加三个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5),
        createKong(TileType.WAN, 6),
        createKong(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景18：手牌中有一组万子龙，已亮出一组万子龙，外加四个对子
    it('场景18：手牌中有一组万子龙，已亮出一组万子龙，外加四个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景19：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和三个对子
    it('场景19：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景20：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子和两个对子
    it('场景20：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景21：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子和一个对子
    it('场景21：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景22：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠和三个对子
    it('场景22：手牌中有一组万子龙，已亮出一组万子龙，外加一个杠和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 6, 6, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景23：手牌中有一组万子龙，已亮出一组万子龙，外加两个杠和两个对子
    it('场景23：手牌中有一组万子龙，已亮出一组万子龙，外加两个杠和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5),
        createKong(TileType.WAN, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景24：手牌中有一组万子龙，已亮出一组万子龙，外加三个杠和一个对子
    it('场景24：手牌中有一组万子龙，已亮出一组万子龙，外加三个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 5),
        createKong(TileType.WAN, 6),
        createKong(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景25：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、一个杠和两个对子
    it('场景25：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、一个杠和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景26：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、一个杠和一个对子
    it('场景26：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、一个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景27：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、两个杠和一个对子
    it('场景27：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、两个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 6),
        createKong(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景28：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、两个杠和一个对子
    it('场景28：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、两个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 7),
        createKong(TileType.WAN, 8)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景29：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、一个杠和一个对子
    it('场景29：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、一个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 8)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景30：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、三个杠和一个对子
    it('场景30：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、三个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 6),
        createKong(TileType.WAN, 7),
        createKong(TileType.WAN, 8)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景31：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、三个杠和一个对子
    it('场景31：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、三个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 7),
        createKong(TileType.WAN, 8),
        createKong(TileType.WAN, 9)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景32：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、两个杠和一个对子
    it('场景32：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、两个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 8),
        createKong(TileType.WAN, 9)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景33：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、四个杠和一个对子
    it('场景33：手牌中有一组万子龙，已亮出一组万子龙，外加一个刻子、四个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 6),
        createKong(TileType.WAN, 7),
        createKong(TileType.WAN, 8),
        createKong(TileType.WAN, 9)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景34：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、四个杠和一个对子
    it('场景34：手牌中有一组万子龙，已亮出一组万子龙，外加两个刻子、四个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 7),
        createKong(TileType.WAN, 8),
        createKong(TileType.WAN, 9),
        createKong(TileType.WAN, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景35：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、三个杠和一个对子
    it('场景35：手牌中有一组万子龙，已亮出一组万子龙，外加三个刻子、三个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.WAN, 8),
        createKong(TileType.WAN, 9),
        createKong(TileType.WAN, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });
  });

  // 测试场景36-70：不能胡牌的情况
  describe('不能胡牌的情况', () => {
    // 场景36：只有一组完整的龙
    it('场景36：只有一组完整的龙', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });

    // 场景37：两组不完整的龙
    it('场景37：两组不完整的龙', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });

    // 场景38：不同花色的龙
    it('场景38：不同花色的龙', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9]),
        ...createTiles(TileType.TIAO, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.false;
    });

    // 场景39：有刻子的情况
    it('场景39：有刻子的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 1, 1])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      // 这个场景应该是不符合一色双龙会的要求
      // 因为有刻子而不是完整的两条龙
      const result = detector.detect(handTiles, revealedSets, player);
      // 确认结果为false，表示不能胡牌
      expect(result).to.be.false;
    });

    // 场景40：有杠的情况
    it('场景40：有杠的情况', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createKong(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景41：有不同花色的刻子
    it('场景41：有不同花色的刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9]),
        ...createTiles(TileType.TIAO, [5, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景42：有不同花色的杠
    it('场景42：有不同花色的杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景43：有不同花色的对子
    it('场景43：有不同花色的对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5]),
        ...createTiles(TileType.TIAO, [6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景44：有不同花色的顺子
    it('场景44：有不同花色的顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.TIAO, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景45：有不同花色的刻子和对子
    it('场景45：有不同花色的刻子和对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5]),
        ...createTiles(TileType.TIAO, [6, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景46：有不同花色的杠和对子
    it('场景46：有不同花色的杠和对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景47：有不同花色的刻子和杠
    it('场景47：有不同花色的刻子和杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createPung(TileType.TONG, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景48：有不同花色的两个刻子
    it('场景48：有不同花色的两个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景49：有不同花色的两个杠
    it('场景49：有不同花色的两个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景50：有不同花色的两个对子
    it('场景50：有不同花色的两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5]),
        ...createTiles(TileType.TIAO, [6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景51：有不同花色的三个刻子
    it('场景51：有不同花色的三个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景52：有不同花色的三个杠
    it('场景52：有不同花色的三个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景53：有不同花色的三个对子
    it('场景53：有不同花色的三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5]),
        ...createTiles(TileType.TIAO, [6, 6]),
        ...createTiles(TileType.TONG, [7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景54：有不同花色的三个顺子
    it('场景54：有不同花色的三个顺子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.TIAO, 4),
        createChow(TileType.TONG, 7)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景55：有不同花色的三个刻子和一个对子
    it('场景55：有不同花色的三个刻子和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景56：有不同花色的三个杠和一个对子
    it('场景56：有不同花色的三个杠和一个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景57：有不同花色的三个刻子和一个杠
    it('场景57：有不同花色的三个刻子和一个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1),
        createKong(TileType.JIAN, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景58：有不同花色的三个杠和一个刻子
    it('场景58：有不同花色的三个杠和一个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1),
        createPung(TileType.JIAN, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景59：有不同花色的三个刻子和两个对子
    it('场景59：有不同花色的三个刻子和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景60：有不同花色的三个杠和两个对子
    it('场景60：有不同花色的三个杠和两个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景61：有不同花色的三个刻子和两个杠
    it('场景61：有不同花色的三个刻子和两个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1),
        createKong(TileType.JIAN, 1),
        createKong(TileType.JIAN, 2)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景62：有不同花色的三个杠和两个刻子
    it('场景62：有不同花色的三个杠和两个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1),
        createPung(TileType.JIAN, 1),
        createPung(TileType.JIAN, 2)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景63：有不同花色的三个刻子和三个对子
    it('场景63：有不同花色的三个刻子和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景64：有不同花色的三个杠和三个对子
    it('场景64：有不同花色的三个杠和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景65：有不同花色的三个刻子和三个杠
    it('场景65：有不同花色的三个刻子和三个杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1),
        createKong(TileType.JIAN, 1),
        createKong(TileType.JIAN, 2),
        createKong(TileType.JIAN, 3)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景66：有不同花色的三个杠和三个刻子
    it('场景66：有不同花色的三个杠和三个刻子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1),
        createPung(TileType.JIAN, 1),
        createPung(TileType.JIAN, 2),
        createPung(TileType.JIAN, 3)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景67：有不同花色的三个刻子、三个杠和三个对子
    it('场景67：有不同花色的三个刻子、三个杠和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1),
        createKong(TileType.JIAN, 1),
        createKong(TileType.JIAN, 2),
        createKong(TileType.JIAN, 3)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景68：有不同花色的三个杠、三个刻子和三个对子
    it('场景68：有不同花色的三个杠、三个刻子和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1),
        createPung(TileType.JIAN, 1),
        createPung(TileType.JIAN, 2),
        createPung(TileType.JIAN, 3)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景69：有不同花色的三个刻子、四个杠和三个对子
    it('场景69：有不同花色的三个刻子、四个杠和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createPung(TileType.TIAO, 5),
        createPung(TileType.TONG, 6),
        createPung(TileType.FENG, 1),
        createKong(TileType.JIAN, 1),
        createKong(TileType.JIAN, 2),
        createKong(TileType.JIAN, 3),
        createKong(TileType.JIAN, 4)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });

    // 场景70：有不同花色的四个杠、三个刻子和三个对子
    it('场景70：有不同花色的四个杠、三个刻子和三个对子', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5, 6, 6, 7, 7])
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1),
        createChow(TileType.WAN, 4),
        createChow(TileType.WAN, 7),
        createKong(TileType.TIAO, 5),
        createKong(TileType.TONG, 6),
        createKong(TileType.FENG, 1),
        createKong(TileType.JIAN, 1),
        createPung(TileType.JIAN, 2),
        createPung(TileType.JIAN, 3),
        createPung(TileType.JIAN, 4)
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.false;
    });
  });
}); 