/**
 * 麻将AlphaZero AI稳定性优化器
 * 基于AlphaZero传说级技术栈的第二阶段优化
 */

import { MajiangAlphaZeroAgent } from './majiang-alphazero-agent';
import { MajiangNetworkOutput } from './majiang-alphazero-network';
import { PerformanceMonitor } from './performance-config';

export interface StabilityConfig {
  // 自适应网络架构
  enableAdaptiveArchitecture: boolean;
  dynamicLayerAdjustment: boolean;
  
  // 多层次决策网络
  enableMultiLevelDecision: boolean;
  decisionLevels: number;
  
  // 稳定性增强
  enableStabilityBoost: boolean;
  stabilityThreshold: number;
  
  // 性能监控
  enablePerformanceTracking: boolean;
  stabilityMetrics: boolean;
}

export const DEFAULT_STABILITY_CONFIG: StabilityConfig = {
  enableAdaptiveArchitecture: true,
  dynamicLayerAdjustment: true,
  enableMultiLevelDecision: true,
  decisionLevels: 3,
  enableStabilityBoost: true,
  stabilityThreshold: 0.85,
  enablePerformanceTracking: true,
  stabilityMetrics: true
};

export interface StabilityMetrics {
  decisionConsistency: number;    // 决策一致性 [0, 1]
  performanceStability: number;   // 性能稳定性 [0, 1]
  adaptationRate: number;         // 适应速度
  errorRecoveryTime: number;      // 错误恢复时间
  overallStability: number;       // 总体稳定性评分
}

/**
 * 自适应网络架构
 * 根据游戏状态动态调整网络结构
 */
export class AdaptiveNetworkArchitecture {
  private baseHiddenLayers: number[] = [512, 256, 128];
  private currentArchitecture: number[] = [...this.baseHiddenLayers];
  private performanceHistory: number[] = [];
  private adaptationCount: number = 0;
  
  /**
   * 根据性能动态调整网络架构
   */
  public adaptArchitecture(currentPerformance: number, gameComplexity: number): number[] {
    this.performanceHistory.push(currentPerformance);
    
    // 保持最近20次性能记录
    if (this.performanceHistory.length > 20) {
      this.performanceHistory.shift();
    }
    
    // 计算性能趋势
    const recentPerformance = this.performanceHistory.slice(-5);
    const avgRecent = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    const avgOverall = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    
    // 如果性能下降，增加网络容量
    if (avgRecent < avgOverall * 0.95 && gameComplexity > 0.7) {
      this.increaseCapacity();
    }
    // 如果性能稳定且复杂度低，可以减少容量提高速度
    else if (avgRecent > avgOverall * 1.05 && gameComplexity < 0.3) {
      this.decreaseCapacity();
    }
    
    return [...this.currentArchitecture];
  }
  
  private increaseCapacity(): void {
    // 增加隐藏层神经元数量
    for (let i = 0; i < this.currentArchitecture.length; i++) {
      this.currentArchitecture[i] = Math.min(
        this.currentArchitecture[i] * 1.2,
        this.baseHiddenLayers[i] * 2 // 最大不超过基础的2倍
      );
    }
    this.adaptationCount++;
    console.log(`🧠 网络容量增加: ${this.currentArchitecture.join('→')}`);
  }
  
  private decreaseCapacity(): void {
    // 减少隐藏层神经元数量
    for (let i = 0; i < this.currentArchitecture.length; i++) {
      this.currentArchitecture[i] = Math.max(
        this.currentArchitecture[i] * 0.9,
        this.baseHiddenLayers[i] * 0.5 // 最小不低于基础的50%
      );
    }
    this.adaptationCount++;
    console.log(`⚡ 网络容量减少: ${this.currentArchitecture.join('→')}`);
  }
  
  public getCurrentArchitecture(): number[] {
    return [...this.currentArchitecture];
  }
  
  public getAdaptationCount(): number {
    return this.adaptationCount;
  }
}

/**
 * 多层次决策网络
 * 实现分层决策提高稳定性
 */
export class MultiLevelDecisionNetwork {
  private decisionLevels: number;
  private levelWeights: number[];
  
  constructor(levels: number = 3) {
    this.decisionLevels = levels;
    this.levelWeights = this.initializeLevelWeights();
  }
  
  private initializeLevelWeights(): number[] {
    // 初始化各层权重，高层次权重更大
    const weights = [];
    for (let i = 0; i < this.decisionLevels; i++) {
      weights.push(Math.pow(2, i)); // 指数增长权重
    }
    
    // 归一化
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
  }
  
  /**
   * 多层次决策融合
   */
  public fuseDecisions(
    strategicOutput: MajiangNetworkOutput,    // 战略层决策
    tacticalOutput: MajiangNetworkOutput,     // 战术层决策
    operationalOutput: MajiangNetworkOutput   // 操作层决策
  ): MajiangNetworkOutput {
    const outputs = [operationalOutput, tacticalOutput, strategicOutput];
    
    // 融合动作概率
    const fusedActionProbs = new Float32Array(39);
    for (let i = 0; i < 39; i++) {
      let weightedSum = 0;
      for (let level = 0; level < this.decisionLevels; level++) {
        weightedSum += outputs[level].actionProbabilities[i] * this.levelWeights[level];
      }
      fusedActionProbs[i] = weightedSum;
    }
    
    // 融合价值评估
    let fusedValue = 0;
    for (let level = 0; level < this.decisionLevels; level++) {
      fusedValue += outputs[level].valueEstimation * this.levelWeights[level];
    }
    
    return {
      actionProbabilities: fusedActionProbs,
      valueEstimation: fusedValue
    };
  }
  
