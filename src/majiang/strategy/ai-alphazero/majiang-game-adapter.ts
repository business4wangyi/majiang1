/**
 * 麻将游戏适配器 - 连接现有麻将引擎与AlphaZero AI系统
 * 提供统一的接口用于状态获取、动作执行和游戏控制
 */

import { Game } from '../../core/game';
import { Tile, Player, GameState, GameStateAdapter } from './types';
import { MajiangStateVector, MajiangStateEncoder } from './majiang-state-encoder';
import { MajiangAction, MajiangActionDecoder } from './majiang-action-decoder';

export interface GameAdapterConfig {
  enableLogging: boolean;
  validateActions: boolean;
  autoSaveStates: boolean;
  maxHistoryLength: number;
}

export interface GameSnapshot {
  gameState: GameState;
  currentPlayer: Player;
  availableActions: MajiangAction[];
  stateVector: MajiangStateVector;
  timestamp: number;
}

export class MajiangGameAdapter {
  private game: Game;
  private config: GameAdapterConfig;
  private gameHistory: GameSnapshot[];
  private currentSnapshot: GameSnapshot | null;
  
  constructor(game: Game, config?: Partial<GameAdapterConfig>) {
    this.game = game;
    this.config = {
      enableLogging: true,
      validateActions: true,
      autoSaveStates: true,
      maxHistoryLength: 1000,
      ...config
    };
    
    this.gameHistory = [];
    this.currentSnapshot = null;
  }
  
  /**
   * 获取当前游戏状态的编码向量
   */
  public getCurrentStateVector(): MajiangStateVector {
    const gameState = new GameStateAdapter(this.game);
    const currentPlayer = this.getCurrentPlayer();
    
    if (!currentPlayer) {
      throw new Error('No current player available');
    }
    
    return MajiangStateEncoder.encode(gameState, currentPlayer);
  }
  
  /**
   * 获取当前玩家
   */
  public getCurrentPlayer(): Player | null {
    const gameState = new GameStateAdapter(this.game);
    const players = gameState.getPlayers();
    const currentIndex = gameState.getCurrentPlayerIndex();
    
    if (currentIndex >= 0 && currentIndex < players.length) {
      return players[currentIndex];
    }
    
    return null;
  }
  
  /**
   * 获取当前可用的动作列表
   */
  public getAvailableActions(): MajiangAction[] {
    const gameState = new GameStateAdapter(this.game);
    const currentPlayer = this.getCurrentPlayer();
    
    if (!currentPlayer) {
      return [];
    }
    
    // 创建一个模拟的网络输出来获取所有可能的动作
    const mockNetworkOutput = new Float32Array(MajiangActionDecoder.getActionDimension());
    mockNetworkOutput.fill(1.0); // 均匀分布
    
    const allActions = MajiangActionDecoder.decode(mockNetworkOutput, gameState, currentPlayer);
    
    // 只返回有效的动作
    return allActions.filter(action => action.isValid);
  }
  
