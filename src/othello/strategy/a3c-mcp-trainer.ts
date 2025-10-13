#!/usr/bin/env npx ts-node
// {{ AURA-X: Add - A3C MCP训练器，集成Desktop Commander工具. Approval: 寸止(ID:A3C-MCP集成). }}

/**
 * A3C MCP训练器
 * 
 * 使用Desktop Commander MCP工具进行A3C训练：
 * - 标准化MCP输出格式
 * - 实时训练监控和进度跟踪
 * - 统一的训练流程管理
 * - 可视化训练状态展示
 */

import * as fs from 'fs';
import * as path from 'path';
import { A3CTrainer, A3CTrainingConfig, OPTIMIZED_A3C_TRAINING_CONFIG } from './a3c-trainer';
import { A3CAgentConfig, DEFAULT_A3C_AGENT_CONFIG } from './a3c-agent';

/**
 * MCP训练配置
 */
interface A3CMCPConfig {
  totalEpisodes: number;
  evaluationFrequency: number;
  evaluationGames: number;
  saveFrequency: number;
  progressFrequency: number;
  outputDir: string;
  enableMemoryOptimization: boolean;
  memoryThresholdMB: number;
  outputFormat: 'console' | 'structured' | 'minimal';
  enableRealTimeMonitoring: boolean;
}

/**
 * 默认MCP配置
 */
const DEFAULT_A3C_MCP_CONFIG: A3CMCPConfig = {
  totalEpisodes: 500,
  evaluationFrequency: 100,
  evaluationGames: 10,
  saveFrequency: 100,
  progressFrequency: 50,
  outputDir: 'src/othello/training-output/a3c-mcp',
  enableMemoryOptimization: true,
  memoryThresholdMB: 512,
  outputFormat: 'structured',
  enableRealTimeMonitoring: true
};

/**
 * A3C MCP训练器类
 */
