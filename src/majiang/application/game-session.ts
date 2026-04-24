import { Game, GameState } from '../core/game';
import { Player, PlayerState, PlayerType } from '../core/player';
import { TileManager } from '../core/tile-manager';
import { Tile } from '../core/tile';
import { RuleEngine } from '../core/rule-engine';
import { GameEventHandler } from '../ui/game-event-handler';
import { GangType, PlayerAction } from '../core/rule-types';
import { mapGameToTableState, MajiangTableState } from './game-state-mapper';
import { updateMajiangRuntimeOptions } from '../runtime/runtime-context';

export class MajiangGameSession {
  private game: Game;
  private handler: GameEventHandler;

  constructor() {
    updateMajiangRuntimeOptions({
      silentOutput: true,
      fatalMode: 'throw',
      fileLoggingEnabled: false
    });

    this.game = new Game();
    this.handler = new GameEventHandler(this.game, TileManager.getInstance());
    this.startNewHand();
  }

  public getState(): MajiangTableState {
    return mapGameToTableState(this.game, this.getHumanPlayer());
  }

  public restart(): MajiangTableState {
    this.startNewHand();
    return this.getState();
  }

  public discard(tileIndex: number): MajiangTableState {
    if (this.game.state === GameState.ENDED) {
      return this.getState();
    }

    const humanPlayer = this.getHumanPlayer();
    const currentPlayer = this.game.getCurrentPlayer();
    const humanIndex = this.getHumanPlayerIndex();

    if (this.game.currentPlayerIndex !== humanIndex || currentPlayer.id !== humanPlayer.id) {
      throw new Error('当前不是人类玩家的行动回合');
    }

    if (!humanPlayer.needsToDiscard()) {
      throw new Error('当前不需要人类玩家出牌');
    }

    const discardedTile = this.handler.currentPlayerDiscard(tileIndex);
    const responded = this.resolveResponses(discardedTile);
    if (!responded) {
      this.handler.nextTurn();
    }

    this.advanceUntilHumanTurnOrEnd();
    return this.getState();
  }

  public respond(action: PlayerAction): MajiangTableState {
    if (!this.game.pendingAction) {
      throw new Error('当前没有待响应动作');
    }

    const humanPlayer = this.getHumanPlayer();
    const pendingTile = this.game.pendingAction.tile;
    this.game.pendingAction = null;
    this.game.setState(GameState.PLAYING);

    switch (action) {
      case PlayerAction.HU:
        this.handler.handlePlayerHu(humanPlayer, pendingTile);
        break;
      case PlayerAction.GANG:
        this.resolveGang(humanPlayer, pendingTile);
        break;
      case PlayerAction.PENG:
        this.resolvePeng(humanPlayer, pendingTile);
        break;
      case PlayerAction.CHI:
        this.resolveChi(humanPlayer, pendingTile);
        break;
      case PlayerAction.PASS:
      default:
        this.handler.nextTurn();
        this.advanceUntilHumanTurnOrEnd();
        break;
    }

    return this.getState();
  }

  private startNewHand(): void {
    if (this.game.getAllPlayers().length > 0) {
      this.game.reset();
    }
    this.game.setupPlayers(false);
    this.handler = new GameEventHandler(this.game, this.game.getTileManager());
    this.handler.startGame();
    this.advanceUntilHumanTurnOrEnd();
  }

  private getHumanPlayerIndex(): number {
    const index = this.game.getAllPlayers().findIndex(player => player.type === PlayerType.HUMAN);
    if (index === -1) {
      throw new Error('当前对局中不存在人类玩家');
    }

    return index;
  }

  private getHumanPlayer(): Player {
    return this.game.getPlayerByIndex(this.getHumanPlayerIndex());
  }

  private advanceUntilHumanTurnOrEnd(): void {
    let guard = 0;

    while (this.game.state !== GameState.ENDED && guard < 300) {
      guard += 1;

      if (this.game.state === GameState.WAITING_ACTION && this.game.pendingAction) {
        return;
      }

      const humanIndex = this.getHumanPlayerIndex();
      const currentPlayer = this.game.getCurrentPlayer();

      if (this.game.currentPlayerIndex === humanIndex && currentPlayer.needsToDiscard()) {
        return;
      }

      if (currentPlayer.type !== PlayerType.AI) {
        return;
      }

      this.playAiTurn(currentPlayer);
    }

    if (guard >= 300) {
      throw new Error('回合推进超过安全阈值');
    }
  }

  private playAiTurn(player: Player): void {
    if (this.game.state === GameState.ENDED) {
      return;
    }

    if (this.resolveAiSpecialAction(player)) {
      return;
    }

    if (!player.needsToDiscard()) {
      return;
    }

    const discardIndex = player.getRandomMove();
    const discardedTile = this.handler.currentPlayerDiscard(discardIndex);
    const responded = this.resolveResponses(discardedTile);
    if (!responded) {
      this.handler.nextTurn();
    }
  }

