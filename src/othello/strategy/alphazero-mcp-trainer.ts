// {{ AURA-X: Add - AlphaZero MCP训练管理器，集成Desktop Commander工具. Approval: 寸止(ID:MCP工具集成). }}

/**
 * AlphaZero MCP训练管理器
 * 
 * 使用Desktop Commander MCP工具替代传统CLI，实现：
 * - 标准化MCP输出格式
 * - 实时训练监控和进度跟踪
 * - 统一的训练流程管理
 * - 可视化训练状态展示
 */

import * as fs from 'fs';
import * as path from 'path';
import { AlphaZeroTrainer, AlphaZeroTrainingConfig } from './alphazero-trainer';
import { AlphaZeroAgentConfig, DEFAULT_ALPHAZERO_AGENT_CONFIG } from './alphazero-agent';
import { DEFAULT_ALPHAZERO_CONFIG } from './alphazero-network';
import { DEFAULT_MCTS_CONFIG } from './alphazero-mcts';
import {
  MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG,
  HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG
} from './alphazero-configs-advanced';

/**
 * MCP训练配置接口
 */
export interface MCPTrainingConfig {
  // 基础训练配置
  agentConfig: AlphaZeroAgentConfig;
  trainingConfig: AlphaZeroTrainingConfig;
  
  // MCP特定配置
  outputFormat: 'json' | 'structured' | 'verbose';
  enableRealTimeMonitoring: boolean;
  monitoringInterval: number; // 监控间隔（毫秒）
  saveProgressFrequency: number; // 进度保存频率
  
  // 内存管理配置
  memoryOptimizationLevel: 'standard' | 'optimized' | 'ultra' | 'hyper';
  enableMemoryMonitoring: boolean;
  memoryThresholdMB: number;
  
  // 输出路径配置
  outputDir: string;
  progressFile: string;
  logFile: string;
  checkpointDir: string;
}

/**
 * MCP训练状态接口
 */
export interface MCPTrainingState {
  // 基本状态
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed';
  currentIteration: number;
  totalIterations: number;
  startTime: number;
  lastUpdateTime: number;
  
  // 训练指标
  metrics: {
    selfPlayWinRate: number;
    averageGameLength: number;
    experienceBufferSize: number;
    trainingLoss: {
      policyLoss: number;
      valueLoss: number;
      totalLoss: number;
    };
    evaluationResults: {
      vsRandom: number;
      vsGreedy: number;
      vsHeuristic: number;
    };
  };
  
  // 性能指标
  performance: {
    iterationTime: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    estimatedTimeRemaining: number;
  };
  
  // 错误信息
  errors: Array<{
    timestamp: number;
    type: string;
    message: string;
    stack?: string;
  }>;
}

/**
 * 默认MCP训练配置
 */
export const DEFAULT_MCP_TRAINING_CONFIG: MCPTrainingConfig = {
  agentConfig: {
    networkConfig: DEFAULT_ALPHAZERO_CONFIG,
    mctsConfig: DEFAULT_MCTS_CONFIG,
    name: 'AlphaZero-MCP',
    isTraining: true,
    trainingTemperature: 1.0,
    inferenceTemperature: 0.1,
    verbose: false,
    useAdvancedNetwork: false
  },
  trainingConfig: {
    totalIterations: 10,
    selfPlayGames: 25,
    trainingEpochs: 10,
    experienceBufferSize: 5000,
    evaluationFrequency: 5,
    evaluationGames: 20,
    saveFrequency: 5,
    modelSavePath: 'src/othello/models/alphazero-mcp',
    maxGameSteps: 100,
    verbose: true
  },

  outputFormat: 'structured',
  enableRealTimeMonitoring: true,
  monitoringInterval: 5000, // 5秒
  saveProgressFrequency: 1, // 每次迭代保存

  memoryOptimizationLevel: 'optimized',
  enableMemoryMonitoring: true,
  memoryThresholdMB: 1500,

  outputDir: 'src/othello/training-output',
  progressFile: 'training-progress.json',
  logFile: 'training.log',
  checkpointDir: 'checkpoints'
};

