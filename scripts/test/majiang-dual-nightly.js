'use strict';

const fs = require('fs');
const path = require('path');
const { casesForTier, isRunnable } = require('./majiang-dual-acceptance-catalog');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance');
const OUT_FILE = path.join(OUT_DIR, 'majiang-dual-nightly.json');
const TIER = 'nightly';

const PLAYER_STAT_KEYS = [
  'name',
  'totalGames',
  'winCount',
  'drawCount',
  'score',
  'winRate',
  'avgScore',
];

/** 已落地 nightly 行在此注册 runner。 */
const RUNNERS = {
  'MJ-ACC-CLI-02': async () => {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    require('ts-node/register/transpile-only');
    // eslint-disable-next-line global-require
    const { runAutoTraining } = require('../../src/majiang/session/auto-train');
    const rounds = Number(process.env.MAJIANG_DUAL_NIGHTLY_ROUNDS || 2);
    const { result } = await runAutoTraining({ rounds });
    if (result.rounds !== rounds) {
      throw new Error(`expected rounds=${rounds}, got ${result.rounds}`);
    }
    if (!Array.isArray(result.players) || result.players.length !== 4) {
      throw new Error(`expected 4 player stats, got ${result.players && result.players.length}`);
    }
    for (const player of result.players) {
      for (const key of PLAYER_STAT_KEYS) {
        if (!(key in player)) {
          throw new Error(`player stat missing key: ${key}`);
        }
      }
    }
  },
};

async function runCase(acceptanceCase) {
  if (!isRunnable(acceptanceCase)) {
    return {
      id: acceptanceCase.id,
      outcome: 'skip',
      reason: `pending caps: ${acceptanceCase.capIds.join(',')}`,
    };
  }
  const runner = RUNNERS[acceptanceCase.id];
  if (!runner) {
    return {
      id: acceptanceCase.id,
      outcome: 'fail',
      reason: `status=${acceptanceCase.status} but no runner registered`,
    };
  }
  try {
    await runner();
    return { id: acceptanceCase.id, outcome: 'pass' };
  } catch (err) {
    return {
      id: acceptanceCase.id,
      outcome: 'fail',
      reason: err && err.message ? err.message : String(err),
    };
  }
}

async function main() {
  const cases = casesForTier(TIER);
  const results = [];
  for (const c of cases) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runCase(c));
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report = {
    tier: TIER,
    generatedAt: new Date().toISOString(),
    results,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

  const failed = results.filter((r) => r.outcome === 'fail');
  const skipped = results.filter((r) => r.outcome === 'skip');
  const passed = results.filter((r) => r.outcome === 'pass');
  console.log(
    `[majiang-dual-nightly] pass=${passed.length} skip=${skipped.length} fail=${failed.length}`
  );
  for (const r of results) {
    console.log(`  ${r.outcome.toUpperCase()} ${r.id}${r.reason ? ` — ${r.reason}` : ''}`);
  }
  console.log(`report: ${OUT_FILE}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
