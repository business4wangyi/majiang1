// {{ AURA-X: Add - DQN智能体实现，继承OthelloAgent接口. Approval: 寸止(ID:1735819200). }}

import { DQNNetwork, DEFAULT_DQN_CONFIG, DQNNetworkConfig } from './dqn-network';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { getLegalActions } from '../othello-game';
import { OthelloAgent } from './random-agent';

/**
 * DQN智能体配置接口
 */
export interface DQNAgentConfig {
  /** 网络配置 */
  networkConfig: DQNNetworkConfig;
  /** 探索率（epsilon） */
  epsilon: number;
  /** 探索率衰减 */
  epsilonDecay: number;
  /** 最小探索率 */
  epsilonMin: number;
  /** 是否为训练模式 */
  isTraining: boolean;
  /** 智能体名称 */
  name: string;
}

/**
 * 默认DQN智能体配置
 */
export const DEFAULT_DQN_AGENT_CONFIG: DQNAgentConfig = {
  networkConfig: DEFAULT_DQN_CONFIG,
  epsilon: 0.1,           // 10%探索率（推理模式）
  epsilonDecay: 0.995,    // 探索率衰减
  epsilonMin: 0.01,       // 最小1%探索率
  isTraining: false,      // 默认推理模式
  name: 'DQN-Agent'
};

/**
 * 训练模式DQN智能体配置（优化版）
 * {{ AURA-X: Modify - 优化训练配置参数. Approval: 寸止(ID:方案A参数微调). }}
 */
export const TRAINING_DQN_AGENT_CONFIG: DQNAgentConfig = {
  networkConfig: {
    ...DEFAULT_DQN_CONFIG,
    learningRate: 0.0005,   // 降低学习率，提高稳定性
    useDueling: false       // 暂时保持标准DQN，避免复杂度
  },
  epsilon: 0.5,             // 降低初始探索率，更快收敛
  epsilonDecay: 0.998,      // 更慢的衰减，保持探索
  epsilonMin: 0.1,          // 提高最小探索率，保持适度探索
  isTraining: true,
  name: 'DQN-Optimized-Agent'
};

/**
 * DQN智能体类
 * 实现OthelloAgent接口，使用深度Q网络进行决策
 */
export class DQNOthelloAgent implements OthelloAgent {
  private network: DQNNetwork;
  private config: DQNAgentConfig;
  private stepCount: number = 0;
  private lastPredictionCache: Map<string, Float32Array> = new Map();

  /**
   * 构造函数
   * @param config 智能体配置
   * @param pretrainedModel 预训练模型路径（可选）
   */
  constructor(config: DQNAgentConfig = DEFAULT_DQN_AGENT_CONFIG, pretrainedModel?: string) {
    this.config = { ...config };
    this.network = new DQNNetwork(this.config.networkConfig);
    
    if (pretrainedModel) {
      this.loadModel(pretrainedModel);
    }
  }

  /**
   * 选择动作（实现OthelloAgent接口）
   * 注意：这是同步方法，使用缓存的预测结果
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作或null
   */
  public chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const legalActions = getLegalActions(board, player);

    // 如果没有合法动作，返回null
    if (legalActions.length === 0) {
      return null;
    }

    // 如果只有一个合法动作，直接返回
    if (legalActions.length === 1) {
      return legalActions[0];
    }

