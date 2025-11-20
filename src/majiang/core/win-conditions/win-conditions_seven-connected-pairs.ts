import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 连七对检测器
 * 连七对：由同一种花色的七个连续数字的对子组成的和牌
 */
export class SevenConnectedPairsDetector extends BaseWinConditionDetector {
  protected name = '连七对';
  protected description = '由同一种花色的七个连续数字的对子组成的和牌';
  protected scoreValue = 88;
  protected huType = HuType.SEVEN_CONNECTED_PAIRS;
  
  /**
   * 检测是否为连七对
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
    // 连七对必须是14张牌（7个对子）
    if (handTiles.length + revealedSets.reduce((sum, set) => sum + set.tiles.length, 0) !== 14) {
      return false;
    }
    
    // 连七对必须是清一色且不能有明牌
    if (revealedSets.length > 0) {
      return false;
    }
    
    // 统计牌的数量
    const tileCount = this.countTiles(handTiles);
    
    // 所有牌必须是对子
    for (const count of tileCount.values()) {
      if (count !== 2) {
        return false;
      }
    }
    
    // 获取所有牌的类型和值
    const typesAndValues = handTiles.map(tile => ({
      type: tile.type,
      value: tile.value
    }));
    
    // 检查是否只有一种花色
    const uniqueTypes = new Set(typesAndValues.map(tv => tv.type));
    if (uniqueTypes.size !== 1) {
      return false;
    }
    
    // 检查是否都是数字牌
    const type = typesAndValues[0].type;
    if (!['bamboo', 'dot', 'character', '条', '筒', '万'].includes(type)) {
      return false;
    }
    
    // 获取所有的值并去重
    const uniqueValues = Array.from(new Set(typesAndValues.map(tv => tv.value)));
    if (uniqueValues.length !== 7) {
      return false;
    }
    
    // 排序
    uniqueValues.sort((a, b) => a - b);
    
    // 检查是否连续
    for (let i = 1; i < uniqueValues.length; i++) {
      if (uniqueValues[i] !== uniqueValues[i - 1] + 1) {
        return false;
      }
    }
    
    // 满足所有条件，是连七对
    return true;
  }
}

// 注册连七对检测器
WinConditionRegistry.register(new SevenConnectedPairsDetector()); 