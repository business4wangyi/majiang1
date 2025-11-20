import { Board, Player, Action } from '../core/types';

// 创建初始棋盘
export function createBoard(): Board {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

// 获取所有合法动作
export function getLegalActions(board: Board): Action[] {
  const actions: Action[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        actions.push({ row, col });
      }
    }
  }
  return actions;
}

// 执行落子，返回新棋盘
export function makeMove(board: Board, action: Action, player: Player): Board {
  if (board[action.row][action.col] !== null) {
    throw new Error('无效的落子位置');
  }
  // 深拷贝棋盘
  const newBoard = board.map(row => row.slice());
  newBoard[action.row][action.col] = player;
  return newBoard;
}

// 判断胜负
export function checkWinner(board: Board): Player | 'Draw' | null {
  // 检查行、列、对角线
  for (let i = 0; i < 3; i++) {
    // 行
    if (
      board[i][0] &&
      board[i][0] === board[i][1] &&
      board[i][1] === board[i][2]
    ) {
      return board[i][0];
    }
    // 列
    if (
      board[0][i] &&
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    ) {
      return board[0][i];
    }
  }
  // 主对角线
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  ) {
    return board[0][0];
  }
  // 副对角线
  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  ) {
    return board[0][2];
  }
  // 平局
  if (isFull(board)) {
    return 'Draw';
  }
  // 未分胜负
  return null;
}

// 判断棋盘是否已满
export function isFull(board: Board): boolean {
  return board.every(row => row.every(cell => cell !== null));
} 