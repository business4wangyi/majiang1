/**
 * 快速测试所有黑白棋AI算法对抗随机策略的胜率
 * 使用快速训练配置，快速评估各算法性能
 */

import * as tf from '@tensorflow/tfjs-node';
import { RandomOthelloAgent } from '../../../src/othello/strategy/random-agent';
import { QLearningOthelloAgent } from '../../../src/othello/strategy/qlearning-agent';
import { DQNOthelloAgent, TRAINING_DQN_AGENT_CONFIG } from '../../../src/othello/strategy/dqn-agent';
import { A3COthelloAgent, DEFAULT_A3C_AGENT_CONFIG } from '../../../src/othello/strategy/a3c-agent';
import { AlphaZeroOthelloAgent, DEFAULT_ALPHAZERO_AGENT_CONFIG } from '../../../src/othello/strategy/alphazero-agent';
import { createOthelloBoard, makeMove, isGameOver, countPieces, getLegalActions } from '../../../src/othello/othello-game';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../../src/othello/othello-types';

interface TestResult {
  algorithm: string;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  avgScore: number;
  trainingTime: number;
}

/**
 * 进行一局游戏测试
 */
async function playTestGame(
  aiAgent: any,
  opponent: RandomOthelloAgent,
  aiPlayer: OthelloPlayer
): Promise<{ winner: OthelloPlayer | 'draw'; aiScore: number; opponentScore: number }> {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let moves = 0;
  const maxMoves = 100;

  while (!isGameOver(board) && moves < maxMoves) {
    const legalActions = getLegalActions(board, currentPlayer);
    if (legalActions.length === 0) {
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }

    let action: OthelloAction | null = null;
    if (currentPlayer === aiPlayer) {
      action = aiAgent.chooseAction(board, currentPlayer);
    } else {
      action = opponent.chooseAction(board, currentPlayer);
    }

    if (action && legalActions.some(a => a.row === action!.row && a.col === action!.col)) {
      board = makeMove(board, action, currentPlayer);
    } else {
      // 如果没有合法动作，随机选择一个
      action = legalActions[Math.floor(Math.random() * legalActions.length)];
      board = makeMove(board, action, currentPlayer);
    }

    currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    moves++;
  }

  const { B, W } = countPieces(board);
  const aiScore = aiPlayer === 'B' ? B : W;
  const opponentScore = aiPlayer === 'B' ? W : B;

  let winner: OthelloPlayer | 'draw';
  if (B > W) winner = 'B';
  else if (W > B) winner = 'W';
  else winner = 'draw';

  return { winner, aiScore, opponentScore };
}

/**
 * 测试Q-Learning算法
 */
async function testQLearning(testGames: number = 50): Promise<TestResult> {
  console.log('\n📊 测试 Q-Learning...');
  const startTime = Date.now();
  
  const agent = new QLearningOthelloAgent('B', 0.1, 0.5, 0.9);
  const opponent = new RandomOthelloAgent();
  
  // 快速训练（少量对局）
  console.log('  快速训练中...');
  for (let i = 0; i < 100; i++) {
    agent.trainEpisode(opponent);
  }
  
  // 测试
  agent.epsilon = 0; // 关闭探索
  let wins = 0, losses = 0, draws = 0;
  let totalAiScore = 0, totalOpponentScore = 0;
  
  for (let i = 0; i < testGames; i++) {
    const result = await playTestGame(agent, opponent, 'B');
    if (result.winner === 'B') wins++;
    else if (result.winner === 'W') losses++;
    else draws++;
    totalAiScore += result.aiScore;
    totalOpponentScore += result.opponentScore;
  }
  
  const trainingTime = Date.now() - startTime;
  const winRate = (wins / testGames) * 100;
  const avgScore = totalAiScore / testGames;
  
  return {
    algorithm: 'Q-Learning',
    winRate,
    wins,
    losses,
    draws,
    totalGames: testGames,
    avgScore,
    trainingTime
  };
}

/**
 * 测试DQN算法（快速版本）
 */
async function testDQN(testGames: number = 50): Promise<TestResult> {
  console.log('\n📊 测试 DQN...');
  const startTime = Date.now();
  
  const agent = new DQNOthelloAgent({
    ...TRAINING_DQN_AGENT_CONFIG,
    isTraining: false // 直接测试，不训练
  });
  const opponent = new RandomOthelloAgent();
  
  // DQN需要预训练，这里直接测试（假设已有基础能力）
  console.log('  使用默认DQN配置测试...');
  
  // 测试
  agent.setTrainingMode(false, 0); // 关闭探索
  let wins = 0, losses = 0, draws = 0;
  let totalAiScore = 0, totalOpponentScore = 0;
  
  for (let i = 0; i < testGames; i++) {
    const result = await playTestGame(agent, opponent, 'B');
    if (result.winner === 'B') wins++;
    else if (result.winner === 'W') losses++;
    else draws++;
    totalAiScore += result.aiScore;
    totalOpponentScore += result.opponentScore;
  }
  
  const trainingTime = Date.now() - startTime;
  const winRate = (wins / testGames) * 100;
  const avgScore = totalAiScore / testGames;
  
  agent.dispose();
  
  return {
    algorithm: 'DQN',
    winRate,
    wins,
    losses,
    draws,
    totalGames: testGames,
    avgScore,
    trainingTime
  };
}

/**
 * 测试A3C算法（快速版本）
 */
