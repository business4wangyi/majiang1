# Review package Task 5
## ai-player.ts diff
diff --git a/src/majiang/strategy/agents/ai-player.ts b/src/majiang/strategy/agents/ai-player.ts
index d990f7b..5c12271 100644
--- a/src/majiang/strategy/agents/ai-player.ts
+++ b/src/majiang/strategy/agents/ai-player.ts
@@ -1,21 +1,27 @@
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
       SEQUENCE: 8,      // 顺子贡献
       NEAR_COMPLETE: 5, // 接近完成的组合
@@ -124,20 +130,21 @@ export class AIPlayer extends Player {
     if (this.handTiles.length === 0) {
       errorLog(`AI玩家 ${this.name} 不需要出牌，手牌数量：${this.handTiles.length}`);
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
 
         // 随机选择一张牌出牌
@@ -214,83 +221,47 @@ export class AIPlayer extends Player {
       } catch (fallbackError) {
         debugLog(`AI出牌恢复策略也失败: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
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
   }
 

## game-event-handler.ts diff
diff --git a/src/majiang/ui/game-event-handler.ts b/src/majiang/ui/game-event-handler.ts
index 17361ee..7f40e23 100644
--- a/src/majiang/ui/game-event-handler.ts
+++ b/src/majiang/ui/game-event-handler.ts
@@ -31,20 +31,31 @@ export class GameEventHandler {
     this.tileManager = tileManager;
   }
 
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
       debugLog(`[DEBUG] 安全模式局内循环开始: currentRound=${this.currentRound}`);
       

## test tail
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
