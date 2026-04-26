import { expect } from 'chai';
import { Game, GameState } from '../../src/majiang/core/game';
import { Player, PlayerState, PlayerType } from '../../src/majiang/core/player';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { TileManager } from '../../src/majiang/core/tile-manager';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';
import * as input from '../../src/majiang/ui/input';
import sinon from 'sinon';

describe('GameEventHandler', () => {
  let game: Game;
  let gameEventHandler: GameEventHandler;
  let player: Player;
  let consoleLogStub: sinon.SinonStub;
  let askQuestionStub: sinon.SinonStub;

  beforeEach(() => {
    // 存根console.log，这样测试输出不会被污染
    consoleLogStub = sinon.stub(console, 'log');

    // 创建新的游戏实例和玩家
    game = new Game();
    player = new Player(1, '测试玩家', PlayerType.HUMAN);
    game.addPlayer(player);
    gameEventHandler = new GameEventHandler(game, TileManager.getInstance(), [player]);

    // 存根 askQuestion 函数
    askQuestionStub = sinon.stub(input, 'askQuestion').resolves('1');
  });

  afterEach(() => {
    consoleLogStub.restore();
    askQuestionStub.restore();
  });

  describe('handlePeng', () => {
    it('应该成功处理碰牌', async () => {
      // 给玩家两张相同的牌
      const tile = new Tile(TileType.WAN, 1, 1);
      player.handTiles = [tile, tile];

      const result = await gameEventHandler.handlePeng(player, tile);

      expect(result).to.be.true;
      expect(player.handTiles).to.be.empty;
      expect(player.revealedSets).to.have.lengthOf(1);
      expect(player.revealedSets[0].type).to.equal('PENG');
      expect(player.revealedSets[0].tiles).to.have.lengthOf(3);
    });

    it('当玩家没有足够的牌时应该失败', async () => {
      const tile = new Tile(TileType.WAN, 1, 1);
      player.handTiles = [tile]; // 只有一张牌

      const result = await gameEventHandler.handlePeng(player, tile);

      expect(result).to.be.false;
      expect(player.handTiles).to.have.lengthOf(1);
      expect(player.revealedSets).to.be.empty;
    });
  });

  describe('handleGang', () => {
    it('应该成功处理杠牌', async () => {
      // 确保牌山为空，这样杠后不会触发摸牌
      const tileManager = TileManager.getInstance();
      tileManager.reset();
      // 手动清空牌山
      while(tileManager.getRemainingTiles() > 0) {
        tileManager.drawTile();
      }

      // 给玩家三张相同的牌
      const tile = new Tile(TileType.WAN, 1, 1);
      player.handTiles = [tile, tile, tile];

      const result = await gameEventHandler.handleGang(player, tile);

      expect(result).to.be.true;
      expect(player.handTiles).to.be.empty;
      expect(player.revealedSets).to.have.lengthOf(1);
      expect(player.revealedSets[0].type).to.equal('GANG');
      expect(player.revealedSets[0].tiles).to.have.lengthOf(4);
      expect(player.revealedSets[0].source).to.equal('ming');
    });

    it('当玩家没有足够的牌时应该失败', async () => {
      const tile = new Tile(TileType.WAN, 1, 1);
      player.handTiles = [tile, tile]; // 只有两张牌

      const result = await gameEventHandler.handleGang(player, tile);

      expect(result).to.be.false;
      expect(player.handTiles).to.have.lengthOf(2);
      expect(player.revealedSets).to.be.empty;
    });
  });

  describe('handleChi', () => {
    it('应该成功处理吃牌', async () => {
      // 给玩家可以吃的牌组合
      const tile = new Tile(TileType.WAN, 2, 1);
      player.handTiles = [
        new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 3, 3)
      ];

      // 设置为AI玩家以避免用户输入
      player.type = PlayerType.AI;
      const requireDiscardStub = sinon.stub(gameEventHandler as any, 'requirePlayerToDiscard').resolves();

      const result = await gameEventHandler.handleChi(player, tile);

      expect(result).to.be.true;
      expect(player.handTiles).to.be.empty;
      expect(player.revealedSets).to.have.lengthOf(1);
      expect(player.revealedSets[0].type).to.equal('CHI');
      expect(player.revealedSets[0].tiles).to.have.lengthOf(3);
      expect(player.revealedSets[0].tiles.map(t => t.value).sort()).to.deep.equal([1, 2, 3]);
      requireDiscardStub.restore();
    });

    it('当玩家没有可以吃的牌组合时应该失败', async () => {
      const tile = new Tile(TileType.WAN, 2, 1);
      player.handTiles = [
        new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 4, 3) // 不能吃的组合
      ];

      const result = await gameEventHandler.handleChi(player, tile);

      expect(result).to.be.false;
      expect(player.handTiles).to.have.lengthOf(2);
      expect(player.revealedSets).to.be.empty;
    });

    it('当牌类型不是万、条、筒时应该失败', async () => {
      const tile = new Tile(TileType.FENG, 1, 1); // 风牌不能吃
      player.handTiles = [
        new Tile(TileType.FENG, 2, 2),
        new Tile(TileType.FENG, 3, 3)
      ];

      const result = await gameEventHandler.handleChi(player, tile);

      expect(result).to.be.false;
      expect(player.handTiles).to.have.lengthOf(2);
      expect(player.revealedSets).to.be.empty;
    });
  });
});
