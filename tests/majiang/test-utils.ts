import { Player, PlayerType } from '../../src/majiang/core/player';
import { Tile } from '../../src/majiang/core/tile';
import { TileSet } from '../../src/majiang/core/rule-types';

/**
 * 创建测试用玩家
 * @param handTiles 手牌
 * @param revealedSets 明牌
 * @returns 测试玩家
 */
export function createTestPlayer(handTiles?: Tile[], revealedSets?: TileSet[]): Player {
  const player = new Player(1, 'TestPlayer', PlayerType.HUMAN);
  
  if (handTiles) {
    player.handTiles = [...handTiles];
  }
  
  if (revealedSets) {
    player.revealedSets = [...revealedSets];
  }
  
  return player;
} 