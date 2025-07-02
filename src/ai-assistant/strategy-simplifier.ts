/**
 * 策略简化器 - 将复杂AI算法转化为人类可理解的简单规则
 */

import { Board, Player, Action } from '../tic-tac-toe/types';
import { getLegalActions, checkWinner, makeMove } from '../tic-tac-toe/game';

// 简化规则
export interface SimplifiedRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: (board: Board, player: Player) => boolean;
  getAction: (board: Board, player: Player) => Action | null;
  explanation: string;
}

// 策略级别
export enum StrategyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// 规则应用结果
export interface RuleApplication {
  rule: SimplifiedRule;
  action: Action;
  confidence: number;
  reasoning: string;
}

/**
 * 策略简化器主类
 */
export class StrategySimplifier {
  private rules: Map<StrategyLevel, SimplifiedRule[]> = new Map();
  
  constructor() {
    this.initializeRules();
  }

  /**
   * 初始化所有级别的规则
   */
  private initializeRules(): void {
    this.rules.set(StrategyLevel.BEGINNER, this.createBeginnerRules());
    this.rules.set(StrategyLevel.INTERMEDIATE, this.createIntermediateRules());
    this.rules.set(StrategyLevel.ADVANCED, this.createAdvancedRules());
  }

  /**
   * 创建初级规则
   */
  private createBeginnerRules(): SimplifiedRule[] {
    return [
      {
        id: 'win_immediately',
        name: '立即获胜',
        description: '如果有一步能获胜，立即下这一步',
        priority: 100,
        condition: (board, player) => this.canWinInOneMove(board, player),
        getAction: (board, player) => this.findWinningMove(board, player),
        explanation: '发现获胜机会时必须立即获胜'
      },
      {
        id: 'block_opponent_win',
        name: '阻止对手获胜',
        description: '如果对手下一步能获胜，必须阻止',
        priority: 90,
        condition: (board, player) => this.opponentCanWin(board, player),
        getAction: (board, player) => this.findBlockingMove(board, player),
        explanation: '防止对手获胜是最重要的防守策略'
      },
      {
        id: 'take_center',
        name: '占据中心',
        description: '如果中心位置空着，优先占据',
        priority: 30,
        condition: (board, player) => board[1][1] === null,
        getAction: (board, player) => ({ row: 1, col: 1 }),
        explanation: '中心位置能形成最多的获胜线路'
      },
      {
        id: 'take_corner',
        name: '占据角落',
        description: '优先选择角落位置',
        priority: 20,
        condition: (board, player) => this.hasAvailableCorner(board),
        getAction: (board, player) => this.findBestCorner(board, player),
        explanation: '角落位置相对安全且有较好的发展空间'
      }
    ];
  }

  /**
   * 创建中级规则
   */
  private createIntermediateRules(): SimplifiedRule[] {
    const beginnerRules = this.createBeginnerRules();
    
    const intermediateRules: SimplifiedRule[] = [
      {
        id: 'create_fork',
        name: '创造分叉',
        description: '创造两个获胜威胁，让对手无法同时阻止',
        priority: 70,
        condition: (board, player) => this.canCreateFork(board, player),
        getAction: (board, player) => this.findForkMove(board, player),
        explanation: '分叉是强大的进攻策略，能创造必胜局面'
      },
      {
        id: 'block_fork',
        name: '阻止分叉',
        description: '阻止对手创造分叉威胁',
        priority: 80,
        condition: (board, player) => this.opponentCanCreateFork(board, player),
        getAction: (board, player) => this.findForkBlockMove(board, player),
        explanation: '及时阻止对手的分叉威胁'
      },
      {
        id: 'opposite_corner',
        name: '对角策略',
        description: '如果对手占据角落，考虑占据对角',
        priority: 25,
        condition: (board, player) => this.shouldTakeOppositeCorner(board, player),
        getAction: (board, player) => this.findOppositeCorner(board, player),
        explanation: '对角策略能有效限制对手的发展'
      }
    ];

    return [...beginnerRules, ...intermediateRules];
  }

