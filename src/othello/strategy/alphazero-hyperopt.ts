// {{ AURA-X: Add - AlphaZero智能超参数优化系统. Approval: 寸止(ID:按计划执行). }}

/**
 * AlphaZero智能超参数优化系统
 * 
 * 基于贝叶斯优化实现自动超参数调优：
 * - 参数空间定义和约束
 * - 高斯过程回归建模
 * - 采集函数优化
 * - 自动训练和评估
 */

import {
  AlphaZeroOthelloAgent,
  AlphaZeroAgentConfig
} from './alphazero-agent';
import { AlphaZeroNetworkConfig } from './alphazero-network';
import { MCTSConfig } from './alphazero-mcts';
import { AlphaZeroTrainer, AlphaZeroTrainingConfig } from './alphazero-trainer';
import { AlphaZeroBenchmark } from './alphazero-benchmark';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 参数类型枚举
 */
export enum ParameterType {
  CONTINUOUS = 'continuous',    // 连续参数
  INTEGER = 'integer',         // 整数参数
  CATEGORICAL = 'categorical', // 分类参数
  LOG_UNIFORM = 'log_uniform'  // 对数均匀分布
}

/**
 * 参数定义接口
 */
export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  min?: number;
  max?: number;
  values?: any[];
  default: any;
  description: string;
  importance: number; // 1-10，参数重要性评分
}

/**
 * 优化配置接口
 */
export interface OptimizationConfig {
  /** 最大优化轮数 */
  maxIterations: number;
  /** 初始随机采样数 */
  initialSamples: number;
  /** 采集函数类型 */
  acquisitionFunction: 'EI' | 'PI' | 'UCB';
  /** 优化目标 */
  objective: 'maximize' | 'minimize';
  /** 早停轮数 */
  earlyStoppingRounds: number;
  /** 并行评估数 */
  parallelEvaluations: number;
  /** 结果保存路径 */
  savePath: string;
}

/**
 * 参数样本接口
 */
export interface ParameterSample {
  id: string;
  parameters: { [key: string]: any };
  score: number;
  evaluationTime: number;
  timestamp: Date;
  metadata?: any;
}

/**
 * AlphaZero参数空间定义器
 */
export class AlphaZeroParameterSpace {
  private parameters: Map<string, ParameterDefinition> = new Map();

  constructor() {
    this.initializeParameterSpace();
  }

  /**
   * 初始化参数空间
   */
  private initializeParameterSpace(): void {
    // 网络架构参数
    this.addParameter({
      name: 'learningRate',
      type: ParameterType.LOG_UNIFORM,
      min: 1e-5,
      max: 1e-2,
      default: 0.001,
      description: '神经网络学习率',
      importance: 9
    });

    this.addParameter({
      name: 'numResidualBlocks',
      type: ParameterType.INTEGER,
      min: 2,
      max: 6,
      default: 4,
      description: '残差块数量',
      importance: 8
    });

    this.addParameter({
      name: 'numFilters',
      type: ParameterType.CATEGORICAL,
      values: [32, 64, 128],
      default: 64,
      description: '卷积滤波器数量',
      importance: 7
    });

    this.addParameter({
      name: 'l2Regularization',
      type: ParameterType.LOG_UNIFORM,
      min: 1e-6,
      max: 1e-2,
      default: 1e-4,
      description: 'L2正则化系数',
      importance: 6
    });

    this.addParameter({
      name: 'batchSize',
      type: ParameterType.CATEGORICAL,
      values: [16, 32, 64, 128],
      default: 32,
      description: '训练批量大小',
      importance: 5
    });

    // MCTS搜索参数
    this.addParameter({
      name: 'numSimulations',
      type: ParameterType.INTEGER,
      min: 25,
      max: 200,
      default: 100,
      description: 'MCTS模拟次数',
      importance: 10
    });

    this.addParameter({
      name: 'cPuct',
      type: ParameterType.CONTINUOUS,
      min: 0.5,
      max: 2.0,
      default: 1.0,
      description: 'MCTS探索参数',
      importance: 8
    });

    this.addParameter({
      name: 'dirichletAlpha',
      type: ParameterType.CONTINUOUS,
      min: 0.1,
      max: 1.0,
      default: 0.3,
      description: '狄利克雷噪声参数',
      importance: 4
    });

    this.addParameter({
      name: 'noiseWeight',
      type: ParameterType.CONTINUOUS,
      min: 0.1,
      max: 0.5,
      default: 0.25,
      description: '噪声权重',
      importance: 3
    });

    this.addParameter({
      name: 'trainingTemperature',
      type: ParameterType.CONTINUOUS,
      min: 0.5,
      max: 2.0,
      default: 1.0,
      description: '训练温度参数',
      importance: 6
    });

    this.addParameter({
      name: 'inferenceTemperature',
      type: ParameterType.CONTINUOUS,
      min: 0.01,
      max: 0.5,
      default: 0.1,
      description: '推理温度参数',
      importance: 7
    });

    // 训练策略参数
    this.addParameter({
      name: 'selfPlayGames',
      type: ParameterType.INTEGER,
      min: 3,
      max: 15,
      default: 8,
      description: '每轮自我对弈局数',
      importance: 8
    });

    this.addParameter({
      name: 'trainingEpochs',
      type: ParameterType.INTEGER,
      min: 2,
      max: 8,
      default: 4,
      description: '每轮训练轮数',
      importance: 7
    });

    this.addParameter({
      name: 'experienceBufferSize',
      type: ParameterType.INTEGER,
      min: 500,
      max: 5000,
      default: 2000,
      description: '经验缓冲区大小',
      importance: 5
    });

    console.log(`🎯 参数空间已初始化，包含 ${this.parameters.size} 个参数`);
  }

