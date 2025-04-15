import { Tile, createFullTileSet, shuffleTiles, TileType } from './tile';
import { infoLog, warnLog, errorLog } from './logger';
import { displayManager } from './display-manager';

export class TileManager {
  private tiles: Tile[] = [];
  private totalTiles: number = 0;
  private remainingTiles: number = 0;

  constructor() {
    this.reset();
  }

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

  public drawTile(): Tile | null {
    if (this.remainingTiles <= 0) {
      return null;
    }
    this.remainingTiles--;
    return this.tiles.pop() || null;
  }

  public getTotalTiles(): number {
    return this.totalTiles;
  }

  public getRemainingTiles(): number {
    return this.remainingTiles;
  }
} 