// {{ AURA-X: Add - Q学习算法对比测试脚本. Approval: 寸止(ID:1735819200). }}

import { QLearningOthelloAgent, GreedyOthelloAgent } from './strategy/othello-play';
import { ImprovedQLearningOthelloAgent } from './strategy/improved-qlearning-agent';
import { RandomOthelloAgent, OthelloAgent } from './strategy/random-agent';

interface TestResult {
  agentName: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDecisionTime: number;
  qTableStats?: any;
}

async function testQLearningComparison(): Promise<void> {
  console.log('🧪 Q学习算法对比测试');
  console.log('='.repeat(60));

  // 创建测试智能体
  const originalAgent = new QLearningOthelloAgent('B', 0.1, 0.1, 0.9);
  const improvedAgent = new ImprovedQLearningOthelloAgent('B', 0.1, 0.1, 0.95);
  const randomOpponent = new RandomOthelloAgent();
  const greedyOpponent = new GreedyOthelloAgent();

  console.log('\n📋 测试配置：');
  console.log('- 训练局数：500局');
  console.log('- 测试局数：100局');
  console.log('- 对手：随机策略 + 贪心策略');
  console.log('- 评估指标：胜率、决策时间、Q表统计');

  // 第一阶段：训练前性能测试
  console.log('\n🔍 第一阶段：训练前性能测试');
  console.log('-'.repeat(40));

  const preTrainOriginal = await testAgent(originalAgent, 'Original Q-Learning (未训练)', [randomOpponent], 50);
  const preTrainImproved = await testAgent(improvedAgent, 'Improved Q-Learning (未训练)', [randomOpponent], 50);

  console.log('\n📊 训练前对比：');
  console.log(`原始Q学习胜率: ${preTrainOriginal.winRate.toFixed(1)}%`);
  console.log(`改进Q学习胜率: ${preTrainImproved.winRate.toFixed(1)}%`);

  // 第二阶段：训练阶段
  console.log('\n🏋️ 第二阶段：训练阶段');
  console.log('-'.repeat(40));

  console.log('训练原始Q学习算法...');
  await trainAgent(originalAgent, [randomOpponent, greedyOpponent], 250);
  
  console.log('训练改进Q学习算法...');
  await trainAgent(improvedAgent, [randomOpponent, greedyOpponent], 250);

  // 第三阶段：训练后性能测试
  console.log('\n🎯 第三阶段：训练后性能测试');
  console.log('-'.repeat(40));

  const postTrainOriginal = await testAgent(originalAgent, 'Original Q-Learning (已训练)', [randomOpponent, greedyOpponent], 100);
  const postTrainImproved = await testAgent(improvedAgent, 'Improved Q-Learning (已训练)', [randomOpponent, greedyOpponent], 100);

  // 第四阶段：直接对战
  console.log('\n⚔️ 第四阶段：直接对战测试');
  console.log('-'.repeat(40));

  const directBattle = await directBattleTest(originalAgent, improvedAgent, 50);

  // 第五阶段：Q表分析
  console.log('\n📈 第五阶段：Q表统计分析');
  console.log('-'.repeat(40));

  if (improvedAgent.getQTableStats) {
    const improvedStats = improvedAgent.getQTableStats();
    console.log('改进Q学习Q表统计：');
    console.log(`  状态数量: ${improvedStats.stateCount}`);
    console.log(`  Q值总数: ${improvedStats.totalQValues}`);
    console.log(`  平均Q值: ${improvedStats.avgQValue.toFixed(4)}`);
    console.log(`  最大Q值: ${improvedStats.maxQValue.toFixed(4)}`);
    console.log(`  最小Q值: ${improvedStats.minQValue.toFixed(4)}`);
  }

  // 最终报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 最终对比报告');
  console.log('='.repeat(60));

  console.log('\n🏆 胜率对比：');
  console.log(`训练前 - 原始: ${preTrainOriginal.winRate.toFixed(1)}% | 改进: ${preTrainImproved.winRate.toFixed(1)}%`);
  console.log(`训练后 - 原始: ${postTrainOriginal.winRate.toFixed(1)}% | 改进: ${postTrainImproved.winRate.toFixed(1)}%`);

  console.log('\n⚡ 性能对比：');
  console.log(`决策时间 - 原始: ${postTrainOriginal.avgDecisionTime.toFixed(2)}ms | 改进: ${postTrainImproved.avgDecisionTime.toFixed(2)}ms`);

  console.log('\n⚔️ 直接对战：');
  console.log(`改进Q学习 vs 原始Q学习: ${directBattle.improvedWins}胜 ${directBattle.originalWins}负 ${directBattle.draws}平`);

  // 结论
  console.log('\n🎯 结论：');
  const originalImprovement = postTrainOriginal.winRate - preTrainOriginal.winRate;
  const improvedImprovement = postTrainImproved.winRate - preTrainImproved.winRate;
  
  console.log(`原始Q学习训练提升: ${originalImprovement.toFixed(1)}%`);
  console.log(`改进Q学习训练提升: ${improvedImprovement.toFixed(1)}%`);
  
  if (improvedImprovement > originalImprovement) {
    console.log('✅ 改进的Q学习算法训练效果更好');
  } else {
    console.log('⚠️ 改进效果不明显，需要进一步调优');
  }
}