  /**
   * 添加参数定义
   */
  addParameter(param: ParameterDefinition): void {
    this.parameters.set(param.name, param);
  }

  /**
   * 获取参数定义
   */
  getParameter(name: string): ParameterDefinition | undefined {
    return this.parameters.get(name);
  }

  /**
   * 获取所有参数
   */
  getAllParameters(): ParameterDefinition[] {
    return Array.from(this.parameters.values());
  }

  /**
   * 生成随机参数样本
   */
  generateRandomSample(): { [key: string]: any } {
    const sample: { [key: string]: any } = {};

    for (const param of this.parameters.values()) {
      sample[param.name] = this.sampleParameter(param);
    }

    return sample;
  }

  /**
   * 采样单个参数
   */
  private sampleParameter(param: ParameterDefinition): any {
    switch (param.type) {
      case ParameterType.CONTINUOUS:
        return Math.random() * (param.max! - param.min!) + param.min!;
      
      case ParameterType.INTEGER:
        return Math.floor(Math.random() * (param.max! - param.min! + 1)) + param.min!;
      
      case ParameterType.CATEGORICAL:
        return param.values![Math.floor(Math.random() * param.values!.length)];
      
      case ParameterType.LOG_UNIFORM:
        const logMin = Math.log(param.min!);
        const logMax = Math.log(param.max!);
        return Math.exp(Math.random() * (logMax - logMin) + logMin);
      
      default:
        return param.default;
    }
  }

  /**
   * 验证参数样本
   */
  validateSample(sample: { [key: string]: any }): boolean {
    for (const [name, param] of this.parameters) {
      const value = sample[name];
      
      if (value === undefined) {
        console.warn(`⚠️ 参数 ${name} 缺失`);
        return false;
      }

      if (!this.validateParameterValue(param, value)) {
        console.warn(`⚠️ 参数 ${name} 值 ${value} 无效`);
        return false;
      }
    }

    return true;
  }

  /**
   * 验证单个参数值
   */
  private validateParameterValue(param: ParameterDefinition, value: any): boolean {
    switch (param.type) {
      case ParameterType.CONTINUOUS:
      case ParameterType.LOG_UNIFORM:
        return typeof value === 'number' && value >= param.min! && value <= param.max!;
      
      case ParameterType.INTEGER:
        return Number.isInteger(value) && value >= param.min! && value <= param.max!;
      
      case ParameterType.CATEGORICAL:
        return param.values!.includes(value);
      
      default:
        return true;
    }
  }

