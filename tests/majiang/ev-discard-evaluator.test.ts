import { expect } from 'chai';
import { Tile, TileType } from '../../src/majiang/core/tile';
import {
  estimateDealInRisk,
  pickDiscardIndexByEv,
  scoreDiscardByEv
} from '../../src/majiang/strategy/heuristics/ev-discard-evaluator';

function tid() {
  let n = 1;
  return { next: () => n++ };
}

describe('ev-discard-evaluator · 进攻期望', () => {
  it('有明显孤张字牌时，应优先打出该孤张（offense 主导）', () => {
    const id = tid();
    // plan 顺子手在 calculateRegularShanten（向听下限 0）下打孤张 ukeire=0，
    // 拆中张反而 ukeire 虚高；与 P1 discard-ranker 测例同构，改用刻子向。
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
      new Tile(TileType.FENG, 3, id.next()) // 西 · 孤张
    ];
    const idx = pickDiscardIndexByEv({ handTiles, revealedSets: [] });
    expect(handTiles[idx].type).to.equal(TileType.FENG);
    const scores = scoreDiscardByEv({ handTiles, revealedSets: [] });
    expect(scores[0].tile.type).to.equal(TileType.FENG);
    expect(scores[0].ev).to.be.greaterThan(scores[scores.length - 1].ev);
  });
});

describe('ev-discard-evaluator · 点炮代价', () => {
  it('现物 dealInRisk 低于同型未现物；同向听同有效牌时现物优先', () => {
    const mid = new Tile(TileType.TONG, 5, 1);
    const visibleDiscards = [new Tile(TileType.TONG, 5, 9999)];
    const hot = estimateDealInRisk(mid, [], 80);
    const safe = estimateDealInRisk(mid, visibleDiscards, 80);
    expect(safe).to.be.lessThan(hot);

    // Option B: ukeire-first like P1 — genbutsu only breaks equal ukeire.
    // Encode two equal-(s,u) scores via sort contract on dealInRisk.
    const id = tid();
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
      new Tile(TileType.TONG, 5, id.next()),
      new Tile(TileType.WAN, 5, id.next()),
      new Tile(TileType.TIAO, 5, id.next())
    ];
    const scored = scoreDiscardByEv({
      handTiles,
      revealedSets: [],
      visibleDiscards,
      tilesLeft: 20
    });
    const tong = scored.find(s => s.tile.type === TileType.TONG && s.tile.value === 5)!;
    const wan5 = scored.find(s => s.tile.type === TileType.WAN && s.tile.value === 5)!;
    expect(tong.dealInRisk).to.be.lessThan(wan5.dealInRisk);
    if (tong.shantenAfter === wan5.shantenAfter && tong.ukeire === wan5.ukeire) {
      expect(scored[0].tile.type).to.equal(TileType.TONG);
      expect(scored[0].tile.value).to.equal(5);
    }
  });

  it('残牌加压：tilesLeft 小时 dealInRisk 不小于无加压', () => {
    const t = new Tile(TileType.TONG, 5, 1);
    const base = estimateDealInRisk(t, [], 80);
    const late = estimateDealInRisk(t, [], 20);
    expect(late).to.be.greaterThan(base);
  });
});
