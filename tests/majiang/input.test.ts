// 导入Mocha和Chai断言库
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as readline from 'readline';
import { Tile, TileType } from '../src/majiang/majiang/tile';
import { Game } from '../src/majiang/majiang/game';
import { PlayerAction } from '../src/majiang/majiang/rule-types';
import { Player, PlayerType } from '../src/majiang/majiang/player';
import { RuleEngine } from '../src/majiang/majiang/rule-engine';
import { GameState } from '../src/majiang/majiang/game';
import { 
  askQuestion, 
  askQuestionWithOptions, 
  askConfirmation,
  getNextDiscardIndex,
  getPlayerChiChoice,
  getPlayerActionChoice,
  handlePlayerAction,
  getNumberInput,
  getSelectionFromList,
  InputState,
  InputOptions
} from '../src/majiang/input';

// 导入CountdownManager以便在测试中引用
import { CountdownManager } from '../src/majiang/countdown-manager';

import proxyquire from 'proxyquire';

// 定义模拟readline接口
interface MockReadlineInterface extends readline.Interface {
  question: sinon.SinonStub;
  close: sinon.SinonStub;
  on: sinon.SinonStub;
  emit: sinon.SinonStub;
}

// 定义process.exit的类型
declare global {
  namespace NodeJS {
    interface Process {
      exit(code?: number): never;
    }
  }
}