  /**
   * 获取参数重要性排序
   */
  getParametersByImportance(): ParameterDefinition[] {
    return Array.from(this.parameters.values())
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * 将参数样本转换为AlphaZero配置
   */
  sampleToConfig(sample: { [key: string]: any }): {
    networkConfig: AlphaZeroNetworkConfig;
    mctsConfig: MCTSConfig;
    agentConfig: Partial<AlphaZeroAgentConfig>;
    trainingConfig: Partial<AlphaZeroTrainingConfig>;
  } {
    const networkConfig: AlphaZeroNetworkConfig = {
      learningRate: sample.learningRate,
      numResidualBlocks: sample.numResidualBlocks,
      numFilters: sample.numFilters,
      l2Regularization: sample.l2Regularization,
      momentum: 0.9, // 固定值
      batchSize: sample.batchSize
    };

    const mctsConfig: MCTSConfig = {
      numSimulations: sample.numSimulations,
      cPuct: sample.cPuct,
      dirichletAlpha: sample.dirichletAlpha,
      noiseWeight: sample.noiseWeight,
      temperature: sample.trainingTemperature
    };

    const agentConfig = {
      networkConfig,
      mctsConfig,
      name: `AlphaZero-Optimized-${Date.now()}`,
      isTraining: true,
      trainingTemperature: sample.trainingTemperature,
      inferenceTemperature: sample.inferenceTemperature,
      verbose: false
    };

    const trainingConfig = {
      selfPlayGames: sample.selfPlayGames,
      trainingEpochs: sample.trainingEpochs,
      experienceBufferSize: sample.experienceBufferSize,
      totalIterations: 5, // 超快速评估：仅5轮
      evaluationFrequency: 3,
      evaluationGames: 5,
      saveFrequency: 5,
      modelSavePath: `src/othello/models/alphazero-hyperopt-${Date.now()}`,
      maxGameSteps: 60,
      verbose: false
    };

    return { networkConfig, mctsConfig, agentConfig, trainingConfig };
  }

  /**
   * 打印参数空间摘要
   */
  printSummary(): void {
    console.log('\n📊 AlphaZero参数空间摘要:');
    console.log('='.repeat(50));

    const paramsByImportance = this.getParametersByImportance();

    for (const param of paramsByImportance) {
      const range = param.type === ParameterType.CATEGORICAL
        ? `[${param.values!.join(', ')}]`
        : `[${param.min} - ${param.max}]`;

      console.log(`🎯 ${param.name.padEnd(20)} | 重要性:${param.importance}/10 | ${range}`);
      console.log(`   ${param.description}`);
    }

    console.log('='.repeat(50));
  }
}

/**
 * 高斯过程回归类
 * 用于建模参数-性能关系
 */
export class GaussianProcess {
  private samples: ParameterSample[] = [];
  private kernel: (x1: number[], x2: number[]) => number;
  private noiseVariance: number = 1e-6;

  constructor(noiseVariance: number = 1e-6) {
    this.noiseVariance = noiseVariance;
    // 使用RBF核函数
    this.kernel = (x1: number[], x2: number[]) => {
      const lengthScale = 1.0;
      const variance = 1.0;
      const squaredDistance = x1.reduce((sum, val, i) => sum + Math.pow(val - x2[i], 2), 0);
      return variance * Math.exp(-squaredDistance / (2 * lengthScale * lengthScale));
    };
  }

  /**
   * 添加观测样本
   */
  addSample(sample: ParameterSample): void {
    this.samples.push(sample);
  }

  /**
   * 预测给定参数的性能分布
   */
  predict(parameters: { [key: string]: any }): { mean: number; variance: number } {
    if (this.samples.length === 0) {
      return { mean: 0, variance: 1 };
    }

    const x = this.parametersToVector(parameters);
    const X = this.samples.map(s => this.parametersToVector(s.parameters));
    const y = this.samples.map(s => s.score);

    // 计算核矩阵
    const K = this.computeKernelMatrix(X);
    const k = X.map(xi => this.kernel(x, xi));

    // 添加噪声项
    for (let i = 0; i < K.length; i++) {
      K[i][i] += this.noiseVariance;
    }

    // 计算预测均值和方差
    const KInv = this.invertMatrix(K);
    const KInvY = this.matrixVectorProduct(KInv, y);
    const mean = this.vectorMatrixProduct(k, KInvY);
    const kStar = this.kernel(x, x);
    const KInvK = this.matrixVectorProduct(KInv, k);
    const variance = kStar - this.vectorMatrixProduct(k, KInvK);

    return { mean, variance: Math.max(variance, 1e-8) };
  }

  /**
   * 将参数对象转换为数值向量
   */
  private parametersToVector(parameters: { [key: string]: any }): number[] {
    const keys = Object.keys(parameters).sort();
    return keys.map(key => {
      const value = parameters[key];
      return typeof value === 'number' ? value : this.categoricalToNumber(value);
    });
  }

  /**
   * 分类值转数值
   */
  private categoricalToNumber(value: any): number {
    if (typeof value === 'string') {
      return value.charCodeAt(0);
    }
    return Number(value) || 0;
  }

  /**
   * 计算核矩阵
   */
  private computeKernelMatrix(X: number[][]): number[][] {
    const n = X.length;
    const K = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        K[i][j] = this.kernel(X[i], X[j]);
      }
    }

