import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';

/**
 * 特殊牌型检测器接口
 * 所有特殊牌型检测器都必须实现这个接口
 */
export interface WinConditionDetector {
  /**
   * 获取胡牌类型名称
   */
  getName(): string;
  
  /**
   * 获取胡牌类型描述
   */
  getDescription(): string;
  
  /**
   * 获取胡牌类型分数
   */
  getScore(): number;
  
  /**
   * 获取对应的HuType枚举
   */
  getHuType(): HuType;
  
  /**
   * 检测玩家的牌是否满足该胡牌类型
   * @param handTiles 手牌
   * @param revealedSets 明牌组合
   * @param player 玩家信息（可选）
   * @param gameState 游戏状态信息（可选）
   * @param extraOptions 额外选项（可选）
   * @returns 是否满足胡牌条件
   */
  detect(
    handTiles: Tile[], 
    revealedSets: TileSet[], 
    player?: Player | null,
    gameState?: {
      isLastTile?: boolean,
      isDrawn?: boolean,
      isAfterKong?: boolean,
      isRobbingKong?: boolean
    },
    extraOptions?: {
      flowers?: Tile[]
    }
  ): boolean;
}

/**
 * 基础胡牌检测器类
 * 提供了一些通用的功能
 */
export abstract class BaseWinConditionDetector implements WinConditionDetector {
  protected abstract name: string;
  protected abstract description: string;
  protected abstract scoreValue: number;
  protected abstract huType: HuType;
  
  getName(): string {
    return this.name;
  }
  
  getDescription(): string {
    return this.description;
  }
  
  getScore(): number {
    return this.scoreValue;
  }
  
  getHuType(): HuType {
    return this.huType;
  }
  
  abstract detect(
    handTiles: Tile[], 
    revealedSets: TileSet[], 
    player?: Player | null,
    gameState?: {
      isLastTile?: boolean,
      isDrawn?: boolean,
      isAfterKong?: boolean,
      isRobbingKong?: boolean
    },
    extraOptions?: {
      flowers?: Tile[]
    }
  ): boolean;
  
  /**
   * 获取所有牌
   */
  protected getAllTiles(handTiles: Tile[], revealedSets: TileSet[]): Tile[] {
    const tiles = [...handTiles];
    for (const set of revealedSets) {
      tiles.push(...set.tiles);
    }
    return tiles;
  }
  
  /**
   * 计算牌的数量
   */
  protected countTiles(tiles: Tile[]): Map<string, number> {
    const countMap = new Map<string, number>();
    for (const tile of tiles) {
      const key = `${tile.type}-${tile.value}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    return countMap;
  }
  
  /**
   * 判断是否为数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }
  
  /**
   * 判断是否为字牌
   */
  protected isHonorTile(tile: Tile): boolean {
    return ['wind', 'dragon'].includes(tile.type);
  }
  
  /**
   * 判断是否为幺九牌
   */
  protected isTerminalTile(tile: Tile): boolean {
    return (this.isNumberTile(tile) && (tile.value === 1 || tile.value === 9)) || this.isHonorTile(tile);
  }
  
  /**
   * 判断是否为幺九牌或字牌
   */
  protected isTerminalOrHonor(tile: Tile): boolean {
    return this.isTerminalTile(tile) || this.isHonorTile(tile);
  }
  
  /**
   * 判断所有牌是否满足条件
   */
  protected allTilesSatisfy(handTiles: Tile[], revealedSets: TileSet[], predicate: (tile: Tile) => boolean): boolean {
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    return allTiles.every(predicate);
  }
}

/**
 * 胡牌检测器注册管理器
 */
export class WinConditionRegistry {
  private static detectors: WinConditionDetector[] = [];
  
  /**
   * 注册胡牌检测器
   */
  static register(detector: WinConditionDetector): void {
    this.detectors.push(detector);
  }
  
  /**
   * 获取所有胡牌检测器
   */
  static getAllDetectors(): WinConditionDetector[] {
    return [...this.detectors];
  }
  
  /**
   * 获取指定名称的胡牌检测器
   */
  static getDetector(name: string): WinConditionDetector | undefined {
    return this.detectors.find(detector => detector.getName() === name);
  }
  
  /**
   * 检测所有胡牌类型
   */
  static detectAll(
    handTiles: Tile[], 
    revealedSets: TileSet[], 
    player?: Player | null,
    gameState?: {
      isLastTile?: boolean,
      isDrawn?: boolean,
      isAfterKong?: boolean,
      isRobbingKong?: boolean
    },
    extraOptions?: {
      flowers?: Tile[]
    },
    excludeDetectors: Function[] = []
  ): WinConditionDetector[] {
    return this.detectors.filter(detector => 
      !excludeDetectors.includes(detector.constructor) &&
      detector.detect(handTiles, revealedSets || [], player, gameState, extraOptions)
    );
  }
} 