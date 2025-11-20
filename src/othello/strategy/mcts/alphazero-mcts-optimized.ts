// {{ AURA-X: Add - MCTS内存优化实现，节点池化+状态压缩. Approval: 寸止(ID:MCTS内存优化). }}

/**
 * AlphaZero MCTS内存优化实现
 * 
 * 关键优化措施：
 * - 节点池化：重用MCTSNode对象，避免频繁创建销毁
 * - 状态压缩：使用位运算表示棋盘状态，减少内存占用
 * - 搜索树清理：搜索完成后强制清理树结构
 * - 内存监控：实时监控内存使用，主动触发清理
 */

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { getLegalActions, makeMove, isGameOver, countPieces } from '../../core/game';
import { IAlphaZeroNetwork } from '../networks/alphazero-network';

/**
 * 压缩棋盘状态 - 使用64位整数表示8x8棋盘
 */
export class CompressedBoardState {
  public blackPieces: bigint = 0n;  // 黑子位置
  public whitePieces: bigint = 0n;  // 白子位置
  
  constructor(board?: OthelloBoard) {
    if (board) {
      this.fromBoard(board);
    }
  }
  
  /**
   * 从标准棋盘转换为压缩状态
   */
  fromBoard(board: OthelloBoard): void {
    this.blackPieces = 0n;
    this.whitePieces = 0n;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position = BigInt(row * 8 + col);
        const bit = 1n << position;

        if (board[row][col] === 'B') {
          this.blackPieces |= bit;
        } else if (board[row][col] === 'W') {
          this.whitePieces |= bit;
        }
        // null值不需要特殊处理，保持为0
      }
    }
  }
  
  /**
   * 转换为标准棋盘格式
   */
  toBoard(): OthelloBoard {
    const board: OthelloBoard = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position = BigInt(row * 8 + col);
        const bit = 1n << position;

        if (this.blackPieces & bit) {
          board[row][col] = 'B';
        } else if (this.whitePieces & bit) {
          board[row][col] = 'W';
        }
        // 默认为null，不需要额外设置
      }
    }

    return board;
  }
  
  /**
   * 复制状态
   */
  copy(): CompressedBoardState {
    const newState = new CompressedBoardState();
    newState.blackPieces = this.blackPieces;
    newState.whitePieces = this.whitePieces;
    return newState;
  }
  
  /**
   * 获取状态哈希值（用于缓存）
   */
  getHash(): string {
    return `${this.blackPieces.toString(16)}_${this.whitePieces.toString(16)}`;
  }
}

/**
 * 内存优化的MCTS节点
 */
export class OptimizedMCTSNode {
  public boardState: CompressedBoardState = new CompressedBoardState();
  public player: OthelloPlayer = 'B';
  public parent: OptimizedMCTSNode | null = null;
  public children: Map<string, OptimizedMCTSNode> = new Map();
  public visitCount: number = 0;
  public valueSum: number = 0;
  public prior: number = 0;
  public isExpanded: boolean = false;
  public action: OthelloAction | null = null;

  // 节点池化标记
  public isInUse: boolean = false;

  constructor() {
    this.reset();
  }
  
  /**
   * 重置节点状态（用于池化重用）
   */
  reset(): void {
    this.boardState = new CompressedBoardState();
    this.player = 'B';
    this.parent = null;
    this.children = new Map();
    this.visitCount = 0;
    this.valueSum = 0;
    this.prior = 0;
    this.isExpanded = false;
    this.action = null;
    this.isInUse = false;
  }
  
  /**
   * 初始化节点
   */
  initialize(
    board: OthelloBoard,
    player: OthelloPlayer,
    parent: OptimizedMCTSNode | null = null,
    prior: number = 0,
    action: OthelloAction | null = null
  ): void {
    this.boardState.fromBoard(board);
    this.player = player;
    this.parent = parent;
    this.children.clear();
    this.visitCount = 0;
    this.valueSum = 0;
    this.prior = prior;
    this.isExpanded = false;
    this.action = action;
    this.isInUse = true;
  }
  
  /**
   * 获取平均价值
   */
  get averageValue(): number {
    return this.visitCount === 0 ? 0 : this.valueSum / this.visitCount;
  }
  
  /**
   * 检查是否为叶子节点
   */
  isLeaf(): boolean {
    return this.children.size === 0;
  }
  
  /**
   * 计算UCB1分数
   */
  getUCB1Score(cPuct: number, parentVisits: number): number {
    if (this.visitCount === 0) {
      return this.prior * cPuct * Math.sqrt(parentVisits);
    }
    
    const exploitation = this.averageValue;
    const exploration = cPuct * this.prior * Math.sqrt(parentVisits) / (1 + this.visitCount);
    
    return exploitation + exploration;
  }
  
