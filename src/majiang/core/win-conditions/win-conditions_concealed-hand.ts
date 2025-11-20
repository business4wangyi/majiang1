import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 门前清检测器
 * 门前清：和牌时没有吃、碰、明杠，所有牌都是自己摸的
 */
export class ConcealedHandDetector extends BaseWinConditionDetector {
  protected name = '门前清';
  protected description = '和牌时没有吃、碰、明杠，所有牌都是自己摸的';
  protected scoreValue = 2;
  protected huType = HuType.PING_HU;
  
  /**
   * 检测是否为门前清
   */
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
    
    // 4. 检查是否有明牌（门前清要求没有明牌）
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 5. 检查是否可以形成有效的和牌组合
    const pairs = this.findPairs(handTiles);
    if (pairs.length === 0) {
      return false;
    }
    
    // 尝试每个对子
    for (const pair of pairs) {
      const remainingTiles = handTiles.filter(tile => 
        !pair.some(pairTile => pairTile.id === tile.id)
      );
      if (this.canFormSets(remainingTiles, [])) {
        return true;
      }
    }
    
    return false;
  }
}

// 注册门前清检测器
WinConditionRegistry.register(new ConcealedHandDetector()); 