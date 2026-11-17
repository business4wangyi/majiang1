'use strict';

const fs = require('fs');
const path = require('path');
const { casesForTier, isRunnable } = require('./majiang-dual-acceptance-catalog');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance');
const OUT_FILE = path.join(OUT_DIR, 'majiang-dual-smoke.json');
const TIER = 'smoke';

/**
 * 已落地 smoke 行在此注册 runner。
 * 脚手架阶段：smoke 行均为 pending → 全部 skip → exit 0。
 * 禁止：把未实现 runner 标成 pass。
 */
const RUNNERS = {
  // 'MJ-ACC-API-01': async () => { ... },
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
    `[majiang-dual-smoke] pass=${passed.length} skip=${skipped.length} fail=${failed.length}`
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
