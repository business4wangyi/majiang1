// {{ AURA-X: Add - AlphaZero性能基准测试系统. Approval: 寸止(ID:按最优实践继续). }}

/**
 * AlphaZero性能基准测试系统
 * 
 * 提供全面的性能评估和基准测试：
 * - 搜索性能测试
 * - 对战能力评估
 * - 训练效率分析
 * - 配置优化建议
 */

import { AlphaZeroOthelloAgent, AlphaZeroAgentConfig } from './agents/alphazero-agent';
import { AlphaZeroTrainer, AlphaZeroTrainingConfig } from './trainers/alphazero-trainer';
import { 
  DEMO_ALPHAZERO_CONFIG,
  STANDARD_ALPHAZERO_CONFIG,
  HIGH_PERFORMANCE_ALPHAZERO_CONFIG,
  AlphaZeroConfigSelector,
  AlphaZeroConfigValidator
} from './configs/alphazero-configs';

import { 
  RandomOthelloAgent,
  GreedyOthelloAgent,
  HeuristicOthelloAgent,
  DQNOthelloAgent,
  A3COthelloAgent,
  DEFAULT_DQN_AGENT_CONFIG,
  DEFAULT_A3C_AGENT_CONFIG
} from './index';

import { 
  createOthelloBoard,
  makeMove,
  isGameOver,
  countPieces,
  getLegalActions
} from '../core/game';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../core/types';

/**
 * 基准测试结果接口
 */
interface BenchmarkResult {
  configName: string;
  searchPerformance: {
    avgSearchTime: number;
    avgSimulations: number;
    searchesPerSecond: number;
  };
  battleResults: {
    [opponentName: string]: {
      winRate: number;
      avgScore: number;
      games: number;
    };
  };
  resourceUsage: {
    peakMemoryMB: number;
    avgCpuUsage: number;
  };
  overallScore: number;
}

/**
 * AlphaZero基准测试器
 */
export class AlphaZeroBenchmark {
  private testConfigs: { name: string; config: any }[];

  constructor() {
    this.testConfigs = [
      { name: 'Demo', config: DEMO_ALPHAZERO_CONFIG },
      { name: 'Standard', config: STANDARD_ALPHAZERO_CONFIG },
      { name: 'High-Performance', config: HIGH_PERFORMANCE_ALPHAZERO_CONFIG }
    ];
  }

  /**
   * 运行完整基准测试
   */
  async runFullBenchmark(): Promise<BenchmarkResult[]> {
    console.log('🎯 开始AlphaZero全面基准测试');
    console.log('=====================================');

    const results: BenchmarkResult[] = [];

    for (const testConfig of this.testConfigs) {
      console.log(`\n📊 测试配置: ${testConfig.name}`);
      console.log('-----------------------------------');

      // 验证配置
      const validation = AlphaZeroConfigValidator.validateConfig(testConfig.config);
      if (!validation.isValid) {
        console.log('⚠️ 配置警告:');
        validation.warnings.forEach((warning: string) => console.log(`   - ${warning}`));
      }

      // 估算资源需求
      const resourceEst = AlphaZeroConfigValidator.estimateResourceRequirements(testConfig.config);
      console.log(`📈 预估资源需求:`);
      console.log(`   内存: ${resourceEst.memoryMB}MB`);
      console.log(`   训练时间: ${resourceEst.trainingTimeHours}小时`);
      console.log(`   磁盘空间: ${resourceEst.diskSpaceMB}MB`);

      try {
        const result = await this.benchmarkConfig(testConfig.name, testConfig.config);
        results.push(result);
      } catch (error) {
        console.error(`❌ 配置 ${testConfig.name} 测试失败:`, error);
      }
    }

    // 输出综合结果
    this.printBenchmarkSummary(results);

    return results;
  }

  /**
   * 测试单个配置
   */
  private async benchmarkConfig(configName: string, config: any): Promise<BenchmarkResult> {
    console.log(`\n🧪 开始测试 ${configName} 配置...`);

    // 创建智能体
    const agent = new AlphaZeroOthelloAgent({
      networkConfig: config.networkConfig,
      mctsConfig: config.mctsConfig,
      ...config.agentConfig,
      isTraining: false,
      verbose: false
    });

    // 搜索性能测试
    console.log('⚡ 搜索性能测试...');
    const searchPerf = await this.testSearchPerformance(agent);

    // 对战能力测试
    console.log('⚔️ 对战能力测试...');
    const battleResults = await this.testBattleCapability(agent);

    // 资源使用测试
    console.log('💾 资源使用测试...');
    const resourceUsage = this.measureResourceUsage();

    // 计算综合评分
    const overallScore = this.calculateOverallScore(searchPerf, battleResults, resourceUsage);

    agent.dispose();

    return {
      configName,
      searchPerformance: searchPerf,
      battleResults,
      resourceUsage,
      overallScore
    };
  }

