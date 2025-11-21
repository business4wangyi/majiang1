import { createBoard, makeMove, checkWinner } from '../core/game';
import { Player } from '../core/types';
import { RandomAgent } from '@tic-tac-toe-strategy/random-agent';
import { GreedyAgent } from '@tic-tac-toe-strategy/greedy-agent';
import { DefensiveAgent } from '@tic-tac-toe-strategy/defensive-agent';
import { MinimaxAgent } from '@tic-tac-toe-strategy/minimax-agent';
import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';

const GAMES = 1000;

// 选择对战双方
// const agentX = new MinimaxAgent();         // 你可以换成 RandomAgent/GreedyAgent/DefensiveAgent/QLearningAgent
const agentX = new QLearningAgent('X', 0);
const QTABLE_X_PATH = 'models/tic-tac-toe/qtable-x.json';
agentX.loadQTable(QTABLE_X_PATH);

const agentO = new DefensiveAgent();       // 你可以换成 RandomAgent/GreedyAgent/DefensiveAgent/QLearningAgent
// const agentO = new GreedyAgent();
// const agentO = new QLearningAgent('O', 0.1);
// const agentO = new RandomAgent();
// const agentO = new MinimaxAgent();

// const agentX = new MinimaxAgent();
// const agentO = new QLearningAgent('X', 0);
// const QTABLE_O_PATH = 'src/ai/models/qtable-o.json';
// agentO.loadQTable(QTABLE_O_PATH);

let xWin = 0, oWin = 0, draw = 0, totalSteps = 0;
const startTime = Date.now();

for (let g = 0; g < GAMES; g++) {
  let board = createBoard();
  let currentPlayer: Player = 'X';
  let stepCount = 0;
  while (true) {
    const action = (currentPlayer === 'X' ? agentX : agentO).chooseAction(board, currentPlayer);
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
console.log(`AI对弈总局数: ${GAMES}`);
console.log(`X胜: ${xWin} (${((xWin/GAMES)*100).toFixed(2)}%)`);
console.log(`O胜: ${oWin} (${((oWin/GAMES)*100).toFixed(2)}%)`);
console.log(`平局: ${draw} (${((draw/GAMES)*100).toFixed(2)}%)`);
console.log(`平均步数: ${(totalSteps/GAMES).toFixed(2)}`);
console.log(`总耗时: ${duration} 秒`);
console.log(`平均每局耗时: ${(parseFloat(duration)/GAMES*1000).toFixed(3)} 毫秒`); 