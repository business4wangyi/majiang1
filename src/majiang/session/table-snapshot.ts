import { Game, GameState } from '../core/game';
import { Player, PlayerState } from '../core/player';
import { RuleEngine } from '../core/rule-engine';
import { PlayerAction } from '../core/rule-types';

/** 与 web-ui-prototype view-model-adapter 对齐的桌面阶段 */
export type TablePhase =
  | 'table_loading'
  | 'player_turn'
  | 'response_window'
  | 'waiting_ai'
  | 'ended';

export interface TableActionView {
  id: string;
  label: string;
  available: boolean;
  reasonText: string;
  isPrimaryPath?: boolean;
}

export interface TableSeatView {
  id: string;
  name: string;
  windLabel: string;
  score: number;
  handCount: number;
  meldGroups: string[][];
  latestAction: string;
}

export interface TableResultSummaryRow {
  player: string;
  delta: string;
  total: number;
  role: string;
  reason: string;
}

export interface TableResultSummary {
  type: string;
  title: string;
  reason: string;
  rows: TableResultSummaryRow[];
}

export interface TableSnapshot {
  gameId: string;
  phase: TablePhase;
  currentPlayerId: string;
  /** 视角座位（api 模式为人类座位） */
  selfSeatId: 'east' | 'south' | 'west' | 'north';
  wallCount: number;
  roundInfo: string;
  turnHint: string;
  seats: TableSeatView[];
  selfHand: string[];
  discardRiver: Record<'east' | 'south' | 'west' | 'north', string[]>;
  availableActions: TableActionView[];
  resultSummary: TableResultSummary | null;
  latestEvent: {
    actor: string;
    verb: string;
    tile: string;
    target: string;
    responseHint: string;
  };
  responseContext: {
    sourcePlayerId: string;
    tile: string;
    highlightedRiverSeatId: string;
    remainingMs: number | null;
  };
}

export interface BuildTableSnapshotOptions {
  gameId?: string;
  /** 视角座位，默认 south（与原型一致） */
  selfSeatId?: 'east' | 'south' | 'west' | 'north';
  /** 胡牌形态提示（自摸/荣和）；缺省时有赢家则按 tsumo */
  resultTypeHint?: 'tsumo' | 'ron';
}

function formatScoreDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return '0';
  return delta > 0 ? `+${delta}` : String(delta);
}

const SEAT_IDS = ['east', 'south', 'west', 'north'] as const;
const WIND_LABELS = ['东', '南', '西', '北'] as const;

const ACTION_META: Record<string, { id: string; label: string }> = {
  [PlayerAction.HU]: { id: 'hu', label: '胡' },
  [PlayerAction.PASS]: { id: 'pass', label: '过' },
  [PlayerAction.PENG]: { id: 'peng', label: '碰' },
  [PlayerAction.GANG]: { id: 'gang', label: '杠' },
  [PlayerAction.CHI]: { id: 'chi', label: '吃' },
};

export function mapGameStateToPhase(state: GameState): TablePhase {
  switch (state) {
    case GameState.ENDED:
      return 'ended';
    case GameState.WAITING_ACTION:
      return 'response_window';
    case GameState.PLAYING:
      return 'player_turn';
    case GameState.DEALING:
    case GameState.INIT:
    default:
      return 'table_loading';
  }
}

function seatIdAt(index: number): (typeof SEAT_IDS)[number] {
  return SEAT_IDS[((index % 4) + 4) % 4];
}

function pushActionView(
  actions: TableActionView[],
  seen: Set<string>,
  action: PlayerAction,
  reasonText: string
): void {
  const meta = ACTION_META[action];
  if (!meta || seen.has(meta.id)) return;
  seen.add(meta.id);
  actions.push({
    id: meta.id,
    label: meta.label,
    available: true,
    reasonText,
    isPrimaryPath: meta.id === 'hu' || meta.id === 'discard',
  });
}

function mapEngineActions(game: Game, phase: TablePhase): TableActionView[] {
  const actions: TableActionView[] = [];
  const seen = new Set<string>();

  for (const action of game.getAvailableActions()) {
    pushActionView(actions, seen, action, `引擎允许：${ACTION_META[action]?.label ?? action}`);
  }

  // 出牌义务 / 自摸胡：Game.getAvailableActions 在 PLAYING 恒为空，须走 RuleEngine
  const current = game.getCurrentPlayer();
  if (phase === 'player_turn' && current) {
    for (const action of RuleEngine.getAvailableActions(current, null)) {
      pushActionView(actions, seen, action, `引擎允许：${ACTION_META[action]?.label ?? action}`);
    }
    if (current.needsToDiscard() && !seen.has('discard')) {
      actions.push({
        id: 'discard',
        label: '出牌',
        available: true,
        reasonText: '引擎：当前须出牌',
        isPrimaryPath: true,
      });
    }
  }

  return actions;
}

