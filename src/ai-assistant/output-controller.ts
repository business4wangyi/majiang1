/**
 * 输出控制模块 - 负责执行AI建议和显示提示
 */

import { Action, Player } from '../tic-tac-toe/types';
import { AIDecision } from './tic-tac-toe/ai-engine';

// 声明全局类型
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// 输出配置
export interface OutputConfig {
  mode: 'auto' | 'suggest' | 'voice' | 'visual';
  autoExecute?: boolean;
  showAlternatives?: boolean;
  voiceEnabled?: boolean;
  language?: 'zh-CN' | 'en-US';
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  action?: Action;
  error?: string;
  timestamp: number;
}

/**
 * 自动执行控制器
 * 用于线上游戏的自动操作
 */
export class AutoExecutionController {
  private config: OutputConfig;
  
  constructor(config: OutputConfig) {
    this.config = config;
  }

  /**
   * 执行鼠标点击
   */
  async executeMouseClick(action: Action, gameRegion: { x: number; y: number; width: number; height: number }): Promise<ExecutionResult> {
    try {
      // 计算点击位置
      const cellWidth = gameRegion.width / 3;
      const cellHeight = gameRegion.height / 3;
      
      const clickX = gameRegion.x + (action.col + 0.5) * cellWidth;
      const clickY = gameRegion.y + (action.row + 0.5) * cellHeight;
      
      // 在浏览器环境中模拟点击
      if (typeof window !== 'undefined') {
        return this.simulateWebClick(clickX, clickY, action);
      } else {
        // 在桌面环境中执行点击
        return this.executeDesktopClick(clickX, clickY, action);
      }
    } catch (error) {
      return {
        success: false,
        error: `点击执行失败: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 浏览器环境点击模拟
   */
  private async simulateWebClick(x: number, y: number, action: Action): Promise<ExecutionResult> {
    // 查找目标元素
    const element = document.elementFromPoint(x, y);
    
    if (!element) {
      return {
        success: false,
        error: '未找到可点击的元素',
        timestamp: Date.now()
      };
    }

    // 创建点击事件
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });

    // 执行点击
    element.dispatchEvent(clickEvent);
    
    // 等待一小段时间确保操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      action,
      timestamp: Date.now()
    };
  }

  /**
   * 桌面环境点击执行
   */
  private async executeDesktopClick(x: number, y: number, action: Action): Promise<ExecutionResult> {
    // 这里需要使用桌面自动化库，如 robotjs
    // 由于依赖问题，这里提供接口示例
    
    try {
      // const robot = require('robotjs');
      // robot.moveMouse(x, y);
      // robot.mouseClick();
      
      console.log(`模拟桌面点击: (${x}, ${y})`);
      
      return {
        success: true,
        action,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `桌面点击失败: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 通过API执行操作
   */
  async executeAPICall(action: Action, apiEndpoint: string, authToken?: string): Promise<ExecutionResult> {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          action: {
            row: action.row,
            col: action.col
          },
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        action,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `API执行失败: ${error}`,
        timestamp: Date.now()
      };
    }
  }
}

/**
 * 建议显示控制器
 * 用于向用户显示AI建议
 */
export class SuggestionDisplayController {
  private config: OutputConfig;
  private voiceController: VoiceController;

  constructor(config: OutputConfig) {
    this.config = config;
    this.voiceController = new VoiceController();
  }

  /**
   * 显示AI决策建议
   */
  displayDecision(decision: AIDecision): void {
    if (this.config.mode === 'visual' || this.config.mode === 'suggest') {
      this.showVisualSuggestion(decision);
    }

    if (this.config.voiceEnabled) {
      this.speakSuggestion(decision);
    }

    if (this.config.showAlternatives && decision.alternatives.length > 0) {
      this.showAlternatives(decision.alternatives);
    }
  }

  /**
   * 语音播报建议
   */
  private async speakSuggestion(decision: AIDecision): Promise<void> {
    const text = `AI建议在第${decision.action.row + 1}行第${decision.action.col + 1}列落子，置信度${(decision.confidence * 100).toFixed(0)}%。${decision.reasoning}`;

    try {
      await this.voiceController.speak(text);
    } catch (error) {
      console.warn('语音播报失败:', error);
    }
  }

  /**
   * 显示可视化建议
   */
  private showVisualSuggestion(decision: AIDecision): void {
    // 创建建议显示界面
    const suggestionDiv = this.createSuggestionElement(decision);
    
    // 添加到页面
    document.body.appendChild(suggestionDiv);
    
    // 自动移除
    setTimeout(() => {
      if (suggestionDiv.parentNode) {
        suggestionDiv.parentNode.removeChild(suggestionDiv);
      }
    }, 5000);
  }

