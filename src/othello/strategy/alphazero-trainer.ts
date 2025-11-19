// {{ AURA-X: Add - AlphaZero训练器实现，自我对弈和网络训练. Approval: 寸止(ID:开始AlphaZero实现). }}

/**
 * AlphaZero训练器实现
 * 
 * 实现AlphaZero的完整训练循环：
 * - 自我对弈生成训练数据
 * - 神经网络训练
 * - 模型评估和更新
 * - 训练进度监控
 */

import { AlphaZeroOthelloAgent, AlphaZeroAgentConfig, DEFAULT_ALPHAZERO_AGENT_CONFIG } from './alphazero-agent';
import { RandomOthelloAgent } from './random-agent';
import { GreedyOthelloAgent } from './greedy-agent';
import { HeuristicOthelloAgent } from './heuristic-agent';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { createOthelloBoard, makeMove, isGameOver, countPieces, getLegalActions } from '../othello-game';

/**
 * AlphaZero训练配置接口
 */
export interface AlphaZeroTrainingConfig {
  /** 总训练迭代次数 */
  totalIterations: number;
  /** 每次迭代的自我对弈局数 */
  selfPlayGames: number;
  /** 训练轮数 */
  trainingEpochs: number;
  /** 经验池大小 */
  experienceBufferSize: number;
  /** 评估频率 */
  evaluationFrequency: number;
  /** 每次评估的游戏数量 */
  evaluationGames: number;
  /** 模型保存频率 */
  saveFrequency: number;
  /** 模型保存路径 */
  modelSavePath: string;
  /** 最大游戏步数 */
  maxGameSteps: number;
  /** 是否启用详细日志 */
  verbose: boolean;
  /** 可选随机种子（提升可复现性） */
  seed?: number;
}

/**
 * 默认AlphaZero训练配置
 */
export const DEFAULT_ALPHAZERO_TRAINING_CONFIG: AlphaZeroTrainingConfig = {
  totalIterations: 100,
  selfPlayGames: 25,
  trainingEpochs: 10,
  experienceBufferSize: 10000,
  evaluationFrequency: 10,
  evaluationGames: 20,
  saveFrequency: 10,
  modelSavePath: 'src/othello/models/alphazero-model',
  maxGameSteps: 100,
  verbose: true
};

/**
 * 训练经验接口
 */
interface TrainingExperience {
  state: OthelloBoard;
  actionProbs: number[];
  value: number;
  player: OthelloPlayer;
}

/**
 * 自我对弈游戏结果接口
 */
interface SelfPlayResult {
  experiences: TrainingExperience[];
  gameLength: number;
  winner: OthelloPlayer | 'draw';
  finalScore: { B: number; W: number };
}

/**
 * AlphaZero训练器类
 */
export class AlphaZeroTrainer {
  private agent: AlphaZeroOthelloAgent;
  private config: AlphaZeroTrainingConfig;
  private experienceBuffer: TrainingExperience[] = [];
  private opponents: any[];
  private trainingStats: {
    iteration: number;
    selfPlayWinRate: number;
    avgGameLength: number;
    policyLoss: number;
    valueLoss: number;
    totalLoss: number;
    evaluationResults: { [key: string]: number };
  }[] = [];

  constructor(
    agentConfig: AlphaZeroAgentConfig = DEFAULT_ALPHAZERO_AGENT_CONFIG,
    trainingConfig: AlphaZeroTrainingConfig = DEFAULT_ALPHAZERO_TRAINING_CONFIG
  ) {
    this.config = { ...trainingConfig };
    this.agent = new AlphaZeroOthelloAgent({
      ...agentConfig,
      isTraining: true,
      verbose: this.config.verbose
    });
    
    // 初始化评估对手
    this.opponents = [
      new RandomOthelloAgent(),
      new GreedyOthelloAgent(),
      new HeuristicOthelloAgent()
    ];

    console.log('🎯 AlphaZero训练器初始化完成');
    console.log(`   总迭代次数: ${this.config.totalIterations}`);
    console.log(`   每次迭代自我对弈: ${this.config.selfPlayGames}局`);
    console.log(`   经验池大小: ${this.config.experienceBufferSize}`);
    console.log(`   评估频率: 每${this.config.evaluationFrequency}次迭代`);
  }

