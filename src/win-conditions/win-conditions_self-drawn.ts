import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 自摸检测器
 * 自摸：自己摸牌和牌，不求人
 */
export class SelfDrawnDetector extends BaseWinConditionDetector {
  protected name = '自摸';
  protected description = '自己摸牌和牌，不求人';
  protected scoreValue = 8;
  protected huType = HuType.SELF_DRAWN;
  
  /**
   * 检测是否为自摸
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
    // 自摸只需要检查游戏状态中的isDrawn标志
    return gameState?.isDrawn === true;
  }
}

// 注册自摸检测器
WinConditionRegistry.register(new SelfDrawnDetector()); 