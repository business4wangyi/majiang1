// {{ AURA-X: Add - DQN训练管理器，实现完整的训练流程. Approval: 寸止(ID:1735819200). }}
// {{ Source: 基于深度强化学习和黑白棋特性设计 }}

// Fix for isNullOrUndefined compatibility issue (must be first)
import * as util from 'util';
if (!util.isNullOrUndefined) {
  (util as any).isNullOrUndefined = function(value: any): boolean {
    return value === null || value === undefined;
  };
}

// {{ AURA-X: Modify - 重新启用tfjs-node，Node.js v22.17.1兼容性已验证. Approval: 寸止(ID:1735819200). }}
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { DQNOthelloAgent, TRAINING_DQN_AGENT_CONFIG } from './dqn-agent';
import { ExperienceReplay, Experience, DEFAULT_EXPERIENCE_REPLAY_CONFIG } from './experience-replay';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { createOthelloBoard, makeMove, isGameOver, countPieces, getLegalActions } from '../othello-game';
import { RandomOthelloAgent, GreedyOthelloAgent, HeuristicOthelloAgent, OthelloAgent } from './index';

/**
 * 训练配置接口
 */
export interface DQNTrainingConfig {
  /** 总训练轮数 */
  totalEpisodes: number;
  /** 目标网络更新频率 */
  targetUpdateFrequency: number;
  /** 训练频率（每多少步训练一次） */
  trainFrequency: number;
  /** 折扣因子 */
  gamma: number;
  /** 初始探索率 */
  initialEpsilon: number;
  /** 最终探索率 */
  finalEpsilon: number;
  /** 探索率衰减步数 */
  epsilonDecaySteps: number;
  /** 预热步数（开始训练前的随机探索） */
  warmupSteps: number;
  /** 保存模型频率 */
  saveFrequency: number;
  /** 评估频率 */
  evaluationFrequency: number;
  /** 评估局数 */
  evaluationGames: number;
}

/**
 * 默认训练配置
 */
export const DEFAULT_TRAINING_CONFIG: DQNTrainingConfig = {
  totalEpisodes: 10000,      // 1万轮训练
  targetUpdateFrequency: 1000, // 每1000步更新目标网络
  trainFrequency: 4,         // 每4步训练一次
  gamma: 0.99,               // 折扣因子
  initialEpsilon: 0.9,       // 初始90%探索
  finalEpsilon: 0.05,        // 最终5%探索
  epsilonDecaySteps: 50000,  // 5万步衰减完成
  warmupSteps: 1000,         // 1000步预热
  saveFrequency: 1000,       // 每1000轮保存模型
  evaluationFrequency: 500,  // 每500轮评估一次
  evaluationGames: 20        // 每次评估20局
};

/**
 * 训练统计信息
 */
export interface TrainingStats {
  episode: number;
  totalSteps: number;
  epsilon: number;
  averageReward: number;
  averageGameLength: number;
  winRate: number;
  loss: number;
  qValueMean: number;
  experienceBufferSize: number;
}

/**
 * DQN训练管理器
 */
export class DQNTrainer {
  private config: DQNTrainingConfig;
  private mainAgent: DQNOthelloAgent;
  private targetAgent: DQNOthelloAgent;
  private experienceReplay: ExperienceReplay;
  private opponents: Array<{ name: string, agent: OthelloAgent, weight: number }> = [];
  
  private currentEpisode: number = 0;
  private totalSteps: number = 0;
  private trainingStats: TrainingStats[] = [];

  // 监控统计
  private startTime: number = 0;
  private recentWins: number[] = []; // 最近10轮的胜负记录
  private recentRewards: number[] = []; // 最近10轮的奖励记录
  private episodeResults: Array<{episode: number, opponent: string, winner: string, reward: number, gameLength: number}> = [];

