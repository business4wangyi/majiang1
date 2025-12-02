// {{ AURA-X: Add - AlphaZero智能体实现，结合神经网络和MCTS. Approval: 寸止(ID:开始AlphaZero实现). }}

/**
 * AlphaZero智能体实现
 * 
 * 结合神经网络和蒙特卡洛树搜索的AlphaZero智能体：
 * - 使用MCTS进行动作选择
 * - 神经网络提供策略和价值评估
 * - 支持训练和推理模式
 */

// Fix for isNullOrUndefined compatibility issue (must be first)
import '../../../shared/utils/tfjs-compat-fix';
import * as tf from '@tensorflow/tfjs-node';
import { OthelloAgent } from '../agents/random-agent';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { getLegalActions } from '../../core/game';
import { AlphaZeroNetwork, AlphaZeroNetworkConfig, DEFAULT_ALPHAZERO_CONFIG, IAlphaZeroNetwork } from '../networks/alphazero-network';
import { AlphaZeroAdvancedNetwork, AdvancedNetworkConfig, DEFAULT_ADVANCED_CONFIG } from '../networks/alphazero-network-advanced';
import { AlphaZeroMCTS, MCTSConfig, DEFAULT_MCTS_CONFIG } from '../mcts/alphazero-mcts';
import { AlphaZeroMCTSUniversal } from '../mcts/alphazero-mcts-universal';

/**
 * AlphaZero智能体配置接口
 */
export interface AlphaZeroAgentConfig {
  /** 网络配置 */
  networkConfig?: AlphaZeroNetworkConfig | AdvancedNetworkConfig;
  /** MCTS配置 */
  mctsConfig: MCTSConfig;
  /** 智能体名称 */
  name: string;
  /** 是否为训练模式 */
  isTraining: boolean;
  /** 训练时的温度参数 */
  trainingTemperature: number;
  /** 推理时的温度参数 */
  inferenceTemperature: number;
  /** 是否启用详细日志 */
  verbose: boolean;
  /** 是否使用高级网络架构 */
  useAdvancedNetwork?: boolean;
  /** 自定义网络实例（如果提供，将使用此实例而不是根据配置创建） */
  customNetwork?: IAlphaZeroNetwork;
}

/**
 * 默认AlphaZero智能体配置
 */
export const DEFAULT_ALPHAZERO_AGENT_CONFIG: AlphaZeroAgentConfig = {
  networkConfig: DEFAULT_ALPHAZERO_CONFIG,
  mctsConfig: DEFAULT_MCTS_CONFIG,
  name: 'AlphaZero-Agent',
  isTraining: true,
  trainingTemperature: 1.0,
  inferenceTemperature: 0.1,
  verbose: false,
  customNetwork: undefined
};

/**
 * AlphaZero搜索结果接口
 */
export interface AlphaZeroSearchResult {
  /** 选择的动作 */
  action: OthelloAction;
  /** 动作概率分布 */
  actionProbs: number[];
  /** 根节点价值 */
  rootValue: number;
  /** 搜索统计 */
  searchStats: {
    simulations: number;
    searchTime: number;
  };
}

/**
 * AlphaZero智能体类
 */
export class AlphaZeroOthelloAgent implements OthelloAgent {
  private network: IAlphaZeroNetwork;
  private mcts: AlphaZeroMCTS | AlphaZeroMCTSUniversal;
  private config: AlphaZeroAgentConfig;
  private moveCount: number = 0;
  private useUniversalMCTS: boolean;
  
  // 暴露universalMCTS以便异步访问（如果需要）
  get universalMCTS(): any | null {
    if (this.useUniversalMCTS && this.mcts instanceof AlphaZeroMCTSUniversal) {
      return this.mcts.universalMCTS;
    }
    return null;
  }

