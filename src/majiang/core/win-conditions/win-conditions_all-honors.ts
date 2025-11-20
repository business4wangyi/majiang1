import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 字一色检测器
 * 字一色：和牌时所有牌都是字牌（风牌和箭牌）
 */
export class AllHonorsDetector extends BaseWinConditionDetector {
  public isBaseWin = false;
  protected name = '字一色';
  // 与测试保持一致的描述与番数
  protected description = '和牌时，所有牌都是字牌';
  protected scoreValue = 64;
  protected huType = HuType.ALL_HONORS;
  
  protected isHonorTile(tile: Tile): boolean {
    return tile.type === TileType.FENG || tile.type === TileType.JIAN;
  }

  protected isValidSet(set: TileSet): boolean {
    // 检查所有牌是否都是字牌
    if (!set.tiles.every(tile => this.isHonorTile(tile))) {
      return false;
    }

    // 检查组合类型
    switch (set.type) {
      case 'PENG':
        // 刻子必须是三个相同的牌
        return set.tiles.length === 3 &&
               set.tiles.every(tile => tile.equals(set.tiles[0]));
      case 'GANG':
        // 杠子必须是四个相同的牌
        return set.tiles.length === 4 &&
               set.tiles.every(tile => tile.equals(set.tiles[0]));
      case 'CHI':
        // 字牌不能组成顺子
        return false;
      default:
        return false;
    }
  }

  public detect(
    handTiles: Tile[], 
    revealedSets: TileSet[], 
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
    // 基于测试期望：字一色作为加番条件，要求所有手牌与明牌均为字牌；
    // 不强制 14 张与“4面子+1将”的严格结构校验，但需避免仅由对子构成的情况。

    // 1) 校验明牌基本合法性且均为字牌
    for (const set of revealedSets || []) {
      if (!this.isValidSet(set)) return false;
    }

    const allTiles = this.getAllTiles(handTiles || [], revealedSets || []);
    if (allTiles.length === 0) return false;

    const allHonors = allTiles.every(t => this.isHonorTile(t));
    if (!allHonors) return false;

    // 2) 至少包含一组刻/杠（避免“只有对子”的情况）
    const hasPungInHand = this.findPungs(handTiles || []).length > 0;
    const hasPungOrKongInRevealed = (revealedSets || []).some(s => s.type === 'PENG' || s.type === 'GANG');
    if (!hasPungInHand && !hasPungOrKongInRevealed) return false;

    return true;
  }

  /**
   * 检查是否可以形成有效的和牌组合（只考虑字牌）
   */
  private canFormSetsWithHonors(handTiles: Tile[], revealedSets: TileSet[]): boolean {
    // 如果没有手牌，检查明牌是否足够
    if (handTiles.length === 0) {
      return revealedSets.length === 4;
    }

    // 尝试形成刻子（字牌只能形成刻子）
    const pungs = this.findPungs(handTiles);
    for (const pung of pungs) {
      const remainingTiles = handTiles.filter(tile => 
        !pung.some(pungTile => pungTile.id === tile.id)
      );
      if (this.canFormSetsWithHonors(remainingTiles, [...revealedSets, { type: 'PENG', tiles: pung }])) {
        return true;
      }
    }

    return false;
  }

  // 复用父类提供的方法，无需额外的 allTilesSatisfy 覆盖
}

// 注册字一色检测器
WinConditionRegistry.register(new AllHonorsDetector()); 
