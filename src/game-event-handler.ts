import { Game, GameState } from './game';
import { displayManager } from './display-manager';
import { askConfirmation, askQuestion, askMultipleChoice, InputState, getNextDiscardIndex } from './input';
import { Player, PlayerState, PlayerType } from './player';
import { debugLog, errorLog, infoLog } from './logger';
import { Tile, TileType } from './tile';
import { TileManager } from './tile-manager';
import { WinConditions } from './win-conditions';
import { GangType, PlayerAction } from './rule-types';
import { RuleEngine } from './rule-engine';
import { AIPlayer } from './ai-player';

/**
 * 游戏事件处理器类
 * 负责处理游戏中的特殊事件，如牌山空、手牌数量异常等
 * 同时也负责游戏流程控制
 */
export class GameEventHandler {
  constructor(
    private game: Game,
    private tileManager: TileManager,
    private players: Player[]
  ) {}

  /**
   * 启动游戏
   */
  public startGame(): void {
    displayManager.print("开始初始化游戏...");
    
    // 检查玩家数量
    displayManager.print(`游戏中共有 ${this.players.length} 名玩家`);
    
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
    for (let i = 0; i < this.players.length; i++) {
      this.updatePlayerState(i);
    }
    
    // 切换游戏状态为PLAYING
    this.game.setState(GameState.PLAYING);
    displayManager.printSuccess("游戏初始化完成，状态转为 PLAYING");
  }

