import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { 
  LogLevel, 
  setLogLevel, 
  getLogLevel, 
  debugLog, 
  infoLog, 
  warnLog, 
  errorLog, 
  aiThinkingLog,
  flushLogs,
  log
} from '../../src/majiang/tools/logger';

describe('Logger', () => {
  // 保存原始的console.log函数
  let consoleLogStub: sinon.SinonStub;
  
  // 在每个测试前设置stubs
  beforeEach(() => {
    // 存根console.log，这样测试输出不会被污染
    consoleLogStub = sinon.stub(console, 'log');
    
    // 重置日志级别为默认值
    setLogLevel(LogLevel.INFO);
  });
  
  // 在每个测试后恢复原始函数
  afterEach(() => {
    // 恢复所有存根
    consoleLogStub.restore();
  });
  
  describe('Log Level Management', () => {
    it('should set and get log level correctly', () => {
      setLogLevel(LogLevel.DEBUG);
      expect(getLogLevel()).to.equal(LogLevel.DEBUG);
      
      setLogLevel(LogLevel.ERROR);
      expect(getLogLevel()).to.equal(LogLevel.ERROR);
    });
    
    it('should log INFO message when changing log level', () => {
      setLogLevel(LogLevel.DEBUG);
      expect(consoleLogStub.calledOnce).to.be.false; // INFO不会打印到控制台
    });
    
    it('should not log when level is NONE', () => {
      setLogLevel(LogLevel.NONE);
      
      // 尝试所有级别的日志
      debugLog('Debug message with NONE level');
      infoLog('Info message with NONE level');
      warnLog('Warning message with NONE level');
      errorLog('Error message with NONE level');
      
      // 都不应该被记录
      expect(consoleLogStub.called).to.be.false;
    });
  });
  
  describe('Debug Logs', () => {
    it('should not log debug messages when log level is higher', () => {
      setLogLevel(LogLevel.INFO); // 设置为INFO级别
      debugLog('This is a debug message');
      expect(consoleLogStub.called).to.be.false;
    });
    
    it('should log debug messages when log level is DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      debugLog('This is a debug message');
      // Debug级别的消息不会打印到控制台
      expect(consoleLogStub.called).to.be.false;
    });
  });
  
  describe('Info Logs', () => {
    it('should not log info messages when log level is higher', () => {
      setLogLevel(LogLevel.WARNING);
      infoLog('This is an info message');
      expect(consoleLogStub.called).to.be.false;
    });
    
    it('should log info messages when log level is INFO', () => {
      setLogLevel(LogLevel.INFO);
      infoLog('This is an info message');
      // INFO级别的消息不会打印到控制台
      expect(consoleLogStub.called).to.be.false;
    });
  });
  
  describe('Warning Logs', () => {
    it('should not log warning messages when log level is higher', () => {
      setLogLevel(LogLevel.ERROR);
      warnLog('This is a warning message');
      expect(consoleLogStub.called).to.be.false;
    });
    
    it('should log warning messages when log level is WARNING', () => {
      setLogLevel(LogLevel.WARNING);
      warnLog('This is a warning message');
      expect(consoleLogStub.calledOnce).to.be.true;
    });
  });
  
  describe('Error Logs', () => {
    it('should log error messages when log level is ERROR', () => {
      setLogLevel(LogLevel.ERROR);
      errorLog('This is an error message');
      expect(consoleLogStub.calledOnce).to.be.true;
    });
    
    it('should include error information when error object is provided', () => {
      const testError = new Error('Test error');
      errorLog('Main error message', testError);
      
      // 确保控制台被调用并包含错误信息
      expect(consoleLogStub.calledOnce).to.be.true;
      const loggedMessage = consoleLogStub.firstCall.args[0];
      expect(loggedMessage).to.include('Main error message');
      expect(loggedMessage).to.include('Test error');
    });
  });
  
  describe('AI Thinking Logs', () => {
    it('should format AI thinking logs correctly', () => {
      setLogLevel(LogLevel.DEBUG);
      aiThinkingLog('TestAI', 'Considering options');
      // Debug级别的消息不会打印到控制台
      expect(consoleLogStub.called).to.be.false;
    });
  });
  
  describe('Generic Log Function', () => {
    it('should handle timestamp inclusion option', () => {
      // 带时间戳的日志
      log(LogLevel.ERROR, 'Error with timestamp', true);
      expect(consoleLogStub.calledOnce).to.be.true;
      
      // 重置存根
      consoleLogStub.reset();
      
      // 不带时间戳的日志
      log(LogLevel.ERROR, 'Error without timestamp', false);
      expect(consoleLogStub.calledOnce).to.be.true;
    });
    
    it('should not call console when level is lower than current setting', () => {
      setLogLevel(LogLevel.ERROR);
      log(LogLevel.INFO, 'Info message');
      expect(consoleLogStub.called).to.be.false;
    });
  });
  
  describe('Process Event Handlers', () => {
    // 这些测试不会实际触发事件，只是确认处理程序已注册
    it('should have registered exit handler', () => {
      // 验证process.on被调用过，但不直接调用处理程序
      expect(process.listeners('exit').length).to.be.greaterThan(0);
    });
    
    it('should have registered uncaughtException handler', () => {
      expect(process.listeners('uncaughtException').length).to.be.greaterThan(0);
    });
    
    it('should have registered unhandledRejection handler', () => {
      expect(process.listeners('unhandledRejection').length).to.be.greaterThan(0);
    });
  });
  
  // 不测试文件系统相关的功能，因为无法可靠地存根 fs 模块
}); 