// {{ AURA-X: Add - AlphaZero高级训练管理器，智能训练控制. Approval: 寸止(ID:按最优实践继续). }}

/**
 * AlphaZero高级训练管理器
 * 
 * 提供智能化的训练管理功能：
 * - 自适应训练参数调整
 * - 训练进度监控和早停
 * - 模型性能跟踪
 * - 训练恢复和检查点管理
 */

import { AlphaZeroTrainer, AlphaZeroTrainingConfig } from './alphazero-trainer';
import { AlphaZeroOthelloAgent, AlphaZeroAgentConfig } from '../agents/alphazero-agent';
import { AlphaZeroBenchmark } from '../benchmark';
import { 
  AlphaZeroConfigSelector,
  AlphaZeroConfigValidator,
  STANDARD_ALPHAZERO_CONFIG
} from '../configs/alphazero-configs';

import * as fs from 'fs';
import * as path from 'path';

/**
 * 训练状态接口
 */
interface TrainingState {
  currentIteration: number;
  bestWinRate: number;
  bestModel: string;
  trainingHistory: TrainingMetrics[];
  isConverged: boolean;
  lastImprovement: number;
}

/**
 * 训练指标接口
 */
interface TrainingMetrics {
  iteration: number;
  policyLoss: number;
  valueLoss: number;
  totalLoss: number;
  winRateVsRandom: number;
  winRateVsGreedy: number;
  winRateVsHeuristic: number;
  avgGameLength: number;
  trainingTime: number;
}

/**
 * 训练管理器配置
 */
interface TrainingManagerConfig {
  /** 早停耐心值 */
  earlyStoppingPatience: number;
  /** 最小改进阈值 */
  minImprovement: number;
  /** 自适应学习率 */
  adaptiveLearningRate: boolean;
  /** 检查点保存频率 */
  checkpointFrequency: number;
  /** 最大训练时间（小时） */
  maxTrainingHours: number;
  /** 目标胜率阈值 */
  targetWinRate: number;
}

/**
 * 默认训练管理器配置
 */
const DEFAULT_TRAINING_MANAGER_CONFIG: TrainingManagerConfig = {
  earlyStoppingPatience: 20,
  minImprovement: 0.01,
  adaptiveLearningRate: true,
  checkpointFrequency: 10,
  maxTrainingHours: 24,
  targetWinRate: 70.0
};

/**
 * AlphaZero训练管理器
 */
export class AlphaZeroTrainingManager {
  private trainer: AlphaZeroTrainer | null = null;
  private benchmark: AlphaZeroBenchmark;
  private config: TrainingManagerConfig;
  private trainingState: TrainingState;
  private startTime: number = 0;
  private checkpointDir: string;

  constructor(
    private agentConfig: AlphaZeroAgentConfig,
    private trainingConfig: AlphaZeroTrainingConfig,
    managerConfig: Partial<TrainingManagerConfig> = {}
  ) {
    this.config = { ...DEFAULT_TRAINING_MANAGER_CONFIG, ...managerConfig };
    this.benchmark = new AlphaZeroBenchmark();
    this.checkpointDir = path.join(trainingConfig.modelSavePath, 'checkpoints');
    
    this.trainingState = {
      currentIteration: 0,
      bestWinRate: 0,
      bestModel: '',
      trainingHistory: [],
      isConverged: false,
      lastImprovement: 0
    };

    this.ensureCheckpointDir();
    console.log('🎯 AlphaZero训练管理器初始化完成');
  }

  /**
   * 开始智能训练
   */
  async startIntelligentTraining(): Promise<void> {
    console.log('\n🚀 开始AlphaZero智能训练管理');
    console.log('=====================================');

    this.startTime = Date.now();

    // 验证配置
    await this.validateAndOptimizeConfig();

    // 尝试恢复之前的训练
    await this.tryResumeTraining();

    // 创建训练器
    this.trainer = new AlphaZeroTrainer(this.agentConfig, this.trainingConfig);

    try {
      // 执行训练循环
      await this.intelligentTrainingLoop();
      
      console.log('\n🎉 智能训练完成！');
      await this.generateTrainingReport();
      
    } catch (error) {
      console.error('❌ 训练过程中出现错误:', error);
      await this.saveCheckpoint('error');
    } finally {
      if (this.trainer) {
        this.trainer.dispose();
      }
    }
  }

