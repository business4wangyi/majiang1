# Review package: Task 3 WORKING_TREE (no commit)

## Commits
(none)

## Status
 M src/majiang/strategy/agents/ai-player.ts
?? tests/majiang/ai-player-p2.test.ts

## Diff: ai-player.ts vs BASE
diff --git a/src/majiang/strategy/agents/ai-player.ts b/src/majiang/strategy/agents/ai-player.ts
index c3bafab..0f3b8b1 100644
--- a/src/majiang/strategy/agents/ai-player.ts
+++ b/src/majiang/strategy/agents/ai-player.ts
@@ -1,25 +1,28 @@
 import { debugLog, errorLog } from '../../tools/logger';
 import { Player, PlayerType } from '../../core/player';
 import { Tile, TileType } from '../../core/tile';
 import { GameEventHandler } from '../../ui/game-event-handler';
 import { AUTO_PLAY_MODE } from '../../config/runtime-state';
 import { WinConditions } from '../../core/win-conditions/win-conditions-main';
 import { pickDiscardIndex } from '../heuristics/discard-ranker';
+import { pickDiscardIndexByEv } from '../heuristics/ev-discard-evaluator';
 
-/** 弃牌策略：legacy=旧权重（默认）；p1=向听排序（试用，需显式打开） */
-export type DiscardStrategy = 'p1' | 'legacy';
+/** 弃牌策略：legacy=旧权重（默认）；p1=向听排序；p2=期望值（试用，需显式打开） */
+export type DiscardStrategy = 'p1' | 'p2' | 'legacy';
 
 function resolveDiscardStrategy(explicit?: DiscardStrategy): DiscardStrategy {
-  if (explicit === 'p1' || explicit === 'legacy') return explicit;
-  // 试用开关：MAJIANG_DISCARD_STRATEGY=p1
-  return process.env.MAJIANG_DISCARD_STRATEGY === 'p1' ? 'p1' : 'legacy';
+  if (explicit === 'p1' || explicit === 'p2' || explicit === 'legacy') return explicit;
+  // 试用开关：MAJIANG_DISCARD_STRATEGY=p1|p2
+  const env = process.env.MAJIANG_DISCARD_STRATEGY;
+  if (env === 'p1' || env === 'p2') return env;
+  return 'legacy';
 }
 
 export class AIPlayer extends Player {
   private static idCounter = 1;
 
   private visibleDiscards: Tile[] = [];
   private discardStrategy: DiscardStrategy = 'legacy';
 
   public setVisibleDiscards(tiles: Tile[]): void {
     this.visibleDiscards = tiles.map(t => t.clone());
@@ -267,20 +270,37 @@ export class AIPlayer extends Player {
         if (tileValues.length > 0) {
           const idx = tileValues[0].index;
           if (idx >= 0 && idx < this.handTiles.length) {
             debugLog(`AI legacy选择索引 ${idx}: ${this.handTiles[idx].toString()}`);
             return idx;
           }
         }
         return this.handTiles.length - 1;
       }
 
+      if (this.discardStrategy === 'p2') {
+        const index = pickDiscardIndexByEv(
+          {
+            handTiles: this.handTiles,
+            revealedSets: this.revealedSets ?? [],
+            visibleDiscards: this.visibleDiscards
+            // tilesLeft：本切片不强制注入；后续可在 EventHandler 设可选 setter
+          },
+          (i, tile) => this.evaluateTileValue(tile, i)
+        );
+        if (index >= 0 && index < this.handTiles.length) {
+          debugLog(`AI P2期望值选择索引 ${index}: ${this.handTiles[index].toString()}`);
+          return index;
+        }
+        return this.handTiles.length - 1;
+      }
+
       const index = pickDiscardIndex(
         {
           handTiles: this.handTiles,
           revealedSets: this.revealedSets ?? [],
           visibleDiscards: this.visibleDiscards
         },
         (i, tile) => this.evaluateTileValue(tile, i)
       );
       if (index >= 0 && index < this.handTiles.length) {
         debugLog(`AI P1排序选择索引 ${index}: ${this.handTiles[index].toString()}`);

### NEW FILE: tests/majiang/ai-player-p2.test.ts
diff --git a/tests/majiang/ai-player-p2.test.ts b/tests/majiang/ai-player-p2.test.ts
new file mode 100644
--- /dev/null
+++ b/tests/majiang/ai-player-p2.test.ts
+import { expect } from 'chai';
+import { AIPlayer } from '../../src/majiang/strategy/agents/ai-player';
+import { Tile, TileType } from '../../src/majiang/core/tile';
+
+describe('AIPlayer · P2 接入', () => {
+  it('显式 p2 策略时 getDiscardStrategy 为 p2', () => {
+    const ai = new AIPlayer('测P2', 'p2');
+    expect(ai.getDiscardStrategy()).to.equal('p2');
+  });
+
+  it('p2 在孤张字牌局面应打出字牌', () => {
+    const ai = new AIPlayer('测P2出牌', 'p2');
+    // brief 顺子手在 calculateRegularShanten（向听下限 0）下打孤张 ukeire=0，
+    // 拆中张反而 ukeire 虚高；与 Task1/P1、ev-discard-evaluator 同构，改用刻子向。
+    let n = 1;
+    ai.handTiles = [
+      new Tile(TileType.WAN, 1, n++),
+      new Tile(TileType.WAN, 1, n++),
+      new Tile(TileType.WAN, 1, n++),
+      new Tile(TileType.WAN, 9, n++),
+      new Tile(TileType.WAN, 9, n++),
+      new Tile(TileType.WAN, 9, n++),
+      new Tile(TileType.TIAO, 1, n++),
+      new Tile(TileType.TIAO, 1, n++),
+      new Tile(TileType.TIAO, 1, n++),
+      new Tile(TileType.TIAO, 9, n++),
+      new Tile(TileType.TIAO, 9, n++),
+      new Tile(TileType.FENG, 1, n++), // 东 · 孤张
+      new Tile(TileType.FENG, 2, n++), // 南 · 孤张
+      new Tile(TileType.FENG, 3, n++) // 西 · 孤张
+    ];
+    const idx = ai.getAIMove();
+    expect(ai.handTiles[idx].type).to.equal(TileType.FENG);
+  });
+});
