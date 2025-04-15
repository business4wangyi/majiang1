import { Player, PlayerType, PlayerState } from './player';
import { Tile } from './tile';
import { GameStateManager, GameState } from './game-state';
import { TileManager } from './tile-manager';
import { RuleEngine } from './rule-engine';
import { debugLog } from './logger';
import { displayManager } from './display-manager';
import { Game } from './game';

export class GameFlow {
  constructor(
    private gameState: GameStateManager,
    private tileManager: TileManager,
    private players: Player[]
  ) {}

  public startGame(): void {
    displayManager.print("开始初始化游戏...");
    
    // 检查玩家数量
    if (this.players.length === 0) {
      displayManager.printError("没有玩家，无法开始游戏");
      return;
    }
    displayManager.print(`游戏中共有 ${this.players.length} 名玩家`);
    
    // 初始化游戏状态
    this.gameState.setState(GameState.INIT);
    displayManager.print("重置牌山...");
    this.tileManager.reset();
    
    displayManager.print("开始发牌...");
    this.dealInitialTiles();
    
    // 设置第一个玩家为当前玩家，并设置状态为ACTING
    this.gameState.setCurrentPlayerIndex(0);
    
    // 确保所有玩家状态正确
    for (let i = 0; i < this.players.length; i++) {
      this.updatePlayerState(i);
    }
    
    // 切换游戏状态为PLAYING
    this.gameState.setState(GameState.PLAYING);
    displayManager.printSuccess("游戏初始化完成，状态转为 PLAYING");
  }

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
            // 在实际应用中，这里可以添加退出程序的代码
            // 如 process.exit(1);
            return;
          }
        }
      }
    }
    
    // 验证每位玩家手牌数量
    displayManager.printTitle("发牌完成，最终玩家手牌状态");
    for (const player of this.players) {
      if (player.handTiles.length !== 13) {
        displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/13)，游戏无法继续`);
        return;
      }
      
      // 排序玩家手牌
      player.sortHand();
      displayManager.print(`玩家 ${player.name} 最终手牌数量: ${player.handTiles.length}`);
    }
    
    displayManager.printDivider();
  }

  public currentPlayerDraw(): Tile | null {
    const currentPlayer = this.players[this.gameState.currentPlayerIndex];
    if (currentPlayer.handTiles.length !== 13) {
      debugLog(`玩家 ${currentPlayer.name} 手牌数量不正确: ${currentPlayer.handTiles.length}`);
      return null;
    }

    const tile = this.tileManager.drawTile();
    if (tile) {
      currentPlayer.drawTile(tile);
      this.gameState.incrementDrawCount();
      displayManager.addToTurnLog(`${currentPlayer.name} 摸了一张牌`);
    }
    return tile;
  }

  public currentPlayerDiscard(tileIndex: number): Tile | null {
    const currentPlayer = this.players[this.gameState.currentPlayerIndex];
    
    // 验证玩家状态
    if (currentPlayer.state !== PlayerState.ACTING) {
      displayManager.printWarning(`玩家 ${currentPlayer.name} 不处于ACTING状态，当前状态: ${PlayerState[currentPlayer.state]}`);
      
      // 如果是AI玩家且手牌超过13张，强制允许出牌以保持游戏流畅
      if (currentPlayer.type === PlayerType.AI && currentPlayer.handTiles.length > 13) {
        displayManager.printWarning(`AI玩家手牌超过13张，强制允许出牌以维持游戏状态正确性`);
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
        this.gameState.setLastDiscardedTile(discardedTile);
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

  public nextTurn(): void {
    // 获取当前玩家
    const currentPlayerIndex = this.gameState.currentPlayerIndex;
    const currentPlayer = this.players[currentPlayerIndex];
    
    // 将当前玩家状态设置为WAITING
    if (currentPlayer.state !== PlayerState.WAITING) {
      currentPlayer.state = PlayerState.WAITING;
      debugLog(`将玩家 ${currentPlayer.name} (索引: ${currentPlayerIndex}) 状态从 ACTING 切换为 WAITING`);
    }
    
    // 计算下一个玩家的索引
    const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    
    // 设置下一个玩家为当前玩家
    this.gameState.setCurrentPlayerIndex(nextPlayerIndex);
    
    // 获取下一个玩家并设置其状态为ACTING
    const nextPlayer = this.players[nextPlayerIndex];
    if (nextPlayer.state !== PlayerState.ACTING) {
      nextPlayer.state = PlayerState.ACTING;
      debugLog(`将下一个玩家 ${nextPlayer.name} (索引: ${nextPlayerIndex}) 状态设置为 ACTING`);
    }
    
    displayManager.print(`当前玩家更新为: ${nextPlayer.name}, 手牌数量: ${nextPlayer.handTiles.length}`);
  }

  public checkOtherPlayersActions(tile: Tile): number[] {
    const waitingPlayers: number[] = [];
    const currentPlayerIndex = this.gameState.currentPlayerIndex;

    for (let i = 0; i < this.players.length; i++) {
      if (i === currentPlayerIndex) continue;

      const player = this.players[i];
      const actions = RuleEngine.getAvailableActions(player, tile);
      
      if (actions.length > 0) {
        waitingPlayers.push(i);
        player.state = PlayerState.WAITING;
      }
    }

    return waitingPlayers;
  }

  public forceAIPlayerDiscard(): boolean {
    for (const player of this.players) {
      if (player.type === PlayerType.AI && player.handTiles.length > 13) {
        debugLog(`强制AI玩家 ${player.name} 出牌，手牌数量: ${player.handTiles.length}`);
        
        // 使用AI策略选择要打出的牌
        const tileToDiscard = player.handTiles[player.handTiles.length - 1];
        if (tileToDiscard) {
          const tileIndex = player.handTiles.length - 1;
          const discarded = this.currentPlayerDiscard(tileIndex);
          if (discarded) {
            player.state = PlayerState.WAITING;
            return true;
          }
        }
        
        // 如果AI策略失败，强制打出最后一张牌
        const lastIndex = player.handTiles.length - 1;
        const discarded = this.currentPlayerDiscard(lastIndex);
        if (discarded) {
          player.state = PlayerState.WAITING;
          return true;
        }
      }
    }
    return false;
  }

  // 更新玩家状态的辅助方法
  private updatePlayerState(playerIndex: number): void {
    const player = this.players[playerIndex];
    const currentPlayerIndex = this.gameState.currentPlayerIndex;
    
    if (playerIndex === currentPlayerIndex) {
      if (player.state !== PlayerState.ACTING) {
        player.state = PlayerState.ACTING;
        debugLog(`将玩家 ${player.name} (索引: ${playerIndex}) 状态设置为 ACTING`);
      }
    } else {
      if (player.state !== PlayerState.WAITING) {
        player.state = PlayerState.WAITING;
        debugLog(`将玩家 ${player.name} (索引: ${playerIndex}) 状态设置为 WAITING`);
      }
    }
  }
}

/**
 * 从牌山中摸牌并分配给玩家
 * @param game 游戏实例
 * @param player 要摸牌的玩家
 * @param notify 是否通知（打印消息）
 * @returns 摸到的牌，如果牌山已空，返回null
 */
export function drawTile(game: Game, player: Player, notify: boolean = true): Tile | null {
  // 检查牌山是否已空
  if (game.remainingTiles <= 0) {
    if (notify) {
      debugLog(`牌山已空，无法摸牌`);
    }
    return null;
  }
  
  // 从牌山中获取一张牌
  const tile = game.drawTileForPlayer(player);
  
  if (!tile) {
    if (notify) {
      debugLog(`发生严重错误：虽然remainingTiles > 0，但无法从牌山中获取牌`);
    }
    return null;
  }
  
  // 记录最后摸到的牌（这已经在drawTileForPlayer中处理了）
  
  // 通知
  if (notify) {
    debugLog(`玩家 ${player.name} 摸了一张牌: ${tile.toString()}`);
  }
  
  return tile;
}

/**
 * 处理超出手牌数量的检查与修复
 * @param game 游戏实例
 * @param forcedFix 是否强制修复
 * @returns 是否已修复
 */
export function handleExcessHandTiles(game: Game, forcedFix: boolean = false): boolean {
  // 检查每个玩家的手牌数量
  const allPlayers = game.getAllPlayers();
  let needsFix = false;
  
  for (const player of allPlayers) {
    // 常规情况下，手牌应该是13张或14张
    if (player.handTiles.length > 14) {
      needsFix = true;
      debugLog(`检测到严重错误：玩家 ${player.name} 手牌数量(${player.handTiles.length})超过14张`);
      displayManager.printError(`严重错误：玩家 ${player.name} 手牌数量(${player.handTiles.length})超过最大值14张，游戏无法继续`);
      // 不再执行修复逻辑，直接报错
      displayManager.addToTurnLog(`游戏错误: 玩家 ${player.name} 手牌数量异常(${player.handTiles.length}/14)，游戏终止`);
      // 在实际应用中，这里可以添加退出程序的代码
      // 如 process.exit(1);
    } else if (player.handTiles.length < 13) {
      needsFix = true;
      debugLog(`检测到严重错误：玩家 ${player.name} 手牌数量(${player.handTiles.length})少于13张`);
      displayManager.printError(`严重错误：玩家 ${player.name} 手牌数量(${player.handTiles.length})少于最小值13张，游戏无法继续`);
      // 不再执行修复逻辑，直接报错
      displayManager.addToTurnLog(`游戏错误: 玩家 ${player.name} 手牌数量异常(${player.handTiles.length}/13)，游戏终止`);
      // 在实际应用中，这里可以添加退出程序的代码
      // 如 process.exit(1);
    }
  }
  
  return needsFix;
}

/**
 * 玩家摸牌
 * @param game 游戏实例
 * @returns 是否成功摸牌
 */
export function handlePlayerDraw(game: Game): boolean {
  // 获取当前玩家
  const currentPlayer = game.getCurrentPlayer();
  
  // 检查牌山是否已空
  if (game.remainingTiles <= 0) {
    // 牌山已空，无法摸牌
    return false;
  }
  
  // 摸牌
  const drawnTile = drawTile(game, currentPlayer);
  
  if (!drawnTile) {
    // 摸牌失败
    return false;
  }
  
  // 注意：这里有一个类型错误，PlayerState没有DISCARDING状态
  // 应该使用合法的PlayerState枚举值
  currentPlayer.state = PlayerState.ACTING; // 修正为合法的状态
  
  // 记录到回合日志
  displayManager.addToTurnLog(`${currentPlayer.name} 摸了一张牌`);
  
  return true;
}

/**
 * 计算玩家应该打出的牌的索引
 * @param player 玩家
 * @returns 牌的索引
 */
export function getAIDiscardIndex(player: Player): number {
  // 简单实现：返回最后一张牌的索引
  return player.handTiles.length - 1;
} 