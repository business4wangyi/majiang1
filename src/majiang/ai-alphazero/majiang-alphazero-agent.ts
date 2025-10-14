/**
 * 麻将AlphaZero智能体 - 集成神经网络、MCTS和游戏适配器的完整AI系统
 * 基于传说级AlphaZero技术栈，实现60-70分目标水平
 */

import { Player, Tile, GameState } from './types';
import { MajiangAlphaZeroNetwork, MajiangNetworkOutput } from './majiang-alphazero-network';
import { MajiangGameAdapter, GameSnapshot } from './majiang-game-adapter';
import { MajiangAction, MajiangActionDecoder } from './majiang-action-decoder';
import { MajiangStateEncoder } from './majiang-state-encoder';

export interface AgentConfig {
  networkConfig?: any;
  mctsSimulations: number;
  explorationWeight: number;
  temperature: number;
  temperatureDecay: number;
  minTemperature: number;
  thinkingTimeMs: number;
  enableSelfPlay: boolean;
  enableLogging: boolean;
}

export interface MCTSNode {
  state: GameSnapshot;
  action: MajiangAction | null;
  parent: MCTSNode | null;
  children: MCTSNode[];
  visits: number;
  totalValue: number;
  priorProbability: number;
  isExpanded: boolean;
  isTerminal: boolean;
}

export class MajiangAlphaZeroAgent {
  private network: MajiangAlphaZeroNetwork;
  private gameAdapter: MajiangGameAdapter;
  private config: AgentConfig;
  private currentTemperature: number;
  private moveCount: number;
  private thinkingStartTime: number;
  
  constructor(
    network: MajiangAlphaZeroNetwork,
    gameAdapter: MajiangGameAdapter,
    config?: Partial<AgentConfig>
  ) {
    this.network = network;
    this.gameAdapter = gameAdapter;
    this.config = {
      mctsSimulations: 800,
      explorationWeight: 1.4,
      temperature: 1.0,
      temperatureDecay: 0.95,
      minTemperature: 0.1,
      thinkingTimeMs: 5000,
      enableSelfPlay: false,
      enableLogging: true,
      ...config
    };
    
    this.currentTemperature = this.config.temperature;
    this.moveCount = 0;
    this.thinkingStartTime = 0;
  }
  
  /**
   * 选择最佳动作
   */
  public async selectAction(): Promise<MajiangAction | null> {
    this.thinkingStartTime = Date.now();
    
    if (this.config.enableLogging) {
      console.log(`[AlphaZero Agent] Starting action selection (simulations: ${this.config.mctsSimulations})`);
    }
    
    // 获取当前状态
    const currentSnapshot = this.gameAdapter.createSnapshot();
    if (currentSnapshot.availableActions.length === 0) {
      if (this.config.enableLogging) {
        console.log('[AlphaZero Agent] No available actions');
      }
      return null;
    }
    
    // 如果只有一个有效动作，直接返回
    if (currentSnapshot.availableActions.length === 1) {
      const action = currentSnapshot.availableActions[0];
      if (this.config.enableLogging) {
        console.log(`[AlphaZero Agent] Only one action available: ${action.type}`);
      }
      return action;
    }
    
    // 执行MCTS搜索
    const rootNode = this.createRootNode(currentSnapshot);
    await this.runMCTS(rootNode);
    
    // 选择最佳动作
    const bestAction = this.selectBestAction(rootNode);
    
    // 更新温度和移动计数
    this.updateTemperature();
    this.moveCount++;
    
    const thinkingTime = Date.now() - this.thinkingStartTime;
    if (this.config.enableLogging) {
      console.log(`[AlphaZero Agent] Selected action: ${bestAction?.type}, thinking time: ${thinkingTime}ms`);
    }
    
    return bestAction;
  }
  
  /**
   * 创建MCTS根节点
   */
  private createRootNode(snapshot: GameSnapshot): MCTSNode {
    return {
      state: snapshot,
      action: null,
      parent: null,
      children: [],
      visits: 0,
      totalValue: 0,
      priorProbability: 1.0,
      isExpanded: false,
      isTerminal: this.gameAdapter.isGameOver()
    };
  }
  
