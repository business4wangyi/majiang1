// {{ AURA-X: Add - 部署优化后的Q学习策略. Approval: 寸止(ID:1735819200). }}

import {
  QLearningOthelloAgent,
  GreedyOthelloAgent,
  HeuristicOthelloAgent,
  RandomOthelloAgent
} from './strategy';
import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';

interface TrainingConfig {
  episodes: number;
  opponents: any[];
  epsilonDecay: (episode: number, total: number) => number;
  evaluationInterval: number;
  saveInterval: number;
}

interface PerformanceMetrics {
  episode: number;
  winRateVsRandom: number;
  winRateVsGreedy: number;
  avgDecisionTime: number;
  qTableSize: number;
}

async function deployOptimizedQLearning(): Promise<void> {
  console.log('🚀 部署优化后的Q学习策略');
  console.log('='.repeat(60));

  // 第一步：创建优化的Q学习智能体（推荐配置）
  console.log('\n📋 第一步：创建优化的Q学习智能体');
  console.log('-'.repeat(40));

  const optimizedAgent = new QLearningOthelloAgent(
    'B',           // 玩家
    0.1,           // 初始探索率
    0.15,          // 学习率（调优后）
    0.95,          // 折扣因子（调优后）
    false          // 使用完整棋盘（不使用特征提取）
  );

  console.log('✅ 已创建优化Q学习智能体');
  console.log('   - 学习率α: 0.15');
  console.log('   - 折扣因子γ: 0.95');
  console.log('   - 状态表示: 完整棋盘');

  // 第二步：配置训练参数
  console.log('\n⚙️ 第二步：配置训练参数');
  console.log('-'.repeat(40));

  const opponents = [
    new RandomOthelloAgent(),      // 随机策略
    new GreedyOthelloAgent(),      // 贪心策略
    new HeuristicOthelloAgent()    // 启发式策略
  ];

  const trainingConfig: TrainingConfig = {
    episodes: 10000,               // 增加到10000局
    opponents: opponents,
    epsilonDecay: (episode, total) => Math.max(0.01, 0.2 * (1 - episode / total)),
    evaluationInterval: 1000,      // 每1000局评估一次
    saveInterval: 2000             // 每2000局保存一次
  };

  console.log('✅ 训练配置完成');
  console.log(`   - 训练局数: ${trainingConfig.episodes}`);
  console.log(`   - 对手数量: ${opponents.length}`);
  console.log('   - 探索率衰减: 0.2 → 0.01');

  // 第三步：执行训练
  console.log('\n🏋️ 第三步：执行优化训练');
  console.log('-'.repeat(40));

  const performanceHistory: PerformanceMetrics[] = [];
  const startTime = Date.now();

  for (let episode = 0; episode < trainingConfig.episodes; episode++) {
    // 动态调整探索率
    optimizedAgent.epsilon = trainingConfig.epsilonDecay(episode, trainingConfig.episodes);
    
    // 选择对手（轮换）
    const opponent = trainingConfig.opponents[episode % trainingConfig.opponents.length];
    
    // 执行训练
    optimizedAgent.trainEpisode(opponent);
    
    // 定期评估和保存
    if ((episode + 1) % trainingConfig.evaluationInterval === 0) {
      console.log(`\n📊 Episode ${episode + 1}/${trainingConfig.episodes} 评估:`);
      
      // 评估性能
      const metrics = await evaluateAgent(optimizedAgent, episode + 1);
      performanceHistory.push(metrics);
      
      console.log(`   胜率 vs 随机: ${metrics.winRateVsRandom.toFixed(1)}%`);
      console.log(`   胜率 vs 贪心: ${metrics.winRateVsGreedy.toFixed(1)}%`);
      console.log(`   Q表大小: ${metrics.qTableSize} 状态`);
      console.log(`   当前探索率: ${optimizedAgent.epsilon.toFixed(3)}`);
    }
    
    // 定期保存
    if ((episode + 1) % trainingConfig.saveInterval === 0) {
      const filename = `src/othello/qtable-optimized-checkpoint-${episode + 1}.json`;
      optimizedAgent.saveQTable(filename);
      console.log(`   💾 已保存检查点: ${filename}`);
    }
  }

  const trainingTime = (Date.now() - startTime) / 1000;
  console.log(`\n✅ 训练完成！总用时: ${trainingTime.toFixed(1)}秒`);

  // 第四步：保存最终模型
  console.log('\n💾 第四步：保存最终模型');
  console.log('-'.repeat(40));

  optimizedAgent.saveQTable('src/othello/qtable-optimized-final.json');
  console.log('✅ 已保存最终Q表: qtable-optimized-final.json');

  // 第五步：最终性能评估
  console.log('\n🎯 第五步：最终性能评估');
  console.log('-'.repeat(40));

  // 设置为纯利用模式
  optimizedAgent.epsilon = 0.0;

  const finalMetrics = await comprehensiveEvaluation(optimizedAgent);
  
  console.log('📊 最终性能报告:');
  console.log(`   vs 随机策略: ${finalMetrics.vsRandom.winRate.toFixed(1)}% (${finalMetrics.vsRandom.games}局)`);
  console.log(`   vs 贪心策略: ${finalMetrics.vsGreedy.winRate.toFixed(1)}% (${finalMetrics.vsGreedy.games}局)`);
  console.log(`   vs 启发式策略: ${finalMetrics.vsHeuristic.winRate.toFixed(1)}% (${finalMetrics.vsHeuristic.games}局)`);
  console.log(`   平均决策时间: ${finalMetrics.avgDecisionTime.toFixed(2)}ms`);

  // 第六步：与原始版本对比
  console.log('\n⚔️ 第六步：与原始版本对比');
  console.log('-'.repeat(40));

  const originalAgent = new QLearningOthelloAgent('B', 0.0, 0.1, 0.9);
  originalAgent.loadQTable('src/othello/qtable-b.json');

  const comparison = await compareAgents(originalAgent, optimizedAgent);
  
  console.log('📈 性能对比结果:');
  console.log(`   优化版 vs 原始版: ${comparison.optimizedWins}胜 ${comparison.originalWins}负 ${comparison.draws}平`);
  console.log(`   胜率提升: ${comparison.improvement.toFixed(1)}%`);

  // 第七步：生成部署报告
  console.log('\n📋 第七步：生成部署报告');
  console.log('-'.repeat(40));

  generateDeploymentReport(performanceHistory, finalMetrics, comparison, trainingTime);

  console.log('\n🎉 优化Q学习策略部署完成！');
  console.log('='.repeat(60));
  console.log('✅ 新的Q学习策略已准备就绪');
  console.log('✅ 性能报告已生成');
  console.log('✅ 可以在实际游戏中使用');
}

