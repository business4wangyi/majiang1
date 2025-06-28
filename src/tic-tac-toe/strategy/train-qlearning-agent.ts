import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { MinimaxAgent } from '@tic-tac-toe-strategy/minimax-agent';
import { RandomAgent } from '@tic-tac-toe-strategy/random-agent';
import { DefensiveAgent } from '@tic-tac-toe-strategy/defensive-agent';
import { GreedyAgent } from '@tic-tac-toe-strategy/greedy-agent';
import * as fs from 'fs';

const QTABLE_X_PATH = 'src/ai/models/qtable-x.json';
const agentX = new QLearningAgent('X', 0.2);
if (fs.existsSync(QTABLE_X_PATH)) agentX.loadQTable(QTABLE_X_PATH);

const trainingPlan = [
  { name: 'MinimaxAgent', agent: new MinimaxAgent(), episodes: 10000, epsilonStart: 0.1, alphaStart: 0.5 },
  { name: 'RandomAgent', agent: new RandomAgent(), episodes: 20000, epsilonStart: 0.2, alphaStart: 0.5 },
  { name: 'DefensiveAgent', agent: new DefensiveAgent(), episodes: 5000, epsilonStart: 0.1, alphaStart: 0.4 },
  { name: 'GreedyAgent', agent: new GreedyAgent(), episodes: 5000, epsilonStart: 0.1, alphaStart: 0.4 }
];

for (const { name, agent, episodes, epsilonStart, alphaStart } of trainingPlan) {
  console.log(`\n[训练] QLearningAgent vs ${name}，${episodes} 局...`);
  let win = 0, draw = 0, lose = 0;
  for (let i = 0; i < episodes; i++) {
    agentX.epsilon = Math.max(0.01, epsilonStart * (1 - i / episodes));
    agentX.setAlpha(Math.max(0.05, alphaStart * (1 - i / episodes)));
    const result = agentX.trainEpisode(agent);
    if (result === undefined) continue;
    if (result === 'X') win++;
    else if (result === 'O') lose++;
    else draw++;
  }
  agentX.saveQTable(QTABLE_X_PATH);
  console.log(`[Q表] 已保存 X 方 Q表: ${QTABLE_X_PATH}`);
  const total = win + draw + lose;
  console.log(`[统计] ${name} 阶段: 胜率 ${(win/total*100).toFixed(1)}% | 和棋率 ${(draw/total*100).toFixed(1)}% | 败率 ${(lose/total*100).toFixed(1)}%`);
}
console.log('全部训练完成！'); 