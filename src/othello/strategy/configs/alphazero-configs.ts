// {{ AURA-X: Add - AlphaZero优化配置，提供不同场景的最佳参数. Approval: 寸止(ID:按最优实践继续). }}

/**
 * AlphaZero优化配置
 * 
 * 提供针对不同场景优化的配置参数：
 * - 快速演示配置
 * - 标准训练配置  
 * - 高性能配置
 * - 生产级配置
 */

import { AlphaZeroNetworkConfig } from '../networks/alphazero-network';
import { MCTSConfig } from '../mcts/alphazero-mcts';
import { AlphaZeroAgentConfig } from '../agents/alphazero-agent';
import { AlphaZeroTrainingConfig } from '../trainers/alphazero-trainer';

/**
 * 快速演示配置 - 用于快速测试和演示
 */
export const DEMO_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.002,
    numResidualBlocks: 3,
    numFilters: 64,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 16
  } as AlphaZeroNetworkConfig,

  mctsConfig: {
    numSimulations: 50,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Demo',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: false
  },

  trainingConfig: {
    totalIterations: 10,
    selfPlayGames: 5,
    trainingEpochs: 3,
    experienceBufferSize: 1000,
    evaluationFrequency: 5,
    evaluationGames: 10,
    saveFrequency: 5,
    modelSavePath: 'src/othello/models/alphazero-demo',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 标准训练配置 - 平衡性能和训练时间
 */
export const STANDARD_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 6,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 32
  } as AlphaZeroNetworkConfig,

  mctsConfig: {
    numSimulations: 200,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Standard',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: false
  },

  trainingConfig: {
    totalIterations: 50,
    selfPlayGames: 15,
    trainingEpochs: 5,
    experienceBufferSize: 5000,
    evaluationFrequency: 10,
    evaluationGames: 20,
    saveFrequency: 10,
    modelSavePath: 'src/othello/models/alphazero-standard',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 高性能配置 - 追求最佳性能，需要更多计算资源
 */
export const HIGH_PERFORMANCE_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.0005,
    numResidualBlocks: 10,
    numFilters: 256,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 64
  } as AlphaZeroNetworkConfig,

  mctsConfig: {
    numSimulations: 800,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-HighPerf',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.05,
    verbose: false
  },

  trainingConfig: {
    totalIterations: 200,
    selfPlayGames: 50,
    trainingEpochs: 10,
    experienceBufferSize: 20000,
    evaluationFrequency: 20,
    evaluationGames: 50,
    saveFrequency: 20,
    modelSavePath: 'src/othello/models/alphazero-highperf',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 生产级配置 - DeepMind论文级别的配置
 */
export const PRODUCTION_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.0002,
    numResidualBlocks: 20,
    numFilters: 256,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 128
  } as AlphaZeroNetworkConfig,

  mctsConfig: {
    numSimulations: 1600,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Production',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.01,
    verbose: false
  },

  trainingConfig: {
    totalIterations: 1000,
    selfPlayGames: 100,
    trainingEpochs: 20,
    experienceBufferSize: 100000,
    evaluationFrequency: 50,
    evaluationGames: 100,
    saveFrequency: 50,
    modelSavePath: 'src/othello/models/alphazero-production',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 推理优化配置 - 针对已训练模型的推理优化
 */
export const INFERENCE_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001, // 推理时不使用
    numResidualBlocks: 10,
    numFilters: 256,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 1 // 单次推理
  } as AlphaZeroNetworkConfig,

  mctsConfig: {
    numSimulations: 400, // 平衡速度和质量
    cPuct: 1.0,
    dirichletAlpha: 0.0, // 推理时不使用噪声
    noiseWeight: 0.0,
    temperature: 0.1 // 低温度，更确定性
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Inference',
    isTraining: false,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: true // 显示搜索详情
  }
};

/**
 * 自适应配置选择器
 */
