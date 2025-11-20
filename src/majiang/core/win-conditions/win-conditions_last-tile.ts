import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 海底捞月检测器
 * 海底捞月：和别人打出的最后一张牌
 */
export class LastTileDetector extends BaseWinConditionDetector {
  protected name = '海底捞月';
  protected description = '和别人打出的最后一张牌';
  protected scoreValue = 8;
  protected huType = HuType.LAST_TILE;
  
  /**
   * 检测是否为海底捞月
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
    // 海底捞月需要满足两个条件：
    // 1. 是最后一张牌
    // 2. 不是自己摸的牌（而是别人打出的牌）
    return gameState?.isLastTile === true && gameState?.isDrawn !== true;
  }
}

// 注册海底捞月检测器
WinConditionRegistry.register(new LastTileDetector()); 