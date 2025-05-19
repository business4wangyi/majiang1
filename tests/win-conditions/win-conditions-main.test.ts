import { expect } from 'chai';
import { WinConditions } from '../../src/win-conditions/win-conditions-main';
import { TileType, Tile } from '../../src/tile';
import { Player, PlayerType } from '../../src/player';
import { TileSet, HuType } from '../../src/rule-types';

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

describe('WinConditions Main', () => {
  describe('吃碰杠组合测试', () => {
    // 测试场景1: 0副吃，0副碰，0副杠
    it('应该能胡牌：0副吃，0副碰，0副杠 - 标准和牌', () => {
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1], 1), // 对子
        ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
        ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
        ...createTiles(TileType.WAN, [8, 8, 8], 9), // 刻子
        ...createTiles(TileType.TIAO, [1, 2, 3], 12) // 顺子3
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1], 1), // 对子
        ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
        ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
        ...createTiles(TileType.WAN, [8, 8], 9), // 不完整的刻子
        ...createTiles(TileType.TIAO, [1, 2, 3], 11) // 顺子3
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景2: 1副吃，0副碰，0副杠
    it('应该能胡牌：1副吃，0副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 8, 8], 9) // 刻子
        ],
        [
          createChow(TileType.TONG, 1, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 8], 9) // 不完整的刻子
        ],
        [
          createChow(TileType.TONG, 1, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景3: 0副吃，1副碰，0副杠
    it('应该能胡牌：0副吃，1副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 9, 1], 9) // 顺子3
        ],
        [
          createPung(TileType.TONG, 1, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 9], 9) // 不完整的顺子
        ],
        [
          createPung(TileType.TONG, 1, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景4: 0副吃，0副碰，1副杠
    it('应该能胡牌：0副吃，0副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 9, 1], 9) // 顺子3
        ],
        [
          createKong(TileType.TONG, 1, 12) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6), // 顺子2
          ...createTiles(TileType.WAN, [8, 9], 9) // 不完整的顺子
        ],
        [
          createKong(TileType.TONG, 1, 12) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景5: 1副吃，1副碰，0副杠
    it('应该能胡牌：1副吃，1副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createChow(TileType.TONG, 1, 9), // 1副吃
          createPung(TileType.TIAO, 2, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，1副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createChow(TileType.TONG, 1, 8), // 1副吃
          createPung(TileType.TIAO, 2, 11) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景6: 1副吃，0副碰，1副杠
    it('应该能胡牌：1副吃，0副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createChow(TileType.TONG, 1, 9), // 1副吃
          createKong(TileType.TIAO, 2, 12) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createChow(TileType.TONG, 1, 8), // 1副吃
          createKong(TileType.TIAO, 2, 11) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景7: 0副吃，1副碰，1副杠
    it('应该能胡牌：0副吃，1副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createPung(TileType.TONG, 1, 9), // 1副碰
          createKong(TileType.TIAO, 2, 12) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createPung(TileType.TONG, 1, 8), // 1副碰
          createKong(TileType.TIAO, 2, 11) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景8: 1副吃，1副碰，1副杠
    it('应该能胡牌：1副吃，1副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createPung(TileType.TIAO, 2, 6), // 1副碰
          createKong(TileType.TIAO, 3, 9), // 1副杠
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，1副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createPung(TileType.TIAO, 2, 5), // 1副碰
          createKong(TileType.TIAO, 3, 8), // 1副杠
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景9: 2副吃，0副碰，0副杠
    it('应该能胡牌：2副吃，0副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createChow(TileType.TONG, 1, 9), // 1副吃
          createChow(TileType.TIAO, 2, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：2副吃，0副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createChow(TileType.TONG, 1, 8), // 1副吃
          createChow(TileType.TIAO, 2, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景10: 0副吃，2副碰，0副杠
    it('应该能胡牌：0副吃，2副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createPung(TileType.TONG, 1, 9), // 1副碰
          createPung(TileType.TIAO, 2, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，2副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createPung(TileType.TONG, 1, 8), // 1副碰
          createPung(TileType.TIAO, 2, 11) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景11: 0副吃，0副碰，2副杠
    it('应该能胡牌：0副吃，0副碰，2副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6, 7], 6) // 顺子2
        ],
        [
          createKong(TileType.TONG, 1, 9), // 1副杠
          createKong(TileType.TIAO, 2, 13) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，2副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1), // 对子
          ...createTiles(TileType.WAN, [2, 3, 4], 3), // 顺子1
          ...createTiles(TileType.WAN, [5, 6], 6) // 不完整的顺子
        ],
        [
          createKong(TileType.TONG, 1, 8), // 1副杠
          createKong(TileType.TIAO, 2, 12) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景12: 2副吃，1副碰，0副杠
    it('应该能胡牌：2副吃，1副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createChow(TileType.TIAO, 2, 6), // 1副吃
          createPung(TileType.TIAO, 3, 9), // 1副碰
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：2副吃，1副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createChow(TileType.TIAO, 2, 5), // 1副吃
          createPung(TileType.TIAO, 3, 8), // 1副碰
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景13: 2副吃，0副碰，1副杠
    it('应该能胡牌：2副吃，0副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createChow(TileType.TIAO, 2, 6), // 1副吃
          createKong(TileType.TIAO, 3, 9), // 1副杠
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：2副吃，0副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createChow(TileType.TIAO, 2, 5), // 1副吃
          createKong(TileType.TIAO, 3, 8), // 1副杠
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景14: 1副吃，2副碰，0副杠
    it('应该能胡牌：1副吃，2副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createPung(TileType.TIAO, 2, 6), // 1副碰
          createPung(TileType.TIAO, 3, 9), // 1副碰
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，2副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createPung(TileType.TIAO, 2, 5), // 1副碰
          createPung(TileType.TIAO, 3, 8), // 1副碰
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景15: 1副吃，0副碰，2副杠
    it('应该能胡牌：1副吃，0副碰，2副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createKong(TileType.TIAO, 2, 6), // 1副杠
          createKong(TileType.TIAO, 3, 9), // 1副杠
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，2副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createKong(TileType.TIAO, 2, 5), // 1副杠
          createKong(TileType.TIAO, 3, 8), // 1副杠
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景16: 0副吃，2副碰，1副杠
    it('应该能胡牌：0副吃，2副碰，1副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createPung(TileType.TONG, 1, 3), // 1副碰
          createPung(TileType.TIAO, 2, 6), // 1副碰
          createKong(TileType.TIAO, 3, 9), // 1副杠
          createPung(TileType.WAN, 4, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，2副碰，1副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createPung(TileType.TONG, 1, 2), // 1副碰
          createPung(TileType.TIAO, 2, 5), // 1副碰
          createKong(TileType.TIAO, 3, 8), // 1副杠
          createPung(TileType.WAN, 4, 11) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景17: 0副吃，1副碰，2副杠
    it('应该能胡牌：0副吃，1副碰，2副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createPung(TileType.TONG, 1, 3), // 1副碰
          createKong(TileType.TIAO, 2, 6), // 1副杠
          createKong(TileType.TIAO, 3, 10), // 1副杠
          createPung(TileType.WAN, 4, 14) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，2副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createPung(TileType.TONG, 1, 2), // 1副碰
          createKong(TileType.TIAO, 2, 5), // 1副杠
          createKong(TileType.TIAO, 3, 9), // 1副杠
          createPung(TileType.WAN, 4, 13) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景18: 3副吃，0副碰，0副杠
    it('应该能胡牌：3副吃，0副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createChow(TileType.TONG, 1, 3), // 1副吃
          createChow(TileType.TIAO, 2, 6), // 1副吃
          createChow(TileType.TIAO, 3, 9), // 1副吃
          createChow(TileType.WAN, 4, 12) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：3副吃，0副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createChow(TileType.TONG, 1, 2), // 1副吃
          createChow(TileType.TIAO, 2, 5), // 1副吃
          createChow(TileType.TIAO, 3, 8), // 1副吃
          createChow(TileType.WAN, 4, 11) // 1副吃
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景19: 0副吃，3副碰，0副杠
    it('应该能胡牌：0副吃，3副碰，0副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createPung(TileType.TONG, 1, 3), // 1副碰
          createPung(TileType.TIAO, 2, 6), // 1副碰
          createPung(TileType.TIAO, 3, 9), // 1副碰
          createPung(TileType.WAN, 4, 12) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，3副碰，0副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createPung(TileType.TONG, 1, 2), // 1副碰
          createPung(TileType.TIAO, 2, 5), // 1副碰
          createPung(TileType.TIAO, 3, 8), // 1副碰
          createPung(TileType.WAN, 4, 11) // 1副碰
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });

    // 测试场景20: 0副吃，0副碰，3副杠
    it('应该能胡牌：0副吃，0副碰，3副杠', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1, 1], 1) // 对子
        ],
        [
          createKong(TileType.TONG, 1, 3), // 1副杠
          createKong(TileType.TIAO, 2, 7), // 1副杠
          createKong(TileType.TIAO, 3, 11), // 1副杠
          createKong(TileType.WAN, 4, 15) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，3副杠 - 不完整牌型', () => {
      const player = createTestPlayer(
        [
          ...createTiles(TileType.WAN, [1], 1) // 不完整的对子
        ],
        [
          createKong(TileType.TONG, 1, 2), // 1副杠
          createKong(TileType.TIAO, 2, 6), // 1副杠
          createKong(TileType.TIAO, 3, 10), // 1副杠
          createKong(TileType.WAN, 4, 14) // 1副杠
        ]
      );
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
    });
  });
}); 