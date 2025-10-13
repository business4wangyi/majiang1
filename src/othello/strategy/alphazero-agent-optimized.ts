// {{ AURA-X: Add - 内存优化的AlphaZero智能体，使用优化MCTS. Approval: 寸止(ID:MCTS内存优化). }}

/**
 * 内存优化的AlphaZero智能体
 * 
 * 关键优化：
 * - 使用优化的MCTS实现（节点池化+状态压缩）
 * - 智能内存管理和监控
 * - 流式经验处理
 * - 自动内存清理机制
 */

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { getLegalActions, makeMove, isGameOver } from '../othello-game';
import { AlphaZeroNetwork } from './alphazero-network';
import { OptimizedAlphaZeroMCTS, OptimizedMCTSConfig } from './alphazero-mcts-optimized';

/**
 * 内存优化的AlphaZero智能体配置
 */
export interface OptimizedAlphaZeroAgentConfig {
  name: string;
  isTraining: boolean;
  trainingTemperature: number;
  inferenceTemperature: number;
  verbose: boolean;
  useAdvancedNetwork: boolean;
  
  // 内存优化配置
  enableMemoryMonitoring: boolean;
  memoryThresholdMB: number;
  autoCleanupInterval: number; // 自动清理间隔（毫秒）
  maxSearchCacheSize: number;
}

/**
 * 默认优化配置
 */
export const DEFAULT_OPTIMIZED_ALPHAZERO_CONFIG: OptimizedAlphaZeroAgentConfig = {
  name: 'AlphaZero-Optimized',
  isTraining: false,
  trainingTemperature: 1.0,
  inferenceTemperature: 0.1,
  verbose: false,
  useAdvancedNetwork: true,
  enableMemoryMonitoring: true,
  memoryThresholdMB: 1500, // 1.5GB阈值
  autoCleanupInterval: 30000, // 30秒清理一次
  maxSearchCacheSize: 500
};

/**
 * 搜索结果接口
 */
export interface OptimizedSearchResult {
  action: OthelloAction;
  actionProbs: number[];
  rootValue: number;
  searchStats: {
    searchTime: number;
    simulations: number;
    memoryUsage: any;
    cacheHits: number;
  };
}

/**
 * 内存优化的AlphaZero智能体
 */
export class OptimizedAlphaZeroOthelloAgent {
  private config: OptimizedAlphaZeroAgentConfig;
  private network: AlphaZeroNetwork;
  private mcts: OptimizedAlphaZeroMCTS;
  private searchCache: Map<string, { actionProbs: number[]; value: number; timestamp: number }>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private searchCount: number = 0;
  private cacheHits: number = 0;

  constructor(
    config: OptimizedAlphaZeroAgentConfig = DEFAULT_OPTIMIZED_ALPHAZERO_CONFIG,
    networkConfig?: any,
    mctsConfig?: any
  ) {
    this.config = { ...config };
    this.searchCache = new Map();
    
    console.log('🚀 创建内存优化AlphaZero智能体');
    console.log(`   内存监控: ${this.config.enableMemoryMonitoring ? '启用' : '禁用'}`);
    console.log(`   内存阈值: ${this.config.memoryThresholdMB}MB`);
    console.log(`   自动清理: 每${this.config.autoCleanupInterval / 1000}秒`);
    
    // 创建网络
    this.network = new AlphaZeroNetwork(networkConfig);
    
    // 创建优化的MCTS
    const optimizedMCTSConfig: OptimizedMCTSConfig = {
      numSimulations: mctsConfig?.numSimulations || 300,
      cPuct: mctsConfig?.cPuct || 1.0,
      dirichletAlpha: mctsConfig?.dirichletAlpha || 0.3,
      noiseWeight: mctsConfig?.noiseWeight || 0.25,
      temperature: mctsConfig?.temperature || 1.0,
      enableMemoryMonitoring: this.config.enableMemoryMonitoring,
      memoryThresholdMB: this.config.memoryThresholdMB
    };
    
    this.mcts = new OptimizedAlphaZeroMCTS(this.network, optimizedMCTSConfig);
    
    // 启动自动清理
    if (this.config.enableMemoryMonitoring) {
      this.startAutoCleanup();
    }
  }

