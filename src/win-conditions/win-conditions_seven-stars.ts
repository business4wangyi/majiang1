import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 七星不靠检测器
 * 七星不靠：由七个字牌（东南西北中发白）和六张花色、数字各不相同且不相邻的牌组成的特殊和牌
 */
export class SevenStarsDetector extends BaseWinConditionDetector {
  protected name = '七星不靠';
  protected description = '由七个字牌和六张花色、数字各不相同且不相邻的牌组成的特殊和牌';
  protected scoreValue = 64;
  protected huType = HuType.SEVEN_STARS;
  
  /**
   * 检测是否为七星不靠
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
    // 七星不靠必须是13张牌，全部是手牌，没有明牌
    if (handTiles.length !== 13 || revealedSets.length > 0) {
      return false;
    }
    
    // 统计各种牌的数量
    const windTiles = handTiles.filter(tile => tile.type === TileType.FENG);
    const dragonTiles = handTiles.filter(tile => tile.type === TileType.JIAN);
    const numberTiles = handTiles.filter(tile => 
      tile.type === TileType.WAN || 
      tile.type === TileType.TIAO || 
      tile.type === TileType.TONG
    );
    
    // 七星不靠必须包含全部七种字牌
    if (windTiles.length !== 4 || dragonTiles.length !== 3) {
      return false;
    }
    
    // 检查风牌是否包含东南西北
    const windValues = new Set(windTiles.map(tile => tile.value));
    if (windValues.size !== 4) {
      return false;
    }
    
    // 检查箭牌是否包含中发白
    const dragonValues = new Set(dragonTiles.map(tile => tile.value));
    if (dragonValues.size !== 3) {
      return false;
    }
    
    // 检查数牌是否有6张，且花色、数字不相邻
    if (numberTiles.length !== 6) {
      return false;
    }
    
    // 按花色分组
    const typeGroups = new Map<string, Tile[]>();
    for (const tile of numberTiles) {
      if (!typeGroups.has(tile.type)) {
        typeGroups.set(tile.type, []);
      }
      typeGroups.get(tile.type)!.push(tile);
    }
    
    // 每种花色的牌不能超过3张
    for (const tiles of typeGroups.values()) {
      if (tiles.length > 3) {
        return false;
      }
    }
    
    // 检查每种花色内的牌是否不相邻
    for (const [type, tiles] of typeGroups.entries()) {
      const values = tiles.map(tile => tile.value).sort((a, b) => a - b);
      for (let i = 1; i < values.length; i++) {
        if (values[i] - values[i - 1] <= 2) {
          return false; // 相邻或相隔1张牌
        }
      }
    }
    
    // 满足所有条件，是七星不靠
    return true;
  }
}

// 注册七星不靠检测器
WinConditionRegistry.register(new SevenStarsDetector()); 