    // ε-贪心策略
    if (this.config.isTraining && Math.random() < this.config.epsilon) {
      // 探索：随机选择
      const randomIndex = Math.floor(Math.random() * legalActions.length);
      return legalActions[randomIndex];
    } else {
      // 利用：选择Q值最大的动作（使用缓存）
      return this.selectBestActionSync(board, player, legalActions);
    }
  }

  /**
   * 异步选择动作（用于训练和详细分析）
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作或null
   */
  public async chooseActionAsync(board: OthelloBoard, player: OthelloPlayer): Promise<OthelloAction | null> {
    const legalActions = getLegalActions(board, player);

    if (legalActions.length === 0) {
      return null;
    }

    if (legalActions.length === 1) {
      return legalActions[0];
    }

    // ε-贪心策略
    if (this.config.isTraining && Math.random() < this.config.epsilon) {
      const randomIndex = Math.floor(Math.random() * legalActions.length);
      return legalActions[randomIndex];
    } else {
      return await this.selectBestActionAsync(board, player, legalActions);
    }
  }

  /**
   * 同步选择最佳动作（使用缓存的Q值）
   * @param board 棋盘状态
   * @param player 当前玩家
   * @param legalActions 合法动作列表
   * @returns 最佳动作
   */
  private selectBestActionSync(
    board: OthelloBoard,
    player: OthelloPlayer,
    legalActions: OthelloAction[]
  ): OthelloAction {
    const boardKey = this.getBoardKey(board, player);
    let cachedQValues = this.lastPredictionCache.get(boardKey);

    if (!cachedQValues) {
      // {{ AURA-X: Modify - 修复推理模式Q值缓存问题，实时计算Q值. Approval: 寸止(ID:诊断模型加载问题). }}
      // 如果没有缓存，实时计算Q值（推理模式下的关键修复）
      try {
        // 同步调用异步方法（在Node.js环境中可行）
        const qValues = this.network.predictSync(board, player);
        if (qValues) {
          this.lastPredictionCache.set(boardKey, qValues);
          cachedQValues = qValues;
        }
      } catch (error) {
        console.warn('DQN: Q值计算失败，随机选择动作:', error);
        const randomIndex = Math.floor(Math.random() * legalActions.length);
        return legalActions[randomIndex];
      }
    }

    if (!cachedQValues) {
      console.warn('DQN: 无法获取Q值，随机选择动作');
      const randomIndex = Math.floor(Math.random() * legalActions.length);
      return legalActions[randomIndex];
    }

    return this.findBestActionFromQValues(legalActions, cachedQValues);
  }

  /**
   * 异步选择最佳动作（实时计算Q值）
   * @param board 棋盘状态
   * @param player 当前玩家
   * @param legalActions 合法动作列表
   * @returns 最佳动作
   */
  private async selectBestActionAsync(
    board: OthelloBoard,
    player: OthelloPlayer,
    legalActions: OthelloAction[]
  ): Promise<OthelloAction> {
    const qValues = await this.network.predict(board, player);

    // 缓存Q值以供同步方法使用
    const boardKey = this.getBoardKey(board, player);
    this.lastPredictionCache.set(boardKey, qValues);

    return this.findBestActionFromQValues(legalActions, qValues);
  }

  /**
   * 从Q值中找到最佳动作
   * @param legalActions 合法动作列表
   * @param qValues Q值数组
   * @returns 最佳动作
   */
  private findBestActionFromQValues(legalActions: OthelloAction[], qValues: Float32Array): OthelloAction {
    let bestAction = legalActions[0];
    let bestQValue = -Infinity;

    for (const action of legalActions) {
      const actionIndex = action.row * 8 + action.col;
      const qValue = qValues[actionIndex];

      if (qValue > bestQValue) {
        bestQValue = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * 生成棋盘状态的缓存键
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 缓存键
   */
  private getBoardKey(board: OthelloBoard, player: OthelloPlayer): string {
    let key = player + ':';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        key += (board[row][col] || '-');
      }
    }
    return key;
  }

  /**
   * 预热方法：预先计算Q值并缓存
   * @param board 棋盘状态
   * @param player 当前玩家
   */
  public async warmup(board: OthelloBoard, player: OthelloPlayer): Promise<void> {
    const qValues = await this.network.predict(board, player);
    const boardKey = this.getBoardKey(board, player);
    this.lastPredictionCache.set(boardKey, qValues);
  }

  /**
   * 清理缓存（避免内存泄漏）
   */
  public clearCache(): void {
    this.lastPredictionCache.clear();
  }

  /**
   * 获取动作的Q值
   * @param board 棋盘状态
   * @param player 当前玩家
   * @param action 动作
   * @returns Q值
   */
  public async getActionQValue(
    board: OthelloBoard,
    player: OthelloPlayer,
    action: OthelloAction
  ): Promise<number> {
    const qValues = await this.network.predict(board, player);
    const actionIndex = action.row * 8 + action.col;
    return qValues[actionIndex];
  }

  /**
   * 获取所有合法动作的Q值
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 动作-Q值对数组
   */
  public async getLegalActionsQValues(
    board: OthelloBoard, 
    player: OthelloPlayer
  ): Promise<Array<{ action: OthelloAction, qValue: number }>> {
    const legalActions = getLegalActions(board, player);
    const qValues = await this.network.predict(board, player);
    
    return legalActions.map(action => ({
      action,
      qValue: qValues[action.row * 8 + action.col]
    }));
  }

  /**
   * 更新探索率
   */
  public updateEpsilon(): void {
    if (this.config.epsilon > this.config.epsilonMin) {
      this.config.epsilon *= this.config.epsilonDecay;
    }
    this.stepCount++;
  }

  /**
   * 设置训练模式
   * @param isTraining 是否为训练模式
   * @param epsilon 探索率（可选）
   */
  public setTrainingMode(isTraining: boolean, epsilon?: number): void {
    this.config.isTraining = isTraining;
    if (epsilon !== undefined) {
      this.config.epsilon = epsilon;
    }
  }

  /**
   * 设置探索率
   * @param epsilon 新的探索率
   */
  public setEpsilon(epsilon: number): void {
    this.config.epsilon = Math.max(this.config.epsilonMin, Math.min(1.0, epsilon));
  }

  /**
   * 获取当前配置
   */
  public getConfig(): DQNAgentConfig {
    return { ...this.config };
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    stepCount: number;
    epsilon: number;
    isTraining: boolean;
    name: string;
  } {
    return {
      stepCount: this.stepCount,
      epsilon: this.config.epsilon,
      isTraining: this.config.isTraining,
      name: this.config.name
    };
  }

  /**
   * 保存模型
   * @param path 保存路径
   */
  public async saveModel(path: string): Promise<void> {
    await this.network.saveModel(path);
  }

  /**
   * 加载模型
   * @param path 模型路径
   */
  public async loadModel(path: string): Promise<void> {
    await this.network.loadModel(path);
  }

  /**
   * 获取网络引用（用于训练）
   */
  public getNetwork(): DQNNetwork {
    return this.network;
  }

  /**
   * 复制智能体（用于创建目标网络）
   */
  public clone(): DQNOthelloAgent {
    const clonedAgent = new DQNOthelloAgent(this.config);
    this.network.copyWeightsTo(clonedAgent.network);
    return clonedAgent;
  }

  /**
   * 软更新权重
   * @param targetAgent 目标智能体
   * @param tau 更新系数
   */
  public softUpdateWeights(targetAgent: DQNOthelloAgent, tau: number = 0.001): void {
    this.network.softUpdateWeights(targetAgent.network, tau);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.network.dispose();
  }

  /**
   * 获取模型摘要
   */
  public getModelSummary(): void {
    console.log(`\n🤖 ${this.config.name} 模型摘要:`);
    this.network.getModelSummary();
    console.log(`📊 当前状态:`);
    console.log(`   探索率: ${this.config.epsilon.toFixed(4)}`);
    console.log(`   训练模式: ${this.config.isTraining ? '是' : '否'}`);
    console.log(`   步数: ${this.stepCount}`);
  }
}
