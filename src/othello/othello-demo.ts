// {{ AURA-X: Add - 游戏演示和逻辑功能，从strategy目录移出. Approval: 寸止(ID:1735819200). }}

import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import { OthelloPlayer, OthelloBoard } from './othello-types';
import { 
  RandomOthelloAgent, 
  GreedyOthelloAgent, 
  HeuristicOthelloAgent, 
  MinimaxOthelloAgent, 
  QLearningOthelloAgent,
  OthelloAgent 
} from './strategy';

/**
 * 游戏演示和逻辑功能
 * 包含游戏可视化、批量测试、命令行接口等功能
 */

function printBoard(board: OthelloBoard) {
  console.log('  0 1 2 3 4 5 6 7');
  for (let i = 0; i < 8; i++) {
    let row = `${i} `;
    for (let j = 0; j < 8; j++) {
      row += (board[i][j] || '.') + ' ';
    }
    console.log(row);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playOthelloGameWithAnimation(agentB: OthelloAgent, agentW: OthelloAgent, delay = 1000): Promise<OthelloPlayer | 'Draw'> {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;

  console.log('游戏开始！');
  printBoard(board);

  while (!isGameOver(board) && passCount < 2) {
    const actions = getLegalActions(board, currentPlayer);
    
    if (actions.length === 0) {
      console.log(`${currentPlayer} 无合法落子，跳过`);
      passCount++;
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }

    passCount = 0;
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    
    if (action) {
      console.log(`${currentPlayer} 落子: (${action.row}, ${action.col})`);
      board = makeMove(board, action, currentPlayer);
      
      await sleep(delay);
      printBoard(board);
      
      const counts = countPieces(board);
      console.log(`当前棋子数 - B: ${counts.B}, W: ${counts.W}`);
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

  console.log(`游戏结束！获胜者: ${winner}`);
  return winner;
}

function playOthelloGame(agentB: OthelloAgent, agentW: OthelloAgent, verbose = false): OthelloPlayer | 'Draw' {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  let moveCount = 0;
  const maxMoves = 60;

  if (verbose) {
    console.log('游戏开始！');
    printBoard(board);
  }

  while (moveCount < maxMoves && passCount < 2) {
    const actions = getLegalActions(board, currentPlayer);
    
    if (actions.length === 0) {
      if (verbose) console.log(`${currentPlayer} 无合法落子，跳过`);
      passCount++;
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      continue;
    }

    passCount = 0;
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    
    if (action && actions.some(a => a.row === action.row && a.col === action.col)) {
      if (verbose) console.log(`${currentPlayer} 落子: (${action.row}, ${action.col})`);
      board = makeMove(board, action, currentPlayer);
      moveCount++;
      
      if (verbose) {
        printBoard(board);
        const counts = countPieces(board);
        console.log(`当前棋子数 - B: ${counts.B}, W: ${counts.W}`);
      }
    } else {
      if (verbose) console.log(`${currentPlayer} 选择了无效动作，跳过`);
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

  if (verbose) console.log(`游戏结束！获胜者: ${winner}`);
  return winner;
}

function batchBattle(agentB: OthelloAgent, agentW: OthelloAgent, games: number): {
  bWins: number;
  wWins: number;
  draws: number;
} {
  let bWins = 0, wWins = 0, draws = 0;
  
  for (let i = 0; i < games; i++) {
    const result = playOthelloGame(agentB, agentW, false);
    if (result === 'B') bWins++;
    else if (result === 'W') wWins++;
    else draws++;
  }
  
  return { bWins, wWins, draws };
}

function runBatchBattles() {
  const agents = {
    random: new RandomOthelloAgent(),
    greedy: new GreedyOthelloAgent(),
    heuristic: new HeuristicOthelloAgent(),
    minimax: new MinimaxOthelloAgent(3),
    qlearning: new QLearningOthelloAgent('B')
  };

  const agentNames = Object.keys(agents);
  const games = 100;

  console.log(`批量对战测试 (${games}局/对)`);
  console.log('='.repeat(50));

  for (let i = 0; i < agentNames.length; i++) {
    for (let j = i + 1; j < agentNames.length; j++) {
      const nameB = agentNames[i];
      const nameW = agentNames[j];
      const agentB = agents[nameB as keyof typeof agents];
      const agentW = agents[nameW as keyof typeof agents];

      const result = batchBattle(agentB, agentW, games);
      const bWinRate = (result.bWins / games * 100).toFixed(1);
      const wWinRate = (result.wWins / games * 100).toFixed(1);

      console.log(`${nameB} vs ${nameW}: ${result.bWins}-${result.wWins}-${result.draws} (${bWinRate}%-${wWinRate}%)`);
    }
  }
}

function parseArgs(): { mode: string; agent1?: string; agent2?: string } {
  const args = process.argv.slice(2);
  const mode = args[0] || 'demo';
  const agent1 = args[1];
  const agent2 = args[2];
  return { mode, agent1, agent2 };
}

// 主程序入口
if (require.main === module) {
  const { mode, agent1, agent2 } = parseArgs();

  switch (mode) {
    case 'demo':
      console.log('演示模式：启发式 vs 贪心');
      playOthelloGameWithAnimation(
        new HeuristicOthelloAgent(),
        new GreedyOthelloAgent(),
        500
      );
      break;

    case 'batch':
      runBatchBattles();
      break;

    case 'vs':
      if (agent1 && agent2) {
        const agents: Record<string, OthelloAgent> = {
          random: new RandomOthelloAgent(),
          greedy: new GreedyOthelloAgent(),
          heuristic: new HeuristicOthelloAgent(),
          minimax: new MinimaxOthelloAgent(3),
          qlearning: new QLearningOthelloAgent('B')
        };

        const agentB = agents[agent1];
        const agentW = agents[agent2];

        if (agentB && agentW) {
          console.log(`对战模式：${agent1} vs ${agent2}`);
          playOthelloGameWithAnimation(agentB, agentW, 1000);
        } else {
          console.log('可用策略：random, greedy, heuristic, minimax, qlearning');
        }
      } else {
        console.log('用法：npm run othello vs <agent1> <agent2>');
      }
      break;

    default:
      console.log('可用模式：');
      console.log('  demo - 演示游戏');
      console.log('  batch - 批量测试');
      console.log('  vs <agent1> <agent2> - 指定对战');
  }
}

// 导出游戏逻辑函数
export { 
  printBoard, 
  sleep, 
  playOthelloGameWithAnimation, 
  playOthelloGame, 
  batchBattle, 
  runBatchBattles 
};

// 重新导出策略类（为了向后兼容）
export { 
  HeuristicOthelloAgent, 
  MinimaxOthelloAgent, 
  GreedyOthelloAgent, 
  QLearningOthelloAgent,
  RandomOthelloAgent,
  OthelloAgent
} from './strategy';