    return K;
  }

  /**
   * 矩阵求逆（简化版，仅用于小矩阵）
   */
  private invertMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const identity = Array(n).fill(null).map((_, i) =>
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );

    // 高斯-约旦消元法
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    for (let i = 0; i < n; i++) {
      // 找到主元
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // 交换行
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // 归一化主元行
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        // 添加小的正则化项
        augmented[i][i] += 1e-6;
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= augmented[i][i];
      }

      // 消元
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // 提取逆矩阵
    return augmented.map(row => row.slice(n));
  }

  /**
   * 矩阵向量乘法
   */
  private matrixVectorProduct(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row =>
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  /**
   * 向量矩阵乘法
   */
  private vectorMatrixProduct(vector: number[], matrixResult: number[]): number {
    return vector.reduce((sum, val, i) => sum + val * matrixResult[i], 0);
  }
}

/**
 * 采集函数类
 * 用于选择下一个要评估的参数组合
 */
export class AcquisitionFunction {
  private gp: GaussianProcess;
  private bestScore: number = -Infinity;
  private acquisitionType: 'EI' | 'PI' | 'UCB';

  constructor(gp: GaussianProcess, acquisitionType: 'EI' | 'PI' | 'UCB' = 'EI') {
    this.gp = gp;
    this.acquisitionType = acquisitionType;
  }

  /**
   * 更新最佳分数
   */
  updateBestScore(score: number): void {
    this.bestScore = Math.max(this.bestScore, score);
  }

  /**
   * 计算采集函数值
   */
  evaluate(parameters: { [key: string]: any }): number {
    const prediction = this.gp.predict(parameters);
    const mean = prediction.mean;
    const std = Math.sqrt(prediction.variance);

    switch (this.acquisitionType) {
      case 'EI':
        return this.expectedImprovement(mean, std);
      case 'PI':
        return this.probabilityOfImprovement(mean, std);
      case 'UCB':
        return this.upperConfidenceBound(mean, std);
      default:
        return this.expectedImprovement(mean, std);
    }
  }

  /**
   * 期望改进 (Expected Improvement)
   */
  private expectedImprovement(mean: number, std: number, xi: number = 0.01): number {
    if (std === 0) return 0;

    const improvement = mean - this.bestScore - xi;
    const z = improvement / std;

    return improvement * this.normalCDF(z) + std * this.normalPDF(z);
  }

  /**
   * 改进概率 (Probability of Improvement)
   */
  private probabilityOfImprovement(mean: number, std: number, xi: number = 0.01): number {
    if (std === 0) return 0;

    const improvement = mean - this.bestScore - xi;
    const z = improvement / std;

    return this.normalCDF(z);
  }

  /**
   * 上置信界 (Upper Confidence Bound)
   */
  private upperConfidenceBound(mean: number, std: number, kappa: number = 2.576): number {
    return mean + kappa * std;
  }

  /**
   * 标准正态分布CDF
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * 标准正态分布PDF
   */
  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * 误差函数近似
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * 性能评估器类
 * 负责训练和评估AlphaZero配置
 */
export class AlphaZeroPerformanceEvaluator {
  private parameterSpace: AlphaZeroParameterSpace;
  private evaluationCache: Map<string, number> = new Map();

  constructor(parameterSpace: AlphaZeroParameterSpace) {
    this.parameterSpace = parameterSpace;
  }

  /**
   * 评估参数配置的性能
   */
  async evaluateConfiguration(parameters: { [key: string]: any }): Promise<number> {
    const configHash = this.hashParameters(parameters);

    // 检查缓存
    if (this.evaluationCache.has(configHash)) {
      console.log('📋 使用缓存结果');
      return this.evaluationCache.get(configHash)!;
    }

    console.log('🔄 开始评估配置...');
    const startTime = Date.now();

    try {
      // 转换为AlphaZero配置
      const config = this.parameterSpace.sampleToConfig(parameters);

      // 创建训练器
      const trainer = new AlphaZeroTrainer(
        config.agentConfig as AlphaZeroAgentConfig,
        config.trainingConfig as AlphaZeroTrainingConfig
      );

      // 执行快速训练
      console.log('🏋️ 执行快速训练...');
      await trainer.startTraining();

      // 使用基准测试评估性能
      const benchmark = new AlphaZeroBenchmark();
      const results = await benchmark.runFullBenchmark();

      // 计算综合分数（使用第一个结果作为示例）
      const score = results.length > 0 ? this.calculateCompositeScore(results[0]) : 0;

      // 缓存结果
      this.evaluationCache.set(configHash, score);

      const evaluationTime = (Date.now() - startTime) / 1000;
      console.log(`✅ 评估完成，分数: ${score.toFixed(3)}, 用时: ${evaluationTime.toFixed(1)}s`);

      return score;
    } catch (error) {
      console.error('❌ 评估失败:', error);
      return 0; // 失败配置返回最低分
    }
  }

