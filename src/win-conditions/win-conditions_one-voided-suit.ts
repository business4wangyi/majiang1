import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 缺一门检测器
 * 缺一门：和牌中缺少某一种花色的数牌
 */
export class OneVoidedSuitDetector extends BaseWinConditionDetector {
  protected name = '缺一门';
  protected description = '和牌中缺少某一种花色的数牌';
  protected scoreValue = 4;
  protected huType = HuType.ONE_VOIDED_SUIT;
  
  /**
   * 检测是否为缺一门
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
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 如果所有牌都是字牌，不算缺一门
    const numTiles = allTiles.filter(tile => this.isNumberTile(tile));
    
    // 统计不同花色的数牌
    const wanTiles = allTiles.filter(tile => tile.type === TileType.WAN);
    const tiaoTiles = allTiles.filter(tile => tile.type === TileType.TIAO);
    const tongTiles = allTiles.filter(tile => tile.type === TileType.TONG);
    
    // 检查是否缺少某一门数牌
    const hasWan = wanTiles.length > 0;
    const hasTiao = tiaoTiles.length > 0;
    const hasTong = tongTiles.length > 0;
    
    // 计算存在的花色数量
    const suitCount = (hasWan ? 1 : 0) + (hasTiao ? 1 : 0) + (hasTong ? 1 : 0);
    
    // 缺一门：只有两种花色的数牌
    return suitCount === 2;
  }
}

// 注册缺一门检测器
WinConditionRegistry.register(new OneVoidedSuitDetector()); 