import { expect } from 'chai';
import { Tile, TileType } from '../../src/tile';
import { TileSet, TileSetType } from '../../src/rule-types';
import { AllTypesDetector } from '../../src/win-conditions/win-conditions_all-types';

describe('五门齐规则测试', () => {
  let detector: AllTypesDetector;
  let tileId = 0;

  beforeEach(() => {
    detector = new AllTypesDetector();
    tileId = 0;
  });

  // 辅助函数：创建牌
  const createTile = (type: TileType, value: number): Tile => {
    return new Tile(type, value, tileId++);
  };

  // 辅助函数：创建牌组
  const createSet = (type: TileSetType, tiles: Tile[]): TileSet => ({
    type,
    tiles
  });

  // 辅助函数：创建五门齐的基本牌
  const createBasicTiles = () => [
    createTile(TileType.WAN, 1),
    createTile(TileType.TIAO, 2),
    createTile(TileType.TONG, 3),
    createTile(TileType.FENG, 1),
    createTile(TileType.JIAN, 1),
    createTile(TileType.WAN, 1),
    createTile(TileType.WAN, 1)
  ];

  describe('吃碰杠组合测试', () => {
    // 0副吃，0副碰，0副杠
    it('应该能胡牌：0副吃，0副碰，0副杠 - 标准和牌', () => {
      const handTiles = createBasicTiles();
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 1)
      ];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，0副碰，0副杠
    it('应该能胡牌：1副吃，0副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，1副碰，0副杠
    it('应该能胡牌：0副吃，1副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，0副碰，1副杠
    it('应该能胡牌：0副吃，0副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，1副碰，0副杠
    it('应该能胡牌：1副吃，1副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，1副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，0副碰，1副杠
    it('应该能胡牌：1副吃，0副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，1副碰，1副杠
    it('应该能胡牌：0副吃，1副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，1副碰，1副杠
    it('应该能胡牌：1副吃，1副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，1副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2副吃，0副碰，0副杠
    it('应该能胡牌：2副吃，0副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：2副吃，0副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，2副碰，0副杠
    it('应该能胡牌：0副吃，2副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，2副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，0副碰，2副杠
    it('应该能胡牌：0副吃，0副碰，2副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，2副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2副吃，1副碰，0副杠
    it('应该能胡牌：2副吃，1副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：2副吃，1副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2副吃，0副碰，1副杠
    it('应该能胡牌：2副吃，0副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：2副吃，0副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，2副碰，0副杠
    it('应该能胡牌：1副吃，2副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，2副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，0副碰，2副杠
    it('应该能胡牌：1副吃，0副碰，2副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，0副碰，2副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，2副碰，1副杠
    it('应该能胡牌：0副吃，2副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，2副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，1副碰，2副杠
    it('应该能胡牌：0副吃，1副碰，2副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，2副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 3副吃，0副碰，0副杠
    it('应该能胡牌：3副吃，0副碰，0副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：3副吃，0副碰，0副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 2副吃，1副碰，1副杠
    it('应该能胡牌：2副吃，1副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：2副吃，1副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，2副碰，1副杠
    it('应该能胡牌：1副吃，2副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，2副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 1副吃，1副碰，2副杠
    it('应该能胡牌：1副吃，1副碰，2副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：1副吃，1副碰，2副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，3副碰，1副杠
    it('应该能胡牌：0副吃，3副碰，1副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，3副碰，1副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，2副碰，2副杠
    it('应该能胡牌：0副吃，2副碰，2副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，2副碰，2副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，1副碰，3副杠
    it('应该能胡牌：0副吃，1副碰，3副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，1副碰，3副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    // 0副吃，0副碰，4副杠
    it('应该能胡牌：0副吃，0副碰，4副杠', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该不能胡牌：0副吃，0副碰，4副杠 - 不完整牌型', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1)
      ];
      const revealedSets = [
        createSet('GANG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('GANG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });
  });

  describe('特殊牌型测试', () => {
    it('应该能识别七对子五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1),
        createTile(TileType.JIAN, 1),
        createTile(TileType.WAN, 5),
        createTile(TileType.WAN, 5),
        createTile(TileType.TIAO, 6),
        createTile(TileType.TIAO, 6)
      ];
      const revealedSets: TileSet[] = [];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别清一色五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.WAN, 4),
        createTile(TileType.WAN, 5),
        createTile(TileType.WAN, 6),
        createTile(TileType.WAN, 7)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TIAO, 1),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别混一色五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.WAN, 4),
        createTile(TileType.WAN, 5)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.TIAO, 1),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别字一色五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 3),
          createTile(TileType.FENG, 3),
          createTile(TileType.FENG, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别全带幺五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 1),
        createTile(TileType.TONG, 1),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 1),
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 1),
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3)
        ]),
        createSet('CHI', [
          createTile(TileType.TONG, 1),
          createTile(TileType.TONG, 2),
          createTile(TileType.TONG, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别全带五五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 5),
        createTile(TileType.TIAO, 5),
        createTile(TileType.TONG, 5),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 3),
          createTile(TileType.WAN, 4),
          createTile(TileType.WAN, 5)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('CHI', [
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4),
          createTile(TileType.TONG, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });

  describe('边界场景测试', () => {
    it('应该能识别只有一张牌的五门齐胡牌', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];

      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5),
          createTile(TileType.TIAO, 5)
        ]),
        createSet('PENG', [
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5),
          createTile(TileType.TONG, 5)
        ])
      ];

      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('不应该识别重复牌型的五门齐胡牌', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.WAN, 2),
        createTile(TileType.WAN, 3),
        createTile(TileType.WAN, 4),
        createTile(TileType.WAN, 5)
      ];

      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 5)
        ])
      ];

      expect(detector.detect(handTiles, revealedSets)).to.be.false;
    });

    it('应该能识别全风牌五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 3),
          createTile(TileType.FENG, 3),
          createTile(TileType.FENG, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 4),
          createTile(TileType.FENG, 4),
          createTile(TileType.FENG, 4)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别全箭牌五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 2),
          createTile(TileType.JIAN, 2),
          createTile(TileType.JIAN, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 3),
          createTile(TileType.JIAN, 3),
          createTile(TileType.JIAN, 3)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别全数字牌五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('CHI', [
          createTile(TileType.WAN, 1),
          createTile(TileType.WAN, 2),
          createTile(TileType.WAN, 3)
        ]),
        createSet('CHI', [
          createTile(TileType.TIAO, 2),
          createTile(TileType.TIAO, 3),
          createTile(TileType.TIAO, 4)
        ]),
        createSet('CHI', [
          createTile(TileType.TONG, 3),
          createTile(TileType.TONG, 4),
          createTile(TileType.TONG, 5)
        ]),
        createSet('CHI', [
          createTile(TileType.WAN, 4),
          createTile(TileType.WAN, 5),
          createTile(TileType.WAN, 6)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });

    it('应该能识别全字牌五门齐', () => {
      const handTiles = [
        createTile(TileType.WAN, 1),
        createTile(TileType.TIAO, 2),
        createTile(TileType.TONG, 3),
        createTile(TileType.FENG, 1),
        createTile(TileType.JIAN, 1)
      ];
      const revealedSets = [
        createSet('PENG', [
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1),
          createTile(TileType.FENG, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2),
          createTile(TileType.FENG, 2)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1),
          createTile(TileType.JIAN, 1)
        ]),
        createSet('PENG', [
          createTile(TileType.JIAN, 2),
          createTile(TileType.JIAN, 2),
          createTile(TileType.JIAN, 2)
        ])
      ];
      expect(detector.detect(handTiles, revealedSets)).to.be.true;
    });
  });
}); 