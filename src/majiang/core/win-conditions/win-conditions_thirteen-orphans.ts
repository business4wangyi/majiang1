import { Tile, TileType, FengValue, JianValue } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 十三幺检测器
 * 十三幺：由一、九牌加上所有字牌各一张，再加上其中任意一张组成的特殊和牌
 */
export class ThirteenOrphansDetector extends BaseWinConditionDetector {
  public isBaseWin = true;
  protected name = '十三幺';
  protected description = '由一、九牌加上所有字牌各一张，再加上其中任意一张组成的特殊和牌';
  protected scoreValue = 88; // 十三幺是高分牌型
  protected huType = HuType.THIRTEEN_ORPHANS;
  
  /**
   * 十三幺包含的特定牌型
   * 包括：三种花色的一、九牌各一张，七种字牌各一张
   */
  private readonly requiredTiles = [
    { type: TileType.WAN, value: 1 },
    { type: TileType.WAN, value: 9 },
    { type: TileType.TIAO, value: 1 },
    { type: TileType.TIAO, value: 9 },
    { type: TileType.TONG, value: 1 },
    { type: TileType.TONG, value: 9 },
    { type: TileType.FENG, value: FengValue.DONG },
    { type: TileType.FENG, value: FengValue.NAN },
    { type: TileType.FENG, value: FengValue.XI },
    { type: TileType.FENG, value: FengValue.BEI },
    { type: TileType.JIAN, value: JianValue.ZHONG },
    { type: TileType.JIAN, value: JianValue.FA },
    { type: TileType.JIAN, value: JianValue.BAI }
  ];
  
  /**
   * 检测是否为十三幺
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
    // 十三幺必须是门前清，不能有明牌
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 十三幺必须恰好有14张牌
    if (handTiles.length !== 14) {
      return false;
    }
    
    // 计算各种牌的数量
    const tileCount = new Map<string, number>();
    
    // 初始化所有必要的牌为0
    this.requiredTiles.forEach(tile => {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, 0);
    });
    
    // 统计手牌中各种牌的数量
    handTiles.forEach(tile => {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    });
    
    // 检查是否所有必要的牌都至少有一张
    let hasPair = false; // 是否有对子
    
    for (const requiredTile of this.requiredTiles) {
      const key = `${requiredTile.type}-${requiredTile.value}`;
      const count = tileCount.get(key) || 0;
      
      if (count === 0) {
        return false; // 缺少必要的牌
      } else if (count === 2) {
        if (hasPair) {
          return false; // 不能有两个对子
        }
        hasPair = true;
      } else if (count > 2) {
        return false; // 某种牌超过2张
      }
    }
    
    // 十三幺必须有一个对子
    return hasPair;
  }
}

// 注册十三幺检测器
WinConditionRegistry.register(new ThirteenOrphansDetector()); 