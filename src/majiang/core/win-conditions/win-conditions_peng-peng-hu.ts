import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 碰碰胡检测器
 * 碰碰胡：由四个刻子（杠）和一个对子组成的和牌
 */
export class PengPengHuDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '碰碰胡';
  protected description = '由四个刻子（杠）和一个对子组成的和牌';
  protected scoreValue = 32;
  protected huType = HuType.PENG_PENG_HU;
  
  /**
   * 检测是否为碰碰胡
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
    // 首先检查明牌组合是否都是刻子或杠
    for (const set of revealedSets) {
      if (set.type === 'CHI') {
        return false; // 有顺子，不是碰碰胡
      }
    }
    
    // 如果没有手牌，只检查明牌是否足够
    if (handTiles.length === 0) {
      // 需要四个刻子和一个对子
      return revealedSets.length === 5;
    }
    
    // 统计牌的数量，检查是否都是对子或三张一样的
    const countMap = this.countTiles(handTiles);
    
    // 对于碰碰胡，手牌中的每种牌必须出现2次或3次
    for (const count of countMap.values()) {
      if (count !== 2 && count !== 3) {
        return false;
      }
    }
    
    // 计算手牌中的对子和刻子数量
    const pairCount = Array.from(countMap.values()).filter(count => count === 2).length;
    const pungCount = Array.from(countMap.values()).filter(count => count === 3).length;
    
    // 计算明牌中的刻子或杠的数量
    const revealedPungCount = revealedSets.length;
    
    // 碰碰胡需要恰好一个对子和四个刻子
    return pairCount === 1 && (pungCount + revealedPungCount) === 4;
  }
}

// 注册碰碰胡检测器
WinConditionRegistry.register(new PengPengHuDetector()); 