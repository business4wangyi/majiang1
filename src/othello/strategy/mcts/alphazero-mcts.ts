// {{ AURA-X: Add - AlphaZero蒙特卡洛树搜索实现. Approval: 寸止(ID:开始AlphaZero实现). }}

/**
 * AlphaZero蒙特卡洛树搜索(MCTS)实现
 * 
 * 实现AlphaZero的核心搜索算法：
 * - 选择(Selection) - UCB1公式选择最优路径
 * - 扩展(Expansion) - 添加新节点
 * - 评估(Evaluation) - 神经网络评估
 * - 回传(Backpropagation) - 更新节点统计
 */

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { getLegalActions, makeMove, isGameOver, countPieces } from '../../core/game';
import { AlphaZeroNetwork, AlphaZeroPrediction, IAlphaZeroNetwork } from '../networks/alphazero-network';
import { AlphaZeroAdvancedNetwork } from '../networks/alphazero-network-advanced';

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
}

/**
 * 默认MCTS配置
 */
export const DEFAULT_MCTS_CONFIG: MCTSConfig = {
  numSimulations: 800,
  cPuct: 1.0,
  dirichletAlpha: 0.3,
  noiseWeight: 0.25,
  temperature: 1.0
};

/**
 * MCTS节点类
 */
class MCTSNode {
  /** 棋盘状态 */
  public board: OthelloBoard;
  /** 当前玩家 */
  public player: OthelloPlayer;
  /** 父节点 */
  public parent: MCTSNode | null;
  /** 子节点映射 */
  public children: Map<string, MCTSNode>;
  /** 访问次数 */
  public visitCount: number;
  /** 价值总和 */
  public valueSum: number;
  /** 先验概率 */
  public prior: number;
  /** 是否已扩展 */
  public isExpanded: boolean;
  /** 导致此状态的动作 */
  public action: OthelloAction | null;

  constructor(
    board: OthelloBoard,
    player: OthelloPlayer,
    parent: MCTSNode | null = null,
    prior: number = 0,
    action: OthelloAction | null = null
  ) {
    this.board = board.map(row => [...row]); // 深拷贝
    this.player = player;
    this.parent = parent;
    this.children = new Map();
    this.visitCount = 0;
    this.valueSum = 0;
    this.prior = prior;
    this.isExpanded = false;
    this.action = action;
  }

  /**
   * 获取平均价值
   */
  get averageValue(): number {
    return this.visitCount === 0 ? 0 : this.valueSum / this.visitCount;
  }

  /**
   * 计算UCB1分数
   */
  getUCB1Score(cPuct: number): number {
    if (this.visitCount === 0) {
      return Number.POSITIVE_INFINITY;
    }

    const exploitation = this.averageValue;
    const exploration = cPuct * this.prior * Math.sqrt(this.parent!.visitCount) / (1 + this.visitCount);
    
    return exploitation + exploration;
  }

  /**
   * 选择最佳子节点
   */
  selectBestChild(cPuct: number): MCTSNode {
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestChild: MCTSNode | null = null;

    for (const child of this.children.values()) {
      const score = child.getUCB1Score(cPuct);
      if (score > bestScore) {
        bestScore = score;
        bestChild = child;
      }
    }

    return bestChild!;
  }

  /**
   * 扩展节点
   * @returns 神经网络预测结果（用于避免重复调用）
   */
  expand(network: IAlphaZeroNetwork): AlphaZeroPrediction | null {
    if (this.isExpanded) return null;

    const legalActions = getLegalActions(this.board, this.player);
    
    if (legalActions.length === 0) {
      // 无合法动作，游戏结束或跳过
      this.isExpanded = true;
      return null;
    }

    // 获取神经网络预测
    const boardTensor = network.boardToTensor(this.board, this.player);
    const prediction = network.predict(boardTensor);
    boardTensor.dispose();

    // 为每个合法动作创建子节点
    for (const action of legalActions) {
      const actionIndex = action.row * 8 + action.col;
      const prior = prediction.policyProbs[actionIndex];
      
      const newBoard = makeMove(this.board, action, this.player);
      const nextPlayer = this.player === 'B' ? 'W' : 'B';
      
      const childNode = new MCTSNode(newBoard, nextPlayer, this, prior, action);
      const actionKey = `${action.row},${action.col}`;
      this.children.set(actionKey, childNode);
    }

    this.isExpanded = true;
    return prediction;
  }

