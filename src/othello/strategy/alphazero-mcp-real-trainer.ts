#!/usr/bin/env npx ts-node
// {{ AURA-X: Add - 真实AlphaZero MCP训练器，集成内存优化. Approval: 寸止(ID:真实MCP训练). }}

/**
 * 真实AlphaZero MCP训练器
 * 
 * 集成Desktop Commander MCP工具的真实AlphaZero训练实现：
 * - 使用内存优化的训练配置
 * - 实现MCP标准化输出
 * - 集成实时监控和进度跟踪
 * - 支持训练过程的可视化展示
 */

import * as fs from 'fs';
import * as path from 'path';
import { AlphaZeroTrainer } from './alphazero-trainer';
import { AlphaZeroAgentConfig, DEFAULT_ALPHAZERO_AGENT_CONFIG } from './alphazero-agent';
import { DEFAULT_ALPHAZERO_CONFIG } from './alphazero-network';
import { DEFAULT_MCTS_CONFIG } from './alphazero-mcts';

/**
 * MCP真实训练配置
 */
interface MCPRealTrainingConfig {
  // 基础配置
  totalIterations: number;
  selfPlayGames: number;
  trainingEpochs: number;
  experienceBufferSize: number;
  evaluationFrequency: number;
  saveFrequency: number;
  
  // MCP配置
  outputFormat: 'json' | 'structured' | 'verbose';
  enableRealTimeMonitoring: boolean;
  monitoringInterval: number;
  outputDir: string;
  
  // 内存优化配置
  enableMemoryOptimization: boolean;
  memoryThresholdMB: number;
  batchSize: number;
  mctsSimulations: number;
}

/**
 * 默认MCP真实训练配置
 */
const DEFAULT_MCP_REAL_CONFIG: MCPRealTrainingConfig = {
  totalIterations: 5,
  selfPlayGames: 15,
  trainingEpochs: 8,
  experienceBufferSize: 2000,
  evaluationFrequency: 2,
  saveFrequency: 2,
  
  outputFormat: 'structured',
  enableRealTimeMonitoring: true,
  monitoringInterval: 5000,
  outputDir: 'src/othello/training-output/mcp-real',
  
  enableMemoryOptimization: true,
  memoryThresholdMB: 1500,
  batchSize: 16,
  mctsSimulations: 200
};

/**
 * 真实AlphaZero MCP训练器
 */
class AlphaZeroMCPRealTrainer {
  private config: MCPRealTrainingConfig;
  private trainer: AlphaZeroTrainer | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentIteration: number = 0;
  
  constructor(config: Partial<MCPRealTrainingConfig> = {}) {
    this.config = { ...DEFAULT_MCP_REAL_CONFIG, ...config };
    this.ensureOutputDirectory();
  }
  
  /**
   * 确保输出目录存在
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }
  
  /**
   * 创建优化的训练配置
   */
  private createOptimizedConfig(): { agentConfig: AlphaZeroAgentConfig; trainingConfig: any } {
    const agentConfig: AlphaZeroAgentConfig = {
      networkConfig: {
        ...DEFAULT_ALPHAZERO_CONFIG,
        numFilters: this.config.enableMemoryOptimization ? 64 : 128,
        numResidualBlocks: this.config.enableMemoryOptimization ? 4 : 8,
        l2Regularization: 0.0001
      },
      mctsConfig: {
        ...DEFAULT_MCTS_CONFIG,
        numSimulations: this.config.mctsSimulations,
        cPuct: 1.0,
        dirichletAlpha: 0.3,
        noiseWeight: 0.25,
        temperature: 1.0
      },
      name: 'AlphaZero-MCP-Real',
      isTraining: true,
      trainingTemperature: 1.0,
      inferenceTemperature: 0.1,
      verbose: false,
      useAdvancedNetwork: false
    };
    
    const trainingConfig = {
      totalIterations: this.config.totalIterations,
      selfPlayGames: this.config.selfPlayGames,
      trainingEpochs: this.config.trainingEpochs,
      experienceBufferSize: this.config.experienceBufferSize,
      evaluationFrequency: this.config.evaluationFrequency,
      evaluationGames: 15,
      saveFrequency: this.config.saveFrequency,
      modelSavePath: path.join(this.config.outputDir, 'model'),
      maxGameSteps: 100,
      verbose: true
    };
    
    return { agentConfig, trainingConfig };
  }
  
