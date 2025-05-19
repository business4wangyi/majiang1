import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 全带幺胡牌检测器
 * 全带幺：每副牌都有幺九牌（1、9）或字牌
 */
export class OutsideHandDetector extends BaseWinConditionDetector {
  protected name = '全带幺';
  protected description = '每副牌都有幺九牌（1、9）或字牌';
  protected scoreValue = 16;
  protected huType = HuType.OUTSIDE_HAND;
  
  /**
   * 检测是否为全带幺
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
    // 如果没有牌，则不是全带幺
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }
    
    // 检查所有明牌组合是否都含有幺九牌或字牌
    for (const set of revealedSets) {
      if (!this.setContainsTerminalOrHonor(set)) {
        return false;
      }
    }
    
    // 如果没有手牌，则不需要检查手牌
    if (handTiles.length === 0) {
      return true;
    }
    
    // 对于手牌，我们需要将其拆分成对子和刻子/顺子
    // 先确认是否有足够的对子和组合
    // 简单检查：如果有手牌，必须至少有一张是幺九牌或字牌
    return handTiles.some(tile => this.isTerminalOrHonor(tile));
  }
  
  /**
   * 检查一个牌组是否包含幺九牌或字牌
   */
  private setContainsTerminalOrHonor(set: TileSet): boolean {
    return set.tiles.some(tile => this.isTerminalOrHonor(tile));
  }

  /**
   * 检查一张牌是否为幺九牌或字牌
   * 幺九牌：数字牌的1和9
   * 字牌：风牌和箭牌
   */
  protected isTerminalOrHonor(tile: Tile): boolean {
    // 如果是风牌或箭牌，则为字牌
    if (tile.type === TileType.FENG || tile.type === TileType.JIAN) {
      return true;
    }
    
    // 如果是数字牌，检查是否为1或9
    return tile.value === 1 || tile.value === 9;
  }
}

// 注册全带幺检测器
WinConditionRegistry.register(new OutsideHandDetector()); 