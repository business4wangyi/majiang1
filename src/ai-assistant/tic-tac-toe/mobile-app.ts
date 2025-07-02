/**
 * 移动端AI辅助应用
 * 针对手机和平板设备优化的轻量化实现
 */

import { Board, Player, Action } from '../../tic-tac-toe/types';
import { AIDecisionEngine, AIConfig } from './ai-engine';
import { StrategySimplifier, StrategyLevel } from '../strategy-simplifier';

// 移动端配置
export interface MobileConfig {
  aiLevel: 'easy' | 'medium' | 'hard';
  showHints: boolean;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  offlineMode: boolean;
}

// 触摸事件接口
export interface TouchEvent {
  x: number;
  y: number;
  timestamp: number;
}

// 游戏状态
export interface GameState {
  board: Board;
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'Draw' | null;
  moveHistory: Action[];
}

/**
 * 移动端AI辅助应用主类
 */
export class MobileAIAssistant {
  private config: MobileConfig;
  private gameState: GameState;
  private aiEngine: AIDecisionEngine;
  private strategySimplifier: StrategySimplifier;
  
  // UI元素
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // 游戏设置
  private cellSize: number = 100;
  private boardSize: number = 300;
  private isPlayerTurn: boolean = true;

  constructor(config: MobileConfig) {
    this.config = config;
    this.gameState = this.createInitialGameState();
    
    // 初始化AI引擎（轻量化配置）
    const aiConfig: AIConfig = {
      strategy: this.getAIStrategy(config.aiLevel),
      difficulty: config.aiLevel === 'easy' ? 'easy' : config.aiLevel === 'medium' ? 'medium' : 'hard',
      timeLimit: 1000, // 1秒限制，保证响应速度
      explainDecisions: config.showHints
    };
    
    this.aiEngine = new AIDecisionEngine(aiConfig);
    this.strategySimplifier = new StrategySimplifier();
  }

