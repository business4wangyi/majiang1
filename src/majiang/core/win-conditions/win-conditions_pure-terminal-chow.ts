import { Tile } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 清幺九检测器
 * 清幺九：全部由序数牌中的1和9组成的和牌
 */
export class PureTerminalChowDetector extends BaseWinConditionDetector {
  protected name = '清幺九';
  protected description = '全部由序数牌中的1和9组成的和牌';
  protected scoreValue = 64;
  protected huType = HuType.PURE_TERMINAL_CHOW;
  
  /**
   * 检测是否为清幺九
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
    // 检查所有牌是否都是序数牌的1或9
    return this.allTilesSatisfy(handTiles, revealedSets, tile => 
      this.isNumberTile(tile) && (tile.value === 1 || tile.value === 9)
    );
  }
}

// 注册清幺九检测器
WinConditionRegistry.register(new PureTerminalChowDetector()); 