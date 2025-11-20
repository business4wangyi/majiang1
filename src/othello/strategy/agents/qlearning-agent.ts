// {{ AURA-X: Modify - 使用优化版本替换原始Q学习策略. Approval: 寸止(ID:1735819200). }}

import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from '../../core/game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from '../../core/types';
import { OthelloAgent } from '../agents/random-agent';
import {
  calculateFlips,
  getOpponent,
  evaluateBoard,
  calculatePositionValue,
  isCorner,
  isEdge
} from '../utils/strategy-utils';
import * as fs from 'fs';

/**
 * 优化的Q学习Othello智能体
 * 使用改进的Q学习算法，支持特征提取和完整棋盘两种状态表示
 */
export class QLearningOthelloAgent implements OthelloAgent {
  private Q: Record<string, number[]> = {};
  public epsilon: number;
  private alpha: number;
  private gamma: number;
  private player: OthelloPlayer;
  private useFeatureExtraction: boolean;

  /**
   * 构造函数
   * @param player 玩家标识（'B' 或 'W'）
   * @param epsilon 探索率（0-1之间）
   * @param alpha 学习率（0-1之间）
   * @param gamma 折扣因子（0-1之间）
   * @param useFeatureExtraction 是否使用特征提取（默认false，使用完整棋盘）
   */
  constructor(player: OthelloPlayer, epsilon = 0.1, alpha = 0.15, gamma = 0.95, useFeatureExtraction = false) {
    this.player = player;
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.gamma = gamma;
    this.useFeatureExtraction = useFeatureExtraction;
  }

  /**
   * 特征提取版本的状态编码 - 解决状态空间过大问题
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 特征字符串
   */
  private boardToFeatures(board: OthelloBoard, player: OthelloPlayer): string {
    const features: number[] = [];

    // 1. 棋子数量差 (归一化到[-1,1])
    const counts = countPieces(board);
    const totalPieces = counts.B + counts.W;
    const pieceDiff = totalPieces > 0 ? (counts[player] - counts[player === 'B' ? 'W' : 'B']) / totalPieces : 0;
    features.push(Math.round(pieceDiff * 100) / 100);

    // 2. 角落控制
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    let cornerControl = 0;
    for (const [r, c] of corners) {
      if (board[r][c] === player) cornerControl += 1;
      else if (board[r][c] && board[r][c] !== player) cornerControl -= 1;
    }
    features.push(cornerControl);

    // 3. 边缘控制
    let edgeControl = 0;
    let edgeTotal = 0;
    for (let i = 0; i < 8; i++) {
      for (const row of [0, 7]) {
        edgeTotal++;
        if (board[row][i] === player) edgeControl += 1;
        else if (board[row][i] && board[row][i] !== player) edgeControl -= 1;
      }
      for (const col of [0, 7]) {
        if (i !== 0 && i !== 7) {
          edgeTotal++;
          if (board[i][col] === player) edgeControl += 1;
          else if (board[i][col] && board[i][col] !== player) edgeControl -= 1;
        }
      }
    }
    features.push(Math.round((edgeControl / edgeTotal) * 100) / 100);

    // 4. 行动力
    const myMobility = getLegalActions(board, player).length;
    const opponentMobility = getLegalActions(board, getOpponent(player)).length;
    const totalMobility = myMobility + opponentMobility;
    const mobilityRatio = totalMobility > 0 ? (myMobility - opponentMobility) / totalMobility : 0;
    features.push(Math.round(mobilityRatio * 100) / 100);

    // 5. 游戏阶段
    const gameStage = totalPieces <= 20 ? 0 : totalPieces <= 45 ? 1 : 2;
    features.push(gameStage);

    return features.join(',');
  }

  /**
   * 传统的完整棋盘编码
   * @param board 棋盘状态
   * @returns 状态键字符串
   */
  private boardToKey(board: OthelloBoard): string {
    return board.flat().map(cell => cell ?? '-').join('');
  }

  /**
   * 获取状态键
   * @param board 棋盘状态
   * @param player 当前玩家
   * @returns 状态键字符串
   */
  private getStateKey(board: OthelloBoard, player: OthelloPlayer): string {
    return this.useFeatureExtraction ?
      this.boardToFeatures(board, player) :
      this.boardToKey(board);
  }

