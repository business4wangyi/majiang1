/**
 * 1×P2 vs 3×legacy 启发式对战（默认 1000 局）。
 * - 每局轮换 P2 座位，消除座位偏差
 * - 拦截 process.exit；softFail 后继续
 *
 * 用法: npx ts-node scripts/training/majiang/battle-p2-vs-legacy-1000.ts [rounds=1000] [out.json]
 */
import * as fs from 'fs';
import * as path from 'path';
import { setAutoPlayMode, setDebugMode } from '../../../src/majiang/config/runtime-state';
import { GameState } from '../../../src/majiang/core/game';
import { PlayerType } from '../../../src/majiang/core/player';
import { GameSession } from '../../../src/majiang/session/game-session';
import { AIPlayer } from '../../../src/majiang/strategy/agents/ai-player';
import { GameEventHandler } from '../../../src/majiang/ui/game-event-handler';
import { setLogLevel, LogLevel } from '../../../src/majiang/tools/logger';
import { displayManager } from '../../../src/majiang/ui/display-manager';

const rounds = Math.max(1, parseInt(process.argv[2] || '1000', 10) || 1000);
const outPath =
  process.argv[3] ||
  path.join(__dirname, '../../../models/majiang/battle-p2-vs-legacy-1000.json');
const progressPath = outPath.replace(/\.json$/, '.progress.log');

function logProgress(line: string): void {
  const msg = `${new Date().toISOString()} ${line}\n`;
  try {
    fs.appendFileSync(progressPath, msg, 'utf8');
  } catch {
    /* ignore */
  }
  try {
    fs.writeSync(2, msg);
  } catch {
    /* ignore */
  }
}

setAutoPlayMode(true);
setDebugMode(false);
setLogLevel(LogLevel.ERROR);

let allowProcessExit = false;
const originalExit = process.exit.bind(process);
process.exit = ((code?: number) => {
  if (allowProcessExit) return originalExit(code ?? 0);
  throw new Error(`process.exit(${code ?? 0}) intercepted during battle`);
}) as typeof process.exit;

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

type RoundFail = { round: number; message: string; sample?: string };
const fails: RoundFail[] = [];

GameEventHandler.prototype.safeStartGameAndEnd = async function (this: GameEventHandler) {
  try {
    this.startGame();
    while (this.game.state === GameState.PLAYING) {
      const currentPlayer = this.game.getCurrentPlayer();
      const specialAction = await this.checkSpecialActions(currentPlayer);
      if (!specialAction) {
        await this.handleCurrentPlayerDiscard();
      }
      if (this.game.state === GameState.PLAYING) {
        const cur = this.game.getCurrentPlayer();
        if (cur.needsToDiscard()) {
          await this.handleCurrentPlayerDiscard();
        }
      }
      if (this.checkGameEnd()) break;
      if (this.game.getRemainingTiles() <= 0) {
        this.game.setState(GameState.ENDED);
        break;
      }
      this.nextTurn();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const snap = this.game
      .getAllPlayers()
      .map((p) => {
        const exp = p.getExpectedHandSize(false);
        return `${p.name}:hand=${p.handTiles.length}/exp=${exp}/needDiscard=${p.needsToDiscard()}`;
      })
      .join('; ');
    fails.push({
      round: -1,
      message,
      sample: `${e instanceof Error ? e.stack || e.message : String(e)} | ${snap}`,
    });
    throw e;
  } finally {
    await this.handleGameEnd();
  }
};

(async () => {
  const t0 = Date.now();
  const session = GameSession.create({ mode: 'auto' });
  const handler = (session as any).handler as GameEventHandler;
  const ais = session.game
    .getAllPlayers()
    .filter((p): p is AIPlayer => p instanceof AIPlayer);

  let p2Wins = 0;
  let legacyWins = 0;
  let draws = 0;
  let decided = 0;

  for (let i = 0; i < rounds; i++) {
    const p2Seat = i % ais.length;
    ais.forEach((ai, idx) => {
      ai.setDiscardStrategy(idx === p2Seat ? 'p2' : 'legacy');
    });

    const winBefore = ais.map((a) => a.winCount);
    const drawBefore = ais.map((a) => a.drawCount);
    let softFailed = false;

    try {
      await handler.safeStartGameAndEnd();
    } catch (e) {
      softFailed = true;
      if (fails.length > 0 && fails[fails.length - 1].round === -1) {
        fails[fails.length - 1].round = i + 1;
      } else if (fails.length === 0 || fails[fails.length - 1].round !== i + 1) {
        fails.push({
          round: i + 1,
          message: e instanceof Error ? e.message : String(e),
        });
      }
      logProgress(`SOFT_FAIL round ${i + 1}/${rounds}: ${fails[fails.length - 1].message}`);
    }

    if (!softFailed) {
      const winDelta = ais.map((a, idx) => a.winCount - winBefore[idx]);
      const drawDelta = ais.map((a, idx) => a.drawCount - drawBefore[idx]);
      const p2Won = winDelta[p2Seat] > 0;
      const anyDraw = drawDelta.some((d) => d > 0);
      const legacyWon = winDelta.some((d, idx) => idx !== p2Seat && d > 0);

      if (p2Won) {
        p2Wins += 1;
        decided += 1;
      } else if (legacyWon) {
        legacyWins += 1;
        decided += 1;
      } else if (anyDraw) {
        draws += 1;
      } else {
        draws += 1;
      }
    }

    if (session.game.state !== GameState.ENDED) {
      session.game.setState(GameState.ENDED);
    }
    if (i < rounds - 1) session.game.reset();

    if ((i + 1) % 50 === 0 || i + 1 === rounds) {
      const p2Rate = decided > 0 ? ((p2Wins / decided) * 100).toFixed(1) : 'n/a';
      logProgress(
        `progress ${i + 1}/${rounds} softFails=${fails.length} p2Wins=${p2Wins} legacyWins=${legacyWins} draws=${draws} p2WinRateAmongDecided=${p2Rate}%`
      );
    }
  }

  const payload = {
    ok: fails.length === 0,
    algorithm: '1xP2-vs-3xlegacy',
    note: '每局轮换 P2 座位；胜率按策略累计（非座位）',
    roundsRequested: rounds,
    roundsCompleted: rounds,
    failed: fails.length,
    softFailRatePct: Number(((fails.length / rounds) * 100).toFixed(2)),
    fails,
    matchup: {
      p2Wins,
      legacyWins,
      draws,
      decided,
      p2WinRateAmongDecidedPct:
        decided > 0 ? Number(((p2Wins / decided) * 100).toFixed(2)) : null,
      // Task4 option B：闸 = P1 基线（≥14.55）；旧 ≥25 已退役
      expectedP2WinRatePct: 14.55,
    },
    players: ais
      .filter((p) => p.type === PlayerType.AI)
      .map((ai) => ({
        name: ai.name,
        totalGames: ai.totalGames,
        winCount: ai.winCount,
        drawCount: ai.drawCount,
        score: ai.score,
        winRatePct: ai.totalGames > 0 ? Number(((ai.winCount / ai.totalGames) * 100).toFixed(2)) : 0,
      })),
    ms: Date.now() - t0,
    finishedAt: new Date().toISOString(),
    outPath: 'models/majiang/battle-p2-vs-legacy-1000.json',
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  logProgress(`DONE ok rounds=${rounds} ms=${payload.ms}`);
  logProgress(JSON.stringify(payload.matchup));
  allowProcessExit = true;
  process.exit(0);
})().catch((e) => {
  logProgress('TOP ' + (e instanceof Error ? e.stack : String(e)));
  allowProcessExit = true;
  process.exit(1);
});