  /**
   * 搜索性能测试
   */
  private async testSearchPerformance(agent: AlphaZeroOthelloAgent): Promise<{
    avgSearchTime: number;
    avgSimulations: number;
    searchesPerSecond: number;
  }> {
    const testPositions = 5;
    const totalTimes: number[] = [];
    const totalSimulations: number[] = [];

    for (let i = 0; i < testPositions; i++) {
      const board = createOthelloBoard();
      const startTime = Date.now();
      
      const result = agent.searchBestAction(board, 'B');
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      
      totalTimes.push(searchTime);
      totalSimulations.push(result.searchStats.simulations);
    }

    const avgSearchTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    const avgSimulations = totalSimulations.reduce((a, b) => a + b, 0) / totalSimulations.length;
    const searchesPerSecond = 1000 / avgSearchTime;

    console.log(`   平均搜索时间: ${avgSearchTime.toFixed(0)}ms`);
    console.log(`   平均模拟次数: ${avgSimulations.toFixed(0)}`);
    console.log(`   搜索速度: ${searchesPerSecond.toFixed(2)} 搜索/秒`);

    return {
      avgSearchTime,
      avgSimulations,
      searchesPerSecond
    };
  }

  /**
   * 对战能力测试
   */
  private async testBattleCapability(agent: AlphaZeroOthelloAgent): Promise<{
    [opponentName: string]: {
      winRate: number;
      avgScore: number;
      games: number;
    };
  }> {
    const opponents = [
      { name: '随机策略', agent: new RandomOthelloAgent(), games: 10 },
      { name: '贪心策略', agent: new GreedyOthelloAgent(), games: 10 },
      { name: '启发式策略', agent: new HeuristicOthelloAgent(), games: 10 }
    ];

    const results: { [key: string]: any } = {};

    for (const opponent of opponents) {
      console.log(`   vs ${opponent.name}...`);
      
      let wins = 0;
      let totalAlphaZeroScore = 0;
      let totalOpponentScore = 0;

      for (let game = 0; game < opponent.games; game++) {
        const gameResult = await this.playBenchmarkGame(agent, opponent.agent);
        
        if (gameResult.alphaZeroScore > gameResult.opponentScore) {
          wins++;
        }
        
        totalAlphaZeroScore += gameResult.alphaZeroScore;
        totalOpponentScore += gameResult.opponentScore;
      }

      const winRate = (wins / opponent.games) * 100;
      const avgScore = totalAlphaZeroScore / opponent.games;

      results[opponent.name] = {
        winRate,
        avgScore,
        games: opponent.games
      };

      console.log(`     胜率: ${winRate.toFixed(1)}% (${wins}/${opponent.games})`);
      console.log(`     平均得分: ${avgScore.toFixed(1)}`);
    }

    return results;
  }

