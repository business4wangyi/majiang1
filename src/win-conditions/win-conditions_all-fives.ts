import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 全带五检测器
 * 全带五：每组牌（刻子、顺子、对子）都包含数字5的和牌
 */
export class AllFivesDetector extends BaseWinConditionDetector {
  public isBaseWin = false;
  protected name = '全带五';
  protected description = '和牌时，每组牌都包含数字5';
  protected scoreValue = 16;
  protected huType = HuType.ALL_FIVES;
  
  /**
   * 检测是否为全带五
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
    // 如果没有手牌和明牌，返回false
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }

    // 检查明牌中的每一组是否包含数字5
    for (const set of revealedSets) {
      if (!this.setContainsFive(set)) {
        return false;
      }
    }
    
    // 检查手牌，需要分析手牌的组合
    if (handTiles.length > 0) {
      // 统计手牌中的牌
      const tileCount = this.countTiles(handTiles);
      
      // 检查手牌中的对子
      const pairs: Tile[][] = [];
      // 检查手牌中的刻子
      const pungs: Tile[][] = [];
      // 检查手牌中可能的顺子
      const chows: Tile[][] = [];
      
      // 分析手牌中的牌组
      for (const [tileKey, count] of tileCount.entries()) {
        const [type, value] = tileKey.split('-');
        const tileValue = parseInt(value);
        
        // 对子
        if (count === 2) {
          const tile = handTiles.find(t => 
            t.type === type && t.value === tileValue
          );
          if (tile) {
            pairs.push([tile, tile]);
          }
        }
        
        // 刻子
        if (count >= 3) {
          const tile = handTiles.find(t => 
            t.type === type && t.value === tileValue
          );
          if (tile) {
            pungs.push([tile, tile, tile]);
          }
        }
        
        // 顺子：检查是否有相邻的数字牌
        if (['bamboo', 'dot', 'character', '条', '筒', '万'].includes(type) && 
            count > 0 && tileValue >= 1 && tileValue <= 7) {
          
          const nextTileKey = `${type}-${tileValue + 1}`;
          const nextNextTileKey = `${type}-${tileValue + 2}`;
          
          if (tileCount.has(nextTileKey) && tileCount.has(nextNextTileKey)) {
            const tile1 = handTiles.find(t => 
              t.type === type && t.value === tileValue
            );
            const tile2 = handTiles.find(t => 
              t.type === type && t.value === tileValue + 1
            );
            const tile3 = handTiles.find(t => 
              t.type === type && t.value === tileValue + 2
            );
            
            if (tile1 && tile2 && tile3) {
              chows.push([tile1, tile2, tile3]);
            }
          }
        }
      }
      
      // 从手牌中检查是否所有组合都包含5
      if (pairs.length > 0 && !pairs.some(pair => pair[0].value === 5)) {
        return false;
      }
      
      if (pungs.length > 0 && !pungs.some(pung => pung[0].value === 5)) {
        return false;
      }
      
      if (chows.length > 0 && !chows.some(chow => 
        chow.some(tile => tile.value === 5)
      )) {
        return false;
      }
      
      // 如果手牌中没有5，则不满足条件
      if (pairs.length === 0 && pungs.length === 0 && chows.length === 0) {
        return !handTiles.some(tile => tile.value === 5);
      }
    }
    
    // 满足所有条件，是全带五
    return true;
  }
  
  /**
   * 检查一组牌是否包含数字5
   */
  private setContainsFive(set: TileSet): boolean {
    return set.tiles.some(tile => tile.value === 5);
  }
}

// 注册全带五检测器
WinConditionRegistry.register(new AllFivesDetector()); 