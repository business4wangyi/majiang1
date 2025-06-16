import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 花牌全检测器
 * 检测玩家是否集齐了全部8张花牌
 */
export class EightFlowersDetector extends BaseWinConditionDetector {
  protected name = '花牌全';
  protected description = '集齐全部8张花牌';
  protected scoreValue = 16;
  protected huType = HuType.EIGHT_FLOWERS;
  
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
    
    // 检查花牌数量是否为8
    if (flowers.length < 8) {
      return false;
    }
    
    // 检查是否包含所有8种不同的花牌
    const flowerSet = new Set<string>();
    for (const flower of flowers) {
      // 我们使用牌的类型和值的组合来识别不同的花牌
      flowerSet.add(`${flower.type}-${flower.value}`);
    }
    
    // 应该有8种不同的花牌
    // 花牌通常包括春夏秋冬和梅兰竹菊
    return flowerSet.size === 8;
  }
}

// 注册检测器
WinConditionRegistry.register(new EightFlowersDetector()); 