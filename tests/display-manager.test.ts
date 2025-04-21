import { expect } from 'chai';
import * as sinon from 'sinon';
import { DisplayManager, displayManager } from '../src/display-manager';
import { Player, PlayerType } from '../src/player';
import { Tile, TileType } from '../src/tile';
import { GameState } from '../src/game';
import { Style } from '../src/display';

describe('DisplayManager', () => {
  let consoleLogStub: sinon.SinonStub;
  let stdoutWriteStub: sinon.SinonStub;
  
  beforeEach(() => {
    // 存根 console.log 以防止测试输出
    consoleLogStub = sinon.stub(console, 'log');
    
    // 存根 process.stdout.write
    stdoutWriteStub = sinon.stub(process.stdout, 'write');
  });
  
  afterEach(() => {
    // 恢复原始函数
    consoleLogStub.restore();
    stdoutWriteStub.restore();
  });
  
  describe('单例模式', () => {
    it('getInstance应该始终返回同一个实例', () => {
      const instance1 = DisplayManager.getInstance();
      const instance2 = DisplayManager.getInstance();
      
      expect(instance1).to.equal(instance2);
    });
    
    it('应提供一个导出的单例实例', () => {
      expect(displayManager).to.equal(DisplayManager.getInstance());
    });
  });
  
  describe('基础UI输出方法', () => {
    it('print应调用console.log', () => {
      displayManager.print('测试消息');
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.equal('测试消息');
    });
    
    it('printColored应打印带有样式的消息', () => {
      displayManager.printColored('彩色消息', '\x1b[32m'); // 绿色
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('彩色消息');
      expect(consoleLogStub.firstCall.args[0]).to.include('\x1b[32m');
    });
    
    it('printTitle应打印标题', () => {
      displayManager.printTitle('测试标题');
      expect(consoleLogStub.callCount).to.equal(3); // 应打印三行
    });
    
    it('printDivider应打印分隔线', () => {
      displayManager.printDivider('-', 10);
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('----------');
    });
  });
  
  describe('特殊消息类型', () => {
    it('printPrompt应打印提示消息', () => {
      displayManager.printPrompt('测试提示');
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('测试提示');
    });
    
    it('printActionPrompt应打印操作提示', () => {
      displayManager.printActionPrompt('测试操作');
      expect(consoleLogStub.callCount).to.equal(2); // 应打印两行
    });
    
    it('printError应打印错误消息', () => {
      // 调用错误打印函数
      displayManager.printError('测试错误', false); // 不记录到日志文件
      
      // 验证console.log被调用
      expect(consoleLogStub.calledOnce).to.be.true;
      
      // 验证错误消息格式
      const loggedMessage = consoleLogStub.firstCall.args[0];
      expect(loggedMessage).to.include(Style.RED);
      expect(loggedMessage).to.include('错误:');
      expect(loggedMessage).to.include('测试错误');
    });
    
    it('printWarning应打印警告消息', () => {
      // 调用警告打印函数
      displayManager.printWarning('测试警告', false); // 不记录到日志文件
      
      // 验证console.log被调用
      expect(consoleLogStub.calledOnce).to.be.true;
      
      // 验证警告消息格式
      const loggedMessage = consoleLogStub.firstCall.args[0];
      expect(loggedMessage).to.include(Style.YELLOW);
      expect(loggedMessage).to.include('警告:');
      expect(loggedMessage).to.include('测试警告');
    });
    
    it('printSuccess应打印成功消息', () => {
      displayManager.printSuccess('测试成功', false); // 不记录到日志文件
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('✓');
      expect(consoleLogStub.firstCall.args[0]).to.include('测试成功');
    });
    
    it('displayImportantEvent应打印重要事件信息', () => {
      displayManager.displayImportantEvent('重要事件', false); // 不记录到日志文件
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('>>>');
      expect(consoleLogStub.firstCall.args[0]).to.include('重要事件');
    });
  });
  
  describe('回合日志管理', () => {
    beforeEach(() => {
      // 每个测试前清空回合日志
      displayManager.clearTurnLog();
    });
    
    it('addToTurnLog应添加回合日志', () => {
      displayManager.addToTurnLog('测试日志1');
      displayManager.addToTurnLog('测试日志2');
      
      const logs = displayManager.getTurnLogs();
      expect(logs).to.deep.equal(['测试日志1', '测试日志2']);
    });
    
    it('displayTurnLog应显示所有回合日志', () => {
      displayManager.addToTurnLog('测试日志1');
      displayManager.addToTurnLog('测试日志2');
      
      displayManager.displayTurnLog();
      expect(consoleLogStub.callCount).to.be.at.least(3); // 标题和至少两条日志
    });
    
    it('clearTurnLog应清空回合日志', () => {
      displayManager.addToTurnLog('测试日志');
      displayManager.clearTurnLog();
      
      const logs = displayManager.getTurnLogs();
      expect(logs).to.be.an('array').that.is.empty;
    });
    
    it('getTurnLogs应返回所有回合日志的副本', () => {
      displayManager.addToTurnLog('测试日志');
      
      const logs = displayManager.getTurnLogs();
      expect(logs).to.deep.equal(['测试日志']);
      
      // 修改返回的数组不应影响内部存储
      logs.push('新日志');
      const updatedLogs = displayManager.getTurnLogs();
      expect(updatedLogs).to.deep.equal(['测试日志']);
    });
  });
  
  describe('游戏状态显示方法', () => {
    let testPlayer: Player;
    
    beforeEach(() => {
      testPlayer = new Player(1, '测试玩家', PlayerType.HUMAN);
      
      // 给玩家添加一些牌
      testPlayer.handTiles.push(new Tile(TileType.WAN, 1, 1));
      testPlayer.handTiles.push(new Tile(TileType.WAN, 2, 2));
      testPlayer.discardedTiles.push(new Tile(TileType.TIAO, 3, 3));
      
      // 设置最后摸到的牌
      testPlayer.lastDrawnTile = new Tile(TileType.WAN, 2, 2);
    });
    
    it('displayPlayerHand应显示玩家手牌', () => {
      displayManager.displayPlayerHand(testPlayer);
      expect(consoleLogStub.callCount).to.be.greaterThan(1);
    });
    
    it('displayHand应显示简版手牌', () => {
      displayManager.displayHand(testPlayer);
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('测试玩家的手牌');
    });
    
    it('displayDiscardedTiles应显示玩家弃牌', () => {
      displayManager.displayDiscardedTiles(testPlayer);
      expect(consoleLogStub.calledOnce).to.be.true;
      expect(consoleLogStub.firstCall.args[0]).to.include('测试玩家的弃牌');
    });
    
    it('displayGameState应显示游戏状态', () => {
      const tile = new Tile(TileType.WAN, 1, 1);
      displayManager.displayGameState('测试玩家', 100, tile, GameState.PLAYING);
      
      expect(consoleLogStub.callCount).to.be.greaterThan(3);
      // 检查是否包含状态信息，但不检查确切的调用
      expect(consoleLogStub.args.some(args => args[0].includes('当前玩家: 测试玩家'))).to.be.true;
    });
  });
}); 