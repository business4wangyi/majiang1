'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { casesForTier, isRunnable } = require('./majiang-dual-acceptance-catalog');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance');
const OUT_FILE = path.join(OUT_DIR, 'majiang-dual-smoke.json');
const TIER = 'smoke';

async function requestJson(baseUrl, method, route, body) {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

/**
 * 已落地 smoke 行在此注册 runner。
 * 禁止：把未实现 runner 标成 pass。
 */
const RUNNERS = {
  'MJ-ACC-API-01': async () => {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    require('ts-node/register/transpile-only');
    // eslint-disable-next-line global-require
    const { createMajiangApiApp } = require('../../src/majiang/ui/api-server');

    const { app } = createMajiangApiApp();
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    try {
      const created = await requestJson(base, 'POST', '/games');
      if (created.status !== 201 || !created.json.id) {
        throw new Error(`POST /games failed: status=${created.status}`);
      }
      if (created.json.snapshot.gameId !== created.json.id) {
        throw new Error('snapshot.gameId must equal server game id');
      }
      if (created.json.snapshot.phase !== 'player_turn') {
        throw new Error(`expected player_turn, got ${created.json.snapshot.phase}`);
      }

      const got = await requestJson(base, 'GET', `/games/${created.json.id}`);
      if (got.status !== 200) {
        throw new Error(`GET /games/:id failed: status=${got.status}`);
      }
      if (JSON.stringify(got.json.snapshot.selfHand) !== JSON.stringify(created.json.snapshot.selfHand)) {
        throw new Error('GET snapshot diverged from POST create (server authority broken)');
      }

      const riverBefore = got.json.snapshot.discardRiver.east.length;
      const acted = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 0,
      });
      if (acted.status !== 200) {
        throw new Error(`POST actions failed: status=${acted.status} ${acted.json && acted.json.error}`);
      }
      if (!(acted.json.snapshot.discardRiver.east.length > riverBefore)) {
        throw new Error('discard did not grow east river on server');
      }
      if (!['player_turn', 'response_window', 'ended'].includes(acted.json.snapshot.phase)) {
        throw new Error(`unexpected phase after discard: ${acted.json.snapshot.phase}`);
      }

      const illegal = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 9999,
      });
      if (illegal.status !== 400) {
        throw new Error(`expected 400 for illegal action, got ${illegal.status}`);
      }

      const again = await requestJson(base, 'GET', `/games/${created.json.id}`);
      if (
        JSON.stringify(again.json.snapshot.selfHand) !==
        JSON.stringify(acted.json.snapshot.selfHand)
      ) {
        throw new Error('illegal action dirtied server state');
      }
    } finally {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  },

  'MJ-ACC-WEB-01': async () => {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    require('ts-node/register/transpile-only');
    // eslint-disable-next-line global-require
    const { createMajiangApiApp } = require('../../src/majiang/ui/api-server');

    const { app } = createMajiangApiApp({ servePrototype: false });
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    try {
      const created = await requestJson(base, 'POST', '/games');
      if (created.status !== 201 || !created.json.id) {
        throw new Error(`POST /games failed: status=${created.status}`);
      }

      let snap = created.json.snapshot;
      let steps = 0;
      while (snap.phase !== 'ended' && steps < 400) {
        steps += 1;
        if (snap.phase === 'waiting_ai') {
          throw new Error('假 waiting_ai：桥接主链路禁止死等');
        }
        if (snap.phase === 'response_window') {
          const acted = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
            id: 'pass',
          });
          if (acted.status !== 200) {
            throw new Error(`pass failed: ${acted.status} ${acted.json && acted.json.error}`);
          }
          snap = acted.json.snapshot;
          continue;
        }
        if (snap.phase === 'player_turn') {
          const acted = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
            id: 'discard',
            tileIndex: 0,
          });
          if (acted.status !== 200) {
            throw new Error(`discard failed: ${acted.status} ${acted.json && acted.json.error}`);
          }
          snap = acted.json.snapshot;
          continue;
        }
        throw new Error(`unexpected phase ${snap.phase}`);
      }
      if (snap.phase !== 'ended') {
        throw new Error(`main path did not end within ${steps} steps`);
      }
      if (!snap.resultSummary) {
        throw new Error('ended without resultSummary');
      }
    } finally {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  },

  'MJ-ACC-WEB-02': async () => {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    require('ts-node/register/transpile-only');
    // eslint-disable-next-line global-require
    const { createMajiangApiApp } = require('../../src/majiang/ui/api-server');

    const { app } = createMajiangApiApp({ servePrototype: false });
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    try {
      const created = await requestJson(base, 'POST', '/games');
      if (created.status !== 201) {
        throw new Error(`POST /games failed: status=${created.status}`);
      }
      const before = created.json.snapshot;
      const illegal = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 9999,
      });
      if (illegal.status !== 400) {
        throw new Error(`expected 400, got ${illegal.status}`);
      }
      const again = await requestJson(base, 'GET', `/games/${created.json.id}`);
      if (JSON.stringify(again.json.snapshot.selfHand) !== JSON.stringify(before.selfHand)) {
        throw new Error('illegal action dirtied selfHand');
      }
      if (JSON.stringify(again.json.snapshot.discardRiver) !== JSON.stringify(before.discardRiver)) {
        throw new Error('illegal action dirtied discardRiver');
      }
      if (again.json.snapshot.phase !== before.phase) {
        throw new Error('illegal action dirtied phase');
      }
    } finally {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
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
