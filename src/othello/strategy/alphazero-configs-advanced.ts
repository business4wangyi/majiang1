// {{ AURA-X: Add - AlphaZero高级配置预设，基于深度可分离卷积和注意力机制. Approval: 寸止(ID:网络架构极限优化). }}

/**
 * AlphaZero高级配置预设
 * 
 * 提供基于最新深度学习技术的优化配置：
 * - 深度可分离卷积配置
 * - 自注意力机制配置
 * - 混合精度训练配置
 * - 性能极限优化配置
 */

import { AlphaZeroAgentConfig } from './alphazero-agent';
import { AdvancedNetworkConfig } from './alphazero-network-advanced';
import { MCTSConfig } from './alphazero-mcts';
import { AlphaZeroTrainingConfig } from './alphazero-trainer';

/**
 * 高效轻量级配置 - 深度可分离卷积优化
 */
export const EFFICIENT_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.002,
    numResidualBlocks: 6,
    numFilters: 96,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 32,
    useDepthwiseConv: true,
    useSelfAttention: false,
    numAttentionHeads: 4,
    useMixedPrecision: true,
    dropoutRate: 0.1,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 150,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Efficient',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 30,
    selfPlayGames: 20,
    trainingEpochs: 8,
    experienceBufferSize: 8000,
    evaluationFrequency: 5,
    evaluationGames: 15,
    saveFrequency: 10,
    modelSavePath: 'src/othello/models/alphazero-efficient',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 注意力增强配置 - 自注意力机制优化
 */
export const ATTENTION_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 8,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 32,
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 8,
    useMixedPrecision: true,
    dropoutRate: 0.15,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 300,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Attention',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.08,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 50,
    selfPlayGames: 30,
    trainingEpochs: 12,
    experienceBufferSize: 15000,
    evaluationFrequency: 8,
    evaluationGames: 20,
    saveFrequency: 10,
    modelSavePath: 'src/othello/models/alphazero-attention',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 极限性能配置 - 所有优化技术组合
 */
export const ULTIMATE_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.0008,
    numResidualBlocks: 12,
    numFilters: 192,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 64,
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 12,
    useMixedPrecision: true,
    dropoutRate: 0.2,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.15
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 600,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-Ultimate',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.05,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 100,
    selfPlayGames: 50,
    trainingEpochs: 20,
    experienceBufferSize: 30000,
    evaluationFrequency: 10,
    evaluationGames: 30,
    saveFrequency: 10,
    modelSavePath: 'src/othello/models/alphazero-ultimate',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 扩展训练配置 - 基于注意力增强网络的长期训练
 * {{ AURA-X: Add - 扩展训练规模配置，基于注意力增强网络突破. Approval: 寸止(ID:扩展训练规模). }}
 */
export const EXTENDED_TRAINING_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 8,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 32,
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 8,
    useMixedPrecision: true,
    dropoutRate: 0.15,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 300,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-ExtendedTraining',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.08,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 80,  // 从8轮扩展到80轮
    selfPlayGames: 50,    // 从30局增加到50局
    trainingEpochs: 15,   // 从12轮增加到15轮
    experienceBufferSize: 20000,  // 从15000增加到20000
    evaluationFrequency: 10,      // 每10轮评估一次
    evaluationGames: 25,          // 从20局增加到25局
    saveFrequency: 20,            // 每20轮保存一次
    modelSavePath: 'src/othello/models/alphazero-extended',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 内存优化训练配置 - 基于扩展训练的内存优化版本
 * {{ AURA-X: Add - 内存优化配置，解决OOM问题保持训练效果. Approval: 寸止(ID:内存优化训练). }}
 */
export const MEMORY_OPTIMIZED_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 8,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 16,        // 从32减少到16，减少内存使用
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 8,
    useMixedPrecision: true,
    dropoutRate: 0.15,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 300,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-MemoryOptimized',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.08,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 80,
    selfPlayGames: 40,    // 从50减少到40，减少内存压力
    trainingEpochs: 20,   // 从15增加到20，通过更多轮次补偿小批次
    experienceBufferSize: 10000,  // 从20000减少到10000
    evaluationFrequency: 10,
    evaluationGames: 20,  // 从25减少到20
    saveFrequency: 15,    // 从20减少到15，更频繁保存
    modelSavePath: 'src/othello/models/alphazero-memory-optimized',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 极限内存优化配置 - 基于35%胜率突破的极限优化版本
 * {{ AURA-X: Add - 极限内存优化配置，流式训练策略. Approval: 寸止(ID:极限内存优化). }}
 */
