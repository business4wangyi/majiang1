import { Board, Player, Action } from '../../core/types';
import { getLegalActions } from '../../core/game';

export interface Agent {
  chooseAction(board: Board, player: Player): Action;
}

export class RandomAgent implements Agent {
  chooseAction(board: Board, player: Player): Action {
    const actions = getLegalActions(board);
    return actions[Math.floor(Math.random() * actions.length)];
  }
} 