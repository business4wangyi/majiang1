import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 组合龙检测器
 * 组合龙：三种花色的数牌按照特定组合形成的特殊牌型
 * 例如：万的1、4、7，条的2、5、8，筒的3、6、9
 */
export class KnittedStraightDetector extends BaseWinConditionDetector {
  protected name = '组合龙';
  protected description = '三种花色的数牌按照特定组合形成的特殊牌型';
  protected scoreValue = 24;
  protected huType = HuType.KNITTED_STRAIGHT;
  
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
    // 组合龙通常需要门前清
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 按花色和数值对牌进行分组
    const tilesByTypeAndValue = new Map<string, Tile[]>();
    for (const tile of handTiles) {
      if (tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG) {
        const key = `${tile.type}-${tile.value}`;
        if (!tilesByTypeAndValue.has(key)) {
          tilesByTypeAndValue.set(key, []);
        }
        tilesByTypeAndValue.get(key)?.push(tile);
      }
    }
    
    // 组合龙的三种可能组合
    const possiblePatterns = [
      // 组合1: 万(1,4,7) + 条(2,5,8) + 筒(3,6,9)
      [
        `${TileType.WAN}-1`, `${TileType.WAN}-4`, `${TileType.WAN}-7`,
        `${TileType.TIAO}-2`, `${TileType.TIAO}-5`, `${TileType.TIAO}-8`,
        `${TileType.TONG}-3`, `${TileType.TONG}-6`, `${TileType.TONG}-9`
      ],
      // 组合2: 万(2,5,8) + 条(3,6,9) + 筒(1,4,7)
      [
        `${TileType.WAN}-2`, `${TileType.WAN}-5`, `${TileType.WAN}-8`,
        `${TileType.TIAO}-3`, `${TileType.TIAO}-6`, `${TileType.TIAO}-9`,
        `${TileType.TONG}-1`, `${TileType.TONG}-4`, `${TileType.TONG}-7`
      ],
      // 组合3: 万(3,6,9) + 条(1,4,7) + 筒(2,5,8)
      [
        `${TileType.WAN}-3`, `${TileType.WAN}-6`, `${TileType.WAN}-9`,
        `${TileType.TIAO}-1`, `${TileType.TIAO}-4`, `${TileType.TIAO}-7`,
        `${TileType.TONG}-2`, `${TileType.TONG}-5`, `${TileType.TONG}-8`
      ]
    ];
    
    // 检查是否存在完整的组合龙
    for (const pattern of possiblePatterns) {
      let isComplete = true;
      for (const key of pattern) {
        const tiles = tilesByTypeAndValue.get(key) || [];
        if (tiles.length === 0) {
          isComplete = false;
          break;
        }
      }
      
      if (isComplete) {
        return true;
      }
    }
    
    return false;
  }
}

// 注册检测器
WinConditionRegistry.register(new KnittedStraightDetector()); 