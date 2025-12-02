import * as path from 'path';
import { AlphaZeroOthelloAgent, AlphaZeroAgentConfig, DEFAULT_ALPHAZERO_AGENT_CONFIG } from '../../../src/othello/strategy/agents/alphazero-agent';
import { RandomOthelloAgent } from '../../../src/othello/strategy/agents/random-agent';
import { GreedyOthelloAgent } from '../../../src/othello/strategy/agents/greedy-agent';
import { HeuristicOthelloAgent } from '../../../src/othello/strategy/agents/heuristic-agent';
import {
  createOthelloBoard,
  isGameOver,
  getLegalActions,
  makeMove,
  countPieces
} from '../../../src/othello/core/game';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../../src/othello/core/types';
import { AlphaZeroNetworkWorkerWrapper } from '../../../src/othello/strategy/networks/alphazero-network-worker-wrapper';

const MODEL_PATH = path.join(process.cwd(), 'src/othello/models/alphazero-model-best', 'model.json');
const EVALUATION_GAMES = 20; // 每个对手20局
const GAME_TIMEOUT_MS = 5 * 60 * 1000; // 5分钟每局
const MCTS_SEARCH_TIMEOUT_MS = 30 * 1000; // 30秒每次MCTS搜索
const USE_WORKER_MODE = process.env.USE_WORKER_MODE !== 'false'; // 默认启用Worker模式

