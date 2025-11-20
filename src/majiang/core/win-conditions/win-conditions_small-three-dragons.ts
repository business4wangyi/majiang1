import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 小三元检测器
 * 小三元：由两种箭牌的刻子或杠，外加一种箭牌的对子，再加上其他牌组成的和牌
 */
export class SmallThreeDragonsDetector extends BaseWinConditionDetector {
  protected name = '小三元';
  protected description = '由两种箭牌的刻子或杠，外加一种箭牌的对子，再加上其他牌组成的和牌';
  protected scoreValue = 48; // 小三元是高分牌型
  protected huType = HuType.SMALL_THREE_DRAGONS;
  
  /**
   * 检测是否为小三元
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
    // 获取手牌中各种牌的数量
    const handTileCount = this.countTiles(handTiles);
    
    // 记录箭牌刻子和对子的数量
    let dragonPungCount = 0; // 箭牌刻子数量
    let dragonPairCount = 0; // 箭牌对子数量
    
    // 在明牌组合中找出箭牌的刻子或杠
    for (const set of revealedSets) {
      if ((set.type === 'PENG' || set.type === 'GANG') && 
          set.tiles.length > 0 && 
          this.isDragonTile(set.tiles[0])) {
        dragonPungCount++;
      }
    }
    
    // 检查手牌中的箭牌刻子和对子
    for (let dragonValue = 1; dragonValue <= 3; dragonValue++) {
      const key = `${TileType.JIAN}-${dragonValue}`;
      const count = handTileCount.get(key) || 0;
      
      if (count >= 3) {
        dragonPungCount++; // 刻子
      } else if (count === 2) {
        dragonPairCount++; // 对子
      }
    }
    
    // 小三元需要两个箭牌刻子和一个箭牌对子
    return dragonPungCount === 2 && dragonPairCount === 1;
  }
  
  /**
   * 判断是否为箭牌
   */
  private isDragonTile(tile: Tile): boolean {
    // 箭牌的type是TileType.JIAN
    return tile.type === TileType.JIAN;
  }
}

// 注册小三元检测器
WinConditionRegistry.register(new SmallThreeDragonsDetector()); 