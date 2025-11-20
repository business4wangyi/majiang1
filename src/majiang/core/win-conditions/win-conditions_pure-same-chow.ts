import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 一色四同顺检测器
 * 一色四同顺：和牌中有四组完全相同的顺子，且花色相同
 */
export class PureSameChowDetector extends BaseWinConditionDetector {
  protected name = '一色四同顺';
  protected description = '和牌中有四组完全相同的顺子，且花色相同';
  protected scoreValue = 64;
  protected huType = HuType.PURE_SAME_CHOW;
  
  /**
   * 检测是否为一色四同顺
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
    // 首先检查明牌中的顺子
    const revealedChows = revealedSets.filter(set => set.type === 'CHI');
    
    // 收集所有顺子（包括明牌和手牌）
    // 格式: Map<"花色-起始点数", 数量>
    const chowGroups = new Map<string, number>();
    
    // 添加明牌中的顺子
    for (const chow of revealedChows) {
      const type = chow.tiles[0].type;
      const startValue = Math.min(...chow.tiles.map(t => t.value));
      const key = `${type}-${startValue}`;
      
      chowGroups.set(key, (chowGroups.get(key) || 0) + 1);
    }
    
    // 计算手牌中每种牌的数量
    const tileCount = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }
    
    // 按花色分组
    const tilesByType = new Map<string, Map<number, number>>();
    
    for (const [key, count] of tileCount.entries()) {
      const [type, valueStr] = key.split('-');
      const value = parseInt(valueStr);
      
      // 只处理数字牌
      if (!this.isNumberTile({ type, value } as Tile)) continue;
      
      if (!tilesByType.has(type)) {
        tilesByType.set(type, new Map<number, number>());
      }
      
      tilesByType.get(type)!.set(value, count);
    }
    
    // 找出每种花色的所有可能顺子
    for (const [type, valueMap] of tilesByType.entries()) {
      // 转换为数组并排序，方便查找顺子
      const tileValueCounts: [number, number][] = [];
      for (const [value, count] of valueMap.entries()) {
        tileValueCounts.push([value, count]);
      }
      
      // 查找顺子
      const chowsFound = this.findChowsInValues(type, tileValueCounts);
      
      // 添加找到的顺子到总计中
      for (const [key, count] of chowsFound.entries()) {
        const currentCount = chowGroups.get(key) || 0;
        chowGroups.set(key, currentCount + count);
      }
    }
    
    // 检查是否有某一组顺子的数量达到4个
    for (const [key, count] of chowGroups.entries()) {
      if (count >= 4) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 在给定花色的牌值中找出所有可能的顺子
   * @param type 花色
   * @param valueCounts 值和数量的对，格式为 [值, 数量][]
   * @returns 找到的顺子，格式为 Map<"花色-起始点数", 数量>
   */
  private findChowsInValues(type: string, valueCounts: [number, number][]): Map<string, number> {
    const result = new Map<string, number>();
    
    // 先对 valueCounts 按值排序
    valueCounts.sort(([a], [b]) => a - b);
    
    // 对每个可能的起始点数，尝试找出所有可能的顺子
    for (let startValue = 1; startValue <= 7; startValue++) {
      // 找到起始值对应的牌数量
      const startCount = valueCounts.find(([value]) => value === startValue)?.[1] || 0;
      const midCount = valueCounts.find(([value]) => value === startValue + 1)?.[1] || 0;
      const endCount = valueCounts.find(([value]) => value === startValue + 2)?.[1] || 0;
      
      // 计算可以形成多少个顺子
      const chowCount = Math.min(startCount, midCount, endCount);
      
      if (chowCount > 0) {
        const key = `${type}-${startValue}`;
        result.set(key, chowCount);
      }
    }
    
    return result;
  }
  
  /**
   * 检查是否为数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }
}

// 注册一色四同顺检测器
WinConditionRegistry.register(new PureSameChowDetector()); 