  /**
   * 创建建议显示元素
   */
  private createSuggestionElement(decision: AIDecision): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    div.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        🤖 AI建议
      </div>
      <div style="margin-bottom: 8px;">
        <strong>推荐位置:</strong> (${decision.action.row + 1}, ${decision.action.col + 1})
      </div>
      <div style="margin-bottom: 8px;">
        <strong>置信度:</strong> ${(decision.confidence * 100).toFixed(1)}%
      </div>
      <div style="margin-bottom: 8px;">
        <strong>策略:</strong> ${this.getStrategyName(decision.strategy)}
      </div>
      <div style="font-size: 12px; color: #ccc;">
        ${decision.reasoning}
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: #999;">
        计算时间: ${decision.computeTime}ms
      </div>
    `;
    
    return div;
  }

  /**
   * 获取策略中文名称
   */
  private getStrategyName(strategy: string): string {
    const names: { [key: string]: string } = {
      'minimax': '极小极大算法',
      'qlearning': 'Q学习',
      'defensive': '防守策略',
      'greedy': '贪心策略',
      'hybrid': '混合策略',
      'random': '随机策略'
    };
    return names[strategy] || strategy;
  }




  /**
   * 显示备选方案
   */
  private showAlternatives(alternatives: Array<{ action: Action; score: number; reason: string }>): void {
    const altDiv = document.createElement('div');
    altDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      max-width: 250px;
      z-index: 9999;
    `;
    
    let html = '<div style="font-weight: bold; margin-bottom: 8px;">📋 备选方案</div>';
    
    alternatives.forEach((alt, index) => {
      html += `
        <div style="margin-bottom: 6px; padding: 4px; border-left: 2px solid #666;">
          <strong>${index + 1}.</strong> (${alt.action.row + 1}, ${alt.action.col + 1}) 
          <span style="color: #ccc;">- ${alt.reason}</span>
        </div>
      `;
    });
    
    altDiv.innerHTML = html;
    document.body.appendChild(altDiv);
    
    setTimeout(() => {
      if (altDiv.parentNode) {
        altDiv.parentNode.removeChild(altDiv);
      }
    }, 8000);
  }

  /**
   * 高亮显示建议位置
   */
  highlightSuggestedMove(action: Action, gameRegion: { x: number; y: number; width: number; height: number }): void {
    const cellWidth = gameRegion.width / 3;
    const cellHeight = gameRegion.height / 3;
    
    const highlightX = gameRegion.x + action.col * cellWidth;
    const highlightY = gameRegion.y + action.row * cellHeight;
    
    // 创建高亮覆盖层
    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: fixed;
      left: ${highlightX}px;
      top: ${highlightY}px;
      width: ${cellWidth}px;
      height: ${cellHeight}px;
      background: rgba(0, 255, 0, 0.3);
      border: 2px solid #00ff00;
      pointer-events: none;
      z-index: 9998;
      animation: pulse 1s infinite;
    `;
    
    // 添加脉冲动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 0.3; }
        50% { opacity: 0.7; }
        100% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(highlight);
    
    // 3秒后移除高亮
    setTimeout(() => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  }
}

/**
 * 语音控制器
 * 提供语音交互功能
 */
export class VoiceController {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;

  constructor() {
    this.initializeSpeech();
  }

  /**
   * 初始化语音功能
   */
  private initializeSpeech(): void {
    // 检查浏览器环境
    if (typeof window === 'undefined') {
      console.warn('语音功能仅在浏览器环境中可用');
      return;
    }

    // 初始化语音合成
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.isSupported = true;
    } else {
      console.warn('当前浏览器不支持语音合成');
    }

    // 初始化语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn('当前浏览器不支持语音识别');
    }
  }

  /**
   * 开始语音监听
   */
  startListening(): void {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  /**
   * 停止语音监听
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 语音播报文本
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.isSupported) {
        console.warn('语音合成不可用，使用文本提示');
        console.log(`🔊 ${text}`);
        resolve();
        return;
      }

      // 停止当前播报
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('语音合成错误:', event.error);
        reject(new Error(`语音合成失败: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * 停止语音播报
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * 检查语音功能是否可用
   */
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 处理语音命令
   */
  private processVoiceCommand(command: string): void {
    console.log('收到语音命令:', command);
    
    // 解析位置命令，如"第一行第二列"、"中间"、"左上角"等
    const position = this.parsePositionCommand(command);
    
    if (position) {
      // 触发自定义事件
      const event = new CustomEvent('voiceCommand', {
        detail: { action: position, command }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 解析位置命令
   */
  private parsePositionCommand(command: string): Action | null {
    // 数字位置匹配
    const numberMatch = command.match(/第?([一二三1-3])行.*第?([一二三1-3])列/);
    if (numberMatch) {
      const row = this.chineseToNumber(numberMatch[1]) - 1;
      const col = this.chineseToNumber(numberMatch[2]) - 1;
      return { row, col };
    }
    
    // 特殊位置匹配
    const positionMap: { [key: string]: Action } = {
      '中间': { row: 1, col: 1 },
      '中心': { row: 1, col: 1 },
      '左上角': { row: 0, col: 0 },
      '右上角': { row: 0, col: 2 },
      '左下角': { row: 2, col: 0 },
      '右下角': { row: 2, col: 2 },
      '上中': { row: 0, col: 1 },
      '下中': { row: 2, col: 1 },
      '左中': { row: 1, col: 0 },
      '右中': { row: 1, col: 2 }
    };
    
    for (const [key, position] of Object.entries(positionMap)) {
      if (command.includes(key)) {
        return position;
      }
    }
    
    return null;
  }

  /**
   * 中文数字转阿拉伯数字
   */
  private chineseToNumber(chinese: string): number {
    const map: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3,
      '1': 1, '2': 2, '3': 3
    };
    return map[chinese] || 1;
  }
}
