// {{ AURA-X: Add - 高性能AlphaZero训练器，优化训练速度. Approval: 寸止(ID:性能优化). }}

/**
 * 高性能AlphaZero训练器
 * 
 * 性能优化策略：
 * 1. 并行化自我对弈：使用Promise.all并行执行多局游戏
 * 2. 动态MCTS模拟次数：训练早期使用较少模拟，逐步增加
 * 3. 批量推理优化：充分利用批量预测
 * 4. 自适应训练参数：根据训练进度动态调整
 * 5. 减少评估频率：降低评估开销
 */

// Fix for isNullOrUndefined compatibility issue (must be first)
import '../../../shared/utils/tfjs-compat-fix';
import '@tensorflow/tfjs-node';

import { AlphaZeroTrainer, AlphaZeroTrainingConfig, DEFAULT_ALPHAZERO_TRAINING_CONFIG, SelfPlayResult } from './alphazero-trainer';
import { AlphaZeroOthelloAgent, AlphaZeroAgentConfig, DEFAULT_ALPHAZERO_AGENT_CONFIG } from '../agents/alphazero-agent';

/**
 * 快速训练配置接口
 */
export interface FastTrainingConfig extends AlphaZeroTrainingConfig {
  /** 并行游戏数量（默认4，根据CPU核心数调整） */
  parallelGames: number;
  /** 是否启用动态MCTS模拟次数 */
  enableDynamicMCTS: boolean;
  /** 初始MCTS模拟次数（训练早期使用） */
  initialMCTSSimulations: number;
  /** 最终MCTS模拟次数（训练后期使用） */
  finalMCTSSimulations: number;
  /** 是否启用批量推理 */
  enableBatchInference: boolean;
  /** 批量推理大小 */
  batchInferenceSize: number;
  /** 早期训练轮数（前30%迭代使用） */
  earlyTrainingEpochs: number;
  /** 后期训练轮数（后70%迭代使用） */
  lateTrainingEpochs: number;
  /** 评估频率（降低以节省时间） */
  evaluationFrequency: number;
}

/**
 * 默认快速训练配置
 */
// 动态检测CPU核心数
const os = require('os');
const cpuCount = os.cpus().length;
const optimalParallelGames = Math.min(Math.max(4, Math.floor(cpuCount * 0.5)), 4); // 限制最大4核：4核并行（所有优化都限制在4核以内）

export const DEFAULT_FAST_TRAINING_CONFIG: FastTrainingConfig = {
  ...DEFAULT_ALPHAZERO_TRAINING_CONFIG,
  parallelGames: optimalParallelGames,  // 优化：动态调整并行游戏数（6-8核）
  enableDynamicMCTS: false,  // 方案2优化：禁用动态MCTS，固定为300次模拟
  initialMCTSSimulations: 300,  // 方案2优化：固定300次模拟（折中方案）
  finalMCTSSimulations: 300,  // 方案2优化：固定300次模拟（折中方案）
  enableBatchInference: true,  // 启用批量推理
  batchInferenceSize: 16,  // 回滚方案3：批量大小16（方案3效果不明显，已回滚）
  earlyTrainingEpochs: 5,  // 早期5个epoch（优化：已验证最优）
  lateTrainingEpochs: 12,  // 方案2+优化：后期12个epoch（从15减少到12，减少25%训练时间）
  evaluationFrequency: 10,  // 每10次迭代评估一次
  selfPlayGames: 60,  // 方案2+优化：从80减少到60（减少25%，配合固定MCTS 300次）
  trainingEpochs: 12,  // 方案2+优化：默认12（从15减少到12，减少25%）
};

/**
 * 高性能AlphaZero训练器
 */
export class FastAlphaZeroTrainer extends AlphaZeroTrainer {
  private fastConfig: FastTrainingConfig;
  private currentIteration: number = 0;

