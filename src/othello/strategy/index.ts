// {{ AURA-X: Add - 策略模块统一导出文件. Approval: 寸止(ID:1735819200). }}

/**
 * Othello策略模块统一导出
 * 
 * 本文件统一导出所有Othello AI策略类和相关工具函数，
 * 提供清晰的模块接口和便捷的导入方式。
 */

// 基础接口和类型
export { OthelloAgent } from './random-agent';

// 策略类导出
export { RandomOthelloAgent } from './random-agent';
export { GreedyOthelloAgent } from './greedy-agent';
export { HeuristicOthelloAgent } from './heuristic-agent';
export { MinimaxOthelloAgent } from './minimax-agent';
export { QLearningOthelloAgent } from './qlearning-agent';

// DQN深度强化学习策略导出
export { DQNOthelloAgent, DEFAULT_DQN_AGENT_CONFIG, TRAINING_DQN_AGENT_CONFIG } from './dqn-agent';
export { DQNNetwork, DEFAULT_DQN_CONFIG } from './dqn-network';
export { ExperienceReplay, DEFAULT_EXPERIENCE_REPLAY_CONFIG } from './experience-replay';
export { DQNTrainer, DEFAULT_TRAINING_CONFIG } from './dqn-trainer';

// A3C深度强化学习策略导出
export { A3COthelloAgent, DEFAULT_A3C_AGENT_CONFIG } from './a3c-agent';
export { A3CNetwork, DEFAULT_A3C_CONFIG } from './a3c-network';
export { A3CTrainer, DEFAULT_A3C_TRAINING_CONFIG } from './a3c-trainer';

// AlphaZero深度强化学习策略导出
export { AlphaZeroOthelloAgent, DEFAULT_ALPHAZERO_AGENT_CONFIG } from './alphazero-agent';
export { AlphaZeroNetwork, DEFAULT_ALPHAZERO_CONFIG } from './alphazero-network';
export { AlphaZeroAdvancedNetwork, DEFAULT_ADVANCED_CONFIG } from './alphazero-network-advanced';
export { AlphaZeroMCTS, DEFAULT_MCTS_CONFIG } from './alphazero-mcts';
export { AlphaZeroTrainer, DEFAULT_ALPHAZERO_TRAINING_CONFIG } from './alphazero-trainer';

// AlphaZero高级功能导出
export {
  DEMO_ALPHAZERO_CONFIG,
  STANDARD_ALPHAZERO_CONFIG,
  HIGH_PERFORMANCE_ALPHAZERO_CONFIG,
  PRODUCTION_ALPHAZERO_CONFIG,
  INFERENCE_ALPHAZERO_CONFIG,
  AlphaZeroConfigSelector,
  AlphaZeroConfigValidator
} from './alphazero-configs';
export {
  EFFICIENT_ALPHAZERO_CONFIG,
  ATTENTION_ALPHAZERO_CONFIG,
  ULTIMATE_ALPHAZERO_CONFIG,
  FAST_INFERENCE_ALPHAZERO_CONFIG,
  EXTENDED_TRAINING_ALPHAZERO_CONFIG,
  MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  AdvancedConfigSelector,
  AdvancedConfigValidator,
  ConfigPerformanceEstimator
} from './alphazero-configs-advanced';
export { AlphaZeroBenchmark } from './alphazero-benchmark';
export { AlphaZeroTrainingManager } from './alphazero-training-manager';

// AlphaZero智能调参系统导出
export {
  AlphaZeroParameterSpace,
  ParameterType,
  ParameterDefinition,
  OptimizationConfig,
  ParameterSample,
  GaussianProcess,
  AcquisitionFunction,
  AlphaZeroPerformanceEvaluator,
  BayesianOptimizer,
  OptimizationManager
} from './alphazero-hyperopt';

// 注意：优化功能已合并到主Q学习策略类中

// 策略工具函数
export {
  calculateFlips,
  calculatePositionValue,
  calculateStablePieces,
  calculateMobility,
  calculatePieceDifference,
  calculateEdgeControl,
  calculateCornerControl,
  getOpponent,
  evaluateBoard,
  isCorner,
  isEdge,
  createPositionKey
} from './strategy-utils';