  private resolveAiSpecialAction(player: Player): boolean {
    if (player.type !== PlayerType.AI || this.game.state === GameState.ENDED) {
      return false;
    }

    const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true });
    if (huResult.canHu) {
      this.handler.handlePlayerHu(player, null);
      return true;
    }

    const gangResult = RuleEngine.canGang(player, null, {
      currentPlayer: player,
      allPlayers: this.game.getAllPlayers()
    });

    if (!gangResult.canGang) {
      return false;
    }

    switch (gangResult.gangType) {
      case GangType.AN:
      case GangType.BU:
        this.resolveSelfGang(player);
        return true;
      default:
        return false;
    }
  }

  private resolveSelfGang(player: Player): void {
    const gangSuccess = player.gang(null);
    if (!gangSuccess) {
      return;
    }

    if (this.game.getRemainingTiles() <= 0) {
      return;
    }

    this.handler.drawTileForPlayer(player, { notify: false, incrementCount: true });

    const huAfterGang = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
    if (huAfterGang.canHu) {
      this.handler.handlePlayerHu(player, null);
    }
  }

  private resolveResponses(discardedTile: Tile): boolean {
    const currentPlayer = this.game.getCurrentPlayer();
    const allPlayers = this.game.getAllPlayers();
    const otherPlayers = allPlayers.filter(player => player.id !== currentPlayer.id);

    const humanResponseActions = this.getHumanResponseActions(discardedTile);
    if (humanResponseActions.length > 0) {
      this.game.setPendingAction({
        tile: discardedTile,
        fromPlayerId: currentPlayer.id,
        allowedActions: humanResponseActions,
        waitingPlayers: [this.getHumanPlayerIndex()]
      });
      this.game.setState(GameState.WAITING_ACTION);
      return true;
    }

    const aiPlayers = otherPlayers.filter(player => player.type === PlayerType.AI);

    const canHuPlayers = aiPlayers.filter(player => RuleEngine.canHu(player, discardedTile));
    if (canHuPlayers.length > 0) {
      this.handler.handlePlayerHu(canHuPlayers[0], discardedTile);
      return true;
    }

    const canGangPlayers = aiPlayers.filter(player =>
      RuleEngine.canGang(player, discardedTile, {
        currentPlayer,
        allPlayers
      }).canGang
    );

    if (canGangPlayers.length > 0) {
      const gangPlayer = canGangPlayers[0];
      if (this.resolveGang(gangPlayer, discardedTile)) {
        return true;
      }
    }

    const canPengPlayers = aiPlayers.filter(player => RuleEngine.canPeng(player, discardedTile));
    if (canPengPlayers.length > 0) {
      const pengPlayer = canPengPlayers[0];
      if (this.resolvePeng(pengPlayer, discardedTile)) {
        return true;
      }
    }

    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextPlayerIndex];
    if (nextPlayer.type === PlayerType.AI && RuleEngine.canChi(nextPlayer, discardedTile)) {
      return this.resolveChi(nextPlayer, discardedTile);
    }

    return false;
  }

  private getHumanResponseActions(discardedTile: Tile): PlayerAction[] {
    const humanPlayer = this.getHumanPlayer();
    const allPlayers = this.game.getAllPlayers();
    const currentPlayer = this.game.getCurrentPlayer();
    const actions: PlayerAction[] = [];

    if (RuleEngine.canHu(humanPlayer, discardedTile)) {
      actions.push(PlayerAction.HU);
    }

    if (RuleEngine.canGang(humanPlayer, discardedTile, { currentPlayer, allPlayers }).canGang) {
      actions.push(PlayerAction.GANG);
    }

    if (RuleEngine.canPeng(humanPlayer, discardedTile)) {
      actions.push(PlayerAction.PENG);
    }

    const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
    if (allPlayers[nextPlayerIndex].id === humanPlayer.id && RuleEngine.canChi(humanPlayer, discardedTile)) {
      actions.push(PlayerAction.CHI);
    }

    if (actions.length > 0) {
      actions.push(PlayerAction.PASS);
    }

    return actions;
  }

  private resolveGang(player: Player, tile: Tile): boolean {
    const gangSuccess = player.gang(tile);
    if (!gangSuccess) {
      return false;
    }

    const playerIndex = this.findPlayerIndex(player);
    this.game.setCurrentPlayerIndex(playerIndex);
    player.state = PlayerState.ACTING;
    player.lastDrawnTile = tile;

    if (this.game.getRemainingTiles() > 0) {
      this.handler.drawTileForPlayer(player, { notify: false, incrementCount: true });
      const huAfterGang = RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
      if (huAfterGang.canHu) {
        this.handler.handlePlayerHu(player, null);
      }
    }

    return true;
  }

  private resolvePeng(player: Player, tile: Tile): boolean {
    const pengSuccess = player.peng(tile);
    if (!pengSuccess) {
      return false;
    }

    const playerIndex = this.findPlayerIndex(player);
    this.game.setCurrentPlayerIndex(playerIndex);
    player.state = PlayerState.ACTING;
    player.lastDrawnTile = tile;
    return true;
  }

  private resolveChi(player: Player, tile: Tile): boolean {
    const combinations = RuleEngine.findChiCombinations(player.handTiles, tile);
    if (!combinations.length) {
      return false;
    }

    const selected = combinations[0].filter(candidate => candidate.id !== tile.id);
    const chiSuccess = player.chi(selected, tile);
    if (!chiSuccess) {
      return false;
    }

    const playerIndex = this.findPlayerIndex(player);
    this.game.setCurrentPlayerIndex(playerIndex);
    player.state = PlayerState.ACTING;
    player.lastDrawnTile = tile;
    return true;
  }

  private findPlayerIndex(player: Player): number {
    const index = this.game.getAllPlayers().findIndex(target => target.id === player.id);
    if (index === -1) {
      throw new Error(`未找到玩家 ${player.name} 的座位索引`);
    }

    return index;
  }
}