  constructor(
    agentConfig: AlphaZeroAgentConfig = DEFAULT_ALPHAZERO_AGENT_CONFIG,
    trainingConfig: Partial<FastTrainingConfig> = {}
  ) {
    // 合并快速训练配置
    const fastTrainingConfig: FastTrainingConfig = {
      ...DEFAULT_FAST_TRAINING_CONFIG,
      ...trainingConfig
    };

    // 根据快速配置调整agent配置
    const baseNetworkConfig = agentConfig.networkConfig || DEFAULT_ALPHAZERO_AGENT_CONFIG.networkConfig || {};
    const optimizedAgentConfig: AlphaZeroAgentConfig = {
      ...agentConfig,
      mctsConfig: {
        ...agentConfig.mctsConfig,
        numSimulations: fastTrainingConfig.initialMCTSSimulations,  // 初始使用较少模拟
      },
      networkConfig: {
        ...baseNetworkConfig,
        batchSize: 48  // 优化：使用批次48（折中方案，平衡速度和效率）
      } as any,  // 类型断言，因为可能是AlphaZeroNetworkConfig或AdvancedNetworkConfig
      mctsBatchSize: fastTrainingConfig.batchInferenceSize  // 优化：传递MCTS批量推理批次大小
    };

    super(optimizedAgentConfig, fastTrainingConfig);
    this.fastConfig = fastTrainingConfig;

    console.log('⚡ 高性能AlphaZero训练器初始化完成');
    console.log(`   并行游戏数: ${this.fastConfig.parallelGames}`);
    console.log(`   动态MCTS: ${this.fastConfig.enableDynamicMCTS ? '启用' : '禁用'}`);
    console.log(`   MCTS模拟范围: ${this.fastConfig.initialMCTSSimulations} → ${this.fastConfig.finalMCTSSimulations}`);
    console.log(`   批量推理: ${this.fastConfig.enableBatchInference ? '启用' : '禁用'} (批次大小: ${this.fastConfig.batchInferenceSize})`);
    console.log(`   训练轮数: 早期${this.fastConfig.earlyTrainingEpochs} / 后期${this.fastConfig.lateTrainingEpochs}`);
  }

