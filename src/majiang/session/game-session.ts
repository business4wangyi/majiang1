import { Game, GameState } from '../core/game';
import { Player, PlayerState, PlayerType } from '../core/player';
import { PlayerAction } from '../core/rule-types';
import { RuleEngine } from '../core/rule-engine';
import { FengValue, Tile, TileType } from '../core/tile';
import { TileManager } from '../core/tile-manager';
import { GameEventHandler } from '../ui/game-event-handler';
import * as input from '../ui/input';
import { AUTO_PLAY_MODE, setAutoPlayMode } from '../config/runtime-state';
import { AutoTrainPlayerStat, AutoTrainResult } from './auto-train-result';
import {
  BuildTableSnapshotOptions,
  TableSnapshot,
  buildTableSnapshotFromGame,
} from './table-snapshot';

export type GameSessionMode = 'auto' | 'api';

/** 测试/显式 API：固定副露/胡响应窗；默认对局勿传 */
export type MeldFixtureId = 'peng-ready' | 'chi-ready' | 'hu-ready';

export const MELD_FIXTURE_IDS: readonly MeldFixtureId[] = [
  'peng-ready',
  'chi-ready',
  'hu-ready',
] as const;

export interface GameSessionOptions {
  mode?: GameSessionMode;
  /** api 模式：稳定对局 id，写入快照 gameId */
  gameId?: string;
  /** 仅测试/显式：开局后装入能碰/能吃响应窗 */
  fixture?: MeldFixtureId;
}

/** CAP-API-GAME / CAP-WEB-BRIDGE：客户端提交的动作（状态机仍在服务端 Session） */
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

export function parseMeldFixture(raw: unknown): MeldFixtureId | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    throw new SessionActionError(`invalid fixture: ${String(raw)}`);
  }
  if ((MELD_FIXTURE_IDS as readonly string[]).includes(raw)) {
    return raw as MeldFixtureId;
  }
  throw new SessionActionError(`unknown fixture: ${raw}`);
}

const ACTION_ID_TO_ENUM: Record<string, PlayerAction> = {
  hu: PlayerAction.HU,
  pass: PlayerAction.PASS,
  peng: PlayerAction.PENG,
  gang: PlayerAction.GANG,
  chi: PlayerAction.CHI,
};

/**
 * 无头对局会话（CAP-ENG-SESSION … CAP-WEB-BRIDGE）。
 * auto：4 AI；api：1 人 + 3 AI，applyAction 后 AI 续走到人类决策点或终局。
 */
export class GameSession {
  readonly game: Game;
  readonly mode: GameSessionMode;
  readonly gameId: string;
  readonly fixture?: MeldFixtureId;
  private readonly handler: GameEventHandler;
  private started = false;

  private constructor(
    game: Game,
    handler: GameEventHandler,
    mode: GameSessionMode,
    gameId: string,
    fixture?: MeldFixtureId
  ) {
    this.game = game;
    this.handler = handler;
    this.mode = mode;
    this.gameId = gameId;
    this.fixture = fixture;
  }

