/**
 * 复现：多轮自动对弈中被 safeStartGameAndEnd catch 吞掉的异常。
 * 用法: npx ts-node scripts/debug/repro-cli-round-exceptions.ts [rounds=300]
 */
import { setAutoPlayMode, setDebugMode } from '../../src/majiang/config/runtime-state';
import { GameState } from '../../src/majiang/core/game';
import { GameSession } from '../../src/majiang/session/game-session';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';
import { setLogLevel, LogLevel } from '../../src/majiang/tools/logger';
import { displayManager } from '../../src/majiang/ui/display-manager';

const rounds = Math.max(1, parseInt(process.argv[2] || '300', 10) || 300);

setAutoPlayMode(true);
setDebugMode(false);
setLogLevel(LogLevel.NONE);

// 静默 UI，避免 I/O 拖慢复现
const noop = () => undefined;
for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(displayManager))) {
  const v = (displayManager as any)[key];
  if (typeof v === 'function' && key !== 'constructor') {
    (displayManager as any)[key] = noop;
  }
}
console.log = noop as any;
console.info = noop as any;
console.warn = noop as any;
console.error = (...args: any[]) => {
  process.stderr.write(args.map(String).join(' ') + '\n');
};

const counts: Record<string, number> = {};
const samples: string[] = [];
let failed = 0;

const orig = GameEventHandler.prototype.safeStartGameAndEnd;
GameEventHandler.prototype.safeStartGameAndEnd = async function (this: GameEventHandler) {
  try {
    this.startGame();
    while (this.game.state === GameState.PLAYING) {
      const currentPlayer = this.game.getCurrentPlayer();
      const specialAction = await this.checkSpecialActions(currentPlayer);
      if (!specialAction) {
        await this.handleCurrentPlayerDiscard();
      }
      if (this.checkGameEnd()) break;
      if (this.game.getRemainingTiles() <= 0) {
        this.game.setState(GameState.ENDED);
        break;
      }
      this.nextTurn();
    }
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    counts[msg] = (counts[msg] || 0) + 1;
    if (samples.length < 8) {
      const snap = this.game.getAllPlayers().map((p) => {
        const exp = p.getExpectedHandSize(false);
        return `${p.name}:hand=${p.handTiles.length}/exp=${exp}/total=${p.getTotalTileCount()}/sets=${p.revealedSets.map((s) => s.type).join('+')||'-'}/needDiscard=${p.needsToDiscard()}/state=${p.state}`;
      });
      const cur = this.game.getCurrentPlayer();
      samples.push(
        `${e instanceof Error ? e.stack || e.message : String(e)}\n` +
          `current=${cur.name} idx=${this.game.currentPlayerIndex} remaining=${this.game.getRemainingTiles()}\n` +
          snap.join('\n')
      );
    }
  } finally {
    await this.handleGameEnd();
  }
};

(async () => {
  const t0 = Date.now();
  const session = GameSession.create({ mode: 'auto' });
  const handler = (session as any).handler as GameEventHandler;
  for (let i = 0; i < rounds; i++) {
    await handler.safeStartGameAndEnd();
    if (session.game.state !== GameState.ENDED) {
      session.game.setState(GameState.ENDED);
    }
    if (i < rounds - 1) session.game.reset();
    if ((i + 1) % 50 === 0) {
      process.stderr.write(`progress ${i + 1}/${rounds} failed=${failed}\n`);
    }
  }
  // restore unused
  void orig;
  process.stderr.write(
    JSON.stringify(
      { rounds, failed, rate: failed / rounds, counts, samples, ms: Date.now() - t0 },
      null,
      2
    ) + '\n'
  );
})().catch((e) => {
  process.stderr.write('TOP ' + (e instanceof Error ? e.stack : String(e)) + '\n');
  process.exit(1);
});
