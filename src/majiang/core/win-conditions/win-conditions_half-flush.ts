import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 混一色检测器
 * 混一色：由一种花色的序数牌及字牌组成的和牌
 */
export class HalfFlushDetector extends BaseWinConditionDetector {
  public isBaseWin = false;
  protected name = '混一色';
  protected description = '由一种花色的序数牌及字牌组成的和牌';
  protected scoreValue = 40;
  protected huType = HuType.HALF_FLUSH;
  
  /**
   * 检测是否为混一色
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
    
    // 过滤出数字牌和字牌
    const numberTiles = allTiles.filter(tile => this.isNumberTile(tile));
    const honorTiles = allTiles.filter(tile => this.isHonorTile(tile));
    
    // 混一色必须同时包含数字牌和字牌
    if (numberTiles.length === 0 || honorTiles.length === 0) {
      return false;
    }
    
    // 获取第一张数字牌的类型作为参考
    const referenceType = numberTiles[0].type;
    
    // 检查是否所有数字牌都是同一种花色
    for (const tile of numberTiles) {
      if (tile.type !== referenceType) {
        return false;
      }
    }
    
    // 检查非数字牌是否都是字牌（风牌或箭牌）
    const nonNumberTiles = allTiles.filter(tile => !this.isNumberTile(tile));
    for (const tile of nonNumberTiles) {
      if (!this.isHonorTile(tile)) {
        return false;
      }
    }
    
    // 满足混一色条件
    return true;
  }

  /**
   * 判断是否为数字牌（万、条、筒）
   */
  protected isNumberTile(tile: Tile): boolean {
    return (
      tile.type === TileType.WAN || 
      tile.type === TileType.TIAO || 
      tile.type === TileType.TONG
    );
  }
  
  /**
   * 判断是否为字牌（风牌或箭牌）
   */
  protected isHonorTile(tile: Tile): boolean {
    return (
      tile.type === TileType.FENG || 
      tile.type === TileType.JIAN
    );
  }
}

// 注册混一色检测器
WinConditionRegistry.register(new HalfFlushDetector()); 