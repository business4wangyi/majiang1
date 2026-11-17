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

export type GameSessionMode = 'auto' | 'api';

export interface GameSessionOptions {
  mode?: GameSessionMode;
  /** api 模式：稳定对局 id，写入快照 gameId */
  gameId?: string;
}

/** CAP-API-GAME：客户端提交的动作（状态机仍在服务端 Session） */
export interface SessionActionInput {
  id: string;
  tileIndex?: number;
}

export class SessionActionError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'SessionActionError';
  }
}

/**
 * 无头对局会话（CAP-ENG-SESSION + CAP-ENG-SNAP + CAP-CLI-TRAIN + CAP-API-GAME）。
 * auto：4 AI，复用 GameEventHandler.safeStartGameAndEnd。
 * api：1 人 + 3 AI，start + applyAction 步进；完整 AI 续走留给 CAP-WEB-BRIDGE。
 */
export class GameSession {
  readonly game: Game;
  readonly mode: GameSessionMode;
  readonly gameId: string;
  private readonly handler: GameEventHandler;
  private started = false;

  private constructor(
    game: Game,
    handler: GameEventHandler,
    mode: GameSessionMode,
    gameId: string
  ) {
    this.game = game;
    this.handler = handler;
    this.mode = mode;
    this.gameId = gameId;
  }

  static create(options: GameSessionOptions = {}): GameSession {
    const mode: GameSessionMode = options.mode ?? 'auto';
    if (mode !== 'auto' && mode !== 'api') {
      throw new Error(`GameSession: unsupported mode "${mode}"`);
    }

    const gameId = options.gameId ?? `session-${Date.now()}`;
    const game = new Game();
    if (mode === 'auto') {
      setAutoPlayMode(true);
      game.setupPlayers(true);
    } else {
      setAutoPlayMode(false);
      game.setupPlayers(false);
    }

    const handler = new GameEventHandler(game, TileManager.getInstance());
    // 抬高 currentRound，避免 handleGameEnd 按 AUTO_PLAY_ROUNDS 误判「还要下一局」；多局由 runRounds 外层驱动
    handler.currentRound = Number.MAX_SAFE_INTEGER;
    return new GameSession(game, handler, mode, gameId);
  }

  /** CAP-API-GAME：开局发牌，进入可出牌态（权威在服务端） */
  start(): void {
    if (this.mode !== 'api') {
      throw new Error('GameSession.start only supported in api mode');
    }
    if (this.started) {
      throw new Error('GameSession: already started');
    }
    this.handler.startGame();
    this.started = true;
  }

  /**
   * CAP-API-GAME：应用客户端动作；非法则抛 SessionActionError 且不脏写。
   * ponytail: 本刀只保证 discard 权威落在 Session；响应窗/AI 续走 → CAP-WEB-BRIDGE。
   */
  applyAction(action: SessionActionInput): TableSnapshot {
    if (this.mode !== 'api') {
      throw new Error('GameSession.applyAction only supported in api mode');
    }
    if (!this.started) {
      throw new SessionActionError('game not started');
    }
    if (!action || typeof action.id !== 'string' || !action.id) {
      throw new SessionActionError('action.id required');
    }

    const before = this.fingerprint();
    const snapshot = this.getTableSnapshot();
    const allowed = snapshot.availableActions.find((a) => a.id === action.id && a.available);
    if (!allowed) {
      throw new SessionActionError(`action not available: ${action.id}`);
    }

    if (action.id === 'discard') {
      const current = this.game.getCurrentPlayer();
      if (!current || current.type !== PlayerType.HUMAN) {
        throw new SessionActionError('discard only when human is current player');
      }
      const tileIndex = action.tileIndex;
      if (!Number.isInteger(tileIndex) || tileIndex! < 0 || tileIndex! >= current.handTiles.length) {
        throw new SessionActionError(
          `invalid tileIndex: ${String(tileIndex)} (hand=${current.handTiles.length})`
        );
      }
      this.handler.currentPlayerDiscard(tileIndex!);
    } else {
      // ponytail: hu/peng/chi/gang 步进留给 WEB-BRIDGE；本刀 smoke 只覆盖 discard
      throw new SessionActionError(`unsupported action in CAP-API-GAME: ${action.id}`);
    }

    const after = this.getTableSnapshot();
    if (this.fingerprint() === before) {
      throw new SessionActionError('action produced no state change');
    }
    return after;
  }

  async runFullRound(): Promise<void> {
    await this.runRounds(1);
  }

  /** CAP-CLI-TRAIN：同 Session 内连续 N 局（reset 保统计累加） */
  async runRounds(rounds: number): Promise<AutoTrainResult> {
    if (this.mode !== 'auto') {
      throw new Error('GameSession.runRounds only supported in auto mode');
    }
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
    const defaults: BuildTableSnapshotOptions = {
      gameId: this.gameId,
      ...(this.mode === 'api' ? { selfSeatId: 'east' as const } : {}),
    };
    return buildTableSnapshotFromGame(this.game, { ...defaults, ...options });
  }

  /** 用于非法动作后断言「未脏写」 */
  fingerprint(): string {
    const players = this.game.getAllPlayers();
    const hands = players.map((p) => p.handTiles.map((t) => t.toString()).join(',')).join('|');
    const rivers = players
      .map((p) => (p.discardedTiles || []).map((t) => t.toString()).join(','))
      .join('|');
    return `${this.game.state}:${this.game.currentPlayerIndex}:${hands}:${rivers}`;
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
