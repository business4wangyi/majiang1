// {{ AURA-X: Add - 贪心策略智能体，从othello-play.ts分离. Approval: 寸止(ID:1735819200). }}

import { getLegalActions } from '../othello-game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from '../othello-types';
import { OthelloAgent } from './random-agent';
import { calculateFlips } from './strategy-utils';

/**
 * 贪心Othello智能体
 * 每次选择能翻转最多棋子的落子位置
 * 这是一个简单但有效的策略，适合作为基准对比
 */
export class GreedyOthelloAgent implements OthelloAgent {
  
  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 选择动作
   * 选择能翻转最多棋子的合法动作
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 选择的动作，如果无合法动作则返回null
   */
  chooseAction(board: OthelloBoard, player: OthelloPlayer): OthelloAction | null {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) return null;

    let maxFlips = -1;
    let bestAction = actions[0];

    // 遍历所有合法动作，找到能翻转最多棋子的动作
    for (const action of actions) {
      const flips = calculateFlips(board, action, player);
      
      if (flips > maxFlips) {
        maxFlips = flips;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  getStrategyName(): string {
    return '贪心策略';
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  getStrategyDescription(): string {
    return '每次选择能翻转最多棋子的落子位置，追求短期收益最大化';
  }

  /**
   * 评估动作的价值（翻转棋子数量）
   * @param board 当前棋盘状态
   * @param action 要评估的动作
   * @param player 当前玩家
   * @returns 动作价值（翻转棋子数量）
   */
  evaluateAction(board: OthelloBoard, action: OthelloAction, player: OthelloPlayer): number {
    return calculateFlips(board, action, player);
  }

  /**
   * 获取所有合法动作及其评估值
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 动作及其评估值的数组
   */
  getAllActionEvaluations(board: OthelloBoard, player: OthelloPlayer): Array<{
    action: OthelloAction;
    value: number;
  }> {
    const actions = getLegalActions(board, player);
    
    return actions.map(action => ({
      action,
      value: this.evaluateAction(board, action, player)
    })).sort((a, b) => b.value - a.value); // 按价值降序排列
  }

  /**
   * 获取最佳动作的详细信息
   * @param board 当前棋盘状态
   * @param player 当前玩家
   * @returns 最佳动作的详细信息
   */
  getBestActionInfo(board: OthelloBoard, player: OthelloPlayer): {
    action: OthelloAction | null;
    flips: number;
    reasoning: string;
  } {
    const actions = getLegalActions(board, player);
    if (actions.length === 0) {
      return {
        action: null,
        flips: 0,
        reasoning: '无合法动作可选择'
      };
    }

    let maxFlips = -1;
    let bestAction = actions[0];

    for (const action of actions) {
      const flips = calculateFlips(board, action, player);
      if (flips > maxFlips) {
        maxFlips = flips;
        bestAction = action;
      }
    }

    const reasoning = `选择位置(${bestAction.row + 1}, ${bestAction.col + 1})，可以翻转${maxFlips}个对手棋子`;

    return {
      action: bestAction,
      flips: maxFlips,
      reasoning
    };
  }
}
