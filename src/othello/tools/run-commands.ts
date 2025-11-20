#!/usr/bin/env npx ts-node
// {{ AURA-X: Add - 运行命令展示脚本. Approval: 寸止(ID:生成运行指令清单). }}

/**
 * Othello项目运行命令展示脚本
 * 
 * 显示所有可用的npm scripts和运行命令
 * 提供交互式选择和执行功能
 */

import * as readline from 'readline';
import { spawn } from 'child_process';

interface CommandInfo {
  script: string;
  description: string;
  category: string;
  difficulty: '🟢 简单' | '🟡 中等' | '🔴 困难';
  time: string;
  example?: string;
}

const COMMANDS: CommandInfo[] = [
  // 核心功能
  {
    script: 'othello:cli',
    description: 'Othello命令行界面 - 完整的游戏体验',
    category: '🎮 核心功能',
    difficulty: '🟢 简单',
    time: '持续交互',
    example: 'npm run othello:cli'
  },
  {
    script: 'othello:api-server',
    description: 'API服务器 - 提供HTTP接口',
    category: '🎮 核心功能',
    difficulty: '🟡 中等',
    time: '持续运行',
    example: 'npm run othello:api-server'
  },
  {
    script: 'othello:demo',
    description: '基础演示 - 观看AI对战',
    category: '🎮 核心功能',
    difficulty: '🟢 简单',
    time: '2-5分钟',
    example: 'npm run othello:demo'
  },

  // 工具和指南
  {
    script: 'othello:program-guide',
    description: '程序指南 - 查看所有可运行程序',
    category: '📚 工具指南',
    difficulty: '🟢 简单',
    time: '1分钟',
    example: 'npm run othello:program-guide'
  },
  {
    script: 'othello:alphazero-config',
    description: 'AlphaZero配置指南 - 智能配置推荐',
    category: '📚 工具指南',
    difficulty: '🟢 简单',
    time: '5-10分钟',
    example: 'npm run othello:alphazero-config'
  },
  {
    script: 'othello:strategies-test',
    description: '策略对比测试 - 比较不同AI策略',
    category: '📚 工具指南',
    difficulty: '🟡 中等',
    time: '5-15分钟',
    example: 'npm run othello:strategies-test'
  },

  // AlphaZero 功能
  {
    script: 'othello:alphazero-battle',
    description: 'AlphaZero人机对战 - 与训练好的AI对战',
    category: '🤖 AlphaZero',
    difficulty: '🟡 中等',
    time: '10-30分钟',
    example: 'npm run othello:alphazero-battle'
  },
  {
    script: 'othello:alphazero-ai-battle',
    description: 'AlphaZero AI对战 - 观看AI vs AI',
    category: '🤖 AlphaZero',
    difficulty: '🟡 中等',
    time: '5-15分钟',
    example: 'npm run othello:alphazero-ai-battle'
  },
  {
    script: 'othello:alphazero-benchmark',
    description: 'AlphaZero性能测试 - 全面性能评估',
    category: '🤖 AlphaZero',
    difficulty: '🟡 中等',
    time: '10-30分钟',
    example: 'npm run othello:alphazero-benchmark'
  },

  // 训练功能
  {
    script: 'othello:alphazero-train',
    description: 'AlphaZero模型训练 - 完整训练流程',
    category: '🎓 模型训练',
    difficulty: '🔴 困难',
    time: '数小时到数天',
    example: 'npm run othello:alphazero-train'
  },
  {
    script: 'othello:alphazero-smart-train',
    description: 'AlphaZero智能训练 - 自适应训练管理',
    category: '🎓 模型训练',
    difficulty: '🔴 困难',
    time: '自动控制',
    example: 'npm run othello:alphazero-smart-train'
  },
  {
    script: 'othello:alphazero-hyperopt',
    description: 'AlphaZero超参数优化 - 自动调参',
    category: '🎓 模型训练',
    difficulty: '🔴 困难',
    time: '1-8小时',
    example: 'npm run othello:alphazero-hyperopt'
  },
  {
    script: 'othello:dqn-train',
    description: 'DQN模型训练 - Deep Q-Network训练',
    category: '🎓 模型训练',
    difficulty: '🔴 困难',
    time: '1-4小时',
    example: 'npm run othello:dqn-train'
  },
  {
    script: 'othello:a3c-train',
    description: 'A3C模型训练 - 异步强化学习训练',
    category: '🎓 模型训练',
    difficulty: '🔴 困难',
    time: '2-6小时',
    example: 'npm run othello:a3c-train'
  }
];

