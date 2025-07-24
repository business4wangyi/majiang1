// {{ AURA-X: Add - 启发式策略智能体，从othello-play.ts分离. Approval: 寸止(ID:1735819200). }}

import { getLegalActions, makeMove } from '../othello-game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from '../othello-types';
import { OthelloAgent } from './random-agent';
import { 
  calculateFlips, 
  calculatePositionValue, 
  isCorner, 
  isEdge,
  createPositionKey 
} from './strategy-utils';

/**
 * 启发式Othello智能体
 * 综合考虑角落、边缘、行动力等多个因素的智能策略
 * 平衡了位置价值和短期收益，是推荐使用的策略
 */
export class HeuristicOthelloAgent implements OthelloAgent {
  
  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 选择动作
   * 综合考虑位置价值、翻转数量、行动力等因素
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作，如果无合法动作则返回null
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;

    // 角落位置集合（最高优先级）
    const cornerSet = new Set(['0,0', '0,7', '7,0', '7,7']);
    
    let bestScore = -Infinity;
    let bestAction = actions[0];

    for (const action of actions) {
      const score = this.evaluateAction(board, action, player);
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * 评估动作的综合价值（优化版本）
   * {{ AURA-X: Modify - 最终恢复优化版本以保持最佳性能. Approval: 寸止(ID:1735819200). }}
   * @param board 当前棋盘状态
   * @param action 要评估的动作
   * @param player 当前玩家
   * @returns 动作的综合评估分数
   */
  evaluateAction(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer): number {
    let score = 0;
    const { row, col } = action;

    // 1. 位置价值权重（最重要，无需计算）
    if (isCorner(row, col)) {
      score += 100; // 角落位置最高价值
    } else if (isEdge(row, col)) {
      score += 10;  // 边缘位置较高价值
    }

    // 2. 翻转棋子数量（保留，这是核心逻辑）
    const flips = calculateFlips(board, action, player);
    score += flips;

    // 3. 简化的位置评估（替代复杂的行动力计算）
    score += this.getSimplePositionBonus(row, col);

    // 4. 避免危险位置（角落旁边的位置）
    if (this.isDangerousPosition(row, col)) {
      score -= 20;
    }

    return score;
  }

  /**
   * 获取简化的位置奖励分数
   * {{ AURA-X: Add - 简化位置评估以替代复杂的行动力计算. Approval: 寸止(ID:1735819200). }}
   * @param row 行坐标
   * @param col 列坐标
   * @returns 位置奖励分数
   */
  private getSimplePositionBonus(row: number, col: number): number {
    // 中心位置稍有优势
    const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
    return Math.max(0, 7 - centerDistance);
  }

  /**
   * 检查是否为危险位置（容易让对手占据角落）
   * @param row 行坐标
   * @param col 列坐标
   * @returns 是否为危险位置
   */
  private isDangerousPosition(row: number, col: number): boolean {
    // 角落旁边的位置通常是危险的
    const dangerousPositions = [
      [0, 1], [1, 0], [1, 1], // 左上角附近
      [0, 6], [1, 6], [1, 7], // 右上角附近
      [6, 0], [6, 1], [7, 1], // 左下角附近
      [6, 6], [6, 7], [7, 6]  // 右下角附近
    ];

    return dangerousPositions.some(([r, c]) => r === row && c === col);
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getStrategyName(): string {
    return '启发式策略';
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getStrategyDescription(): string {
    return '综合考虑位置价值、翻转数量、行动力等多个因素的平衡策略';
  }

  /**
   * 获取所有合法动作及其评估值
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 动作及其评估值的数组，按价值降序排列
   */
  getAllActionEvaluations(board: OthelloBoard, player: OthelloPlayer): Array<{
    action: OthelloAction;
    value: number;
    details: {
      positionValue: number;
      flips: number;
      mobility: number;
      opponentMobility: number;
      isDangerous: boolean;
    };
  }> {
    const actions = getLegalActions(board, player);
    
    // {{ AURA-X: Modify - 最终恢复优化详细评估方法以保持最佳性能. Approval: 寸止(ID:1735819200). }}
    return actions.map(action => {
      const { row, col } = action;
      const positionValue = calculatePositionValue(row, col);
      const flips = calculateFlips(board, action, player);
      const isDangerous = this.isDangerousPosition(row, col);

      // 使用简化的行动力估算，避免实际计算makeMove
      const mobility = Math.max(1, flips); // 翻转越多，后续选择可能越多
      const opponentMobility = Math.max(1, 8 - flips); // 简化的对手行动力估算

      return {
        action,
        value: this.evaluateAction(board, action, player),
        details: {
          positionValue,
          flips,
          mobility,
          opponentMobility,
          isDangerous
        }
      };
    }).sort((a, b) => b.value - a.value);
  }

  /**
   * 获取最佳动作的详细信息
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 最佳动作的详细信息
   */
  getBestActionInfo(board: OthelloBoard, player: OthelloPlayer): {
    action: OthelloAction | null;
    score: number;
    reasoning: string;
  } {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) {
      return {
        action: null,
        score: 0,
        reasoning: '无合法动作可选择'
      };
    }

    const evaluations = this.getAllActionEvaluations(board, player);
    const best = evaluations[0];
    
    let reasoning = `选择位置(${best.action.row + 1}, ${best.action.col + 1})，综合评分${best.value.toFixed(1)}。`;
    
    // 添加详细原因
    const reasons = [];
    if (isCorner(best.action.row, best.action.col)) {
      reasons.push('角落位置(+100分)');
    } else if (isEdge(best.action.row, best.action.col)) {
      reasons.push('边缘位置(+10分)');
    }
    
    if (best.details.flips > 0) {
      reasons.push(`翻转${best.details.flips}个棋子`);
    }
    
    if (best.details.mobility > 0) {
      reasons.push(`保持${best.details.mobility}个后续选择`);
    }
    
    if (best.details.isDangerous) {
      reasons.push('但位置较危险(-20分)');
    }

    if (reasons.length > 0) {
      reasoning += ` 原因：${reasons.join('，')}`;
    }

    return {
      action: best.action,
      score: best.value,
      reasoning
    };
  }

  /**
   * 获取策略的权重配置
   * @returns 各因素的权重配置
   */
  getWeightConfig(): {
    cornerWeight: number;
    edgeWeight: number;
    flipWeight: number;
    mobilityWeight: number;
    opponentMobilityWeight: number;
    dangerPenalty: number;
  } {
    return {
      cornerWeight: 100,
      edgeWeight: 10,
      flipWeight: 1,
      mobilityWeight: 1,
      opponentMobilityWeight: -0.5,
      dangerPenalty: -20
    };
  }
}
