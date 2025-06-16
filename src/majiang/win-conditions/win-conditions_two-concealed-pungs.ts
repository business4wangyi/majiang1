import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 双暗刻检测器
 * 双暗刻：和牌中有两个暗刻
 */
export class TwoConcealedPungsDetector extends BaseWinConditionDetector {
  protected name = '双暗刻';
  protected description = '和牌中有两个暗刻';
  protected scoreValue = 8;
  protected huType = HuType.TWO_CONCEALED_PUNGS;
  
  /**
   * 检测是否为双暗刻
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
    // 统计手牌中的牌
    const tileCount = this.countTiles(handTiles);
    let concealedPungCount = 0;
    
    // 找出手牌中的暗刻
    for (const count of tileCount.values()) {
      if (count >= 3) {
        concealedPungCount++;
      }
    }
    
    // 双暗刻需要至少两个暗刻
    return concealedPungCount >= 2;
  }
}

// 注册双暗刻检测器
WinConditionRegistry.register(new TwoConcealedPungsDetector()); 