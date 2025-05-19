import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 杠上开花检测器
 * 杠上开花：摸杠牌后和牌
 */
export class KongFlowerDetector extends BaseWinConditionDetector {
  protected name = '杠上开花';
  protected description = '摸杠牌后和牌';
  protected scoreValue = 16;
  protected huType = HuType.KONG_FLOWER;
  
  /**
   * 检测是否为杠上开花
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
    // 杠上开花只需要检查游戏状态
    return gameState?.isAfterKong === true;
  }
}

// 注册杠上开花检测器
WinConditionRegistry.register(new KongFlowerDetector()); 