  /**
   * 智能训练循环
   */
  private async intelligentTrainingLoop(): Promise<void> {
    while (!this.shouldStopTraining()) {
      const iterationStart = Date.now();
      
      console.log(`\n📊 智能训练迭代 ${this.trainingState.currentIteration + 1}`);
      
      // 执行一次训练迭代
      await this.executeTrainingIteration();
      
      // 评估当前模型
      const metrics = await this.evaluateCurrentModel();
      
      // 更新训练状态
      this.updateTrainingState(metrics, Date.now() - iterationStart);
      
      // 检查是否需要调整参数
      await this.adaptTrainingParameters();
      
      // 保存检查点
      if (this.trainingState.currentIteration % this.config.checkpointFrequency === 0) {
        await this.saveCheckpoint('regular');
      }
      
      // 输出进度
      this.printTrainingProgress(metrics);
      
      this.trainingState.currentIteration++;
    }
  }

  /**
   * 执行训练迭代
   */
  private async executeTrainingIteration(): Promise<void> {
    if (!this.trainer) {
      throw new Error('训练器未初始化');
    }

    // 这里应该调用训练器的单次迭代方法
    // 由于当前训练器设计为完整训练，我们需要修改它支持单次迭代
    console.log('🎓 执行训练迭代...');
    
    // 临时实现：创建小规模训练配置
    const miniConfig = {
      ...this.trainingConfig,
      totalIterations: 1,
      selfPlayGames: Math.min(5, this.trainingConfig.selfPlayGames),
      trainingEpochs: Math.min(3, this.trainingConfig.trainingEpochs),
      verbose: false
    };

    const miniTrainer = new AlphaZeroTrainer(this.agentConfig, miniConfig);
    try {
      await miniTrainer.startTraining();
    } finally {
      miniTrainer.dispose();
    }
  }

  /**
   * 评估当前模型
   */
  private async evaluateCurrentModel(): Promise<TrainingMetrics> {
    console.log('📊 评估当前模型性能...');

    // 创建评估智能体
    const evalAgent = new AlphaZeroOthelloAgent({
      ...this.agentConfig,
      isTraining: false,
      verbose: false
    });

    try {
      // 尝试加载最新模型
      const modelPath = `${this.trainingConfig.modelSavePath}-iteration-${this.trainingState.currentIteration}`;
      try {
        await evalAgent.loadModel(modelPath);
      } catch (e) {
        console.log('⚠️ 无法加载模型，使用当前网络状态');
      }

      // 运行基准测试
      const benchmark = new AlphaZeroBenchmark();
      const results = await benchmark['testBattleCapability'](evalAgent);

      return {
        iteration: this.trainingState.currentIteration,
        policyLoss: 0, // 需要从训练器获取
        valueLoss: 0,  // 需要从训练器获取
        totalLoss: 0,  // 需要从训练器获取
        winRateVsRandom: results['随机策略']?.winRate || 0,
        winRateVsGreedy: results['贪心策略']?.winRate || 0,
        winRateVsHeuristic: results['启发式策略']?.winRate || 0,
        avgGameLength: 60, // 估算值
        trainingTime: Date.now() - this.startTime
      };
    } finally {
      evalAgent.dispose();
    }
  }

  /**
   * 更新训练状态
   */
  private updateTrainingState(metrics: TrainingMetrics, iterationTime: number): void {
    this.trainingState.trainingHistory.push(metrics);

    // 计算综合胜率
    const avgWinRate = (metrics.winRateVsRandom + metrics.winRateVsGreedy + metrics.winRateVsHeuristic) / 3;

    // 检查是否有改进
    if (avgWinRate > this.trainingState.bestWinRate + this.config.minImprovement) {
      this.trainingState.bestWinRate = avgWinRate;
      this.trainingState.lastImprovement = this.trainingState.currentIteration;
      this.trainingState.bestModel = `iteration-${this.trainingState.currentIteration}`;
      console.log(`🎉 发现更好的模型！平均胜率: ${avgWinRate.toFixed(2)}%`);
    }

    // 检查收敛
    const noImprovementIterations = this.trainingState.currentIteration - this.trainingState.lastImprovement;
    this.trainingState.isConverged = noImprovementIterations >= this.config.earlyStoppingPatience;
  }

