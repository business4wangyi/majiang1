import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector } from './win-condition-detector';

/**
 * 全小检测器
 * 全小：由序数牌1-3组成的和牌
 */
export class AllLowNumbersDetector extends BaseWinConditionDetector {
  protected name = '全小';
  protected description = '和牌时，所有数牌都是123';
  protected scoreValue = 24;
  protected huType = HuType.ALL_LOW_NUMBERS;

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
    // 检查手牌是否都是低数牌
    if (!handTiles.every(tile => this.isLowNumber(tile))) {
      return false;
    }

    // 检查明牌是否都是低数牌
    if (!revealedSets.every(set => set.tiles.every(tile => this.isLowNumber(tile)))) {
      return false;
    }

    // 检查是否都是有效的组合
    if (!revealedSets.every(set => this.isValidSet(set))) {
      return false;
    }

    // 检查是否有对子
    const pairs = this.findPairs(handTiles);
    if (pairs.length === 0) {
      return false;
    }

    // 如果全是对子，返回false
    if (pairs.length * 2 === handTiles.length && revealedSets.length === 0) {
      return false;
    }

    // 对于每个对子，尝试形成和牌
    for (const pair of pairs) {
      const remainingTiles = handTiles.filter(tile => 
        !pair.some(pairTile => pairTile.id === tile.id)
      );

      // 检查剩余的牌是否可以形成有效的组合
      if (this.canFormSets(remainingTiles, revealedSets)) {
        return true;
      }
    }

    return false;
  }

  private isLowNumber(tile: Tile): boolean {
    return (tile.type === TileType.WAN || 
            tile.type === TileType.TIAO || 
            tile.type === TileType.TONG) && 
           tile.value <= 3;
  }

  protected isValidSet(set: TileSet): boolean {
    if (!set.tiles.every(tile => this.isLowNumber(tile))) {
      return false;
    }

    switch (set.type) {
      case 'PENG':
        return set.tiles.length === 3 && set.tiles.every(tile => 
          tile.type === set.tiles[0].type && 
          tile.value === set.tiles[0].value
        );
      case 'GANG':
        return set.tiles.length === 4 && set.tiles.every(tile => 
          tile.type === set.tiles[0].type && 
          tile.value === set.tiles[0].value
        );
      case 'CHI':
        const firstTile = set.tiles[0];
        return set.tiles.length === 3 && 
               set.tiles.every(tile => tile.type === firstTile.type) &&
               set.tiles[1].value === firstTile.value + 1 &&
               set.tiles[2].value === firstTile.value + 2 &&
               set.tiles[2].value <= 3;
      default:
        return false;
    }
  }

  protected findPairs(handTiles: Tile[]): Tile[][] {
    const pairs: Tile[][] = [];
    const tileCount = new Map<string, Tile[]>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      if (!tileCount.has(key)) {
        tileCount.set(key, []);
      }
      tileCount.get(key)!.push(tile);
    }
    for (const tiles of tileCount.values()) {
      if (tiles.length >= 2) {
        pairs.push([tiles[0], tiles[1]]);
      }
    }
    return pairs;
  }

  protected canFormSets(handTiles: Tile[], revealedSets: TileSet[]): boolean {
    // 如果没有手牌，检查明牌是否足够
    if (handTiles.length === 0) {
      return revealedSets.length === 4;
    }

    // 如果手牌数量不是3的倍数，返回false
    if (handTiles.length % 3 !== 0) {
      return false;
    }

    // 计算需要形成的组合数
    const neededSets = 4 - revealedSets.length;
    if (handTiles.length !== neededSets * 3) {
      return false;
    }

    // 按花色和数字排序
    const sortedTiles = [...handTiles].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.value - b.value;
    });

    // 尝试所有可能的组合
    return this.tryFormSets(sortedTiles, neededSets);
  }

  private tryFormSets(tiles: Tile[], neededSets: number): boolean {
    if (neededSets === 0) {
      return true;
    }

    if (tiles.length === 0) {
      return false;
    }

    // 尝试形成刻子
    const firstTile = tiles[0];
    const sameTiles = tiles.filter(tile => 
      tile.type === firstTile.type && tile.value === firstTile.value
    );

    if (sameTiles.length >= 3) {
      const remainingTiles = tiles.filter(tile => 
        !sameTiles.slice(0, 3).some(t => t.id === tile.id)
      );
      if (this.tryFormSets(remainingTiles, neededSets - 1)) {
        return true;
      }
    }

    // 尝试形成顺子
    for (let i = 0; i < tiles.length - 2; i++) {
      const tile1 = tiles[i];
      if (tile1.value > 1) continue; // 只考虑从1开始的顺子

      const type = tile1.type;
      const value = tile1.value;

      // 查找第二张牌
      const tile2Index = tiles.findIndex((t, index) => 
        index > i && 
        t.type === type && 
        t.value === value + 1
      );

      if (tile2Index === -1) continue;

      // 查找第三张牌
      const tile3Index = tiles.findIndex((t, index) => 
        index > tile2Index && 
        t.type === type && 
        t.value === value + 2
      );

      if (tile3Index === -1) continue;

      // 移除这三张牌，递归检查剩余的牌
      const remainingTiles = tiles.filter((_, index) => 
        index !== i && index !== tile2Index && index !== tile3Index
      );

      if (this.tryFormSets(remainingTiles, neededSets - 1)) {
        return true;
      }
    }

    return false;
  }
}