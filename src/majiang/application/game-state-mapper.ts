import { Game, GameState } from '../core/game';
import { Player, PlayerState, PlayerType } from '../core/player';
import { Tile } from '../core/tile';

export interface MajiangSeatView {
  id: number;
  name: string;
  type: 'human' | 'ai';
  isCurrentPlayer: boolean;
  state: string;
  handCount: number;
  concealedTiles: string[];
  discardedTiles: string[];
  revealedSets: Array<{
    type: string;
    source?: string;
    tiles: string[];
  }>;
  lastDrawnTile: string | null;
  score: number;
}

export interface MajiangResultView {
  winnerName: string | null;
  winnerId: number | null;
  winTypeLabel: string | null;
  scoreSummary: string;
  isEnded: boolean;
}

export interface MajiangTableState {
  gameState: string;
  currentPlayerIndex: number;
  bankerIndex: number;
  windRound: number;
  drawCount: number;
  remainingTiles: number;
  lastDiscardedTile: string | null;
  currentPrompt: string;
  availableActions: string[];
  humanPlayerId: number;
  seats: MajiangSeatView[];
  result: MajiangResultView;
}

function toStateLabel(state: GameState): string {
  return GameState[state] ?? String(state);
}

function toPlayerStateLabel(state: PlayerState): string {
  return PlayerState[state] ?? String(state);
}

function tileToText(tile: Tile | null | undefined): string | null {
  return tile ? tile.toString() : null;
}

function buildPrompt(game: Game, humanPlayer: Player, humanPlayerIndex: number): string {
  if (game.state === GameState.ENDED) {
    const winner = game.getAllPlayers().find(player => player.state === PlayerState.WON);
    return winner ? `${winner.name} 已胡牌，当前对局结束` : '当前对局已结束';
  }

  if (game.currentPlayerIndex === humanPlayerIndex) {
    if (humanPlayer.needsToDiscard()) {
      return '请选择一张手牌打出';
    }

    if (game.pendingAction?.allowedActions.length) {
      return `请选择动作：${game.pendingAction.allowedActions.join(' / ')}`;
    }

    return '等待你的动作';
  }

  const currentPlayer = game.getCurrentPlayer();
  return `当前由 ${currentPlayer.name} 行动`;
}

function buildAvailableActions(game: Game, humanPlayer: Player, humanPlayerIndex: number): string[] {
  if (game.state === GameState.ENDED) {
    return [];
  }

  const isHumanTurn = game.currentPlayerIndex === humanPlayerIndex && humanPlayer.needsToDiscard();
  if (isHumanTurn) {
    return ['DISCARD'];
  }

  if (game.pendingAction?.allowedActions.length) {
    return game.pendingAction.allowedActions.map(action => String(action));
  }

  return [];
}

function mapSeat(player: Player, humanPlayerId: number, playerIndex: number, currentPlayerIndex: number): MajiangSeatView {
  const isHuman = player.type === PlayerType.HUMAN;
  const concealedTiles = isHuman
    ? player.handTiles.map(tile => tile.toString())
    : player.handTiles.map(() => '牌背');

  return {
    id: player.id,
    name: player.name,
    type: isHuman ? 'human' : 'ai',
    isCurrentPlayer: currentPlayerIndex === playerIndex,
    state: toPlayerStateLabel(player.state),
    handCount: player.handTiles.length,
    concealedTiles,
    discardedTiles: player.discardedTiles.map(tile => tile.toString()),
    revealedSets: player.revealedSets.map(set => ({
      type: set.type,
      source: set.source,
      tiles: set.tiles.map(tile => tile.toString())
    })),
    lastDrawnTile: player.id === humanPlayerId ? tileToText(player.lastDrawnTile) : null,
    score: player.score
  };
}

function buildResult(game: Game): MajiangResultView {
  const winner = game.getAllPlayers().find(player => player.state === PlayerState.WON) ?? null;
  const scoreSummary = game.getAllPlayers()
    .map(player => `${player.name}: ${player.score}`)
    .join(' | ');

  return {
    winnerName: winner?.name ?? null,
    winnerId: winner?.id ?? null,
    winTypeLabel: winner ? '胡牌' : null,
    scoreSummary,
    isEnded: game.state === GameState.ENDED
  };
}

export function mapGameToTableState(game: Game, humanPlayer: Player): MajiangTableState {
  const humanPlayerIndex = game.getAllPlayers().findIndex(player => player.id === humanPlayer.id);

  return {
    gameState: toStateLabel(game.state),
    currentPlayerIndex: game.currentPlayerIndex,
    bankerIndex: game.bankerIndex,
    windRound: game.windRound,
    drawCount: game.drawCount,
    remainingTiles: game.getRemainingTiles(),
    lastDiscardedTile: tileToText(game.lastDiscardedTile),
    currentPrompt: buildPrompt(game, humanPlayer, humanPlayerIndex),
    availableActions: buildAvailableActions(game, humanPlayer, humanPlayerIndex),
    humanPlayerId: humanPlayer.id,
    seats: game.getAllPlayers().map((player, index) =>
      mapSeat(player, humanPlayer.id, index, game.currentPlayerIndex)
    ),
    result: buildResult(game)
  };
}
