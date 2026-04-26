/**
 * 麻将AlphaZero AI系统的类型定义
 * 提供与现有麻将游戏系统的兼容性接口
 */

import { Tile, TileType } from '../../core/tile';
import { Player, PlayerState } from '../../core/player';
import { TileSet } from '../../core/rule-types';

// 重新导出核心类型，确保兼容性
export { Tile, TileType } from '../../core/tile';
export { Player, PlayerState } from '../../core/player';
export { TileSet } from '../../core/rule-types';

/**
 * 游戏状态接口 - 适配现有Game类
 */
export interface GameState {
  getPlayers(): Player[];
  getCurrentPlayerIndex(): number;
  getRemainingTilesCount(): number;
  getLastDiscardedTile(): Tile | null;
  getLastDiscardPlayerIndex(): number;
  getCurrentRound(): number;
  getStatus(): 'INIT' | 'DEALING' | 'PLAYING' | 'WAITING_ACTION' | 'FINISHED';
}

/**
 * 游戏状态适配器 - 将现有Game类适配为GameState接口
 */
export class GameStateAdapter implements GameState {
  constructor(private game: any) {}

  getPlayers(): Player[] {
    return this.game.players || [];
  }

  getCurrentPlayerIndex(): number {
    return this.game.currentPlayerIndex || 0;
  }

  getRemainingTilesCount(): number {
    return this.game.tileManager?.getRemainingTiles() || 0;
  }

  getLastDiscardedTile(): Tile | null {
    return this.game.lastDiscardedTile || null;
  }

  getLastDiscardPlayerIndex(): number {
    // 简化实现，返回上一个玩家的索引
    const currentIndex = this.getCurrentPlayerIndex();
    const playerCount = this.getPlayers().length;
    return (currentIndex - 1 + playerCount) % playerCount;
  }

  getCurrentRound(): number {
    return this.game.windRound || 0;
  }

  getStatus(): 'INIT' | 'DEALING' | 'PLAYING' | 'WAITING_ACTION' | 'FINISHED' {
    const gameState = this.game.state;
    
    // 映射现有的GameState枚举到字符串
    switch (gameState) {
      case 0: // INIT
        return 'INIT';
      case 1: // DEALING
        return 'DEALING';
      case 2: // PLAYING
        return 'PLAYING';
      case 3: // WAITING_ACTION
        return 'WAITING_ACTION';
      case 4: // ENDED
        return 'FINISHED';
      default:
        return 'INIT';
    }
  }
}

/**
 * 玩家适配器 - 扩展现有Player类的接口
 */
export interface PlayerAdapter {
  getName(): string;
  getHandTiles(): Tile[];
  getRevealedSets(): TileSet[];
  getDiscardedTiles(): Tile[];
  getStatus(): 'WAITING' | 'ACTING' | 'FINISHED' | 'WON';
}

/**
 * 为现有Player类添加适配器方法
 */
export function createPlayerAdapter(player: Player): PlayerAdapter {
  return {
    getName(): string {
      return player.name;
    },

    getHandTiles(): Tile[] {
      return player.handTiles || [];
    },

    getRevealedSets(): TileSet[] {
      return player.revealedSets || [];
    },

    getDiscardedTiles(): Tile[] {
      return player.discardedTiles || [];
    },

    getStatus(): 'WAITING' | 'ACTING' | 'FINISHED' | 'WON' {
      const state = player.state;
      
      // 映射PlayerState枚举到字符串
      switch (state) {
        case 0: // WAITING
          return 'WAITING';
        case 1: // ACTING
          return 'ACTING';
        case 2: // FINISHED
          return 'FINISHED';
        case 3: // WON
          return 'WON';
        default:
          return 'WAITING';
      }
    }
  };
}

/**
 * 游戏动作类型
 */
export type ActionType = 'DISCARD' | 'CHI' | 'PENG' | 'GANG' | 'HU' | 'PASS';

/**
 * 牌型映射 - 将字符串类型转换为TileType枚举
 */
export function stringToTileType(typeStr: string): TileType {
  switch (typeStr) {
    case '万':
      return TileType.WAN;
    case '条':
      return TileType.TIAO;
    case '筒':
      return TileType.TONG;
    case '风':
      return TileType.FENG;
    case '箭':
      return TileType.JIAN;
    default:
      throw new Error(`Unknown tile type: ${typeStr}`);
  }
}

/**
 * 创建牌的工厂函数
 */
export function createTile(type: TileType, value: number, id: number = 0): Tile {
  return new Tile(type, value, id);
}

/**
 * 牌的比较函数
 */
export function tilesEqual(tile1: Tile, tile2: Tile): boolean {
  return tile1.type === tile2.type && tile1.value === tile2.value;
}

/**
 * 获取牌的显示名称
 */
export function getTileDisplayName(tile: Tile): string {
  return tile.toString();
}

/**
 * AI配置接口
 */
export interface AIConfig {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  thinkingTime: number;
  randomness: number;
  aggressiveness: number;
}

/**
 * 训练数据接口
 */
export interface TrainingData {
  gameStates: Float32Array[];
  actions: number[];
  rewards: number[];
  gameResults: number[];
}

/**
 * 模型评估结果
 */
export interface EvaluationResult {
  winRate: number;
  averageScore: number;
  gamesPlayed: number;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
  };
}

/**
 * 网络训练配置
 */
export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  saveCheckpoints: boolean;
}

/**
 * MCTS配置
 */
export interface MCTSConfig {
  simulations: number;
  explorationWeight: number;
  maxDepth: number;
  timeLimit: number;
  parallelization: boolean;
}

/**
 * 性能监控数据
 */
export interface PerformanceMetrics {
  inferenceTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkSize: number;
  accuracy: number;
}

/**
 * 游戏统计信息
 */
export interface GameStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  averageGameLength: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
}

/**
 * 错误类型定义
 */
export class MajiangAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'MajiangAIError';
  }
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志接口
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * 默认日志实现
 */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}
