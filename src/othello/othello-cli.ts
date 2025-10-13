import * as readline from 'readline';
import { OthelloBoard, OthelloPlayer, OthelloAction, OthelloCell } from './othello-types';
import { createOthelloBoard, getLegalActions, makeMove, isGameOver, countPieces, getWinner } from './othello-game';
import {
  HeuristicOthelloAgent,
  MinimaxOthelloAgent,
  QLearningOthelloAgent,
  GreedyOthelloAgent,
  RandomOthelloAgent,
  OthelloAgent,
  AlphaZeroOthelloAgent,
  OptimizationManager
} from './strategy';
import {
  AlphaZeroConfigGuide,
  PerformanceLevel,
  ApplicationScenario
} from './alphazero-config-guide';

// {{ AURA-X: Add - 创建Othello CLI界面，基于井字棋AI助手模式. Approval: 寸止(ID:1735819200). }}

interface Position {
  row: number;
  col: number;
}

interface Move {
  row: number;
  col: number;
  player: OthelloPlayer;
}

interface AIDecision {
  action: OthelloAction;
  confidence: number;
  reasoning: string;
  strategyName: string;
}

// 简化的AI引擎，用于CLI界面
class SimplifiedOthelloAI {
  private agents: Map<string, OthelloAgent>;

  constructor() {
    this.agents = new Map([
      ['random', new RandomOthelloAgent()],
      ['greedy', new GreedyOthelloAgent()],
      ['heuristic', new HeuristicOthelloAgent()],
      ['minimax', new MinimaxOthelloAgent(3)],
      ['qlearning', new QLearningOthelloAgent('B', 0.1, 0.5, 0.9)]
    ]);
  }

  getDecision(board: OthelloBoard, player: OthelloPlayer, strategy: string = 'heuristic'): AIDecision | null {
    const legalMoves = getLegalActions(board, player);
    if (legalMoves.length === 0) return null;

    const agent = this.agents.get(strategy);
    if (!agent) {
      throw new Error(`未知策略: ${strategy}`);
    }

    const action = agent.chooseAction(board, player);
    if (!action) return null;

    // 计算置信度和推理
    const confidence = this.calculateConfidence(board, action, player, strategy);
    const reasoning = this.generateReasoning(board, action, player, strategy);
    const strategyName = this.getStrategyName(strategy);

    return {
      action,
      confidence,
      reasoning,
      strategyName
    };
  }

  private calculateConfidence(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer, strategy: string): number {
    // 基于策略类型和位置重要性计算置信度
    const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
    const edges = [];
    for (let i = 0; i < 8; i++) {
      if (i !== 0 && i !== 7) {
        edges.push([0, i], [7, i], [i, 0], [i, 7]);
      }
    }

    let baseConfidence = 0.5;

    // 角落位置加分
    if (corners.some(([r, c]) => r === action.row && c === action.col)) {
      baseConfidence += 0.3;
    }
    // 边缘位置加分
    else if (edges.some(([r, c]) => r === action.row && c === action.col)) {
      baseConfidence += 0.1;
    }

    // 策略特定调整
    switch (strategy) {
      case 'minimax':
        baseConfidence += 0.2;
        break;
      case 'heuristic':
        baseConfidence += 0.15;
        break;
      case 'greedy':
        baseConfidence += 0.1;
        break;
      case 'random':
        baseConfidence = 0.3;
        break;
    }

    return Math.min(0.95, baseConfidence);
  }

  private generateReasoning(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer, strategy: string): string {
    const { row, col } = action;
    const position = `(${row + 1}, ${col + 1})`;
    
    // 检查是否是角落
    const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
    if (corners.some(([r, c]) => r === row && c === col)) {
      return `选择角落位置${position}，这是最稳定的位置，不会被翻转`;
    }

    // 检查能翻转多少棋子
    const newBoard = makeMove(board, action, player);
    const originalCount = countPieces(board)[player];
    const newCount = countPieces(newBoard)[player];
    const flipped = newCount - originalCount - 1; // 减去新下的棋子

    switch (strategy) {
      case 'minimax':
        return `通过深度搜索分析，位置${position}在未来几步中具有最佳价值，可翻转${flipped}个棋子`;
      case 'heuristic':
        return `基于启发式评估，位置${position}具有良好的战略价值，可翻转${flipped}个棋子`;
      case 'greedy':
        return `选择能翻转最多棋子的位置${position}，可翻转${flipped}个棋子`;
      case 'random':
        return `随机选择合法位置${position}，可翻转${flipped}个棋子`;
      default:
        return `选择位置${position}，可翻转${flipped}个棋子`;
    }
  }

