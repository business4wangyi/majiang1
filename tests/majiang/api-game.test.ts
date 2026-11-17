import { expect } from 'chai';
import sinon from 'sinon';
import http from 'http';
import { AddressInfo } from 'net';
import { PlayerType } from '../../src/majiang/core/player';
import { GameSession } from '../../src/majiang/session/game-session';
import { createMajiangApiApp } from '../../src/majiang/ui/api-server';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

async function requestJson(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

describe('CAP-API-GAME / MJ-ACC-API-01', function () {
  this.timeout(30000);

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

  it('api Session：开局后 discard 改变服务端状态，非法动作不脏写', async () => {
    const session = GameSession.create({ mode: 'api', gameId: 'test-api-1' });
    expect(session.game.getAllPlayers().some((p) => p.type === PlayerType.HUMAN)).to.equal(
      true
    );

    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('player_turn');
    expect(before.selfHand.length).to.be.greaterThan(0);
    expect(before.availableActions.some((a) => a.id === 'discard' && a.available)).to.equal(
      true
    );

    const fp = session.fingerprint();
    try {
      await session.applyAction({ id: 'discard', tileIndex: 9999 });
      expect.fail('expected invalid tileIndex to throw');
    } catch (err) {
      expect(String(err && (err as Error).message)).to.match(/invalid tileIndex/);
    }
    expect(session.fingerprint()).to.equal(fp);

    const after = await session.applyAction({ id: 'discard', tileIndex: 0 });
    // AI 续走后可能已摸牌回到 14 张；以河牌增长与 phase 证明权威步进
    expect(after.discardRiver.east.length).to.be.greaterThan(before.discardRiver.east.length);
    expect(after.gameId).to.equal('test-api-1');
    // CAP-WEB-BRIDGE：出牌后不得假 waiting_ai；应回到人类决策或终局
    expect(after.phase).to.be.oneOf(['player_turn', 'response_window', 'ended']);
  });

  it('HTTP：POST/GET/actions 权威在服务端 Session', async () => {
    const { app } = createMajiangApiApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    try {
      const created = await requestJson(base, 'POST', '/games');
      expect(created.status).to.equal(201);
      expect(created.json.id).to.be.a('string');
      expect(created.json.snapshot.gameId).to.equal(created.json.id);
      expect(created.json.snapshot.phase).to.equal('player_turn');

      const got = await requestJson(base, 'GET', `/games/${created.json.id}`);
      expect(got.status).to.equal(200);
      expect(got.json.snapshot.selfHand).to.deep.equal(created.json.snapshot.selfHand);

      const riverBefore = got.json.snapshot.discardRiver.east.length;
      const acted = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 0,
      });
      expect(acted.status).to.equal(200);
      expect(acted.json.snapshot.discardRiver.east.length).to.be.greaterThan(riverBefore);
      expect(acted.json.snapshot.phase).to.be.oneOf(['player_turn', 'response_window', 'ended']);

      const illegal = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 9999,
      });
      expect(illegal.status).to.equal(400);

      const again = await requestJson(base, 'GET', `/games/${created.json.id}`);
      expect(again.json.snapshot.selfHand).to.deep.equal(acted.json.snapshot.selfHand);
      expect(again.json.snapshot.discardRiver.east).to.deep.equal(
        acted.json.snapshot.discardRiver.east
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });
});
