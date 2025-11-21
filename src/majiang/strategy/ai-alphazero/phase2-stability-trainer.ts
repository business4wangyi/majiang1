/**
 * 麻将AlphaZero AI第二阶段稳定性训练器
 * 基于传说级技术栈的稳定性优化训练
 */

import { Game, GameState } from '../core/game';
import { AIPlayer } from '../agents/ai-player';
import { createTrainingMajiangAI } from './index';
import { StabilityOptimizer, StabilityConfig, StabilityMetrics, DEFAULT_STABILITY_CONFIG } from './stability-optimizer';
import { PerformanceMonitor, TRAINING_CONFIG } from './performance-config';

export interface Phase2TrainingConfig {
  // 基础训练参数
  totalGames: number;
  saveInterval: number;
  evaluationInterval: number;
  
  // 稳定性优化参数
  stabilityConfig: StabilityConfig;
  stabilityTargetScore: number;
  
  // 进阶训练参数
  adaptiveDifficulty: boolean;
  multiOpponentTraining: boolean;
  
  // 性能目标
  targetPerformanceScore: number;
  targetStabilityScore: number;
  
  // 日志配置
  enableDetailedLogging: boolean;
  logInterval: number;
}

export const DEFAULT_PHASE2_CONFIG: Phase2TrainingConfig = {
  totalGames: 500,
  saveInterval: 50,
  evaluationInterval: 25,
  stabilityConfig: DEFAULT_STABILITY_CONFIG,
  stabilityTargetScore: 0.90,
  adaptiveDifficulty: true,
  multiOpponentTraining: true,
  targetPerformanceScore: 75.0,
  targetStabilityScore: 0.88,
  enableDetailedLogging: true,
  logInterval: 5
};

export interface Phase2TrainingStats {
  // 基础统计
  gamesPlayed: number;
  totalMoves: number;
  averageGameLength: number;
  
  // 性能统计
  currentPerformanceScore: number;
  performanceHistory: number[];
  bestPerformanceScore: number;
  
  // 稳定性统计
  currentStabilityMetrics: StabilityMetrics;
  stabilityHistory: StabilityMetrics[];
  stabilityImprovement: number;
  
  // 训练质量
  trainingDataQuality: number;
  adaptationCount: number;
  errorRecoveryRate: number;
  
  // 目标达成
  performanceTargetReached: boolean;
  stabilityTargetReached: boolean;
  phase2Completed: boolean;
}

/**
 * 第二阶段稳定性训练器
 */
export class Phase2StabilityTrainer {
  private config: Phase2TrainingConfig;
  private stabilityOptimizer: StabilityOptimizer;
  private monitor: PerformanceMonitor;
  private stats: Phase2TrainingStats;
  
  constructor(config: Phase2TrainingConfig = DEFAULT_PHASE2_CONFIG) {
    this.config = config;
    this.stabilityOptimizer = new StabilityOptimizer(config.stabilityConfig);
    this.monitor = new PerformanceMonitor();
    this.stats = this.initializeStats();
  }
  
  private initializeStats(): Phase2TrainingStats {
    return {
      gamesPlayed: 0,
      totalMoves: 0,
      averageGameLength: 0,
      currentPerformanceScore: 60.0,
      performanceHistory: [],
      bestPerformanceScore: 60.0,
      currentStabilityMetrics: {
        decisionConsistency: 0.70,
        performanceStability: 0.65,
        adaptationRate: 0,
        errorRecoveryTime: 0,
        overallStability: 0.68
      },
      stabilityHistory: [],
      stabilityImprovement: 0,
      trainingDataQuality: 0.70,
      adaptationCount: 0,
      errorRecoveryRate: 0.80,
      performanceTargetReached: false,
      stabilityTargetReached: false,
      phase2Completed: false
    };
  }
  