  /**
   * 运行MCTS搜索
   */
  private async runMCTS(rootNode: MCTSNode): Promise<void> {
    for (let i = 0; i < this.config.mctsSimulations; i++) {
      // 检查时间限制
      if (Date.now() - this.thinkingStartTime > this.config.thinkingTimeMs) {
        if (this.config.enableLogging) {
          console.log(`[AlphaZero Agent] Time limit reached, stopping at simulation ${i}`);
        }
        break;
      }
      
      // 执行一次MCTS模拟
      await this.runSingleSimulation(rootNode);
      
      // 每100次模拟输出进度
      if (this.config.enableLogging && (i + 1) % 100 === 0) {
        console.log(`[AlphaZero Agent] Completed ${i + 1}/${this.config.mctsSimulations} simulations`);
      }
    }
  }
  
  /**
   * 执行单次MCTS模拟
   */
  private async runSingleSimulation(rootNode: MCTSNode): Promise<void> {
    const path: MCTSNode[] = [];
    let currentNode = rootNode;
    
    // 1. 选择阶段 - 从根节点向下选择到叶子节点
    while (currentNode.isExpanded && !currentNode.isTerminal) {
      currentNode = this.selectChildNode(currentNode);
      path.push(currentNode);
    }
    
    // 2. 扩展阶段 - 如果不是终端节点，扩展子节点
    let value = 0;
    if (!currentNode.isTerminal) {
      value = await this.expandNode(currentNode);
    } else {
      value = this.evaluateTerminalNode(currentNode);
    }
    
    // 3. 反向传播阶段 - 更新路径上所有节点的统计信息
    this.backpropagate(path, value);
  }
  
  /**
   * 选择子节点（UCB1算法）
   */
  private selectChildNode(node: MCTSNode): MCTSNode {
    let bestChild: MCTSNode | null = null;
    let bestValue = -Infinity;
    
    for (const child of node.children) {
      const ucbValue = this.calculateUCB(child, node.visits);
      if (ucbValue > bestValue) {
        bestValue = ucbValue;
        bestChild = child;
      }
    }
    
    if (!bestChild) {
      throw new Error('No child node found for selection');
    }
    
    return bestChild;
  }
  
  /**
   * 计算UCB值
   */
  private calculateUCB(node: MCTSNode, parentVisits: number): number {
    if (node.visits === 0) {
      return Infinity; // 优先访问未访问的节点
    }
    
    const exploitation = node.totalValue / node.visits;
    const exploration = this.config.explorationWeight * 
      node.priorProbability * 
      Math.sqrt(parentVisits) / (1 + node.visits);
    
    return exploitation + exploration;
  }
  
  /**
   * 扩展节点
   */
  private async expandNode(node: MCTSNode): Promise<number> {
    // 获取神经网络预测
    const networkOutput = this.network.forward(node.state.stateVector);
    
    // 创建子节点
    const availableActions = node.state.availableActions;
    for (const action of availableActions) {
      const childNode: MCTSNode = {
        state: node.state, // 暂时使用相同状态，实际应该模拟执行动作后的状态
        action,
        parent: node,
        children: [],
        visits: 0,
        totalValue: 0,
        priorProbability: this.getActionProbability(action, networkOutput),
        isExpanded: false,
        isTerminal: false
      };
      
      node.children.push(childNode);
    }
    
    node.isExpanded = true;
    
    // 返回网络的价值评估
    return networkOutput.valueEstimation;
  }
  
  /**
   * 获取动作的先验概率
   */
  private getActionProbability(action: MajiangAction, networkOutput: MajiangNetworkOutput): number {
    if (action.type === 'DISCARD' && action.tileIndex !== undefined) {
      return networkOutput.actionProbabilities[action.tileIndex];
    }
    
    // 特殊动作的概率映射
    const specialActionIndex = this.getSpecialActionIndex(action.type);
    if (specialActionIndex >= 0) {
      return networkOutput.actionProbabilities[34 + specialActionIndex];
    }
    
    return 0.01; // 默认小概率
  }
  
