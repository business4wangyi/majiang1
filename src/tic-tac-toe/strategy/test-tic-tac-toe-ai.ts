import { createBoard, makeMove, checkWinner } from '../game';
import { Player } from '../types';
import { RandomAgent } from '@tic-tac-toe-strategy/random-agent';
import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { MinimaxAgent } from '@tic-tac-toe-strategy/minimax-agent';
import { DefensiveAgent } from '@tic-tac-toe-strategy/defensive-agent';
import * as fs from 'fs';

const TRAIN_EPISODES = 100000;
const TEST_EPISODES = 1000;
const QTABLE_X_PATH = 'src/ai/models/qtable-x.json';
const QTABLE_O_PATH = 'src/ai/models/qtable-o.json';

// 1. 实例化智能体
const agentX = new QLearningAgent('X', 0.1); // 训练时允许探索
// const agentX = new MinimaxAgent();
// const agentX = new DefensiveAgent();
// const agentX = new GreedyAgent();
// const agentO = new QLearningAgent('O', 0.1); // 训练时允许探索
// const agentO = new GreedyAgent();
// const agentO = new DefensiveAgent();
// const agentO = new MinimaxAgent();
const agentO = new RandomAgent();

// 2. 自动检测并加载Q表
if (fs.existsSync(QTABLE_X_PATH)) {
  agentX.loadQTable(QTABLE_X_PATH);
  console.log(`[Q表] 已加载 X 方 Q表: ${QTABLE_X_PATH}`);
} else {
  console.log(`[Q表] 未检测到 X 方 Q表，将从头训练。`);
}
// if (fs.existsSync(QTABLE_O_PATH)) {
//   agentO.loadQTable(QTABLE_O_PATH);
//   console.log(`[Q表] 已加载 O 方 Q表: ${QTABLE_O_PATH}`);
// }

// 3. 训练阶段（X和O都用Q-learning）
console.log(`开始训练 QLearningAgent（X方）与 QLearningAgent（O方）对弈 ${TRAIN_EPISODES} 局...`);
for (let i = 0; i < TRAIN_EPISODES; i++) {
  agentX.trainEpisode(agentO);
//   agentO.trainEpisode(agentX);
}
console.log('训练完成！');

// 4. 自动保存Q表
agentX.saveQTable(QTABLE_X_PATH);
console.log(`[Q表] 已保存 X 方 Q表: ${QTABLE_X_PATH}`);
// agentO.saveQTable(QTABLE_O_PATH);
// console.log(`[Q表] 已保存 O 方 Q表: ${QTABLE_O_PATH}`);

// 5. 评估阶段（关闭探索）
agentX.epsilon = 0;
// agentO.epsilon = 0;
let xWin = 0, oWin = 0, draw = 0, totalSteps = 0;
const startTime = Date.now();
for (let g = 0; g < TEST_EPISODES; g++) {
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
console.log(`\n评估结果（QLearningAgent X vs QLearningAgent O）：`);
console.log(`对弈总局数: ${TEST_EPISODES}`);
console.log(`X胜: ${xWin} (${((xWin/TEST_EPISODES)*100).toFixed(2)}%)`);
console.log(`O胜: ${oWin} (${((oWin/TEST_EPISODES)*100).toFixed(2)}%)`);
console.log(`平局: ${draw} (${((draw/TEST_EPISODES)*100).toFixed(2)}%)`);
console.log(`平均步数: ${(totalSteps/TEST_EPISODES).toFixed(2)}`);
console.log(`总耗时: ${duration} 秒`);
console.log(`平均每局耗时: ${(parseFloat(duration)/TEST_EPISODES*1000).toFixed(3)} 毫秒`); 