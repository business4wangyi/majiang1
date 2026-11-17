import { expect } from 'chai';
import sinon from 'sinon';
import { GameSession } from '../../src/majiang/session/game-session';
import { runAutoTraining } from '../../src/majiang/session/auto-train';
import { createMajiangApiApp } from '../../src/majiang/ui/api-server';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

const SNAP_KEYS = [
  'gameId',
  'phase',
  'seats',
  'selfHand',
  'discardRiver',
  'availableActions',
  'resultSummary',
] as const;

/**
 * CAP-ACC-DUAL / MJ-ACC-DUAL-01（轻断言）：CLI 与 API 都持有同一 GameSession 类 + 同快照键。
 * 完整可重复证据在 `npm run majiang:dual:smoke` 的 DUAL-01 runner。
 */
describe('dual surface shared Session (CAP-ACC-DUAL / MJ-ACC-DUAL-01)', function () {
  this.timeout(120000);

  let consoleLogStub: sinon.SinonStub;
  let askQuestionStub: sinon.SinonStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    askQuestionStub = sinon.stub(input, 'askQuestion').resolves('n');
    setAutoPlayMode(true);
  });

  afterEach(() => {
    consoleLogStub.restore();
    askQuestionStub.restore();
  });

  it('MJ-ACC-DUAL-01: CLI auto 与 API Session 共用契约键且均为 GameSession', async () => {
    const { session: cliSession } = await runAutoTraining({ rounds: 1 });
    expect(cliSession).to.be.instanceOf(GameSession);
    expect(cliSession.mode).to.equal('auto');
    const cliSnap = cliSession.getTableSnapshot();
    for (const key of SNAP_KEYS) {
      expect(cliSnap, `CLI snap.${key}`).to.have.property(key);
    }
    expect(cliSnap.phase).to.equal('ended');

    const apiSession = GameSession.create({ mode: 'api', gameId: 'dual-acc-api' });
    expect(apiSession).to.be.instanceOf(GameSession);
    expect(apiSession.mode).to.equal('api');
    apiSession.start();
    const apiSnap = apiSession.getTableSnapshot();
    for (const key of SNAP_KEYS) {
      expect(apiSnap, `API snap.${key}`).to.have.property(key);
    }
    expect(apiSnap.gameId).to.equal('dual-acc-api');

    const { store } = createMajiangApiApp({ servePrototype: false });
    store.set('probe', apiSession);
    expect(store.get('probe')).to.equal(apiSession);
    expect(askQuestionStub.called).to.equal(false);
  });
});