  /**
   * 选择动作（ε-贪心策略）
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作，如果无合法动作则返回null
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;

    const key = this.getStateKey(board, player);
    if (!this.Q[key]) {
      this.Q[key] = Array(actions.length).fill(0);
    }

    // ε-贪心策略
    if (Math.random() < this.epsilon) {
      // 探索：随机选择
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      // 利用：选择Q值最大的动作
      const maxQ = Math.max(...this.Q[key]);
      const bestIndices = this.Q[key]
        .map((q, i) => ({ q, i }))
        .filter(item => item.q === maxQ)
        .map(item => item.i);

      // 如果有多个最优动作，随机选择一个
      const selectedIdx = bestIndices[Math.floor(Math.random() * bestIndices.length)];
      return actions[selectedIdx];
    }
  }

  /**
   * 训练一局游戏
   * @param opponent 对手智能体
   * @returns 游戏结果
   */
  trainEpisode(opponent: OthelloAgent): OthelloPlayer | 'Draw' {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    const history: {
      state: string,
      actionIdx: number,
      nextState?: string
    }[] = [];

    while (!isGameOver(board)) {
      const actions = getLegalActions(board, currentPlayer);
      if (actions.length === 0) {
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }

      const state = this.getStateKey(board, currentPlayer);
      let action: OthelloAction;
      let actionIdx: number;

      if (currentPlayer === this.player) {
        if (!this.Q[state]) this.Q[state] = Array(actions.length).fill(0);
        if (Math.random() < this.epsilon) {
          actionIdx = Math.floor(Math.random() * actions.length);
        } else {
          actionIdx = this.Q[state].reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
        }
        action = actions[actionIdx];

        history.push({ state, actionIdx });
      } else {
        const opponentAction = opponent.chooseAction(board, currentPlayer);
        if (!opponentAction) {
          currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
          continue;
        }
        action = opponentAction;
      }

      board = makeMove(board, action, currentPlayer);

      // 为上一步设置下一状态
      if (history.length > 0 && currentPlayer !== this.player) {
        history[history.length - 1].nextState = this.getStateKey(board, this.player);
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    }

    // 结算最终奖励
    let winner = getWinner(board);
    if (winner === null) {
      const { B, W } = countPieces(board);
      if (B > W) winner = 'B';
      else if (W > B) winner = 'W';
      else winner = 'Draw';
    }

    let finalReward = 0;
    if (winner === this.player) finalReward = 1;        // 胜利奖励
    else if (winner === 'Draw') finalReward = 0;        // 平局无奖励
    else finalReward = -1;                              // 失败惩罚

    // 使用标准Q学习更新公式（简化版）
    let reward = finalReward;
    for (let i = history.length - 1; i >= 0; i--) {
      const { state, actionIdx, nextState } = history[i];

      // 计算下一状态的最大Q值
      let nextMaxQ = 0;
      if (nextState && this.Q[nextState]) {
        nextMaxQ = Math.max(...this.Q[nextState]);
      }

      // 标准Q学习更新公式：Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
      const currentQ = this.Q[state][actionIdx];
      const targetQ = reward + this.gamma * nextMaxQ;
      this.Q[state][actionIdx] = currentQ + this.alpha * (targetQ - currentQ);

      // 为下一次迭代准备奖励（衰减）
      reward *= this.gamma;
    }

    return winner;
  }

  /**
   * 设置是否使用特征提取
   * @param use 是否使用特征提取
   */
  setFeatureExtraction(use: boolean): void {
    this.useFeatureExtraction = use;
    // 清空Q表，因为状态表示改变了
    this.Q = {};
  }

  /**
   * 保存Q表到文件
   * @param filepath 文件路径
   */
  saveQTable(filepath: string): void {
    const data = {
      Q: this.Q,
      metadata: {
        player: this.player,
        epsilon: this.epsilon,
        alpha: this.alpha,
        gamma: this.gamma,
        useFeatureExtraction: this.useFeatureExtraction,
        stateCount: Object.keys(this.Q).length,
        timestamp: new Date().toISOString()
      }
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 从文件加载Q表
   * @param filepath 文件路径
   */
  loadQTable(filepath: string): void {
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      this.Q = data.Q || data; // 兼容旧格式
      if (data.metadata) {
        this.useFeatureExtraction = data.metadata.useFeatureExtraction ?? this.useFeatureExtraction;
      }
      console.log(`已加载Q表: ${Object.keys(this.Q).length} 个状态`);
    }
  }

  /**
   * 获取Q表统计信息（安全版本，避免栈溢出）
   * @returns Q表统计信息
   */
  getQTableStats(): {
    stateCount: number;
    totalQValues: number;
    avgQValue: number;
    maxQValue: number;
    minQValue: number;
    nonZeroQValues: number;
    useFeatureExtraction: boolean;
  } {
    const states = Object.keys(this.Q);
    let totalQValues = 0;
    let qValueSum = 0;
    let maxQ = -Infinity;
    let minQ = Infinity;
    let nonZeroCount = 0;

    // 安全地处理大量Q值，避免栈溢出
    for (const state of states) {
      const qValues = this.Q[state];
      if (Array.isArray(qValues)) {
        for (const qValue of qValues) {
          totalQValues++;
          qValueSum += qValue;
          maxQ = Math.max(maxQ, qValue);
          minQ = Math.min(minQ, qValue);

          if (Math.abs(qValue) > 1e-10) nonZeroCount++;
        }
      }
    }

    return {
      stateCount: states.length,
      totalQValues,
      avgQValue: totalQValues > 0 ? qValueSum / totalQValues : 0,
      maxQValue: maxQ === -Infinity ? 0 : maxQ,
      minQValue: minQ === Infinity ? 0 : minQ,
      nonZeroQValues: nonZeroCount,
      useFeatureExtraction: this.useFeatureExtraction
    };
  }

  /**
   * 设置探索率
   * @param epsilon 新的探索率
   */
  setEpsilon(epsilon: number): void {
    this.epsilon = Math.max(0, Math.min(1, epsilon));
  }

  /**
   * 设置学习率
   * @param alpha 新的学习率
   */
  setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * 设置折扣因子
   * @param gamma 新的折扣因子
   */
  setGamma(gamma: number): void {
    this.gamma = Math.max(0, Math.min(1, gamma));
  }

  /**
   * 获取当前参数
   * @returns 当前的学习参数
   */
  getParameters(): {
    player: OthelloPlayer;
    epsilon: number;
    alpha: number;
    gamma: number;
  } {
    return {
      player: this.player,
      epsilon: this.epsilon,
      alpha: this.alpha,
      gamma: this.gamma
    };
  }
}