  /**
   * 执行指定的动作
   */
  public executeAction(action: MajiangAction): boolean {
    if (this.config.validateActions && !action.isValid) {
      if (this.config.enableLogging) {
        console.warn(`[GameAdapter] Attempted to execute invalid action: ${action.type}`);
      }
      return false;
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) {
      if (this.config.enableLogging) {
        console.error('[GameAdapter] No current player to execute action');
      }
      return false;
    }
    
    try {
      switch (action.type) {
        case 'DISCARD':
          return this.executeDiscardAction(action, currentPlayer);
        
        case 'CHI':
          return this.executeChiAction(action, currentPlayer);
        
        case 'PENG':
          return this.executePengAction(action, currentPlayer);
        
        case 'GANG':
          return this.executeGangAction(action, currentPlayer);
        
        case 'HU':
          return this.executeHuAction(action, currentPlayer);
        
        case 'PASS':
          return this.executePassAction(action, currentPlayer);
        
        default:
          if (this.config.enableLogging) {
            console.error(`[GameAdapter] Unknown action type: ${action.type}`);
          }
          return false;
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`[GameAdapter] Error executing action: ${error}`);
      }
      return false;
    }
  }
  
  /**
   * 执行打牌动作
   */
  private executeDiscardAction(action: MajiangAction, player: Player): boolean {
    if (!action.tile) {
      return false;
    }
    
    // 调用游戏引擎的打牌方法（暂时模拟）
    const success = true; // this.game.playerDiscard(player, action.tile);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} discarded ${action.tile.type}${action.tile.value}`);
    }
    
    return success;
  }
  
  /**
   * 执行吃牌动作
   */
  private executeChiAction(action: MajiangAction, player: Player): boolean {
    // 调用游戏引擎的吃牌方法（暂时模拟）
    const success = true; // this.game.playerChi(player);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} performed CHI`);
    }
    
    return success;
  }
  
  /**
   * 执行碰牌动作
   */
  private executePengAction(action: MajiangAction, player: Player): boolean {
    // 调用游戏引擎的碰牌方法（暂时模拟）
    const success = true; // this.game.playerPeng(player);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} performed PENG`);
    }
    
    return success;
  }
  
  /**
   * 执行杠牌动作
   */
  private executeGangAction(action: MajiangAction, player: Player): boolean {
    // 调用游戏引擎的杠牌方法（暂时模拟）
    const success = true; // this.game.playerGang(player);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} performed GANG`);
    }
    
    return success;
  }
  
  /**
   * 执行胡牌动作
   */
  private executeHuAction(action: MajiangAction, player: Player): boolean {
    // 调用游戏引擎的胡牌方法（暂时模拟）
    const success = true; // this.game.playerHu(player);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} performed HU`);
    }
    
    return success;
  }
  
  /**
   * 执行过牌动作
   */
  private executePassAction(action: MajiangAction, player: Player): boolean {
    // 调用游戏引擎的过牌方法（暂时模拟）
    const success = true; // this.game.playerPass(player);
    
    if (success && this.config.enableLogging) {
      console.log(`[GameAdapter] Player ${player.name} performed PASS`);
    }
    
    return success;
  }
  
  /**
   * 创建当前游戏状态的快照
   */
  public createSnapshot(): GameSnapshot {
    const gameState = new GameStateAdapter(this.game);
    const currentPlayer = this.getCurrentPlayer();
    
    if (!currentPlayer) {
      throw new Error('Cannot create snapshot without current player');
    }
    
    const stateVector = this.getCurrentStateVector();
    const availableActions = this.getAvailableActions();
    
    const snapshot: GameSnapshot = {
      gameState: this.cloneGameState(gameState),
      currentPlayer: this.clonePlayer(currentPlayer),
      availableActions: [...availableActions],
      stateVector,
      timestamp: Date.now()
    };
    
    this.currentSnapshot = snapshot;
    
    if (this.config.autoSaveStates) {
      this.saveSnapshot(snapshot);
    }
    
    return snapshot;
  }
  
  /**
   * 保存快照到历史记录
   */
  private saveSnapshot(snapshot: GameSnapshot): void {
    this.gameHistory.push(snapshot);
    
    // 限制历史记录长度
    if (this.gameHistory.length > this.config.maxHistoryLength) {
      this.gameHistory.shift();
    }
  }
  
  /**
   * 获取游戏历史记录
   */
  public getGameHistory(): GameSnapshot[] {
    return [...this.gameHistory];
  }
  
  /**
   * 获取最近的快照
   */
  public getLastSnapshot(): GameSnapshot | null {
    return this.currentSnapshot;
  }
  
  /**
   * 检查游戏是否结束
   */
  public isGameOver(): boolean {
    const gameState = new GameStateAdapter(this.game);
    return gameState.getStatus() === 'FINISHED';
  }
  
  /**
   * 获取游戏结果
   */
  public getGameResult(): { winner: Player | null, scores: Map<Player, number> } | null {
    if (!this.isGameOver()) {
      return null;
    }
    
    // 这里需要根据实际的游戏引擎API来获取结果
    // 暂时返回简化的结果
    return {
      winner: null,
      scores: new Map()
    };
  }
  
  /**
   * 重置游戏状态
   */
  public resetGame(): void {
    this.game.reset();
    this.gameHistory = [];
    this.currentSnapshot = null;
    
    if (this.config.enableLogging) {
      console.log('[GameAdapter] Game reset');
    }
  }
  
  /**
   * 克隆游戏状态（深拷贝）
   */
  private cloneGameState(gameState: GameState): GameState {
    // 这里需要实现深拷贝逻辑
    // 暂时返回原对象（在实际使用中需要实现真正的深拷贝）
    return gameState;
  }
  
  /**
   * 克隆玩家对象（深拷贝）
   */
  private clonePlayer(player: Player): Player {
    // 这里需要实现深拷贝逻辑
    // 暂时返回原对象（在实际使用中需要实现真正的深拷贝）
    return player;
  }
  
  /**
   * 获取适配器配置
   */
  public getConfig(): GameAdapterConfig {
    return { ...this.config };
  }
  
  /**
   * 更新适配器配置
   */
  public updateConfig(newConfig: Partial<GameAdapterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * 获取游戏统计信息
   */
  public getGameStats(): {
    totalMoves: number;
    gamePhase: 'early' | 'middle' | 'late';
    remainingTiles: number;
    averageActionTime: number;
  } {
    const gameState = new GameStateAdapter(this.game);
    const totalMoves = this.gameHistory.length;
    const remainingTiles = gameState.getRemainingTilesCount();
    
    // 计算游戏阶段
    let gamePhase: 'early' | 'middle' | 'late';
    const usedTiles = 136 - remainingTiles;
    if (usedTiles < 40) {
      gamePhase = 'early';
    } else if (usedTiles < 80) {
      gamePhase = 'middle';
    } else {
      gamePhase = 'late';
    }
    
    // 计算平均动作时间
    let averageActionTime = 0;
    if (this.gameHistory.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < this.gameHistory.length; i++) {
        timeDiffs.push(this.gameHistory[i].timestamp - this.gameHistory[i - 1].timestamp);
      }
      averageActionTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    }
    
    return {
      totalMoves,
      gamePhase,
      remainingTiles,
      averageActionTime
    };
  }
}