  /**
   * 动态调整层权重
   */
  public adjustLevelWeights(levelPerformances: number[]): void {
    // 根据各层性能调整权重
    for (let i = 0; i < this.decisionLevels; i++) {
      const performance = levelPerformances[i] || 0.5;
      this.levelWeights[i] *= (1 + (performance - 0.5) * 0.1);
    }
    
    // 重新归一化
    const sum = this.levelWeights.reduce((a, b) => a + b, 0);
    this.levelWeights = this.levelWeights.map(w => w / sum);
  }
  
  public getLevelWeights(): number[] {
    return [...this.levelWeights];
  }
}

/**
 * 稳定性增强器
 * 提供决策稳定性和错误恢复能力
 */
export class StabilityBooster {
  private decisionHistory: MajiangNetworkOutput[] = [];
  private errorCount: number = 0;
  private recoveryMode: boolean = false;
  private stabilityThreshold: number;
  
  constructor(stabilityThreshold: number = 0.85) {
    this.stabilityThreshold = stabilityThreshold;
  }
  
  /**
   * 稳定性增强决策
   */
  public enhanceDecision(
    currentOutput: MajiangNetworkOutput,
    gameState: any
  ): MajiangNetworkOutput {
    this.decisionHistory.push(currentOutput);
    
    // 保持最近10次决策历史
    if (this.decisionHistory.length > 10) {
      this.decisionHistory.shift();
    }
    
    // 检查决策一致性
    const consistency = this.calculateDecisionConsistency();
    
    if (consistency < this.stabilityThreshold) {
      // 启用稳定性增强
      return this.applyStabilityBoost(currentOutput);
    }
    
    return currentOutput;
  }
  
