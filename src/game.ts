import { Tile } from './tile';
import { Player, PlayerType } from './player';
import { PlayerAction } from './rule-types';
import { GameStateManager } from './game-state';
import { TileManager } from './tile-manager';
import { RuleEngine } from './rule-engine';
import { GameFlow } from './game-flow';
import { displayManager } from './display-manager';

// 游戏状态
export enum GameState {
  INIT,       // 初始化
  DEALING,    // 发牌中
  PLAYING,    // 游戏中
  WAITING_ACTION, // 等待玩家响应（吃碰杠胡）
  ENDED       // 游戏结束
}

// 游戏类
export class Game {
  private gameState: GameStateManager;
  private tileManager: TileManager;
  private gameFlow: GameFlow;
  private players: Player[] = [];

  constructor(players?: Player[]) {
    this.gameState = new GameStateManager();
    this.tileManager = new TileManager();
    this.gameFlow = new GameFlow(
      this.gameState,
      this.tileManager,
      players || []
    );
    this.players = players || [];
  }

  public startGame(): void {
    this.gameFlow.startGame();
  }

  public currentPlayerDraw(): Tile | null {
    return this.gameFlow.currentPlayerDraw();
  }

  public currentPlayerDiscard(tileIndex: number): Tile | null {
    return this.gameFlow.currentPlayerDiscard(tileIndex);
  }

  public nextTurn(): void {
    this.gameFlow.nextTurn();
  }

  public forceAIPlayerDiscard(): boolean {
    return this.gameFlow.forceAIPlayerDiscard();
  }

  public getPlayers(): Player[] {
    return this.players;
  }

  public addPlayer(player: Player): void {
    displayManager.print(`添加玩家: ${player.name} (${player.type === PlayerType.AI ? 'AI' : '人类'})`);
    this.players.push(player);
    
    // 重新初始化GameFlow，确保玩家列表更新
    this.gameFlow = new GameFlow(
      this.gameState,
      this.tileManager,
      this.players
    );
    displayManager.print(`当前游戏共有 ${this.players.length} 名玩家`);
  }

  // 添加公共属性访问器
  public get state(): GameState {
    return this.gameState.state;
  }

  public get currentPlayerIndex(): number {
    return this.gameState.currentPlayerIndex;
  }

  // 设置当前玩家索引
  public setCurrentPlayerIndex(index: number): void {
    if (index >= 0 && index < this.players.length) {
      this.gameState.currentPlayerIndex = index;
      displayManager.print(`当前玩家索引已更新为: ${index}, 玩家: ${this.players[index].name}`);
    } else {
      displayManager.printError(`无效的玩家索引: ${index}, 有效范围: 0-${this.players.length - 1}`);
    }
  }

  public get lastDiscardedTile(): Tile | null {
    return this.gameState.lastDiscardedTile;
  }

  public setLastDiscardedTile(tile: Tile | null): void {
    this.gameState.setLastDiscardedTile(tile);
  }

  public get drawCount(): number {
    return this.gameState.drawCount;
  }

  public get remainingTiles(): number {
    return this.tileManager.getRemainingTiles();
  }

  public getTotalTiles(): number {
    return this.tileManager.getTotalTiles();
  }

  public getRemainingTiles(): number {
    return this.tileManager.getRemainingTiles();
  }

  public getTileManager(): TileManager {
    return this.tileManager;
  }

  public getCurrentPlayer(): Player {
    return this.players[this.gameState.currentPlayerIndex];
  }

  public getPlayerByIndex(index: number): Player {
    return this.players[index];
  }

  public getAllPlayers(): Player[] {
    return [...this.players];
  }

  public hasPlayerWithExcessTiles(): boolean {
    return this.players.some(p => p.needsToDiscard());
  }

  public getPlayersWithExcessTiles(): Player[] {
    return this.players.filter(p => p.needsToDiscard());
  }

  public getAvailableActions(): PlayerAction[] {
    // 获取当前玩家
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) {
      return [];
    }
    
    // 使用RuleEngine获取可用操作
    return RuleEngine.getAvailableActions(
      currentPlayer, 
      this.gameState.lastDiscardedTile
    );
  }

  public playerPass(playerId: number): void {
    // 获取玩家
    const player = this.players[playerId];
    if (!player) {
      displayManager.printError(`玩家ID ${playerId} 无效`);
      return;
    }
    
    // 记录玩家选择"过"
    displayManager.printWarning(`玩家 ${player.name} 选择了"过"`);
    
    // 如果是当前玩家，进入下一个回合
    if (playerId === this.gameState.currentPlayerIndex) {
      displayManager.print(`当前玩家选择了"过"，进入下一个回合`);
      this.nextTurn();
    } else {
      // 如果不是当前玩家，可能是在响应其他玩家的动作
      displayManager.print(`玩家${playerId}选择了"过"，等待其他玩家响应或继续游戏`);
      
      // 处理等待玩家的回应逻辑...
      // (这部分逻辑可能需要访问gameFlow的内部状态，
      // 具体实现可能需要根据GameFlow类的设计进一步修改)
      if (this.gameState.state === GameState.WAITING_ACTION) {
        // 检查是否所有玩家都已响应
        // 如果是，恢复到PLAYING状态
        this.gameState.state = GameState.PLAYING;
      }
    }
  }

  // 添加公共方法，直接从牌山抽牌给指定玩家
  public drawTileForPlayer(player: Player): Tile | null {
    // 从牌山抽一张牌
    const tile = this.tileManager.drawTile();
    if (tile) {
      // 将牌添加到玩家手牌中
      player.drawTile(tile);
      return tile;
    }
    return null;
  }

  public playerGang(playerId: number, targetTile: Tile | null, isTestMode: boolean = false): boolean {
    const player = this.players[playerId];
    if (!player) {
      return false;
    }

    // 执行杠牌操作
    const success = player.gang(targetTile);
    if (!success) {
      return false;
    }

    // 杠后摸牌
    const tile = this.tileManager.drawTile();
    if (tile) {
      player.drawTile(tile);
    }

    // 检查杠后是否可以胡
    if (RuleEngine.canHu(player)) {
      displayManager.printSuccess(`${player.name} 杠后胡牌！`);
      return true;
    }

    return true;
  }
} 