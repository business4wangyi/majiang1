/**
 * 黑白棋AI策略模块
 * 统一导出所有策略相关的类和函数
 */

// 智能体
export * from './agents/random-agent';
export * from './agents/greedy-agent';
export * from './agents/heuristic-agent';
export * from './agents/minimax-agent';
export * from './agents/qlearning-agent';
export * from './agents/dqn-agent';
export * from './agents/a3c-agent';
export * from './agents/alphazero-agent';
export * from './agents/alphazero-agent-optimized';

// 网络
export * from './networks/dqn-network';
export * from './networks/a3c-network';
export * from './networks/alphazero-network';
export * from './networks/alphazero-network-advanced';

// 训练器
export { DQNTrainer, DQNTrainingConfig, runTraining as runDQNTraining } from './trainers/dqn-trainer';
export { A3CTrainer, A3CTrainingConfig, runTraining as runA3CTraining } from './trainers/a3c-trainer';
export { AlphaZeroTrainer, AlphaZeroTrainingConfig, DEFAULT_ALPHAZERO_TRAINING_CONFIG, runTraining } from './trainers/alphazero-trainer';
export * from './trainers/alphazero-trainer-optimized';
export * from './trainers/alphazero-training-manager';

// MCTS
export * from './mcts/alphazero-mcts';
export * from './mcts/alphazero-mcts-optimized';
export * from './mcts/alphazero-mcts-universal';
export * from './mcts/othello-game-adapter';

// 配置
export * from './configs/alphazero-configs';
export * from './configs/alphazero-configs-advanced';

// 工具
export * from './utils/strategy-utils';
export * from './utils/experience-replay';

// 基准测试和超参数优化
export * from './benchmark';
export * from './hyperopt';
