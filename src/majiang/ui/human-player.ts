import { Player, PlayerType } from '../core/player';

export class HumanPlayer extends Player {
  constructor(name: string) {
    super(0, name, PlayerType.HUMAN);
  }
} 