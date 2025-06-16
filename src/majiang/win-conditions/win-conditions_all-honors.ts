import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 字一色检测器
 * 字一色：和牌时所有牌都是字牌（风牌和箭牌）
 */
export class AllHonorsDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '字一色';
  protected description = '和牌时所有牌都是字牌（风牌和箭牌）';
  protected scoreValue = 16;
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
    revealedSets: TileSet[], 
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
    
    // 1. 检查总牌数
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    if (allTiles.length !== 14) {
      return false;
    }
    
    // 2. 检查是否有重复牌
    const tileCount = new Map<string, number>();
    for (const tile of allTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
      if (tileCount.get(key)! > 4) {
        return false;
      }
    }
    
    // 3. 检查明牌是否合法
    for (const set of revealedSets) {
      if (!this.isValidSet(set)) {
        return false;
      }
    }
    
    // 4. 检查是否所有牌都是字牌
    if (!this.allTilesSatisfy(handTiles, revealedSets, tile => 
      tile.type === TileType.FENG || tile.type === TileType.JIAN
    )) {
      return false;
    }
    
    // 5. 检查是否有对子
    const pairs = this.findPairs(handTiles);
    if (pairs.length === 0) {
      return false;
    }
    
    // 6. 检查是否可以形成有效的和牌组合
    let hasValidCombination = false;
    for (const pair of pairs) {
      const remainingTiles = handTiles.filter(tile => 
        !pair.some(pairTile => pairTile.id === tile.id)
      );
      if (this.canFormSetsWithHonors(remainingTiles, revealedSets)) {
        hasValidCombination = true;
        break;
      }
    }
    if (!hasValidCombination) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查是否可以形成有效的和牌组合（只考虑字牌）
   */
  private canFormSetsWithHonors(handTiles: Tile[], revealedSets: TileSet[]): boolean {
    // 如果没有手牌，检查明牌是否足够
    if (handTiles.length === 0) {
      return revealedSets.length === 4;
    }

    // 尝试形成刻子（字牌只能形成刻子）
    const pungs = this.findPungs(handTiles);
    for (const pung of pungs) {
      const remainingTiles = handTiles.filter(tile => 
        !pung.some(pungTile => pungTile.id === tile.id)
      );
      if (this.canFormSetsWithHonors(remainingTiles, [...revealedSets, { type: 'PENG', tiles: pung }])) {
        return true;
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