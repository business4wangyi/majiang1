import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 组合龙检测器
 * 组合龙：和牌中包含三种花色的数牌组成的1-9的序列
 */
export class MixedStraightDetector extends BaseWinConditionDetector {
  protected name = '组合龙';
  protected description = '由三种花色数牌组成的1-9的序列';
  protected scoreValue = 48;
  protected huType = HuType.MIXED_STRAIGHT;
  
  /**
   * 检测是否为组合龙
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
    
    // 按花色分组
    const wanTiles = allTiles.filter(tile => tile.type === TileType.WAN);
    const tiaoTiles = allTiles.filter(tile => tile.type === TileType.TIAO);
    const tongTiles = allTiles.filter(tile => tile.type === TileType.TONG);
    
    // 检查是否包含三种花色
    if (wanTiles.length === 0 || tiaoTiles.length === 0 || tongTiles.length === 0) {
      return false;
    }
    
    // 尝试所有可能的组合方式
    return this.checkCombination(wanTiles, tiaoTiles, tongTiles, [1, 4, 7]) || 
           this.checkCombination(wanTiles, tiaoTiles, tongTiles, [1, 5, 9]) ||
           this.checkCombination(wanTiles, tiaoTiles, tongTiles, [2, 5, 8]) ||
           this.checkCombination(wanTiles, tiaoTiles, tongTiles, [2, 6, 9]) ||
           this.checkCombination(wanTiles, tiaoTiles, tongTiles, [3, 6, 9]) ||
           this.checkCombination(wanTiles, tiaoTiles, tongTiles, [3, 7, 10]);
  }
  
  /**
   * 检查特定的组合方式
   * @param wanTiles 万牌
   * @param tiaoTiles 条牌
   * @param tongTiles 筒牌
   * @param pattern 花色分配模式，例如[1,4,7]表示万牌1-3，条牌4-6，筒牌7-9
   */
  private checkCombination(
    wanTiles: Tile[], 
    tiaoTiles: Tile[], 
    tongTiles: Tile[], 
    pattern: number[]
  ): boolean {
    // 获取每种花色的牌值
    const wanValues = new Set(wanTiles.map(tile => tile.value));
    const tiaoValues = new Set(tiaoTiles.map(tile => tile.value));
    const tongValues = new Set(tongTiles.map(tile => tile.value));
    
    // 检查万牌是否包含pattern[0]到pattern[0]+2的数字
    const wanCheck = 
      wanValues.has(pattern[0]) && 
      wanValues.has(pattern[0] + 1) && 
      wanValues.has(pattern[0] + 2);
    
    // 检查条牌是否包含pattern[1]到pattern[1]+2的数字
    const tiaoCheck = 
      tiaoValues.has(pattern[1]) && 
      tiaoValues.has(pattern[1] + 1) && 
      tiaoValues.has(pattern[1] + 2);
    
    // 检查筒牌是否包含pattern[2]到pattern[2]+2的数字
    const tongCheck = 
      tongValues.has(pattern[2]) && 
      tongValues.has(pattern[2] + 1) && 
      tongValues.has(pattern[2] + 2);
    
    return wanCheck && tiaoCheck && tongCheck;
  }
}

// 注册组合龙检测器
WinConditionRegistry.register(new MixedStraightDetector()); 