  /**
   * 开始训练（重写以支持并行化和动态参数）
   */
  async startTraining(): Promise<void> {
    console.log('\n⚡ 开始高性能AlphaZero训练...');
    console.log('================================================================================');

    const startTime = Date.now();

    for (let iteration = 1; iteration <= (this as any).config.totalIterations; iteration++) {
      this.currentIteration = iteration;
      const iterationStartTime = Date.now();
      console.log(`\n📊 迭代 ${iteration}/${(this as any).config.totalIterations} [开始时间: ${new Date().toLocaleTimeString()}]`);
      console.log('─'.repeat(80));

      // 动态调整MCTS模拟次数
      if (this.fastConfig.enableDynamicMCTS) {
        this.updateMCTSSimulations(iteration);
      }

      // 并行化自我对弈阶段
      console.log(`\n🎮 [迭代 ${iteration}] 开始并行自我对弈阶段 (${(this as any).config.selfPlayGames}局, 并行${this.fastConfig.parallelGames}局)...`);
      const selfPlayStartTime = Date.now();
      const selfPlayResults = await this.parallelSelfPlayPhase();
      const selfPlayTime = (Date.now() - selfPlayStartTime) / 1000;
      console.log(`✅ [迭代 ${iteration}] 并行自我对弈阶段完成，用时: ${(selfPlayTime / 60).toFixed(2)}分钟`);

      // 训练阶段（动态调整训练轮数）
      console.log(`\n🎓 [迭代 ${iteration}] 开始网络训练阶段...`);
      
      // 更新学习率
      if ('updateLearningRate' in (this as any).agent && typeof ((this as any).agent as any).updateLearningRate === 'function') {
        ((this as any).agent as any).updateLearningRate(iteration, (this as any).config.totalIterations);
      }

      // 动态调整训练轮数
      const trainingEpochs = this.getDynamicTrainingEpochs(iteration);
      const originalEpochs = (this as any).config.trainingEpochs;
      (this as any).config.trainingEpochs = trainingEpochs;

      // 优化：使用更大的训练批次大小（基准配置：48）
      const originalBatchSize = (this as any).agent?.config?.networkConfig?.batchSize;
      if ((this as any).agent?.config?.networkConfig) {
        (this as any).agent.config.networkConfig.batchSize = 48;  // 基准配置：批次48
      }

      const trainingStartTime = Date.now();
      const trainingResults = await (this as any).trainingPhase(iteration);
      
      // 恢复原始批次大小（如果需要）
      if (originalBatchSize && (this as any).agent?.config?.networkConfig) {
        (this as any).agent.config.networkConfig.batchSize = originalBatchSize;
      }
      const trainingTime = (Date.now() - trainingStartTime) / 1000;
      console.log(`✅ [迭代 ${iteration}] 网络训练阶段完成，用时: ${(trainingTime / 60).toFixed(2)}分钟`);

      // 恢复原始训练轮数
      (this as any).config.trainingEpochs = originalEpochs;

      // 记录统计信息
      (this as any).recordStats(iteration, selfPlayResults, trainingResults);

      // 评估阶段（降低频率）
      let evaluationResults: { [key: string]: number } = {};
      if (iteration % this.fastConfig.evaluationFrequency === 0) {
        console.log(`\n🎯 [迭代 ${iteration}] 开始评估阶段...`);
        const evalStartTime = Date.now();
        evaluationResults = await (this as any).evaluationPhase(iteration);
        const evalTime = (Date.now() - evalStartTime) / 1000;
        console.log(`✅ [迭代 ${iteration}] 评估阶段完成，用时: ${(evalTime / 60).toFixed(2)}分钟`);
        
        // 更新最佳模型
        if (Object.keys(evaluationResults).length > 0) {
          const randomWinRate = evaluationResults['随机策略'] || evaluationResults['随机'] || 0;
          const rates = Object.values(evaluationResults) as number[];
          const avgWinRate = rates.length > 0 ? rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length : 0;
          const winRateToCompare = randomWinRate > 0 ? randomWinRate : avgWinRate;
          
          if (winRateToCompare > (this as any).bestEvaluationWinRate) {
            (this as any).bestEvaluationWinRate = winRateToCompare;
            (this as any).bestModelIteration = iteration;
            const strategyName = randomWinRate > 0 ? 'vs随机策略' : '平均评估';
            console.log(`🏆 [迭代 ${iteration}] 发现更好的模型！${strategyName}胜率: ${winRateToCompare.toFixed(1)}%`);
          }
        }
      }

      // 保存模型
      if (iteration % (this as any).config.saveFrequency === 0) {
        console.log(`\n💾 [迭代 ${iteration}] 开始保存模型...`);
        await (this as any).agent.saveModel(`${(this as any).config.modelSavePath}-iteration-${iteration}`);
        console.log(`✅ [迭代 ${iteration}] 模型已保存`);
      }

      // 保存最佳模型
      if (iteration === (this as any).bestModelIteration && (this as any).bestModelIteration > 0) {
        console.log(`\n💾 [迭代 ${iteration}] 保存最佳模型...`);
        await (this as any).agent.saveModel(`${(this as any).config.modelSavePath}-best`);
        console.log(`✅ [迭代 ${iteration}] 最佳模型已保存`);
      }

      // 输出进度
      const iterationTime = (Date.now() - iterationStartTime) / 1000;
      const totalElapsed = (Date.now() - startTime) / 1000;
      const avgIterationTime = totalElapsed / iteration;
      const remainingIterations = (this as any).config.totalIterations - iteration;
      const estimatedRemaining = avgIterationTime * remainingIterations;

      (this as any).printProgress(iteration, selfPlayResults, trainingResults, evaluationResults);
      console.log(`\n⏱️ [迭代 ${iteration}] 本次迭代用时: ${(iterationTime / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 总用时: ${(totalElapsed / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 平均每迭代: ${(avgIterationTime / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 预计剩余时间: ${(estimatedRemaining / 60).toFixed(2)}分钟`);
      console.log('─'.repeat(80));
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ 高性能AlphaZero训练完成! 总用时: ${(totalTime / 60).toFixed(2)}分钟`);
    
    if ((this as any).bestModelIteration > 0) {
      console.log(`\n🏆 最佳模型: 迭代 ${(this as any).bestModelIteration}, 评估胜率: ${(this as any).bestEvaluationWinRate.toFixed(1)}%`);
    }
  }

  /**
   * 并行化自我对弈阶段
   */
  private async parallelSelfPlayPhase(): Promise<SelfPlayResult[]> {
    const results: SelfPlayResult[] = [];
    const parallelGames = this.fastConfig.parallelGames;
    const totalGames = (this as any).config.selfPlayGames;
    const maxGameTime = (this as any).config.maxGameTime || 15 * 60 * 1000;
    let skippedGames = 0;

    // 将游戏分批并行执行
    for (let batchStart = 0; batchStart < totalGames; batchStart += parallelGames) {
      const batchSize = Math.min(parallelGames, totalGames - batchStart);
      const batchPromises: Promise<SelfPlayResult | null>[] = [];

      // 创建并行游戏任务
      for (let i = 0; i < batchSize; i++) {
        const gameIndex = batchStart + i + 1;
        const gamePromise = this.playSelfPlayGameWithTimeout(maxGameTime, gameIndex, totalGames)
          .catch((error: any) => {
            console.error(`❌ [并行自我对弈] 游戏 ${gameIndex} 异常: ${error.message || error}`);
            return null; // 返回null表示失败
          });
        batchPromises.push(gamePromise);
      }

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      
      // 处理批次结果
      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        if (result) {
          results.push(result);
          // 使用类型断言访问父类的私有方法
          (this as any).addExperiencesToBuffer(result.experiences);
        } else {
          skippedGames++;
        }
      }

      // 输出批次进度
      const completed = results.length;
      const progress = ((completed / totalGames) * 100).toFixed(1);
      console.log(`   [并行自我对弈] 进度: ${completed}/${totalGames} (${progress}%)`);
    }

    if (skippedGames > 0) {
      console.warn(`⚠️ [并行自我对弈] 阶段完成，但跳过了 ${skippedGames} 局异常游戏`);
    }

    return results;
  }

  /**
   * 带超时的自我对弈游戏
   */
  private async playSelfPlayGameWithTimeout(
    maxGameTime: number,
    gameIndex: number,
    totalGames: number
  ): Promise<SelfPlayResult> {
    const gameStartTime = Date.now();
    
    // 使用类型断言访问父类的私有方法
    const gamePromise = (this as any).playSelfPlayGame();
    const timeoutPromise = new Promise<SelfPlayResult>((_, reject) => {
      setTimeout(() => reject(new Error(`Game timeout after ${maxGameTime}ms`)), maxGameTime);
    });

    try {
      const result = await Promise.race([gamePromise, timeoutPromise]);
      const gameTime = (Date.now() - gameStartTime) / 1000;
      
      // 简化日志输出（避免过多输出）
      if (gameIndex % 10 === 0 || gameIndex === totalGames) {
        console.log(`   [并行自我对弈] 完成 ${gameIndex}/${totalGames} 局 (用时: ${gameTime.toFixed(1)}秒, 步数: ${result.gameLength}, 胜者: ${result.winner})`);
      }
      
      return result;
    } catch (error: any) {
      if (error.message && error.message.includes('timeout')) {
        throw new Error(`游戏 ${gameIndex} 超时`);
      }
      throw error;
    }
  }

  /**
   * 动态更新MCTS模拟次数
   */
  private updateMCTSSimulations(iteration: number): void {
    const progress = iteration / (this as any).config.totalIterations;
    const initial = this.fastConfig.initialMCTSSimulations;
    const final = this.fastConfig.finalMCTSSimulations;
    
    // 线性插值：早期使用较少模拟，逐步增加到最终值
    const currentSimulations = Math.round(
      initial + (final - initial) * progress
    );

    // 更新agent的MCTS配置
    if ((this as any).agent && 'config' in (this as any).agent) {
      const agentConfig = ((this as any).agent as any).config;
      if (agentConfig && agentConfig.mctsConfig) {
        agentConfig.mctsConfig.numSimulations = currentSimulations;
      }
    }

    // 如果agent有MCTS实例，直接更新
    if ((this as any).agent && 'mcts' in (this as any).agent) {
      const mcts = ((this as any).agent as any).mcts;
      if (mcts && 'config' in mcts) {
        mcts.config.numSimulations = currentSimulations;
      }
    }

    if (iteration % 10 === 0 || iteration === 1) {
      console.log(`   [动态MCTS] 迭代 ${iteration}: 使用 ${currentSimulations} 次模拟 (进度: ${(progress * 100).toFixed(1)}%)`);
    }
  }

  /**
   * 获取动态训练轮数
   */
  private getDynamicTrainingEpochs(iteration: number): number {
    const progress = iteration / (this as any).config.totalIterations;
    const earlyThreshold = 0.3; // 前30%迭代使用早期轮数

    if (progress < earlyThreshold) {
      return this.fastConfig.earlyTrainingEpochs;
    } else {
      return this.fastConfig.lateTrainingEpochs;
    }
  }
}

/**
 * 导出的快速训练运行函数
 */
export async function runFastTraining(): Promise<void> {
  console.log('⚡ 启动高性能AlphaZero训练...');

  const baseNetworkConfig = DEFAULT_ALPHAZERO_AGENT_CONFIG.networkConfig || {};
  const agentConfig: AlphaZeroAgentConfig = {
    ...DEFAULT_ALPHAZERO_AGENT_CONFIG,
    mctsConfig: {
      ...DEFAULT_ALPHAZERO_AGENT_CONFIG.mctsConfig,
      numSimulations: Number(process.env.ALPHAZERO_MCTS) || 200  // 初始使用200次
    },
    networkConfig: {
      ...baseNetworkConfig,
      batchSize: Number(process.env.ALPHAZERO_TRAINING_BATCH_SIZE) || 48  // 优化：使用批次48（折中方案）
    } as any,  // 类型断言
    mctsBatchSize: Number(process.env.ALPHAZERO_MCTS_BATCH_SIZE) || 16  // 方案A优化：MCTS批量推理批次大小16（回滚方案C的32）
  };

  const config: Partial<FastTrainingConfig> = {
    totalIterations: Number(process.env.ALPHAZERO_TOTAL_ITERATIONS) || 100,
    selfPlayGames: Number(process.env.ALPHAZERO_SELFPLAY_GAMES) || DEFAULT_FAST_TRAINING_CONFIG.selfPlayGames,  // 方案2+优化：默认60局（从80减少到60）
    parallelGames: Number(process.env.ALPHAZERO_PARALLEL_GAMES) || 4,  // 并行游戏数
    enableDynamicMCTS: process.env.ALPHAZERO_DYNAMIC_MCTS !== 'false',
    initialMCTSSimulations: Number(process.env.ALPHAZERO_INITIAL_MCTS) || 200,
    finalMCTSSimulations: Number(process.env.ALPHAZERO_FINAL_MCTS) || 600,
    enableBatchInference: process.env.ALPHAZERO_BATCH_INFERENCE !== 'false',
    batchInferenceSize: Number(process.env.ALPHAZERO_BATCH_SIZE) || 16,  // 方案A优化：批次大小16（回滚方案C的32）
    earlyTrainingEpochs: Number(process.env.ALPHAZERO_EARLY_EPOCHS) || 5,  // 优化：从10减少到5
    lateTrainingEpochs: Number(process.env.ALPHAZERO_LATE_EPOCHS) || 20,
    evaluationFrequency: Number(process.env.ALPHAZERO_EVAL_FREQUENCY) || 10,
    saveFrequency: Number(process.env.ALPHAZERO_SAVE_FREQUENCY) || 10,
    maxGameSteps: Number(process.env.ALPHAZERO_MAX_STEPS) || 80,
    maxGameTime: Number(process.env.ALPHAZERO_MAX_GAME_TIME) || 15 * 60 * 1000,
    maxStepTime: Number(process.env.ALPHAZERO_MAX_STEP_TIME) || 15 * 1000,
    verbose: true
  };

  const trainer = new FastAlphaZeroTrainer(agentConfig, config);

  try {
    await trainer.startTraining();
    console.log('✅ 高性能训练完成！');
  } catch (error) {
    console.error('❌ 训练失败:', error);
    process.exit(1);
  } finally {
    trainer.dispose();
    process.exit(0);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runFastTraining().catch(console.error);
}