function buildSeats(players: Player[]): TableSeatView[] {
  return players.slice(0, 4).map((player, index) => ({
    id: seatIdAt(index),
    name: player.name,
    windLabel: WIND_LABELS[index] || '',
    score: Number.isFinite(player.score) ? player.score : 0,
    handCount: player.handTiles.length,
    meldGroups: (player.revealedSets || []).map((set) =>
      (set.tiles || []).map((t) => t.toString())
    ),
    latestAction: '等待中',
  }));
}

function buildDiscardRiver(
  players: Player[]
): Record<'east' | 'south' | 'west' | 'north', string[]> {
  const river: Record<'east' | 'south' | 'west' | 'north', string[]> = {
    east: [],
    south: [],
    west: [],
    north: [],
  };
  players.slice(0, 4).forEach((player, index) => {
    river[seatIdAt(index)] = (player.discardedTiles || []).map((t) => t.toString());
  });
  return river;
}

function buildResultSummary(
  game: Game,
  phase: TablePhase,
  resultTypeHint?: 'tsumo' | 'ron'
): TableResultSummary | null {
  if (phase !== 'ended') return null;

  const players = game.getAllPlayers();
  const winner = players.find((p) => p.winCount > 0 || p.state === PlayerState.WON);
  const rows: TableResultSummaryRow[] = players.map((p) => ({
    player: p.name,
    delta: formatScoreDelta(p.lastRoundDelta),
    total: Number.isFinite(p.score) ? p.score : 0,
    role: winner && p.id === winner.id ? '胡牌者' : winner ? '旁家' : '流局',
    reason: winner && p.id === winner.id ? '本局胡牌' : winner ? '未胡' : '流局',
  }));

  if (winner) {
    const type = resultTypeHint === 'ron' ? 'ron' : 'tsumo';
    return {
      type,
      title: '胡牌',
      reason: `${winner.name} 本局胡牌`,
      rows,
    };
  }

  return {
    type: 'draw',
    title: '流局',
    reason: '本局流局或未记录胡牌方',
    rows,
  };
}

/**
 * 从引擎 Game 构建可喂 createTableViewModelFromSnapshot 的快照。
 * availableActions：响应窗用 Game.getAvailableActions；player_turn 用 RuleEngine + needsToDiscard。
 */
export function buildTableSnapshotFromGame(
  game: Game,
  options: BuildTableSnapshotOptions = {}
): TableSnapshot {
  const selfSeatId = options.selfSeatId ?? 'south';
  const phase = mapGameStateToPhase(game.state);
  const players = game.getAllPlayers();
  const seats = buildSeats(players);
  const selfIndex = SEAT_IDS.indexOf(selfSeatId);
  const selfPlayer = players[selfIndex] || players[0];
  const current = game.getCurrentPlayer();
  const currentPlayerId = current
    ? seatIdAt(players.indexOf(current))
    : selfSeatId;

  const lastTile = game.getLastDiscardedTile();
  const pending = game.pendingAction;
  const turnHint =
    phase === 'ended'
      ? '本局已结束'
      : phase === 'response_window'
        ? '可响应：选择胡/碰/杠或过'
        : phase === 'player_turn'
          ? '轮到你出牌：先选手牌再点出牌'
          : '等待状态更新';

  return {
    gameId: options.gameId ?? `session-${Date.now()}`,
    phase,
    currentPlayerId,
    selfSeatId,
    wallCount: game.getRemainingTiles(),
    roundInfo: `风圈${game.windRound}`,
    turnHint,
    seats,
    selfHand: selfPlayer ? selfPlayer.handTiles.map((t) => t.toString()) : [],
    discardRiver: buildDiscardRiver(players),
    availableActions: mapEngineActions(game, phase),
    resultSummary: buildResultSummary(game, phase, options.resultTypeHint),
    latestEvent: {
      actor: pending ? seatIdAt(pending.fromPlayerId) : '系统',
      verb: lastTile ? '打出' : '等待',
      tile: lastTile ? lastTile.toString() : '',
      target: selfSeatId,
      responseHint: '',
    },
    responseContext: {
      sourcePlayerId: pending ? seatIdAt(pending.fromPlayerId) : '',
      tile: pending?.tile ? pending.tile.toString() : lastTile ? lastTile.toString() : '',
      highlightedRiverSeatId: pending ? seatIdAt(pending.fromPlayerId) : '',
      remainingMs: null,
    },
  };
}
