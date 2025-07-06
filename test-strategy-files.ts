#!/usr/bin/env ts-node

/**
 * 策略文件功能验证测试脚本
 * 逐一检查 src/othello/strategy 文件夹下所有文件的功能
 */

import * as fs from 'fs';
import * as path from 'path';

// 导入依赖的类型和函数
import { OthelloBoard, OthelloPlayer, OthelloAction } from './src/othello/othello-types';
import { createOthelloBoard, getLegalActions } from './src/othello/othello-game';

// 测试结果接口
interface TestResult {
  file: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  errors: string[];
  warnings: string[];
  details: string[];
}

// 测试结果汇总
const testResults: TestResult[] = [];

/**
 * 创建测试结果对象
 */
function createTestResult(file: string): TestResult {
  return {
    file,
    status: 'PASS',
    errors: [],
    warnings: [],
    details: []
  };
}

/**
 * 添加错误信息
 */
function addError(result: TestResult, error: string): void {
  result.errors.push(error);
  result.status = 'FAIL';
}

/**
 * 添加警告信息
 */
function addWarning(result: TestResult, warning: string): void {
  result.warnings.push(warning);
  if (result.status === 'PASS') {
    result.status = 'WARNING';
  }
}

/**
 * 添加详细信息
 */
function addDetail(result: TestResult, detail: string): void {
  result.details.push(detail);
}

/**
 * 测试文件语法
 */
async function testFileSyntax(filePath: string): Promise<TestResult> {
  const result = createTestResult(filePath);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      addError(result, '文件不存在');
      return result;
    }

    // 检查文件是否可读
    const content = fs.readFileSync(filePath, 'utf-8');
    addDetail(result, `文件大小: ${content.length} 字符`);
    addDetail(result, `行数: ${content.split('\n').length}`);

    // 尝试动态导入检查语法
    const absolutePath = path.resolve(filePath);
    await import(absolutePath);
    addDetail(result, '语法检查通过');

  } catch (error: any) {
    addError(result, `语法错误: ${error.message}`);
  }

  return result;
}

/**
 * 测试策略工具函数
 */
