import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 四归一检测器
 * 检测和牌中是否包含4组四归一组合（四张相同的牌）
 */
export class FourOfAKindDetector extends BaseWinConditionDetector {
  protected name = '四归一';
  protected description = '手牌和明牌中包含4组四归一组合（即每组有4张相同的牌）';
  protected scoreValue = 48;
  protected huType = HuType.FOUR_OF_A_KIND;
  
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
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 统计每种牌的数量
    const tileCount = new Map<string, number>();
    for (const tile of allTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }
    
    // 统计有多少种牌有4张
    let fourOfAKindCount = 0;
    for (const count of tileCount.values()) {
      if (count === 4) {
        fourOfAKindCount++;
      }
    }
    
    // 四归一要求至少有4组四归一组合
    return fourOfAKindCount >= 4;
  }
}

// 注册检测器
WinConditionRegistry.register(new FourOfAKindDetector()); 