#!/usr/bin/env npx ts-node
// {{ AURA-X: Add - AlphaZero MCP训练启动脚本. Approval: 寸止(ID:MCP训练启动). }}

/**
 * AlphaZero MCP训练启动脚本
 * 
 * 使用Desktop Commander MCP工具进行AlphaZero训练
 * 提供标准化的MCP输出格式和实时监控
 */

import { AlphaZeroMCPTrainer, MCPTrainingConfig } from './alphazero-mcp-trainer';
import { DEFAULT_ALPHAZERO_CONFIG } from './alphazero-network';
import { DEFAULT_MCTS_CONFIG } from './alphazero-mcts';
import {
  MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG
} from './alphazero-configs-advanced';

/**
 * 预定义的MCP训练配置
 */
const MCP_TRAINING_CONFIGS = {
  // 快速测试配置
  quick: {
    agentConfig: {
      networkConfig: DEFAULT_ALPHAZERO_CONFIG,
      mctsConfig: DEFAULT_MCTS_CONFIG,
      name: 'AlphaZero-Quick',
      isTraining: true,
      trainingTemperature: 1.0,
      inferenceTemperature: 0.1,
      verbose: false,
      useAdvancedNetwork: false
    },
    trainingConfig: {
      totalIterations: 5,
      selfPlayGames: 10,
      trainingEpochs: 5,
      experienceBufferSize: 1000,
      evaluationFrequency: 2,
      evaluationGames: 10,
      saveFrequency: 2,
      modelSavePath: 'src/othello/models/alphazero-quick',
      maxGameSteps: 100,
      verbose: true
    },
    outputFormat: 'structured' as const,
    enableRealTimeMonitoring: true,
    monitoringInterval: 3000,
    saveProgressFrequency: 1,
    memoryOptimizationLevel: 'optimized' as const,
    enableMemoryMonitoring: true,
    memoryThresholdMB: 1000,
    outputDir: 'src/othello/training-output/quick-test',
    progressFile: 'progress.json',
    logFile: 'training.log',
    checkpointDir: 'checkpoints'
  },
  
  // 标准训练配置
  standard: {
    agentConfig: {
      ...MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
      networkConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
      mctsConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
    },
    trainingConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig,
    outputFormat: 'structured' as const,
    enableRealTimeMonitoring: true,
    monitoringInterval: 5000,
    saveProgressFrequency: 1,
    memoryOptimizationLevel: 'optimized' as const,
    enableMemoryMonitoring: true,
    memoryThresholdMB: 1500,
    outputDir: 'src/othello/training-output/standard',
    progressFile: 'progress.json',
    logFile: 'training.log',
    checkpointDir: 'checkpoints'
  },
  
  // 超极限内存优化配置
  ultra: {
    agentConfig: {
      ...ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
      networkConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
      mctsConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
    },
    trainingConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig,
    outputFormat: 'structured' as const,
    enableRealTimeMonitoring: true,
    monitoringInterval: 5000,
    saveProgressFrequency: 1,
    memoryOptimizationLevel: 'ultra' as const,
    enableMemoryMonitoring: true,
    memoryThresholdMB: 1200,
    outputDir: 'src/othello/training-output/ultra',
    progressFile: 'progress.json',
    logFile: 'training.log',
    checkpointDir: 'checkpoints'
  },

  // 超极限内存优化配置
  hyper: {
    agentConfig: {
      ...HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
      networkConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
      mctsConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
    },
    trainingConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig,
    outputFormat: 'structured' as const,
    enableRealTimeMonitoring: true,
    monitoringInterval: 5000,
    saveProgressFrequency: 1,
    memoryOptimizationLevel: 'hyper' as const,
    enableMemoryMonitoring: true,
    memoryThresholdMB: 1000,
    outputDir: 'src/othello/training-output/hyper',
    progressFile: 'progress.json',
    logFile: 'training.log',
    checkpointDir: 'checkpoints'
  }
};

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log('🤖 AlphaZero MCP训练工具');
  console.log('========================');
  console.log('');
  console.log('用法: npm run alphazero-mcp [配置名称] [选项]');
  console.log('');
  console.log('可用配置:');
  console.log('  quick    - 快速测试配置 (5轮训练)');
  console.log('  standard - 标准训练配置 (内存优化)');
  console.log('  ultra    - 超极限内存优化配置');
  console.log('  hyper    - 超极限内存优化配置');
  console.log('');
  console.log('选项:');
  console.log('  --json     - 输出JSON格式');
  console.log('  --verbose  - 详细输出模式');
  console.log('  --help     - 显示此帮助信息');
  console.log('');
  console.log('示例:');
  console.log('  npm run alphazero-mcp quick');
  console.log('  npm run alphazero-mcp standard --verbose');
  console.log('  npm run alphazero-mcp ultra --json');
}

