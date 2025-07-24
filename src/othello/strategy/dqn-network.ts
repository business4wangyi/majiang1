// {{ AURA-X: Add - DQN神经网络定义，用于黑白棋深度强化学习. Approval: 寸止(ID:1735819200). }}

// {{ AURA-X: Modify - 重新启用tfjs-node，Node.js v22.17.1兼容性已验证. Approval: 寸止(ID:1735819200). }}
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs';
import { OthelloBoard, OthelloPlayer } from '../othello-types';
import { getLegalActions } from '../othello-game';

/**
 * DQN网络配置接口
 */
export interface DQNNetworkConfig {
  /** 输入形状 [height, width, channels] */
  inputShape: [number, number, number];
  /** 输出动作数量 */
  actionSize: number;
  /** 学习率 */
  learningRate: number;
  /** 是否使用Dueling DQN架构 */
  useDueling: boolean;
}

/**
 * 默认DQN网络配置（优化版）
 * {{ AURA-X: Modify - 优化网络学习率，提高训练稳定性. Approval: 寸止(ID:方案A参数微调). }}
 */
export const DEFAULT_DQN_CONFIG: DQNNetworkConfig = {
  inputShape: [8, 8, 3], // 8x8棋盘，3个通道
  actionSize: 64,        // 64个可能的位置
  learningRate: 0.0005,  // 降低学习率，提高稳定性
  useDueling: false      // 保持标准DQN架构
};

/**
 * DQN神经网络类
 * 负责创建、训练和预测的深度Q网络
 */
export class DQNNetwork {
  private model: tf.LayersModel;
  private config: DQNNetworkConfig;

  /**
   * 构造函数
   * @param config 网络配置
   */
  constructor(config: DQNNetworkConfig = DEFAULT_DQN_CONFIG) {
    this.config = config;
    this.model = this.buildNetwork();
  }

