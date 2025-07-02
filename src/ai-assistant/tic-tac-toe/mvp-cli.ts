#!/usr/bin/env node

/**
 * AI辅助井字棋 MVP 命令行版本
 * 提供手动输入棋盘状态，获取AI建议和策略解释
 */

import * as readline from 'readline';
import { Board, Player, Action } from '../../tic-tac-toe/types';
import { getLegalActions, checkWinner } from '../../tic-tac-toe/game';
import { MinimaxAgent } from '../../tic-tac-toe/strategy/minimax-agent';
import { QLearningAgent } from '../../tic-tac-toe/strategy/qlearning-agent';
import { DefensiveAgent } from '../../tic-tac-toe/strategy/defensive-agent';
import { GreedyAgent } from '../../tic-tac-toe/strategy/greedy-agent';

// 简化的AI决策引擎
class SimplifiedAIEngine {
  private agents: Map<string, any> = new Map();

  constructor() {
    this.agents.set('minimax', new MinimaxAgent());
    this.agents.set('qlearning', new QLearningAgent('X', 0));
    this.agents.set('defensive', new DefensiveAgent());
    this.agents.set('greedy', new GreedyAgent());
  }

  getDecision(board: Board, player: Player, strategy: string = 'minimax'): {
    action: Action;
    reasoning: string;
    confidence: number;
  } {
    const agent = this.agents.get(strategy);
    if (!agent) {
      throw new Error(`未知策略: ${strategy}`);
    }

    const action = agent.chooseAction(board, player);
    const reasoning = this.explainMove(board, action, player, strategy);
    const confidence = this.calculateConfidence(board, action, player);

    return { action, reasoning, confidence };
  }

  private explainMove(board: Board, action: Action, player: Player, strategy: string): string {
    const explanations = {
      minimax: '通过完全搜索博弈树，这是理论最优选择',
      qlearning: '基于大量对局经验学习，这个位置表现最佳',
      defensive: '优先防守策略，确保不给对手机会',
      greedy: '贪心策略，寻找立即获胜的机会'
    };

    let baseExplanation = explanations[strategy as keyof typeof explanations] || '基于AI分析';

    // 检查特殊情况
    if (this.canWinInOneMove(board, action, player)) {
      return `${baseExplanation} - 这一步可以直接获胜！`;
    }

    const opponent = player === 'X' ? 'O' : 'X';
    if (this.canWinInOneMove(board, action, opponent)) {
      return `${baseExplanation} - 必须阻止对手获胜`;
    }

    if (action.row === 1 && action.col === 1) {
      return `${baseExplanation} - 占据中心位置，控制全局`;
    }

    if ((action.row === 0 || action.row === 2) && (action.col === 0 || action.col === 2)) {
      return `${baseExplanation} - 选择角落位置，较为安全`;
    }

    return `${baseExplanation} - 当前局面下的合理选择`;
  }

  private canWinInOneMove(board: Board, action: Action, player: Player): boolean {
    const testBoard = board.map(row => [...row]);
    testBoard[action.row][action.col] = player;
    return checkWinner(testBoard) === player;
  }

  private calculateConfidence(board: Board, action: Action, player: Player): number {
    let confidence = 0.7; // 基础置信度

    if (this.canWinInOneMove(board, action, player)) {
      confidence = 0.95; // 获胜移动
    } else {
      const opponent = player === 'X' ? 'O' : 'X';
      if (this.canWinInOneMove(board, action, opponent)) {
        confidence = 0.9; // 阻止对手获胜
      } else if (action.row === 1 && action.col === 1) {
        confidence = 0.85; // 中心位置
      } else if ((action.row === 0 || action.row === 2) && (action.col === 0 || action.col === 2)) {
        confidence = 0.8; // 角落位置
      }
    }

    return confidence;
  }
}

