/**
 * 简单的黑白棋游戏基准测试（不涉及神经网络）
 * 使用简单的AI策略（随机、贪心、启发式）来测试纯游戏逻辑的耗时
 */

import { 
  RandomOthelloAgent, 
  GreedyOthelloAgent, 
  HeuristicOthelloAgent 
} from '../../src/othello/strategy';
import { 
  createOthelloBoard, 
  getLegalActions, 
  makeMove, 
  isGameOver, 
  countPieces, 
  getWinner,
  OthelloPlayer,
  OthelloAction
} from '../../src/othello/core/game';

/**
 * 运行简单的游戏基准测试
 */
function runSimpleGameBenchmark(gameCount: number, agentType: 'random' | 'greedy' | 'heuristic' = 'random'): void {
  console.log('\n🚀 开始简单游戏基准测试（不涉及神经网络）...');
  console.log(`   总对局数: ${gameCount}`);
  console.log(`   策略类型: ${agentType}`);
  console.log('='.repeat(80));

  // 创建智能体
  let agentB: RandomOthelloAgent | GreedyOthelloAgent | HeuristicOthelloAgent;
  let agentW: RandomOthelloAgent | GreedyOthelloAgent | HeuristicOthelloAgent;

  switch (agentType) {
    case 'random':
      agentB = new RandomOthelloAgent();
      agentW = new RandomOthelloAgent();
      break;
    case 'greedy':
      agentB = new GreedyOthelloAgent();
      agentW = new GreedyOthelloAgent();
      break;
    case 'heuristic':
      agentB = new HeuristicOthelloAgent();
      agentW = new HeuristicOthelloAgent();
      break;
  }

  const startTime = Date.now();
  let totalMoves = 0;
  let blackWins = 0;
  let whiteWins = 0;
  let draws = 0;

  // 修改 playOthelloGame 以返回游戏长度
  for (let game = 0; game < gameCount; game++) {
    const gameStart = Date.now();
    
    // 使用修改后的游戏函数来获取游戏长度
    const { winner, moveCount } = playOthelloGameWithMoveCount(agentB, agentW);
    const gameDuration = (Date.now() - gameStart) / 1000;

    totalMoves += moveCount;

    if (winner === 'B') blackWins++;
    else if (winner === 'W') whiteWins++;
    else draws++;

    console.log(
      `[Benchmark] 第 ${game + 1}/${gameCount} 局 -> 胜者: ${winner} | 步数: ${moveCount} | 用时: ${gameDuration.toFixed(1)}秒`
    );
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log('='.repeat(80));
  console.log('📊 基准测试结果:');
  console.log(`   总运行时间: ${(totalTime / 60).toFixed(2)}分钟 (${totalTime.toFixed(1)}秒)`);
  console.log(`   平均每局时间: ${(totalTime / gameCount).toFixed(1)}秒`);
  console.log(`   平均每局步数: ${(totalMoves / gameCount).toFixed(1)}步`);
  console.log(`   平均每步耗时: ${(totalTime / totalMoves).toFixed(3)}秒`);
  console.log(`   胜率统计: 黑方 ${blackWins} | 白方 ${whiteWins} | 平局 ${draws}`);
  console.log('='.repeat(80));
}

/**
 * 修改后的游戏函数，返回游戏长度
 */
function playOthelloGameWithMoveCount(
  agentB: RandomOthelloAgent | GreedyOthelloAgent | HeuristicOthelloAgent,
  agentW: RandomOthelloAgent | GreedyOthelloAgent | HeuristicOthelloAgent
): { winner: 'B' | 'W' | 'Draw'; moveCount: number } {
  let board = createOthelloBoard();
  let currentPlayer: 'B' | 'W' = 'B';
  let passCount = 0;
  let moveCount = 0;
  const maxMoves = 60;

  while (moveCount < maxMoves && passCount < 2) {
    const actions = getLegalActions(board, currentPlayer);
    
    if (actions.length === 0) {
      passCount++;
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }

    passCount = 0;
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    
    if (action && actions.some(a => a.row === action.row && a.col === action.col)) {
      board = makeMove(board, action, currentPlayer);
      moveCount++;
    } else {
      passCount++;
    }

    currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
  }

  let winner = getWinner(board);
  if (winner === null) {
    const { B, W } = countPieces(board);
    if (B > W) winner = 'B';
    else if (W > B) winner = 'W';
    else winner = 'Draw';
  }

  return { winner, moveCount };
}

// 如果直接运行此文件
if (require.main === module) {
  const gameCount = Number(process.env.GAME_COUNT) || 100;
  const agentType = (process.env.AGENT_TYPE || 'random') as 'random' | 'greedy' | 'heuristic';
  
  runSimpleGameBenchmark(gameCount, agentType);
}

export { runSimpleGameBenchmark };