  /**
   * 搜索最佳动作
   */
  searchBestAction(board: OthelloBoard, player: OthelloPlayer): OptimizedSearchResult {
    const startTime = Date.now();
    this.searchCount++;
    
    // 检查缓存
    const boardHash = this.getBoardHash(board, player);
    const cached = this.searchCache.get(boardHash);
    
    if (cached && !this.config.isTraining) {
      this.cacheHits++;
      
      // 从缓存的概率分布中选择动作
      const action = this.selectActionFromProbs(cached.actionProbs, board, player);
      
      return {
        action,
        actionProbs: cached.actionProbs,
        rootValue: cached.value,
        searchStats: {
          searchTime: Date.now() - startTime,
          simulations: 0, // 缓存命中，无需模拟
          memoryUsage: this.mcts.getMemoryStats(),
          cacheHits: this.cacheHits
        }
      };
    }
    
    // 执行MCTS搜索
    const searchResult = this.mcts.search(board, player);
    
    // 缓存结果
    if (this.searchCache.size < this.config.maxSearchCacheSize) {
      this.searchCache.set(boardHash, {
        actionProbs: [...searchResult.actionProbs],
        value: searchResult.rootValue,
        timestamp: Date.now()
      });
    }
    
    // 选择动作
    const action = this.selectActionFromProbs(searchResult.actionProbs, board, player);
    
    return {
      action,
      actionProbs: searchResult.actionProbs,
      rootValue: searchResult.rootValue,
      searchStats: {
        searchTime: Date.now() - startTime,
        simulations: 300, // 配置的模拟次数
        memoryUsage: this.mcts.getMemoryStats(),
        cacheHits: this.cacheHits
      }
    };
  }

  /**
   * 选择动作（智能体接口）
   */
  selectAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction {
    const result = this.searchBestAction(board, player);
    
    if (this.config.verbose) {
      console.log(`🎯 ${this.config.name} 选择动作: (${result.action.row},${result.action.col})`);
      console.log(`   根节点价值: ${result.rootValue.toFixed(4)}`);
      console.log(`   搜索时间: ${result.searchStats.searchTime}ms`);
      console.log(`   缓存命中率: ${(this.cacheHits / this.searchCount * 100).toFixed(1)}%`);
    }
    
    return result.action;
  }

  /**
   * 从概率分布中选择动作
   */
  private selectActionFromProbs(actionProbs: number[], board: OthelloBoard, player: OthelloPlayer): OthelloAction {
    const legalActions = getLegalActions(board, player);
    
    if (legalActions.length === 0) {
      throw new Error('No legal actions available');
    }
    
    // 获取合法动作的概率
    const legalProbs: { action: OthelloAction; prob: number }[] = [];
    for (const action of legalActions) {
      const actionIndex = action.row * 8 + action.col;
      legalProbs.push({ action, prob: actionProbs[actionIndex] });
    }
    
    // 根据温度参数选择动作
    const temperature = this.config.isTraining ? 
      this.config.trainingTemperature : 
      this.config.inferenceTemperature;
    
    if (temperature === 0) {
      // 贪心选择
      return legalProbs.reduce((best, current) => 
        current.prob > best.prob ? current : best
      ).action;
    } else {
      // 温度采样
      const adjustedProbs = legalProbs.map(item => 
        Math.pow(item.prob, 1 / temperature)
      );
      
      const sum = adjustedProbs.reduce((a, b) => a + b, 0);
      const normalizedProbs = adjustedProbs.map(p => p / sum);
      
      const random = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < legalProbs.length; i++) {
        cumulative += normalizedProbs[i];
        if (random < cumulative) {
          return legalProbs[i].action;
        }
      }
      
      // 备选方案
      return legalProbs[legalProbs.length - 1].action;
    }
  }

  /**
   * 获取棋盘哈希值
   */
  private getBoardHash(board: OthelloBoard, player: OthelloPlayer): string {
    let hash = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        hash += board[row][col];
      }
    }
    return `${hash}_${player}`;
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.autoCleanupInterval);
  }

  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    const memUsage = process.memoryUsage();
    const rssGB = memUsage.rss / 1024 / 1024 / 1024;
    
    if (rssGB > this.config.memoryThresholdMB / 1024) {
      console.log(`🧹 执行自动内存清理 (${rssGB.toFixed(2)}GB)`);
      
      // 清理搜索缓存
      this.clearOldCache();
      
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const newMemUsage = process.memoryUsage();
      const newRssGB = newMemUsage.rss / 1024 / 1024 / 1024;
      console.log(`   清理后内存: ${newRssGB.toFixed(2)}GB`);
    }
  }

  /**
   * 清理旧缓存
   */
  private clearOldCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.searchCache.delete(key);
      }
    }
    
    // 如果缓存仍然太大，清理一半
    if (this.searchCache.size > this.config.maxSearchCacheSize) {
      const entries = Array.from(this.searchCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(entries.length / 2));
      for (const [key] of toDelete) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * 获取内存统计信息
   */
  getMemoryStats(): any {
    return {
      agent: {
        searchCount: this.searchCount,
        cacheHits: this.cacheHits,
        cacheSize: this.searchCache.size,
        hitRate: this.searchCount > 0 ? (this.cacheHits / this.searchCount * 100).toFixed(1) + '%' : '0%'
      },
      mcts: this.mcts.getMemoryStats(),
      system: process.memoryUsage()
    };
  }

  /**
   * 保存模型
   */
  async saveModel(path: string): Promise<void> {
    await this.network.saveModel(path);
  }

  /**
   * 加载模型
   */
  async loadModel(path: string): Promise<void> {
    await this.network.loadModel(path);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.searchCache.clear();
    this.mcts.dispose();
    this.network.dispose();
    
    console.log('🧹 内存优化AlphaZero智能体已清理');
  }
}
