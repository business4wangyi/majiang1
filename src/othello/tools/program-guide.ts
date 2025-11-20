// {{ AURA-X: Add - 可运行程序指南和清单. Approval: 寸止(ID:生成运行指令清单). }}

/**
 * Othello项目可运行程序指南
 * 
 * 本文件提供项目中所有可运行程序的详细信息：
 * - 程序功能描述
 * - 运行命令
 * - 参数说明
 * - 依赖关系
 */

export interface ProgramInfo {
  name: string;
  file: string;
  description: string;
  command: string;
  parameters?: string[];
  dependencies: string[];
  category: 'core' | 'training' | 'demo' | 'utility' | 'api';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

/**
 * 所有可运行程序的完整清单
 */
export const RUNNABLE_PROGRAMS: ProgramInfo[] = [
  // 核心游戏程序
  {
    name: 'Othello CLI 主程序',
    file: 'src/othello/othello-cli.ts',
    description: '完整的Othello命令行界面，支持人机对战、AI对战、策略分析等功能',
    command: 'npm run othello:cli',
    dependencies: ['所有策略文件', 'othello-game.ts', 'othello-types.ts'],
    category: 'core',
    difficulty: 'beginner',
    estimatedTime: '持续交互'
  },
  
  {
    name: 'Othello API 服务器',
    file: 'src/othello/othello-api-server.ts',
    description: 'RESTful API服务器，提供HTTP接口进行游戏操作和AI对战',
    command: 'npm run othello:api-server',
    parameters: ['端口号(默认3000)'],
    dependencies: ['所有策略文件', 'express', 'cors'],
    category: 'api',
    difficulty: 'intermediate',
    estimatedTime: '持续运行'
  },

  {
    name: 'Othello 基础演示',
    file: 'src/othello/othello-demo.ts',
    description: '基础游戏演示，展示不同AI策略的对战效果',
    command: 'npm run othello:demo',
    dependencies: ['所有策略文件', 'othello-game.ts'],
    category: 'demo',
    difficulty: 'beginner',
    estimatedTime: '2-5分钟'
  },

  // AlphaZero 相关程序
  {
    name: 'AlphaZero 模型训练',
    file: 'src/othello/strategy/alphazero-trainer.ts',
    description: '完整的AlphaZero模型训练，包括自我对弈、神经网络训练和模型评估',
    command: 'npm run othello:alphazero-train',
    parameters: ['配置文件路径(可选)', '训练轮数(可选)'],
    dependencies: ['@tensorflow/tfjs', 'alphazero-network.ts', 'alphazero-mcts.ts'],
    category: 'training',
    difficulty: 'advanced',
    estimatedTime: '数小时到数天'
  },

  {
    name: 'AlphaZero 智能训练管理器',
    file: 'src/othello/strategy/alphazero-training-manager.ts',
    description: '高级训练管理，支持自适应参数调整、早停、检查点恢复',
    command: 'npm run othello:alphazero-smart-train',
    parameters: ['配置预设名称', '最大训练时间'],
    dependencies: ['alphazero-trainer.ts', 'alphazero-benchmark.ts'],
    category: 'training',
    difficulty: 'advanced',
    estimatedTime: '自动控制'
  },

  {
    name: 'AlphaZero 超参数优化',
    file: 'src/othello/strategy/alphazero-hyperopt.ts',
    description: '基于贝叶斯优化的自动超参数调优系统',
    command: 'npm run othello:alphazero-hyperopt',
    parameters: ['优化模式(quick/standard)', '最大评估次数'],
    dependencies: ['alphazero-trainer.ts', 'alphazero-benchmark.ts'],
    category: 'training',
    difficulty: 'advanced',
    estimatedTime: '1-8小时'
  },

  {
    name: 'AlphaZero 性能基准测试',
    file: 'src/othello/strategy/alphazero-benchmark.ts',
    description: '全面的AlphaZero性能评估，包括搜索性能、对战能力、资源使用',
    command: 'npm run othello:alphazero-benchmark',
    parameters: ['模型路径', '测试配置'],
    dependencies: ['alphazero-agent.ts', '所有对手策略'],
    category: 'utility',
    difficulty: 'intermediate',
    estimatedTime: '10-30分钟'
  },

  {
    name: 'AlphaZero 配置指南',
    file: 'src/othello/alphazero-config-guide.ts',
    description: '智能配置推荐系统，根据场景和约束推荐最优配置',
    command: 'npm run othello:alphazero-config',
    dependencies: ['alphazero-configs.ts'],
    category: 'utility',
    difficulty: 'beginner',
    estimatedTime: '5-10分钟'
  },

  // DQN 相关程序
  {
    name: 'DQN 模型训练',
    file: 'src/othello/strategy/dqn-trainer.ts',
    description: 'Deep Q-Network训练，强化学习方法训练Othello AI',
    command: 'npm run othello:dqn-train',
    parameters: ['训练轮数', '学习率', 'epsilon值'],
    dependencies: ['@tensorflow/tfjs', 'dqn-network.ts', 'experience-replay.ts'],
    category: 'training',
    difficulty: 'advanced',
    estimatedTime: '1-4小时'
  },

  // A3C 相关程序
  {
    name: 'A3C 模型训练',
    file: 'src/othello/strategy/a3c-trainer.ts',
    description: 'Asynchronous Advantage Actor-Critic训练，异步强化学习',
    command: 'npm run othello:a3c-train',
    parameters: ['工作线程数', '训练轮数'],
    dependencies: ['@tensorflow/tfjs', 'a3c-network.ts'],
    category: 'training',
    difficulty: 'advanced',
    estimatedTime: '2-6小时'
  }
];

/**
 * 根据类别获取程序列表
 */
export function getProgramsByCategory(category: ProgramInfo['category']): ProgramInfo[] {
  return RUNNABLE_PROGRAMS.filter(program => program.category === category);
}

/**
 * 根据难度获取程序列表
 */
export function getProgramsByDifficulty(difficulty: ProgramInfo['difficulty']): ProgramInfo[] {
  return RUNNABLE_PROGRAMS.filter(program => program.difficulty === difficulty);
}

/**
 * 打印程序清单
 */
export function printProgramGuide(): void {
  console.log('🎮 Othello项目可运行程序指南');
  console.log('='.repeat(60));
  
  const categories = ['core', 'demo', 'api', 'training', 'utility'] as const;
  
  categories.forEach(category => {
    const programs = getProgramsByCategory(category);
    if (programs.length === 0) return;
    
    console.log(`\n📂 ${getCategoryName(category)}`);
    console.log('-'.repeat(40));
    
    programs.forEach(program => {
      console.log(`\n🔹 ${program.name}`);
      console.log(`   📄 文件: ${program.file}`);
      console.log(`   📝 描述: ${program.description}`);
      console.log(`   ⚡ 命令: ${program.command}`);
      console.log(`   🎯 难度: ${getDifficultyIcon(program.difficulty)} ${program.difficulty}`);
      console.log(`   ⏱️  时间: ${program.estimatedTime}`);
      
      if (program.parameters && program.parameters.length > 0) {
        console.log(`   📋 参数: ${program.parameters.join(', ')}`);
      }
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 使用建议：');
  console.log('   • 初学者建议从 core 和 demo 类别开始');
  console.log('   • training 类别程序需要较长时间和计算资源');
  console.log('   • 运行前请确保已安装所有依赖：npm install');
  console.log('   • 详细使用说明请查看各文件顶部注释');
}

function getCategoryName(category: ProgramInfo['category']): string {
  const names = {
    core: '核心功能',
    demo: '演示程序',
    api: 'API服务',
    training: '模型训练',
    utility: '实用工具'
  };
  return names[category];
}

function getDifficultyIcon(difficulty: ProgramInfo['difficulty']): string {
  const icons = {
    beginner: '🟢',
    intermediate: '🟡',
    advanced: '🔴'
  };
  return icons[difficulty];
}

// 如果直接运行此文件，显示程序指南
if (require.main === module) {
  printProgramGuide();
}
