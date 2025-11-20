// {{ AURA-X: Add - A3C智能体实现，基于Actor-Critic架构. Approval: 寸止(ID:恢复A3C功能代码). }}

/**
 * A3C (Asynchronous Advantage Actor-Critic) 智能体实现
 * 
 * 实现基于Actor-Critic架构的强化学习智能体，
 * 支持异步训练和策略梯度优化。
 */

// Fix for isNullOrUndefined compatibility issue (must be first)
import * as util from 'util';
if (!util.isNullOrUndefined) {
  (util as any).isNullOrUndefined = function(value: any): boolean {
    return value === null || value === undefined;
  };
}
import * as tf from '@tensorflow/tfjs-node';
import { OthelloAgent } from '../agents/random-agent';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { getLegalActions } from '../../core/game';
import { A3CNetwork, A3CNetworkConfig, DEFAULT_A3C_CONFIG } from '../networks/a3c-network';

/**
 * A3C智能体配置接口
 */
export interface A3CAgentConfig {
  /** 网络配置 */
  networkConfig: A3CNetworkConfig;
  /** 智能体名称 */
  name: string;
  /** 是否为训练模式 */
  isTraining: boolean;
  /** 折扣因子 */
  gamma: number;
  /** 探索率（用于训练时的随机性） */
  epsilon: number;
  /** 探索率衰减 */
  epsilonDecay: number;
  /** 最小探索率 */
  epsilonMin: number;
}

/**
 * 默认A3C智能体配置
 */
export const DEFAULT_A3C_AGENT_CONFIG: A3CAgentConfig = {
  networkConfig: DEFAULT_A3C_CONFIG,
  name: 'A3C-Agent',
  isTraining: true,
  gamma: 0.99,
  epsilon: 0.1,
  epsilonDecay: 0.995,
  epsilonMin: 0.01
};

/**
 * A3C智能体类
 */
export class A3COthelloAgent implements OthelloAgent {
  private network: A3CNetwork;
  private config: A3CAgentConfig;
  private stepCount: number = 0;

  constructor(config: A3CAgentConfig = DEFAULT_A3C_AGENT_CONFIG) {
    this.config = { ...config };
    this.network = new A3CNetwork(this.config.networkConfig);
    
    console.log(`🤖 A3C智能体已创建: ${this.config.name}`);
    console.log(`   训练模式: ${this.config.isTraining}`);
    console.log(`   探索率: ${this.config.epsilon}`);
  }

  /**
   * 选择动作
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const legalActions = getLegalActions(board, player);
    
    if (legalActions.length === 0) {
      return null;
    }

    if (legalActions.length === 1) {
      return legalActions[0];
    }

    // 使用网络预测
    const boardTensor = this.network.boardToTensor(board, player);
    const { actionLogits } = this.network.predict(boardTensor);

    try {
      // 获取合法动作的概率
      const actionProbs = tf.softmax(actionLogits);
      const probsArray = actionProbs.dataSync();

      // 创建合法动作的概率分布
      const legalProbs: number[] = [];
      const legalIndices: number[] = [];

      for (const action of legalActions) {
        const index = action.row * 8 + action.col;
        legalProbs.push(probsArray[index]);
        legalIndices.push(index);
      }

      // 选择动作
      let selectedIndex: number;
      
      if (this.config.isTraining && Math.random() < this.config.epsilon) {
        // 探索：随机选择
        selectedIndex = Math.floor(Math.random() * legalActions.length);
      } else {
        // 利用：选择概率最高的动作
        selectedIndex = legalProbs.indexOf(Math.max(...legalProbs));
      }

      const selectedAction = legalActions[selectedIndex];

      // 清理张量
      boardTensor.dispose();
      actionLogits.dispose();
      actionProbs.dispose();

      // 更新探索率
      if (this.config.isTraining) {
        this.updateEpsilon();
      }

      return selectedAction;

    } catch (error) {
      console.error('A3C动作选择错误:', error);
      
      // 清理张量
      boardTensor.dispose();
      actionLogits.dispose();
      
      // 回退到随机选择
      return legalActions[Math.floor(Math.random() * legalActions.length)];
    }
  }

  /**
   * 获取状态价值
   */
  getStateValue(board: OthelloBoard, player: OthelloPlayer): number {
    const boardTensor = this.network.boardToTensor(board, player);
    const { stateValue } = this.network.predict(boardTensor);
    
    const value = stateValue.dataSync()[0];
    
    // 清理张量
    boardTensor.dispose();
    stateValue.dispose();
    
    return value;
  }

