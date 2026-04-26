export * from './types';
export * from './majiang-alphazero-agent';
export * from './majiang-alphazero-network';
export * from './majiang-game-adapter';
export * from './majiang-state-encoder';
export * from './majiang-action-decoder';

import { Game } from '../../core/game';
import { MajiangAlphaZeroNetwork } from './majiang-alphazero-network';
import { MajiangGameAdapter } from './majiang-game-adapter';
import { MajiangAlphaZeroAgent } from './majiang-alphazero-agent';

export const MAJIANG_ALPHAZERO_INFO = {
  name: 'Majiang AlphaZero',
  version: '0.1.0',
  description: '麻将 AlphaZero 训练与演示模块',
  targetLevel: 'research-demo',
  features: ['state-encoding', 'action-decoding', 'mcts-adapter']
};

export function createMajiangAlphaZeroAI(game: Game, config?: {
  networkConfig?: any;
  adapterConfig?: any;
  agentConfig?: any;
}): MajiangAlphaZeroAgent {
  const network = new MajiangAlphaZeroNetwork(config?.networkConfig);
  const adapter = new MajiangGameAdapter(game, config?.adapterConfig);
  return new MajiangAlphaZeroAgent(network, adapter, config?.agentConfig);
}

export function createTrainingMajiangAI(config?: {
  mctsSimulations?: number;
  explorationWeight?: number;
  temperature?: number;
}): MajiangAlphaZeroAgent {
  const game = new Game();
  const agent = createMajiangAlphaZeroAI(game, {
    agentConfig: {
      mctsSimulations: config?.mctsSimulations ?? 200,
      explorationWeight: config?.explorationWeight ?? 1.0,
      temperature: config?.temperature ?? 1.0,
      enableSelfPlay: true,
      enableLogging: false
    }
  });
  agent.setTrainingMode(true);
  return agent;
}

export function createPlayingMajiangAI(game: Game): MajiangAlphaZeroAgent {
  const agent = createMajiangAlphaZeroAI(game, {
    agentConfig: {
      mctsSimulations: 100,
      explorationWeight: 1.0,
      temperature: 0.1,
      enableSelfPlay: false,
      enableLogging: false
    }
  });
  agent.setTrainingMode(false);
  return agent;
}

export function createTestMajiangAI(game: Game): MajiangAlphaZeroAgent {
  return createMajiangAlphaZeroAI(game, {
    networkConfig: {
      hiddenLayers: [128, 64],
      dropoutRate: 0,
      batchSize: 8
    },
    agentConfig: {
      mctsSimulations: 20,
      explorationWeight: 1.0,
      temperature: 0.5,
      enableSelfPlay: false,
      enableLogging: false
    }
  });
}