async function testStrategyUtils(): Promise<TestResult> {
  const result = createTestResult('strategy-utils.ts');
  
  try {
    const { 
      calculateFlips, 
      calculatePositionValue, 
      isCorner, 
      isEdge,
      getOpponent,
      evaluateBoard
    } = await import('./src/othello/strategy/strategy-utils');

    // 创建测试棋盘
    const board = createOthelloBoard();
    const testAction: OthelloAction = { row: 2, col: 3 };

    // 测试 calculateFlips
    const flips = calculateFlips(board, testAction, 'B');
    addDetail(result, `calculateFlips 测试: ${flips} 个翻转`);

    // 测试 calculatePositionValue
    const cornerValue = calculatePositionValue(0, 0);
    const edgeValue = calculatePositionValue(0, 3);
    const centerValue = calculatePositionValue(3, 3);
    addDetail(result, `位置价值测试 - 角落: ${cornerValue}, 边缘: ${edgeValue}, 中心: ${centerValue}`);

    // 测试 isCorner 和 isEdge
    if (!isCorner(0, 0) || isCorner(3, 3)) {
      addError(result, 'isCorner 函数测试失败');
    }
    if (!isEdge(0, 3) || isEdge(3, 3)) {
      addError(result, 'isEdge 函数测试失败');
    }

    // 测试 getOpponent
    if (getOpponent('B') !== 'W' || getOpponent('W') !== 'B') {
      addError(result, 'getOpponent 函数测试失败');
    }

    // 测试 evaluateBoard
    const evaluation = evaluateBoard(board, 'B');
    addDetail(result, `棋盘评估测试: ${evaluation}`);

    addDetail(result, '所有工具函数测试通过');

  } catch (error: any) {
    addError(result, `工具函数测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试随机策略
 */
async function testRandomAgent(): Promise<TestResult> {
  const result = createTestResult('random-agent.ts');
  
  try {
    const { RandomOthelloAgent } = await import('./src/othello/strategy/random-agent');
    
    const agent = new RandomOthelloAgent();
    const board = createOthelloBoard();
    
    // 测试选择动作
    const action = agent.chooseAction(board, 'B');
    if (!action) {
      addError(result, '随机策略未能选择动作');
    } else {
      addDetail(result, `选择动作: (${action.row}, ${action.col})`);
    }

    // 测试无合法动作的情况
    const emptyBoard: OthelloBoard = Array.from({ length: 8 }, () => Array(8).fill('B'));
    const noAction = agent.chooseAction(emptyBoard, 'W');
    if (noAction !== null) {
      addError(result, '无合法动作时应返回null');
    }

    addDetail(result, '随机策略测试通过');

  } catch (error: any) {
    addError(result, `随机策略测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试贪心策略
 */
async function testGreedyAgent(): Promise<TestResult> {
  const result = createTestResult('greedy-agent.ts');
  
  try {
    const { GreedyOthelloAgent } = await import('./src/othello/strategy/greedy-agent');
    
    const agent = new GreedyOthelloAgent();
    const board = createOthelloBoard();
    
    // 测试选择动作
    const action = agent.chooseAction(board, 'B');
    if (!action) {
      addError(result, '贪心策略未能选择动作');
    } else {
      addDetail(result, `选择动作: (${action.row}, ${action.col})`);
    }

    // 测试策略信息
    const name = agent.getStrategyName();
    const description = agent.getStrategyDescription();
    addDetail(result, `策略名称: ${name}`);
    addDetail(result, `策略描述: ${description}`);

    // 测试动作评估
    const legalActions = getLegalActions(board, 'B');
    if (legalActions.length > 0) {
      const evaluation = agent.evaluateAction(board, legalActions[0], 'B');
      addDetail(result, `动作评估测试: ${evaluation}`);
    }

    addDetail(result, '贪心策略测试通过');

  } catch (error: any) {
    addError(result, `贪心策略测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试启发式策略
 */
async function testHeuristicAgent(): Promise<TestResult> {
  const result = createTestResult('heuristic-agent.ts');
  
  try {
    const { HeuristicOthelloAgent } = await import('./src/othello/strategy/heuristic-agent');
    
    const agent = new HeuristicOthelloAgent();
    const board = createOthelloBoard();
    
    // 测试选择动作
    const action = agent.chooseAction(board, 'B');
    if (!action) {
      addError(result, '启发式策略未能选择动作');
    } else {
      addDetail(result, `选择动作: (${action.row}, ${action.col})`);
    }

    // 测试最佳动作信息
    const bestInfo = agent.getBestActionInfo(board, 'B');
    addDetail(result, `最佳动作信息: ${bestInfo.reasoning}`);

    // 测试权重配置
    const weights = agent.getWeightConfig();
    addDetail(result, `权重配置: 角落=${weights.cornerWeight}, 边缘=${weights.edgeWeight}`);

    addDetail(result, '启发式策略测试通过');

  } catch (error: any) {
    addError(result, `启发式策略测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试Minimax策略
 */
async function testMinimaxAgent(): Promise<TestResult> {
  const result = createTestResult('minimax-agent.ts');
  
  try {
    const { MinimaxOthelloAgent } = await import('./src/othello/strategy/minimax-agent');
    
    const agent = new MinimaxOthelloAgent(3); // 使用较小的深度以加快测试
    const board = createOthelloBoard();
    
    // 测试选择动作
    const action = agent.chooseAction(board, 'B');
    if (!action) {
      addError(result, 'Minimax策略未能选择动作');
    } else {
      addDetail(result, `选择动作: (${action.row}, ${action.col})`);
    }

    // 测试深度设置
    const originalDepth = agent.getMaxDepth();
    agent.setMaxDepth(5);
    const newDepth = agent.getMaxDepth();
    addDetail(result, `深度设置测试: ${originalDepth} -> ${newDepth}`);

    // 测试详细评估
    const evaluation = agent.evaluateDetailed(board, 'B');
    addDetail(result, `详细评估: 总分=${evaluation.totalScore}, 棋子差=${evaluation.pieceDifference}`);

    addDetail(result, 'Minimax策略测试通过');

  } catch (error: any) {
    addError(result, `Minimax策略测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试Q学习策略
 */
async function testQLearningAgent(): Promise<TestResult> {
  const result = createTestResult('qlearning-agent.ts');
  
  try {
    const { QLearningOthelloAgent } = await import('./src/othello/strategy/qlearning-agent');
    
    const agent = new QLearningOthelloAgent('B', 0.1, 0.15, 0.95, false);
    const board = createOthelloBoard();
    
    // 测试选择动作
    const action = agent.chooseAction(board, 'B');
    if (!action) {
      addError(result, 'Q学习策略未能选择动作');
    } else {
      addDetail(result, `选择动作: (${action.row}, ${action.col})`);
    }

    // 测试参数设置
    const originalParams = agent.getParameters();
    agent.setEpsilon(0.2);
    const newParams = agent.getParameters();
    addDetail(result, `参数设置测试: epsilon ${originalParams.epsilon} -> ${newParams.epsilon}`);

    // 测试Q表统计
    const stats = agent.getQTableStats();
    addDetail(result, `Q表统计: ${stats.stateCount} 个状态, 特征提取=${stats.useFeatureExtraction}`);

    // 测试特征提取模式切换
    agent.setFeatureExtraction(true);
    const newStats = agent.getQTableStats();
    addDetail(result, `特征提取模式: ${newStats.useFeatureExtraction}`);

    addDetail(result, 'Q学习策略测试通过');

  } catch (error: any) {
    addError(result, `Q学习策略测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 测试索引文件
 */
async function testIndexFile(): Promise<TestResult> {
  const result = createTestResult('index.ts');
  
  try {
    const strategyModule = await import('./src/othello/strategy/index');
    
    // 测试导出的策略类
    const { 
      RandomOthelloAgent, 
      GreedyOthelloAgent, 
      HeuristicOthelloAgent, 
      MinimaxOthelloAgent, 
      QLearningOthelloAgent,
      StrategyType,
      createStrategy,
      getAvailableStrategies
    } = strategyModule;

    // 测试策略工厂函数
    const randomAgent = createStrategy(StrategyType.RANDOM);
    const greedyAgent = createStrategy(StrategyType.GREEDY);
    addDetail(result, '策略工厂函数测试通过');

    // 测试可用策略列表
    const strategies = getAvailableStrategies();
    addDetail(result, `可用策略: ${strategies.join(', ')}`);

    // 测试策略信息
    const strategyInfo = strategyModule.getStrategyInfo(StrategyType.HEURISTIC);
    addDetail(result, `策略信息测试: ${strategyInfo.name} - ${strategyInfo.difficulty}`);

    addDetail(result, '索引文件测试通过');

  } catch (error: any) {
    addError(result, `索引文件测试失败: ${error.message}`);
  }

  return result;
}

/**
 * 主测试函数
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 开始检查 src/othello/strategy 文件夹下的所有文件...\n');

  // 1. 测试语法
  console.log('📝 第一步：语法检查');
  const files = [
    'src/othello/strategy/strategy-utils.ts',
    'src/othello/strategy/random-agent.ts',
    'src/othello/strategy/greedy-agent.ts',
    'src/othello/strategy/heuristic-agent.ts',
    'src/othello/strategy/minimax-agent.ts',
    'src/othello/strategy/qlearning-agent.ts',
    'src/othello/strategy/index.ts'
  ];

  for (const file of files) {
    const syntaxResult = await testFileSyntax(file);
    testResults.push(syntaxResult);
    console.log(`  ${syntaxResult.status === 'PASS' ? '✅' : '❌'} ${file}`);
  }

  // 2. 功能测试
  console.log('\n🔧 第二步：功能测试');
  
  const functionalTests = [
    { name: 'strategy-utils.ts', test: testStrategyUtils },
    { name: 'random-agent.ts', test: testRandomAgent },
    { name: 'greedy-agent.ts', test: testGreedyAgent },
    { name: 'heuristic-agent.ts', test: testHeuristicAgent },
    { name: 'minimax-agent.ts', test: testMinimaxAgent },
    { name: 'qlearning-agent.ts', test: testQLearningAgent },
    { name: 'index.ts', test: testIndexFile }
  ];

  for (const { name, test } of functionalTests) {
    try {
      const funcResult = await test();
      testResults.push(funcResult);
      console.log(`  ${funcResult.status === 'PASS' ? '✅' : funcResult.status === 'WARNING' ? '⚠️' : '❌'} ${name}`);
    } catch (error: any) {
      const errorResult = createTestResult(name);
      addError(errorResult, `测试执行失败: ${error.message}`);
      testResults.push(errorResult);
      console.log(`  ❌ ${name} (测试执行失败)`);
    }
  }

  // 3. 生成报告
  console.log('\n📊 测试结果汇总:');
  generateReport();
}

/**
 * 生成测试报告
 */
function generateReport(): void {
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const warningCount = testResults.filter(r => r.status === 'WARNING').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;

  console.log(`\n总计: ${testResults.length} 个文件`);
  console.log(`✅ 通过: ${passCount}`);
  console.log(`⚠️  警告: ${warningCount}`);
  console.log(`❌ 失败: ${failCount}`);

  // 详细报告
  console.log('\n📋 详细报告:');
  for (const result of testResults) {
    console.log(`\n${result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'} ${result.file}`);
    
    if (result.details.length > 0) {
      console.log('  详细信息:');
      result.details.forEach(detail => console.log(`    • ${detail}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('  ⚠️ 警告:');
      result.warnings.forEach(warning => console.log(`    • ${warning}`));
    }
    
    if (result.errors.length > 0) {
      console.log('  ❌ 错误:');
      result.errors.forEach(error => console.log(`    • ${error}`));
    }
  }

  // 总结
  console.log('\n🎯 总结:');
  if (failCount === 0) {
    if (warningCount === 0) {
      console.log('🎉 所有文件功能正常，没有发现问题！');
    } else {
      console.log('✨ 所有文件基本功能正常，但有一些警告需要注意。');
    }
  } else {
    console.log('🔧 发现一些问题需要修复，请查看上述详细报告。');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}
