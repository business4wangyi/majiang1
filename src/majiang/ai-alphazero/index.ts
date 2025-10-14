/**
 * 麻将AlphaZero AI系统入口文件
 * 导出所有核心组件，提供统一的API接口
 */

// 核心组件导出
export { MajiangStateEncoder, MajiangStateVector } from './majiang-state-encoder';
export { MajiangActionDecoder, MajiangAction, MajiangActionSpace } from './majiang-action-decoder';
export { MajiangAlphaZeroNetwork, MajiangNetworkOutput, MajiangNetworkConfig } from './majiang-alphazero-network';
export { MajiangGameAdapter, GameAdapterConfig, GameSnapshot } from './majiang-game-adapter';
export { MajiangAlphaZeroAgent, AgentConfig, MCTSNode } from './majiang-alphazero-agent';

// 类型定义导出
export * from './types';

// 便捷工厂函数
import { Game } from '../game';
import { MajiangAlphaZeroNetwork } from './majiang-alphazero-network';
import { MajiangGameAdapter } from './majiang-game-adapter';
import { MajiangAlphaZeroAgent } from './majiang-alphazero-agent';

/**
 * 创建标准配置的麻将AlphaZero AI
 */
export function createMajiangAlphaZeroAI(game: Game, config?: {
  networkConfig?: any;
  agentConfig?: any;
  adapterConfig?: any;
}): MajiangAlphaZeroAgent {
  // 创建神经网络
  const network = new MajiangAlphaZeroNetwork(config?.networkConfig);
  
  // 创建游戏适配器
  const adapter = new MajiangGameAdapter(game, config?.adapterConfig);
  
  // 创建AI智能体
  const agent = new MajiangAlphaZeroAgent(network, adapter, config?.agentConfig);
  
  return agent;
}

/**
 * 创建用于训练的麻将AlphaZero AI
 */
export function createTrainingMajiangAI(game: Game): MajiangAlphaZeroAgent {
  const agent = createMajiangAlphaZeroAI(game, {
    networkConfig: {
      hiddenLayers: [512, 256, 128],
      dropoutRate: 0.3,
      learningRate: 0.001
    },
    agentConfig: {
      mctsSimulations: 1600,
      explorationWeight: 1.4,
      temperature: 1.2,
      enableSelfPlay: true,
      enableLogging: true
    },
    adapterConfig: {
      enableLogging: true,
      validateActions: true,
      autoSaveStates: true
    }
  });
  
  agent.setTrainingMode(true);
  return agent;
}

/**
 * 创建用于对弈的麻将AlphaZero AI
 */
export function createPlayingMajiangAI(game: Game): MajiangAlphaZeroAgent {
  const agent = createMajiangAlphaZeroAI(game, {
    networkConfig: {
      hiddenLayers: [512, 256, 128],
      dropoutRate: 0.0, // 对弈时不使用dropout
      learningRate: 0.001
    },
    agentConfig: {
      mctsSimulations: 800,
      explorationWeight: 1.0,
      temperature: 0.1, // 较低的温度，更确定性的选择
      enableSelfPlay: false,
      enableLogging: false
    },
    adapterConfig: {
      enableLogging: false,
      validateActions: true,
      autoSaveStates: false
    }
  });
  
  agent.setTrainingMode(false);
  return agent;
}

/**
 * 创建快速测试用的麻将AlphaZero AI
 */
export function createTestMajiangAI(game: Game): MajiangAlphaZeroAgent {
  const agent = createMajiangAlphaZeroAI(game, {
    networkConfig: {
      hiddenLayers: [256, 128], // 较小的网络
      dropoutRate: 0.0,
      learningRate: 0.001
    },
    agentConfig: {
      mctsSimulations: 200, // 较少的模拟次数
      explorationWeight: 1.0,
      temperature: 0.5,
      thinkingTimeMs: 2000, // 较短的思考时间
      enableSelfPlay: false,
      enableLogging: true
    },
    adapterConfig: {
      enableLogging: true,
      validateActions: true,
      autoSaveStates: false
    }
  });
  
  agent.setTrainingMode(false);
  return agent;
}

/**
 * AI系统信息
 */
export const MAJIANG_ALPHAZERO_INFO = {
  version: '1.0.0',
  name: 'Majiang AlphaZero AI',
  description: '基于AlphaZero传说级技术栈的麻将AI系统',
  targetLevel: '60-70分 (初级AI水平)',
  features: [
    '320维状态编码',
    '39维动作解码',
    'MCTS树搜索',
    '神经网络价值评估',
    '温度控制探索',
    '游戏适配器集成'
  ],
  technicalSpecs: {
    inputDimension: 320,
    outputDimension: 39,
    defaultNetworkLayers: [512, 256, 128],
    defaultMCTSSimulations: 800,
    supportedActions: ['DISCARD', 'CHI', 'PENG', 'GANG', 'HU', 'PASS']
  }
};