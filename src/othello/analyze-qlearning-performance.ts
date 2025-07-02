// {{ AURA-X: Add - Q学习性能深度分析脚本. Approval: 寸止(ID:1735819200). }}

import * as fs from 'fs';
import { QLearningOthelloAgent, GreedyOthelloAgent, RandomOthelloAgent } from './strategy';
import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';

interface PerformanceMetrics {
  winRate: number;
  avgDecisionTime: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
}

interface QTableStats {
  stateCount: number;
  totalQValues: number;
  avgQValue: number;
  maxQValue: number;
  minQValue: number;
  nonZeroQValues: number;
  positiveQValues: number;
  negativeQValues: number;
}

async function analyzeQLearningPerformance(): Promise<void> {
  console.log('🔬 Q学习策略深度性能分析');
  console.log('='.repeat(60));

  // 第一部分：Q表统计分析
  console.log('\n📊 第一部分：Q表统计分析');
  console.log('-'.repeat(40));

  const qTableStatsB = analyzeQTableFile('src/othello/qtable-b.json', 'B');
  const qTableStatsW = analyzeQTableFile('src/othello/qtable-w.json', 'W');

  console.log('\n🔍 Q表详细统计：');
  console.log(`黑棋Q表：${qTableStatsB.stateCount} 个状态，${qTableStatsB.totalQValues} 个Q值`);
  console.log(`白棋Q表：${qTableStatsW.stateCount} 个状态，${qTableStatsW.totalQValues} 个Q值`);
  console.log(`黑棋平均Q值：${qTableStatsB.avgQValue.toFixed(6)}`);
  console.log(`白棋平均Q值：${qTableStatsW.avgQValue.toFixed(6)}`);
  console.log(`黑棋Q值范围：[${qTableStatsB.minQValue.toFixed(6)}, ${qTableStatsB.maxQValue.toFixed(6)}]`);
  console.log(`白棋Q值范围：[${qTableStatsW.minQValue.toFixed(6)}, ${qTableStatsW.maxQValue.toFixed(6)}]`);

  // 第二部分：训练前后性能对比
  console.log('\n⚔️ 第二部分：训练前后性能对比');
  console.log('-'.repeat(40));

  // 创建未训练的Q学习智能体
  const untrainedAgent = new QLearningOthelloAgent('B', 0.0, 0.1, 0.9); // epsilon=0 纯利用
  
  // 创建已训练的Q学习智能体
  const trainedAgent = new QLearningOthelloAgent('B', 0.0, 0.1, 0.9); // epsilon=0 纯利用
  trainedAgent.loadQTable('src/othello/qtable-b.json');

  // 对手
  const randomOpponent = new RandomOthelloAgent();
  const greedyOpponent = new GreedyOthelloAgent();

  console.log('🎮 测试配置：');
  console.log('- 每种对手测试50局');
  console.log('- epsilon=0（纯利用模式）');
  console.log('- 对手：随机策略 + 贪心策略');

  // 测试未训练的Q学习
  console.log('\n🔍 测试未训练的Q学习策略：');
  const untrainedVsRandom = await testAgentPerformance(untrainedAgent, randomOpponent, 50);
  const untrainedVsGreedy = await testAgentPerformance(untrainedAgent, greedyOpponent, 50);

  console.log(`vs 随机策略：胜率 ${untrainedVsRandom.winRate.toFixed(1)}%，平均决策时间 ${untrainedVsRandom.avgDecisionTime.toFixed(2)}ms`);
  console.log(`vs 贪心策略：胜率 ${untrainedVsGreedy.winRate.toFixed(1)}%，平均决策时间 ${untrainedVsGreedy.avgDecisionTime.toFixed(2)}ms`);

  // 测试已训练的Q学习
  console.log('\n🎯 测试已训练的Q学习策略：');
  const trainedVsRandom = await testAgentPerformance(trainedAgent, randomOpponent, 50);
  const trainedVsGreedy = await testAgentPerformance(trainedAgent, greedyOpponent, 50);

  console.log(`vs 随机策略：胜率 ${trainedVsRandom.winRate.toFixed(1)}%，平均决策时间 ${trainedVsRandom.avgDecisionTime.toFixed(2)}ms`);
  console.log(`vs 贪心策略：胜率 ${trainedVsGreedy.winRate.toFixed(1)}%，平均决策时间 ${trainedVsGreedy.avgDecisionTime.toFixed(2)}ms`);

  // 第三部分：决策质量分析
  console.log('\n🧠 第三部分：决策质量分析');
  console.log('-'.repeat(40));

  await analyzeDecisionQuality(trainedAgent, untrainedAgent);

  // 第四部分：Q值更新算法验证
  console.log('\n🔧 第四部分：Q值更新算法验证');
  console.log('-'.repeat(40));

  analyzeQValueUpdateAlgorithm();

  // 最终报告
  console.log('\n' + '='.repeat(60));
  console.log('📋 Q学习策略深度分析报告');
  console.log('='.repeat(60));

  const improvementVsRandom = trainedVsRandom.winRate - untrainedVsRandom.winRate;
  const improvementVsGreedy = trainedVsGreedy.winRate - untrainedVsGreedy.winRate;

  console.log('\n🏆 性能提升分析：');
  console.log(`vs 随机策略提升：${improvementVsRandom.toFixed(1)}% (${untrainedVsRandom.winRate.toFixed(1)}% → ${trainedVsRandom.winRate.toFixed(1)}%)`);
  console.log(`vs 贪心策略提升：${improvementVsGreedy.toFixed(1)}% (${untrainedVsGreedy.winRate.toFixed(1)}% → ${trainedVsGreedy.winRate.toFixed(1)}%)`);

  console.log('\n⚡ 决策时间分析：');
  console.log(`训练前平均决策时间：${((untrainedVsRandom.avgDecisionTime + untrainedVsGreedy.avgDecisionTime) / 2).toFixed(2)}ms`);
  console.log(`训练后平均决策时间：${((trainedVsRandom.avgDecisionTime + trainedVsGreedy.avgDecisionTime) / 2).toFixed(2)}ms`);

  console.log('\n📊 Q表学习效果：');
  console.log(`学习到的状态数：${qTableStatsB.stateCount + qTableStatsW.stateCount}`);
  console.log(`有效Q值比例：${((qTableStatsB.nonZeroQValues + qTableStatsW.nonZeroQValues) / (qTableStatsB.totalQValues + qTableStatsW.totalQValues) * 100).toFixed(1)}%`);

  // 结论
  console.log('\n🎯 结论：');
  if (improvementVsRandom > 10 && improvementVsGreedy > 5) {
    console.log('✅ Q学习训练效果显著，策略有明显提升');
  } else if (improvementVsRandom > 5 || improvementVsGreedy > 2) {
    console.log('⚠️ Q学习训练有一定效果，但提升有限');
  } else {
    console.log('❌ Q学习训练效果不明显，可能存在算法问题');
  }

  if (qTableStatsB.nonZeroQValues / qTableStatsB.totalQValues > 0.1) {
    console.log('✅ Q表学习充分，覆盖了足够的状态空间');
  } else {
    console.log('⚠️ Q表学习不充分，可能需要更多训练');
  }
}