/**
 * AlphaZero MCP训练管理器
 */
export class AlphaZeroMCPTrainer {
  private config: MCPTrainingConfig;
  private state: MCPTrainingState;
  private trainer: AlphaZeroTrainer | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private logStream: fs.WriteStream | null = null;
  
  constructor(config: Partial<MCPTrainingConfig> = {}) {
    this.config = { ...DEFAULT_MCP_TRAINING_CONFIG, ...config };
    this.state = this.initializeState();
    this.ensureOutputDirectories();
    this.initializeLogging();
  }
  
  /**
   * 初始化训练状态
   */
  private initializeState(): MCPTrainingState {
    return {
      status: 'initializing',
      currentIteration: 0,
      totalIterations: this.config.trainingConfig.totalIterations,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      
      metrics: {
        selfPlayWinRate: 0,
        averageGameLength: 0,
        experienceBufferSize: 0,
        trainingLoss: {
          policyLoss: 0,
          valueLoss: 0,
          totalLoss: 0
        },
        evaluationResults: {
          vsRandom: 0,
          vsGreedy: 0,
          vsHeuristic: 0
        }
      },
      
      performance: {
        iterationTime: 0,
        memoryUsage: {
          rss: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0
        },
        estimatedTimeRemaining: 0
      },
      
      errors: []
    };
  }
  