  /**
   * 创建高级规则
   */
  private createAdvancedRules(): SimplifiedRule[] {
    const intermediateRules = this.createIntermediateRules();
    
    const advancedRules: SimplifiedRule[] = [
      {
        id: 'tempo_control',
        name: '节奏控制',
        description: '控制游戏节奏，迫使对手被动应对',
        priority: 60,
        condition: (board, player) => this.canControlTempo(board, player),
        getAction: (board, player) => this.findTempoMove(board, player),
        explanation: '通过威胁控制游戏主动权'
      },
      {
        id: 'sacrifice_strategy',
        name: '牺牲策略',
        description: '有时需要牺牲一个威胁来创造更大的优势',
        priority: 50,
        condition: (board, player) => this.shouldSacrifice(board, player),
        getAction: (board, player) => this.findSacrificeMove(board, player),
        explanation: '高级策略：短期牺牲换取长期优势'
      }
    ];

    return [...intermediateRules, ...advancedRules];
  }

  /**
   * 获取最佳移动建议
   */
  getBestMove(board: Board, player: Player, level: StrategyLevel = StrategyLevel.INTERMEDIATE): RuleApplication | null {
    const rules = this.rules.get(level) || [];
    
    // 按优先级排序
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      if (rule.condition(board, player)) {
        const action = rule.getAction(board, player);
        if (action && this.isValidMove(board, action)) {
          return {
            rule,
            action,
            confidence: this.calculateConfidence(rule, board, player),
            reasoning: this.generateReasoning(rule, action, board, player)
          };
        }
      }
    }
    
