import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 五门齐检测器
 * 五门齐：和牌时包含万、条、筒、风、箭五种牌型
 */
export class AllTypesDetector extends BaseWinConditionDetector {
  // 五门齐应作为加番型存在，而非基础胡牌
  public isBaseWin = false;
  protected name = '五门齐';
  protected description = '和牌时包含万、条、筒、风、箭五种牌型';
  protected scoreValue = 2;
  // 修正五门齐对应的胡牌类型
  protected huType = HuType.ALL_TYPES;

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
    // 五门齐作为加番条件：仅校验是否同时包含 万/条/筒/风/箭 五类牌
    // 与具体成牌方式（平胡、七对、十三幺等）无关，不强制14张或“4面子+1将”的组合判断

    // 校验明牌基本合法性（避免明显错误输入）
    for (const set of revealedSets || []) {
      if (!this.isValidSet(set)) return false;
    }

    const allTiles = this.getAllTiles(handTiles || [], revealedSets || []);
    if (allTiles.length === 0) return false;

    const typeSet = new Set<TileType>();
    for (const tile of allTiles) typeSet.add(tile.type);

    const hasAllTypes = [
      TileType.WAN,
      TileType.TIAO,
      TileType.TONG,
      TileType.FENG,
      TileType.JIAN
    ].every(type => typeSet.has(type));

    return hasAllTypes;
  }
}

// 注册五门齐检测器
WinConditionRegistry.register(new AllTypesDetector()); 
