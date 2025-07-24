/**
 * 主控制器 - 集成所有模块，提供统一的AI辅助接口
 */

import { Board, Player, Action } from '../../tic-tac-toe/types';
import { ScreenGameRecognizer, CameraGameRecognizer, RecognitionResult } from '../vision-recognition';
import { AIDecisionEngine, AIConfig, AIDecision } from './ai-engine';
import { AutoExecutionController, SuggestionDisplayController, VoiceController, OutputConfig } from '../output-controller';
import { StrategySimplifier, StrategyLevel, RuleApplication } from '../strategy-simplifier';

// 主配置接口
export interface AIAssistantConfig {
  recognition: {
    source: 'screen' | 'camera' | 'manual';
    gameRegion?: { x: number; y: number; width: number; height: number };
    confidence?: number;
  };
  ai: AIConfig;
  output: OutputConfig;
  strategy: {
    level: StrategyLevel;
    showExplanations: boolean;
    enableLearning: boolean;
  };
}

// 系统状态
export interface SystemStatus {
  isRunning: boolean;
  lastRecognition?: RecognitionResult;
  lastDecision?: AIDecision;
  errorCount: number;
  performance: {
    recognitionTime: number;
    decisionTime: number;
    totalTime: number;
  };
}

/**
 * AI辅助游戏主控制器
 */
export class AIGameAssistant {
  private config: AIAssistantConfig;
  private status: SystemStatus;
  
  // 核心模块
  private recognizer: ScreenGameRecognizer | CameraGameRecognizer | null = null;
  private aiEngine!: AIDecisionEngine;
  private autoController!: AutoExecutionController;
  private displayController!: SuggestionDisplayController;
  private voiceController!: VoiceController;
  private strategySimplifier!: StrategySimplifier;
  
  // 运行状态
  private isActive: boolean = false;
  private recognitionInterval: NodeJS.Timeout | null = null;
  private gameHistory: Array<{ board: Board; action: Action; player: Player }> = [];

  constructor(config: AIAssistantConfig) {
    this.config = config;
    this.status = {
      isRunning: false,
      errorCount: 0,
      performance: {
        recognitionTime: 0,
        decisionTime: 0,
        totalTime: 0
      }
    };

    this.initializeModules();
  }

  /**
   * 初始化所有模块
   */
  private initializeModules(): void {
    // 初始化识别器
    if (this.config.recognition.source === 'screen') {
      this.recognizer = new ScreenGameRecognizer({
        gameType: 'tic-tac-toe',
        inputSource: 'screen',
        region: this.config.recognition.gameRegion,
        threshold: this.config.recognition.confidence
      });
    } else if (this.config.recognition.source === 'camera') {
      this.recognizer = new CameraGameRecognizer({
        gameType: 'tic-tac-toe',
        inputSource: 'camera',
        threshold: this.config.recognition.confidence
      });
    }

    // 初始化AI引擎
    this.aiEngine = new AIDecisionEngine(this.config.ai);

    // 初始化输出控制器
    this.autoController = new AutoExecutionController(this.config.output);
    this.displayController = new SuggestionDisplayController(this.config.output);
    this.voiceController = new VoiceController();

    // 初始化策略简化器
    this.strategySimplifier = new StrategySimplifier();

    // 设置语音命令监听
    this.setupVoiceCommands();
  }

  /**
   * 启动AI辅助系统
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('AI辅助系统已在运行');
      return;
    }

    try {
      // 启动摄像头（如果需要）
      if (this.config.recognition.source === 'camera' && this.recognizer) {
        await (this.recognizer as CameraGameRecognizer).startCamera();
      }

      // 启动语音监听（如果启用）
      if (this.config.output.voiceEnabled) {
        this.voiceController.startListening();
      }

      this.isActive = true;
      this.status.isRunning = true;

      // 开始游戏状态监控
      this.startGameMonitoring();

      console.log('AI辅助系统已启动');
    } catch (error) {
      console.error('启动AI辅助系统失败:', error);
      throw error;
    }
  }

  /**
   * 停止AI辅助系统
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    // 停止游戏监控
    if (this.recognitionInterval) {
      clearInterval(this.recognitionInterval);
      this.recognitionInterval = null;
    }

    // 停止摄像头
    if (this.config.recognition.source === 'camera' && this.recognizer) {
      (this.recognizer as CameraGameRecognizer).stopCamera();
    }

    // 停止语音监听
    this.voiceController.stopListening();

    this.isActive = false;
    this.status.isRunning = false;

    console.log('AI辅助系统已停止');
  }

  /**
   * 开始游戏状态监控
   */
  private startGameMonitoring(): void {
    if (this.config.recognition.source === 'manual') {
      // 手动模式不需要自动监控
      return;
    }

    this.recognitionInterval = setInterval(async () => {
      try {
        await this.processGameFrame();
      } catch (error) {
        this.status.errorCount++;
        console.error('游戏帧处理错误:', error);
        
        // 如果错误过多，暂停监控
        if (this.status.errorCount > 10) {
          console.warn('错误过多，暂停监控');
          this.stop();
        }
      }
    }, 1000); // 每秒检查一次
  }