    return null;
  }

  /**
   * 获取所有适用的规则
   */
  getApplicableRules(board: Board, player: Player, level: StrategyLevel): SimplifiedRule[] {
    const rules = this.rules.get(level) || [];
    return rules.filter(rule => rule.condition(board, player));
  }

  /**
   * 生成策略口诀
   */
  generateStrategyMnemonic(level: StrategyLevel): string[] {
    const mnemonics: { [key in StrategyLevel]: string[] } = {
      [StrategyLevel.BEGINNER]: [
        '见胜必取，见败必防',
        '中心为王，角落次之',
        '边缘最后，谨慎为上'
      ],
      [StrategyLevel.INTERMEDIATE]: [
        '攻守兼备，分叉制胜',
        '阻敌分叉，保己安全',
        '对角呼应，控制全局'
      ],
      [StrategyLevel.ADVANCED]: [
        '节奏在手，主动出击',
        '适时牺牲，换取优势',
        '深谋远虑，步步为营'
      ]
    };
    
    return mnemonics[level];
  }

  /**
   * 分析当前局面
   */
  analyzePosition(board: Board, player: Player): {
    phase: 'opening' | 'middle' | 'endgame';
    threats: Action[];
    opportunities: Action[];
    recommendations: string[];
  } {
    const moveCount = this.countMoves(board);
    const phase = moveCount <= 2 ? 'opening' : moveCount <= 6 ? 'middle' : 'endgame';
    
    const threats = this.findThreats(board, player);
    const opportunities = this.findOpportunities(board, player);
    const recommendations = this.generateRecommendations(board, player, phase);
    
    return { phase, threats, opportunities, recommendations };
  }

  // ===== 辅助方法 =====

  private canWinInOneMove(board: Board, player: Player): boolean {
    return this.findWinningMove(board, player) !== null;
  }

  private findWinningMove(board: Board, player: Player): Action | null {
    const actions = getLegalActions(board);
    for (const action of actions) {
      const testBoard = makeMove(board, action, player);
      if (checkWinner(testBoard) === player) {
        return action;
      }
    }
    return null;
  }

  private opponentCanWin(board: Board, player: Player): boolean {
    const opponent = player === 'X' ? 'O' : 'X';
    return this.findWinningMove(board, opponent) !== null;
  }

  private findBlockingMove(board: Board, player: Player): Action | null {
    const opponent = player === 'X' ? 'O' : 'X';
    return this.findWinningMove(board, opponent);
  }

  private hasAvailableCorner(board: Board): boolean {
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    return corners.some(([row, col]) => board[row][col] === null);
  }

  private findBestCorner(board: Board, player: Player): Action | null {
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    for (const [row, col] of corners) {
      if (board[row][col] === null) {
        return { row, col };
      }
    }
    return null;
  }

  private canCreateFork(board: Board, player: Player): boolean {
    const actions = getLegalActions(board);
    for (const action of actions) {
      const testBoard = makeMove(board, action, player);
      if (this.countWinningMoves(testBoard, player) >= 2) {
        return true;
      }
    }
    return false;
  }

  private findForkMove(board: Board, player: Player): Action | null {
    const actions = getLegalActions(board);
    for (const action of actions) {
      const testBoard = makeMove(board, action, player);
      if (this.countWinningMoves(testBoard, player) >= 2) {
        return action;
      }
    }
    return null;
  }

  private opponentCanCreateFork(board: Board, player: Player): boolean {
    const opponent = player === 'X' ? 'O' : 'X';
    return this.canCreateFork(board, opponent);
  }

  private findForkBlockMove(board: Board, player: Player): Action | null {
    const opponent = player === 'X' ? 'O' : 'X';
    return this.findForkMove(board, opponent);
  }

  private shouldTakeOppositeCorner(board: Board, player: Player): boolean {
    const opponent = player === 'X' ? 'O' : 'X';
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    const opposites = [[2, 2], [2, 0], [0, 2], [0, 0]];
    
    for (let i = 0; i < corners.length; i++) {
      const [row, col] = corners[i];
      const [oppRow, oppCol] = opposites[i];
      if (board[row][col] === opponent && board[oppRow][oppCol] === null) {
        return true;
      }
    }
    return false;
  }

  private findOppositeCorner(board: Board, player: Player): Action | null {
    const opponent = player === 'X' ? 'O' : 'X';
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    const opposites = [[2, 2], [2, 0], [0, 2], [0, 0]];
    
    for (let i = 0; i < corners.length; i++) {
      const [row, col] = corners[i];
      const [oppRow, oppCol] = opposites[i];
      if (board[row][col] === opponent && board[oppRow][oppCol] === null) {
        return { row: oppRow, col: oppCol };
      }
    }
    return null;
  }

  private canControlTempo(board: Board, player: Player): boolean {
    // 简化实现：检查是否能创造威胁
    return this.findThreats(board, player).length > 0;
  }

  private findTempoMove(board: Board, player: Player): Action | null {
    const threats = this.findThreats(board, player);
    return threats.length > 0 ? threats[0] : null;
  }

  private shouldSacrifice(board: Board, player: Player): boolean {
    // 简化实现：在特定情况下考虑牺牲
    return false;
  }

  private findSacrificeMove(board: Board, player: Player): Action | null {
    return null;
  }

  private countWinningMoves(board: Board, player: Player): number {
    const actions = getLegalActions(board);
    let count = 0;
    for (const action of actions) {
      const testBoard = makeMove(board, action, player);
      if (checkWinner(testBoard) === player) {
        count++;
      }
    }
    return count;
  }

  private countMoves(board: Board): number {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null) count++;
      }
    }
    return count;
  }

  private findThreats(board: Board, player: Player): Action[] {
    const actions = getLegalActions(board);
    const threats: Action[] = [];
    
    for (const action of actions) {
      const testBoard = makeMove(board, action, player);
      if (this.countWinningMoves(testBoard, player) > 0) {
        threats.push(action);
      }
    }
    
    return threats;
  }

  private findOpportunities(board: Board, player: Player): Action[] {
    // 简化实现：返回所有合法移动
    return getLegalActions(board);
  }

  private generateRecommendations(board: Board, player: Player, phase: string): string[] {
    const recommendations: string[] = [];
    
    if (phase === 'opening') {
      recommendations.push('开局阶段：优先占据中心或角落');
    } else if (phase === 'middle') {
      recommendations.push('中局阶段：寻找分叉机会，注意防守');
    } else {
      recommendations.push('残局阶段：精确计算，不要出错');
    }
    
    return recommendations;
  }

  private isValidMove(board: Board, action: Action): boolean {
    return action.row >= 0 && action.row < 3 && 
           action.col >= 0 && action.col < 3 && 
           board[action.row][action.col] === null;
  }

  private calculateConfidence(rule: SimplifiedRule, board: Board, player: Player): number {
    // 基于规则优先级和当前局面计算置信度
    return Math.min(0.95, rule.priority / 100);
  }

  private generateReasoning(rule: SimplifiedRule, action: Action, board: Board, player: Player): string {
    return `应用规则"${rule.name}"：${rule.explanation}。建议在位置(${action.row + 1}, ${action.col + 1})落子。`;
  }

  /**
   * 获取学习建议
   */
  getLearningAdvice(level: StrategyLevel): {
    concepts: string[];
    exercises: string[];
    nextLevel: string;
  } {
    const advice = {
      [StrategyLevel.BEGINNER]: {
        concepts: [
          '理解获胜条件：三子连线',
          '学会识别直接威胁',
          '掌握基本位置价值：中心>角落>边缘'
        ],
        exercises: [
          '练习识别一步获胜的机会',
          '练习阻止对手获胜',
          '熟悉开局的基本原则'
        ],
        nextLevel: '掌握基础后，学习中级的分叉策略'
      },
      [StrategyLevel.INTERMEDIATE]: {
        concepts: [
          '理解分叉战术的威力',
          '学会预判对手的分叉威胁',
          '掌握对角策略的运用'
        ],
        exercises: [
          '练习创造和识别分叉',
          '练习多步预判',
          '学习复杂局面的评估'
        ],
        nextLevel: '进阶到高级的节奏控制和牺牲策略'
      },
      [StrategyLevel.ADVANCED]: {
        concepts: [
          '掌握游戏节奏的控制',
          '理解牺牲策略的时机',
          '学会心理战术的运用'
        ],
        exercises: [
          '练习复杂局面的深度分析',
          '学习在劣势下的翻盘技巧',
          '掌握完美游戏的理论'
        ],
        nextLevel: '已达到最高级别，可以挑战其他棋类游戏'
      }
    };

    return advice[level];
  }

  /**
   * 评估玩家水平
   */
  assessPlayerLevel(gameHistory: Array<{ board: Board; action: Action; player: Player }>): {
    estimatedLevel: StrategyLevel;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } {
    let basicMistakes = 0;
    let missedWins = 0;
    let missedBlocks = 0;
    let goodMoves = 0;

    for (const game of gameHistory) {
      const { board, action, player } = game;

      // 检查是否错过获胜机会
      if (this.canWinInOneMove(board, player)) {
        const winMove = this.findWinningMove(board, player);
        if (!winMove || (winMove.row !== action.row || winMove.col !== action.col)) {
          missedWins++;
        } else {
          goodMoves++;
        }
      }

      // 检查是否错过阻止对手获胜
      if (this.opponentCanWin(board, player)) {
        const blockMove = this.findBlockingMove(board, player);
        if (!blockMove || (blockMove.row !== action.row || blockMove.col !== action.col)) {
          missedBlocks++;
        } else {
          goodMoves++;
        }
      }

      // 检查基本错误（如选择边缘而非中心）
      if (board[1][1] === null && (action.row !== 1 || action.col !== 1)) {
        if ((action.row === 0 || action.row === 2) && (action.col === 1) ||
            (action.col === 0 || action.col === 2) && (action.row === 1)) {
          basicMistakes++;
        }
      }
    }

    const totalMoves = gameHistory.length;
    const errorRate = (basicMistakes + missedWins + missedBlocks) / totalMoves;

    let estimatedLevel: StrategyLevel;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    if (errorRate > 0.5) {
      estimatedLevel = StrategyLevel.BEGINNER;
      if (missedWins > totalMoves * 0.3) {
        weaknesses.push('经常错过获胜机会');
        suggestions.push('加强练习识别获胜模式');
      }
      if (missedBlocks > totalMoves * 0.3) {
        weaknesses.push('防守意识不足');
        suggestions.push('学会优先阻止对手获胜');
      }
    } else if (errorRate > 0.2) {
      estimatedLevel = StrategyLevel.INTERMEDIATE;
      if (goodMoves > totalMoves * 0.6) {
        strengths.push('基本战术掌握良好');
      }
      suggestions.push('学习分叉策略提升进攻能力');
    } else {
      estimatedLevel = StrategyLevel.ADVANCED;
      strengths.push('战术执行精准');
      strengths.push('很少犯基本错误');
      suggestions.push('可以尝试更复杂的棋类游戏');
    }

    return { estimatedLevel, strengths, weaknesses, suggestions };
  }
}
