import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 四暗刻检测器
 * 四暗刻：和牌中有四个暗刻
 */
export class FourConcealedPungsDetector extends BaseWinConditionDetector {
  protected name = '四暗刻';
  protected description = '和牌中有四个暗刻';
  protected scoreValue = 64;
  protected huType = HuType.FOUR_CONCEALED_PUNGS;
  
  /**
   * 检测是否为四暗刻
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
    // 四暗刻必须是门前清（无明牌）
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 统计手牌中的牌
    const tileCount = this.countTiles(handTiles);
    let concealedPungCount = 0;
    
    // 找出手牌中的暗刻
    for (const count of tileCount.values()) {
      if (count >= 3) {
        concealedPungCount++;
      }
    }
    
    // 四暗刻要求手牌中至少有四个暗刻
    return concealedPungCount >= 4;
  }
}

// 注册四暗刻检测器
WinConditionRegistry.register(new FourConcealedPungsDetector()); 