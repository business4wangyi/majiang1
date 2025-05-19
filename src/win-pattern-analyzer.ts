import { Tile } from './tile';
import { TileSet } from './rule-types';

/**
 * 胡牌模式分析器
 * 用于分析手牌是否构成胡牌
 */
export class WinPatternAnalyzer {
  /**
   * 判断是否构成胡牌
   * @param handTiles 手牌
   * @param revealedSets 明牌
   * @returns 是否构成胡牌
   */
  isWinningHand(handTiles: Tile[], revealedSets: TileSet[] = []): boolean {
    // 如果没有手牌，返回false
    if (handTiles.length === 0) {
      return false;
    }

    // 计算所有牌的数量
    const tileCount = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }

    // 检查是否有超过4张的牌
    for (const count of tileCount.values()) {
      if (count > 4) {
        return false;
      }
    }

    // 计算明牌中的杠牌数量
    const gangCount = revealedSets.filter(set => set.type === 'GANG').length;
    
    // 计算明牌中的非杠牌数量
    const nonGangSets = revealedSets.filter(set => set.type !== 'GANG').length;
    
    // 计算总牌数（考虑杠牌）
    const totalTiles = handTiles.length + nonGangSets * 3 + gangCount * 4;
    
    // 如果总牌数不是14张，则不是胡牌
    if (totalTiles !== 14) {
      return false;
    }

    // 检查明牌是否合法
    for (const set of revealedSets) {
      if (!this.isValidSet(set)) {
        return false;
      }
    }

    // 尝试所有可能的对子组合
    for (const [key, count] of tileCount.entries()) {
      if (count >= 2) {
        // 移除对子后检查剩余牌是否能组成完整的顺子或刻子
        const remainingTileCount = new Map(tileCount);
        remainingTileCount.set(key, remainingTileCount.get(key)! - 2);
        if (remainingTileCount.get(key) === 0) {
          remainingTileCount.delete(key);
        }

        // 计算还需要组成的牌组数（考虑杠牌）
        let remainingSets = 4 - nonGangSets - gangCount;
        
        // 检查剩余牌是否能组成完整的顺子或刻子
        let isValid = true;
        const tempTileCount = new Map(remainingTileCount);

        while (remainingSets > 0 && tempTileCount.size > 0) {
          let found = false;

          // 尝试找刻子
          for (const [key, count] of tempTileCount.entries()) {
            if (count >= 3) {
              tempTileCount.set(key, count - 3);
              if (tempTileCount.get(key) === 0) {
                tempTileCount.delete(key);
              }
              found = true;
              remainingSets--;
              break;
            }
          }

          // 如果没找到刻子，尝试找顺子
          if (!found) {
            for (const [key, count] of tempTileCount.entries()) {
              const [type, value] = key.split('-');
              const val = parseInt(value);
              if (val <= 7) {
                const key2 = `${type}-${val + 1}`;
                const key3 = `${type}-${val + 2}`;
                if (tempTileCount.has(key2) && tempTileCount.has(key3)) {
                  // 找到顺子，移除这些牌
                  tempTileCount.set(key, count - 1);
                  tempTileCount.set(key2, tempTileCount.get(key2)! - 1);
                  tempTileCount.set(key3, tempTileCount.get(key3)! - 1);

                  // 清理计数为0的键
                  if (tempTileCount.get(key) === 0) tempTileCount.delete(key);
                  if (tempTileCount.get(key2) === 0) tempTileCount.delete(key2);
                  if (tempTileCount.get(key3) === 0) tempTileCount.delete(key3);

                  found = true;
                  remainingSets--;
                  break;
                }
              }
            }
          }

          // 如果既找不到刻子也找不到顺子，说明牌型不完整
          if (!found) {
            isValid = false;
            break;
          }
        }

        // 检查是否有不完整的组合
        if (isValid && tempTileCount.size === 0 && remainingSets === 0) {
          // 检查是否有不完整的刻子
          for (const [key, count] of remainingTileCount.entries()) {
            if (count === 2) {
              isValid = false;
              break;
            }
          }

          // 检查是否有不完整的顺子
          if (isValid) {
            for (const [key, count] of remainingTileCount.entries()) {
              const [type, value] = key.split('-');
              const val = parseInt(value);
              if (val <= 7) {
                const key2 = `${type}-${val + 1}`;
                const key3 = `${type}-${val + 2}`;
                if ((remainingTileCount.has(key2) && !remainingTileCount.has(key3)) ||
                    (!remainingTileCount.has(key2) && remainingTileCount.has(key3))) {
                  isValid = false;
                  break;
                }
              }
            }
          }

          if (isValid) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 检查明牌组合是否合法
   */
  private isValidSet(set: TileSet): boolean {
    if (set.type === 'CHI') {
      // 检查顺子
      if (set.tiles.length !== 3) return false;
      const [t1, t2, t3] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type &&
             t2.value === t1.value + 1 && t3.value === t2.value + 1;
    } else if (set.type === 'PENG') {
      // 检查刻子
      if (set.tiles.length !== 3) return false;
      const [t1, t2, t3] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type &&
             t1.value === t2.value && t2.value === t3.value;
    } else if (set.type === 'GANG') {
      // 检查杠
      if (set.tiles.length !== 4) return false;
      const [t1, t2, t3, t4] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type && t3.type === t4.type &&
             t1.value === t2.value && t2.value === t3.value && t3.value === t4.value;
    }
    return false;
  }
} 