  /**
   * 计算综合性能分数
   */
  private calculateCompositeScore(results: any): number {
    // 基于多个指标计算综合分数
    const weights = {
      winRateVsRandom: 0.2,
      winRateVsGreedy: 0.3,
      winRateVsHeuristic: 0.3,
      searchEfficiency: 0.1,
      trainingStability: 0.1
    };

    let score = 0;

    // 对战胜率分数
    if (results.winRateVsRandom !== undefined) {
      score += weights.winRateVsRandom * (results.winRateVsRandom / 100);
    }

    if (results.winRateVsGreedy !== undefined) {
      score += weights.winRateVsGreedy * (results.winRateVsGreedy / 100);
    }

    if (results.winRateVsHeuristic !== undefined) {
      score += weights.winRateVsHeuristic * (results.winRateVsHeuristic / 100);
    }

    // 搜索效率分数（基于平均搜索时间）
    if (results.avgSearchTime !== undefined) {
      const efficiencyScore = Math.max(0, 1 - results.avgSearchTime / 5000); // 5秒为基准
      score += weights.searchEfficiency * efficiencyScore;
    }

    // 训练稳定性分数（基于损失收敛）
    if (results.trainingLoss !== undefined) {
      const stabilityScore = Math.max(0, 1 - results.trainingLoss);
      score += weights.trainingStability * stabilityScore;
    }

    return Math.max(0, Math.min(1, score)); // 限制在[0,1]范围内
  }

  /**
   * 生成参数配置的哈希值
   */
  private hashParameters(parameters: { [key: string]: any }): string {
    const sortedKeys = Object.keys(parameters).sort();
    const hashString = sortedKeys.map(key => `${key}:${parameters[key]}`).join('|');

    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }

    return hash.toString();
  }

  /**
   * 清空评估缓存
   */
  clearCache(): void {
    this.evaluationCache.clear();
    console.log('🗑️ 评估缓存已清空');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.evaluationCache.size,
      hitRate: 0 // 简化实现，实际应该跟踪命中率
    };
  }
}

/**
 * 贝叶斯优化器主类
 */
export class BayesianOptimizer {
  private parameterSpace: AlphaZeroParameterSpace;
  private evaluator: AlphaZeroPerformanceEvaluator;
  private gp: GaussianProcess;
  private acquisitionFunction: AcquisitionFunction;
  private config: OptimizationConfig;
  private samples: ParameterSample[] = [];
  private bestSample: ParameterSample | null = null;
  private iteration: number = 0;

  constructor(
    parameterSpace: AlphaZeroParameterSpace,
    evaluator: AlphaZeroPerformanceEvaluator,
    config: OptimizationConfig
  ) {
    this.parameterSpace = parameterSpace;
    this.evaluator = evaluator;
    this.config = config;
    this.gp = new GaussianProcess();
    this.acquisitionFunction = new AcquisitionFunction(this.gp, config.acquisitionFunction);
  }

  /**
   * 执行贝叶斯优化
   */
  async optimize(): Promise<ParameterSample> {
    console.log('🚀 开始贝叶斯优化...');
    console.log(`📊 配置: ${this.config.maxIterations}轮, ${this.config.initialSamples}初始样本`);

    // 初始随机采样阶段
    await this.initialSampling();

    // 贝叶斯优化主循环
    for (this.iteration = this.config.initialSamples; this.iteration < this.config.maxIterations; this.iteration++) {
      console.log(`\n🔄 优化轮次 ${this.iteration + 1}/${this.config.maxIterations}`);

      // 选择下一个要评估的参数
      const nextParameters = await this.selectNextParameters();

      // 评估参数
      const score = await this.evaluator.evaluateConfiguration(nextParameters);

      // 记录样本
      const sample: ParameterSample = {
        id: `sample_${this.iteration}`,
        parameters: nextParameters,
        score,
        evaluationTime: 0, // 简化实现
        timestamp: new Date()
      };

      this.addSample(sample);

      // 检查早停条件
      if (this.shouldEarlyStop()) {
        console.log('⏹️ 满足早停条件，优化结束');
        break;
      }

      // 保存中间结果
      if (this.iteration % 5 === 0) {
        await this.saveProgress();
      }
    }

    // 保存最终结果
    await this.saveFinalResults();

    console.log(`✅ 优化完成! 最佳分数: ${this.bestSample?.score.toFixed(4)}`);
    return this.bestSample!;
  }

