// {{ AURA-X: Add - 测试优化后的Q学习算法. Approval: 寸止(ID:1735819200). }}

import {
  QLearningOthelloAgent,
  GreedyOthelloAgent,
  RandomOthelloAgent
} from './strategy';
import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';

interface TestResult {
  agentName: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDecisionTime: number;
  qTableStats?: any;
}

async function testOptimizedQLearning(): Promise<void> {
  console.log('🚀 测试优化后的Q学习算法');
  console.log('='.repeat(60));

  console.log('\n📊 测试配置：');
  console.log('- 对比三种Q学习实现：原始、修复、优化');
  console.log('- 训练局数：2000局');
  console.log('- 测试局数：每种对手50局');
  console.log('- 对手：随机策略 + 贪心策略');

  // 创建三种Q学习智能体
  const originalAgent = new QLearningOthelloAgent('B', 0.0, 0.1, 0.9);
  originalAgent.loadQTable('src/othello/qtable-b.json'); // 使用预训练的Q表

  const optimizedAgent = new QLearningOthelloAgent('B', 0.1, 0.15, 0.95, true); // 使用特征提取
  const optimizedAgentNoFeatures = new QLearningOthelloAgent('B', 0.1, 0.15, 0.95, false); // 不使用特征提取

  // 对手
  const randomOpponent = new RandomOthelloAgent();
  const greedyOpponent = new GreedyOthelloAgent();

  // 第一阶段：训练优化后的Q学习算法
  console.log('\n🏋️ 第一阶段：训练优化后的Q学习算法');
  console.log('-'.repeat(40));

  const trainEpisodes = 2000;
  const opponents = [randomOpponent, greedyOpponent];

  console.log('训练使用特征提取的优化Q学习...');
  await trainAgent(optimizedAgent, opponents, trainEpisodes, '特征提取版');

  console.log('\n训练不使用特征提取的优化Q学习...');
  await trainAgent(optimizedAgentNoFeatures, opponents, trainEpisodes, '完整棋盘版');

  // 保存训练后的Q表
  optimizedAgent.saveQTable('src/othello/qtable-optimized-features.json');
  optimizedAgentNoFeatures.saveQTable('src/othello/qtable-optimized-full.json');

  // 第二阶段：性能对比测试
  console.log('\n⚔️ 第二阶段：性能对比测试');
  console.log('-'.repeat(40));

  // 设置为纯利用模式
  originalAgent.epsilon = 0.0;
  optimizedAgent.epsilon = 0.0;
  optimizedAgentNoFeatures.epsilon = 0.0;

  console.log('🔍 测试原始Q学习算法：');
  const originalVsRandom = await testAgentPerformance(originalAgent, randomOpponent, 50, '原始Q学习 vs 随机');
  const originalVsGreedy = await testAgentPerformance(originalAgent, greedyOpponent, 50, '原始Q学习 vs 贪心');

  console.log('\n🎯 测试优化Q学习算法（特征提取）：');
  const optimizedVsRandom = await testAgentPerformance(optimizedAgent, randomOpponent, 50, '优化Q学习(特征) vs 随机');
  const optimizedVsGreedy = await testAgentPerformance(optimizedAgent, greedyOpponent, 50, '优化Q学习(特征) vs 贪心');

  console.log('\n🔧 测试优化Q学习算法（完整棋盘）：');
  const optimizedFullVsRandom = await testAgentPerformance(optimizedAgentNoFeatures, randomOpponent, 50, '优化Q学习(完整) vs 随机');
  const optimizedFullVsGreedy = await testAgentPerformance(optimizedAgentNoFeatures, greedyOpponent, 50, '优化Q学习(完整) vs 贪心');

  // 第三阶段：Q表统计对比
  console.log('\n📈 第三阶段：Q表统计对比');
  console.log('-'.repeat(40));

  const optimizedStats = optimizedAgent.getQTableStats();
  const optimizedFullStats = optimizedAgentNoFeatures.getQTableStats();

  console.log('Q表统计对比：');
  console.log(`特征提取版：${optimizedStats.stateCount} 个状态，${optimizedStats.totalQValues} 个Q值`);
  console.log(`完整棋盘版：${optimizedFullStats.stateCount} 个状态，${optimizedFullStats.totalQValues} 个Q值`);
  console.log(`状态空间压缩比：${(optimizedFullStats.stateCount / optimizedStats.stateCount).toFixed(1)}x`);

  // 第四阶段：直接对战
  console.log('\n🥊 第四阶段：三方对战测试');
  console.log('-'.repeat(40));

  const battle1 = await directBattleTest(originalAgent, optimizedAgent, 30, '原始 vs 优化(特征)');
  const battle2 = await directBattleTest(originalAgent, optimizedAgentNoFeatures, 30, '原始 vs 优化(完整)');
  const battle3 = await directBattleTest(optimizedAgent, optimizedAgentNoFeatures, 30, '优化(特征) vs 优化(完整)');

  // 最终报告
  console.log('\n' + '='.repeat(60));
  console.log('📋 优化Q学习算法测试报告');
  console.log('='.repeat(60));

  console.log('\n🏆 性能对比总结：');
  console.log('vs 随机策略：');
  console.log(`  原始：${originalVsRandom.winRate.toFixed(1)}%`);
  console.log(`  优化(特征)：${optimizedVsRandom.winRate.toFixed(1)}% (${(optimizedVsRandom.winRate - originalVsRandom.winRate).toFixed(1)}%)`);
  console.log(`  优化(完整)：${optimizedFullVsRandom.winRate.toFixed(1)}% (${(optimizedFullVsRandom.winRate - originalVsRandom.winRate).toFixed(1)}%)`);

  console.log('\nvs 贪心策略：');
  console.log(`  原始：${originalVsGreedy.winRate.toFixed(1)}%`);
  console.log(`  优化(特征)：${optimizedVsGreedy.winRate.toFixed(1)}% (${(optimizedVsGreedy.winRate - originalVsGreedy.winRate).toFixed(1)}%)`);
  console.log(`  优化(完整)：${optimizedFullVsGreedy.winRate.toFixed(1)}% (${(optimizedFullVsGreedy.winRate - originalVsGreedy.winRate).toFixed(1)}%)`);

  console.log('\n📊 状态空间效率：');
  console.log(`特征提取版状态数：${optimizedStats.stateCount}`);
  console.log(`完整棋盘版状态数：${optimizedFullStats.stateCount}`);
  console.log(`压缩效率：${((1 - optimizedStats.stateCount / optimizedFullStats.stateCount) * 100).toFixed(1)}%`);

  console.log('\n🥊 直接对战结果：');
  console.log(`${battle1.description}: ${battle1.agent1Wins}胜 ${battle1.agent2Wins}负 ${battle1.draws}平`);
  console.log(`${battle2.description}: ${battle2.agent1Wins}胜 ${battle2.agent2Wins}负 ${battle2.draws}平`);
  console.log(`${battle3.description}: ${battle3.agent1Wins}胜 ${battle3.agent2Wins}负 ${battle3.draws}平`);

  // 结论
  console.log('\n🎯 优化效果评估：');
  
  const avgImprovementFeatures = ((optimizedVsRandom.winRate - originalVsRandom.winRate) + 
                                  (optimizedVsGreedy.winRate - originalVsGreedy.winRate)) / 2;
  const avgImprovementFull = ((optimizedFullVsRandom.winRate - originalVsRandom.winRate) + 
                             (optimizedFullVsGreedy.winRate - originalVsGreedy.winRate)) / 2;

  if (avgImprovementFeatures > 5) {
    console.log('✅ 特征提取版Q学习优化效果显著');
  } else if (avgImprovementFeatures > 0) {
    console.log('⚠️ 特征提取版Q学习有一定改进');
  } else {
    console.log('❌ 特征提取版Q学习优化效果不明显');
  }

  if (optimizedStats.stateCount < optimizedFullStats.stateCount * 0.1) {
    console.log('✅ 特征提取显著减少了状态空间');
  } else {
    console.log('⚠️ 特征提取的状态空间压缩效果有限');
  }

  console.log('\n💡 最终建议：');
  if (avgImprovementFeatures > avgImprovementFull) {
    console.log('推荐使用特征提取版本的优化Q学习算法');
  } else {
    console.log('推荐使用完整棋盘版本的优化Q学习算法');
  }
}

