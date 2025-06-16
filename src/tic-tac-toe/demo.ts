import { createBoard, getLegalActions, makeMove, checkWinner } from './game';
import { Player } from './types';

let board = createBoard();
let currentPlayer: Player = 'X';
let stepCount = 0;
const startTime = Date.now();

console.log('初始棋盘:');
console.log(board);

while (true) {
  const actions = getLegalActions(board);
  if (actions.length === 0) break;

  // 随机落子
  const action = actions[Math.floor(Math.random() * actions.length)];
  board = makeMove(board, action, currentPlayer);
  stepCount++;

  console.log(`玩家${currentPlayer} 落子:`, action);
  console.log(board);

  const winner = checkWinner(board);
  if (winner) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(3);
    console.log('游戏结束，结果:', winner);
    console.log(`总步数: ${stepCount}`);
    console.log(`单局耗时: ${duration} 秒`);
    break;
  }
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
} 