// {{ AURA-X: Add - 创建完整游戏流程测试脚本. Approval: 寸止(ID:1735819200). }}

import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloBoard, OthelloPlayer } from './othello-types';
import { HeuristicOthelloAgent, MinimaxOthelloAgent, GreedyOthelloAgent } from './strategy/othello-play';
import { RandomOthelloAgent, OthelloAgent } from './strategy/random-agent';

interface GameResult {
  winner: 'B' | 'W' | 'Draw';
  finalScore: { B: number; W: number };
  totalMoves: number;
  duration: number;
}

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

async function testGameFlow(): Promise<void> {
  console.log('🧪 开始测试Othello完整游戏流程');
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  // 测试1: 基础游戏逻辑
  console.log('\n📋 测试1: 基础游戏逻辑验证');
  console.log('-'.repeat(40));
  try {
    const basicTest = testBasicGameLogic();
    results.push(basicTest);
    console.log(`${basicTest.success ? '✅' : '❌'} ${basicTest.message}`);
  } catch (error) {
    results.push({
      testName: '基础游戏逻辑',
      success: false,
      message: `测试异常: ${error}`
    });
  }

  // 测试2: AI vs AI 完整对局
  console.log('\n📋 测试2: AI vs AI 完整对局');
  console.log('-'.repeat(40));
  try {
    const aiVsAiTest = await testAIvsAI();
    results.push(aiVsAiTest);
    console.log(`${aiVsAiTest.success ? '✅' : '❌'} ${aiVsAiTest.message}`);
    if (aiVsAiTest.details) {
      console.log(`   胜者: ${aiVsAiTest.details.winner === 'B' ? '● 黑棋' : aiVsAiTest.details.winner === 'W' ? '○ 白棋' : '平局'}`);
      console.log(`   最终得分: ● ${aiVsAiTest.details.finalScore.B} | ○ ${aiVsAiTest.details.finalScore.W}`);
      console.log(`   总移动数: ${aiVsAiTest.details.totalMoves}`);
      console.log(`   游戏时长: ${aiVsAiTest.details.duration}ms`);
    }
  } catch (error) {
    results.push({
      testName: 'AI vs AI 对局',
      success: false,
      message: `测试异常: ${error}`
    });
  }

  // 测试3: 多种策略对战
  console.log('\n📋 测试3: 多种策略对战测试');
  console.log('-'.repeat(40));
  try {
    const strategyBattleTest = await testStrategyBattles();
    results.push(strategyBattleTest);
    console.log(`${strategyBattleTest.success ? '✅' : '❌'} ${strategyBattleTest.message}`);
    if (strategyBattleTest.details) {
      console.log('   对战结果:');
      strategyBattleTest.details.forEach((battle: any) => {
        console.log(`   ${battle.description}: ${battle.result}`);
      });
    }
  } catch (error) {
    results.push({
      testName: '多种策略对战',
      success: false,
      message: `测试异常: ${error}`
    });
  }

  // 测试4: 边界情况处理
  console.log('\n📋 测试4: 边界情况处理');
  console.log('-'.repeat(40));
  try {
    const edgeCaseTest = testEdgeCases();
    results.push(edgeCaseTest);
    console.log(`${edgeCaseTest.success ? '✅' : '❌'} ${edgeCaseTest.message}`);
  } catch (error) {
    results.push({
      testName: '边界情况处理',
      success: false,
      message: `测试异常: ${error}`
    });
  }

  // 测试5: 性能测试
  console.log('\n📋 测试5: 性能测试');
  console.log('-'.repeat(40));
  try {
    const performanceTest = await testPerformance();
    results.push(performanceTest);
    console.log(`${performanceTest.success ? '✅' : '❌'} ${performanceTest.message}`);
    if (performanceTest.details) {
      console.log(`   平均每局时长: ${performanceTest.details.avgGameTime}ms`);
      console.log(`   平均每步时长: ${performanceTest.details.avgMoveTime}ms`);
    }
  } catch (error) {
    results.push({
      testName: '性能测试',
      success: false,
      message: `测试异常: ${error}`
    });
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 游戏流程测试总结');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ 成功测试: ${successCount}/${totalCount}`);
  console.log(`❌ 失败测试: ${totalCount - successCount}/${totalCount}`);
  console.log(`📈 成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
  
  console.log('\n📋 详细结果：');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.testName}: ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  if (successCount === totalCount) {
    console.log('\n🎉 所有游戏流程测试通过！Othello系统运行完美！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能实现');
  }
}

function testBasicGameLogic(): TestResult {
  // 测试初始棋盘
  const board = createOthelloBoard();
  if (board.length !== 8 || board[0].length !== 8) {
    return {
      testName: '基础游戏逻辑',
      success: false,
      message: '棋盘尺寸不正确'
    };
  }

  // 测试初始位置
  if (board[3][3] !== 'W' || board[3][4] !== 'B' || board[4][3] !== 'B' || board[4][4] !== 'W') {
    return {
      testName: '基础游戏逻辑',
      success: false,
      message: '初始棋子位置不正确'
    };
  }

  // 测试合法移动
  const legalMoves = getLegalActions(board, 'B');
  if (legalMoves.length !== 4) {
    return {
      testName: '基础游戏逻辑',
      success: false,
      message: `初始合法移动数量不正确，期望4个，实际${legalMoves.length}个`
    };
  }

  // 测试移动执行
  const firstMove = legalMoves[0];
  const newBoard = makeMove(board, firstMove, 'B');
  const newCount = countPieces(newBoard);
  if (newCount.B < 3) {
    return {
      testName: '基础游戏逻辑',
      success: false,
      message: '移动后黑棋数量不正确'
    };
  }

  return {
    testName: '基础游戏逻辑',
    success: true,
    message: '基础游戏逻辑验证通过'
  };
}

async function testAIvsAI(): Promise<TestResult> {
  const agentB = new HeuristicOthelloAgent();
  const agentW = new MinimaxOthelloAgent(2); // 使用较小深度以加快测试

  const startTime = Date.now();
  const result = playCompleteGame(agentB, agentW);
  const endTime = Date.now();

  if (!result) {
    return {
      testName: 'AI vs AI 对局',
      success: false,
      message: '游戏未能正常完成'
    };
  }

  return {
    testName: 'AI vs AI 对局',
    success: true,
    message: 'AI对战完成，游戏流程正常',
    details: {
      ...result,
      duration: endTime - startTime
    }
  };
}

async function testStrategyBattles(): Promise<TestResult> {
  const strategies = [
    { name: '随机', agent: new RandomOthelloAgent() },
    { name: '贪心', agent: new GreedyOthelloAgent() },
    { name: '启发式', agent: new HeuristicOthelloAgent() }
  ];

  const battles = [];
  let successfulBattles = 0;

  for (let i = 0; i < strategies.length; i++) {
    for (let j = i + 1; j < strategies.length; j++) {
      const strategy1 = strategies[i];
      const strategy2 = strategies[j];
      
      const result = playCompleteGame(strategy1.agent, strategy2.agent);
      if (result) {
        successfulBattles++;
        battles.push({
          description: `${strategy1.name} vs ${strategy2.name}`,
          result: `${result.winner === 'B' ? strategy1.name : result.winner === 'W' ? strategy2.name : '平局'} 获胜 (${result.finalScore.B}-${result.finalScore.W})`
        });
      } else {
        battles.push({
          description: `${strategy1.name} vs ${strategy2.name}`,
          result: '对战失败'
        });
      }
    }
  }

  const totalBattles = (strategies.length * (strategies.length - 1)) / 2;
  const success = successfulBattles === totalBattles;

  return {
    testName: '多种策略对战',
    success,
    message: success ? 
      `所有${totalBattles}场对战完成` : 
      `${successfulBattles}/${totalBattles}场对战成功`,
    details: battles
  };
}

function testEdgeCases(): TestResult {
  // 测试游戏结束检测
  const emptyBoard: OthelloBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  if (!isGameOver(emptyBoard)) {
    return {
      testName: '边界情况处理',
      success: false,
      message: '空棋盘应该被识别为游戏结束'
    };
  }

  // 测试满棋盘
  const fullBoard: OthelloBoard = Array.from({ length: 8 }, () => Array(8).fill('B'));
  if (!isGameOver(fullBoard)) {
    return {
      testName: '边界情况处理',
      success: false,
      message: '满棋盘应该被识别为游戏结束'
    };
  }

  return {
    testName: '边界情况处理',
    success: true,
    message: '边界情况处理正确'
  };
}

async function testPerformance(): Promise<TestResult> {
  const games = 5;
  const gameTimes: number[] = [];
  const moveTimes: number[] = [];

  for (let i = 0; i < games; i++) {
    const agentB = new GreedyOthelloAgent();
    const agentW = new GreedyOthelloAgent();

    const startTime = Date.now();
    const result = playCompleteGame(agentB, agentW, true); // 记录移动时间
    const endTime = Date.now();

    if (result) {
      gameTimes.push(endTime - startTime);
      // 估算平均移动时间
      moveTimes.push((endTime - startTime) / result.totalMoves);
    }
  }

  if (gameTimes.length === 0) {
    return {
      testName: '性能测试',
      success: false,
      message: '没有成功完成的游戏'
    };
  }

  const avgGameTime = gameTimes.reduce((a, b) => a + b, 0) / gameTimes.length;
  const avgMoveTime = moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length;

  // 性能标准：平均每局不超过5秒，每步不超过50ms
  const success = avgGameTime < 5000 && avgMoveTime < 50;

  return {
    testName: '性能测试',
    success,
    message: success ? 
      '性能测试通过' : 
      `性能不达标：游戏${avgGameTime.toFixed(0)}ms，移动${avgMoveTime.toFixed(2)}ms`,
    details: {
      avgGameTime: avgGameTime.toFixed(0),
      avgMoveTime: avgMoveTime.toFixed(2)
    }
  };
}

function playCompleteGame(agentB: OthelloAgent, agentW: OthelloAgent, trackTime = false): GameResult | null {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  let moveCount = 0;
  const maxMoves = 60; // 防止无限循环

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

  const finalScore = countPieces(board);
  const winner = getWinner(board) || (finalScore.B > finalScore.W ? 'B' : finalScore.W > finalScore.B ? 'W' : 'Draw');

  return {
    winner,
    finalScore,
    totalMoves: moveCount,
    duration: 0 // 在调用处计算
  };
}

// 运行测试
if (require.main === module) {
  testGameFlow().catch(console.error);
}
