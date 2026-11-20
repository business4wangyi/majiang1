import { expect } from 'chai';
import { Game, GameState } from '../../src/majiang/core/game';
import { Player, PlayerState, PlayerType } from '../../src/majiang/core/player';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';
import { TileManager } from '../../src/majiang/core/tile-manager';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

function tile(type: TileType, value: number, id: number): Tile {
  return new Tile(type, value, id);
}

describe('手牌数量与回合守卫（CLI 多轮偶现异常）', () => {
  beforeEach(() => {
    setAutoPlayMode(true);
    TileManager.getInstance().reset();
  });

  it('needsToDiscard：吃牌并打出后应为 false（不能用总牌数误判）', () => {
    const p = new Player(1, '测', PlayerType.AI);
    // 构造 13 张：其中 2 张用于吃 3万，其余凑满
    const hand: Tile[] = [
      tile(TileType.WAN, 2, 1),
      tile(TileType.WAN, 4, 2),
      tile(TileType.WAN, 5, 3),
      tile(TileType.WAN, 5, 4),
      tile(TileType.WAN, 6, 5),
      tile(TileType.TIAO, 1, 6),
      tile(TileType.TIAO, 1, 7),
      tile(TileType.TIAO, 2, 8),
      tile(TileType.TONG, 3, 9),
      tile(TileType.TONG, 3, 10),
      tile(TileType.TONG, 7, 11),
      tile(TileType.FENG, 1, 12),
      tile(TileType.FENG, 2, 13),
    ];
    p.handTiles = hand;
    expect(p.getExpectedHandSize(false)).to.equal(13);
    expect(p.needsToDiscard()).to.equal(false);

    const discarded = tile(TileType.WAN, 3, 100);
    expect(p.chi([hand[0], hand[1]], discarded)).to.equal(true);
    // 吃后多一张义务牌
    expect(p.handTiles.length).to.equal(11);
    expect(p.getExpectedHandSize(false)).to.equal(10);
    expect(p.needsToDiscard()).to.equal(true);

    p.discardTile(0);
    expect(p.handTiles.length).to.equal(10);
    expect(p.getExpectedHandSize(false)).to.equal(10);
    expect(p.needsToDiscard()).to.equal(false);
  });

  it('requirePlayerToDiscard：无需出牌时跳过，不进入 AI handleDiscard', async () => {
    const game = new Game();
    game.setupPlayers(true);
    const handler = new GameEventHandler(game, TileManager.getInstance());
    const player = game.getAllPlayers()[0];
    expect(player.needsToDiscard()).to.equal(false);

    let discardCalled = false;
    const orig = (handler as any).handleCurrentPlayerDiscard.bind(handler);
    (handler as any).handleCurrentPlayerDiscard = async () => {
      discardCalled = true;
      return orig();
    };

    await (handler as any).requirePlayerToDiscard(player, '杠');
    expect(discardCalled).to.equal(false);
  });

  it('nextTurn：下家已多一张时跳过摸牌，不抛「手牌数量无效」', () => {
    const game = new Game();
    game.setupPlayers(true);
    const handler = new GameEventHandler(game, TileManager.getInstance());
    handler.startGame();
    expect(game.state).to.equal(GameState.PLAYING);

    // 让「下家」处于已多一张（模拟上一轮未出牌就被切走）
    const curIdx = game.currentPlayerIndex;
    const nextIdx = (curIdx + 1) % 4;
    const next = game.getAllPlayers()[nextIdx];
    // startGame 后庄家已摸，其他人应为 13；给下家再塞一张制造 +1
    if (next.handTiles.length === next.getExpectedHandSize(false)) {
      const extra = tile(TileType.WAN, 9, 9999);
      next.handTiles.push(extra);
      next.lastDrawnTile = extra;
    }
    expect(next.handTiles.length).to.equal(next.getExpectedHandSize(false) + 1);

    expect(() => handler.nextTurn()).to.not.throw();
    expect(game.currentPlayerIndex).to.equal(nextIdx);
    // 跳过摸牌后仍保持 +1，可供出牌
    expect(next.handTiles.length).to.equal(next.getExpectedHandSize(false) + 1);
    expect(next.state).to.equal(PlayerState.ACTING);
  });
});
