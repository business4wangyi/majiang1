import { Tile, TileType } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 全不靠检测器
 * 全不靠：由不相邻的单张数牌和字牌组成的特殊和牌
 */
export class FullyIsolatedDetector extends BaseWinConditionDetector {
  protected name = '全不靠';
  protected description = '由不相邻的单张牌组成的特殊和牌';
  protected scoreValue = 56;
  protected huType = HuType.FULLY_ISOLATED;
  
  /**
   * 检测是否为全不靠
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
    // 调试信息
    console.log("======= 全不靠检测开始 =======");
    console.log(`手牌数量: ${handTiles.length}, 明牌数量: ${revealedSets.length}`);
    
    // 打印手牌信息
    const handInfo = handTiles.map(t => `${t.type}:${t.value}`).join(', ');
    console.log(`手牌: ${handInfo}`);
    
    // 1. 全不靠必须是13张牌，没有明牌
    if (handTiles.length !== 13 || revealedSets.length > 0) {
      console.log("不满足条件1: 张数不是13张或有明牌");
      return false;
    }
    
    // 2. 检查是否有重复的牌
    const tileMap = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      if (!tileMap.has(key)) {
        tileMap.set(key, 0);
      }
      tileMap.set(key, tileMap.get(key)! + 1);
      
      if (tileMap.get(key)! > 1) {
        console.log(`不满足条件2: 有重复牌 ${tile.type}:${tile.value}`);
        return false; // 有重复牌
      }
    }
    
    // 3. 按花色分组
    const wanTiles = handTiles.filter(tile => tile.type === TileType.WAN);
    const tiaoTiles = handTiles.filter(tile => tile.type === TileType.TIAO);
    const tongTiles = handTiles.filter(tile => tile.type === TileType.TONG);
    const honorTiles = handTiles.filter(tile => 
      tile.type === TileType.FENG || tile.type === TileType.JIAN
    );
    
    console.log(`万子: ${wanTiles.length}张, 条子: ${tiaoTiles.length}张, 筒子: ${tongTiles.length}张, 字牌: ${honorTiles.length}张`);
    
    // 4. 检查每种花色是否最多有3张牌
    if (wanTiles.length > 3 || tiaoTiles.length > 3 || tongTiles.length > 3) {
      console.log("不满足条件4: 某种花色超过3张");
      return false;
    }
    
    // 5. 检查是否有字牌
    if (honorTiles.length === 0) {
      console.log("不满足条件5: 没有字牌");
      return false;
    }
    
    // 6. 检查数牌是否互不相邻
    const wanIsolated = this.areIsolated(wanTiles);
    const tiaoIsolated = this.areIsolated(tiaoTiles);
    const tongIsolated = this.areIsolated(tongTiles);
    
    console.log(`万子互不相邻: ${wanIsolated}, 条子互不相邻: ${tiaoIsolated}, 筒子互不相邻: ${tongIsolated}`);
    
    if (!wanIsolated || !tiaoIsolated || !tongIsolated) {
      console.log("不满足条件6: 数牌不是互不相邻");
      return false;
    }
    
    // 满足所有条件，是全不靠
    console.log("======= 全不靠检测通过 =======");
    return true;
  }
  
  /**
   * 检查一组牌是否互不相邻
   * @param tiles 一组同花色的牌
   */
  private areIsolated(tiles: Tile[]): boolean {
    if (tiles.length <= 1) {
      return true;
    }
    
    // 对牌值排序
    const values = tiles.map(tile => tile.value).sort((a, b) => a - b);
    
    console.log(`检查间隔: [${values.join(', ')}]`);
    
    // 检查相邻牌值的间隔是否大于2
    for (let i = 1; i < values.length; i++) {
      if (values[i] - values[i - 1] <= 2) {
        console.log(`间隔不足: ${values[i]} - ${values[i - 1]} = ${values[i] - values[i - 1]}`);
        return false; // 相邻或相隔1张牌
      }
    }
    
    return true;
  }
}

// 注册全不靠检测器
WinConditionRegistry.register(new FullyIsolatedDetector()); 