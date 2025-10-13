#!/usr/bin/env npx ts-node
// {{ AURA-X: Add - A3C演示训练器，展示优化后的输出效果. Approval: 寸止(ID:A3C演示). }}

/**
 * A3C演示训练器
 * 
 * 不依赖TensorFlow.js，专门用于演示优化后的日志输出效果：
 * - 展示日志分级和输出频率控制
 * - 演示结构化输出格式
 * - 模拟真实训练过程的输出模式
 */

/**
 * 演示配置接口
 */
interface A3CDemoConfig {
  totalEpisodes: number;
  evaluationFrequency: number;
  evaluationGames: number;
  progressFrequency: number;
  outputFormat: 'console' | 'structured' | 'minimal';
  verbose: boolean;
  simulateTrainingTime: boolean;
}

/**
 * 预设配置
 */
const DEMO_CONFIGS = {
  original: {
    totalEpisodes: 1000,
    evaluationFrequency: 500,
    evaluationGames: 20,
    progressFrequency: 100, // 原版每100轮输出
    outputFormat: 'console' as const,
    verbose: true,
    simulateTrainingTime: false
  },
  optimized: {
    totalEpisodes: 1000,
    evaluationFrequency: 500,
    evaluationGames: 20,
    progressFrequency: 500, // 优化后每500轮输出
    outputFormat: 'minimal' as const,
    verbose: false,
    simulateTrainingTime: false
  },
  structured: {
    totalEpisodes: 1000,
    evaluationFrequency: 500,
    evaluationGames: 20,
    progressFrequency: 200,
    outputFormat: 'structured' as const,
    verbose: false,
    simulateTrainingTime: false
  }
};

/**
 * A3C演示训练器类
 */
class A3CDemoTrainer {
  private config: A3CDemoConfig;
  private startTime: number = 0;
  private stats: any[] = [];

  constructor(config: A3CDemoConfig) {
    this.config = config;
  }

  /**
   * 日志输出方法
   */
  private log(level: 'info' | 'debug' | 'warn' | 'error', message: string): void {
    if (this.config.outputFormat === 'minimal' && level === 'debug') {
      return;
    }
    
    if (this.config.outputFormat === 'structured') {
      const timestamp = new Date().toISOString();
      const structured = {
        timestamp,
        level,
        message: message.replace(/[🚀🎯📊✅❌⚠️🧠🎮🔍]/g, '').trim(),
        emoji: this.extractEmoji(message)
      };
      console.log(JSON.stringify(structured));
    } else {
      console.log(message);
    }
  }

  /**
   * 提取emoji
   */
  private extractEmoji(message: string): string {
    const emojiMatch = message.match(/[🚀🎯📊✅❌⚠️🧠🎮🔍]/);
    return emojiMatch ? emojiMatch[0] : '';
  }

  /**
   * 模拟训练统计
   */
  private generateMockStats(episode: number): any {
    const baseWinRate = 0.3 + (episode / this.config.totalEpisodes) * 0.4; // 30% -> 70%
    const noise = (Math.random() - 0.5) * 0.1;
    
    return {
      episode,
      winRate: Math.max(0, Math.min(1, baseWinRate + noise)),
      avgReward: 0.5 + Math.random() * 0.3,
      actorLoss: 0.1 + Math.random() * 0.05,
      criticLoss: 0.2 + Math.random() * 0.1,
      entropy: 0.8 + Math.random() * 0.2
    };
  }

  /**
   * 输出训练进度
   */
  private outputProgress(episode: number): void {
    const recentCount = Math.min(this.config.progressFrequency, this.stats.length);
    const recentStats = this.stats.slice(-recentCount);
    
    const avgWinRate = recentStats.reduce((sum, stat) => sum + stat.winRate, 0) / recentCount * 100;
    const avgReward = recentStats.reduce((sum, stat) => sum + stat.avgReward, 0) / recentCount;
    const avgActorLoss = recentStats.reduce((sum, stat) => sum + stat.actorLoss, 0) / recentCount;
    const avgCriticLoss = recentStats.reduce((sum, stat) => sum + stat.criticLoss, 0) / recentCount;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = (elapsed / episode) * (this.config.totalEpisodes - episode);

    if (this.config.outputFormat === 'structured') {
      const progress = {
        episode,
        progress: `${episode}/${this.config.totalEpisodes}`,
        winRate: avgWinRate.toFixed(1),
        avgReward: avgReward.toFixed(1),
        actorLoss: avgActorLoss.toFixed(4),
        criticLoss: avgCriticLoss.toFixed(4),
        remainingTime: `${Math.floor(remaining/60)}m${Math.floor(remaining%60)}s`
      };
      this.log('info', `📊 训练进度: ${JSON.stringify(progress)}`);
    } else if (this.config.outputFormat === 'minimal') {
      this.log('info', `📊 [${episode}轮] 胜率:${avgWinRate.toFixed(1)}% | 奖励:${avgReward.toFixed(1)} | 损失:${avgActorLoss.toFixed(3)}/${avgCriticLoss.toFixed(3)} | 剩余:${Math.floor(remaining/60)}m`);
    } else {
      this.log('info', `📊 [${episode}轮] 近${recentCount}轮胜率:${avgWinRate.toFixed(1)}% | 平均奖励:${avgReward.toFixed(1)} | Actor损失:${avgActorLoss.toFixed(4)} | Critic损失:${avgCriticLoss.toFixed(4)} | 剩余时间:${Math.floor(remaining/60)}m${Math.floor(remaining%60)}s`);
    }
  }

