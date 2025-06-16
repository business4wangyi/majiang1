import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 平胡检测器
 */
export class PingHuDetector extends BaseWinConditionDetector {
  public readonly name = '平胡';
  public readonly description = '由四组顺子或刻子和一个对子组成的和牌';
  public readonly scoreValue = 1;
  public readonly huType = HuType.PING_HU;
  public isBaseWin = true;

  public detect(
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
    // 如果手牌和明牌都为空，则不能和牌
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }

    // 检查明牌数量是否超过4组
    if (revealedSets.length > 4) {
      return false;
    }

    // 计算剩余需要的牌组数
    const remainingSetsNeeded = 4 - revealedSets.length;
    if (remainingSetsNeeded < 0) {
      return false;
    }

    // 计算手牌数量
    const handTileCount = handTiles.length;
    const expectedHandTiles = 14 - revealedSets.reduce((total, set) => {
      if (set.type === 'GANG') {
        return total + 3;  // 杠牌算3张，因为第4张是额外的
      }
      return total + 3;    // 吃和碰算3张
    }, 0);
    if (handTileCount !== expectedHandTiles) {
      return false;
    }

    // 检查明牌是否合法
    for (const set of revealedSets) {
      if (!this.isValidSet(set)) {
        return false;
      }
    }

    // 统计每种牌的数量（包括明牌）
    const tileCount = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }
    for (const set of revealedSets) {
      for (const tile of set.tiles) {
        const key = `${tile.type}-${tile.value}`;
        if (set.type === 'GANG') {
          // 杠牌的第四张牌不计入总数
          if (tileCount.get(key) === 3) continue;
        }
        tileCount.set(key, (tileCount.get(key) || 0) + 1);
      }
    }

    // 检查是否有超过4张的牌
    for (const count of tileCount.values()) {
      if (count > 4) {
        return false;
      }
    }

    // 按类型和点数排序手牌
    const sortedHandTiles = [...handTiles].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.value - b.value;
    });

    // 尝试找到对子
    for (let i = 0; i < sortedHandTiles.length - 1; i++) {
      const tile1 = sortedHandTiles[i];
      const tile2 = sortedHandTiles[i + 1];
      if (tile1.type === tile2.type && tile1.value === tile2.value) {
        // 找到对子，移除这两张牌
        const remainingTiles = [...sortedHandTiles];
        remainingTiles.splice(i + 1, 1);
        remainingTiles.splice(i, 1);
        
        // 检查剩余牌是否能组成完整的顺子或刻子
        if (this.canFormCompleteSets(remainingTiles, remainingSetsNeeded)) {
          return true;
        }
      }
    }

    return false;
  }

  private canFormCompleteSets(tiles: Tile[], setsNeeded: number): boolean {
    if (setsNeeded === 0) {
      return tiles.length === 0;
    }

    if (tiles.length === 0) {
      return false;
    }

    // 按花色和点数排序
    const sortedTiles = [...tiles].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.value - b.value;
    });

    // 尝试组成刻子
    const firstTile = sortedTiles[0];
    const sameTiles = sortedTiles.filter(t => t.type === firstTile.type && t.value === firstTile.value);
    if (sameTiles.length >= 3) {
      const remainingTiles = [...sortedTiles];
      remainingTiles.splice(0, 3);
      if (this.canFormCompleteSets(remainingTiles, setsNeeded - 1)) {
        return true;
      }
    }

    // 尝试组成顺子
    if (firstTile.type !== TileType.FENG && firstTile.type !== TileType.JIAN) {
      const nextTile = sortedTiles.find(t => t.type === firstTile.type && t.value === firstTile.value + 1);
      const nextNextTile = sortedTiles.find(t => t.type === firstTile.type && t.value === firstTile.value + 2);
      if (nextTile && nextNextTile) {
        const remainingTiles = [...sortedTiles];
        remainingTiles.splice(remainingTiles.indexOf(firstTile), 1);
        remainingTiles.splice(remainingTiles.indexOf(nextTile), 1);
        remainingTiles.splice(remainingTiles.indexOf(nextNextTile), 1);
        if (this.canFormCompleteSets(remainingTiles, setsNeeded - 1)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 检查是否为数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || 
           tile.type === TileType.TIAO || 
           tile.type === TileType.TONG;
  }

  /**
   * 检查明牌组合是否合法
   */
  protected isValidSet(set: TileSet): boolean {
    if (set.type === 'CHI') {
      // 检查顺子
      if (set.tiles.length !== 3) return false;
      const [t1, t2, t3] = set.tiles;
      if (!this.isNumberTile(t1) || !this.isNumberTile(t2) || !this.isNumberTile(t3)) {
        return false;
      }
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

// 注册平胡检测器
WinConditionRegistry.register(new PingHuDetector());