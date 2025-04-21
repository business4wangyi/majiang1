import { Tile, createFullTileSet, shuffleTiles } from './tile';
import { infoLog, warnLog } from './logger';
import { displayManager } from './display-manager';

/**
 * TileManager 单例类 - 管理麻将牌山
 * 
 * 一局游戏中只应该存在一个牌山管理器实例
 * 游戏结束后通过reset方法重置牌山，而不是创建新实例
 */
export class TileManager {
  private static instance: TileManager;
  private tiles: Tile[] = [];
  private totalTiles: number = 0;
  private remainingTiles: number = 0;

  private constructor() {
    this.reset();
  }

  /**
   * 获取TileManager的单例实例
   */
  public static getInstance(): TileManager {
    if (!TileManager.instance) {
      TileManager.instance = new TileManager();
    }
    return TileManager.instance;
  }

  /**
   * 重置牌山，用于新的一局游戏
   */
  public reset(): void {
    this.tiles = shuffleTiles(createFullTileSet());
    this.totalTiles = this.tiles.length;
    this.remainingTiles = this.totalTiles;
    infoLog(`牌山初始化完成，总牌数: ${this.totalTiles}, 剩余牌数: ${this.remainingTiles}`);
    displayManager.printSuccess(`牌山初始化完成，总牌数: ${this.totalTiles}, 剩余牌数: ${this.remainingTiles}`);
    
    // 验证牌山大小是否合理
    if (this.totalTiles < 136) {
      warnLog(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
      displayManager.printWarning(`牌山大小(${this.totalTiles})可能不足，标准麻将应有136张牌`);
    }
  }

  /**
   * 从牌山抽取一张牌
   */
  public drawTile(): Tile | null {
    if (this.remainingTiles <= 0) {
      return null;
    }
    this.remainingTiles--;
    return this.tiles.pop() || null;
  }

  /**
   * 获取牌山总牌数
   */
  public getTotalTiles(): number {
    return this.totalTiles;
  }

  /**
   * 获取牌山剩余牌数
   */
  public getRemainingTiles(): number {
    return this.remainingTiles;
  }
} 