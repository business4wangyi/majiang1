/**
 * 简化的真实训练脚本 - 直接运行，避免复杂依赖
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF, TrainingBatch } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

interface SimpleTrainingData {
  gameState: Float32Array;
  actionProbabilities: Float32Array;
  gameResult: number;
}

class SimpleTrainer {
  private network: MajiangAlphaZeroNetworkTF;
  private trainingData: SimpleTrainingData[] = [];
  private stats = {
    gamesPlayed: 0,
    totalBatches: 0,
    averageLoss: 0
  };

  constructor() {
    console.log('🔥 初始化简化训练器...');
    
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [256, 128], // 较小的网络
      learningRate: 0.001,
      batchSize: 16,
      dropoutRate: 0.2
    });
    
    console.log('✅ 网络创建成功');
    console.log('📊 网络参数:', this.network.getParameterCount());
  }

  /**
   * 模拟一局游戏
   */
  private async simulateGame(gameId: number): Promise<void> {
    const gameData: SimpleTrainingData[] = [];
    const movesPerGame = 20 + Math.floor(Math.random() * 30); // 20-50步
    
    for (let move = 0; move < movesPerGame; move++) {
      // 创建模拟状态向量
      const stateVector = {
        handTiles: new Float32Array(136).map(() => Math.random()),
        visibleTiles: new Float32Array(136).map(() => Math.random()),
        playerStates: new Float32Array(32).map(() => Math.random()),
        gameContext: new Float32Array(16).map(() => Math.random())
      };
      
      // 神经网络预测
      const output = await this.network.forward(stateVector);
      
      // 应用温度参数
      const temperature = 1.0;
      const actionProbs = this.applyTemperature(output.actionProbabilities, temperature);
      
      // 收集训练数据
      gameData.push({
        gameState: this.stateVectorToArray(stateVector),
        actionProbabilities: actionProbs,
        gameResult: 0 // 游戏结束后更新
      });
    }
    
    // 模拟游戏结果
    const winner = Math.floor(Math.random() * 4);
    for (let i = 0; i < gameData.length; i++) {
      const playerIndex = i % 4;
      gameData[i].gameResult = playerIndex === winner ? 1.0 : -1.0;
    }
    
    // 添加到训练数据
    this.trainingData.push(...gameData);
    
    // 限制数据大小
    while (this.trainingData.length > 1000) {
      this.trainingData.shift();
    }
  }

  /**
   * 训练网络
   */
  private async trainNetwork(): Promise<void> {
    if (this.trainingData.length < 16) return;
    
    // 随机采样批次
    const batchSize = Math.min(16, this.trainingData.length);
    const batch: SimpleTrainingData[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.trainingData.length);
      batch.push(this.trainingData[randomIndex]);
    }
    
    // 准备训练数据
    const states = tf.tensor2d(
      batch.map(d => Array.from(d.gameState)),
      [batchSize, 320]
    ) as tf.Tensor2D;
    
    const actionProbs = tf.tensor2d(
      batch.map(d => Array.from(d.actionProbabilities)),
      [batchSize, 39]
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
      
    } finally {
      // 清理内存
      states.dispose();
      actionProbs.dispose();
      values.dispose();
    }
  }

  /**
   * 开始训练
   */
  public async startTraining(): Promise<void> {
    console.log('🚀 开始简化真实训练');
    console.log('📊 配置: 50局游戏, 每5局训练一次');
    console.log('');
    
    const totalGames = 50;
    
    for (let gameId = 1; gameId <= totalGames; gameId++) {
      await this.simulateGame(gameId);
      this.stats.gamesPlayed = gameId;
      
      // 每积累足够数据就训练
      if (this.trainingData.length >= 16) {
        await this.trainNetwork();
      }
      
      // 定期日志
      if (gameId % 5 === 0) {
        const progress = (gameId / totalGames * 100).toFixed(1);
        console.log(`📊 训练进度 ${progress}% | 游戏 ${gameId}/${totalGames}`);
        console.log(`   训练数据: ${this.trainingData.length}条`);
        console.log(`   训练批次: ${this.stats.totalBatches}`);
        console.log(`   平均损失: ${this.stats.averageLoss.toFixed(4)}`);
        console.log('');
      }
    }
    
    console.log('🎉 训练完成！');
    this.printFinalStats();
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
  private printFinalStats(): void {
    console.log('📈 最终训练统计:');
    console.log(`   总游戏数: ${this.stats.gamesPlayed}`);
    console.log(`   训练数据: ${this.trainingData.length}条`);
    console.log(`   训练批次: ${this.stats.totalBatches}`);
    console.log(`   最终损失: ${this.stats.averageLoss.toFixed(4)}`);
    console.log(`   网络参数: ${this.network.getParameterCount()}`);
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
    console.log('🀄 麻将AlphaZero AI简化真实训练');
    console.log('='.repeat(50));
    
    const trainer = new SimpleTrainer();
    await trainer.startTraining();
    trainer.dispose();
    
    console.log('✅ 训练成功完成！');
    
  } catch (error) {
    console.error('❌ 训练失败:', error);
    process.exit(1);
  }
}

main();
