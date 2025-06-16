import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 一色四步高检测器
 * 一色四步高：和牌中有四组连续数字的顺子，且花色相同
 */
export class PureShiftedChowsDetector extends BaseWinConditionDetector {
  protected name = '一色四步高';
  protected description = '和牌中有四组连续数字的顺子，且花色相同';
  protected scoreValue = 64;
  protected huType = HuType.PURE_SHIFTED_CHOWS;
  
  /**
   * 检测是否为一色四步高
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
    // 首先检查明牌中的顺子
    const revealedChows = revealedSets.filter(set => set.type === 'CHI');
    
    // 找出手牌中可能的顺子
    const handChows = this.findPossibleChowsInHand(handTiles);
    
    // 合并明牌和手牌中的所有顺子
    const allChows = [
      ...revealedChows.map(set => ({
        type: set.tiles[0].type,
        startValue: Math.min(...set.tiles.map(t => t.value))
      })),
      ...handChows
    ];
    
    // 按顺子的花色分组
    const chowsByType = new Map<string, number[]>();
    
    for (const chow of allChows) {
      if (!chowsByType.has(chow.type)) {
        chowsByType.set(chow.type, []);
      }
      
      chowsByType.get(chow.type)!.push(chow.startValue);
    }
    
    // 检查是否有某一种花色的顺子构成连续的四组
    for (const [type, startValues] of chowsByType.entries()) {
      if (startValues.length < 4) {
        continue;
      }
      
      // 排序
      startValues.sort((a, b) => a - b);
      
      // 检查一步高（相邻顺子起始值相差1）
      for (let i = 0; i <= startValues.length - 4; i++) {
        if (
          startValues[i + 1] === startValues[i] + 1 &&
          startValues[i + 2] === startValues[i] + 2 &&
          startValues[i + 3] === startValues[i] + 3
        ) {
          return true;
        }
      }
      
      // 检查二步高（相邻顺子起始值相差2）
      for (let i = 0; i <= startValues.length - 4; i++) {
        if (
          startValues[i + 1] === startValues[i] + 2 &&
          startValues[i + 2] === startValues[i] + 4 &&
          startValues[i + 3] === startValues[i] + 6
        ) {
          return true;
        }
      }
      
      // 检查所有可能的组合
      if (startValues.length >= 4) {
        // 检查是否存在任意4个元素满足一步高或二步高
        for (let i = 0; i < startValues.length - 3; i++) {
          for (let j = i + 1; j < startValues.length - 2; j++) {
            for (let k = j + 1; k < startValues.length - 1; k++) {
              for (let l = k + 1; l < startValues.length; l++) {
                // 检查一步高
                if (
                  startValues[j] === startValues[i] + 1 &&
                  startValues[k] === startValues[i] + 2 &&
                  startValues[l] === startValues[i] + 3
                ) {
                  return true;
                }
                
                // 检查二步高
                if (
                  startValues[j] === startValues[i] + 2 &&
                  startValues[k] === startValues[i] + 4 &&
                  startValues[l] === startValues[i] + 6
                ) {
                  return true;
                }
                
                // 考虑其他可能的排列
                if (
                  startValues[j] === startValues[i] + 1 &&
                  startValues[l] === startValues[k] + 1 &&
                  startValues[k] === startValues[j] + 1
                ) {
                  return true;
                }
                
                if (
                  startValues[j] === startValues[i] + 2 &&
                  startValues[l] === startValues[k] + 2 &&
                  startValues[k] === startValues[j] + 2
                ) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * 查找手牌中可能的顺子
   */
  private findPossibleChowsInHand(handTiles: Tile[]): { type: string, startValue: number }[] {
    // 创建手牌的副本，因为我们会修改它
    const tiles = [...handTiles];
    const chows: { type: string, startValue: number }[] = [];
    
    // 按类型和值分组
    const tileGroups = new Map<string, Tile[]>();
    
    for (const tile of tiles) {
      const key = `${tile.type}`;
      if (!tileGroups.has(key)) {
        tileGroups.set(key, []);
      }
      tileGroups.get(key)!.push(tile);
    }
    
    // 对于每种花色，尝试找出所有可能的顺子
    for (const [type, typeTiles] of tileGroups.entries()) {
      // 按值计数
      const valueCount = new Map<number, number>();
      for (const tile of typeTiles) {
        const count = valueCount.get(tile.value) || 0;
        valueCount.set(tile.value, count + 1);
      }
      
      // 找出所有可能的顺子
      for (let startValue = 1; startValue <= 7; startValue++) {
        const midValue = startValue + 1;
        const endValue = startValue + 2;
        
        let startCount = valueCount.get(startValue) || 0;
        let midCount = valueCount.get(midValue) || 0;
        let endCount = valueCount.get(endValue) || 0;
        
        while (startCount > 0 && midCount > 0 && endCount > 0) {
          chows.push({ type, startValue });
          
          // 减少计数
          startCount--;
          midCount--;
          endCount--;
          
          valueCount.set(startValue, startCount);
          valueCount.set(midValue, midCount);
          valueCount.set(endValue, endCount);
        }
      }
    }
    
    return chows;
  }
}

// 注册一色四步高检测器
WinConditionRegistry.register(new PureShiftedChowsDetector()); 