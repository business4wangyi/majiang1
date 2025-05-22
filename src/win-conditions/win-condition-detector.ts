import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';

/**
 * 特殊牌型检测器接口
 * 所有特殊牌型检测器都必须实现这个接口
 */
export interface WinConditionDetector {
  /**
   * 是否为基础胡牌检测器（true=基础胡牌，false=加番）
   */
  isBaseWin: boolean;
  
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
   * @param excludeDetectors 排除的检测器（可选）
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
    },
    excludeDetectors?: Function[]
  ): boolean;
}

/**
 * 基础胡牌检测器类
 * 提供了一些通用的功能
 */
export abstract class BaseWinConditionDetector implements WinConditionDetector {
  /**
   * 是否为基础胡牌检测器（true=基础胡牌，false=加番）
   */
  public isBaseWin: boolean = false;
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
    },
    excludeDetectors?: Function[]
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

  /**
   * 检查牌组是否合法
   */
  protected isValidSet(set: TileSet): boolean {
    switch (set.type) {
      case 'CHI':
        // 顺子必须是同花色且连续的
        if (set.tiles.length !== 3) return false;
        const [t1, t2, t3] = set.tiles;
        if (t1.type !== t2.type || t2.type !== t3.type) return false;
        if (t1.type === TileType.FENG || t1.type === TileType.JIAN) return false;
        const values = [t1.value, t2.value, t3.value].sort((a, b) => a - b);
        return values[1] === values[0] + 1 && values[2] === values[1] + 1;

      case 'PENG':
        // 刻子必须是三张相同的牌
        if (set.tiles.length !== 3) return false;
        const [p1, p2, p3] = set.tiles;
        return p1.type === p2.type && p2.type === p3.type &&
               p1.value === p2.value && p2.value === p3.value;

      case 'GANG':
        // 杠必须是四张相同的牌
        if (set.tiles.length !== 4) return false;
        const [g1, g2, g3, g4] = set.tiles;
        return g1.type === g2.type && g2.type === g3.type && g3.type === g4.type &&
               g1.value === g2.value && g2.value === g3.value && g3.value === g4.value;

      default:
        return false;
    }
  }

  /**
   * 查找手牌中的对子
   */
  protected findPairs(handTiles: Tile[]): Tile[][] {
    const pairs: Tile[][] = [];
    const tileCount = new Map<string, Tile[]>();
    
    // 按牌型和点数分组
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      if (!tileCount.has(key)) {
        tileCount.set(key, []);
      }
      tileCount.get(key)!.push(tile);
    }
    
    // 找出所有对子
    for (const tiles of tileCount.values()) {
      if (tiles.length >= 2) {
        pairs.push([tiles[0], tiles[1]]);
      }
    }
    
    return pairs;
  }

  /**
   * 检查是否可以形成有效的和牌组合
   */
  protected canFormSets(handTiles: Tile[], revealedSets: TileSet[]): boolean {
    // 如果没有手牌，检查明牌是否足够
    if (handTiles.length === 0) {
      return revealedSets.length === 4;
    }

    // 尝试形成顺子
    const chows = this.findChows(handTiles);
    for (const chow of chows) {
      const remainingTiles = handTiles.filter(tile => 
        !chow.some(chowTile => chowTile.id === tile.id)
      );
      if (this.canFormSets(remainingTiles, [...revealedSets, { type: 'CHI', tiles: chow }])) {
        return true;
      }
    }

    // 尝试形成刻子
    const pungs = this.findPungs(handTiles);
    for (const pung of pungs) {
      const remainingTiles = handTiles.filter(tile => 
        !pung.some(pungTile => pungTile.id === tile.id)
      );
      if (this.canFormSets(remainingTiles, [...revealedSets, { type: 'PENG', tiles: pung }])) {
        return true;
      }
    }

    return false;
  }

  /**
   * 查找手牌中可能的顺子
   */
  private findChows(handTiles: Tile[]): Tile[][] {
    const chows: Tile[][] = [];
    const tileMap = new Map<string, Tile[]>();
    
    // 按花色分组
    for (const tile of handTiles) {
      if (tile.type === TileType.FENG || tile.type === TileType.JIAN) continue;
      const key = `${tile.type}-${tile.value}`;
      if (!tileMap.has(key)) {
        tileMap.set(key, []);
      }
      tileMap.get(key)!.push(tile);
    }
    
    // 对每种花色，尝试形成顺子
    for (const [type, value] of [TileType.WAN, TileType.TIAO, TileType.TONG].entries()) {
      for (let i = 1; i <= 7; i++) {
        const t1 = tileMap.get(`${type}-${i}`);
        const t2 = tileMap.get(`${type}-${i + 1}`);
        const t3 = tileMap.get(`${type}-${i + 2}`);
        
        if (t1 && t2 && t3 && t1.length > 0 && t2.length > 0 && t3.length > 0) {
          chows.push([t1[0], t2[0], t3[0]]);
        }
      }
    }
    
    return chows;
  }

  /**
   * 查找手牌中可能的刻子
   */
  protected findPungs(handTiles: Tile[]): Tile[][] {
    const pungs: Tile[][] = [];
    const tileMap = new Map<string, Tile[]>();
    
    // 按牌型和点数分组
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      if (!tileMap.has(key)) {
        tileMap.set(key, []);
      }
      tileMap.get(key)!.push(tile);
    }
    
    // 找出所有可能的刻子
    for (const tiles of tileMap.values()) {
      if (tiles.length >= 3) {
        pungs.push([tiles[0], tiles[1], tiles[2]]);
      }
    }
    
    return pungs;
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
    excludeDetectors?: Function[],
    baseOnly: boolean = false
  ): WinConditionDetector[] {
    return this.detectors.filter(detector => 
      (!baseOnly || detector.isBaseWin) &&
      !excludeDetectors?.includes(detector.constructor) &&
      detector.detect(
        handTiles, 
        revealedSets || [], 
        player, 
        gameState, 
        extraOptions, 
        [...(excludeDetectors || []), detector.constructor]
      )
    );
  }
} 