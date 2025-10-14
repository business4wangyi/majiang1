/**
 * 完整的AlphaZero实现：神经网络 + MCTS搜索
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

interface MCTSNode {
  state: Float32Array;
  parent: MCTSNode | null;
  children: Map<number, MCTSNode>;
  visits: number;
  totalValue: number;
  priorProbability: number;
  action: number;
  isExpanded: boolean;
}

interface MCTSConfig {
  simulations: number;
  cPuct: number;
  temperature: number;
  dirichletAlpha: number;
  dirichletWeight: number;
}

class AlphaZeroMCTS {
  private network: MajiangAlphaZeroNetworkTF;
  private config: MCTSConfig;

  constructor() {
    console.log('🌳 初始化AlphaZero MCTS...');
    
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [512, 256, 128],
      learningRate: 0.001,
      batchSize: 32,
      dropoutRate: 0.3
    });
    
    this.config = {
      simulations: 100,      // MCTS模拟次数
      cPuct: 1.0,           // UCB探索常数
      temperature: 1.0,      // 温度参数
      dirichletAlpha: 0.3,   // Dirichlet噪声参数
      dirichletWeight: 0.25  // 噪声权重
    };
    
    console.log('✅ AlphaZero MCTS创建成功');
    console.log('📊 网络参数:', this.network.getParameterCount());
    console.log('🌳 MCTS配置:', this.config);
  }

  /**
   * 创建根节点
   */
  private createRootNode(state: Float32Array): MCTSNode {
    return {
      state,
      parent: null,
      children: new Map(),
      visits: 0,
      totalValue: 0,
      priorProbability: 1.0,
      action: -1,
      isExpanded: false
    };
  }

  /**
   * 选择节点（UCB1算法）
   */
  private selectNode(node: MCTSNode): MCTSNode {
    while (node.isExpanded && node.children.size > 0) {
      let bestAction = -1;
      let bestValue = -Infinity;
      
      for (const [action, child] of node.children) {
        const ucbValue = this.calculateUCB(child, node.visits);
        if (ucbValue > bestValue) {
          bestValue = ucbValue;
          bestAction = action;
        }
      }
      
      if (bestAction !== -1) {
        node = node.children.get(bestAction)!;
      } else {
        break;
      }
    }
    
    return node;
  }

  /**
   * 计算UCB值
   */
  private calculateUCB(node: MCTSNode, parentVisits: number): number {
    if (node.visits === 0) {
      return Infinity; // 未访问的节点优先级最高
    }
    
    const exploitation = node.totalValue / node.visits;
    const exploration = this.config.cPuct * node.priorProbability * 
                       Math.sqrt(parentVisits) / (1 + node.visits);
    
    return exploitation + exploration;
  }

  /**
   * 扩展节点
   */
  private async expandNode(node: MCTSNode): Promise<void> {
    if (node.isExpanded) return;
    
    // 使用神经网络评估状态
    const stateVector = this.decodeState(node.state);
    const output = await this.network.forward(stateVector);
    
    // 添加Dirichlet噪声到根节点
    const actionProbs = Array.from(output.actionProbabilities);
    if (node.parent === null) {
      this.addDirichletNoise(actionProbs);
    }
    
    // 创建子节点
    for (let action = 0; action < actionProbs.length; action++) {
      if (actionProbs[action] > 0.001) { // 只考虑概率足够大的动作
        const childState = this.simulateAction(node.state, action);
        const childNode: MCTSNode = {
          state: childState,
          parent: node,
          children: new Map(),
          visits: 0,
          totalValue: 0,
          priorProbability: actionProbs[action],
          action,
          isExpanded: false
        };
        
        node.children.set(action, childNode);
      }
    }
    
    node.isExpanded = true;
  }

  /**
   * 添加Dirichlet噪声
   */
  private addDirichletNoise(actionProbs: number[]): void {
    const noise = this.generateDirichletNoise(actionProbs.length, this.config.dirichletAlpha);
    
    for (let i = 0; i < actionProbs.length; i++) {
      actionProbs[i] = (1 - this.config.dirichletWeight) * actionProbs[i] + 
                       this.config.dirichletWeight * noise[i];
    }
  }

  /**
   * 生成Dirichlet噪声
   */
  private generateDirichletNoise(size: number, alpha: number): number[] {
    const noise = new Array(size);
    let sum = 0;
    
    for (let i = 0; i < size; i++) {
      // 简化的Gamma分布近似
      noise[i] = Math.pow(Math.random(), 1 / alpha);
      sum += noise[i];
    }
    
    // 归一化
    for (let i = 0; i < size; i++) {
      noise[i] /= sum;
    }
    
    return noise;
  }

  /**
   * 模拟动作执行
   */
  private simulateAction(state: Float32Array, action: number): Float32Array {
    const newState = new Float32Array(state);
    
    // 简化的状态转换：根据动作修改状态
    if (action < 34) {
      // 打牌动作
      const tileIndex = action * 4;
      if (tileIndex < 136) {
        newState[tileIndex] = Math.max(0, newState[tileIndex] - 0.25);
      }
      
      // 更新可见牌
      const visibleIndex = 136 + tileIndex;
      if (visibleIndex < 272) {
        newState[visibleIndex] = Math.min(1, newState[visibleIndex] + 0.25);
      }
    }
    
    // 更新游戏进度
    if (newState.length > 304) {
      newState[304] = Math.min(1, newState[304] + 0.02);
    }
    
    return newState;
  }

  /**
   * 解码状态为网络输入格式
   */
  private decodeState(state: Float32Array): any {
    return {
      handTiles: state.slice(0, 136),
      visibleTiles: state.slice(136, 272),
      playerStates: state.slice(272, 304),
      gameContext: state.slice(304, 320)
    };
  }

  /**
   * 反向传播
   */
  private backpropagate(node: MCTSNode, value: number): void {
    while (node !== null) {
      node.visits++;
      node.totalValue += value;
      value = -value; // 对手视角下价值相反
      node = node.parent!;
    }
  }

  /**
   * 执行MCTS搜索
   */
  public async search(rootState: Float32Array): Promise<number[]> {
    const root = this.createRootNode(rootState);
    
    console.log(`🌳 开始MCTS搜索 (${this.config.simulations}次模拟)`);
    
    for (let simulation = 0; simulation < this.config.simulations; simulation++) {
      // 1. 选择
      const selectedNode = this.selectNode(root);
      
      // 2. 扩展
      await this.expandNode(selectedNode);
      
      // 3. 评估
      let value: number;
      if (selectedNode.children.size > 0) {
        // 使用神经网络评估
        const stateVector = this.decodeState(selectedNode.state);
        const output = await this.network.forward(stateVector);
        value = output.valueEstimation;
      } else {
        // 叶子节点随机评估
        value = (Math.random() - 0.5) * 2;
      }
      
      // 4. 反向传播
      this.backpropagate(selectedNode, value);
      
      // 进度报告
      if ((simulation + 1) % 20 === 0) {
        const progress = ((simulation + 1) / this.config.simulations * 100).toFixed(1);
        console.log(`   模拟进度: ${progress}% (${simulation + 1}/${this.config.simulations})`);
      }
    }
    
    // 计算最终动作概率
    const actionProbs = this.calculateActionProbabilities(root);
    
    console.log('✅ MCTS搜索完成');
    console.log(`🌳 根节点访问次数: ${root.visits}`);
    console.log(`🌳 子节点数量: ${root.children.size}`);
    
    return actionProbs;
  }

  /**
   * 计算动作概率
   */
  private calculateActionProbabilities(root: MCTSNode): number[] {
    const actionProbs = new Array(39).fill(0);
    
    if (this.config.temperature === 0) {
      // 贪婪选择
      let bestAction = -1;
      let bestVisits = -1;
      
      for (const [action, child] of root.children) {
        if (child.visits > bestVisits) {
          bestVisits = child.visits;
          bestAction = action;
        }
      }
      
      if (bestAction !== -1) {
        actionProbs[bestAction] = 1.0;
      }
    } else {
      // 温度采样
      const visits = new Array(39).fill(0);
      for (const [action, child] of root.children) {
        visits[action] = Math.pow(child.visits, 1 / this.config.temperature);
      }
      
      const sum = visits.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        for (let i = 0; i < actionProbs.length; i++) {
          actionProbs[i] = visits[i] / sum;
        }
      }
    }
    
    return actionProbs;
  }

  /**
   * 选择最佳动作
   */
  public async selectBestAction(state: Float32Array): Promise<{action: number, confidence: number}> {
    const actionProbs = await this.search(state);
    
    let bestAction = 0;
    let bestProb = actionProbs[0];
    
    for (let i = 1; i < actionProbs.length; i++) {
      if (actionProbs[i] > bestProb) {
        bestProb = actionProbs[i];
        bestAction = i;
      }
    }
    
    return {
      action: bestAction,
      confidence: bestProb
    };
  }

  /**
   * 创建测试状态
   */
  private createTestState(): Float32Array {
    const state = new Float32Array(320);
    
    // 手牌 (136维)
    for (let i = 0; i < 52; i++) {
      state[i] = Math.random() > 0.6 ? 1 : 0;
    }
    
    // 可见牌 (136维)
    for (let i = 136; i < 200; i++) {
      state[i] = Math.random() * 0.4;
    }
    
    // 玩家状态 (32维)
    for (let i = 272; i < 304; i++) {
      state[i] = 0.3 + Math.random() * 0.4;
    }
    
    // 游戏上下文 (16维)
    state[304] = 0.5; // 游戏进度50%
    state[305] = 0;   // 当前玩家
    
    return state;
  }

  /**
   * 运行AlphaZero测试
   */
  public async runAlphaZeroTest(): Promise<void> {
    console.log('🚀 开始AlphaZero完整测试');
    console.log('🌳 特性: 神经网络评估 + MCTS搜索');
    console.log('');
    
    const testGames = 5;
    const results = [];
    
    for (let gameId = 1; gameId <= testGames; gameId++) {
      console.log(`🎮 测试游戏 ${gameId}/${testGames}`);
      
      const testState = this.createTestState();
      const startTime = Date.now();
      
      const result = await this.selectBestAction(testState);
      
      const elapsed = Date.now() - startTime;
      
      console.log(`   最佳动作: ${result.action}`);
      console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   搜索时间: ${elapsed}ms`);
      console.log('');
      
      results.push({
        gameId,
        action: result.action,
        confidence: result.confidence,
        searchTime: elapsed
      });
    }
    
    // 统计结果
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgSearchTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    
    console.log('📊 AlphaZero测试统计:');
    console.log(`   平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   平均搜索时间: ${avgSearchTime.toFixed(0)}ms`);
    console.log(`   MCTS模拟次数: ${this.config.simulations}`);
    console.log(`   网络参数: ${this.network.getParameterCount()}`);
    
    // 性能评估
    if (avgConfidence > 0.7) {
      console.log('✅ AlphaZero表现优秀，决策高度集中');
    } else if (avgConfidence > 0.4) {
      console.log('✅ AlphaZero表现良好，有明确的决策偏好');
    } else {
      console.log('⚠️ AlphaZero表现一般，可能需要更多训练或调整参数');
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.network.dispose();
  }
}

// 主函数
async function main() {
  try {
    console.log('🀄 麻将AlphaZero完整实现测试');
    console.log('='.repeat(60));
    
    const alphazero = new AlphaZeroMCTS();
    await alphazero.runAlphaZeroTest();
    alphazero.dispose();
    
    console.log('✅ AlphaZero测试成功完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
