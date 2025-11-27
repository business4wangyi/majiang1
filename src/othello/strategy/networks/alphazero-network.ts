// {{ AURA-X: Add - AlphaZero神经网络实现，结合策略和价值网络. Approval: 寸止(ID:开始AlphaZero实现). }}

/**
 * AlphaZero神经网络实现
 * 
 * 实现AlphaZero的核心神经网络架构：
 * - 共享的残差网络主干
 * - 策略头（Policy Head）- 输出动作概率
 * - 价值头（Value Head）- 输出位置评估
 */

// Fix for isNullOrUndefined compatibility issue (must be first)
import '../../../shared/utils/tfjs-compat-fix';
import * as tf from '@tensorflow/tfjs-node';
import { initializeTFJSOptimization } from '../../../shared/utils/tfjs-optimizer';
import { OthelloBoard, OthelloPlayer } from '../../core/types';

// 初始化TensorFlow.js优化（全局一次）
initializeTFJSOptimization();

/**
 * AlphaZero网络配置接口
 */
export interface AlphaZeroNetworkConfig {
  /** 学习率 */
  learningRate: number;
  /** 残差块数量 */
  numResidualBlocks: number;
  /** 卷积滤波器数量 */
  numFilters: number;
  /** L2正则化系数 */
  l2Regularization: number;
  /** 动量 */
  momentum: number;
  /** 批量大小 */
  batchSize: number;
}

/**
 * 默认AlphaZero网络配置
 */
export const DEFAULT_ALPHAZERO_CONFIG: AlphaZeroNetworkConfig = {
  learningRate: 0.0003,  // 从0.0002调整到0.0003（平衡点：0.0002太低导致学习太慢，0.0005可能过高）
  numResidualBlocks: 10,
  numFilters: 256,
  l2Regularization: 1e-4,
  momentum: 0.9,
  batchSize: 32
};

/**
 * AlphaZero网络预测结果
 */
export interface AlphaZeroPrediction {
  /** 策略概率分布 (64维，对应8x8棋盘位置) */
  policyProbs: Float32Array;
  /** 价值评估 (-1到1之间) */
  value: number;
}

/**
 * AlphaZero网络通用接口
 */
export interface IAlphaZeroNetwork {
  boardToTensor(board: OthelloBoard, player: OthelloPlayer): tf.Tensor4D;
  predict(boardTensor: tf.Tensor4D): AlphaZeroPrediction;
  predictBatch?(boardTensors: tf.Tensor4D[]): AlphaZeroPrediction[]; // 批量预测（可选）
  train(statesBatch: tf.Tensor4D, targetPolicies: tf.Tensor2D, targetValues: tf.Tensor2D): Promise<{ policyLoss: number; valueLoss: number; totalLoss: number }>;
  saveModel(path: string): Promise<void>;
  loadModel(path: string): Promise<void>;
  dispose(): void;
  getModelSummary(): void;
  getParameterCount(): number;
}

/**
 * AlphaZero神经网络类
 */
export class AlphaZeroNetwork implements IAlphaZeroNetwork {
  private model: tf.LayersModel;
  private optimizer: tf.Optimizer;
  private config: AlphaZeroNetworkConfig;

  constructor(config: AlphaZeroNetworkConfig = DEFAULT_ALPHAZERO_CONFIG) {
    this.config = { ...config };
    this.optimizer = tf.train.momentum(this.config.learningRate, this.config.momentum);
    this.model = this.buildModel();
    
    console.log('🧠 AlphaZero神经网络已创建');
    console.log(`   残差块数量: ${this.config.numResidualBlocks}`);
    console.log(`   滤波器数量: ${this.config.numFilters}`);
    console.log(`   学习率: ${this.config.learningRate}`);
  }

  /**
   * 构建AlphaZero网络模型
   */
  private buildModel(): tf.LayersModel {
    // 输入层：8x8x3 (当前玩家棋子、对手棋子、空位)
    const input = tf.input({ shape: [8, 8, 3], name: 'board_input' });

    // 初始卷积层
    let x = tf.layers.conv2d({
      filters: this.config.numFilters,
      kernelSize: 3,
      padding: 'same',
      activation: 'linear',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'initial_conv'
    }).apply(input) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: 'initial_bn' }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.reLU({ name: 'initial_relu' }).apply(x) as tf.SymbolicTensor;

