'use strict';

/**
 * Playwright 真浏览器 e2e（方案 A 烟雾全流程）：
 * - 纯静态 fail-closed
 * - ?prototypeDemo=1 可进假对局
 * - 结果四态 showMajiangResultExample
 * - API：开局→优先 hu/副露→否则 discard/pass→ended；非法 discard 不脏写
 * - 分数：?fixture=hu-ready 点胡后 seats/resultSummary 非全 0；随机完局若有赢家亦校验
 * 副露/胡：随机局仍为机会覆盖；必现碰/吃/胡见 ?fixture=peng-ready|chi-ready|hu-ready。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB_ROOT = path.join(ROOT, 'docs/majiang/web-ui-prototype');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance');
const OUT_FILE = path.join(OUT_DIR, 'majiang-web-e2e.json');
const CHROME_BIN =
  process.env.MAJIANG_CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const RESPONSE_PRIORITY = ['hu', 'gang', 'peng', 'chi', 'pass'];
const RESULT_TYPES = ['tsumo', 'ron', 'draw', 'abort'];

function startStatic(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safePath = reqPath === '/' ? '/index.html' : reqPath;
      const resolved = path.resolve(WEB_ROOT, `.${safePath}`);
      if (!resolved.startsWith(WEB_ROOT)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      fs.readFile(resolved, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(resolved);
        const mime =
          ext === '.html'
            ? 'text/html; charset=utf-8'
            : ext === '.css'
              ? 'text/css; charset=utf-8'
              : ext === '.js'
                ? 'application/javascript; charset=utf-8'
                : 'text/plain; charset=utf-8';
        res.setHeader('Content-Type', mime);
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function withBrowser(fn) {
  if (!fs.existsSync(CHROME_BIN)) {
    throw new Error(`Chrome not found at ${CHROME_BIN}; set MAJIANG_CHROME_BIN`);
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(180000);
    page.setDefaultNavigationTimeout(60000);
    return await fn(page);
  } finally {
    await browser.close();
  }
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
}

function pickResponseAction(actions) {
  for (const id of RESPONSE_PRIORITY) {
    if (actions.includes(id)) return id;
  }
  return null;
}

/** 胡牌局分数验收：座位分、delta、total 对齐、零和 */
function assertScoreSettlement(scoreInfo, { requireWinner = false } = {}) {
  const { seats, resultSummary } = scoreInfo || {};
  if (!resultSummary) {
    throw new Error(`missing resultSummary: ${JSON.stringify(scoreInfo)}`);
  }
  const hasWinner =
    resultSummary.type === 'tsumo' ||
    resultSummary.type === 'ron' ||
    (resultSummary.rows || []).some((r) => r.role === '胡牌者');

  if (!hasWinner) {
    if (requireWinner) {
      throw new Error(`expected winner settlement, got ${JSON.stringify(resultSummary)}`);
    }
    const deltas = (resultSummary.rows || []).map((r) => r.delta);
    if (deltas.some((d) => d !== '0')) {
      throw new Error(`draw must have delta 0, got ${JSON.stringify(deltas)}`);
    }
    return { hasWinner: false, seats, resultSummary };
  }

  const seatScores = (seats || []).map((s) => s.score);
  if (!seatScores.some((s) => s !== 0)) {
    throw new Error(`winner round seat scores all 0: ${JSON.stringify(seats)}`);
  }
  const deltas = (resultSummary.rows || []).map((r) => r.delta);
  if (!deltas.some((d) => d !== '0')) {
    throw new Error(`winner round deltas all 0: ${JSON.stringify(resultSummary.rows)}`);
  }
  if (!deltas.some((d) => String(d).startsWith('+'))) {
    throw new Error(`missing positive delta: ${JSON.stringify(deltas)}`);
  }
  if (!deltas.some((d) => String(d).startsWith('-'))) {
    throw new Error(`missing negative delta: ${JSON.stringify(deltas)}`);
  }
  const sum = deltas.reduce((a, b) => a + Number(b), 0);
  if (sum !== 0) {
    throw new Error(`deltas not zero-sum (${sum}): ${JSON.stringify(deltas)}`);
  }
  for (const row of resultSummary.rows || []) {
    const seat = (seats || []).find((s) => s.name === row.player);
    if (!seat) {
      throw new Error(`seat missing for ${row.player}`);
    }
    if (seat.score !== row.total) {
      throw new Error(`seat/total mismatch ${row.player}: seat=${seat.score} total=${row.total}`);
    }
  }
  return { hasWinner: true, seats, resultSummary, seatScores, deltas };
}

