import { expect } from 'chai';
import sinon from 'sinon';
import http from 'http';
import { AddressInfo } from 'net';
import { GameState } from '../../src/majiang/core/game';
import { GameSession } from '../../src/majiang/session/game-session';
import { createMajiangApiApp } from '../../src/majiang/ui/api-server';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

describe('meld fixture（能碰 / 能吃）', function () {
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

  it('peng-ready：响应窗必有 peng，apply 后明刻出现', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-peng',
      fixture: 'peng-ready',
    });
    session.start();

    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('response_window');
    expect(before.availableActions.some((a) => a.id === 'peng' && a.available)).to.equal(
      true
    );

    const after = await session.applyAction({ id: 'peng' });
    expect(session.getState()).to.equal(GameState.PLAYING);
    const east = session.game.getAllPlayers()[0];
    expect(east.revealedSets.some((s) => s.type === 'PENG')).to.equal(true);
    expect(after.availableActions.some((a) => a.id === 'discard' && a.available)).to.equal(
      true
    );
  });

  it('chi-ready：响应窗必有 chi，apply 后明顺出现', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-chi',
      fixture: 'chi-ready',
    });
    session.start();

    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('response_window');
    expect(before.availableActions.some((a) => a.id === 'chi' && a.available)).to.equal(
      true
    );

    const after = await session.applyAction({ id: 'chi' });
    expect(session.getState()).to.equal(GameState.PLAYING);
    const east = session.game.getAllPlayers()[0];
    expect(east.revealedSets.some((s) => s.type === 'CHI')).to.equal(true);
    expect(after.availableActions.some((a) => a.id === 'discard' && a.available)).to.equal(
      true
    );
  });

  it('pass-ready：响应窗必有 pass，apply 后不崩且离 response_window', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-pass',
      fixture: 'pass-ready',
    });
    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('response_window');
    expect(before.availableActions.some((a) => a.id === 'pass' && a.available)).to.equal(true);

    const after = await session.applyAction({ id: 'pass' });
    expect(after.phase).to.not.equal('response_window');
    expect([GameState.PLAYING, GameState.WAITING_ACTION, GameState.ENDED]).to.include(
      session.getState()
    );
  });

  it('gang-ready：响应窗必有 gang，apply 后明杠出现', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-gang',
      fixture: 'gang-ready',
    });
    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('response_window');
    expect(before.availableActions.some((a) => a.id === 'gang' && a.available)).to.equal(true);

    const after = await session.applyAction({ id: 'gang' });
    expect(session.getState()).to.equal(GameState.PLAYING);
    const east = session.game.getAllPlayers()[0];
    expect(east.revealedSets.some((s) => s.type === 'GANG')).to.equal(true);
    expect(after.phase).to.equal('player_turn');
  });

  it('angang-ready：player_turn 必有 gang，apply 后暗杠出现', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-angang',
      fixture: 'angang-ready',
    });
    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('player_turn');
    expect(before.availableActions.some((a) => a.id === 'gang' && a.available)).to.equal(
      true
    );

    const after = await session.applyAction({ id: 'gang' });
    expect(session.getState()).to.equal(GameState.PLAYING);
    const east = session.game.getAllPlayers()[0];
    expect(east.revealedSets.some((s) => s.type === 'GANG' && s.source === 'an')).to.equal(
      true
    );
    expect(after.phase).to.equal('player_turn');
  });

  it('discard-ready：player_turn 可出牌，discard 后手牌/河变化', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'fx-discard',
      fixture: 'discard-ready',
    });
    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('player_turn');
    expect(before.availableActions.some((a) => a.id === 'discard')).to.equal(true);
    const handBefore = before.selfHand.length;

    const after = await session.applyAction({ id: 'discard', tileIndex: 0 });
    // 可能进入 response_window（他家）或继续；至少人类手牌减少或对局推进
    const east = session.game.getAllPlayers()[0];
    expect(east.discardedTiles.length).to.be.at.least(1);
    expect(east.handTiles.length).to.equal(handBefore - 1);
    expect(after.phase).to.be.oneOf(['player_turn', 'response_window', 'ended', 'waiting_ai']);
    // 禁止假 waiting_ai 死等：若 phase 为 waiting_ai 则本用例 FAIL
    expect(after.phase).to.not.equal('waiting_ai');
  });

  it('HTTP：POST /games { fixture } 透传能碰', async () => {
    const { app } = createMajiangApiApp({ servePrototype: false });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    try {
      const created = await fetch(`${base}/games`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fixture: 'peng-ready' }),
      }).then(async (r) => ({ status: r.status, json: await r.json() }));

      expect(created.status).to.equal(201);
      expect(created.json.fixture).to.equal('peng-ready');
      expect(created.json.snapshot.phase).to.equal('response_window');
      expect(
        created.json.snapshot.availableActions.some(
          (a: { id: string; available: boolean }) => a.id === 'peng' && a.available
        )
      ).to.equal(true);

      const acted = await fetch(`${base}/games/${created.json.id}/actions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'peng' }),
      }).then(async (r) => ({ status: r.status, json: await r.json() }));

      expect(acted.status).to.equal(200);
      expect(acted.json.snapshot.phase).to.equal('player_turn');
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });
});
