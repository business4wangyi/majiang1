// {{ AURA-X: Add - A3C网络架构实现，Actor-Critic架构. Approval: 寸止(ID:恢复A3C功能代码). }}

/**
 * A3C (Asynchronous Advantage Actor-Critic) 网络实现
 * 
 * 实现Actor-Critic架构，包括：
 * - 共享特征提取层
 * - Actor网络（策略网络）
 * - Critic网络（价值网络）
 */

import * as tf from '@tensorflow/tfjs-node';
import { OthelloBoard, OthelloPlayer } from '../othello-types';

/**
 * A3C网络配置接口
 */
export interface A3CNetworkConfig {
  /** 学习率 */
  learningRate: number;
  /** 共享层神经元数量 */
  sharedLayerSize: number;
  /** Actor层神经元数量 */
  actorLayerSize: number;
  /** Critic层神经元数量 */
  criticLayerSize: number;
  /** 熵正则化系数 */
  entropyCoefficient: number;
  /** 价值损失系数 */
  valueLossCoefficient: number;
  /** 梯度裁剪阈值 */
  gradientClipNorm: number;
}

/**
 * 默认A3C网络配置
 */
export const DEFAULT_A3C_CONFIG: A3CNetworkConfig = {
  learningRate: 0.0007,
  sharedLayerSize: 512,
  actorLayerSize: 256,
  criticLayerSize: 256,
  entropyCoefficient: 0.01,
  valueLossCoefficient: 0.5,
  gradientClipNorm: 0.5
};

/**
 * A3C网络类
 */
export class A3CNetwork {
  private model: tf.LayersModel;
  private optimizer: tf.Optimizer;
  private config: A3CNetworkConfig;

  constructor(config: A3CNetworkConfig = DEFAULT_A3C_CONFIG) {
    this.config = { ...config };
    this.optimizer = tf.train.adam(this.config.learningRate);
    this.model = this.buildModel();
  }

  /**
   * 构建A3C网络模型
   */
  private buildModel(): tf.LayersModel {
    // 输入层：8x8棋盘，3个通道（黑子、白子、空位）
    const input = tf.input({ shape: [8, 8, 3], name: 'board_input' });

    // 共享特征提取层
    let shared = tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      name: 'shared_conv1'
    }).apply(input) as tf.SymbolicTensor;

    shared = tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      name: 'shared_conv2'
    }).apply(shared) as tf.SymbolicTensor;

    shared = tf.layers.flatten({ name: 'shared_flatten' }).apply(shared) as tf.SymbolicTensor;

    shared = tf.layers.dense({
      units: this.config.sharedLayerSize,
      activation: 'relu',
      name: 'shared_dense'
    }).apply(shared) as tf.SymbolicTensor;

    // Actor网络（策略网络）
    let actor = tf.layers.dense({
      units: this.config.actorLayerSize,
      activation: 'relu',
      name: 'actor_hidden'
    }).apply(shared) as tf.SymbolicTensor;

    const actionLogits = tf.layers.dense({
      units: 64, // 8x8棋盘的64个位置
      activation: 'linear',
      name: 'action_logits'
    }).apply(actor) as tf.SymbolicTensor;

    // Critic网络（价值网络）
    let critic = tf.layers.dense({
      units: this.config.criticLayerSize,
      activation: 'relu',
      name: 'critic_hidden'
    }).apply(shared) as tf.SymbolicTensor;

    const stateValue = tf.layers.dense({
      units: 1,
      activation: 'linear',
      name: 'state_value'
    }).apply(critic) as tf.SymbolicTensor;

    // 创建模型
    const model = tf.model({
      inputs: input,
      outputs: [actionLogits, stateValue],
      name: 'A3C_Network'
    });

    return model;
  }

  /**
   * 前向传播
   */
  predict(boardTensor: tf.Tensor4D): { actionLogits: tf.Tensor2D; stateValue: tf.Tensor2D } {
    const [actionLogits, stateValue] = this.model.predict(boardTensor) as [tf.Tensor2D, tf.Tensor2D];
    return { actionLogits, stateValue };
  }

  /**
   * 训练网络
   */
  async train(
    states: tf.Tensor4D,
    actions: tf.Tensor2D,
    advantages: tf.Tensor2D,
    returns: tf.Tensor2D
  ): Promise<{ actorLoss: number; criticLoss: number; entropy: number }> {
    const result = await this.optimizer.minimize(() => {
      const { actionLogits, stateValue } = this.predict(states);

      // 计算策略损失
      const actionProbs = tf.softmax(actionLogits);
      const logProbs = tf.log(tf.add(actionProbs, 1e-8));
      const selectedLogProbs = tf.sum(tf.mul(logProbs, actions), 1, true);
      const actorLoss = tf.neg(tf.mean(tf.mul(selectedLogProbs, advantages)));

      // 计算价值损失
      const criticLoss = tf.mean(tf.square(tf.sub(returns, stateValue)));

      // 计算熵
      const entropy = tf.neg(tf.mean(tf.sum(tf.mul(actionProbs, logProbs), 1)));

      // 总损失
      const totalLoss = tf.add(
        actorLoss,
        tf.add(
          tf.mul(criticLoss, this.config.valueLossCoefficient),
          tf.mul(entropy, this.config.entropyCoefficient)
        )
      ) as tf.Scalar;

      return totalLoss;
    }, true);

    // 返回损失信息
    const { actionLogits, stateValue } = this.predict(states);
    const actionProbs = tf.softmax(actionLogits);
    const logProbs = tf.log(tf.add(actionProbs, 1e-8));
    const selectedLogProbs = tf.sum(tf.mul(logProbs, actions), 1, true);
    const actorLoss = tf.neg(tf.mean(tf.mul(selectedLogProbs, advantages)));
    const criticLoss = tf.mean(tf.square(tf.sub(returns, stateValue)));
    const entropy = tf.neg(tf.mean(tf.sum(tf.mul(actionProbs, logProbs), 1)));

    const actorLossValue = await actorLoss.data();
    const criticLossValue = await criticLoss.data();
    const entropyValue = await entropy.data();

    // 清理张量
    actionLogits.dispose();
    stateValue.dispose();
    actionProbs.dispose();
    logProbs.dispose();
    selectedLogProbs.dispose();
    actorLoss.dispose();
    criticLoss.dispose();
    entropy.dispose();

    return {
      actorLoss: actorLossValue[0],
      criticLoss: criticLossValue[0],
      entropy: entropyValue[0]
    };
  }

  /**
   * 将棋盘转换为张量
   */
  boardToTensor(board: OthelloBoard, player: OthelloPlayer): tf.Tensor4D {
    const tensor = tf.tidy(() => {
      const data = new Float32Array(8 * 8 * 3);
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const idx = row * 8 + col;
          const piece = board[row][col];
          
          // 通道0：当前玩家的棋子
          data[idx * 3 + 0] = piece === player ? 1 : 0;
          // 通道1：对手的棋子
          data[idx * 3 + 1] = piece !== null && piece !== player ? 1 : 0;
          // 通道2：空位
          data[idx * 3 + 2] = piece === null ? 1 : 0;
        }
      }
      
      return tf.tensor4d(data, [1, 8, 8, 3]);
    });
    
    return tensor;
  }

  /**
   * 保存模型
   */
  async saveModel(path: string): Promise<void> {
    await this.model.save(`file://${path}`);
  }

  /**
   * 加载模型
   */
  async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
  }

  /**
   * 获取模型摘要
   */
  getModelSummary(): void {
    this.model.summary();
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.model.dispose();
    this.optimizer.dispose();
  }
}
