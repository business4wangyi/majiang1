import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from '../othello-game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from '../othello-types';
import { RandomOthelloAgent, OthelloAgent } from './random-agent';
import * as fs from 'fs';

// 贪心AI：每次选择能翻转最多棋子的落子
class GreedyOthelloAgent implements OthelloAgent {
  constructor() {}
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;
    let maxFlips = -1;
    let bestAction = actions[0];
    for (const action of actions) {
      let flips = 0;
      const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
      for (const [dx, dy] of [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0], [1, 1]
      ]) {
        let x = action.row + dx, y = action.col + dy;
        let count = 0;
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
          x += dx;
          y += dy;
          count++;
        }
        if (count > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
          flips += count;
        }
      }
      if (flips > maxFlips) {
        maxFlips = flips;
        bestAction = action;
      }
    }
    return bestAction;
  }
}

// QLearningOthelloAgent（完整Q学习实现）
class QLearningOthelloAgent implements OthelloAgent {
  private Q: Record<string, number[]> = {};
  public epsilon: number;
  private alpha: number;
  private gamma: number;
  private player: OthelloPlayer;
  constructor(player: OthelloPlayer, epsilon = 0.1, alpha = 0.5, gamma = 0.9) {
    this.player = player;
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.gamma = gamma;
  }
  private boardToKey(board: OthelloBoard): string {
    return board.flat().map(cell => cell ?? '-').join('');
  }
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;
    const key = this.boardToKey(board);
    if (!this.Q[key]) this.Q[key] = Array(actions.length).fill(0);
    if (Math.random() < this.epsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      const idx = this.Q[key].reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
      return actions[idx];
    }
  }
  trainEpisode(opponent: OthelloAgent): OthelloPlayer | 'Draw' {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';
    let history: {key: string, actionIdx: number}[] = [];
    while (!isGameOver(board)) {
      const actions = getLegalActions(board, currentPlayer);
      if (actions.length === 0) {
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }
      const key = this.boardToKey(board);
      let action: OthelloAction;
      let actionIdx: number;
      if (currentPlayer === this.player) {
        if (!this.Q[key]) this.Q[key] = Array(actions.length).fill(0);
        if (Math.random() < this.epsilon) {
          actionIdx = Math.floor(Math.random() * actions.length);
        } else {
          actionIdx = this.Q[key].reduce((best, val, i, arr) => val > arr[best] ? i : best, 0);
        }
        action = actions[actionIdx];
        history.push({key, actionIdx});
      } else {
        action = opponent.chooseAction(board, currentPlayer)!;
      }
      board = makeMove(board, action, currentPlayer);
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    }
    // 结算奖励
    let winner = getWinner(board);
    if (winner === null) {
      const { B, W } = countPieces(board);
      if (B > W) winner = 'B';
      else if (W > B) winner = 'W';
      else winner = 'Draw';
    }
    let reward = 0;
    if (winner === this.player) reward = 1;
    else if (winner !== 'Draw') reward = -1;
    // Q值回传
    for (let i = history.length - 1; i >= 0; i--) {
      const {key, actionIdx} = history[i];
      this.Q[key][actionIdx] += this.alpha * (reward - this.Q[key][actionIdx]);
      reward = this.Q[key][actionIdx] * this.gamma;
    }
    return winner;
  }
  saveQTable(filepath: string) {
    fs.writeFileSync(filepath, JSON.stringify(this.Q), 'utf-8');
  }
  loadQTable(filepath: string) {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf-8');
      this.Q = JSON.parse(data);
    }
  }
}

// 启发式贪心AI：综合考虑角、边、行动力等
class HeuristicOthelloAgent implements OthelloAgent {
  constructor() {}
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;
    // 角权重最高，边次之，行动力（落子后可行动数）加分
    const cornerSet = new Set(['0,0','0,7','7,0','7,7']);
    let bestScore = -Infinity;
    let bestAction = actions[0];
    for (const action of actions) {
      let score = 0;
      const posKey = `${action.row},${action.col}`;
      if (cornerSet.has(posKey)) score += 100;
      else if (action.row === 0 || action.row === 7 || action.col === 0 || action.col === 7) score += 10;
      // 落子后行动力
      const newBoard = makeMove(board, action, player);
      const nextActions = getLegalActions(newBoard, player);
      score += nextActions.length;
      // 翻子数
      let flips = 0;
      const opponent: OthelloPlayer = player === 'B' ? 'W' : 'B';
      for (const [dx, dy] of [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0], [1, 1]
      ]) {
        let x = action.row + dx, y = action.col + dy;
        let count = 0;
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
          x += dx;
          y += dy;
          count++;
        }
        if (count > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
          flips += count;
        }
      }
      score += flips;
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    return bestAction;
  }
}

