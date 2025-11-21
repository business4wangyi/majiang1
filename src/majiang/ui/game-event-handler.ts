import { Game, GameState } from '../core/game';
import { displayManager } from '../ui/display-manager';
import { askConfirmation, askQuestion, askMultipleChoice, InputState, getNextDiscardIndex } from '../ui/input';
import { Player, PlayerState, PlayerType } from '../core/player';
import { debugLog, errorLog, infoLog } from '../tools/logger';
import { Tile, TileType } from '../core/tile';
import { TileManager } from '../core/tile-manager';
import { WinConditions } from './win-conditions/win-conditions-main';
import { GangType, PlayerAction } from '../core/rule-types';
import { RuleEngine } from '../core/rule-engine';
import { AIPlayer } from '../strategy/agents/ai-player';
import { DEBUG_MODE, AUTO_PLAY_MODE } from './index';
import { AUTO_PLAY_ROUNDS } from './config/config';
import { ScoreCalculator } from './score-calculator';
import { runAutoGameLoop, runInteractiveGameLoop } from '../ui/gameLoop';

/**
 * 游戏事件处理器类
 * 负责处理游戏中的特殊事件，如牌山空、手牌数量异常等
 * 同时也负责游戏流程控制
 */
export class GameEventHandler {
  protected game: Game;
  protected tileManager: TileManager;
  constructor(
    game: Game,
    tileManager: TileManager,
  ) {
    this.game = game;
    this.tileManager = tileManager;
  }

  public currentRound = 0;
  private lastWinBySelfDrawn: boolean = false; // 记录本局胡牌是否自摸
  private lastLoserIndex: number = -1; // 记录点炮者索引（荣和时）

  /**
   * 启动游戏
   */
  public async safeStartGameAndEnd(): Promise<void> {
    try {
      this.startGame();
      
      // 实现主循环，确保游戏正常进行
      debugLog(`[DEBUG] 安全模式局内循环开始: currentRound=${this.currentRound}`);
      
      // 模拟游戏主循环直到游戏结束
      while (this.game.state === GameState.PLAYING) {
        // 获取当前玩家
        const currentPlayer = this.game.getCurrentPlayer();
        
        // 检查特殊操作
        let specialAction = await this.checkSpecialActions(currentPlayer);
        
        // 如果没有特殊操作，正常出牌
        if (!specialAction) {
          await this.handleCurrentPlayerDiscard();
        }
        
        // 检查游戏是否结束
        if (this.checkGameEnd()) {
          break;
        }
        
        // 如果牌山已空，结束游戏
        if (this.game.getRemainingTiles() <= 0) {
          this.game.setState(GameState.ENDED);
          break;
        }
        
        // 下一回合
        this.nextTurn();
      }
      
      debugLog(`[DEBUG] 安全模式局内循环结束: currentRound=${this.currentRound}`);
    } catch (e) {
      debugLog(`[DEBUG] round exception: ${e instanceof Error ? e.stack : e}`);
    } finally {
      await this.handleGameEnd();
    }
  }

  /**
   * 启动游戏
   */
  public startGame(): void {
    // 新一局前重置所有玩家状态和牌
    for (const player of this.game.getAllPlayers()) {
      player.state = PlayerState.WAITING;
      player.handTiles = [];
      player.discardedTiles = [];
      player.revealedSets = [];
      player.flowerTiles = [];
      player.lastDrawnTile = null;
    }
    displayManager.print("开始游戏...");
    
    // 检查玩家数量
    displayManager.print(`游戏中共有 ${this.game.getAllPlayers().length} 名玩家`);
    
    // 初始化游戏状态
    this.game.setState(GameState.INIT);
    displayManager.print("重置牌山...");
    // 确保使用的是 TileManager 单例
    this.tileManager = TileManager.getInstance();
    this.tileManager.reset();
    
    displayManager.print("开始发牌...");
    this.dealInitialTiles();
    
    // 设置第一个玩家为当前玩家，并设置状态为ACTING
    this.game.setCurrentPlayerIndex(0);
    
    // 确保所有玩家状态正确
    for (let i = 0; i < this.game.getAllPlayers().length; i++) {
      this.updatePlayerState(i);
    }

    // 切换游戏状态为PLAYING
    this.game.setState(GameState.PLAYING);
    displayManager.printSuccess("游戏初始化完成，状态转为 PLAYING");
    
    // 为庄家（第一个玩家）摸一张牌
    const firstPlayer = this.game.getAllPlayers()[0];
    displayManager.printTitle(`庄家 ${firstPlayer.name} 开局摸牌`);
    const drawnTile = this.drawTileForPlayer(firstPlayer, { 
      notify: true, 
      incrementCount: true 
    });
    
    // 游戏启动时摸牌必定有牌
    displayManager.printSuccess(`庄家 ${firstPlayer.name} 摸了一张牌: ${firstPlayer.type === PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
  }

  /**
   * 处理游戏启动时的初始化工作
   */
  public prepareGameStart(): void {
    infoLog(`准备启动游戏...`);
    
    // 确保当前玩家状态为ACTING，其他玩家为WAITING
    const players = this.game.getAllPlayers();
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (i === this.game.currentPlayerIndex) {
        if (player.state !== PlayerState.ACTING) {
          infoLog(`将当前玩家 ${player.name} 状态设置为 ACTING`);
          player.state = PlayerState.ACTING;
        }
      } else {
        if (player.state !== PlayerState.WAITING) {
          infoLog(`将玩家 ${player.name} 状态设置为 WAITING`);
          player.state = PlayerState.WAITING;
        }
      }
    }
    
    infoLog(`游戏准备就绪`);
  }

  /**
   * 为所有玩家发初始手牌
   */
  public dealInitialTiles(): void {
    // 每个玩家发13张牌
    displayManager.print(`开始为 ${this.game.getAllPlayers().length} 名玩家发初始手牌...`);
    
    // 确保所有玩家的手牌和弃牌数组都已初始化并清空
    for (const player of this.game.getAllPlayers()) {
      player.handTiles = [];
      player.discardedTiles = [];
      debugLog(`重置玩家 ${player.name} 的手牌和弃牌堆`);
    }
    
    // 优化发牌逻辑：按照麻将传统方式每次每人4张，最后一张
    displayManager.print("开始发牌：每人13张初始手牌");
    
    // 发牌轮数 (4+4+4+1)
    const rounds = [4, 4, 4, 1];
    
    for (const [roundIndex, cardsPerPlayer] of rounds.entries()) {
      displayManager.print(`第${roundIndex + 1}轮发牌: 每人${cardsPerPlayer}张`);
      
      // 每轮为每个玩家发指定数量的牌
      for (const player of this.game.getAllPlayers()) {
        for (let i = 0; i < cardsPerPlayer; i++) {
          // 游戏启动时摸牌必定有牌
          const tile = this.drawTileForPlayer(player, {
            notify: false,
            validate: false,
            incrementCount: false
          });
          debugLog(`给玩家 ${player.name} 发牌: ${tile.toString()}, 当前手牌数量: ${player.handTiles.length}`);
        }
      }
    }
    
    // 验证每位玩家手牌数量
    displayManager.printTitle("发牌完成，最终玩家手牌状态");
    for (const player of this.game.getAllPlayers()) {
      // 使用Player类的方法判断手牌数量是否合理
      const expectedHandSize = player.getExpectedHandSize(false);
      if (!player.hasValidHandSize(false)) {
        displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/${expectedHandSize})，游戏无法继续`);
        return;
      }

