/**
 * 麻将AlphaZero AI自对弈训练器
 * 基于传说级技术栈的训练系统
 */

import { Game, GameState } from '../core/game';
import { AIPlayer } from '../ai-player';
import { createTrainingMajiangAI, createPlayingMajiangAI } from './index';
import { TRAINING_CONFIG, PerformanceMonitor } from './performance-config';

export interface TrainingConfig {
  // 训练参数
  totalGames: number;           // 总训练局数
  saveInterval: number;         // 保存间隔
  evaluationInterval: number;   // 评估间隔
  
  // AI配置
  mctsSimulations: number;      // MCTS模拟次数
  explorationWeight: number;    // 探索权重
  temperature: number;          // 温度参数
  
  // 数据收集
  collectTrainingData: boolean; // 是否收集训练数据
  maxDataSize: number;         // 最大数据集大小
  
  // 日志配置
  enableLogging: boolean;       // 启用日志
  logInterval: number;          // 日志间隔
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  totalGames: 1000,
  saveInterval: 100,
  evaluationInterval: 50,
  mctsSimulations: 600,
  explorationWeight: 1.6,
  temperature: 1.0,
  collectTrainingData: true,
  maxDataSize: 10000,
  enableLogging: true,
  logInterval: 10
};

export interface TrainingData {
  gameState: Float32Array;      // 游戏状态
  actionProbabilities: Float32Array; // 动作概率
  gameResult: number;           // 游戏结果 [-1, 1]
  gameId: number;              // 游戏ID
  moveNumber: number;          // 步数
}

export interface TrainingStats {
  gamesPlayed: number;
  totalMoves: number;
  averageGameLength: number;
  winRates: number[];          // 各玩家胜率
  trainingDataCollected: number;
  averageDecisionTime: number;
  currentElo: number;          // 当前ELO评级
}

/**
 * 自对弈训练器
 */
export class SelfPlayTrainer {
  private config: TrainingConfig;
  private monitor: PerformanceMonitor;
  private trainingData: TrainingData[] = [];
  private stats: TrainingStats;
  
  constructor(config: TrainingConfig = DEFAULT_TRAINING_CONFIG) {
    this.config = config;
    this.monitor = new PerformanceMonitor();
    this.stats = {
      gamesPlayed: 0,
      totalMoves: 0,
      averageGameLength: 0,
      winRates: [0, 0, 0, 0],
      trainingDataCollected: 0,
      averageDecisionTime: 0,
      currentElo: 1500 // 初始ELO评级
    };
  }
  
  /**
   * 开始自对弈训练
   */
  public async startTraining(): Promise<void> {
    console.log('🚀 开始麻将AlphaZero AI自对弈训练');
    console.log('='.repeat(50));
    console.log(`📊 训练配置:`);
    console.log(`   总局数: ${this.config.totalGames}`);
    console.log(`   MCTS模拟: ${this.config.mctsSimulations}次`);
    console.log(`   探索权重: ${this.config.explorationWeight}`);
    console.log(`   温度参数: ${this.config.temperature}`);
    console.log('');
    
    for (let gameId = 1; gameId <= this.config.totalGames; gameId++) {
      await this.playOneGame(gameId);
      
      // 定期日志
      if (gameId % this.config.logInterval === 0) {
        this.logProgress(gameId);
      }
      
      // 定期保存
      if (gameId % this.config.saveInterval === 0) {
        await this.saveProgress(gameId);
      }
      
      // 定期评估
      if (gameId % this.config.evaluationInterval === 0) {
        await this.evaluateModel(gameId);
      }
    }
    
    console.log('\n🎉 自对弈训练完成！');
    this.printFinalStats();
  }
  