async function trainAgent(agent: any, opponents: any[], episodes: number, name: string): Promise<void> {
  console.log(`开始训练${name} ${episodes} 局...`);
  
  for (let i = 0; i < episodes; i++) {
    const opponent = opponents[i % opponents.length];
    
    // 动态调整探索率
    if ('epsilon' in agent) {
      agent.epsilon = Math.max(0.01, 0.2 * (1 - i / episodes));
    }
    
    agent.trainEpisode(opponent);
    
    if ((i + 1) % 500 === 0) {
      console.log(`  已完成 ${i + 1}/${episodes} 局训练，当前探索率: ${agent.epsilon.toFixed(3)}`);
    }
  }
  
  console.log(`${name}训练完成！`);
}

async function testAgentPerformance(agent: any, opponent: any, games: number, description: string): Promise<TestResult> {
  let wins = 0, losses = 0, draws = 0;
  const decisionTimes: number[] = [];

  for (let i = 0; i < games; i++) {
    const startTime = Date.now();
    const result = playGame(agent, opponent);
    const endTime = Date.now();
    
    decisionTimes.push(endTime - startTime);

    if (result === 'B') wins++;
    else if (result === 'W') losses++;
    else draws++;
  }

  const winRate = (wins / games) * 100;
  const avgDecisionTime = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;

  console.log(`${description}: ${wins}胜 ${losses}负 ${draws}平 (胜率: ${winRate.toFixed(1)}%, 平均决策时间: ${avgDecisionTime.toFixed(2)}ms)`);

  return {
    agentName: description,
    wins,
    losses,
    draws,
    winRate,
    avgDecisionTime
  };
}

