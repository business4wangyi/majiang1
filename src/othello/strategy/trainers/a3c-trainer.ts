// {{ AURA-X: Add - A3C训练器实现，支持异步训练. Approval: 寸止(ID:恢复A3C功能代码). }}

/**
 * A3C (Asynchronous Advantage Actor-Critic) 训练器实现
 * 
 * 实现A3C算法的训练逻辑，包括：
 * - 异步训练管理
 * - 经验收集
 * - 网络更新
 * - 性能评估
 */

import { A3COthelloAgent, A3CAgentConfig, DEFAULT_A3C_AGENT_CONFIG } from '../agents/a3c-agent';
import { RandomOthelloAgent } from '../agents/random-agent';
import { GreedyOthelloAgent } from '../agents/greedy-agent';
import { HeuristicOthelloAgent } from '../agents/heuristic-agent';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { createOthelloBoard, makeMove, isGameOver, countPieces, getLegalActions } from '../../core/game';

/**
 * A3C训练配置接口
 */
export interface A3CTrainingConfig {
  /** 总训练轮数 */
  totalEpisodes: number;
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
  /** 训练批次大小 */
  batchSize: number;
  /** 详细输出模式 */
  verbose: boolean;
  /** 进度输出频率 */
  progressFrequency: number;
  /** 输出格式 */
  outputFormat: 'console' | 'structured' | 'minimal';
  /** 启用MCP集成 */
  enableMCP: boolean;
}

/**
 * 默认A3C训练配置
 */
export const DEFAULT_A3C_TRAINING_CONFIG: A3CTrainingConfig = {
  totalEpisodes: 10000,
  evaluationFrequency: 500,
  evaluationGames: 20,
  saveFrequency: 1000,
  modelSavePath: 'src/othello/models/a3c-model',
  maxGameSteps: 100,
  batchSize: 32,
  verbose: false,
  progressFrequency: 500,
  outputFormat: 'minimal',
  enableMCP: false
};

/**
 * 优化的A3C训练配置 - 减少输出
 */
export const OPTIMIZED_A3C_TRAINING_CONFIG: A3CTrainingConfig = {
  totalEpisodes: 1000,
  evaluationFrequency: 200,
  evaluationGames: 10,
  saveFrequency: 200,
  modelSavePath: 'src/othello/models/a3c-optimized',
  maxGameSteps: 100,
  batchSize: 32,
  verbose: false,
  progressFrequency: 100,
  outputFormat: 'structured',
  enableMCP: true
};

/**
 * 游戏经验接口
 */
interface GameExperience {
  state: OthelloBoard;
  action: OthelloAction;
  reward: number;
  nextState: OthelloBoard;
  done: boolean;
}

/**
 * A3C训练器类
 */
export class A3CTrainer {
  private agent: A3COthelloAgent;
  private config: A3CTrainingConfig;
  private opponents: any[];
  private trainingStats: {
    episode: number;
    totalReward: number;
    gameLength: number;
    winRate: number;
    actorLoss: number;
    criticLoss: number;
    entropy: number;
  }[] = [];
  private startTime: number = 0;

  constructor(
    agentConfig: A3CAgentConfig = DEFAULT_A3C_AGENT_CONFIG,
    trainingConfig: A3CTrainingConfig = DEFAULT_A3C_TRAINING_CONFIG
  ) {
    this.config = { ...trainingConfig };
    this.agent = new A3COthelloAgent(agentConfig);
    
    // 初始化对手
    this.opponents = [
      new RandomOthelloAgent(),
      new GreedyOthelloAgent(),
      new HeuristicOthelloAgent()
    ];

    this.log('info', '🎯 A3C训练器初始化完成');
    this.log('info', `   总轮数: ${this.config.totalEpisodes}`);
    this.log('info', `   对手数量: ${this.opponents.length}`);
    this.log('info', `   评估频率: 每${this.config.evaluationFrequency}轮`);
    this.log('info', `   输出格式: ${this.config.outputFormat}`);
    this.log('info', `   MCP集成: ${this.config.enableMCP ? '启用' : '禁用'}`);
  }

