import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { QingYiSeDetector } from '../../src/win-conditions/win-conditions_qing-yi-se';
import { expect } from 'chai';

// 创建测试用牌
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  let id = startId;
  return values.map(value => new Tile(type, value, id++));
}

// 创建刻子
function createPung(type: TileType, value: number, startId = 1): TileSet {
  return {
    type: 'PENG',
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2)
    ]
  };
}

// 创建顺子
function createChow(type: TileType, startValue: number, startId = 1): TileSet {
  return {
    type: 'CHI',
    tiles: [
      new Tile(type, startValue, startId),
      new Tile(type, startValue + 1, startId + 1),
      new Tile(type, startValue + 2, startId + 2)
    ]
  };
}

describe('QingYiSeDetector', () => {
  let detector: QingYiSeDetector;

  beforeEach(() => {
    detector = new QingYiSeDetector();
  });

  it('should detect with all tiles of the same suit in hand', () => {
    // 全万子
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5], 1)
    ];
    expect(detector.detect(handTiles, [])).to.be.true;
  });

  it('should detect with all tiles of the same suit in hand and revealed sets', () => {
    // 手牌：一对9万
    const handTiles = createTiles(TileType.WAN, [9, 9], 1);
    
    // 明牌：四组万子刻子
    const revealedSets: TileSet[] = [
      createPung(TileType.WAN, 1, 3),
      createPung(TileType.WAN, 3, 6),
      createPung(TileType.WAN, 5, 9),
      createPung(TileType.WAN, 7, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.true;
  });

  it('should not detect with mixed suits in hand', () => {
    // 混合万子和条子
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1),
      ...createTiles(TileType.TIAO, [4, 4, 4, 5, 5, 5], 9)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  it('should not detect with honor tiles', () => {
    // 混合万子和字牌
    const handTiles = [
      ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3], 1),
      ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2], 9)
    ];
    expect(detector.detect(handTiles, [])).to.be.false;
  });

  it('should not detect with mixed suits in revealed sets', () => {
    // 手牌：一对9万
    const handTiles = createTiles(TileType.WAN, [9, 9], 1);
    
    // 明牌：混合万子和条子的刻子
    const revealedSets: TileSet[] = [
      createPung(TileType.WAN, 1, 3),
      createPung(TileType.WAN, 3, 6),
      createPung(TileType.TIAO, 5, 9),
      createPung(TileType.TIAO, 7, 12)
    ];
    expect(detector.detect(handTiles, revealedSets)).to.be.false;
  });

  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('清一色');
    expect(detector.getDescription()).to.equal('由同一种花色的序数牌组成的和牌');
    expect(detector.getScore()).to.equal(24);
  });
}); 