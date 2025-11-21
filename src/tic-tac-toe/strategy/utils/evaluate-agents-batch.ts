import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { MinimaxAgent } from '@tic-tac-toe-strategy/minimax-agent';
import { RandomAgent } from '@tic-tac-toe-strategy/random-agent';
import { GreedyAgent } from '@tic-tac-toe-strategy/greedy-agent';
import { DefensiveAgent } from '@tic-tac-toe-strategy/defensive-agent';
import { createBoard, makeMove, checkWinner } from '../core/game';
import { Player } from '../core/types';
import * as fs from 'fs';

const QTABLE_X_PATH = 'models/tic-tac-toe/qtable-x.json';
const TEST_EPISODES = 1000;

const agentsToTest = [
  { name: 'QLearningAgent', create: () => { const a = new QLearningAgent('X', 0); a.loadQTable(QTABLE_X_PATH); return a; } },
  { name: 'MinimaxAgent', create: () => new MinimaxAgent() }
];

const opponents = [
  { name: 'MinimaxAgent', agent: new MinimaxAgent() },
  { name: 'RandomAgent', agent: new RandomAgent() },
  { name: 'GreedyAgent', agent: new GreedyAgent() },
  { name: 'DefensiveAgent', agent: new DefensiveAgent() }
];

const results: any[] = [];

for (const agentInfo of agentsToTest) {
  for (const { name: oppName, agent: oppAgent } of opponents) {
    let xWin = 0, oWin = 0, draw = 0;
    for (let g = 0; g < TEST_EPISODES; g++) {
      let board = createBoard();
      let currentPlayer: Player = 'X';
      while (true) {
        const action = (currentPlayer === 'X' ? agentInfo.create() : oppAgent).chooseAction(board, currentPlayer);
        board = makeMove(board, action, currentPlayer);
        const winner = checkWinner(board);
        if (winner) {
          if (winner === 'X') xWin++;
          else if (winner === 'O') oWin++;
          else draw++;
          break;
        }
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      }
    }
    results.push({ agentX: agentInfo.name, agentO: oppName, xWin, oWin, draw });
    console.log(`[评估] ${agentInfo.name} vs ${oppName}：X胜${xWin}，O胜${oWin}，平局${draw}`);
  }
}

console.log('\n对比表格:');
console.log('| AgentX         | AgentO         | X胜率 | O胜率 | 平局率 |');
console.log('|----------------|----------------|-------|-------|--------|');
for (const r of results) {
  const total = r.xWin + r.oWin + r.draw;
  const xRate = ((r.xWin/total)*100).toFixed(2)+'%';
  const oRate = ((r.oWin/total)*100).toFixed(2)+'%';
  const dRate = ((r.draw/total)*100).toFixed(2)+'%';
  console.log(`| ${r.agentX.padEnd(14)} | ${r.agentO.padEnd(14)} | ${xRate.padEnd(5)} | ${oRate.padEnd(5)} | ${dRate.padEnd(6)} |`);
} 