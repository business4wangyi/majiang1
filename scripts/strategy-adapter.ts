import { Board as MVPBoard, Cell as MVPCell, Position, AIDecision } from './run-mvp';
import { Board as StrategyBoard, Player, Action, Cell as StrategyCell } from '../src/tic-tac-toe/types';
import { Agent } from '../src/tic-tac-toe/strategy/random-agent';
import { MinimaxAgent } from '../src/tic-tac-toe/strategy/minimax-agent';
import { RandomAgent } from '../src/tic-tac-toe/strategy/random-agent';
import { DefensiveAgent } from '../src/tic-tac-toe/strategy/defensive-agent';
import { GreedyAgent } from '../src/tic-tac-toe/strategy/greedy-agent';

// 策略适配器类 - 连接MVP和现有策略系统
export class StrategyAdapter {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    try {
      this.agents.set('minimax', new MinimaxAgent());
      this.agents.set('random', new RandomAgent());
      this.agents.set('defensive', new DefensiveAgent());
      this.agents.set('greedy', new GreedyAgent());
    } catch (error) {
      console.warn('部分策略加载失败，将使用简化版本:', error);
      // 如果导入失败，使用简化版本
      this.agents.set('minimax', new SimplifiedMinimaxAgent());
      this.agents.set('random', new SimplifiedRandomAgent());
      this.agents.set('defensive', new SimplifiedDefensiveAgent());
      this.agents.set('greedy', new SimplifiedGreedyAgent());
    }
  }

  // 将MVP棋盘格式转换为策略系统格式
  private convertMVPBoardToStrategy(mvpBoard: MVPBoard): StrategyBoard {
    return mvpBoard.map((row: MVPCell[]) =>
      row.map((cell: MVPCell) => cell as StrategyCell)
    ) as StrategyBoard;
  }

  // 将策略系统的Action转换为MVP的Position
  private convertActionToPosition(action: Action): Position {
    return { row: action.row, col: action.col };
  }

  // 获取策略决策
  getStrategyDecision(
    mvpBoard: MVPBoard, 
    player: string, 
    strategyName: string
  ): AIDecision | null {
    const agent = this.agents.get(strategyName);
    if (!agent) {
      console.warn(`未找到策略: ${strategyName}`);
      return null;
    }

    try {
      const strategyBoard = this.convertMVPBoardToStrategy(mvpBoard);
      const action = agent.chooseAction(strategyBoard, player as Player);
      const position = this.convertActionToPosition(action);

      // 计算置信度和推理
      const { confidence, reasoning } = this.calculateConfidenceAndReasoning(
        mvpBoard, player, strategyName, position
      );

      return {
        action: position,
        confidence,
        reasoning
      };
    } catch (error) {
      console.warn(`策略 ${strategyName} 执行失败:`, error);
      return null;
    }
  }

  // 计算置信度和推理说明
  private calculateConfidenceAndReasoning(
    board: MVPBoard, 
    player: string, 
    strategyName: string, 
    position: Position
  ): { confidence: number; reasoning: string } {
    // 检查是否是获胜移动
    const testBoard = board.map((row: MVPCell[]) => [...row]);
    testBoard[position.row][position.col] = player as MVPCell;
    if (this.checkWinner(testBoard) === player) {
      return {
        confidence: 0.95,
        reasoning: '发现获胜机会，立即获胜！'
      };
    }

    // 检查是否是防守移动
    const opponent = player === 'X' ? 'O' : 'X';
    const testBoardDefense = board.map((row: MVPCell[]) => [...row]);
    testBoardDefense[position.row][position.col] = opponent as MVPCell;
    if (this.checkWinner(testBoardDefense) === opponent) {
      return {
        confidence: 0.90,
        reasoning: '必须阻止对手获胜'
      };
    }

    // 根据策略类型和位置特征计算置信度
    switch (strategyName) {
      case 'minimax':
        return this.getMinimaxConfidence(board, position);
      case 'defensive':
        return this.getDefensiveConfidence(board, position);
      case 'greedy':
        return this.getGreedyConfidence(board, position);
      case 'random':
        return {
          confidence: 0.50,
          reasoning: '随机选择位置'
        };
      default:
        return {
          confidence: 0.70,
          reasoning: '策略推荐位置'
        };
    }
  }

  private getMinimaxConfidence(board: MVPBoard, position: Position): { confidence: number; reasoning: string } {
    // 中心位置
    if (position.row === 1 && position.col === 1) {
      return {
        confidence: 0.85,
        reasoning: '占据中心位置，控制全局'
      };
    }

    // 角落位置
    const corners = [[0,0], [0,2], [2,0], [2,2]];
    if (corners.some(([r, c]) => r === position.row && c === position.col)) {
      return {
        confidence: 0.80,
        reasoning: '选择角落位置，较为安全'
      };
    }

    return {
      confidence: 0.75,
      reasoning: 'Minimax算法最优选择'
    };
  }

  private getDefensiveConfidence(board: MVPBoard, position: Position): { confidence: number; reasoning: string } {
    return {
      confidence: 0.85,
      reasoning: '防守策略推荐，优先防守'
    };
  }

  private getGreedyConfidence(board: MVPBoard, position: Position): { confidence: number; reasoning: string } {
    return {
      confidence: 0.75,
      reasoning: '贪心策略选择，追求局部最优'
    };
  }

  // 简化的获胜检查（复用MVP逻辑）
  private checkWinner(board: MVPBoard): string | null {
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

  // 获取可用策略列表
  getAvailableStrategies(): string[] {
    return Array.from(this.agents.keys());
  }

  // 获取策略描述
  getStrategyDescription(strategyName: string): string {
    const descriptions: Record<string, string> = {
      'minimax': '🧠 Minimax算法 - 理论最优策略，使用博弈树搜索',
      'defensive': '🛡️ 防守策略 - 优先阻止对手获胜',
      'greedy': '⚡ 贪心策略 - 追求局部最优解',
      'random': '🎲 随机策略 - 随机选择合法位置'
    };
    return descriptions[strategyName] || '未知策略';
  }
}