  /**
   * 构造函数
   * @param config 训练配置
   */
  constructor(config: DQNTrainingConfig = DEFAULT_TRAINING_CONFIG) {
    this.config = { ...config };
    
    // 创建主智能体和目标智能体
    this.mainAgent = new DQNOthelloAgent(TRAINING_DQN_AGENT_CONFIG);
    this.targetAgent = this.mainAgent.clone();
    
    // 创建经验回放缓冲区
    this.experienceReplay = new ExperienceReplay(DEFAULT_EXPERIENCE_REPLAY_CONFIG);
    
    // 设置对手（课程学习）
    this.setupOpponents();
    
    console.log('🎯 DQN训练管理器初始化完成');
    console.log(`   训练轮数: ${this.config.totalEpisodes}`);
    console.log(`   经验缓冲区: ${this.experienceReplay.getConfig().maxSize}`);
    console.log(`   对手数量: ${this.opponents.length}`);
  }

  /**
   * 设置训练对手（启发式策略专门训练）
   * {{ AURA-X: Modify - 极度专门化训练，几乎全部针对启发式策略. Approval: 寸止(ID:针对启发式策略专门优化). }}
   */
  private setupOpponents(): void {
    // 极度专门化训练：几乎全部针对启发式策略
    // 目标：将启发式策略胜率从0%提升至50%以上
    this.opponents = [
      { name: '随机策略', agent: new RandomOthelloAgent(), weight: 0.05 },     // 极少：仅保持基础能力
      { name: '贪心策略', agent: new GreedyOthelloAgent(), weight: 0.05 },     // 极少：已经完全掌握
      { name: '启发式策略', agent: new HeuristicOthelloAgent(), weight: 0.9 }, // 极高：专门突破
      { name: '自我对战', agent: this.targetAgent, weight: 0.0 }              // 暂停：专注外部对手
    ];
  }

  /**
   * 选择训练对手
   */
  private selectOpponent(): { name: string, agent: OthelloAgent } {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const opponent of this.opponents) {
      cumulativeWeight += opponent.weight;
      if (random <= cumulativeWeight) {
        return opponent;
      }
    }
    