// Minimax/AlphaBeta AI
class MinimaxOthelloAgent implements OthelloAgent {
  private maxDepth: number;
  constructor(maxDepth = 5) {
    this.maxDepth = maxDepth;
  }
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;
    let bestScore = -Infinity;
    let bestAction = actions[0];
    for (const action of actions) {
      const newBoard = makeMove(board, action, player);
      const score = this.alphabeta(newBoard, this.maxDepth - 1, this.getOpponent(player), player, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    return bestAction;
  }
  alphabeta(board: OthelloBoard, depth: number, currentPlayer: OthelloPlayer, aiPlayer: OthelloPlayer, alpha: number, beta: number): number {
    if (depth === 0 || isGameOver(board)) {
      return this.evaluate(board, aiPlayer);
    }
    const actions = getLegalActions(board, currentPlayer);
    if (actions.length === 0) {
      // 无合法落子，跳过
      return this.alphabeta(board, depth - 1, this.getOpponent(currentPlayer), aiPlayer, alpha, beta);
    }
    if (currentPlayer === aiPlayer) {
      let value = -Infinity;
      for (const action of actions) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.max(value, this.alphabeta(newBoard, depth - 1, this.getOpponent(currentPlayer), aiPlayer, alpha, beta));
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return value;
    } else {
      let value = Infinity;
      for (const action of actions) {
        const newBoard = makeMove(board, action, currentPlayer);
        value = Math.min(value, this.alphabeta(newBoard, depth - 1, this.getOpponent(currentPlayer), aiPlayer, alpha, beta));
        beta = Math.min(beta, value);
        if (beta <= alpha) break;
      }
      return value;
    }
  }
  evaluate(board: OthelloBoard, player: OthelloPlayer): number {
    // 综合棋子差、角落、边、行动力、稳定子
    const { B, W } = countPieces(board);
    const diff = player === 'B' ? B - W : W - B;
    const corners = [board[0][0], board[0][7], board[7][0], board[7][7]];
    let cornerScore = 0;
    for (const c of corners) {
      if (c === player) cornerScore += 50;
      else if (c && c !== player) cornerScore -= 50;
    }
    // 边权重
    let edgeScore = 0;
    for (let i = 1; i < 7; i++) {
      if (board[0][i] === player) edgeScore += 5;
      else if (board[0][i] && board[0][i] !== player) edgeScore -= 5;
      if (board[7][i] === player) edgeScore += 5;
      else if (board[7][i] && board[7][i] !== player) edgeScore -= 5;
      if (board[i][0] === player) edgeScore += 5;
      else if (board[i][0] && board[i][0] !== player) edgeScore -= 5;
      if (board[i][7] === player) edgeScore += 5;
      else if (board[i][7] && board[i][7] !== player) edgeScore -= 5;
    }
    // 行动力（可落子数）
    const mobility = getLegalActions(board, player).length;
    // 稳定子（角落连通的同色子）
    let stable = 0;
    for (const [r, c] of [[0,0],[0,7],[7,0],[7,7]]) {
      if (board[r][c] === player) {
        // 只简单统计角落本身
        stable += 10;
      }
    }
    return diff + cornerScore + edgeScore + mobility + stable;
  }
  getOpponent(player: OthelloPlayer): OthelloPlayer {
    return player === 'B' ? 'W' : 'B';
  }
}

function printBoard(board: OthelloBoard) {
  console.log('  0 1 2 3 4 5 6 7');
  for (let i = 0; i < 8; i++) {
    let row = '' + i + ' ';
    for (let j = 0; j < 8; j++) {
      row += (board[i][j] || '-') + ' ';
    }
    console.log(row);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playOthelloGameWithAnimation(agentB: OthelloAgent, agentW: OthelloAgent, delay = 300) {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  console.clear();
  console.log('初始棋盘:');
  printBoard(board);
  await sleep(delay);
  while (!isGameOver(board)) {
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    if (action) {
      board = makeMove(board, action, currentPlayer);
      passCount = 0;
      console.clear();
      console.log(`\n${currentPlayer} 落子: (${action.row},${action.col})`);
      printBoard(board);
      const { B, W } = countPieces(board);
      console.log(`当前得分: B=${B}, W=${W}`);
      await sleep(delay);
    } else {
      passCount++;
      console.log(`${currentPlayer} 无合法落子，跳过。`);
      await sleep(delay);
      if (passCount >= 2) break;
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
  console.log(`\n对局结束！胜者: ${winner}`);
}

// 无动画的playOthelloGame（用于批量对局统计）
function playOthelloGame(agentB: OthelloAgent, agentW: OthelloAgent, printDetail = false): OthelloPlayer | 'Draw' {
  let board = createOthelloBoard();
  let currentPlayer: OthelloPlayer = 'B';
  let passCount = 0;
  if (printDetail) {
    console.log('初始棋盘:');
    printBoard(board);
  }
  while (!isGameOver(board)) {
    const agent = currentPlayer === 'B' ? agentB : agentW;
    const action = agent.chooseAction(board, currentPlayer);
    if (action) {
      board = makeMove(board, action, currentPlayer);
      passCount = 0;
      if (printDetail) {
        console.log(`\n${currentPlayer} 落子: (${action.row},${action.col})`);
        printBoard(board);
        const { B, W } = countPieces(board);
        console.log(`当前得分: B=${B}, W=${W}`);
      }
    } else {
      passCount++;
      if (printDetail) console.log(`${currentPlayer} 无合法落子，跳过。`);
      if (passCount >= 2) break;
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
  return winner;
}

// 批量对局统计
function batchBattle(agentB: OthelloAgent, agentW: OthelloAgent, games = 100) {
  let bWin = 0, wWin = 0, draw = 0;
  const startTime = Date.now();
  for (let i = 0; i < games; i++) {
    const winner = playOthelloGame(agentB, agentW, false);
    if (winner === 'B') bWin++;
    else if (winner === 'W') wWin++;
    else draw++;
  }
  const endTime = Date.now();
  const duration = endTime - startTime;
  console.log(`\n${agentB.constructor.name} (B) vs ${agentW.constructor.name} (W) 批量对局${games}场:`);
  console.log(`B胜率: ${(bWin/games*100).toFixed(1)}% | W胜率: ${(wWin/games*100).toFixed(1)}% | 平局率: ${(draw/games*100).toFixed(1)}%`);
  console.log(`平均每局耗时: ${(duration/games).toFixed(2)} 毫秒`);
}

// 批量对局统计
function runBatchBattles() {
  const agentTypes = [RandomOthelloAgent, GreedyOthelloAgent, HeuristicOthelloAgent, MinimaxOthelloAgent, QLearningOthelloAgent];
  for (const BType of agentTypes) {
    for (const WType of agentTypes) {
      const agentB = BType === QLearningOthelloAgent
        ? new QLearningOthelloAgent('B', 0.1, 0.5, 0.9)
        : new (BType as { new(): OthelloAgent })();
      const agentW = WType === QLearningOthelloAgent
        ? new QLearningOthelloAgent('W', 0.1, 0.5, 0.9)
        : new (WType as { new(): OthelloAgent })();
      batchBattle(agentB, agentW, 100);
    }
  }
}

// 入口：支持命令行参数配置运行模式
function parseArgs() {
  const args = process.argv.slice(2);
  const modeArg = args.find(arg => arg.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'batch';
  return { mode };
}

if (require.main === module) {
  (async () => {
    const { mode } = parseArgs();
    if (mode === 'batch') {
      runBatchBattles();
    } else if (mode === 'animation') {
      const agentB = new HeuristicOthelloAgent();
      const agentW = new MinimaxOthelloAgent(3);
      await playOthelloGameWithAnimation(agentB, agentW, 300);
    } else if (mode === 'web') {
      console.log('网页可视化入口：');
      console.log('1. 推荐使用React/Vue等前端框架实现棋盘UI。');
      console.log('2. 可通过RESTful API或WebSocket与本AI后端交互。');
      console.log('3. 建议后端暴露接口：/ai-move、/new-game、/train、/qtable 等。');
      console.log('4. 你可以用Express/Koa等Node.js框架快速搭建API服务。');
      console.log('5. 如需前端模板或API示例，请告知！');
    } else {
      console.log('未知模式，请使用 --mode=batch | --mode=animation | --mode=web');
    }
  })();
}

export { HeuristicOthelloAgent, MinimaxOthelloAgent, GreedyOthelloAgent, QLearningOthelloAgent }; 