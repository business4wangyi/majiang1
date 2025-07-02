import * as readline from 'readline';
import { StrategyAdapter } from './strategy-adapter';

// 类型定义
export interface Position {
  row: number;
  col: number;
}

export interface Move {
  row: number;
  col: number;
  player: string;
}

export interface AIDecision {
  action: Position;
  confidence: number;
  reasoning: string;
}

export type Cell = 'X' | 'O' | null;
export type Board = Cell[][];

// 简化的AI引擎类
class SimplifiedAI {
  checkWinner(board: Board): string | null {
    // 检查行
    for (let row = 0; row < 3; row++) {
      if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
        return board[row][0];
      }
    }

    // 检查列
    for (let col = 0; col < 3; col++) {
      if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
        return board[0][col];
      }
    }

    // 检查对角线
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }

    return null;
  }

  getLegalMoves(board: Board): Position[] {
    const moves: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }

  getDecision(board: Board, player: string, strategy: string = 'smart'): AIDecision | null {
    const legalMoves = this.getLegalMoves(board);
    if (legalMoves.length === 0) return null;

    // 检查获胜机会
    for (const move of legalMoves) {
      const testBoard = this.copyBoard(board);
      testBoard[move.row][move.col] = player as Cell;
      if (this.checkWinner(testBoard) === player) {
        return {
          action: move,
          confidence: 0.95,
          reasoning: '发现获胜机会，立即获胜！'
        };
      }
    }

    // 检查防守需求
    const opponent = player === 'X' ? 'O' : 'X';
    for (const move of legalMoves) {
      const testBoard = this.copyBoard(board);
      testBoard[move.row][move.col] = opponent as Cell;
      if (this.checkWinner(testBoard) === opponent) {
        return {
          action: move,
          confidence: 0.90,
          reasoning: '必须阻止对手获胜'
        };
      }
    }

    // 选择中心位置
    if (board[1][1] === null) {
      return {
        action: { row: 1, col: 1 },
        confidence: 0.85,
        reasoning: '占据中心位置，控制全局'
      };
    }

    // 选择角落位置
    const corners = [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }];
    for (const corner of corners) {
      if (board[corner.row][corner.col] === null) {
        return {
          action: corner,
          confidence: 0.80,
          reasoning: '选择角落位置，较为安全'
        };
      }
    }

    // 选择边缘位置
    return {
      action: legalMoves[0],
      confidence: 0.60,
      reasoning: '选择可用位置'
    };
  }

  private copyBoard(board: Board): Board {
    return board.map(row => [...row]);
  }
}

// 策略规则类
class StrategyRules {
  static getBasicRules(): string[] {
    return [
      '🎯 见胜必取：发现获胜机会立即执行',
      '🛡️ 见败必防：阻止对手获胜威胁',
      '👑 中心为王：优先占据中心位置',
      '🏰 角落次之：次优选择角落位置',
      '📏 边缘最后：避免选择边缘位置'
    ];
  }

  static analyzePosition(board: Board, currentPlayer: string, ai: SimplifiedAI): string[] {
    const analysis: string[] = [];
    const legalMoves = ai.getLegalMoves(board);

    // 检查获胜机会
    for (const move of legalMoves) {
      const testBoard = board.map((row: Cell[]) => [...row]);
      testBoard[move.row][move.col] = currentPlayer as Cell;
      if (ai.checkWinner(testBoard) === currentPlayer) {
        analysis.push(`🎯 获胜机会：位置(${move.row + 1}, ${move.col + 1})可以获胜！`);
        break;
      }
    }

    // 检查防守需求
    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    for (const move of legalMoves) {
      const testBoard = board.map((row: Cell[]) => [...row]);
      testBoard[move.row][move.col] = opponent as Cell;
      if (ai.checkWinner(testBoard) === opponent) {
        analysis.push(`🛡️ 防守要紧：必须在位置(${move.row + 1}, ${move.col + 1})阻止对手！`);
        break;
      }
    }

    // 位置建议
    if (board[1][1] === null) {
      analysis.push('💡 建议：优先占据中心位置(2,2)');
    } else {
      const corners = [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }];
      const availableCorners = corners.filter(corner => board[corner.row][corner.col] === null);
      if (availableCorners.length > 0) {
        analysis.push('💡 建议：考虑占据角落位置');
      }
    }

    return analysis.length > 0 ? analysis : ['💡 建议：选择最佳可用位置'];
  }
}