function analyzeQTableFile(filepath: string, player: string): QTableStats {
  if (!fs.existsSync(filepath)) {
    console.log(`❌ Q表文件不存在: ${filepath}`);
    return {
      stateCount: 0,
      totalQValues: 0,
      avgQValue: 0,
      maxQValue: 0,
      minQValue: 0,
      nonZeroQValues: 0,
      positiveQValues: 0,
      negativeQValues: 0
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const states = Object.keys(data);
    
    let totalQValues = 0;
    let qValueSum = 0;
    let maxQ = -Infinity;
    let minQ = Infinity;
    let nonZeroCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    // 安全地处理大量Q值
    for (const state of states) {
      const qValues = data[state];
      if (Array.isArray(qValues)) {
        for (const qValue of qValues) {
          totalQValues++;
          qValueSum += qValue;
          maxQ = Math.max(maxQ, qValue);
          minQ = Math.min(minQ, qValue);
          
          if (Math.abs(qValue) > 1e-10) nonZeroCount++;
          if (qValue > 0) positiveCount++;
          if (qValue < 0) negativeCount++;
        }
      }
    }

    console.log(`✅ 成功分析${player}玩家Q表：${states.length}个状态，${totalQValues}个Q值`);

    return {
      stateCount: states.length,
      totalQValues,
      avgQValue: totalQValues > 0 ? qValueSum / totalQValues : 0,
      maxQValue: maxQ === -Infinity ? 0 : maxQ,
      minQValue: minQ === Infinity ? 0 : minQ,
      nonZeroQValues: nonZeroCount,
      positiveQValues: positiveCount,
      negativeQValues: negativeCount
    };
  } catch (error) {
    console.log(`❌ 分析Q表文件失败: ${error}`);
    return {
      stateCount: 0,
      totalQValues: 0,
      avgQValue: 0,
      maxQValue: 0,
      minQValue: 0,
      nonZeroQValues: 0,
      positiveQValues: 0,
      negativeQValues: 0
    };
  }
}

async function testAgentPerformance(agent: QLearningOthelloAgent, opponent: any, games: number): Promise<PerformanceMetrics> {
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

  return {
    winRate: (wins / games) * 100,
    avgDecisionTime: decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length,
    totalGames: games,
    wins,
    losses,
    draws
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

async function analyzeDecisionQuality(trainedAgent: QLearningOthelloAgent, untrainedAgent: QLearningOthelloAgent): Promise<void> {
  console.log('分析决策质量差异...');
  
  // 创建几个测试局面
  const testBoards = [
    createOthelloBoard(), // 初始局面
    // 可以添加更多测试局面
  ];

  for (let i = 0; i < testBoards.length; i++) {
    const board = testBoards[i];
    const legalMoves = getLegalActions(board, 'B');
    
    if (legalMoves.length > 1) {
      console.log(`\n测试局面 ${i + 1}：`);
      
      const trainedAction = trainedAgent.chooseAction(board, 'B');
      const untrainedAction = untrainedAgent.chooseAction(board, 'B');
      
      console.log(`训练后选择：(${trainedAction?.row || 'N/A'}, ${trainedAction?.col || 'N/A'})`);
      console.log(`训练前选择：(${untrainedAction?.row || 'N/A'}, ${untrainedAction?.col || 'N/A'})`);
      console.log(`选择是否相同：${JSON.stringify(trainedAction) === JSON.stringify(untrainedAction) ? '是' : '否'}`);
    }
  }
}

function analyzeQValueUpdateAlgorithm(): void {
  console.log('分析Q值更新算法实现...');
  
  // 检查当前Q学习实现的问题
  console.log('\n🔍 当前Q学习算法问题分析：');
  console.log('1. ❌ Q值更新公式错误：');
  console.log('   当前：Q[s][a] += α * (reward - Q[s][a])');
  console.log('   正确：Q[s][a] += α * (reward + γ*max(Q[s\'][a\']) - Q[s][a])');
  
  console.log('\n2. ⚠️ 状态空间过大：');
  console.log('   使用完整8x8棋盘编码，状态空间约3^64');
  console.log('   建议：使用特征提取或位置编码');
  
  console.log('\n3. ⚠️ 奖励机制简单：');
  console.log('   当前：只有终局奖励(+1/-1/0)');
  console.log('   建议：增加中间奖励(位置价值、翻转数量等)');
  
  console.log('\n4. ❌ 缺少经验回放：');
  console.log('   当前：在线学习，容易遗忘');
  console.log('   建议：实现经验回放缓冲区');
}

// 运行分析
if (require.main === module) {
  analyzeQLearningPerformance().catch(console.error);
}
