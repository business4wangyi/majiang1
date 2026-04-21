import { AlphaZeroTrainingConfig } from './alphazero-trainer';
import { FastTrainingConfig } from './alphazero-trainer-fast';

export const ALPHAZERO_BASELINE_EVAL_PROFILE = 'baseline-eval-v1';
const profileLogOnceFlags = new Set<string>();

function resolveProfileName(rawValue: string | undefined): string {
  return (rawValue || '').trim().toLowerCase();
}

export function applyAlphaZeroTrainingProfile(
  config: AlphaZeroTrainingConfig,
  profileNameRaw: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): AlphaZeroTrainingConfig {
  const profileName = resolveProfileName(profileNameRaw);

  if (profileName !== ALPHAZERO_BASELINE_EVAL_PROFILE) {
    return config;
  }

  const selfPlayGames = Number(env.ALPHAZERO_SELFPLAY_GAMES) || 30;

  const nextConfig: AlphaZeroTrainingConfig = {
    ...config,
    totalIterations: Number(env.ALPHAZERO_TOTAL_ITERATIONS) || 20,
    selfPlayGames,
    trainingEpochs: Number(env.ALPHAZERO_TRAINING_EPOCHS) || 2,
    evaluationFrequency: Number(env.ALPHAZERO_EVAL_FREQUENCY) || 5,
    evaluationGames: Number(env.ALPHAZERO_EVALUATION_GAMES) || 30,
    evaluationMode: 'all-baselines',
    evalSwapSides: env.ALPHAZERO_EVAL_SWAP_SIDES !== 'false',
    seed: env.ALPHAZERO_SEED !== undefined ? Number(env.ALPHAZERO_SEED) : 20260419,
    saveFrequency: Number(env.ALPHAZERO_SAVE_FREQUENCY) || 10
  };
  if (!profileLogOnceFlags.has('standard-baseline-eval-v1')) {
    profileLogOnceFlags.add('standard-baseline-eval-v1');
    console.log(`🧩 [Profile] baseline-eval-v1 生效(standard): evaluationFrequency=${nextConfig.evaluationFrequency}, evalSwapSides=${nextConfig.evalSwapSides}, seed=${nextConfig.seed}`);
  }
  return nextConfig;
}

export function applyFastTrainingProfile(
  config: Partial<FastTrainingConfig>,
  profileNameRaw: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): Partial<FastTrainingConfig> {
  const profileName = resolveProfileName(profileNameRaw);

  if (profileName !== ALPHAZERO_BASELINE_EVAL_PROFILE) {
    return config;
  }

  const selfPlayGames = Number(env.ALPHAZERO_SELFPLAY_GAMES) || 30;

  const nextConfig: Partial<FastTrainingConfig> = {
    ...config,
    totalIterations: Number(env.ALPHAZERO_TOTAL_ITERATIONS) || 20,
    selfPlayGames,
    trainingEpochs: Number(env.ALPHAZERO_TRAINING_EPOCHS) || 2,
    earlyTrainingEpochs: Number(env.ALPHAZERO_EARLY_EPOCHS) || 2,
    lateTrainingEpochs: Number(env.ALPHAZERO_LATE_EPOCHS) || 2,
    evaluationFrequency: Number(env.ALPHAZERO_EVAL_FREQUENCY) || 5,
    evaluationGames: Number(env.ALPHAZERO_EVALUATION_GAMES) || 30,
    evaluationMode: 'all-baselines',
    evalSwapSides: env.ALPHAZERO_EVAL_SWAP_SIDES !== 'false',
    seed: env.ALPHAZERO_SEED !== undefined ? Number(env.ALPHAZERO_SEED) : 20260419,
    saveFrequency: Number(env.ALPHAZERO_SAVE_FREQUENCY) || 10
  };
  if (!profileLogOnceFlags.has('fast-baseline-eval-v1')) {
    profileLogOnceFlags.add('fast-baseline-eval-v1');
    console.log(`🧩 [Profile] baseline-eval-v1 生效(fast): evaluationFrequency=${nextConfig.evaluationFrequency}, evalSwapSides=${nextConfig.evalSwapSides}, seed=${nextConfig.seed}`);
  }
  return nextConfig;
}
