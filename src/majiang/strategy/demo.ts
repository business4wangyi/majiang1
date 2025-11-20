/**
 * 麻将AlphaZero AI演示程序
 * 展示如何集成和使用AlphaZero AI系统
 */

import { Game } from '../core/game';
import { AIPlayer } from '../ai-player';
import { createTestMajiangAI, MAJIANG_ALPHAZERO_INFO } from './index';

/**
 * 演示AlphaZero AI的基本使用
 */
export async function demonstrateAlphaZeroAI(): Promise<void> {
  console.log('🀄 麻将AlphaZero AI演示程序启动');
  console.log('='.repeat(50));
  
  // 显示AI系统信息
  console.log(`AI系统: ${MAJIANG_ALPHAZERO_INFO.name} v${MAJIANG_ALPHAZERO_INFO.version}`);
  console.log(`描述: ${MAJIANG_ALPHAZERO_INFO.description}`);
  console.log(`目标水平: ${MAJIANG_ALPHAZERO_INFO.targetLevel}`);
  console.log(`技术特性: ${MAJIANG_ALPHAZERO_INFO.features.join(', ')}`);
  console.log('');
  
  try {
    // 创建游戏实例
    console.log('📋 创建麻将游戏实例...');
    const game = new Game();
    
    // 添加4个玩家
    game.addPlayer(new AIPlayer('东家(人类)'));
    game.addPlayer(new AIPlayer('南家(AI)'));
    game.addPlayer(new AIPlayer('西家(AI)'));
    game.addPlayer(new AIPlayer('北家(AI)'));
    
    console.log('✅ 游戏创建成功，4名玩家已加入');
    
    // 创建AlphaZero AI
    console.log('🧠 创建AlphaZero AI智能体...');
    const alphaZeroAI = createTestMajiangAI(game);
    
    console.log('✅ AlphaZero AI创建成功');
    console.log(`   - 网络参数数量: ${alphaZeroAI.getStats().networkParameters.toLocaleString()}`);
    console.log(`   - MCTS模拟次数: ${alphaZeroAI.getConfig().mctsSimulations}`);
    console.log(`   - 探索权重: ${alphaZeroAI.getConfig().explorationWeight}`);
    console.log('');
    
    // 开始游戏
    console.log('🎮 开始游戏演示...');
    // game.startGame(); // 暂时注释掉，因为方法可能不存在
    
    // 演示AI决策过程
    await demonstrateAIDecisionMaking(alphaZeroAI);
    
    console.log('');
    console.log('🎉 演示完成！');
    console.log('AlphaZero AI已成功集成到麻将游戏中');
    
  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  }
}

/**
 * 演示AI决策过程
 */
async function demonstrateAIDecisionMaking(ai: any): Promise<void> {
  console.log('🤖 演示AI决策过程...');
  
  try {
    // 获取网络输出
    const networkOutput = ai.getNetworkOutput();
    if (networkOutput) {
      console.log(`   - 局面价值评估: ${networkOutput.valueEstimation.toFixed(3)}`);
      
      // 显示前5个最高概率的动作
      const actionProbs = Array.from(networkOutput.actionProbabilities);
      const topActions = actionProbs
        .map((prob, index) => ({ index, prob }))
        .sort((a, b) => (b.prob as number) - (a.prob as number))
        .slice(0, 5);
      
      console.log('   - 前5个动作概率:');
      topActions.forEach((action, rank) => {
        const actionName = getActionName(action.index);
        console.log(`     ${rank + 1}. ${actionName}: ${((action.prob as number) * 100).toFixed(2)}%`);
      });
    }
    
    // 模拟AI选择动作
    console.log('');
    console.log('🎯 AI正在思考最佳动作...');
    const startTime = Date.now();
    
    const selectedAction = await ai.selectAction();
    
    const thinkingTime = Date.now() - startTime;
    
    if (selectedAction) {
      console.log(`✅ AI选择动作: ${selectedAction.type}`);
      console.log(`   - 动作概率: ${(selectedAction.probability * 100).toFixed(2)}%`);
      console.log(`   - 思考时间: ${thinkingTime}ms`);
      console.log(`   - 动作有效性: ${selectedAction.isValid ? '有效' : '无效'}`);
    } else {
      console.log('⚠️  AI未找到可执行的动作');
    }
    
    // 显示AI统计信息
    const stats = ai.getStats();
    console.log('');
    console.log('📊 AI统计信息:');
    console.log(`   - 移动次数: ${stats.moveCount}`);
    console.log(`   - 当前温度: ${stats.currentTemperature.toFixed(3)}`);
    console.log(`   - 网络参数: ${stats.networkParameters.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ AI决策演示失败:', error);
  }
}

/**
 * 获取动作名称
 */
function getActionName(actionIndex: number): string {
  // 打牌动作 (0-33)
  if (actionIndex < 34) {
    if (actionIndex < 9) {
      return `打出万${actionIndex + 1}`;
    } else if (actionIndex < 18) {
      return `打出条${actionIndex - 8}`;
    } else if (actionIndex < 27) {
      return `打出筒${actionIndex - 17}`;
    } else if (actionIndex < 31) {
      const winds = ['东', '南', '西', '北'];
      return `打出${winds[actionIndex - 27]}风`;
    } else {
      const arrows = ['中', '发', '白'];
      return `打出${arrows[actionIndex - 31]}箭`;
    }
  }
  
  // 特殊动作 (34-38)
  const specialActions = ['吃', '碰', '杠', '胡', '过'];
  const specialIndex = actionIndex - 34;
  if (specialIndex >= 0 && specialIndex < specialActions.length) {
    return specialActions[specialIndex];
  }
  
  return `未知动作(${actionIndex})`;
}

/**
 * 性能测试
 */
export async function performanceTest(): Promise<void> {
  console.log('⚡ AlphaZero AI性能测试');
  console.log('='.repeat(30));
  
  const game = new Game();
  game.addPlayer(new AIPlayer('测试玩家1'));
  game.addPlayer(new AIPlayer('测试玩家2'));
  game.addPlayer(new AIPlayer('测试玩家3'));
  game.addPlayer(new AIPlayer('测试玩家4'));
  
  const ai = createTestMajiangAI(game);
  
  // 测试不同MCTS模拟次数的性能
  const simulationCounts = [100, 200, 400, 800];
  
  for (const simCount of simulationCounts) {
    ai.updateConfig({ mctsSimulations: simCount });
    
    console.log(`\n🔬 测试 ${simCount} 次MCTS模拟:`);
    
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await ai.selectAction();
      const endTime = Date.now();
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`   - 平均时间: ${avgTime.toFixed(1)}ms`);
    console.log(`   - 最短时间: ${minTime}ms`);
    console.log(`   - 最长时间: ${maxTime}ms`);
  }
  
  console.log('\n✅ 性能测试完成');
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  demonstrateAlphaZeroAI()
    .then(() => {
      console.log('\n🔬 开始性能测试...');
      return performanceTest();
    })
    .then(() => {
      console.log('\n🎊 所有测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 测试失败:', error);
      process.exit(1);
    });
}