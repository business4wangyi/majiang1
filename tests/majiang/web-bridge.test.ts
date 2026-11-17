import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { AddressInfo } from 'net';
import vm from 'vm';
import { GameState } from '../../src/majiang/core/game';
import { GameSession } from '../../src/majiang/session/game-session';
import { createMajiangApiApp } from '../../src/majiang/ui/api-server';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

async function requestJson(
  baseUrl: string,
  method: string,
  route: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

describe('CAP-WEB-BRIDGE / MJ-ACC-WEB-01+02', function () {
  this.timeout(180000);

  let consoleLogStub: sinon.SinonStub;
  let askQuestionStub: sinon.SinonStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    askQuestionStub = sinon.stub(input, 'askQuestion').resolves('n');
    setAutoPlayMode(false);
  });

  afterEach(() => {
    consoleLogStub.restore();
    askQuestionStub.restore();
  });

  it('出牌后 AI 能回手；主链路可完局（无假 waiting_ai）', async () => {
    const session = GameSession.create({ mode: 'api', gameId: 'web-bridge-1' });
    session.start();

    let snap = session.getTableSnapshot();
    expect(snap.phase).to.equal('player_turn');

    let steps = 0;
    while (snap.phase !== 'ended' && steps < 400) {
      steps += 1;
      expect(snap.phase).to.not.equal('waiting_ai');

      if (snap.phase === 'response_window') {
        const pass = snap.availableActions.find((a) => a.id === 'pass' && a.available);
        expect(pass, 'response_window 应提供过').to.exist;
        snap = await session.applyAction({ id: 'pass' });
        continue;
      }

      if (snap.phase === 'player_turn') {
        const discard = snap.availableActions.find((a) => a.id === 'discard' && a.available);
        expect(discard, 'player_turn 应可出牌').to.exist;
        expect(snap.selfHand.length).to.be.greaterThan(0);
        snap = await session.applyAction({ id: 'discard', tileIndex: 0 });
        continue;
      }

      expect.fail(`unexpected phase ${snap.phase}`);
    }

    expect(snap.phase).to.equal('ended');
    expect(session.getState()).to.equal(GameState.ENDED);
    expect(snap.resultSummary).to.not.equal(null);
  });

  it('HTTP：非法动作 400 且不脏写；bridge-config 可发现', async () => {
    const { app } = createMajiangApiApp({ servePrototype: false });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    try {
      const cfg = await requestJson(base, 'GET', '/api/bridge-config');
      expect(cfg.status).to.equal(200);
      expect(cfg.json.enabled).to.equal(true);

      const created = await requestJson(base, 'POST', '/games');
      expect(created.status).to.equal(201);
      const id = created.json.id as string;
      const before = created.json.snapshot;

      const illegal = await requestJson(base, 'POST', `/games/${id}/actions`, {
        id: 'discard',
        tileIndex: 9999,
      });
      expect(illegal.status).to.equal(400);

      const again = await requestJson(base, 'GET', `/games/${id}`);
      expect(again.status).to.equal(200);
      expect(again.json.snapshot.selfHand).to.deep.equal(before.selfHand);
      expect(again.json.snapshot.discardRiver).to.deep.equal(before.discardRiver);
      expect(again.json.snapshot.phase).to.equal(before.phase);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });

  it('api-bridge.js：create/action handler 形状对接 snapshot', async () => {
    const bridgePath = path.resolve(
      __dirname,
      '../../docs/majiang/web-ui-prototype/api-bridge.js'
    );
    const source = fs.readFileSync(bridgePath, 'utf8');

    const { app } = createMajiangApiApp({ servePrototype: false });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    try {
      let creationHandler: any = null;
      let actionHandler: any = null;
      const sandbox: any = {
        window: null as any,
        fetch: (url: string, init?: RequestInit) => fetch(url, init),
        console,
      };
      sandbox.window = sandbox;
      sandbox.setMajiangGameCreationHandler = (h: unknown) => {
        creationHandler = h;
      };
      sandbox.setMajiangActionHandler = (h: unknown) => {
        actionHandler = h;
      };
      sandbox.MAJIANG_API_BASE = base;

      vm.runInNewContext(source, sandbox);
      expect(typeof sandbox.installMajiangApiBridge).to.equal('function');
      sandbox.installMajiangApiBridge({ apiBase: base });
      expect(creationHandler).to.be.a('function');
      expect(actionHandler).to.be.a('function');

      const created = await creationHandler({ lobby: {} });
      expect(created.ok).to.equal(true);
      expect(created.tableSnapshot.phase).to.equal('player_turn');
      expect(created.tableSnapshot.phase).to.not.equal('waiting_ai');

      const acted = await actionHandler({
        actionId: 'discard',
        payload: { selectedTileIndex: 0 },
        model: created.tableSnapshot,
      });
      expect(acted.ok).to.equal(true);
      expect(acted.nextModel.phase).to.be.oneOf(['player_turn', 'response_window', 'ended']);
      expect(acted.nextModel.phase).to.not.equal('waiting_ai');

      const illegal = await actionHandler({
        actionId: 'discard',
        payload: { selectedTileIndex: 9999 },
        model: acted.nextModel,
      });
      expect(illegal.ok).to.equal(false);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });
});
