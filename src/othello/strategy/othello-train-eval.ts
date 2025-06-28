import { QLearningOthelloAgent } from './othello-play';
import { RandomOthelloAgent, OthelloAgent } from './random-agent';
import { GreedyOthelloAgent } from './othello-play';
import * as fs from 'fs';

const QTABLE_B_PATH = 'src/othello/qtable-b.json';
const QTABLE_W_PATH = 'src/othello/qtable-w.json';
const TRAIN_EPISODES = 5000;
const TEST_EPISODES = 200;

function trainQLearningAgent(agent: QLearningOthelloAgent, opponents: OthelloAgent[], episodes: number, qtablePath: string) {
  for (const opponent of opponents) {
    let win = 0, draw = 0, lose = 0;
    for (let i = 0; i < episodes; i++) {
      agent.epsilon = Math.max(0.01, 0.2 * (1 - i / episodes));
      const result = agent.trainEpisode(opponent);
      if (result === agent['player']) win++;
      else if (result === 'Draw') draw++;
      else lose++;
    }
    agent.saveQTable(qtablePath);
    const total = win + draw + lose;
    console.log(`[训练] QLearningOthelloAgent vs ${opponent.constructor.name}：胜率${(win/total*100).toFixed(1)}% | 平局率${(draw/total*100).toFixed(1)}% | 败率${(lose/total*100).toFixed(1)}%`);
  }
}

function evaluateAgent(agent: QLearningOthelloAgent, opponents: OthelloAgent[], episodes: number) {
  for (const opponent of opponents) {
    let win = 0, draw = 0, lose = 0;
    agent.epsilon = 0;
    for (let i = 0; i < episodes; i++) {
      const result = agent.trainEpisode(opponent);
      if (result === agent['player']) win++;
      else if (result === 'Draw') draw++;
      else lose++;
    }
    const total = win + draw + lose;
    console.log(`[评估] QLearningOthelloAgent vs ${opponent.constructor.name}：胜率${(win/total*100).toFixed(1)}% | 平局率${(draw/total*100).toFixed(1)}% | 败率${(lose/total*100).toFixed(1)}%`);
  }
}

// 训练B方
const agentB = new QLearningOthelloAgent('B', 0.2, 0.5, 0.9);
if (fs.existsSync(QTABLE_B_PATH)) agentB.loadQTable(QTABLE_B_PATH);
trainQLearningAgent(agentB, [new RandomOthelloAgent(), new GreedyOthelloAgent()], TRAIN_EPISODES, QTABLE_B_PATH);

// 训练W方
const agentW = new QLearningOthelloAgent('W', 0.2, 0.5, 0.9);
if (fs.existsSync(QTABLE_W_PATH)) agentW.loadQTable(QTABLE_W_PATH);
trainQLearningAgent(agentW, [new RandomOthelloAgent(), new GreedyOthelloAgent()], TRAIN_EPISODES, QTABLE_W_PATH);

// 评估
console.log('\n[评估] QLearningOthelloAgent (B)');
agentB.loadQTable(QTABLE_B_PATH);
evaluateAgent(agentB, [new RandomOthelloAgent(), new GreedyOthelloAgent()], TEST_EPISODES);

console.log('\n[评估] QLearningOthelloAgent (W)');
agentW.loadQTable(QTABLE_W_PATH);
evaluateAgent(agentW, [new RandomOthelloAgent(), new GreedyOthelloAgent()], TEST_EPISODES); 