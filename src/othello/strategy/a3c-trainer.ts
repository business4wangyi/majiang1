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

import { A3COthelloAgent, A3CAgentConfig, DEFAULT_A3C_AGENT_CONFIG } from './a3c-agent';
import { RandomOthelloAgent } from './random-agent';
import { GreedyOthelloAgent } from './greedy-agent';
import { HeuristicOthelloAgent } from './heuristic-agent';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { createOthelloBoard, makeMove, isGameOver, countPieces, getLegalActions } from '../othello-game';

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
  batchSize: 32
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

    console.log('🎯 A3C训练器初始化完成');
    console.log(`   总轮数: ${this.config.totalEpisodes}`);
    console.log(`   对手数量: ${this.opponents.length}`);
    console.log(`   评估频率: 每${this.config.evaluationFrequency}轮`);
  }

  /**
   * 开始训练
   */
  async startTraining(): Promise<void> {
    console.log('\n🚀 开始A3C训练...');
    console.log('================================================================================');

    const startTime = Date.now();

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

      // 输出进度
      if (episode % 100 === 0) {
        const recentStats = this.trainingStats.slice(-100);
        const avgReward = recentStats.reduce((sum, stat) => sum + stat.totalReward, 0) / 100;
        const winRate = recentStats.reduce((sum, stat) => sum + stat.winRate, 0) / 100 * 100;
        const avgActorLoss = recentStats.reduce((sum, stat) => sum + stat.actorLoss, 0) / 100;
        const avgCriticLoss = recentStats.reduce((sum, stat) => sum + stat.criticLoss, 0) / 100;

        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = (elapsed / episode) * (this.config.totalEpisodes - episode);

        console.log(`📊 [${episode}轮] 近100轮胜率:${winRate.toFixed(1)}% | 平均奖励:${avgReward.toFixed(1)} | Actor损失:${avgActorLoss.toFixed(4)} | Critic损失:${avgCriticLoss.toFixed(4)} | 剩余时间:${Math.floor(remaining/60)}m${Math.floor(remaining%60)}s`);
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

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ A3C训练完成! 总用时: ${(totalTime / 60).toFixed(2)}分钟`);
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
   * 评估智能体性能
   */
  private async evaluate(episode: number): Promise<void> {
    console.log(`\n🎯 第${episode}轮评估开始...`);

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

    console.log(`📊 评估结果 (${this.config.evaluationGames}局):`);
    console.log(`   vs 随机策略: ${randomWinRate}% (${results.vsRandom}胜)`);
    console.log(`   vs 贪心策略: ${greedyWinRate}% (${results.vsGreedy}胜)`);
    console.log(`   vs 启发式策略: ${heuristicWinRate}% (${results.vsHeuristic}胜)`);
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