  /**
   * 初始随机采样
   */
  private async initialSampling(): Promise<void> {
    console.log('🎲 执行初始随机采样...');

    for (let i = 0; i < this.config.initialSamples; i++) {
      console.log(`📊 初始样本 ${i + 1}/${this.config.initialSamples}`);

      const parameters = this.parameterSpace.generateRandomSample();
      const score = await this.evaluator.evaluateConfiguration(parameters);

      const sample: ParameterSample = {
        id: `initial_${i}`,
        parameters,
        score,
        evaluationTime: 0,
        timestamp: new Date()
      };

      this.addSample(sample);
    }

    console.log(`✅ 初始采样完成，最佳分数: ${this.bestSample?.score.toFixed(4)}`);
  }

  /**
   * 选择下一个要评估的参数
   */
  private async selectNextParameters(): Promise<{ [key: string]: any }> {
    const numCandidates = 1000; // 候选参数数量
    let bestParameters = null;
    let bestAcquisitionValue = -Infinity;

    // 生成候选参数并评估采集函数
    for (let i = 0; i < numCandidates; i++) {
      const candidate = this.parameterSpace.generateRandomSample();
      const acquisitionValue = this.acquisitionFunction.evaluate(candidate);

      if (acquisitionValue > bestAcquisitionValue) {
        bestAcquisitionValue = acquisitionValue;
        bestParameters = candidate;
      }
    }

    console.log(`🎯 选择参数，采集函数值: ${bestAcquisitionValue.toFixed(4)}`);
    return bestParameters!;
  }

  /**
   * 添加样本
   */
  private addSample(sample: ParameterSample): void {
    this.samples.push(sample);
    this.gp.addSample(sample);

    // 更新最佳样本
    if (!this.bestSample || sample.score > this.bestSample.score) {
      this.bestSample = sample;
      this.acquisitionFunction.updateBestScore(sample.score);
      console.log(`🏆 发现新的最佳配置! 分数: ${sample.score.toFixed(4)}`);
    }
  }

  /**
   * 检查早停条件
   */
  private shouldEarlyStop(): boolean {
    if (this.samples.length < this.config.earlyStoppingRounds) {
      return false;
    }

    // 检查最近几轮是否有改进
    const recentSamples = this.samples.slice(-this.config.earlyStoppingRounds);
    const recentBest = Math.max(...recentSamples.map(s => s.score));
    const previousBest = this.bestSample?.score || 0;

    return recentBest <= previousBest + 1e-4; // 改进阈值
  }

  /**
   * 保存优化进度
   */
  private async saveProgress(): Promise<void> {
    const progress = {
      iteration: this.iteration,
      bestScore: this.bestSample?.score,
      bestParameters: this.bestSample?.parameters,
      totalSamples: this.samples.length,
      timestamp: new Date()
    };

    const progressPath = path.join(this.config.savePath, 'optimization_progress.json');
    await fs.promises.writeFile(progressPath, JSON.stringify(progress, null, 2));
  }

  /**
   * 保存最终结果
   */
  private async saveFinalResults(): Promise<void> {
    const results = {
      bestSample: this.bestSample,
      allSamples: this.samples,
      config: this.config,
      summary: {
        totalIterations: this.iteration,
        bestScore: this.bestSample?.score,
        improvementHistory: this.samples.map(s => s.score)
      }
    };

    // 确保保存目录存在
    await fs.promises.mkdir(this.config.savePath, { recursive: true });

    const resultsPath = path.join(this.config.savePath, 'optimization_results.json');
    await fs.promises.writeFile(resultsPath, JSON.stringify(results, null, 2));

    console.log(`💾 结果已保存到: ${resultsPath}`);
  }

  /**
   * 获取优化统计信息
   */
  getOptimizationStats(): any {
    return {
      totalSamples: this.samples.length,
      bestScore: this.bestSample?.score,
      averageScore: this.samples.reduce((sum, s) => sum + s.score, 0) / this.samples.length,
      scoreImprovement: this.samples.map(s => s.score),
      parameterImportance: this.analyzeParameterImportance()
    };
  }

  /**
   * 分析参数重要性
   */
  private analyzeParameterImportance(): { [key: string]: number } {
    // 简化的参数重要性分析
    const importance: { [key: string]: number } = {};
    const paramNames = Object.keys(this.samples[0]?.parameters || {});

    for (const param of paramNames) {
      // 计算参数值与分数的相关性
      const values = this.samples.map(s => s.parameters[param]);
      const scores = this.samples.map(s => s.score);
      importance[param] = this.calculateCorrelation(values, scores);
    }

    return importance;
  }

  /**
   * 计算相关系数
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

/**
 * 优化配置管理器
 * 负责管理优化任务、历史记录和配置推荐
 */
export class OptimizationManager {
  private parameterSpace: AlphaZeroParameterSpace;
  private evaluator: AlphaZeroPerformanceEvaluator;
  private optimizationHistory: any[] = [];
  private configTemplates: Map<string, OptimizationConfig> = new Map();