  /**
   * 开始训练
   */
  async startTraining(): Promise<void> {
    console.log('\n🚀 开始AlphaZero训练...');
    console.log('================================================================================');

    const startTime = Date.now();

    for (let iteration = 1; iteration <= this.config.totalIterations; iteration++) {
      const iterationStartTime = Date.now();
      console.log(`\n📊 迭代 ${iteration}/${this.config.totalIterations} [开始时间: ${new Date().toLocaleTimeString()}]`);
      console.log('─'.repeat(80));
      
      // 自我对弈阶段
      console.log(`\n🎮 [迭代 ${iteration}] 开始自我对弈阶段 (${this.config.selfPlayGames}局)...`);
      const selfPlayStartTime = Date.now();
      const selfPlayResults = await this.selfPlayPhase();
      const selfPlayTime = (Date.now() - selfPlayStartTime) / 1000;
      console.log(`✅ [迭代 ${iteration}] 自我对弈阶段完成，用时: ${(selfPlayTime / 60).toFixed(2)}分钟`);
      
      // 训练阶段
      console.log(`\n🎓 [迭代 ${iteration}] 开始网络训练阶段...`);
      const trainingStartTime = Date.now();
      const trainingResults = await this.trainingPhase();
      const trainingTime = (Date.now() - trainingStartTime) / 1000;
      console.log(`✅ [迭代 ${iteration}] 网络训练阶段完成，用时: ${(trainingTime / 60).toFixed(2)}分钟`);
      
      // 记录统计信息
      this.recordStats(iteration, selfPlayResults, trainingResults);
      
      // 评估阶段
      let evaluationResults = {};
      if (iteration % this.config.evaluationFrequency === 0) {
        console.log(`\n🎯 [迭代 ${iteration}] 开始评估阶段...`);
        const evalStartTime = Date.now();
        evaluationResults = await this.evaluationPhase(iteration);
        const evalTime = (Date.now() - evalStartTime) / 1000;
        console.log(`✅ [迭代 ${iteration}] 评估阶段完成，用时: ${(evalTime / 60).toFixed(2)}分钟`);
      }
      
      // 保存模型
      if (iteration % this.config.saveFrequency === 0) {
        console.log(`\n💾 [迭代 ${iteration}] 开始保存模型...`);
        await this.agent.saveModel(`${this.config.modelSavePath}-iteration-${iteration}`);
        console.log(`✅ [迭代 ${iteration}] 模型已保存到: ${this.config.modelSavePath}-iteration-${iteration}`);
      }
      
      // 输出进度
      const iterationTime = (Date.now() - iterationStartTime) / 1000;
      const totalElapsed = (Date.now() - startTime) / 1000;
      const avgIterationTime = totalElapsed / iteration;
      const remainingIterations = this.config.totalIterations - iteration;
      const estimatedRemaining = avgIterationTime * remainingIterations;
      
      this.printProgress(iteration, selfPlayResults, trainingResults, evaluationResults);
      console.log(`\n⏱️ [迭代 ${iteration}] 本次迭代用时: ${(iterationTime / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 总用时: ${(totalElapsed / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 平均每迭代: ${(avgIterationTime / 60).toFixed(2)}分钟`);
      console.log(`⏱️ [迭代 ${iteration}] 预计剩余时间: ${(estimatedRemaining / 60).toFixed(2)}分钟`);
      console.log('─'.repeat(80));
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ AlphaZero训练完成! 总用时: ${(totalTime / 60).toFixed(2)}分钟`);
  }

  /**
   * 自我对弈阶段
   */
  private async selfPlayPhase(): Promise<SelfPlayResult[]> {
    if (this.config.verbose) {
      console.log('🎮 开始自我对弈阶段...');
    }

    const results: SelfPlayResult[] = [];
    
    for (let game = 0; game < this.config.selfPlayGames; game++) {
      const gameStartTime = Date.now();
      const result = await this.playSelfPlayGame();
      results.push(result);
      
      // 添加经验到缓冲区
      this.addExperiencesToBuffer(result.experiences);
      
      const gameTime = (Date.now() - gameStartTime) / 1000;
      // 每局都输出进度，方便跟踪
      console.log(`   [自我对弈] 完成 ${game + 1}/${this.config.selfPlayGames} 局 (用时: ${gameTime.toFixed(1)}秒, 游戏长度: ${result.gameLength}步, 胜者: ${result.winner})`);
    }

    return results;
  }

  /**
   * 进行一局自我对弈
   */
  private async playSelfPlayGame(): Promise<SelfPlayResult> {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let gameLength = 0;
    const experiences: TrainingExperience[] = [];

    while (!isGameOver(board) && gameLength < this.config.maxGameSteps) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length > 0) {
        // 获取动作概率分布
        const searchResult = this.agent.searchBestAction(board, currentPlayer);
        
        // 记录经验（稍后会设置价值）
        experiences.push({
          state: board.map(row => [...row]), // 深拷贝
          actionProbs: [...searchResult.actionProbs],
          value: 0, // 稍后设置
          player: currentPlayer
        });
        
        // 执行动作
        board = makeMove(board, searchResult.action, currentPlayer);
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      gameLength++;
    }

    // 计算最终结果
    const { B, W } = countPieces(board);
    let winner: OthelloPlayer | 'draw';
    let gameResult: number;

    if (B > W) {
      winner = 'B';
      gameResult = 1;
    } else if (W > B) {
      winner = 'W';
      gameResult = -1;
    } else {
      winner = 'draw';
      gameResult = 0;
    }

    // 设置经验的价值（从游戏结果的角度）
    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      // 从当前玩家的角度设置价值
      exp.value = exp.player === 'B' ? gameResult : -gameResult;
    }

    return {
      experiences,
      gameLength,
      winner,
      finalScore: { B, W }
    };
  }

  /**
   * 训练阶段
   */
  private async trainingPhase(): Promise<{ policyLoss: number; valueLoss: number; totalLoss: number }> {
    if (this.config.verbose) {
      console.log('🎓 开始网络训练阶段...');
    }

    if (this.experienceBuffer.length === 0) {
      console.log('   ⚠️ 经验池为空，跳过训练');
      return { policyLoss: 0, valueLoss: 0, totalLoss: 0 };
    }

    console.log(`   📊 经验池大小: ${this.experienceBuffer.length}条`);
    console.log(`   📊 训练轮数: ${this.config.trainingEpochs}个epoch`);

    let totalPolicyLoss = 0;
    let totalValueLoss = 0;
    let totalTotalLoss = 0;

    for (let epoch = 0; epoch < this.config.trainingEpochs; epoch++) {
      const epochStartTime = Date.now();
      // 随机采样训练批次
      const batchSize = Math.min(this.agent['config'].networkConfig.batchSize, this.experienceBuffer.length);
      const batch = this.sampleBatch(batchSize);
      
      // 准备训练数据
      const states = batch.map(exp => exp.state);
      const targetPolicies = batch.map(exp => exp.actionProbs);
      const targetValues = batch.map(exp => exp.value);
      
      // 训练网络
      const lossInfo = await this.agent.trainNetwork(states, targetPolicies, targetValues, 'B');
      
      totalPolicyLoss += lossInfo.policyLoss;
      totalValueLoss += lossInfo.valueLoss;
      totalTotalLoss += lossInfo.totalLoss;
      
      const epochTime = (Date.now() - epochStartTime) / 1000;
      console.log(`   [训练] Epoch ${epoch + 1}/${this.config.trainingEpochs} 完成 (用时: ${epochTime.toFixed(1)}秒, 策略损失: ${lossInfo.policyLoss.toFixed(4)}, 价值损失: ${lossInfo.valueLoss.toFixed(4)})`);
    }

    return {
      policyLoss: totalPolicyLoss / this.config.trainingEpochs,
      valueLoss: totalValueLoss / this.config.trainingEpochs,
      totalLoss: totalTotalLoss / this.config.trainingEpochs
    };
  }

  /**
   * 评估阶段
   */
  private async evaluationPhase(iteration: number): Promise<{ [key: string]: number }> {
    if (this.config.verbose) {
      console.log('🎯 开始评估阶段...');
    }

    // 切换到推理模式
    this.agent.setTrainingMode(false);

    const results: { [key: string]: number } = {};

    // 对战各种对手
    for (const opponent of this.opponents) {
      const opponentName = this.getOpponentName(opponent);
      let wins = 0;

      for (let game = 0; game < this.config.evaluationGames; game++) {
        const won = await this.playEvaluationGame(opponent);
        if (won) wins++;
      }

      const winRate = (wins / this.config.evaluationGames) * 100;
      results[opponentName] = winRate;
    }

    // 恢复训练模式
    this.agent.setTrainingMode(true);

    return results;
  }

  /**
   * 进行评估游戏
   */
  private async playEvaluationGame(opponent: any): Promise<boolean> {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let gameLength = 0;

    while (!isGameOver(board) && gameLength < this.config.maxGameSteps) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length > 0) {
        let action: OthelloAction | null = null;
        
        if (currentPlayer === 'B') {
          action = this.agent.chooseAction(board, currentPlayer);
        } else {
          action = opponent.chooseAction(board, currentPlayer);
        }

        if (action && legalActions.some(a => a.row === action!.row && a.col === action!.col)) {
          board = makeMove(board, action, currentPlayer);
        }
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      gameLength++;
    }

    const { B, W } = countPieces(board);
    return B > W;
  }

  /**
   * 添加经验到缓冲区
   */
  private addExperiencesToBuffer(experiences: TrainingExperience[]): void {
    this.experienceBuffer.push(...experiences);
    
    // 保持缓冲区大小
    if (this.experienceBuffer.length > this.config.experienceBufferSize) {
      const excess = this.experienceBuffer.length - this.config.experienceBufferSize;
      this.experienceBuffer.splice(0, excess);
    }
  }

  /**
   * 从经验缓冲区采样批次
   */
  private sampleBatch(batchSize: number): TrainingExperience[] {
    const batch: TrainingExperience[] = [];
    // 使用可复现的rng（若提供seed）
    const { rngRandInt, initGlobalRng } = require('./utils/rng');
    if (typeof this.config.seed === 'number') {
      initGlobalRng(this.config.seed);
    }
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = rngRandInt(this.experienceBuffer.length);
      batch.push(this.experienceBuffer[randomIndex]);
    }
    
    return batch;
  }

  /**
   * 记录统计信息
   */
  private recordStats(
    iteration: number,
    selfPlayResults: SelfPlayResult[],
    trainingResults: { policyLoss: number; valueLoss: number; totalLoss: number }
  ): void {
    const blackWins = selfPlayResults.filter(r => r.winner === 'B').length;
    const selfPlayWinRate = (blackWins / selfPlayResults.length) * 100;
    const avgGameLength = selfPlayResults.reduce((sum, r) => sum + r.gameLength, 0) / selfPlayResults.length;

    this.trainingStats.push({
      iteration,
      selfPlayWinRate,
      avgGameLength,
      policyLoss: trainingResults.policyLoss,
      valueLoss: trainingResults.valueLoss,
      totalLoss: trainingResults.totalLoss,
      evaluationResults: {}
    });
  }

  /**
   * 输出进度信息
   */
  private printProgress(
    iteration: number,
    selfPlayResults: SelfPlayResult[],
    trainingResults: { policyLoss: number; valueLoss: number; totalLoss: number },
    evaluationResults: { [key: string]: number }
  ): void {
    const blackWins = selfPlayResults.filter(r => r.winner === 'B').length;
    const selfPlayWinRate = (blackWins / selfPlayResults.length) * 100;
    const avgGameLength = selfPlayResults.reduce((sum, r) => sum + r.gameLength, 0) / selfPlayResults.length;

    console.log(`📈 迭代 ${iteration} 完成:`);
    console.log(`   自我对弈黑方胜率: ${selfPlayWinRate.toFixed(1)}%`);
    console.log(`   平均游戏长度: ${avgGameLength.toFixed(1)}步`);
    console.log(`   策略损失: ${trainingResults.policyLoss.toFixed(4)}`);
    console.log(`   价值损失: ${trainingResults.valueLoss.toFixed(4)}`);
    console.log(`   经验池大小: ${this.experienceBuffer.length}`);

    if (Object.keys(evaluationResults).length > 0) {
      console.log('   评估结果:');
      for (const [opponent, winRate] of Object.entries(evaluationResults)) {
        console.log(`     vs ${opponent}: ${winRate.toFixed(1)}%`);
      }
    }
  }

  /**
   * 获取对手名称
   */
  private getOpponentName(opponent: any): string {
    if (opponent instanceof RandomOthelloAgent) return '随机策略';
    if (opponent instanceof GreedyOthelloAgent) return '贪心策略';
    if (opponent instanceof HeuristicOthelloAgent) return '启发式策略';
    return '未知对手';
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.agent.dispose();
  }
}

/**
 * 导出的训练运行函数
 */
export async function runTraining(): Promise<void> {
  console.log('🚀 启动AlphaZero训练...');

  const config: AlphaZeroTrainingConfig = {
    ...DEFAULT_ALPHAZERO_TRAINING_CONFIG,
    totalIterations: 10,
    selfPlayGames: 25,
    trainingEpochs: 5,
    experienceBufferSize: 2000,
    verbose: true
  };

  const trainer = new AlphaZeroTrainer(
    DEFAULT_ALPHAZERO_AGENT_CONFIG,
    config
  );

  try {
    await trainer.startTraining();
    console.log('✅ 训练完成！');
  } catch (error) {
    console.error('❌ 训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runTraining().catch(console.error);
}
