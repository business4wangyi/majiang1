import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 双箭刻检测器
 * 双箭刻：和牌中包含两副箭牌的刻子
 */
export class TwoDragonPungsDetector extends BaseWinConditionDetector {
  protected name = '双箭刻';
  protected description = '和牌中包含两副箭牌的刻子';
  protected scoreValue = 16;
  protected huType = HuType.TWO_DRAGON_PUNGS;
  
  /**
   * 检测是否为双箭刻
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
    // 首先检查明牌中的箭牌刻子
    const dragonPungsInRevealed = revealedSets.filter(set => 
      (set.type === 'PENG' || set.type === 'GANG') && 
      set.tiles[0].type === TileType.JIAN
    );
    
    // 如果明牌中已经有两副或以上的箭牌刻子，直接返回true
    if (dragonPungsInRevealed.length >= 2) {
      return true;
    }
    
    // 统计手牌中的箭牌
    const tileCount = this.countTiles(handTiles);
    let dragonPungsInHand = 0;
    
    // 检查手牌中是否有箭牌刻子（中发白）
    for (const [tileKey, count] of tileCount.entries()) {
      const [type, value] = tileKey.split('-');
      if (type === 'dragon' || type === '箭') {
        if (count >= 3) {
          dragonPungsInHand++;
        }
      }
    }
    
    // 计算总的箭牌刻子数量
    const totalDragonPungs = dragonPungsInRevealed.length + dragonPungsInHand;
    
    // 双箭刻需要至少两副箭牌刻子
    return totalDragonPungs >= 2;
  }
}

// 注册双箭刻检测器
WinConditionRegistry.register(new TwoDragonPungsDetector()); 