export class AlphaZeroConfigSelector {
  /**
   * 根据可用资源和目标选择最佳配置
   */
  static selectConfig(scenario: 'demo' | 'standard' | 'high-performance' | 'production' | 'inference') {
    switch (scenario) {
      case 'demo':
        return DEMO_ALPHAZERO_CONFIG;
      case 'standard':
        return STANDARD_ALPHAZERO_CONFIG;
      case 'high-performance':
        return HIGH_PERFORMANCE_ALPHAZERO_CONFIG;
      case 'production':
        return PRODUCTION_ALPHAZERO_CONFIG;
      case 'inference':
        return INFERENCE_ALPHAZERO_CONFIG;
      default:
        return STANDARD_ALPHAZERO_CONFIG;
    }
  }

  /**
   * 根据系统资源自动选择配置
   */
  static autoSelectConfig(): typeof STANDARD_ALPHAZERO_CONFIG {
    // 简单的资源检测逻辑
    const totalMemory = process.memoryUsage().heapTotal;
    const isHighMemory = totalMemory > 1024 * 1024 * 1024; // 1GB

    if (isHighMemory) {
      console.log('🚀 检测到充足内存，选择高性能配置');
      return HIGH_PERFORMANCE_ALPHAZERO_CONFIG;
    } else {
      console.log('⚡ 使用标准配置以平衡性能和资源消耗');
      return STANDARD_ALPHAZERO_CONFIG;
    }
  }

  /**
   * 创建自定义配置
   */
  static createCustomConfig(overrides: {
    networkOverrides?: Partial<AlphaZeroNetworkConfig>;
    mctsOverrides?: Partial<MCTSConfig>;
    agentOverrides?: Partial<AlphaZeroAgentConfig>;
    trainingOverrides?: Partial<AlphaZeroTrainingConfig>;
  }) {
    const base = STANDARD_ALPHAZERO_CONFIG;
    
    return {
      networkConfig: { ...base.networkConfig, ...overrides.networkOverrides },
      mctsConfig: { ...base.mctsConfig, ...overrides.mctsOverrides },
      agentConfig: { ...base.agentConfig, ...overrides.agentOverrides },
      trainingConfig: { ...base.trainingConfig, ...overrides.trainingOverrides }
    };
  }
}

/**
 * 配置验证器
 */
export class AlphaZeroConfigValidator {
  /**
   * 验证配置的合理性
   */
  static validateConfig(config: any): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // 检查网络配置
    if (config.networkConfig.numResidualBlocks < 3) {
      warnings.push('残差块数量过少，可能影响网络表达能力');
    }
    if (config.networkConfig.numResidualBlocks > 20) {
      warnings.push('残差块数量过多，可能导致训练困难');
    }

    // 检查MCTS配置
    if (config.mctsConfig.numSimulations < 50) {
      warnings.push('MCTS模拟次数过少，可能影响搜索质量');
    }
    if (config.mctsConfig.numSimulations > 2000) {
      warnings.push('MCTS模拟次数过多，可能导致搜索时间过长');
    }

    // 检查训练配置
    if (config.trainingConfig && config.trainingConfig.selfPlayGames < 5) {
      warnings.push('自我对弈局数过少，可能影响训练数据质量');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * 估算配置的资源需求
   */
  static estimateResourceRequirements(config: any): {
    memoryMB: number;
    trainingTimeHours: number;
    diskSpaceMB: number;
  } {
    const networkSize = config.networkConfig.numResidualBlocks * config.networkConfig.numFilters;
    const mctsComplexity = config.mctsConfig.numSimulations;
    
    // 简化的资源估算
    const memoryMB = Math.max(512, networkSize / 1000 + mctsComplexity / 10);
    const trainingTimeHours = config.trainingConfig ? 
      (config.trainingConfig.totalIterations * config.trainingConfig.selfPlayGames) / 100 : 0;
    const diskSpaceMB = networkSize / 10000 + (config.trainingConfig?.experienceBufferSize || 0) / 1000;

    return {
      memoryMB: Math.round(memoryMB),
      trainingTimeHours: Math.round(trainingTimeHours * 10) / 10,
      diskSpaceMB: Math.round(diskSpaceMB)
    };
  }
}
