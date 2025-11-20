import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 双暗杠检测器
 * 双暗杠：和牌中有两副暗杠
 */
export class DoubleConcealedKongsDetector extends BaseWinConditionDetector {
  protected name = '双暗杠';
  protected description = '和牌中有两副暗杠';
  protected scoreValue = 16;
  protected huType = HuType.DOUBLE_CONCEALED_KONGS;
  
  /**
   * 检测是否为双暗杠
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
    // 找出所有暗杠
    const concealedKongs = revealedSets.filter(set => 
      set.type === 'GANG' && set.source === 'an'
    );
    
    // 双暗杠要求至少有两副暗杠
    return concealedKongs.length >= 2;
  }
}

// 注册双暗杠检测器
WinConditionRegistry.register(new DoubleConcealedKongsDetector()); 