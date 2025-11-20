import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 大三元检测器
 * 大三元：由中发白三种箭牌都形成刻子或杠，外加其他牌组成的和牌
 */
export class BigThreeDragonsDetector extends BaseWinConditionDetector {
  protected name = '大三元';
  protected description = '由中发白三种箭牌都形成刻子或杠，外加其他牌组成的和牌';
  protected scoreValue = 88; // 大三元是高分牌型
  protected huType = HuType.BIG_THREE_DRAGONS;
  
  /**
   * 检测是否为大三元
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
    // 记录每种箭牌的刻子/杠情况
    const dragonTypesWithPung = new Set<number>();
    
    // 在明牌组合中查找箭牌的刻子或杠
    for (const set of revealedSets) {
      if ((set.type === 'PENG' || set.type === 'GANG') && 
          set.tiles.length > 0 && this.isDragonTile(set.tiles[0])) {
        dragonTypesWithPung.add(set.tiles[0].value);
      }
    }
    
    // 检查手牌中的箭牌刻子
    for (let dragonValue = 1; dragonValue <= 3; dragonValue++) {
      // 统计箭牌的数量
      const count = this.countSpecificDragonTiles(handTiles, dragonValue);
      
      // 如果有3张或以上同种箭牌，认为可以组成刻子
      if (count >= 3) {
        dragonTypesWithPung.add(dragonValue);
      }
    }
    
    // 大三元需要三种箭牌都有刻子或杠
    return dragonTypesWithPung.size === 3;
  }
  
  /**
   * 判断是否为箭牌
   */
  private isDragonTile(tile: Tile): boolean {
    return tile.type === TileType.JIAN;
  }

  /**
   * 统计特定种类箭牌的数量
   */
  private countSpecificDragonTiles(tiles: Tile[], dragonValue: number): number {
    return tiles.filter(tile => 
      tile.type === TileType.JIAN && tile.value === dragonValue
    ).length;
  }

  /**
   * 统计手牌中各种牌的数量
   * 此方法在当前实现中没被使用，但保留作为API的一部分
   */
  protected countTiles(tiles: Tile[]): Map<string, number> {
    const tileCount = new Map<string, number>();
    
    for (const tile of tiles) {
      if (tile.type === TileType.JIAN) {
        const key = `dragon-${tile.value}`;
        const count = tileCount.get(key) || 0;
        tileCount.set(key, count + 1);
      } else {
        const key = `${tile.type}-${tile.value}`;
        const count = tileCount.get(key) || 0;
        tileCount.set(key, count + 1);
      }
    }
    
    return tileCount;
  }
}

// 注册大三元检测器
WinConditionRegistry.register(new BigThreeDragonsDetector()); 