  /**
   * 获取特殊动作的索引
   */
  private getSpecialActionIndex(actionType: string): number {
    const actionMap: { [key: string]: number } = {
      'CHI': 0,
      'PENG': 1,
      'GANG': 2,
      'HU': 3,
      'PASS': 4
    };
    
    return actionMap[actionType] ?? -1;
  }
  
  /**
   * 评估终端节点
   */
  private evaluateTerminalNode(node: MCTSNode): number {
    const gameResult = this.gameAdapter.getGameResult();
    if (!gameResult) {
      return 0; // 平局
    }
    
    const currentPlayer = this.gameAdapter.getCurrentPlayer();
    if (!currentPlayer) {
      return 0;
    }
    
    // 如果当前玩家获胜，返回1，否则返回-1
    return gameResult.winner === currentPlayer ? 1 : -1;
  }
  
  /**
   * 反向传播
   */
  private backpropagate(path: MCTSNode[], value: number): void {
    for (const node of path) {
      node.visits++;
      node.totalValue += value;
      value = -value; // 对手视角下的价值相反
    }
  }
  
  /**
   * 选择最佳动作
   */
  private selectBestAction(rootNode: MCTSNode): MajiangAction | null {
    if (rootNode.children.length === 0) {
      return null;
    }
    
    // 根据温度参数选择动作
    if (this.currentTemperature === 0) {
      // 贪婪选择访问次数最多的动作
      let bestChild = rootNode.children[0];
      for (const child of rootNode.children) {
        if (child.visits > bestChild.visits) {
          bestChild = child;
        }
      }
      return bestChild.action;
    } else {
      // 基于访问次数的概率分布采样
      const visitCounts = rootNode.children.map(child => child.visits);
      const probabilities = this.applyTemperature(visitCounts, this.currentTemperature);
      
      const randomValue = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < rootNode.children.length; i++) {
        cumulative += probabilities[i];
        if (randomValue <= cumulative) {
          return rootNode.children[i].action;
        }
      }
      
      // 备选：返回最后一个动作
      return rootNode.children[rootNode.children.length - 1].action;
    }
  }
  
  /**
   * 应用温度参数
   */
  private applyTemperature(visitCounts: number[], temperature: number): number[] {
    const adjustedCounts = visitCounts.map(count => 
      Math.pow(count, 1 / temperature)
    );
    
    const sum = adjustedCounts.reduce((a, b) => a + b, 0);
    return adjustedCounts.map(count => count / sum);
  }
  
  /**
   * 更新温度参数
   */
  private updateTemperature(): void {
    this.currentTemperature = Math.max(
      this.config.minTemperature,
      this.currentTemperature * this.config.temperatureDecay
    );
  }
  
  /**
   * 获取智能体统计信息
   */
  public getStats(): {
    moveCount: number;
    currentTemperature: number;
    lastThinkingTime: number;
    networkParameters: number;
  } {
    return {
      moveCount: this.moveCount,
      currentTemperature: this.currentTemperature,
      lastThinkingTime: Date.now() - this.thinkingStartTime,
      networkParameters: this.network.getParameterCount()
    };
  }
  
  /**
   * 重置智能体状态
   */
  public reset(): void {
    this.currentTemperature = this.config.temperature;
    this.moveCount = 0;
    this.thinkingStartTime = 0;
    
    if (this.config.enableLogging) {
      console.log('[AlphaZero Agent] Agent reset');
    }
  }
  
  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * 获取当前配置
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }
  
  /**
   * 设置网络为训练模式
   */
  public setTrainingMode(training: boolean): void {
    this.network.setTraining(training);
  }
  
  /**
   * 获取网络输出（用于调试）
   */
  public getNetworkOutput(): MajiangNetworkOutput | null {
    try {
      const currentSnapshot = this.gameAdapter.getLastSnapshot();
      if (!currentSnapshot) {
        return null;
      }
      
      return this.network.forward(currentSnapshot.stateVector);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('[AlphaZero Agent] Error getting network output:', error);
      }
      return null;
    }
  }
}