  /**
   * 选择最佳子节点
   */
  selectBestChild(cPuct: number): OptimizedMCTSNode {
    let bestChild: OptimizedMCTSNode | null = null;
    let bestScore = -Infinity;
    
    for (const child of this.children.values()) {
      const score = child.getUCB1Score(cPuct, this.visitCount);
      if (score > bestScore) {
        bestScore = score;
        bestChild = child;
      }
    }
    
    return bestChild!;
  }
  
  /**
   * 回传价值
   */
  backpropagate(value: number): void {
    this.visitCount++;
    this.valueSum += value;
  }
  
  /**
   * 获取访问次数分布
   */
  getVisitCounts(): number[] {
    const visitCounts = new Array(64).fill(0);
    
    for (const child of this.children.values()) {
      if (child.action) {
        const actionIndex = child.action.row * 8 + child.action.col;
        visitCounts[actionIndex] = child.visitCount;
      }
    }
    
    return visitCounts;
  }
}

/**
 * MCTS节点池
 */
class MCTSNodePool {
  private pool: OptimizedMCTSNode[] = [];
  private maxPoolSize: number = 10000; // 最大池大小
  
  /**
   * 获取节点（从池中获取或创建新节点）
   */
  getNode(): OptimizedMCTSNode {
    // 尝试从池中获取未使用的节点
    for (const node of this.pool) {
      if (!node.isInUse) {
        node.reset();
        return node;
      }
    }
    
    // 池中没有可用节点，创建新节点
    if (this.pool.length < this.maxPoolSize) {
      const newNode = new OptimizedMCTSNode();
      this.pool.push(newNode);
      return newNode;
    }
    
    // 池已满，强制重用最旧的节点
    const oldestNode = this.pool[0];
    oldestNode.reset();
    return oldestNode;
  }
  
  /**
   * 释放节点回池
   */
  releaseNode(node: OptimizedMCTSNode): void {
    node.isInUse = false;
    // 清理子节点引用
    for (const child of node.children.values()) {
      this.releaseNode(child);
    }
    node.children.clear();
  }
  
  /**
   * 清理整个池
   */
  clear(): void {
    for (const node of this.pool) {
      node.reset();
    }
  }
  
  /**
   * 获取池状态信息
   */
  getPoolStats(): { total: number; inUse: number; available: number } {
    const inUse = this.pool.filter(node => node.isInUse).length;
    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse
    };
  }
}

/**
 * MCTS配置接口
 */
export interface OptimizedMCTSConfig {
  numSimulations: number;
  cPuct: number;
  dirichletAlpha: number;
  noiseWeight: number;
  temperature: number;
  enableMemoryMonitoring: boolean;
  memoryThresholdMB: number;
}

/**
 * 内存优化的MCTS实现
 */
export class OptimizedAlphaZeroMCTS {
  private config: OptimizedMCTSConfig;
  private network: IAlphaZeroNetwork;
  private nodePool: MCTSNodePool;
  private stateCache: Map<string, { value: number; policy: number[] }>;
  
  constructor(network: IAlphaZeroNetwork, config: OptimizedMCTSConfig) {
    this.network = network;
    this.config = config;
    this.nodePool = new MCTSNodePool();
    this.stateCache = new Map();
  }
  
  /**
   * 执行MCTS搜索
   */
  search(board: OthelloBoard, player: OthelloPlayer): { actionProbs: number[]; rootValue: number } {
    const root = this.nodePool.getNode();
    root.initialize(board, player);

    try {
      // 执行指定次数的模拟
      for (let i = 0; i < this.config.numSimulations; i++) {
        this.simulate(root);

        // 内存监控
        if (this.config.enableMemoryMonitoring && i % 50 === 0) {
          this.checkMemoryUsage();
        }
      }

      // 获取访问次数分布
      const visitCounts = root.getVisitCounts();
      const totalVisits = visitCounts.reduce((sum, count) => sum + count, 0);

      // 转换为概率分布
      const actionProbs = visitCounts.map(count =>
        totalVisits > 0 ? count / totalVisits : 0
      );

      // 添加狄利克雷噪声（仅在根节点）
      if (this.config.noiseWeight > 0) {
        this.addDirichletNoise(actionProbs, board, player);
      }

      return {
        actionProbs,
        rootValue: root.averageValue
      };
    } finally {
      // 强制清理搜索树
      this.nodePool.releaseNode(root);

      // 定期清理状态缓存
      if (this.stateCache.size > 1000) {
        this.stateCache.clear();
      }
    }
  }