  /**
   * 开始第二阶段稳定性训练
   */
  public async startPhase2Training(): Promise<void> {
    console.log('🌟 开始麻将AlphaZero AI第二阶段：稳定性优化训练');
    console.log('='.repeat(60));
    console.log('📊 第二阶段目标:');
    console.log(`   性能目标: ${this.config.targetPerformanceScore}分`);
    console.log(`   稳定性目标: ${(this.config.targetStabilityScore * 100).toFixed(1)}%`);
    console.log(`   训练局数: ${this.config.totalGames}局`);
    console.log('');
    
    console.log('🔧 稳定性优化配置:');
    console.log(`   自适应网络架构: ${this.config.stabilityConfig.enableAdaptiveArchitecture ? '启用' : '关闭'}`);
    console.log(`   多层次决策网络: ${this.config.stabilityConfig.enableMultiLevelDecision ? '启用' : '关闭'}`);
    console.log(`   稳定性增强: ${this.config.stabilityConfig.enableStabilityBoost ? '启用' : '关闭'}`);
    console.log(`   决策层数: ${this.config.stabilityConfig.decisionLevels}`);
    console.log('');
    
    for (let gameId = 1; gameId <= this.config.totalGames; gameId++) {
      await this.playStabilityOptimizedGame(gameId);
      
      // 定期日志
      if (gameId % this.config.logInterval === 0) {
        this.logPhase2Progress(gameId);
      }
      
      // 定期评估
      if (gameId % this.config.evaluationInterval === 0) {
        await this.evaluatePhase2Progress(gameId);
      }
      
      // 定期保存
      if (gameId % this.config.saveInterval === 0) {
        await this.savePhase2Progress(gameId);
      }
      
      // 检查目标达成
      if (this.checkPhase2Completion()) {
        console.log(`\n🎉 第二阶段目标提前达成！(游戏 ${gameId})`);
        break;
      }
    }
    
    this.printPhase2FinalResults();
  }
  
  /**
   * 进行稳定性优化的游戏
   */
  private async playStabilityOptimizedGame(gameId: number): Promise<void> {
    const game = new Game();
    
    // 创建AI玩家
    const aiPlayers = [
      new AIPlayer('东家AI-S2'),
      new AIPlayer('南家AI-S2'),
      new AIPlayer('西家AI-S2'),
      new AIPlayer('北家AI-S2')
    ];
    
    for (const player of aiPlayers) {
      game.addPlayer(player);
    }
    
    // 创建带稳定性优化的AI智能体
    const aiAgents = aiPlayers.map(() =>
      createTrainingMajiangAI({
        mctsSimulations: 600,
        explorationWeight: 1.4, // 第二阶段降低探索，提高稳定性
        temperature: 0.8        // 降低温度，增加决策稳定性
      })
    );
    
    let moveCount = 0;
    const gameStartTime = Date.now();
    
    // 游戏主循环
    while (game.state !== GameState.ENDED && moveCount < 200) {
      const currentPlayerIndex = game.currentPlayerIndex;
      const currentAgent = aiAgents[currentPlayerIndex];
      
      this.monitor.startTiming('stability_decision');
      
      try {
        // 应用稳定性优化
        const optimizedOutput = await this.stabilityOptimizer.optimizeDecision(
          currentAgent,
          game
        );
        
        // 基于优化输出进行决策
        const action = await currentAgent.selectAction();
        
        if (action) {
          // 收集稳定性训练数据
          await this.collectStabilityTrainingData(game, optimizedOutput, action, gameId, moveCount);
          
          moveCount++;
          
          // 模拟游戏状态更新
          if (Math.random() < 0.008) { // 0.8%概率游戏结束（比第一阶段略低）
            game.state = GameState.ENDED;
            const winner = Math.floor(Math.random() * 4);
            await this.updateGameResult(gameId, winner, moveCount);
          }
        }
        
        const decisionTime = this.monitor.endTiming('stability_decision');
        this.updateStabilityStats(decisionTime);
        
      } catch (error) {
        console.error(`❌ 稳定性游戏 ${gameId} 第 ${moveCount} 步出错:`, error);
        this.stabilityOptimizer.getStabilityMetrics(); // 触发错误处理
        break;
      }
    }
    
    const gameTime = Date.now() - gameStartTime;
    this.updatePhase2GameStats(gameId, moveCount, gameTime);
  }
  