function printHeader(): void {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        🎮 Othello项目运行命令指南                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printCommands(): void {
  const categories = [...new Set(COMMANDS.map(cmd => cmd.category))];
  
  categories.forEach(category => {
    console.log(`\n${category}`);
    console.log('─'.repeat(80));
    
    const categoryCommands = COMMANDS.filter(cmd => cmd.category === category);
    categoryCommands.forEach((cmd, index) => {
      console.log(`\n${index + 1}. ${cmd.difficulty} ${cmd.script}`);
      console.log(`   📝 ${cmd.description}`);
      console.log(`   ⏱️  预计时间: ${cmd.time}`);
      console.log(`   💻 运行命令: ${cmd.example}`);
    });
  });
}

function printFooter(): void {
  console.log('\n' + '═'.repeat(80));
  console.log('💡 使用建议:');
  console.log('   • 🟢 简单: 适合初学者，快速上手');
  console.log('   • 🟡 中等: 需要一定了解，功能较复杂');
  console.log('   • 🔴 困难: 需要深入理解，消耗大量资源');
  console.log('');
  console.log('🚀 快速开始:');
  console.log('   1. 查看程序指南: npm run othello:program-guide');
  console.log('   2. 体验游戏: npm run othello:cli');
  console.log('   3. 观看演示: npm run othello:demo');
  console.log('');
  console.log('⚠️  注意事项:');
  console.log('   • 训练类程序需要大量计算资源和时间');
  console.log('   • 确保已安装所有依赖: npm install');
  console.log('   • 某些功能需要预训练模型文件');
  console.log('');
}

async function interactiveMode(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  console.log('🎯 交互模式启动！');
  console.log('输入命令编号直接运行，或输入 "list" 查看所有命令，"quit" 退出');
  
  while (true) {
    const input = await question('\n请选择操作: ');
    const cmd = input.toLowerCase().trim();
    
    if (cmd === 'quit' || cmd === 'exit') {
      console.log('👋 再见！');
      break;
    } else if (cmd === 'list') {
      printCommands();
    } else if (cmd === 'help') {
      printFooter();
    } else {
      const cmdIndex = parseInt(cmd) - 1;
      if (cmdIndex >= 0 && cmdIndex < COMMANDS.length) {
        const selectedCmd = COMMANDS[cmdIndex];
        console.log(`\n🚀 运行: ${selectedCmd.script}`);
        console.log(`📝 ${selectedCmd.description}`);
        
        const confirm = await question('确认运行？(y/N): ');
        if (confirm.toLowerCase() === 'y') {
          console.log(`\n执行命令: npm run ${selectedCmd.script}`);
          
          const child = spawn('npm', ['run', selectedCmd.script], {
            stdio: 'inherit',
            shell: true
          });
          
          child.on('close', (code) => {
            console.log(`\n程序结束，退出码: ${code}`);
          });
          
          // 等待子进程结束
          await new Promise((resolve) => {
            child.on('close', resolve);
          });
        }
      } else {
        console.log('❌ 无效选择，请输入有效的命令编号');
      }
    }
  }
  
  rl.close();
}

async function main(): Promise<void> {
  printHeader();
  printCommands();
  printFooter();
  
  const args = process.argv.slice(2);
  if (args.includes('--interactive') || args.includes('-i')) {
    await interactiveMode();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
