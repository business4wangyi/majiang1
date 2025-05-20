import { expect } from 'chai';
import { Tile, TileType } from '../../src/tile';
import { ConcealedHandDetector } from '../../src/win-conditions/win-conditions_concealed-hand';

describe('门前清检测器负例测试', () => {
  it('不能把杂乱手牌误判为门前清', () => {
    const handTiles = [
      new Tile(TileType.WAN, 3, 1),
      new Tile(TileType.WAN, 7, 2),
      new Tile(TileType.WAN, 8, 3),
      new Tile(TileType.WAN, 8, 4),
      new Tile(TileType.TIAO, 4, 5),
      new Tile(TileType.TIAO, 4, 6),
      new Tile(TileType.TIAO, 6, 7),
      new Tile(TileType.TONG, 1, 8),
      new Tile(TileType.TONG, 3, 9),
      new Tile(TileType.TONG, 5, 10),
      new Tile(TileType.TONG, 6, 11),
      new Tile(TileType.TONG, 9, 12),
      new Tile(TileType.FENG, 2, 13),
      new Tile(TileType.JIAN, 3, 14),
    ];
    const revealedSets: any[] = [];
    const detector = new ConcealedHandDetector();
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });
}); 