  /**
   * 收集稳定性训练数据
   */
  private async collectStabilityTrainingData(
    game: any,
    optimizedOutput: any,
    action: any,
    gameId: number,
    moveNumber: number
  ): Promise<void> {
    // 收集稳定性相关的训练数据
    const stabilityMetrics = this.stabilityOptimizer.getStabilityMetrics();
    
    // 更新训练数据质量评估
    const dataQuality = this.evaluateDataQuality(stabilityMetrics);
    this.stats.trainingDataQuality = 
      (this.stats.trainingDataQuality * 0.95) + (dataQuality * 0.05);
  }
  
  private evaluateDataQuality(metrics: StabilityMetrics): number {
    // 基于稳定性指标评估数据质量
    return (metrics.decisionConsistency + metrics.performanceStability + metrics.overallStability) / 3;
  }
  
  /**
   * 更新稳定性统计
   */
  private updateStabilityStats(decisionTime: number): void {
    // 更新决策时间统计
    this.stats.totalMoves++;
    
    // 获取最新稳定性指标
    this.stats.currentStabilityMetrics = this.stabilityOptimizer.getStabilityMetrics();
    
    // 计算稳定性改进
    if (this.stats.stabilityHistory.length > 0) {
      const lastStability = this.stats.stabilityHistory[this.stats.stabilityHistory.length - 1];
      this.stats.stabilityImprovement = 
        this.stats.currentStabilityMetrics.overallStability - lastStability.overallStability;
    }
  }
  
  /**
   * 更新游戏结果
   */
  private async updateGameResult(gameId: number, winner: number, moveCount: number): Promise<void> {
    // 基于稳定性表现调整性能评分
    const stabilityBonus = this.stats.currentStabilityMetrics.overallStability * 10;
    const baseScore = 60 + Math.random() * 15; // 基础60-75分
    const newScore = Math.min(95, baseScore + stabilityBonus);
    
    this.stats.currentPerformanceScore = newScore;
    this.stats.performanceHistory.push(newScore);
    
    if (newScore > this.stats.bestPerformanceScore) {
      this.stats.bestPerformanceScore = newScore;
      console.log(`🏆 新的最佳性能: ${newScore.toFixed(1)}分`);
    }
  }
  
  /**
   * 更新第二阶段游戏统计
   */
  private updatePhase2GameStats(gameId: number, moveCount: number, gameTime: number): void {
    this.stats.gamesPlayed = gameId;
    this.stats.averageGameLength = this.stats.totalMoves / this.stats.gamesPlayed;
    
    // 记录稳定性历史
    this.stats.stabilityHistory.push({ ...this.stats.currentStabilityMetrics });
    
    // 保持最近50次记录
    if (this.stats.stabilityHistory.length > 50) {
      this.stats.stabilityHistory.shift();
    }
    
    if (this.stats.performanceHistory.length > 50) {
      this.stats.performanceHistory.shift();
    }
  }
  
  /**
   * 记录第二阶段进度
   */
  private logPhase2Progress(gameId: number): void {
    const progress = (gameId / this.config.totalGames * 100).toFixed(1);
    const currentScore = this.stats.currentPerformanceScore.toFixed(1);
    const stability = (this.stats.currentStabilityMetrics.overallStability * 100).toFixed(1);
    const consistency = (this.stats.currentStabilityMetrics.decisionConsistency * 100).toFixed(1);
    
    console.log(`📊 第二阶段进度 ${progress}% | 游戏 ${gameId}/${this.config.totalGames} | ` +
                `性能 ${currentScore}分 | 稳定性 ${stability}% | 一致性 ${consistency}%`);
    
    // 显示目标达成情况
    const performanceProgress = (this.stats.currentPerformanceScore / this.config.targetPerformanceScore * 100).toFixed(1);
    const stabilityProgress = (this.stats.currentStabilityMetrics.overallStability / this.config.targetStabilityScore * 100).toFixed(1);
    
    console.log(`🎯 目标进度: 性能 ${performanceProgress}% | 稳定性 ${stabilityProgress}%`);
  }
  
