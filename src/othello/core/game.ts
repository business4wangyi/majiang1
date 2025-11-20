import { OthelloBoard, OthelloPlayer, OthelloAction } from './types';

// 方向向量（8个方向）
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

// 初始化棋盘
export function createOthelloBoard(): OthelloBoard {
  const board: OthelloBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[3][3] = 'W';
  board[3][4] = 'B';
  board[4][3] = 'B';
  board[4][4] = 'W';
  return board;
}

// 判断落子是否合法
export function isLegalAction(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer): boolean {
  if (board[action.row][action.col] !== null) return false;
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  for (const [dx, dy] of directions) {
    let x = action.row + dx, y = action.col + dy;
    let hasOpponent = false;
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
      x += dx;
      y += dy;
      hasOpponent = true;
    }
    if (hasOpponent && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
      return true;
    }
  }
  return false;
}

// 获取所有合法落子
export function getLegalActions(board: OthelloBoard, player: OthelloPlayer): OthelloAction[] {
  const actions: OthelloAction[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isLegalAction(board, { row, col }, player)) {
        actions.push({ row, col });
      }
    }
  }
  return actions;
}

// 执行落子，返回新棋盘
export function makeMove(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer): OthelloBoard {
  const newBoard: OthelloBoard = board.map(row => row.slice());
  newBoard[action.row][action.col] = player;
  const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
  for (const [dx, dy] of directions) {
    let x = action.row + dx, y = action.col + dy;
    const toFlip: [number, number][] = [];
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && newBoard[x][y] === opponent) {
      toFlip.push([x, y]);
      x += dx;
      y += dy;
    }
    if (toFlip.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && newBoard[x][y] === player) {
      for (const [fx, fy] of toFlip) {
        newBoard[fx][fy] = player;
      }
    }
  }
  return newBoard;
}

// 判断游戏是否结束
export function isGameOver(board: OthelloBoard): boolean {
  return getLegalActions(board, 'B').length === 0 && getLegalActions(board, 'W').length === 0;
}

// 计算棋盘上双方棋子数
export function countPieces(board: OthelloBoard): { B: number; W: number } {
  let B = 0, W = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === 'B') B++;
      else if (board[row][col] === 'W') W++;
    }
  }
  return { B, W };
}

// 判断胜者
export function getWinner(board: OthelloBoard): OthelloPlayer | 'Draw' | null {
  if (!isGameOver(board)) return null;
  const { B, W } = countPieces(board);
  if (B > W) return 'B';
  if (W > B) return 'W';
  return 'Draw';
}

/**
 * 游戏结果
 */
export interface GameResult {
  winner: OthelloPlayer | 'Draw';
  finalScore: { B: number; W: number };
  moveCount: number;
}

/**
 * 黑白棋游戏类
 * 封装游戏状态和逻辑，类似麻将的 Game 类
 * 可以被训练器、基准测试、演示等复用
 */
export class OthelloGame {
  private board: OthelloBoard;
  private currentPlayer: OthelloPlayer;
  private moveCount: number;
  private passCount: number;
  private maxMoves: number;
  private moveHistory: Array<{ action: OthelloAction; player: OthelloPlayer; board: OthelloBoard }>;

  constructor(maxMoves: number = 60) {
    this.board = createOthelloBoard();
    this.currentPlayer = 'B';
    this.moveCount = 0;
    this.passCount = 0;
    this.maxMoves = maxMoves;
    this.moveHistory = [];
  }

  /**
   * 获取当前棋盘状态
   */
  getBoard(): OthelloBoard {
    return this.board.map(row => row.slice()); // 返回深拷贝
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): OthelloPlayer {
    return this.currentPlayer;
  }

  /**
   * 获取当前步数
   */
  getMoveCount(): number {
    return this.moveCount;
  }

  /**
   * 获取合法动作列表
   */
  getLegalActions(): OthelloAction[] {
    return getLegalActions(this.board, this.currentPlayer);
  }

  /**
   * 执行动作
   * @returns 是否成功执行
   */
  playAction(action: OthelloAction): boolean {
    const legalActions = this.getLegalActions();
    
    // 检查动作是否合法
    if (!legalActions.some(a => a.row === action.row && a.col === action.col)) {
      return false;
    }

    // 保存当前状态到历史
    this.moveHistory.push({
      action,
      player: this.currentPlayer,
      board: this.board.map(row => row.slice()) // 深拷贝
    });

    // 执行动作
    this.board = makeMove(this.board, action, this.currentPlayer);
    this.moveCount++;
    this.passCount = 0; // 重置跳过计数

    // 切换玩家
    this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';

    return true;
  }

  /**
   * 跳过当前回合（当没有合法动作时）
   */
  pass(): void {
    this.passCount++;
    this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
  }

  /**
   * 检查游戏是否结束
   */
  isGameOver(): boolean {
    if (this.passCount >= 2) return true; // 双方都跳过
    if (this.moveCount >= this.maxMoves) return true; // 达到最大步数
    return isGameOver(this.board);
  }

  /**
   * 获取游戏结果
   */
  getResult(): GameResult | null {
    if (!this.isGameOver()) return null;

    const { B, W } = countPieces(this.board);
    const winner = getWinner(this.board);

    return {
      winner: winner || 'Draw',
      finalScore: { B, W },
      moveCount: this.moveCount
    };
  }

  /**
   * 获取当前棋子数
   */
  getPieceCount(): { B: number; W: number } {
    return countPieces(this.board);
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.board = createOthelloBoard();
    this.currentPlayer = 'B';
    this.moveCount = 0;
    this.passCount = 0;
    this.moveHistory = [];
  }

  /**
   * 复制游戏状态（用于MCTS等场景）
   */
  copy(): OthelloGame {
    const game = new OthelloGame(this.maxMoves);
    game.board = this.board.map(row => row.slice());
    game.currentPlayer = this.currentPlayer;
    game.moveCount = this.moveCount;
    game.passCount = this.passCount;
    game.moveHistory = this.moveHistory.map(m => ({
      action: { ...m.action },
      player: m.player,
      board: m.board.map(row => row.slice())
    }));
    return game;
  }

  /**
   * 获取移动历史
   */
  getMoveHistory(): ReadonlyArray<{ action: OthelloAction; player: OthelloPlayer; board: OthelloBoard }> {
    return this.moveHistory;
  }
}