export const ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 8,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 8,         // 从16减少到8，极限内存优化
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 8,
    useMixedPrecision: true,
    dropoutRate: 0.15,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 300,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-UltraMemoryOptimized',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.08,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 80,
    selfPlayGames: 25,    // 从40减少到25，极限内存优化
    trainingEpochs: 25,   // 从20增加到25，通过更多轮次补偿
    experienceBufferSize: 5000,   // 从10000减少到5000，极限优化
    evaluationFrequency: 10,
    evaluationGames: 15,  // 从20减少到15
    saveFrequency: 10,    // 从15减少到10，更频繁保存
    modelSavePath: 'src/othello/models/alphazero-ultra-optimized',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 超极限内存优化配置 - 基于44%胜率突破的最激进优化版本
 * {{ AURA-X: Add - 超极限内存优化配置，批次大小4+流式清理. Approval: 寸止(ID:超极限内存优化). }}
 */
export const HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 8,
    numFilters: 128,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 4,         // 从8减少到4，超极限内存优化
    useDepthwiseConv: true,
    useSelfAttention: true,
    numAttentionHeads: 8,
    useMixedPrecision: true,
    dropoutRate: 0.15,
    useLabelSmoothing: true,
    labelSmoothingFactor: 0.1
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 300,
    cPuct: 1.0,
    dirichletAlpha: 0.3,
    noiseWeight: 0.25,
    temperature: 1.0
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-HyperMemoryOptimized',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.08,
    verbose: false,
    useAdvancedNetwork: true
  },

  trainingConfig: {
    totalIterations: 80,
    selfPlayGames: 20,    // 从25减少到20，超极限内存优化
    trainingEpochs: 30,   // 从25增加到30，通过更多轮次补偿
    experienceBufferSize: 2500,   // 从5000减少到2500，超极限优化
    evaluationFrequency: 10,
    evaluationGames: 10,  // 从15减少到10
    saveFrequency: 5,     // 从10减少到5，超频繁保存
    modelSavePath: 'src/othello/models/alphazero-hyper-optimized',
    maxGameSteps: 100,
    verbose: true
  } as AlphaZeroTrainingConfig
};

/**
 * 快速推理配置 - 推理速度优化
 */
export const FAST_INFERENCE_ALPHAZERO_CONFIG = {
  networkConfig: {
    learningRate: 0.001,
    numResidualBlocks: 4,
    numFilters: 64,
    l2Regularization: 1e-4,
    momentum: 0.9,
    batchSize: 1,
    useDepthwiseConv: true,
    useSelfAttention: false,
    numAttentionHeads: 4,
    useMixedPrecision: true,
    dropoutRate: 0.0,
    useLabelSmoothing: false,
    labelSmoothingFactor: 0.0
  } as AdvancedNetworkConfig,

  mctsConfig: {
    numSimulations: 100,
    cPuct: 1.0,
    dirichletAlpha: 0.0,
    noiseWeight: 0.0,
    temperature: 0.1
  } as MCTSConfig,

  agentConfig: {
    name: 'AlphaZero-FastInference',
    isTraining: false,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: true,
    useAdvancedNetwork: true
  }
};

/**
 * 高级配置选择器
 */
export class AdvancedConfigSelector {
  /**
   * 根据性能要求选择配置
   */
  static selectByPerformance(requirement: 'speed' | 'quality' | 'balanced' | 'ultimate'): any {
    switch (requirement) {
      case 'speed':
        return FAST_INFERENCE_ALPHAZERO_CONFIG;
      case 'quality':
        return ATTENTION_ALPHAZERO_CONFIG;
      case 'balanced':
        return EFFICIENT_ALPHAZERO_CONFIG;
      case 'ultimate':
        return ULTIMATE_ALPHAZERO_CONFIG;
      default:
        return EFFICIENT_ALPHAZERO_CONFIG;
    }
  }

  /**
   * 根据硬件能力选择配置
   */
  static selectByHardware(capability: 'low' | 'medium' | 'high' | 'extreme'): any {
    switch (capability) {
      case 'low':
        return FAST_INFERENCE_ALPHAZERO_CONFIG;
      case 'medium':
        return EFFICIENT_ALPHAZERO_CONFIG;
      case 'high':
        return ATTENTION_ALPHAZERO_CONFIG;
      case 'extreme':
        return ULTIMATE_ALPHAZERO_CONFIG;
      default:
        return EFFICIENT_ALPHAZERO_CONFIG;
    }
  }

  /**
   * 自定义配置生成器
   */
  static createCustomConfig(options: {
    useDepthwiseConv?: boolean;
    useSelfAttention?: boolean;
    numAttentionHeads?: number;
    useMixedPrecision?: boolean;
    numResidualBlocks?: number;
    numFilters?: number;
    mctsSimulations?: number;
  }): any {
    const baseConfig = EFFICIENT_ALPHAZERO_CONFIG;
    
    return {
      networkConfig: {
        ...baseConfig.networkConfig,
        useDepthwiseConv: options.useDepthwiseConv ?? true,
        useSelfAttention: options.useSelfAttention ?? false,
        numAttentionHeads: options.numAttentionHeads ?? 4,
        useMixedPrecision: options.useMixedPrecision ?? true,
        numResidualBlocks: options.numResidualBlocks ?? 6,
        numFilters: options.numFilters ?? 96
      },
      mctsConfig: {
        ...baseConfig.mctsConfig,
        numSimulations: options.mctsSimulations ?? 150
      },
      agentConfig: {
        ...baseConfig.agentConfig,
        name: 'AlphaZero-Custom'
      },
      trainingConfig: baseConfig.trainingConfig
    };
  }
}

