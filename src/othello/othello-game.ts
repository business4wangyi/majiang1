import { OthelloBoard, OthelloPlayer, OthelloAction } from './othello-types';

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