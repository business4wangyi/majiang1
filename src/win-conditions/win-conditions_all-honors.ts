import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 字一色检测器
 * 字一色：全部由字牌（风牌、箭牌）组成的和牌
 */
export class AllHonorsDetector extends BaseWinConditionDetector {
  protected name = '字一色';
  protected description = '和牌时，所有牌都是字牌';
  protected scoreValue = 64;
  protected huType = HuType.ALL_HONORS;
  
  protected isHonorTile(tile: Tile): boolean {
    return tile.type === TileType.FENG || tile.type === TileType.JIAN;
  }

  protected isValidSet(set: TileSet): boolean {
    // 检查所有牌是否都是字牌
    if (!set.tiles.every(tile => this.isHonorTile(tile))) {
      return false;
    }

    // 检查组合类型
    switch (set.type) {
      case 'PENG':
        // 刻子必须是三个相同的牌
        return set.tiles.length === 3 &&
               set.tiles.every(tile => tile.equals(set.tiles[0]));
      case 'GANG':
        // 杠子必须是四个相同的牌
        return set.tiles.length === 4 &&
               set.tiles.every(tile => tile.equals(set.tiles[0]));
      case 'CHI':
        // 字牌不能组成顺子
        return false;
      default:
        return false;
    }
  }

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
    // 检查是否有牌
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }

    // 检查所有牌是否都是字牌
    const allTilesValid = this.allTilesSatisfy(
      handTiles,
      revealedSets,
      (tile: Tile) => this.isHonorTile(tile)
    );
    if (!allTilesValid) {
      return false;
    }

    // 检查明牌是否都是合法的组合
    for (const set of revealedSets) {
      if (!this.isValidSet(set)) {
        return false;
      }
    }

    // 计算总牌数，杠牌在计算时视为3张
    let totalTiles = handTiles.length;
    for (const set of revealedSets) {
      if (set.type === 'GANG') {
        totalTiles += 3;  // 杠牌在计算时视为3张
      } else {
        totalTiles += set.tiles.length;
      }
    }

    // 检查总牌数是否合法
    if (totalTiles !== 14) {
      return false;
    }

    // 检查是否可以和牌
    return this.canFormWinningHand(handTiles, revealedSets);
  }

  private canFormWinningHand(handTiles: Tile[], revealedSets: TileSet[]): boolean {
    // 计算已经形成的组合数
    const formedSets = revealedSets.length;
    const remainingTiles = [...handTiles];
    const remainingSets = 4 - formedSets;

    // 如果没有剩余组合需要形成，检查是否只剩下一对
    if (remainingSets === 0) {
      return remainingTiles.length === 2 && remainingTiles[0].equals(remainingTiles[1]);
    }

    // 如果剩余的牌不足以形成组合，返回false
    if (remainingTiles.length < remainingSets * 3) {
      return false;
    }

    // 统计每种牌的数量
    const countMap = new Map<string, {count: number, tile: Tile}>();
    for (const tile of remainingTiles) {
      const key = `${tile.type}_${tile.value}`;
      if (!countMap.has(key)) {
        countMap.set(key, {count: 0, tile});
      }
      countMap.get(key)!.count++;
    }

    // 尝试每种牌作为对子
    for (const [key, {count, tile}] of countMap.entries()) {
      if (count >= 2) {
        // 移除对子
        const pairTiles = remainingTiles.filter(t => t.equals(tile)).slice(0, 2);
        const otherTiles = remainingTiles.filter(t => !pairTiles.some(pt => pt.id === t.id));
        
        // 尝试形成剩余的组合
        if (this.canFormSets(otherTiles, remainingSets)) {
          return true;
        }
      }
    }

    return false;
  }

  private canFormSets(tiles: Tile[], numSets: number): boolean {
    // 如果没有剩余组合需要形成，返回true
    if (numSets === 0) {
      return tiles.length === 0;
    }

    // 如果剩余的牌不足以形成组合，返回false
    if (tiles.length < numSets * 3) {
      return false;
    }

    // 统计每种牌的数量
    const countMap = new Map<string, {count: number, tile: Tile}>();
    for (const tile of tiles) {
      const key = `${tile.type}_${tile.value}`;
      if (!countMap.has(key)) {
        countMap.set(key, {count: 0, tile});
      }
      countMap.get(key)!.count++;
    }

    // 先尝试形成杠子
    for (const [key, {count, tile}] of countMap.entries()) {
      if (count >= 4) {
        // 移除4张相同的牌
        const gangTiles = tiles.filter(t => t.equals(tile)).slice(0, 4);
        const otherTiles = tiles.filter(t => !gangTiles.some(gt => gt.id === t.id));
        
        // 尝试形成剩余的组合
        if (this.canFormSets(otherTiles, numSets - 1)) {
          return true;
        }
      }
    }

    // 再尝试形成刻子
    for (const [key, {count, tile}] of countMap.entries()) {
      if (count >= 3) {
        // 移除3张相同的牌
        const pungTiles = tiles.filter(t => t.equals(tile)).slice(0, 3);
        const otherTiles = tiles.filter(t => !pungTiles.some(pt => pt.id === t.id));
        
        // 尝试形成剩余的组合
        if (this.canFormSets(otherTiles, numSets - 1)) {
          return true;
        }
      }
    }

    return false;
  }

  protected allTilesSatisfy(
    handTiles: Tile[],
    revealedSets: TileSet[],
    predicate: (tile: Tile) => boolean
  ): boolean {
    // 检查手牌
    if (!handTiles.every(predicate)) {
      return false;
    }

    // 检查已亮出的牌组
    for (const set of revealedSets) {
      if (!set.tiles.every(predicate)) {
        return false;
      }
    }

    return true;
  }
}

// 注册字一色检测器
WinConditionRegistry.register(new AllHonorsDetector()); 