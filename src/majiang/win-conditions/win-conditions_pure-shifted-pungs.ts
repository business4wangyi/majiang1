import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 一色四节高检测器
 * 一色四节高：和牌中有四组连续数字的刻子，且花色相同
 */
export class PureShiftedPungsDetector extends BaseWinConditionDetector {
  protected name = '一色四节高';
  protected description = '和牌中有四组连续数字的刻子，且花色相同';
  protected scoreValue = 72;
  protected huType = HuType.PURE_SHIFTED_PUNGS;
  
  /**
   * 判断是否为数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }
  
  /**
   * 检测是否为一色四节高
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
    // 首先检查明牌中的刻子和杠（忽略CHI）
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
    
    // 按刻子的花色分组
    const pungsByType = new Map<string, number[]>();
    
    for (const pung of allPungs) {
      if (!this.isNumberTile(pung as Tile)) {
        continue; // 跳过非数字牌
      }
      
      if (!pungsByType.has(pung.type)) {
        pungsByType.set(pung.type, []);
      }
      
      pungsByType.get(pung.type)!.push(pung.value);
    }
    
    // 检查是否有某一种花色的刻子构成连续的四组
    for (const values of pungsByType.values()) {
      if (values.length < 4) {
        continue;
      }
      
      // 排序
      values.sort((a, b) => a - b);
      
      // 检查是否有四组连续的刻子
      for (let i = 0; i <= values.length - 4; i++) {
        if (
          values[i] + 1 === values[i + 1] &&
          values[i] + 2 === values[i + 2] &&
          values[i] + 3 === values[i + 3]
        ) {
          return true;
        }
      }
    }
    
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

// 注册一色四节高检测器
WinConditionRegistry.register(new PureShiftedPungsDetector()); 