  /**
   * 输出评估结果
   */
  private outputEvaluation(episode: number): void {
    const vsRandom = 60 + Math.random() * 30; // 60-90%
    const vsGreedy = 40 + Math.random() * 30; // 40-70%
    const vsHeuristic = 20 + Math.random() * 20; // 20-40%

    if (this.config.outputFormat === 'structured') {
      const evaluationResults = {
        episode,
        games: this.config.evaluationGames,
        vsRandom: `${vsRandom.toFixed(1)}%`,
        vsGreedy: `${vsGreedy.toFixed(1)}%`,
        vsHeuristic: `${vsHeuristic.toFixed(1)}%`
      };
      this.log('info', `📊 评估结果: ${JSON.stringify(evaluationResults)}`);
    } else if (this.config.outputFormat === 'minimal') {
      this.log('info', `📊 评估[${episode}轮]: 随机${vsRandom.toFixed(1)}% | 贪心${vsGreedy.toFixed(1)}% | 启发式${vsHeuristic.toFixed(1)}%`);
    } else {
      this.log('info', `📊 评估结果 (${this.config.evaluationGames}局):`);
      this.log('info', `   vs 随机策略: ${vsRandom.toFixed(1)}% (${Math.round(vsRandom * this.config.evaluationGames / 100)}胜)`);
      this.log('info', `   vs 贪心策略: ${vsGreedy.toFixed(1)}% (${Math.round(vsGreedy * this.config.evaluationGames / 100)}胜)`);
      this.log('info', `   vs 启发式策略: ${vsHeuristic.toFixed(1)}% (${Math.round(vsHeuristic * this.config.evaluationGames / 100)}胜)`);
    }
  }

  /**
   * 开始演示训练
   */
  async startDemo(): Promise<void> {
    this.log('info', '🚀 开始A3C训练演示...');
    this.log('info', `📋 配置: ${this.config.totalEpisodes}轮训练`);
    this.log('info', `📊 输出格式: ${this.config.outputFormat}`);
    this.log('info', `🔄 进度频率: 每${this.config.progressFrequency}轮`);
    this.log('info', `🎯 评估频率: 每${this.config.evaluationFrequency}轮`);
    
    if (this.config.outputFormat === 'console') {
      this.log('info', '================================================================================');
    }

    this.startTime = Date.now();

    for (let episode = 1; episode <= this.config.totalEpisodes; episode++) {
      // 生成模拟统计
      const stats = this.generateMockStats(episode);
      this.stats.push(stats);

      // 输出进度
      if (episode % this.config.progressFrequency === 0) {
        this.outputProgress(episode);
      }

      // 评估
      if (episode % this.config.evaluationFrequency === 0) {
        this.outputEvaluation(episode);
      }

      // 模拟训练时间
      if (this.config.simulateTrainingTime) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const totalTime = (Date.now() - this.startTime) / 1000;
    this.log('info', `✅ A3C训练演示完成! 总用时: ${(totalTime / 60).toFixed(2)}分钟`);
    
    // 输出最终统计
    this.outputFinalStats();
  }

  /**
   * 输出最终统计
   */
  private outputFinalStats(): void {
    if (this.stats.length === 0) return;

    const avgWinRate = this.stats.reduce((sum, stat) => sum + stat.winRate, 0) / this.stats.length * 100;
    const avgReward = this.stats.reduce((sum, stat) => sum + stat.avgReward, 0) / this.stats.length;
    const avgActorLoss = this.stats.reduce((sum, stat) => sum + stat.actorLoss, 0) / this.stats.length;
    const avgCriticLoss = this.stats.reduce((sum, stat) => sum + stat.criticLoss, 0) / this.stats.length;

    if (this.config.outputFormat === 'structured') {
      const finalStats = {
        totalEpisodes: this.config.totalEpisodes,
        overallWinRate: avgWinRate.toFixed(1),
        avgReward: avgReward.toFixed(1),
        avgActorLoss: avgActorLoss.toFixed(4),
        avgCriticLoss: avgCriticLoss.toFixed(4),
        trainingTime: `${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)}分钟`,
        outputReduction: `${((1 - this.config.progressFrequency / 100) * 100).toFixed(0)}%`
      };
      this.log('info', `📊 最终统计: ${JSON.stringify(finalStats)}`);
    } else {
      this.log('info', `📊 最终统计:`);
      this.log('info', `   总体胜率: ${avgWinRate.toFixed(1)}%`);
      this.log('info', `   平均奖励: ${avgReward.toFixed(1)}`);
      this.log('info', `   平均Actor损失: ${avgActorLoss.toFixed(4)}`);
      this.log('info', `   平均Critic损失: ${avgCriticLoss.toFixed(4)}`);
      this.log('info', `   输出减少: ${((1 - this.config.progressFrequency / 100) * 100).toFixed(0)}%`);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const mode = process.argv[2] || 'optimized';
  
  if (!DEMO_CONFIGS[mode as keyof typeof DEMO_CONFIGS]) {
    console.error(`❌ 未知模式: ${mode}`);
    console.log('可用模式: original, optimized, structured');
    process.exit(1);
  }

  const config = DEMO_CONFIGS[mode as keyof typeof DEMO_CONFIGS];
  
  console.log(`🎭 A3C训练输出演示 - ${mode}模式`);
  console.log(`📊 输出对比: ${mode === 'original' ? '原版' : mode === 'optimized' ? '优化版' : '结构化版'}`);
  console.log('');

  const trainer = new A3CDemoTrainer(config);
  await trainer.startDemo();
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export { A3CDemoTrainer, DEMO_CONFIGS };
