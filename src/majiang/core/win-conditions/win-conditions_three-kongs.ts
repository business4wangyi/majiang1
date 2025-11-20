import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 三杠子检测器
 * 三杠子：和牌中有三副杠
 */
export class ThreeKongsDetector extends BaseWinConditionDetector {
  protected name = '三杠子';
  protected description = '和牌中有三副杠';
  protected scoreValue = 48;
  protected huType = HuType.THREE_KONGS;
  
  /**
   * 检测是否为三杠子
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
    // 找出所有杠牌
    const kongs = revealedSets.filter(set => set.type === 'GANG');
    
    // 三杠子要求有三副杠
    return kongs.length === 3;
  }
}

// 注册三杠子检测器
WinConditionRegistry.register(new ThreeKongsDetector()); 