// {{ AURA-X: Add - Minimax策略智能体，从othello-play.ts分离. Approval: 寸止(ID:1735819200). }}

import { getLegalActions, makeMove, isGameOver, countPieces } from '../othello-game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from '../othello-types';
import { OthelloAgent } from './random-agent';
import { 
  calculateCornerControl, 
  calculateEdgeControl, 
  calculateMobility, 
  calculateStablePieces,
  getOpponent,
  evaluateBoard
} from './strategy-utils';

/**
 * Minimax/Alpha-Beta剪枝Othello智能体
 * 使用深度搜索和Alpha-Beta剪枝算法的最强AI策略
 * 能够预测多步后的局面，选择最优解
 */
export class MinimaxOthelloAgent implements OthelloAgent {
  private maxDepth: number;

  /**
   * 构造函数
   * @param maxDepth 最大搜索深度，默认为5
   */
  constructor(maxDepth = 5) {
    this.maxDepth = maxDepth;
  }

  /**
   * 选择动作
   * 使用Minimax算法和Alpha-Beta剪枝选择最优动作
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作，如果无合法动作则返回null
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;

    let bestScore = -Infinity;
    let bestAction = actions[0];

    for (const action of actions) {
      const newBoard = makeMove(board, action, player);
      const score = this.alphabeta(
        newBoard, 
        this.maxDepth - 1, 
        getOpponent(player), 
        player, 
        -Infinity, 
        Infinity
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Alpha-Beta剪枝算法
   * @param board 当前棋盘状态
   * @param depth 剩余搜索深度
   * @param currentPlayer 当前玩家
   * @param aiPlayer AI玩家（最大化玩家）
   * @param alpha Alpha值
   * @param beta Beta值
   * @returns 评估分数
   */
  private alphabeta(
    board: OthelloBoard, 
    depth: number, 
    currentPlayer: OthelloPlayer, 
    aiPlayer: OthelloPlayer, 
    alpha: number, 
    beta: number
  ): number {
    // 终止条件：达到最大深度或游戏结束
    if (depth === 0 || isGameOver(board)) {
      return this.evaluate(board, aiPlayer);
    }

    const actions = getLegalActions(board, currentPlayer);
    
    // 如果无合法动作，跳过当前玩家
    if (actions.length === 0) {
      return this.alphabeta(board, depth - 1, getOpponent(currentPlayer), aiPlayer, alpha, beta);
    }

    if (currentPlayer === aiPlayer) {
      // 最大化节点
      let value = -Infinity;
      for (const action of actions) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.max(
          value, 
          this.alphabeta(newBoard, depth - 1, getOpponent(currentPlayer), aiPlayer, alpha, beta)
        );
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break; // Beta剪枝
      }
      return value;
    } else {
      // 最小化节点
      let value = Infinity;
      for (const action of actions) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.min(
          value, 
          this.alphabeta(newBoard, depth - 1, getOpponent(currentPlayer), aiPlayer, alpha, beta)
        );
        beta = Math.min(beta, value);
        if (beta <= alpha) break; // Alpha剪枝
      }
      return value;
    }
  }

  /**
   * 评估棋盘状态
   * 综合考虑棋子差、角落、边缘、行动力、稳定子等因素
   * @param board 棋盘状态
   * @param player 评估的玩家
   * @returns 评估分数
   */
  private evaluate(board: OthelloBoard, player: OthelloPlayer): number {
    // 使用策略工具函数进行综合评估
    return evaluateBoard(board, player, {
      pieceDiff: 1,    // 棋子数量差权重
      corner: 10,      // 角落控制权重
      edge: 2,         // 边缘控制权重
      mobility: 3,     // 行动力权重
      stability: 5     // 稳定性权重
    });
  }

  /**
   * 详细评估（用于调试和分析）
   * @param board 棋盘状态
   * @param player 评估的玩家
   * @returns 详细的评估信息
   */
  evaluateDetailed(board: OthelloBoard, player: OthelloPlayer): {
    totalScore: number;
    pieceDifference: number;
    cornerScore: number;
    edgeScore: number;
    mobility: number;
    stability: number;
  } {
    const { B, W } = countPieces(board);
    const pieceDifference = player === 'B' ? B - W : W - B;
    const cornerScore = calculateCornerControl(board, player);
    const edgeScore = calculateEdgeControl(board, player);
    const mobility = calculateMobility(board, player);
    const stability = calculateStablePieces(board, player);

    const totalScore = pieceDifference + cornerScore * 10 + edgeScore * 2 + mobility * 3 + stability * 5;

    return {
      totalScore,
      pieceDifference,
      cornerScore,
      edgeScore,
      mobility,
      stability
    };
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getStrategyName(): string {
    return `Minimax策略(深度${this.maxDepth})`;
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getStrategyDescription(): string {
    return `使用Minimax算法和Alpha-Beta剪枝的深度搜索策略，搜索深度${this.maxDepth}层`;
  }

  /**
   * 获取最大搜索深度
   * @returns 最大搜索深度
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }

  /**
   * 设置最大搜索深度
   * @param depth 新的最大搜索深度
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = Math.max(1, Math.min(10, depth)); // 限制在1-10之间
  }

  /**
   * 获取最佳动作的详细信息
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 最佳动作的详细信息
   */
  getBestActionInfo(board: OthelloBoard, player: OthelloPlayer): {
    action: OthelloAction | null;
    score: number;
    reasoning: string;
    searchDepth: number;
  } {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) {
      return {
        action: null,
        score: 0,
        reasoning: '无合法动作可选择',
        searchDepth: 0
      };
    }

    let bestScore = -Infinity;
    let bestAction = actions[0];

    for (const action of actions) {
      const newBoard = makeMove(board, action, player);
      const score = this.alphabeta(
        newBoard, 
        this.maxDepth - 1, 
        getOpponent(player), 
        player, 
        -Infinity, 
        Infinity
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    const reasoning = `通过${this.maxDepth}层深度搜索，选择位置(${bestAction.row + 1}, ${bestAction.col + 1})，预期评估分数${bestScore.toFixed(1)}`;

    return {
      action: bestAction,
      score: bestScore,
      reasoning,
      searchDepth: this.maxDepth
    };
  }

  /**
   * 获取所有动作的评估分数
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 所有动作及其评估分数
   */
  getAllActionScores(board: OthelloBoard, player: OthelloPlayer): Array<{
    action: OthelloAction;
    score: number;
  }> {
    const actions = getLegalActions(board, player);
    
    return actions.map(action => {
      const newBoard = makeMove(board, action, player);
      const score = this.alphabeta(
        newBoard, 
        this.maxDepth - 1, 
        getOpponent(player), 
        player, 
        -Infinity, 
        Infinity
      );
      
      return { action, score };
    }).sort((a, b) => b.score - a.score);
  }
}