  private getStrategyName(strategy: string): string {
    const names: { [key: string]: string } = {
      'random': '🎲 随机策略',
      'greedy': '🍖 贪心策略',
      'heuristic': '🧠 启发式策略',
      'minimax': '🎯 极小极大策略',
      'qlearning': '🤖 Q学习策略'
    };
    return names[strategy] || strategy;
  }

  checkWinner(board: OthelloBoard): OthelloPlayer | 'Draw' | null {
    return getWinner(board);
  }

  getLegalMoves(board: OthelloBoard, player: OthelloPlayer): OthelloAction[] {
    return getLegalActions(board, player);
  }

  copyBoard(board: OthelloBoard): OthelloBoard {
    return board.map(row => [...row]);
  }
}

// 主程序类
class OthelloCLI {
  private rl: readline.Interface;
  private ai: SimplifiedOthelloAI;
  private currentBoard: OthelloBoard;
  private currentPlayer: OthelloPlayer;
  private moveHistory: Move[];
  private isInteractiveMode: boolean;
  private isDemoMode: boolean;
  private gameMode: 'human-vs-ai' | 'ai-vs-ai' | 'human-vs-human';

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.ai = new SimplifiedOthelloAI();
    this.currentBoard = createOthelloBoard();
    this.currentPlayer = 'B';
    this.moveHistory = [];
    this.isInteractiveMode = false;
    this.isDemoMode = false;
    this.gameMode = 'human-vs-ai';
  }

  async start(): Promise<void> {
    this.showWelcome();
    this.showHelp();
    await this.mainLoop();
  }

  private showWelcome(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                                                       ║');
    console.log('    ║            🎮 Othello AI助手 CLI版本                  ║');
    console.log('    ║                                                       ║');
    console.log('    ║              基于AURA-X协议构建                       ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🌟 功能特色：');
    console.log('   • 🤖 多种AI策略（随机、贪心、启发式、极小极大、Q学习）');
    console.log('   • 🎯 智能分析和建议');
    console.log('   • 🎮 多种游戏模式（人机对战、AI对战、人人对战）');
    console.log('   • 📊 详细的策略解释');
    console.log('   • 🔄 撤销和重置功能');
    console.log('');
  }

  private showHelp(): void {
    console.log('📖 命令帮助：');
    console.log('');
    console.log('🎮 游戏模式：');
    console.log('   play        - 开始人机对战');
    console.log('   ai-battle   - 观看AI对战');
    console.log('   demo        - 演示模式（手动下棋+AI分析）');
    console.log('');
    console.log('🔧 游戏控制：');
    console.log('   board       - 显示当前棋盘');
    console.log('   analyze     - 分析当前局面');
    console.log('   undo        - 撤销上一步');
    console.log('   reset       - 重置棋盘');
    console.log('');
    console.log('📚 信息查看：');
    console.log('   rules       - 查看游戏规则');
    console.log('   strategies  - 查看AI策略说明');
    console.log('   help        - 显示此帮助');
    console.log('   quit        - 退出程序');
    console.log('');
    console.log('🧠 AlphaZero工具：');
    console.log('   alphazero-config  - AlphaZero配置指南');
    console.log('   hyperopt-quick    - 快速超参数优化');
    console.log('   hyperopt-standard - 标准超参数优化');
    console.log('   config-recommend  - 配置推荐系统');
    console.log('');
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private async mainLoop(): Promise<void> {
    while (true) {
      try {
        const input = await this.question('请输入命令: ');
        const cmd = input.toLowerCase().trim();

        if (cmd === 'quit' || cmd === 'exit') {
          console.log('👋 感谢使用Othello AI助手！再见！');
          break;
        } else if (cmd === 'help') {
          this.showHelp();
        } else if (cmd === 'rules') {
          this.showRules();
        } else if (cmd === 'strategies') {
          this.showStrategies();
        } else if (cmd === 'play') {
          await this.startInteractiveMode();
        } else if (cmd === 'ai-battle') {
          await this.startAIBattle();
        } else if (cmd === 'demo') {
          await this.startDemoMode();
        } else if (cmd === 'reset') {
          this.resetBoard();
        } else if (cmd === 'undo') {
          this.undoLastMove();
        } else if (cmd === 'analyze') {
          await this.analyzeCurrentBoard();
        } else if (cmd === 'board') {
          this.showCurrentBoard();
        } else if (cmd === 'alphazero-config') {
          await this.showAlphaZeroConfigGuide();
        } else if (cmd === 'hyperopt-quick') {
          await this.runQuickHyperoptimization();
        } else if (cmd === 'hyperopt-standard') {
          await this.runStandardHyperoptimization();
        } else if (cmd === 'config-recommend') {
          await this.showConfigRecommendation();
        } else if (this.isInteractiveMode && this.isValidMoveInput(input)) {
          await this.handleMoveInput(input);
        } else {
          console.log('❌ 无效输入，请输入 help 查看帮助\n');
        }
      } catch (error) {
        console.error('❌ 错误:', (error as Error).message);
      }
    }

    this.rl.close();
  }

  private showRules(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                    📖 Othello游戏规则                 ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    console.log('    ║  🎯 目标：拥有更多自己颜色的棋子                      ║');
    console.log('    ║                                                       ║');
    console.log('    ║  📋 规则：                                            ║');
    console.log('    ║  1. 黑棋先手，白棋后手                                ║');
    console.log('    ║  2. 必须在能夹住对方棋子的位置下棋                    ║');
    console.log('    ║  3. 夹住的对方棋子全部翻转为己方颜色                  ║');
    console.log('    ║  4. 如果无法下棋则跳过回合                            ║');
    console.log('    ║  5. 双方都无法下棋时游戏结束                          ║');
    console.log('    ║                                                       ║');
    console.log('    ║  💡 策略提示：                                        ║');
    console.log('    ║  • 角落是最稳定的位置                                ║');
    console.log('    ║  • 避免给对手角落机会                                ║');
    console.log('    ║  • 控制边缘有助于后期优势                            ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private showStrategies(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                   🤖 AI策略说明                       ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    console.log('    ║  🎲 随机策略：随机选择合法位置                        ║');
    console.log('    ║     适合：初学者练习，增加游戏随机性                  ║');
    console.log('    ║                                                       ║');
    console.log('    ║  🍖 贪心策略：选择能翻转最多棋子的位置                ║');
    console.log('    ║     适合：快速游戏，短期收益最大化                    ║');
    console.log('    ║                                                       ║');
    console.log('    ║  🧠 启发式策略：综合考虑位置价值和棋子数量            ║');
    console.log('    ║     适合：平衡的游戏体验，中等难度                    ║');
    console.log('    ║                                                       ║');
    console.log('    ║  🎯 极小极大策略：深度搜索最优解                      ║');
    console.log('    ║     适合：高难度挑战，最强AI对手                      ║');
    console.log('    ║                                                       ║');
    console.log('    ║  🤖 Q学习策略：基于强化学习的自适应策略               ║');
    console.log('    ║     适合：体验机器学习AI的决策过程                    ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private resetBoard(): void {
    this.currentBoard = createOthelloBoard();
    this.currentPlayer = 'B';
    this.moveHistory = [];
    console.log('');
    console.log('    ╔═══════════════════════════════════════╗');
    console.log('    ║            🔄 棋盘已重置               ║');
    console.log('    ║         游戏重新开始！                 ║');
    console.log('    ╚═══════════════════════════════════════╝');

    if (this.isInteractiveMode || this.isDemoMode) {
      this.showCurrentBoard();
    }
  }

  private undoLastMove(): void {
    if (this.moveHistory.length === 0) {
      console.log('❌ 没有可撤销的移动');
      return;
    }

    // 重建棋盘状态
    this.currentBoard = createOthelloBoard();
    const lastMove = this.moveHistory.pop()!;

    // 重新执行除最后一步外的所有移动
    for (const move of this.moveHistory) {
      this.currentBoard = makeMove(this.currentBoard, { row: move.row, col: move.col }, move.player);
    }

    // 恢复到上一个玩家
    this.currentPlayer = lastMove.player;

    console.log('');
    console.log('    ╔═══════════════════════════════════════╗');
    console.log('    ║            ↩️  撤销成功               ║');
    console.log(`    ║     撤销了 ${lastMove.player === 'B' ? '●' : '○'} 在位置(${lastMove.row + 1}, ${lastMove.col + 1})的移动    ║`);
    console.log('    ╚═══════════════════════════════════════╝');

    if (this.isInteractiveMode || this.isDemoMode) {
      this.showCurrentBoard();
    }
  }

  private showCurrentBoard(): void {
    console.log('\n📋 当前棋盘：');
    this.displayBoard(this.currentBoard);
    const counts = countPieces(this.currentBoard);
    console.log(`\n🎯 当前玩家：${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'}`);
    console.log(`📊 棋子统计：● 黑棋 ${counts.B} | ○ 白棋 ${counts.W}`);
  }

  private displayBoard(board: OthelloBoard): void {
    console.log('');
    console.log('    ┌─────────────────────────────────────────┐');
    console.log('    │              Othello 棋盘                │');
    console.log('    ├─────────────────────────────────────────┤');
    console.log('    │     1   2   3   4   5   6   7   8       │');
    console.log('    │   ┌───┬───┬───┬───┬───┬───┬───┬───┐     │');

    for (let row = 0; row < 8; row++) {
      let line = `    │ ${row + 1} │`;

      for (let col = 0; col < 8; col++) {
        const cell = this.formatCell(board[row][col]);
        line += ` ${cell} │`;
      }

      line += '     │';
      console.log(line);

      if (row < 7) {
        console.log('    │   ├───┼───┼───┼───┼───┼───┼───┼───┤     │');
      }
    }

    console.log('    │   └───┴───┴───┴───┴───┴───┴───┴───┘     │');
    console.log('    │                                         │');
    console.log('    │ 输入格式: a1, 2,3, 或 1-64              │');
    console.log('    └─────────────────────────────────────────┘');
  }

  private formatCell(cell: OthelloCell): string {
    if (cell === 'B') return '●';
    if (cell === 'W') return '○';
    return ' ';
  }

  private async analyzeCurrentBoard(): Promise<void> {
    const legalMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);

    if (legalMoves.length === 0) {
      console.log(`\n❌ ${this.currentPlayer === 'B' ? '黑棋' : '白棋'}没有合法移动`);
      return;
    }

    console.log('\n🤖 AI分析当前局面：');
    await this.performAIAnalysis(this.currentBoard, this.currentPlayer);
  }

  private async performAIAnalysis(board: OthelloBoard, currentPlayer: OthelloPlayer): Promise<void> {
    const strategies = ['heuristic', 'minimax', 'greedy', 'random'];

    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                    🤖 AI智能分析                      ║');
    console.log('    ║                  (多策略对比)                         ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');

    for (const strategy of strategies) {
      try {
        const decision = this.ai.getDecision(board, currentPlayer, strategy);
        if (decision) {
          console.log(`    ║  ${decision.strategyName}：                           ║`);
          console.log(`    ║    推荐位置：(${decision.action.row + 1}, ${decision.action.col + 1})                        ║`);
          console.log(`    ║    置信度：${(decision.confidence * 100).toFixed(1)}%                           ║`);
          console.log(`    ║    理由：${decision.reasoning.substring(0, 30)}...    ║`);
          console.log('    ║                                                       ║');
        }
      } catch (error) {
        console.log(`    ║  ${strategy}策略分析失败：${error}                     ║`);
      }
    }

    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private isValidMoveInput(input: string): boolean {
    // 支持多种输入格式：a1, 2,3, 1-64
    const letterCoord = /^[a-h][1-8]$/i;
    const numberCoord = /^[1-8],[1-8]$/;
    const positionNumber = /^[1-9]$|^[1-5][0-9]$|^6[0-4]$/;

    return letterCoord.test(input) || numberCoord.test(input) || positionNumber.test(input);
  }

  private parsePosition(input: string): Position {
    input = input.toLowerCase().trim();

    // 字母坐标格式 (a1-h8)
    if (/^[a-h][1-8]$/.test(input)) {
      const col = input.charCodeAt(0) - 'a'.charCodeAt(0);
      const row = parseInt(input[1]) - 1;
      return { row, col };
    }

    // 数字坐标格式 (1,1-8,8)
    if (/^[1-8],[1-8]$/.test(input)) {
      const [rowStr, colStr] = input.split(',');
      const row = parseInt(rowStr) - 1;
      const col = parseInt(colStr) - 1;
      return { row, col };
    }

    // 位置编号格式 (1-64)
    if (/^[1-9]$|^[1-5][0-9]$|^6[0-4]$/.test(input)) {
      const pos = parseInt(input) - 1;
      const row = Math.floor(pos / 8);
      const col = pos % 8;
      return { row, col };
    }

    throw new Error('无效的位置格式');
  }

  private formatPosition(position: Position): string {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const letter = letters[position.col];
    const number = position.row + 1;
    const posNumber = position.row * 8 + position.col + 1;
    return `${letter}${number} (${position.row + 1},${position.col + 1}) [${posNumber}]`;
  }

  private async startInteractiveMode(): Promise<void> {
    console.log('\n🎮 进入人机对战模式');
    console.log('='.repeat(50));
    this.isInteractiveMode = true;
    this.gameMode = 'human-vs-ai';
    this.resetBoard();
    this.showCurrentBoard();
    this.showPositionGuide();
    console.log('\n💡 输入位置来下棋，或输入命令（quit返回主菜单）');

    while (this.isInteractiveMode) {
      try {
        const input = await this.question('请输入位置或命令: ');
        const cmd = input.toLowerCase().trim();

        if (cmd === 'quit') {
          this.isInteractiveMode = false;
          console.log('退出人机对战模式\n');
          break;
        } else if (cmd === 'reset') {
          this.resetBoard();
        } else if (cmd === 'undo') {
          this.undoLastMove();
        } else if (cmd === 'analyze') {
          await this.analyzeCurrentBoard();
        } else if (cmd === 'board') {
          this.showCurrentBoard();
        } else if (cmd === 'help') {
          this.showInteractiveHelp();
        } else if (this.isValidMoveInput(input)) {
          await this.handleMoveInput(input);
        } else {
          console.log('❌ 无效输入，请输入有效位置或命令（help查看帮助）');
        }
      } catch (error) {
        console.error('❌ 交互模式错误:', (error as Error).message);
      }
    }
  }

  private showPositionGuide(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                    📍 位置输入指南                     ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    console.log('    ║  🔤 字母坐标格式    🔢 数字坐标格式    📱 位置编号     ║');
    console.log('    ║  a1-h1 (第1行)     1,1-1,8 (第1行)    1-8   (第1行)  ║');
    console.log('    ║  a2-h2 (第2行)     2,1-2,8 (第2行)    9-16  (第2行)  ║');
    console.log('    ║  ...               ...                ...             ║');
    console.log('    ║  a8-h8 (第8行)     8,1-8,8 (第8行)    57-64 (第8行)  ║');
    console.log('    ║                                                       ║');
    console.log('    ║  💡 示例输入:                                          ║');
    console.log('    ║     • 左上角:   a1  或  1,1  或  1                    ║');
    console.log('    ║     • 中心:     d4  或  4,4  或  28                   ║');
    console.log('    ║     • 右下角:   h8  或  8,8  或  64                   ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
  }

  private showInteractiveHelp(): void {
    console.log('\n📖 人机对战模式帮助：');
    console.log('• 位置输入：a1-h8, 1,1-8,8, 或 1-64');
    console.log('• reset    - 重置棋盘');
    console.log('• undo     - 撤销上一步');
    console.log('• analyze  - 分析当前局面');
    console.log('• board    - 显示棋盘');
    console.log('• quit     - 返回主菜单');
    console.log('• help     - 显示此帮助\n');
  }

  private async handleMoveInput(input: string): Promise<void> {
    try {
      const position = this.parsePosition(input);
      const action = { row: position.row, col: position.col };

      // 检查是否是合法移动
      const legalMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);
      if (!legalMoves.some(move => move.row === action.row && move.col === action.col)) {
        console.log('❌ 该位置不是合法移动，请选择其他位置');
        console.log('💡 合法位置：');
        legalMoves.forEach((move, index) => {
          const pos = this.formatPosition({ row: move.row, col: move.col });
          console.log(`   ${index + 1}. ${pos}`);
        });
        return;
      }

      // 执行玩家移动
      this.currentBoard = makeMove(this.currentBoard, action, this.currentPlayer);
      this.moveHistory.push({
        row: action.row,
        col: action.col,
        player: this.currentPlayer
      });

      console.log(`\n✅ ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} 下棋成功！位置：${this.formatPosition(position)}`);

      // 切换到AI玩家
      this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
      this.showCurrentBoard();

      // 检查游戏是否结束
      if (this.checkGameEnd()) {
        return;
      }

      // AI回合
      await this.handleAIMove();

    } catch (error) {
      console.log(`❌ ${(error as Error).message}`);
      console.log('💡 有效格式：a1-h8, 1,1-8,8, 或 1-64');
    }
  }

  private async handleAIMove(): Promise<void> {
    const legalMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);

    if (legalMoves.length === 0) {
      console.log(`\n⏭️ ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} 无合法移动，跳过回合`);
      this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';

      // 检查玩家是否也无法移动
      const playerMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);
      if (playerMoves.length === 0) {
        this.checkGameEnd();
      }
      return;
    }

    console.log(`\n🤖 ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} AI思考中...`);

    // 使用启发式策略作为默认AI
    const decision = this.ai.getDecision(this.currentBoard, this.currentPlayer, 'heuristic');
    if (!decision) {
      console.log('❌ AI无法做出决策');
      return;
    }

    // 执行AI移动
    this.currentBoard = makeMove(this.currentBoard, decision.action, this.currentPlayer);
    this.moveHistory.push({
      row: decision.action.row,
      col: decision.action.col,
      player: this.currentPlayer
    });

    const position = { row: decision.action.row, col: decision.action.col };
    console.log(`\n🤖 ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} AI选择：${this.formatPosition(position)}`);
    console.log(`💭 AI思路：${decision.reasoning}`);

    // 切换回玩家
    this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
    this.showCurrentBoard();

    // 检查游戏是否结束
    this.checkGameEnd();
  }

  private checkGameEnd(): boolean {
    if (isGameOver(this.currentBoard)) {
      const winner = this.ai.checkWinner(this.currentBoard);
      const counts = countPieces(this.currentBoard);

      console.log('\n🏁 游戏结束！');
      console.log('='.repeat(30));
      console.log(`📊 最终得分：● 黑棋 ${counts.B} | ○ 白棋 ${counts.W}`);

      if (winner === 'Draw') {
        console.log('🤝 平局！');
      } else {
        console.log(`🏆 胜者：${winner === 'B' ? '● 黑棋' : '○ 白棋'}`);
      }

      console.log('输入 "reset" 重新开始，或 "quit" 返回主菜单');
      this.isInteractiveMode = false;
      return true;
    }
    return false;
  }

  private async startAIBattle(): Promise<void> {
    console.log('\n🤖 AI对战模式');
    console.log('='.repeat(40));

    const strategies = ['random', 'greedy', 'heuristic', 'minimax'];
    console.log('\n可选策略：');
    strategies.forEach((strategy, index) => {
      console.log(`${index + 1}. ${this.ai.getDecision(createOthelloBoard(), 'B', strategy)?.strategyName || strategy}`);
    });

    const blackStrategy = await this.question('\n选择黑棋AI策略 (1-4): ');
    const whiteStrategy = await this.question('选择白棋AI策略 (1-4): ');

    const blackStrategyName = strategies[parseInt(blackStrategy) - 1] || 'heuristic';
    const whiteStrategyName = strategies[parseInt(whiteStrategy) - 1] || 'heuristic';

    console.log(`\n🎮 开始AI对战：${blackStrategyName} vs ${whiteStrategyName}`);

    this.resetBoard();
    let moveCount = 0;
    const maxMoves = 100; // 防止无限循环

    while (!isGameOver(this.currentBoard) && moveCount < maxMoves) {
      const legalMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);

      if (legalMoves.length === 0) {
        console.log(`\n⏭️ ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} 无合法移动，跳过回合`);
        this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
        continue;
      }

      const strategy = this.currentPlayer === 'B' ? blackStrategyName : whiteStrategyName;
      const decision = this.ai.getDecision(this.currentBoard, this.currentPlayer, strategy);

      if (!decision) {
        console.log(`❌ ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} AI无法做出决策`);
        break;
      }

      this.currentBoard = makeMove(this.currentBoard, decision.action, this.currentPlayer);
      const position = { row: decision.action.row, col: decision.action.col };

      console.log(`\n第${moveCount + 1}步：${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} ${strategy} 选择 ${this.formatPosition(position)}`);

      this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
      moveCount++;

      // 每5步显示一次棋盘
      if (moveCount % 5 === 0) {
        this.showCurrentBoard();
        await this.question('按回车继续...');
      }
    }

    this.showCurrentBoard();
    const winner = this.ai.checkWinner(this.currentBoard);
    const counts = countPieces(this.currentBoard);

    console.log('\n🏁 AI对战结束！');
    console.log('='.repeat(30));
    console.log(`📊 最终得分：● 黑棋 ${counts.B} | ○ 白棋 ${counts.W}`);

    if (winner === 'Draw') {
      console.log('🤝 平局！');
    } else {
      const winnerStrategy = winner === 'B' ? blackStrategyName : whiteStrategyName;
      console.log(`🏆 胜者：${winner === 'B' ? '● 黑棋' : '○ 白棋'} (${winnerStrategy})`);
    }
  }

  private async startDemoMode(): Promise<void> {
    console.log('\n🎯 演示模式');
    console.log('='.repeat(40));
    this.isDemoMode = true;
    this.resetBoard();
    this.showCurrentBoard();
    this.showPositionGuide();
    console.log('\n💡 在此模式下，您可以手动下棋并获得AI分析');

    while (this.isDemoMode) {
      try {
        const input = await this.question('请输入位置或命令: ');
        const cmd = input.toLowerCase().trim();

        if (cmd === 'quit' || cmd === 'back') {
          this.isDemoMode = false;
          console.log('退出演示模式\n');
          break;
        } else if (cmd === 'reset') {
          this.resetBoard();
        } else if (cmd === 'undo') {
          this.undoLastMove();
        } else if (cmd === 'analyze') {
          await this.analyzeCurrentBoard();
        } else if (cmd === 'board') {
          this.showCurrentBoard();
        } else if (cmd === 'help') {
          this.showDemoHelp();
        } else if (this.isValidMoveInput(input)) {
          await this.handleDemoMoveInput(input);
        } else {
          console.log('❌ 无效输入，请输入有效位置或命令（help查看帮助）');
        }
      } catch (error) {
        console.error('❌ 演示模式错误:', (error as Error).message);
      }
    }
  }

  private showDemoHelp(): void {
    console.log('\n📖 演示模式帮助：');
    console.log('• 位置输入：a1-h8, 1,1-8,8, 或 1-64');
    console.log('• reset    - 重置棋盘');
    console.log('• undo     - 撤销上一步');
    console.log('• analyze  - 分析当前局面');
    console.log('• board    - 显示棋盘');
    console.log('• back     - 返回主菜单');
    console.log('• help     - 显示此帮助\n');
  }

  private async handleDemoMoveInput(input: string): Promise<void> {
    try {
      const position = this.parsePosition(input);
      const action = { row: position.row, col: position.col };

      // 检查是否是合法移动
      const legalMoves = this.ai.getLegalMoves(this.currentBoard, this.currentPlayer);
      if (!legalMoves.some(move => move.row === action.row && move.col === action.col)) {
        console.log('❌ 该位置不是合法移动，请选择其他位置');
        return;
      }

      // 执行移动
      this.currentBoard = makeMove(this.currentBoard, action, this.currentPlayer);
      this.moveHistory.push({
        row: action.row,
        col: action.col,
        player: this.currentPlayer
      });

      console.log(`\n✅ ${this.currentPlayer === 'B' ? '● 黑棋' : '○ 白棋'} 下棋成功！位置：${this.formatPosition(position)}`);

      // 切换玩家
      this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
      this.showCurrentBoard();

      // 检查游戏是否结束
      if (this.checkGameEnd()) {
        return;
      }

      // 询问是否需要AI分析
      const analyzeInput = await this.question('是否需要AI分析当前局面？(y/n): ');
      if (analyzeInput.toLowerCase().trim() === 'y') {
        console.log('\n🤖 AI分析当前局面：');
        await this.performAIAnalysis(this.currentBoard, this.currentPlayer);
      }

    } catch (error) {
      console.log(`❌ ${(error as Error).message}`);
      console.log('💡 有效格式：a1-h8, 1,1-8,8, 或 1-64');
    }
  }

  // {{ AURA-X: Add - AlphaZero智能调参CLI命令. Approval: 寸止(ID:添加CLI命令). }}

  /**
   * 显示AlphaZero配置指南
   */
  private async showAlphaZeroConfigGuide(): Promise<void> {
    console.log('\n🧠 AlphaZero配置优化指南');
    console.log('='.repeat(50));

    try {
      const guide = new AlphaZeroConfigGuide();
      guide.printConfigGuide();
    } catch (error) {
      console.error('❌ 配置指南加载失败:', (error as Error).message);
    }
  }

  /**
   * 运行快速超参数优化
   */
  private async runQuickHyperoptimization(): Promise<void> {
    console.log('\n⚡ 快速超参数优化');
    console.log('='.repeat(50));
    console.log('⚠️  这将运行真实的AlphaZero训练，预计需要5-10分钟');

    const confirm = await this.question('确认开始？(y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 已取消优化');
      return;
    }

    try {
      console.log('🚀 启动快速优化...');
      const manager = new OptimizationManager();
      const bestConfig = await manager.runOptimization('quick');

      console.log('\n🏆 优化完成！');
      console.log(`最佳分数: ${bestConfig.score.toFixed(4)}`);
      console.log('\n最佳参数:');
      for (const [key, value] of Object.entries(bestConfig.parameters)) {
        console.log(`  ${key}: ${value}`);
      }
    } catch (error) {
      console.error('❌ 优化失败:', (error as Error).message);
    }
  }

  /**
   * 运行标准超参数优化
   */
  private async runStandardHyperoptimization(): Promise<void> {
    console.log('\n🎯 标准超参数优化');
    console.log('='.repeat(50));
    console.log('⚠️  这将运行完整的AlphaZero训练，预计需要1-2小时');

    const confirm = await this.question('确认开始？(y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 已取消优化');
      return;
    }

    try {
      console.log('🚀 启动标准优化...');
      const manager = new OptimizationManager();
      await manager.loadOptimizationHistory();

      const bestConfig = await manager.runOptimization('standard');

      console.log('\n🏆 优化完成！');
      console.log(`最佳分数: ${bestConfig.score.toFixed(4)}`);

      // 分析优化历史
      const analysis = manager.analyzeOptimizationHistory();
      console.log('\n📊 优化历史分析:');
      console.log(`总优化次数: ${analysis.totalOptimizations}`);
      console.log(`平均用时: ${(analysis.averageDuration / 60000).toFixed(1)}分钟`);
      console.log(`历史最佳分数: ${analysis.bestOverallScore.toFixed(4)}`);

      // 导出最佳配置
      const exportedConfig = manager.exportBestConfiguration();
      console.log('\n💾 最佳配置已导出');
      console.log(`配置分数: ${exportedConfig.metadata.score.toFixed(4)}`);

    } catch (error) {
      console.error('❌ 优化失败:', (error as Error).message);
    }
  }

  /**
   * 显示配置推荐
   */
  private async showConfigRecommendation(): Promise<void> {
    console.log('\n💡 AlphaZero配置推荐系统');
    console.log('='.repeat(50));

    try {
      const guide = new AlphaZeroConfigGuide();

      console.log('\n请选择您的应用场景:');
      console.log('1. 实时游戏 (需要快速响应)');
      console.log('2. 交互演示 (平衡性能和响应)');
      console.log('3. 生产API (服务器部署)');
      console.log('4. 批量分析 (离线处理)');
      console.log('5. 研究实验 (追求最高质量)');
      console.log('6. 自定义约束 (指定具体要求)');

      const choice = await this.question('请选择 (1-6): ');

      let configs: any[] = [];

      switch (choice) {
        case '1':
          configs = guide.getConfigByScenario(ApplicationScenario.REAL_TIME_GAME);
          break;
        case '2':
          configs = guide.getConfigByScenario(ApplicationScenario.INTERACTIVE_DEMO);
          break;
        case '3':
          configs = guide.getConfigByScenario(ApplicationScenario.PRODUCTION_API);
          break;
        case '4':
          configs = guide.getConfigByScenario(ApplicationScenario.BATCH_ANALYSIS);
          break;
        case '5':
          configs = guide.getConfigByScenario(ApplicationScenario.RESEARCH_STUDY);
          break;
        case '6':
          await this.showCustomConstraintRecommendation(guide);
          return;
        default:
          console.log('❌ 无效选择');
          return;
      }

      console.log('\n🎯 推荐配置:');
      for (const config of configs) {
        console.log(`\n📋 ${config.name}:`);
        console.log(`   搜索速度: ${config.metrics.searchSpeed.toFixed(2)} 次/秒`);
        console.log(`   响应时间: ${(1/config.metrics.searchSpeed*1000).toFixed(0)}ms`);
        console.log(`   AI质量: ${config.metrics.winRateVsGreedy}% vs贪心`);
        console.log(`   训练时间: ${config.metrics.trainingTime}小时`);
        console.log(`   内存需求: ${config.metrics.memoryUsage}MB`);
        console.log(`   实时可行: ${config.metrics.realTimeViable ? '✅' : '❌'}`);
        console.log(`   适用场景: ${config.recommendations[0]}`);
      }

    } catch (error) {
      console.error('❌ 配置推荐失败:', (error as Error).message);
    }
  }

  /**
   * 显示自定义约束推荐
   */
  private async showCustomConstraintRecommendation(guide: AlphaZeroConfigGuide): Promise<void> {
    console.log('\n🔧 自定义约束配置');
    console.log('='.repeat(40));

    const maxSearchTime = await this.question('最大搜索时间(秒，回车跳过): ');
    const maxTrainingTime = await this.question('最大训练时间(小时，回车跳过): ');
    const maxMemory = await this.question('最大内存(MB，回车跳过): ');
    const realTimeRequired = await this.question('是否需要实时性？(y/N): ');

    const constraints: any = {};

    if (maxSearchTime) {
      constraints.maxSearchTime = parseFloat(maxSearchTime);
    }
    if (maxTrainingTime) {
      constraints.maxTrainingTime = parseFloat(maxTrainingTime);
    }
    if (maxMemory) {
      constraints.maxMemory = parseInt(maxMemory);
    }
    if (realTimeRequired.toLowerCase() === 'y') {
      constraints.realTimeRequired = true;
    }

    const configs = guide.getConfigByConstraints(constraints);

    if (configs.length === 0) {
      console.log('❌ 没有找到满足约束条件的配置');
      console.log('💡 建议放宽约束条件或选择更低性能等级');
    } else {
      console.log('\n🎯 满足约束的配置:');
      for (const config of configs) {
        console.log(`\n📋 ${config.name}:`);
        console.log(`   搜索速度: ${config.metrics.searchSpeed.toFixed(2)} 次/秒`);
        console.log(`   AI质量: ${config.metrics.winRateVsGreedy}% vs贪心`);
        console.log(`   训练时间: ${config.metrics.trainingTime}小时`);
        console.log(`   内存需求: ${config.metrics.memoryUsage}MB`);
      }
    }
  }
}

// 启动程序
if (require.main === module) {
  const cli = new OthelloCLI();
  cli.start().catch(console.error);
}
