import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 一条龙检测器
 * 一条龙：和牌中包含同一种花色1-9的完整序列
 */
export class PureStraightDetector extends BaseWinConditionDetector {
  protected name = '一条龙';
  protected description = '和牌中包含同一种花色1-9的完整序列';
  protected scoreValue = 40;
  protected huType = HuType.PURE_STRAIGHT;
  
  /**
   * 检测是否为一条龙
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
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 按花色分组
    const tilesByType = new Map<string, Set<number>>();
    
    for (const tile of allTiles) {
      if (this.isNumberTile(tile)) {
        if (!tilesByType.has(tile.type)) {
          tilesByType.set(tile.type, new Set());
        }
        tilesByType.get(tile.type)!.add(tile.value);
      }
    }
    
    // 检查是否有某种花色包含了1-9的完整序列
    for (const values of tilesByType.values()) {
      if (values.size === 9) {
        let hasAllNumbers = true;
        for (let i = 1; i <= 9; i++) {
          if (!values.has(i)) {
            hasAllNumbers = false;
            break;
          }
        }
        if (hasAllNumbers) {
          return true;
        }
      }
    }
    
    // 检查明牌中的顺子
    const chows = revealedSets.filter(set => set.type === 'CHI');
    
    // 按花色分组
    const chowsByType = new Map<string, Set<number>>();
    
    for (const chow of chows) {
      const type = chow.tiles[0].type;
      if (!chowsByType.has(type)) {
        chowsByType.set(type, new Set());
      }
      // 添加这个顺子的起始值
      const startValue = Math.min(...chow.tiles.map(t => t.value));
      chowsByType.get(type)!.add(startValue);
    }
    
    // 检查是否有三个连续的顺子（1-3, 4-6, 7-9）构成了一条龙
    for (const [type, startValues] of chowsByType.entries()) {
      if (startValues.has(1) && startValues.has(4) && startValues.has(7)) {
        return true;
      }
    }
    
    return false;
  }
}

// 注册一条龙检测器
WinConditionRegistry.register(new PureStraightDetector()); 