import { expect } from 'chai';
import { AIPlayer } from '../../src/majiang/strategy/agents/ai-player';
import { Tile, TileType } from '../../src/majiang/core/tile';

describe('AIPlayer · P2 接入', () => {
  it('显式 p2 策略时 getDiscardStrategy 为 p2', () => {
    const ai = new AIPlayer('测P2', 'p2');
    expect(ai.getDiscardStrategy()).to.equal('p2');
  });

  it('p2 在孤张字牌局面应打出字牌', () => {
    const ai = new AIPlayer('测P2出牌', 'p2');
    // brief 顺子手在 calculateRegularShanten（向听下限 0）下打孤张 ukeire=0，
    // 拆中张反而 ukeire 虚高；与 Task1/P1、ev-discard-evaluator 同构，改用刻子向。
    let n = 1;
    ai.handTiles = [
      new Tile(TileType.WAN, 1, n++),
      new Tile(TileType.WAN, 1, n++),
      new Tile(TileType.WAN, 1, n++),
      new Tile(TileType.WAN, 9, n++),
      new Tile(TileType.WAN, 9, n++),
      new Tile(TileType.WAN, 9, n++),
      new Tile(TileType.TIAO, 1, n++),
      new Tile(TileType.TIAO, 1, n++),
      new Tile(TileType.TIAO, 1, n++),
      new Tile(TileType.TIAO, 9, n++),
      new Tile(TileType.TIAO, 9, n++),
      new Tile(TileType.FENG, 1, n++), // 东 · 孤张
      new Tile(TileType.FENG, 2, n++), // 南 · 孤张
      new Tile(TileType.FENG, 3, n++) // 西 · 孤张
    ];
    const idx = ai.getAIMove();
    expect(ai.handTiles[idx].type).to.equal(TileType.FENG);
  });
});
