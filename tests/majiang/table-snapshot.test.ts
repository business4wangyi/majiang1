import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import sinon from 'sinon';
import { GameState } from '../../src/majiang/core/game';
import { PlayerAction } from '../../src/majiang/core/rule-types';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { GameSession } from '../../src/majiang/session/game-session';
import * as input from '../../src/majiang/ui/input';
import { setAutoPlayMode } from '../../src/majiang/config/runtime-state';

function loadCreateTableViewModelFromSnapshot(): (snapshot: unknown) => {
  phase: string;
  seats: unknown[];
  selfHand: unknown[];
  discardRiver: unknown;
  availableActions: Array<{ id: string; available: boolean }>;
  resultSummary: unknown;
} {
  const adapterPath = path.join(
    __dirname,
    '../../docs/majiang/web-ui-prototype/view-model-adapter.js'
  );
  const code = fs.readFileSync(adapterPath, 'utf8');
  const runner = new Function('window', `${code}\nreturn window.MajiangViewModelAdapter;`);
  const adapter = runner({}) as {
    createTableViewModelFromSnapshot: (snapshot: unknown) => {
      phase: string;
      seats: unknown[];
      selfHand: unknown[];
      discardRiver: unknown;
      availableActions: Array<{ id: string; available: boolean }>;
      resultSummary: unknown;
    };
  };
  return adapter.createTableViewModelFromSnapshot;
}

describe('TableSnapshot (CAP-ENG-SNAP / MJ-ACC-SNAP-01)', function () {
  this.timeout(120000);

  let consoleLogStub: sinon.SinonStub;
  let askQuestionStub: sinon.SinonStub;
  const createTableViewModelFromSnapshot = loadCreateTableViewModelFromSnapshot();

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    askQuestionStub = sinon.stub(input, 'askQuestion').resolves('n');
    setAutoPlayMode(true);
  });

  afterEach(() => {
    consoleLogStub.restore();
    askQuestionStub.restore();
  });

  it('MJ-ACC-SNAP-01: 快照字段齐全、availableActions 来自引擎，可喂 createTableViewModelFromSnapshot', async () => {
    const session = GameSession.create({ mode: 'auto' });
    const snap0 = session.getTableSnapshot();

    expect(snap0).to.include.keys(
      'phase',
      'seats',
      'selfHand',
      'discardRiver',
      'availableActions',
      'resultSummary'
    );
    expect(snap0.seats).to.have.lengthOf(4);
    expect(snap0.discardRiver).to.include.keys('east', 'south', 'west', 'north');

    const vm0 = createTableViewModelFromSnapshot(snap0);
    expect(vm0.phase).to.be.a('string');
    expect(vm0.seats).to.have.lengthOf(4);
    expect(vm0.availableActions).to.be.an('array');

    // 引擎 pendingAction → 快照动作（禁止前端自造集合）
    session.game.setState(GameState.WAITING_ACTION);
    session.game.pendingAction = {
      tile: new Tile(TileType.WAN, 1, 9001),
      fromPlayerId: 0,
      allowedActions: [PlayerAction.HU, PlayerAction.PENG, PlayerAction.PASS],
      waitingPlayers: [1],
    };
    const engineActions = session.game.getAvailableActions();
    expect(engineActions).to.deep.equal([
      PlayerAction.HU,
      PlayerAction.PENG,
      PlayerAction.PASS,
    ]);

    const snap1 = session.getTableSnapshot();
    expect(snap1.phase).to.equal('response_window');
    const actionIds = snap1.availableActions.filter((a) => a.available).map((a) => a.id);
    expect(actionIds).to.have.members(['hu', 'peng', 'pass']);
    expect(actionIds).to.not.include('chi'); // 引擎未允许则不得出现

    const vm1 = createTableViewModelFromSnapshot(snap1);
    const vmAvailable = vm1.availableActions.filter((a) => a.available).map((a) => a.id);
    expect(vmAvailable).to.include.members(['hu', 'peng', 'pass']);

    // 另开一局验证终局快照（避免污染上面的 pending 断言局）
    const endSession = GameSession.create({ mode: 'auto' });
    await endSession.runFullRound();
    const snapEnd = endSession.getTableSnapshot();
    expect(snapEnd.phase).to.equal('ended');
    expect(snapEnd.resultSummary).to.be.an('object');
    expect(snapEnd.resultSummary).to.include.keys('type', 'title', 'reason', 'rows');

    const vmEnd = createTableViewModelFromSnapshot(snapEnd);
    expect(vmEnd.phase).to.equal('ended');
    expect(vmEnd.resultSummary).to.be.an('object');
  });
});
