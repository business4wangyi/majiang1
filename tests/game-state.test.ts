import { expect } from 'chai';
import * as sinon from 'sinon';
import { GameStateManager, GameState, PendingAction } from '../src/game-state';
import { Tile, TileType } from '../src/tile';
import { PlayerAction } from '../src/rule-types';

describe('GameStateManager', () => {
  let gameState: GameStateManager;
  
  beforeEach(() => {
    // 在每个测试前创建一个新的GameStateManager实例
    gameState = new GameStateManager();
  });
  
  describe('初始化', () => {
    it('应该具有正确的初始状态', () => {
      expect(gameState.state).to.equal(GameState.INIT);
      expect(gameState.currentPlayerIndex).to.equal(0);
      expect(gameState.lastDiscardedTile).to.be.null;
      expect(gameState.pendingAction).to.be.null;
      expect(gameState.bankerIndex).to.equal(0);
      expect(gameState.windRound).to.equal(0);
      expect(gameState.drawCount).to.equal(0);
      expect(gameState.lastDrawCount).to.equal(0);
    });
  });
  
  describe('游戏状态管理', () => {
    it('setState应该正确设置游戏状态', () => {
      // 测试设置为PLAYING状态
      gameState.setState(GameState.PLAYING);
      expect(gameState.state).to.equal(GameState.PLAYING);
      
      // 测试设置为WAITING_ACTION状态
      gameState.setState(GameState.WAITING_ACTION);
      expect(gameState.state).to.equal(GameState.WAITING_ACTION);
      
      // 测试设置为DEALING状态
      gameState.setState(GameState.DEALING);
      expect(gameState.state).to.equal(GameState.DEALING);
      
      // 测试设置为ENDED状态
      gameState.setState(GameState.ENDED);
      expect(gameState.state).to.equal(GameState.ENDED);
    });
  });
  
  describe('玩家管理', () => {
    it('setCurrentPlayerIndex应该正确设置当前玩家索引', () => {
      // 测试设置为0
      gameState.setCurrentPlayerIndex(0);
      expect(gameState.currentPlayerIndex).to.equal(0);
      
      // 测试设置为1
      gameState.setCurrentPlayerIndex(1);
      expect(gameState.currentPlayerIndex).to.equal(1);
      
      // 测试设置为3
      gameState.setCurrentPlayerIndex(3);
      expect(gameState.currentPlayerIndex).to.equal(3);
    });
  });
  
  describe('最后打出的牌管理', () => {
    it('setLastDiscardedTile应该正确设置最后打出的牌', () => {
      // 测试设置为null
      gameState.setLastDiscardedTile(null);
      expect(gameState.lastDiscardedTile).to.be.null;
      
      // 测试设置为一张特定的牌
      const tile = new Tile(TileType.WAN, 1, 100);
      gameState.setLastDiscardedTile(tile);
      expect(gameState.lastDiscardedTile).to.deep.equal(tile);
      
      // 测试设置为另一张牌
      const anotherTile = new Tile(TileType.TIAO, 5, 200);
      gameState.setLastDiscardedTile(anotherTile);
      expect(gameState.lastDiscardedTile).to.deep.equal(anotherTile);
    });
  });
  
  describe('待处理动作管理', () => {
    it('setPendingAction应该正确设置待处理动作', () => {
      // 测试设置为null
      gameState.setPendingAction(null);
      expect(gameState.pendingAction).to.be.null;
      
      // 测试设置为一个特定的待处理动作
      const pendingAction: PendingAction = {
        tile: new Tile(TileType.WAN, 1, 300),
        fromPlayerId: 0,
        allowedActions: [PlayerAction.CHI, PlayerAction.PENG],
        waitingPlayers: [1, 2]
      };
      gameState.setPendingAction(pendingAction);
      expect(gameState.pendingAction).to.deep.equal(pendingAction);
    });
  });
  
  describe('摸牌计数管理', () => {
    it('incrementDrawCount应该增加摸牌计数', () => {
      // 初始值应该是0
      expect(gameState.drawCount).to.equal(0);
      
      // 增加一次
      gameState.incrementDrawCount();
      expect(gameState.drawCount).to.equal(1);
      
      // 再增加两次
      gameState.incrementDrawCount();
      gameState.incrementDrawCount();
      expect(gameState.drawCount).to.equal(3);
    });
    
    it('resetDrawCount应该重置摸牌计数', () => {
      // 先增加几次
      gameState.incrementDrawCount();
      gameState.incrementDrawCount();
      expect(gameState.drawCount).to.equal(2);
      
      // 然后重置
      gameState.resetDrawCount();
      expect(gameState.drawCount).to.equal(0);
    });
    
    it('setLastDrawCount应该设置最后一次摸牌计数', () => {
      // 设置为5
      gameState.setLastDrawCount(5);
      expect(gameState.lastDrawCount).to.equal(5);
      
      // 设置为10
      gameState.setLastDrawCount(10);
      expect(gameState.lastDrawCount).to.equal(10);
    });
  });
  
  describe('复合测试', () => {
    it('应该能够正确管理游戏状态的完整转换', () => {
      // 初始化
      expect(gameState.state).to.equal(GameState.INIT);
      
      // 发牌阶段
      gameState.setState(GameState.DEALING);
      expect(gameState.state).to.equal(GameState.DEALING);
      
      // 游戏中
      gameState.setState(GameState.PLAYING);
      expect(gameState.state).to.equal(GameState.PLAYING);
      
      // 设置当前玩家
      gameState.setCurrentPlayerIndex(1);
      expect(gameState.currentPlayerIndex).to.equal(1);
      
      // 摸牌几次
      gameState.incrementDrawCount();
      gameState.incrementDrawCount();
      expect(gameState.drawCount).to.equal(2);
      
      // 设置最后打出的牌
      const tile = new Tile(TileType.WAN, 3, 123);
      gameState.setLastDiscardedTile(tile);
      expect(gameState.lastDiscardedTile).to.deep.equal(tile);
      
      // 等待动作
      gameState.setState(GameState.WAITING_ACTION);
      expect(gameState.state).to.equal(GameState.WAITING_ACTION);
      
      // 设置待处理动作
      const pendingAction: PendingAction = {
        tile: tile,
        fromPlayerId: 1,
        allowedActions: [PlayerAction.PENG],
        waitingPlayers: [2]
      };
      gameState.setPendingAction(pendingAction);
      expect(gameState.pendingAction).to.deep.equal(pendingAction);
      
      // 回到游戏中
      gameState.setState(GameState.PLAYING);
      expect(gameState.state).to.equal(GameState.PLAYING);
      
      // 清除待处理动作
      gameState.setPendingAction(null);
      expect(gameState.pendingAction).to.be.null;
      
      // 游戏结束
      gameState.setState(GameState.ENDED);
      expect(gameState.state).to.equal(GameState.ENDED);
    });
  });
}); 