  /**
   * 输出MCP状态
   */
  private outputMCPStatus(): void {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // 分钟
    const progress = (this.currentIteration / this.config.totalIterations * 100).toFixed(1);
    const memoryUsage = process.memoryUsage();
    
    console.log(`\n🤖 AlphaZero MCP真实训练状态`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 进度: ${this.currentIteration}/${this.config.totalIterations} (${progress}%)`);
    console.log(`⏱️  已用时间: ${elapsed.toFixed(1)}分钟`);
    console.log(`🧠 内存使用: ${(memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`);
    console.log(`🎯 当前状态: 🚀 训练中`);
    console.log(`⚙️  内存优化: ${this.config.enableMemoryOptimization ? '启用' : '禁用'}`);
    console.log(`🎮 自我对弈: ${this.config.selfPlayGames}局/轮`);
    console.log(`🔍 MCTS模拟: ${this.config.mctsSimulations}次`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // 检查内存阈值
    const rssGB = memoryUsage.rss / 1024 / 1024 / 1024;
    if (rssGB > this.config.memoryThresholdMB / 1024) {
      console.log(`⚠️  内存警告: ${rssGB.toFixed(2)}GB > ${this.config.memoryThresholdMB / 1024}GB`);
      
      // 触发垃圾回收
      if (global.gc) {
        global.gc();
        console.log(`🧹 执行垃圾回收`);
      }
    }
  }
  
  /**
   * 启动实时监控
   */
  private startMonitoring(): void {
    if (this.config.enableRealTimeMonitoring) {
      this.monitoringTimer = setInterval(() => {
        this.outputMCPStatus();
      }, this.config.monitoringInterval);
    }
  }
  
  /**
   * 停止监控
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }
  
  /**
   * 保存训练状态
   */
  private saveTrainingState(): void {
    const state = {
      currentIteration: this.currentIteration,
      totalIterations: this.config.totalIterations,
      startTime: this.startTime,
      elapsedTime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
    
    const statePath = path.join(this.config.outputDir, 'training-state.json');
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
  
  /**
   * 开始真实MCP训练
   */
  async startTraining(): Promise<void> {
    console.log('🚀 启动AlphaZero MCP真实训练...');
    console.log(`📋 配置: ${this.config.totalIterations}轮训练`);
    console.log(`📁 输出目录: ${this.config.outputDir}`);
    console.log(`🧠 内存优化: ${this.config.enableMemoryOptimization ? '启用' : '禁用'}`);
    console.log(`📊 输出格式: ${this.config.outputFormat}`);
    console.log('');
    
    this.startTime = Date.now();
    
    try {
      // 创建优化配置
      const { agentConfig, trainingConfig } = this.createOptimizedConfig();
      
      // 创建训练器
      this.trainer = new AlphaZeroTrainer(agentConfig, trainingConfig);
      
      // 启动监控
      this.startMonitoring();
      
      // 开始训练
      await this.trainer.startTraining();
      
      console.log('\n✅ MCP真实训练完成！');
      
    } catch (error) {
      console.error('❌ 训练失败:', error);
      throw error;
    } finally {
      this.stopMonitoring();
      this.saveTrainingState();
      
      if (this.trainer) {
        this.trainer.dispose();
      }
    }
  }
  
  /**
   * 获取训练状态
   */
  getTrainingState(): any {
    return {
      currentIteration: this.currentIteration,
      totalIterations: this.config.totalIterations,
      startTime: this.startTime,
      elapsedTime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      memoryUsage: process.memoryUsage(),
      config: this.config
    };
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const configName = args[0] || 'quick';
  
  // 预定义配置
  const configs = {
    quick: {
      totalIterations: 3,
      selfPlayGames: 10,
      trainingEpochs: 5,
      experienceBufferSize: 1000,
      mctsSimulations: 100
    },
    standard: {
      totalIterations: 5,
      selfPlayGames: 15,
      trainingEpochs: 8,
      experienceBufferSize: 2000,
      mctsSimulations: 200
    },
    full: {
      totalIterations: 10,
      selfPlayGames: 25,
      trainingEpochs: 10,
      experienceBufferSize: 5000,
      mctsSimulations: 300
    }
  };
  
  const config = configs[configName as keyof typeof configs] || configs.quick;
  
  console.log(`📋 使用配置: ${configName}`);
  
  const trainer = new AlphaZeroMCPRealTrainer(config);
  
  // 设置信号处理
  process.on('SIGINT', () => {
    console.log('\n⏸️  收到中断信号，正在停止训练...');
    process.exit(0);
  });
  
  try {
    await trainer.startTraining();
    
    // 输出最终状态
    const finalState = trainer.getTrainingState();
    console.log('\n📊 最终训练状态:');
    console.log(`   总训练时间: ${(finalState.elapsedTime / 1000 / 60).toFixed(1)}分钟`);
    console.log(`   内存使用: ${(finalState.memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`);
    
    // MCP标准化输出
    console.log('\n📄 MCP标准化输出:');
    console.log(JSON.stringify({
      status: 'completed',
      progress: 1.0,
      elapsedTime: finalState.elapsedTime,
      memoryUsage: finalState.memoryUsage,
      config: finalState.config,
      timestamp: new Date().toISOString()
    }, null, 2));
    
  } catch (error) {
    console.error('❌ 训练失败:', error);
    process.exit(1);
  }
}

// 运行训练
if (require.main === module) {
  main().catch(console.error);
}

export { AlphaZeroMCPRealTrainer, main as runMCPRealTraining };