  /**
   * 开始训练
   */
  async startTraining(): Promise<void> {
    this.log('info', '\n🚀 开始A3C训练...');
    if (this.config.outputFormat === 'console') {
      this.log('info', '================================================================================');
    }

    this.startTime = Date.now();

    for (let episode = 1; episode <= this.config.totalEpisodes; episode++) {
      // 随机选择对手
      const opponent = this.opponents[Math.floor(Math.random() * this.opponents.length)];
      const opponentName = this.getOpponentName(opponent);

      // 进行一局游戏
      const gameResult = await this.playEpisode(opponent);

      // 记录统计信息
      this.trainingStats.push({
        episode,
        totalReward: gameResult.totalReward,
        gameLength: gameResult.gameLength,
        winRate: gameResult.won ? 1 : 0,
        actorLoss: gameResult.lossInfo.actorLoss,
        criticLoss: gameResult.lossInfo.criticLoss,
        entropy: gameResult.lossInfo.entropy
      });

      // 输出进度（优化频率）
      if (episode % this.config.progressFrequency === 0) {
        this.outputProgress(episode);
      }

      // 评估
      if (episode % this.config.evaluationFrequency === 0) {
        await this.evaluate(episode);
      }

      // 保存模型
      if (episode % this.config.saveFrequency === 0) {
        await this.agent.saveModel(`${this.config.modelSavePath}-episode-${episode}`);
      }
    }

    const totalTime = (Date.now() - this.startTime) / 1000;
    this.log('info', `\n✅ A3C训练完成! 总用时: ${(totalTime / 60).toFixed(2)}分钟`);

    // 输出最终统计
    this.outputFinalStats();
  }

  /**
   * 进行一局游戏
   */
  private async playEpisode(opponent: any): Promise<{
    totalReward: number;
    gameLength: number;
    won: boolean;
    lossInfo: { actorLoss: number; criticLoss: number; entropy: number };
  }> {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let gameLength = 0;
    const experiences: GameExperience[] = [];

    while (!isGameOver(board) && gameLength < this.config.maxGameSteps) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length > 0) {
        let action: OthelloAction | null = null;
        
        if (currentPlayer === 'B') {
          // A3C智能体行动
          action = this.agent.chooseAction(board, currentPlayer);
        } else {
          // 对手行动
          action = opponent.chooseAction(board, currentPlayer);
        }

        if (action && legalActions.some(a => a.row === action!.row && a.col === action!.col)) {
          const prevBoard = board.map(row => [...row]);
          board = makeMove(board, action, currentPlayer);

          // 记录A3C智能体的经验
          if (currentPlayer === 'B') {
            const reward = this.calculateReward(prevBoard, board, 'B');
            experiences.push({
              state: prevBoard,
              action,
              reward,
              nextState: board,
              done: isGameOver(board)
            });
          }
        }
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      gameLength++;
    }

    // 计算总奖励和胜负
    const { B, W } = countPieces(board);
    const won = B > W;
    const totalReward = experiences.reduce((sum, exp) => sum + exp.reward, 0);

    // 训练网络
    let lossInfo = { actorLoss: 0, criticLoss: 0, entropy: 0 };
    if (experiences.length > 0) {
      const states = experiences.map(exp => exp.state);
      const actions = experiences.map(exp => exp.action);
      const rewards = experiences.map(exp => exp.reward);

      lossInfo = await this.agent.trainNetwork(states, actions, rewards, 'B');
    }

