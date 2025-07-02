/**
 * 共享类型定义
 * 用于MVP工具和AI助手框架之间的类型统一
 */

// 基础游戏类型（与现有tic-tac-toe/types.ts保持兼容）
export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[][];
export type Action = { row: number; col: number };

// MVP工具类型（从scripts/run-mvp.ts导出）
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

// 策略相关类型
export interface StrategyAgent {
  chooseAction(board: Board, player: Player): Action;
}

export interface StrategyDecision {
  action: Action;
  confidence: number;
  reasoning: string;
  strategyName: string;
}

export interface StrategyConfig {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

// 系统配置类型
export interface SystemConfig {
  strategies: StrategyConfig[];
  ui: {
    theme: 'ascii' | 'unicode' | 'minimal';
    showConfidence: boolean;
    showReasoning: boolean;
  };
  performance: {
    maxThinkingTime: number;
    enableCaching: boolean;
  };
}

// 游戏状态类型
export interface GameState {
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  winner: Player | 'Draw' | null;
  isGameOver: boolean;
}

// 分析结果类型
export interface AnalysisResult {
  strategies: StrategyDecision[];
  recommendations: string[];
  gameState: GameState;
  timestamp: number;
}

// 错误类型
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

// 性能指标类型
export interface PerformanceMetrics {
  recognitionTime?: number;
  decisionTime: number;
  totalTime: number;
  memoryUsage?: number;
}

// 用户交互类型
export interface UserInput {
  type: 'position' | 'command' | 'board_string';
  value: string;
  timestamp: number;
}

export interface UserOutput {
  type: 'board' | 'analysis' | 'message' | 'error';
  content: string;
  timestamp: number;
}

// 学习和训练类型
export interface TrainingData {
  board: Board;
  player: Player;
  action: Action;
  outcome: 'win' | 'lose' | 'draw';
  reward: number;
}

export interface LearningProgress {
  gamesPlayed: number;
  winRate: number;
  averageReward: number;
  improvementRate: number;
}

// 可视化类型
export interface VisualizationConfig {
  showPositionNumbers: boolean;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  colorScheme: 'default' | 'high_contrast' | 'colorblind_friendly';
}

// 导出工具函数类型
export type PositionParser = (input: string) => Position;
export type BoardFormatter = (board: Board, config?: VisualizationConfig) => string;
export type StrategyEvaluator = (board: Board, player: Player) => StrategyDecision[];

// 常量定义
export const GAME_CONSTANTS = {
  BOARD_SIZE: 3,
  MAX_MOVES: 9,
  PLAYERS: ['X', 'O'] as const,
  EMPTY_CELL: null,
  POSITIONS: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
  ] as const
} as const;

// 策略名称常量
export const STRATEGY_NAMES = {
  MINIMAX: 'minimax',
  QLEARNING: 'qlearning',
  DEFENSIVE: 'defensive',
  GREEDY: 'greedy',
  RANDOM: 'random'
} as const;

// 错误代码常量
export const ERROR_CODES = {
  INVALID_POSITION: 'INVALID_POSITION',
  POSITION_OCCUPIED: 'POSITION_OCCUPIED',
  GAME_OVER: 'GAME_OVER',
  INVALID_PLAYER: 'INVALID_PLAYER',
  STRATEGY_NOT_FOUND: 'STRATEGY_NOT_FOUND',
  BOARD_PARSE_ERROR: 'BOARD_PARSE_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
} as const;

// 类型守卫函数
export function isValidPosition(pos: any): pos is Position {
  return typeof pos === 'object' && 
         typeof pos.row === 'number' && 
         typeof pos.col === 'number' &&
         pos.row >= 0 && pos.row < 3 &&
         pos.col >= 0 && pos.col < 3;
}

export function isValidPlayer(player: any): player is Player {
  return player === 'X' || player === 'O';
}

export function isValidCell(cell: any): cell is Cell {
  return cell === null || cell === 'X' || cell === 'O';
}

export function isValidBoard(board: any): board is Board {
  return Array.isArray(board) &&
         board.length === 3 &&
         board.every(row => 
           Array.isArray(row) && 
           row.length === 3 && 
           row.every(cell => isValidCell(cell))
         );
}

// 工具函数类型
export interface GameUtils {
  createEmptyBoard(): Board;
  copyBoard(board: Board): Board;
  isPositionEmpty(board: Board, position: Position): boolean;
  makeMove(board: Board, position: Position, player: Player): Board;
  checkWinner(board: Board): Player | 'Draw' | null;
  getLegalMoves(board: Board): Position[];
  isGameOver(board: Board): boolean;
  getBoardString(board: Board): string;
  parseBoardString(boardString: string): Board;
}

// 策略接口
export interface StrategyInterface {
  name: string;
  description: string;
  getDecision(board: Board, player: Player): StrategyDecision;
  configure?(config: Record<string, any>): void;
  reset?(): void;
}

// 适配器接口
export interface AdapterInterface {
  convertMVPToStrategy(mvpBoard: Board): Board;
  convertStrategyToMVP(strategyBoard: Board): Board;
  convertPositionToAction(position: Position): Action;
  convertActionToPosition(action: Action): Position;
}

// 事件类型
export interface GameEvent {
  type: 'move' | 'game_over' | 'reset' | 'analysis' | 'error';
  data: any;
  timestamp: number;
}

export type EventHandler = (event: GameEvent) => void;

// 插件接口
export interface PluginInterface {
  name: string;
  version: string;
  initialize(config: any): Promise<void>;
  destroy(): Promise<void>;
  onGameEvent?(event: GameEvent): void;
}

// 配置验证类型
export interface ConfigValidator {
  validate(config: any): { isValid: boolean; errors: string[] };
  getDefaultConfig(): SystemConfig;
}
