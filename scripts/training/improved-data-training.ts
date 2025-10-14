/**
 * 改进训练数据质量的高级训练脚本
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF, TrainingBatch } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

interface HighQualityTrainingData {
  gameState: Float32Array;
  actionProbabilities: Float32Array;
  gameResult: number;
  gamePhase: string;
  strategicValue: number;
  gameId: number;
  moveNumber: number;
}

interface GamePattern {
  name: string;
  weight: number;
  stateGenerator: () => any;
  rewardFunction: (moves: number, outcome: number) => number;
}

class ImprovedDataTrainer {
  private network: MajiangAlphaZeroNetworkTF;
  private trainingData: HighQualityTrainingData[] = [];
  private gamePatterns: GamePattern[];
  private stats = {
    gamesPlayed: 0,
    totalMoves: 0,
    trainingDataCollected: 0,
    totalBatches: 0,
    averageLoss: 0,
    averagePolicyLoss: 0,
    averageValueLoss: 0,
    startTime: Date.now()
  };

  constructor() {
    console.log('🔥 初始化改进数据训练器...');
    
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [512, 256, 128],
      learningRate: 0.0005, // 降低学习率
      batchSize: 32,
      dropoutRate: 0.2 // 降低dropout
    });
    
    this.gamePatterns = this.createGamePatterns();
    
    console.log('✅ 改进训练器创建成功');
    console.log('📊 网络参数:', this.network.getParameterCount());
    console.log('🎯 游戏模式:', this.gamePatterns.length, '种');
  }

  /**
   * 创建游戏模式
   */
  private createGamePatterns(): GamePattern[] {
    return [
      {
        name: "快速胜利",
        weight: 0.15,
        stateGenerator: () => this.generateWinningPattern(),
        rewardFunction: (moves, outcome) => outcome > 0 ? 1.0 - (moves / 100) : -0.8
      },
      {
        name: "防守反击",
        weight: 0.20,
        stateGenerator: () => this.generateDefensivePattern(),
        rewardFunction: (moves, outcome) => outcome > 0 ? 0.8 : -0.6
      },
      {
        name: "稳健发展",
        weight: 0.25,
        stateGenerator: () => this.generateSteadyPattern(),
        rewardFunction: (moves, outcome) => outcome > 0 ? 0.6 : -0.4
      },
      {
        name: "激进进攻",
        weight: 0.20,
        stateGenerator: () => this.generateAggressivePattern(),
        rewardFunction: (moves, outcome) => outcome > 0 ? 0.9 : -0.7
      },
      {
        name: "复杂局面",
        weight: 0.20,
        stateGenerator: () => this.generateComplexPattern(),
        rewardFunction: (moves, outcome) => outcome > 0 ? 0.7 : -0.5
      }
    ];
  }

  /**
   * 生成获胜模式状态
   */
  private generateWinningPattern(): any {
    return {
      handTiles: new Float32Array(136).map((_, i) => {
        // 模拟接近胡牌的手牌
        if (i < 40) return 0.8 + Math.random() * 0.2; // 好牌
        return Math.random() * 0.1; // 其他牌很少
      }),
      visibleTiles: new Float32Array(136).map(() => Math.random() * 0.6),
      playerStates: new Float32Array(32).map((_, i) => {
        if (i % 8 === 0) return 0.9; // 当前玩家状态好
        return 0.3 + Math.random() * 0.4; // 其他玩家一般
      }),
      gameContext: new Float32Array(16).map((_, i) => {
        if (i === 0) return 0.7 + Math.random() * 0.3; // 游戏后期
        if (i === 1) return Math.random(); // 当前玩家
        return Math.random() * 0.5;
      })
    };
  }

  /**
   * 生成防守模式状态
   */
  private generateDefensivePattern(): any {
    return {
      handTiles: new Float32Array(136).map((_, i) => {
        // 模拟防守型手牌
        if (i < 50) return 0.4 + Math.random() * 0.4; // 中等牌力
        return Math.random() * 0.2;
      }),
      visibleTiles: new Float32Array(136).map(() => 0.3 + Math.random() * 0.5),
      playerStates: new Float32Array(32).map((_, i) => {
        if (i % 8 === 0) return 0.4 + Math.random() * 0.3; // 当前玩家中等
        return 0.6 + Math.random() * 0.3; // 其他玩家较强
      }),
      gameContext: new Float32Array(16).map((_, i) => {
        if (i === 0) return 0.4 + Math.random() * 0.4; // 中期
        return Math.random() * 0.6;
      })
    };
  }

  /**
   * 生成稳健模式状态
   */
  private generateSteadyPattern(): any {
    return {
      handTiles: new Float32Array(136).map(() => 0.3 + Math.random() * 0.4),
      visibleTiles: new Float32Array(136).map(() => 0.2 + Math.random() * 0.4),
      playerStates: new Float32Array(32).map(() => 0.4 + Math.random() * 0.3),
      gameContext: new Float32Array(16).map((_, i) => {
        if (i === 0) return 0.3 + Math.random() * 0.5; // 各阶段都可能
        return Math.random() * 0.7;
      })
    };
  }

  /**
   * 生成激进模式状态
   */
  private generateAggressivePattern(): any {
    return {
      handTiles: new Float32Array(136).map((_, i) => {
        // 模拟激进型手牌：要么很好要么很差
        if (i < 30) return Math.random() > 0.5 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.2;
        return Math.random() * 0.3;
      }),
      visibleTiles: new Float32Array(136).map(() => Math.random() * 0.8),
      playerStates: new Float32Array(32).map((_, i) => {
        if (i % 8 === 0) return 0.2 + Math.random() * 0.6; // 当前玩家状态不稳定
        return 0.3 + Math.random() * 0.5;
      }),
      gameContext: new Float32Array(16).map(() => Math.random() * 0.9)
    };
  }

  /**
   * 生成复杂模式状态
   */
  private generateComplexPattern(): any {
    return {
      handTiles: new Float32Array(136).map(() => Math.random() * 0.8),
      visibleTiles: new Float32Array(136).map(() => Math.random() * 0.7),
      playerStates: new Float32Array(32).map(() => Math.random() * 0.8),
      gameContext: new Float32Array(16).map(() => Math.random() * 0.8)
    };
  }

  /**
   * 选择游戏模式
   */
  private selectGamePattern(): GamePattern {
    const random = Math.random();
    let cumulative = 0;
    
    for (const pattern of this.gamePatterns) {
      cumulative += pattern.weight;
      if (random < cumulative) {
        return pattern;
      }
    }
    
    return this.gamePatterns[this.gamePatterns.length - 1];
  }

  /**
   * 模拟高质量游戏
   */
  private async simulateHighQualityGame(gameId: number): Promise<void> {
    const pattern = this.selectGamePattern();
    const gameData: HighQualityTrainingData[] = [];
    const movesPerGame = this.getGameLength(pattern.name);
    
    console.log(`🎮 游戏${gameId}: ${pattern.name} (${movesPerGame}步)`);
    
    for (let move = 0; move < movesPerGame; move++) {
      // 生成状态
      const gameState = pattern.stateGenerator();
      
      // 添加游戏进度信息
      gameState.gameContext[0] = move / movesPerGame;
      
      // 神经网络预测
      const output = await this.network.forward(gameState);
      
      // 智能温度控制
      const temperature = this.calculateTemperature(pattern.name, move, movesPerGame);
      const actionProbs = this.applyTemperature(output.actionProbabilities, temperature);
      
      // 计算战略价值
      const strategicValue = this.calculateStrategicValue(pattern.name, move, movesPerGame);
      
      // 收集训练数据
      gameData.push({
        gameState: this.stateVectorToArray(gameState),
        actionProbabilities: actionProbs,
        gameResult: 0, // 游戏结束后更新
        gamePhase: this.getGamePhase(move, movesPerGame),
        strategicValue,
        gameId,
        moveNumber: move
      });
      
      this.stats.totalMoves++;
    }
    
    // 计算游戏结果
    const gameOutcome = this.calculateGameOutcome(pattern.name, movesPerGame);
    
    // 更新所有数据的奖励
    for (let i = 0; i < gameData.length; i++) {
      const playerIndex = i % 4;
      const baseReward = gameOutcome[playerIndex];
      const finalReward = pattern.rewardFunction(gameData[i].moveNumber, baseReward);
      gameData[i].gameResult = finalReward;
    }
    
    // 添加到训练数据
    this.trainingData.push(...gameData);
    this.stats.trainingDataCollected = this.trainingData.length;
    
    // 限制数据大小，优先保留高质量数据
    this.pruneTrainingData();
    
    this.stats.gamesPlayed = gameId;
  }

  /**
   * 获取游戏长度
   */
  private getGameLength(patternName: string): number {
    const baseLengths: {[key: string]: number} = {
      "快速胜利": 25,
      "防守反击": 45,
      "稳健发展": 55,
      "激进进攻": 35,
      "复杂局面": 65
    };

    const base = baseLengths[patternName] || 40;
    return base + Math.floor(Math.random() * 20) - 10; // ±10步随机
  }

  /**
   * 计算温度参数
   */
  private calculateTemperature(patternName: string, move: number, totalMoves: number): number {
    const progress = move / totalMoves;

    const baseTemperatures: {[key: string]: number} = {
      "快速胜利": 0.3,
      "防守反击": 0.8,
      "稳健发展": 0.6,
      "激进进攻": 1.2,
      "复杂局面": 1.0
    };

    const baseTemp = baseTemperatures[patternName] || 0.8;

    // 随游戏进行降低温度
    return Math.max(0.1, baseTemp * (1 - progress * 0.7));
  }

  /**
   * 计算战略价值
   */
  private calculateStrategicValue(patternName: string, move: number, totalMoves: number): number {
    const progress = move / totalMoves;

    const strategicValues: {[key: string]: number} = {
      "快速胜利": 0.9 - progress * 0.3,
      "防守反击": 0.3 + progress * 0.5,
      "稳健发展": 0.5 + Math.sin(progress * Math.PI) * 0.3,
      "激进进攻": 0.7 + (Math.random() - 0.5) * 0.6,
      "复杂局面": 0.4 + Math.random() * 0.4
    };

    return strategicValues[patternName] || 0.5;
  }

  /**
   * 获取游戏阶段
   */
  private getGamePhase(move: number, totalMoves: number): string {
    const progress = move / totalMoves;
    if (progress < 0.3) return "开局";
    if (progress < 0.7) return "中局";
    return "终局";
  }

  /**
   * 计算游戏结果
   */
  private calculateGameOutcome(patternName: string, gameLength: number): number[] {
    // 基于模式的胜率
    const winRates: {[key: string]: number[]} = {
      "快速胜利": [0.6, 0.2, 0.1, 0.1],
      "防守反击": [0.4, 0.3, 0.2, 0.1],
      "稳健发展": [0.35, 0.25, 0.25, 0.15],
      "激进进攻": [0.5, 0.2, 0.2, 0.1],
      "复杂局面": [0.3, 0.25, 0.25, 0.2]
    };

    const rates = winRates[patternName] || [0.25, 0.25, 0.25, 0.25];
    
    // 选择获胜者
    const random = Math.random();
    let cumulative = 0;
    let winner = 0;
    
    for (let i = 0; i < 4; i++) {
      cumulative += rates[i];
      if (random < cumulative) {
        winner = i;
        break;
      }
    }
    
    // 返回奖励（更细致的奖励分配）
    return [0, 1, 2, 3].map(i => {
      if (i === winner) return 1.0;
      if (i === (winner + 2) % 4) return -0.8; // 对家
      return -0.4; // 其他玩家
    });
  }

  /**
   * 修剪训练数据
   */
  private pruneTrainingData(): void {
    const maxSize = 6000;
    if (this.trainingData.length <= maxSize) return;
    
    // 按战略价值排序，保留高价值数据
    this.trainingData.sort((a, b) => b.strategicValue - a.strategicValue);
    this.trainingData = this.trainingData.slice(0, maxSize);
  }

  /**
   * 智能训练
   */
  private async trainNetworkSmart(): Promise<void> {
    if (this.trainingData.length < 32) return;
    
    // 分层采样：不同游戏阶段的数据
    const batchSize = 32;
    const batch: HighQualityTrainingData[] = [];
    
    // 30%开局，40%中局，30%终局
    const phases = ["开局", "中局", "终局"];
    const phaseRatios = [0.3, 0.4, 0.3];
    
    for (let i = 0; i < phases.length; i++) {
      const phaseData = this.trainingData.filter(d => d.gamePhase === phases[i]);
      const phaseCount = Math.floor(batchSize * phaseRatios[i]);
      
      for (let j = 0; j < phaseCount && phaseData.length > 0; j++) {
        const randomIndex = Math.floor(Math.random() * phaseData.length);
        batch.push(phaseData[randomIndex]);
      }
    }
    
    // 填充剩余位置
    while (batch.length < batchSize && this.trainingData.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.trainingData.length);
      batch.push(this.trainingData[randomIndex]);
    }
    
    if (batch.length === 0) return;
    
    // 准备训练数据
    const states = tf.tensor2d(
      batch.map(d => Array.from(d.gameState)),
      [batch.length, 320]
    ) as tf.Tensor2D;
    
    const actionProbs = tf.tensor2d(
      batch.map(d => Array.from(d.actionProbabilities)),
      [batch.length, 39]
    ) as tf.Tensor2D;
    
    const values = tf.tensor1d(batch.map(d => d.gameResult)) as tf.Tensor1D;
    
    const trainingBatch: TrainingBatch = { states, actionProbs, values };
    
    try {
      // 训练
      const loss = await this.network.trainBatch(trainingBatch);
      
      // 更新统计
      this.stats.totalBatches++;
      const alpha = 0.1;
      this.stats.averageLoss = this.stats.averageLoss * (1 - alpha) + loss.totalLoss * alpha;
      this.stats.averagePolicyLoss = this.stats.averagePolicyLoss * (1 - alpha) + loss.policyLoss * alpha;
      this.stats.averageValueLoss = this.stats.averageValueLoss * (1 - alpha) + loss.valueLoss * alpha;
      
    } finally {
      // 清理内存
      states.dispose();
      actionProbs.dispose();
      values.dispose();
    }
  }

  /**
   * 开始改进训练
   */
  public async startImprovedTraining(): Promise<void> {
    console.log('🚀 开始改进数据质量训练');
    console.log('📊 配置: 300局高质量游戏');
    console.log('🧠 网络: 333,736个参数');
    console.log('🎯 游戏模式: 5种战略模式');
    console.log('💾 数据: 最大6,000条高质量数据');
    console.log('');

    const totalGames = 300;

    for (let gameId = 1; gameId <= totalGames; gameId++) {
      await this.simulateHighQualityGame(gameId);

      // 每积累足够数据就训练
      if (this.trainingData.length >= 32) {
        await this.trainNetworkSmart();
      }

      // 定期日志
      if (gameId % 20 === 0) {
        this.logProgress(gameId, totalGames);
      }

      // 定期评估
      if (gameId % 50 === 0) {
        await this.evaluateImprovement(gameId);
      }
    }

    console.log('🎉 改进训练完成！');
    this.printFinalStats(totalGames);
  }

  /**
   * 记录进度
   */
  private logProgress(gameId: number, totalGames: number): void {
    const progress = (gameId / totalGames * 100).toFixed(1);
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const gamesPerSecond = gameId / elapsed;

    console.log(`📊 训练进度 ${progress}% | 游戏 ${gameId}/${totalGames}`);
    console.log(`   训练数据: ${this.stats.trainingDataCollected}条`);
    console.log(`   训练批次: ${this.stats.totalBatches}`);
    console.log(`   总损失: ${this.stats.averageLoss.toFixed(4)}`);
    console.log(`   策略损失: ${this.stats.averagePolicyLoss.toFixed(4)}`);
    console.log(`   价值损失: ${this.stats.averageValueLoss.toFixed(4)}`);
    console.log(`   速度: ${gamesPerSecond.toFixed(2)}局/秒`);
    console.log('');
  }

  /**
   * 评估改进效果
   */
  private async evaluateImprovement(gameId: number): Promise<void> {
    console.log(`🔍 改进效果评估 (第${gameId}局)`);

    // 测试不同模式的状态
    const testStates = [
      this.generateWinningPattern(),
      this.generateDefensivePattern(),
      this.generateAggressivePattern()
    ];

    const results = [];
    for (const state of testStates) {
      const output = await this.network.forward(state);
      const probs = Array.from(output.actionProbabilities);
      const maxProb = Math.max(...probs);
      const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);

      results.push({
        value: output.valueEstimation,
        maxProb,
        entropy: entropy / Math.log(39) // 归一化熵
      });
    }

    const avgMaxProb = results.reduce((sum, r) => sum + r.maxProb, 0) / results.length;
    const avgEntropy = results.reduce((sum, r) => sum + r.entropy, 0) / results.length;
    const avgValue = results.reduce((sum, r) => sum + Math.abs(r.value), 0) / results.length;

    console.log(`   平均最大概率: ${(avgMaxProb * 100).toFixed(1)}%`);
    console.log(`   平均熵: ${(avgEntropy * 100).toFixed(1)}%`);
    console.log(`   平均价值幅度: ${avgValue.toFixed(3)}`);
    console.log('');
  }

  /**
   * 应用温度参数
   */
  private applyTemperature(probs: Float32Array, temperature: number): Float32Array {
    if (temperature === 0) {
      const maxIndex = probs.indexOf(Math.max(...probs));
      const result = new Float32Array(probs.length);
      result[maxIndex] = 1.0;
      return result;
    }

    const result = new Float32Array(probs.length);
    let sum = 0;

    for (let i = 0; i < probs.length; i++) {
      result[i] = Math.pow(probs[i], 1 / temperature);
      sum += result[i];
    }

    for (let i = 0; i < result.length; i++) {
      result[i] /= sum;
    }

    return result;
  }

  /**
   * 状态向量转数组
   */
  private stateVectorToArray(stateVector: any): Float32Array {
    const result: number[] = [];
    result.push(...Array.from(stateVector.handTiles).map(x => Number(x)));
    result.push(...Array.from(stateVector.visibleTiles).map(x => Number(x)));
    result.push(...Array.from(stateVector.playerStates).map(x => Number(x)));
    result.push(...Array.from(stateVector.gameContext).map(x => Number(x)));
    return new Float32Array(result);
  }

  /**
   * 打印最终统计
   */
  private printFinalStats(totalGames: number): void {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;

    console.log('📈 改进训练最终统计:');
    console.log(`   总游戏数: ${this.stats.gamesPlayed}`);
    console.log(`   总步数: ${this.stats.totalMoves}`);
    console.log(`   高质量训练数据: ${this.stats.trainingDataCollected}条`);
    console.log(`   智能训练批次: ${this.stats.totalBatches}`);
    console.log(`   最终损失: ${this.stats.averageLoss.toFixed(4)}`);
    console.log(`   策略损失: ${this.stats.averagePolicyLoss.toFixed(4)}`);
    console.log(`   价值损失: ${this.stats.averageValueLoss.toFixed(4)}`);
    console.log(`   总训练时间: ${(totalTime/60).toFixed(1)}分钟`);
    console.log(`   平均速度: ${(this.stats.gamesPlayed/totalTime).toFixed(2)}局/秒`);

    // 数据质量分析
    const phaseDistribution = this.analyzeDataDistribution();
    console.log('📊 数据质量分析:');
    console.log(`   开局数据: ${phaseDistribution.开局}条`);
    console.log(`   中局数据: ${phaseDistribution.中局}条`);
    console.log(`   终局数据: ${phaseDistribution.终局}条`);
  }

  /**
   * 分析数据分布
   */
  private analyzeDataDistribution(): {[key: string]: number} {
    const distribution: {[key: string]: number} = { 开局: 0, 中局: 0, 终局: 0 };

    this.trainingData.forEach(data => {
      distribution[data.gamePhase]++;
    });

    return distribution;
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
    console.log('🀄 麻将AlphaZero AI改进数据质量训练');
    console.log('='.repeat(60));

    const trainer = new ImprovedDataTrainer();
    await trainer.startImprovedTraining();
    trainer.dispose();

    console.log('✅ 改进训练成功完成！');

  } catch (error) {
    console.error('❌ 训练失败:', error);
    process.exit(1);
  }
}

main();