  /**
   * 获取动作概率分布
   */
  getActionProbabilities(board: OthelloBoard, player: OthelloPlayer): Float32Array {
    const boardTensor = this.network.boardToTensor(board, player);
    const { actionLogits } = this.network.predict(boardTensor);

    const actionProbs = tf.softmax(actionLogits);
    const probsArray = actionProbs.dataSync() as Float32Array;

    // 清理张量
    boardTensor.dispose();
    actionLogits.dispose();
    actionProbs.dispose();

    return probsArray;
  }

  /**
   * 训练网络
   */
  async trainNetwork(
    states: OthelloBoard[],
    actions: OthelloAction[],
    rewards: number[],
    player: OthelloPlayer
  ): Promise<{ actorLoss: number; criticLoss: number; entropy: number }> {
    if (!this.config.isTraining) {
      throw new Error('智能体不在训练模式');
    }

    // 转换为张量
    const stateTensors = states.map(state => this.network.boardToTensor(state, player));
    const statesBatch = tf.concat(stateTensors);

    // 创建动作张量（one-hot编码）
    const actionTensors = actions.map(action => {
      const oneHot = new Float32Array(64);
      oneHot[action.row * 8 + action.col] = 1;
      return tf.tensor2d([Array.from(oneHot)]);
    });
    const actionsBatch = tf.concat(actionTensors);

    // 计算折扣奖励
    const returns = this.calculateReturns(rewards);
    const returnsTensor = tf.tensor2d(returns.map(r => [r]));

    // 计算优势
    const advantages = await this.calculateAdvantages(statesBatch, returnsTensor, player);

    // 训练网络
    const lossInfo = await this.network.train(statesBatch, actionsBatch, advantages, returnsTensor);

    // 清理张量
    stateTensors.forEach(tensor => tensor.dispose());
    statesBatch.dispose();
    actionTensors.forEach(tensor => tensor.dispose());
    actionsBatch.dispose();
    returnsTensor.dispose();
    advantages.dispose();

    return lossInfo;
  }

  /**
   * 计算折扣奖励
   */
  private calculateReturns(rewards: number[]): number[] {
    const returns: number[] = [];
    let runningReturn = 0;

    for (let i = rewards.length - 1; i >= 0; i--) {
      runningReturn = rewards[i] + this.config.gamma * runningReturn;
      returns.unshift(runningReturn);
    }

    return returns;
  }

  /**
   * 计算优势函数
   */
  private async calculateAdvantages(
    states: tf.Tensor4D,
    returns: tf.Tensor2D,
    player: OthelloPlayer
  ): Promise<tf.Tensor2D> {
    const { stateValue } = this.network.predict(states);
    const advantages = tf.sub(returns, stateValue) as tf.Tensor2D;

    stateValue.dispose();

    return advantages;
  }

  /**
   * 更新探索率
   */
  private updateEpsilon(): void {
    if (this.config.epsilon > this.config.epsilonMin) {
      this.config.epsilon *= this.config.epsilonDecay;
    }
    this.stepCount++;
  }

  /**
   * 保存模型
   */
  async saveModel(path: string): Promise<void> {
    await this.network.saveModel(path);
    console.log(`✅ A3C模型已保存到: ${path}`);
  }

  /**
   * 加载模型
   */
  async loadModel(path: string): Promise<void> {
    await this.network.loadModel(path);
    console.log(`✅ A3C模型已从以下路径加载: ${path}`);
  }

  /**
   * 获取智能体信息
   */
  getInfo(): string {
    return `A3C智能体 (${this.config.name}) - 步数: ${this.stepCount}, 探索率: ${this.config.epsilon.toFixed(4)}`;
  }

  /**
   * 重置智能体状态
   */
  reset(): void {
    this.stepCount = 0;
    this.config.epsilon = DEFAULT_A3C_AGENT_CONFIG.epsilon;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.network.dispose();
  }
}
