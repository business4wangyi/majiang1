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

  public getGameStateInfo(): string {
    return `游戏状态: ${this.gameState.state}
当前玩家: ${this.gameState.currentPlayerIndex}
剩余牌数: ${this.tileManager.getRemainingTiles()}
总牌数: ${this.tileManager.getTotalTiles()}`;
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
    return this.players.some(p => p.handTiles.length > 13);
  }

  public getPlayersWithExcessTiles(): Player[] {
    return this.players.filter(p => p.handTiles.length > 13);
  }

  public getAvailableActions(): PlayerAction[] {
    // 这里需要实现获取当前可用操作的逻辑
    // 为了简单起见，这里返回一个空数组
    return [];
  }

  public playerPass(playerId: number): void {
    // 这里需要实现玩家"过"的逻辑
    // 为了简单起见，这里只是设置下一个玩家为当前玩家
    this.nextTurn();
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

    // 添加手牌数量校验
    this.ensureValidHandSizes();

    return true;
  }

  private ensureValidHandSizes(): void {
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const handSize = player.handTiles.length;
      const expectedSize = 13;

      if (handSize < expectedSize) {
        displayManager.printWarning(`玩家${i}手牌数量不足，当前数量: ${handSize}，需要补牌`);
        const tilesToDraw = expectedSize - handSize;
        
        for (let j = 0; j < tilesToDraw; j++) {
          const tile = this.tileManager.drawTile();
          if (tile) {
            player.drawTile(tile);
          } else {
            displayManager.printWarning(`牌墙已空，无法补牌`);
            break;
          }
        }
      } else if (handSize > expectedSize) {
        displayManager.printWarning(`玩家${i}手牌数量过多，当前数量: ${handSize}，需要弃牌`);
        const tilesToDiscard = handSize - expectedSize;
        
        for (let j = 0; j < tilesToDiscard; j++) {
          const tile = player.handTiles[player.handTiles.length - 1];
          if (tile) {
            player.discardTile(player.handTiles.length - 1);
          }
        }
      }
    }
  }
}