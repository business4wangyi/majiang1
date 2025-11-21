import { Board, Player, Action } from '../core/types';
import { getLegalActions, makeMove, checkWinner } from '../core/game';
import { Agent } from '../agents/random-agent';

export class GreedyAgent implements Agent {
  chooseAction(board: Board, player: Player): Action {
    const actions = getLegalActions(board);
    // 1. 先看有没有一步能直接获胜
    for (const action of actions) {
      const newBoard = makeMove(board, action, player);
      if (checkWinner(newBoard) === player) {
        return action;
      }
    }
    // 2. 没有直接获胜的，随机选一个
    return actions[Math.floor(Math.random() * actions.length)];
  }
} 