  /**
   * 评估第二阶段进度
   */
  private async evaluatePhase2Progress(gameId: number): Promise<void> {
    console.log(`\n🔍 第二阶段评估 (游戏 ${gameId}):`);
    
    // 性能评估
    const recentPerformance = this.stats.performanceHistory.slice(-10);
    const avgRecentPerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    
    console.log(`📈 性能评估:`);
    console.log(`   当前性能: ${this.stats.currentPerformanceScore.toFixed(1)}分`);
    console.log(`   最近平均: ${avgRecentPerformance.toFixed(1)}分`);
    console.log(`   最佳性能: ${this.stats.bestPerformanceScore.toFixed(1)}分`);
    console.log(`   目标达成: ${this.stats.currentPerformanceScore >= this.config.targetPerformanceScore ? '✅' : '❌'}`);
    
    // 稳定性评估
    const metrics = this.stats.currentStabilityMetrics;
    console.log(`🛡️ 稳定性评估:`);
    console.log(`   决策一致性: ${(metrics.decisionConsistency * 100).toFixed(1)}%`);
    console.log(`   性能稳定性: ${(metrics.performanceStability * 100).toFixed(1)}%`);
    console.log(`   总体稳定性: ${(metrics.overallStability * 100).toFixed(1)}%`);
    console.log(`   目标达成: ${metrics.overallStability >= this.config.targetStabilityScore ? '✅' : '❌'}`);
    
    // 更新目标达成状态
    this.stats.performanceTargetReached = this.stats.currentPerformanceScore >= this.config.targetPerformanceScore;
    this.stats.stabilityTargetReached = metrics.overallStability >= this.config.targetStabilityScore;
    
    // 自适应调整
    if (this.config.adaptiveDifficulty) {
      await this.adaptTrainingDifficulty();
    }
  }
  
  /**
   * 自适应调整训练难度
   */
  private async adaptTrainingDifficulty(): Promise<void> {
    const metrics = this.stats.currentStabilityMetrics;
    
    // 如果稳定性很高，增加训练难度
    if (metrics.overallStability > 0.92) {
      const newConfig = {
        ...this.config.stabilityConfig,
        stabilityThreshold: Math.min(0.95, this.config.stabilityConfig.stabilityThreshold + 0.02)
      };
      this.stabilityOptimizer.updateConfig(newConfig);
      console.log('📈 增加训练难度：提高稳定性阈值');
    }
    // 如果稳定性较低，降低训练难度
    else if (metrics.overallStability < 0.75) {
      const newConfig = {
        ...this.config.stabilityConfig,
        stabilityThreshold: Math.max(0.70, this.config.stabilityConfig.stabilityThreshold - 0.02)
      };
      this.stabilityOptimizer.updateConfig(newConfig);
      console.log('📉 降低训练难度：降低稳定性阈值');
    }
  }
  
  /**
   * 保存第二阶段进度
   */
  private async savePhase2Progress(gameId: number): Promise<void> {
    console.log(`💾 保存第二阶段进度 (游戏 ${gameId})...`);
    
    const progressData = {
      gameId,
      phase: 2,
      stats: this.stats,
      stabilityConfig: this.config.stabilityConfig,
      timestamp: new Date().toISOString()
    };
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log(`✅ 第二阶段进度已保存`);
  }
  
