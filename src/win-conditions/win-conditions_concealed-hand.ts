import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 门前清检测器
 * 门前清：和牌时手牌全是暗牌，没有明牌
 */
export class ConcealedHandDetector extends BaseWinConditionDetector {
  protected name = '门前清';
  protected description = '和牌时手牌全是暗牌，没有明牌';
  protected scoreValue = 8;
  protected huType = HuType.CONCEALED_HAND;
  
  /**
   * 检测是否为门前清
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
    // 门前清：没有明牌
    return revealedSets.length === 0;
  }
}

// 注册门前清检测器
WinConditionRegistry.register(new ConcealedHandDetector()); 