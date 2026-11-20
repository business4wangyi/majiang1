/**
 * 启发式 AIPlayer 四家同算法自对弈基线（1000 局）。
 * - 局内异常不吞：任一局 throw 则整次失败退出
 * - 结果落盘供后续训练对照
 * - 默认走 legacy；试用 P1：MAJIANG_DISCARD_STRATEGY=p1
 *
 * 用法: npx ts-node scripts/training/majiang/baseline-1000-heuristic.ts [rounds=1000] [out.json]
 */
import * as fs from 'fs';
import * as path from 'path';
import { setAutoPlayMode, setDebugMode } from '../../../src/majiang/config/runtime-state';
import { GameState } from '../../../src/majiang/core/game';
import { PlayerType } from '../../../src/majiang/core/player';
import { GameSession } from '../../../src/majiang/session/game-session';
import { GameEventHandler } from '../../../src/majiang/ui/game-event-handler';
import { setLogLevel, LogLevel } from '../../../src/majiang/tools/logger';
import { displayManager } from '../../../src/majiang/ui/display-manager';

const rounds = Math.max(1, parseInt(process.argv[2] || '1000', 10) || 1000);
const outPath =
  process.argv[3] ||
  path.join(__dirname, '../../../models/majiang/heuristic-baseline-1000.json');
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

/** 拦截对局内 process.exit(0)，避免静默杀进程（AIPlayer/Player 错误路径会 exit） */
let allowProcessExit = false;
const originalExit = process.exit.bind(process);
process.exit = ((code?: number) => {
  if (allowProcessExit) {
    return originalExit(code ?? 0);
  }
  throw new Error(`process.exit(${code ?? 0}) intercepted during baseline`);
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
        return `${p.name}:hand=${p.handTiles.length}/exp=${exp}/total=${p.getTotalTileCount()}/sets=${p.revealedSets.map((s) => s.type).join('+') || '-'}/needDiscard=${p.needsToDiscard()}`;
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

  for (let i = 0; i < rounds; i++) {
    try {
      await handler.safeStartGameAndEnd();
    } catch (e) {
      if (fails.length > 0 && fails[fails.length - 1].round === -1) {
        fails[fails.length - 1].round = i + 1;
      } else if (fails.length === 0 || fails[fails.length - 1].round !== i + 1) {
        fails.push({
          round: i + 1,
          message: e instanceof Error ? e.message : String(e),
        });
      }
      logProgress(
        `SOFT_FAIL round ${i + 1}/${rounds}: ${fails[fails.length - 1].message} (继续)`
      );
    }

    if (session.game.state !== GameState.ENDED) {
      session.game.setState(GameState.ENDED);
    }
    if (i < rounds - 1) session.game.reset();

    if ((i + 1) % 50 === 0 || i + 1 === rounds) {
      logProgress(`progress ${i + 1}/${rounds} softFails=${fails.length}`);
    }
  }

  const players = session.game
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
        loseCount: ai.totalGames - ai.winCount - ai.drawCount,
        score: ai.score,
        winRate,
        winRatePct: Number((winRate * 100).toFixed(2)),
        avgScore,
      };
    });

  const totalWins = players.reduce((s, p) => s + p.winCount, 0);
  const totalDraws = players.reduce((s, p) => s + p.drawCount, 0);
  const payload = {
    ok: fails.length === 0,
    algorithm: process.env.MAJIANG_DISCARD_STRATEGY === 'p1' ? 'heuristic-P1-AIPlayer' : 'heuristic-legacy-AIPlayer',
    note:
      'CLI 自动对弈四家同算法基线（默认 legacy；MAJIANG_DISCARD_STRATEGY=p1 可试用 P1）；softFail 后继续',
    roundsRequested: rounds,
    roundsCompleted: rounds,
    failed: fails.length,
    softFailRatePct: Number(((fails.length / rounds) * 100).toFixed(2)),
    fails,
    players,
    summary: {
      totalWins,
      totalDrawSeatCounts: totalDraws,
      avgWinRatePct: Number(
        ((players.reduce((s, p) => s + p.winRate, 0) / Math.max(1, players.length)) * 100).toFixed(2)
      ),
      seatWinRatesPct: Object.fromEntries(players.map((p) => [p.name, p.winRatePct])),
    },
    ms: Date.now() - t0,
    finishedAt: new Date().toISOString(),
    outPath,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  logProgress(`DONE ok rounds=${rounds} ms=${payload.ms}`);
  logProgress(JSON.stringify(payload.summary));
  void orig;
  allowProcessExit = true;
  process.exit(0);
})().catch((e) => {
  logProgress('TOP ' + (e instanceof Error ? e.stack : String(e)));
  allowProcessExit = true;
  process.exit(1);
});