  constructor(config: AlphaZeroAgentConfig = DEFAULT_ALPHAZERO_AGENT_CONFIG) {
    this.config = { ...config };

    // 如果提供了自定义网络实例，使用它（例如Worker模式）
    if (this.config.customNetwork) {
      this.network = this.config.customNetwork;
      console.log(`🔧 使用自定义网络实例（可能是Worker模式）`);
    } else if (this.config.networkConfig) {
      // 根据配置选择网络类型
      if (this.config.useAdvancedNetwork && 'useDepthwiseConv' in this.config.networkConfig) {
        this.network = new AlphaZeroAdvancedNetwork(this.config.networkConfig as AdvancedNetworkConfig);
        console.log(`🚀 使用高级网络架构`);
      } else {
        this.network = new AlphaZeroNetwork(this.config.networkConfig as AlphaZeroNetworkConfig);
        console.log(`📊 使用标准网络架构`);
      }
    } else {
      // 如果没有提供网络配置和自定义网络，使用默认配置
      this.network = new AlphaZeroNetwork(DEFAULT_ALPHAZERO_CONFIG);
      console.log(`📊 使用默认标准网络架构`);
    }

    // 默认使用通用MCTS（已优化，包含超时机制和状态缓存）
    // 可通过环境变量 USE_UNIVERSAL_MCTS=false 切换回原MCTS
    this.useUniversalMCTS = process.env.USE_UNIVERSAL_MCTS !== 'false';
    
    if (this.useUniversalMCTS) {
      this.mcts = new AlphaZeroMCTSUniversal(this.network, this.config.mctsConfig);
      console.log(`🔄 使用通用MCTS框架（推荐：包含超时机制和状态缓存）`);
    } else {
      this.mcts = new AlphaZeroMCTS(this.network, this.config.mctsConfig);
      console.log(`📦 使用原MCTS实现（不推荐：缺少超时机制）`);
    }
    
    this.moveCount = 0;

    console.log(`🤖 AlphaZero智能体已创建: ${this.config.name}`);
    console.log(`   训练模式: ${this.config.isTraining}`);
    console.log(`   MCTS模拟次数: ${this.config.mctsConfig.numSimulations}`);
    if (this.config.networkConfig && 'numResidualBlocks' in this.config.networkConfig) {
      console.log(`   网络残差块: ${this.config.networkConfig.numResidualBlocks}`);
    }

    if (this.config.useAdvancedNetwork) {
      const advConfig = this.config.networkConfig as AdvancedNetworkConfig;
      console.log(`   深度可分离卷积: ${advConfig.useDepthwiseConv}`);
      console.log(`   自注意力机制: ${advConfig.useSelfAttention}`);
      console.log(`   混合精度训练: ${advConfig.useMixedPrecision}`);
    }
  }

  /**
   * 选择动作
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const legalActions = getLegalActions(board, player);
    
    if (legalActions.length === 0) {
      return null;
    }

    if (legalActions.length === 1) {
      return legalActions[0];
    }

    try {
      const searchResult = this.searchBestAction(board, player);
      
      if (this.config.verbose) {
        console.log(`🔍 AlphaZero搜索完成:`);
        console.log(`   选择动作: (${searchResult.action.row}, ${searchResult.action.col})`);
        console.log(`   根节点价值: ${searchResult.rootValue.toFixed(4)}`);
        console.log(`   搜索时间: ${searchResult.searchStats.searchTime}ms`);
      }

      this.moveCount++;
      return searchResult.action;

    } catch (error) {
      console.error('AlphaZero动作选择错误:', error);
      
      // 回退到随机选择
      return legalActions[Math.floor(Math.random() * legalActions.length)];
    }
  }

  /**
   * 搜索最佳动作（带详细结果）
   */
  searchBestAction(board: OthelloBoard, player: OthelloPlayer): AlphaZeroSearchResult {
    const startTime = Date.now();
    
    // 执行MCTS搜索
    const searchResult = this.mcts.search(board, player);
    
    // 根据模式选择温度参数
    const temperature = this.config.isTraining ? 
      this.config.trainingTemperature : 
      this.config.inferenceTemperature;
    
    // 根据温度选择动作
    const actionIndex = this.mcts.selectActionByTemperature(
      searchResult.actionProbs, 
      temperature
    );
    
    const action = {
      row: Math.floor(actionIndex / 8),
      col: actionIndex % 8
    };

    const searchTime = Date.now() - startTime;

    return {
      action,
      actionProbs: searchResult.actionProbs,
      rootValue: searchResult.rootValue,
      searchStats: {
        simulations: this.config.mctsConfig.numSimulations,
        searchTime
      }
    };
  }

