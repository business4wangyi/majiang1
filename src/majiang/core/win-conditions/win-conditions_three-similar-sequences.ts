import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 三色三同顺检测器
 * 三色三同顺：三种花色各有一组相同点数的顺子
 */
export class ThreeSimilarSequencesDetector extends BaseWinConditionDetector {
  protected name = '三色三同顺';
  protected description = '三种花色各有一组相同点数的顺子';
  protected scoreValue = 32;
  protected huType = HuType.THREE_SIMILAR_SEQUENCES;
  
  /**
   * 检测是否为三色三同顺
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
    // 检查明牌数量是否合法
    if (revealedSets.length > 4) {
      return false;
    }

    // 找出手牌中可能的顺子
    const handChows = this.findPossibleChowsInHand(handTiles);
    
    // 按顺子的起始值分组
    const chowGroups = new Map<number, Set<string>>();
    
    // 添加手牌中的顺子
    for (const chow of handChows) {
      if (!chowGroups.has(chow.startValue)) {
        chowGroups.set(chow.startValue, new Set());
      }
      chowGroups.get(chow.startValue)!.add(chow.type);
    }
    
    // 检查明牌中的顺子
    let hasChiOrPotentialChow = false;
    let hasPengOrGangOnly = true;
    
    for (const set of revealedSets) {
      if (set.type === 'CHI') {
        hasChiOrPotentialChow = true;
        hasPengOrGangOnly = false;
        const startValue = Math.min(...set.tiles.map(t => t.value));
        if (!chowGroups.has(startValue)) {
          chowGroups.set(startValue, new Set());
        }
        chowGroups.get(startValue)!.add(set.tiles[0].type);
      } else if (set.type === 'PENG' || set.type === 'GANG') {
        // 对于碰和杠，检查是否可以形成顺子
        const value = set.tiles[0].value;
        const type = set.tiles[0].type;
        
        // 只处理数字牌
        if (!this.isNumberTile(set.tiles[0])) continue;
        
        // 如果是1或2，可以作为顺子的开始
        if (value <= 7) {
          hasChiOrPotentialChow = true;
          if (!chowGroups.has(value)) {
            chowGroups.set(value, new Set());
          }
          chowGroups.get(value)!.add(type);
        }
        
        // 如果是2-8，可以作为顺子的中间
        if (value >= 2 && value <= 8) {
          hasChiOrPotentialChow = true;
          if (!chowGroups.has(value - 1)) {
            chowGroups.set(value - 1, new Set());
          }
          chowGroups.get(value - 1)!.add(type);
        }
        
        // 如果是8或9，可以作为顺子的结束
        if (value >= 3 && value <= 9) {
          hasChiOrPotentialChow = true;
          if (!chowGroups.has(value - 2)) {
            chowGroups.set(value - 2, new Set());
          }
          chowGroups.get(value - 2)!.add(type);
        }
      }
    }
    
    // 如果没有吃或可能形成顺子的牌，返回false
    if (handChows.length === 0 && !hasChiOrPotentialChow) {
      return false;
    }
    
    // 如果只有碰和杠，返回false
    if (handChows.length === 0 && hasPengOrGangOnly) {
      return false;
    }
    
    // 检查是否有某个起始值有三种不同花色的顺子
    for (const [startValue, types] of chowGroups.entries()) {
      // 只考虑数字牌的花色（万、条、筒）
      const validTypes = new Set(
        Array.from(types).filter(type => 
          type === TileType.WAN || type === TileType.TIAO || type === TileType.TONG
        )
      );
      
      if (validTypes.size === 3) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 查找手牌中可能的顺子
   */
  private findPossibleChowsInHand(handTiles: Tile[]): { type: string, startValue: number }[] {
    // 按花色和点数分组计数
    const tilesByType = new Map<string, Map<number, number>>();
    
    for (const tile of handTiles) {
      if (!this.isNumberTile(tile)) continue;
      
      if (!tilesByType.has(tile.type)) {
        tilesByType.set(tile.type, new Map());
      }
      const valueMap = tilesByType.get(tile.type)!;
      valueMap.set(tile.value, (valueMap.get(tile.value) || 0) + 1);
    }
    
    const chows: { type: string, startValue: number }[] = [];
    
    // 检查每种花色中可能的顺子
    for (const [type, valueMap] of tilesByType.entries()) {
      // 检查每个可能的起始值
      for (let startValue = 1; startValue <= 7; startValue++) {
        // 检查是否有连续三个数字
        if (valueMap.get(startValue) && 
            valueMap.get(startValue + 1) && 
            valueMap.get(startValue + 2)) {
          // 创建一个新的Map来模拟移除这些牌
          const newValueMap = new Map(valueMap);
          this.removeTile(newValueMap, startValue);
          this.removeTile(newValueMap, startValue + 1);
          this.removeTile(newValueMap, startValue + 2);
          
          // 递归查找剩余的顺子
          const remainingTiles = this.convertMapToTiles(type, newValueMap);
          const remainingChows = this.findPossibleChowsInHand(remainingTiles);
          
          // 添加当前顺子和剩余的顺子
          chows.push({ type, startValue });
          chows.push(...remainingChows);
        }
      }
    }
    
    return chows;
  }

  /**
   * 从Map中移除一张牌
   */
  private removeTile(valueMap: Map<number, number>, value: number) {
    const count = valueMap.get(value)!;
    if (count === 1) {
      valueMap.delete(value);
    } else {
      valueMap.set(value, count - 1);
    }
  }

  /**
   * 检查是否是数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }

  /**
   * 将Map转换为Tile数组
   */
  private convertMapToTiles(type: string, valueMap: Map<number, number>): Tile[] {
    const tiles: Tile[] = [];
    for (const [value, count] of valueMap.entries()) {
      for (let i = 0; i < count; i++) {
        tiles.push(new Tile(type as TileType, value, Date.now() + i)); // 添加唯一ID
      }
    }
    return tiles;
  }
}

// 注册三色三同顺检测器
WinConditionRegistry.register(new ThreeSimilarSequencesDetector()); 