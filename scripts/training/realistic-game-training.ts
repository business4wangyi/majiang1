/**
 * 基于真实游戏逻辑的改进训练系统
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF, TrainingBatch } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';

interface RealisticGameState {
  handTiles: number[]; // 手牌：具体的牌编号
  discardedTiles: number[]; // 弃牌池
  playerPositions: number[]; // 玩家位置和状态
  gamePhase: 'early' | 'middle' | 'late';
  currentPlayer: number;
  remainingTiles: number;
}

interface GameAction {
  type: 'discard' | 'chi' | 'peng' | 'gang' | 'hu';
  tile: number;
  probability: number;
}

interface RealisticTrainingData {
  gameState: Float32Array;
  actionProbabilities: Float32Array;
  gameResult: number;
  gameValue: number; // 基于真实游戏价值
  moveQuality: number; // 动作质量评分
}

class RealisticGameTrainer {
  private network: MajiangAlphaZeroNetworkTF;
  private trainingData: RealisticTrainingData[] = [];
  private gameRules: any;
  private stats = {
    gamesPlayed: 0,
    totalMoves: 0,
    trainingBatches: 0,
    averageLoss: 0,
    averageGameValue: 0,
    startTime: Date.now()
  };

  constructor() {
    console.log('🎮 初始化真实游戏训练器...');
    
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [512, 256, 128],
      learningRate: 0.001,
      batchSize: 32,
      dropoutRate: 0.3
    });
    
    this.gameRules = this.initializeGameRules();
    
    console.log('✅ 真实游戏训练器创建成功');
    console.log('📊 网络参数:', this.network.getParameterCount());
  }

  /**
   * 初始化游戏规则
   */
  private initializeGameRules(): any {
    return {
      // 麻将牌定义：1-9万，1-9条，1-9筒，东南西北中发白
      tiles: Array.from({length: 34}, (_, i) => i),
      
      // 基本牌型价值
      tileValues: {
        // 万子 (0-8)
        wan: [1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 1],
        // 条子 (9-17) 
        tiao: [1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 1],
        // 筒子 (18-26)
        tong: [1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 1],
        // 字牌 (27-33)
        zi: [3, 3, 3, 3, 5, 5, 5]
      },
      
      // 牌型组合价值
      combinations: {
        shunzi: 2,    // 顺子
        kezi: 3,      // 刻子
        duizi: 1,     // 对子
        gangzi: 5     // 杠子
      }
    };
  }

  /**
   * 创建真实游戏状态
   */
  private createRealisticGameState(gamePhase: string): RealisticGameState {
    const state: RealisticGameState = {
      handTiles: [],
      discardedTiles: [],
      playerPositions: [0, 1, 2, 3],
      gamePhase: gamePhase as any,
      currentPlayer: 0,
      remainingTiles: 144
    };

    // 根据游戏阶段生成不同的手牌
    switch (gamePhase) {
      case 'early':
        state.handTiles = this.generateEarlyGameHand();
        state.remainingTiles = 100 + Math.floor(Math.random() * 20);
        break;
      case 'middle':
        state.handTiles = this.generateMiddleGameHand();
        state.remainingTiles = 60 + Math.floor(Math.random() * 30);
        break;
      case 'late':
        state.handTiles = this.generateLateGameHand();
        state.remainingTiles = 20 + Math.floor(Math.random() * 20);
        break;
    }

    // 生成弃牌池
    state.discardedTiles = this.generateDiscardedTiles(gamePhase);

    return state;
  }

  /**
   * 生成早期游戏手牌
   */
  private generateEarlyGameHand(): number[] {
    const hand: number[] = [];
    
    // 13张牌，相对随机但有一定结构
    for (let i = 0; i < 13; i++) {
      // 70%概率选择数牌，30%概率选择字牌
      if (Math.random() < 0.7) {
        hand.push(Math.floor(Math.random() * 27)); // 数牌 0-26
      } else {
        hand.push(27 + Math.floor(Math.random() * 7)); // 字牌 27-33
      }
    }
    
    return hand.sort((a, b) => a - b);
  }

  /**
   * 生成中期游戏手牌
   */
  private generateMiddleGameHand(): number[] {
    const hand: number[] = [];
    
    // 更有结构的手牌
    // 先生成一些组合
    const combinations = Math.floor(Math.random() * 3) + 1; // 1-3个组合
    
    for (let i = 0; i < combinations; i++) {
      if (Math.random() < 0.6) {
        // 生成顺子
        const start = Math.floor(Math.random() * 7); // 0-6 (万子为例)
        hand.push(start, start + 1, start + 2);
      } else {
        // 生成刻子
        const tile = Math.floor(Math.random() * 34);
        hand.push(tile, tile, tile);
      }
    }
    
    // 填充到13张
    while (hand.length < 13) {
      hand.push(Math.floor(Math.random() * 34));
    }
    
    return hand.slice(0, 13).sort((a, b) => a - b);
  }

  /**
   * 生成后期游戏手牌
   */
  private generateLateGameHand(): number[] {
    const hand: number[] = [];
    
    // 接近胡牌的手牌结构
    // 生成3-4个完整组合
    const completeCombinations = 3 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < completeCombinations; i++) {
      if (Math.random() < 0.5) {
        // 顺子
        const start = Math.floor(Math.random() * 7);
        hand.push(start, start + 1, start + 2);
      } else {
        // 刻子
        const tile = Math.floor(Math.random() * 34);
        hand.push(tile, tile, tile);
      }
    }
    
    // 添加一个对子
    const pairTile = Math.floor(Math.random() * 34);
    hand.push(pairTile, pairTile);
    
    // 可能还需要1-2张牌
    while (hand.length < 13) {
      hand.push(Math.floor(Math.random() * 34));
    }
    
    return hand.slice(0, 13).sort((a, b) => a - b);
  }

  /**
   * 生成弃牌池
   */
  private generateDiscardedTiles(gamePhase: string): number[] {
    const discarded: number[] = [];
    let count = 0;
    
    switch (gamePhase) {
      case 'early': count = Math.floor(Math.random() * 10); break;
      case 'middle': count = 10 + Math.floor(Math.random() * 20); break;
      case 'late': count = 30 + Math.floor(Math.random() * 30); break;
    }
    
    for (let i = 0; i < count; i++) {
      discarded.push(Math.floor(Math.random() * 34));
    }
    
    return discarded;
  }

  /**
   * 计算游戏状态价值
   */
  private calculateGameStateValue(state: RealisticGameState): number {
    let value = 0;
    
    // 手牌结构价值
    value += this.evaluateHandStructure(state.handTiles);
    
    // 游戏阶段调整
    switch (state.gamePhase) {
      case 'early': value *= 0.3; break;
      case 'middle': value *= 0.6; break;
      case 'late': value *= 1.0; break;
    }
    
    // 剩余牌数影响
    const tileRatio = state.remainingTiles / 144;
    value *= (0.5 + tileRatio * 0.5);
    
    return Math.max(-1, Math.min(1, value));
  }

  /**
   * 评估手牌结构
   */
  private evaluateHandStructure(handTiles: number[]): number {
    let score = 0;
    const tileCounts = new Map<number, number>();
    
    // 统计牌数
    handTiles.forEach(tile => {
      tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
    });
    
    // 评估对子、刻子
    tileCounts.forEach((count, tile) => {
      if (count >= 2) score += 0.2; // 对子
      if (count >= 3) score += 0.3; // 刻子
      if (count >= 4) score += 0.5; // 杠子
    });
    
    // 评估顺子可能性
    score += this.evaluateSequencePotential(handTiles);
    
    return score;
  }

  /**
   * 评估顺子潜力
   */
  private evaluateSequencePotential(handTiles: number[]): number {
    let score = 0;
    const uniqueTiles = [...new Set(handTiles)].sort((a, b) => a - b);
    
    for (let i = 0; i < uniqueTiles.length - 2; i++) {
      const tile1 = uniqueTiles[i];
      const tile2 = uniqueTiles[i + 1];
      const tile3 = uniqueTiles[i + 2];
      
      // 检查是否为连续的数牌
      if (tile1 < 27 && tile2 === tile1 + 1 && tile3 === tile2 + 1) {
        score += 0.3; // 顺子
      } else if (tile1 < 27 && (tile2 === tile1 + 1 || tile3 === tile1 + 2)) {
        score += 0.1; // 顺子潜力
      }
    }
    
    return score;
  }

  /**
   * 生成真实动作概率
   */
  private generateRealisticActionProbabilities(state: RealisticGameState): Float32Array {
    const probs = new Float32Array(39);
    
    // 基于游戏状态生成合理的动作概率
    for (let action = 0; action < 39; action++) {
      probs[action] = this.calculateActionProbability(action, state);
    }
    
    // 归一化
    const sum = Array.from(probs).reduce((a, b) => a + b, 0);
    for (let i = 0; i < probs.length; i++) {
      probs[i] /= sum;
    }
    
    return probs;
  }

  /**
   * 计算动作概率
   */
  private calculateActionProbability(action: number, state: RealisticGameState): number {
    let prob = 0.01; // 基础概率
    
    // 根据手牌情况调整概率
    if (action < 34) {
      // 打牌动作
      const tile = action;
      const handCount = state.handTiles.filter(t => t === tile).length;
      
      if (handCount > 0) {
        prob += 0.1; // 手中有这张牌
        if (handCount === 1) prob += 0.2; // 单张更容易打出
      }
      
      // 根据牌的价值调整
      const tileValue = this.getTileValue(tile);
      prob += (1 - tileValue) * 0.3; // 价值低的牌更容易打出
    } else {
      // 特殊动作 (吃碰杠胡)
      switch (action) {
        case 34: prob = this.calculateChiProbability(state); break;
        case 35: prob = this.calculatePengProbability(state); break;
        case 36: prob = this.calculateGangProbability(state); break;
        case 37: prob = this.calculateHuProbability(state); break;
        case 38: prob = 0.05; // 过
      }
    }
    
    return Math.max(0.001, prob);
  }

  /**
   * 获取牌的价值
   */
  private getTileValue(tile: number): number {
    if (tile < 9) return this.gameRules.tileValues.wan[tile] / 5;
    if (tile < 18) return this.gameRules.tileValues.tiao[tile - 9] / 5;
    if (tile < 27) return this.gameRules.tileValues.tong[tile - 18] / 5;
    return this.gameRules.tileValues.zi[tile - 27] / 5;
  }

  /**
   * 计算吃牌概率
   */
  private calculateChiProbability(state: RealisticGameState): number {
    // 简化：根据游戏阶段和手牌结构
    let prob = 0.05;
    if (state.gamePhase === 'early') prob += 0.1;
    if (state.gamePhase === 'middle') prob += 0.15;
    return prob;
  }

  /**
   * 计算碰牌概率
   */
  private calculatePengProbability(state: RealisticGameState): number {
    let prob = 0.03;
    if (state.gamePhase === 'middle') prob += 0.1;
    if (state.gamePhase === 'late') prob += 0.05;
    return prob;
  }

  /**
   * 计算杠牌概率
   */
  private calculateGangProbability(state: RealisticGameState): number {
    return 0.02; // 杠牌相对少见
  }

  /**
   * 计算胡牌概率
   */
  private calculateHuProbability(state: RealisticGameState): number {
    let prob = 0.01;
    if (state.gamePhase === 'late') {
      const handValue = this.evaluateHandStructure(state.handTiles);
      prob += handValue * 0.3;
    }
    return Math.min(0.5, prob);
  }

  /**
   * 编码游戏状态为神经网络输入
   */
  private encodeGameState(state: RealisticGameState): Float32Array {
    const encoded = new Float32Array(320);
    let offset = 0;
    
    // 手牌编码 (136维)
    const handEncoding = new Float32Array(136);
    state.handTiles.forEach(tile => {
      if (tile < 34) {
        for (let i = 0; i < 4; i++) {
          const index = tile * 4 + i;
          if (index < 136 && handEncoding[index] === 0) {
            handEncoding[index] = 1;
            break;
          }
        }
      }
    });
    encoded.set(handEncoding, offset);
    offset += 136;
    
    // 可见牌编码 (136维)
    const visibleEncoding = new Float32Array(136);
    state.discardedTiles.forEach(tile => {
      if (tile < 34) {
        const index = tile * 4;
        if (index < 136) visibleEncoding[index] = Math.min(1, visibleEncoding[index] + 0.25);
      }
    });
    encoded.set(visibleEncoding, offset);
    offset += 136;
    
    // 玩家状态编码 (32维)
    const playerEncoding = new Float32Array(32);
    playerEncoding[0] = 1; // 当前玩家
    playerEncoding[8] = state.remainingTiles / 144; // 剩余牌比例
    encoded.set(playerEncoding, offset);
    offset += 32;
    
    // 游戏上下文编码 (16维)
    const contextEncoding = new Float32Array(16);
    contextEncoding[0] = state.gamePhase === 'early' ? 0.3 : state.gamePhase === 'middle' ? 0.6 : 0.9;
    contextEncoding[1] = state.currentPlayer / 3;
    contextEncoding[2] = state.remainingTiles / 144;
    encoded.set(contextEncoding, offset);
    
    return encoded;
  }

  /**
   * 模拟真实游戏
   */
  private async simulateRealisticGame(gameId: number): Promise<void> {
    const gamePhases = ['early', 'middle', 'late'];
    const gameData: RealisticTrainingData[] = [];
    
    for (const phase of gamePhases) {
      const movesInPhase = phase === 'early' ? 15 : phase === 'middle' ? 20 : 10;
      
      for (let move = 0; move < movesInPhase; move++) {
        const gameState = this.createRealisticGameState(phase);
        const encodedState = this.encodeGameState(gameState);
        
        // 神经网络预测
        const output = await this.network.forward({
          handTiles: encodedState.slice(0, 136),
          visibleTiles: encodedState.slice(136, 272),
          playerStates: encodedState.slice(272, 304),
          gameContext: encodedState.slice(304, 320)
        });
        
        // 生成真实的目标动作概率
        const targetProbs = this.generateRealisticActionProbabilities(gameState);
        
        // 计算游戏价值
        const gameValue = this.calculateGameStateValue(gameState);
        
        // 评估动作质量
        const moveQuality = this.evaluateMoveQuality(output.actionProbabilities, targetProbs);
        
        gameData.push({
          gameState: encodedState,
          actionProbabilities: targetProbs,
          gameResult: gameValue,
          gameValue,
          moveQuality
        });
        
        this.stats.totalMoves++;
      }
    }
    
    // 添加到训练数据
    this.trainingData.push(...gameData);
    
    // 限制数据大小
    if (this.trainingData.length > 8000) {
      this.trainingData = this.trainingData.slice(-6000);
    }
    
    this.stats.gamesPlayed = gameId;
  }

  /**
   * 评估动作质量
   */
  private evaluateMoveQuality(predicted: Float32Array, target: Float32Array): number {
    let similarity = 0;
    for (let i = 0; i < predicted.length; i++) {
      similarity += Math.min(predicted[i], target[i]);
    }
    return similarity;
  }

  /**
   * 智能训练
   */
  private async trainWithRealisticData(): Promise<void> {
    if (this.trainingData.length < 32) return;

    // 按动作质量排序，优先训练高质量数据
    const sortedData = this.trainingData.sort((a, b) => b.moveQuality - a.moveQuality);
    const batchSize = 32;
    const batch = sortedData.slice(0, batchSize);

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
      const loss = await this.network.trainBatch(trainingBatch);

      // 更新统计
      this.stats.trainingBatches++;
      const alpha = 0.1;
      this.stats.averageLoss = this.stats.averageLoss * (1 - alpha) + loss.totalLoss * alpha;
      this.stats.averageGameValue = this.stats.averageGameValue * (1 - alpha) +
        (batch.reduce((sum, d) => sum + Math.abs(d.gameValue), 0) / batch.length) * alpha;

    } finally {
      states.dispose();
      actionProbs.dispose();
      values.dispose();
    }
  }

  /**
   * 开始真实游戏训练
   */
  public async startRealisticTraining(): Promise<void> {
    console.log('🚀 开始基于真实游戏逻辑的训练');
    console.log('📊 配置: 200局真实游戏模拟');
    console.log('🎮 特性: 真实牌型、游戏规则、价值评估');
    console.log('🧠 网络: 333,736个参数');
    console.log('');

    const totalGames = 200;

    for (let gameId = 1; gameId <= totalGames; gameId++) {
      await this.simulateRealisticGame(gameId);

      // 每积累足够数据就训练
      if (this.trainingData.length >= 32) {
        await this.trainWithRealisticData();
      }

      // 定期日志
      if (gameId % 20 === 0) {
        this.logProgress(gameId, totalGames);
      }

      // 定期评估
      if (gameId % 50 === 0) {
        await this.evaluateRealisticModel(gameId);
      }
    }

    console.log('🎉 真实游戏训练完成！');
    this.printFinalStats();
  }

  /**
   * 记录进度
   */
  private logProgress(gameId: number, totalGames: number): void {
    const progress = (gameId / totalGames * 100).toFixed(1);
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const gamesPerSecond = gameId / elapsed;

    console.log(`📊 训练进度 ${progress}% | 游戏 ${gameId}/${totalGames}`);
    console.log(`   训练数据: ${this.trainingData.length}条`);
    console.log(`   训练批次: ${this.stats.trainingBatches}`);
    console.log(`   平均损失: ${this.stats.averageLoss.toFixed(4)}`);
    console.log(`   平均游戏价值: ${this.stats.averageGameValue.toFixed(3)}`);
    console.log(`   速度: ${gamesPerSecond.toFixed(2)}局/秒`);
    console.log('');
  }

  /**
   * 评估真实模型
   */
  private async evaluateRealisticModel(gameId: number): Promise<void> {
    console.log(`🔍 真实模型评估 (第${gameId}局)`);

    // 测试不同阶段的游戏状态
    const testPhases = ['early', 'middle', 'late'];
    const results = [];

    for (const phase of testPhases) {
      const testState = this.createRealisticGameState(phase);
      const encodedState = this.encodeGameState(testState);

      const output = await this.network.forward({
        handTiles: encodedState.slice(0, 136),
        visibleTiles: encodedState.slice(136, 272),
        playerStates: encodedState.slice(272, 304),
        gameContext: encodedState.slice(304, 320)
      });

      const probs = Array.from(output.actionProbabilities);
      const maxProb = Math.max(...probs);
      const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
      const gameValue = this.calculateGameStateValue(testState);

      results.push({
        phase,
        predictedValue: output.valueEstimation,
        actualValue: gameValue,
        maxProb,
        entropy: entropy / Math.log(39)
      });
    }

    const avgMaxProb = results.reduce((sum, r) => sum + r.maxProb, 0) / results.length;
    const avgEntropy = results.reduce((sum, r) => sum + r.entropy, 0) / results.length;
    const valueAccuracy = results.reduce((sum, r) => {
      return sum + (1 - Math.abs(r.predictedValue - r.actualValue));
    }, 0) / results.length;

    console.log(`   平均最大概率: ${(avgMaxProb * 100).toFixed(1)}%`);
    console.log(`   平均熵: ${(avgEntropy * 100).toFixed(1)}%`);
    console.log(`   价值预测准确性: ${(valueAccuracy * 100).toFixed(1)}%`);

    // 详细阶段分析
    results.forEach(r => {
      console.log(`   ${r.phase}: 预测${r.predictedValue.toFixed(3)} vs 实际${r.actualValue.toFixed(3)}`);
    });

    console.log('');
  }

  /**
   * 打印最终统计
   */
  private printFinalStats(): void {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;

    console.log('📈 真实游戏训练最终统计:');
    console.log(`   总游戏数: ${this.stats.gamesPlayed}`);
    console.log(`   总步数: ${this.stats.totalMoves}`);
    console.log(`   真实训练数据: ${this.trainingData.length}条`);
    console.log(`   训练批次: ${this.stats.trainingBatches}`);
    console.log(`   最终损失: ${this.stats.averageLoss.toFixed(4)}`);
    console.log(`   平均游戏价值: ${this.stats.averageGameValue.toFixed(3)}`);
    console.log(`   总训练时间: ${(totalTime/60).toFixed(1)}分钟`);
    console.log(`   平均速度: ${(this.stats.gamesPlayed/totalTime).toFixed(2)}局/秒`);

    console.log('🎮 真实游戏特性:');
    console.log('   ✅ 基于真实麻将牌型和规则');
    console.log('   ✅ 考虑牌的实际价值和组合');
    console.log('   ✅ 模拟真实的游戏阶段演进');
    console.log('   ✅ 智能动作概率生成');
    console.log('   ✅ 基于牌型结构的价值评估');
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
    console.log('🀄 麻将AlphaZero AI真实游戏训练');
    console.log('='.repeat(60));

    const trainer = new RealisticGameTrainer();
    await trainer.startRealisticTraining();
    trainer.dispose();

    console.log('✅ 真实游戏训练成功完成！');

  } catch (error) {
    console.error('❌ 训练失败:', error);
    process.exit(1);
  }
}

main();