/**
 * 带超时的Promise包装器
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

async function playGame(
  alphaZeroAgent: AlphaZeroOthelloAgent,
  opponent: any,
  opponentName: string
): Promise<{ winner: 'B' | 'W' | 'draw'; alphaZeroScore: number; opponentScore: number }> {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let gameLength = 0;
  const maxSteps = 100;
  const gameStartTime = Date.now();

  const gamePromise = (async () => {
    while (!isGameOver(board) && gameLength < maxSteps && (Date.now() - gameStartTime < GAME_TIMEOUT_MS)) {
      const legalActions = getLegalActions(board, currentPlayer);
      
      if (legalActions.length === 0) {
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }

      let action: OthelloAction | null = null;
      
      if (currentPlayer === 'B') {
        try {
          const searchPromise = alphaZeroAgent.searchBestActionAsync(board, currentPlayer);
          const searchResult = await Promise.race([
            searchPromise,
            new Promise<Awaited<typeof searchPromise>>((_, reject) => 
              setTimeout(() => reject(new Error('MCTS search timeout')), MCTS_SEARCH_TIMEOUT_MS)
            )
          ]);
          action = searchResult.action;
        } catch (error) {
          console.error(`AlphaZero动作选择错误: ${error}`);
          action = legalActions[Math.floor(Math.random() * legalActions.length)];
        }
      } else {
        action = opponent.chooseAction(board, currentPlayer);
      }

      if (action && legalActions.some((a: OthelloAction) => a.row === action!.row && a.col === action!.col)) {
        board = makeMove(board, action, currentPlayer);
        gameLength++;
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      } else {
        break;
      }
    }

    const { B, W } = countPieces(board);
    let winner: 'B' | 'W' | 'draw' = 'draw';
    if (B > W) winner = 'B';
    else if (W > B) winner = 'W';
    
    return {
      winner,
      alphaZeroScore: B,
      opponentScore: W
    };
  })();

  // 添加整体游戏超时
  return withTimeout(
    gamePromise,
    GAME_TIMEOUT_MS,
    `游戏超时（${GAME_TIMEOUT_MS / 1000 / 60}分钟）`
  );
}

async function evaluateModel(): Promise<void> {
  console.log('🚀 开始评估最佳AlphaZero模型...\n');
  console.log(`📁 模型路径: ${MODEL_PATH}\n`);
  console.log(`🔧 Worker模式: ${USE_WORKER_MODE ? '启用' : '禁用'}\n`);

  let network: any = null;

  // 如果启用Worker模式，创建Worker包装器
  if (USE_WORKER_MODE) {
    console.log('🔧 正在创建Worker线程网络...');
    try {
      network = new AlphaZeroNetworkWorkerWrapper();
      await network.loadModel(MODEL_PATH);
      console.log('✅ Worker线程网络已创建并加载模型\n');
    } catch (error) {
      console.error('❌ Worker模式初始化失败，回退到传统模式:', error);
      network = null;
    }
  }

  // 创建AlphaZero智能体（与训练时配置一致）
  const agentConfig: AlphaZeroAgentConfig = {
    ...DEFAULT_ALPHAZERO_AGENT_CONFIG,
    isTraining: false,
    verbose: false,
    mctsConfig: {
      ...DEFAULT_ALPHAZERO_AGENT_CONFIG.mctsConfig,
      numSimulations: 600  // 与训练时一致，确保评估结果准确
    },
    // 如果Worker模式可用，使用自定义网络实例
    customNetwork: network || undefined
  };

  const alphaZeroAgent = new AlphaZeroOthelloAgent(agentConfig);

  // 如果未使用Worker模式，需要加载模型
  if (!USE_WORKER_MODE || !network) {
    try {
      // 加载模型
      console.log('📥 正在加载模型...');
      await alphaZeroAgent.loadModel(MODEL_PATH);
      console.log('✅ 模型加载成功\n');
    } catch (error) {
      console.error('❌ 模型加载失败:', error);
      process.exit(1);
    }
  }

  // 创建对手
  const opponents = [
    { name: '随机策略', agent: new RandomOthelloAgent() },
    { name: '贪心策略', agent: new GreedyOthelloAgent() },
    { name: '启发式策略', agent: new HeuristicOthelloAgent() }
  ];

  const results: { [opponent: string]: { wins: number; losses: number; draws: number; total: number } } = {};

  // 初始化结果
  for (const opponent of opponents) {
    results[opponent.name] = { wins: 0, losses: 0, draws: 0, total: 0 };
  }

  // 对每个对手进行评估
  for (const opponent of opponents) {
    console.log(`\n🎮 评估 vs ${opponent.name} (${EVALUATION_GAMES}局)...`);
    
    for (let game = 1; game <= EVALUATION_GAMES; game++) {
      try {
        const result = await playGame(alphaZeroAgent, opponent.agent, opponent.name);
        
        if (result.winner === 'B') {
          results[opponent.name].wins++;
        } else if (result.winner === 'W') {
          results[opponent.name].losses++;
        } else {
          results[opponent.name].draws++;
        }
        results[opponent.name].total++;
        
        if (game % 5 === 0) {
          const winRate = (results[opponent.name].wins / results[opponent.name].total * 100).toFixed(1);
          console.log(`  进度: ${game}/${EVALUATION_GAMES} | 胜率: ${winRate}%`);
        }
      } catch (error) {
        console.error(`  ❌ 游戏 ${game} 失败:`, error);
        // 继续下一局
      }
    }
    
    const winRate = (results[opponent.name].wins / results[opponent.name].total * 100).toFixed(1);
    console.log(`✅ ${opponent.name} 评估完成: 胜率 ${winRate}% (${results[opponent.name].wins}胜/${results[opponent.name].losses}负/${results[opponent.name].draws}平)`);
  }

  // 输出总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 评估总结');
  console.log('='.repeat(60));
  
  for (const opponent of opponents) {
    const stats = results[opponent.name];
    const winRate = (stats.wins / stats.total * 100).toFixed(1);
    console.log(`${opponent.name}:`);
    console.log(`  胜率: ${winRate}%`);
    console.log(`  战绩: ${stats.wins}胜 / ${stats.losses}负 / ${stats.draws}平`);
    console.log('');
  }
  
  console.log('='.repeat(60));
  
  // 清理Worker资源
  if (USE_WORKER_MODE && network && typeof network.dispose === 'function') {
    console.log('\n🧹 正在清理Worker资源...');
    network.dispose();
    console.log('✅ Worker资源已清理');
  }
}

// 运行评估
evaluateModel().catch(error => {
  console.error('❌ 评估过程出错:', error);
  process.exit(1);
});

