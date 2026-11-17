import { Game, GameState } from '../core/game';
import { TileManager } from '../core/tile-manager';
import { GameEventHandler } from '../ui/game-event-handler';
import { setAutoPlayMode } from '../config/runtime-state';
import {
  BuildTableSnapshotOptions,
  TableSnapshot,
  buildTableSnapshotFromGame,
} from './table-snapshot';

export interface GameSessionOptions {
  mode?: 'auto';
}

/**
 * 无头对局会话（CAP-ENG-SESSION + CAP-ENG-SNAP）。
 * auto：4 AI，复用 GameEventHandler.safeStartGameAndEnd；快照可喂 view-model。
 * ponytail: 人类步进 / Express 留给 CAP-API-GAME。
 */
export class GameSession {
  readonly game: Game;
  private readonly handler: GameEventHandler;
  private started = false;

  private constructor(game: Game, handler: GameEventHandler) {
    this.game = game;
    this.handler = handler;
  }

  static create(options: GameSessionOptions = {}): GameSession {
    const mode = options.mode ?? 'auto';
    if (mode !== 'auto') {
      throw new Error(`GameSession: unsupported mode "${mode}" in CAP-ENG-SESSION`);
    }
    setAutoPlayMode(true);
    const game = new Game();
    game.setupPlayers(true);
    const handler = new GameEventHandler(game, TileManager.getInstance());
    // 单局验收：抬高 currentRound，避免 handleGameEnd 按 AUTO_PLAY_ROUNDS=1000 判定「还要下一局」时误导调用方
    handler.currentRound = Number.MAX_SAFE_INTEGER;
    return new GameSession(game, handler);
  }

  async runFullRound(): Promise<void> {
    if (this.started) {
      throw new Error('GameSession: runFullRound already called');
    }
    this.started = true;
    await this.handler.safeStartGameAndEnd();
    if (this.game.state !== GameState.ENDED) {
      this.game.setState(GameState.ENDED);
    }
  }

  getState(): GameState {
    return this.game.state;
  }

  /** CAP-ENG-SNAP：引擎权威快照，可供 createTableViewModelFromSnapshot */
  getTableSnapshot(options?: BuildTableSnapshotOptions): TableSnapshot {
    return buildTableSnapshotFromGame(this.game, options);
  }
}
