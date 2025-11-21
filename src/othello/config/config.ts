/**
 * 黑白棋游戏核心配置
 * 包含游戏规则、棋盘大小等核心参数
 */
export const OTHELLO_CONFIG = {
  /** 棋盘大小（8x8） */
  BOARD_SIZE: 8,
  
  /** 初始棋子数量（每个玩家2个） */
  INITIAL_PIECES: 2,
  
  /** 游戏结束条件：棋盘填满或双方都无法落子 */
  MAX_MOVES: 64,
} as const;

export type OthelloConfig = typeof OTHELLO_CONFIG;
