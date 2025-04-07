import { Player, PlayerType } from './player';

export class HumanPlayer extends Player {
  constructor(name: string) {
    super(0, name, PlayerType.HUMAN);
  }
} 