    return { totalReward, gameLength, won, lossInfo };
  }

  /**
   * 计算奖励
   */
  private calculateReward(prevBoard: OthelloBoard, newBoard: OthelloBoard, player: OthelloPlayer): number {
    const prevCount = countPieces(prevBoard);
    const newCount = countPieces(newBoard);

    // 基础奖励：棋子数量变化
    const pieceDiff = player === 'B' ? 
      (newCount.B - prevCount.B) - (newCount.W - prevCount.W) :
      (newCount.W - prevCount.W) - (newCount.B - prevCount.B);

    // 位置奖励
    let positionReward = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (newBoard[row][col] === player && prevBoard[row][col] !== player) {
          // 角落奖励
          if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
            positionReward += 10;
          }
          // 边缘奖励
          else if (row === 0 || row === 7 || col === 0 || col === 7) {
            positionReward += 2;
          }
          // 中心奖励
          else if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
            positionReward += 1;
          }
        }
      }
    }

    return pieceDiff + positionReward * 0.1;
  }

  /**
   * 日志输出方法
   */
  private log(level: 'info' | 'debug' | 'warn' | 'error', message: string): void {
    if (this.config.outputFormat === 'minimal' && level === 'debug') {
      return; // 最小模式下不输出调试信息
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
   * 输出训练进度
   */
  private outputProgress(episode: number): void {
    const recentCount = Math.min(this.config.progressFrequency, this.trainingStats.length);
    const recentStats = this.trainingStats.slice(-recentCount);

    const avgReward = recentStats.reduce((sum, stat) => sum + stat.totalReward, 0) / recentCount;
    const winRate = recentStats.reduce((sum, stat) => sum + stat.winRate, 0) / recentCount * 100;
    const avgActorLoss = recentStats.reduce((sum, stat) => sum + stat.actorLoss, 0) / recentCount;
    const avgCriticLoss = recentStats.reduce((sum, stat) => sum + stat.criticLoss, 0) / recentCount;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = (elapsed / episode) * (this.config.totalEpisodes - episode);

    if (this.config.outputFormat === 'structured') {
      const progress = {
        episode,
        progress: `${episode}/${this.config.totalEpisodes}`,
        winRate: winRate.toFixed(1),
        avgReward: avgReward.toFixed(1),
        actorLoss: avgActorLoss.toFixed(4),
        criticLoss: avgCriticLoss.toFixed(4),
        remainingTime: `${Math.floor(remaining/60)}m${Math.floor(remaining%60)}s`
      };
      this.log('info', `📊 训练进度: ${JSON.stringify(progress)}`);
    } else {
      this.log('info', `📊 [${episode}轮] 近${recentCount}轮胜率:${winRate.toFixed(1)}% | 平均奖励:${avgReward.toFixed(1)} | Actor损失:${avgActorLoss.toFixed(4)} | Critic损失:${avgCriticLoss.toFixed(4)} | 剩余时间:${Math.floor(remaining/60)}m${Math.floor(remaining%60)}s`);
    }
  }

  /**
   * 输出最终统计
   */
  private outputFinalStats(): void {
    if (this.trainingStats.length === 0) return;

    const totalStats = this.trainingStats;
    const avgReward = totalStats.reduce((sum, stat) => sum + stat.totalReward, 0) / totalStats.length;
    const overallWinRate = totalStats.reduce((sum, stat) => sum + stat.winRate, 0) / totalStats.length * 100;
    const avgActorLoss = totalStats.reduce((sum, stat) => sum + stat.actorLoss, 0) / totalStats.length;
    const avgCriticLoss = totalStats.reduce((sum, stat) => sum + stat.criticLoss, 0) / totalStats.length;

    if (this.config.outputFormat === 'structured') {
      const finalStats = {
        totalEpisodes: this.config.totalEpisodes,
        overallWinRate: overallWinRate.toFixed(1),
        avgReward: avgReward.toFixed(1),
        avgActorLoss: avgActorLoss.toFixed(4),
        avgCriticLoss: avgCriticLoss.toFixed(4),
        trainingTime: `${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)}分钟`
      };
      this.log('info', `📊 最终统计: ${JSON.stringify(finalStats)}`);
    } else {
      this.log('info', `📊 最终统计:`);
      this.log('info', `   总体胜率: ${overallWinRate.toFixed(1)}%`);
      this.log('info', `   平均奖励: ${avgReward.toFixed(1)}`);
      this.log('info', `   平均Actor损失: ${avgActorLoss.toFixed(4)}`);
      this.log('info', `   平均Critic损失: ${avgCriticLoss.toFixed(4)}`);
    }
  }

  /**
   * 评估智能体性能
   */
  private async evaluate(episode: number): Promise<void> {
    this.log('info', `\n🎯 第${episode}轮评估开始...`);

    const results = {
      vsRandom: 0,
      vsGreedy: 0,
      vsHeuristic: 0
    };

    // 临时设置为非训练模式
    const originalTraining = this.agent['config'].isTraining;
    this.agent['config'].isTraining = false;

    // 对战随机策略
    for (let i = 0; i < this.config.evaluationGames; i++) {
      const won = await this.playEvaluationGame(new RandomOthelloAgent());
      if (won) results.vsRandom++;
    }

    // 对战贪心策略
    for (let i = 0; i < this.config.evaluationGames; i++) {
      const won = await this.playEvaluationGame(new GreedyOthelloAgent());
      if (won) results.vsGreedy++;
    }

    // 对战启发式策略
    for (let i = 0; i < this.config.evaluationGames; i++) {
      const won = await this.playEvaluationGame(new HeuristicOthelloAgent());
      if (won) results.vsHeuristic++;
    }

    // 恢复训练模式
    this.agent['config'].isTraining = originalTraining;

    const randomWinRate = (results.vsRandom / this.config.evaluationGames * 100).toFixed(1);
    const greedyWinRate = (results.vsGreedy / this.config.evaluationGames * 100).toFixed(1);
    const heuristicWinRate = (results.vsHeuristic / this.config.evaluationGames * 100).toFixed(1);

    if (this.config.outputFormat === 'structured') {
      const evaluationResults = {
        episode,
        games: this.config.evaluationGames,
        vsRandom: `${randomWinRate}%`,
        vsGreedy: `${greedyWinRate}%`,
        vsHeuristic: `${heuristicWinRate}%`
      };
      this.log('info', `📊 评估结果: ${JSON.stringify(evaluationResults)}`);
    } else if (this.config.outputFormat === 'minimal') {
      this.log('info', `📊 评估[${episode}轮]: 随机${randomWinRate}% | 贪心${greedyWinRate}% | 启发式${heuristicWinRate}%`);
    } else {
      this.log('info', `📊 评估结果 (${this.config.evaluationGames}局):`);
      this.log('info', `   vs 随机策略: ${randomWinRate}% (${results.vsRandom}胜)`);
      this.log('info', `   vs 贪心策略: ${greedyWinRate}% (${results.vsGreedy}胜)`);
      this.log('info', `   vs 启发式策略: ${heuristicWinRate}% (${results.vsHeuristic}胜)`);
    }
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
 * 导出的A3C训练运行函数
 */
export async function runTraining(): Promise<void> {
  console.log('🚀 启动A3C训练...');

  // 使用优化配置
  const trainer = new A3CTrainer(DEFAULT_A3C_AGENT_CONFIG, OPTIMIZED_A3C_TRAINING_CONFIG);

  try {
    await trainer.startTraining();
    console.log('✅ A3C训练完成！');
  } catch (error) {
    console.error('❌ A3C训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

/**
 * 运行优化的A3C训练（最小输出）
 */
export async function runOptimizedTraining(): Promise<void> {
  const config: A3CTrainingConfig = {
    ...OPTIMIZED_A3C_TRAINING_CONFIG,
    outputFormat: 'minimal',
    progressFrequency: 200,
    verbose: false
  };

  const trainer = new A3CTrainer(DEFAULT_A3C_AGENT_CONFIG, config);

  try {
    await trainer.startTraining();
  } catch (error) {
    console.error('❌ A3C训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

/**
 * 运行结构化输出的A3C训练（MCP友好）
 */
export async function runStructuredTraining(): Promise<void> {
  const config: A3CTrainingConfig = {
    ...OPTIMIZED_A3C_TRAINING_CONFIG,
    outputFormat: 'structured',
    enableMCP: true,
    progressFrequency: 100
  };

  const trainer = new A3CTrainer(DEFAULT_A3C_AGENT_CONFIG, config);

  try {
    await trainer.startTraining();
  } catch (error) {
    console.error('❌ A3C训练失败:', error);
  } finally {
    trainer.dispose();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runTraining().catch(console.error);
}
