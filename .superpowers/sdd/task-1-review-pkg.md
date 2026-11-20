# Review package Task 1
Base: 62dc73fe33b11ee4ff7178f7a3a5e96d15244d82 (pre-task; no commits — working tree)
Head: working tree

## Status
 M src/majiang/strategy/index.ts
?? src/majiang/strategy/heuristics/
?? tests/majiang/discard-ranker.test.ts

## Diff: strategy/index.ts
diff --git a/src/majiang/strategy/index.ts b/src/majiang/strategy/index.ts
index 2be57ce..69632f3 100644
--- a/src/majiang/strategy/index.ts
+++ b/src/majiang/strategy/index.ts
@@ -143,11 +143,13 @@ export const MAJIANG_ALPHAZERO_INFO = {
     '温度控制探索',
     '游戏适配器集成'
   ],
   technicalSpecs: {
     inputDimension: 320,
     outputDimension: 39,
     defaultNetworkLayers: [512, 256, 128],
     defaultMCTSSimulations: 800,
     supportedActions: ['DISCARD', 'CHI', 'PENG', 'GANG', 'HU', 'PASS']
   }
-};
\ No newline at end of file
+};
+
+export * from './heuristics';
\ No newline at end of file

## New file: heuristics/discard-ranker.ts
```typescript
import { Player, PlayerType } from '../../core/player';
import { Tile } from '../../core/tile';
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

export function scoreDiscardCandidates(
  ctx: DiscardRankContext,
  legacyValueAt: (index: number, tile: Tile) => number = () => 0
): DiscardCandidateScore[] {
  const { handTiles, revealedSets } = ctx;
  const scores: DiscardCandidateScore[] = handTiles.map((tile, index) => {
    const probe = cloneProbe(handTiles, revealedSets, index);
    const shantenAfter = RuleEngine.calculateShanten(probe);
    return {
      index,
      tile,
      shantenAfter,
      ukeire: 0, // Task 2 填充
      danger: 0, // Task 3 填充
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

## New file: heuristics/index.ts
```typescript
export {
  scoreDiscardCandidates,
  pickDiscardIndex,
  DiscardRankContext,
  DiscardCandidateScore
} from './discard-ranker';
```

## New file: tests/majiang/discard-ranker.test.ts
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
```