  /**
   * 更新学习率（学习率调度）
   */
  updateLearningRate(iteration: number, totalIterations: number): void {
    if (this.network && 'updateLearningRate' in this.network && typeof (this.network as any).updateLearningRate === 'function') {
      (this.network as any).updateLearningRate(iteration, totalIterations);
    }
  }

  /**
   * 异步执行MCTS搜索（推荐用于训练）
   * 直接使用异步MCTS，避免同步等待问题
   */
  async searchBestActionAsync(board: OthelloBoard, player: OthelloPlayer): Promise<AlphaZeroSearchResult> {
    const startTime = Date.now();
    
    // 如果使用Universal MCTS，直接调用异步方法
    if (this.useUniversalMCTS && this.mcts instanceof AlphaZeroMCTSUniversal) {
      const universalMCTS = this.mcts.universalMCTS;
      const searchResult = await universalMCTS.search(board, player);
      
      // 根据模式选择温度参数
      const temperature = this.config.isTraining ? 
        this.config.trainingTemperature : 
        this.config.inferenceTemperature;
      
      // 将Map格式转换为数组格式
      const actionProbs = new Array(64).fill(0);
      const legalActions = getLegalActions(board, player);
      
      for (const action of legalActions) {
        const actionKey = `${action.row},${action.col}`;
        const prob = searchResult.actionProbs.get(actionKey) || 0;
        const actionIndex = action.row * 8 + action.col;
        actionProbs[actionIndex] = prob;
      }
      
      // 根据温度选择动作
      const actionIndex = this.mcts.selectActionByTemperature(actionProbs, temperature);
      
      const action = {
        row: Math.floor(actionIndex / 8),
        col: actionIndex % 8
      };

      const searchTime = Date.now() - startTime;

      return {
        action,
        actionProbs,
        rootValue: searchResult.rootValue,
        searchStats: {
          simulations: this.config.mctsConfig.numSimulations,
          searchTime
        }
      };
    }
    
    // 否则使用同步方法（兼容旧代码）
    return this.searchBestAction(board, player);
  }

  /**
   * 获取动作概率分布（用于训练数据收集）
   */
  getActionProbabilities(board: OthelloBoard, player: OthelloPlayer): number[] {
    const searchResult = this.mcts.search(board, player);
    return searchResult.actionProbs;
  }

  /**
   * 获取位置价值评估
   */
  getPositionValue(board: OthelloBoard, player: OthelloPlayer): number {
    const boardTensor = this.network.boardToTensor(board, player);
    const prediction = this.network.predict(boardTensor);
    boardTensor.dispose();
    
    return prediction.value;
  }

  /**
   * 训练网络
   */
  async trainNetwork(
    states: OthelloBoard[],
    targetPolicies: number[][],
    targetValues: number[],
    player: OthelloPlayer
  ): Promise<{ policyLoss: number; valueLoss: number; totalLoss: number }> {
    if (!this.config.isTraining) {
      throw new Error('智能体不在训练模式');
    }

    // 转换为张量
    const stateTensors = states.map(state => this.network.boardToTensor(state, player));
    const statesBatch = stateTensors.length > 1 ?
      tf.concat(stateTensors, 0) :
      stateTensors[0];

    const targetPoliciesTensor = tf.tensor2d(targetPolicies);
    const targetValuesTensor = tf.tensor2d(targetValues.map(v => [v]));

    // 训练网络
    const lossInfo = await this.network.train(
      statesBatch,
      targetPoliciesTensor,
      targetValuesTensor
    );

    // 清理张量
    stateTensors.forEach(tensor => tensor.dispose());
    if (stateTensors.length > 1) {
      (statesBatch as tf.Tensor4D).dispose();
    }
    targetPoliciesTensor.dispose();
    targetValuesTensor.dispose();

    return lossInfo;
  }