  /**
   * 执行单次模拟
   */
  private simulate(root: OptimizedMCTSNode): void {
    let node = root;
    const path: OptimizedMCTSNode[] = [node];

    // 选择阶段：沿着树向下选择到叶子节点
    while (node.isExpanded && !node.isLeaf()) {
      node = node.selectBestChild(this.config.cPuct);
      path.push(node);
    }

    // 扩展阶段：如果不是终端节点，则扩展
    let value: number;
    const board = node.boardState.toBoard();

    if (isGameOver(board)) {
      // 游戏结束，计算真实价值
      value = this.evaluateTerminalNode(node);
    } else {
      // 扩展节点并获取神经网络评估
      this.expandNode(node);

      // 使用缓存或网络预测
      const stateHash = node.boardState.getHash();
      let prediction = this.stateCache.get(stateHash);

      if (!prediction) {
        const boardTensor = this.network.boardToTensor(board, node.player);
        const networkPrediction = this.network.predict(boardTensor);
        boardTensor.dispose();

        prediction = {
          value: networkPrediction.value,
          policy: [...networkPrediction.policyProbs]
        };

        // 缓存预测结果
        this.stateCache.set(stateHash, prediction);
      }

      value = prediction.value;
    }

    // 回传阶段：沿路径向上更新所有节点
    for (let i = path.length - 1; i >= 0; i--) {
      path[i].backpropagate(value);
      value = -value; // 交替玩家，价值取反
    }
  }

  /**
   * 扩展节点
   */
  private expandNode(node: OptimizedMCTSNode): void {
    if (node.isExpanded) return;

    const board = node.boardState.toBoard();
    const legalActions = getLegalActions(board, node.player);

    if (legalActions.length === 0) {
      node.isExpanded = true;
      return;
    }

    // 获取神经网络预测
    const stateHash = node.boardState.getHash();
    let prediction = this.stateCache.get(stateHash);

    if (!prediction) {
      const boardTensor = this.network.boardToTensor(board, node.player);
      const networkPrediction = this.network.predict(boardTensor);
      boardTensor.dispose();

      prediction = {
        value: networkPrediction.value,
        policy: [...networkPrediction.policyProbs]
      };

      this.stateCache.set(stateHash, prediction);
    }

    // 为每个合法动作创建子节点
    for (const action of legalActions) {
      const actionIndex = action.row * 8 + action.col;
      const prior = prediction.policy[actionIndex];

      const newBoard = makeMove(board, action, node.player);
      const nextPlayer = node.player === 'B' ? 'W' : 'B';

      const childNode = this.nodePool.getNode();
      childNode.initialize(newBoard, nextPlayer, node, prior, action);

      const actionKey = `${action.row},${action.col}`;
      node.children.set(actionKey, childNode);
    }

    node.isExpanded = true;
  }

  /**
   * 评估终端节点
   */
  private evaluateTerminalNode(node: OptimizedMCTSNode): number {
    const board = node.boardState.toBoard();
    const { B, W } = countPieces(board);

    if (B > W) {
      return node.player === 'B' ? 1 : -1;
    } else if (W > B) {
      return node.player === 'W' ? 1 : -1;
    } else {
      return 0; // 平局
    }
  }

  /**
   * 添加狄利克雷噪声
   */
  private addDirichletNoise(actionProbs: number[], board: OthelloBoard, player: OthelloPlayer): void {
    const legalActions = getLegalActions(board, player);
    if (legalActions.length === 0) return;

    // 生成狄利克雷噪声
    const noise = this.generateDirichletNoise(legalActions.length, this.config.dirichletAlpha);

    // 将噪声添加到合法动作的概率上
    let noiseIndex = 0;
    for (const action of legalActions) {
      const actionIndex = action.row * 8 + action.col;
      actionProbs[actionIndex] = (1 - this.config.noiseWeight) * actionProbs[actionIndex] +
                                 this.config.noiseWeight * noise[noiseIndex];
      noiseIndex++;
    }
  }

  /**
   * 生成狄利克雷噪声
   */
  private generateDirichletNoise(size: number, alpha: number): number[] {
    const noise = new Array(size);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      // 简化的伽马分布采样
      noise[i] = Math.pow(-Math.log(Math.random()), alpha - 1);
      sum += noise[i];
    }

    // 归一化
    for (let i = 0; i < size; i++) {
      noise[i] /= sum;
    }

    return noise;
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const rssGB = memUsage.rss / 1024 / 1024 / 1024;

    if (rssGB > this.config.memoryThresholdMB / 1024) {
      console.log(`⚠️ MCTS内存使用过高: ${rssGB.toFixed(2)}GB，执行清理...`);

      // 清理状态缓存
      this.stateCache.clear();

      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * 获取内存统计信息
   */
  getMemoryStats(): { nodePool: any; stateCache: number; memoryUsage: any } {
    return {
      nodePool: this.nodePool.getPoolStats(),
      stateCache: this.stateCache.size,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * 清理所有资源
   */
  dispose(): void {
    this.nodePool.clear();
    this.stateCache.clear();

    if (global.gc) {
      global.gc();
    }
  }
}
