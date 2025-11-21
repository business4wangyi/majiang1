import { Board, Player, Action } from '../core/types';
import { getLegalActions, makeMove, checkWinner } from '../core/game';
import { Agent } from '../agents/random-agent';
import * as fs from 'fs';

type QTable = Record<string, number[]>;

function boardToKey(board: Board): string {
  return board.flat().map(cell => cell ?? '-').join('');
}

export class QLearningAgent implements Agent {
  private Q: QTable = {};
  public epsilon: number;
  private alpha: number;
  private gamma: number;
  private player: Player;

  constructor(player: Player, epsilon = 0.1, alpha = 0.5, gamma = 0.9) {
    this.player = player;
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.gamma = gamma;
  }

  chooseAction(board: Board, player: Player): Action {
    const actions = getLegalActions(board);
    const key = boardToKey(board);
    if (!this.Q[key]) this.Q[key] = Array(actions.length).fill(0);

    // epsilon-greedy
    if (Math.random() < this.epsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      const idx = this.Q[key].reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
      return actions[idx];
    }
  }

  // 训练一局
  trainEpisode(opponent: Agent) {
    let board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ] as Board;
    let currentPlayer: Player = 'X';
    let history: {key: string, actionIdx: number}[] = [];
    let actions: Action[] = [];
    while (true) {
      actions = getLegalActions(board);
      const key = boardToKey(board);
      if (!this.Q[key]) this.Q[key] = Array(actions.length).fill(0);
      let action: Action;
      let actionIdx: number;
      if (currentPlayer === this.player) {
        // 选择并记录动作
        if (Math.random() < this.epsilon) {
          actionIdx = Math.floor(Math.random() * actions.length);
        } else {
          actionIdx = this.Q[key].reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
        }
        action = actions[actionIdx];
        history.push({key, actionIdx});
      } else {
        action = opponent.chooseAction(board, currentPlayer);
      }
      board = makeMove(board, action, currentPlayer);
      const winner = checkWinner(board);
      if (winner) {
        // 奖励
        let reward = 0;
        if (winner === this.player) reward = 1;
        else if (winner !== 'Draw') reward = -1;
        // Q值回传
        for (let i = history.length - 1; i >= 0; i--) {
          const {key, actionIdx} = history[i];
          this.Q[key][actionIdx] += this.alpha * (reward - this.Q[key][actionIdx]);
          reward = this.Q[key][actionIdx] * this.gamma;
        }
        return winner; // 返回胜者
      }
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }
  }

  // 保存Q表到文件
  saveQTable(filepath: string) {
    fs.writeFileSync(filepath, JSON.stringify(this.Q), 'utf-8');
  }

  // 从文件加载Q表
  loadQTable(filepath: string) {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf-8');
      this.Q = JSON.parse(data);
    }
  }

  public setAlpha(alpha: number) {
    this.alpha = alpha;
  }
} 