  /**
   * 进行基准测试游戏
   */
  private async playBenchmarkGame(alphaZero: AlphaZeroOthelloAgent, opponent: any): Promise<{
    alphaZeroScore: number;
    opponentScore: number;
    gameLength: number;
  }> {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let gameLength = 0;
    const maxMoves = 100;

    while (!isGameOver(board) && gameLength < maxMoves) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length > 0) {
        let action: OthelloAction | null = null;
        
        if (currentPlayer === 'B') {
          action = alphaZero.chooseAction(board, currentPlayer);
        } else {
          action = opponent.chooseAction(board, currentPlayer);
        }
        
        if (action && legalActions.some((a: OthelloAction) => a.row === action.row && a.col === action.col)) {
          board = makeMove(board, action, currentPlayer);
        }
      }
      
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      gameLength++;
    }

    const { B, W } = countPieces(board);
    return {
      alphaZeroScore: B,
      opponentScore: W,
      gameLength
    };
  }

  /**
   * 测量资源使用
   */
  private measureResourceUsage(): {
    peakMemoryMB: number;
    avgCpuUsage: number;
  } {
    const memUsage = process.memoryUsage();
    const peakMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // 简化的CPU使用率估算
    const avgCpuUsage = 50; // 占位符，实际应该测量

    return {
      peakMemoryMB,
      avgCpuUsage
    };
  }

  /**
   * 计算综合评分
   */
  private calculateOverallScore(
    searchPerf: any,
    battleResults: any,
    resourceUsage: any
  ): number {
    // 搜索性能分数 (0-40分)
    const searchScore = Math.min(40, searchPerf.searchesPerSecond * 10);
    
    // 对战能力分数 (0-40分)
    const battleScores = Object.values(battleResults).map((result: any) => result.winRate);
    const avgWinRate = battleScores.reduce((a: number, b: number) => a + b, 0) / battleScores.length;
    const battleScore = Math.min(40, avgWinRate * 0.4);
    
    // 资源效率分数 (0-20分)
    const memoryEfficiency = Math.max(0, 20 - resourceUsage.peakMemoryMB / 50);
    const resourceScore = Math.min(20, memoryEfficiency);
    
    return Math.round(searchScore + battleScore + resourceScore);
  }

  /**
   * 输出基准测试总结
   */
  private printBenchmarkSummary(results: BenchmarkResult[]): void {
    console.log('\n🏆 基准测试总结');
    console.log('=====================================');

    // 按综合评分排序
    const sortedResults = results.sort((a, b) => b.overallScore - a.overallScore);

    console.log('\n📊 配置排名:');
    sortedResults.forEach((result, index) => {
      const medal = ['🥇', '🥈', '🥉'][index] || '🏅';
      console.log(`${medal} ${result.configName}: ${result.overallScore}分`);
      console.log(`   搜索速度: ${result.searchPerformance.searchesPerSecond.toFixed(2)} 搜索/秒`);
      console.log(`   平均胜率: ${this.calculateAvgWinRate(result.battleResults).toFixed(1)}%`);
      console.log(`   内存使用: ${result.resourceUsage.peakMemoryMB}MB`);
    });

    console.log('\n💡 优化建议:');
    const bestConfig = sortedResults[0];
    console.log(`• 推荐使用 "${bestConfig.configName}" 配置`);
    console.log(`• 该配置在性能和资源消耗间达到最佳平衡`);
    
    if (bestConfig.overallScore < 60) {
      console.log(`• 当前最佳配置评分较低，建议进行更长时间的训练`);
    }
  }

  /**
   * 计算平均胜率
   */
  private calculateAvgWinRate(battleResults: any): number {
    const winRates = Object.values(battleResults).map((result: any) => result.winRate);
    return winRates.reduce((a: number, b: number) => a + b, 0) / winRates.length;
  }

  /**
   * 快速性能测试
   */
  async quickPerformanceTest(): Promise<void> {
    console.log('⚡ AlphaZero快速性能测试');
    console.log('========================');

    const config = AlphaZeroConfigSelector.autoSelectConfig();
    
    const agent = new AlphaZeroOthelloAgent({
      networkConfig: config.networkConfig,
      mctsConfig: config.mctsConfig,
      ...config.agentConfig,
      isTraining: false,
      verbose: true
    });

    // 单次搜索测试
    const board = createOthelloBoard();
    const startTime = Date.now();
    const result = agent.searchBestAction(board, 'B');
    const endTime = Date.now();

    console.log(`🎯 搜索结果:`);
    console.log(`   选择动作: (${result.action.row}, ${result.action.col})`);
    console.log(`   搜索时间: ${endTime - startTime}ms`);
    console.log(`   模拟次数: ${result.searchStats.simulations}`);
    console.log(`   根节点价值: ${result.rootValue.toFixed(4)}`);

    // 快速对战测试
    console.log(`\n⚔️ 快速对战测试:`);
    const opponent = new HeuristicOthelloAgent();
    const gameResult = await this.playBenchmarkGame(agent, opponent);
    
    const winner = gameResult.alphaZeroScore > gameResult.opponentScore ? 'AlphaZero' : '启发式策略';
    console.log(`   结果: ${winner} (${gameResult.alphaZeroScore}-${gameResult.opponentScore})`);

    agent.dispose();
  }
}

/**
 * 导出的基准测试运行函数
 */
export async function runFullBenchmark(): Promise<void> {
  console.log('📊 启动AlphaZero性能基准测试...');

  const benchmark = new AlphaZeroBenchmark();

  try {
    // 运行标准配置的基准测试
    console.log('🔍 测试标准配置...');
    const results = await benchmark.runFullBenchmark();

    console.log('\n✅ 基准测试完成！');
    if (results && results.length > 0) {
      const result = results[0];
    console.log('📈 测试结果:');
    console.log(`   配置: ${result.configName}`);
    console.log(`   平均搜索时间: ${result.searchPerformance.avgSearchTime.toFixed(2)}ms`);
    console.log(`   平均模拟次数: ${result.searchPerformance.avgSimulations}`);
      if (result.battleResults) {
        for (const [opponent, stats] of Object.entries(result.battleResults)) {
          console.log(`   vs ${opponent}: ${stats.winRate.toFixed(1)}%`);
        }
      }
      console.log(`   内存使用: ${result.resourceUsage.peakMemoryMB.toFixed(1)}MB`);
    }

  } catch (error) {
    console.error('❌ 基准测试失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runFullBenchmark().catch(console.error);
}
