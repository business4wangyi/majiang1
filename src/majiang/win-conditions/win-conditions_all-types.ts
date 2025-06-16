import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 五门齐检测器
 * 五门齐：和牌时包含万、条、筒、风、箭五种牌型
 */
export class AllTypesDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '五门齐';
  protected description = '和牌时包含万、条、筒、风、箭五种牌型';
  protected scoreValue = 2;
  protected huType = HuType.PING_HU;

  detect(
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
    
    // 4. 检查是否有对子
    const pairs = this.findPairs(handTiles);
    if (pairs.length === 0) {
      return false;
    }
    
    // 5. 检查是否可以形成有效的和牌组合
    let hasValidCombination = false;
    for (const pair of pairs) {
      const remainingTiles = handTiles.filter(tile => 
        !pair.some(pairTile => pairTile.id === tile.id)
      );
      if (this.canFormSets(remainingTiles, revealedSets)) {
        hasValidCombination = true;
        break;
      }
    }
    if (!hasValidCombination) {
      return false;
    }
    
    // 6. 检查是否包含所有五种牌型
    const typeSet = new Set<TileType>();
    for (const tile of allTiles) {
      typeSet.add(tile.type);
    }
    
    const hasAllTypes = [
      TileType.WAN,
      TileType.TIAO,
      TileType.TONG,
      TileType.FENG,
      TileType.JIAN
    ].every(type => typeSet.has(type));
    
    if (!hasAllTypes) {
      return false;
    }
    
    return true;
  }
}

// 注册五门齐检测器
WinConditionRegistry.register(new AllTypesDetector()); 