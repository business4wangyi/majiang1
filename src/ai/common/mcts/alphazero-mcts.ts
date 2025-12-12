/**
 * 通用AlphaZero MCTS实现
 * 
 * 通过游戏适配器接口，可以适配到任何游戏
 */

import { MCTSNode } from './mcts-node';
import { IGameAdapter, INetwork, NetworkPrediction } from './interfaces/game-adapter';

/**
 * MCTS配置接口
 */
export interface MCTSConfig {
  /** 模拟次数 */
  numSimulations: number;
  /** C_PUCT参数 - 控制探索vs利用的平衡 */
  cPuct: number;
  /** 狄利克雷噪声参数 */
  dirichletAlpha: number;
  /** 噪声权重 */
  noiseWeight: number;
  /** 温度参数 - 控制动作选择的随机性 */
  temperature: number;
  /** 提前终止阈值 - 如果根节点价值确定性超过此值，提前终止搜索 */
  earlyTerminationThreshold?: number;
  /** 最小模拟次数 - 即使达到提前终止条件，也至少执行此次数 */
  minSimulations?: number;
}

/**
 * 默认MCTS配置
 */
export const DEFAULT_MCTS_CONFIG: MCTSConfig = {
  numSimulations: 800,
  cPuct: 1.0,
  dirichletAlpha: 0.3,
  noiseWeight: 0.25,
  temperature: 1.0,
  earlyTerminationThreshold: 0.90,  // 回滚：恢复到基准值0.90（阶段1优化A1效果不明显，已回滚）
  minSimulations: undefined  // 使用默认值（18%，回滚：恢复到基准值18%）
};

/**
 * MCTS搜索结果
 */
export interface MCTSSearchResult {
  /** 动作概率分布 */
  actionProbs: Map<string, number>;
  /** 根节点价值 */
  rootValue: number;
  /** 访问次数分布 */
  visitCounts: Map<string, number>;
}

/**
 * 通用AlphaZero MCTS类
 */
/**
 * LRU缓存节点
 */
class LRUCacheNode {
  key: string;
  value: NetworkPrediction;
  prev: LRUCacheNode | null;
  next: LRUCacheNode | null;

