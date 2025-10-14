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

export interface TrainingLoss {
  totalLoss: number;
  policyLoss: number;
  valueLoss: number;
}

export class MajiangAlphaZeroNetworkTF {
  private config: MajiangNetworkConfig;
  private model!: tf.LayersModel;
  private optimizer!: tf.Optimizer;
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
  
  /**
   * 初始化TensorFlow.js神经网络模型
   */
  private initializeNetwork(): void {
    const input = tf.input({ shape: [this.config.inputDim] });
    let x = input;
    
    // 构建隐藏层
    for (let i = 0; i < this.config.hiddenLayers.length; i++) {
      x = tf.layers.dense({
        units: this.config.hiddenLayers[i],
        activation: this.config.activationFunction,
        kernelInitializer: 'glorotUniform',
        kernelRegularizer: tf.regularizers.l2({ l2: this.config.l2Regularization }),
        name: `hidden_${i}`
      }).apply(x) as tf.SymbolicTensor;
      
      // 添加Dropout层（仅在训练时生效）
      if (this.config.dropoutRate > 0) {
        x = tf.layers.dropout({ 
          rate: this.config.dropoutRate,
          name: `dropout_${i}`
        }).apply(x) as tf.SymbolicTensor;
      }
    }
    
    // 动作概率输出头
    const actionOutput = tf.layers.dense({
      units: this.config.outputDim,
      activation: 'softmax',
      kernelInitializer: 'glorotUniform',
      name: 'action_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // 价值评估输出头
    const valueOutput = tf.layers.dense({
      units: 1,
      activation: 'tanh',
      kernelInitializer: 'glorotUniform',
      name: 'value_output'
    }).apply(x) as tf.SymbolicTensor;
    
    // 创建模型
    this.model = tf.model({
      inputs: input,
      outputs: [actionOutput, valueOutput],
      name: 'MajiangAlphaZeroNetwork'
    });
  }
  
  /**
   * 初始化优化器
   */
  private initializeOptimizer(): void {
    this.optimizer = tf.train.adam(this.config.learningRate);
  }
  
  /**
   * 前向传播
   */
  public async forward(stateVector: MajiangStateVector): Promise<MajiangNetworkOutput> {
    return tf.tidy(() => {
      // 将状态向量转换为一维数组
      const stateArray = this.stateVectorToArray(stateVector);
      const inputTensor = tf.tensor2d([stateArray], [1, this.config.inputDim]);
      
      // 模型预测
      const predictions = this.model.predict(inputTensor) as tf.Tensor[];
      const actionProbs = predictions[0] as tf.Tensor2D;
      const valueEst = predictions[1] as tf.Tensor2D;
      
      // 提取结果
      const actionProbsArray = actionProbs.dataSync() as Float32Array;
      const valueEstimation = valueEst.dataSync()[0];
      
      return {
        actionProbabilities: actionProbsArray,
        valueEstimation
      };
    });
  }
  
  /**
   * 批量前向传播
   */
  public async forwardBatch(stateBatch: tf.Tensor2D): Promise<{ actionProbs: tf.Tensor2D, values: tf.Tensor2D }> {
    const predictions = this.model.predict(stateBatch) as tf.Tensor[];
    return {
      actionProbs: predictions[0] as tf.Tensor2D,
      values: predictions[1] as tf.Tensor2D
    };
  }
  
  /**
   * 训练一个批次
   */
  public async trainBatch(batch: TrainingBatch): Promise<TrainingLoss> {
    const { states, actionProbs: targetActionProbs, values: targetValues } = batch;

    // 计算损失和梯度
    const f = () => {
      const predictions = this.model.predict(states) as tf.Tensor[];
      const predActionProbs = predictions[0] as tf.Tensor2D;
      const predValues = predictions[1] as tf.Tensor2D;

      // 策略损失：交叉熵
      const policyLoss = tf.losses.softmaxCrossEntropy(targetActionProbs, predActionProbs);

      // 价值损失：均方误差
      const valueLoss = tf.losses.meanSquaredError(
        targetValues.reshape([-1, 1]),
        predValues
      );

      // 总损失 - 确保返回标量
      const totalLoss = tf.add(policyLoss, valueLoss);
      return tf.mean(totalLoss) as tf.Scalar;
    };

    // 计算梯度并更新权重
    const { value: totalLoss, grads } = tf.variableGrads(f);
    this.optimizer.applyGradients(grads);

    // 单独计算各项损失用于统计
    const predictions = this.model.predict(states) as tf.Tensor[];
    const predActionProbs = predictions[0] as tf.Tensor2D;
    const predValues = predictions[1] as tf.Tensor2D;

    const policyLoss = tf.losses.softmaxCrossEntropy(targetActionProbs, predActionProbs);
    const valueLoss = tf.losses.meanSquaredError(targetValues.reshape([-1, 1]), predValues);

    // 提取损失值
    const totalLossValue = totalLoss.dataSync()[0];
    const policyLossValue = policyLoss.dataSync()[0];
    const valueLossValue = valueLoss.dataSync()[0];

    // 清理临时张量
    totalLoss.dispose();
    policyLoss.dispose();
    valueLoss.dispose();

    return {
      totalLoss: totalLossValue,
      policyLoss: policyLossValue,
      valueLoss: valueLossValue
    };
  }
  
  /**
   * 设置训练模式
   */
  public setTraining(training: boolean): void {
    this.isTraining = training;
  }
  
  /**
   * 保存模型
   */
  public async saveModel(path: string): Promise<void> {
    await this.model.save(`file://${path}`);
  }
  
  /**
   * 加载模型
   */
  public async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
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
    return this.model.countParams();
  }
  
  /**
   * 将状态向量转换为数组
   */
  private stateVectorToArray(stateVector: MajiangStateVector): number[] {
    const result: number[] = [];

    // 添加手牌编码
    result.push(...Array.from(stateVector.handTiles));

    // 添加可见信息编码
    result.push(...Array.from(stateVector.visibleTiles));

    // 添加玩家状态编码
    result.push(...Array.from(stateVector.playerStates));

    // 添加游戏上下文编码
    result.push(...Array.from(stateVector.gameContext));

    return result;
  }

  /**
   * 释放内存
   */
  public dispose(): void {
    this.model.dispose();
    this.optimizer.dispose();
  }
}
