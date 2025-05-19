import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 七对子检测器
 * 七对子：由七个对子组成的和牌
 */
export class SevenPairsDetector extends BaseWinConditionDetector {
  protected name = '七对子';
  protected description = '由七个对子组成的和牌';
  protected scoreValue = 24;
  protected huType = HuType.SEVEN_PAIRS;
  
  /**
   * 检测是否为七对子
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
    // 七对必须是14张牌，全部是手牌，没有明牌
    if (handTiles.length !== 14 || revealedSets.length > 0) {
      return false;
    }
    
    // 统计牌的数量
    const tileCount = this.countTiles(handTiles);
    
    // 检查是否刚好有7个对子
    if (tileCount.size !== 7) {
      return false;
    }
    
    // 检查每种牌是否都是对子
    for (const count of tileCount.values()) {
      if (count !== 2) {
        return false;
      }
    }
    
    // 满足所有条件，是七对子
    return true;
  }
}

// 注册七对子检测器
WinConditionRegistry.register(new SevenPairsDetector()); 