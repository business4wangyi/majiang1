# Final whole-branch review package — majiang AI P1
Merge-base / start HEAD: 62dc73fe33b11ee4ff7178f7a3a5e96d15244d82
Head: working tree (no commits per Global Constraints)

## Status
 M src/majiang/strategy/agents/ai-player.ts
 M src/majiang/strategy/index.ts
 M src/majiang/ui/game-event-handler.ts
?? docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md
?? docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md
?? src/majiang/strategy/heuristics/
?? tests/majiang/discard-ranker.test.ts

## Diff stat (tracked)
 src/majiang/strategy/agents/ai-player.ts | 71 ++++++++++----------------------
 src/majiang/strategy/index.ts            |  4 +-
 src/majiang/ui/game-event-handler.ts     | 11 +++++
 3 files changed, 35 insertions(+), 51 deletions(-)

## Full tracked diffs -U8
diff --git a/src/majiang/strategy/agents/ai-player.ts b/src/majiang/strategy/agents/ai-player.ts
index d990f7b..5c12271 100644
--- a/src/majiang/strategy/agents/ai-player.ts
+++ b/src/majiang/strategy/agents/ai-player.ts
@@ -1,19 +1,25 @@
-import { debugLog, errorLog, infoLog } from '../../tools/logger';
+import { debugLog, errorLog } from '../../tools/logger';
 import { Player, PlayerType } from '../../core/player';
 import { Tile, TileType } from '../../core/tile';
-import { displayManager } from '../../ui/display-manager';
 import { GameEventHandler } from '../../ui/game-event-handler';
 import { AUTO_PLAY_MODE } from '../../config/runtime-state';
 import { WinConditions } from '../../core/win-conditions/win-conditions-main';