  constructor() {
    this.parameterSpace = new AlphaZeroParameterSpace();
    this.evaluator = new AlphaZeroPerformanceEvaluator(this.parameterSpace);
    this.initializeConfigTemplates();
  }

  /**
   * 初始化配置模板
   */
  private initializeConfigTemplates(): void {
    // 超快速测试配置
    this.configTemplates.set('quick', {
      maxIterations: 8,
      initialSamples: 3,
      acquisitionFunction: 'EI',
      objective: 'maximize',
      earlyStoppingRounds: 3,
      parallelEvaluations: 1,
      savePath: 'src/othello/optimization/quick'
    });

    // 标准优化配置
    this.configTemplates.set('standard', {
      maxIterations: 50,
      initialSamples: 10,
      acquisitionFunction: 'EI',
      objective: 'maximize',
      earlyStoppingRounds: 10,
      parallelEvaluations: 1,
      savePath: 'src/othello/optimization/standard'
    });

    // 深度优化配置
    this.configTemplates.set('deep', {
      maxIterations: 100,
      initialSamples: 20,
      acquisitionFunction: 'EI',
      objective: 'maximize',
      earlyStoppingRounds: 15,
      parallelEvaluations: 1,
      savePath: 'src/othello/optimization/deep'
    });

    // 生产级优化配置
    this.configTemplates.set('production', {
      maxIterations: 200,
      initialSamples: 30,
      acquisitionFunction: 'EI',
      objective: 'maximize',
      earlyStoppingRounds: 20,
      parallelEvaluations: 2,
      savePath: 'src/othello/optimization/production'
    });
  }

