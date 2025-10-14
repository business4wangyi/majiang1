/**
 * 麻将AlphaZero AI性能优化配置
 * 针对不同使用场景的性能调优
 */

export interface PerformanceConfig {
  // MCTS配置
  mctsSimulations: number;
  explorationWeight: number;
  
  // 网络配置
  batchSize: number;
  useParallelMCTS: boolean;
  
  // 缓存配置
  enableStateCache: boolean;
  maxCacheSize: number;
  
  // 性能监控
  enableProfiling: boolean;
  logPerformance: boolean;
}

/**
 * 快速模式 - 适合实时对弈
 */
export const FAST_CONFIG: PerformanceConfig = {
  mctsSimulations: 200,        // 减少模拟次数
  explorationWeight: 1.2,      // 略微降低探索
  batchSize: 1,               // 单个推理
  useParallelMCTS: false,     // 关闭并行
  enableStateCache: true,     // 启用缓存
  maxCacheSize: 1000,         // 适中缓存
  enableProfiling: false,     // 关闭性能分析
  logPerformance: false       // 关闭性能日志
};

/**
 * 平衡模式 - 适合一般使用
 */
export const BALANCED_CONFIG: PerformanceConfig = {
  mctsSimulations: 400,        // 中等模拟次数
  explorationWeight: 1.4,      // 标准探索
  batchSize: 2,               // 小批量推理
  useParallelMCTS: true,      // 启用并行
  enableStateCache: true,     // 启用缓存
  maxCacheSize: 2000,         // 较大缓存
  enableProfiling: false,     // 关闭性能分析
  logPerformance: true        // 启用性能日志
};

/**
 * 高质量模式 - 适合训练和分析
 */
export const HIGH_QUALITY_CONFIG: PerformanceConfig = {
  mctsSimulations: 800,        // 标准模拟次数
  explorationWeight: 1.4,      // 标准探索
  batchSize: 4,               // 批量推理
  useParallelMCTS: true,      // 启用并行
  enableStateCache: true,     // 启用缓存
  maxCacheSize: 5000,         // 大缓存
  enableProfiling: true,      // 启用性能分析
  logPerformance: true        // 启用性能日志
};

/**
 * 训练模式 - 适合自对弈训练
 */
export const TRAINING_CONFIG: PerformanceConfig = {
  mctsSimulations: 600,        // 训练用模拟次数
  explorationWeight: 1.6,      // 增强探索
  batchSize: 8,               // 大批量推理
  useParallelMCTS: true,      // 启用并行
  enableStateCache: false,    // 关闭缓存(避免过拟合)
  maxCacheSize: 0,            // 无缓存
  enableProfiling: true,      // 启用性能分析
  logPerformance: true        // 启用性能日志
};

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private metrics: Map<string, number[]> = new Map();
  
  public startTiming(operation: string): void {
    this.startTime = Date.now();
  }
  
  public endTiming(operation: string): number {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    
    return duration;
  }
  
  public getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  public getStats(operation: string): { avg: number; min: number; max: number; count: number } {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    };
  }
  
  public getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [operation, times] of this.metrics) {
      result[operation] = this.getStats(operation);
    }
    
    return result;
  }
  
  public reset(): void {
    this.metrics.clear();
  }
}

/**
 * 自适应性能配置
 * 根据系统性能动态调整参数
 */
export class AdaptivePerformanceConfig {
  private monitor = new PerformanceMonitor();
  private currentConfig: PerformanceConfig;
  
  constructor(baseConfig: PerformanceConfig = BALANCED_CONFIG) {
    this.currentConfig = { ...baseConfig };
  }
  
  public async benchmarkSystem(): Promise<void> {
    console.log('🔍 开始系统性能基准测试...');
    
    // 测试网络推理速度
    this.monitor.startTiming('network_inference');
    await this.simulateNetworkInference();
    const inferenceTime = this.monitor.endTiming('network_inference');
    
    // 测试MCTS搜索速度
    this.monitor.startTiming('mcts_search');
    await this.simulateMCTSSearch();
    const searchTime = this.monitor.endTiming('mcts_search');
    
    console.log(`📊 网络推理耗时: ${inferenceTime}ms`);
    console.log(`📊 MCTS搜索耗时: ${searchTime}ms`);
    
    // 根据性能调整配置
    this.adaptConfig(inferenceTime, searchTime);
  }
  
  private async simulateNetworkInference(): Promise<void> {
    // 模拟网络推理计算
    const input = new Float32Array(320);
    for (let i = 0; i < 100; i++) {
      // 模拟矩阵运算
      for (let j = 0; j < input.length; j++) {
        input[j] = Math.random();
      }
    }
  }
  
  private async simulateMCTSSearch(): Promise<void> {
    // 模拟MCTS搜索
    const nodes = [];
    for (let i = 0; i < 1000; i++) {
      nodes.push({
        visits: Math.floor(Math.random() * 100),
        value: Math.random() * 2 - 1,
        children: []
      });
    }
  }
  
  private adaptConfig(inferenceTime: number, searchTime: number): void {
    console.log('⚙️ 根据性能基准调整配置...');
    
    // 如果推理很慢，减少模拟次数
    if (inferenceTime > 100) {
      this.currentConfig.mctsSimulations = Math.max(100, this.currentConfig.mctsSimulations * 0.7);
      console.log(`📉 推理较慢，减少MCTS模拟至 ${this.currentConfig.mctsSimulations}`);
    }
    
    // 如果搜索很慢，关闭并行
    if (searchTime > 200) {
      this.currentConfig.useParallelMCTS = false;
      console.log('📉 搜索较慢，关闭并行MCTS');
    }
    
    // 如果性能很好，可以增加质量
    if (inferenceTime < 50 && searchTime < 100) {
      this.currentConfig.mctsSimulations = Math.min(1000, this.currentConfig.mctsSimulations * 1.2);
      this.currentConfig.useParallelMCTS = true;
      console.log(`📈 性能良好，增加MCTS模拟至 ${this.currentConfig.mctsSimulations}`);
    }
  }
  
  public getOptimizedConfig(): PerformanceConfig {
    return { ...this.currentConfig };
  }
  
  public getPerformanceStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    return this.monitor.getAllStats();
  }
}