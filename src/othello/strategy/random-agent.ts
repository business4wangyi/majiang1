import { OthelloBoard, OthelloPlayer, OthelloAction } from './othello-types';
import { getLegalActions } from './othello-game';

export interface OthelloAgent {
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null;
}

export class RandomOthelloAgent implements OthelloAgent {
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;
    return actions[Math.floor(Math.random() * actions.length)];
  }
} 