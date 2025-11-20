import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 花牌杠检测器
 * 检测玩家是否集齐了4张同类型的花牌
 */
export class FourFlowersDetector extends BaseWinConditionDetector {
  protected name = '花牌杠';
  protected description = '集齐4张同类型花牌';
  protected scoreValue = 8;
  protected huType = HuType.FOUR_FLOWERS;
  
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
    // 如果没有player对象或者flowers数据，无法判断
    if (!player && !extraOptions?.flowers) {
      return false;
    }
    
    // 获取花牌数据
    const flowers = extraOptions?.flowers || (player ? player.flowerTiles || [] : []);
    
    // 如果花牌总数小于4，肯定不符合条件
    if (flowers.length < 4) {
      return false;
    }
    
    // 按照花牌的类型和值进行分组计数（考虑花牌的类型和值）
    const flowerCounts = new Map<string, number>();
    for (const flower of flowers) {
      const key = `${flower.type}-${flower.value}`;
      flowerCounts.set(key, (flowerCounts.get(key) || 0) + 1);
    }
    
    // 检查是否有任何一种花牌（同类型同值）的数量达到4
    for (const count of flowerCounts.values()) {
      if (count >= 4) {
        return true;
      }
    }
    
    return false;
  }
}

// 注册检测器
WinConditionRegistry.register(new FourFlowersDetector()); 