  /**
   * 初始化移动端应用
   */
  async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('无法获取Canvas上下文');
    }

    // 设置Canvas尺寸
    this.setupCanvas();
    
    // 绑定触摸事件
    this.bindTouchEvents();
    
    // 绘制初始界面
    this.render();
    
    console.log('移动端AI辅助应用已初始化');
  }

  /**
   * 设置Canvas
   */
  private setupCanvas(): void {
    if (!this.canvas) return;
    
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 设置Canvas实际尺寸
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // 缩放上下文以匹配设备像素比
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    
    // 设置CSS尺寸
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // 计算棋盘尺寸
    const minDimension = Math.min(rect.width, rect.height);
    this.boardSize = minDimension * 0.8;
    this.cellSize = this.boardSize / 3;
  }

  /**
   * 绑定触摸事件
   */
  private bindTouchEvents(): void {
    if (!this.canvas) return;

    // 防止默认的触摸行为
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    
    // 处理触摸点击
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = this.canvas!.getBoundingClientRect();
      
      const touchEvent: TouchEvent = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now()
      };
      
      this.handleTouch(touchEvent);
    });

    // 也支持鼠标事件（用于调试）
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      const touchEvent: TouchEvent = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        timestamp: Date.now()
      };
      
      this.handleTouch(touchEvent);
    });
  }

  /**
   * 处理触摸输入
   */
  private async handleTouch(touch: TouchEvent): Promise<void> {
    if (!this.isPlayerTurn || this.gameState.gameOver) {
      return;
    }

    // 计算点击的格子
    const action = this.getTouchedCell(touch);
    if (!action || this.gameState.board[action.row][action.col] !== null) {
      return; // 无效位置或已被占用
    }

    // 执行玩家移动
    await this.makeMove(action, this.gameState.currentPlayer);
    
    // 触觉反馈
    if (this.config.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 检查游戏是否结束
    if (!this.gameState.gameOver) {
      // AI回合
      this.isPlayerTurn = false;
      setTimeout(async () => {
        await this.makeAIMove();
        this.isPlayerTurn = true;
      }, 500); // 短暂延迟，让玩家看到自己的移动
    }
  }

  /**
   * 获取触摸的格子
   */
  private getTouchedCell(touch: TouchEvent): Action | null {
    if (!this.canvas) return null;
    
    const rect = this.canvas.getBoundingClientRect();
    const boardStartX = (rect.width - this.boardSize) / 2;
    const boardStartY = (rect.height - this.boardSize) / 2;
    
    const relativeX = touch.x - boardStartX;
    const relativeY = touch.y - boardStartY;
    
    if (relativeX < 0 || relativeX > this.boardSize || 
        relativeY < 0 || relativeY > this.boardSize) {
      return null;
    }
    
    const col = Math.floor(relativeX / this.cellSize);
    const row = Math.floor(relativeY / this.cellSize);
    
    return { row, col };
  }

  /**
   * 执行移动
   */
  private async makeMove(action: Action, player: Player): Promise<void> {
    // 更新棋盘
    this.gameState.board[action.row][action.col] = player;
    this.gameState.moveHistory.push(action);
    
    // 检查游戏结果
    this.checkGameEnd();
    
    // 切换玩家
    if (!this.gameState.gameOver) {
      this.gameState.currentPlayer = player === 'X' ? 'O' : 'X';
    }
    
    // 重新渲染
    this.render();
    
    // 自动保存
    if (this.config.autoSave) {
      this.saveGameState();
    }
  }

  /**
   * AI移动
   */
  private async makeAIMove(): Promise<void> {
    try {
      const decision = await this.aiEngine.getDecision(this.gameState.board, this.gameState.currentPlayer);
      
      // 显示AI思考过程（如果启用提示）
      if (this.config.showHints) {
        this.showAIThinking(decision.reasoning);
      }
      
      await this.makeMove(decision.action, this.gameState.currentPlayer);
      
    } catch (error) {
      console.error('AI移动失败:', error);
      // 降级到随机移动
      const legalMoves = this.getLegalMoves();
      if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        await this.makeMove(randomMove, this.gameState.currentPlayer);
      }
    }
  }

  /**
   * 显示AI思考过程
   */
  private showAIThinking(reasoning: string): void {
    // 创建临时提示框
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 80%;
      text-align: center;
      z-index: 1000;
    `;
    hint.textContent = `AI思考: ${reasoning}`;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint);
      }
    }, 2000);
  }

  /**
   * 渲染游戏界面
   */
  private render(): void {
    if (!this.ctx || !this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    
    // 清空画布
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    // 绘制背景
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    
    // 绘制棋盘
    this.drawBoard();
    
    // 绘制棋子
    this.drawPieces();
    
    // 绘制游戏状态
    this.drawGameStatus();
    
    // 绘制提示（如果启用）
    if (this.config.showHints && this.isPlayerTurn && !this.gameState.gameOver) {
      this.drawHints();
    }
  }

  /**
   * 绘制棋盘
   */
  private drawBoard(): void {
    if (!this.ctx || !this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const startX = (rect.width - this.boardSize) / 2;
    const startY = (rect.height - this.boardSize) / 2;
    
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    
    // 绘制网格线
    for (let i = 0; i <= 3; i++) {
      // 垂直线
      this.ctx.beginPath();
      this.ctx.moveTo(startX + i * this.cellSize, startY);
      this.ctx.lineTo(startX + i * this.cellSize, startY + this.boardSize);
      this.ctx.stroke();
      
      // 水平线
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY + i * this.cellSize);
      this.ctx.lineTo(startX + this.boardSize, startY + i * this.cellSize);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制棋子
   */
  private drawPieces(): void {
    if (!this.ctx || !this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const startX = (rect.width - this.boardSize) / 2;
    const startY = (rect.height - this.boardSize) / 2;
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const piece = this.gameState.board[row][col];
        if (piece) {
          const centerX = startX + col * this.cellSize + this.cellSize / 2;
          const centerY = startY + row * this.cellSize + this.cellSize / 2;
          
          if (piece === 'X') {
            this.drawX(centerX, centerY);
          } else {
            this.drawO(centerX, centerY);
          }
        }
      }
    }
  }

  /**
   * 绘制X
   */
  private drawX(centerX: number, centerY: number): void {
    if (!this.ctx) return;
    
    const size = this.cellSize * 0.3;
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 4;
    
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - size, centerY - size);
    this.ctx.lineTo(centerX + size, centerY + size);
    this.ctx.moveTo(centerX + size, centerY - size);
    this.ctx.lineTo(centerX - size, centerY + size);
    this.ctx.stroke();
  }

  /**
   * 绘制O
   */
  private drawO(centerX: number, centerY: number): void {
    if (!this.ctx) return;
    
    const radius = this.cellSize * 0.3;
    this.ctx.strokeStyle = '#3498db';
    this.ctx.lineWidth = 4;
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  /**
   * 绘制游戏状态
   */
  private drawGameStatus(): void {
    if (!this.ctx || !this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    let statusText = '';
    
    if (this.gameState.gameOver) {
      if (this.gameState.winner === 'Draw') {
        statusText = '平局！';
      } else {
        statusText = `${this.gameState.winner} 获胜！`;
      }
    } else {
      statusText = this.isPlayerTurn ? '您的回合' : 'AI思考中...';
    }
    
    this.ctx.fillStyle = '#333';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(statusText, rect.width / 2, 50);
  }

  /**
   * 绘制提示
   */
  private drawHints(): void {
    if (!this.ctx || !this.canvas) return;
    
    // 获取策略建议
    const ruleApplication = this.strategySimplifier.getBestMove(
      this.gameState.board, 
      this.gameState.currentPlayer, 
      StrategyLevel.BEGINNER
    );
    
    if (ruleApplication) {
      const rect = this.canvas.getBoundingClientRect();
      const startX = (rect.width - this.boardSize) / 2;
      const startY = (rect.height - this.boardSize) / 2;
      
      const { action } = ruleApplication;
      const hintX = startX + action.col * this.cellSize + this.cellSize / 2;
      const hintY = startY + action.row * this.cellSize + this.cellSize / 2;
      
      // 绘制提示圆圈
      this.ctx.strokeStyle = '#f39c12';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      
      this.ctx.beginPath();
      this.ctx.arc(hintX, hintY, this.cellSize * 0.4, 0, 2 * Math.PI);
      this.ctx.stroke();
      
      this.ctx.setLineDash([]); // 重置虚线
    }
  }

  // ===== 辅助方法 =====

  private createInitialGameState(): GameState {
    return {
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      currentPlayer: 'X',
      gameOver: false,
      winner: null,
      moveHistory: []
    };
  }

  private getAIStrategy(level: string): 'minimax' | 'qlearning' | 'defensive' | 'greedy' {
    switch (level) {
      case 'easy': return 'greedy';
      case 'medium': return 'defensive';
      case 'hard': return 'minimax';
      default: return 'defensive';
    }
  }

  private getLegalMoves(): Action[] {
    const moves: Action[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.gameState.board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }

  private checkGameEnd(): void {
    // 检查获胜条件
    const winner = this.checkWinner();
    if (winner) {
      this.gameState.gameOver = true;
      this.gameState.winner = winner;
      return;
    }
    
    // 检查平局
    if (this.getLegalMoves().length === 0) {
      this.gameState.gameOver = true;
      this.gameState.winner = 'Draw';
    }
  }

  private checkWinner(): Player | null {
    const board = this.gameState.board;
    
    // 检查行、列、对角线
    for (let i = 0; i < 3; i++) {
      // 行
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        return board[i][0];
      }
      // 列
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        return board[0][i];
      }
    }
    
    // 对角线
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }
    
    return null;
  }

  private saveGameState(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tic-tac-toe-game', JSON.stringify(this.gameState));
    }
  }

  private loadGameState(): boolean {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('tic-tac-toe-game');
      if (saved) {
        try {
          this.gameState = JSON.parse(saved);
          return true;
        } catch (error) {
          console.error('加载游戏状态失败:', error);
        }
      }
    }
    return false;
  }

  /**
   * 重新开始游戏
   */
  public resetGame(): void {
    this.gameState = this.createInitialGameState();
    this.isPlayerTurn = true;
    this.render();
    
    if (this.config.autoSave) {
      this.saveGameState();
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 更新AI配置
    if (newConfig.aiLevel) {
      const aiConfig: AIConfig = {
        strategy: this.getAIStrategy(newConfig.aiLevel),
        difficulty: newConfig.aiLevel === 'easy' ? 'easy' : newConfig.aiLevel === 'medium' ? 'medium' : 'hard',
        timeLimit: 1000,
        explainDecisions: this.config.showHints
      };
      this.aiEngine.updateConfig(aiConfig);
    }
    
    this.render();
  }
}
