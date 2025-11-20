// Othello（黑白棋）基础类型定义

export type OthelloCell = 'B' | 'W' | null; // B=黑子，W=白子，null=空
export type OthelloBoard = OthelloCell[][]; // 8x8 棋盘
export type OthelloPlayer = 'B' | 'W';
export interface OthelloAction {
  row: number;
  col: number;
} 