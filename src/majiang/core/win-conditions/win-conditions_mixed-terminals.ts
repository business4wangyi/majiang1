import { Tile, TileType } from '../core/tile';
import { TileSet, HuType } from '../core/rule-types';
import { Player } from '../core/player';
import { BaseWinConditionDetector, WinConditionRegistry } from './win-condition-detector';

/**
 * 混幺九检测器
 * 混幺九：由幺九牌（一、九）和字牌组成的和牌
 */
export class MixedTerminalsDetector extends BaseWinConditionDetector {
  protected name = '混幺九';
  protected description = '由幺九牌和字牌组成的和牌';
  protected scoreValue = 40;
  protected huType = HuType.MIXED_TERMINALS;
  
  /**
   * 判断是否为数字牌
   */
  protected isNumberTile(tile: Tile): boolean {
    return tile.type === TileType.WAN || tile.type === TileType.TIAO || tile.type === TileType.TONG;
  }
  
  /**
   * 判断是否为字牌
   */
  protected isHonorTile(tile: Tile): boolean {
    return tile.type === TileType.FENG || tile.type === TileType.JIAN;
  }
  
  /**
   * 判断是否为幺九牌
   */
  protected isTerminalTile(tile: Tile): boolean {
    return this.isNumberTile(tile) && (tile.value === 1 || tile.value === 9);
  }
  
  /**
   * 判断牌组是否满足混幺九条件
   * 对于碰和杠，牌必须是幺九牌或字牌
   * 对于顺子，必须包含1或9（即1-2-3或7-8-9）
   */
  protected isMixedTerminalsSet(set: TileSet): boolean {
    if (set.type === 'PENG' || set.type === 'GANG') {
      // 对于碰和杠，每张牌都必须是幺九牌或字牌
      return set.tiles.every(tile => this.isTerminalTile(tile) || this.isHonorTile(tile));
    } else if (set.type === 'CHI') {
      // 对于顺子，必须包含1或9（即1-2-3或7-8-9）
      return set.tiles.some(tile => this.isTerminalTile(tile));
    }
    return false;
  }
  
  /**
   * 检测是否为混幺九
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
    // 检查所有已亮明的牌组是否满足混幺九条件
    const allSetsValid = revealedSets.every(set => this.isMixedTerminalsSet(set));
    if (!allSetsValid) {
      return false;
    }
    
    // 检查手牌中的每张牌是否是幺九牌或字牌
    // 由于顺子可能在手牌中未成形，所以手牌中的每张牌都必须是幺九牌或字牌
    const allHandTilesValid = handTiles.every(tile => 
      this.isTerminalTile(tile) || this.isHonorTile(tile)
    );
    if (!allHandTilesValid) {
      return false;
    }
    
    // 获取所有牌
    const allTiles = this.getAllTiles(handTiles, revealedSets);
    
    // 必须同时包含幺九牌和字牌
    const hasTerminals = allTiles.some(tile => this.isTerminalTile(tile));
    const hasHonors = allTiles.some(tile => this.isHonorTile(tile));
    
    return hasTerminals && hasHonors;
  }
}

// 注册混幺九检测器
WinConditionRegistry.register(new MixedTerminalsDetector()); 