// 主程序类
class TicTacToeMVP {
  private rl: readline.Interface;
  private ai: SimplifiedAI;
  private strategyAdapter: StrategyAdapter;
  private currentBoard: Board;
  private currentPlayer: string;
  private moveHistory: Move[];
  private isInteractiveMode: boolean;
  private isDemoMode: boolean;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.ai = new SimplifiedAI();
    this.strategyAdapter = new StrategyAdapter();
    this.currentBoard = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.currentPlayer = 'X';
    this.moveHistory = [];
    this.isInteractiveMode = false;
    this.isDemoMode = false;
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
    console.log('    ║        🤖 AI辅助井字棋 MVP版本 v2.0                   ║');
    console.log('    ║                                                       ║');
    console.log('    ║    ✨ 智能AI分析  🎮 交互式下棋  📚 策略学习          ║');
    console.log('    ║                                                       ║');
    console.log('    ║    功能：手动输入棋盘状态，获取AI建议和策略解释        ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private showHelp(): void {
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                     📖 使用说明                       ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    console.log('    ║  🎮 交互模式命令：                                     ║');
    console.log('    ║     • play     开始交互式下棋                         ║');
    console.log('    ║     • demo     查看演示                               ║');
    console.log('    ║     • strategies 查看可用AI策略                       ║');
    console.log('    ║     • rules    查看基本策略规则                       ║');
    console.log('    ║     • quit     退出程序                               ║');
    console.log('    ║                                                       ║');
    console.log('    ║  📍 位置输入方式（交互模式中）：                       ║');
    console.log('    ║     • a1, b2, c3    字母数字坐标                      ║');
    console.log('    ║     • 1,1 或 2,3    数字坐标（行,列）                 ║');
    console.log('    ║     • 1 到 9        数字位置（从左到右，从上到下）     ║');
    console.log('    ║                                                       ║');
    console.log('    ║  💡 传统模式（兼容）：                                 ║');
    console.log('    ║     • 仍支持直接输入棋盘状态：X.O/.X./..O             ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private showStrategies(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                   🧠 可用AI策略                       ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');

    const strategies = this.strategyAdapter.getAvailableStrategies();
    for (const strategy of strategies) {
      const description = this.strategyAdapter.getStrategyDescription(strategy);
      console.log(`    ║  ${description.padEnd(50)} ║`);
      console.log('    ║                                                       ║');
    }

    console.log('    ║  💡 这些策略在AI分析中会自动使用                       ║');
    console.log('    ║     每个策略都有不同的决策逻辑和特点                   ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private showRules(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                   📋 基本策略规则                     ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    const rules = StrategyRules.getBasicRules();
    rules.forEach((rule, index) => {
      const ruleText = rule.padEnd(50);
      console.log(`    ║  ${ruleText} ║`);
      if (index < rules.length - 1) {
        console.log('    ║                                                       ║');
      }
    });
    console.log('    ║                                                       ║');
    console.log('    ║  💡 记忆口诀：                                         ║');
    console.log('    ║     "见胜必取，见败必防，中心为王，角落次之"           ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  private async mainLoop(): Promise<void> {
    while (true) {
      try {
        const input = await this.question('请输入命令: ');
        const cmd = input.toLowerCase().trim();

        if (cmd === 'quit') {
          console.log('👋 再见！');
          break;
        } else if (cmd === 'help') {
          this.showHelp();
        } else if (cmd === 'rules') {
          this.showRules();
        } else if (cmd === 'demo') {
          await this.runDemo();
        } else if (cmd === 'strategies') {
          this.showStrategies();
        } else if (cmd === 'play') {
          await this.startInteractiveMode();
        } else if (cmd === 'reset') {
          // 检查是否有棋盘历史记录，如果有说明之前在交互模式
          const wasInInteractiveMode = this.moveHistory.length > 0 || this.isInteractiveMode;
          this.resetBoard();
          // 如果之前在交互模式下，重新进入交互模式
          if (wasInInteractiveMode) {
            this.isInteractiveMode = true;
            this.showCurrentBoard();
          }
        } else if (cmd === 'undo') {
          this.undoLastMove();
        } else if (cmd === 'analyze') {
          await this.analyzeCurrentBoard();
        } else if (cmd === 'board') {
          this.showCurrentBoard();
        } else if (this.isInteractiveMode && this.isValidMoveInput(input)) {
          await this.handleMoveInput(input);
        } else if (input.includes('X') || input.includes('O') || input.includes('.')) {
          await this.analyzeBoardInput(input);
        } else {
          console.log('❌ 无效输入，请输入 help 查看帮助\n');
        }
      } catch (error) {
        console.error('❌ 错误:', (error as Error).message);
      }
    }

    this.rl.close();
  }

  private async runDemo(): Promise<void> {
    console.log('\n🎮 演示模式：交互式棋盘构建');
    console.log('您可以使用任何位置格式来构建演示棋盘');
    console.log('支持格式：字母坐标(a1-c3)、数字坐标(1,1-3,3)、数字位置(1-9)');
    console.log('输入 "preset" 使用预设演示，输入 "back" 返回主菜单');
    console.log('');

    // 进入演示交互模式
    this.isDemoMode = true;
    this.resetBoard();
    this.showCurrentBoard();

    while (this.isDemoMode) {
      try {
        const input = await this.question('[演示模式] 请输入位置或命令: ');
        const cmd = input.toLowerCase().trim();

        if (cmd === 'back' || cmd === 'quit') {
          this.isDemoMode = false;
          console.log('退出演示模式\n');
          break;
        } else if (cmd === 'preset') {
          console.log('\n🎮 加载预设演示局面');
          console.log('棋盘状态：X.O/.X./..O');
          await this.analyzeBoardInput('X.O/.X./..O');
          this.isDemoMode = false;
          break;
        } else if (cmd === 'reset') {
          this.resetBoard();
          this.showCurrentBoard();
        } else if (cmd === 'undo') {
          this.undoLastMove();
        } else if (cmd === 'analyze') {
          await this.analyzeCurrentBoard();
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
    console.log('• 位置输入：a1, b2, c3 或 1,1, 2,3 或 1-9');
    console.log('• preset   - 加载预设演示局面');
    console.log('• reset    - 重置棋盘');
    console.log('• undo     - 撤销上一步');
    console.log('• analyze  - 分析当前局面');
    console.log('• back     - 返回主菜单');
    console.log('• help     - 显示此帮助\n');
  }

  private async handleDemoMoveInput(input: string): Promise<void> {
    try {
      const position = this.parsePosition(input);

      if (this.currentBoard[position.row][position.col] !== null) {
        console.log('❌ 该位置已被占用，请选择其他位置');
        return;
      }

      // 使用当前玩家的棋子（正确的轮换逻辑）
      const piece = this.currentPlayer;

      // 执行移动
      this.currentBoard[position.row][position.col] = piece as Cell;
      this.moveHistory.push({
        row: position.row,
        col: position.col,
        player: piece
      });

      console.log(`\n✅ ${piece} 在位置 ${this.formatPosition(position)} 下棋成功！`);

      // 切换到下一个玩家（在检查游戏结束之前切换）
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

      // 显示更新后的棋盘（包含正确的当前玩家）
      this.showCurrentBoard();

      // 检查游戏是否结束
      const winner = this.ai.checkWinner(this.currentBoard);
      if (winner) {
        console.log(`\n🏆 游戏结束！${winner} 获胜！`);
        console.log('输入 "reset" 重新开始，或 "back" 返回主菜单');
        return;
      }

      const legalMoves = this.ai.getLegalMoves(this.currentBoard);
      if (legalMoves.length === 0) {
        console.log('\n🤝 游戏结束！平局！');
        console.log('输入 "reset" 重新开始，或 "back" 返回主菜单');
        return;
      }

      // 询问是否需要AI分析
      const analyzeInput = await this.question('是否需要AI分析当前局面？(y/n): ');
      if (analyzeInput.toLowerCase().trim() === 'y') {
        console.log('\n🤖 AI分析当前局面：');
        // AI分析下一个玩家（当前玩家）的最佳策略
        await this.performAIAnalysis(this.currentBoard, this.currentPlayer);
      }

    } catch (error) {
      console.log(`❌ ${(error as Error).message}`);
      console.log('💡 有效格式：a1, b2, c3 或 1,1 或 1-9');
    }
  }

  private async startInteractiveMode(): Promise<void> {
    console.log('\n🎮 进入交互式下棋模式');
    console.log('='.repeat(40));
    this.isInteractiveMode = true;
    this.resetBoard();
    this.showCurrentBoard();
    console.log('\n💡 输入位置来下棋，或输入命令（quit返回主菜单）');

    while (this.isInteractiveMode) {
      try {
        const prompt = `[${this.currentPlayer}的回合] 请输入位置 (或输入命令): `;
        const input = await this.question(prompt);
        const cmd = input.toLowerCase().trim();

        if (cmd === 'quit') {
          this.isInteractiveMode = false;
          console.log('退出交互模式\n');
          break;
        } else if (cmd === 'reset') {
          // 检查是否有棋盘历史记录，如果有说明之前在交互模式
          const wasInInteractiveMode = this.moveHistory.length > 0 || this.isInteractiveMode;
          this.resetBoard();
          // 如果之前在交互模式下，重新进入交互模式
          if (wasInInteractiveMode) {
            this.isInteractiveMode = true;
            this.showCurrentBoard();
          }
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
        console.error('❌ 错误:', (error as Error).message);
      }
    }
  }

  private showInteractiveHelp(): void {
    console.log('\n📖 交互模式帮助：');
    console.log('• 位置输入：a1, b2, c3 或 1,1, 2,3 或 1-9');
    console.log('• reset    - 重置棋盘');
    console.log('• undo     - 撤销上一步');
    console.log('• analyze  - 分析当前局面');
    console.log('• board    - 显示当前棋盘');
    console.log('• quit     - 退出交互模式');
    console.log('• help     - 显示此帮助\n');
  }

  private showPositionGuide(): void {
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                    📍 位置输入指南                     ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');
    console.log('    ║  🔤 字母坐标格式    🔢 数字坐标格式    📱 数字位置     ║');
    console.log('    ║  ┌───┬───┬───┐     ┌─────┬─────┬─────┐  ┌───┬───┬───┐ ║');
    console.log('    ║  │a1 │b1 │c1 │     │ 1,1 │ 1,2 │ 1,3 │  │ 1 │ 2 │ 3 │ ║');
    console.log('    ║  ├───┼───┼───┤     ├─────┼─────┼─────┤  ├───┼───┼───┤ ║');
    console.log('    ║  │a2 │b2 │c2 │     │ 2,1 │ 2,2 │ 2,3 │  │ 4 │ 5 │ 6 │ ║');
    console.log('    ║  ├───┼───┼───┤     ├─────┼─────┼─────┤  ├───┼───┼───┤ ║');
    console.log('    ║  │a3 │b3 │c3 │     │ 3,1 │ 3,2 │ 3,3 │  │ 7 │ 8 │ 9 │ ║');
    console.log('    ║  └───┴───┴───┘     └─────┴─────┴─────┘  └───┴───┴───┘ ║');
    console.log('    ║                                                       ║');
    console.log('    ║  💡 示例输入:                                          ║');
    console.log('    ║     • 中心位置: b2  或  2,2  或  5                    ║');
    console.log('    ║     • 左上角:   a1  或  1,1  或  1                    ║');
    console.log('    ║     • 右下角:   c3  或  3,3  或  9                    ║');
    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
  }

  private resetBoard(): void {
    this.currentBoard = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.currentPlayer = 'X';
    this.moveHistory = [];
    console.log('\n🔄 棋盘已重置');
  }

  private undoLastMove(): void {
    if (this.moveHistory.length === 0) {
      console.log('');
      console.log('    ╔═══════════════════════════════════════╗');
      console.log('    ║            ❌ 操作失败                ║');
      console.log('    ║          没有可撤销的移动             ║');
      console.log('    ╚═══════════════════════════════════════╝');
      return;
    }

    const lastMove = this.moveHistory.pop()!;
    this.currentBoard[lastMove.row][lastMove.col] = null;
    // 撤销后，应该恢复到刚刚下棋的那个玩家再次下棋
    // 因为当前玩家已经切换到了对手，所以需要切换回来
    this.currentPlayer = lastMove.player;

    console.log('');
    console.log('    ╔═══════════════════════════════════════╗');
    console.log('    ║            ↩️  撤销成功               ║');
    console.log(`    ║     撤销了 ${lastMove.player} 在位置(${lastMove.row + 1}, ${lastMove.col + 1})的移动    ║`);
    console.log('    ╚═══════════════════════════════════════╝');

    // 在交互模式或演示模式下都显示棋盘
    if (this.isInteractiveMode || this.isDemoMode) {
      this.showCurrentBoard();
    }
  }

  private showCurrentBoard(): void {
    console.log('\n📋 当前棋盘：');
    this.displayBoard(this.currentBoard);
    console.log(`\n🎯 当前玩家：${this.currentPlayer}`);
  }

  private async analyzeCurrentBoard(): Promise<void> {
    if (this.isEmptyBoard()) {
      console.log('\n💡 空棋盘，建议从中心位置开始');
      return;
    }

    console.log('\n🤖 分析当前局面...');
    await this.performAIAnalysis(this.currentBoard, this.currentPlayer);
  }

  private isEmptyBoard(): boolean {
    return this.currentBoard.every(row => row.every(cell => cell === null));
  }

  private displayBoard(board: Board): void {
    console.log('');
    console.log('    ┌─────────────────────┐');
    console.log('    │    井字棋游戏棋盘    │');
    console.log('    ├─────────────────────┤');
    console.log('    │     1   2   3       │');
    console.log('    │   ┌───┬───┬───┐     │');

    for (let row = 0; row < 3; row++) {
      let line = `    │ ${row + 1} │`;

      for (let col = 0; col < 3; col++) {
        const cell = this.formatCell(board[row][col]);
        line += ` ${cell} │`;
      }

      line += '     │';
      console.log(line);

      if (row < 2) {
        console.log('    │   ├───┼───┼───┤     │');
      }
    }

    console.log('    │   └───┴───┴───┘     │');
    console.log('    │                     │');
    console.log('    │ 输入格式: a1, 2,3   │');
    console.log('    └─────────────────────┘');
  }

  private formatCell(cellValue: Cell): string {
    if (cellValue === 'X') {
      return '✗';
    } else if (cellValue === 'O') {
      return '○';
    } else {
      return ' ';
    }
  }

  private isValidMoveInput(input: string): boolean {
    const trimmed = input.trim().toLowerCase();

    // 字母坐标格式：a1, b2, c3
    if (/^[abc][123]$/.test(trimmed)) return true;

    // 数字坐标格式：1,1 或 2,3
    if (/^[123],[123]$/.test(trimmed)) return true;

    // 数字位置格式：1-9
    if (/^[1-9]$/.test(trimmed)) return true;

    return false;
  }

  private parsePosition(input: string): Position {
    const trimmed = input.trim().toLowerCase();

    // 字母坐标格式：a1, b2, c3
    if (/^[abc][123]$/.test(trimmed)) {
      const col = trimmed.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, c=2
      const row = parseInt(trimmed[1]) - 1; // 1=0, 2=1, 3=2
      return { row, col };
    }

    // 数字坐标格式：1,1 或 2,3
    if (/^[123],[123]$/.test(trimmed)) {
      const parts = trimmed.split(',');
      const row = parseInt(parts[0]) - 1;
      const col = parseInt(parts[1]) - 1;
      return { row, col };
    }

    // 数字位置格式：1-9
    if (/^[1-9]$/.test(trimmed)) {
      const pos = parseInt(trimmed) - 1;
      const row = Math.floor(pos / 3);
      const col = pos % 3;
      return { row, col };
    }

    throw new Error('无效的位置格式');
  }

  private async handleMoveInput(input: string): Promise<void> {
    try {
      const position = this.parsePosition(input);

      if (this.currentBoard[position.row][position.col] !== null) {
        console.log('❌ 该位置已被占用，请选择其他位置');
        return;
      }

      // 执行移动
      this.currentBoard[position.row][position.col] = this.currentPlayer as Cell;
      this.moveHistory.push({
        row: position.row,
        col: position.col,
        player: this.currentPlayer
      });

      console.log(`\n✅ ${this.currentPlayer} 下棋成功！位置：${this.formatPosition(position)}`);

      // 切换玩家（在显示棋盘之前切换）
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

      this.showCurrentBoard();

      // 检查游戏是否结束
      const winner = this.ai.checkWinner(this.currentBoard);
      if (winner) {
        console.log(`\n🏆 游戏结束！${winner} 获胜！`);
        this.isInteractiveMode = false;
        return;
      }

      const legalMoves = this.ai.getLegalMoves(this.currentBoard);
      if (legalMoves.length === 0) {
        console.log('\n🤝 游戏结束！平局！');
        this.isInteractiveMode = false;
        return;
      }

      // AI分析新局面
      console.log('\n🤖 AI分析新局面：');
      await this.performAIAnalysis(this.currentBoard, this.currentPlayer);

    } catch (error) {
      console.log(`❌ ${(error as Error).message}`);
      console.log('💡 有效格式：a1, b2, c3 或 1,1 或 1-9');
    }
  }

  private formatPosition(position: Position): string {
    const letters = ['a', 'b', 'c'];
    const letter = letters[position.col];
    const number = position.row + 1;
    return `${letter}${number} (${position.row + 1},${position.col + 1})`;
  }

  private async analyzeBoardInput(input: string): Promise<void> {
    try {
      const board = this.parseBoardInput(input);
      const currentPlayer = this.determineCurrentPlayer(board);

      console.log('\n📋 当前棋盘：');
      this.displayBoard(board);
      console.log(`\n🎯 当前玩家：${currentPlayer}`);

      await this.performAIAnalysis(board, currentPlayer);
    } catch (error) {
      console.error('❌ 棋盘解析失败:', (error as Error).message);
      console.log('💡 正确格式：X.O/.X./..O（X表示X，O表示O，.表示空位，/分隔行）');
    }
  }

  private async performAIAnalysis(board: Board, currentPlayer: string): Promise<void> {
    // 使用策略适配器获取可用策略
    const availableStrategies = this.strategyAdapter.getAvailableStrategies();
    const strategies = ['minimax', 'defensive', 'greedy', 'random'].filter(s =>
      availableStrategies.includes(s)
    );

    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════╗');
    console.log('    ║                    🤖 AI智能分析                      ║');
    console.log('    ║                  (集成策略系统)                       ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');

    for (const strategy of strategies) {
      try {
        // 优先使用策略适配器
        let decision = this.strategyAdapter.getStrategyDecision(board, currentPlayer, strategy);

        // 如果策略适配器失败，回退到简化AI
        if (!decision) {
          decision = this.ai.getDecision(board, currentPlayer, strategy);
        }

        if (decision) {
          const strategyDesc = this.strategyAdapter.getStrategyDescription(strategy);
          const position = `(${decision.action.row + 1},${decision.action.col + 1})`;
          const confidence = `${(decision.confidence * 100).toFixed(1)}%`;

          console.log(`    ║  ${strategyDesc.substring(0, 50).padEnd(50)} ║`);
          console.log(`    ║     推荐位置：${position.padEnd(20)}                    ║`);
          console.log(`    ║     置信度：${confidence.padEnd(22)}                       ║`);
          console.log(`    ║     理由：${decision.reasoning.padEnd(26)}                   ║`);
          console.log('    ║                                                       ║');
        }
      } catch (error) {
        console.log(`    ║  ${strategy}策略分析失败                               ║`);
      }
    }

    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                    💡 策略建议                        ║');
    console.log('    ╠═══════════════════════════════════════════════════════╣');
    console.log('    ║                                                       ║');

    const analysis = StrategyRules.analyzePosition(board, currentPlayer, this.ai);
    for (const suggestion of analysis) {
      console.log(`    ║  ${suggestion.padEnd(50)} ║`);
    }

    console.log('    ║                                                       ║');
    console.log('    ╚═══════════════════════════════════════════════════════╝');
  }

  private parseBoardInput(input: string): Board {
    const board: Board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];

    const rows = input.split('/');
    if (rows.length !== 3) {
      throw new Error('棋盘必须有3行，用/分隔');
    }

    for (let row = 0; row < 3; row++) {
      if (rows[row].length !== 3) {
        throw new Error(`第${row + 1}行必须有3个字符`);
      }

      for (let col = 0; col < 3; col++) {
        const char = rows[row][col].toUpperCase();
        if (char === 'X') {
          board[row][col] = 'X';
        } else if (char === 'O') {
          board[row][col] = 'O';
        } else if (char === '.') {
          board[row][col] = null;
        } else {
          throw new Error(`无效字符 '${char}'，只能使用 X、O 或 .`);
        }
      }
    }

    return board;
  }

  private determineCurrentPlayer(board: Board): string {
    let xCount = 0;
    let oCount = 0;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === 'X') xCount++;
        if (board[row][col] === 'O') oCount++;
      }
    }

    // X先手，如果X和O数量相等，轮到X；如果X比O多1，轮到O
    return xCount <= oCount ? 'X' : 'O';
  }
}

// 主函数
async function main(): Promise<void> {
  const game = new TicTacToeMVP();
  await game.start();
}

// 启动程序
if (require.main === module) {
  main().catch(console.error);
}
