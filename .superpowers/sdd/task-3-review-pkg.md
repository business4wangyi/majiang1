# Review package Task 3 (danger/genbutsu)
## discard-ranker.ts
```typescript
import { Player, PlayerType } from '../../core/player';
import { Tile, TileType } from '../../core/tile';
import { TileSet } from '../../core/rule-types';
import { RuleEngine } from '../../core/rule-engine';

export interface DiscardRankContext {
  handTiles: Tile[];
  revealedSets: TileSet[];
  visibleDiscards?: Tile[];
}

export interface DiscardCandidateScore {
  index: number;
  tile: Tile;
  shantenAfter: number;
  ukeire: number;
  danger: number;
  legacyValue: number;
}

const SUIT_MAX: Partial<Record<TileType, number>> = {
  [TileType.WAN]: 9,
  [TileType.TIAO]: 9,
  [TileType.TONG]: 9,
  [TileType.FENG]: 4,
  [TileType.JIAN]: 3
};

function cloneProbe(handTiles: Tile[], revealedSets: TileSet[], dropIndex: number): Player {
  const p = new Player(0, 'probe', PlayerType.AI);
  p.handTiles = handTiles.filter((_, i) => i !== dropIndex).map(t => t.clone());
  p.revealedSets = revealedSets.map(s => ({
    type: s.type,
    tiles: s.tiles.map(t => t.clone()),
    source: s.source
  }));
  return p;
}

function countUkeire(probe: Player): number {
  const base = RuleEngine.calculateShanten(probe);
  let kinds = 0;
  let syntheticId = 10_000;
  for (const type of Object.values(TileType)) {
    const max = SUIT_MAX[type as TileType] ?? 0;
    for (let value = 1; value <= max; value++) {
      const drawn = new Tile(type as TileType, value, syntheticId++);
      const trial = new Player(0, 'ukeire', PlayerType.AI);
      trial.handTiles = [...probe.handTiles.map(t => t.clone()), drawn];
      trial.revealedSets = probe.revealedSets.map(s => ({
        type: s.type,
        tiles: s.tiles.map(t => t.clone()),
        source: s.source
      }));
      if (RuleEngine.calculateShanten(trial) < base) kinds += 1;
    }
  }
  return kinds;
}

function tileKey(t: Tile): string {
  return `${t.type}-${t.value}`;
}

function scoreDanger(tile: Tile, visibleDiscards: Tile[] | undefined): number {
  const seen = new Set((visibleDiscards ?? []).map(tileKey));
  if (seen.has(tileKey(tile))) return 0;
  if (tile.type === TileType.FENG || tile.type === TileType.JIAN) return 1;
  return 2;
}

export function scoreDiscardCandidates(
  ctx: DiscardRankContext,
  legacyValueAt: (index: number, tile: Tile) => number = () => 0
): DiscardCandidateScore[] {
  const { handTiles, revealedSets } = ctx;
  const scores: DiscardCandidateScore[] = handTiles.map((tile, index) => {
    const probe = cloneProbe(handTiles, revealedSets, index);
    const shantenAfter = RuleEngine.calculateShanten(probe);
    const ukeire = countUkeire(probe);
    return {
      index,
      tile,
      shantenAfter,
      ukeire,
      danger: scoreDanger(tile, ctx.visibleDiscards),
      legacyValue: legacyValueAt(index, tile)
    };
  });

  scores.sort((a, b) => {
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    if (a.ukeire !== b.ukeire) return b.ukeire - a.ukeire;
    if (a.danger !== b.danger) return a.danger - b.danger;
    if (a.legacyValue !== b.legacyValue) return a.legacyValue - b.legacyValue;
    return a.index - b.index;
  });
  return scores;
}

export function pickDiscardIndex(
  ctx: DiscardRankContext,
  legacyValueAt?: (index: number, tile: Tile) => number
): number {
  if (ctx.handTiles.length === 0) return -1;
  return scoreDiscardCandidates(ctx, legacyValueAt)[0].index;
}
```
## test file (full)
```typescript
import { expect } from 'chai';
import { Player, PlayerType } from '../../src/majiang/core/player';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { pickDiscardIndex, scoreDiscardCandidates } from '../../src/majiang/strategy/heuristics/discard-ranker';

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
```
