// {{ AURA-X: Add - 测试修复后的Q学习算法. Approval: 寸止(ID:1735819200). }}

import { QLearningOthelloAgent, GreedyOthelloAgent, RandomOthelloAgent } from './strategy';
import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';

interface TestResult {
  agentName: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDecisionTime: number;
}

async function testFixedQLearning(): Promise<void> {
  console.log('🔧 测试修复后的Q学习算法');
  console.log('='.repeat(60));

  // 第一阶段：对比原始和修复后的Q学习算法
  console.log('\n📊 第一阶段：算法对比测试');
  console.log('-'.repeat(40));

  // 创建原始Q学习智能体（使用旧的Q表）
  const originalAgent = new QLearningOthelloAgent('B', 0.0, 0.1, 0.9);
  originalAgent.loadQTable('src/othello/qtable-b.json');

  // 创建修复后的Q学习智能体（重新训练）
  const fixedAgent = new QLearningOthelloAgent('B', 0.1, 0.1, 0.95);

  // 对手
  const randomOpponent = new RandomOthelloAgent();
  const greedyOpponent = new GreedyOthelloAgent();

  console.log('🎮 测试配置：');
  console.log('- 修复后算法训练：1000局');
  console.log('- 性能测试：每种对手50局');
  console.log('- 对手：随机策略 + 贪心策略');

  // 第二阶段：训练修复后的Q学习算法
  console.log('\n🏋️ 第二阶段：训练修复后的Q学习算法');
  console.log('-'.repeat(40));

  console.log('开始训练修复后的Q学习算法...');
  const trainEpisodes = 1000;
  const opponents = [randomOpponent, greedyOpponent];

  for (let i = 0; i < trainEpisodes; i++) {
    const opponent = opponents[i % opponents.length];
    
    // 动态调整探索率
    fixedAgent.epsilon = Math.max(0.01, 0.2 * (1 - i / trainEpisodes));
    
    fixedAgent.trainEpisode(opponent);
    
    if ((i + 1) % 200 === 0) {
      console.log(`  已完成 ${i + 1}/${trainEpisodes} 局训练，当前探索率: ${fixedAgent.epsilon.toFixed(3)}`);
    }
  }

  console.log('训练完成！保存Q表...');
  fixedAgent.saveQTable('src/othello/qtable-fixed-b.json');

  // 第三阶段：性能对比测试
  console.log('\n⚔️ 第三阶段：性能对比测试');
  console.log('-'.repeat(40));

  // 设置为纯利用模式
  originalAgent.epsilon = 0.0;
  fixedAgent.epsilon = 0.0;

  console.log('🔍 测试原始Q学习算法：');
  const originalVsRandom = await testAgentPerformance(originalAgent, randomOpponent, 50, '原始Q学习 vs 随机');
  const originalVsGreedy = await testAgentPerformance(originalAgent, greedyOpponent, 50, '原始Q学习 vs 贪心');

  console.log('\n🎯 测试修复后Q学习算法：');
  const fixedVsRandom = await testAgentPerformance(fixedAgent, randomOpponent, 50, '修复Q学习 vs 随机');
  const fixedVsGreedy = await testAgentPerformance(fixedAgent, greedyOpponent, 50, '修复Q学习 vs 贪心');

  // 第四阶段：直接对战
  console.log('\n🥊 第四阶段：直接对战测试');
  console.log('-'.repeat(40));

  const directBattle = await directBattleTest(originalAgent, fixedAgent, 50);

  // 第五阶段：Q值分析
  console.log('\n📈 第五阶段：Q值质量分析');
  console.log('-'.repeat(40));

  analyzeQValueQuality(originalAgent, fixedAgent);

  // 最终报告
  console.log('\n' + '='.repeat(60));
  console.log('📋 修复后Q学习算法测试报告');
  console.log('='.repeat(60));

  console.log('\n🏆 性能对比：');
  console.log(`vs 随机策略：原始 ${originalVsRandom.winRate.toFixed(1)}% → 修复 ${fixedVsRandom.winRate.toFixed(1)}% (${(fixedVsRandom.winRate - originalVsRandom.winRate).toFixed(1)}%)`);
  console.log(`vs 贪心策略：原始 ${originalVsGreedy.winRate.toFixed(1)}% → 修复 ${fixedVsGreedy.winRate.toFixed(1)}% (${(fixedVsGreedy.winRate - originalVsGreedy.winRate).toFixed(1)}%)`);

  console.log('\n⚡ 决策时间对比：');
  console.log(`vs 随机策略：原始 ${originalVsRandom.avgDecisionTime.toFixed(2)}ms → 修复 ${fixedVsRandom.avgDecisionTime.toFixed(2)}ms`);
  console.log(`vs 贪心策略：原始 ${originalVsGreedy.avgDecisionTime.toFixed(2)}ms → 修复 ${fixedVsGreedy.avgDecisionTime.toFixed(2)}ms`);

  console.log('\n🥊 直接对战：');
  console.log(`修复Q学习 vs 原始Q学习: ${directBattle.fixedWins}胜 ${directBattle.originalWins}负 ${directBattle.draws}平`);

  // 结论
  console.log('\n🎯 结论：');
  const avgImprovement = ((fixedVsRandom.winRate - originalVsRandom.winRate) + (fixedVsGreedy.winRate - originalVsGreedy.winRate)) / 2;
  
  if (avgImprovement > 10) {
    console.log('✅ Q学习算法修复效果显著，性能大幅提升');
  } else if (avgImprovement > 5) {
    console.log('✅ Q学习算法修复有效，性能有明显提升');
  } else if (avgImprovement > 0) {
    console.log('⚠️ Q学习算法修复有一定效果，但提升有限');
  } else {
    console.log('❌ Q学习算法修复效果不明显，可能需要进一步调优');
  }

  if (directBattle.fixedWins > directBattle.originalWins) {
    console.log('✅ 修复后的Q学习算法在直接对战中表现更好');
  } else {
    console.log('⚠️ 修复后的Q学习算法在直接对战中未显示明显优势');
  }
}

