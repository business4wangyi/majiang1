import { Board, Player, Action } from '../core/types';
import { getLegalActions, makeMove, checkWinner } from '../core/game';
import { Agent } from '@tic-tac-toe-strategy/random-agent';

export class MinimaxAgent implements Agent {
  chooseAction(board: Board, player: Player): Action {
    let bestScore = -Infinity;
    let bestAction: Action | null = null;
    for (const action of getLegalActions(board)) {
      const newBoard = makeMove(board, action, player);
      const score = this.alphabeta(newBoard, this.getOpponent(player), player, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    // 理论上bestAction不会为null
    return bestAction!;
  }

  alphabeta(
    board: Board,
    currentPlayer: Player,
    aiPlayer: Player,
    alpha: number,
    beta: number
  ): number {
    const winner = checkWinner(board);
    if (winner === aiPlayer) return 1;
    if (winner && winner !== 'Draw') return -1;
    if (winner === 'Draw') return 0;

    if (currentPlayer === aiPlayer) {
      let value = -Infinity;
      for (const action of getLegalActions(board)) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.max(value, this.alphabeta(newBoard, this.getOpponent(currentPlayer), aiPlayer, alpha, beta));
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break; // 剪枝
      }
      return value;
    } else {
      let value = Infinity;
      for (const action of getLegalActions(board)) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.min(value, this.alphabeta(newBoard, this.getOpponent(currentPlayer), aiPlayer, alpha, beta));
        beta = Math.min(beta, value);
        if (beta <= alpha) break; // 剪枝
      }
      return value;
    }
  }

  getOpponent(player: Player): Player {
    return player === 'X' ? 'O' : 'X';
  }
} 