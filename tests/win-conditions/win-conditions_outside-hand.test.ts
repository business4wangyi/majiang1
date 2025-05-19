import { Tile, TileType } from '../../src/tile';
import { TileSet } from '../../src/rule-types';
import { OutsideHandDetector } from '../../src/win-conditions/win-conditions_outside-hand';
import { expect } from 'chai';

describe('OutsideHandDetector', () => {
  let detector: OutsideHandDetector;

  beforeEach(() => {
    detector = new OutsideHandDetector();
  });

  // 辅助函数：创建牌
  const createTile = (type: TileType, value: number, id: number) => new Tile(type, value, id);

  // 辅助函数：创建牌组
  const createTileSet = (type: 'CHI' | 'PENG' | 'GANG', tiles: Tile[]): TileSet => ({
    type,
    tiles,
    source: 'ming'
  });

  // 测试用例1-35：可以胡牌的情况
  describe('Valid Hu Cases', () => {
    // 测试用例1：只有一副吃，包含幺九牌
    it('Case 1: One chi with terminal', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
        createTile(TileType.WAN, 1, 3),
        createTile(TileType.WAN, 1, 4),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 2, 6),
          createTile(TileType.WAN, 3, 7),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例2：一副碰，包含字牌
    it('Case 2: One peng with honor', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
        createTile(TileType.FENG, 1, 3),
        createTile(TileType.FENG, 1, 4),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 5),
          createTile(TileType.FENG, 1, 6),
          createTile(TileType.FENG, 1, 7),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例3：一副杠，包含幺九牌
    it('Case 3: One gang with terminal', () => {
      const handTiles = [
        createTile(TileType.WAN, 9, 1),
        createTile(TileType.WAN, 9, 2),
        createTile(TileType.WAN, 9, 3),
        createTile(TileType.WAN, 9, 4),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 5),
          createTile(TileType.WAN, 9, 6),
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例4：两副吃，都包含幺九牌
    it('Case 4: Two chis with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例5：一副吃一副碰，都包含幺九牌
    it('Case 5: One chi and one peng with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 9, 6),
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 继续添加更多测试用例...
    // 测试用例6-35：其他组合
    it('Case 6: One chi and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 6),
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例7：两副碰，都包含字牌
    it('Case 7: Two pengs with honors', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例8：两副杠，都包含幺九牌
    it('Case 8: Two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 1, 4),
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 1, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例9：一副吃一副碰一副杠，都包含幺九牌
    it('Case 9: One chi, one peng, and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 9, 6),
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
          createTile(TileType.FENG, 1, 12),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例10：三副吃，都包含幺九牌
    it('Case 10: Three chis with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1, 9),
          createTile(TileType.TIAO, 2, 10),
          createTile(TileType.TIAO, 3, 11),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例11：三副碰，都包含字牌
    it('Case 11: Three pengs with honors', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 2, 9),
          createTile(TileType.FENG, 2, 10),
          createTile(TileType.FENG, 2, 11),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例12：三副杠，都包含幺九牌
    it('Case 12: Three gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 1, 4),
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 1, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.TIAO, 1, 11),
          createTile(TileType.TIAO, 1, 12),
          createTile(TileType.TIAO, 1, 13),
          createTile(TileType.TIAO, 1, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例13：四副吃，都包含幺九牌
    it('Case 13: Four chis with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1, 9),
          createTile(TileType.TIAO, 2, 10),
          createTile(TileType.TIAO, 3, 11),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 7, 12),
          createTile(TileType.TIAO, 8, 13),
          createTile(TileType.TIAO, 9, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例14：四副碰，都包含字牌
    it('Case 14: Four pengs with honors', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 2, 9),
          createTile(TileType.FENG, 2, 10),
          createTile(TileType.FENG, 2, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 3, 12),
          createTile(TileType.FENG, 3, 13),
          createTile(TileType.FENG, 3, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例15：四副杠，都包含幺九牌
    it('Case 15: Four gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 1, 4),
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 1, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.TIAO, 1, 11),
          createTile(TileType.TIAO, 1, 12),
          createTile(TileType.TIAO, 1, 13),
          createTile(TileType.TIAO, 1, 14),
        ]),
        createTileSet('GANG', [
          createTile(TileType.TIAO, 9, 15),
          createTile(TileType.TIAO, 9, 16),
          createTile(TileType.TIAO, 9, 17),
          createTile(TileType.TIAO, 9, 18),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例16：两副吃一副碰一副杠，都包含幺九牌
    it('Case 16: Two chis, one peng, and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.JIAN, 1, 12),
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
          createTile(TileType.JIAN, 1, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例17：一副吃两副碰一副杠，都包含幺九牌
    it('Case 17: One chi, two pengs, and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 6),
          createTile(TileType.FENG, 1, 7),
          createTile(TileType.FENG, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 9),
          createTile(TileType.JIAN, 1, 10),
          createTile(TileType.JIAN, 1, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 12),
          createTile(TileType.WAN, 9, 13),
          createTile(TileType.WAN, 9, 14),
          createTile(TileType.WAN, 9, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例18：两副吃两副碰，都包含幺九牌
    it('Case 18: Two chis and two pengs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 12),
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例19：两副吃两副杠，都包含幺九牌
    it('Case 19: Two chis and two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
          createTile(TileType.FENG, 1, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
          createTile(TileType.JIAN, 1, 15),
          createTile(TileType.JIAN, 1, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例20：两副碰两副杠，都包含幺九牌
    it('Case 20: Two pengs and two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 9),
          createTile(TileType.WAN, 1, 10),
          createTile(TileType.WAN, 1, 11),
          createTile(TileType.WAN, 1, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 13),
          createTile(TileType.WAN, 9, 14),
          createTile(TileType.WAN, 9, 15),
          createTile(TileType.WAN, 9, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例21：三副吃一副碰，都包含幺九牌
    it('Case 21: Three chis and one peng with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1, 9),
          createTile(TileType.TIAO, 2, 10),
          createTile(TileType.TIAO, 3, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 12),
          createTile(TileType.FENG, 1, 13),
          createTile(TileType.FENG, 1, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例22：三副吃一副杠，都包含幺九牌
    it('Case 22: Three chis and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 1, 9),
          createTile(TileType.TIAO, 2, 10),
          createTile(TileType.TIAO, 3, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.FENG, 1, 12),
          createTile(TileType.FENG, 1, 13),
          createTile(TileType.FENG, 1, 14),
          createTile(TileType.FENG, 1, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例23：三副碰一副吃，都包含幺九牌
    it('Case 23: Three pengs and one chi with terminals', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 2, 9),
          createTile(TileType.FENG, 2, 10),
          createTile(TileType.FENG, 2, 11),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 12),
          createTile(TileType.WAN, 2, 13),
          createTile(TileType.WAN, 3, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例24：三副碰一副杠，都包含幺九牌
    it('Case 24: Three pengs and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 2, 9),
          createTile(TileType.FENG, 2, 10),
          createTile(TileType.FENG, 2, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 12),
          createTile(TileType.WAN, 1, 13),
          createTile(TileType.WAN, 1, 14),
          createTile(TileType.WAN, 1, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例25：三副杠一副吃，都包含幺九牌
    it('Case 25: Three gangs and one chi with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 1, 4),
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 1, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.TIAO, 1, 11),
          createTile(TileType.TIAO, 1, 12),
          createTile(TileType.TIAO, 1, 13),
          createTile(TileType.TIAO, 1, 14),
        ]),
        createTileSet('CHI', [
          createTile(TileType.TIAO, 7, 15),
          createTile(TileType.TIAO, 8, 16),
          createTile(TileType.TIAO, 9, 17),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例26：三副杠一副碰，都包含幺九牌
    it('Case 26: Three gangs and one peng with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 1, 4),
          createTile(TileType.WAN, 1, 5),
          createTile(TileType.WAN, 1, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 7),
          createTile(TileType.WAN, 9, 8),
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.TIAO, 1, 11),
          createTile(TileType.TIAO, 1, 12),
          createTile(TileType.TIAO, 1, 13),
          createTile(TileType.TIAO, 1, 14),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 15),
          createTile(TileType.FENG, 1, 16),
          createTile(TileType.FENG, 1, 17),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例27：两副吃两副碰，都包含幺九牌
    it('Case 27: Two chis and two pengs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 12),
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例28：两副吃两副杠，都包含幺九牌
    it('Case 28: Two chis and two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
          createTile(TileType.FENG, 1, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
          createTile(TileType.JIAN, 1, 15),
          createTile(TileType.JIAN, 1, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例29：两副碰两副杠，都包含幺九牌
    it('Case 29: Two pengs and two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.FENG, 1, 1),
        createTile(TileType.FENG, 1, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 3),
          createTile(TileType.FENG, 1, 4),
          createTile(TileType.FENG, 1, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 6),
          createTile(TileType.JIAN, 1, 7),
          createTile(TileType.JIAN, 1, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 1, 9),
          createTile(TileType.WAN, 1, 10),
          createTile(TileType.WAN, 1, 11),
          createTile(TileType.WAN, 1, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 13),
          createTile(TileType.WAN, 9, 14),
          createTile(TileType.WAN, 9, 15),
          createTile(TileType.WAN, 9, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例30：一副吃一副碰两副杠，都包含幺九牌
    it('Case 30: One chi, one peng and two gangs with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 6),
          createTile(TileType.FENG, 1, 7),
          createTile(TileType.FENG, 1, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 9),
          createTile(TileType.WAN, 9, 10),
          createTile(TileType.WAN, 9, 11),
          createTile(TileType.WAN, 9, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
          createTile(TileType.JIAN, 1, 15),
          createTile(TileType.JIAN, 1, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例31：两副吃一副碰一副杠，都包含幺九牌
    it('Case 31: Two chis, one peng and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 7, 6),
          createTile(TileType.WAN, 8, 7),
          createTile(TileType.WAN, 9, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 9),
          createTile(TileType.FENG, 1, 10),
          createTile(TileType.FENG, 1, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.JIAN, 1, 12),
          createTile(TileType.JIAN, 1, 13),
          createTile(TileType.JIAN, 1, 14),
          createTile(TileType.JIAN, 1, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例32：一副吃两副碰一副杠，都包含幺九牌
    it('Case 32: One chi, two pengs and one gang with terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 1, 1),
        createTile(TileType.WAN, 1, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 1, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 3, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.FENG, 1, 6),
          createTile(TileType.FENG, 1, 7),
          createTile(TileType.FENG, 1, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.JIAN, 1, 9),
          createTile(TileType.JIAN, 1, 10),
          createTile(TileType.JIAN, 1, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 9, 12),
          createTile(TileType.WAN, 9, 13),
          createTile(TileType.WAN, 9, 14),
          createTile(TileType.WAN, 9, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    // 测试用例33：一副吃一副碰两副杠，都不包含幺九牌
    it('Case 33: One chi, one peng and two gangs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
          createTile(TileType.WAN, 5, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例34：两副吃一副碰一副杠，都不包含幺九牌
    it('Case 34: Two chis, one peng and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例35：一副吃两副碰一副杠，都不包含幺九牌
    it('Case 35: One chi, two pengs and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 继续添加更多测试用例...
  });

  // 测试用例36-70：不能胡牌的情况
  describe('Invalid Hu Cases', () => {
    // 测试用例36：一副吃，不包含幺九牌
    it('Case 36: One chi without terminal', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
        createTile(TileType.WAN, 2, 3),
        createTile(TileType.WAN, 2, 4),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例37：一副碰，不包含字牌
    it('Case 37: One peng without honor', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
        createTile(TileType.WAN, 2, 3),
        createTile(TileType.WAN, 2, 4),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
          createTile(TileType.WAN, 2, 7),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例38：一副杠，不包含幺九牌
    it('Case 38: One gang without terminal', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
        createTile(TileType.WAN, 2, 3),
        createTile(TileType.WAN, 2, 4),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
          createTile(TileType.WAN, 2, 7),
          createTile(TileType.WAN, 2, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例39：两副吃，都不包含幺九牌
    it('Case 39: Two chis without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例40：一副吃一副碰，都不包含幺九牌
    it('Case 40: One chi and one peng without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例41：三副吃，都不包含幺九牌
    it('Case 41: Three chis without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 5, 10),
          createTile(TileType.WAN, 6, 11),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例42：三副碰，都不包含字牌
    it('Case 42: Three pengs without honors', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例43：三副杠，都不包含幺九牌
    it('Case 43: Three gangs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
          createTile(TileType.WAN, 3, 9),
          createTile(TileType.WAN, 3, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
          createTile(TileType.WAN, 4, 13),
          createTile(TileType.WAN, 4, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例44：四副吃，都不包含幺九牌
    it('Case 44: Four chis without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 5, 10),
          createTile(TileType.WAN, 6, 11),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 6, 13),
          createTile(TileType.WAN, 7, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例45：四副碰，都不包含字牌
    it('Case 45: Four pengs without honors', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例46：四副杠，都不包含幺九牌
    it('Case 46: Four gangs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
          createTile(TileType.WAN, 3, 9),
          createTile(TileType.WAN, 3, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
          createTile(TileType.WAN, 4, 13),
          createTile(TileType.WAN, 4, 14),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 15),
          createTile(TileType.WAN, 5, 16),
          createTile(TileType.WAN, 5, 17),
          createTile(TileType.WAN, 5, 18),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例47：两副吃一副碰一副杠，都不包含幺九牌
    it('Case 47: Two chis, one peng, and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例48：一副吃两副碰一副杠，都不包含幺九牌
    it('Case 48: One chi, two pengs, and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例49：两副吃两副碰，都不包含幺九牌
    it('Case 49: Two chis and two pengs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 5, 12),
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例50：两副吃两副杠，都不包含幺九牌
    it('Case 50: Two chis and two gangs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
          createTile(TileType.WAN, 5, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例51：两副碰两副杠，都不包含幺九牌
    it('Case 51: Two pengs and two gangs without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 5, 13),
          createTile(TileType.WAN, 5, 14),
          createTile(TileType.WAN, 5, 15),
          createTile(TileType.WAN, 5, 16),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例52：三副吃一副碰，都不包含幺九牌
    it('Case 52: Three chis and one peng without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 5, 10),
          createTile(TileType.WAN, 6, 11),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 12),
          createTile(TileType.WAN, 3, 13),
          createTile(TileType.WAN, 3, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例53：三副吃一副杠，都不包含幺九牌
    it('Case 53: Three chis and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('CHI', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 3, 4),
          createTile(TileType.WAN, 4, 5),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 4, 7),
          createTile(TileType.WAN, 5, 8),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 5, 10),
          createTile(TileType.WAN, 6, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 12),
          createTile(TileType.WAN, 3, 13),
          createTile(TileType.WAN, 3, 14),
          createTile(TileType.WAN, 3, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例54：三副碰一副吃，都不包含幺九牌
    it('Case 54: Three pengs and one chi without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 12),
          createTile(TileType.WAN, 4, 13),
          createTile(TileType.WAN, 5, 14),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例55：三副碰一副杠，都不包含幺九牌
    it('Case 55: Three pengs and one gang without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('PENG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 6),
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 4, 9),
          createTile(TileType.WAN, 4, 10),
          createTile(TileType.WAN, 4, 11),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 12),
          createTile(TileType.WAN, 3, 13),
          createTile(TileType.WAN, 3, 14),
          createTile(TileType.WAN, 3, 15),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例56：三副杠一副吃，都不包含幺九牌
    it('Case 56: Three gangs and one chi without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
          createTile(TileType.WAN, 3, 9),
          createTile(TileType.WAN, 3, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
          createTile(TileType.WAN, 4, 13),
          createTile(TileType.WAN, 4, 14),
        ]),
        createTileSet('CHI', [
          createTile(TileType.WAN, 3, 15),
          createTile(TileType.WAN, 4, 16),
          createTile(TileType.WAN, 5, 17),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 测试用例57：三副杠一副碰，都不包含幺九牌
    it('Case 57: Three gangs and one peng without terminals', () => {
      const handTiles = [
        createTile(TileType.WAN, 2, 1),
        createTile(TileType.WAN, 2, 2),
      ];
      const revealedSets = [
        createTileSet('GANG', [
          createTile(TileType.WAN, 2, 3),
          createTile(TileType.WAN, 2, 4),
          createTile(TileType.WAN, 2, 5),
          createTile(TileType.WAN, 2, 6),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 3, 7),
          createTile(TileType.WAN, 3, 8),
          createTile(TileType.WAN, 3, 9),
          createTile(TileType.WAN, 3, 10),
        ]),
        createTileSet('GANG', [
          createTile(TileType.WAN, 4, 11),
          createTile(TileType.WAN, 4, 12),
          createTile(TileType.WAN, 4, 13),
          createTile(TileType.WAN, 4, 14),
        ]),
        createTileSet('PENG', [
          createTile(TileType.WAN, 3, 15),
          createTile(TileType.WAN, 3, 16),
          createTile(TileType.WAN, 3, 17),
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 继续添加更多测试用例...
  });
}); 