async function testAgentPerformance(agent: QLearningOthelloAgent, opponent: any, games: number, description: string): Promise<TestResult> {
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

async function directBattleTest(originalAgent: any, fixedAgent: any, games: number): Promise<{
  originalWins: number;
  fixedWins: number;
  draws: number;
}> {
  let originalWins = 0, fixedWins = 0, draws = 0;

  for (let i = 0; i < games; i++) {
    // 交替先手
    const result = i % 2 === 0 ? 
      playGame(originalAgent, fixedAgent) : 
      playGame(fixedAgent, originalAgent);

    if (result === 'B') {
      if (i % 2 === 0) originalWins++;
      else fixedWins++;
    } else if (result === 'W') {
      if (i % 2 === 0) fixedWins++;
      else originalWins++;
    } else {
      draws++;
    }
  }

  console.log(`直接对战结果: 原始${originalWins}胜 修复${fixedWins}胜 平局${draws}场`);
  return { originalWins, fixedWins, draws };
}

function analyzeQValueQuality(originalAgent: any, fixedAgent: any): void {
  console.log('分析Q值质量差异...');
  
  // 创建测试局面
  const testBoard = createOthelloBoard();
  const legalMoves = getLegalActions(testBoard, 'B');
  
  if (legalMoves.length > 1) {
    console.log('\n初始局面Q值对比：');
    
    const originalAction = originalAgent.chooseAction(testBoard, 'B');
    const fixedAction = fixedAgent.chooseAction(testBoard, 'B');
    
    console.log(`原始算法选择：(${originalAction?.row || 'N/A'}, ${originalAction?.col || 'N/A'})`);
    console.log(`修复算法选择：(${fixedAction?.row || 'N/A'}, ${fixedAction?.col || 'N/A'})`);
    console.log(`选择是否相同：${JSON.stringify(originalAction) === JSON.stringify(fixedAction) ? '是' : '否'}`);
    
    // 显示可选位置
    console.log('可选位置：');
    legalMoves.forEach((move, index) => {
      console.log(`  ${index + 1}. (${move.row + 1}, ${move.col + 1})`);
    });
  }
}

// 运行测试
if (require.main === module) {
  testFixedQLearning().catch(console.error);
}
