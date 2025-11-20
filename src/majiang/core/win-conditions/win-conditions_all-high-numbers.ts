import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';
import { Player } from '../player';

export class AllHighNumbersDetector extends BaseWinConditionDetector {
  protected name = '全大';
  protected description = '和牌时，所有数牌都是789';
  protected scoreValue = 24;
  protected huType = HuType.ALL_HIGH_NUMBERS;

  private isHighNumber(tile: Tile): boolean {
    return tile.type !== TileType.FENG && tile.type !== TileType.JIAN && tile.value >= 7;
  }

  private tryFormSets(tiles: Map<string, number>, setsNeeded: number): boolean {
    if (setsNeeded === 0) {
      return true;
    }

    // 尝试形成刻子
    for (const [key, count] of tiles.entries()) {
      if (count >= 3) {
        const [type, value] = key.split('-');
        if (!this.isHighNumber(new Tile(type as TileType, parseInt(value), 0))) {
          continue;
        }
        const newTiles = new Map(tiles);
        const newCount = count - 3;
        if (newCount === 0) {
          newTiles.delete(key);
        } else {
          newTiles.set(key, newCount);
        }
        if (this.tryFormSets(newTiles, setsNeeded - 1)) {
          return true;
        }
      }
    }

    // 尝试形成顺子
    for (const [key, count] of tiles.entries()) {
      const [type, value] = key.split('-');
      const tileType = type as TileType;
      const tileValue = parseInt(value);
      if (!this.isHighNumber(new Tile(tileType, tileValue, 0))) {
        continue;
      }
      if (tileValue <= 7) {
        const key2 = `${type}-${tileValue + 1}`;
        const key3 = `${type}-${tileValue + 2}`;
        if (tiles.has(key2) && tiles.has(key3)) {
          const newTiles = new Map(tiles);
          // 移除第一张牌
          const newCount1 = count - 1;
          if (newCount1 === 0) {
            newTiles.delete(key);
          } else {
            newTiles.set(key, newCount1);
          }
          // 移除第二张牌
          const count2 = tiles.get(key2)!;
          const newCount2 = count2 - 1;
          if (newCount2 === 0) {
            newTiles.delete(key2);
          } else {
            newTiles.set(key2, newCount2);
          }
          // 移除第三张牌
          const count3 = tiles.get(key3)!;
          const newCount3 = count3 - 1;
          if (newCount3 === 0) {
            newTiles.delete(key3);
          } else {
            newTiles.set(key3, newCount3);
          }
          if (this.tryFormSets(newTiles, setsNeeded - 1)) {
            return true;
          }
        }
      }
    }

    return false;
  }

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
    // 检查所有牌是否都是789
    for (const tile of handTiles) {
      if (!this.isHighNumber(tile)) {
        return false;
      }
    }
    for (const set of revealedSets) {
      for (const tile of set.tiles) {
        if (!this.isHighNumber(tile)) {
          return false;
        }
      }
    }

    // 统计手牌
    const tiles = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tiles.set(key, (tiles.get(key) || 0) + 1);
    }

    // 计算已经形成的面子数量
    let totalSetsNeeded = 0;
    for (const set of revealedSets) {
      totalSetsNeeded++;
    }

    // 计算剩余需要组成的面子数量
    const remainingTiles = handTiles.length;
    const remainingSetsNeeded = Math.floor((remainingTiles - 2) / 3);
    const pairRequired = (remainingTiles - 2) % 3 === 0;

    // 如果需要对子，先尝试所有可能的对子
    if (pairRequired) {
      for (const [key, count] of tiles.entries()) {
        if (count >= 2) {
          const newTiles = new Map(tiles);
          const newCount = count - 2;
          if (newCount === 0) {
            newTiles.delete(key);
          } else {
            newTiles.set(key, newCount);
          }
          if (this.tryFormSets(newTiles, remainingSetsNeeded)) {
            return true;
          }
        }
      }
      return false;
    }

    // 不需要对子的情况
    return this.tryFormSets(tiles, remainingSetsNeeded);
  }
}

// 注册检测器
WinConditionRegistry.register(new AllHighNumbersDetector()); 