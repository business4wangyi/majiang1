import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 清一色胡牌检测器
 * 清一色：由同一种花色的序数牌组成的和牌
 */
export class QingYiSeDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '清一色';
  protected description = '由同一种花色的序数牌组成的和牌';
  protected scoreValue = 24;
  protected huType = HuType.QING_YI_SE;
  
  /**
   * 检测是否为清一色
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
    // 如果没有牌，则不是清一色
    if (handTiles.length === 0 && revealedSets.length === 0) {
      return false;
    }
    
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 检查所有牌是否都是数字牌（万、条、筒）
    if (!allTiles.every((tile: Tile) => this.isNumericTile(tile))) {
      return false;
    }
    
    // 获取第一张牌的花色作为参考
    const firstTile = allTiles[0];
    if (!firstTile) {
      return false;
    }
    
    // 检查所有牌是否都是同一种花色
    return allTiles.every((tile: Tile) => tile.type === firstTile.type);
  }
  
  /**
   * 判断是否为数字牌（万、条、筒）
   */
  protected isNumericTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }
}

// 注册清一色检测器
WinConditionRegistry.register(new QingYiSeDetector()); 