  /**
   * 处理游戏帧
   */
  private async processGameFrame(): Promise<void> {
    if (!this.recognizer) return;

    const startTime = Date.now();

    // 1. 识别游戏状态
    const recognitionStart = Date.now();
    let recognition: RecognitionResult;

    if (this.recognizer instanceof ScreenGameRecognizer) {
      const imageData = await this.recognizer.captureScreen(this.config.recognition.gameRegion);
      recognition = await this.recognizer.recognizeTicTacToe(imageData);
    } else {
      recognition = await (this.recognizer as CameraGameRecognizer).recognizePhysicalBoard();
    }

    this.status.performance.recognitionTime = Date.now() - recognitionStart;

    // 检查识别置信度
    if (recognition.confidence < (this.config.recognition.confidence || 0.7)) {
      return; // 置信度不足，跳过此帧
    }

    // 2. 检查游戏状态是否变化
    if (this.isSameBoard(recognition.board, this.status.lastRecognition?.board)) {
      return; // 游戏状态未变化
    }

    this.status.lastRecognition = recognition;

    // 3. 获取AI决策
    const decisionStart = Date.now();
    const decision = await this.aiEngine.getDecision(recognition.board, recognition.currentPlayer);
    this.status.performance.decisionTime = Date.now() - decisionStart;
    this.status.lastDecision = decision;

    // 4. 执行输出
    await this.executeOutput(decision, recognition);

    this.status.performance.totalTime = Date.now() - startTime;
  }

  /**
   * 执行输出操作
   */
  private async executeOutput(decision: AIDecision, recognition: RecognitionResult): Promise<void> {
    // 显示建议
    this.displayController.displayDecision(decision);

    // 高亮建议位置
    if (this.config.recognition.gameRegion) {
      this.displayController.highlightSuggestedMove(decision.action, this.config.recognition.gameRegion);
    }

    // 自动执行（如果启用）
    if (this.config.output.autoExecute && this.config.recognition.gameRegion) {
      const result = await this.autoController.executeMouseClick(decision.action, this.config.recognition.gameRegion);
      if (result.success) {
        console.log('自动执行成功:', result.action);
      } else {
        console.error('自动执行失败:', result.error);
      }
    }

    // 记录游戏历史
    this.gameHistory.push({
      board: recognition.board,
      action: decision.action,
      player: recognition.currentPlayer
    });
  }

  /**
   * 手动输入游戏状态
   */
  async manualInput(board: Board, currentPlayer: Player): Promise<AIDecision> {
    const decision = await this.aiEngine.getDecision(board, currentPlayer);
    
    // 显示建议
    this.displayController.displayDecision(decision);
    
    // 显示简化策略建议
    if (this.config.strategy.showExplanations) {
      const ruleApplication = this.strategySimplifier.getBestMove(board, currentPlayer, this.config.strategy.level);
      if (ruleApplication) {
        console.log('策略建议:', ruleApplication.reasoning);
      }
    }

    return decision;
  }

  /**
   * 获取学习建议
   */
  getLearningAdvice(): any {
    if (!this.config.strategy.enableLearning) {
      return null;
    }

    // 评估玩家水平
    const assessment = this.strategySimplifier.assessPlayerLevel(this.gameHistory);
    
    // 获取学习建议
    const advice = this.strategySimplifier.getLearningAdvice(assessment.estimatedLevel);
    
    // 获取策略口诀
    const mnemonics = this.strategySimplifier.generateStrategyMnemonic(assessment.estimatedLevel);

    return {
      assessment,
      advice,
      mnemonics,
      gameHistory: this.gameHistory.length
    };
  }

  /**
   * 获取当前状态
   */
  getStatus(): SystemStatus {
    return { ...this.status };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AIAssistantConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 更新AI引擎配置
    if (newConfig.ai) {
      this.aiEngine.updateConfig(newConfig.ai);
    }
  }

  /**
   * 设置语音命令
   */
  private setupVoiceCommands(): void {
    window.addEventListener('voiceCommand', (event: any) => {
      const { action, command } = event.detail;
      console.log('收到语音命令:', command, '解析为:', action);
      
      // 可以在这里处理语音命令
      // 例如：手动执行指定位置的落子
    });
  }

  /**
   * 比较两个棋盘是否相同
   */
  private isSameBoard(board1?: Board, board2?: Board): boolean {
    if (!board1 || !board2) return false;
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board1[row][col] !== board2[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 导出游戏历史
   */
  exportGameHistory(): string {
    return JSON.stringify(this.gameHistory, null, 2);
  }

  /**
   * 导入游戏历史
   */
  importGameHistory(historyJson: string): void {
    try {
      this.gameHistory = JSON.parse(historyJson);
    } catch (error) {
      console.error('导入游戏历史失败:', error);
    }
  }

  /**
   * 清除游戏历史
   */
  clearGameHistory(): void {
    this.gameHistory = [];
  }
}
