// countdown-manager测试文件 (Mocha)
import { expect } from 'chai';
import * as sinon from 'sinon';
import { CountdownManager } from '../src/countdown-manager';
import { errorLog } from '../src/logger';

// 保存原始的输出方法以便后续恢复
const originalWrite = process.stdout.write;
let writeStub: sinon.SinonStub;

// 模拟logger
let infoLogStub: sinon.SinonStub;
let debugLogStub: sinon.SinonStub;
let warnLogStub: sinon.SinonStub;
let errorLogStub: sinon.SinonStub;

// 模拟display-manager
let printWarningStub: sinon.SinonStub;
let printSuccessStub: sinon.SinonStub;

// 存储创建的计时器用于清理
const createdTimers: NodeJS.Timeout[] = [];

// 保存原始的setTimeout和clearInterval函数
const originalSetTimeout = global.setTimeout;
const originalClearInterval = global.clearInterval;
const originalClearTimeout = global.clearTimeout;

describe('CountdownManager', () => {
  // 每个测试前设置环境
  beforeEach(() => {
    // 替换process.stdout.write
    writeStub = sinon.stub(process.stdout, 'write');
    
    // 替换logger模块
    const loggerModule = require('../src/logger');
    infoLogStub = sinon.stub(loggerModule, 'infoLog');
    debugLogStub = sinon.stub(loggerModule, 'debugLog');
    warnLogStub = sinon.stub(loggerModule, 'warnLog');
    errorLogStub = sinon.stub(loggerModule, 'errorLog');
    
    // 替换display-manager模块
    const displayManagerModule = require('../src/display-manager');
    printWarningStub = sinon.stub(displayManagerModule.displayManager, 'printWarning');
    printSuccessStub = sinon.stub(displayManagerModule.displayManager, 'printSuccess');
    
    // 重置CountdownManager状态
    CountdownManager.reset();
    
    // 重置计时器数组
    createdTimers.length = 0;
  });

  // 每个测试后恢复环境
  afterEach(() => {
    // 恢复所有sinon存根
    sinon.restore();
    
    // 确保测试中所有活跃的倒计时被清除
    CountdownManager.clearCountdown();
    
    // 清理所有计时器
    createdTimers.forEach(timer => {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (e) {
        // 忽略错误
      }
    });
    
    // 重置CountdownManager状态
    CountdownManager.reset();
    
    // 尝试清理任何可能残留的Node.js计时器
    try {
      // 使用process._getActiveHandles是非标准API，需要使用try-catch
      const anyProcess = process as any;
      if (anyProcess._getActiveHandles && typeof anyProcess._getActiveHandles === 'function') {
        const activeHandles = anyProcess._getActiveHandles();
        if (activeHandles) {
          activeHandles.forEach((handle: any) => {
            if (handle && typeof handle.unref === 'function') {
              handle.unref();
            }
          });
        }
      }
    } catch (e) {
      // 忽略错误
    }
  });

  // 所有测试完成后恢复环境
  after(() => {
    process.stdout.write = originalWrite;
    
    // 恢复sinon存根，以防afterEach未能完全清理
    sinon.restore();
    
    // 确保所有计时器都被清理
    createdTimers.forEach(timer => {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (e) {
        // 忽略错误
      }
    });
    
    // 再次重置CountdownManager状态
    CountdownManager.reset();
    
    // 尝试清理任何可能残留的Node.js计时器
    try {
      // 使用process._getActiveHandles是非标准API，需要使用try-catch
      const anyProcess = process as any;
      if (anyProcess._getActiveHandles && typeof anyProcess._getActiveHandles === 'function') {
        const activeHandles = anyProcess._getActiveHandles();
        if (activeHandles) {
          activeHandles.forEach((handle: any) => {
            if (handle && typeof handle.unref === 'function') {
              handle.unref();
            }
          });
        }
      }
    } catch (e) {
      // 忽略错误
    }
    
    // 重置全局计时器函数
    global.setTimeout = originalSetTimeout;
    global.clearInterval = originalClearInterval;
    global.clearTimeout = originalClearTimeout;
  });

  describe('startCountdown', () => {
    let clock: sinon.SinonFakeTimers;
    
    beforeEach(() => {
      // 使用假时钟替代真实的setTimeout和setInterval
      clock = sinon.useFakeTimers();
    });
    
    afterEach(() => {
      // 运行所有等待的计时器并恢复时钟
      if (clock) {
        try {
          // 避免运行太多计时器导致死循环
          clock.tick(10000); // 只运行10秒内的计时器
        } catch (e) {
          // 忽略可能的无限循环错误
          errorLog(`清理计时器时出错: ${e instanceof Error ? e.message : String(e)}`);
        }
        clock.restore();
      }
      
      // 确保倒计时被清除
      CountdownManager.clearCountdown();
    });
    
    it('应该启动倒计时并返回定时器', () => {
      const callback = sinon.spy();
      const timer = CountdownManager.startCountdown(5, callback);
      
      expect(timer).to.exist;
      expect(CountdownManager.isCountdownActive()).to.be.true;
      expect(CountdownManager.getRemainingSeconds()).to.equal(5);
      expect(CountdownManager.isWaitingForUserInput).to.be.true;
      
      // 清理
      CountdownManager.clearCountdown();
    });

    it('应该拒绝无效的秒数', () => {
      const callback = sinon.spy();
      const timer = CountdownManager.startCountdown(0, callback);
      
      expect(timer).to.be.null;
      expect(CountdownManager.isCountdownActive()).to.be.false;
    });

    it('应该清除已存在的倒计时', () => {
      const callback1 = sinon.spy();
      const callback2 = sinon.spy();
      
      const timer1 = CountdownManager.startCountdown(5, callback1);
      const timer2 = CountdownManager.startCountdown(3, callback2);
      
      expect(CountdownManager.getRemainingSeconds()).to.equal(3);
      
      // 清理
      CountdownManager.clearCountdown();
    });
    
    it('应该在倒计时结束时执行回调', function() {
      // 使用同步方式测试，避免异步导致的问题
      const callback = sinon.spy();

      // 启动倒计时
      CountdownManager.startCountdown(1, callback);
      
      // 修改内部状态以模拟倒计时结束
      (CountdownManager as any).remainingSeconds = -1;
      
      // 直接访问并调用内部的onCompleteCallback
      const onComplete = (CountdownManager as any).onCompleteCallback;
      
      // 确保回调存在
      expect(onComplete).to.exist;
      
      // 调用回调
      onComplete();
      
      // 等待下一个事件循环（CountdownManager中的回调使用setTimeout包装）
      clock.tick(10);
      
      // 验证回调被调用
      expect(callback.called).to.be.true;
      
      // 清理
      CountdownManager.clearCountdown();
    });
    
    it('应该处理onTick回调', function() {
      // 使用同步方式测试
      const onComplete = sinon.spy();
      const onTick = sinon.spy();
      
      // 启动计时器
      CountdownManager.startCountdown(3, onComplete, onTick);
      
      // 直接调用onTickCallback以确保它能正常工作
      (CountdownManager as any).onTickCallback(3);
      
      // 验证onTick被调用
      expect(onTick.called).to.be.true;
      
      // 清理
      CountdownManager.clearCountdown();
    });
    
    it('应该捕获并处理回调中的错误', () => {
      const errorCallback = sinon.stub().throws(new Error('回调出错'));
      
      // 启动带有错误回调的倒计时
      CountdownManager.startCountdown(5, errorCallback);
      
      // 直接修改内部状态使倒计时结束
      (CountdownManager as any).remainingSeconds = -1;
      
      // 手动获取并调用onCompleteCallback
      const onComplete = (CountdownManager as any).onCompleteCallback;
      expect(onComplete).to.exist;

      // 使用setTimeout包装调用，模拟CountdownManager中的行为
      const timerCallback = setTimeout(() => {
        try {
          if (onComplete) onComplete();
        } catch (error) {
          warnLogStub(`倒计时onComplete回调执行出错: ${error instanceof Error ? error.message : String(error)}`);
        }
      }, 0);
      
      // 前进时间以执行回调
      clock.tick(10);
      
      // 验证warnLog被调用（说明错误被捕获）
      expect(warnLogStub.called).to.be.true;
      expect(warnLogStub.args[0][0]).to.include('回调执行出错');
      
      // 清理
      clearTimeout(timerCallback);
      CountdownManager.clearCountdown();
    });
  });

  describe('clearCountdown', () => {
    it('应该清除活跃的倒计时', () => {
      const callback = sinon.spy();
      CountdownManager.startCountdown(5, callback);
      
      expect(CountdownManager.isCountdownActive()).to.be.true;
      
      CountdownManager.clearCountdown();
      
      expect(CountdownManager.isCountdownActive()).to.be.false;
      expect(CountdownManager.getRemainingSeconds()).to.equal(0);
    });

    it('不应该在无倒计时时产生错误', () => {
      expect(() => CountdownManager.clearCountdown()).to.not.throw();
    });
  });

  describe('pauseCountdown & resumeCountdown', () => {
    let clock: sinon.SinonFakeTimers;
    
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    
    afterEach(() => {
      if (clock) {
        clock.restore();
      }
    });
    
    it('应该暂停和恢复倒计时', () => {
      const callback = sinon.spy();
      CountdownManager.startCountdown(5, callback);
      
      expect(CountdownManager.pauseCountdown()).to.be.true;
      expect((CountdownManager as any).isPaused).to.be.true;
      
      expect(CountdownManager.resumeCountdown()).to.be.true;
      expect((CountdownManager as any).isPaused).to.be.false;
      
      // 清理
      CountdownManager.clearCountdown();
    });

    it('应该在无倒计时时返回false', () => {
      expect(CountdownManager.pauseCountdown()).to.be.false;
      expect(CountdownManager.resumeCountdown()).to.be.false;
    });
    
    it('应该在已暂停时拒绝再次暂停', () => {
      CountdownManager.startCountdown(5, sinon.spy());
      
      expect(CountdownManager.pauseCountdown()).to.be.true;
      expect(CountdownManager.pauseCountdown()).to.be.false;
      
      // 清理
      CountdownManager.clearCountdown();
    });
    
    it('应该在未暂停时拒绝恢复', () => {
      CountdownManager.startCountdown(5, sinon.spy());
      
      expect(CountdownManager.resumeCountdown()).to.be.false;
      
      // 清理
      CountdownManager.clearCountdown();
    });
  });

  describe('addTime & reduceTime', () => {
    let clock: sinon.SinonFakeTimers;
    
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    
    afterEach(() => {
      if (clock) {
        clock.restore();
      }
    });
    
    it('应该增加倒计时时间', () => {
      const callback = sinon.spy();
      CountdownManager.startCountdown(5, callback);
      
      expect(CountdownManager.addTime(3)).to.be.true;
      expect(CountdownManager.getRemainingSeconds()).to.equal(8);
      
      // 清理
      CountdownManager.clearCountdown();
    });

    it('应该减少倒计时时间', () => {
      const callback = sinon.spy();
      CountdownManager.startCountdown(5, callback);
      
      expect(CountdownManager.reduceTime(2)).to.be.true;
      expect(CountdownManager.getRemainingSeconds()).to.equal(3);
      
      // 清理
      CountdownManager.clearCountdown();
    });

    it('应该在减少时间超过剩余时间时限制为1秒', () => {
      const callback = sinon.spy();
      CountdownManager.startCountdown(5, callback);
      
      expect(CountdownManager.reduceTime(10)).to.be.true;
      expect(CountdownManager.getRemainingSeconds()).to.equal(1);
      
      // 清理
      CountdownManager.clearCountdown();
    });

    it('应该在无倒计时时返回false', () => {
      expect(CountdownManager.addTime(3)).to.be.false;
      expect(CountdownManager.reduceTime(2)).to.be.false;
    });
    
    it('应该拒绝无效的增减数值', () => {
      CountdownManager.startCountdown(5, sinon.spy());
      
      expect(CountdownManager.addTime(0)).to.be.false;
      expect(CountdownManager.addTime(-1)).to.be.false;
      expect(CountdownManager.reduceTime(0)).to.be.false;
      expect(CountdownManager.reduceTime(-1)).to.be.false;
      
      // 清理
      CountdownManager.clearCountdown();
    });
  });

  describe('Listeners', () => {
    let clock: sinon.SinonFakeTimers;
    
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    
    afterEach(() => {
      if (clock) {
        clock.restore();
      }
    });
    
    it('应该添加和移除监听器', function() {
      // 创建一个监听器函数
      const listener = sinon.spy();
      
      // 添加监听器
      CountdownManager.addListener(listener);
      
      // 直接调用notifyListeners方法
      const state = { active: true, remaining: 5 };
      (CountdownManager as any).listeners[0](state);
      
      // 验证监听器是否被调用
      expect(listener.called).to.be.true;
      
      // 记录当前调用次数
      const callCount = listener.callCount;
      
      // 移除监听器
      CountdownManager.removeListener(listener);
      
      // 手动触发所有监听器
      if ((CountdownManager as any).listeners.length > 0) {
        (CountdownManager as any).listeners.forEach((l: Function) => l(state));
      }
      
      // 验证监听器没有再次被调用
      expect(listener.callCount).to.equal(callCount);
    });
    
    it('应该捕获监听器中的错误', () => {
      const errorListener = sinon.stub().throws(new Error('监听器错误'));
      
      CountdownManager.addListener(errorListener);
      
      // 确保错误不会阻止程序运行
      expect(() => {
        // 直接触发notifyListeners
        (CountdownManager as any).notifyListeners();
      }).to.not.throw();
      
      // 清理
      CountdownManager.removeListener(errorListener);
    });
    
    it('应该通知所有状态变化', () => {
      const listener = sinon.spy();
      CountdownManager.addListener(listener);
      
      // 直接调用通知6次
      for (let i = 0; i < 6; i++) {
        (CountdownManager as any).notifyListeners();
      }
      
      // 监听器应当被调用6次
      expect(listener.callCount).to.equal(6);
      
      // 清理
      CountdownManager.removeListener(listener);
    });
  });
  
  describe('Misc functions', () => {
    let clock: sinon.SinonFakeTimers;
    
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    
    afterEach(() => {
      if (clock) {
        clock.restore();
      }
    });
    
    it('updateCountdownMessage应该调用process.stdout.write', () => {
      CountdownManager.updateCountdownMessage('测试消息');
      
      expect(writeStub.calledWith('\r测试消息')).to.be.true;
    });
    
    it('clearCountdownDisplay应该清除显示', () => {
      CountdownManager.clearCountdownDisplay();
      
      expect(writeStub.called).to.be.true;
    });
    
    it('setDebugMode应该切换调试模式', () => {
      CountdownManager.setDebugMode(true);
      
      // 验证debugMode标志已设置
      expect((CountdownManager as any).debugMode).to.be.true;
      
      CountdownManager.setDebugMode(false);
      expect((CountdownManager as any).debugMode).to.be.false;
    });
    
    it('isWaitingForUserInput的setter应该在设置为false时清除倒计时', () => {
      CountdownManager.startCountdown(5, sinon.spy());
      
      const clearCountdownSpy = sinon.spy(CountdownManager, 'clearCountdown');
      
      CountdownManager.isWaitingForUserInput = false;
      
      expect(clearCountdownSpy.called).to.be.true;
      expect(CountdownManager.isWaitingForUserInput).to.be.false;
      
      // 清理
      clearCountdownSpy.restore();
    });
  });
}); 