  /**
   * 自适应调整训练参数
   */
  private async adaptTrainingParameters(): Promise<void> {
    if (!this.config.adaptiveLearningRate) return;

    const recentHistory = this.trainingState.trainingHistory.slice(-5);
    if (recentHistory.length < 5) return;

    // 检查损失是否停滞
    const avgLoss = recentHistory.reduce((sum, h) => sum + h.totalLoss, 0) / recentHistory.length;
    const lossVariance = recentHistory.reduce((sum, h) => sum + Math.pow(h.totalLoss - avgLoss, 2), 0) / recentHistory.length;

    if (lossVariance < 0.001) {
      console.log('📉 检测到损失停滞，降低学习率');
      const networkConfig = this.agentConfig.networkConfig;
      if (networkConfig) {
        networkConfig.learningRate *= 0.9;
      } else {
        console.log('⚠️ 当前未提供 networkConfig，跳过学习率自适应调整');
      }
    }
  }

  /**
   * 判断是否应该停止训练
   */
  private shouldStopTraining(): boolean {
    // 检查收敛
    if (this.trainingState.isConverged) {
      console.log('🎯 训练已收敛，提前停止');
      return true;
    }

    // 检查时间限制
    const trainingHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    if (trainingHours >= this.config.maxTrainingHours) {
      console.log('⏰ 达到最大训练时间，停止训练');
      return true;
    }

    // 检查目标胜率
    if (this.trainingState.bestWinRate >= this.config.targetWinRate) {
      console.log('🏆 达到目标胜率，训练完成');
      return true;
    }

    // 检查最大迭代次数
    if (this.trainingState.currentIteration >= this.trainingConfig.totalIterations) {
      console.log('📊 达到最大迭代次数，训练完成');
      return true;
    }

    return false;
  }

  /**
   * 验证和优化配置
   */
  private async validateAndOptimizeConfig(): Promise<void> {
    console.log('🔧 验证和优化训练配置...');

    // 验证配置
    const validation = AlphaZeroConfigValidator.validateConfig({
      networkConfig: this.agentConfig.networkConfig,
      mctsConfig: this.agentConfig.mctsConfig,
      trainingConfig: this.trainingConfig
    });

    if (!validation.isValid) {
      console.log('⚠️ 配置警告:');
      validation.warnings.forEach((warning: string) => console.log(`   - ${warning}`));
    }

    // 估算资源需求
    const resourceEst = AlphaZeroConfigValidator.estimateResourceRequirements({
      networkConfig: this.agentConfig.networkConfig,
      mctsConfig: this.agentConfig.mctsConfig,
      trainingConfig: this.trainingConfig
    });

    console.log('📊 资源需求估算:');
    console.log(`   预估内存: ${resourceEst.memoryMB}MB`);
    console.log(`   预估训练时间: ${resourceEst.trainingTimeHours}小时`);
    console.log(`   预估磁盘空间: ${resourceEst.diskSpaceMB}MB`);
  }

  /**
   * 尝试恢复训练
   */
  private async tryResumeTraining(): Promise<void> {
    const checkpointPath = path.join(this.checkpointDir, 'latest_state.json');
    
    if (fs.existsSync(checkpointPath)) {
      try {
        const savedState = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
        this.trainingState = savedState;
        console.log(`🔄 恢复训练从迭代 ${this.trainingState.currentIteration}`);
      } catch (error) {
        console.log('⚠️ 无法恢复训练状态，从头开始');
      }
    }
  }

  /**
   * 保存检查点
   */
  private async saveCheckpoint(type: 'regular' | 'best' | 'error'): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `checkpoint_${type}_${timestamp}.json`;
    const filepath = path.join(this.checkpointDir, filename);

    const checkpoint = {
      trainingState: this.trainingState,
      agentConfig: this.agentConfig,
      trainingConfig: this.trainingConfig,
      managerConfig: this.config,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(filepath, JSON.stringify(checkpoint, null, 2));
    
    // 同时保存为最新状态
    const latestPath = path.join(this.checkpointDir, 'latest_state.json');
    fs.writeFileSync(latestPath, JSON.stringify(this.trainingState, null, 2));

    console.log(`💾 检查点已保存: ${filename}`);
  }

  /**
   * 追加记录每次迭代的指标到JSONL文件，便于后续可视化
   */
  private appendMetricsLog(metrics: TrainingMetrics): void {
    try {
      const logPath = path.join(this.checkpointDir, 'metrics.jsonl');
      fs.appendFileSync(logPath, JSON.stringify(metrics) + '\n');
    } catch (e) {
      console.warn('⚠️ 写入metrics日志失败:', e);
    }
  }

