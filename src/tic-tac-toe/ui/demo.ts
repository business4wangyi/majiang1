import { createBoard, getLegalActions, makeMove, checkWinner } from '../core/game';
import { Player } from '../core/types';

const GAMES = 1000;
let xWin = 0;
let oWin = 0;
let draw = 0;
let totalSteps = 0;
const startTime = Date.now();

for (let g = 0; g < GAMES; g++) {
  let board = createBoard();
  let currentPlayer: Player = 'X';
  let stepCount = 0;
  while (true) {
    const actions = getLegalActions(board);
    if (actions.length === 0) break;
    // 随机落子
    const action = actions[Math.floor(Math.random() * actions.length)];
    board = makeMove(board, action, currentPlayer);
    stepCount++;
    const winner = checkWinner(board);
    if (winner) {
      if (winner === 'X') xWin++;
      else if (winner === 'O') oWin++;
      else draw++;
      totalSteps += stepCount;
      break;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}
const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(3);
console.log(`对弈总局数: ${GAMES}`);
console.log(`X胜: ${xWin} (${((xWin/GAMES)*100).toFixed(2)}%)`);
console.log(`O胜: ${oWin} (${((oWin/GAMES)*100).toFixed(2)}%)`);
console.log(`平局: ${draw} (${((draw/GAMES)*100).toFixed(2)}%)`);
console.log(`平均步数: ${(totalSteps/GAMES).toFixed(2)}`);
console.log(`总耗时: ${duration} 秒`);
console.log(`平均每局耗时: ${(parseFloat(duration)/GAMES*1000).toFixed(3)} 毫秒`); 