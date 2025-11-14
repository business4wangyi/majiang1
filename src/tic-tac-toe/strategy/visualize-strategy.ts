import * as fs from 'fs';
import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { createBoard, getLegalActions, makeMove } from '../game';
import { Player, Action, Board } from '../types';

const QTABLE_X_PATH = 'models/tic-tac-toe/qtable-x.json';

function printBoard(board: Board) {
  console.log(board.map(row => row.map(cell => cell || '-').join(' ')).join('\n'));
}

function visualizeSingleState(agent: QLearningAgent, board: Board, player: Player) {
  const actions = getLegalActions(board);
  const key = board.flat().map(cell => cell ?? '-').join('');
  // 获取Q值分布
  // @ts-ignore
  const qArr = agent['Q'][key] || Array(actions.length).fill(0);
  console.log('当前局面:');
  printBoard(board);
  console.log('可选动作及Q值:');
  actions.forEach((action, idx) => {
    console.log(`动作: ${JSON.stringify(action)}, Q值: ${qArr[idx]?.toFixed(3)}`);
  });
  const bestIdx = qArr.reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
  console.log('推荐动作:', actions[bestIdx]);
}

function visualizeInitialStates(agent: QLearningAgent) {
  // 统计X先手所有初始动作的最优分布
  const board = createBoard();
  const actions = getLegalActions(board);
  const actionCount: Record<string, number> = {};
  for (let i = 0; i < actions.length; i++) {
    // X在每个位置先手
    const newBoard = makeMove(board, actions[i], 'X');
    const key = newBoard.flat().map(cell => cell ?? '-').join('');
    // @ts-ignore
    const qArr = agent['Q'][key] || Array(getLegalActions(newBoard).length).fill(0);
    const bestIdx = qArr.reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
    const bestAction = getLegalActions(newBoard)[bestIdx];
    const pos = actions[i].toString();
    const bestPos = bestAction ? bestAction.toString() : '无';
    actionCount[bestPos] = (actionCount[bestPos] || 0) + 1;
    console.log(`X先手落子${pos}后，推荐下一步: ${bestPos}`);
  }
  console.log('\nX先手后，推荐动作分布（热力图数据）：');
  Object.entries(actionCount).forEach(([pos, count]) => {
    console.log(`位置: ${pos}, 次数: ${count}`);
  });
}

function main() {
  const agent = new QLearningAgent('X', 0);
  agent.loadQTable(QTABLE_X_PATH);
  // 示例：可扩展为命令行参数输入
  console.log('【单局面策略可视化】');
  const demoBoard: Board = [
    [null, null, null],
    [null, 'X', null],
    [null, null, null],
  ];
  visualizeSingleState(agent, demoBoard, 'X');
  console.log('\n【X先手初始局面热力图数据】');
  visualizeInitialStates(agent);
}

main(); 