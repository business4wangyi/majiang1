// {{ AURA-X: Add - 策略工具函数，提取重复的翻转计算逻辑. Approval: 寸止(ID:1735819200). }}

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../othello-types';
import { getLegalActions, makeMove, countPieces } from '../othello-game';

/**
 * 计算指定动作能翻转的棋子数量
 * @param board 当前棋盘状态
 * @param action 要执行的动作
 * @param player 当前玩家
 * @returns 能翻转的棋子数量
 */
export function calculateFlips(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer): number {
  let flips = 0;
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  
  // 8个方向的偏移量
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1]
  ];
  
  for (const [dx, dy] of directions) {
    let x = action.row + dx;
    let y = action.col + dy;
    let count = 0;
    
    // 沿着当前方向查找可翻转的棋子
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
      x += dx;
      y += dy;
      count++;
    }
    
    // 如果找到了己方棋子，则这个方向的棋子都可以翻转
    if (count > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
      flips += count;
    }
  }
  
  return flips;
}

/**
 * 计算位置价值分数
 * @param row 行坐标
 * @param col 列坐标
 * @returns 位置价值分数
 */
export function calculatePositionValue(row: number, col: number): number {
  // 角落位置价值最高
  if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
    return 100;
  }
  
  // 边缘位置价值较高
  if (row === 0 || row === 7 || col === 0 || col === 7) {
    return 10;
  }
  
  // 次边缘位置价值较低（容易被对手利用）
  if ((row === 1 || row === 6) && (col === 1 || col === 6)) {
    return -10;
  }
  
  // 其他位置价值中等
  return 1;
}

/**
 * 计算棋盘上的稳定子数量
 * @param board 当前棋盘状态
 * @param player 玩家
 * @returns 稳定子数量
 */
export function calculateStablePieces(board: OthelloBoard, player: OthelloPlayer): number {
  let stable = 0;
  
  // 简化版稳定子计算：只计算角落和与角落连通的边缘棋子
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  
  for (const [r, c] of corners) {
    if (board[r][c] === player) {
      stable += 10; // 角落本身
      
      // 检查与角落连通的边缘棋子
      if (r === 0) {
        // 上边
        for (let i = 1; i < 8; i++) {
          if (board[0][i] === player) stable += 2;
          else break;
        }
      }
      if (r === 7) {
        // 下边
        for (let i = 1; i < 8; i++) {
          if (board[7][i] === player) stable += 2;
          else break;
        }
      }
      if (c === 0) {
        // 左边
        for (let i = 1; i < 8; i++) {
          if (board[i][0] === player) stable += 2;
          else break;
        }
      }
      if (c === 7) {
        // 右边
        for (let i = 1; i < 8; i++) {
          if (board[i][7] === player) stable += 2;
          else break;
        }
      }
    }
  }
  
  return stable;
}

/**
 * 计算行动力（可选择的移动数量）
 * @param board 当前棋盘状态
 * @param player 玩家
 * @returns 可选择的移动数量
 */
export function calculateMobility(board: OthelloBoard, player: OthelloPlayer): number {
  return getLegalActions(board, player).length;
}

/**
 * 计算棋子数量差
 * @param board 当前棋盘状态
 * @param player 玩家
 * @returns 棋子数量差（己方 - 对方）
 */
export function calculatePieceDifference(board: OthelloBoard, player: OthelloPlayer): number {
  const counts = countPieces(board);
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  return counts[player] - counts[opponent];
}

/**
 * 计算边缘控制分数
 * @param board 当前棋盘状态
 * @param player 玩家
 * @returns 边缘控制分数
 */
export function calculateEdgeControl(board: OthelloBoard, player: OthelloPlayer): number {
  let edgeScore = 0;
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  
  // 检查四条边（排除角落，因为角落在位置价值中已经计算）
  for (let i = 1; i < 7; i++) {
    // 上边
    if (board[0][i] === player) edgeScore += 5;
    else if (board[0][i] === opponent) edgeScore -= 5;
    
    // 下边
    if (board[7][i] === player) edgeScore += 5;
    else if (board[7][i] === opponent) edgeScore -= 5;
    
    // 左边
    if (board[i][0] === player) edgeScore += 5;
    else if (board[i][0] === opponent) edgeScore -= 5;
    
    // 右边
    if (board[i][7] === player) edgeScore += 5;
    else if (board[i][7] === opponent) edgeScore -= 5;
  }
  
  return edgeScore;
}

/**
 * 计算角落控制分数
 * @param board 当前棋盘状态
 * @param player 玩家
 * @returns 角落控制分数
 */
export function calculateCornerControl(board: OthelloBoard, player: OthelloPlayer): number {
  let cornerScore = 0;
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  const corners = [board[0][0], board[0][7], board[7][0], board[7][7]];
  
  for (const corner of corners) {
    if (corner === player) cornerScore += 50;
    else if (corner === opponent) cornerScore -= 50;
  }
  
  return cornerScore;
}

/**
 * 获取对手玩家
 * @param player 当前玩家
 * @returns 对手玩家
 */
export function getOpponent(player: OthelloPlayer): OthelloPlayer {
  return player === 'B' ? 'W' : 'B';
}

/**
 * 综合评估棋盘状态
 * @param board 当前棋盘状态
 * @param player 玩家
 * @param weights 各项指标的权重
 * @returns 综合评估分数
 */
export function evaluateBoard(
  board: OthelloBoard, 
  player: OthelloPlayer,
  weights: {
    pieceDiff?: number;
    corner?: number;
    edge?: number;
    mobility?: number;
    stability?: number;
  } = {}
): number {
  const defaultWeights = {
    pieceDiff: 1,
    corner: 10,
    edge: 2,
    mobility: 3,
    stability: 5,
    ...weights
  };
  
  const pieceDiff = calculatePieceDifference(board, player);
  const cornerScore = calculateCornerControl(board, player);
  const edgeScore = calculateEdgeControl(board, player);
  const mobility = calculateMobility(board, player);
  const stability = calculateStablePieces(board, player);
  
  return (
    pieceDiff * defaultWeights.pieceDiff +
    cornerScore * defaultWeights.corner +
    edgeScore * defaultWeights.edge +
    mobility * defaultWeights.mobility +
    stability * defaultWeights.stability
  );
}

/**
 * 检查位置是否为角落
 * @param row 行坐标
 * @param col 列坐标
 * @returns 是否为角落位置
 */
export function isCorner(row: number, col: number): boolean {
  return (row === 0 || row === 7) && (col === 0 || col === 7);
}

/**
 * 检查位置是否为边缘
 * @param row 行坐标
 * @param col 列坐标
 * @returns 是否为边缘位置
 */
export function isEdge(row: number, col: number): boolean {
  return row === 0 || row === 7 || col === 0 || col === 7;
}

/**
 * 创建位置键（用于角落检查等）
 * @param row 行坐标
 * @param col 列坐标
 * @returns 位置键字符串
 */
export function createPositionKey(row: number, col: number): string {
  return `${row},${col}`;
}