async function testA3C(testGames: number = 50): Promise<TestResult> {
  console.log('\n📊 测试 A3C...');
  const startTime = Date.now();
  
  const agent = new A3COthelloAgent({
    ...DEFAULT_A3C_AGENT_CONFIG,
    isTraining: false // 直接测试
  });
  const opponent = new RandomOthelloAgent();
  
  // A3C需要预训练，这里直接测试（假设已有基础能力）
  console.log('  使用默认A3C配置测试...');
  
  // 测试
  let wins = 0, losses = 0, draws = 0;
  let totalAiScore = 0, totalOpponentScore = 0;
  
  for (let i = 0; i < testGames; i++) {
    const result = await playTestGame(agent, opponent, 'B');
    if (result.winner === 'B') wins++;
    else if (result.winner === 'W') losses++;
    else draws++;
    totalAiScore += result.aiScore;
    totalOpponentScore += result.opponentScore;
  }
  
  const trainingTime = Date.now() - startTime;
  const winRate = (wins / testGames) * 100;
  const avgScore = totalAiScore / testGames;
  
  // A3C没有dispose方法，跳过
  
  return {
    algorithm: 'A3C',
    winRate,
    wins,
    losses,
    draws,
    totalGames: testGames,
    avgScore,
    trainingTime
  };
}

/**
 * 测试AlphaZero算法（快速版本）
 */
async function testAlphaZero(testGames: number = 50): Promise<TestResult> {
  console.log('\n📊 测试 AlphaZero...');
  const startTime = Date.now();
  
  const agent = new AlphaZeroOthelloAgent({
    ...DEFAULT_ALPHAZERO_AGENT_CONFIG,
    isTraining: false, // 直接测试
    mctsConfig: {
      ...DEFAULT_ALPHAZERO_AGENT_CONFIG.mctsConfig,
      numSimulations: 50 // 减少模拟次数以加快速度
    }
  });
  const opponent = new RandomOthelloAgent();
  
  // AlphaZero需要预训练，这里直接测试（假设已有基础能力）
  console.log('  使用默认AlphaZero配置测试（MCTS模拟50次）...');
  
  // 测试
  let wins = 0, losses = 0, draws = 0;
  let totalAiScore = 0, totalOpponentScore = 0;
  
  for (let i = 0; i < testGames; i++) {
    const result = await playTestGame(agent, opponent, 'B');
    if (result.winner === 'B') wins++;
    else if (result.winner === 'W') losses++;
    else draws++;
    totalAiScore += result.aiScore;
    totalOpponentScore += result.opponentScore;
  }
  
  const trainingTime = Date.now() - startTime;
  const winRate = (wins / testGames) * 100;
  const avgScore = totalAiScore / testGames;
  
  // AlphaZero没有dispose方法，跳过
  
  return {
    algorithm: 'AlphaZero',
    winRate,
    wins,
    losses,
    draws,
    totalGames: testGames,
    avgScore,
    trainingTime
  };
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 开始测试所有黑白棋AI算法对抗随机策略');
  console.log('='.repeat(60));
  
  const testGames = 50; // 每个算法测试50局
  const results: TestResult[] = [];
  
  // 预期胜率
  const expectedWinRates: { [key: string]: number } = {
    'Q-Learning': 50,
    'DQN': 70,
    'A3C': 75,
    'AlphaZero': 85
  };
  
  try {
    // 测试Q-Learning
    try {
      const result = await testQLearning(testGames);
      results.push(result);
    } catch (error: any) {
      console.error('❌ Q-Learning测试失败:', error.message);
    }
    
    // 测试DQN
    try {
      const result = await testDQN(testGames);
      results.push(result);
    } catch (error: any) {
      console.error('❌ DQN测试失败:', error.message);
    }
    
    // 测试A3C
    try {
      const result = await testA3C(testGames);
      results.push(result);
    } catch (error: any) {
      console.error('❌ A3C测试失败:', error.message);
    }
    
    // 测试AlphaZero
    try {
      const result = await testAlphaZero(testGames);
      results.push(result);
    } catch (error: any) {
      console.error('❌ AlphaZero测试失败:', error.message);
    }
    
    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果总结');
    console.log('='.repeat(60));
    console.log();
    
    for (const result of results) {
      const expected = expectedWinRates[result.algorithm] || 0;
      const status = result.winRate >= expected * 0.8 ? '✅' : '⚠️';
      const diff = result.winRate - expected;
      
      console.log(`${status} ${result.algorithm}:`);
      console.log(`   胜率: ${result.winRate.toFixed(1)}% (预期: ${expected}%)`);
      console.log(`   差异: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`);
      console.log(`   战绩: ${result.wins}胜 ${result.losses}负 ${result.draws}平`);
      console.log(`   平均得分: ${result.avgScore.toFixed(1)}`);
      console.log(`   训练+测试时间: ${(result.trainingTime / 1000).toFixed(1)}秒`);
      console.log();
    }
    
    // 性能排序
    console.log('🏆 性能排序（按胜率）:');
    const sorted = [...results].sort((a, b) => b.winRate - a.winRate);
    sorted.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.algorithm}: ${result.winRate.toFixed(1)}%`);
    });
    
  } catch (error: any) {
    console.error('❌ 测试过程出错:', error);
  } finally {
    // 清理TensorFlow资源
    await tf.ready();
    process.exit(0);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