  /**
   * 回传价值
   */
  backpropagate(value: number): void {
    this.visitCount++;
    this.valueSum += value;

    if (this.parent) {
      // 从对手角度看，价值需要取反
      this.parent.backpropagate(-value);
    }
  }

  /**
   * 是否为叶子节点
   */
  isLeaf(): boolean {
    return this.children.size === 0;
  }

  /**
   * 获取访问次数分布
   */
  getVisitCounts(): number[] {
    const counts = new Array(64).fill(0);
    
    for (const [actionKey, child] of this.children) {
      const [row, col] = actionKey.split(',').map(Number);
      const index = row * 8 + col;
      counts[index] = child.visitCount;
    }
    
    return counts;
  }
}

/**
 * AlphaZero蒙特卡洛树搜索类
 */
export class AlphaZeroMCTS {
  private network: IAlphaZeroNetwork;
  private config: MCTSConfig;

  constructor(network: IAlphaZeroNetwork, config: MCTSConfig = DEFAULT_MCTS_CONFIG) {
    this.network = network;
    this.config = { ...config };
  }

  /**
   * 执行MCTS搜索
   */
  search(board: OthelloBoard, player: OthelloPlayer): { actionProbs: number[]; rootValue: number } {
    const root = new MCTSNode(board, player);

    // 执行指定次数的模拟
    for (let i = 0; i < this.config.numSimulations; i++) {
      this.simulate(root);
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
  }

  /**
   * 执行单次模拟
   */
  private simulate(root: MCTSNode): void {
    let node = root;
    const path: MCTSNode[] = [node];

    // 选择阶段：沿着树向下选择到叶子节点
    while (node.isExpanded && !node.isLeaf()) {
      node = node.selectBestChild(this.config.cPuct);
      path.push(node);
    }

    // 扩展阶段：如果不是终端节点，则扩展
    let value: number;
    if (isGameOver(node.board)) {
      // 游戏结束，计算真实价值
      value = this.evaluateTerminalNode(node);
    } else {
      // 扩展节点并获取神经网络评估（避免重复调用）
      const prediction = node.expand(this.network);
      
      if (prediction) {
        // 使用expand()返回的预测结果，避免重复调用网络
        value = prediction.value;
      } else {
        // 节点已扩展或无法扩展，使用默认值
        value = 0;
      }
    }

    // 回传阶段：沿路径向上更新所有节点
    for (let i = path.length - 1; i >= 0; i--) {
      path[i].backpropagate(value);
      value = -value; // 交替玩家，价值取反
    }
  }

  /**
   * 评估终端节点
   */
  private evaluateTerminalNode(node: MCTSNode): number {
    const { B, W } = countPieces(node.board);
    
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
    
    let noiseIndex = 0;
    for (const action of legalActions) {
      const index = action.row * 8 + action.col;
      actionProbs[index] = (1 - this.config.noiseWeight) * actionProbs[index] + 
                          this.config.noiseWeight * noise[noiseIndex];
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

  /**
   * 根据温度参数选择动作
   */
  selectActionByTemperature(actionProbs: number[], temperature: number): number {
    if (temperature === 0) {
      // 贪心选择
      return actionProbs.indexOf(Math.max(...actionProbs));
    }

    // 应用温度
    const tempProbs = actionProbs.map(p => Math.pow(p, 1 / temperature));
    const sum = tempProbs.reduce((s, p) => s + p, 0);
    const normalizedProbs = tempProbs.map(p => p / sum);

    // 根据概率分布采样
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < normalizedProbs.length; i++) {
      cumulative += normalizedProbs[i];
      if (random <= cumulative) {
        return i;
      }
    }

    return normalizedProbs.length - 1;
  }
}
