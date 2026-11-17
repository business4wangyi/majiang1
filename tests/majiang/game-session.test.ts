import { expect } from 'chai';
import sinon from 'sinon';
import { GameState } from '../../src/majiang/core/game';
import { GameSession } from '../../src/majiang/session/game-session';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

describe('GameSession (CAP-ENG-SESSION)', function () {
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

  it('auto 模式可无交互跑完一局并进入 ENDED', async () => {
    const session = GameSession.create({ mode: 'auto' });
    expect(session.game.getAllPlayers()).to.have.lengthOf(4);

    await session.runFullRound();

    expect(session.getState()).to.equal(GameState.ENDED);
  });
});