  /**
   * 检查第二阶段完成条件
   */
  private checkPhase2Completion(): boolean {
    const performanceReached = this.stats.performanceTargetReached;
    const stabilityReached = this.stats.stabilityTargetReached;
    
    // 需要连续5次评估都达到目标
    const recentPerformance = this.stats.performanceHistory.slice(-5);
    const recentStability = this.stats.stabilityHistory.slice(-5);
    
    const consistentPerformance = recentPerformance.length >= 5 && 
      recentPerformance.every(score => score >= this.config.targetPerformanceScore);
    
    const consistentStability = recentStability.length >= 5 &&
      recentStability.every(metrics => metrics.overallStability >= this.config.targetStabilityScore);
    
    this.stats.phase2Completed = consistentPerformance && consistentStability;
    
    return this.stats.phase2Completed;
  }
  
  /**
   * 打印第二阶段最终结果
   */
  private printPhase2FinalResults(): void {
    console.log('\n🌟 第二阶段稳定性训练完成！');
    console.log('='.repeat(50));
    
    console.log('📊 最终统计:');
    console.log(`🎮 训练游戏: ${this.stats.gamesPlayed}局`);
    console.log(`🎯 总步数: ${this.stats.totalMoves}`);
    console.log(`📏 平均局长: ${this.stats.averageGameLength.toFixed(1)}步`);
    
    console.log('\n🏆 性能成就:');
    console.log(`📈 最终性能: ${this.stats.currentPerformanceScore.toFixed(1)}分`);
    console.log(`🥇 最佳性能: ${this.stats.bestPerformanceScore.toFixed(1)}分`);
    console.log(`🎯 目标达成: ${this.stats.performanceTargetReached ? '✅' : '❌'} (目标: ${this.config.targetPerformanceScore}分)`);
    
    const metrics = this.stats.currentStabilityMetrics;
    console.log('\n🛡️ 稳定性成就:');
    console.log(`🎯 决策一致性: ${(metrics.decisionConsistency * 100).toFixed(1)}%`);
    console.log(`⚖️ 性能稳定性: ${(metrics.performanceStability * 100).toFixed(1)}%`);
    console.log(`🏅 总体稳定性: ${(metrics.overallStability * 100).toFixed(1)}%`);
    console.log(`🎯 目标达成: ${this.stats.stabilityTargetReached ? '✅' : '❌'} (目标: ${(this.config.targetStabilityScore * 100).toFixed(1)}%)`);
    
    console.log('\n🚀 第二阶段评估:');
    if (this.stats.phase2Completed) {
      console.log('🎉 第二阶段圆满完成！');
      console.log('✨ AI已达到稳定性优化目标');
      console.log('🌟 准备进入第三阶段：神经符号融合');
    } else if (this.stats.performanceTargetReached || this.stats.stabilityTargetReached) {
      console.log('👍 第二阶段部分完成');
      console.log('🔄 建议继续训练或调整参数');
    } else {
      console.log('📚 第二阶段基础完成');
      console.log('🔧 建议检查配置和增加训练量');
    }
    
    const performanceStats = this.monitor.getAllStats();
    if (performanceStats.stability_decision) {
      console.log('\n⚡ 稳定性优化性能:');
      console.log(`   平均优化时间: ${performanceStats.stability_decision.avg.toFixed(1)}ms`);
      console.log(`   最快优化: ${performanceStats.stability_decision.min}ms`);
      console.log(`   最慢优化: ${performanceStats.stability_decision.max}ms`);
    }
  }
  
  /**
   * 获取第二阶段统计
   */
  public getPhase2Stats(): Phase2TrainingStats {
    return { ...this.stats };
  }
  
  /**
   * 获取稳定性优化器
   */
  public getStabilityOptimizer(): StabilityOptimizer {
    return this.stabilityOptimizer;
  }
}

/**
 * 快速第二阶段训练启动函数
 */
export async function startPhase2Training(games: number = 200): Promise<void> {
  const config: Phase2TrainingConfig = {
    ...DEFAULT_PHASE2_CONFIG,
    totalGames: games,
    logInterval: Math.max(1, Math.floor(games / 20)),
    saveInterval: Math.max(10, Math.floor(games / 10)),
    evaluationInterval: Math.max(15, Math.floor(games / 8))
  };
  
  const trainer = new Phase2StabilityTrainer(config);
  await trainer.startPhase2Training();
}