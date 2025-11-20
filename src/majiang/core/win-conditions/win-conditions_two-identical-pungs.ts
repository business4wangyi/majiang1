import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 双同刻检测器
 * 双同刻：和牌中有两组点数相同但花色不同的刻子
 */
export class TwoIdenticalPungsDetector extends BaseWinConditionDetector {
  protected name = '双同刻';
  protected description = '和牌中有两组点数相同但花色不同的刻子';
  protected scoreValue = 8;
  protected huType = HuType.TWO_IDENTICAL_PUNGS;
  
  /**
   * 检测是否为双同刻
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
    // 首先检查明牌中的刻子和杠
    const revealedPungs = revealedSets.filter(set => 
      set.type === 'PENG' || set.type === 'GANG'
    );
    
    // 统计手牌中的牌
    const tileCount = this.countTiles(handTiles);
    const handPungs: { type: string, value: number }[] = [];
    
    // 找出手牌中的刻子
    for (const [tileKey, count] of tileCount.entries()) {
      if (count >= 3) {
        const [type, valueStr] = tileKey.split('-');
        const value = parseInt(valueStr);
        if (this.isNumberTile({ type, value } as Tile)) {
          handPungs.push({ type, value });
        }
      }
    }
    
    // 合并明牌和手牌中的所有刻子
    const allPungs = [
      ...revealedPungs.map(set => ({
        type: set.tiles[0].type,
        value: set.tiles[0].value
      })),
      ...handPungs
    ];
    
    // 如果刻子数量不足2个，不可能是双同刻
    if (allPungs.length < 2) {
      return false;
    }
    
    // 检查是否有相同点数但不同花色的刻子
    const pungMap = new Map<number, Set<string>>();
    
    for (const pung of allPungs) {
      if (!this.isNumberTile({ type: pung.type, value: pung.value } as Tile)) {
        continue; // 忽略字牌刻子
      }
      
      if (!pungMap.has(pung.value)) {
        pungMap.set(pung.value, new Set());
      }
      
      pungMap.get(pung.value)!.add(pung.type);
      
      // 如果某个点数有两种不同花色的刻子，就满足双同刻条件
      if (pungMap.get(pung.value)!.size >= 2) {
        return true;
      }
    }
    
    // 没有找到满足条件的刻子组合
    return false;
  }
}

// 注册双同刻检测器
WinConditionRegistry.register(new TwoIdenticalPungsDetector()); 