  /**
   * 处理游戏启动时的初始化工作
   */
  public prepareGameStart(): void {
    infoLog(`准备游戏启动...`);
    
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
  private dealInitialTiles(): void {
    // 每个玩家发13张牌
    displayManager.print(`开始为 ${this.players.length} 名玩家发初始手牌...`);
    
    // 确保所有玩家的手牌和弃牌数组都已初始化并清空
    for (const player of this.players) {
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
      for (const player of this.players) {
        for (let i = 0; i < cardsPerPlayer; i++) {
          const tile = this.tileManager.drawTile();
          if (tile) {
            player.drawTile(tile);
            debugLog(`给玩家 ${player.name} 发牌: ${tile.toString()}, 当前手牌数量: ${player.handTiles.length}`);
          } else {
            displayManager.printError(`给玩家 ${player.name} 发牌失败，牌山已空，无法继续游戏`);
            errorLog(`给玩家 ${player.name} 发牌失败，牌山已空，无法继续游戏`);
            // 在实际应用中，这里可以添加退出程序的代码
            process.exit(1);
          }
        }
      }
    }
    
    // 验证每位玩家手牌数量
    displayManager.printTitle("发牌完成，最终玩家手牌状态");
    for (const player of this.players) {
      // 使用Player类的方法判断手牌数量是否合理
      const expectedHandSize = player.getExpectedHandSize(false);
      if (!player.hasValidHandSize(false)) {
        displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/${expectedHandSize})，游戏无法继续`);
        return;
      }
      
      // 排序玩家手牌
      player.sortHand();
      displayManager.print(`玩家 ${player.name} 最终手牌数量: ${player.handTiles.length}`);
    }
    
    displayManager.printDivider();
  }

  /**
   * 为指定玩家摸一张牌
   * @param player 要摸牌的玩家
   * @param options 摸牌选项
   * @returns 摸到的牌，或null表示没有摸到
   */
  public drawTileForPlayer(player: Player, options: {
    notify?: boolean,         // 是否通知显示
    validate?: boolean,       // 是否验证手牌数量
    incrementCount?: boolean  // 是否增加摸牌计数
  } = {}): Tile | null {
    // 设置默认选项
    const { 
      notify = true, 
      validate = false, 
      incrementCount = false 
    } = options;
    
    // 验证手牌数量
    if (validate && !player.hasValidHandSize(false)) {
      const expectedHandSize = player.getExpectedHandSize(false);
      debugLog(`玩家 ${player.name} 手牌数量不正确: ${player.handTiles.length}，预期: ${expectedHandSize}`);
      return null;
    }

    // 检查牌山是否还有牌
    if (this.tileManager.getRemainingTiles() === 0) {
      displayManager.printWarning("牌山已空，无法摸牌");
      return null;
    }

    // 摸牌
    const tile = this.tileManager.drawTile();
    if (tile) {
      player.drawTile(tile);
      
      // 更新计数器
      if (incrementCount) {
        this.game.incrementDrawCount();
      }
      
      // 通知显示
      if (notify) {
        displayManager.addToTurnLog(`${player.name} 摸了一张牌`);
      }
      
      return tile;
    }
    return null;
  }

  /**
   * 当前玩家摸牌
   */
  public currentPlayerDraw(): Tile | null {
    const currentPlayer = this.players[this.game.currentPlayerIndex];
    
    // 检查是否是海底捞月的情况（剩余一张牌）
    if (this.tileManager.getRemainingTiles() === 1) {
      // 尝试海底捞月
      if (this.checkHaiDiLaoYue(currentPlayer)) {
        return currentPlayer.lastDrawnTile;
      }
    }
    
    // 正常摸牌
    return this.drawTileForPlayer(currentPlayer, {
      notify: true,
      validate: true,
      incrementCount: true
    });
  }

  /**
   * 当前玩家打出一张牌
   */
  public currentPlayerDiscard(tileIndex: number): Tile | null {
    const currentPlayer = this.players[this.game.currentPlayerIndex];
    
    // 验证玩家状态
    if (currentPlayer.state !== PlayerState.ACTING) {
      displayManager.printWarning(`玩家 ${currentPlayer.name} 不处于ACTING状态，当前状态: ${PlayerState[currentPlayer.state]}`);
      
      // 如果是AI玩家且手牌超过预期数量，强制允许出牌以保持游戏流畅
      if (currentPlayer.type === PlayerType.AI && currentPlayer.needsToDiscard()) {
        displayManager.printWarning(`AI玩家手牌超过预期数量，强制允许出牌以维持游戏状态正确性`);
        currentPlayer.state = PlayerState.ACTING;
      } else {
        return null;
      }
    }
    
    // 验证索引是否有效（加强验证和错误处理）
    if (tileIndex === undefined || tileIndex === null) {
      displayManager.printError(`严重错误: 出牌索引为undefined或null`);
      return null;
    }
    
    if (tileIndex < 0 || tileIndex >= currentPlayer.handTiles.length) {
      displayManager.printError(`无效的出牌索引: ${tileIndex}，有效范围: 0-${currentPlayer.handTiles.length - 1}`);
      
      // 对于AI玩家，自动修正索引
      if (currentPlayer.type === PlayerType.AI && currentPlayer.handTiles.length > 0) {
        const correctedIndex = Math.min(currentPlayer.handTiles.length - 1, Math.max(0, tileIndex));
        displayManager.printWarning(`AI玩家索引已修正为有效值: ${correctedIndex}`);
        tileIndex = correctedIndex;
      } else {
        // 人类玩家输入无效索引，直接返回null
        displayManager.printError(`请输入有效的牌索引（1-${currentPlayer.handTiles.length}）`);
        return null;
      }
    }
    
    // 确保选择的牌有效
    if (!currentPlayer.handTiles[tileIndex]) {
      displayManager.printError(`错误: 索引${tileIndex}处的牌无效`);
      
      // 对于AI玩家，尝试找到一个有效的牌索引
      if (currentPlayer.type === PlayerType.AI && currentPlayer.handTiles.length > 0) {
        // 遍历寻找有效的牌
        let foundValidTile = false;
        for (let i = 0; i < currentPlayer.handTiles.length; i++) {
          if (currentPlayer.handTiles[i]) {
            tileIndex = i;
            displayManager.printSuccess(`找到有效牌索引: ${tileIndex}`);
            foundValidTile = true;
            break;
          }
        }
        
        // 再次检查
        if (!foundValidTile || !currentPlayer.handTiles[tileIndex]) {
          displayManager.printError(`严重错误: 无法找到有效的牌索引`);
          return null;
        }
      } else {
        // 人类玩家选择的牌无效，直接返回null
        return null;
      }
    }
    
    try {
      // 使用player.discardTile方法，该方法已经增强了安全性和错误处理
      const discardedTile = currentPlayer.discardTile(tileIndex);
      
      // 如果成功打出，更新游戏状态
      if (discardedTile) {
        this.game.setLastDiscardedTile(discardedTile);
        displayManager.printSuccess(`玩家 ${currentPlayer.name} 成功打出: ${discardedTile.toString()}`);
      } else {
        displayManager.printError(`玩家 ${currentPlayer.name} 出牌失败`);
      }
      
      return discardedTile;
    } catch (error) {
      displayManager.printError(`出牌过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 进入下一个玩家的回合
   */
  public nextTurn(): void {
    // 获取当前玩家并更新状态
    const currentPlayer = this.players[this.game.currentPlayerIndex];
    currentPlayer.state = PlayerState.WAITING;
    displayManager.print(`玩家 ${currentPlayer.name} 出牌结束，状态变为 WAITING`);
    
    // 计算下一个玩家
    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % this.players.length;
    this.game.setCurrentPlayerIndex(nextPlayerIndex);
    
    // 更新下一个玩家的状态
    const nextPlayer = this.players[nextPlayerIndex];
    nextPlayer.state = PlayerState.ACTING;
    
    // 显示下一个玩家信息
    displayManager.printDivider();
    displayManager.printTitle(`轮到 ${nextPlayer.name} 行动 [手牌: ${nextPlayer.handTiles.length}张]`);
    
    // 为下一个玩家摸牌
    const drawnTile = this.currentPlayerDraw();
    if (drawnTile) {
      displayManager.printSuccess(`玩家 ${nextPlayer.name} 摸了一张牌: ${nextPlayer.type === PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
    } else {
      displayManager.printWarning(`无法摸牌，牌山已空`);
    }
  }

  /**
   * 强制AI玩家出牌
   */
  public async forceAIPlayerDiscard(): Promise<boolean> {
    // 获取当前玩家
    const currentPlayer = this.players[this.game.currentPlayerIndex];
    
    // 检查是否为AI玩家
    if (currentPlayer.type !== PlayerType.AI) {
      displayManager.printWarning(`当前玩家不是AI，无法强制出牌`);
      return false;
    }
    
    // 确保玩家处于可以出牌的状态
    currentPlayer.state = PlayerState.ACTING;
    
    try {
      // 优先使用AIPlayer的handleDiscard方法
      if (currentPlayer instanceof AIPlayer) {
        return await currentPlayer.handleDiscard(this);
      }
      
      // 如果不是AIPlayer实例，使用基本方法
    // 使用AI决策获取出牌索引
      if (typeof currentPlayer.getAIMove === 'function') {
    const discardIndex = currentPlayer.getAIMove();
    displayManager.printWarning(`强制AI玩家 ${currentPlayer.name} 出牌，选择索引: ${discardIndex}`);
    
    // 执行出牌
    const discarded = this.currentPlayerDiscard(discardIndex);
    if (discarded) {
      displayManager.printSuccess(`AI玩家 ${currentPlayer.name} 成功打出: ${discarded.toString()}`);
      return true;
        }
      } else {
        // 没有getAIMove方法，随机选择一张牌
        const randomIndex = Math.floor(Math.random() * currentPlayer.handTiles.length);
        const discarded = this.currentPlayerDiscard(randomIndex);
        if (discarded) {
          displayManager.printSuccess(`AI玩家 ${currentPlayer.name} 随机打出: ${discarded.toString()}`);
          return true;
        }
    }
    
    return false;
    } catch (error) {
      displayManager.printError(`强制AI出牌出错: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 更新指定玩家的状态
   */
  private updatePlayerState(playerIndex: number): void {
    if (playerIndex < 0 || playerIndex >= this.players.length) {
      return;
    }
    
    const player = this.players[playerIndex];
    
    // 如果是当前玩家，设置为正在行动状态
    if (playerIndex === this.game.currentPlayerIndex) {
      player.state = PlayerState.ACTING;
    } else {
      // 否则设置为等待状态
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
    for (const player of players) {
      if (this.checkHu(player)) {
        displayManager.printSuccess(`${player.name} 胡牌了！游戏结束！`);
        return true;
      }
    }

    // 检查牌山是否为空且所有玩家都过牌
    if (this.tileManager.getRemainingTiles() === 0) {
      const allPlayersPassed = players.every(player => 
        player.state === PlayerState.FINISHED
      );
      
      if (allPlayersPassed) {
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
      const description = result.description || WinConditions.getHuTypeDescription(huType);
      displayManager.printSuccess(`${player.name} 胡牌类型: ${description}`);
      
      // 计算得分
      const scoreResult = RuleEngine.calculateScore(player, huType, { isSelfDrawn: tile === null });
      displayManager.printSuccess(`得分: ${scoreResult.score}`);
      displayManager.printSuccess(`得分详情: ${JSON.stringify(scoreResult.details)}`);
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
    
    // 询问用户是否开始新局
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
      displayManager.print(`- 手牌数量: ${player.handTiles.length}`);
      displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组`);
      displayManager.print(`- 状态: ${PlayerState[player.state]}`);
    }
    
    displayManager.print(`总摸牌次数: ${game.drawCount}`);
    displayManager.printDivider();
  }

  /**
   * 处理玩家碰牌
   * @param player 要碰牌的玩家
   * @param tile 要碰的牌
   * @returns 是否成功碰牌
   */
  public handlePeng(player: Player, tile: Tile): boolean {
    // 使用 RuleEngine 检查是否可以碰
    if (!RuleEngine.canPeng(player, tile)) {
      displayManager.printError(`${player.name} 没有足够的牌进行碰牌`);
      return false;
    }
    
    // 使用 player.peng 方法执行碰牌操作
    const result = player.peng(tile);
    
    if (result) {
      displayManager.printSuccess(`${player.name} 碰了 ${tile.toString()}`);
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
  public handleGang(player: Player, tile: Tile | null = null): boolean {
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
        gangSuccess = this.handleMingGang(player, tile!);
              break;
      case GangType.AN:
        // 暗杠
        gangSuccess = this.handleAnGang(player);
        break;
      case GangType.BU:
        // 补杠
        gangSuccess = this.handleBuGang(player);
        break;
      case GangType.QIANG:
        // 抢杠
        gangSuccess = this.handleQiangGang(player, gangResult.tiles || []);
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
  private handleMingGang(player: Player, tile: Tile): boolean {
    // 执行明杠
    const gangSuccess = this.executeMingGang(player, tile);
    
    // 明杠成功后，检查杠上开花
    if (gangSuccess) {
      // 如果牌山为空，直接返回成功
      if (this.tileManager.getRemainingTiles() === 0) {
        displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
        return true;
      }
      return this.checkGangShangKaiHua(player);
    }
    
    return false;
  }

  /**
   * 处理暗杠
   * @param player 要暗杠的玩家
   * @returns 是否成功暗杠
   */
  public handleAnGang(player: Player): boolean {
    // 暗杠使用 player.gang(null) 方法
    if (player.gang(null)) {
      displayManager.printSuccess(`${player.name} 暗杠了一组牌`);
      return true;
    }
    return false;
  }

  /**
   * 检查杠上开花
   * 在成功杠牌后调用，检查摸到的牌是否可以胡牌
   * @param player 要检查的玩家
   * @returns 是否成功杠上开花
   */
  private checkGangShangKaiHua(player: Player): boolean {
    // 记录杠牌成功
    displayManager.printSuccess(`${player.name} 杠牌成功，摸一张新牌`);
    
    // 摸一张牌
    const drawnTile = this.drawTileForPlayer(player, { notify: true });
    if (!drawnTile) {
      displayManager.printWarning(`牌山已空，无法摸牌`);
      return false;
    }
    
    // 检查是否可以胡牌，并指定游戏状态为杠上开花
    const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
    if (huResult.canHu) {
      displayManager.printSuccess(`${player.name} 杠上开花胡牌！类型：${huResult.description}`);
      return true;
    } else {
      displayManager.print(`${player.name} 摸了一张牌：${player.type === PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
    }
    
    return false;
  }

  /**
   * 检查海底捞月
   * 在摸最后一张牌时调用，检查是否可以胡牌
   * @param player 要检查的玩家
   * @returns 是否成功海底捞月
   */
  private checkHaiDiLaoYue(player: Player): boolean {
    // 检查牌山是否只剩一张牌
    if (this.tileManager.getRemainingTiles() !== 1) return false;
    
    // 摸最后一张牌
    const drawnTile = this.drawTileForPlayer(player, { notify: true });
    if (!drawnTile) return false;
    
    // 检查是否可以胡牌，并指定游戏状态为海底捞月
    const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isLastTile: true });
    if (huResult.canHu) {
      displayManager.printSuccess(`${player.name} 海底捞月胡牌！类型：${huResult.description}`);
      return true;
    }
    
    return false;
  }

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
  public handleBuGang(player: Player): boolean {
    // 补杠使用 player.gang(null) 方法
    if (player.gang(null)) {
      displayManager.printSuccess(`${player.name} 补杠了一组牌`);
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
  public handleQiangGang(player: Player, tiles: Tile[]): boolean {
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
    
    // 摸一张新牌
    const newTile = this.drawTileForPlayer(player, { notify: true });
    if (newTile) {
      displayManager.printSuccess(`${player.name} 补牌: ${newTile.toString()}`);
      
      // 检查补到的牌是否可以胡牌
      if (RuleEngine.canHu(player, null, { isDrawn: true })) {
        displayManager.printSuccess(`${player.name} 补花后胡牌！`);
        return true;
      }
    }
    
    return true;
  }

  /**
   * 检查当前玩家是否可以进行特殊操作
   */
  public async checkSpecialActions(player: Player): Promise<void> {
    const lastDiscardedTile = this.game.getLastDiscardedTile();
    if (!lastDiscardedTile) return;
    
    // 准备可能的操作
    const possibleActions: PlayerAction[] = [PlayerAction.PASS];
    
    // 检查是否可以胡牌
    if (RuleEngine.canHu(player, lastDiscardedTile)) {
      possibleActions.push(PlayerAction.HU);
    }
    
    // 检查是否可以杠牌
    if (RuleEngine.canGang(player, lastDiscardedTile, { currentPlayer: player, allPlayers: this.game.getAllPlayers() }).canGang) {
      possibleActions.push(PlayerAction.GANG);
    }
    
    // 检查是否可以碰牌
    if (RuleEngine.canPeng(player, lastDiscardedTile)) {
      possibleActions.push(PlayerAction.PENG);
    }
    
    // 检查是否可以吃牌
    if (RuleEngine.canChi(player, lastDiscardedTile)) {
      possibleActions.push(PlayerAction.CHI);
    }
    
    // 如果只有"过"这一个选项，则直接返回
    if (possibleActions.length === 1) {
      return;
    }
    
    // 提示玩家可以进行的操作
    displayManager.printWarning(`玩家 ${player.name} 可以对 ${lastDiscardedTile.toString()} 进行以下操作:`);
    
    let selectedAction: PlayerAction;
    
    // 如果是AI玩家，自动选择操作
    if (player.type === PlayerType.AI) {
      // AI逻辑：优先胡牌，其次杠牌，再次碰牌，最后吃牌或过
      if (possibleActions.includes(PlayerAction.HU)) {
        selectedAction = PlayerAction.HU;
      } else if (possibleActions.includes(PlayerAction.GANG)) {
        selectedAction = PlayerAction.GANG;
      } else if (possibleActions.includes(PlayerAction.PENG)) {
        selectedAction = PlayerAction.PENG;
      } else if (possibleActions.includes(PlayerAction.CHI)) {
        selectedAction = PlayerAction.CHI;
      } else {
        selectedAction = PlayerAction.PASS;
      }
      
      displayManager.printWarning(`AI玩家 ${player.name} 选择了: ${selectedAction}`);
    } else {
      // 人类玩家，等待用户选择
      const options = possibleActions.map(action => {
        switch (action) {
          case PlayerAction.PASS: return "过";
          case PlayerAction.CHI: return "吃";
          case PlayerAction.PENG: return "碰";
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
        this.handlePlayerHu(player, lastDiscardedTile);
        break;
      case PlayerAction.GANG:
        this.handleGang(player, lastDiscardedTile);
        break;
      case PlayerAction.PENG:
        this.handlePeng(player, lastDiscardedTile);
        break;
      case PlayerAction.CHI:
        await this.handleChi(player, lastDiscardedTile);
        break;
      default:
        // 玩家选择"过"，不做任何操作
        displayManager.print(`玩家 ${player.name} 选择了"过"`);
        break;
    }
  }

  /**
   * 处理玩家胡牌
   */
  public handlePlayerHu(player: Player, tile: Tile): void {
    // 获取胡牌详情
    const huDetails = RuleEngine.getHuDetails(player, tile);
    
    if (huDetails.canHu) {
      displayManager.printSuccess(`${player.name} 胡牌！胡牌类型: ${huDetails.description}`);
      
      // 计算得分
      const scoreResult = RuleEngine.calculateScore(player, huDetails.huType, { isSelfDrawn: false });
      displayManager.printSuccess(`得分: ${scoreResult.score}`);
      
      // 设置玩家状态为赢
      player.state = PlayerState.WON;
      
      // 设置游戏状态为结束
      this.game.setState(GameState.ENDED);
    } else {
      displayManager.printError(`${player.name} 不能胡牌`);
    }
  }

  /**
   * 处理当前玩家的行动
   */
  public async handleCurrentPlayerAction(): Promise<void> {
    const currentPlayer = this.game.getCurrentPlayer();
    
    // 显示当前玩家的手牌
    displayManager.displayPlayerHand(currentPlayer);
    
    // 标记正在等待用户输入
    InputState.isWaitingForUserInput = true;
    
    // 如果是AI玩家，则使用AI策略处理
    if (currentPlayer.type === PlayerType.AI) {
      try {
        // 使用AIPlayer的处理方法
        if (currentPlayer instanceof AIPlayer) {
          await currentPlayer.handleDiscard(this);
        } else {
          // 如果不是AIPlayer实例但类型是AI，使用基本AI逻辑
          infoLog(`AI玩家 ${currentPlayer.name} 不是AIPlayer实例，使用基本AI逻辑处理`);
          // 确保玩家对象有getAIMove方法
          if (typeof currentPlayer.getAIMove === 'function') {
            const discardIndex = currentPlayer.getAIMove();
            const discardedTile = this.currentPlayerDiscard(discardIndex);
            
            if (discardedTile) {
              displayManager.printSuccess(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
              displayManager.addToTurnLog(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
              
              // 检查其他玩家是否可以对此牌进行操作
              await this.checkOtherPlayersResponse(discardedTile);
            }
          } else {
            // 没有getAIMove方法，随机选择一张牌
            debugLog(`AI玩家 ${currentPlayer.name} 没有getAIMove方法，随机选择一张牌`);
            const randomIndex = Math.floor(Math.random() * currentPlayer.handTiles.length);
            const discardedTile = this.currentPlayerDiscard(randomIndex);
            
            if (discardedTile) {
              displayManager.printSuccess(`${currentPlayer.name} 随机打出了 ${discardedTile.toString()}`);
            }
          }
        }
  } catch (error) {
        errorLog(`AI玩家行动出错: ${error instanceof Error ? error.message : String(error)}`);
        displayManager.printError(`AI玩家行动出错: ${error instanceof Error ? error.message : String(error)}`);
        
        // 出错时，尝试随机出牌以保持游戏流程
        try {
          const randomIndex = Math.floor(Math.random() * currentPlayer.handTiles.length);
          const fallbackTile = this.currentPlayerDiscard(randomIndex);
          
          if (fallbackTile) {
            displayManager.printWarning(`AI出错恢复：随机打出 ${fallbackTile.toString()}`);
          }
        } catch (fallbackError) {
          debugLog(`AI出牌恢复策略也失败: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
        }
      }

      // 重置状态
      InputState.isWaitingForUserInput = false;

      // 确保游戏继续进行
      this.nextTurn();
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
    getNextDiscardIndex(player.handTiles.length, (tileIndex) => {
      if (tileIndex !== -1) {
        const discardedTile = this.currentPlayerDiscard(tileIndex);
        if (discardedTile) {
          displayManager.printSuccess(`${player.name} 打出了 ${discardedTile.toString()}`);
          displayManager.addToTurnLog(`${player.name} 打出了 ${discardedTile.toString()}`);
          
          // 检查其他玩家是否可以对此牌进行操作
          this.checkOtherPlayersResponse(discardedTile);
          
          this.nextTurn();
        }
      }
      // 重置等待用户输入状态
      InputState.isWaitingForUserInput = false;
    });
  }

  /**
   * 检查其他玩家是否可以对打出的牌进行响应
   */
  public async checkOtherPlayersResponse(discardedTile: Tile): Promise<void> {
    if (!discardedTile) return;
    
    const currentPlayer = this.game.getCurrentPlayer();
    const allPlayers = this.game.getAllPlayers();
    const otherPlayers = allPlayers.filter(p => p.id !== currentPlayer.id);
    
    // 按照优先级检查响应：胡 > 杠 > 碰 > 吃
    // 先检查是否有人可以胡牌
    const canHuPlayers = otherPlayers.filter(p => 
      RuleEngine.canHu(p, discardedTile)
    );
    
    if (canHuPlayers.length > 0) {
      // 如果有多人可以胡，一般是按座次顺序，这里简化为第一个玩家
      const huPlayer = canHuPlayers[0];
      
      if (huPlayer.type === PlayerType.AI) {
        // AI玩家自动胡牌
        this.handlePlayerHu(huPlayer, discardedTile);
        return;
      } else {
        // 人类玩家选择是否胡牌
        displayManager.printWarning(`${huPlayer.name}，您可以胡 ${discardedTile.toString()}`);
        const want = await askQuestion("是否胡牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          this.handlePlayerHu(huPlayer, discardedTile);
          return;
        }
      }
    }
    
    // 检查是否有人可以杠牌
    const canGangPlayers = otherPlayers.filter(p => 
      RuleEngine.canGang(p, discardedTile, { currentPlayer: currentPlayer, allPlayers: allPlayers }).canGang
    );
    
    if (canGangPlayers.length > 0) {
      const gangPlayer = canGangPlayers[0];
      
      if (gangPlayer.type === PlayerType.AI) {
        // AI玩家自动杠牌
        this.handleGang(gangPlayer, discardedTile);
        return;
      } else {
        // 人类玩家选择是否杠牌
        displayManager.printWarning(`${gangPlayer.name}，您可以杠 ${discardedTile.toString()}`);
        const want = await askQuestion("是否杠牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          this.handleGang(gangPlayer, discardedTile);
          return;
        }
      }
    }
    
    // 检查是否有人可以碰牌
    const canPengPlayers = otherPlayers.filter(p => 
      RuleEngine.canPeng(p, discardedTile)
    );
    
    if (canPengPlayers.length > 0) {
      const pengPlayer = canPengPlayers[0];
      
      if (pengPlayer.type === PlayerType.AI) {
        // AI玩家自动碰牌
        this.handlePeng(pengPlayer, discardedTile);
        return;
      } else {
        // 人类玩家选择是否碰牌
        displayManager.printWarning(`${pengPlayer.name}，您可以碰 ${discardedTile.toString()}`);
        const want = await askQuestion("是否碰牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          this.handlePeng(pengPlayer, discardedTile);
          return;
        }
      }
    }
    
    // 检查是否有人可以吃牌（仅下家可以吃）
    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextPlayerIndex];
    
    if (RuleEngine.canChi(nextPlayer, discardedTile)) {
      if (nextPlayer.type === PlayerType.AI) {
        // AI玩家自动吃牌
        await this.handleChi(nextPlayer, discardedTile);
      } else {
        // 人类玩家选择是否吃牌
        displayManager.printWarning(`${nextPlayer.name}，您可以吃 ${discardedTile.toString()}`);
        const want = await askQuestion("是否吃牌？(y/n)");
        if (want.toLowerCase() === 'y') {
          await this.handleChi(nextPlayer, discardedTile);
        }
      }
    }
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
          // 人类玩家，使用getAIMove和currentPlayerDiscard
          const discardIndex = player.getAIMove();
          const discardedTile = this.currentPlayerDiscard(discardIndex);
          
          if (discardedTile) {
            displayManager.printWarning(`由于超时，系统为玩家 ${player.name} 自动打出: ${discardedTile.toString()}`);
            this.nextTurn();
          }
        }
      }
    }
  }

  /**
   * 处理游戏结束
   */
  public async handleGameEnd(): Promise<boolean> {
    displayManager.printTitle("游戏结束");
    
    // 检查是否有玩家胡牌
    const players = this.game.getAllPlayers();
    let winningPlayer: Player | null = null;
    
    for (const player of players) {
      if (player.state === PlayerState.WON) {
        winningPlayer = player;
        break;
      }
    }
    
    if (winningPlayer) {
      displayManager.printSuccess(`恭喜 ${winningPlayer.name} 胡牌获胜！`);
      // 可以添加胡牌类型和分数的显示
    } else {
      displayManager.printWarning("游戏流局，无人胡牌");
    }
    
    // 显示游戏结算
    this.displayGameSummary();
    
    // 询问是否开始新局
    const startNewGame = await askQuestion("是否开始新一局游戏？(y/n)");
    if (startNewGame.toLowerCase() === 'y') {
      // 重置游戏状态
      this.game.reset();
      // 重置输入状态
      InputState.isWaitingForUserInput = false;
      // 启动新游戏
      this.startGame();
      return true;
    } else {
      displayManager.printWarning("游戏结束，感谢参与！");
      process.exit(0);
      return false;
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
      displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组`);
      displayManager.print(`- 状态: ${PlayerState[player.state]}`);
    }
    
    displayManager.print(`总摸牌次数: ${this.game.drawCount}`);
    displayManager.print(`剩余牌数: ${this.game.getRemainingTiles()}`);
    displayManager.printDivider();
  }
}

// 导出静态方法
export async function handleEmptyTileDeck(game: Game): Promise<boolean> {
  return GameEventHandler.handleEmptyTileDeck(game);
}