class A3CMCPTrainer {
  private config: A3CMCPConfig;
  private trainer: A3CTrainer | null = null;
  private startTime: number = 0;
  private currentEpisode: number = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<A3CMCPConfig> = {}) {
    this.config = { ...DEFAULT_A3C_MCP_CONFIG, ...config };
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
   * 输出MCP状态
   */
  private outputMCPStatus(episode: number, message: string, data: any = {}): void {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    const progress = (episode / this.config.totalEpisodes * 100).toFixed(1);
    const memoryUsage = process.memoryUsage();
    const rssGB = memoryUsage.rss / 1024 / 1024 / 1024;

    console.log(`\n🤖 A3C MCP训练状态`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 进度: ${episode}/${this.config.totalEpisodes} (${progress}%)`);
    console.log(`⏱️  已用时间: ${elapsed.toFixed(1)}分钟`);
    console.log(`🧠 内存使用: ${(memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`);
    console.log(`🎯 当前状态: ${message}`);
    console.log(`⚙️  内存优化: ${this.config.enableMemoryOptimization ? '启用' : '禁用'}`);
    console.log(`🎮 评估频率: 每${this.config.evaluationFrequency}轮`);
    console.log(`🔍 进度频率: 每${this.config.progressFrequency}轮`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 内存警告
    if (rssGB > this.config.memoryThresholdMB / 1024) {
      console.log(`⚠️  内存警告: ${rssGB.toFixed(2)}GB > ${this.config.memoryThresholdMB / 1024}GB`);
      
      if (this.config.enableMemoryOptimization && global.gc) {
        global.gc();
        console.log(`🧹 执行垃圾回收`);
      }
    }

    // 结构化输出
    if (this.config.outputFormat === 'structured') {
      const structuredData = {
        timestamp: new Date().toISOString(),
        episode,
        progress: parseFloat(progress),
        elapsedMinutes: elapsed,
        memoryMB: memoryUsage.rss / 1024 / 1024,
        status: message,
        ...data
      };
      console.log(`📄 MCP数据: ${JSON.stringify(structuredData)}`);
    }
  }

  /**
   * 创建优化配置
   */
  private createOptimizedConfig(): { agentConfig: A3CAgentConfig; trainingConfig: A3CTrainingConfig } {
    const agentConfig: A3CAgentConfig = {
      ...DEFAULT_A3C_AGENT_CONFIG,
      name: 'A3C-MCP-Agent'
    };

    const trainingConfig: A3CTrainingConfig = {
      ...OPTIMIZED_A3C_TRAINING_CONFIG,
      totalEpisodes: this.config.totalEpisodes,
      evaluationFrequency: this.config.evaluationFrequency,
      evaluationGames: this.config.evaluationGames,
      saveFrequency: this.config.saveFrequency,
      progressFrequency: this.config.progressFrequency,
      modelSavePath: path.join(this.config.outputDir, 'a3c-mcp-model'),
      outputFormat: this.config.outputFormat,
      enableMCP: true
    };

    return { agentConfig, trainingConfig };
  }

  /**
   * 启动监控
   */
  private startMonitoring(): void {
    if (!this.config.enableRealTimeMonitoring) return;

    this.monitoringInterval = setInterval(() => {
      this.outputMCPStatus(this.currentEpisode, '🚀 训练中', {
        monitoringActive: true
      });
    }, 30000); // 每30秒输出一次状态
  }

  /**
   * 停止监控
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 开始MCP训练
   */
  async startTraining(): Promise<void> {
    console.log('🚀 启动A3C MCP训练...');
    console.log(`📋 配置: ${this.config.totalEpisodes}轮训练`);
    console.log(`📁 输出目录: ${this.config.outputDir}`);
    console.log(`🧠 内存优化: ${this.config.enableMemoryOptimization ? '启用' : '禁用'}`);
    console.log(`📊 输出格式: ${this.config.outputFormat}`);
    console.log('');
    
    this.startTime = Date.now();
    
    try {
      // 创建优化配置
      const { agentConfig, trainingConfig } = this.createOptimizedConfig();
      
      // 创建训练器
      this.trainer = new A3CTrainer(agentConfig, trainingConfig);
      
      // 启动监控
      this.startMonitoring();
      
      // 开始训练
      await this.trainer.startTraining();
      
      console.log('\n✅ A3C MCP训练完成！');
      
    } catch (error) {
      console.error('❌ A3C MCP训练失败:', error);
      throw error;
    } finally {
      this.stopMonitoring();
    }
  }

  /**
   * 停止训练
   */
  stop(): void {
    this.stopMonitoring();
    if (this.trainer) {
      this.trainer.dispose();
    }
  }

  /**
   * 获取训练状态
   */
  getTrainingState(): any {
    const elapsed = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    return {
      currentEpisode: this.currentEpisode,
      totalEpisodes: this.config.totalEpisodes,
      elapsedTime: elapsed,
      memoryUsage,
      outputDir: this.config.outputDir
    };
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
  }
}

/**
 * 创建训练配置
 */
function createTrainingConfig(configName: string, options: any = {}): A3CMCPConfig {
  const baseConfigs = {
    quick: {
      totalEpisodes: 100,
      evaluationFrequency: 25,
      evaluationGames: 5,
      saveFrequency: 25,
      progressFrequency: 10,
      outputFormat: 'minimal' as const
    },
    standard: {
      totalEpisodes: 500,
      evaluationFrequency: 100,
      evaluationGames: 10,
      saveFrequency: 100,
      progressFrequency: 50,
      outputFormat: 'structured' as const
    },
    full: {
      totalEpisodes: 1000,
      evaluationFrequency: 200,
      evaluationGames: 20,
      saveFrequency: 200,
      progressFrequency: 100,
      outputFormat: 'console' as const
    }
  };

  const selectedConfig = baseConfigs[configName as keyof typeof baseConfigs] || baseConfigs.standard;
  
  return {
    ...DEFAULT_A3C_MCP_CONFIG,
    ...selectedConfig,
    outputDir: `src/othello/training-output/a3c-mcp-${configName}`,
    ...options
  };
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const configName = process.argv[2] || 'standard';
  const options = {};

  try {
    // 创建配置
    const config = createTrainingConfig(configName, options);

    console.log(`📋 使用配置: ${configName}`);
    console.log(`📊 输出格式: ${config.outputFormat}`);
    console.log(`🧠 内存优化: ${config.enableMemoryOptimization ? '启用' : '禁用'}`);
    console.log(`📁 输出目录: ${config.outputDir}`);
    console.log('');

    // 创建训练器
    const trainer = new A3CMCPTrainer(config);

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

    console.log('✅ A3C MCP训练完成！');

  } catch (error) {
    console.error('❌ A3C MCP训练失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export { A3CMCPTrainer, createTrainingConfig };