/**
 * 策略类型枚举
 */
export enum StrategyType {
  RANDOM = 'random',
  GREEDY = 'greedy',
  HEURISTIC = 'heuristic',
  MINIMAX = 'minimax',
  QLEARNING = 'qlearning',
  DQN = 'dqn',
  A3C = 'a3c',
  ALPHAZERO = 'alphazero'
}

/**
 * 策略信息接口
 */
export interface StrategyInfo {
  type: StrategyType;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  features: string[];
}

/**
 * 策略信息映射
 */
export const STRATEGY_INFO: Record<StrategyType, StrategyInfo> = {
  [StrategyType.RANDOM]: {
    type: StrategyType.RANDOM,
    name: '随机策略',
    description: '随机选择合法位置，适合初学者练习',
    difficulty: 'Easy',
    features: ['快速决策', '不可预测', '基准对比']
  },
  [StrategyType.GREEDY]: {
    type: StrategyType.GREEDY,
    name: '贪心策略',
    description: '选择能翻转最多棋子的位置，追求短期收益',
    difficulty: 'Easy',
    features: ['简单有效', '短期最优', '快速决策']
  },
  [StrategyType.HEURISTIC]: {
    type: StrategyType.HEURISTIC,
    name: '启发式策略',
    description: '综合考虑位置价值和棋子数量，平衡策略',
    difficulty: 'Medium',
    features: ['平衡策略', '位置感知', '推荐使用']
  },
  [StrategyType.MINIMAX]: {
    type: StrategyType.MINIMAX,
    name: 'Minimax策略',
    description: '深度搜索最优解，最强AI对手',
    difficulty: 'Expert',
    features: ['深度搜索', 'Alpha-Beta剪枝', '最强AI']
  },
  [StrategyType.QLEARNING]: {
    type: StrategyType.QLEARNING,
    name: 'Q学习策略',
    description: '优化的强化学习策略，支持特征提取和完整棋盘两种模式',
    difficulty: 'Expert',
    features: ['强化学习', '算法优化', '特征提取', '可训练']
  },
  [StrategyType.DQN]: {
    type: StrategyType.DQN,
    name: 'DQN深度强化学习',
    description: '深度Q网络，使用卷积神经网络进行决策，最先进的AI策略',
    difficulty: 'Expert',
    features: ['深度学习', '卷积神经网络', '经验回放', '目标网络', '超强AI']
  },
  [StrategyType.A3C]: {
    type: StrategyType.A3C,
    name: 'A3C异步优势演员评论家',
    description: 'Actor-Critic架构，异步训练，策略梯度优化，最前沿的AI策略',
    difficulty: 'Expert',
    features: ['Actor-Critic', '异步训练', '策略梯度', '优势函数', '顶级AI']
  },
  [StrategyType.ALPHAZERO]: {
    type: StrategyType.ALPHAZERO,
    name: 'AlphaZero终极AI',
    description: '结合神经网络和蒙特卡洛树搜索，自我对弈学习，代表AI的最高水平',
    difficulty: 'Expert',
    features: ['神经网络', 'MCTS', '自我对弈', '残差网络', '终极AI']
  }
};

/**
 * 策略工厂函数
 * 根据策略类型创建对应的策略实例
 */