async function assertStaticFailClosed() {
  const server = await startStatic(0);
  const { port } = server.address();
  try {
    await withBrowser(async (page) => {
      await page.goto(`http://127.0.0.1:${port}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForFunction(
        () => window.__majiangApiBridgeOffline === true || window.__majiangApiBridgeInstalled === true,
        null,
        { timeout: 10000 }
      );
      await page.click('#startGameBtn');
      await page.waitForTimeout(900);
      const state = await page.evaluate(() => ({
        offline: Boolean(window.__majiangApiBridgeOffline),
        installed: Boolean(window.__majiangApiBridgeInstalled),
        toast: document.getElementById('toast')?.textContent || '',
        lobbyError: document.getElementById('lobbyError')?.textContent || '',
        tableHidden: document.getElementById('tablePage')?.classList.contains('hidden'),
        lobbyHidden: document.getElementById('lobbyPage')?.classList.contains('hidden'),
        diag: (document.getElementById('lobbyDiagOutput')?.textContent || '').slice(0, 320),
      }));
      if (state.installed) {
        throw new Error('static open must not install API bridge');
      }
      if (!state.offline) {
        throw new Error('static open must set offline guard');
      }
      if (!state.tableHidden || state.lobbyHidden) {
        throw new Error(`static open must stay in lobby after start; got ${JSON.stringify(state)}`);
      }
      if (!/未连接对局 API|api-server/i.test(`${state.lobbyError}\n${state.diag}`)) {
        throw new Error(`static open must show API hint; got ${JSON.stringify(state)}`);
      }
    });
  } finally {
    await closeServer(server);
  }
}

async function assertPrototypeDemoAllowsFakeGame() {
  const server = await startStatic(0);
  const { port } = server.address();
  try {
    await withBrowser(async (page) => {
      await page.goto(`http://127.0.0.1:${port}/index.html?prototypeDemo=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      // 演示旁路：不装 offline guard；等一小会儿让 bridge-config fetch 失败路径走完
      await page.waitForTimeout(1200);
      const flags = await page.evaluate(() => ({
        offline: Boolean(window.__majiangApiBridgeOffline),
        installed: Boolean(window.__majiangApiBridgeInstalled),
      }));
      if (flags.installed) {
        throw new Error('prototypeDemo static must not install API bridge');
      }
      if (flags.offline) {
        throw new Error('prototypeDemo must not install offline guard');
      }
      await page.click('#startGameBtn');
      await page.waitForFunction(
        () => !document.getElementById('tablePage')?.classList.contains('hidden'),
        null,
        { timeout: 10000 }
      );
      const phase = await page.evaluate(() => window.__majiangE2e?.getPhase?.() || '');
      if (!phase || phase === 'lobby_idle') {
        throw new Error(`prototypeDemo must enter table; phase=${phase}`);
      }
    });
  } finally {
    await closeServer(server);
  }
}

async function assertResultExamples() {
  const server = await startStatic(0);
  const { port } = server.address();
  try {
    await withBrowser(async (page) => {
      await page.goto(`http://127.0.0.1:${port}/index.html?prototypeDemo=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForTimeout(400);
      for (const type of RESULT_TYPES) {
        await page.evaluate((t) => {
          window.showMajiangResultExample(t);
        }, type);
        await page.waitForFunction(
          () => !document.getElementById('resultModal')?.classList.contains('hidden'),
          null,
          { timeout: 5000 }
        );
        const hero = await page.evaluate(() => {
          const el = document.getElementById('resultHero');
          return {
            className: el?.className || '',
            badge: document.getElementById('resultTypeBadge')?.textContent || '',
          };
        });
        const expectClass =
          type === 'ron' ? 'is-ron' : type === 'draw' ? 'is-draw' : type === 'abort' ? 'is-abort' : 'is-tsumo';
        if (!hero.className.includes(expectClass)) {
          throw new Error(`result ${type}: hero missing ${expectClass}; got ${JSON.stringify(hero)}`);
        }
        await page.evaluate(() => {
          document.getElementById('resultModal')?.classList.add('hidden');
        });
      }
    });
  } finally {
    await closeServer(server);
  }
}

async function playToEndViaUi(baseUrl) {
  return withBrowser(async (page) => {
    await page.goto(`${baseUrl}/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await page.waitForFunction(() => window.__majiangApiBridgeInstalled === true, null, {
      timeout: 10000,
    });

    await page.click('#startGameBtn');
    await page.waitForFunction(
      () => {
        const tableVisible = !document.getElementById('tablePage')?.classList.contains('hidden');
        const hint = document.getElementById('turnHint')?.textContent || '';
        const realTurn =
          /轮到你出牌|可响应/.test(hint) && !/右家打出三万/.test(hint);
        const tile = document.querySelector('#handTiles .tile');
        const handReady = tile && !tile.disabled;
        const discard = document.querySelector('[data-action-id="discard"]');
        const pass = document.querySelector('[data-action-id="pass"]');
        const canAct =
          (discard && !discard.classList.contains('hidden-by-phase')) ||
          (pass && !pass.classList.contains('hidden-by-phase') && !pass.disabled);
        return tableVisible && realTurn && handReady && canAct;
      },
      null,
      { timeout: 30000 }
    );

    const actionsSeen = Object.create(null);
    let illegalChecked = false;
    let steps = 0;

    while (steps < 400) {
      steps += 1;
      const snap = await page.evaluate(() => {
        const api = window.__majiangE2e;
        if (!api) throw new Error('__majiangE2e missing');
        return {
          phase: api.getPhase(),
          hint: api.getHint(),
          hand: api.getHandCount(),
          selfHand: api.getSelfHand(),
          actions: api.getAvailableActionIds(),
          submitting: api.isSubmitting(),
          resultOpen: !document.getElementById('resultModal')?.classList.contains('hidden'),
        };
      });

      for (const id of snap.actions || []) {
        actionsSeen[id] = (actionsSeen[id] || 0) + 1;
      }

      if (snap.resultOpen || snap.phase === 'ended' || /本局已结束/.test(snap.hint || '')) {
        const scoreInfo = await page.evaluate(() => ({
          seats: window.__majiangE2e.getSeatScores(),
          resultSummary: window.__majiangE2e.getResultSummary(),
        }));
        const scoreCheck = assertScoreSettlement(scoreInfo, { requireWinner: false });
        return { steps, ended: true, actionsSeen, illegalChecked, scoreCheck };
      }
      if (snap.phase === 'waiting_ai') {
        throw new Error(`假 waiting_ai 死等 at step ${steps}: ${JSON.stringify(snap)}`);
      }
      if (snap.submitting) {
        await page.waitForFunction(() => !window.__majiangE2e.isSubmitting(), null, {
          timeout: 120000,
        });
        continue;
      }

      if (snap.phase === 'player_turn' && !illegalChecked && snap.actions.includes('discard')) {
        const beforeHand = snap.selfHand;
        await page.evaluate(async () => {
          await window.__majiangE2e.discardIllegal();
        });
        await page.waitForFunction(() => !window.__majiangE2e.isSubmitting(), null, {
          timeout: 30000,
        });
        const after = await page.evaluate(() => ({
          hand: window.__majiangE2e.getSelfHand(),
          phase: window.__majiangE2e.getPhase(),
          err: window.__majiangE2e.getInlineErrorMessage(),
        }));
        if (JSON.stringify(after.hand) !== JSON.stringify(beforeHand)) {
          throw new Error(`illegal discard dirty hand: ${JSON.stringify({ beforeHand, after })}`);
        }
        if (after.phase !== 'player_turn') {
          throw new Error(`illegal discard changed phase: ${JSON.stringify(after)}`);
        }
        if (!after.err) {
          throw new Error(`illegal discard must surface inline error; got ${JSON.stringify(after)}`);
        }
        illegalChecked = true;
        continue;
      }

      if (snap.phase === 'response_window') {
        const actionId = pickResponseAction(snap.actions);
        if (!actionId) {
          throw new Error(`response_window without actions at step ${steps}: ${JSON.stringify(snap)}`);
        }
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('/actions') && r.request().method() === 'POST',
            { timeout: 120000 }
          ),
          page.evaluate(async (id) => {
            await window.__majiangE2e.submit(id);
          }, actionId),
        ]);
        actionsSeen[`did:${actionId}`] = (actionsSeen[`did:${actionId}`] || 0) + 1;
        continue;
      }

      if (snap.phase === 'player_turn') {
        if (snap.actions.includes('hu')) {
          await Promise.all([
            page.waitForResponse(
              (r) => r.url().includes('/actions') && r.request().method() === 'POST',
              { timeout: 120000 }
            ),
            page.evaluate(async () => {
              await window.__majiangE2e.submit('hu');
            }),
          ]);
          actionsSeen['did:hu'] = (actionsSeen['did:hu'] || 0) + 1;
          continue;
        }
        if (!snap.actions.includes('discard') || snap.hand < 1) {
          throw new Error(`player_turn not discardable at step ${steps}: ${JSON.stringify(snap)}`);
        }
        await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes('/actions') && r.request().method() === 'POST',
            { timeout: 120000 }
          ),
          page.evaluate(async () => {
            await window.__majiangE2e.discardFirst();
          }),
        ]);
        actionsSeen['did:discard'] = (actionsSeen['did:discard'] || 0) + 1;
        continue;
      }

      await page.waitForTimeout(200);
      if (steps > 40) {
        throw new Error(`no actionable phase at step ${steps}: ${JSON.stringify(snap)}`);
      }
    }
    throw new Error(`UI e2e did not end within ${steps} steps`);
  });
}