  constructor(key: string, value: NetworkPrediction) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * LRU缓存实现
 */
class LRUCache {
  private capacity: number;
  private cache: Map<string, LRUCacheNode>;
  private head: LRUCacheNode;
  private tail: LRUCacheNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    // 创建虚拟头尾节点
    this.head = new LRUCacheNode('', { policyProbs: [], value: 0 });
    this.tail = new LRUCacheNode('', { policyProbs: [], value: 0 });
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: string): NetworkPrediction | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }
    // 移动到头部
    this.moveToHead(node);
    return node.value;
  }

  set(key: string, value: NetworkPrediction): void {
    const node = this.cache.get(key);
    if (node) {
      // 更新值并移动到头部
      node.value = value;
      this.moveToHead(node);
    } else {
      // 创建新节点
      const newNode = new LRUCacheNode(key, value);
      if (this.cache.size >= this.capacity) {
        // 删除尾部节点
        const tail = this.removeTail();
        this.cache.delete(tail.key);
      }
      this.cache.set(key, newNode);
      this.addToHead(newNode);
    }
  }

  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.cache.size;
  }

  private addToHead(node: LRUCacheNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  private removeNode(node: LRUCacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  private moveToHead(node: LRUCacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): LRUCacheNode {
    const tail = this.tail.prev!;
    this.removeNode(tail);
    return tail;
  }
}

/**
 * 待扩展节点信息
 */
interface PendingExpansion<State = any, Action = any, Player = any> {
  node: MCTSNode<State, Action, Player>;
  stateHash: string;
  encodedInput?: any;
}

export class AlphaZeroMCTS<State = any, Action = any, Player = any> {
  private network: INetwork;
  private adapter: IGameAdapter;
  private config: MCTSConfig;
  private stateCache: LRUCache; // 使用LRU缓存
  private encodedStateCache: Map<string, any>; // 状态编码缓存
  private enableCache: boolean;
  private maxCacheSize: number;
  private batchSize: number; // 批量推理批次大小
  // 缓存统计
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(
    network: INetwork,
    adapter: IGameAdapter,
    config: MCTSConfig = DEFAULT_MCTS_CONFIG,
    enableCache: boolean = true,
    maxCacheSize: number = 1000,
    batchSize: number = 8 // 默认批量大小8（重新启用批量推理）
  ) {
    this.network = network;
    this.adapter = adapter;
    this.config = { ...config };
    this.stateCache = new LRUCache(maxCacheSize);
    this.encodedStateCache = new Map();
    this.enableCache = enableCache;
    this.maxCacheSize = maxCacheSize;
    this.batchSize = batchSize; // 重新启用批量推理
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * 执行MCTS搜索（支持批量推理优化）
   */
  async search(state: State, player: Player): Promise<MCTSSearchResult> {
    const root = new MCTSNode(state, player, this.adapter);
    const minSimulations = this.config.minSimulations || Math.floor(this.config.numSimulations * 0.18); // 回滚：恢复到基准值18%（阶段1优化A1效果不明显，已回滚）
    const earlyTerminationThreshold = this.config.earlyTerminationThreshold || 0.90; // 回滚：恢复到基准值0.90（阶段1优化A1效果不明显，已回滚）

    // 批量推理支持：如果batchSize > 0，使用批量推理；否则使用单次预测
    const useBatchInference = this.batchSize > 0 && this.network.predictBatch;
    const pendingExpansions: PendingExpansion<State, Action, Player>[] = [];
    const pendingPredictions = new Map<string, NetworkPrediction>();

    // 执行指定次数的模拟
    for (let i = 0; i < this.config.numSimulations; i++) {
      if (useBatchInference) {
        // 使用批量推理模式
        const needsBatch = await this.simulate(root, pendingExpansions, pendingPredictions);
        
        // 当待扩展列表达到批次大小，或搜索接近结束时，处理批量预测
        if (pendingExpansions.length >= this.batchSize || (i === this.config.numSimulations - 1 && pendingExpansions.length > 0)) {
          await this.processBatchExpansions(pendingExpansions, pendingPredictions);
          // 清空已处理的扩展（保留未处理的）
          pendingExpansions.length = 0;
        }
      } else {
        // 使用单次预测模式（兼容旧代码）
        await this.simulateWithSinglePrediction(root);
      }

      // 提前终止检查（至少执行minSimulations次）
      if (i >= minSimulations && this.config.earlyTerminationThreshold !== undefined) {
        const certainty = this.calculateRootCertainty(root);
        if (certainty >= earlyTerminationThreshold) {
          // 根节点价值已足够确定，提前终止
          break;
        }
      }
    }
    
    // 处理剩余的待扩展节点
    if (useBatchInference && pendingExpansions.length > 0) {
      await this.processBatchExpansions(pendingExpansions, pendingPredictions);
    }

    // 获取访问次数分布
    const visitCounts = new Map<string, number>();
    let totalVisits = 0;

    for (const [actionKey, child] of root.children) {
      visitCounts.set(actionKey, child.visitCount);
      totalVisits += child.visitCount;
    }

    // 转换为概率分布
    const actionProbs = new Map<string, number>();
    for (const [actionKey, count] of visitCounts) {
      actionProbs.set(actionKey, totalVisits > 0 ? count / totalVisits : 0);
    }

    // 添加狄利克雷噪声（仅在根节点）
    if (this.config.noiseWeight > 0) {
      this.addDirichletNoise(actionProbs, state, player);
    }

    return {
      actionProbs,
      rootValue: root.averageValue,
      visitCounts
    };
  }

  /**
   * 计算根节点的确定性
   * 基于访问次数分布，如果某个动作的访问次数占比很高，说明已经足够确定
   */
  private calculateRootCertainty(root: MCTSNode<State, Action, Player>): number {
    if (root.children.size === 0) {
      return 0;
    }

    let totalVisits = 0;
    const visitCounts: number[] = [];

    for (const child of root.children.values()) {
      visitCounts.push(child.visitCount);
      totalVisits += child.visitCount;
    }

    if (totalVisits === 0) {
      return 0;
    }

    // 计算最大访问次数的占比（确定性指标）
    const maxVisits = Math.max(...visitCounts);
    const certainty = maxVisits / totalVisits;

    return certainty;
  }

  /**
   * 清理状态缓存
   */
  clearCache(): void {
    this.stateCache.clear();
    this.encodedStateCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number; hits: number; misses: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;
    return {
      size: this.stateCache.size,
      maxSize: this.maxCacheSize,
      hitRate,
      hits: this.cacheHits,
      misses: this.cacheMisses
    };
  }

  /**
   * 处理批量扩展节点（批量推理）
   */
  private async processBatchExpansions(
    pendingExpansions: PendingExpansion<State, Action, Player>[],
    pendingPredictions: Map<string, NetworkPrediction>
  ): Promise<void> {
    if (pendingExpansions.length === 0) {
      return;
    }

    // 准备批量输入
    const inputs: any[] = [];
    const nodes: MCTSNode<State, Action, Player>[] = [];
    const stateHashes: string[] = [];

    for (const pending of pendingExpansions) {
      // 检查缓存
      if (this.enableCache) {
        const cached = this.stateCache.get(pending.stateHash);
        if (cached) {
          this.cacheHits++;
          pendingPredictions.set(pending.stateHash, cached);
          continue;
        }
        this.cacheMisses++;
      }

      // 准备编码输入
      let input: any;
      if (pending.encodedInput) {
        input = pending.encodedInput;
      } else {
        const encodedCacheKey = pending.stateHash + '_encoded';
        const cachedEncoded = this.encodedStateCache.get(encodedCacheKey);
        if (cachedEncoded) {
          input = cachedEncoded;
        } else {
          input = this.network.encodeState(pending.node.state, pending.node.player);
          if (this.encodedStateCache.size < this.maxCacheSize) {
            this.encodedStateCache.set(encodedCacheKey, input);
          }
        }
      }

      inputs.push(input);
      nodes.push(pending.node);
      stateHashes.push(pending.stateHash);
    }

    // 批量预测（带超时保护）
    if (inputs.length > 0 && this.network.predictBatch) {
      try {
        // 批量预测超时：根据批次大小动态调整（批次越大，允许时间越长）
        // 基础时间10秒 + 每个输入2秒，最多30秒
        const batchTimeout = Math.min(10000 + inputs.length * 2000, 30000);
        
        const predictions = await Promise.race([
          this.network.predictBatch(inputs),
          new Promise<NetworkPrediction[]>((_, reject) => 
            setTimeout(() => reject(new Error(`批量预测超时（${batchTimeout / 1000}秒，批次大小: ${inputs.length}）`)), batchTimeout)
          )
        ]);
        
        for (let i = 0; i < predictions.length; i++) {
          const prediction = predictions[i];
          const stateHash = stateHashes[i];
          pendingPredictions.set(stateHash, prediction);
          
          // 存入缓存
          if (this.enableCache) {
            this.stateCache.set(stateHash, prediction);
          }
        }
      } catch (error) {
        // 批量预测失败或超时，回退到单次预测（带超时保护）
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('超时')) {
          console.warn(`⚠️ [MCTS] 批量预测超时（批次大小: ${inputs.length}），回退到单次预测`);
        } else {
          console.warn('⚠️ [MCTS] 批量预测失败，回退到单次预测:', errorMsg);
        }
        
        // 回退到单次预测，每个预测都有5秒超时保护
        for (let i = 0; i < inputs.length; i++) {
          try {
            const prediction = await Promise.race([
              this.network.predict(inputs[i]),
              new Promise<NetworkPrediction>((_, reject) => 
                setTimeout(() => reject(new Error('单次预测超时（5秒）')), 5000)
              )
            ]);
            const stateHash = stateHashes[i];
            pendingPredictions.set(stateHash, prediction);
            
            if (this.enableCache) {
              this.stateCache.set(stateHash, prediction);
            }
          } catch (singleError) {
            // 单次预测也失败，使用默认值或跳过
            console.error(`❌ [MCTS] 单次预测失败（索引 ${i}）:`, singleError instanceof Error ? singleError.message : String(singleError));
            // 使用零策略和零价值作为fallback
            const stateHash = stateHashes[i];
            const fallbackPrediction: NetworkPrediction = {
              policyProbs: new Float32Array(64).fill(0),
              value: 0
            };
            pendingPredictions.set(stateHash, fallbackPrediction);
          }
        }
      }
    } else if (inputs.length > 0) {
      // 回退到单次预测（带超时保护）
      for (let i = 0; i < inputs.length; i++) {
        try {
          const prediction = await Promise.race([
            this.network.predict(inputs[i]),
            new Promise<NetworkPrediction>((_, reject) => 
              setTimeout(() => reject(new Error('单次预测超时（5秒）')), 5000)
            )
          ]);
          const stateHash = stateHashes[i];
          pendingPredictions.set(stateHash, prediction);
          
          if (this.enableCache) {
            this.stateCache.set(stateHash, prediction);
          }
        } catch (error) {
          // 单次预测失败，使用默认值
          console.error(`❌ [MCTS] 单次预测失败（索引 ${i}）:`, error instanceof Error ? error.message : String(error));
          const stateHash = stateHashes[i];
          const fallbackPrediction: NetworkPrediction = {
            policyProbs: new Float32Array(64).fill(0),
            value: 0
          };
          pendingPredictions.set(stateHash, fallbackPrediction);
        }
      }
    }
  }

  /**
   * 执行单次模拟（使用单次预测，禁用批量推理）
   */
  private async simulateWithSinglePrediction(
    root: MCTSNode<State, Action, Player>
  ): Promise<void> {
    const debug = process.env.MCTS_DEBUG === 'true';
    if (debug) console.log('[MCTS] 开始模拟...');
    
    let node = root;
    const path: MCTSNode<State, Action, Player>[] = [node];

    // 选择阶段：沿着树向下选择到叶子节点
    let selectionDepth = 0;
    while (node.isExpanded && !node.isLeaf()) {
      node = node.selectBestChild(this.config.cPuct);
      path.push(node);
      selectionDepth++;
    }
    if (debug) console.log(`[MCTS] 选择阶段完成，深度: ${selectionDepth}`);

    // 扩展阶段：如果不是终端节点，则扩展
    let value: number;
    if (this.adapter.isGameOver(node.state)) {
      // 游戏结束，计算真实价值
      value = this.adapter.evaluateTerminalState(node.state, node.player);
      if (debug) console.log(`[MCTS] 游戏结束，价值: ${value}`);
    } else {
      // 使用单次预测（保留缓存优化）
      if (debug) console.log('[MCTS] 开始扩展节点...');
      const expandStartTime = Date.now();
      const prediction = await this.expandNode(node);
      const expandTime = Date.now() - expandStartTime;
      if (debug) console.log(`[MCTS] 节点扩展完成，耗时: ${expandTime}ms，价值: ${prediction.value}`);
      value = prediction.value;
    }

    // 回传阶段：沿路径向上更新所有节点
    if (debug) console.log(`[MCTS] 开始回传，路径长度: ${path.length}`);
    for (let i = path.length - 1; i >= 0; i--) {
      path[i].backpropagate(value);
      value = -value; // 交替玩家，价值取反
    }
    if (debug) console.log('[MCTS] 模拟完成');
  }

  /**
   * 执行单次模拟（支持批量推理）
   * @returns 是否需要扩展但预测结果未准备好
   */
  private async simulate(
    root: MCTSNode<State, Action, Player>,
    pendingExpansions: PendingExpansion<State, Action, Player>[],
    pendingPredictions: Map<string, NetworkPrediction>
  ): Promise<boolean> {
    let node = root;
    const path: MCTSNode<State, Action, Player>[] = [node];

    // 选择阶段：沿着树向下选择到叶子节点
    while (node.isExpanded && !node.isLeaf()) {
      node = node.selectBestChild(this.config.cPuct);
      path.push(node);
    }

    // 扩展阶段：如果不是终端节点，则扩展
    let value: number;
    if (this.adapter.isGameOver(node.state)) {
      // 游戏结束，计算真实价值
      value = this.adapter.evaluateTerminalState(node.state, node.player);
    } else {
      // 检查是否有待处理的预测结果
      const stateHash = this.getStateHash(node.state, node.player);
      
      // 先检查pendingPredictions（批量预测结果）
      let prediction = pendingPredictions.get(stateHash);
      
      // 如果pendingPredictions中没有，检查缓存
      if (!prediction && this.enableCache) {
        const cached = this.stateCache.get(stateHash);
        if (cached) {
          this.cacheHits++;
          prediction = cached;
          pendingPredictions.set(stateHash, cached);
        } else {
          this.cacheMisses++;
        }
      }
      
      if (!prediction) {
        // 检查是否已经在待扩展列表中（避免重复添加）
        const alreadyPending = pendingExpansions.some(p => p.stateHash === stateHash);
        if (!alreadyPending) {
          // 添加到待扩展列表，等待批量处理
          pendingExpansions.push({
            node,
            stateHash
          });
        }
        // 返回true表示需要等待批量预测
        return true;
      }
      
      // 扩展节点
      await this.expandNodeWithPrediction(node, prediction);
      value = prediction.value;
    }

    // 回传阶段：沿路径向上更新所有节点
    for (let i = path.length - 1; i >= 0; i--) {
      path[i].backpropagate(value);
      value = -value; // 交替玩家，价值取反
    }
    
    return false;
  }

  /**
   * 使用预测结果扩展节点
   */
  private async expandNodeWithPrediction(
    node: MCTSNode<State, Action, Player>,
    prediction: NetworkPrediction
  ): Promise<void> {
    if (node.isExpanded) {
      return;
    }

    const legalActions = this.adapter.getLegalActions(node.state, node.player);
    
    if (legalActions.length === 0) {
      node.isExpanded = true;
      return;
    }

    // 为每个合法动作创建子节点
    for (const action of legalActions) {
      const actionKey = this.adapter.getActionKey(action);
      const prior = this.getActionPrior(action, legalActions, prediction);
      const newState = this.adapter.makeMove(node.state, action, node.player);
      const nextPlayer = this.adapter.switchPlayer(node.player);
      const childNode = new MCTSNode(newState, nextPlayer, this.adapter, node, prior, action);
      node.children.set(actionKey, childNode);
    }

    node.isExpanded = true;
  }

  /**
   * 生成状态哈希键（用于缓存）
   */
  private getStateHash(state: State, player: Player): string {
    // 使用适配器的getActionKey方法生成状态键
    // 如果适配器有getStateKey方法，使用它；否则使用JSON序列化
    if ('getStateKey' in this.adapter && typeof (this.adapter as any).getStateKey === 'function') {
      return (this.adapter as any).getStateKey(state, player);
    }
    // 回退到JSON序列化（可能较慢，但通用）
    return JSON.stringify({ state, player });
  }

  /**
   * 扩展节点
   */
  private async expandNode(node: MCTSNode<State, Action, Player>): Promise<NetworkPrediction> {
    const debug = process.env.MCTS_DEBUG === 'true';
    if (debug) console.log('[expandNode] 开始扩展节点...');
    
    if (node.isExpanded) {
      // 如果已扩展，返回默认值
      if (debug) console.log('[expandNode] 节点已扩展，返回默认值');
      return { policyProbs: [], value: 0 };
    }

    const legalActions = this.adapter.getLegalActions(node.state, node.player);
    if (debug) console.log(`[expandNode] 合法动作数: ${legalActions.length}`);
    
    if (legalActions.length === 0) {
      // 无合法动作，游戏结束或跳过
      node.isExpanded = true;
      if (debug) console.log('[expandNode] 无合法动作，游戏结束');
      return { policyProbs: [], value: 0 };
    }

    // 检查缓存
    let prediction: NetworkPrediction;
    if (this.enableCache) {
      const stateHash = this.getStateHash(node.state, node.player);
      const cached = this.stateCache.get(stateHash);
      
      if (cached) {
        // 使用缓存结果
        this.cacheHits++;
        if (debug) console.log('[expandNode] 使用缓存结果');
        prediction = cached;
      } else {
        // 检查编码缓存
        let input: any;
        const encodedCacheKey = stateHash + '_encoded';
        const cachedEncoded = this.encodedStateCache.get(encodedCacheKey);
        
        if (cachedEncoded) {
          // 使用缓存的编码结果
          if (debug) console.log('[expandNode] 使用编码缓存');
          input = cachedEncoded;
        } else {
          // 编码状态
          if (debug) console.log('[expandNode] 开始编码状态...');
          const encodeStartTime = Date.now();
          input = this.network.encodeState(node.state, node.player);
          const encodeTime = Date.now() - encodeStartTime;
          if (debug) console.log(`[expandNode] 状态编码完成，耗时: ${encodeTime}ms`);
          // 存入编码缓存（限制大小，避免内存溢出）
          if (this.encodedStateCache.size < this.maxCacheSize) {
            this.encodedStateCache.set(encodedCacheKey, input);
          }
        }
        
        // 获取神经网络预测
        this.cacheMisses++;
        if (debug) console.log('[expandNode] 开始神经网络预测...');
        const predictStartTime = Date.now();
        try {
          prediction = await Promise.race([
            this.network.predict(input),
            new Promise<NetworkPrediction>((_, reject) => 
              setTimeout(() => reject(new Error('预测超时（5秒）')), 5000)
            )
          ]);
          const predictTime = Date.now() - predictStartTime;
          if (debug) console.log(`[expandNode] 神经网络预测完成，耗时: ${predictTime}ms，价值: ${prediction.value}`);
        } catch (error: any) {
          console.error(`❌ [expandNode] 神经网络预测失败: ${error.message || error}`);
          throw error;
        }
        
        // 存入LRU缓存（自动处理容量）
        this.stateCache.set(stateHash, prediction);
      }
    } else {
      // 不使用缓存，直接预测
      this.cacheMisses++;
      if (debug) console.log('[expandNode] 不使用缓存，直接预测');
      const input = this.network.encodeState(node.state, node.player);
      const predictStartTime = Date.now();
      try {
        prediction = await Promise.race([
          this.network.predict(input),
          new Promise<NetworkPrediction>((_, reject) => 
            setTimeout(() => reject(new Error('预测超时（5秒）')), 5000)
          )
        ]);
        const predictTime = Date.now() - predictStartTime;
        if (debug) console.log(`[expandNode] 预测完成，耗时: ${predictTime}ms`);
      } catch (error: any) {
        console.error(`❌ [expandNode] 预测失败: ${error.message || error}`);
        throw error;
      }
    }

    // 为每个合法动作创建子节点
    for (const action of legalActions) {
      const actionKey = this.adapter.getActionKey(action);
      
      // 获取该动作的先验概率（需要适配器提供映射逻辑）
      const prior = this.getActionPrior(action, legalActions, prediction);
      
      // 执行动作，获取新状态
      const newState = this.adapter.makeMove(node.state, action, node.player);
      const nextPlayer = this.adapter.switchPlayer(node.player);
      
      const childNode = new MCTSNode(newState, nextPlayer, this.adapter, node, prior, action);
      node.children.set(actionKey, childNode);
    }

    node.isExpanded = true;
    return prediction;
  }

  /**
   * 获取动作的先验概率
   * 通过适配器获取游戏特定的映射逻辑
   */
  private getActionPrior(
    action: Action,
    legalActions: Action[],
    prediction: NetworkPrediction
  ): number {
    return this.adapter.getActionPrior(action, legalActions, prediction);
  }

  /**
   * 添加狄利克雷噪声
   */
  private addDirichletNoise(
    actionProbs: Map<string, number>,
    state: State,
    player: Player
  ): void {
    const legalActions = this.adapter.getLegalActions(state, player);
    if (legalActions.length === 0) return;

    // 生成狄利克雷噪声
    const noise = this.generateDirichletNoise(legalActions.length, this.config.dirichletAlpha);
    
    let noiseIndex = 0;
    for (const action of legalActions) {
      const actionKey = this.adapter.getActionKey(action);
      const currentProb = actionProbs.get(actionKey) || 0;
      actionProbs.set(
        actionKey,
        (1 - this.config.noiseWeight) * currentProb + 
        this.config.noiseWeight * noise[noiseIndex]
      );
      noiseIndex++;
    }
  }

  /**
   * 生成狄利克雷噪声
   */
  private generateDirichletNoise(size: number, alpha: number): number[] {
    const noise: number[] = [];
    let sum = 0;

    // 生成Gamma分布随机数
    for (let i = 0; i < size; i++) {
      const gamma = this.gammaRandom(alpha, 1);
      noise.push(gamma);
      sum += gamma;
    }

    // 归一化
    return noise.map(n => n / sum);
  }

  /**
   * 生成Gamma分布随机数（简化版本）
   */
  private gammaRandom(alpha: number, beta: number): number {
    // 使用Marsaglia and Tsang方法的简化版本
    if (alpha < 1) {
      return this.gammaRandom(alpha + 1, beta) * Math.pow(Math.random(), 1 / alpha);
    }

    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * (x * x) * (x * x)) {
        return beta * d * v;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return beta * d * v;
      }
    }
  }

  /**
   * 生成标准正态分布随机数（Box-Muller变换）
   */
  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

