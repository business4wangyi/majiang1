import { Tile } from './tile';
import { PlayerAction } from './rule-types';

export enum GameState {
  INIT,       // 初始化
  DEALING,    // 发牌中
  PLAYING,    // 游戏中
  WAITING_ACTION, // 等待玩家响应（吃碰杠胡）
  ENDED       // 游戏结束
}

export interface PendingAction {
  tile: Tile;
  fromPlayerId: number;
  allowedActions: PlayerAction[];
  waitingPlayers: number[];
  timeoutId?: NodeJS.Timeout;
}

export class GameStateManager {
  public state: GameState = GameState.INIT;
  public currentPlayerIndex: number = 0;
  public lastDiscardedTile: Tile | null = null;
  public pendingAction: PendingAction | null = null;
  public bankerIndex: number = 0;
  public windRound: number = 0; // 0:东风圈, 1:南风圈, 2:西风圈, 3:北风圈
  public drawCount: number = 0;
  public lastDrawCount: number = 0;

  constructor() {}

  public setState(newState: GameState): void {
    this.state = newState;
  }

  public setCurrentPlayerIndex(index: number): void {
    this.currentPlayerIndex = index;
  }

  public setLastDiscardedTile(tile: Tile | null): void {
    this.lastDiscardedTile = tile;
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
} 