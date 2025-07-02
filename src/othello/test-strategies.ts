// {{ AURA-X: Add - 创建AI策略系统测试脚本. Approval: 寸止(ID:1735819200). }}

import { createOthelloBoard, getLegalActions, makeMove } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';
import {
  HeuristicOthelloAgent,
  MinimaxOthelloAgent,
  QLearningOthelloAgent,
  GreedyOthelloAgent,
  RandomOthelloAgent,
  OthelloAgent
} from './strategy';

interface StrategyTestResult {
  strategyName: string;
  success: boolean;
  message: string;
  performance?: {
    avgDecisionTime: number;
    validMoveRate: number;
    testCases: number;
  };
}

async function testStrategies(): Promise<void> {
  console.log('🧪 开始测试Othello AI策略系统');
  console.log('='.repeat(60));

  const results: StrategyTestResult[] = [];

  // 定义测试策略
  const strategies: { name: string; agent: OthelloAgent; description: string }[] = [
    {
      name: '随机策略',
      agent: new RandomOthelloAgent(),
      description: '随机选择合法位置'
    },
    {
      name: '贪心策略',
      agent: new GreedyOthelloAgent(),
      description: '选择能翻转最多棋子的位置'
    },
    {
      name: '启发式策略',
      agent: new HeuristicOthelloAgent(),
      description: '综合考虑位置价值和棋子数量'
    },
    {
      name: '极小极大策略(深度3)',
      agent: new MinimaxOthelloAgent(3),
      description: '深度搜索最优解'
    },
    {
      name: 'Q学习策略',
      agent: new QLearningOthelloAgent('B', 0.1, 0.5, 0.9),
      description: '基于强化学习的自适应策略'
    }
  ];

  // 测试每个策略
  for (const strategy of strategies) {
    console.log(`\n📋 测试策略: ${strategy.name}`);
    console.log(`📝 描述: ${strategy.description}`);
    console.log('-'.repeat(40));

    try {
      const testResult = await testSingleStrategy(strategy.agent, strategy.name);
      results.push(testResult);
      
      if (testResult.success) {
        console.log(`✅ ${strategy.name} 测试通过`);
        if (testResult.performance) {
          console.log(`⏱️  平均决策时间: ${testResult.performance.avgDecisionTime.toFixed(2)}ms`);
          console.log(`🎯 有效移动率: ${(testResult.performance.validMoveRate * 100).toFixed(1)}%`);
          console.log(`📊 测试用例数: ${testResult.performance.testCases}`);
        }
      } else {
        console.log(`❌ ${strategy.name} 测试失败: ${testResult.message}`);
      }
    } catch (error) {
      results.push({
        strategyName: strategy.name,
        success: false,
        message: `策略测试异常: ${error}`
      });
      console.log(`❌ ${strategy.name} 测试异常: ${error}`);
    }
  }

  // 策略对战测试
  console.log('\n📋 策略对战测试');
  console.log('-'.repeat(40));
  await testStrategyBattles(strategies);

  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 策略系统测试总结');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ 成功策略: ${successCount}/${totalCount}`);
  console.log(`❌ 失败策略: ${totalCount - successCount}/${totalCount}`);
  console.log(`📈 成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
  
  console.log('\n📋 详细结果：');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.strategyName}: ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  if (successCount === totalCount) {
    console.log('\n🎉 所有AI策略测试通过！策略系统运行正常！');
  } else {
    console.log('\n⚠️ 部分AI策略测试失败，请检查策略实现');
  }
}

async function testSingleStrategy(agent: OthelloAgent, strategyName: string): Promise<StrategyTestResult> {
  const testCases = 10;
  const decisionTimes: number[] = [];
  let validMoves = 0;
  let totalMoves = 0;

  for (let i = 0; i < testCases; i++) {
    // 创建不同的测试局面
    let board = createOthelloBoard();
    const player: OthelloPlayer = i % 2 === 0 ? 'B' : 'W';
    
    // 随机进行几步移动创建测试局面
    const randomMoves = Math.floor(Math.random() * 5) + 1;
    let currentPlayer: OthelloPlayer = 'B';
    
    for (let j = 0; j < randomMoves; j++) {
      const legalMoves = getLegalActions(board, currentPlayer);
      if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        board = makeMove(board, randomMove, currentPlayer);
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      }
    }

    // 测试策略决策
    const legalMoves = getLegalActions(board, player);
    if (legalMoves.length > 0) {
      totalMoves++;
      
      const startTime = Date.now();
      const decision = agent.chooseAction(board, player);
      const endTime = Date.now();
      
      decisionTimes.push(endTime - startTime);
      
      // 验证决策是否有效
      if (decision && legalMoves.some(move => move.row === decision.row && move.col === decision.col)) {
        validMoves++;
      }
    }
  }

  const avgDecisionTime = decisionTimes.length > 0 ? 
    decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length : 0;
  const validMoveRate = totalMoves > 0 ? validMoves / totalMoves : 0;

  const success = validMoveRate >= 0.8; // 至少80%的决策应该是有效的

  return {
    strategyName,
    success,
    message: success ? 
      `策略运行正常，有效移动率${(validMoveRate * 100).toFixed(1)}%` : 
      `策略存在问题，有效移动率仅${(validMoveRate * 100).toFixed(1)}%`,
    performance: {
      avgDecisionTime,
      validMoveRate,
      testCases: totalMoves
    }
  };
}

async function testStrategyBattles(strategies: { name: string; agent: OthelloAgent; description: string }[]): Promise<void> {
  console.log('🥊 进行策略对战测试（每对策略进行3局快速对战）');
  
  // 选择几个代表性策略进行对战
  const battleStrategies = strategies.slice(0, 3); // 随机、贪心、启发式
  
  for (let i = 0; i < battleStrategies.length; i++) {
    for (let j = i + 1; j < battleStrategies.length; j++) {
      const strategy1 = battleStrategies[i];
      const strategy2 = battleStrategies[j];
      
      console.log(`\n⚔️  ${strategy1.name} vs ${strategy2.name}`);
      
      let wins1 = 0, wins2 = 0, draws = 0;
      
      for (let game = 0; game < 3; game++) {
        const result = playQuickGame(strategy1.agent, strategy2.agent);
        if (result === 'B') wins1++;
        else if (result === 'W') wins2++;
        else draws++;
      }
      
      console.log(`   结果: ${strategy1.name} ${wins1}胜 | ${strategy2.name} ${wins2}胜 | 平局 ${draws}场`);
    }
  }
}

function playQuickGame(agentB: OthelloAgent, agentW: OthelloAgent): 'B' | 'W' | 'Draw' {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  let moveCount = 0;
  const maxMoves = 30; // 限制最大移动数，避免无限循环

  while (moveCount < maxMoves && passCount < 2) {
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const legalMoves = getLegalActions(board, currentPlayer);
    
    if (legalMoves.length === 0) {
      passCount++;
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }
    
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

  // 计算最终得分
  let bCount = 0, wCount = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === 'B') bCount++;
      else if (board[row][col] === 'W') wCount++;
    }
  }

  if (bCount > wCount) return 'B';
  if (wCount > bCount) return 'W';
  return 'Draw';
}

// 运行测试
if (require.main === module) {
  testStrategies().catch(console.error);
}