+import { pickDiscardIndex } from '../heuristics/discard-ranker';
 
 export class AIPlayer extends Player {
   private static idCounter = 1;
 
+  private visibleDiscards: Tile[] = [];
+
+  public setVisibleDiscards(tiles: Tile[]): void {
+    this.visibleDiscards = tiles.map(t => t.clone());
+  }
+
   /**
    * AI策略相关常量
    */
   private static AI_STRATEGY = {
     // 牌的基础评分权重
     WEIGHTS: {
       PAIR: 10,         // 对子
       TRIPLET: 25,      // 刻子
@@ -126,16 +132,17 @@ export class AIPlayer extends Player {
       errorLog('游戏错误检查原因')
       process.exit(0)
     }
     // 新增日志：出牌前输出手牌、明牌、总数、canHu判定
     debugLog(`[AI日志] 玩家: ${this.name}，操作: 出牌前，手牌: ${this.handTiles.map(t=>t.toString()).join(' ')}，明牌: ${(this.revealedSets||[]).map(set=>set.tiles.map(t=>t.toString()).join(',')).join('|')}，总数: ${this.handTiles.length + (this.revealedSets||[]).reduce((sum,set)=>sum+set.tiles.length,0)}`);
     const canHuResult = WinConditions.canHu(this);
     debugLog(`[AI日志] canHu判定: ${canHuResult.canHu}, 描述: ${canHuResult.description}`);
     await AIPlayer.pauseForThinking();
+    this.setVisibleDiscards(gameEventHandler.collectVisibleDiscards());
     try {
       // 埋点：AI出牌决策
       const discardIndex = this.getAIMove();
 
       // 验证索引是否有效
       if (discardIndex < 0 || discardIndex >= this.handTiles.length) {
         debugLog(`AI玩家 ${this.name} 返回的索引 ${discardIndex} 无效`);
         debugLog(`AI玩家 ${this.name} 无法决定要打出哪张牌，随机选择`);
@@ -216,79 +223,43 @@ export class AIPlayer extends Player {
         debugLog(`AI玩家无法出牌，请检查游戏状态`);
       }
 
       errorLog('游戏错误检查原因')
       process.exit(0)
     }
   }
 
-  // 获取AI出牌选择（优化版）
+  // 获取AI出牌选择（P1：向听启发式排序，旧权重仅破平）
   public getAIMove(): number {
     debugLog(`AI玩家 ${this.name} 正在思考出牌...`);
     debugLog(`当前手牌数量: ${this.handTiles.length}`);
 
     // 安全检查：如果手牌为空，返回-1
     if (this.handTiles.length === 0) {
       debugLog(`警告: AI玩家 ${this.name} 没有手牌可出`);
       return -1;
     }
 
     try {
-
       // 打印手牌详情用于调试
       debugLog(`AI玩家 ${this.name} 手牌详情: ${this.handTiles.map((t, idx) => `${idx}:${t.toString()}`).join(' ')}`);
 
-      // 使用needsToDiscard方法判断是否需要出牌
-      if (this.needsToDiscard()) {
-        // 获取每张牌的价值评分
-        const tileValues = this.getAllTileValues();
-
-        // 安全检查：确保有评分结果
-        if (tileValues.length > 0) {
-          // 选择价值最低的牌
-          const lowestValueTile = tileValues[0];
-          // 验证索引有效性
-          if (lowestValueTile.index >= 0 && lowestValueTile.index < this.handTiles.length) {
-            infoLog(`手牌数量超过预期(${this.getExpectedHandSize()})，实际(${this.handTiles.length})，选择价值最低的牌，索引=${lowestValueTile.index}, 牌=${lowestValueTile.tile.toString()}, 价值=${lowestValueTile.value}`);
-            if (this.handTiles.length > this.getExpectedHandSize() + 1) {
-              displayManager.displayPlayerHand(this)
-              errorLog(`退出游戏排查问题`);
-              process.exit(0);
-            }
-            return lowestValueTile.index;
-          } else {
-            debugLog(`警告: 评分结果索引无效 ${lowestValueTile.index}，使用备选策略`);
-          }
-        }
-
-        // 如果评分失败，使用安全的备选策略：打出最后一张牌
-        const lastIndex = this.handTiles.length - 1;
-        debugLog(`评分失败，使用备选策略: 打出最后一张牌，索引=${lastIndex}`);
-        return lastIndex;
-      }
-
-      // 获取每张牌的价值评分
-      const tileValues = this.getAllTileValues();
-
-      // 安全检查：确保有评分结果
-      if (tileValues.length > 0) {
-        const selectedIndex = tileValues[0].index;
-        // 确保索引在有效范围内
-        if (selectedIndex >= 0 && selectedIndex < this.handTiles.length) {
-          debugLog(`AI选择打出索引 ${selectedIndex}: ${this.handTiles[selectedIndex].toString()}, 价值: ${tileValues[0].value}`);
-          return selectedIndex;
-        } else {
-          debugLog(`错误: AI返回的索引 ${selectedIndex} 超出范围，改为使用默认策略`);
-        }
-      } else {
-        debugLog(`错误: 牌值评估结果为空，使用默认策略`);
+      const index = pickDiscardIndex(
+        {
+          handTiles: this.handTiles,
+          revealedSets: this.revealedSets ?? [],
+          visibleDiscards: this.visibleDiscards
+        },
+        (i, tile) => this.evaluateTileValue(tile, i)
+      );
+      if (index >= 0 && index < this.handTiles.length) {
+        debugLog(`AI P1排序选择索引 ${index}: ${this.handTiles[index].toString()}`);
+        return index;
       }
-
-      // 如果评分系统出问题，返回最后一张牌的索引（最安全）
       return this.handTiles.length - 1;
     } catch (error) {
       errorLog(`AI出牌决策发生错误: ${error instanceof Error ? error.message : error}`);
       errorLog(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
 
       // 发生错误时返回最后一张牌的索引（最安全）
       return this.handTiles.length > 0 ? this.handTiles.length - 1 : -1;
     }
diff --git a/src/majiang/strategy/index.ts b/src/majiang/strategy/index.ts
index 2be57ce..69632f3 100644
--- a/src/majiang/strategy/index.ts
+++ b/src/majiang/strategy/index.ts
@@ -145,9 +145,11 @@ export const MAJIANG_ALPHAZERO_INFO = {
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
diff --git a/src/majiang/ui/game-event-handler.ts b/src/majiang/ui/game-event-handler.ts
index 17361ee..7f40e23 100644
--- a/src/majiang/ui/game-event-handler.ts
+++ b/src/majiang/ui/game-event-handler.ts
@@ -33,16 +33,27 @@ export class GameEventHandler {
 
   public currentRound = 0;
   private lastWinBySelfDrawn: boolean = false; // 记录本局胡牌是否自摸
   private lastLoserIndex: number = -1; // 记录点炮者索引（荣和时）
   /** 胡牌当时算出的分，结算时作兜底（避免终局再判 canHu 失败得 0） */
   private lastWinScore: number = 0;
   private roundSettled = false;
 
+  /** 汇总桌上各家已弃牌（clone），供 AI 现物危险度评估；窄 API，不暴露整局 Game */
+  public collectVisibleDiscards(): Tile[] {
+    const out: Tile[] = [];
+    for (const p of this.game.getAllPlayers()) {
+      for (const t of p.discardedTiles ?? []) {
+        out.push(t.clone());
+      }
+    }
+    return out;
+  }
+
   /**
    * 启动游戏
    */
   public async safeStartGameAndEnd(): Promise<void> {
     try {
       this.startGame();
       
       // 实现主循环，确保游戏正常进行

## Untracked: heuristics/discard-ranker.ts
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
## Untracked: heuristics/index.ts
```typescript
export {
  scoreDiscardCandidates,
  pickDiscardIndex,
  DiscardRankContext,
  DiscardCandidateScore
} from './discard-ranker';
```
## Untracked: discard-ranker.test.ts
```typescript
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
```
## Spec §9/§10 excerpt
152:## 9. 验收（本文件本身）
153-
154-- [x] 算法族 + 代表系统表完整  
155-- [x] 本仓模块对照表完整  
156-- [x] 推荐路径写死为 P1→P2，P3 单独立项  
157-- [x] 硬不做与规则边界明确  
158-- [x] 用户要求写计划后，已开 `writing-plans`（P1）：`docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md`
159-- [ ] P1 实现交付验收（人确认）：计划已执行、代码在工作区、回归测绿；**未**勾「已交付」——待用户确认后再勾
160-- [ ] P2 期望值审牌层：P1 落地后再另开 plan（独立 plan，不并入本 P1）
161-- [ ] P3 深度 RL：须单独立项 brainstorm，不在本调研包施工
162-
163:## 10. 后续闸门
164-
165-1. **P1**：按 `docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md` 执行（向听 / 有效牌 / 现物危险度）  
166-   - 事实备注（2026-11-20 Task 6）：plan 已执行；`discard-ranker` / `rule-engine` / `game-session` 相关回归经 `node scripts/test/run-mocha-cjs.js` 全绿（3376 passing）；代码仍在工作区、未 commit；**人验收未勾**
167-2. **P2**：P1 验收后再开独立 plan（期望值审牌层）；不与本 P1 plan 合并  
168-3. **P3**：先开新 brainstorm（算力、许可、规则变体）再写 plan  
169-4. 提交时机按 `commit-policy.md`：用户明确要求提交时再 commit

## Minor findings roll-up from progress ledger
## Minor findings roll-up

- T1: test title still says 顺子 but hand is 刻子向; unused imports; TONG branch unused in assert
- T2: unused Player/PlayerType imports; optional assert ukeire>0; tenpai ukeire ceiling noted
- T3: hoist seen-Set; optional direct danger matrix tests; producer wiring is Task 5
- T4: optional scoreDiscardCandidates debug summary; getAllTileValues now dead private
- T5: no handleDiscard E2E glue test (brief didn't require); double clone nit
