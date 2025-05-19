import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 抢杠和检测器
 * 抢杠和：别人补杠时和牌
 */
export class RobbingKongDetector extends BaseWinConditionDetector {
  protected name = '抢杠和';
  protected description = '别人补杠时和牌';
  protected scoreValue = 16;
  protected huType = HuType.ROBBING_KONG;
  
  /**
   * 检测是否为抢杠和
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
    // 抢杠和只需要检查游戏状态
    return gameState?.isRobbingKong === true;
  }
}

// 注册抢杠和检测器
WinConditionRegistry.register(new RobbingKongDetector()); 