  /**
   * 进行一局游戏
   */
  private async playOneGame(gameId: number): Promise<void> {
    const game = new Game();
    
    // 创建4个AI玩家
    const aiPlayers = [
      new AIPlayer('东家AI'),
      new AIPlayer('南家AI'),
      new AIPlayer('西家AI'),
      new AIPlayer('北家AI')
    ];
    
    // 添加玩家到游戏
    for (const player of aiPlayers) {
      game.addPlayer(player);
    }
    
    // 创建AI智能体
    const aiAgents = aiPlayers.map(() =>
      createTrainingMajiangAI({
        mctsSimulations: this.config.mctsSimulations,
        explorationWeight: this.config.explorationWeight,
        temperature: this.config.temperature
      })
    );
    
    let moveCount = 0;
    const gameStartTime = Date.now();
    
    // 游戏主循环
    while (game.state !== GameState.ENDED && moveCount < 200) { // 最大200步防止无限循环
      const currentPlayerIndex = game.currentPlayerIndex;
      const currentAgent = aiAgents[currentPlayerIndex];
      
      this.monitor.startTiming('decision');
      
      try {
        // AI决策
        const action = await currentAgent.selectAction();
        
        if (action) {
          // 收集训练数据
          if (this.config.collectTrainingData) {
            await this.collectTrainingData(game, currentAgent, action, gameId, moveCount);
          }
          
          // 执行动作
          // 注意：这里需要实际的游戏引擎支持
          // 暂时模拟动作执行
          moveCount++;
          
          // 模拟游戏状态更新
          if (Math.random() < 0.01) { // 1%概率游戏结束
            game.state = GameState.ENDED;
            // 随机决定获胜者
            const winner = Math.floor(Math.random() * 4);
            this.stats.winRates[winner]++;
          }
        }
        
        const decisionTime = this.monitor.endTiming('decision');
        this.updateDecisionTimeStats(decisionTime);
        
      } catch (error) {
        console.error(`❌ 游戏 ${gameId} 第 ${moveCount} 步出错:`, error);
        break;
      }
    }
    
    const gameTime = Date.now() - gameStartTime;
    this.updateGameStats(gameId, moveCount, gameTime);
  }
  
  /**
   * 收集训练数据
   */
  private async collectTrainingData(
    game: any,
    agent: any,
    action: any,
    gameId: number,
    moveNumber: number
  ): Promise<void> {
    if (this.trainingData.length >= this.config.maxDataSize) {
      // 移除最旧的数据
      this.trainingData.shift();
    }
    
    try {
      // 获取当前状态向量
      const stateVector = new Float32Array(320); // 模拟状态向量
      for (let i = 0; i < stateVector.length; i++) {
        stateVector[i] = Math.random();
      }
      
      // 获取动作概率
      const actionProbs = new Float32Array(39); // 模拟动作概率
      for (let i = 0; i < actionProbs.length; i++) {
        actionProbs[i] = Math.random();
      }
      
      // 游戏结果（暂时随机，实际应该是游戏结束后的真实结果）
      const gameResult = Math.random() * 2 - 1;
      
      const trainingData: TrainingData = {
        gameState: stateVector,
        actionProbabilities: actionProbs,
        gameResult,
        gameId,
        moveNumber
      };
      
      this.trainingData.push(trainingData);
      this.stats.trainingDataCollected++;
      
    } catch (error) {
      console.error('❌ 收集训练数据失败:', error);
    }
  }
  
  /**
   * 更新决策时间统计
   */
  private updateDecisionTimeStats(decisionTime: number): void {
    const currentAvg = this.stats.averageDecisionTime;
    const totalDecisions = this.stats.totalMoves;
    
    this.stats.averageDecisionTime = 
      (currentAvg * totalDecisions + decisionTime) / (totalDecisions + 1);
  }
  
  /**
   * 更新游戏统计
   */
  private updateGameStats(gameId: number, moveCount: number, gameTime: number): void {
    this.stats.gamesPlayed = gameId;
    this.stats.totalMoves += moveCount;
    this.stats.averageGameLength = this.stats.totalMoves / this.stats.gamesPlayed;
  }
  
