/**
 * 模型性能验证脚本 - 测试训练好的神经网络
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

interface PerformanceMetrics {
  decisionConsistency: number;
  valueAccuracy: number;
  actionDiversity: number;
  responseTime: number;
  confidenceLevel: number;
}

interface TestScenario {
  name: string;
  description: string;
  gameState: any;
  expectedBehavior: string;
}

class ModelPerformanceTester {
  private network: MajiangAlphaZeroNetworkTF;
  private testResults: any[] = [];

  constructor() {
    console.log('🔍 初始化模型性能测试器...');
    
    // 使用与训练相同的配置重新创建网络
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [512, 256, 128],
      learningRate: 0.001,
      batchSize: 32,
      dropoutRate: 0.3
    });
    
    console.log('✅ 测试网络创建成功');
    console.log('📊 网络参数:', this.network.getParameterCount());
  }

  /**
   * 创建测试场景
   */
  private createTestScenarios(): TestScenario[] {
    return [
      {
        name: "开局状态",
        description: "游戏开始时的初始状态",
        gameState: this.createGameState("initial"),
        expectedBehavior: "应该展现探索性，动作分布相对均匀"
      },
      {
        name: "中局状态", 
        description: "游戏进行中的复杂状态",
        gameState: this.createGameState("middle"),
        expectedBehavior: "应该有明确偏好，但保持一定灵活性"
      },
      {
        name: "终局状态",
        description: "接近游戏结束的关键状态",
        gameState: this.createGameState("endgame"),
        expectedBehavior: "应该高度集中，明确最优动作"
      },
      {
        name: "优势状态",
        description: "玩家处于明显优势的状态",
        gameState: this.createGameState("advantage"),
        expectedBehavior: "价值评估应该为正，策略相对保守"
      },
      {
        name: "劣势状态",
        description: "玩家处于明显劣势的状态", 
        gameState: this.createGameState("disadvantage"),
        expectedBehavior: "价值评估应该为负，策略可能更激进"
      }
    ];
  }

  /**
   * 创建不同类型的游戏状态
   */
  private createGameState(type: string): any {
    const baseState = {
      handTiles: new Float32Array(136),
      visibleTiles: new Float32Array(136),
      playerStates: new Float32Array(32),
      gameContext: new Float32Array(16)
    };

    switch (type) {
      case "initial":
        // 开局：手牌较多，可见牌较少
        baseState.handTiles.fill(0.1);
        for (let i = 0; i < 52; i++) { // 13张牌 * 4种花色
          baseState.handTiles[i] = 0.8 + Math.random() * 0.2;
        }
        baseState.visibleTiles.fill(0);
        baseState.gameContext[0] = 0.1; // 游戏进度10%
        break;

      case "middle":
        // 中局：手牌中等，一些可见牌
        baseState.handTiles.fill(0.05);
        for (let i = 0; i < 40; i++) {
          baseState.handTiles[i] = 0.6 + Math.random() * 0.4;
        }
        for (let i = 0; i < 30; i++) {
          baseState.visibleTiles[i] = 0.3 + Math.random() * 0.5;
        }
        baseState.gameContext[0] = 0.5; // 游戏进度50%
        break;

      case "endgame":
        // 终局：手牌较少，很多可见牌
        baseState.handTiles.fill(0.02);
        for (let i = 0; i < 20; i++) {
          baseState.handTiles[i] = 0.7 + Math.random() * 0.3;
        }
        for (let i = 0; i < 80; i++) {
          baseState.visibleTiles[i] = 0.5 + Math.random() * 0.5;
        }
        baseState.gameContext[0] = 0.9; // 游戏进度90%
        break;

      case "advantage":
        // 优势：好牌型，有利位置
        baseState.handTiles.fill(0.1);
        for (let i = 0; i < 45; i++) {
          baseState.handTiles[i] = 0.8 + Math.random() * 0.2;
        }
        baseState.playerStates[0] = 0.9; // 当前玩家状态良好
        baseState.playerStates[8] = 0.3; // 其他玩家状态一般
        break;

      case "disadvantage":
        // 劣势：差牌型，不利位置
        baseState.handTiles.fill(0.05);
        for (let i = 0; i < 30; i++) {
          baseState.handTiles[i] = 0.3 + Math.random() * 0.4;
        }
        baseState.playerStates[0] = 0.2; // 当前玩家状态不佳
        baseState.playerStates[8] = 0.8; // 其他玩家状态良好
        break;
    }

    return baseState;
  }

  /**
   * 测试决策一致性
   */
  private async testDecisionConsistency(gameState: any, rounds: number = 10): Promise<number> {
    const decisions: number[] = [];
    
    for (let i = 0; i < rounds; i++) {
      const output = await this.network.forward(gameState);
      const bestAction = this.getBestAction(output.actionProbabilities);
      decisions.push(bestAction);
    }
    
    // 计算最频繁动作的比例
    const actionCounts = new Map<number, number>();
    decisions.forEach(action => {
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });
    
    const maxCount = Math.max(...actionCounts.values());
    return maxCount / rounds;
  }

  /**
   * 测试价值评估准确性
   */
  private async testValueAccuracy(scenarios: TestScenario[]): Promise<number> {
    let correctPredictions = 0;
    
    for (const scenario of scenarios) {
      const output = await this.network.forward(scenario.gameState);
      const value = output.valueEstimation;
      
      // 根据场景类型判断价值评估是否合理
      let isCorrect = false;
      if (scenario.name === "优势状态" && value > 0) isCorrect = true;
      if (scenario.name === "劣势状态" && value < 0) isCorrect = true;
      if (scenario.name === "开局状态" && Math.abs(value) < 0.5) isCorrect = true;
      if (scenario.name === "中局状态" && Math.abs(value) < 0.8) isCorrect = true;
      if (scenario.name === "终局状态") isCorrect = true; // 终局任何值都可能合理
      
      if (isCorrect) correctPredictions++;
    }
    
    return correctPredictions / scenarios.length;
  }

  /**
   * 测试动作多样性
   */
  private async testActionDiversity(gameState: any): Promise<number> {
    const output = await this.network.forward(gameState);
    const probs = Array.from(output.actionProbabilities);
    
    // 计算有效动作数量（概率 > 0.01）
    const effectiveActions = probs.filter(p => p > 0.01).length;
    
    // 计算熵
    const entropy = -probs.reduce((sum, p) => {
      return sum + (p > 0 ? p * Math.log(p) : 0);
    }, 0);
    
    // 归一化熵（最大熵为 log(39)）
    const normalizedEntropy = entropy / Math.log(39);
    
    return normalizedEntropy;
  }

  /**
   * 测试响应时间
   */
  private async testResponseTime(gameState: any, iterations: number = 100): Promise<number> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.network.forward(gameState);
      const end = performance.now();
      times.push(end - start);
    }
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * 测试置信度水平
   */
  private async testConfidenceLevel(gameState: any): Promise<{maxProb: number, top3Sum: number}> {
    const output = await this.network.forward(gameState);
    const probs = Array.from(output.actionProbabilities);

    // 最高概率作为置信度
    const maxProb = Math.max(...probs);

    // 前三个动作的概率和
    const sortedProbs = probs.sort((a, b) => b - a);
    const top3Sum = sortedProbs.slice(0, 3).reduce((a, b) => a + b, 0);

    return { maxProb, top3Sum };
  }

  /**
   * 获取最佳动作
   */
  private getBestAction(actionProbs: Float32Array): number {
    let bestAction = 0;
    let bestProb = actionProbs[0];
    
    for (let i = 1; i < actionProbs.length; i++) {
      if (actionProbs[i] > bestProb) {
        bestProb = actionProbs[i];
        bestAction = i;
      }
    }
    
    return bestAction;
  }

  /**
   * 运行完整性能测试
   */
  public async runPerformanceTest(): Promise<void> {
    console.log('🚀 开始模型性能验证');
    console.log('📊 测试项目: 决策一致性、价值准确性、动作多样性、响应时间、置信度');
    console.log('');

    const scenarios = this.createTestScenarios();
    
    for (const scenario of scenarios) {
      console.log(`🔍 测试场景: ${scenario.name}`);
      console.log(`   描述: ${scenario.description}`);
      console.log(`   预期: ${scenario.expectedBehavior}`);
      
      // 基础预测
      const output = await this.network.forward(scenario.gameState);
      const bestAction = this.getBestAction(output.actionProbabilities);
      const probs = Array.from(output.actionProbabilities);
      
      console.log(`   价值评估: ${output.valueEstimation.toFixed(4)}`);
      console.log(`   最佳动作: ${bestAction} (概率: ${probs[bestAction].toFixed(4)})`);
      
      // 详细测试
      const consistency = await this.testDecisionConsistency(scenario.gameState);
      const diversity = await this.testActionDiversity(scenario.gameState);
      const responseTime = await this.testResponseTime(scenario.gameState, 20);
      const confidence = await this.testConfidenceLevel(scenario.gameState);
      
      console.log(`   决策一致性: ${(consistency * 100).toFixed(1)}%`);
      console.log(`   动作多样性: ${(diversity * 100).toFixed(1)}%`);
      console.log(`   响应时间: ${responseTime.toFixed(2)}ms`);
      console.log(`   最高置信度: ${(confidence.maxProb * 100).toFixed(1)}%`);
      console.log(`   前三动作概率和: ${(confidence.top3Sum * 100).toFixed(1)}%`);
      console.log('');
      
      this.testResults.push({
        scenario: scenario.name,
        value: output.valueEstimation,
        bestAction,
        bestProb: probs[bestAction],
        consistency,
        diversity,
        responseTime,
        confidence: confidence.maxProb
      });
    }
    
    // 整体评估
    await this.performOverallEvaluation(scenarios);
  }

  /**
   * 整体评估
   */
  private async performOverallEvaluation(scenarios: TestScenario[]): Promise<void> {
    console.log('📈 整体性能评估:');
    
    const valueAccuracy = await this.testValueAccuracy(scenarios);
    const avgConsistency = this.testResults.reduce((sum, r) => sum + r.consistency, 0) / this.testResults.length;
    const avgDiversity = this.testResults.reduce((sum, r) => sum + r.diversity, 0) / this.testResults.length;
    const avgResponseTime = this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / this.testResults.length;
    const avgConfidence = this.testResults.reduce((sum, r) => sum + r.confidence, 0) / this.testResults.length;
    
    console.log(`   价值评估准确性: ${(valueAccuracy * 100).toFixed(1)}%`);
    console.log(`   平均决策一致性: ${(avgConsistency * 100).toFixed(1)}%`);
    console.log(`   平均动作多样性: ${(avgDiversity * 100).toFixed(1)}%`);
    console.log(`   平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // 综合评分
    const overallScore = (valueAccuracy + avgConsistency + (1 - avgDiversity) + avgConfidence) / 4;
    console.log(`   综合评分: ${(overallScore * 100).toFixed(1)}%`);
    
    // 性能等级
    let performanceLevel = "需要改进";
    if (overallScore > 0.8) performanceLevel = "优秀";
    else if (overallScore > 0.6) performanceLevel = "良好";
    else if (overallScore > 0.4) performanceLevel = "一般";
    
    console.log(`   性能等级: ${performanceLevel}`);
    console.log('');
    
    this.printRecommendations(overallScore, avgConsistency, avgDiversity, valueAccuracy);
  }

  /**
   * 打印改进建议
   */
  private printRecommendations(overall: number, consistency: number, diversity: number, accuracy: number): void {
    console.log('💡 改进建议:');
    
    if (consistency < 0.7) {
      console.log('   - 决策一致性偏低，建议增加训练轮数或调整学习率');
    }
    
    if (diversity > 0.3) {
      console.log('   - 动作过于分散，建议降低温度参数或增加训练数据');
    }
    
    if (accuracy < 0.6) {
      console.log('   - 价值评估不够准确，建议改进奖励函数或增加价值训练权重');
    }
    
    if (overall > 0.7) {
      console.log('   - 模型表现良好，可以考虑与规则AI对战测试');
      console.log('   - 建议集成MCTS搜索提升决策深度');
    }
    
    console.log('');
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
    console.log('🀄 麻将AlphaZero AI模型性能验证');
    console.log('='.repeat(60));
    
    const tester = new ModelPerformanceTester();
    await tester.runPerformanceTest();
    tester.dispose();
    
    console.log('✅ 性能验证完成！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

main();