  /**
   * 输出训练进度
   */
  private printTrainingProgress(metrics: TrainingMetrics): void {
    const avgWinRate = (metrics.winRateVsRandom + metrics.winRateVsGreedy + metrics.winRateVsHeuristic) / 3;
    const trainingHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    const noImprovementIterations = this.trainingState.currentIteration - this.trainingState.lastImprovement;

    console.log(`📈 训练进度:`);
    console.log(`   当前迭代: ${this.trainingState.currentIteration + 1}/${this.trainingConfig.totalIterations}`);
    console.log(`   平均胜率: ${avgWinRate.toFixed(2)}% (最佳: ${this.trainingState.bestWinRate.toFixed(2)}%)`);
    console.log(`   vs随机: ${metrics.winRateVsRandom.toFixed(1)}% | vs贪心: ${metrics.winRateVsGreedy.toFixed(1)}% | vs启发式: ${metrics.winRateVsHeuristic.toFixed(1)}%`);
    console.log(`   训练时间: ${trainingHours.toFixed(2)}小时`);
    console.log(`   无改进迭代: ${noImprovementIterations}/${this.config.earlyStoppingPatience}`);
    // 持久化迭代指标
    this.appendMetricsLog(metrics);
  }

  /**
   * 生成训练报告
   */
  private async generateTrainingReport(): Promise<void> {
    console.log('\n📋 生成训练报告...');

    const totalTime = (Date.now() - this.startTime) / (1000 * 60 * 60);
    const finalMetrics = this.trainingState.trainingHistory[this.trainingState.trainingHistory.length - 1];

    console.log('\n🎯 训练总结:');
    console.log(`   总迭代次数: ${this.trainingState.currentIteration}`);
    console.log(`   总训练时间: ${totalTime.toFixed(2)}小时`);
    console.log(`   最佳模型: ${this.trainingState.bestModel}`);
    console.log(`   最佳平均胜率: ${this.trainingState.bestWinRate.toFixed(2)}%`);
    console.log(`   是否收敛: ${this.trainingState.isConverged ? '是' : '否'}`);

    if (finalMetrics) {
      console.log('\n📊 最终性能:');
      console.log(`   vs随机策略: ${finalMetrics.winRateVsRandom.toFixed(1)}%`);
      console.log(`   vs贪心策略: ${finalMetrics.winRateVsGreedy.toFixed(1)}%`);
      console.log(`   vs启发式策略: ${finalMetrics.winRateVsHeuristic.toFixed(1)}%`);
    }

    // 保存训练报告
    const reportPath = path.join(this.checkpointDir, 'training_report.json');
    const report = {
      summary: {
        totalIterations: this.trainingState.currentIteration,
        totalTimeHours: totalTime,
        bestModel: this.trainingState.bestModel,
        bestWinRate: this.trainingState.bestWinRate,
        converged: this.trainingState.isConverged
      },
      history: this.trainingState.trainingHistory,
      config: {
        agent: this.agentConfig,
        training: this.trainingConfig,
        manager: this.config
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 训练报告已保存: ${reportPath}`);
  }

  /**
   * 确保检查点目录存在
   */
  private ensureCheckpointDir(): void {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }
}

/**
 * 导出的智能训练运行函数
 */
export async function runSmartTraining(): Promise<void> {
  console.log('🧠 启动AlphaZero智能训练管理器...');

  // 使用标准配置组合出完整的Agent配置
  const agentCfg = {
    ...STANDARD_ALPHAZERO_CONFIG.agentConfig,
    networkConfig: STANDARD_ALPHAZERO_CONFIG.networkConfig,
    mctsConfig: STANDARD_ALPHAZERO_CONFIG.mctsConfig
  } as any;

  const manager = new AlphaZeroTrainingManager(
    // Agent配置
    agentCfg,
    // 训练配置
    STANDARD_ALPHAZERO_CONFIG.trainingConfig as any,
    // 管理器配置
    {
      earlyStoppingPatience: 10,
      minImprovement: 0.5,
      adaptiveLearningRate: true,
      checkpointFrequency: 2,
      maxTrainingHours: 4,
      targetWinRate: 75
    }
  );

  try {
    await manager.startIntelligentTraining();
    console.log('✅ 智能训练完成！');
  } catch (error) {
    console.error('❌ 智能训练失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runSmartTraining().catch(console.error);
}
