import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 三色三节高检测器
 * 三色三节高：和牌中包含三种花色各一组相同点数的刻子
 */
export class ThreeSimilarPungsDetector extends BaseWinConditionDetector {
  protected name = '三色三节高';
  protected description = '和牌中包含三种花色各一组相同点数的刻子';
  protected scoreValue = 24;
  protected huType = HuType.THREE_SIMILAR_PUNGS;
  
  /**
   * 检测是否为三色三节高
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
    
    // 找出手牌中可能的刻子
    const handPungs = this.findPossiblePungsInHand(handTiles);
    
    // 合并明牌和手牌中的所有刻子
    const allPungs = [
      ...revealedPungs.map(set => ({
        type: set.tiles[0].type,
        value: set.tiles[0].value
      })),
      ...handPungs
    ];
    
    // 按刻子的点数分组
    const pungGroups = new Map<number, Set<string>>();
    
    for (const pung of allPungs) {
      // 只考虑数字牌刻子
      if (!this.isNumberTile({ type: pung.type, value: pung.value } as Tile)) {
        continue;
      }
      
      if (!pungGroups.has(pung.value)) {
        pungGroups.set(pung.value, new Set());
      }
      
      pungGroups.get(pung.value)!.add(pung.type);
      
      // 如果某个点数有三种不同花色的刻子，就满足三色三节高条件
      if (pungGroups.get(pung.value)!.size === 3) {
        return true;
      }
    }
    
    // 没有找到满足条件的刻子组合
    return false;
  }
  
  /**
   * 查找手牌中可能的刻子
   */
  private findPossiblePungsInHand(handTiles: Tile[]): { type: string, value: number }[] {
    const pungs: { type: string, value: number }[] = [];
    const tileCount = this.countTiles(handTiles);
    
    for (const [tileKey, count] of tileCount.entries()) {
      if (count >= 3) {
        const [type, valueStr] = tileKey.split('-');
        const value = parseInt(valueStr);
        pungs.push({ type, value });
      }
    }
    
    return pungs;
  }
}

// 注册三色三节高检测器
WinConditionRegistry.register(new ThreeSimilarPungsDetector()); 