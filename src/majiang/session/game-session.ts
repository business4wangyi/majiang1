import { Game, GameState } from '../core/game';
import { PlayerType } from '../core/player';
import { TileManager } from '../core/tile-manager';
import { GameEventHandler } from '../ui/game-event-handler';
import { setAutoPlayMode } from '../config/runtime-state';
import { AutoTrainPlayerStat, AutoTrainResult } from './auto-train-result';
import {
  BuildTableSnapshotOptions,
  TableSnapshot,
  buildTableSnapshotFromGame,
} from './table-snapshot';

export interface GameSessionOptions {
  mode?: 'auto';
}

/**
 * 无头对局会话（CAP-ENG-SESSION + CAP-ENG-SNAP + CAP-CLI-TRAIN）。
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
    // 抬高 currentRound，避免 handleGameEnd 按 AUTO_PLAY_ROUNDS 误判「还要下一局」；多局由 runRounds 外层驱动
    handler.currentRound = Number.MAX_SAFE_INTEGER;
    return new GameSession(game, handler);
  }

  async runFullRound(): Promise<void> {
    await this.runRounds(1);
  }

  /** CAP-CLI-TRAIN：同 Session 内连续 N 局（reset 保统计累加） */
  async runRounds(rounds: number): Promise<AutoTrainResult> {
    if (!Number.isInteger(rounds) || rounds < 1) {
      throw new Error(`GameSession: rounds must be integer >= 1, got ${rounds}`);
    }
    if (this.started) {
      throw new Error('GameSession: runRounds/runFullRound already called');
    }
    this.started = true;

    for (let i = 0; i < rounds; i++) {
      await this.handler.safeStartGameAndEnd();
      if (this.game.state !== GameState.ENDED) {
        this.game.setState(GameState.ENDED);
      }
      if (i < rounds - 1) {
        this.game.reset();
      }
    }

    return this.collectAutoTrainResult(rounds);
  }

  getState(): GameState {
    return this.game.state;
  }

  /** CAP-ENG-SNAP：引擎权威快照，可供 createTableViewModelFromSnapshot */
  getTableSnapshot(options?: BuildTableSnapshotOptions): TableSnapshot {
    return buildTableSnapshotFromGame(this.game, options);
  }

  private collectAutoTrainResult(rounds: number): AutoTrainResult {
    const players: AutoTrainPlayerStat[] = this.game
      .getAllPlayers()
      .filter((p) => p.type === PlayerType.AI)
      .map((ai) => {
        const winRate = ai.totalGames > 0 ? ai.winCount / ai.totalGames : 0;
        const avgScore = ai.totalGames > 0 ? ai.score / ai.totalGames : 0;
        return {
          name: ai.name,
          totalGames: ai.totalGames,
          winCount: ai.winCount,
          drawCount: ai.drawCount,
          score: ai.score,
          winRate,
          avgScore,
        };
      });
    return { rounds, players };
  }
}
