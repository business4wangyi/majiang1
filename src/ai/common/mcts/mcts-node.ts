/**
 * 通用MCTS节点
 * 
 * 不依赖具体游戏类型，通过适配器接口与游戏交互
 */

import { GameState, GameAction, GamePlayer, IGameAdapter } from './interfaces/game-adapter';

/**
 * MCTS节点类
 */
export class MCTSNode<State = GameState, Action = GameAction, Player = GamePlayer> {
  /** 游戏状态 */
  public state: State;
  /** 当前玩家 */
  public player: Player;
  /** 父节点 */
  public parent: MCTSNode<State, Action, Player> | null;
  /** 子节点映射 */
  public children: Map<string, MCTSNode<State, Action, Player>>;
  /** 访问次数 */
  public visitCount: number;
  /** 价值总和 */
  public valueSum: number;
  /** 先验概率 */
  public prior: number;
  /** 是否已扩展 */
  public isExpanded: boolean;
  /** 导致此状态的动作 */
  public action: Action | null;
  /** 游戏适配器 */
  private adapter: IGameAdapter;

  constructor(
    state: State,
    player: Player,
    adapter: IGameAdapter,
    parent: MCTSNode<State, Action, Player> | null = null,
    prior: number = 0,
    action: Action | null = null
  ) {
    this.state = adapter.cloneState(state);
    this.player = player;
    this.parent = parent;
    this.children = new Map();
    this.visitCount = 0;
    this.valueSum = 0;
    this.prior = prior;
    this.isExpanded = false;
    this.action = action;
    this.adapter = adapter;
  }

  /**
   * 获取平均价值
   */
  get averageValue(): number {
    return this.visitCount === 0 ? 0 : this.valueSum / this.visitCount;
  }

  /**
   * 计算UCB1分数（PUCT公式）
   */
  getUCB1Score(cPuct: number): number {
    if (this.visitCount === 0) {
      return Number.POSITIVE_INFINITY;
    }

    const exploitation = this.averageValue;
    const parentVisits = this.parent?.visitCount || 1;
    const exploration = cPuct * this.prior * Math.sqrt(parentVisits) / (1 + this.visitCount);
    
    return exploitation + exploration;
  }

  /**
   * 选择最佳子节点
   */
  selectBestChild(cPuct: number): MCTSNode<State, Action, Player> {
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestChild: MCTSNode<State, Action, Player> | null = null;

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
   * 是否为叶子节点
   */
  isLeaf(): boolean {
    return this.children.size === 0;
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
}


