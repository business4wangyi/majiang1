import { Tile, TileType } from '../core/tile';
import { TileSet, TileSetType, HuType } from '../core/rule-types';
import { BaseWinConditionDetector } from './win-condition-detector';

/**
 * 全幺九检测器
 * 全幺九：由幺九牌（一、九）和字牌组成的和牌
 */
export class AllTerminalsDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '全幺九';
  protected description = '由幺九牌组成的和牌';
  protected scoreValue = 32;
  protected huType = HuType.ALL_TERMINALS;

  protected isTerminalTile(tile: Tile): boolean {
    if (tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG) {
      return tile.value === 1 || tile.value === 9;
    }
    return true; // 字牌都是幺九牌
  }

  detect(handTiles: Tile[], revealedSets: TileSet[] = []): boolean {
    // 检查所有手牌是否都是幺九牌
    for (const tile of handTiles) {
      if (!this.isTerminalTile(tile)) {
        return false;
      }
    }

    // 检查所有明牌组合是否都是幺九牌
    for (const set of revealedSets) {
      for (const tile of set.tiles) {
        if (!this.isTerminalTile(tile)) {
          return false;
        }
      }
    }

    // 如果没有明牌组合，检查是否可以组成七对子
    if (revealedSets.length === 0) {
      const tileCounts = new Map<string, number>();
      for (const tile of handTiles) {
        const key = `${tile.type}-${tile.value}`;
        tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
      }
      let pairCount = 0;
      for (const count of tileCounts.values()) {
        if (count === 2) {
          pairCount++;
        } else if (count !== 0) {
          break;
        }
      }
      if (pairCount === 7) {
        return true;
      }
    }

    // 统计手牌中每种牌的数量
    const tileCounts = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
    }

    // 统计已有的组合数（碰和杠）
    let existingSets = 0;

    // 处理明牌组合
    for (const set of revealedSets) {
      if (set.type === 'PENG' || set.type === 'GANG') {
        existingSets++;
      } else if (set.type === 'CHI') {
        // 对于吃牌组合，检查是否所有牌都是相同的幺九牌
        const firstTile = set.tiles[0];
        if (!this.isTerminalTile(firstTile)) {
          return false;
        }
        const allSame = set.tiles.every(tile => 
          tile.type === firstTile.type && tile.value === firstTile.value
        );
        if (allSame) {
          existingSets++;
        } else {
          return false;
        }
      }
    }

    // 如果已有的组合数超过4，直接返回false
    if (existingSets > 4) {
      return false;
    }

    // 如果已经有足够的组合，检查是否还有对子
    if (existingSets === 4) {
      for (const [key, count] of tileCounts.entries()) {
        if (count === 2) {
          return true;
        }
      }
      return false;
    }

    // 尝试从手牌中找出所有可能的组合
    const possibleSets: TileSet[] = [];

    // 先找出所有可能的刻子
    for (const [key, count] of tileCounts.entries()) {
      if (count >= 3) {
        const [type, valueStr] = key.split('-');
        const value = parseInt(valueStr);
        const tile = { type: type as TileType, value } as Tile;
        possibleSets.push({
          type: 'PENG',
          tiles: [tile, tile, tile]
        });
      }
    }

    // 尝试所有可能的组合
    const result = this.tryFormSets(tileCounts, possibleSets, existingSets);

    // 如果找不到合适的组合，检查是否可以用现有的组合和对子组成和牌
    if (!result && existingSets > 0) {
      for (const [key, count] of tileCounts.entries()) {
        if (count === 2) {
          return true;
        }
      }
    }

    return result;
  }

  private tryFormSets(
    tileCounts: Map<string, number>,
    possibleSets: TileSet[],
    existingSets: number,
    currentSets: TileSet[] = []
  ): boolean {
    // 如果已经找到足够的组合，检查是否还有对子
    if (currentSets.length + existingSets === 4) {
      // 检查是否还有对子
      for (const [key, count] of tileCounts.entries()) {
        if (count === 2) {
          return true;
        }
      }
      return false;
    }

    // 如果已经超过4组，返回false
    if (currentSets.length + existingSets > 4) {
      return false;
    }

    // 尝试每一个可能的组合
    for (let i = 0; i < possibleSets.length; i++) {
      const set = possibleSets[i];
      const newTileCounts = new Map(tileCounts);
      let canForm = true;

      // 检查是否有足够的牌来形成这个组合
      for (const tile of set.tiles) {
        const key = `${tile.type}-${tile.value}`;
        const count = newTileCounts.get(key) || 0;
        if (count === 0) {
          canForm = false;
          break;
        }
        newTileCounts.set(key, count - 1);
      }

      if (canForm) {
        const newPossibleSets = possibleSets.slice(i + 1);
        const newCurrentSets = [...currentSets, set];
        if (this.tryFormSets(newTileCounts, newPossibleSets, existingSets, newCurrentSets)) {
          return true;
        }
      }
    }

    return false;
  }

  protected countTiles(tiles: Tile[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const tile of tiles) {
      const key = `${tile.type}:${tile.value}`;
      const count = counts.get(key) || 0;
      counts.set(key, count + 1);
    }
    return counts;
  }
}