  /**
   * 设置训练模式
   */
  setTrainingMode(isTraining: boolean): void {
    this.config.isTraining = isTraining;
    
    if (this.config.verbose) {
      console.log(`🔧 AlphaZero模式切换: ${isTraining ? '训练' : '推理'}`);
    }
  }

  /**
   * 更新MCTS配置
   */
  updateMCTSConfig(config: Partial<MCTSConfig>): void {
    this.config.mctsConfig = { ...this.config.mctsConfig, ...config };
    this.mcts = new AlphaZeroMCTS(this.network, this.config.mctsConfig);
    
    if (this.config.verbose) {
      console.log('🔧 MCTS配置已更新');
    }
  }

  /**
   * 保存模型
   */
  async saveModel(path: string): Promise<void> {
    await this.network.saveModel(path);
    console.log(`✅ AlphaZero模型已保存到: ${path}`);
  }

  /**
   * 加载模型
   */
  async loadModel(path: string): Promise<void> {
    await this.network.loadModel(path);
    console.log(`✅ AlphaZero模型已从以下路径加载: ${path}`);
  }

  /**
   * 获取智能体信息
   */
  getInfo(): string {
    return `AlphaZero智能体 (${this.config.name}) - 步数: ${this.moveCount}, 模式: ${this.config.isTraining ? '训练' : '推理'}`;
  }

  /**
   * 获取网络摘要
   */
  getNetworkSummary(): void {
    this.network.getModelSummary();
  }

  /**
   * 重置智能体状态
   */
  reset(): void {
    this.moveCount = 0;
  }

  /**
   * 获取网络参数数量
   */
  getParameterCount(): number {
    return this.network.getParameterCount();
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.network.dispose();
  }
}

/**
 * 导出的人机对战运行函数
 */
export async function runHumanVsAI(): Promise<void> {
  console.log('🎮 启动AlphaZero人机对战...');
  console.log('💡 这是一个演示版本，实际需要完整的交互界面');

  // 创建AlphaZero智能体
  const agent = new AlphaZeroOthelloAgent(DEFAULT_ALPHAZERO_AGENT_CONFIG);

  console.log('🤖 AlphaZero智能体已准备就绪');
  console.log('🎯 建议使用 npm run othello:cli 进行完整的人机对战体验');

  agent.dispose();
}

/**
 * 导出的AI对战运行函数
 */
export async function runAIVsAI(): Promise<void> {
  console.log('🤖 启动AlphaZero AI对战演示...');

  // 创建两个不同配置的AlphaZero智能体
  const agent1 = new AlphaZeroOthelloAgent({
    ...DEFAULT_ALPHAZERO_AGENT_CONFIG,
    name: 'AlphaZero-1',
    mctsConfig: { ...DEFAULT_MCTS_CONFIG, numSimulations: 100 }
  });

  const agent2 = new AlphaZeroOthelloAgent({
    ...DEFAULT_ALPHAZERO_AGENT_CONFIG,
    name: 'AlphaZero-2',
    mctsConfig: { ...DEFAULT_MCTS_CONFIG, numSimulations: 50 }
  });

  console.log('🥊 AI对战配置:');
  console.log(`   AlphaZero-1: 100 次模拟`);
  console.log(`   AlphaZero-2: 50 次模拟`);
  console.log('');
  console.log('💡 这是演示版本，完整的AI对战请使用 npm run othello:demo');

  agent1.dispose();
  agent2.dispose();
}

// 如果直接运行此文件
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--human')) {
    runHumanVsAI().catch(console.error);
  } else {
    runAIVsAI().catch(console.error);
  }
}