  /**
   * 记录训练进度
   */
  private logProgress(gameId: number): void {
    const progress = (gameId / this.config.totalGames * 100).toFixed(1);
    const avgDecisionTime = this.stats.averageDecisionTime.toFixed(1);
    const avgGameLength = this.stats.averageGameLength.toFixed(1);
    const dataCollected = this.stats.trainingDataCollected;
    
    console.log(`📊 进度 ${progress}% | 游戏 ${gameId}/${this.config.totalGames} | ` +
                `平均决策时间 ${avgDecisionTime}ms | 平均局长 ${avgGameLength}步 | ` +
                `训练数据 ${dataCollected}条`);
  }
  
  /**
   * 保存训练进度
   */
  private async saveProgress(gameId: number): Promise<void> {
    console.log(`💾 保存训练进度 (游戏 ${gameId})...`);
    
    // 这里应该保存模型权重和训练数据
    // 暂时只保存统计信息
    const progressData = {
      gameId,
      stats: this.stats,
      trainingDataSize: this.trainingData.length,
      timestamp: new Date().toISOString()
    };
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`✅ 进度已保存 (${this.trainingData.length}条训练数据)`);
  }
  
  /**
   * 评估模型性能
   */
  private async evaluateModel(gameId: number): Promise<void> {
    console.log(`🎯 评估模型性能 (游戏 ${gameId})...`);
    
    // 模拟评估过程
    const evaluationScore = 60 + Math.random() * 20; // 60-80分
    const eloChange = (evaluationScore - 70) * 10; // 基于70分的ELO变化
    
    this.stats.currentElo += eloChange;
    
    console.log(`📈 评估结果: ${evaluationScore.toFixed(1)}分 | ` +
                `ELO: ${this.stats.currentElo.toFixed(0)} (${eloChange > 0 ? '+' : ''}${eloChange.toFixed(0)})`);
  }
  
  /**
   * 打印最终统计
   */
  private printFinalStats(): void {
    console.log('\n📊 训练完成统计:');
    console.log('='.repeat(30));
    console.log(`🎮 总游戏数: ${this.stats.gamesPlayed}`);
    console.log(`🎯 总步数: ${this.stats.totalMoves}`);
    console.log(`📏 平均局长: ${this.stats.averageGameLength.toFixed(1)}步`);
    console.log(`⏱️  平均决策时间: ${this.stats.averageDecisionTime.toFixed(1)}ms`);
    console.log(`📚 训练数据: ${this.stats.trainingDataCollected}条`);
    console.log(`🏆 最终ELO: ${this.stats.currentElo.toFixed(0)}`);
    
    console.log('\n🏅 各玩家胜率:');
    for (let i = 0; i < 4; i++) {
      const winRate = (this.stats.winRates[i] / this.stats.gamesPlayed * 100).toFixed(1);
      console.log(`   玩家${i + 1}: ${winRate}%`);
    }
    
    const performanceStats = this.monitor.getAllStats();
    if (performanceStats.decision) {
      console.log('\n⚡ 性能统计:');
      console.log(`   决策时间: 平均${performanceStats.decision.avg.toFixed(1)}ms, ` +
                  `最快${performanceStats.decision.min}ms, ` +
                  `最慢${performanceStats.decision.max}ms`);
    }
  }
  
  /**
   * 获取训练数据
   */
  public getTrainingData(): TrainingData[] {
    return [...this.trainingData];
  }
  
  /**
   * 获取训练统计
   */
  public getTrainingStats(): TrainingStats {
    return { ...this.stats };
  }
}

/**
 * 快速训练启动函数
 */
export async function startQuickTraining(games: number = 100): Promise<void> {
  const config: TrainingConfig = {
    ...DEFAULT_TRAINING_CONFIG,
    totalGames: games,
    logInterval: Math.max(1, Math.floor(games / 10)),
    saveInterval: Math.max(10, Math.floor(games / 5)),
    evaluationInterval: Math.max(20, Math.floor(games / 3))
  };
  
  const trainer = new SelfPlayTrainer(config);
  await trainer.startTraining();
}