/**
 * 快速训练和测试所有黑白棋AI算法
 * 使用快速训练配置，然后测试对抗随机策略的胜率
 */

import * as tf from '@tensorflow/tfjs-node';
import { RandomOthelloAgent } from '../../../src/othello/strategy/random-agent';
import { QLearningOthelloAgent } from '../../../src/othello/strategy/qlearning-agent';
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
function playTestGame(
  aiAgent: any,
  opponent: RandomOthelloAgent,
  aiPlayer: OthelloPlayer
): { winner: OthelloPlayer | 'draw'; aiScore: number; opponentScore: number } {
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
function testQLearning(testGames: number = 100): TestResult {
  console.log('\n📊 测试 Q-Learning...');
  const startTime = Date.now();
  
  const agent = new QLearningOthelloAgent('B', 0.1, 0.5, 0.9);
  const opponent = new RandomOthelloAgent();
  
  // 快速训练
  console.log('  快速训练中（100局）...');
  for (let i = 0; i < 100; i++) {
    agent.trainEpisode(opponent);
  }
  
  // 测试
  agent.epsilon = 0;
  let wins = 0, losses = 0, draws = 0;
  let totalAiScore = 0;
  
  for (let i = 0; i < testGames; i++) {
    const result = playTestGame(agent, opponent, 'B');
    if (result.winner === 'B') wins++;
    else if (result.winner === 'W') losses++;
    else draws++;
    totalAiScore += result.aiScore;
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
 * 主测试函数
 */
async function main() {
  console.log('🚀 快速训练和测试黑白棋AI算法');
  console.log('='.repeat(60));
  
  const testGames = 100;
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
    const qlearningResult = testQLearning(testGames);
    results.push(qlearningResult);
    
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
      console.log(`   用时: ${(result.trainingTime / 1000).toFixed(1)}秒`);
      console.log();
    }
    
    console.log('💡 其他算法（DQN、A3C、AlphaZero）需要完整训练');
    console.log('   运行完整训练:');
    console.log('   - npm run othello:dqn-train (约500轮，包含评估)');
    console.log('   - npm run othello:a3c-train (约10000轮，包含评估)');
    console.log('   - npm run othello:alphazero-train (约10迭代，包含评估)');
    
  } catch (error: any) {
    console.error('❌ 测试过程出错:', error);
  } finally {
    await tf.ready();
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