  /**
   * 运行优化任务
   */
  async runOptimization(configName: string = 'standard'): Promise<ParameterSample> {
    const config = this.configTemplates.get(configName);
    if (!config) {
      throw new Error(`未知的配置模板: ${configName}`);
    }

    console.log(`🚀 启动 ${configName} 优化任务`);

    // 创建优化器
    const optimizer = new BayesianOptimizer(this.parameterSpace, this.evaluator, config);

    // 记录开始时间
    const startTime = Date.now();

    try {
      // 执行优化
      const bestSample = await optimizer.optimize();

      // 记录优化历史
      const optimizationRecord = {
        id: `opt_${Date.now()}`,
        configName,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
        bestSample,
        stats: optimizer.getOptimizationStats()
      };

      this.optimizationHistory.push(optimizationRecord);

      // 保存历史记录
      await this.saveOptimizationHistory();

      return bestSample;
    } catch (error) {
      console.error('❌ 优化任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取推荐配置
   */
  getRecommendedConfig(requirements: {
    timeLimit?: number; // 分钟
    qualityLevel?: 'quick' | 'standard' | 'high' | 'production';
    resourceConstraint?: 'low' | 'medium' | 'high';
  }): string {
    const { timeLimit, qualityLevel, resourceConstraint } = requirements;

    // 基于时间限制推荐
    if (timeLimit) {
      if (timeLimit < 30) return 'quick';
      if (timeLimit < 120) return 'standard';
      if (timeLimit < 300) return 'deep';
      return 'production';
    }

    // 基于质量要求推荐
    if (qualityLevel) {
      const qualityMap = {
        'quick': 'quick',
        'standard': 'standard',
        'high': 'deep',
        'production': 'production'
      };
      return qualityMap[qualityLevel];
    }

    // 基于资源约束推荐
    if (resourceConstraint) {
      const resourceMap = {
        'low': 'quick',
        'medium': 'standard',
        'high': 'production'
      };
      return resourceMap[resourceConstraint];
    }

    return 'standard'; // 默认推荐
  }

  /**
   * 分析优化历史
   */
  analyzeOptimizationHistory(): any {
    if (this.optimizationHistory.length === 0) {
      return { message: '暂无优化历史记录' };
    }

    const analysis = {
      totalOptimizations: this.optimizationHistory.length,
      averageDuration: this.optimizationHistory.reduce((sum, opt) => sum + opt.duration, 0) / this.optimizationHistory.length,
      bestOverallScore: Math.max(...this.optimizationHistory.map(opt => opt.bestSample.score)),
      configPerformance: {} as any,
      parameterTrends: this.analyzeParameterTrends()
    };

    // 分析各配置的性能
    const configGroups = this.optimizationHistory.reduce((groups, opt) => {
      if (!groups[opt.configName]) {
        groups[opt.configName] = [];
      }
      groups[opt.configName].push(opt);
      return groups;
    }, {} as any);

    for (const [configName, opts] of Object.entries(configGroups)) {
      const optArray = opts as any[];
      analysis.configPerformance[configName] = {
        count: optArray.length,
        averageScore: optArray.reduce((sum, opt) => sum + opt.bestSample.score, 0) / optArray.length,
        averageDuration: optArray.reduce((sum, opt) => sum + opt.duration, 0) / optArray.length,
        bestScore: Math.max(...optArray.map(opt => opt.bestSample.score))
      };
    }

    return analysis;
  }

  /**
   * 分析参数趋势
   */
  private analyzeParameterTrends(): any {
    const allBestSamples = this.optimizationHistory.map(opt => opt.bestSample);
    if (allBestSamples.length === 0) return {};

    const parameterNames = Object.keys(allBestSamples[0].parameters);
    const trends: any = {};

    for (const paramName of parameterNames) {
      const values = allBestSamples.map(sample => sample.parameters[paramName]);
      trends[paramName] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        variance: this.calculateVariance(values)
      };
    }

    return trends;
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * 保存优化历史
   */
  private async saveOptimizationHistory(): Promise<void> {
    const historyPath = 'src/othello/optimization/history.json';

    // 确保目录存在
    await fs.promises.mkdir(path.dirname(historyPath), { recursive: true });

    await fs.promises.writeFile(historyPath, JSON.stringify(this.optimizationHistory, null, 2));
  }

  /**
   * 加载优化历史
   */
  async loadOptimizationHistory(): Promise<void> {
    const historyPath = 'src/othello/optimization/history.json';

    try {
      const historyData = await fs.promises.readFile(historyPath, 'utf-8');
      this.optimizationHistory = JSON.parse(historyData);
      console.log(`📚 已加载 ${this.optimizationHistory.length} 条优化历史记录`);
    } catch (error) {
      console.log('📝 未找到历史记录文件，将创建新的记录');
      this.optimizationHistory = [];
    }
  }

  /**
   * 导出最佳配置
   */
  exportBestConfiguration(): any {
    if (this.optimizationHistory.length === 0) {
      throw new Error('没有可用的优化历史记录');
    }

    const bestOptimization = this.optimizationHistory.reduce((best, current) =>
      current.bestSample.score > best.bestSample.score ? current : best
    );

    const bestConfig = this.parameterSpace.sampleToConfig(bestOptimization.bestSample.parameters);

    return {
      metadata: {
        score: bestOptimization.bestSample.score,
        optimizationId: bestOptimization.id,
        timestamp: bestOptimization.endTime,
        configTemplate: bestOptimization.configName
      },
      configuration: bestConfig,
      parameters: bestOptimization.bestSample.parameters
    };
  }

  /**
   * 清理旧的优化记录
   */
  async cleanupOldRecords(maxAge: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

    const initialCount = this.optimizationHistory.length;
    this.optimizationHistory = this.optimizationHistory.filter(
      opt => new Date(opt.endTime) > cutoffDate
    );

    const removedCount = initialCount - this.optimizationHistory.length;
    if (removedCount > 0) {
      await this.saveOptimizationHistory();
      console.log(`🗑️ 已清理 ${removedCount} 条过期记录`);
    }
  }

  /**
   * 获取参数空间摘要
   */
  getParameterSpaceSummary(): void {
    this.parameterSpace.printSummary();
  }

  /**
   * 获取可用配置模板
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.configTemplates.keys());
  }

  /**
   * 获取配置模板详情
   */
  getTemplateDetails(templateName: string): OptimizationConfig | undefined {
    return this.configTemplates.get(templateName);
  }
}

/**
 * 导出的超参数优化运行函数
 */
export async function runHyperoptimization(): Promise<void> {
  console.log('🎯 启动AlphaZero超参数优化...');

  const optimizer = new AlphaZeroHyperoptimizer();

  const config: OptimizationConfig = {
    maxEvaluations: 10,
    maxTime: 2 * 60 * 60 * 1000, // 2小时
    acquisitionFunction: 'EI',
    explorationWeight: 0.1,
    randomSeed: Date.now(),
    parallelEvaluations: 1,
    verbose: true,
    saveResults: true,
    resultPath: './hyperopt-results'
  };

  try {
    const result = await optimizer.optimize(config);
    console.log('✅ 超参数优化完成！');
    console.log('🏆 最佳配置:', result.bestConfig);
    console.log('📊 最佳性能:', result.bestScore);
  } catch (error) {
    console.error('❌ 超参数优化失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runHyperoptimization().catch(console.error);
}
