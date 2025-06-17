import { Board, Player, Action } from '../tic-tac-toe/types';
import { getLegalActions } from '../tic-tac-toe/game';

export interface Agent {
  chooseAction(board: Board, player: Player): Action;
}

export class RandomAgent implements Agent {
  chooseAction(board: Board, player: Player): Action {
    const actions = getLegalActions(board);
    return actions[Math.floor(Math.random() * actions.length)];
  }
} 