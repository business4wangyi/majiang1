import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 五门齐检测器
 * 五门齐：和牌中包含万、条、筒、风、箭五门牌各至少一张
 */
export class AllTypesDetector extends BaseWinConditionDetector {
  protected name = '五门齐';
  protected description = '和牌中包含万、条、筒、风、箭五门牌各至少一张';
  protected scoreValue = 16;
  protected huType = HuType.ALL_TYPES;
  
  /**
   * 检测是否为五门齐
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
    
    // 检查是否包含五门牌
    const hasWan = allTiles.some(tile => tile.type === TileType.WAN);
    const hasTiao = allTiles.some(tile => tile.type === TileType.TIAO);
    const hasTong = allTiles.some(tile => tile.type === TileType.TONG);
    const hasFeng = allTiles.some(tile => tile.type === TileType.FENG);
    const hasJian = allTiles.some(tile => tile.type === TileType.JIAN);
    
    // 五门齐要求五种牌型都有
    return hasWan && hasTiao && hasTong && hasFeng && hasJian;
  }
}

// 注册五门齐检测器
WinConditionRegistry.register(new AllTypesDetector()); 