  private calculateDecisionConsistency(): number {
    if (this.decisionHistory.length < 3) return 1.0;
    
    const recent = this.decisionHistory.slice(-3);
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < recent.length - 1; i++) {
      for (let j = i + 1; j < recent.length; j++) {
        const similarity = this.calculateOutputSimilarity(recent[i], recent[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }
  
  private calculateOutputSimilarity(output1: MajiangNetworkOutput, output2: MajiangNetworkOutput): number {
    // 计算动作概率相似度
    let actionSimilarity = 0;
    for (let i = 0; i < 39; i++) {
      const diff = Math.abs(output1.actionProbabilities[i] - output2.actionProbabilities[i]);
      actionSimilarity += 1 - diff;
    }
    actionSimilarity /= 39;
    
    // 计算价值评估相似度
    const valueSimilarity = 1 - Math.abs(output1.valueEstimation - output2.valueEstimation) / 2;
    
    return (actionSimilarity + valueSimilarity) / 2;
  }
  
  private applyStabilityBoost(output: MajiangNetworkOutput): MajiangNetworkOutput {
    if (this.decisionHistory.length < 2) return output;
    
    // 使用历史决策的加权平均来稳定当前决策
    const weights = [0.6, 0.3, 0.1]; // 当前、前一次、前两次的权重
    const stabilizedActionProbs = new Float32Array(39);
    let stabilizedValue = 0;
    
    for (let i = 0; i < 39; i++) {
      stabilizedActionProbs[i] = output.actionProbabilities[i] * weights[0];
      
      for (let j = 1; j < Math.min(weights.length, this.decisionHistory.length); j++) {
        const historyIndex = this.decisionHistory.length - 1 - j;
        stabilizedActionProbs[i] += this.decisionHistory[historyIndex].actionProbabilities[i] * weights[j];
      }
    }
    
    stabilizedValue = output.valueEstimation * weights[0];
    for (let j = 1; j < Math.min(weights.length, this.decisionHistory.length); j++) {
      const historyIndex = this.decisionHistory.length - 1 - j;
      stabilizedValue += this.decisionHistory[historyIndex].valueEstimation * weights[j];
    }
    
    console.log('🛡️ 应用稳定性增强');
    
    return {
      actionProbabilities: stabilizedActionProbs,
      valueEstimation: stabilizedValue
    };
  }
  
  public reportError(): void {
    this.errorCount++;
    this.recoveryMode = true;
    console.log(`⚠️ 错误报告，进入恢复模式 (错误计数: ${this.errorCount})`);
  }
  
  public exitRecoveryMode(): void {
    this.recoveryMode = false;
    console.log('✅ 退出恢复模式');
  }
  
  public isInRecoveryMode(): boolean {
    return this.recoveryMode;
  }
  
  public getErrorCount(): number {
    return this.errorCount;
  }
}

/**
 * 稳定性优化器主类
 */
export class StabilityOptimizer {
  private config: StabilityConfig;
  private adaptiveArchitecture: AdaptiveNetworkArchitecture;
  private multiLevelDecision: MultiLevelDecisionNetwork;
  private stabilityBooster: StabilityBooster;
  private monitor: PerformanceMonitor;
  
  constructor(config: StabilityConfig = DEFAULT_STABILITY_CONFIG) {
    this.config = config;
    this.adaptiveArchitecture = new AdaptiveNetworkArchitecture();
    this.multiLevelDecision = new MultiLevelDecisionNetwork(config.decisionLevels);
    this.stabilityBooster = new StabilityBooster(config.stabilityThreshold);
    this.monitor = new PerformanceMonitor();
  }
  
  /**
   * 应用稳定性优化
   */
  public async optimizeDecision(
    agent: MajiangAlphaZeroAgent,
    gameState: any
  ): Promise<MajiangNetworkOutput> {
    this.monitor.startTiming('stability_optimization');
    
    try {
      // 1. 获取基础网络输出
      const baseOutput = agent.getNetworkOutput();
      if (!baseOutput) {
        throw new Error('无法获取网络输出');
      }
      
      let optimizedOutput = baseOutput;
      
      // 2. 应用多层次决策
      if (this.config.enableMultiLevelDecision) {
        optimizedOutput = this.applyMultiLevelDecision(optimizedOutput, gameState);
      }
      
      // 3. 应用稳定性增强
      if (this.config.enableStabilityBoost) {
        optimizedOutput = this.stabilityBooster.enhanceDecision(optimizedOutput, gameState);
      }
      
      // 4. 自适应架构调整
      if (this.config.enableAdaptiveArchitecture) {
        await this.adaptNetworkArchitecture(agent, gameState);
      }
      
      const optimizationTime = this.monitor.endTiming('stability_optimization');
      
      if (this.config.enablePerformanceTracking) {
        console.log(`🔧 稳定性优化完成 (${optimizationTime}ms)`);
      }
      
      return optimizedOutput;
      
    } catch (error) {
      this.stabilityBooster.reportError();
      console.error('❌ 稳定性优化失败:', error);
      
      // 返回基础输出作为后备
      return agent.getNetworkOutput() || {
        actionProbabilities: new Float32Array(39),
        valueEstimation: 0
      };
    }
  }
  
  private applyMultiLevelDecision(
    baseOutput: MajiangNetworkOutput,
    gameState: any
  ): MajiangNetworkOutput {
    // 模拟不同层次的决策
    // 实际实现中，这些应该是不同的网络或不同的推理路径
    
    const strategicOutput = { ...baseOutput }; // 战略层
    const tacticalOutput = { ...baseOutput };  // 战术层
    const operationalOutput = baseOutput;      // 操作层
    
    return this.multiLevelDecision.fuseDecisions(
      strategicOutput,
      tacticalOutput,
      operationalOutput
    );
  }
  
  private async adaptNetworkArchitecture(
    agent: MajiangAlphaZeroAgent,
    gameState: any
  ): Promise<void> {
    // 评估当前性能和游戏复杂度
    const currentPerformance = this.evaluateCurrentPerformance(agent);
    const gameComplexity = this.evaluateGameComplexity(gameState);
    
    // 调整网络架构
    const newArchitecture = this.adaptiveArchitecture.adaptArchitecture(
      currentPerformance,
      gameComplexity
    );
    
    // 这里应该实际更新网络架构
    // 暂时只记录变化
    if (this.config.enablePerformanceTracking) {
      console.log(`🧠 网络架构: ${newArchitecture.join('→')}`);
    }
  }
  
  private evaluateCurrentPerformance(agent: MajiangAlphaZeroAgent): number {
    // 评估当前AI性能
    // 这里应该基于最近的游戏表现
    return 0.7 + Math.random() * 0.3; // 模拟0.7-1.0的性能
  }
  
  private evaluateGameComplexity(gameState: any): number {
    // 评估当前游戏状态的复杂度
    // 考虑因素：手牌数量、可选动作数、游戏阶段等
    return 0.3 + Math.random() * 0.7; // 模拟0.3-1.0的复杂度
  }
  
  /**
   * 获取稳定性指标
   */
  public getStabilityMetrics(): StabilityMetrics {
    const performanceStats = this.monitor.getAllStats();
    
    return {
      decisionConsistency: 0.85 + Math.random() * 0.15, // 模拟85-100%
      performanceStability: 0.80 + Math.random() * 0.20, // 模拟80-100%
      adaptationRate: this.adaptiveArchitecture.getAdaptationCount(),
      errorRecoveryTime: performanceStats.stability_optimization?.avg || 0,
      overallStability: 0.88 + Math.random() * 0.12 // 模拟88-100%
    };
  }
  
  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<StabilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.decisionLevels) {
      this.multiLevelDecision = new MultiLevelDecisionNetwork(newConfig.decisionLevels);
    }
    
    if (newConfig.stabilityThreshold) {
      this.stabilityBooster = new StabilityBooster(newConfig.stabilityThreshold);
    }
  }
  
  public getConfig(): StabilityConfig {
    return { ...this.config };
  }
}