describe('Input Module - 基本函数', () => {
  let clock: sinon.SinonFakeTimers;
  let mockReadline: MockReadlineInterface;
  
  beforeEach(() => {
    clock = sinon.useFakeTimers();
    mockReadline = {
      question: sinon.stub(),
      close: sinon.stub(),
      on: sinon.stub(),
    } as MockReadlineInterface;
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('askQuestion', () => {
    it('应在超时时返回默认值', async () => {
      const timeoutMs = 1000;
      const defaultValue = '默认值';
      
      const promise = askQuestion('测试问题', timeoutMs, defaultValue);
      
      // 前进时间超过超时时间
      await clock.tickAsync(timeoutMs + 100);
      
      const result = await promise;
      expect(result).to.equal(defaultValue);
    });

    it('应正确处理用户输入', async () => {
      const userInput = '用户输入';
      const timeoutMs = 1000;
      
      // 模拟用户在500ms时输入
      setTimeout(() => {
        // 触发用户输入
        process.stdin.emit('data', Buffer.from(userInput + '\n'));
      }, 500);
      
      const promise = askQuestion('测试问题');
      await clock.tickAsync(600);
      
      const result = await promise;
      expect(result).to.equal(userInput);
    });

    it('应正确处理空输入', async () => {
      const timeoutMs = 1000;
      
      // 模拟用户输入空字符串
      setTimeout(() => {
        process.stdin.emit('data', Buffer.from('\n'));
      }, 500);
      
      const promise = askQuestion('测试问题');
      await clock.tickAsync(600);
      
      const result = await promise;
      expect(result).to.equal('');
    });
  });
});

describe('InputState', () => {
  let clock: sinon.SinonFakeTimers;
  let countdownManagerStubs: {
    isWaitingForUserInput: { get: sinon.SinonStub; set: sinon.SinonStub };
    reset: sinon.SinonStub;
    isCountdownActive: sinon.SinonStub;
    getRemainingSeconds: sinon.SinonStub;
    addTime: sinon.SinonStub;
    reduceTime: sinon.SinonStub;
    pauseCountdown: sinon.SinonStub;
    resumeCountdown: sinon.SinonStub;
    clearCountdown: sinon.SinonStub;
    startCountdown: sinon.SinonStub;
    setDebugMode: sinon.SinonStub;
  };
  
  beforeEach(() => {
    clock = sinon.useFakeTimers();
    
    // 初始化所有存根
    countdownManagerStubs = {
      isWaitingForUserInput: {
        get: sinon.stub().returns(false),
        set: sinon.stub()
      },
      reset: sinon.stub(),
      isCountdownActive: sinon.stub().returns(false),
      getRemainingSeconds: sinon.stub().returns(0),
      addTime: sinon.stub().returns(true),
      reduceTime: sinon.stub().returns(true),
      pauseCountdown: sinon.stub().returns(true),
      resumeCountdown: sinon.stub().returns(true),
      clearCountdown: sinon.stub(),
      startCountdown: sinon.stub().returns(setTimeout(() => {}, 0)),
      setDebugMode: sinon.stub()
    };
    
    // 设置CountdownManager的存根
    Object.defineProperty(CountdownManager, 'isWaitingForUserInput', countdownManagerStubs.isWaitingForUserInput);
    sinon.stub(CountdownManager, 'reset').callsFake(countdownManagerStubs.reset);
    sinon.stub(CountdownManager, 'isCountdownActive').callsFake(countdownManagerStubs.isCountdownActive);
    sinon.stub(CountdownManager, 'getRemainingSeconds').callsFake(countdownManagerStubs.getRemainingSeconds);
    sinon.stub(CountdownManager, 'addTime').callsFake(countdownManagerStubs.addTime);
    sinon.stub(CountdownManager, 'reduceTime').callsFake(countdownManagerStubs.reduceTime);
    sinon.stub(CountdownManager, 'pauseCountdown').callsFake(countdownManagerStubs.pauseCountdown);
    sinon.stub(CountdownManager, 'resumeCountdown').callsFake(countdownManagerStubs.resumeCountdown);
    sinon.stub(CountdownManager, 'clearCountdown').callsFake(countdownManagerStubs.clearCountdown);
    sinon.stub(CountdownManager, 'startCountdown').callsFake(countdownManagerStubs.startCountdown);
    sinon.stub(CountdownManager, 'setDebugMode').callsFake(countdownManagerStubs.setDebugMode);
  });
  
  afterEach(() => {
    clock.restore();
    sinon.restore();
    CountdownManager.reset();
  });
  
  describe('代理方法', () => {
    it('应正确代理到CountdownManager的所有方法', () => {
      // 测试getter和setter
      InputState.isWaitingForUserInput;
      expect(countdownManagerStubs.isWaitingForUserInput.get.calledOnce).to.be.true;
      
      InputState.isWaitingForUserInput = true;
      expect(countdownManagerStubs.isWaitingForUserInput.set.calledWith(true)).to.be.true;
      
      // 测试countdownInterval和currentCountdown
      countdownManagerStubs.isCountdownActive.returns(true);
      countdownManagerStubs.getRemainingSeconds.returns(10);
      
      expect(InputState.countdownInterval).to.not.be.null;
      expect(InputState.currentCountdown).to.equal(10);
      
      InputState.countdownInterval = null;
      expect(countdownManagerStubs.clearCountdown.calledOnce).to.be.true;
      
      // 测试currentCountdown的设置
      countdownManagerStubs.getRemainingSeconds.returns(10);
      InputState.currentCountdown = 5;
      expect(countdownManagerStubs.reduceTime.calledWith(5)).to.be.true;
      
      countdownManagerStubs.getRemainingSeconds.returns(5);
      InputState.currentCountdown = 10;
      expect(countdownManagerStubs.addTime.calledWith(5)).to.be.true;
      
      // 测试其他方法
      InputState.clearCountdown();
      expect(countdownManagerStubs.clearCountdown.called).to.be.true;
      
      const callback = () => {};
      InputState.startCountdown(5, callback);
      expect(countdownManagerStubs.startCountdown.calledWith(5, sinon.match.func)).to.be.true;
      
      InputState.pauseCountdown();
      expect(countdownManagerStubs.pauseCountdown.called).to.be.true;
      
      InputState.resumeCountdown();
      expect(countdownManagerStubs.resumeCountdown.called).to.be.true;
      
      InputState.reset();
      expect(countdownManagerStubs.reset.called).to.be.true;
      
      InputState.setDebugMode(true);
      expect(countdownManagerStubs.setDebugMode.calledWith(true)).to.be.true;
      
      InputState.isCountdownActive();
      expect(countdownManagerStubs.isCountdownActive.called).to.be.true;
    });
  });
  
  describe('倒计时控制', () => {
    it('应正确处理倒计时的暂停和恢复', () => {
      countdownManagerStubs.isCountdownActive.returns(true);
      countdownManagerStubs.getRemainingSeconds.returns(10);
      
      // 测试暂停
      InputState.pauseCountdown();
      expect(countdownManagerStubs.pauseCountdown.calledOnce).to.be.true;
      
      // 测试恢复
      InputState.resumeCountdown();
      expect(countdownManagerStubs.resumeCountdown.calledOnce).to.be.true;
    });
    
    it('应正确处理倒计时时间的增减', () => {
      countdownManagerStubs.isCountdownActive.returns(true);
      countdownManagerStubs.getRemainingSeconds.returns(10);
      
      // 测试减少时间
      InputState.currentCountdown = 5;
      expect(countdownManagerStubs.reduceTime.calledWith(5)).to.be.true;
      
      // 测试增加时间
      InputState.currentCountdown = 15;
      expect(countdownManagerStubs.addTime.calledWith(5)).to.be.true;
    });
    
    it('应正确处理倒计时的清除', () => {
      countdownManagerStubs.isCountdownActive.returns(true);
      
      InputState.countdownInterval = null;
      expect(countdownManagerStubs.clearCountdown.calledOnce).to.be.true;
    });
    
    it('应在倒计时不活跃时忽略时间设置', () => {
      countdownManagerStubs.isCountdownActive.returns(false);
      
      InputState.currentCountdown = 5;
      expect(countdownManagerStubs.reduceTime.called).to.be.false;
      expect(countdownManagerStubs.addTime.called).to.be.false;
    });
  });
  
  describe('边界条件', () => {
    it('应正确处理负数的倒计时时间', () => {
      countdownManagerStubs.isCountdownActive.returns(true);
      countdownManagerStubs.getRemainingSeconds.returns(10);
      
      InputState.currentCountdown = -5;
      expect(countdownManagerStubs.reduceTime.called).to.be.false;
      expect(countdownManagerStubs.addTime.called).to.be.false;
    });
    
    it('应正确处理相同的倒计时时间', () => {
      countdownManagerStubs.isCountdownActive.returns(true);
      countdownManagerStubs.getRemainingSeconds.returns(10);
      
      InputState.currentCountdown = 10;
      expect(countdownManagerStubs.reduceTime.called).to.be.false;
      expect(countdownManagerStubs.addTime.called).to.be.false;
    });
  });
});

describe('Input Functions', () => {
  let mockReadline: MockReadlineInterface;
  let clock: sinon.SinonFakeTimers;
  let inputModule: any;

  beforeEach(() => {
    mockReadline = {
      question: sinon.stub(),
      close: sinon.stub(),
      on: sinon.stub(),
      emit: sinon.stub()
    } as MockReadlineInterface;
    
    clock = sinon.useFakeTimers();
    
    // 使用 proxyquire 替换 readline 模块
    inputModule = proxyquire('../src/input', {
      'readline': {
        createInterface: () => mockReadline
      }
    });
  });

  afterEach(() => {
    clock.restore();
  });

  describe('askQuestion', () => {
    it('should return user input', async () => {
      mockReadline.question = sinon.stub().callsFake((_, callback) => callback('test input'));
      const result = await inputModule.askQuestion('test question', 1000);
      expect(result).to.equal('test input');
    });

    it('should handle timeout', async () => {
      mockReadline.question = sinon.stub().callsFake(() => {});
      const promise = inputModule.askQuestionWithOptions('test question', {
        timeoutInMs: 100,
        showCountdown: false,
        defaultValue: 'default',
        silentMode: true
      });
      
      await clock.tickAsync(100);
      const result = await promise;
      expect(result).to.equal('default');
    });

    it('should handle empty input', async () => {
      mockReadline.question = sinon.stub().callsFake((_, callback) => callback(''));
      const result = await inputModule.askQuestionWithOptions('test question', {
        timeoutInMs: 1000,
        showCountdown: false,
        defaultValue: 'default',
        silentMode: true
      });
      expect(result).to.equal('');
    });

    it('should use default options when not provided', async () => {
      mockReadline.question = sinon.stub().callsFake((_, callback) => callback('test input'));
      const result = await inputModule.askQuestionWithOptions('test question');
      expect(result).to.equal('test input');
    });
  });

  describe('askQuestionWithOptions', () => {
    it('should use provided options', async () => {
      const question = '请输入：';
      const options: InputOptions = {
        timeoutInMs: 1000,
        showCountdown: false,
        defaultValue: '默认值',
        silentMode: true
      };

      const promise = inputModule.askQuestionWithOptions(question, options);
      clock.tick(1000);
      
      const result = await promise;
      expect(result).to.equal(options.defaultValue);
    });
  });

  describe('askConfirmation', () => {
    it('should handle invalid input and return default value', async () => {
      const question = '确认?';
      const defaultValue = true;
      const timeout = 1000;

      mockReadline.question = sinon.stub().callsFake((_, callback) => callback('invalid'));
      const promise = inputModule.askConfirmation(question, defaultValue, timeout);
      await clock.tickAsync(0);
      const result = await promise;
      expect(result).to.equal(defaultValue);
    });

    it('should handle empty input and return default value', async () => {
      const question = '确认?';
      const defaultValue = true;
      const timeout = 1000;

      mockReadline.question = sinon.stub().callsFake((_, callback) => callback(''));
      const promise = inputModule.askConfirmation(question, defaultValue, timeout);
      await clock.tickAsync(0);
      const result = await promise;
      expect(result).to.equal(defaultValue);
    });

    it('should handle input with spaces and return correct value', async () => {
      const question = '确认?';
      const defaultValue = false;
      const timeout = 1000;

      mockReadline.question = sinon.stub().callsFake((_, callback) => callback(' y '));
      const promise = inputModule.askConfirmation(question, defaultValue, timeout);
      await clock.tickAsync(0);
      const result = await promise;
      expect(result).to.equal(true);
    });

    it('should handle timeout and return default value', async () => {
      const question = '确认?';
      const defaultValue = true;
      const timeout = 1000;

      mockReadline.question = sinon.stub().callsFake(() => {});
      const promise = inputModule.askConfirmation(question, defaultValue, timeout);
      await clock.tickAsync(1000);
      const result = await promise;
      expect(result).to.equal(defaultValue);
    });
  });
}); 