    // 默认返回随机对手
    return this.opponents[0];
  }

  /**
   * 计算奖励（优化版）
   * {{ AURA-X: Modify - 优化奖励函数，提高学习效率. Approval: 寸止(ID:方案A参数微调). }}
   */
  private calculateReward(
    board: OthelloBoard,
    action: OthelloAction,
    nextBoard: OthelloBoard,
    player: OthelloPlayer,
    isGameOver: boolean
  ): number {
    let reward = 0;

    // 基础奖励：翻转的棋子数量（增强权重）
    const { B: currentB, W: currentW } = countPieces(board);
    const { B: nextB, W: nextW } = countPieces(nextBoard);

    if (player === 'B') {
      reward += (nextB - currentB) * 0.2; // 增加翻转奖励权重
    } else {
      reward += (nextW - currentW) * 0.2;
    }

    // 位置奖励（精确匹配启发式策略评估标准）
    // {{ AURA-X: Modify - 精确匹配启发式策略的评估函数. Approval: 寸止(ID:针对启发式策略专门优化). }}
    const { row, col } = action;

    // 角落奖励（精确匹配启发式策略的100分）
    if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
      reward += 100; // 完全匹配启发式策略标准
    }
    // 边缘奖励（精确匹配启发式策略的10分）
    else if (row === 0 || row === 7 || col === 0 || col === 7) {
      reward += 10; // 完全匹配启发式策略标准
    }

    // 危险位置惩罚（精确匹配启发式策略的-20分）
    const dangerousPositions = [
      [0, 1], [1, 0], [1, 1], // 左上角附近
      [0, 6], [1, 6], [1, 7], // 右上角附近
      [6, 0], [6, 1], [7, 1], // 左下角附近
      [6, 6], [6, 7], [7, 6]  // 右下角附近
    ];

    if (dangerousPositions.some(([r, c]) => r === row && c === col)) {
      reward -= 20; // 完全匹配启发式策略标准
    }

    // 中心位置奖励（匹配启发式策略的简单位置奖励）
    const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
    reward += Math.max(0, 7 - centerDistance); // 匹配启发式策略的getSimplePositionBonus

    // 行动力奖励（鼓励保持更多选择）
    const currentMoves = getLegalActions(board, player).length;
    const nextMoves = getLegalActions(nextBoard, player === 'B' ? 'W' : 'B').length;
    reward += (currentMoves - nextMoves) * 0.1; // 减少对手选择+0.1分

    // 终局奖励（调整权重）
    if (isGameOver) {
      const { B: finalB, W: finalW } = countPieces(nextBoard);
      if (player === 'B') {
        if (finalB > finalW) reward += 50; // 降低胜利奖励，避免过度关注终局
        else if (finalB < finalW) reward -= 50; // 降低失败惩罚
        // 平局小奖励
        else reward += 10;
      } else {
        if (finalW > finalB) reward += 50;
        else if (finalW < finalB) reward -= 50;
        else reward += 10;
      }
    }

    return reward;
  }

  /**
   * 进行一局游戏并收集经验
   */
  private async playEpisode(): Promise<{
    gameLength: number;
    totalReward: number;
    winner: 'main' | 'opponent' | 'draw';
    opponentName: string;
  }> {
    const opponent = this.selectOpponent();
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B'; // 主智能体总是先手
    let gameLength = 0;
    let totalReward = 0;
    const maxMoves = 100;

    const gameExperiences: Experience[] = [];

    // 添加调试信息
    if (this.currentEpisode <= 5 || this.currentEpisode % 100 === 0) {
      console.log(`开始第${this.currentEpisode}轮游戏，对手：${opponent.name}`);
    }

    while (!isGameOver(board) && gameLength < maxMoves) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length === 0) {
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }
      
      let action: OthelloAction | null = null;
      
      if (currentPlayer === 'B') {
        // 主智能体行动
        await this.mainAgent.warmup(board, currentPlayer);
        action = this.mainAgent.chooseAction(board, currentPlayer);
      } else {
        // 对手行动
        if (opponent.agent instanceof DQNOthelloAgent) {
          await opponent.agent.warmup(board, currentPlayer);
        }
        action = opponent.agent.chooseAction(board, currentPlayer);
      }
      
      if (action) {
        const nextBoard = makeMove(board, action, currentPlayer);
        const nextPlayer = currentPlayer === 'B' ? 'W' : 'B';
        const gameOver = isGameOver(nextBoard);
        
        // 只为主智能体收集经验
        if (currentPlayer === 'B') {
          const reward = this.calculateReward(board, action, nextBoard, currentPlayer, gameOver);
          totalReward += reward;
          
          const experience: Experience = {
            state: this.deepCopyBoard(board),
            player: currentPlayer,
            action: { ...action },
            reward,
            nextState: this.deepCopyBoard(nextBoard),
            nextPlayer,
            done: gameOver,
            timestamp: Date.now()
          };
          
          gameExperiences.push(experience);
        }
        
        board = nextBoard;
        currentPlayer = nextPlayer;
        gameLength++;
        this.totalSteps++;
        
        // 训练
        if (this.totalSteps > this.config.warmupSteps && 
            this.totalSteps % this.config.trainFrequency === 0 &&
            this.experienceReplay.canSample()) {
          await this.trainStep();
        }
        
        // 更新目标网络
        if (this.totalSteps % this.config.targetUpdateFrequency === 0) {
          this.updateTargetNetwork();
        }
      }
    }
    
    // 将经验添加到回放缓冲区
    for (const exp of gameExperiences) {
      this.experienceReplay.addExperience(exp);
    }

    // 更新探索率
    this.updateEpsilon();

    // 判断胜负
    const { B, W } = countPieces(board);
    let winner: 'main' | 'opponent' | 'draw';
    if (B > W) winner = 'main';
    else if (W > B) winner = 'opponent';
    else winner = 'draw';

    // 添加调试信息
    if (this.currentEpisode <= 5 || this.currentEpisode % 100 === 0) {
      console.log(`第${this.currentEpisode}轮完成：${winner}，长度${gameLength}，奖励${totalReward.toFixed(2)}`);
    }

    return {
      gameLength,
      totalReward,
      winner,
      opponentName: opponent.name
    };
  }

  /**
   * 训练一步
   */
  private async trainStep(): Promise<number> {
    const batch = this.experienceReplay.sampleBatch();
    if (batch.length === 0) return 0;
    
    // 准备训练数据
    const states = batch.map(exp => exp.state);
    const players = batch.map(exp => exp.player);
    const actions = batch.map(exp => exp.action);
    const rewards = batch.map(exp => exp.reward);
    const nextStates = batch.map(exp => exp.nextState);
    const nextPlayers = batch.map(exp => exp.nextPlayer);
    const dones = batch.map(exp => exp.done);
    
    // 获取当前Q值
    const currentQValuesBatch = await this.mainAgent.getNetwork().predictBatch(states, players);
    
    // 获取下一状态的Q值（使用目标网络）
    const nextQValuesBatch = await this.targetAgent.getNetwork().predictBatch(nextStates, nextPlayers);
    
    // 计算目标Q值
    const targetQValues = new Float32Array(currentQValuesBatch.length);
    
    for (let i = 0; i < batch.length; i++) {
      const batchOffset = i * 64;
      const actionIndex = actions[i].row * 8 + actions[i].col;
      
      let targetQ = rewards[i];
      if (!dones[i]) {
        // 找到下一状态的最大Q值
        const nextQValues = nextQValuesBatch.slice(batchOffset, batchOffset + 64);
        const maxNextQ = Math.max(...nextQValues);
        targetQ += this.config.gamma * maxNextQ;
      }
      
      // 复制当前Q值，只更新执行动作的Q值
      for (let j = 0; j < 64; j++) {
        targetQValues[batchOffset + j] = currentQValuesBatch[batchOffset + j];
      }
      targetQValues[batchOffset + actionIndex] = targetQ;
    }
    
    // 准备训练张量
    const inputTensors = states.map((state, i) => 
      this.mainAgent.getNetwork().boardToTensor(state, players[i])
    );
    const inputBatch = tf.concat(inputTensors, 0);
    const targetBatch = tf.tensor2d(Array.from(targetQValues), [batch.length, 64]);
    
    // 训练网络
    const history = await this.mainAgent.getNetwork().train(inputBatch, targetBatch);
    const loss = Array.isArray(history.history.loss) ? history.history.loss[0] : history.history.loss;
    
    // 清理张量
    inputTensors.forEach(tensor => tensor.dispose());
    inputBatch.dispose();
    targetBatch.dispose();
    
    return loss as number;
  }

  /**
   * 更新目标网络
   */
  private updateTargetNetwork(): void {
    this.mainAgent.getNetwork().copyWeightsTo(this.targetAgent.getNetwork());
    console.log(`🎯 目标网络已更新 (步数: ${this.totalSteps})`);
  }

  /**
   * 更新探索率
   */
  private updateEpsilon(): void {
    if (this.totalSteps < this.config.epsilonDecaySteps) {
      const progress = this.totalSteps / this.config.epsilonDecaySteps;
      const epsilon = this.config.initialEpsilon - 
        (this.config.initialEpsilon - this.config.finalEpsilon) * progress;
      this.mainAgent.setEpsilon(epsilon);
    } else {
      this.mainAgent.setEpsilon(this.config.finalEpsilon);
    }
  }

  /**
   * 深拷贝棋盘
   */
  private deepCopyBoard(board: OthelloBoard): OthelloBoard {
    return board.map(row => [...row]) as OthelloBoard;
  }

  /**
   * 开始训练
   */
  public async startTraining(): Promise<void> {
    this.startTime = Date.now();
    console.log('🚀 开始DQN完整训练...\n');
    console.log(`📊 训练配置: ${this.config.totalEpisodes}轮, 预计用时: 2-4小时`);
    console.log(`⏰ 开始时间: ${new Date().toLocaleString()}`);
    console.log('=' .repeat(80));

    for (this.currentEpisode = 1; this.currentEpisode <= this.config.totalEpisodes; this.currentEpisode++) {
      const episodeResult = await this.playEpisode();

      // 记录结果
      this.recordEpisodeResult(episodeResult);

      // 每轮基本信息
      this.outputBasicInfo(episodeResult);

      // 每10轮详细统计
      if (this.currentEpisode % 10 === 0) {
        this.outputDetailedStats();
      }

      // 每100轮性能分析
      if (this.currentEpisode % 100 === 0) {
        this.outputPerformanceAnalysis();
      }

      // 评估
      if (this.currentEpisode % this.config.evaluationFrequency === 0) {
        await this.evaluate();
      }

      // 保存模型
      if (this.currentEpisode % this.config.saveFrequency === 0) {
        await this.saveModel(`dqn-model-episode-${this.currentEpisode}`);
      }
    }

    this.outputFinalSummary();
  }

  /**
   * 评估模型性能
   */
  private async evaluate(): Promise<void> {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    console.log(`\n🔍 [轮次 ${this.currentEpisode}] 性能评估开始... (已训练${this.formatTime(elapsedTime)})`);
    console.log('─'.repeat(60));

    // 暂时切换到推理模式
    this.mainAgent.setTrainingMode(false);

    const opponents = [
      { name: '随机策略', agent: new RandomOthelloAgent() },
      { name: '贪心策略', agent: new GreedyOthelloAgent() },
      { name: '启发式策略', agent: new HeuristicOthelloAgent() }
    ];

    const evaluationResults: {[key: string]: number} = {};

    for (const opponent of opponents) {
      let wins = 0;
      let totalScore = 0;
      let opponentScore = 0;

      console.log(`  🎮 vs ${opponent.name}...`);

      for (let i = 0; i < this.config.evaluationGames; i++) {
        const result = await this.playEvaluationGame(opponent.agent);
        if (result.winner === 'win') wins++;
        totalScore += result.dqnScore;
        opponentScore += result.opponentScore;
      }

      const winRate = (wins / this.config.evaluationGames) * 100;
      const avgScore = totalScore / this.config.evaluationGames;
      const avgOpponentScore = opponentScore / this.config.evaluationGames;

      evaluationResults[opponent.name] = winRate;

      console.log(`     胜率: ${winRate.toFixed(1)}% (${wins}/${this.config.evaluationGames})`);
      console.log(`     平均得分: DQN ${avgScore.toFixed(1)} vs ${opponent.name} ${avgOpponentScore.toFixed(1)}`);
    }

    // 计算总体评估分数
    const overallScore = Object.values(evaluationResults).reduce((a, b) => a + b, 0) / Object.keys(evaluationResults).length;

    console.log('─'.repeat(60));
    console.log(`📈 综合评估: ${overallScore.toFixed(1)}% 平均胜率`);

    // 与基准对比
    const benchmarks = {
      '随机策略': 80,
      '贪心策略': 60,
      '启发式策略': 40
    };

    console.log('🎯 与目标对比:');
    Object.entries(evaluationResults).forEach(([opponent, winRate]) => {
      const target = benchmarks[opponent as keyof typeof benchmarks] || 50;
      const status = winRate >= target ? '✅' : '⏳';
      console.log(`   ${status} ${opponent}: ${winRate.toFixed(1)}% (目标: ${target}%)`);
    });

    console.log('─'.repeat(60) + '\n');

    // 恢复训练模式
    this.mainAgent.setTrainingMode(true);
  }

  /**
   * 进行评估游戏
   */
  private async playEvaluationGame(opponent: OthelloAgent): Promise<{
    winner: 'win' | 'lose' | 'draw';
    dqnScore: number;
    opponentScore: number;
    gameLength: number;
  }> {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let gameLength = 0;
    const maxMoves = 100;

    while (!isGameOver(board) && gameLength < maxMoves) {
      const legalActions = getLegalActions(board, currentPlayer);

      if (legalActions.length === 0) {
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }

      let action: OthelloAction | null = null;

      if (currentPlayer === 'B') {
        await this.mainAgent.warmup(board, currentPlayer);
        action = this.mainAgent.chooseAction(board, currentPlayer);
      } else {
        action = opponent.chooseAction(board, currentPlayer);
      }

      if (action) {
        board = makeMove(board, action, currentPlayer);
        gameLength++;
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    }

    const { B, W } = countPieces(board);
    let winner: 'win' | 'lose' | 'draw';
    if (B > W) winner = 'win';
    else if (W > B) winner = 'lose';
    else winner = 'draw';

    return {
      winner,
      dqnScore: B,
      opponentScore: W,
      gameLength
    };
  }

  /**
   * 保存模型
   */
  private async saveModel(filename: string): Promise<void> {
    try {
      const elapsedTime = (Date.now() - this.startTime) / 1000;
      await this.mainAgent.saveModel(`./models/${filename}`);
      console.log(`💾 [轮次 ${this.currentEpisode}] 模型检查点已保存: ${filename} (训练时间: ${this.formatTime(elapsedTime)})`);
    } catch (error) {
      console.error(`❌ 保存模型失败: ${error}`);
    }
  }

  /**
   * 获取训练统计
   */
  public getTrainingStats(): {
    currentEpisode: number;
    totalSteps: number;
    experienceBufferSize: number;
    epsilon: number;
  } {
    return {
      currentEpisode: this.currentEpisode,
      totalSteps: this.totalSteps,
      experienceBufferSize: this.experienceReplay.size(),
      epsilon: this.mainAgent.getStats().epsilon
    };
  }

  /**
   * 记录轮次结果
   */
  private recordEpisodeResult(episodeResult: any): void {
    const winValue = episodeResult.winner === 'main' ? 1 : 0;
    this.recentWins.push(winValue);
    this.recentRewards.push(episodeResult.totalReward);

    // 保持最近10轮的记录
    if (this.recentWins.length > 10) {
      this.recentWins.shift();
      this.recentRewards.shift();
    }

    // 记录详细结果
    this.episodeResults.push({
      episode: this.currentEpisode,
      opponent: episodeResult.opponentName,
      winner: episodeResult.winner,
      reward: episodeResult.totalReward,
      gameLength: episodeResult.gameLength
    });
  }

  /**
   * 输出基本信息（每轮）
   */
  private outputBasicInfo(episodeResult: any): void {
    const winSymbol = episodeResult.winner === 'main' ? '🟢' : episodeResult.winner === 'opponent' ? '🔴' : '🟡';
    const progress = ((this.currentEpisode / this.config.totalEpisodes) * 100).toFixed(1);

    console.log(`${winSymbol} 轮次 ${this.currentEpisode}/${this.config.totalEpisodes} (${progress}%) | ${episodeResult.opponentName} | ${episodeResult.winner} | 奖励:${episodeResult.totalReward.toFixed(1)} | 步数:${episodeResult.gameLength}`);
  }

  /**
   * 输出详细统计（每10轮）
   */
  private outputDetailedStats(): void {
    const recentWinRate = this.recentWins.length > 0 ? (this.recentWins.reduce((a, b) => a + b, 0) / this.recentWins.length * 100) : 0;
    const avgReward = this.recentRewards.length > 0 ? (this.recentRewards.reduce((a, b) => a + b, 0) / this.recentRewards.length) : 0;
    const epsilon = this.mainAgent.getStats().epsilon;
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const avgTimePerEpisode = elapsedTime / this.currentEpisode;
    const estimatedTotal = avgTimePerEpisode * this.config.totalEpisodes;
    const remainingTime = estimatedTotal - elapsedTime;

    console.log(`📊 [${this.currentEpisode}轮] 近10轮胜率:${recentWinRate.toFixed(1)}% | 平均奖励:${avgReward.toFixed(1)} | 探索率:${epsilon.toFixed(4)} | 剩余时间:${this.formatTime(remainingTime)}`);
  }

  /**
   * 输出性能分析（每100轮）
   */
  private outputPerformanceAnalysis(): void {
    const bufferSize = this.experienceReplay.size();
    const bufferFillRatio = (bufferSize / this.experienceReplay.getConfig().maxSize * 100).toFixed(1);
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const avgTimePerEpisode = elapsedTime / this.currentEpisode;

    // 计算各对手胜率
    const recent100 = this.episodeResults.slice(-100);
    const opponentStats: {[key: string]: {wins: number, total: number}} = {};

    recent100.forEach(result => {
      if (!opponentStats[result.opponent]) {
        opponentStats[result.opponent] = {wins: 0, total: 0};
      }
      opponentStats[result.opponent].total++;
      if (result.winner === 'main') {
        opponentStats[result.opponent].wins++;
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`🎯 [${this.currentEpisode}轮性能分析] 已用时:${this.formatTime(elapsedTime)} | 平均每轮:${avgTimePerEpisode.toFixed(1)}s`);
    console.log(`💾 经验缓冲区: ${bufferSize.toLocaleString()}/${this.experienceReplay.getConfig().maxSize.toLocaleString()} (${bufferFillRatio}%)`);
    console.log(`📈 近100轮对手胜率:`);

    Object.entries(opponentStats).forEach(([opponent, stats]) => {
      const winRate = (stats.wins / stats.total * 100).toFixed(1);
      console.log(`   ${opponent}: ${winRate}% (${stats.wins}/${stats.total})`);
    });

    console.log('='.repeat(80) + '\n');
  }

  /**
   * 输出最终总结
   */
  private outputFinalSummary(): void {
    const totalTime = (Date.now() - this.startTime) / 1000;
    const finalEpsilon = this.mainAgent.getStats().epsilon;
    const finalBufferSize = this.experienceReplay.size();

    console.log('\n' + '🎉'.repeat(20));
    console.log('🎉 DQN训练完成！');
    console.log('🎉'.repeat(20));
    console.log(`⏰ 总用时: ${this.formatTime(totalTime)}`);
    console.log(`🎯 完成轮数: ${this.currentEpisode - 1}/${this.config.totalEpisodes}`);
    console.log(`📊 最终探索率: ${finalEpsilon.toFixed(4)}`);
    console.log(`💾 经验数量: ${finalBufferSize.toLocaleString()}`);
    console.log(`🚀 模型已保存，可以开始使用训练好的DQN！`);
  }

  /**
   * 格式化时间显示
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h${minutes}m${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.mainAgent.dispose();
    this.targetAgent.dispose();
    this.experienceReplay.clear();
  }
}

/**
 * 导出的DQN训练运行函数
 */
export async function runTraining(): Promise<void> {
  console.log('🚀 启动DQN训练...');

  const config: DQNTrainingConfig = {
    ...DEFAULT_TRAINING_CONFIG,
    totalEpisodes: 500,  // 减少训练轮数用于演示
    evaluationFrequency: 50,
    saveFrequency: 100
  };

  const trainer = new DQNTrainer(config);

  try {
    await trainer.startTraining();
    console.log('✅ DQN训练完成！');
  } catch (error) {
    console.error('❌ DQN训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runTraining().catch(console.error);
}