// 简化的策略规则
class SimplifiedStrategy {
  static getBasicRules(): string[] {
    return [
      '1. 见胜必取 - 如果有一步能获胜，立即执行',
      '2. 见败必防 - 如果对手下一步能获胜，必须阻止',
      '3. 中心为王 - 优先占据中心位置(2,2)',
      '4. 角落次之 - 次优选择角落位置',
      '5. 边缘最后 - 避免选择边缘位置'
    ];
  }

  static analyzePosition(board: Board, player: Player): string[] {
    const analysis: string[] = [];
    const actions = getLegalActions(board);

    // 检查获胜机会
    for (const action of actions) {
      const testBoard = board.map(row => [...row]);
      testBoard[action.row][action.col] = player;
      if (checkWinner(testBoard) === player) {
        analysis.push(`🎯 获胜机会：位置(${action.row + 1}, ${action.col + 1})可以获胜！`);
      }
    }

    // 检查防守需求
    const opponent = player === 'X' ? 'O' : 'X';
    for (const action of actions) {
      const testBoard = board.map(row => [...row]);
      testBoard[action.row][action.col] = opponent;
      if (checkWinner(testBoard) === opponent) {
        analysis.push(`🛡️ 防守要紧：必须在位置(${action.row + 1}, ${action.col + 1})阻止对手！`);
      }
    }

    // 一般建议
    if (analysis.length === 0) {
      if (board[1][1] === null) {
        analysis.push('💡 建议：优先占据中心位置(2,2)');
      } else {
        const corners = actions.filter(a => 
          (a.row === 0 || a.row === 2) && (a.col === 0 || a.col === 2)
        );
        if (corners.length > 0) {
          analysis.push('💡 建议：考虑占据角落位置');
        }
      }
    }

    return analysis;
  }
}

