import * as fs from 'fs';
import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { createBoard, makeMove, checkWinner } from '../game';
import { Player, Action, Board } from '../types';

const QTABLE_X_PATH = 'models/tic-tac-toe/qtable-x.json';

function analyzeQTable(qtablePath: string) {
  if (!fs.existsSync(qtablePath)) {
    console.error('Q表文件不存在:', qtablePath);
    return;
  }
  const raw = fs.readFileSync(qtablePath, 'utf-8');
  const Q: Record<string, number[]> = JSON.parse(raw);
  const stateCount = Object.keys(Q).length;
  let qValueList: number[] = [];
  let ambiguousStates: string[] = [];
  for (const [state, qArr] of Object.entries(Q)) {
    qValueList.push(...qArr);
    // 策略不明确：多个动作Q值相等
    const maxQ = Math.max(...qArr);
    const bestActions = qArr.filter(q => q === maxQ).length;
    if (bestActions > 1) ambiguousStates.push(state);
  }
  // Q值分布统计
  const minQ = Math.min(...qValueList);
  const maxQ = Math.max(...qValueList);
  const avgQ = qValueList.reduce((a, b) => a + b, 0) / qValueList.length;
  console.log('Q表分析结果:');
  console.log('----------------');
  console.log('已覆盖状态数:', stateCount);
  console.log('Q值总数:', qValueList.length);
  console.log('Q值范围:', minQ.toFixed(3), '~', maxQ.toFixed(3));
  console.log('Q值均值:', avgQ.toFixed(3));
  console.log('策略不明确状态数:', ambiguousStates.length);
  if (ambiguousStates.length > 0) {
    console.log('示例不明确状态:', ambiguousStates.slice(0, 5));
  }
  // 典型局面策略输出
  const agent = new QLearningAgent('X', 0);
  agent.loadQTable(qtablePath);
  const demoBoards: Board[] = [
    createBoard(),
    // X先手中间
    [[null, null, null], [null, 'X', null], [null, null, null]],
    // X先手角落
    [['X', null, null], [null, null, null], [null, null, null]],
    // X对角，O中间
    [['X', null, null], [null, 'O', null], [null, null, 'X']],
  ];
  console.log('\n典型局面策略:');
  for (const board of demoBoards) {
    const action = agent.chooseAction(board, 'X');
    console.log('局面:');
    console.log(board.map(row => row.map(cell => cell || '-').join(' ')).join('\n'));
    console.log('推荐动作:', action);
    console.log('---');
  }
}

analyzeQTable(QTABLE_X_PATH); 