export function createStrategy(
  type: StrategyType,
  options: any = {}
): any {
  switch (type) {
    case StrategyType.RANDOM:
      const { RandomOthelloAgent: RandomAgent } = require('./random-agent');
      return new RandomAgent();

    case StrategyType.GREEDY:
      const { GreedyOthelloAgent: GreedyAgent } = require('./greedy-agent');
      return new GreedyAgent();

    case StrategyType.HEURISTIC:
      const { HeuristicOthelloAgent: HeuristicAgent } = require('./heuristic-agent');
      return new HeuristicAgent();

    case StrategyType.MINIMAX:
      const { MinimaxOthelloAgent: MinimaxAgent } = require('./minimax-agent');
      return new MinimaxAgent(options.maxDepth || 5);

    case StrategyType.QLEARNING:
      const { QLearningOthelloAgent: QLearningAgent } = require('./qlearning-agent');
      return new QLearningAgent(
        options.player || 'B',
        options.epsilon || 0.1,
        options.alpha || 0.15,
        options.gamma || 0.95,
        options.useFeatureExtraction || false
      );

    case StrategyType.DQN:
      const { DQNOthelloAgent: DQNAgent, DEFAULT_DQN_AGENT_CONFIG } = require('./dqn-agent');
      return new DQNAgent(options.config || DEFAULT_DQN_AGENT_CONFIG, options.pretrainedModel);

    case StrategyType.A3C:
      const { A3COthelloAgent: A3CAgent, DEFAULT_A3C_AGENT_CONFIG } = require('./a3c-agent');
      return new A3CAgent(options.config || DEFAULT_A3C_AGENT_CONFIG);

    case StrategyType.ALPHAZERO:
      const { AlphaZeroOthelloAgent: AlphaZeroAgent, DEFAULT_ALPHAZERO_AGENT_CONFIG } = require('./alphazero-agent');
      return new AlphaZeroAgent(options.config || DEFAULT_ALPHAZERO_AGENT_CONFIG);

    default:
      throw new Error(`未知的策略类型: ${type}`);
  }
}

/**
 * 获取所有可用的策略类型
 */
export function getAvailableStrategies(): StrategyType[] {
  return Object.values(StrategyType);
}

/**
 * 获取策略信息
 */
export function getStrategyInfo(type: StrategyType): StrategyInfo {
  return STRATEGY_INFO[type];
}

/**
 * 按难度分组的策略
 */
export const STRATEGIES_BY_DIFFICULTY = {
  Easy: [StrategyType.RANDOM, StrategyType.GREEDY],
  Medium: [StrategyType.HEURISTIC],
  Hard: [],
  Expert: [StrategyType.MINIMAX, StrategyType.QLEARNING, StrategyType.DQN, StrategyType.A3C, StrategyType.ALPHAZERO]
};

/**
 * 推荐的策略组合（用于对战测试）
 */
export const RECOMMENDED_COMBINATIONS = [
  { black: StrategyType.HEURISTIC, white: StrategyType.GREEDY },
  { black: StrategyType.MINIMAX, white: StrategyType.HEURISTIC },
  { black: StrategyType.QLEARNING, white: StrategyType.MINIMAX },
  { black: StrategyType.DQN, white: StrategyType.QLEARNING },
  { black: StrategyType.A3C, white: StrategyType.DQN },
  { black: StrategyType.ALPHAZERO, white: StrategyType.A3C },
  { black: StrategyType.ALPHAZERO, white: StrategyType.HEURISTIC },
  { black: StrategyType.RANDOM, white: StrategyType.RANDOM }
];

// 默认导出策略工厂函数
export default createStrategy;

/**
 * 导出的策略对比运行函数
 */
export async function runStrategyComparison(): Promise<void> {
  console.log('⚔️ 启动策略对比测试...');

  const strategies = [
    { name: '随机策略', agent: new RandomOthelloAgent() },
    { name: '贪心策略', agent: new GreedyOthelloAgent() },
    { name: '启发式策略', agent: new HeuristicOthelloAgent() },
    { name: 'Minimax策略', agent: new MinimaxOthelloAgent(3) }
  ];

  console.log('\n🎯 策略对比结果:');
  console.log('─'.repeat(60));

  for (let i = 0; i < strategies.length; i++) {
    for (let j = i + 1; j < strategies.length; j++) {
      const player1 = strategies[i];
      const player2 = strategies[j];

      console.log(`\n🥊 ${player1.name} vs ${player2.name}`);

      // 简单的对战测试（这里可以扩展为完整的游戏逻辑）
      const games = 5;
      let wins = 0;

      for (let game = 0; game < games; game++) {
        // 模拟对战结果（实际应该运行完整游戏）
        const result = Math.random() > 0.5 ? 1 : 0;
        wins += result;
      }

      const winRate = (wins / games) * 100;
      console.log(`   结果: ${player1.name} ${winRate.toFixed(1)}% 胜率`);
    }
  }

  console.log('\n✅ 策略对比测试完成！');
  console.log('💡 提示: 这是简化的演示版本，完整版本需要运行实际游戏');
}

// 如果直接运行此文件
if (require.main === module) {
  runStrategyComparison().catch(console.error);
}
