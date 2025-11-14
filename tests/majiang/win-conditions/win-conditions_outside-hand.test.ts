import { expect } from 'chai';
import { Tile, TileType } from '../../src/majiang/tile';
import { OutsideHandDetector } from '../../src/majiang/win-conditions/win-conditions_outside-hand';
import { TileSet } from '../../src/majiang/rule-types';

describe('OutsideHandDetector', () => {
  let detector: OutsideHandDetector;

  beforeEach(() => {
    detector = new OutsideHandDetector();
  });

  it('should return correct name, description, and score', () => {
    expect(detector.getName()).to.equal('全带幺');
    expect(detector.getDescription()).to.equal('每副牌都有幺九牌（1、9）或字牌');
    expect(detector.getScore()).to.equal(16);
  });
  
  describe('Valid Hu Cases', () => {
    it('Case 1: A chi with terminal tiles should return true', () => {
      // 1,2,3万
      const chi: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 1),
        new Tile(TileType.WAN, 3, 1),
      ];
      
      const handTiles: Tile[] = [
        // 东风 x2
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2)
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('Case 2: A peng with honor tiles should return true', () => {
      // 南风 x3
      const peng: Tile[] = [
        new Tile(TileType.FENG, 2, 1),
        new Tile(TileType.FENG, 2, 2),
        new Tile(TileType.FENG, 2, 3),
      ];
      
      const handTiles: Tile[] = [
        // 东风 x2
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2)
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'PENG', tiles: peng }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('Case 3: A gang with terminal tiles should return true', () => {
      // 1万 x4
      const gang: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 1, 3),
        new Tile(TileType.WAN, 1, 4),
      ];
      
      const handTiles: Tile[] = [
        // 东风 x2
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2)
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'GANG', tiles: gang }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('Case 4: Mixed chi, peng, and pair, all with terminal or honor tiles should return true', () => {
      // 1,2,3万
      const chi: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 1),
        new Tile(TileType.WAN, 3, 1),
      ];
      
      // 9条 x3
      const peng: Tile[] = [
        new Tile(TileType.TIAO, 9, 1),
        new Tile(TileType.TIAO, 9, 2),
        new Tile(TileType.TIAO, 9, 3),
      ];
      
      // 中 x3
      const peng2: Tile[] = [
        new Tile(TileType.JIAN, 2, 1),
        new Tile(TileType.JIAN, 2, 2),
        new Tile(TileType.JIAN, 2, 3),
      ];
      
      // 东风 x2
      const pair: Tile[] = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi },
        { type: 'PENG', tiles: peng },
        { type: 'PENG', tiles: peng2 }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('Case 5: Multiple chi and pair, all with terminal or honor tiles should return true', () => {
      // 1,2,3万
      const chi1: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 1),
        new Tile(TileType.WAN, 3, 1),
      ];
      
      // 7,8,9条
      const chi2: Tile[] = [
        new Tile(TileType.TIAO, 7, 1),
        new Tile(TileType.TIAO, 8, 1),
        new Tile(TileType.TIAO, 9, 1),
      ];
      
      // 7,8,9筒
      const chi3: Tile[] = [
        new Tile(TileType.TONG, 7, 1),
        new Tile(TileType.TONG, 8, 1),
        new Tile(TileType.TONG, 9, 1),
      ];
      
      // 中 x2
      const pair: Tile[] = [
        new Tile(TileType.JIAN, 2, 1),
        new Tile(TileType.JIAN, 2, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi1 },
        { type: 'CHI', tiles: chi2 },
        { type: 'CHI', tiles: chi3 },
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });

  describe('Invalid Hu Cases', () => {
    it('Case 1: A hand with terminal tiles but not all sets have them should return false', () => {
      // 4,5,6万 - 不含幺九牌或字牌的顺子
      const chi1: Tile[] = [
        new Tile(TileType.WAN, 4, 1),
        new Tile(TileType.WAN, 5, 1),
        new Tile(TileType.WAN, 6, 1),
      ];
      
      // 7,8,9条 - 含幺九牌的顺子
      const chi2: Tile[] = [
        new Tile(TileType.TIAO, 7, 1),
        new Tile(TileType.TIAO, 8, 1),
        new Tile(TileType.TIAO, 9, 1),
      ];
      
      // 东风 x3 - 字牌刻子
      const peng: Tile[] = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2),
        new Tile(TileType.FENG, 1, 3),
      ];
      
      // 5筒 x2 - 不含幺九牌或字牌的对子
      const pair: Tile[] = [
        new Tile(TileType.TONG, 5, 1),
        new Tile(TileType.TONG, 5, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi1 },
        { type: 'CHI', tiles: chi2 },
        { type: 'PENG', tiles: peng }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('Case 2: A chi not containing terminal or honor tiles should return false', () => {
      // 4,5,6万 - 没有幺九牌的顺子
      const chi: Tile[] = [
        new Tile(TileType.WAN, 4, 1),
        new Tile(TileType.WAN, 5, 1),
        new Tile(TileType.WAN, 6, 1),
      ];
      
      // 东风 x2
      const pair: Tile[] = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('Case 3: A pair not containing terminal or honor tiles should return false', () => {
      // 1,2,3万 - 含有幺九牌的顺子
      const chi: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 1),
        new Tile(TileType.WAN, 3, 1),
      ];
      
      // 5条 x2 - 没有幺九牌或字牌的对子
      const pair: Tile[] = [
        new Tile(TileType.TIAO, 5, 1),
        new Tile(TileType.TIAO, 5, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('Case 4: A complex hand with one set not containing terminal or honor tiles should return false', () => {
      // 1,2,3万 - 含有幺九牌的顺子
      const chi1: Tile[] = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 1),
        new Tile(TileType.WAN, 3, 1),
      ];
      
      // 4,5,6条 - 没有幺九牌的顺子
      const chi2: Tile[] = [
        new Tile(TileType.TIAO, 4, 1),
        new Tile(TileType.TIAO, 5, 1),
        new Tile(TileType.TIAO, 6, 1),
      ];
      
      // 发 x3 - 字牌刻子
      const peng: Tile[] = [
        new Tile(TileType.JIAN, 3, 1),
        new Tile(TileType.JIAN, 3, 2),
        new Tile(TileType.JIAN, 3, 3),
      ];
      
      // 南风 x2 - 字牌对子
      const pair: Tile[] = [
        new Tile(TileType.FENG, 2, 1),
        new Tile(TileType.FENG, 2, 2),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi1 },
        { type: 'CHI', tiles: chi2 },
        { type: 'PENG', tiles: peng }
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('Case 5: A hand with no terminal or honor tiles should return false', () => {
      // 4,5,6万
      const chi1: Tile[] = [
        new Tile(TileType.WAN, 4, 1),
        new Tile(TileType.WAN, 5, 1),
        new Tile(TileType.WAN, 6, 1),
      ];
      
      // 4,5,6条
      const chi2: Tile[] = [
        new Tile(TileType.TIAO, 4, 1),
        new Tile(TileType.TIAO, 5, 1),
        new Tile(TileType.TIAO, 6, 1),
      ];
      
      // 4,5,6筒
      const chi3: Tile[] = [
        new Tile(TileType.TONG, 4, 1),
        new Tile(TileType.TONG, 5, 1),
        new Tile(TileType.TONG, 6, 1),
      ];
      
      // 5万 x2
      const pair: Tile[] = [
        new Tile(TileType.WAN, 5, 2),
        new Tile(TileType.WAN, 5, 3),
      ];
      
      const handTiles: Tile[] = [
        ...pair
      ];
      
      const revealedSets: TileSet[] = [
        { type: 'CHI', tiles: chi1 },
        { type: 'CHI', tiles: chi2 },
        { type: 'CHI', tiles: chi3 },
      ];
      
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });
}); 