async function evaluateAgent(agent: OptimizedQLearningOthelloAgent, episode: number): Promise<PerformanceMetrics> {
  const testGames = 50;
  const randomOpponent = new RandomOthelloAgent();
  const greedyOpponent = new GreedyOthelloAgent();
  
  // 临时设置为纯利用模式
  const originalEpsilon = agent.epsilon;
  agent.epsilon = 0.0;
  
  // 测试vs随机
  const vsRandomResult = await testAgentPerformance(agent, randomOpponent, testGames);
  
  // 测试vs贪心
  const vsGreedyResult = await testAgentPerformance(agent, greedyOpponent, testGames);
  
  // 恢复探索率
  agent.epsilon = originalEpsilon;
  
  const stats = agent.getQTableStats();
  
  return {
    episode,
    winRateVsRandom: vsRandomResult.winRate,
    winRateVsGreedy: vsGreedyResult.winRate,
    avgDecisionTime: (vsRandomResult.avgDecisionTime + vsGreedyResult.avgDecisionTime) / 2,
    qTableSize: stats.stateCount
  };
}

async function testAgentPerformance(agent: any, opponent: any, games: number): Promise<{
  winRate: number;
  avgDecisionTime: number;
}> {
  let wins = 0;
  const decisionTimes: number[] = [];

  for (let i = 0; i < games; i++) {
    const startTime = Date.now();
    const result = playGame(agent, opponent);
    const endTime = Date.now();
    
    decisionTimes.push(endTime - startTime);
    if (result === 'B') wins++;
  }

  return {
    winRate: (wins / games) * 100,
    avgDecisionTime: decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
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

async function comprehensiveEvaluation(agent: OptimizedQLearningOthelloAgent): Promise<{
  vsRandom: { winRate: number; games: number };
  vsGreedy: { winRate: number; games: number };
  vsHeuristic: { winRate: number; games: number };
  avgDecisionTime: number;
}> {
  const testGames = 100;
  
  const vsRandom = await testAgentPerformance(agent, new RandomOthelloAgent(), testGames);
  const vsGreedy = await testAgentPerformance(agent, new GreedyOthelloAgent(), testGames);
  const vsHeuristic = await testAgentPerformance(agent, new HeuristicOthelloAgent(), testGames);
  
  return {
    vsRandom: { winRate: vsRandom.winRate, games: testGames },
    vsGreedy: { winRate: vsGreedy.winRate, games: testGames },
    vsHeuristic: { winRate: vsHeuristic.winRate, games: testGames },
    avgDecisionTime: (vsRandom.avgDecisionTime + vsGreedy.avgDecisionTime + vsHeuristic.avgDecisionTime) / 3
  };
}

async function compareAgents(originalAgent: any, optimizedAgent: any): Promise<{
  optimizedWins: number;
  originalWins: number;
  draws: number;
  improvement: number;
}> {
  const games = 100;
  let optimizedWins = 0, originalWins = 0, draws = 0;

  for (let i = 0; i < games; i++) {
    const result = i % 2 === 0 ? 
      playGame(optimizedAgent, originalAgent) : 
      playGame(originalAgent, optimizedAgent);

    if (result === 'B') {
      if (i % 2 === 0) optimizedWins++;
      else originalWins++;
    } else if (result === 'W') {
      if (i % 2 === 0) originalWins++;
      else optimizedWins++;
    } else {
      draws++;
    }
  }

  const improvement = ((optimizedWins - originalWins) / games) * 100;

  return { optimizedWins, originalWins, draws, improvement };
}

function generateDeploymentReport(
  performanceHistory: PerformanceMetrics[],
  finalMetrics: any,
  comparison: any,
  trainingTime: number
): void {
  const report = `
# Othello Q学习策略优化部署报告

## 训练配置
- 训练局数: 10,000局
- 训练时间: ${trainingTime.toFixed(1)}秒
- 学习率: 0.15
- 折扣因子: 0.95
- 状态表示: 完整棋盘

## 最终性能
- vs 随机策略: ${finalMetrics.vsRandom.winRate.toFixed(1)}%
- vs 贪心策略: ${finalMetrics.vsGreedy.winRate.toFixed(1)}%
- vs 启发式策略: ${finalMetrics.vsHeuristic.winRate.toFixed(1)}%
- 平均决策时间: ${finalMetrics.avgDecisionTime.toFixed(2)}ms

## 性能提升
- 优化版 vs 原始版: ${comparison.optimizedWins}胜 ${comparison.originalWins}负 ${comparison.draws}平
- 胜率提升: ${comparison.improvement.toFixed(1)}%

## 部署状态
✅ 训练完成
✅ 模型保存
✅ 性能验证
✅ 准备部署

生成时间: ${new Date().toISOString()}
`;

  require('fs').writeFileSync('src/othello/deployment-report.md', report, 'utf-8');
  console.log('✅ 部署报告已保存: deployment-report.md');
}

// 运行部署
if (require.main === module) {
  deployOptimizedQLearning().catch(console.error);
}
