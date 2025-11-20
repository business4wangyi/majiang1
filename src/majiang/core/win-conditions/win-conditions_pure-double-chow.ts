import { Tile, TileType } from '../core/tile';
import { TileSet } from '../core/rule-types';
import { HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 一色双龙会检测器
 * 检测和牌中是否包含同一花色的两条龙（即两组1-9的完整顺子）
 */
export class PureDoubleChowDetector extends BaseWinConditionDetector {
  protected name = '一色双龙会';
  protected description = '同一花色的两组从1到9的完整顺子';
  protected scoreValue = 64;
  protected huType = HuType.PURE_DOUBLE_CHOW;

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
    // 检查所有牌是否为同一花色
    const allTiles = [...handTiles];
    for (const set of revealedSets) {
      allTiles.push(...set.tiles);
    }
    
    // 确定所有牌的花色
    const tileTypes = new Set<TileType>();
    for (const tile of allTiles) {
      if (tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG) {
        tileTypes.add(tile.type);
      }
    }
    
    // 如果有不同花色的牌，不能构成一色双龙会
    // 只允许有一种花色的数牌
    if (tileTypes.size !== 1) {
      return false;
    }
    
    // 检查所有亮出的牌组是否都是顺子
    const nonChows = revealedSets.filter(set => set.type !== 'CHI');
    if (nonChows.length > 0) {
      return false;
    }
    
    // 获取所有顺子（已亮出的和可能的手牌顺子）
    const allChows: TileSet[] = [];
    
    // 收集所有已亮出的顺子
    for (const set of revealedSets) {
      if (set.type === 'CHI') {
        allChows.push(set);
      }
    }
    
    // 检查手牌中是否有刻子
    // 按牌值统计手牌
    const handTileCounts = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      handTileCounts.set(key, (handTileCounts.get(key) || 0) + 1);
    }
    
    // 检查是否有刻子
    for (const count of handTileCounts.values()) {
      if (count >= 3) {
        return false;
      }
    }
    
    // 从手牌中找出可能的顺子组合
    const possibleChows = this.findPossibleChowsInHand(handTiles);
    allChows.push(...possibleChows);
    
    // 按花色对顺子分组
    const chowsByType = new Map<TileType, TileSet[]>();
    for (const chow of allChows) {
      const type = chow.tiles[0].type;
      if (!chowsByType.has(type)) {
        chowsByType.set(type, []);
      }
      chowsByType.get(type)?.push(chow);
    }
    
    // 检查每种花色是否有足够的顺子形成两条龙
    for (const [type, chows] of chowsByType.entries()) {
      // 计算每个起始值的顺子数量
      const startValueCounts = new Map<number, number>();
      for (const chow of chows) {
        const startValue = chow.tiles[0].value;
        startValueCounts.set(startValue, (startValueCounts.get(startValue) || 0) + 1);
      }
      
      // 检查是否有足够的1-7起始的顺子来形成两条龙
      // 一条龙需要顺子1-3, 4-6, 7-9
      const dragonCount = this.countCompleteDragons(startValueCounts);
      if (dragonCount >= 2) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 从手牌中找出可能的顺子组合
   */
  private findPossibleChowsInHand(handTiles: Tile[]): TileSet[] {
    const possibleChows: TileSet[] = [];
    const tileCount = new Map<string, number>();
    
    // 统计手牌中每种牌的数量
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }
    
    // 按花色分组
    const tilesByType = new Map<TileType, Map<number, number>>();
    for (const [key, count] of tileCount.entries()) {
      const [type, valueStr] = key.split('-');
      const value = parseInt(valueStr);
      
      if (!tilesByType.has(type as TileType)) {
        tilesByType.set(type as TileType, new Map<number, number>());
      }
      tilesByType.get(type as TileType)?.set(value, count);
    }
    
    // 尝试从每种花色中找出顺子
    for (const [type, values] of tilesByType.entries()) {
      // 数牌才能组成顺子
      if (type !== TileType.WAN && type !== TileType.TIAO && type !== TileType.TONG) {
        continue;
      }
      
      // 检查所有可能的顺子
      for (let startValue = 1; startValue <= 7; startValue++) {
        const v1 = values.get(startValue) || 0;
        const v2 = values.get(startValue + 1) || 0;
        const v3 = values.get(startValue + 2) || 0;
        
        // 要形成顺子，每个位置至少需要一张牌
        if (v1 > 0 && v2 > 0 && v3 > 0) {
          // 创建一个虚拟的顺子牌组
          const chowTiles: Tile[] = [
            new Tile(type, startValue, 0),
            new Tile(type, startValue + 1, 0),
            new Tile(type, startValue + 2, 0)
          ];
          
          possibleChows.push({
            type: 'CHI',
            tiles: chowTiles
          });
          
          // 如果有多个相同的顺子，继续添加
          const maxChows = Math.min(v1, v2, v3);
          for (let i = 1; i < maxChows; i++) {
            const moreTiles: Tile[] = [
              new Tile(type, startValue, i),
              new Tile(type, startValue + 1, i),
              new Tile(type, startValue + 2, i)
            ];
            
            possibleChows.push({
              type: 'CHI',
              tiles: moreTiles
            });
          }
        }
      }
    }
    
    return possibleChows;
  }
  
  /**
   * 计算可以形成的完整龙的数量
   */
  private countCompleteDragons(startValueCounts: Map<number, number>): number {
    // 一条龙需要1-3, 4-6, 7-9三组顺子
    const requiredStarts = [1, 4, 7];
    
    // 计算可以形成的完整龙的数量
    let dragonCount = Number.MAX_SAFE_INTEGER;
    for (const start of requiredStarts) {
      const count = startValueCounts.get(start) || 0;
      dragonCount = Math.min(dragonCount, count);
    }
    
    return dragonCount;
  }
}

// 注册检测器
WinConditionRegistry.register(new PureDoubleChowDetector()); 