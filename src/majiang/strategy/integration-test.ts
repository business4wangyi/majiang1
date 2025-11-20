/**
 * 麻将AlphaZero AI集成测试
 * 验证AI系统的基本功能和集成
 */

import { Game } from '../core/game';
import { AIPlayer } from '../ai-player';
import { createTestMajiangAI } from './index';

/**
 * 基础功能测试
 */
async function testBasicFunctionality(): Promise<boolean> {
  console.log('🧪 开始基础功能测试...');
  
  try {
    // 1. 创建游戏和AI
    const game = new Game();
    game.addPlayer(new AIPlayer('测试玩家1'));
    game.addPlayer(new AIPlayer('测试玩家2'));
    game.addPlayer(new AIPlayer('测试玩家3'));
    game.addPlayer(new AIPlayer('测试玩家4'));
    
    const ai = createTestMajiangAI(game);
    console.log('✅ AI创建成功');
    
    // 2. 测试网络参数
    const stats = ai.getStats();
    console.log(`✅ 网络参数: ${stats.networkParameters.toLocaleString()}`);
    
    // 3. 测试配置
    const config = ai.getConfig();
    console.log(`✅ MCTS模拟次数: ${config.mctsSimulations}`);
    console.log(`✅ 探索权重: ${config.explorationWeight}`);
    
    // 4. 测试网络输出
    const networkOutput = ai.getNetworkOutput();
    if (networkOutput) {
      console.log(`✅ 网络输出正常，价值评估: ${networkOutput.valueEstimation.toFixed(3)}`);
      console.log(`✅ 动作概率维度: ${networkOutput.actionProbabilities.length}`);
    } else {
      console.log('⚠️  网络输出为空（可能是游戏状态问题）');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 基础功能测试失败:', error);
    return false;
  }
}

/**
 * 性能测试
 */
async function testPerformance(): Promise<boolean> {
  console.log('\n⚡ 开始性能测试...');
  
  try {
    const game = new Game();
    game.addPlayer(new AIPlayer('性能测试1'));
    game.addPlayer(new AIPlayer('性能测试2'));
    game.addPlayer(new AIPlayer('性能测试3'));
    game.addPlayer(new AIPlayer('性能测试4'));
    
    const ai = createTestMajiangAI(game);
    
    // 测试不同MCTS模拟次数的性能
    const testCases = [100, 200, 400];
    
    for (const simCount of testCases) {
      ai.updateConfig({ mctsSimulations: simCount });
      
      const startTime = Date.now();
      await ai.selectAction();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`✅ ${simCount}次模拟耗时: ${duration}ms`);
      
      if (duration > 10000) { // 超过10秒
        console.log('⚠️  性能警告：决策时间过长');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
    return false;
  }
}

/**
 * 稳定性测试
 */
async function testStability(): Promise<boolean> {
  console.log('\n🔄 开始稳定性测试...');
  
  try {
    const game = new Game();
    game.addPlayer(new AIPlayer('稳定性测试1'));
    game.addPlayer(new AIPlayer('稳定性测试2'));
    game.addPlayer(new AIPlayer('稳定性测试3'));
    game.addPlayer(new AIPlayer('稳定性测试4'));
    
    const ai = createTestMajiangAI(game);
    ai.updateConfig({ mctsSimulations: 100 }); // 使用较少模拟次数加快测试
    
    // 连续执行多次决策
    let successCount = 0;
    const totalTests = 10;
    
    for (let i = 0; i < totalTests; i++) {
      try {
        const action = await ai.selectAction();
        if (action) {
          successCount++;
          console.log(`✅ 测试 ${i + 1}/${totalTests}: ${action.type}`);
        } else {
          console.log(`⚠️  测试 ${i + 1}/${totalTests}: 无可用动作`);
        }
      } catch (error) {
        console.log(`❌ 测试 ${i + 1}/${totalTests}: 失败 - ${error}`);
      }
    }
    
    const successRate = (successCount / totalTests) * 100;
    console.log(`✅ 稳定性测试完成，成功率: ${successRate.toFixed(1)}%`);
    
    return successRate >= 70; // 70%以上成功率认为通过
  } catch (error) {
    console.error('❌ 稳定性测试失败:', error);
    return false;
  }
}

/**
 * 主测试函数
 */
export async function runIntegrationTests(): Promise<void> {
  console.log('🀄 麻将AlphaZero AI集成测试开始');
  console.log('='.repeat(50));
  
  const results = {
    basic: false,
    performance: false,
    stability: false
  };
  
  // 运行所有测试
  results.basic = await testBasicFunctionality();
  results.performance = await testPerformance();
  results.stability = await testStability();
  
  // 汇总结果
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(30));
  console.log(`基础功能测试: ${results.basic ? '✅ 通过' : '❌ 失败'}`);
  console.log(`性能测试: ${results.performance ? '✅ 通过' : '❌ 失败'}`);
  console.log(`稳定性测试: ${results.stability ? '✅ 通过' : '❌ 失败'}`);
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  const passRate = (passedTests / totalTests) * 100;
  
  console.log(`\n总体通过率: ${passRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (passRate >= 80) {
    console.log('🎉 集成测试通过！AI系统功能正常');
  } else if (passRate >= 60) {
    console.log('⚠️  集成测试部分通过，需要优化');
  } else {
    console.log('❌ 集成测试失败，需要修复问题');
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runIntegrationTests()
    .then(() => {
      console.log('\n🏁 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 测试执行失败:', error);
      process.exit(1);
    });
}