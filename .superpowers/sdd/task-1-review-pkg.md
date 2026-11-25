# Review package: 9cd390aa57414550503e25c251a100f72d4859e7..WORKING_TREE (Task 1, no commit)

## Commits
(none — commit deferred per plan Global Constraints)

## Files changed (vs BASE, Task-1 scope)
 src/majiang/strategy/heuristics/index.ts | 9 +++++++++
 1 file changed, 9 insertions(+)

## Untracked / status
 M src/majiang/strategy/heuristics/index.ts
?? src/majiang/strategy/heuristics/ev-discard-evaluator.ts
?? tests/majiang/ev-discard-evaluator.test.ts

## Diff
diff --git a/src/majiang/strategy/heuristics/index.ts b/src/majiang/strategy/heuristics/index.ts
index df98619..a02d6d8 100644
--- a/src/majiang/strategy/heuristics/index.ts
+++ b/src/majiang/strategy/heuristics/index.ts
@@ -1,6 +1,15 @@
 export {
   scoreDiscardCandidates,
   pickDiscardIndex,
   DiscardRankContext,
   DiscardCandidateScore
 } from './discard-ranker';
+
+export {
+  scoreDiscardByEv,
+  pickDiscardIndexByEv,
+  estimateDealInRisk,
+  EV_CONSTANTS,
+  EvDiscardContext,
+  EvDiscardScore
+} from './ev-discard-evaluator';

### NEW FILE: src/majiang/strategy/heuristics/ev-discard-evaluator.ts
diff --git a/src/majiang/strategy/heuristics/ev-discard-evaluator.ts b/src/majiang/strategy/heuristics/ev-discard-evaluator.ts
new file mode 100644
--- /dev/null
+++ b/src/majiang/strategy/heuristics/ev-discard-evaluator.ts
+import { Tile, TileType } from '../../core/tile';
+import {
+  DiscardRankContext,
+  scoreDiscardCandidates
+} from './discard-ranker';
+
+export interface EvDiscardContext extends DiscardRankContext {
+  tilesLeft?: number;
+}
+
+export interface EvDiscardScore {
+  index: number;
+  tile: Tile;
+  shantenAfter: number;
+  ukeire: number;
+  dealInRisk: number;
+  offense: number;
+  defense: number;
+  ev: number;
+}
+
+export const EV_CONSTANTS = {
+  WIN_PROXY: 100,
+  DEAL_IN_PENALTY: 120,
+  LATE_TILES_LEFT: 30,
+  LATE_RISK_MULT: 1.4
+};
+
+function tileKey(t: Tile): string {
+  return `${t.type}-${t.value}`;
+}
+
+export function estimateDealInRisk(
+  tile: Tile,
+  visibleDiscards?: Tile[],
+  tilesLeft?: number
+): number {
+  const seen = new Set((visibleDiscards ?? []).map(tileKey));
+  let risk: number;
+  if (seen.has(tileKey(tile))) risk = 0.05;
+  else if (tile.type === TileType.FENG || tile.type === TileType.JIAN) risk = 0.25;
+  else if (tile.value === 1 || tile.value === 9) risk = 0.35;
+  else risk = 0.55;
+
+  if (
+    tilesLeft != null &&
+    tilesLeft < EV_CONSTANTS.LATE_TILES_LEFT
+  ) {
+    risk = Math.min(1, risk * EV_CONSTANTS.LATE_RISK_MULT);
+  }
+  return risk;
+}
+
+export function scoreDiscardByEv(
+  ctx: EvDiscardContext,
+  legacyValueAt?: (index: number, tile: Tile) => number
+): EvDiscardScore[] {
+  const ranked = scoreDiscardCandidates(ctx, legacyValueAt);
+  const scores: EvDiscardScore[] = ranked.map(r => {
+    const dealInRisk = estimateDealInRisk(
+      r.tile,
+      ctx.visibleDiscards,
+      ctx.tilesLeft
+    );
+    const offense =
+      (EV_CONSTANTS.WIN_PROXY / Math.pow(r.shantenAfter + 1, 2)) *
+      (r.ukeire + 1);
+    const defense = dealInRisk * EV_CONSTANTS.DEAL_IN_PENALTY;
+    return {
+      index: r.index,
+      tile: r.tile,
+      shantenAfter: r.shantenAfter,
+      ukeire: r.ukeire,
+      dealInRisk,
+      offense,
+      defense,
+      ev: offense - defense
+    };
+  });
+
+  scores.sort((a, b) => {
+    if (a.ev !== b.ev) return b.ev - a.ev;
+    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
+    if (a.ukeire !== b.ukeire) return b.ukeire - a.ukeire;
+    return a.index - b.index;
+  });
+  return scores;
+}
+
+export function pickDiscardIndexByEv(
+  ctx: EvDiscardContext,
+  legacyValueAt?: (index: number, tile: Tile) => number
+): number {
+  if (ctx.handTiles.length === 0) return -1;
+  return scoreDiscardByEv(ctx, legacyValueAt)[0].index;
+}

### NEW FILE: tests/majiang/ev-discard-evaluator.test.ts
diff --git a/tests/majiang/ev-discard-evaluator.test.ts b/tests/majiang/ev-discard-evaluator.test.ts
new file mode 100644
--- /dev/null
+++ b/tests/majiang/ev-discard-evaluator.test.ts
+import { expect } from 'chai';
+import { Tile, TileType } from '../../src/majiang/core/tile';
+import {
+  pickDiscardIndexByEv,
+  scoreDiscardByEv
+} from '../../src/majiang/strategy/heuristics/ev-discard-evaluator';
+
+function tid() {
+  let n = 1;
+  return { next: () => n++ };
+}
+
+describe('ev-discard-evaluator · 进攻期望', () => {
+  it('有明显孤张字牌时，应优先打出该孤张（offense 主导）', () => {
+    const id = tid();
+    // plan 顺子手在 calculateRegularShanten（向听下限 0）下打孤张 ukeire=0，
+    // 拆中张反而 ukeire 虚高；与 P1 discard-ranker 测例同构，改用刻子向。
+    const handTiles = [
+      new Tile(TileType.WAN, 1, id.next()),
+      new Tile(TileType.WAN, 1, id.next()),
+      new Tile(TileType.WAN, 1, id.next()),
+      new Tile(TileType.WAN, 9, id.next()),
+      new Tile(TileType.WAN, 9, id.next()),
+      new Tile(TileType.WAN, 9, id.next()),
+      new Tile(TileType.TIAO, 1, id.next()),
+      new Tile(TileType.TIAO, 1, id.next()),
+      new Tile(TileType.TIAO, 1, id.next()),
+      new Tile(TileType.TIAO, 9, id.next()),
+      new Tile(TileType.TIAO, 9, id.next()),
+      new Tile(TileType.FENG, 1, id.next()), // 东 · 孤张
+      new Tile(TileType.FENG, 2, id.next()), // 南 · 孤张
+      new Tile(TileType.FENG, 3, id.next()) // 西 · 孤张
+    ];
+    const idx = pickDiscardIndexByEv({ handTiles, revealedSets: [] });
+    expect(handTiles[idx].type).to.equal(TileType.FENG);
+    const scores = scoreDiscardByEv({ handTiles, revealedSets: [] });
+    expect(scores[0].tile.type).to.equal(TileType.FENG);
+    expect(scores[0].ev).to.be.greaterThan(scores[scores.length - 1].ev);
+  });
+});
