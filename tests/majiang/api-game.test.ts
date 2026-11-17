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

  it('api Session：开局后 discard 改变服务端状态，非法动作不脏写', () => {
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
    expect(() => session.applyAction({ id: 'discard', tileIndex: 9999 })).to.throw(
      /invalid tileIndex/
    );
    expect(session.fingerprint()).to.equal(fp);

    const after = session.applyAction({ id: 'discard', tileIndex: 0 });
    expect(after.selfHand.length).to.equal(before.selfHand.length - 1);
    expect(after.discardRiver.east.length).to.equal(before.discardRiver.east.length + 1);
    expect(after.gameId).to.equal('test-api-1');
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

      const handBefore = got.json.snapshot.selfHand.length;
      const acted = await requestJson(base, 'POST', `/games/${created.json.id}/actions`, {
        id: 'discard',
        tileIndex: 0,
      });
      expect(acted.status).to.equal(200);
      expect(acted.json.snapshot.selfHand.length).to.equal(handBefore - 1);

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
