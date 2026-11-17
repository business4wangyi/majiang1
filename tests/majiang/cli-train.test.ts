import { expect } from 'chai';
import sinon from 'sinon';
import { GameState } from '../../src/majiang/core/game';
import { runAutoTraining } from '../../src/majiang/session/auto-train';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

describe('CLI train via Session (CAP-CLI-TRAIN / MJ-ACC-CLI-01)', function () {
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

  it('MJ-ACC-CLI-01: 自动对弈短路径走 Session 可终局且无 readline 硬耦合', async () => {
    const { session, result } = await runAutoTraining({ rounds: 1 });

    expect(result.rounds).to.equal(1);
    expect(result.players).to.have.lengthOf(4);
    for (const p of result.players) {
      expect(p).to.include.keys(
        'name',
        'totalGames',
        'winCount',
        'drawCount',
        'score',
        'winRate',
        'avgScore'
      );
    }
    expect(session.getState()).to.equal(GameState.ENDED);
    expect(askQuestionStub.called).to.equal(false);
  });
});