    // 残差块
    for (let i = 0; i < this.config.numResidualBlocks; i++) {
      x = this.buildResidualBlock(x, i);
    }

    // 策略头 (Policy Head)
    let policyHead = tf.layers.conv2d({
      filters: 2,
      kernelSize: 1,
      padding: 'same',
      activation: 'linear',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'policy_conv'
    }).apply(x) as tf.SymbolicTensor;

    policyHead = tf.layers.batchNormalization({ name: 'policy_bn' }).apply(policyHead) as tf.SymbolicTensor;
    policyHead = tf.layers.reLU({ name: 'policy_relu' }).apply(policyHead) as tf.SymbolicTensor;
    policyHead = tf.layers.flatten({ name: 'policy_flatten' }).apply(policyHead) as tf.SymbolicTensor;

    const policyOutput = tf.layers.dense({
      units: 64, // 8x8棋盘的64个位置
      activation: 'softmax',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'policy_output'
    }).apply(policyHead) as tf.SymbolicTensor;

    // 价值头 (Value Head)
    let valueHead = tf.layers.conv2d({
      filters: 1,
      kernelSize: 1,
      padding: 'same',
      activation: 'linear',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'value_conv'
    }).apply(x) as tf.SymbolicTensor;

    valueHead = tf.layers.batchNormalization({ name: 'value_bn' }).apply(valueHead) as tf.SymbolicTensor;
    valueHead = tf.layers.reLU({ name: 'value_relu' }).apply(valueHead) as tf.SymbolicTensor;
    valueHead = tf.layers.flatten({ name: 'value_flatten' }).apply(valueHead) as tf.SymbolicTensor;

