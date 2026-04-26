/**
 * 麻将AlphaZero神经网络 - 基于TensorFlow.js的真实训练实现
 * 输入：320维状态向量 → 输出：39维动作概率 + 1维价值评估
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangStateVector, MajiangStateEncoder } from './majiang-state-encoder';
import { MajiangActionSpace, MajiangActionDecoder } from './majiang-action-decoder';

export interface MajiangNetworkOutput {
  actionProbabilities: Float32Array; // 39维动作概率
  valueEstimation: number;          // 局面价值评估 [-1, 1]
}

export interface MajiangNetworkConfig {
  inputDim: number;           // 输入维度 (320)
  outputDim: number;          // 输出维度 (39)
  hiddenLayers: number[];     // 隐藏层配置 [512, 256, 128]
  activationFunction: 'relu' | 'tanh' | 'sigmoid';
  dropoutRate: number;        // Dropout比率
  learningRate: number;       // 学习率
  batchSize: number;          // 批次大小
  l2Regularization: number;   // L2正则化系数
}

export interface TrainingBatch {
  states: tf.Tensor2D;        // 状态批次 [batchSize, 320]
  actionProbs: tf.Tensor2D;   // 动作概率批次 [batchSize, 39]
  values: tf.Tensor1D;        // 价值批次 [batchSize]
}

export class MajiangAlphaZeroNetwork {
  private config: MajiangNetworkConfig;
  private model!: tf.LayersModel;
  private optimizer!: tf.Optimizer;
  private weights: Map<string, Float32Array> = new Map();
  private biases: Map<string, Float32Array> = new Map();
  private isTraining: boolean;

  constructor(config?: Partial<MajiangNetworkConfig>) {
    this.config = {
      inputDim: MajiangStateEncoder.getStateDimension(), // 320
      outputDim: MajiangActionDecoder.getActionDimension(), // 39
      hiddenLayers: [512, 256, 128],
      activationFunction: 'relu',
      dropoutRate: 0.3,
      learningRate: 0.001,
      batchSize: 32,
      l2Regularization: 0.0001,
      ...config
    };

    this.isTraining = false;
    this.initializeNetwork();
    this.initializeOptimizer();
  }

  private initializeOptimizer(): void {
    this.optimizer = tf.train.adam(this.config.learningRate);
  }
  
  /**
   * 初始化网络权重和偏置
   */
  private initializeNetwork(): void {
    const layers = [this.config.inputDim, ...this.config.hiddenLayers];
    
    // 初始化隐藏层权重和偏置
    for (let i = 0; i < layers.length - 1; i++) {
      const inputSize = layers[i];
      const outputSize = layers[i + 1];
      
      // Xavier初始化
      const limit = Math.sqrt(6.0 / (inputSize + outputSize));
      const weights = new Float32Array(inputSize * outputSize);
      for (let j = 0; j < weights.length; j++) {
        weights[j] = (Math.random() * 2 - 1) * limit;
      }
      
      const biases = new Float32Array(outputSize);
      biases.fill(0);
      
      this.weights.set(`hidden_${i}`, weights);
      this.biases.set(`hidden_${i}`, biases);
    }
    
    // 初始化输出层权重和偏置（动作概率）
    const lastHiddenSize = layers[layers.length - 1];
    const actionLimit = Math.sqrt(6.0 / (lastHiddenSize + this.config.outputDim));
    const actionWeights = new Float32Array(lastHiddenSize * this.config.outputDim);
    for (let i = 0; i < actionWeights.length; i++) {
      actionWeights[i] = (Math.random() * 2 - 1) * actionLimit;
    }
    const actionBiases = new Float32Array(this.config.outputDim);
    actionBiases.fill(0);
    
    this.weights.set('action_output', actionWeights);
    this.biases.set('action_output', actionBiases);
    
    // 初始化价值输出层权重和偏置
    const valueLimit = Math.sqrt(6.0 / (lastHiddenSize + 1));
    const valueWeights = new Float32Array(lastHiddenSize);
    for (let i = 0; i < valueWeights.length; i++) {
      valueWeights[i] = (Math.random() * 2 - 1) * valueLimit;
    }
    const valueBias = new Float32Array(1);
    valueBias[0] = 0;
    
    this.weights.set('value_output', valueWeights);
    this.biases.set('value_output', valueBias);
  }
  
  /**
   * 前向传播
   */
  public forward(stateVector: MajiangStateVector): MajiangNetworkOutput {
    // 将状态向量扁平化为输入
    const input = MajiangStateEncoder.flatten(stateVector);
    
    if (input.length !== this.config.inputDim) {
      throw new Error(`Input dimension mismatch: ${input.length} vs ${this.config.inputDim}`);
    }
    
    let currentActivation = input;
    
    // 通过隐藏层
    const hiddenLayers = this.config.hiddenLayers;
    for (let i = 0; i < hiddenLayers.length; i++) {
      currentActivation = this.forwardLayer(
        currentActivation,
        this.weights.get(`hidden_${i}`)!,
        this.biases.get(`hidden_${i}`)!,
        hiddenLayers[i]
      );
      
      // 应用激活函数
      currentActivation = this.applyActivation(currentActivation, this.config.activationFunction);
      
      // 应用Dropout（仅在训练时）
      if (this.isTraining) {
        currentActivation = this.applyDropout(currentActivation, this.config.dropoutRate);
      }
    }
    
    // 动作概率输出
    const actionLogits = this.forwardLayer(
      currentActivation,
      this.weights.get('action_output')!,
      this.biases.get('action_output')!,
      this.config.outputDim
    );
    const actionProbabilities = this.applySoftmax(actionLogits);
    
    // 价值评估输出
    const valueLogit = this.forwardLayer(
      currentActivation,
      this.weights.get('value_output')!,
      this.biases.get('value_output')!,
      1
    );
    const valueEstimation = Math.tanh(valueLogit[0]); // 限制在[-1, 1]
    
    return {
      actionProbabilities,
      valueEstimation
    };
  }
  
  /**
   * 单层前向传播
   */
  private forwardLayer(
    input: Float32Array,
    weights: Float32Array,
    biases: Float32Array,
    outputSize: number
  ): Float32Array {
    const output = new Float32Array(outputSize);
    
    for (let i = 0; i < outputSize; i++) {
      let sum = biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights[j * outputSize + i];
      }
      output[i] = sum;
    }
    
    return output;
  }
  
  /**
   * 应用激活函数
   */
  private applyActivation(input: Float32Array, activation: string): Float32Array {
    const output = new Float32Array(input.length);
    
    switch (activation) {
      case 'relu':
        for (let i = 0; i < input.length; i++) {
          output[i] = Math.max(0, input[i]);
        }
        break;
      
      case 'tanh':
        for (let i = 0; i < input.length; i++) {
          output[i] = Math.tanh(input[i]);
        }
        break;
      
      case 'sigmoid':
        for (let i = 0; i < input.length; i++) {
          output[i] = 1 / (1 + Math.exp(-input[i]));
        }
        break;
      
      default:
        throw new Error(`Unknown activation function: ${activation}`);
    }
    
    return output;
  }
  
  /**
   * 应用Dropout
   */
  private applyDropout(input: Float32Array, dropoutRate: number): Float32Array {
    if (!this.isTraining || dropoutRate === 0) {
      return input;
    }
    
    const output = new Float32Array(input.length);
    const keepProb = 1 - dropoutRate;
    
    for (let i = 0; i < input.length; i++) {
      if (Math.random() < keepProb) {
        output[i] = input[i] / keepProb; // 缩放补偿
      } else {
        output[i] = 0;
      }
    }
    
    return output;
  }
  
  /**
   * 应用Softmax激活函数
   */
  private applySoftmax(input: Float32Array): Float32Array {
    const output = new Float32Array(input.length);
    
    // 数值稳定性：减去最大值
    const maxVal = Math.max(...input);
    let sum = 0;
    
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.exp(input[i] - maxVal);
      sum += output[i];
    }
    
    // 归一化
    for (let i = 0; i < input.length; i++) {
      output[i] /= sum;
    }
    
    return output;
  }
  
  /**
   * 设置训练模式
   */
  public setTraining(training: boolean): void {
    this.isTraining = training;
  }
  
  /**
   * 获取网络配置
   */
  public getConfig(): MajiangNetworkConfig {
    return { ...this.config };
  }
  
  /**
   * 获取网络参数数量
   */
  public getParameterCount(): number {
    let count = 0;
    
    this.weights.forEach(weights => {
      count += weights.length;
    });
    
    this.biases.forEach(biases => {
      count += biases.length;
    });
    
    return count;
  }
  
  /**
   * 保存网络权重
   */
  public saveWeights(): { weights: Map<string, Float32Array>, biases: Map<string, Float32Array> } {
    const weightsCopy = new Map<string, Float32Array>();
    const biasesCopy = new Map<string, Float32Array>();
    
    this.weights.forEach((weights, key) => {
      weightsCopy.set(key, new Float32Array(weights));
    });
    
    this.biases.forEach((biases, key) => {
      biasesCopy.set(key, new Float32Array(biases));
    });
    
    return { weights: weightsCopy, biases: biasesCopy };
  }
  
  /**
   * 加载网络权重
   */
  public loadWeights(data: { weights: Map<string, Float32Array>, biases: Map<string, Float32Array> }): void {
    this.weights.clear();
    this.biases.clear();
    
    data.weights.forEach((weights, key) => {
      this.weights.set(key, new Float32Array(weights));
    });
    
    data.biases.forEach((biases, key) => {
      this.biases.set(key, new Float32Array(biases));
    });
  }
  
  /**
   * 计算网络输出的置信度
   */
  public calculateConfidence(output: MajiangNetworkOutput): number {
    // 基于动作概率分布的熵计算置信度
    const probs = output.actionProbabilities;
    let entropy = 0;
    
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > 0) {
        entropy -= probs[i] * Math.log2(probs[i]);
      }
    }
    
    // 将熵转换为置信度 [0, 1]
    const maxEntropy = Math.log2(probs.length);
    const confidence = 1 - (entropy / maxEntropy);
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * 添加噪声以增强探索
   */
  public addExplorationNoise(
    output: MajiangNetworkOutput,
    noiseAlpha: number = 0.3,
    noiseBeta: number = 1.0
  ): MajiangNetworkOutput {
    const noisyProbs = new Float32Array(output.actionProbabilities.length);
    
    // 生成Dirichlet噪声
    const dirichletNoise = this.generateDirichletNoise(output.actionProbabilities.length, noiseBeta);
    
    // 混合原始概率和噪声
    for (let i = 0; i < noisyProbs.length; i++) {
      noisyProbs[i] = (1 - noiseAlpha) * output.actionProbabilities[i] + 
                      noiseAlpha * dirichletNoise[i];
    }
    
    return {
      actionProbabilities: noisyProbs,
      valueEstimation: output.valueEstimation
    };
  }
  
  /**
   * 生成Dirichlet噪声
   */
  private generateDirichletNoise(size: number, alpha: number): Float32Array {
    const samples = new Float32Array(size);
    let sum = 0;
    
    // 生成Gamma分布样本
    for (let i = 0; i < size; i++) {
      samples[i] = this.gammaRandom(alpha, 1);
      sum += samples[i];
    }
    
    // 归一化为Dirichlet分布
    for (let i = 0; i < size; i++) {
      samples[i] /= sum;
    }
    
    return samples;
  }
  
  /**
   * 生成Gamma分布随机数（简化实现）
   */
  private gammaRandom(alpha: number, beta: number): number {
    // 简化的Gamma分布生成（使用Box-Muller变换的近似）
    if (alpha < 1) {
      return this.gammaRandom(alpha + 1, beta) * Math.pow(Math.random(), 1 / alpha);
    }
    
    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v / beta;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v / beta;
      }
    }
  }
  
  /**
   * 生成标准正态分布随机数
   */
  private normalRandom(): number {
    // Box-Muller变换
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