  static create(options: GameSessionOptions = {}): GameSession {
    const mode: GameSessionMode = options.mode ?? 'auto';
    if (mode !== 'auto' && mode !== 'api') {
      throw new Error(`GameSession: unsupported mode "${mode}"`);
    }
    if (options.fixture && mode !== 'api') {
      throw new Error('GameSession: fixture only supported in api mode');
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
    return new GameSession(game, handler, mode, gameId, options.fixture);
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
    if (this.fixture === 'peng-ready') {
      this.installPengReadyFixture();
    } else if (this.fixture === 'chi-ready') {
      this.installChiReadyFixture();
    } else if (this.fixture === 'hu-ready') {
      this.installHuReadyFixture();
    }
  }

  /**
   * CAP-WEB-BRIDGE：应用客户端动作；非法则抛 SessionActionError 且不脏写。
   * 出牌后 AI 续走直至轮到人类、响应窗或终局（禁止假 waiting_ai 死等）。
   */
  async applyAction(action: SessionActionInput): Promise<TableSnapshot> {
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

    if (this.game.state === GameState.WAITING_ACTION) {
      await this.applyHumanResponse(action.id);
    } else if (action.id === 'discard') {
      await this.applyHumanDiscard(action.tileIndex);
    } else {
      throw new SessionActionError(`unsupported action: ${action.id}`);
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
      resultTypeHint: this.handler.getLastWinKind() ?? undefined,
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

  private async applyHumanDiscard(tileIndex: number | undefined): Promise<void> {
    const current = this.game.getCurrentPlayer();
    if (!current || current.type !== PlayerType.HUMAN) {
      throw new SessionActionError('discard only when human is current player');
    }
    if (!Number.isInteger(tileIndex) || tileIndex! < 0 || tileIndex! >= current.handTiles.length) {
      throw new SessionActionError(
        `invalid tileIndex: ${String(tileIndex)} (hand=${current.handTiles.length})`
      );
    }
    const discarded = this.handler.currentPlayerDiscard(tileIndex!);
    const stop = await this.resolveAfterDiscard(discarded);
    if (stop) return;
    this.handler.nextTurn();
    await this.advanceAiUntilHumanOrEnd();
  }

  private async applyHumanResponse(actionId: string): Promise<void> {
    const pending = this.game.pendingAction;
    if (!pending || !pending.tile) {
      throw new SessionActionError('no pending response');
    }
    const human = this.getHumanPlayer();
    const enumAction = ACTION_ID_TO_ENUM[actionId];
    if (!enumAction || !pending.allowedActions.includes(enumAction)) {
      throw new SessionActionError(`action not available: ${actionId}`);
    }

    const tile = pending.tile;
    this.clearResponseWindow();

    if (enumAction === PlayerAction.PASS) {
      await this.withHumanAutoPass(async () => {
        await this.handler.checkOtherPlayersResponse(tile);
      });
      if (this.handler.checkGameEnd() || this.game.getRemainingTiles() <= 0) {
        this.game.setState(GameState.ENDED);
        this.markWinnerStats();
        return;
      }
      // 若响应流程内已胡牌结束
      if (this.getState() !== GameState.PLAYING && this.getState() !== GameState.WAITING_ACTION) {
        this.markWinnerStats();
        return;
      }
      this.handler.nextTurn();
      await this.advanceAiUntilHumanOrEnd();
      return;
    }

    if (enumAction === PlayerAction.HU) {
      this.handler.handlePlayerHu(human, tile);
      this.markWinnerStats();
      return;
    }

    if (enumAction === PlayerAction.PENG) {
      const ok = await this.handler.handlePeng(human, tile);
      if (!ok) throw new SessionActionError('peng failed');
      this.game.setState(GameState.PLAYING);
      return;
    }

    if (enumAction === PlayerAction.GANG) {
      const ok = await this.handler.handleGang(human, tile);
      if (!ok) throw new SessionActionError('gang failed');
      this.game.setState(GameState.PLAYING);
      return;
    }

    if (enumAction === PlayerAction.CHI) {
      const ok = await this.handler.handleChi(human, tile);
      if (!ok) throw new SessionActionError('chi failed');
      this.game.setState(GameState.PLAYING);
      return;
    }

    throw new SessionActionError(`unsupported response: ${actionId}`);
  }

  /**
   * 处理弃牌后的响应。返回 true = 已停在响应窗/终局，调用方勿再 nextTurn。
   */
  private async resolveAfterDiscard(discarded: Tile): Promise<boolean> {
    if (await this.tryResolveAiHu(discarded)) {
      this.markWinnerStats();
      return true;
    }

    const humanActions = this.listHumanResponseActions(discarded);
    const discarder = this.game.getCurrentPlayer();
    if (discarder.type === PlayerType.AI && humanActions.length > 0) {
      this.openResponseWindow(discarded, humanActions);
      return true;
    }

    await this.withHumanAutoPass(async () => {
      await this.handler.checkOtherPlayersResponse(discarded);
    });

    if (this.handler.checkGameEnd() || this.game.getRemainingTiles() <= 0) {
      this.game.setState(GameState.ENDED);
      this.markWinnerStats();
      return true;
    }

    if (this.getState() !== GameState.PLAYING && this.getState() !== GameState.WAITING_ACTION) {
      this.markWinnerStats();
      return true;
    }

    return false;
  }

  private async advanceAiUntilHumanOrEnd(): Promise<void> {
    const prevAuto = AUTO_PLAY_MODE;
    setAutoPlayMode(true);
    try {
      let guard = 0;
      while (this.game.state === GameState.PLAYING) {
        guard += 1;
        if (guard > 500) {
          throw new Error('GameSession: AI advance exceeded turn guard');
        }

        if (this.game.getRemainingTiles() <= 0 || this.handler.checkGameEnd()) {
          this.game.setState(GameState.ENDED);
          this.markWinnerStats();
          break;
        }

        const current = this.game.getCurrentPlayer();
        if (!current) break;

        if (current.type === PlayerType.HUMAN) {
          current.state = PlayerState.ACTING;
          return;
        }

        const special = await this.handler.checkSpecialActions(current);
        if (this.handler.checkGameEnd() || this.game.getRemainingTiles() <= 0) {
          this.game.setState(GameState.ENDED);
          this.markWinnerStats();
          return;
        }

        if (!special) {
          await this.handler.forceAIPlayerDiscard();
          const tile = this.game.getLastDiscardedTile();
          if (!tile) {
            throw new Error('GameSession: AI discard produced no tile');
          }
          const stop = await this.resolveAfterDiscard(tile);
          if (stop) return;
        }

        this.handler.nextTurn();
      }
    } finally {
      setAutoPlayMode(prevAuto);
    }
  }

  private listHumanResponseActions(tile: Tile): PlayerAction[] {
    const human = this.getHumanPlayer();
    const discarder = this.game.getCurrentPlayer();
    const allPlayers = this.game.getAllPlayers();
    const actions: PlayerAction[] = [];

    if (RuleEngine.canHu(human, tile)) {
      actions.push(PlayerAction.HU);
    }
    if (
      RuleEngine.canGang(human, tile, { currentPlayer: discarder, allPlayers }).canGang
    ) {
      actions.push(PlayerAction.GANG);
    }
    if (RuleEngine.canPeng(human, tile)) {
      actions.push(PlayerAction.PENG);
    }
    const nextIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
    if (allPlayers[nextIndex] === human && RuleEngine.canChi(human, tile)) {
      actions.push(PlayerAction.CHI);
    }

    if (actions.length === 0) return [];
    actions.push(PlayerAction.PASS);
    return actions;
  }

  private async tryResolveAiHu(tile: Tile): Promise<boolean> {
    const discarder = this.game.getCurrentPlayer();
    const ais = this.game
      .getAllPlayers()
      .filter((p) => p.id !== discarder.id && p.type === PlayerType.AI && RuleEngine.canHu(p, tile));
    if (ais.length === 0) return false;
    this.handler.handlePlayerHu(ais[0], tile);
    return this.getState() !== GameState.PLAYING;
  }

  private openResponseWindow(tile: Tile, actions: PlayerAction[]): void {
    const human = this.getHumanPlayer();
    const discarder = this.game.getCurrentPlayer();
    const humanIndex = this.game.getAllPlayers().findIndex((p) => p.id === human.id);
    this.game.setState(GameState.WAITING_ACTION);
    this.game.setPendingAction({
      tile,
      fromPlayerId: discarder.id,
      allowedActions: actions,
      waitingPlayers: humanIndex >= 0 ? [humanIndex] : [],
    });
  }

  /**
   * 固定响应窗：南家打出东风，人类手牌必有一对东风 → 能碰（风牌，避免误出吃）。
   * ponytail: 只改手牌/河牌/pending，不改 core 判定；升级可换成整山种子。
   */
  private installPengReadyFixture(): void {
    const players = this.game.getAllPlayers();
    const human = this.getHumanPlayer();
    const discarderIndex = 1; // 南家 AI
    this.game.setCurrentPlayerIndex(discarderIndex);
    const discarder = players[discarderIndex];

    const type = TileType.FENG;
    const value = FengValue.DONG;
    for (const p of players) {
      p.handTiles = p.handTiles.filter((t) => !(t.type === type && t.value === value));
    }
    this.normalizeHumanHandSize(human, 13);
    human.handTiles[0] = new Tile(type, value, 9101);
    human.handTiles[1] = new Tile(type, value, 9102);
    human.sortHand();

    const discarded = new Tile(type, value, 9103);
    discarder.discardedTiles.push(discarded);
    this.game.setLastDiscardedTile(discarded);

    const actions = this.listHumanResponseActions(discarded);
    if (!actions.includes(PlayerAction.PENG)) {
      throw new Error('fixture peng-ready: PENG not available');
    }
    this.openResponseWindow(discarded, actions);
  }

  /**
   * 固定响应窗：南家打出东风，人类听东风 → 能胡（荣和）。
   * ponytail: 只改手牌/河牌/pending，不改 core 判定。
   */
  private installHuReadyFixture(): void {
    const players = this.game.getAllPlayers();
    const human = this.getHumanPlayer();
    const discarderIndex = 1; // 南家 AI
    this.game.setCurrentPlayerIndex(discarderIndex);
    const discarder = players[discarderIndex];

    const winTile = new Tile(TileType.FENG, FengValue.DONG, 9400);
    for (const p of players) {
      p.handTiles = p.handTiles.filter(
        (t) => !(t.type === winTile.type && t.value === winTile.value)
      );
    }
    human.handTiles = [
      new Tile(TileType.WAN, 1, 9401),
      new Tile(TileType.WAN, 1, 9402),
      new Tile(TileType.WAN, 1, 9403),
      new Tile(TileType.WAN, 2, 9404),
      new Tile(TileType.WAN, 3, 9405),
      new Tile(TileType.WAN, 4, 9406),
      new Tile(TileType.TIAO, 3, 9407),
      new Tile(TileType.TIAO, 4, 9408),
      new Tile(TileType.TIAO, 5, 9409),
      new Tile(TileType.TONG, 7, 9410),
      new Tile(TileType.TONG, 8, 9411),
      new Tile(TileType.TONG, 9, 9412),
      new Tile(TileType.FENG, FengValue.DONG, 9413),
    ];
    human.sortHand();

    const discarded = new Tile(TileType.FENG, FengValue.DONG, 9414);
    discarder.discardedTiles.push(discarded);
    this.game.setLastDiscardedTile(discarded);

    const actions = this.listHumanResponseActions(discarded);
    if (!actions.includes(PlayerAction.HU)) {
      throw new Error('fixture hu-ready: HU not available');
    }
    this.openResponseWindow(discarded, actions);
  }

  /**
   * 固定响应窗：北家打出 5万，人类为下家且手握 4万+6万 → 能吃。
   */
  private installChiReadyFixture(): void {
    const players = this.game.getAllPlayers();
    const human = this.getHumanPlayer();
    const discarderIndex = 3; // 北家 AI；下家即东家人类
    this.game.setCurrentPlayerIndex(discarderIndex);
    const discarder = players[discarderIndex];

    const type = TileType.WAN;
    for (const p of players) {
      p.handTiles = p.handTiles.filter(
        (t) => !(t.type === type && (t.value === 4 || t.value === 5 || t.value === 6))
      );
    }
    this.normalizeHumanHandSize(human, 13);
    human.handTiles[0] = new Tile(type, 4, 9201);
    human.handTiles[1] = new Tile(type, 6, 9202);
    human.sortHand();

    const discarded = new Tile(type, 5, 9203);
    discarder.discardedTiles.push(discarded);
    this.game.setLastDiscardedTile(discarded);

    const actions = this.listHumanResponseActions(discarded);
    if (!actions.includes(PlayerAction.CHI)) {
      throw new Error('fixture chi-ready: CHI not available');
    }
    this.openResponseWindow(discarded, actions);
  }

  private normalizeHumanHandSize(human: Player, size: number): void {
    while (human.handTiles.length > size) {
      human.handTiles.pop();
    }
    let id = 9300;
    while (human.handTiles.length < size) {
      human.handTiles.push(new Tile(TileType.TIAO, 9, id++));
    }
  }

  private clearResponseWindow(): void {
    this.game.setPendingAction(null);
    if (this.game.state === GameState.WAITING_ACTION) {
      this.game.setState(GameState.PLAYING);
    }
  }

  private getHumanPlayer(): Player {
    const human = this.game.getAllPlayers().find((p) => p.type === PlayerType.HUMAN);
    if (!human) {
      throw new SessionActionError('no human player in api session');
    }
    return human;
  }

  private markWinnerStats(): void {
    // 与 CLI handleGameEnd 共用结算：改 score / lastRoundDelta / 胜负统计
    this.handler.settleEndedRound();
  }

  /**
   * 响应检查里若误触人类 askQuestion，自动「过」，避免 API 线程挂死。
   * ponytail: 真暂停靠 openResponseWindow；此处仅兜底。
   */
  private async withHumanAutoPass<T>(fn: () => Promise<T>): Promise<T> {
    const original = input.askQuestion;
    const stub = (async () => 'n') as typeof input.askQuestion;
    (input as { askQuestion: typeof input.askQuestion }).askQuestion = stub;
    try {
      return await fn();
    } finally {
      (input as { askQuestion: typeof input.askQuestion }).askQuestion = original;
    }
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
