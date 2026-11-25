# Review package: Task 2 working tree (no commit)

## Commits
(none — commit deferred)

## Implementer report summary
See task-2-report.md

## Files changed (Task 2 scope)
?? src/majiang/strategy/heuristics/ev-discard-evaluator.ts
?? tests/majiang/ev-discard-evaluator.test.ts

## Diff: evaluator (should be empty or constants-only vs Task1 intent)

### FILE: tests/majiang/ev-discard-evaluator.test.ts
diff --git a/tests/majiang/ev-discard-evaluator.test.ts b/tests/majiang/ev-discard-evaluator.test.ts
--- /dev/null (created Task1, extended Task2)
+++ b/tests/majiang/ev-discard-evaluator.test.ts
+import { expect } from 'chai';
+import { Tile, TileType } from '../../src/majiang/core/tile';
+import {
+  estimateDealInRisk,
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
+
+describe('ev-discard-evaluator · 点炮代价', () => {
+  it('两张候选进攻接近时，应优先打出现物（可见弃牌中已有同型）', () => {
+    const id = tid();
+    // brief 顺子手在向听下限 0 下 offense 虚高压过 defense；改用刻子向 + 三张孤张中张。
+    // 无现物时打危险中张；注入 5 筒现物后 offense 仍接近，defense 拉开应打现物中张（意图不变）。
+    const mid = new Tile(TileType.TONG, 5, id.next());
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
+      mid,
+      new Tile(TileType.WAN, 5, id.next()),
+      new Tile(TileType.TIAO, 5, id.next())
+    ];
+    const withoutGenbun = pickDiscardIndexByEv({
+      handTiles,
+      revealedSets: [],
+      tilesLeft: 20
+    });
+    expect(handTiles[withoutGenbun].type).to.not.equal(TileType.TONG);
+    expect(handTiles[withoutGenbun].value).to.equal(5);
+
+    const visibleDiscards = [new Tile(TileType.TONG, 5, 9999)];
+    const idx = pickDiscardIndexByEv({
+      handTiles,
+      revealedSets: [],
+      visibleDiscards,
+      tilesLeft: 20
+    });
+    expect(handTiles[idx].type).to.equal(TileType.TONG);
+    expect(handTiles[idx].value).to.equal(5);
+  });
+
+  it('残牌加压：tilesLeft 小时 dealInRisk 不小于无加压', () => {
+    const t = new Tile(TileType.TONG, 5, 1);
+    const base = estimateDealInRisk(t, [], 80);
+    const late = estimateDealInRisk(t, [], 20);
+    expect(late).to.be.greaterThan(base);
+  });
+});

### FILE: src/majiang/strategy/heuristics/ev-discard-evaluator.ts (current)
(still untracked; unchanged if Task2 only locked tests)
      96 src/majiang/strategy/heuristics/ev-discard-evaluator.ts
