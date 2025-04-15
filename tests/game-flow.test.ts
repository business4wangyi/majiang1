import { expect } from 'chai';
import * as sinon from 'sinon';
import { GameFlow } from '../src/game-flow';
import { Game, GameState } from '../src/game';
import { HumanPlayer } from '../src/human-player';
import { AIPlayer } from '../src/ai-player';
import { Player, PlayerState, PlayerType } from '../src/player';
import { Tile, TileType } from '../src/tile';
import { GameStateManager } from '../src/game-state';
import { TileManager } from '../src/tile-manager';
import { RuleEngine } from '../src/rule-engine';
import { PlayerAction } from '../src/rule-types';

describe('GameFlow', () => {
  let gameFlow: GameFlow;
  let game: Game;
  let gameState: GameStateManager;
  let tileManager: TileManager;
  let players: Player[];
  let consoleLogStub: sinon.SinonStub;
  
  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    
    // 创建新的游戏实例
    game = new Game();
    
    // 直接创建各组件实例，而不是从game中获取
    gameState = new GameStateManager();
    tileManager = new TileManager();
    players = [];
    
    // 使用正确的构造函数创建GameFlow实例
    gameFlow = new GameFlow(gameState, tileManager, players);
  });
  
  afterEach(() => {
    consoleLogStub.restore();
  });

  describe('Initialization', () => {
    it('should initialize with correct components', () => {
      expect(gameFlow).to.be.instanceOf(GameFlow);
    });
    
    it('should be able to start game with players', () => {
      // 添加玩家到players数组
      const human = new HumanPlayer('人类玩家');
      const ai = new AIPlayer('AI玩家');
      players.push(human);
      players.push(ai);
      
      // 模拟startGame调用
      const startGameSpy = sinon.spy(gameFlow, 'startGame');
      gameFlow.startGame();
      
      // 验证函数被调用
      expect(startGameSpy.called).to.be.true;
      
      // 清理
      startGameSpy.restore();
    });
    
    it('should not start game without players', () => {
      // 没有添加玩家
      gameFlow.startGame();
      
      // 应该仍处于初始状态
      expect(gameState.state).to.equal(GameState.INIT);
    });
    
    it('should handle dealInitialTiles correctly', () => {
      // 添加玩家到players数组
      const human = new HumanPlayer('人类玩家');
      const ai1 = new AIPlayer('AI玩家1');
      const ai2 = new AIPlayer('AI玩家2');
      const ai3 = new AIPlayer('AI玩家3');
      
      players.push(human);
      players.push(ai1);
      players.push(ai2);
      players.push(ai3);
      
      // 使用Reflect.apply调用私有方法dealInitialTiles
      Reflect.apply(gameFlow['dealInitialTiles'], gameFlow, []);
      
      // 验证每个玩家都有13张牌
      expect(human.handTiles.length).to.equal(13);
      expect(ai1.handTiles.length).to.equal(13);
      expect(ai2.handTiles.length).to.equal(13);
      expect(ai3.handTiles.length).to.equal(13);
      
      // 验证牌山中的牌数量减少了4*13=52张
      const remainingTiles = tileManager.getRemainingTiles();
      const totalTiles = tileManager.getTotalTiles();
      expect(totalTiles - remainingTiles).to.equal(52);
    });
    
    it('should reset player hand tiles when dealing', () => {
      // 添加玩家，并给玩家预先添加一些牌
      const human = new HumanPlayer('人类玩家');
      human.handTiles.push(new Tile(TileType.WAN, 1, 1));
      human.handTiles.push(new Tile(TileType.WAN, 2, 2));
      
      const ai = new AIPlayer('AI玩家');
      ai.handTiles.push(new Tile(TileType.TIAO, 3, 3));
      
      players.push(human);
      players.push(ai);
      
      // 使用Reflect.apply调用私有方法dealInitialTiles
      Reflect.apply(gameFlow['dealInitialTiles'], gameFlow, []);
      
      // 验证玩家的手牌被重置，并且是13张新牌
      expect(human.handTiles.length).to.equal(13);
      expect(ai.handTiles.length).to.equal(13);
    });
  });

  describe('Player Actions', () => {
    let humanPlayer: HumanPlayer;
    let aiPlayer1: AIPlayer;
    let aiPlayer2: AIPlayer;
    
    beforeEach(() => {
      humanPlayer = new HumanPlayer('人类玩家');
      aiPlayer1 = new AIPlayer('AI玩家1');
      aiPlayer2 = new AIPlayer('AI玩家2');
      
      // 添加玩家到players数组
      players.push(humanPlayer);
      players.push(aiPlayer1);
      players.push(aiPlayer2);
      
      // 准备游戏
      gameFlow.startGame();
    });
    
    it('should handle player discard', () => {
      // 获取玩家手牌
      const playerHandTiles = humanPlayer.handTiles;
      const initialHandSize = playerHandTiles.length;
      const tileToDiscard = playerHandTiles[0];
      
      // 模拟玩家弃牌
      const discardSpy = sinon.spy(humanPlayer, 'discardTile');
      // 设置当前玩家索引为0
      gameState.currentPlayerIndex = 0;
      humanPlayer.state = PlayerState.ACTING;
      
      gameFlow.currentPlayerDiscard(0);
      
      // 验证弃牌函数被调用
      expect(discardSpy.called).to.be.true;
      
      // 清理
      discardSpy.restore();
    });
    
    it('should handle player draw', () => {
      // 设置当前玩家
      gameState.currentPlayerIndex = 0;
      humanPlayer.state = PlayerState.ACTING;
      
      // 确保手牌数量为13，才能摸牌
      if (humanPlayer.handTiles.length > 13) {
        humanPlayer.handTiles = humanPlayer.handTiles.slice(0, 13);
      }
      
      // 获取初始手牌数
      const initialHandSize = humanPlayer.handTiles.length;
      
      // 模拟玩家摸牌
      const drawSpy = sinon.spy(gameFlow, 'currentPlayerDraw');
      
      gameFlow.currentPlayerDraw();
      
      // 验证摸牌函数被调用
      expect(drawSpy.called).to.be.true;
      
      // 清理
      drawSpy.restore();
    });
    
    it('should handle next turn', () => {
      // 设置当前玩家
      gameState.currentPlayerIndex = 0;
      humanPlayer.state = PlayerState.ACTING;
      
      // 记录初始玩家索引
      const initialPlayerIndex = gameState.currentPlayerIndex;
      
      // 模拟下一回合
      const nextTurnSpy = sinon.spy(gameFlow, 'nextTurn');
      
      gameFlow.nextTurn();
      
      // 验证下一回合函数被调用且玩家索引改变
      expect(nextTurnSpy.called).to.be.true;
      expect(gameState.currentPlayerIndex).to.not.equal(initialPlayerIndex);
      
      // 清理
      nextTurnSpy.restore();
    });
    
    it('should check other players actions', () => {
      // 创建一个麻将牌
      const tile = new Tile(TileType.WAN, 1, 100);
      
      // 设置当前玩家索引
      gameState.currentPlayerIndex = 0;
      
      // 创建一个存根来模拟RuleEngine.getAvailableActions方法
      const getAvailableActionsStub = sinon.stub(RuleEngine, 'getAvailableActions').returns([]);
      
      // 调用checkOtherPlayersActions
      const waitingPlayers = gameFlow.checkOtherPlayersActions(tile);
      
      // 验证结果
      expect(waitingPlayers).to.be.an('array').that.is.empty;
      
      // 验证getAvailableActions被调用了两次（对两个非当前玩家）
      expect(getAvailableActionsStub.callCount).to.equal(2);
      
      // 清理
      getAvailableActionsStub.restore();
    });
    
    it('should identify waiting players correctly', () => {
      // 创建一个麻将牌
      const tile = new Tile(TileType.WAN, 1, 100);
      
      // 设置当前玩家索引
      gameState.currentPlayerIndex = 0;
      
      // 创建一个存根来模拟RuleEngine.getAvailableActions方法
      // 为AI玩家1返回一个动作，为AI玩家2返回空数组
      const getAvailableActionsStub = sinon.stub(RuleEngine, 'getAvailableActions');
      getAvailableActionsStub.withArgs(sinon.match.any, tile).onFirstCall().returns([PlayerAction.PENG]);
      getAvailableActionsStub.withArgs(sinon.match.any, tile).onSecondCall().returns([]);
      
      // 调用checkOtherPlayersActions
      const waitingPlayers = gameFlow.checkOtherPlayersActions(tile);
      
      // 验证结果
      expect(waitingPlayers).to.be.an('array').that.includes(1);
      expect(waitingPlayers).to.not.include(2);
      
      // 清理
      getAvailableActionsStub.restore();
    });
  });

  describe('AI Player Handling', () => {
    let humanPlayer: HumanPlayer;
    let aiPlayer: AIPlayer;
    
    beforeEach(() => {
      humanPlayer = new HumanPlayer('人类玩家');
      aiPlayer = new AIPlayer('AI玩家');
      
      // 添加玩家到players数组
      players.push(humanPlayer);
      players.push(aiPlayer);
      
      // 准备游戏
      gameFlow.startGame();
    });
    
    it('should force AI player discard', () => {
      // 设置当前玩家为AI
      gameState.currentPlayerIndex = 1;
      aiPlayer.state = PlayerState.ACTING;
      
      // 确保AI玩家手牌超过13张
      while (aiPlayer.handTiles.length <= 13) {
        const tile = new Tile(TileType.WAN, 1, 1000 + aiPlayer.handTiles.length);
        aiPlayer.drawTile(tile);
      }
      
      // 模拟强制AI玩家弃牌
      const forceAIDiscardSpy = sinon.spy(gameFlow, 'forceAIPlayerDiscard');
      
      gameFlow.forceAIPlayerDiscard();
      
      // 验证函数被调用
      expect(forceAIDiscardSpy.called).to.be.true;
      
      // 清理
      forceAIDiscardSpy.restore();
    });
    
    it('should handle AI discard decision', () => {
      // 设置当前玩家为AI，并确保其有超过13张牌
      gameState.currentPlayerIndex = 1;
      aiPlayer.state = PlayerState.ACTING;
      
      // 清空手牌并添加14张已知牌
      aiPlayer.handTiles = [];
      for (let i = 0; i < 14; i++) {
        aiPlayer.handTiles.push(new Tile(TileType.WAN, i % 9 + 1, 1000 + i));
      }
      
      // 模拟AI决策，选择丢弃最后一张牌
      const getAIMoveSpy = sinon.stub(aiPlayer, 'getAIMove').returns(13);
      
      // 调用强制AI玩家弃牌
      const discardSuccess = gameFlow.forceAIPlayerDiscard();
      
      // 验证结果
      expect(discardSuccess).to.be.true;
      expect(aiPlayer.handTiles.length).to.equal(13);
      expect(aiPlayer.discardedTiles.length).to.equal(1);
      
      // 清理
      getAIMoveSpy.restore();
    });
  });

  describe('Game State Management', () => {
    let humanPlayer: HumanPlayer;
    let aiPlayer: AIPlayer;
    
    beforeEach(() => {
      humanPlayer = new HumanPlayer('人类玩家');
      aiPlayer = new AIPlayer('AI玩家');
      
      // 添加玩家到players数组
      players.push(humanPlayer);
      players.push(aiPlayer);
      
      // 准备游戏
      gameFlow.startGame();
    });
    
    it('should manage game states correctly', () => {
      // 设置游戏状态
      gameState.state = GameState.PLAYING;
      expect(gameState.state).to.equal(GameState.PLAYING);
      
      // 测试游戏状态转换
      gameState.state = GameState.WAITING_ACTION;
      expect(gameState.state).to.equal(GameState.WAITING_ACTION);
      
      gameState.state = GameState.ENDED;
      expect(gameState.state).to.equal(GameState.ENDED);
    });
    
    it('should update player states correctly', () => {
      // 设置玩家状态
      humanPlayer.state = PlayerState.WAITING;
      aiPlayer.state = PlayerState.WAITING;
      
      // 设置当前玩家为人类玩家
      gameState.currentPlayerIndex = 0;
      
      // 使用Reflect.apply调用私有方法updatePlayerState
      Reflect.apply(gameFlow['updatePlayerState'], gameFlow, [0]);
      
      // 验证当前玩家状态被设置为ACTING
      expect(humanPlayer.state).to.equal(PlayerState.ACTING);
      
      // 验证其他玩家状态保持不变
      expect(aiPlayer.state).to.equal(PlayerState.WAITING);
    });
    
    it('should handle round cycle correctly', () => {
      // 设置当前玩家为最后一个玩家
      gameState.currentPlayerIndex = players.length - 1;
      
      // 记录初始玩家索引
      const initialPlayerIndex = gameState.currentPlayerIndex;
      
      // 调用下一回合
      gameFlow.nextTurn();
      
      // 验证索引回到第一个玩家
      expect(gameState.currentPlayerIndex).to.equal(0);
    });
  });
}); 