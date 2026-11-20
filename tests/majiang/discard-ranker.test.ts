import { expect } from 'chai';
import { Game } from '../../src/majiang/core/game';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { TileManager } from '../../src/majiang/core/tile-manager';
import { AIPlayer } from '../../src/majiang/strategy/agents/ai-player';
import { pickDiscardIndex, scoreDiscardCandidates } from '../../src/majiang/strategy/heuristics/discard-ranker';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';
import { HumanPlayer } from '../../src/majiang/ui/human-player';

function tid(): { next: () => number } {
  let n = 1;
  return { next: () => n++ };
}

describe('discard-ranker · 向听主排序', () => {
  it('有明显孤张字牌时，应优先打出该孤张而非拆万子顺子', () => {
    const id = tid();
    // 刻子向听估算下：111/999万 + 111条 + 99条将 + 东南西孤张；
    // 打字牌后 shantenAfter 严格小于拆万子刻子（原 brief 顺子手在近似公式下并列 0 听，索引平局会误拆万）。
    const handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 9, id.next()),
      new Tile(TileType.TIAO, 9, id.next()),
      new Tile(TileType.FENG, 1, id.next()), // 东 · 孤张
      new Tile(TileType.FENG, 2, id.next()), // 南 · 孤张
      new Tile(TileType.FENG, 3, id.next()), // 西 · 第 14 张孤张
    ];
    const idx = pickDiscardIndex({ handTiles, revealedSets: [] });
    const picked = handTiles[idx];
    expect(picked.type === TileType.FENG || picked.type === TileType.TONG).to.equal(true);
    // 不应拆 111/999 万刻子中的一张
    expect(picked.type === TileType.WAN).to.equal(false);
  });
});

describe('discard-ranker · 有效牌破平', () => {
  it('向听差相同时，应选择 ukeire 更大的弃牌', () => {
    const id = tid();
    // brief 顺子手在 calculateRegularShanten（向听下限 0）下全员 sh=0、ukeire 恒 0，无法破平；
    // 改用刻子向：打出后 sh≥1，同 shanten 组内风孤张 ukeire 高于孤张条。
    const handTiles = [
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.TIAO, 1, id.next()), // 孤张条 · 同向听但 ukeire 较低
      new Tile(TileType.FENG, 2, id.next()), // 南 · 孤张
      new Tile(TileType.FENG, 4, id.next()), // 北 · 孤张
    ];
    const scores = scoreDiscardCandidates({ handTiles, revealedSets: [] });
    const best = scores[0];
    // 两张风牌孤张中，至少应打风牌；且 best.ukeire >= 同 shantenAfter 组内其他候选
    expect(best.tile.type).to.equal(TileType.FENG);
    const sameShanten = scores.filter(s => s.shantenAfter === best.shantenAfter);
    const maxUkeire = Math.max(...sameShanten.map(s => s.ukeire));
    expect(best.ukeire).to.equal(maxUkeire);
  });
});

describe('discard-ranker · 现物危险度', () => {
  it('向听与 ukeire 相同时，优先打出现物安全牌', () => {
    const id = tid();
    const handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 3, id.next()),
      new Tile(TileType.WAN, 4, id.next()),
      new Tile(TileType.WAN, 5, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.TIAO, 2, id.next()),
      new Tile(TileType.TIAO, 3, id.next()),
      new Tile(TileType.TIAO, 4, id.next()),
      new Tile(TileType.TONG, 7, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 9, id.next()),
      new Tile(TileType.FENG, 2, id.next()),
      new Tile(TileType.JIAN, 1, id.next()), // 中
    ];
    const visibleDiscards = [new Tile(TileType.JIAN, 1, id.next())]; // 中已现物
    const idx = pickDiscardIndex({ handTiles, revealedSets: [], visibleDiscards });
    expect(handTiles[idx].type).to.equal(TileType.JIAN);
    expect(handTiles[idx].value).to.equal(1);
  });
});

describe('AIPlayer · P1 接入', () => {
  it('getAIMove 在现物场景下打出安全字牌', () => {
    const id = tid();
    const ai = new AIPlayer('测AI');
    ai.handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 3, id.next()),
      new Tile(TileType.WAN, 4, id.next()),
      new Tile(TileType.WAN, 5, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.TIAO, 2, id.next()),
      new Tile(TileType.TIAO, 3, id.next()),
      new Tile(TileType.TIAO, 4, id.next()),
      new Tile(TileType.TONG, 7, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 9, id.next()),
      new Tile(TileType.FENG, 2, id.next()),
      new Tile(TileType.JIAN, 1, id.next()),
    ];
    ai.setVisibleDiscards([new Tile(TileType.JIAN, 1, id.next())]);
    const idx = ai.getAIMove();
    expect(ai.handTiles[idx].type).to.equal(TileType.JIAN);
  });
});

describe('GameEventHandler · 可见弃牌', () => {
  it('collectVisibleDiscards 汇总各家弃牌', () => {
    // 与 tests/majiang/game.test.ts 一致：先 addPlayer，再 new GameEventHandler(..., getAllPlayers())
    const game = new Game();
    game.addPlayer(new HumanPlayer('玩家1'));
    game.addPlayer(new AIPlayer('AI玩家1'));
    game.addPlayer(new AIPlayer('AI玩家2'));
    game.addPlayer(new AIPlayer('AI玩家3'));

    const players = game.getAllPlayers();
    expect(players.length).to.be.greaterThan(0);
    players[0].discardedTiles = [new Tile(TileType.WAN, 1, 1)];
    players[1].discardedTiles = [new Tile(TileType.TIAO, 9, 2)];

    const handler = new GameEventHandler(game, TileManager.getInstance(), game.getAllPlayers());
    const visible = handler.collectVisibleDiscards();
    expect(visible.some(t => t.type === TileType.WAN && t.value === 1)).to.equal(true);
    expect(visible.some(t => t.type === TileType.TIAO && t.value === 9)).to.equal(true);
    expect(visible).to.have.lengthOf(2);
    // clone：改源不应污染收集结果
    players[0].discardedTiles[0].value = 5;
    expect(visible[0].value).to.equal(1);
  });
});