async function withApiServer(fn) {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require('ts-node/register/transpile-only');
  // eslint-disable-next-line global-require
  const sinon = require('sinon');
  // eslint-disable-next-line global-require
  const input = require('../../src/majiang/ui/input');
  // eslint-disable-next-line global-require
  const { createMajiangApiApp } = require('../../src/majiang/ui/api-server');

  const consoleStub = sinon.stub(console, 'log');
  const askStub = sinon.stub(input, 'askQuestion').resolves('n');

  const { app } = createMajiangApiApp({ servePrototype: true });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    return await fn(base);
  } finally {
    askStub.restore();
    consoleStub.restore();
    await closeServer(server);
  }
}

async function runApiBackedE2e() {
  return withApiServer((base) => playToEndViaUi(base));
}

/** 夹具必现副露：开局即响应窗，点碰/吃后回到可出牌 */
async function assertMeldFixtureViaUi(base, fixture, actionId) {
  return withBrowser(async (page) => {
    await page.goto(`${base}/index.html?fixture=${fixture}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForFunction(() => window.__majiangApiBridgeInstalled === true, null, {
      timeout: 10000,
    });
    await page.click('#startGameBtn');
    await page.waitForFunction(
      (want) => {
        const api = window.__majiangE2e;
        if (!api) return false;
        return api.getPhase() === 'response_window' && api.getAvailableActionIds().includes(want);
      },
      actionId,
      { timeout: 30000 }
    );
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/actions') && r.request().method() === 'POST',
        { timeout: 60000 }
      ),
      page.evaluate(async (id) => {
        await window.__majiangE2e.submit(id);
      }, actionId),
    ]);
    await page.waitForFunction(() => {
      const api = window.__majiangE2e;
      return api && !api.isSubmitting() && api.getPhase() === 'player_turn';
    }, null, { timeout: 30000 });
    return { fixture, did: actionId, phase: 'player_turn' };
  });
}

async function runMeldFixtureE2e() {
  return withApiServer(async (base) => {
    const peng = await assertMeldFixtureViaUi(base, 'peng-ready', 'peng');
    const chi = await assertMeldFixtureViaUi(base, 'chi-ready', 'chi');
    return { peng, chi };
  });
}

/** 专用分数 e2e：hu-ready 点胡，覆盖座位分 / delta / 零和 / 对齐 */
async function assertHuReadyScoreViaUi(base) {
  return withBrowser(async (page) => {
    await page.goto(`${base}/index.html?fixture=hu-ready`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForFunction(() => window.__majiangApiBridgeInstalled === true, null, {
      timeout: 10000,
    });
    await page.click('#startGameBtn');
    await page.waitForFunction(() => {
      const api = window.__majiangE2e;
      return api && api.getPhase() === 'response_window' && api.getAvailableActionIds().includes('hu');
    }, null, { timeout: 30000 });

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/actions') && r.request().method() === 'POST',
        { timeout: 60000 }
      ),
      page.evaluate(async () => {
        await window.__majiangE2e.submit('hu');
      }),
    ]);

    await page.waitForFunction(() => {
      const api = window.__majiangE2e;
      return api && !api.isSubmitting() && api.getPhase() === 'ended';
    }, null, { timeout: 30000 });

    const scoreInfo = await page.evaluate(() => ({
      seats: window.__majiangE2e.getSeatScores(),
      resultSummary: window.__majiangE2e.getResultSummary(),
    }));
    const scoreCheck = assertScoreSettlement(scoreInfo, { requireWinner: true });
    if (scoreCheck.resultSummary.type !== 'ron') {
      throw new Error(`hu-ready expected ron, got ${scoreCheck.resultSummary.type}`);
    }
    return { fixture: 'hu-ready', did: 'hu', phase: 'ended', scoreCheck };
  });
}

async function runScoreSettlementE2e() {
  return withApiServer(async (base) => assertHuReadyScoreViaUi(base));
}

async function main() {
  const wallStart = Date.now();
  const startedAt = new Date().toISOString();
  const result = {
    startedAt,
    checks: {},
    timingsMs: {},
    ok: false,
  };

  try {
    let t0 = Date.now();
    await assertStaticFailClosed();
    result.checks.staticFailClosed = true;
    result.timingsMs.staticFailClosed = Date.now() - t0;

    t0 = Date.now();
    await assertPrototypeDemoAllowsFakeGame();
    result.checks.prototypeDemoAllowsFakeGame = true;
    result.timingsMs.prototypeDemoAllowsFakeGame = Date.now() - t0;

    t0 = Date.now();
    await assertResultExamples();
    result.checks.resultExamples = RESULT_TYPES;
    result.timingsMs.resultExamples = Date.now() - t0;

    t0 = Date.now();
    const play = await runApiBackedE2e();
    result.checks.apiUiPlayToEnd = play;
    result.timingsMs.apiUiPlayToEnd = Date.now() - t0;

    t0 = Date.now();
    const meld = await runMeldFixtureE2e();
    result.checks.meldFixtures = meld;
    result.timingsMs.meldFixtures = Date.now() - t0;

    t0 = Date.now();
    const scoreSettlement = await runScoreSettlementE2e();
    result.checks.scoreSettlement = scoreSettlement;
    result.timingsMs.scoreSettlement = Date.now() - t0;
    result.ok = true;
  } catch (err) {
    result.ok = false;
    result.error = String(err && err.stack ? err.stack : err);
  }

  result.timingsMs.total = Date.now() - wallStart;
  result.finishedAt = new Date().toISOString();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
  if (!result.ok) {
    console.error(result.error || 'e2e failed');
    process.exitCode = 1;
    return;
  }
  console.log(
    `majiang-web-e2e ok: ${JSON.stringify({
      checks: {
        staticFailClosed: true,
        prototypeDemoAllowsFakeGame: true,
        resultExamples: RESULT_TYPES,
        apiUiPlayToEnd: {
          steps: result.checks.apiUiPlayToEnd.steps,
          ended: result.checks.apiUiPlayToEnd.ended,
          illegalChecked: result.checks.apiUiPlayToEnd.illegalChecked,
          actionsSeen: result.checks.apiUiPlayToEnd.actionsSeen,
          scoreCheck: result.checks.apiUiPlayToEnd.scoreCheck
            ? { hasWinner: result.checks.apiUiPlayToEnd.scoreCheck.hasWinner }
            : null,
        },
        meldFixtures: result.checks.meldFixtures,
        scoreSettlement: {
          fixture: result.checks.scoreSettlement.fixture,
          did: result.checks.scoreSettlement.did,
          hasWinner: result.checks.scoreSettlement.scoreCheck.hasWinner,
          type: result.checks.scoreSettlement.scoreCheck.resultSummary.type,
          deltas: result.checks.scoreSettlement.scoreCheck.deltas,
        },
      },
      timingsMs: result.timingsMs,
    })}`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  assertStaticFailClosed,
  assertPrototypeDemoAllowsFakeGame,
  runApiBackedE2e,
  runMeldFixtureE2e,
  runScoreSettlementE2e,
  playToEndViaUi,
  assertScoreSettlement,
};
