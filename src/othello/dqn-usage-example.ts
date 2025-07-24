// {{ AURA-X: Add - DQN使用示例，展示如何使用DQN系统. Approval: 寸止(ID:1735819200). }}

/**
 * DQN深度强化学习系统使用示例
 * 
 * 本文件展示了如何使用DQN系统进行黑白棋AI开发，
 * 包括基本使用、训练和高级功能的完整示例。
 */

import { 
  DQNOthelloAgent, 
  DEFAULT_DQN_AGENT_CONFIG, 
  TRAINING_DQN_AGENT_CONFIG,
  DQNTrainer,
  DEFAULT_TRAINING_CONFIG,
  StrategyType,
  createStrategy
} from './strategy/index';
import { createOthelloBoard, makeMove, isGameOver, countPieces } from './othello-game';
import { OthelloPlayer } from './othello-types';

/**
 * 示例1: 基本DQN智能体使用
 */
async function basicDQNUsage() {
  console.log('📖 示例1: 基本DQN智能体使用\n');

  // 创建DQN智能体（推理模式）
  const dqnAgent = new DQNOthelloAgent(DEFAULT_DQN_AGENT_CONFIG);
  
  console.log('🤖 DQN智能体已创建');
  console.log(`   探索率: ${dqnAgent.getStats().epsilon}`);
  console.log(`   训练模式: ${dqnAgent.getStats().isTraining}`);

  // 创建游戏棋盘
  const board = createOthelloBoard();
  const player: OthelloPlayer = 'B';

  // 预热智能体（计算Q值）
  await dqnAgent.warmup(board, player);
  console.log('✅ 智能体预热完成');

  // 获取决策
  const action = dqnAgent.chooseAction(board, player);
  console.log(`🎯 DQN选择: 位置(${action?.row},${action?.col})`);

  // 获取Q值分析
  const qValuesData = await dqnAgent.getLegalActionsQValues(board, player);
  console.log('\n📊 Q值分析:');
  qValuesData.sort((a, b) => b.qValue - a.qValue);
  qValuesData.slice(0, 3).forEach((item, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    console.log(`   ${rank} (${item.action.row},${item.action.col}): ${item.qValue.toFixed(4)}`);
  });

  // 清理资源
  dqnAgent.dispose();
  console.log('\n✅ 示例1完成\n');
}

/**
 * 示例2: DQN vs 传统策略对战
 */
async function dqnVsTraditionalStrategies() {
  console.log('📖 示例2: DQN vs 传统策略对战\n');

  const dqnAgent = new DQNOthelloAgent(DEFAULT_DQN_AGENT_CONFIG);
  
  // 创建传统策略对手
  const opponents = [
    { name: '随机策略', agent: createStrategy(StrategyType.RANDOM) },
    { name: '贪心策略', agent: createStrategy(StrategyType.GREEDY) },
    { name: '启发式策略', agent: createStrategy(StrategyType.HEURISTIC) }
  ];

  for (const opponent of opponents) {
    console.log(`🥊 DQN vs ${opponent.name}`);
    
    // 进行一局快速对战
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let moveCount = 0;

    while (!isGameOver(board) && moveCount < 100) {
      let action;
      
      if (currentPlayer === 'B') {
        // DQN下棋
        await dqnAgent.warmup(board, currentPlayer);
        action = dqnAgent.chooseAction(board, currentPlayer);
      } else {
        // 对手下棋
        action = opponent.agent.chooseAction(board, currentPlayer);
      }

      if (action) {
        board = makeMove(board, action, currentPlayer);
        moveCount++;
      }

      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    }

    const { B, W } = countPieces(board);
    const winner = B > W ? 'DQN' : W > B ? opponent.name : '平局';
    console.log(`   结果: ${winner} (${B}-${W}), ${moveCount}步\n`);
    
    dqnAgent.clearCache();
  }

  dqnAgent.dispose();
  console.log('✅ 示例2完成\n');
}

/**
 * 示例3: DQN训练演示
 */
