import { expect } from 'chai';
import sinon from 'sinon';
import { GameState } from '../../src/majiang/core/game';
import { PlayerType } from '../../src/majiang/core/player';
import { GameSession } from '../../src/majiang/session/game-session';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

describe('分数结算（API 胡牌后座位分不得全 0）', function () {
  this.timeout(60000);

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

  it('fixture=hu-ready：点胡后 seats/resultSummary 分数与 delta 均非全 0，且座位分与 total 对齐', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'score-hu-ready',
      fixture: 'hu-ready',
    });
    session.start();

    let snap = session.getTableSnapshot();
    expect(snap.phase).to.equal('response_window');
    const hu = snap.availableActions.find((a) => a.id === 'hu' && a.available);
    expect(hu, 'hu-ready 应可胡').to.exist;

    snap = await session.applyAction({ id: 'hu' });
    expect(snap.phase).to.equal('ended');
    expect(session.getState()).to.equal(GameState.ENDED);

    const seatScores = snap.seats.map((s) => s.score);
    expect(
      seatScores.some((s) => s !== 0),
      `胡牌后座位分不应全 0，实际=${JSON.stringify(seatScores)}`
    ).to.equal(true);

    const summary = snap.resultSummary;
    expect(summary).to.not.equal(null);
    expect(summary!.type).to.be.oneOf(['tsumo', 'ron']);
    expect(summary!.rows.some((r) => r.delta !== '0')).to.equal(true);
    expect(summary!.rows.some((r) => r.delta.startsWith('+'))).to.equal(true);
    expect(summary!.rows.some((r) => r.delta.startsWith('-'))).to.equal(true);

    for (const row of summary!.rows) {
      const seat = snap.seats.find((s) => s.name === row.player);
      expect(seat, `缺少座位 ${row.player}`).to.exist;
      expect(seat!.score).to.equal(row.total);
    }

    const human = session.game.getAllPlayers().find((p) => p.type === PlayerType.HUMAN)!;
    expect(human.score).to.be.greaterThan(0);
  });

  it('fixture=hu-ready：荣和零和（各家 delta 之和为 0，且非全 0）', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'score-zero-sum',
      fixture: 'hu-ready',
    });
    session.start();
    const ended = await session.applyAction({ id: 'hu' });
    expect(ended.resultSummary!.type).to.equal('ron');
    const deltas = ended.resultSummary!.rows.map((r) => Number(r.delta));
    expect(deltas.some((d) => d !== 0)).to.equal(true);
    expect(deltas.reduce((a, b) => a + b, 0)).to.equal(0);
  });

  it('fixture=tsumo-ready：自摸后 resultSummary.type=tsumo，分数非全 0 且零和', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'score-tsumo-ready',
      fixture: 'tsumo-ready',
    });
    session.start();
    const before = session.getTableSnapshot();
    expect(before.phase).to.equal('player_turn');
    expect(before.availableActions.some((a) => a.id === 'hu' && a.available)).to.equal(true);

    await session.applyAction({ id: 'hu' });
    const snap = session.getTableSnapshot();
    expect(snap.phase).to.equal('ended');
    expect(snap.resultSummary?.type).to.equal('tsumo');
    const deltas = (snap.resultSummary?.rows || []).map((r) => Number(r.delta));
    expect(deltas.some((d) => d !== 0)).to.equal(true);
    expect(deltas.reduce((a, b) => a + b, 0)).to.equal(0);
  });

  it('fixture=draw-ready：开局即 ended/draw，delta 全 0', async () => {
    const session = GameSession.create({
      mode: 'api',
      gameId: 'score-draw-ready',
      fixture: 'draw-ready',
    });
    session.start();
    const snap = session.getTableSnapshot();
    expect(snap.phase).to.equal('ended');
    expect(snap.resultSummary?.type).to.equal('draw');
    const deltas = (snap.resultSummary?.rows || []).map((r) => String(r.delta));
    expect(deltas.length).to.be.at.least(4);
    expect(deltas.every((d) => d === '0' || d === '+0')).to.equal(true);
  });
});