/**
 * 解析命令行参数
 */
function parseArgs(): { configName: string; options: any } {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const configName = args.find(arg => !arg.startsWith('--')) || 'quick';
  const options = {
    json: args.includes('--json'),
    verbose: args.includes('--verbose')
  };
  
  return { configName, options };
}

/**
 * 创建训练配置
 */
function createTrainingConfig(configName: string, options: any): MCPTrainingConfig {
  const baseConfig = MCP_TRAINING_CONFIGS[configName as keyof typeof MCP_TRAINING_CONFIGS];

  if (!baseConfig) {
    console.error(`❌ 未知配置: ${configName}`);
    console.log('可用配置:', Object.keys(MCP_TRAINING_CONFIGS).join(', '));
    process.exit(1);
  }

  // 根据选项调整配置
  const config: MCPTrainingConfig = { ...baseConfig };

  if (options.json) {
    config.outputFormat = 'json';
  } else if (options.verbose) {
    config.outputFormat = 'verbose';
  }

  return config;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🚀 启动AlphaZero MCP训练...');

  // 解析参数
  const { configName, options } = parseArgs();

  try {
    // 创建配置
    const config = createTrainingConfig(configName, options);

    console.log(`📋 使用配置: ${configName}`);
    console.log(`📊 输出格式: ${config.outputFormat}`);
    console.log(`🧠 内存优化级别: ${config.memoryOptimizationLevel}`);
    console.log(`📁 输出目录: ${config.outputDir}`);
    console.log('');

    // 创建训练器
    const trainer = new AlphaZeroMCPTrainer(config);

    // 设置信号处理
    process.on('SIGINT', () => {
      console.log('\n⏸️  收到中断信号，正在停止训练...');
      trainer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n⏹️  收到终止信号，正在停止训练...');
      trainer.stop();
      process.exit(0);
    });

    // 开始训练
    await trainer.startTraining();

    console.log('✅ 训练完成！');

    // 输出最终状态
    const finalState = trainer.getState();
    if (config.outputFormat === 'json') {
      console.log(JSON.stringify(finalState, null, 2));
    } else {
      console.log('\n📊 最终训练结果:');
      console.log(`   完成迭代: ${finalState.currentIteration}/${finalState.totalIterations}`);
      console.log(`   自我对弈胜率: ${(finalState.metrics.selfPlayWinRate * 100).toFixed(1)}%`);
      console.log(`   vs随机策略: ${finalState.metrics.evaluationResults.vsRandom.toFixed(1)}%`);
      console.log(`   vs贪心策略: ${finalState.metrics.evaluationResults.vsGreedy.toFixed(1)}%`);
      console.log(`   vs启发式策略: ${finalState.metrics.evaluationResults.vsHeuristic.toFixed(1)}%`);
      console.log(`   总训练时间: ${((Date.now() - finalState.startTime) / 1000 / 60).toFixed(1)}分钟`);
      console.log(`   错误数量: ${finalState.errors.length}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ 训练失败:', errorMessage);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

// 导出配置供其他模块使用
export { MCP_TRAINING_CONFIGS, main as runAlphaZeroMCP };