async function dqnTrainingDemo() {
  console.log('📖 示例3: DQN训练演示\n');

  // 创建简化的训练配置
  const trainingConfig = {
    ...DEFAULT_TRAINING_CONFIG,
    totalEpisodes: 50,        // 只训练50轮（演示用）
    targetUpdateFrequency: 25, // 每25步更新目标网络
    trainFrequency: 2,         // 每2步训练一次
    warmupSteps: 10,           // 10步预热
    evaluationFrequency: 25,   // 每25轮评估
    evaluationGames: 3         // 每次评估3局
  };

  console.log('🎓 创建DQN训练器...');
  const trainer = new DQNTrainer(trainingConfig);

  console.log('📊 训练配置:');
  console.log(`   总轮数: ${trainingConfig.totalEpisodes}`);
  console.log(`   预热步数: ${trainingConfig.warmupSteps}`);
  console.log(`   评估频率: 每${trainingConfig.evaluationFrequency}轮`);

  console.log('\n🚀 开始训练...');
  const startTime = Date.now();
  
  // 注意：这里只是演示，实际训练需要更长时间
  await trainer.startTraining();
  
  const endTime = Date.now();
  const trainingTime = (endTime - startTime) / 1000;

  console.log(`⏱️  训练用时: ${trainingTime.toFixed(1)}秒`);
  
  const stats = trainer.getTrainingStats();
  console.log('📈 训练统计:');
  console.log(`   完成轮数: ${stats.currentEpisode}`);
  console.log(`   总步数: ${stats.totalSteps}`);
  console.log(`   最终探索率: ${stats.epsilon.toFixed(4)}`);
  console.log(`   经验数量: ${stats.experienceBufferSize}`);

  trainer.dispose();
  console.log('\n✅ 示例3完成\n');
}

/**
 * 示例4: 高级功能展示
 */
async function advancedFeatures() {
  console.log('📖 示例4: 高级功能展示\n');

  // 创建训练模式的DQN智能体
  const trainingAgent = new DQNOthelloAgent(TRAINING_DQN_AGENT_CONFIG);
  console.log(`🎯 训练模式智能体: ε=${trainingAgent.getStats().epsilon}`);

  // 模式切换演示
  console.log('\n🔄 模式切换演示:');
  console.log(`   切换前: 训练=${trainingAgent.getStats().isTraining}, ε=${trainingAgent.getStats().epsilon}`);
  
  trainingAgent.setTrainingMode(false, 0.05);
  console.log(`   切换后: 训练=${trainingAgent.getStats().isTraining}, ε=${trainingAgent.getStats().epsilon}`);

  // 智能体克隆演示
  console.log('\n🧬 智能体克隆演示:');
  const clonedAgent = trainingAgent.clone();
  console.log(`   原智能体: ε=${trainingAgent.getStats().epsilon}`);
  console.log(`   克隆智能体: ε=${clonedAgent.getStats().epsilon}`);

  // 探索率更新演示
  console.log('\n📉 探索率衰减演示:');
  const initialEpsilon = trainingAgent.getStats().epsilon;
  for (let i = 0; i < 5; i++) {
    trainingAgent.updateEpsilon();
  }
  const finalEpsilon = trainingAgent.getStats().epsilon;
  console.log(`   衰减前: ${initialEpsilon.toFixed(4)}`);
  console.log(`   衰减后: ${finalEpsilon.toFixed(4)}`);

  // 性能统计演示
  console.log('\n📊 性能统计:');
  const stats = trainingAgent.getStats();
  console.log(`   步数: ${stats.stepCount}`);
  console.log(`   探索率: ${stats.epsilon.toFixed(4)}`);
  console.log(`   模式: ${stats.isTraining ? '训练' : '推理'}`);
  console.log(`   名称: ${stats.name}`);

  // 清理资源
  trainingAgent.dispose();
  clonedAgent.dispose();
  console.log('\n✅ 示例4完成\n');
}

/**
 * 主函数：运行所有示例
 */
async function runAllExamples() {
  console.log('🎉 DQN深度强化学习系统使用示例\n');
  console.log('=' .repeat(60));

  try {
    await basicDQNUsage();
    await dqnVsTraditionalStrategies();
    await dqnTrainingDemo();
    await advancedFeatures();

    console.log('🎊 所有示例运行完成！');
    console.log('\n💡 使用提示:');
    console.log('   ✅ DQN智能体可直接用于游戏对战');
    console.log('   ✅ 支持训练模式和推理模式切换');
    console.log('   ✅ 提供完整的训练系统');
    console.log('   ✅ 兼容所有现有策略接口');
    console.log('\n🚀 开始使用DQN构建您的AI应用吧！');

  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 导出示例函数
export {
  basicDQNUsage,
  dqnVsTraditionalStrategies,
  dqnTrainingDemo,
  advancedFeatures,
  runAllExamples
};

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().then(() => {
    console.log('\n示例脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('\n示例脚本执行失败:', error);
    process.exit(1);
  });
}
