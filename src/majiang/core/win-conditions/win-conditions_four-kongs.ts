import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 四杠子检测器
 * 四杠子：和牌时包含四副杠（明杠、暗杠均可）
 */
export class FourKongsDetector extends BaseWinConditionDetector {
  protected name = '四杠子';
  protected description = '和牌时包含四副杠（明杠、暗杠均可）';
  protected scoreValue = 88; // 四杠子是高分牌型
  protected huType = HuType.FOUR_KONGS;
  
  /**
   * 检测是否为四杠子
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
    // 计算杠的数量
    const kongCount = revealedSets.filter(set => set.type === 'GANG').length;
    
    // 四杠子需要正好有四个杠
    return kongCount === 4;
  }
}

// 注册四杠子检测器
WinConditionRegistry.register(new FourKongsDetector()); 