  /**
   * 构建DQN网络架构
   * @returns 编译后的模型
   */
  private buildNetwork(): tf.LayersModel {
    const input = tf.input({ 
      shape: this.config.inputShape,
      name: 'board_input'
    });

    // 卷积层：提取空间特征
    let x = tf.layers.conv2d({
      filters: 32,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same',
      name: 'conv1'
    }).apply(input) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: 'bn1' }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.conv2d({
      filters: 64,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same',
      name: 'conv2'
    }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: 'bn2' }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same',
      name: 'conv3'
    }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: 'bn3' }).apply(x) as tf.SymbolicTensor;

    // 展平层
    x = tf.layers.flatten({ name: 'flatten' }).apply(x) as tf.SymbolicTensor;

    if (this.config.useDueling) {
      // Dueling DQN架构：分离状态价值和动作优势
      const valueStream = tf.layers.dense({
        units: 256,
        activation: 'relu',
        name: 'value_dense1'
      }).apply(x) as tf.SymbolicTensor;

      const valueOutput = tf.layers.dense({
        units: 1,
        name: 'value_output'
      }).apply(valueStream) as tf.SymbolicTensor;

      // 将value扩展到action维度
      const valueExpanded = tf.layers.repeatVector({
        n: this.config.actionSize,
        name: 'value_expanded'
      }).apply(valueOutput) as tf.SymbolicTensor;

      const advantageStream = tf.layers.dense({
        units: 256,
        activation: 'relu',
        name: 'advantage_dense1'
      }).apply(x) as tf.SymbolicTensor;

      const advantageOutput = tf.layers.dense({
        units: this.config.actionSize,
        name: 'advantage_output'
      }).apply(advantageStream) as tf.SymbolicTensor;

      // Q(s,a) = V(s) + A(s,a) - mean(A(s,·))
      // 简化实现：直接相加（省略mean操作）
      const qValues = tf.layers.add({ name: 'q_values' }).apply([
        valueExpanded,
        advantageOutput
      ]) as tf.SymbolicTensor;

      const duelingModel = tf.model({ inputs: input, outputs: qValues });

      // 编译模型
      duelingModel.compile({
        optimizer: tf.train.adam(this.config.learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      return duelingModel;

    } else {
      // 标准DQN架构
      x = tf.layers.dense({
        units: 512,
        activation: 'relu',
        name: 'dense1'
      }).apply(x) as tf.SymbolicTensor;

      x = tf.layers.dropout({ rate: 0.3, name: 'dropout1' }).apply(x) as tf.SymbolicTensor;

      x = tf.layers.dense({
        units: 256,
        activation: 'relu',
        name: 'dense2'
      }).apply(x) as tf.SymbolicTensor;

      x = tf.layers.dropout({ rate: 0.3, name: 'dropout2' }).apply(x) as tf.SymbolicTensor;

      // 输出层：64个位置的Q值
      const qValues = tf.layers.dense({
        units: this.config.actionSize,
        name: 'q_values'
      }).apply(x) as tf.SymbolicTensor;

      const standardModel = tf.model({ inputs: input, outputs: qValues });

      // 编译模型
      standardModel.compile({
        optimizer: tf.train.adam(this.config.learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      return standardModel;
    }
  }

  /**
   * 将棋盘状态转换为网络输入张量
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 输入张量 [1, 8, 8, 3]
   */
  public boardToTensor(board: OthelloBoard, player: OthelloPlayer): tf.Tensor4D {
    const tensor = tf.tidy(() => {
      // 创建三通道输入
      const myPieces = new Float32Array(64);      // 我方棋子
      const opponentPieces = new Float32Array(64); // 对方棋子
      const legalMoves = new Float32Array(64);     // 合法位置

      const opponent = player === 'B' ? 'W' : 'B';
      const legalActions = getLegalActions(board, player);
      const legalSet = new Set(legalActions.map(a => a.row * 8 + a.col));

      // 填充数据
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const idx = row * 8 + col;
          const cell = board[row][col];
          
          myPieces[idx] = cell === player ? 1.0 : 0.0;
          opponentPieces[idx] = cell === opponent ? 1.0 : 0.0;
          legalMoves[idx] = legalSet.has(idx) ? 1.0 : 0.0;
        }
      }

      // 创建张量并重塑为 [1, 8, 8, 3]
      const myTensor = tf.tensor2d(Array.from(myPieces), [8, 8]);
      const opponentTensor = tf.tensor2d(Array.from(opponentPieces), [8, 8]);
      const legalTensor = tf.tensor2d(Array.from(legalMoves), [8, 8]);

      const combined = tf.stack([myTensor, opponentTensor, legalTensor], 2);
      return tf.expandDims(combined, 0) as tf.Tensor4D;
    });

    return tensor;
  }

  /**
   * 预测Q值
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns Q值数组 [64]
   */
  public async predict(board: OthelloBoard, player: OthelloPlayer): Promise<Float32Array> {
    const inputTensor = this.boardToTensor(board, player);
    const prediction = this.model.predict(inputTensor) as tf.Tensor2D;
    const qValues = await prediction.data() as Float32Array;
    inputTensor.dispose();
    prediction.dispose();
    return qValues;
  }

  /**
   * 同步预测Q值（用于推理模式）
   * {{ AURA-X: Add - 添加同步预测方法，修复推理模式问题. Approval: 寸止(ID:诊断模型加载问题). }}
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns Q值数组 [64]
   */
  public predictSync(board: OthelloBoard, player: OthelloPlayer): Float32Array | null {
    try {
      const inputTensor = this.boardToTensor(board, player);
      const prediction = this.model.predict(inputTensor) as tf.Tensor2D;
      const qValues = prediction.dataSync() as Float32Array;
      inputTensor.dispose();
      prediction.dispose();
      return qValues;
    } catch (error) {
      console.error('DQN同步预测失败:', error);
      return null;
    }
  }

  /**
   * 批量预测Q值
   * @param boards 棋盘状态数组
   * @param players 玩家数组
   * @returns Q值矩阵 [batchSize, 64]
   */
  public async predictBatch(boards: OthelloBoard[], players: OthelloPlayer[]): Promise<Float32Array> {
    const batchTensors = boards.map((board, i) =>
      this.boardToTensor(board, players[i])
    );
    const batchInput = tf.concat(batchTensors, 0);
    const predictions = this.model.predict(batchInput) as tf.Tensor2D;
    const qValues = await predictions.data() as Float32Array;

    // 清理资源
    batchTensors.forEach(tensor => tensor.dispose());
    batchInput.dispose();
    predictions.dispose();

    return qValues;
  }

  /**
   * 训练网络
   * @param inputs 输入张量 [batchSize, 8, 8, 3]
   * @param targets 目标Q值 [batchSize, 64]
   * @returns 训练历史
   */
  public async train(inputs: tf.Tensor4D, targets: tf.Tensor2D): Promise<tf.History> {
    // 确保模型已编译
    if (!this.model.optimizer) {
      this.model.compile({
        optimizer: tf.train.adam(this.config.learningRate),
        loss: 'meanSquaredError'
      });
    }

    return await this.model.fit(inputs, targets, {
      epochs: 1,
      verbose: 0,
      shuffle: true
    });
  }

  /**
   * 复制网络权重到目标网络
   * @param targetNetwork 目标网络
   */
  public copyWeightsTo(targetNetwork: DQNNetwork): void {
    const weights = this.model.getWeights();
    targetNetwork.model.setWeights(weights);
    // 确保目标网络也正确编译
    if (!targetNetwork.model.optimizer) {
      targetNetwork.model.compile({
        optimizer: tf.train.adam(targetNetwork.config.learningRate),
        loss: 'meanSquaredError'
      });
    }
  }

  /**
   * 软更新目标网络权重
   * @param targetNetwork 目标网络
   * @param tau 更新系数 (0-1)
   */
  public softUpdateWeights(targetNetwork: DQNNetwork, tau: number = 0.001): void {
    const mainWeights = this.model.getWeights();
    const targetWeights = targetNetwork.model.getWeights();
    
    const updatedWeights = mainWeights.map((mainWeight, i) => {
      const targetWeight = targetWeights[i];
      return tf.add(
        tf.mul(mainWeight, tau),
        tf.mul(targetWeight, 1 - tau)
      );
    });
    
    targetNetwork.model.setWeights(updatedWeights);
  }

  /**
   * 保存模型
   * @param path 保存路径
   */
  public async saveModel(path: string): Promise<void> {
    await this.model.save(`file://${path}`);
  }

  /**
   * 加载模型
   * @param path 模型路径
   */
  public async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    // 重新编译模型以支持训练
    this.model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
  }

  /**
   * 获取模型摘要
   */
  public getModelSummary(): void {
    this.model.summary();
  }

  /**
   * 释放模型资源
   */
  public dispose(): void {
    this.model.dispose();
  }
}
