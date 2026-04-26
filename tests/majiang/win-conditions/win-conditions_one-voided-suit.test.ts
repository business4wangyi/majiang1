import { expect } from 'chai';
import { Tile, TileType } from '../../../src/majiang/core/tile';
import { TileSet, TileSetType } from '../../../src/majiang/core/rule-types';
import { createTestPlayer } from '../test-utils';
import { OneVoidedSuitDetector } from '../../../src/majiang/core/win-conditions/win-conditions_one-voided-suit';

describe('缺一门检测器测试', () => {
  const detector = new OneVoidedSuitDetector();

  // 辅助函数：创建测试牌组
  function createTileSet(type: TileSetType, tiles: Tile[]): TileSet {
    return {
      type,
      tiles: [...tiles],
      source: 'ming'
    };
  }

  // 辅助函数：创建测试牌
  function createTile(type: TileType, value: number): Tile {
    return new Tile(type, value, 0); // 使用0作为id，因为测试中不需要唯一id
  }

  describe('能胡牌的情况', () => {
    // 测试场景1：只有万子和条子，没有吃碰杠
    it('只有万子和条子，没有吃碰杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6),
        createTile(TileType.WAN, 7),
        createTile(TileType.WAN, 8),
        createTile(TileType.WAN, 9),
        createTile(TileType.TIAO, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TIAO, 3),
        createTile(TileType.WAN, 5)
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });

    // 测试场景2：只有万子和条子，有一个吃
    it('只有万子和条子，有一个吃', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6),
        createTile(TileType.WAN, 7),
        createTile(TileType.WAN, 8),
        createTile(TileType.WAN, 9)
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 测试场景3：只有万子和条子，有一个碰
    it('只有万子和条子，有一个碰', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6),
        createTile(TileType.WAN, 7)
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.TIAO, 8),
          createTile(TileType.TIAO, 8),
          createTile(TileType.TIAO, 8)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 测试场景4：只有万子和条子，有一个杠
    it('只有万子和条子，有一个杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6)
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9),
          createTile(TileType.WAN, 9)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 测试场景5：只有万子和筒子，没有吃碰杠
    it('只有万子和筒子，没有吃碰杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TONG, 4),
        createTile(TileType.TONG, 5),
        createTile(TileType.TONG, 6),
        createTile(TileType.WAN, 7),
        createTile(TileType.WAN, 8),
        createTile(TileType.WAN, 9),
        createTile(TileType.TONG, 1),
        createTile(TileType.TONG, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.WAN, 5)
      ];
      const player = createTestPlayer(handTiles);
      expect(detector.detect(handTiles, [], player)).to.be.true;
    });

    // 测试场景6：只有万子和条子，有两个吃
    it('只有万子和条子，有两个吃', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6),
        createTile(TileType.WAN, 7)
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3)
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 4),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 6)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 测试场景7：只有万子和条子，有两个碰
    it('只有万子和条子，有两个碰', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TIAO, 6)
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.TIAO, 7),
          createTile(TileType.TIAO, 7),
          createTile(TileType.TIAO, 7)
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 8),
          createTile(TileType.WAN, 8),
          createTile(TileType.WAN, 8)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });

    // 测试场景8：只有万子和条子，有两个杠
    it('只有万子和条子，有两个杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.TIAO, 4),
        createTile(TileType.TIAO, 5)
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.TIAO, 6),
          createTile(TileType.TIAO, 6),
          createTile(TileType.TIAO, 6),
          createTile(TileType.TIAO, 6)
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 7),
          createTile(TileType.WAN, 7),
          createTile(TileType.WAN, 7),
          createTile(TileType.WAN, 7)
        ])
      ];
      const player = createTestPlayer(handTiles, revealedSets);
      expect(detector.detect(handTiles, revealedSets, player)).to.be.true;
    });
  });
}); 