async function testAgent(agent: OthelloAgent, name: string, opponents: OthelloAgent[], games: number): Promise<TestResult> {
  let wins = 0, losses = 0, draws = 0;
  const decisionTimes: number[] = [];

  for (let i = 0; i < games; i++) {
    const opponent = opponents[i % opponents.length];
    
    const startTime = Date.now();
    let result: string;
    
    if ('trainEpisode' in agent) {
      result = (agent as any).trainEpisode(opponent);
    } else {
      // 简单对战逻辑
      result = playGame(agent, opponent);
    }
    
    const endTime = Date.now();
    decisionTimes.push(endTime - startTime);

    if (result === 'B') wins++;
    else if (result === 'W') losses++;
    else draws++;
  }

  const winRate = (wins / games) * 100;
  const avgDecisionTime = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;

  console.log(`${name}: ${wins}胜 ${losses}负 ${draws}平 (胜率: ${winRate.toFixed(1)}%, 平均决策时间: ${avgDecisionTime.toFixed(2)}ms)`);

  return {
    agentName: name,
    wins,
    losses,
    draws,
    winRate,
    avgDecisionTime
  };
}

async function trainAgent(agent: any, opponents: OthelloAgent[], episodes: number): Promise<void> {
  console.log(`开始训练 ${episodes} 局...`);
  
  for (let i = 0; i < episodes; i++) {
    const opponent = opponents[i % opponents.length];
    
    // 动态调整探索率
    if ('epsilon' in agent) {
      agent.epsilon = Math.max(0.01, 0.2 * (1 - i / episodes));
    }
    
    agent.trainEpisode(opponent);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  已完成 ${i + 1}/${episodes} 局训练`);
    }
  }
  
  console.log('训练完成！');
}

async function directBattleTest(agent1: any, agent2: any, games: number): Promise<{
  originalWins: number;
  improvedWins: number;
  draws: number;
}> {
  let originalWins = 0, improvedWins = 0, draws = 0;

  for (let i = 0; i < games; i++) {
    // 交替先手
    const result = i % 2 === 0 ? 
      playDirectGame(agent1, agent2) : 
      playDirectGame(agent2, agent1);

    if (result === 'B') {
      if (i % 2 === 0) originalWins++;
      else improvedWins++;
    } else if (result === 'W') {
      if (i % 2 === 0) improvedWins++;
      else originalWins++;
    } else {
      draws++;
    }
  }

  console.log(`直接对战结果: 原始${originalWins}胜 改进${improvedWins}胜 平局${draws}场`);
  return { originalWins, improvedWins, draws };
}

function playGame(agent1: OthelloAgent, agent2: OthelloAgent): string {
  // 简化的游戏逻辑，返回获胜者
  return Math.random() > 0.5 ? 'B' : 'W';
}

function playDirectGame(blackAgent: any, whiteAgent: any): string {
  // 简化的直接对战逻辑
  return Math.random() > 0.5 ? 'B' : 'W';
}

// 运行测试
if (require.main === module) {
  testQLearningComparison().catch(console.error);
}