      // 只在发牌结束时打印详细手牌
      displayManager.displayPlayerHand(player);
    }
    // 只打印一次分隔线
    displayManager.printDivider();
  }

  /**
   * 为指定玩家摸一张牌。gameLoop在摸牌前已经确保了牌山有牌
   * @param player 要摸牌的玩家
   * @param options 摸牌选项
   * @returns 摸到的牌，或null表示没有摸到
   */
  public drawTileForPlayer(player: Player, options: {
    notify?: boolean,         // 是否通知显示
    validate?: boolean,       // 是否验证手牌数量
    incrementCount?: boolean  // 是否增加摸牌计数
  } = {}): Tile {
    // 设置默认选项
    const { 
      notify = true, 
      validate = false, 
      incrementCount = false 
    } = options;
    
    // 验证手牌数量
    if (validate && !player.hasValidHandSize(false)) {
      const expectedHandSize = player.getExpectedHandSize(false);
      errorLog(`玩家 ${player.name} 手牌数量不正确: ${player.handTiles.length}，预期: ${expectedHandSize}`);
      displayManager.displayPlayerHand(player)
      errorLog(`退出游戏排查问题`);
      throw new Error('手牌数量无效');
    }

    // 检查牌山是否还有牌
    if (this.tileManager.getRemainingTiles() === 0) {
      errorLog(`牌山已空，无法摸牌,gameLoop没有确保牌山有牌`);
      errorLog(`退出游戏排查问题`);
      throw new Error('牌山已空');
    }

    // 摸牌
    const tile = this.tileManager.drawTile();
    player.drawTile(tile!);
      
    // 更新计数器
    if (incrementCount) {
      this.game.incrementDrawCount();
    }
    
    // 通知显示
    if (notify) {
      displayManager.addToTurnLog(`${player.name} 摸了一张牌[${tile?.toString()}]`);
    }
    
    return tile!;
  }

  /**
   * 当前玩家摸牌.gameLoop在摸牌前已经确保了牌山有牌
   */
  public currentPlayerDraw(): Tile {
    debugLog('当前玩家摸牌')

    const currentPlayer = this.game.getAllPlayers()[this.game.currentPlayerIndex];
    
    // 检查是否是海底捞月的情况（剩余一张牌）
    // if (this.tileManager.getRemainingTiles() === 1) {
    //   // 尝试海底捞月
    //   if (this.checkHaiDiLaoYue(currentPlayer)) {
    //     return currentPlayer.lastDrawnTile!;
    //   }
    // }
    
    // 正常摸牌
    const drawnTile = this.drawTileForPlayer(currentPlayer, {
      notify: true,
      validate: true,
      incrementCount: true
    });
    
    // 摸牌后，检查当前玩家是否可以自摸胡牌
    debugLog(`玩家 ${currentPlayer.name} 摸到了 ${drawnTile.toString()}`);
    // 新增调试：每次摸牌后输出canHu判定
    const huResult = RuleEngine.getHuDetails(currentPlayer, null, { isDrawn: true, isLastTile: this.tileManager.getRemainingTiles() === 0 });
    debugLog(`[调试] ${currentPlayer.name} 摸牌后canHu: ${huResult.canHu}, huType: ${huResult.huType}, desc: ${huResult.description}`);
    if (huResult.canHu) {
      const winTypeInfo = ScoreCalculator.getWinTypeInfo(huResult.huType);
      displayManager.printSuccess(`${currentPlayer.name} 自摸胡牌！游戏结束！`);
      // 显示胡牌信息
      displayManager.printSuccess(`${currentPlayer.name} 胡牌类型: ${winTypeInfo.name}, 胡牌描述: ${huResult.description}`);
      // 计算得分
      const scoreResult = RuleEngine.calculateScore(currentPlayer, huResult.huType, { isSelfDrawn: true });
      displayManager.printSuccess(`得分: ${scoreResult.score}`);
      // 设置玩家状态为胡牌
      currentPlayer.state = PlayerState.WON;
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
    }
    
    return drawnTile;
  }

  /**
   * 当前玩家打出一张牌
   */
  public currentPlayerDiscard(tileIndex: number): Tile {
    const currentPlayer = this.game.getAllPlayers()[this.game.currentPlayerIndex];
    
    // 验证玩家状态
    if (currentPlayer.state !== PlayerState.ACTING) {
      displayManager.printWarning(`玩家 ${currentPlayer.name} 不处于ACTING状态，当前状态: ${PlayerState[currentPlayer.state]}`);
      errorLog('游戏错误，排查问题');
      throw new Error('玩家状态无效');
    }
    
    // 使用player.discardTile方法，该方法已经增强了安全性和错误处理
    const discardedTile = currentPlayer.discardTile(tileIndex);
    
    // 如果成功打出，更新游戏状态
    this.game.setLastDiscardedTile(discardedTile);
    displayManager.printSuccess(`玩家 ${currentPlayer.name} 成功打出: ${discardedTile.toString()}`);
    
    return discardedTile;
  }

  /**
   * 进入下一个玩家的回合
   * @param skipDraw 是否跳过摸牌步骤，在吃碰杠后切换玩家时应设为true
   */
  public nextTurn(skipDraw: boolean = false): void {
    debugLog('进入下一个玩家的回合')

    if (this.game.state != GameState.PLAYING) {
      displayManager.printWarning(`游戏已结束，不再执行回合。准备进入结算`);
      return
    }

    if (this.tileManager.getRemainingTiles() === 0) {
      displayManager.printWarning(`牌山已空，不再执行回合。准备进入结算`);
      return
    }

    // 获取当前玩家并更新状态
    const currentPlayer = this.game.getAllPlayers()[this.game.currentPlayerIndex];
    currentPlayer.state = PlayerState.WAITING;
    displayManager.print(`玩家 ${currentPlayer.name} 出牌结束，状态变为 WAITING`);
    
    // 计算下一个玩家
    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % this.game.getAllPlayers().length;
    this.game.setCurrentPlayerIndex(nextPlayerIndex);
    
    // 更新下一个玩家的状态
    this.updatePlayerState(nextPlayerIndex)
    
    // 显示下一个玩家信息
    const nextPlayer = this.game.getAllPlayers()[nextPlayerIndex];
    displayManager.printDivider();
    displayManager.printTitle(`轮到 ${nextPlayer.name} 行动 [手牌: ${nextPlayer.handTiles.length}张] [已亮出牌： ${nextPlayer.revealedSets.flatMap(set => set.tiles).length}张] [合计${nextPlayer.getTotalTileCount()}张]`);
    // 普通回合只打印简要手牌
    displayManager.displayHand(nextPlayer, false, false, true);
    
    // 只有在非跳过摸牌的情况下才为下一个玩家摸牌
    if (!skipDraw) {
      this.currentPlayerDraw();
    }
  }

  /**
   * 强制AI玩家出牌
   */
  public async forceAIPlayerDiscard(): Promise<void> {
    // 获取当前玩家
    const currentPlayer = this.game.getAllPlayers()[this.game.currentPlayerIndex];
    
    // 检查是否为AI玩家
    if (currentPlayer.type !== PlayerType.AI) {
      displayManager.printWarning(`当前玩家不是AI，无法强制出牌`);
    }
    
    // 确保玩家处于可以出牌的状态
    currentPlayer.state = PlayerState.ACTING;
    
    // 优先使用AIPlayer的handleDiscard方法
    if (currentPlayer instanceof AIPlayer) {
      await currentPlayer.handleDiscard(this);

      return
    }
    
    // 如果不是AIPlayer实例，使用基本方法
    // 使用AI决策获取出牌索引
    const discardIndex = currentPlayer.getRandomMove();
    displayManager.printWarning(`强制AI玩家 ${currentPlayer.name} 出牌，选择索引: ${discardIndex}`);
    
    // 执行出牌
    const discarded = this.currentPlayerDiscard(discardIndex);
    displayManager.printSuccess(`AI玩家 ${currentPlayer.name} 成功打出: ${discarded.toString()}`);
  }

  /**
   * 更新指定玩家的状态
   */
  public updatePlayerState(playerIndex: number): void {
    if (playerIndex < 0 || playerIndex >= this.game.getAllPlayers().length) {
      return;
    }
    const player = this.game.getAllPlayers()[playerIndex];
    if (playerIndex === this.game.currentPlayerIndex) {
      player.state = PlayerState.ACTING;
    } else {
      player.state = PlayerState.WAITING;
    }
    debugLog(`更新玩家 ${player.name} 状态为 ${PlayerState[player.state]}`);
  }

  /**
   * 检查游戏是否应该结束
   * 只负责检查，不修改游戏状态
   * @returns 是否应该结束游戏
   */
  public checkGameEnd(): boolean {
    // 检查是否有玩家胡牌
    const players = this.game.getAllPlayers();
    
    // 只检查已经被标记为胜利的玩家，而不主动检查所有玩家是否可以胡牌
    const wonPlayer = players.find(player => player.state === PlayerState.WON);
    if (wonPlayer) {
      debugLog(`检测到玩家 ${wonPlayer.name} 已经胡牌，游戏结束`);
      displayManager.printSuccess(`${wonPlayer.name} 胡牌了！游戏结束！`);
      
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
      return true;
    }

    // 检查牌山是否为空且所有玩家都过牌
    if (this.tileManager.getRemainingTiles() === 0) {
      const allPlayersPassed = players.every(player => 
        player.state === PlayerState.FINISHED
      );
      
      if (allPlayersPassed) {
        debugLog(`牌山已空且所有玩家都已过牌，游戏流局`);
        // 设置游戏状态为结束
        this.game.setState(GameState.ENDED);
        return true;
      }
    }

    return false;
  }

  /**
   * 检查玩家是否胡牌
   * @param player 要检查的玩家
   * @returns 是否胡牌
   */
  private checkHu(player: Player, tile: Tile | null = null): boolean {
    // 使用 RuleEngine 的 getHuDetails 方法判断是否可以胡牌
    const result = RuleEngine.getHuDetails(player, tile);
    
    // 如果可以胡牌，记录胡牌类型
    if (result.canHu) {
      const huType = result.huType;
      const winTypeInfo = ScoreCalculator.getWinTypeInfo(huType);
      const description = result.description || WinConditions.getHuTypeDescription(huType);
      displayManager.printSuccess(`${player.name} 胡牌类型: ${winTypeInfo.name}, 胡牌描述: ${description}`);
      
      // 计算得分
      const scoreResult = RuleEngine.calculateScore(player, huType, { isSelfDrawn: tile === null });
      displayManager.printSuccess(`得分: ${scoreResult.score}`);
      displayManager.printSuccess(`得分详情: ${JSON.stringify(scoreResult.details)}`);
      
      // 设置玩家状态为胡牌
      player.state = PlayerState.WON;
    }
    
    return result.canHu;
  }

  /**
   * 处理牌山为空的情况
   * 负责显示状态、设置游戏状态和询问用户是否开始新局
   * @returns Promise<boolean> 是否开始新局
   */
  public static async handleEmptyTileDeck(game: Game): Promise<boolean> {
    // 显示警告信息
    displayManager.printWarning(`牌山已空，无法继续摸牌！`);
    displayManager.printDivider();
    // 记录游戏状态
    infoLog(`牌山已空，总共摸牌次数: ${game.drawCount}`);
    // 设置游戏状态为结束
    game.state = GameState.ENDED;
    // 显示游戏总结
    this.displayGameSummary(game);
    // 自动模式下直接进入下一局
    if (AUTO_PLAY_MODE) {
      return true;
    }
    // 询问用户是否开始新局（仅人工模式）
    return await askConfirmation("牌山已空，是否开始新局？", true, 10000);
  }
  
  /**
   * 显示游戏总结
   */
  private static displayGameSummary(game: Game): void {
    displayManager.printTitle("游戏总结");
    // 显示玩家信息
    const players = game.getAllPlayers();
    for (const player of players) {
      displayManager.print(`玩家 ${player.name}:`);
      displayManager.print(`- 手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
      displayManager.print(`- 手牌数量: ${player.handTiles.length}`);
      displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组: ${player.revealedSets.map(set => `${set.tiles.map(t => t.toString()).join(' ')} (${set.type})`).join(' ')}`);
      displayManager.print(`- 状态: ${PlayerState[player.state]}`);
    }
    displayManager.print(`总摸牌次数: ${game.drawCount}`);
    displayManager.print(`剩余牌数: ${game.getRemainingTiles()}`);
    displayManager.printDivider();
  }

  /**
   * 处理玩家碰牌
   * @param player 要碰牌的玩家
   * @param tile 要碰的牌
   * @returns 是否成功碰牌
   */
  public async handlePeng(player: Player, tile: Tile): Promise<boolean> {
    // 使用 RuleEngine 检查是否可以碰
    if (!RuleEngine.canPeng(player, tile)) {
      displayManager.printError(`${player.name} 没有足够的牌进行碰牌`);
      return false;
    }
    
    // 使用 player.peng 方法执行碰牌操作
    const result = player.peng(tile);
    
    if (result) {
      displayManager.printSuccess(`${player.name} 碰了 ${tile.toString()}`);
      
      // 碰牌成功后，设置该玩家为当前玩家
      const playerIndex = this.game.getAllPlayers().findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        this.game.setCurrentPlayerIndex(playerIndex);
        
        // 更新玩家状态
        player.state = PlayerState.ACTING;

        // 更新玩家的最后一张牌
        player.lastDrawnTile = tile;

        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "碰");
      }
    } else {
      displayManager.printError(`${player.name} 碰牌失败`);
    }
    
    return result;
  }

  /**
   * 处理玩家杠牌
   * @param player 要杠牌的玩家
   * @param tile 要杠的牌
   * @returns 是否成功杠牌
   */
  public async handleGang(player: Player, tile: Tile | null = null): Promise<boolean> {
    // 准备游戏状态信息
    const gameState = {
      currentPlayer: this.game.getCurrentPlayer(),
      allPlayers: this.game.getAllPlayers()
    };
    
    // 使用 RuleEngine 检查是否可以杠
    const gangResult = RuleEngine.canGang(player, tile, gameState);
    
    if (!gangResult.canGang) {
      displayManager.printError(`${player.name} 无法进行杠牌操作`);
      return false;
    }
    
    let gangSuccess = false;
    
    // 根据杠牌类型调用对应的处理方法
    switch (gangResult.gangType) {
      case GangType.MING:
        // 明杠
        gangSuccess = await this.handleMingGang(player, tile!);
        break;
      case GangType.AN:
        // 暗杠
        gangSuccess = await this.handleAnGang(player);
        break;
      case GangType.BU:
        // 补杠
        gangSuccess = await this.handleBuGang(player);
        break;
      case GangType.QIANG:
        // 抢杠
        gangSuccess = await this.handleQiangGang(player, gangResult.tiles || []);
        break;
      default:
        displayManager.printError(`未知的杠牌类型`);
        return false;
    }
    
    return gangSuccess;
  }

  /**
   * 执行明杠操作
   * 只处理杠牌逻辑，不包含杠上开花的检查
   * @param player 要杠牌的玩家
   * @param tile 要杠的牌
   * @returns 是否成功杠牌
   */
  private executeMingGang(player: Player, tile: Tile): boolean {
    // 使用 player.gang 方法进行明杠
    const result = player.gang(tile);
    
    if (result) {
      displayManager.printSuccess(`${player.name} 明杠了 ${tile.toString()}`);
      return true;
    } else {
      displayManager.printError(`${player.name} 没有足够的牌进行明杠`);
      return false;
    }
  }

  /**
   * 处理明杠
   * @param player 要杠牌的玩家
   * @param tile 要杠的牌
   * @returns 是否成功杠牌（包括杠上开花检查）
   */
  private async handleMingGang(player: Player, tile: Tile): Promise<boolean> {
    // 执行明杠
    const gangSuccess = this.executeMingGang(player, tile);
    
    // 明杠成功后，检查杠上开花
    if (gangSuccess) {
      // 设置该玩家为当前玩家
      const playerIndex = this.game.getAllPlayers().findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {

        this.game.setCurrentPlayerIndex(playerIndex);
        
        // 更新玩家状态
        this.updatePlayerState(playerIndex)
      }

      // 更新玩家的最后一张牌
      player.lastDrawnTile = tile;
      
      // 如果牌山为空，直接返回成功，但仍需出牌
      if (this.tileManager.getRemainingTiles() === 0) {
        displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
        
        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "杠");
        
        return true;
      }
      
      // 杠上开花
      const huResult = await this.checkGangShangKaiHua(player);
      
      // 如果没有胡牌，需要出牌
      if (!huResult) {
        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "杠");
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 处理暗杠
   * @param player 要暗杠的玩家
   * @returns 是否成功暗杠
   */
  public async handleAnGang(player: Player): Promise<boolean> {
    // 暗杠使用 player.gang(null) 方法
    if (player.gang(null)) {
      displayManager.printSuccess(`${player.name} 暗杠了一组牌`);

      // 如果牌山为空，直接返回成功，但仍需出牌
      if (this.tileManager.getRemainingTiles() === 0) {
        displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
        
        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "杠");
        
        return true;
      }
      
      // 暗杠成功后，应该摸牌
      this.drawTileForPlayer(player, { notify: true });

      // 检查是否可以胡牌
      const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
      if (huResult.canHu) { 
        displayManager.printSuccess(`${player.name} 暗杠后胡牌！类型：${huResult.description}`);
        // 设置玩家状态为胡牌
        player.state = PlayerState.WON;
        // 设置游戏状态为结束
        this.game.setState(GameState.ENDED);
        return true;
      }
      
      // 暗杠后需要出牌
      await this.requirePlayerToDiscard(player, "暗杠");
      
      return true;
    }
    return false;
  }

  /**
   * 检查杠上开花
   * 在成功杠牌后调用，检查摸到的牌是否可以胡牌
   * @param player 要检查的玩家
   * @returns 是否成功胡牌
   */
  private async checkGangShangKaiHua(player: Player): Promise<boolean> {
    debugLog('检查杠上开花')

    // 记录杠牌成功
    displayManager.printSuccess(`${player.name} 杠牌成功，摸一张新牌`);
    
    // 摸一张牌
    const drawnTile = this.drawTileForPlayer(player, { notify: true });
    
    // 检查是否可以胡牌，并指定游戏状态为杠上开花
    const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
    if (huResult.canHu) {
      displayManager.printSuccess(`${player.name} 杠上开花胡牌！类型：${huResult.description}`);
      
      // 设置玩家状态为胡牌
      player.state = PlayerState.WON;
      
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
      
      return true;
    } else {
      displayManager.print(`${player.name} 摸了一张牌：${player.type === PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
    }
    
    return false;
  }

  // /**
  //  * 检查海底捞月
  //  * 在摸最后一张牌时调用，检查是否可以胡牌
  //  * @param player 要检查的玩家
  //  * @returns 是否成功海底捞月
  //  */
  // private checkHaiDiLaoYue(player: Player): boolean {
  //   debugLog('检查海底捞月')

  //   // 检查牌山是否只剩一张牌
  //   if (this.tileManager.getRemainingTiles() !== 1) return false;
    
  //   // 摸最后一张牌（不实际摸牌，只是模拟能否海底捞月）
  //   // this.drawTileForPlayer(player, { notify: true });
    
  //   // 检查是否可以胡牌，并指定游戏状态为海底捞月
  //   const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isLastTile: true });
  //   if (huResult.canHu) {
  //     displayManager.printSuccess(`${player.name} 海底捞月胡牌！类型：${huResult.description}`);
  //     // 设置玩家状态为胡牌
  //     player.state = PlayerState.WON;
  //     // 设置游戏状态为结束
  //     this.game.setState(GameState.ENDED);
  //     return true;
  //   }
    
  //   return false;
  // }

  /**
   * 处理玩家吃牌
   * @param player 要吃牌的玩家
   * @param tile 要吃的牌
   * @returns 是否成功吃牌
   */
  public async handleChi(player: Player, tile: Tile): Promise<boolean> {
    // 使用 RuleEngine 检查玩家是否可以吃
    if (!RuleEngine.canChi(player, tile)) {
      displayManager.printError(`${player.name} 不能吃 ${tile.toString()}`);
      return false;
    }

    // 获取所有可能的吃牌组合
    const possibleCombinations = RuleEngine.findChiCombinations(player.handTiles, tile);
    if (possibleCombinations.length === 0) {
      displayManager.printError(`${player.name} 没有可以吃的牌组合`);
      return false;
    }

    let selectedCombination: Tile[];

    // 根据玩家类型选择吃牌组合
    if (player.type === PlayerType.HUMAN) {
      displayManager.print(`请选择要吃的组合：`);
      possibleCombinations.forEach((combo, index) => {
        displayManager.print(`${index + 1}. ${combo.map(t => t.toString()).join(' ')}`);
      });

      // 等待玩家输入
      const choice = parseInt(await askQuestion("请输入选择的组合编号："));
      if (isNaN(choice) || choice < 1 || choice > possibleCombinations.length) {
        displayManager.printError("无效的选择");
        return false;
      }

      selectedCombination = possibleCombinations[choice - 1];
    } else {
      // AI玩家自动选择第一个可用的组合
      selectedCombination = possibleCombinations[0];
    }

    // 筛选出不包含目标牌的组合部分（即玩家手牌部分）
    const handTilesToUse = selectedCombination.filter(t => t.id !== tile.id);
    
    // 使用 player.chi 方法来处理吃牌逻辑
    const result = player.chi(handTilesToUse, tile);
    
    if (result) {
      displayManager.printSuccess(`${player.name} 吃了 ${tile.toString()}`);
      
      // 吃牌成功后，设置该玩家为当前玩家
      const playerIndex = this.game.getAllPlayers().findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        this.game.setCurrentPlayerIndex(playerIndex);
        
        // 更新玩家状态
        player.state = PlayerState.ACTING;

        // 更新玩家的最后一张牌
        player.lastDrawnTile = tile;
        
        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "吃");
      }
    } else {
      displayManager.printError(`${player.name} 吃牌失败`);
    }
    
    return result;
  }

  /**
   * 处理人类玩家出牌
   * @param player 人类玩家
   * @param tileIndex 要打出的牌的索引
   * @returns 是否成功出牌
   */
  public handleHumanPlayerDiscard(player: Player, tileIndex: number): boolean {
    if (player.type !== PlayerType.HUMAN) {
      displayManager.printError("只有人类玩家可以使用此方法");
      return false;
    }

    // 使用 player.discardTile 方法
    const tile = player.discardTile(tileIndex);

    // 更新游戏状态
    if (tile) {
      this.game.setLastDiscardedTile(tile);
      displayManager.printSuccess(`${player.name} 打出了 ${tile.toString()}`);
      return true;
    } else {
      displayManager.printError("打出的牌为 null");
      return false;
    }
  }

  /**
   * 处理玩家补杠
   * @param player 要补杠的玩家
   * @returns 是否成功补杠
   */
  public async handleBuGang(player: Player): Promise<boolean> {
    // 补杠使用 player.gang(null) 方法
    if (player.gang(null)) {
      displayManager.printSuccess(`${player.name} 补杠了一组牌`);

      // 设置该玩家为当前玩家
      const playerIndex = this.game.getAllPlayers().findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {

        this.game.setCurrentPlayerIndex(playerIndex);
        
        // 更新玩家状态
        this.updatePlayerState(playerIndex)
      }

      // 如果牌山为空，直接返回成功，但仍需出牌
      if (this.tileManager.getRemainingTiles() === 0) {
        displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
        
        // 要求玩家出牌
        await this.requirePlayerToDiscard(player, "杠");
        
        return true;
      }
      
      // 补杠成功后，应该摸牌
      this.drawTileForPlayer(player, { notify: true });
      
      // 检查是否可以胡牌
      const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
      if (huResult.canHu) {
        displayManager.printSuccess(`${player.name} 补杠后胡牌！类型：${huResult.description}`);
        // 修正：补杠后胡牌应立即结束游戏
        player.state = PlayerState.WON;
        this.game.setState(GameState.ENDED);
        return true;
      }
      
      // 补杠后需要出牌
      await this.requirePlayerToDiscard(player, "补杠");
      
      return true;
    }
    return false;
  }

  /**
   * 处理抢杠
   * @param player 要抢杠的玩家
   * @param tiles 被抢杠的牌
   * @returns 是否成功抢杠
   */
  public async handleQiangGang(player: Player, tiles: Tile[]): Promise<boolean> {
    if (tiles.length === 0) return false;
    
    // 抢杠的处理比较特殊，需要获取当前玩家正在补杠的牌
    const currentPlayer = this.game.getCurrentPlayer();
    if (!currentPlayer || currentPlayer === player) return false;
    
    // 检查玩家是否能胡这张牌
    if (!this.checkHu(player, tiles[0])) return false;
    
    // 如果玩家可以胡牌，则执行抢杠操作
    displayManager.printSuccess(`${player.name} 抢杠了 ${tiles[0].toString()}`);
    
    // 抢杠成功后，设置游戏状态
    this.game.setLastDiscardedTile(tiles[0]);
    
    return true;
  }

  /**
   * 处理花牌
   * @param player 摸到花牌的玩家
   * @param tile 花牌
   * @returns 是否成功处理花牌
   */
  public handleHuaPai(player: Player, tile: Tile): boolean {
    // 检查是否是花牌
    if (tile.type !== TileType.FENG && tile.type !== TileType.JIAN) {
      return false;
    }
    
    // 从手牌中移除花牌
    const index = player.handTiles.findIndex(t => t.id === tile.id);
    if (index === -1) {
      return false;
    }
    
    // 从手牌中移除并添加到花牌集合
    const flowerTile = player.handTiles.splice(index, 1)[0];
    player.flowerTiles.push(flowerTile);
    
    displayManager.printSuccess(`${player.name} 摸到花牌: ${tile.toString()}`);

    if (this.tileManager.getRemainingTiles() === 0) {
      displayManager.printWarning(`牌山已空，不再执行回合。准备进入结算`);
      return true
    }
    
    // 摸一张新牌
    this.drawTileForPlayer(player, { notify: true });
    
    // 检查补到的牌是否可以胡牌
    if (RuleEngine.canHu(player, null, { isDrawn: true })) {
      displayManager.printSuccess(`${player.name} 补花后胡牌！`);
      // 设置玩家状态为胡牌
      player.state = PlayerState.WON;
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
      return true;
    }
    
    return true;
  }

  /**
   * 检查当前玩家是否可以进行特殊操作
   */
  public async checkSpecialActions(player: Player): Promise<boolean> {
    debugLog('检查当前玩家是否可以进行特殊操作')
    
    // 准备可能的操作
    const possibleActions: PlayerAction[] = [PlayerAction.PASS];
    
    // 检查是否可以胡牌
    if (RuleEngine.canHu(player, null)) {
      possibleActions.push(PlayerAction.HU);
    }
    
    // 检查是否可以杠牌
    if (RuleEngine.canGang(player, null, { currentPlayer: player, allPlayers: this.game.getAllPlayers() }).canGang) {
      possibleActions.push(PlayerAction.GANG);
    }
    
    // 如果只有"过"这一个选项，则直接返回
    if (possibleActions.length === 1) {
      return false;
    }
    
    // 提示玩家可以进行的操作
    displayManager.printWarning(`玩家 ${player.name} 可以对 ${player.lastDrawnTile!.toString()} 进行以下操作:`);
    
    let selectedAction: PlayerAction;
    
    // 如果是AI玩家，自动选择操作
    if (player.type === PlayerType.AI) {
      // AI逻辑：优先胡牌，其次杠牌，再次碰牌，最后吃牌或过
      if (possibleActions.includes(PlayerAction.HU)) {
        selectedAction = PlayerAction.HU;
      } else if (possibleActions.includes(PlayerAction.GANG)) {
        selectedAction = PlayerAction.GANG;
      } else {
        selectedAction = PlayerAction.PASS;
      }
      
      displayManager.printWarning(`AI玩家 ${player.name} 选择了: ${selectedAction}`);
    } else {
      // 人类玩家，等待用户选择
      const options = possibleActions.map(action => {
        switch (action) {
          case PlayerAction.PASS: return "过";
          case PlayerAction.GANG: return "杠";
          case PlayerAction.HU: return "胡";
          default: return action;
        }
      });
      
      const selectedIndex = await askMultipleChoice("请选择操作:", options);
      selectedAction = possibleActions[selectedIndex];
    }
    
    // 执行选择的操作
    switch (selectedAction) {
      case PlayerAction.HU:
        this.handlePlayerHu(player, null);
        return true;
      case PlayerAction.GANG:
        await this.handleGang(player, null);
        return true;
      default:
        // 玩家选择"过"，不做任何操作
        displayManager.print(`玩家 ${player.name} 选择了"过"`);
        break;
    }

    return false
  }

  /**
   * 处理玩家胡牌
   */
  public handlePlayerHu(player: Player, tile: Tile | null): void {
    // 获取胡牌详情
    const huDetails = RuleEngine.getHuDetails(player, tile);
    if (huDetails.canHu) {
      // 如果是荣和，把胡的牌加到手牌
      if (tile) {
        player.handTiles.push(tile);
        this.lastWinBySelfDrawn = false;
        // 记录点炮者索引（当前出牌玩家）
        this.lastLoserIndex = this.game.currentPlayerIndex;
      } else {
        this.lastWinBySelfDrawn = true;
        this.lastLoserIndex = -1;
      }
      const winTypeInfo = ScoreCalculator.getWinTypeInfo(huDetails.huType);
      displayManager.printSuccess(`${player.name} ${winTypeInfo.name} ${huDetails.description}`);
      // 计算得分
      const scoreResult = RuleEngine.calculateScore(player, huDetails.huType, { isSelfDrawn: !tile });
      displayManager.printSuccess(`得分: ${scoreResult.score}`);
      // 设置玩家状态为赢
      player.state = PlayerState.WON;
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
    } else {
      displayManager.printError(`${player.name} 不能胡牌`);
    }
    // 标记天胡、地胡
    if (this.game.state === 1 /* DEALING */ || this.game.state === 2 /* PLAYING */ && this.currentRound === 0 && player.handTiles.length === 14) {
      player.tianHuFlag = true;
      displayManager.printTitle(`【天胡】${player.name} 发牌后直接胡牌！`);
      player.diHuFlag = false;
    } else if (
      // 地胡：非庄家，第一轮内第一次摸牌自摸胡
      this.currentRound === 0 &&
      player.handTiles.length === 14 &&
      player !== this.game.getAllPlayers()[0] && // 非庄家
      this.lastWinBySelfDrawn === true // 自摸
    ) {
      player.tianHuFlag = false;
      player.diHuFlag = true;
      displayManager.printTitle(`【地胡】${player.name} 第一轮自摸胡牌！`);
    } else {
      player.tianHuFlag = false;
      player.diHuFlag = false;
    }
  }

  /**
   * 处理当前玩家的出牌行动
   */
  public async handleCurrentPlayerDiscard(): Promise<void> {

    debugLog('处理当前玩家的出牌行动')

    const currentPlayer = this.game.getCurrentPlayer();
    
    // 显示当前玩家的手牌
    displayManager.displayPlayerHand(currentPlayer);

    // 如果是AI玩家，则使用AI策略处理
    if (currentPlayer.type === PlayerType.AI) {

      let discardedTile = null;
      // 使用AIPlayer的处理方法
      if (currentPlayer instanceof AIPlayer) {
        debugLog(`使用AIPlayer的处理方法`);
        discardedTile = await currentPlayer.handleDiscard(this);
      } else {
        // 如果不是AIPlayer实例但类型是AI，使用基本AI逻辑
        debugLog(`AI玩家 ${currentPlayer.name} 不是AIPlayer实例，使用基本AI逻辑处理`);

        const discardIndex = currentPlayer.getRandomMove();
        infoLog(`选择的弃牌索引: ${discardIndex}`);
        discardedTile = this.currentPlayerDiscard(discardIndex);
      }

      displayManager.printSuccess(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
        
      // 检查其他玩家是否可以对此牌进行操作
      await this.checkOtherPlayersResponse(discardedTile);
  
    } else if (currentPlayer.type === PlayerType.HUMAN) {
      // 人类玩家
      await this.handleHumanPlayerAction(currentPlayer);
  }
}

/**
   * 处理人类玩家行动
   */
  private async handleHumanPlayerAction(player: Player): Promise<void> {
    displayManager.printWarning(`轮到您出牌，请选择要打出的牌(输入序号1-${player.handTiles.length})`);
    displayManager.printWarning(`输入h查看手牌详情，输入q退出游戏\n`);
    
    // 获取玩家输入
    displayManager.printWarning('请输入您要打出的牌的序号:');
    
    // 获取用户输入的索引
    getNextDiscardIndex(player.handTiles.length, async (tileIndex) => {
      if (tileIndex !== -1) {
        const discardedTile = this.currentPlayerDiscard(tileIndex);

        displayManager.printSuccess(`${player.name} 打出了 ${discardedTile.toString()}`);
        
        // 检查其他玩家是否可以对此牌进行操作
        await this.checkOtherPlayersResponse(discardedTile);
      } else {
        errorLog('程序错误排查问题')
        throw new Error('手牌数量无效');
      }

    });
  }

  /**
   * 检查其他玩家是否可以对打出的牌进行响应
   * @returns 是否有玩家进行了响应（吃碰杠胡）
   */
  public async checkOtherPlayersResponse(discardedTile: Tile): Promise<boolean> {
    debugLog('检查其他玩家是否可以对打出的牌进行响应')

    if (!discardedTile) return false;
    
    const currentPlayer = this.game.getCurrentPlayer();
    const allPlayers = this.game.getAllPlayers();
    const otherPlayers = allPlayers.filter(p => p.id !== currentPlayer.id);
    
    debugLog(`当前出牌玩家: ${currentPlayer.name}, id: ${currentPlayer.id}`);
    debugLog(`所有玩家: ${allPlayers.map(p => p.name + '(' + p.id + ')').join(', ')}`);
    debugLog(`otherPlayers: ${otherPlayers.map(p => p.name + '(' + p.id + ')').join(', ')}`);
    debugLog(`被打出的牌: ${discardedTile.toString()}`);
    
    // 按照优先级检查响应：胡 > 杠 > 碰 > 吃
    // 先检查是否有人可以胡牌
    const canHuPlayers = otherPlayers.filter(p => 
      RuleEngine.canHu(p, discardedTile)
    );
    
    let hasHu = false;
    for (const huPlayer of canHuPlayers) {
      debugLog(`检测玩家 ${huPlayer.name}（类型: ${huPlayer.type === PlayerType.AI ? 'AI' : '人类'}）是否胡牌`);
      if (huPlayer.type === PlayerType.AI) {
        debugLog(`AI玩家 ${huPlayer.name} 自动胡牌`);
        this.handlePlayerHu(huPlayer, discardedTile);
        hasHu = true;
      } else {
        displayManager.printWarning(`${huPlayer.name}，您可以胡 ${discardedTile.toString()}`);
        const want = await askQuestion("是否胡牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          debugLog(`人类玩家 ${huPlayer.name} 选择胡牌`);
          this.handlePlayerHu(huPlayer, discardedTile);
          hasHu = true;
        } else {
          debugLog(`人类玩家 ${huPlayer.name} 选择不胡牌`);
        }
      }
    }
    if (hasHu) {
      debugLog(`有玩家胡牌，响应流程结束`);
      return true;
    } else if (canHuPlayers.length > 0) {
      debugLog(`所有可胡玩家均未胡牌，继续检查杠/碰/吃`);
    }
    
    // 检查是否有人可以杠牌
    const canGangPlayers = otherPlayers.filter(p => 
      RuleEngine.canGang(p, discardedTile, { currentPlayer: currentPlayer, allPlayers: allPlayers }).canGang
    );
    
    if (canGangPlayers.length > 0) {
      debugLog(`发现 ${canGangPlayers.length} 名玩家可以杠 ${discardedTile.toString()}`);
      const gangPlayer = canGangPlayers[0];
      
      if (gangPlayer.type === PlayerType.AI) {
        // AI玩家自动杠牌
        debugLog(`AI玩家 ${gangPlayer.name} 自动选择杠牌`);
        const gangSuccess = await this.handleGang(gangPlayer, discardedTile);
        if (gangSuccess) {
          return true;
        }
      } else {
        // 人类玩家选择是否杠牌
        displayManager.printWarning(`${gangPlayer.name}，您可以杠 ${discardedTile.toString()}`);
        const want = await askQuestion("是否杠牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          debugLog(`人类玩家 ${gangPlayer.name} 选择杠牌`);
          const gangSuccess = await this.handleGang(gangPlayer, discardedTile);
          if (gangSuccess) {
            return true;
          }
        } else {
          debugLog(`人类玩家 ${gangPlayer.name} 选择不杠牌`);
        }
      }
    }
    
    // 检查是否有人可以碰牌
    const canPengPlayers = otherPlayers.filter(p => 
      RuleEngine.canPeng(p, discardedTile)
    );
    
    if (canPengPlayers.length > 0) {
      debugLog(`发现 ${canPengPlayers.length} 名玩家可以碰 ${discardedTile.toString()}`);
      const pengPlayer = canPengPlayers[0];
      
      if (pengPlayer.type === PlayerType.AI) {
        // AI玩家自动碰牌
        debugLog(`AI玩家 ${pengPlayer.name} 自动选择碰牌`);
        const pengSuccess = await this.handlePeng(pengPlayer, discardedTile);
        if (pengSuccess) {
          return true;
        }
      } else {
        // 人类玩家选择是否碰牌
        displayManager.printWarning(`${pengPlayer.name}，您可以碰 ${discardedTile.toString()}`);
        const want = await askQuestion("是否碰牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          debugLog(`人类玩家 ${pengPlayer.name} 选择碰牌`);
          const pengSuccess = await this.handlePeng(pengPlayer, discardedTile);
          if (pengSuccess) {
            return true;
          }
        } else {
          debugLog(`人类玩家 ${pengPlayer.name} 选择不碰牌`);
        }
      }
    }
    
    // 检查是否有人可以吃牌（仅下家可以吃）
    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextPlayerIndex];
    
    if (RuleEngine.canChi(nextPlayer, discardedTile)) {
      debugLog(`下家 ${nextPlayer.name} 可以吃 ${discardedTile.toString()}`);
      
      if (nextPlayer.type === PlayerType.AI) {
        // AI玩家自动吃牌
        debugLog(`AI玩家 ${nextPlayer.name} 自动选择吃牌`);
        const chiSuccess = await this.handleChi(nextPlayer, discardedTile);
        if (chiSuccess) {
          return true;
        }
      } else {
        // 人类玩家选择是否吃牌
        displayManager.printWarning(`${nextPlayer.name}，您可以吃 ${discardedTile.toString()}`);
        const want = await askQuestion("是否吃牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          debugLog(`人类玩家 ${nextPlayer.name} 选择吃牌`);
          const chiSuccess = await this.handleChi(nextPlayer, discardedTile);
          if (chiSuccess) {
            return true;
          }
        } else {
          debugLog(`人类玩家 ${nextPlayer.name} 选择不吃牌`);
        }
      }
    }
    
    debugLog(`所有玩家对 ${discardedTile.toString()} 的响应检查完成, 无人操作，下一步`);
    return false;
  }

  /**
   * 处理超时情况下的动作
   */
  public async handleTimeoutAction(player: Player): Promise<void> {
    displayManager.printWarning(`玩家 ${player.name} 操作超时，自动选择"过"`);
    
    // 如果是当前玩家，可能需要强制出牌
    if (player.id === this.game.currentPlayerIndex) {
      // 如果有超出张数的手牌，需要强制出牌
      if (player.needsToDiscard()) {
        // 如果是AI玩家，使用forceAIPlayerDiscard方法
        if (player.type === PlayerType.AI) {
          await this.forceAIPlayerDiscard();
        } else {
          // 随机选择一张牌
          const discardIndex = player.getRandomMove();
          const discardedTile = this.currentPlayerDiscard(discardIndex);
          
          displayManager.printWarning(`由于超时，系统为玩家 ${player.name} 自动打出: ${discardedTile.toString()}`);
          
          // 检查其他玩家是否可以对此牌进行操作
          await this.checkOtherPlayersResponse(discardedTile);
        }
      }
    } else {
      errorLog('程序错误，排查问题')
      throw new Error('玩家状态无效');
    }
  }

  /**
   * 处理游戏结束
   */
  public async handleGameEnd(): Promise<GameEndResult> {
    debugLog('[调试] handleGameEnd入口');
    // 检查是否有玩家胡牌
    const players = this.game.getAllPlayers();
    let winningPlayer: Player | null = null;
    for (const player of players) {
      if (player.state === PlayerState.WON) {
        winningPlayer = player;
        break;
      }
    }
    debugLog(`[调试] handleGameEnd: 胡牌玩家: ${winningPlayer ? winningPlayer.name : '无'}, 玩家分数: ${players.map(p => p.name + ':' + p.score).join(', ')}`);
    // 统计胜负局数和总局数，并结算分数
    let winnerScore = 0;
    let huType = null;

    // 分数结算后，统计每个玩家的总局数
    for (const player of players) {
      player.totalGames++;
    }
    if (winningPlayer) {
      debugLog(`[调试] 赢家: ${winningPlayer.name}, state: ${winningPlayer.state}`);
      // 判断是否自摸
      let isSelfDrawn = this.lastWinBySelfDrawn;
      // 自动判断自摸/荣和
      if (isSelfDrawn === undefined || isSelfDrawn === null) {
        // 兜底：如果lastLoserIndex为-1则自摸，否则荣和
        isSelfDrawn = this.lastLoserIndex === -1;
      }
      // 获取胡牌类型
      const huDetails = RuleEngine.getHuDetails(winningPlayer, null, { isDrawn: isSelfDrawn });
      huType = huDetails.huType;
      debugLog(`[调试] 赢家胡牌类型: ${huType}, canHu: ${huDetails.canHu}`);
      // 计算赢家得分
      if (huType !== null && huType !== undefined) {
        let winScoreDetail;
        if (isSelfDrawn) {
          debugLog('[调试] 进入自摸结算分支');
          winScoreDetail = WinConditions.calculateScore(winningPlayer, { isDrawn: true });
          winnerScore = winScoreDetail.score;
          debugLog(`[调试] WinConditions自摸分数明细: ${JSON.stringify(winScoreDetail)}`);
          for (const player of players) {
            debugLog(`[调试] [自摸结算前] 玩家: ${player.name}, 分数: ${player.score}`);
            if (player === winningPlayer) {
              player.score += winnerScore * (players.length - 1);
            } else {
              player.score -= winnerScore;
            }
            debugLog(`[调试] [自摸结算后] 玩家: ${player.name}, 分数: ${player.score}`);
          }
        } else {
          // 荣和，点炮者为lastLoserIndex
          let loserIndex = this.lastLoserIndex;
          if (loserIndex === -1) {
            // 兜底：找出最后一个出牌的玩家
            loserIndex = players.findIndex(p => p !== winningPlayer && p.state !== PlayerState.WON);
          }
          debugLog('[调试] 进入荣和结算分支');
          winScoreDetail = WinConditions.calculateScore(winningPlayer, { isDrawn: false });
          winnerScore = winScoreDetail.score;
          debugLog(`[调试] WinConditions荣和分数明细: ${JSON.stringify(winScoreDetail)}`);
          const loser = players[loserIndex];
          debugLog(`[调试] [荣和结算前] 赢家: ${winningPlayer.name}, 分数: ${winningPlayer.score}, 点炮者: ${loser.name}, 分数: ${loser.score}`);
          winningPlayer.score += winnerScore;
          loser.score -= winnerScore;
          debugLog(`[调试] [荣和结算后] 赢家: ${winningPlayer.name}, 分数: ${winningPlayer.score}, 点炮者: ${loser.name}, 分数: ${loser.score}`);
        }
      }
      // 分数结算后，统计每个玩家的总局数、胜利局数、失败局数
      for (const player of players) {
        if (player === winningPlayer) {
          player.winCount++;
        } else {
          player.loseCount++;
        }
      }
    } else {
      // 无人胡牌，流局
      for (const player of players) {
        player.drawCount++;
      }
    }
    // 显示游戏结算
    this.displayGameSummary();
    debugLog('[调试] displayGameSummary已调用');
    debugLog(`[调试] handleGameEnd: 结算后玩家分数: ${players.map(p => p.name + ':' + p.score).join(', ')}`);
    if (AUTO_PLAY_MODE) {
      if (this.currentRound < AUTO_PLAY_ROUNDS) {
        displayManager.printWarning(`自动模式：第${this.currentRound}局结束，准备进入第${this.currentRound + 1}局`);
        debugLog('[调试] handleGameEnd: 自动模式，准备进入下一局');
        return GameEndResult.RESTART_AUTO_GAME;
      } else {
        displayManager.printWarning(`自动模式已完成${AUTO_PLAY_ROUNDS}局，游戏结束！`);
        debugLog('[调试] handleGameEnd: 自动模式已完成所有局');
        return GameEndResult.AUTO_PLAY_COMPLETED;
      }
    } else {
      const startNewGame = await askQuestion("是否开始新一局游戏？(y/n)");
      debugLog(`[调试] handleGameEnd: 用户选择${startNewGame}`);
      if (startNewGame.toLowerCase() === 'y') {
        this.game.reset();
        InputState.isWaitingForUserInput = false;
        this.startGame();
        debugLog('[调试] handleGameEnd: 用户选择新一局，已重置游戏');
        return GameEndResult.RESTART_AUTO_GAME;
      } else {
        displayManager.printWarning("游戏结束，感谢参与！");
        debugLog('[调试] handleGameEnd: 用户选择退出');
        return GameEndResult.USER_EXIT;
      }
    }
  }

  /**
   * 显示游戏总结
   */
  public displayGameSummary(): void {
    displayManager.printTitle("游戏总结");
    // 显示玩家信息
    const players = this.game.getAllPlayers();
    for (const player of players) {
      displayManager.print(`玩家 ${player.name}:`);
      displayManager.print(`- 手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
      displayManager.print(`- 手牌数量: ${player.handTiles.length}`);
      displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组: ${player.revealedSets.map(set => `${set.tiles.map(t => t.toString()).join(' ')} (${set.type})`).join(' ')}`);
      displayManager.print(`- 状态: ${PlayerState[player.state]}`);
      // 新增统计信息输出
      displayManager.print(`- 当前分数: ${player.score}`);
      displayManager.print(`- 总局数: ${player.totalGames}`);
      displayManager.print(`- 胜利局数: ${player.winCount}`);
      displayManager.print(`- 失败局数: ${player.loseCount}`);
      displayManager.print(`- 流局次数: ${player.drawCount}`);
    }
    displayManager.print(`总摸牌次数: ${this.game.drawCount}`);
    displayManager.print(`剩余牌数: ${this.game.getRemainingTiles()}`);
    displayManager.printDivider();
  }

  /**
   * 要求玩家打出一张牌
   * 在吃碰杠操作后调用，确保玩家完成出牌动作
   * @param player 需要出牌的玩家
   * @param actionType 之前执行的动作类型（吃/碰/杠）
   */
  private async requirePlayerToDiscard(player: Player, actionType: string): Promise<void> {
    debugLog('在吃碰杠操作后调用，确保玩家完成出牌动作')

    // 要求玩家出牌
    if (player.type === PlayerType.AI) {
      // AI玩家自动出牌
      displayManager.printWarning(`AI玩家 ${player.name} ${actionType}后需要打出一张牌`);
      // 等待100毫秒，让界面有时间更新
      await new Promise(resolve => setTimeout(resolve, 100));
      // 使用AI策略选择一张牌打出
      await this.handleCurrentPlayerDiscard();
    } else {
      // 人类玩家选择出牌
      displayManager.printWarning(`${player.name}，${actionType}后请选择一张牌打出`);
      // 人类玩家的出牌会在游戏循环中处理
    }
  }
}

export enum GameEndResult {
  RESTART_AUTO_GAME,
  AUTO_PLAY_COMPLETED,
  USER_EXIT,
  NORMAL_END
}