    valueHead = tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'value_hidden'
    }).apply(valueHead) as tf.SymbolicTensor;

    const valueOutput = tf.layers.dense({
      units: 1,
      activation: 'tanh',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: 'value_output'
    }).apply(valueHead) as tf.SymbolicTensor;

    // 创建模型
    const model = tf.model({
      inputs: input,
      outputs: [policyOutput, valueOutput],
      name: 'AlphaZero_Network'
    });

    return model;
  }

  /**
   * 构建残差块
   */
  private buildResidualBlock(input: tf.SymbolicTensor, blockIndex: number): tf.SymbolicTensor {
    const blockName = `residual_${blockIndex}`;

    // 第一个卷积层
    let x = tf.layers.conv2d({
      filters: this.config.numFilters,
      kernelSize: 3,
      padding: 'same',
      activation: 'linear',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: `${blockName}_conv1`
    }).apply(input) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: `${blockName}_bn1` }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.reLU({ name: `${blockName}_relu1` }).apply(x) as tf.SymbolicTensor;

    // 第二个卷积层
    x = tf.layers.conv2d({
      filters: this.config.numFilters,
      kernelSize: 3,
      padding: 'same',
      activation: 'linear',
      kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
      name: `${blockName}_conv2`
    }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: `${blockName}_bn2` }).apply(x) as tf.SymbolicTensor;

    // 残差连接
    x = tf.layers.add({ name: `${blockName}_add` }).apply([input, x]) as tf.SymbolicTensor;
    x = tf.layers.reLU({ name: `${blockName}_relu2` }).apply(x) as tf.SymbolicTensor;

    return x;
  }

  /**
   * 预测函数（优化内存管理）
   */
  predict(boardTensor: tf.Tensor4D): AlphaZeroPrediction {
    // 使用tf.tidy自动管理内存（只管理张量，不返回结果）
    let policyProbs: Float32Array;
    let value: number;
    
    tf.tidy(() => {
      const [policyTensor, valueTensor] = this.model.predict(boardTensor) as [tf.Tensor2D, tf.Tensor2D];
      
      // 使用dataSync()同步获取数据（在tidy中会自动管理）
      const policyData = policyTensor.dataSync() as Float32Array;
      value = valueTensor.dataSync()[0];
      
      // 复制数据（因为tidy结束后张量会被清理）
      policyProbs = new Float32Array(policyData.length);
      policyProbs.set(policyData);
    });
    
    return { policyProbs: policyProbs!, value: value! };
  }

  /**
   * 批量预测函数（性能优化：利用GPU并行计算 + 内存优化）
   */
  predictBatch(boardTensors: tf.Tensor4D[]): AlphaZeroPrediction[] {
    if (boardTensors.length === 0) {
      return [];
    }

    // 使用tf.tidy自动管理内存（只管理张量，不返回结果）
    let results: AlphaZeroPrediction[] = [];
    
    tf.tidy(() => {
      // 合并所有张量为一个批次
      const batchInput = tf.concat(boardTensors, 0);
      const [policyTensor, valueTensor] = this.model.predict(batchInput) as [tf.Tensor2D, tf.Tensor2D];
      
      const policyData = policyTensor.dataSync() as Float32Array;
      const valueData = valueTensor.dataSync() as Float32Array;
      
      // 分离每个预测结果（复制数据，因为tidy结束后张量会被清理）
      const policySize = 64; // 8x8棋盘 = 64个位置
      
      for (let i = 0; i < boardTensors.length; i++) {
        const policyProbs = new Float32Array(policySize);
        for (let j = 0; j < policySize; j++) {
          policyProbs[j] = policyData[i * policySize + j];
        }
        results.push({
          policyProbs,
          value: valueData[i]
        });
      }
    });
    
    return results;
  }

  /**
   * 训练网络
   */
  async train(
    states: tf.Tensor4D,
    targetPolicies: tf.Tensor2D,
    targetValues: tf.Tensor2D
  ): Promise<{ policyLoss: number; valueLoss: number; totalLoss: number }> {
    const result = await this.optimizer.minimize(() => {
      const [predictedPolicies, predictedValues] = this.model.predict(states) as [tf.Tensor2D, tf.Tensor2D];
      
      // 策略损失 (交叉熵)
      const policyLoss = tf.losses.softmaxCrossEntropy(targetPolicies, predictedPolicies);
      
      // 价值损失 (均方误差)
      const valueLoss = tf.losses.meanSquaredError(targetValues, predictedValues);
      
      // 总损失
      const totalLoss = tf.add(policyLoss, valueLoss) as tf.Scalar;
      
      return totalLoss;
    }, true);

    // 计算损失值用于监控（优化内存：使用tf.tidy管理张量）
    let losses: { policyLoss: number; valueLoss: number; totalLoss: number };
    
    const [predictedPolicies, predictedValues, policyLoss, valueLoss, totalLoss] = tf.tidy(() => {
      const [pred, val] = this.model.predict(states) as [tf.Tensor2D, tf.Tensor2D];
      const polLoss = tf.losses.softmaxCrossEntropy(targetPolicies, pred);
      const valLoss = tf.losses.meanSquaredError(targetValues, val);
      const totLoss = tf.add(polLoss, valLoss);
      return [pred, val, polLoss, valLoss, totLoss];
    });

    // 异步获取数据（在tidy外执行）
    const policyLossValue = await policyLoss.data();
    const valueLossValue = await valueLoss.data();
    const totalLossValue = await totalLoss.data();

    // 清理张量
    predictedPolicies.dispose();
    predictedValues.dispose();
    policyLoss.dispose();
    valueLoss.dispose();
    totalLoss.dispose();

    return {
      policyLoss: policyLossValue[0],
      valueLoss: valueLossValue[0],
      totalLoss: totalLossValue[0]
    };
  }

  /**
   * 将棋盘转换为张量
   */
  boardToTensor(board: OthelloBoard, player: OthelloPlayer): tf.Tensor4D {
    return tf.tidy(() => {
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
  }

  /**
   * 保存模型
   */
  async saveModel(path: string): Promise<void> {
    await this.model.save(`file://${path}`);
    console.log(`✅ AlphaZero模型已保存到: ${path}`);
  }

  /**
   * 加载模型
   */
  async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    console.log(`✅ AlphaZero模型已从以下路径加载: ${path}`);
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

  /**
   * 获取参数数量
   */
  getParameterCount(): number {
    return this.model.countParams();
  }
}
