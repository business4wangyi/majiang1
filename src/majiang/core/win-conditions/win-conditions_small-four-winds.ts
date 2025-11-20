import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 小四喜检测器
 * 小四喜：由三种风牌的刻子或杠，外加一种风牌的对子，再加上其他牌组成的和牌
 */
export class SmallFourWindsDetector extends BaseWinConditionDetector {
  protected name = '小四喜';
  protected description = '由三种风牌的刻子或杠，外加一种风牌的对子，再加上其他牌组成的和牌';
  protected scoreValue = 64; // 小四喜是高分牌型
  protected huType = HuType.SMALL_FOUR_WINDS;
  
  /**
   * 检测是否为小四喜
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
    // 统计风牌刻子和对子的数量
    let windPungCount = 0; // 风牌刻子数量
    let windPairCount = 0; // 风牌对子数量
    
    // 在明牌组合中找出风牌的刻子或杠
    for (const set of revealedSets) {
      if ((set.type === 'PENG' || set.type === 'GANG') && 
          set.tiles.length > 0 && 
          this.isWindTile(set.tiles[0])) {
        windPungCount++;
      }
    }
    
    // 按风牌值统计手牌中的风牌数量
    const windTileCounts = new Map<number, number>();
    
    // 遍历手牌，统计每种风牌的数量
    for (const tile of handTiles) {
      if (this.isWindTile(tile)) {
        const count = windTileCounts.get(tile.value) || 0;
        windTileCounts.set(tile.value, count + 1);
      }
    }
    
    // 检查手牌中的风牌刻子和对子
    for (const [value, count] of windTileCounts.entries()) {
      if (count >= 3) {
        windPungCount++; // 刻子
      } else if (count === 2) {
        windPairCount++; // 对子
      }
    }
    
    // 小四喜需要三个风牌刻子和一个风牌对子
    return windPungCount === 3 && windPairCount === 1;
  }
  
  /**
   * 判断是否为风牌
   */
  private isWindTile(tile: Tile): boolean {
    // 风牌的type是TileType.FENG
    return tile.type === TileType.FENG;
  }
}

// 注册小四喜检测器
WinConditionRegistry.register(new SmallFourWindsDetector()); 