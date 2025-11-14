/**
 * AI计算引擎 - 集成现有AI算法，提供统一的决策接口
 */

import { Board, Player, Action } from '../../tic-tac-toe/types';
import { MinimaxAgent } from '../../tic-tac-toe/strategy/minimax-agent';
import { QLearningAgent } from '../../tic-tac-toe/strategy/qlearning-agent';
import { DefensiveAgent } from '../../tic-tac-toe/strategy/defensive-agent';
import { GreedyAgent } from '../../tic-tac-toe/strategy/greedy-agent';
import { getLegalActions, checkWinner } from '../../tic-tac-toe/game';

// AI决策结果
export interface AIDecision {
  action: Action;
  confidence: number;
  reasoning: string;
  alternatives: Array<{ action: Action; score: number; reason: string }>;
  strategy: string;
  computeTime: number;
}

// AI配置
export interface AIConfig {
  strategy: 'minimax' | 'qlearning' | 'defensive' | 'greedy' | 'hybrid';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimit?: number; // 毫秒
  explainDecisions?: boolean;
}

/**
 * 统一AI决策引擎
 */
export class AIDecisionEngine {
  private config: AIConfig;
  private agents: Map<string, any> = new Map();
  
  constructor(config: AIConfig) {
    this.config = config;
    this.initializeAgents();
  }

  /**
   * 初始化AI代理
   */
  private initializeAgents(): void {
    this.agents.set('minimax', new MinimaxAgent());
    this.agents.set('qlearning', new QLearningAgent('X', 0)); // 无探索
    this.agents.set('defensive', new DefensiveAgent());
    this.agents.set('greedy', new GreedyAgent());
    
    // 加载Q-Learning模型（如果存在）
    const qAgent = this.agents.get('qlearning') as QLearningAgent;
    try {
      qAgent.loadQTable('models/tic-tac-toe/qtable-x.json');
    } catch (error) {
      console.warn('Q表加载失败，使用未训练的模型');
    }
  }