// 命令行界面
class TicTacToeMVP {
  private rl: readline.Interface;
  private aiEngine: SimplifiedAIEngine;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.aiEngine = new SimplifiedAIEngine();
  }

  async start(): Promise<void> {
    console.log('🤖 AI辅助井字棋 MVP版本');
    console.log('=' .repeat(50));
    console.log('功能：手动输入棋盘状态，获取AI建议和策略解释\n');

    this.showHelp();
    await this.mainLoop();
  }

  private showHelp(): void {
    console.log('📖 使用说明：');
    console.log('- 输入棋盘状态，用X、O、.表示（.表示空位）');
    console.log('- 例如：X.O/.X./..O 表示一个3x3棋盘');
    console.log('- 输入 help 查看帮助');
    console.log('- 输入 rules 查看基本策略规则');
    console.log('- 输入 demo 查看演示');
    console.log('- 输入 quit 退出程序\n');
  }

  private async mainLoop(): Promise<void> {
    while (true) {
      try {
        const input = await this.question('请输入命令或棋盘状态: ');
        
        if (input.toLowerCase() === 'quit') {
          console.log('👋 再见！');
          break;
        } else if (input.toLowerCase() === 'help') {
          this.showHelp();
        } else if (input.toLowerCase() === 'rules') {
          this.showRules();
        } else if (input.toLowerCase() === 'demo') {
          await this.runDemo();
        } else if (input.includes('X') || input.includes('O') || input.includes('.')) {
          await this.analyzeBoardInput(input);
        } else {
          console.log('❌ 无效输入，请输入 help 查看帮助\n');
        }
      } catch (error) {
        console.error('❌ 错误:', error);
      }
    }

    this.rl.close();
  }

  private showRules(): void {
    console.log('\n📋 基本策略规则：');
    const rules = SimplifiedStrategy.getBasicRules();
    rules.forEach(rule => console.log(`   ${rule}`));
    console.log();
  }

  private async runDemo(): Promise<void> {
    console.log('\n🎮 演示：分析一个中局局面');
    console.log('棋盘状态：');
    const demoBoard = 'X.O/.X./..O';
    await this.analyzeBoardInput(demoBoard);
  }

  private async analyzeBoardInput(input: string): Promise<void> {
    try {
      const { board, currentPlayer } = this.parseBoardInput(input);
      
      console.log('\n📋 当前棋盘：');
      this.displayBoard(board);
      
      console.log(`\n🎯 当前玩家：${currentPlayer}`);
      
      // 检查游戏是否结束
      const winner = checkWinner(board);
      if (winner) {
        console.log(`🏆 游戏结束，${winner} 获胜！\n`);
        return;
      }

      const legalMoves = getLegalActions(board);
      if (legalMoves.length === 0) {
        console.log('🤝 游戏结束，平局！\n');
        return;
      }

      // 获取AI建议
      console.log('\n🤖 AI分析：');
      const strategies = ['minimax', 'defensive', 'greedy'];
      
      for (const strategy of strategies) {
        try {
          const decision = this.aiEngine.getDecision(board, currentPlayer, strategy);
          const strategyName = this.getStrategyName(strategy);
          console.log(`\n   ${strategyName}：`);
          console.log(`   推荐位置：(${decision.action.row + 1}, ${decision.action.col + 1})`);
          console.log(`   置信度：${(decision.confidence * 100).toFixed(1)}%`);
          console.log(`   理由：${decision.reasoning}`);
        } catch (error) {
          console.log(`   ${strategy}策略分析失败：${error}`);
        }
      }

      // 显示策略分析
      console.log('\n💡 策略分析：');
      const analysis = SimplifiedStrategy.analyzePosition(board, currentPlayer);
      analysis.forEach(tip => console.log(`   ${tip}`));
      
      console.log();
    } catch (error) {
      console.error('❌ 棋盘解析失败:', error);
      console.log('💡 正确格式示例：X.O/.X./..O （用/分隔行，.表示空位）\n');
    }
  }

  private parseBoardInput(input: string): { board: Board; currentPlayer: Player } {
    // 移除空格并转换为大写
    const cleaned = input.replace(/\s/g, '').toUpperCase();
    
    // 支持两种格式：
    // 1. 用/分隔行：X.O/.X./..O
    // 2. 连续9个字符：X.O.X...O
    
    let boardStr: string;
    if (cleaned.includes('/')) {
      boardStr = cleaned.replace(/\//g, '');
    } else {
      boardStr = cleaned;
    }

    if (boardStr.length !== 9) {
      throw new Error('棋盘必须包含9个位置');
    }

    const board: Board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];

    let xCount = 0;
    let oCount = 0;

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const char = boardStr[i];

      if (char === 'X') {
        board[row][col] = 'X';
        xCount++;
      } else if (char === 'O') {
        board[row][col] = 'O';
        oCount++;
      } else if (char === '.') {
        board[row][col] = null;
      } else {
        throw new Error(`无效字符: ${char}，只能使用X、O、.`);
      }
    }

    // 推断当前玩家（X先手）
    const currentPlayer: Player = xCount === oCount ? 'X' : 'O';

    return { board, currentPlayer };
  }

  private displayBoard(board: Board): void {
    console.log('   1   2   3');
    for (let row = 0; row < 3; row++) {
      let line = `${row + 1}  `;
      for (let col = 0; col < 3; col++) {
        const cell = board[row][col] || ' ';
        line += cell;
        if (col < 2) line += ' | ';
      }
      console.log(line);
      if (row < 2) console.log('  -----------');
    }
  }

  private getStrategyName(strategy: string): string {
    const names: { [key: string]: string } = {
      'minimax': '🧠 极小极大算法',
      'qlearning': '🎓 Q学习算法',
      'defensive': '🛡️ 防守策略',
      'greedy': '⚡ 贪心策略'
    };
    return names[strategy] || strategy;
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// 启动程序
if (require.main === module) {
  const mvp = new TicTacToeMVP();
  mvp.start().catch(console.error);
}

export { TicTacToeMVP, SimplifiedAIEngine, SimplifiedStrategy };
