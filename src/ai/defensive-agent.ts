import { Board, Player, Action } from '../tic-tac-toe/types';
import { getLegalActions, makeMove, checkWinner } from '../tic-tac-toe/game';
import { Agent } from './random-agent';

export class DefensiveAgent implements Agent {
  chooseAction(board: Board, player: Player): Action {
    const actions = getLegalActions(board);
    const opponent = player === 'X' ? 'O' : 'X';

    // 1. 如果自己能赢，优先赢
    for (const action of actions) {
      const newBoard = makeMove(board, action, player);
      if (checkWinner(newBoard) === player) {
        return action;
      }
    }
    // 2. 如果对手下一步能赢，优先堵住
    for (const action of actions) {
      const newBoard = makeMove(board, action, opponent);
      if (checkWinner(newBoard) === opponent) {
        return action;
      }
    }
    // 3. 否则随机
    return actions[Math.floor(Math.random() * actions.length)];
  }
} 