function playGame(agentB: any, agentW: any): 'B' | 'W' | 'Draw' {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  let moveCount = 0;
  const maxMoves = 60;

  while (moveCount < maxMoves && passCount < 2) {
    const legalMoves = getLegalActions(board, currentPlayer);
    
    if (legalMoves.length === 0) {
      passCount++;
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }

    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    
    if (action && legalMoves.some(move => move.row === action.row && move.col === action.col)) {
      board = makeMove(board, action, currentPlayer);
      passCount = 0;
      moveCount++;
    } else {
      passCount++;
    }
    
    currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
  }

  const winner = getWinner(board);
  if (winner) return winner;
  
  const counts = countPieces(board);
  if (counts.B > counts.W) return 'B';
  if (counts.W > counts.B) return 'W';
  return 'Draw';
}

async function directBattleTest(agent1: any, agent2: any, games: number, description: string): Promise<{
  agent1Wins: number;
  agent2Wins: number;
  draws: number;
  description: string;
}> {
  let agent1Wins = 0, agent2Wins = 0, draws = 0;

  for (let i = 0; i < games; i++) {
    // 交替先手
    const result = i % 2 === 0 ? 
      playGame(agent1, agent2) : 
      playGame(agent2, agent1);

    if (result === 'B') {
      if (i % 2 === 0) agent1Wins++;
      else agent2Wins++;
    } else if (result === 'W') {
      if (i % 2 === 0) agent2Wins++;
      else agent1Wins++;
    } else {
      draws++;
    }
  }

  return { agent1Wins, agent2Wins, draws, description };
}

// 运行测试
if (require.main === module) {
  testOptimizedQLearning().catch(console.error);
}