  /**
   * 获取AI决策
   */
  async getDecision(board: Board, player: Player): Promise<AIDecision> {
    const startTime = Date.now();
    
    try {
      let decision: AIDecision;
      
      switch (this.config.strategy) {
        case 'minimax':
          decision = await this.getMinimaxDecision(board, player);
          break;
        case 'qlearning':
          decision = await this.getQLearningDecision(board, player);
          break;
        case 'defensive':
          decision = await this.getDefensiveDecision(board, player);
          break;
        case 'greedy':
          decision = await this.getGreedyDecision(board, player);
          break;
        case 'hybrid':
          decision = await this.getHybridDecision(board, player);
          break;
        default:
          throw new Error(`未知策略: ${this.config.strategy}`);
      }
      
      decision.computeTime = Date.now() - startTime;
      return decision;
      
    } catch (error) {
      // 降级到随机策略
      const actions = getLegalActions(board);
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        action: randomAction,
        confidence: 0.1,
        reasoning: `策略执行失败，使用随机选择: ${error}`,
        alternatives: [],
        strategy: 'random',
        computeTime: Date.now() - startTime
      };
    }
  }

  /**
   * Minimax策略决策
   */
  private async getMinimaxDecision(board: Board, player: Player): Promise<AIDecision> {
    const agent = this.agents.get('minimax') as MinimaxAgent;
    const action = agent.chooseAction(board, player);
    
    // 分析所有可能的行动
    const alternatives = this.analyzeAllMoves(board, player, 'minimax');
    
    return {
      action,
      confidence: 0.95,
      reasoning: this.explainMinimaxMove(board, action, player),
      alternatives,
      strategy: 'minimax'
    } as AIDecision;
  }

  /**
   * Q-Learning策略决策
   */
  private async getQLearningDecision(board: Board, player: Player): Promise<AIDecision> {
    const agent = this.agents.get('qlearning') as QLearningAgent;
    const action = agent.chooseAction(board, player);
    
    const alternatives = this.analyzeAllMoves(board, player, 'qlearning');
    
    return {
      action,
      confidence: 0.85,
      reasoning: this.explainQLearningMove(board, action, player),
      alternatives,
      strategy: 'qlearning'
    } as AIDecision;
  }

  /**
   * 防守策略决策
   */
  private async getDefensiveDecision(board: Board, player: Player): Promise<AIDecision> {
    const agent = this.agents.get('defensive') as DefensiveAgent;
    const action = agent.chooseAction(board, player);
    
    const alternatives = this.analyzeAllMoves(board, player, 'defensive');
    
    return {
      action,
      confidence: 0.80,
      reasoning: this.explainDefensiveMove(board, action, player),
      alternatives,
      strategy: 'defensive'
    } as AIDecision;
  }

  /**
   * 贪心策略决策
   */
  private async getGreedyDecision(board: Board, player: Player): Promise<AIDecision> {
    const agent = this.agents.get('greedy') as GreedyAgent;
    const action = agent.chooseAction(board, player);
    
    const alternatives = this.analyzeAllMoves(board, player, 'greedy');
    
    return {
      action,
      confidence: 0.70,
      reasoning: this.explainGreedyMove(board, action, player),
      alternatives,
      strategy: 'greedy'
    } as AIDecision;
  }

  /**
   * 混合策略决策
   */
  private async getHybridDecision(board: Board, player: Player): Promise<AIDecision> {
    // 根据游戏阶段选择不同策略
    const moveCount = this.countMoves(board);
    
    if (moveCount <= 2) {
      // 开局使用Q-Learning
      return this.getQLearningDecision(board, player);
    } else if (moveCount <= 6) {
      // 中局使用Minimax
      return this.getMinimaxDecision(board, player);
    } else {
      // 残局使用防守策略
      return this.getDefensiveDecision(board, player);
    }
  }

  /**
   * 分析所有可能的移动
   */
  private analyzeAllMoves(board: Board, player: Player, strategy: string): Array<{ action: Action; score: number; reason: string }> {
    const actions = getLegalActions(board);
    const alternatives: Array<{ action: Action; score: number; reason: string }> = [];
    
    for (const action of actions) {
      const score = this.evaluateMove(board, action, player, strategy);
      const reason = this.explainMoveScore(board, action, player, score);
      alternatives.push({ action, score, reason });
    }
    
    // 按分数排序
    alternatives.sort((a, b) => b.score - a.score);
    
    return alternatives.slice(0, 3); // 返回前3个选择
  }

  /**
   * 评估移动分数
   */
  private evaluateMove(board: Board, action: Action, player: Player, strategy: string): number {
    // 基础评估
    let score = 0;
    
    // 检查是否能获胜
    const testBoard = board.map(row => [...row]);
    testBoard[action.row][action.col] = player;
    if (checkWinner(testBoard) === player) {
      score += 1000;
    }
    
    // 检查是否能阻止对手获胜
    const opponent = player === 'X' ? 'O' : 'X';
    testBoard[action.row][action.col] = opponent;
    if (checkWinner(testBoard) === opponent) {
      score += 500;
    }
    
    // 位置价值
    const positionValues = [
      [3, 2, 3],
      [2, 4, 2],
      [3, 2, 3]
    ];
    score += positionValues[action.row][action.col];
    
    return score;
  }

  /**
   * 解释移动分数
   */
  private explainMoveScore(board: Board, action: Action, player: Player, score: number): string {
    if (score >= 1000) {
      return '获胜移动';
    } else if (score >= 500) {
      return '阻止对手获胜';
    } else if (score >= 4) {
      return '控制中心位置';
    } else if (score >= 3) {
      return '占据角落位置';
    } else {
      return '边缘位置';
    }
  }

  /**
   * 解释Minimax移动
   */
  private explainMinimaxMove(board: Board, action: Action, player: Player): string {
    const score = this.evaluateMove(board, action, player, 'minimax');
    
    if (score >= 1000) {
      return '通过完全搜索发现这是获胜移动';
    } else if (score >= 500) {
      return '必须阻止对手在下一步获胜';
    } else {
      return '基于博弈树分析，这是当前最优选择';
    }
  }

  /**
   * 解释Q-Learning移动
   */
  private explainQLearningMove(board: Board, action: Action, player: Player): string {
    return '基于大量对局经验学习，这个位置在类似局面中表现最佳';
  }

  /**
   * 解释防守移动
   */
  private explainDefensiveMove(board: Board, action: Action, player: Player): string {
    const score = this.evaluateMove(board, action, player, 'defensive');
    
    if (score >= 1000) {
      return '发现获胜机会，立即获胜';
    } else if (score >= 500) {
      return '检测到对手威胁，优先防守';
    } else {
      return '当前无直接威胁，选择较安全的位置';
    }
  }

  /**
   * 解释贪心移动
   */
  private explainGreedyMove(board: Board, action: Action, player: Player): string {
    const score = this.evaluateMove(board, action, player, 'greedy');
    
    if (score >= 1000) {
      return '发现可以立即获胜的机会';
    } else {
      return '没有立即获胜的机会，随机选择';
    }
  }

  /**
   * 计算已下棋子数量
   */
  private countMoves(board: Board): number {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null) count++;
      }
    }
    return count;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取策略建议
   */
  getStrategyAdvice(board: Board, player: Player): string[] {
    const advice: string[] = [];
    const actions = getLegalActions(board);
    
    // 检查获胜机会
    for (const action of actions) {
      const testBoard = board.map(row => [...row]);
      testBoard[action.row][action.col] = player;
      if (checkWinner(testBoard) === player) {
        advice.push(`位置(${action.row + 1}, ${action.col + 1})可以获胜！`);
      }
    }
    
    // 检查防守需求
    const opponent = player === 'X' ? 'O' : 'X';
    for (const action of actions) {
      const testBoard = board.map(row => [...row]);
      testBoard[action.row][action.col] = opponent;
      if (checkWinner(testBoard) === opponent) {
        advice.push(`必须在位置(${action.row + 1}, ${action.col + 1})防守！`);
      }
    }
    
    // 一般建议
    if (advice.length === 0) {
      if (board[1][1] === null) {
        advice.push('优先占据中心位置(2,2)');
      } else {
        advice.push('考虑占据角落位置');
      }
    }
    
    return advice;
  }
}