// 简化版本的策略实现（作为后备方案）
class SimplifiedMinimaxAgent implements Agent {
  chooseAction(board: StrategyBoard, player: Player): Action {
    // 简化的minimax实现
    const actions = this.getLegalActions(board);
    
    // 检查获胜机会
    for (const action of actions) {
      const testBoard = this.makeMove(board, action, player);
      if (this.checkWinner(testBoard) === player) {
        return action;
      }
    }

    // 检查防守需求
    const opponent = player === 'X' ? 'O' : 'X';
    for (const action of actions) {
      const testBoard = this.makeMove(board, action, opponent);
      if (this.checkWinner(testBoard) === opponent) {
        return action;
      }
    }

    // 选择中心或角落
    if (board[1][1] === null) return { row: 1, col: 1 };
    
    const corners = [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }];
    for (const corner of corners) {
      if (board[corner.row][corner.col] === null) return corner;
    }

    return actions[0];
  }

  private getLegalActions(board: StrategyBoard): Action[] {
    const actions: Action[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          actions.push({ row, col });
        }
      }
    }
    return actions;
  }

  private makeMove(board: StrategyBoard, action: Action, player: Player): StrategyBoard {
    const newBoard = board.map(row => [...row]);
    newBoard[action.row][action.col] = player;
    return newBoard;
  }

  private checkWinner(board: StrategyBoard): Player | null {
    // 简化的获胜检查
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
    }
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];
    return null;
  }
}

class SimplifiedRandomAgent implements Agent {
  chooseAction(board: StrategyBoard, player: Player): Action {
    const actions: Action[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          actions.push({ row, col });
        }
      }
    }
    return actions[Math.floor(Math.random() * actions.length)];
  }
}

class SimplifiedDefensiveAgent implements Agent {
  chooseAction(board: StrategyBoard, player: Player): Action {
    const actions: Action[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          actions.push({ row, col });
        }
      }
    }

    // 优先防守
    const opponent = player === 'X' ? 'O' : 'X';
    for (const action of actions) {
      const testBoard = board.map(row => [...row]);
      testBoard[action.row][action.col] = opponent;
      if (this.checkWinner(testBoard) === opponent) {
        return action;
      }
    }

    return actions[0];
  }

  private checkWinner(board: StrategyBoard): Player | null {
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
    }
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];
    return null;
  }
}

class SimplifiedGreedyAgent implements Agent {
  chooseAction(board: StrategyBoard, player: Player): Action {
    const actions: Action[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          actions.push({ row, col });
        }
      }
    }

    // 贪心选择：优先中心，然后角落
    if (board[1][1] === null) return { row: 1, col: 1 };
    
    const corners = [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }];
    for (const corner of corners) {
      if (board[corner.row][corner.col] === null) return corner;
    }

    return actions[0];
  }
}
