import { Game } from '../../src/majiang/core/game';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';
import { updateMajiangRuntimeOptions } from '../../src/majiang/runtime/runtime-context';

interface SmokeResult {
  name: string;
  passed: boolean;
  details: Record<string, unknown>;
}

async function verifyManualModeEntry(): Promise<SmokeResult> {
  const game = new Game();
  game.setupPlayers(false);

  const handler = new GameEventHandler(game, game.getTileManager());
  handler.prepareGameStart();
  handler.startGame();

  const currentPlayer = game.getCurrentPlayer();
  const passed = game.getAllPlayers().length === 4 && currentPlayer.needsToDiscard();

  return {
    name: 'cli-manual-entry',
    passed,
    details: {
      players: game.getAllPlayers().length,
      currentPlayer: currentPlayer.name,
      currentPlayerType: currentPlayer.type,
      handCount: currentPlayer.handTiles.length,
      remainingTiles: game.getRemainingTiles(),
      needsDiscard: currentPlayer.needsToDiscard()
    }
  };
}

async function verifyAutoModeLoop(): Promise<SmokeResult> {
  const game = new Game();
  game.setupPlayers(true);

  const handler = new GameEventHandler(game, game.getTileManager());
  handler.startGame();

  const beforePlayer = game.getCurrentPlayer();
  const beforePlayerName = beforePlayer.name;
  const beforeIndex = game.currentPlayerIndex;
  const blockedBySpecialAction = await handler.checkSpecialActions(beforePlayer);

  if (!blockedBySpecialAction) {
    await handler.handleCurrentPlayerDiscard();
    handler.nextTurn();
  }

  const players = game.getAllPlayers();
  const passed = players.length === 4 && beforePlayer.name.includes('(AI)') && game.currentPlayerIndex !== beforeIndex;

  return {
    name: 'cli-auto-progression',
    passed,
    details: {
      players: players.length,
      beforePlayer: beforePlayerName,
      beforeIndex,
      afterIndex: game.currentPlayerIndex,
      currentPlayer: game.getCurrentPlayer().name,
      remainingTiles: game.getRemainingTiles(),
      blockedBySpecialAction
    }
  };
}

async function main(): Promise<void> {
  updateMajiangRuntimeOptions({
    silentOutput: true,
    fatalMode: 'throw',
    fileLoggingEnabled: false
  });

  const results = [
    await verifyManualModeEntry(),
    await verifyAutoModeLoop()
  ];

  const failed = results.filter(result => !result.passed);
  console.log(JSON.stringify({
    ok: failed.length === 0,
    results
  }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
