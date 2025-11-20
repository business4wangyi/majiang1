import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 九莲宝灯检测器
 * 九莲宝灯：由一种花色的1112345678999加任意一张同花色牌组成的特殊和牌
 */
export class NineGatesDetector extends BaseWinConditionDetector {
  protected name = '九莲宝灯';
  protected description = '由一种花色的1112345678999加任意一张同花色牌组成的特殊和牌';
  protected scoreValue = 88; // 九莲宝灯是高分牌型
  protected huType = HuType.NINE_GATES;
  
  /**
   * 检测是否为九莲宝灯
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
    // 九莲宝灯必须是门前清，不能有明牌
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 九莲宝灯必须恰好有14张牌
    if (handTiles.length !== 14) {
      return false;
    }
    
    // 九莲宝灯必须是清一色，所有牌必须是同一种花色的数字牌
    const filteredTiles = handTiles.filter(tile => this.isNumberTile(tile));
    if (filteredTiles.length !== handTiles.length) {
      return false; // 有非数字牌
    }
    
    // 确认所有牌都是同一种花色
    const firstType = filteredTiles[0]?.type;
    if (!firstType || !filteredTiles.every(tile => tile.type === firstType)) {
      return false;
    }
    
    // 统计各个点数的数量
    const counts = Array(10).fill(0); // 索引0不使用，1-9对应牌的点数
    for (const tile of filteredTiles) {
      counts[tile.value]++;
    }
    
    // 九莲宝灯的标准形式: 1112345678999
    return (
      counts[1] >= 3 && // 至少三个1
      counts[9] >= 3 && // 至少三个9
      counts[2] >= 1 && counts[3] >= 1 && 
      counts[4] >= 1 && counts[5] >= 1 && 
      counts[6] >= 1 && counts[7] >= 1 && 
      counts[8] >= 1    // 2-8各至少一个
    );
  }

  // 辅助方法：判断是否为数字牌
  protected isNumberTile(tile: Tile): boolean {
    return (
      (tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG) &&
      tile.value >= 1 && tile.value <= 9
    );
  }
}

// 注册九莲宝灯检测器
WinConditionRegistry.register(new NineGatesDetector()); 