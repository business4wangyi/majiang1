import { QLearningAgent } from '@tic-tac-toe-strategy/qlearning-agent';
import { MinimaxAgent } from '@tic-tac-toe-strategy/minimax-agent';
import { RandomAgent } from '@tic-tac-toe-strategy/random-agent';
import { DefensiveAgent } from '@tic-tac-toe-strategy/defensive-agent';
import { GreedyAgent } from '@tic-tac-toe-strategy/greedy-agent';
import * as fs from 'fs';
import * as path from 'path';

// 可复现随机数（简单LCG）
class LCG {
  constructor(private seed: number) { this.seed = (seed >>> 0) || 1; }
  random(): number { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 0x100000000; }
}

const SEED = Number(process.env.SEED || 12345);
const rng = new LCG(SEED);

const QTABLE_X_PATH = 'models/tic-tac-toe/qtable-x.json';
const LOG_DIR = 'logs/tictactoe';
const LOG_FILE = path.join(LOG_DIR, `qlearning_metrics.jsonl`);

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const agentX = new QLearningAgent('X', 0.2);
if (fs.existsSync(QTABLE_X_PATH)) agentX.loadQTable(QTABLE_X_PATH);

// 训练课程（课程学习）：从弱到强对手
const trainingPlan = [
  { name: 'RandomAgent', agent: new RandomAgent(), episodes: 20000, epsilonStart: 0.2, alphaStart: 0.5 },
  { name: 'GreedyAgent', agent: new GreedyAgent(), episodes: 10000, epsilonStart: 0.15, alphaStart: 0.45 },
  { name: 'DefensiveAgent', agent: new DefensiveAgent(), episodes: 8000, epsilonStart: 0.1, alphaStart: 0.4 },
  { name: 'MinimaxAgent', agent: new MinimaxAgent(), episodes: 6000, epsilonStart: 0.08, alphaStart: 0.35 }
];

function appendLog(record: any) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n');
}

for (const { name, agent, episodes, epsilonStart, alphaStart } of trainingPlan) {
  console.log(`\n[训练] QLearningAgent vs ${name}，${episodes} 局...`);
  let win = 0, draw = 0, lose = 0;
  const start = Date.now();
  for (let i = 0; i < episodes; i++) {
    // 线性衰减 + 地板值
    agentX.epsilon = Math.max(0.01, epsilonStart * (1 - i / episodes));
    agentX.setAlpha(Math.max(0.05, alphaStart * (1 - i / episodes)));
    // 随机化开局先手（基于seed）
    const firstIsX = rng.random() < 0.5;
    const result = firstIsX ? agentX.trainEpisode(agent) : agentX.trainEpisode(agent, 'O');
    if (result === undefined) continue;
    if (result === 'X') win++; else if (result === 'O') lose++; else draw++;

    // 每1000局记录一次阶段指标
    if ((i + 1) % 1000 === 0) {
      const total = win + draw + lose;
      appendLog({
        phase: name,
        episode: i + 1,
        winRate: total ? (win / total) : 0,
        drawRate: total ? (draw / total) : 0,
        loseRate: total ? (lose / total) : 0,
        epsilon: agentX.epsilon,
        alpha: (agentX as any).alpha || undefined,
        elapsedSec: (Date.now() - start) / 1000
      });
    }
  }
  agentX.saveQTable(QTABLE_X_PATH);
  console.log(`[Q表] 已保存 X 方 Q表: ${QTABLE_X_PATH}`);
  const total = win + draw + lose;
  console.log(`[统计] ${name} 阶段: 胜率 ${(win/total*100).toFixed(1)}% | 和棋率 ${(draw/total*100).toFixed(1)}% | 败率 ${(lose/total*100).toFixed(1)}%`);
  appendLog({ phase: name, summary: true, win, draw, lose, total, durationSec: (Date.now() - start) / 1000 });
}
console.log('全部训练完成！日志: ' + LOG_FILE);

