import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 推不倒检测器
 * 推不倒：由左右对称的牌组成的和牌（1、2、3、4、5、8、9筒，2、4、5、6、8、9条）
 */
export class ReversibleTilesDetector extends BaseWinConditionDetector {
  protected name = '推不倒';
  protected description = '由左右对称的牌组成的和牌';
  protected scoreValue = 32;
  protected huType = HuType.REVERSIBLE_TILES;
  
  /**
   * 检测是否为推不倒
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
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 检查所有牌是否都是可以上下倒置的牌
    return allTiles.every(tile => this.isReversibleTile(tile));
  }
  
  /**
   * 判断牌是否为推不倒牌（上下倒置对称的牌）
   */
  private isReversibleTile(tile: Tile): boolean {
    // 筒子牌：1、2、3、4、5、8、9 是对称的
    if (tile.type === TileType.TONG) {
      return [1, 2, 3, 4, 5, 8, 9].includes(tile.value);
    }
    
    // 条子牌：2、4、5、6、8、9 是对称的
    if (tile.type === TileType.TIAO) {
      return [2, 4, 5, 6, 8, 9].includes(tile.value);
    }
    
    // 白板是对称的
    if (tile.type === TileType.JIAN && tile.value === 3) { // 白板
      return true;
    }
    
    // 其他牌都不是对称的
    return false;
  }
}

// 注册推不倒检测器
WinConditionRegistry.register(new ReversibleTilesDetector()); 