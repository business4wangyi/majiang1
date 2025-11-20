import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 全双刻检测器
 * 全双刻：由序数牌2，4，6，8组成的刻子（杠）构成的和牌
 */
export class AllEvenPungsDetector extends BaseWinConditionDetector {
  protected name = '全双刻';
  protected description = '由序数牌2，4，6，8组成的刻子（杠）构成的和牌';
  protected scoreValue = 24;
  protected huType = HuType.ALL_EVEN_PUNGS;
  
  /**
   * 检测是否为全双刻
   * 全双刻要求所有的刻子或杠都由偶数牌（2、4、6、8）组成
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
    // 首先检查明牌中的刻子和杠子
    const revealedPungs = revealedSets.filter(set => 
      set.type === 'PENG' || set.type === 'GANG'
    );
    
    // 如果明牌中有非双数牌的刻子或杠子，直接返回false
    if (revealedPungs.some(set => !this.isEvenNumberedTile(set.tiles[0]))) {
      return false;
    }
    
    // 找出手牌中可能的刻子
    const handPungs = this.findPungsInHand(handTiles);
    
    // 如果手牌中有非双数牌的刻子，直接返回false
    if (handPungs.some(pung => !this.isEvenNumberedTile(pung.tile))) {
      return false;
    }
    
    // 必须至少有一个刻子或杠子
    return revealedPungs.length + handPungs.length > 0;
  }
  
  /**
   * 查找手牌中的刻子
   * @param handTiles 手牌列表
   * @returns 手牌中找到的刻子列表，每个刻子包含一个代表性的牌和数量
   */
  private findPungsInHand(handTiles: Tile[]): Array<{ tile: Tile, count: number }> {
    const tileCount = this.countTiles(handTiles);
    const pungs: Array<{ tile: Tile, count: number }> = [];
    
    for (const [tileKey, count] of tileCount.entries()) {
      // 刻子需要3张或以上相同的牌
      if (count >= 3) {
        const [typeStr, valueStr] = tileKey.split('-');
        const type = typeStr as TileType;
        const value = parseInt(valueStr);
        
        // 创建一个代表性的牌
        const representativeTile = new Tile(type, value, 0);
        pungs.push({ tile: representativeTile, count });
      }
    }
    
    return pungs;
  }
  
  /**
   * 判断是否为双数牌（2、4、6、8）
   * @param tile 要检查的牌
   * @returns 是否是偶数牌（2、4、6、8）
   */
  private isEvenNumberedTile(tile: Tile): boolean {
    // 只考虑数字牌（万、条、筒）
    if (![TileType.WAN, TileType.TIAO, TileType.TONG].includes(tile.type)) {
      return false;
    }
    
    // 检查是否为双数牌（2、4、6、8）
    const evenValues = [2, 4, 6, 8];
    return evenValues.includes(tile.value);
  }
}

// 注册全双刻检测器
WinConditionRegistry.register(new AllEvenPungsDetector()); 