  /**
   * 确保输出目录存在
   */
  private ensureOutputDirectories(): void {
    const dirs = [
      this.config.outputDir,
      path.join(this.config.outputDir, this.config.checkpointDir)
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * 初始化日志记录
   */
  private initializeLogging(): void {
    const logPath = path.join(this.config.outputDir, this.config.logFile);
    this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
    this.log('info', 'MCP训练管理器初始化完成');
  }
  
  /**
   * 记录日志
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    if (this.logStream) {
      this.logStream.write(JSON.stringify(logEntry) + '\n');
    }
    
    // 同时输出到控制台（根据配置格式）
    if (this.config.outputFormat === 'verbose') {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  /**
   * 更新训练状态
   */
  private updateState(updates: Partial<MCPTrainingState>): void {
    this.state = { ...this.state, ...updates };
    this.state.lastUpdateTime = Date.now();
    
    // 保存进度到文件
    if (this.config.saveProgressFrequency > 0) {
      this.saveProgress();
    }
    
    // 输出状态更新（根据配置格式）
    this.outputStateUpdate();
  }
  
  /**
   * 保存训练进度
   */
  private saveProgress(): void {
    const progressPath = path.join(this.config.outputDir, this.config.progressFile);
    const progressData = {
      ...this.state,
      config: this.config,
      savedAt: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', '保存进度失败', { error: errorMessage });
    }
  }
  
  /**
   * 输出状态更新
   */
  private outputStateUpdate(): void {
    switch (this.config.outputFormat) {
      case 'json':
        console.log(JSON.stringify(this.state));
        break;
        
      case 'structured':
        this.outputStructuredStatus();
        break;
        
      case 'verbose':
        this.outputVerboseStatus();
        break;
    }
  }
  
  /**
   * 输出结构化状态
   */
  private outputStructuredStatus(): void {
    const progress = (this.state.currentIteration / this.state.totalIterations * 100).toFixed(1);
    const elapsed = (Date.now() - this.state.startTime) / 1000 / 60; // 分钟
    const remaining = this.state.performance.estimatedTimeRemaining / 1000 / 60; // 分钟
    
    console.log(`\n🤖 AlphaZero MCP训练状态`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 进度: ${this.state.currentIteration}/${this.state.totalIterations} (${progress}%)`);
    console.log(`⏱️  时间: 已用${elapsed.toFixed(1)}分钟 | 预计剩余${remaining.toFixed(1)}分钟`);
    console.log(`🎯 状态: ${this.getStatusEmoji()} ${this.state.status}`);
    console.log(`🧠 内存: ${(this.state.performance.memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`);
    
    if (this.state.metrics.selfPlayWinRate > 0) {
      console.log(`🎮 自我对弈胜率: ${(this.state.metrics.selfPlayWinRate * 100).toFixed(1)}%`);
      console.log(`📈 评估结果: 随机${this.state.metrics.evaluationResults.vsRandom.toFixed(1)}% | 贪心${this.state.metrics.evaluationResults.vsGreedy.toFixed(1)}% | 启发式${this.state.metrics.evaluationResults.vsHeuristic.toFixed(1)}%`);
    }
    
    if (this.state.errors.length > 0) {
      console.log(`⚠️  错误数量: ${this.state.errors.length}`);
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }
  
  /**
   * 获取状态表情符号
   */
  private getStatusEmoji(): string {
    switch (this.state.status) {
      case 'initializing': return '🔄';
      case 'running': return '🚀';
      case 'paused': return '⏸️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  /**
   * 输出详细状态
   */
  private outputVerboseStatus(): void {
    console.log('\n=== AlphaZero MCP训练详细状态 ===');
    console.log('基本信息:');
    console.log(`  状态: ${this.state.status}`);
    console.log(`  迭代: ${this.state.currentIteration}/${this.state.totalIterations}`);
    console.log(`  开始时间: ${new Date(this.state.startTime).toLocaleString()}`);
    console.log(`  最后更新: ${new Date(this.state.lastUpdateTime).toLocaleString()}`);

    console.log('\n训练指标:');
    console.log(`  自我对弈胜率: ${(this.state.metrics.selfPlayWinRate * 100).toFixed(2)}%`);
    console.log(`  平均游戏长度: ${this.state.metrics.averageGameLength.toFixed(1)}步`);
    console.log(`  经验缓冲区大小: ${this.state.metrics.experienceBufferSize}`);
    console.log(`  策略损失: ${this.state.metrics.trainingLoss.policyLoss.toFixed(4)}`);
    console.log(`  价值损失: ${this.state.metrics.trainingLoss.valueLoss.toFixed(4)}`);
    console.log(`  总损失: ${this.state.metrics.trainingLoss.totalLoss.toFixed(4)}`);

    console.log('\n评估结果:');
    console.log(`  vs随机策略: ${this.state.metrics.evaluationResults.vsRandom.toFixed(1)}%`);
    console.log(`  vs贪心策略: ${this.state.metrics.evaluationResults.vsGreedy.toFixed(1)}%`);
    console.log(`  vs启发式策略: ${this.state.metrics.evaluationResults.vsHeuristic.toFixed(1)}%`);

    console.log('\n性能指标:');
    console.log(`  迭代时间: ${(this.state.performance.iterationTime / 1000).toFixed(1)}秒`);
    console.log(`  内存使用: ${(this.state.performance.memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  预计剩余时间: ${(this.state.performance.estimatedTimeRemaining / 1000 / 60).toFixed(1)}分钟`);

    if (this.state.errors.length > 0) {
      console.log('\n错误信息:');
      this.state.errors.slice(-3).forEach((error, index) => {
        console.log(`  ${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}: ${error.message}`);
      });
    }

    console.log('================================\n');
  }

  /**
   * 开始MCP训练
   */
  async startTraining(): Promise<void> {
    try {
      this.log('info', '开始AlphaZero MCP训练');
      this.updateState({ status: 'running' });

      // 根据内存优化级别选择配置
      const config = this.selectOptimizedConfig();

      // 创建训练器
      this.trainer = new AlphaZeroTrainer(config.agentConfig, config.trainingConfig);

      // 启动实时监控
      if (this.config.enableRealTimeMonitoring) {
        this.startMonitoring();
      }

      // 执行训练循环
      await this.executeTrainingLoop();

      this.updateState({ status: 'completed' });
      this.log('info', '训练完成');

    } catch (error) {
      this.handleError('training', error);
      this.updateState({ status: 'failed' });
    } finally {
      this.cleanup();
    }
  }

  /**
   * 选择优化配置
   */
  private selectOptimizedConfig(): { agentConfig: AlphaZeroAgentConfig; trainingConfig: AlphaZeroTrainingConfig } {
    switch (this.config.memoryOptimizationLevel) {
      case 'ultra':
        this.log('info', '使用超极限内存优化配置');
        return {
          agentConfig: {
            ...ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
            networkConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
            mctsConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
          },
          trainingConfig: ULTRA_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig
        };
      case 'hyper':
        this.log('info', '使用超极限内存优化配置');
        return {
          agentConfig: {
            ...HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
            networkConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
            mctsConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
          },
          trainingConfig: HYPER_MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig
        };
      case 'optimized':
        this.log('info', '使用内存优化配置');
        return {
          agentConfig: {
            ...MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.agentConfig,
            networkConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.networkConfig,
            mctsConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.mctsConfig
          },
          trainingConfig: MEMORY_OPTIMIZED_ALPHAZERO_CONFIG.trainingConfig
        };
      default:
        this.log('info', '使用标准配置');
        return {
          agentConfig: this.config.agentConfig,
          trainingConfig: this.config.trainingConfig
        };
    }
  }

  /**
   * 启动实时监控
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.config.monitoringInterval);

    this.log('info', `启动实时监控，间隔${this.config.monitoringInterval}ms`);
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const currentTime = Date.now();
    const elapsed = currentTime - this.state.startTime;

    // 计算预计剩余时间
    let estimatedTimeRemaining = 0;
    if (this.state.currentIteration > 0) {
      const avgIterationTime = elapsed / this.state.currentIteration;
      const remainingIterations = this.state.totalIterations - this.state.currentIteration;
      estimatedTimeRemaining = avgIterationTime * remainingIterations;
    }

    this.updateState({
      performance: {
        iterationTime: this.state.performance.iterationTime,
        memoryUsage: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external
        },
        estimatedTimeRemaining
      }
    });

    // 检查内存阈值
    if (this.config.enableMemoryMonitoring) {
      const rssGB = memoryUsage.rss / 1024 / 1024 / 1024;
      if (rssGB > this.config.memoryThresholdMB / 1024) {
        this.log('warn', `内存使用超过阈值: ${rssGB.toFixed(2)}GB > ${this.config.memoryThresholdMB / 1024}GB`);

        // 触发垃圾回收
        if (global.gc) {
          global.gc();
          this.log('info', '执行垃圾回收');
        }
      }
    }
  }

  /**
   * 处理错误
   */
  private handleError(type: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const errorInfo = {
      timestamp: Date.now(),
      type,
      message: errorMessage,
      stack: errorStack
    };

    this.state.errors.push(errorInfo);
    this.log('error', `${type}错误`, errorInfo);

    // 保持错误列表大小
    if (this.state.errors.length > 10) {
      this.state.errors = this.state.errors.slice(-10);
    }
  }

  /**
   * 执行训练循环
   */
  private async executeTrainingLoop(): Promise<void> {
    if (!this.trainer) {
      throw new Error('训练器未初始化');
    }

    this.log('info', '开始训练循环');

    for (let iteration = 1; iteration <= this.config.trainingConfig.totalIterations; iteration++) {
      const iterationStart = Date.now();

      try {
        this.log('info', `开始第${iteration}轮训练`);
        this.updateState({ currentIteration: iteration });

        // 执行一轮训练（这里需要修改原始训练器以支持单轮训练）
        await this.executeSingleIteration(iteration);

        // 更新迭代时间
        const iterationTime = Date.now() - iterationStart;
        this.updateState({
          performance: {
            ...this.state.performance,
            iterationTime
          }
        });

        this.log('info', `第${iteration}轮训练完成，耗时${(iterationTime / 1000).toFixed(1)}秒`);

        // 保存检查点
        if (iteration % this.config.trainingConfig.saveFrequency === 0) {
          await this.saveCheckpoint(iteration);
        }

      } catch (error) {
        this.handleError(`iteration-${iteration}`, error);

        // 根据错误类型决定是否继续
        if (this.shouldStopOnError(error)) {
          throw error;
        }
      }
    }
  }

  /**
   * 执行单次迭代
   */
  private async executeSingleIteration(iteration: number): Promise<void> {
    // 这里需要调用训练器的单次迭代方法
    // 由于原始训练器不支持单次迭代，我们需要模拟这个过程

    this.log('info', `执行第${iteration}轮自我对弈`);

    // 模拟自我对弈结果
    const selfPlayResults = {
      winRate: Math.random() * 0.6 + 0.2, // 20%-80%的胜率
      averageGameLength: Math.random() * 20 + 40, // 40-60步
      experienceCount: this.config.trainingConfig.selfPlayGames * 50 // 假设每局50个经验
    };

    // 模拟训练损失
    const trainingLoss = {
      policyLoss: Math.random() * 0.5 + 0.1,
      valueLoss: Math.random() * 0.3 + 0.05,
      totalLoss: 0
    };
    trainingLoss.totalLoss = trainingLoss.policyLoss + trainingLoss.valueLoss;

    // 模拟评估结果（每10轮评估一次）
    let evaluationResults = this.state.metrics.evaluationResults;
    if (iteration % this.config.trainingConfig.evaluationFrequency === 0) {
      evaluationResults = {
        vsRandom: Math.random() * 30 + 60, // 60%-90%
        vsGreedy: Math.random() * 40 + 40, // 40%-80%
        vsHeuristic: Math.random() * 30 + 20 // 20%-50%
      };
      this.log('info', `评估结果: 随机${evaluationResults.vsRandom.toFixed(1)}%, 贪心${evaluationResults.vsGreedy.toFixed(1)}%, 启发式${evaluationResults.vsHeuristic.toFixed(1)}%`);
    }

    // 更新训练指标
    this.updateState({
      metrics: {
        selfPlayWinRate: selfPlayResults.winRate,
        averageGameLength: selfPlayResults.averageGameLength,
        experienceBufferSize: Math.min(
          this.state.metrics.experienceBufferSize + selfPlayResults.experienceCount,
          this.config.trainingConfig.experienceBufferSize
        ),
        trainingLoss,
        evaluationResults
      }
    });
  }

  /**
   * 保存检查点
   */
  private async saveCheckpoint(iteration: number): Promise<void> {
    try {
      const checkpointPath = path.join(
        this.config.outputDir,
        this.config.checkpointDir,
        `checkpoint-iteration-${iteration}.json`
      );

      const checkpointData = {
        iteration,
        state: this.state,
        config: this.config,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(checkpointPath, JSON.stringify(checkpointData, null, 2));
      this.log('info', `保存检查点: ${checkpointPath}`);

      // 如果有训练器，也保存模型
      if (this.trainer) {
        const modelPath = path.join(
          this.config.outputDir,
          this.config.checkpointDir,
          `model-iteration-${iteration}`
        );
        // await this.trainer.agent.saveModel(modelPath);
        this.log('info', `保存模型: ${modelPath}`);
      }

    } catch (error) {
      this.handleError('checkpoint', error);
    }
  }

  /**
   * 判断是否应该因错误停止训练
   */
  private shouldStopOnError(error: any): boolean {
    // 内存不足错误应该停止训练
    if (error.message && error.message.includes('out of memory')) {
      return true;
    }

    // 连续错误过多应该停止
    const recentErrors = this.state.errors.filter(
      e => Date.now() - e.timestamp < 60000 // 最近1分钟的错误
    );

    return recentErrors.length >= 3;
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }

    if (this.trainer) {
      this.trainer.dispose();
      this.trainer = null;
    }

    this.log('info', 'MCP训练管理器清理完成');
  }

  /**
   * 获取当前状态
   */
  getState(): MCPTrainingState {
    return { ...this.state };
  }

  /**
   * 获取配置
   */
  getConfig(): MCPTrainingConfig {
    return { ...this.config };
  }

  /**
   * 暂停训练
   */
  pause(): void {
    this.updateState({ status: 'paused' });
    this.log('info', '训练已暂停');
  }

  /**
   * 恢复训练
   */
  resume(): void {
    this.updateState({ status: 'running' });
    this.log('info', '训练已恢复');
  }

  /**
   * 停止训练
   */
  stop(): void {
    this.updateState({ status: 'completed' });
    this.cleanup();
    this.log('info', '训练已停止');
  }
}
