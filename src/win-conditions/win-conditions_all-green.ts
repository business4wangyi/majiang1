import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 绿一色检测器
 * 绿一色：由全绿色牌（竹牌23468及发）组成的和牌
 */
export class AllGreenDetector extends BaseWinConditionDetector {
  protected name = '全绿';
  protected description = '和牌时，所有牌都是绿色的';
  protected scoreValue = 88; // 绿一色是高分牌型
  protected huType = HuType.ALL_GREEN;
  
  /**
   * 检测是否为绿一色
   */
  detect(
    handTiles: Tile[], 
    revealedSets: TileSet[] = [], 
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
  ): boolean {
    // 如果没有牌，则不是绿一色
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }
    
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 检查是否所有牌都是绿色牌
    return allTiles.every(tile => this.isGreenTile(tile));
  }
  
  /**
   * 判断是否为绿色牌
   * 绿色牌包括：
   * 1. 条子（TIAO）的2、3、4、6、8
   * 2. 发财（JIAN，值为2）
   */
  private isGreenTile(tile: Tile): boolean {
    // 条子的2、3、4、6、8
    if (tile.type === TileType.TIAO && [2, 3, 4, 6, 8].includes(tile.value)) {
      return true;
    }
    
    // 发财
    if (tile.type === TileType.JIAN && tile.value === 2) {
      return true;
    }
    
    return false;
  }
}

// 注册绿一色检测器
WinConditionRegistry.register(new AllGreenDetector()); 