/**
 * 高级配置验证器
 */
export class AdvancedConfigValidator {
  /**
   * 验证高级网络配置
   */
  static validateAdvancedConfig(config: AdvancedNetworkConfig): boolean {
    // 基本参数验证
    if (config.numResidualBlocks < 1 || config.numResidualBlocks > 20) {
      console.warn('⚠️ 残差块数量应在1-20之间');
      return false;
    }

    if (config.numFilters < 32 || config.numFilters > 512) {
      console.warn('⚠️ 滤波器数量应在32-512之间');
      return false;
    }

    // 注意力机制验证
    if (config.useSelfAttention && config.numAttentionHeads < 1) {
      console.warn('⚠️ 使用自注意力时，注意力头数量必须大于0');
      return false;
    }

    if (config.numAttentionHeads > 16) {
      console.warn('⚠️ 注意力头数量过多可能影响性能');
      return false;
    }

    // Dropout验证
    if (config.dropoutRate < 0 || config.dropoutRate > 0.5) {
      console.warn('⚠️ Dropout率应在0-0.5之间');
      return false;
    }

    // 标签平滑验证
    if (config.useLabelSmoothing && 
        (config.labelSmoothingFactor < 0 || config.labelSmoothingFactor > 0.3)) {
      console.warn('⚠️ 标签平滑因子应在0-0.3之间');
      return false;
    }

    return true;
  }

  /**
   * 获取配置建议
   */
  static getConfigRecommendations(config: AdvancedNetworkConfig): string[] {
    const recommendations: string[] = [];

    // 性能建议
    if (config.useDepthwiseConv && config.useSelfAttention) {
      recommendations.push('💡 同时使用深度可分离卷积和自注意力可能导致计算复杂度过高');
    }

    if (config.numResidualBlocks > 10 && config.useSelfAttention) {
      recommendations.push('💡 深层网络配合注意力机制时，建议降低残差块数量');
    }

    if (config.useMixedPrecision) {
      recommendations.push('✅ 混合精度训练可显著提升训练速度');
    }

    if (config.dropoutRate > 0.2) {
      recommendations.push('⚠️ 较高的Dropout率可能影响模型表达能力');
    }

    return recommendations;
  }
}

/**
 * 配置性能预估器
 */
export class ConfigPerformanceEstimator {
  /**
   * 估算推理速度
   */
  static estimateInferenceSpeed(config: AdvancedNetworkConfig): {
    estimatedSpeedMultiplier: number;
    description: string;
  } {
    let speedMultiplier = 1.0;
    let factors: string[] = [];

    // 深度可分离卷积影响
    if (config.useDepthwiseConv) {
      speedMultiplier *= 1.5;
      factors.push('深度可分离卷积(+50%)');
    }

    // 自注意力机制影响
    if (config.useSelfAttention) {
      speedMultiplier *= 0.7;
      factors.push('自注意力机制(-30%)');
    }

    // 混合精度影响
    if (config.useMixedPrecision) {
      speedMultiplier *= 1.3;
      factors.push('混合精度(+30%)');
    }

    // 网络深度影响
    const depthFactor = Math.max(0.5, 1.0 - (config.numResidualBlocks - 6) * 0.05);
    speedMultiplier *= depthFactor;
    factors.push(`网络深度(${(depthFactor * 100).toFixed(0)}%)`);

    return {
      estimatedSpeedMultiplier: speedMultiplier,
      description: `预估速度变化: ${factors.join(', ')}`
    };
  }

  /**
   * 估算内存使用
   */
  static estimateMemoryUsage(config: AdvancedNetworkConfig): {
    estimatedMemoryMB: number;
    breakdown: { [key: string]: number };
  } {
    const baseMemory = 100; // MB
    let totalMemory = baseMemory;
    const breakdown: { [key: string]: number } = {};

    // 网络参数内存
    const paramMemory = config.numResidualBlocks * config.numFilters * 0.1;
    totalMemory += paramMemory;
    breakdown['网络参数'] = paramMemory;

    // 注意力机制内存
    if (config.useSelfAttention) {
      const attentionMemory = config.numAttentionHeads * 20;
      totalMemory += attentionMemory;
      breakdown['注意力机制'] = attentionMemory;
    }

    // 混合精度节省
    if (config.useMixedPrecision) {
      totalMemory *= 0.7;
      breakdown['混合精度节省'] = -totalMemory * 0.3;
    }

    breakdown['基础开销'] = baseMemory;

    return {
      estimatedMemoryMB: Math.round(totalMemory),
      breakdown
    };
  }
}
