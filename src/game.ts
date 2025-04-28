import { Tile } from './tile';
import { Player, PlayerType, PlayerState } from './player';
import { PlayerAction } from './rule-types';
import { TileManager } from './tile-manager';
import { RuleEngine } from './rule-engine';
import { displayManager } from './display-manager';
import { AIPlayer } from './ai-player';
import { HumanPlayer } from './human-player';

// 游戏状态
export enum GameState {
  INIT,       // 初始化
  DEALING,    // 发牌中
  PLAYING,    // 游戏中
  WAITING_ACTION, // 等待玩家响应（吃碰杠胡）
  ENDED       // 游戏结束
}

// 为其他玩家等待响应的动作
export interface PendingAction {
  tile: Tile;
  fromPlayerId: number;
  allowedActions: PlayerAction[];
  waitingPlayers: number[];
  timeoutId?: NodeJS.Timeout;
}

// 游戏类 - 只负责游戏状态管理和核心逻辑
export class Game {
  // 游戏状态相关属性
  public state: GameState = GameState.INIT;
  public currentPlayerIndex: number = 0;
  public lastDiscardedTile: Tile | null = null;
  public pendingAction: PendingAction | null = null;
  public bankerIndex: number = 0;
  public windRound: number = 0; // 0:东风圈, 1:南风圈, 2:西风圈, 3:北风圈
  public drawCount: number = 0;
  public lastDrawCount: number = 0;

  private tileManager: TileManager;
  private players: Player[] = [];

  constructor(players?: Player[]) {
    // 使用 TileManager 的单例实例
    this.tileManager = TileManager.getInstance();
    this.players = players || [];
  }

  /**
   * 设置游戏玩家
   * @param autoPlayMode 是否启用自动打牌模式
   */
  public setupPlayers(autoPlayMode: boolean): void {
    // 清空现有玩家列表
    this.players = [];
    
    if (autoPlayMode) {
      // 自动模式：4个AI玩家
      displayManager.printTitle(`初始化游戏：4个AI玩家对弈`);
      
      // 添加1个AI玩家
      this.addPlayer(new AIPlayer('东家(AI)'));
    } else {
      // 手动模式：1个人类玩家 + 3个AI玩家
      displayManager.printTitle(`初始化游戏：1个人类玩家 + 3个AI玩家`);
      
      // 添加1个人类玩家
      this.addPlayer(new HumanPlayer('东家(玩家)'));
    }

    // 添加3个AI玩家
    this.addPlayer(new AIPlayer('南家(AI)'));
    this.addPlayer(new AIPlayer('西家(AI)'));
    this.addPlayer(new AIPlayer('北家(AI)'));
    
    displayManager.printSuccess(`游戏玩家设置完成，共${this.players.length}名玩家`);
  }

  // 状态管理方法
  public setState(newState: GameState): void {
    this.state = newState;
  }

  public setCurrentPlayerIndex(index: number): void {
    if (index >= 0 && index < this.players.length) {
      this.currentPlayerIndex = index;
      displayManager.print(`当前玩家索引已更新为: ${index}, 玩家: ${this.players[index].name}`);
    } else {
      displayManager.printError(`无效的玩家索引: ${index}, 有效范围: 0-${this.players.length - 1}`);
    }
  }

  public setLastDiscardedTile(tile: Tile | null): void {
    this.lastDiscardedTile = tile;
  }

  public getLastDiscardedTile(): Tile | null {
    return this.lastDiscardedTile;
  }

  public setPendingAction(action: PendingAction | null): void {
    this.pendingAction = action;
  }

  public incrementDrawCount(): void {
    this.drawCount++;
  }

  public resetDrawCount(): void {
    this.drawCount = 0;
  }

  public setLastDrawCount(count: number): void {
    this.lastDrawCount = count;
  }

  // 玩家管理方法
  public getPlayers(): Player[] {
    return this.players;
  }

  public addPlayer(player: Player): void {
    displayManager.print(`添加玩家: ${player.name} (${player.type === PlayerType.AI ? 'AI' : '人类'})`);
    this.players.push(player);
    displayManager.print(`当前游戏共有 ${this.players.length} 名玩家`);
  }

  public getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  public getPlayerByIndex(index: number): Player {
    return this.players[index];
  }

  public getAllPlayers(): Player[] {
    return [...this.players];
  }

  // 游戏状态查询方法
  public hasPlayerWithExcessTiles(): boolean {
    return this.players.some(p => p.needsToDiscard());
  }

  public getPlayersWithExcessTiles(): Player[] {
    return this.players.filter(p => p.needsToDiscard());
  }

  // 牌管理方法
  public getRemainingTiles(): number {
    return this.tileManager.getRemainingTiles();
  }

  public getTotalTiles(): number {
    return this.tileManager.getTotalTiles();
  }

  public getTileManager(): TileManager {
    return this.tileManager;
  }

  // 规则相关方法
  public getAvailableActions(): PlayerAction[] {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) {
      return [];
    }
    
    return RuleEngine.getAvailableActions(
      currentPlayer, 
      this.lastDiscardedTile
    );
  }

  /**
   * 重置游戏状态，准备开始新一局
   */
  public reset(): void {
    // 重置游戏状态
    this.state = GameState.INIT;
    this.lastDiscardedTile = null;
    this.pendingAction = null;
    this.drawCount = 0;
    this.lastDrawCount = 0;
    
    // 重置牌管理器
    this.tileManager.reset();
    
    // 重置所有玩家状态
    for (const player of this.players) {
      player.handTiles = [];
      player.discardedTiles = [];
      player.revealedSets = [];
      player.flowerTiles = [];
      player.state = PlayerState.WAITING;
      player.lastDrawnTile = null;
    }
    
    // 设置庄家（可以轮换）
    this.bankerIndex = (this.bankerIndex + 1) % this.players.length;
    this.currentPlayerIndex = this.bankerIndex;
    
    displayManager.printSuccess("游戏状态已重置，准备开始新一局");
  }
} 