import { GameSession } from './game-session';
import { AutoTrainResult } from './auto-train-result';

export type { AutoTrainPlayerStat, AutoTrainResult } from './auto-train-result';

export interface RunAutoTrainingOptions {
  rounds: number;
}

export interface RunAutoTrainingOutcome {
  session: GameSession;
  result: AutoTrainResult;
}

/**
 * CAP-CLI-TRAIN：训练/自动对弈入口走 Session（无 readline 硬耦合）。
 */
export async function runAutoTraining(
  options: RunAutoTrainingOptions
): Promise<RunAutoTrainingOutcome> {
  const rounds = options.rounds;
  if (!Number.isInteger(rounds) || rounds < 1) {
    throw new Error(`runAutoTraining: rounds must be integer >= 1, got ${rounds}`);
  }
  const session = GameSession.create({ mode: 'auto' });
  const result = await session.runRounds(rounds);
  return { session, result };
}
