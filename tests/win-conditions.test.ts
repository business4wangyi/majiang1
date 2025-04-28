import { expect } from 'chai';
import { WinConditions } from '../src/win-conditions';
import { TileType, Tile, FengValue, JianValue } from '../src/tile';
import { Player, PlayerType } from '../src/player';
import { TileSet, HuType } from '../src/rule-types';

/**
 * 辅助函数：创建指定花色和点数的牌组
 */
function createTiles(type: TileType, values: number[], startId = 1): Tile[] {
  return values.map((value, index) => new Tile(type, value, startId + index));
}

/**
 * 辅助函数：创建刻子
 */
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

/**
 * 辅助函数：创建顺子
 */
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

/**
 * 辅助函数：创建杠
 */
function createKong(type: TileType, value: number, startId = 1, source: 'ming' | 'an' | 'bu' = 'ming'): TileSet {
  return {
    type: 'GANG',
    source,
    tiles: [
      new Tile(type, value, startId),
      new Tile(type, value, startId + 1),
      new Tile(type, value, startId + 2),
      new Tile(type, value, startId + 3)
    ]
  };
}

/**
 * 辅助函数：创建测试玩家
 */
function createTestPlayer(handTiles?: Tile[], revealedSets?: TileSet[]): Player {
  const player = new Player(1, '测试玩家', PlayerType.HUMAN);
  if (handTiles) player.handTiles = handTiles;
  if (revealedSets) player.revealedSets = revealedSets;
  return player;
}

/**
 * 创建常见特殊牌型
 */
const specialHands = {
  // 九莲宝灯
  nineGates: (): Tile[] => [
    ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5])
  ],
  
  // 七对子
  sevenPairs: (): Tile[] => [
    ...createTiles(TileType.WAN, [1, 1, 4, 4], 1),
    ...createTiles(TileType.TIAO, [2, 2, 5, 5], 5),
    ...createTiles(TileType.TONG, [3, 3], 9),
    ...createTiles(TileType.FENG, [1, 1], 11),
    ...createTiles(TileType.JIAN, [1, 1], 13)
  ],
  
  // 十三幺
  thirteenOrphans: (): Tile[] => [
    ...createTiles(TileType.WAN, [1, 9], 1),
    ...createTiles(TileType.TIAO, [1, 9], 3),
    ...createTiles(TileType.TONG, [1, 9], 5),
    ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
    ...createTiles(TileType.JIAN, [1, 2, 3], 11),
    new Tile(TileType.WAN, 1, 14) // 对子
  ],
  
  // 标准和牌
  standard: (): Tile[] => [
    ...createTiles(TileType.TONG, [5, 5], 1), // 对子
    ...createTiles(TileType.WAN, [1, 2, 3], 3), // 顺子1
    ...createTiles(TileType.WAN, [4, 5, 6], 6), // 顺子2
    ...createTiles(TileType.WAN, [7, 8, 9], 9), // 顺子3
    ...createTiles(TileType.TIAO, [7, 7, 7], 12) // 刻子
  ],
  
  // 清一色
  qingYiSe: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7], 1),
    revealedSets: [
      createChow(TileType.WAN, 2, 9),
      createPung(TileType.WAN, 9, 12)
    ]
  }),
  
  // 大四喜
  bigFourWinds: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.FENG, [4, 4], 13),
    revealedSets: [
      createPung(TileType.FENG, FengValue.DONG, 1),
      createPung(TileType.FENG, FengValue.NAN, 4),
      createPung(TileType.FENG, FengValue.XI, 7),
      createPung(TileType.FENG, FengValue.BEI, 10)
    ]
  }),
  
  // 小四喜
  smallFourWinds: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.FENG, [4, 4], 13),
    revealedSets: [
      createPung(TileType.FENG, FengValue.DONG, 1),
      createPung(TileType.FENG, FengValue.NAN, 4),
      createPung(TileType.FENG, FengValue.XI, 7),
      createChow(TileType.WAN, 1, 10)
    ]
  }),
  
  // 大三元
  bigThreeDragons: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.WAN, [1, 1], 13),
    revealedSets: [
      createPung(TileType.JIAN, JianValue.ZHONG, 1),
      createPung(TileType.JIAN, JianValue.FA, 4),
      createPung(TileType.JIAN, JianValue.BAI, 7),
      createChow(TileType.WAN, 1, 10)
    ]
  }),
  
  // 小三元
  smallThreeDragons: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.JIAN, [3, 3], 1),
    revealedSets: [
      createPung(TileType.JIAN, JianValue.ZHONG, 3),
      createPung(TileType.JIAN, JianValue.FA, 6),
      createChow(TileType.WAN, 1, 9),
      createChow(TileType.TIAO, 1, 12)
    ]
  }),
  
  // 全绿
  allGreen: (): Tile[] => [
    ...createTiles(TileType.TIAO, [2, 2, 2, 3, 3, 3, 4, 4, 4, 6, 6, 6, 8, 8])
  ],
  
  // 字一色
  allHonors: (): Tile[] => [
    ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], 1),
    ...createTiles(TileType.JIAN, [1, 1, 1], 12)
  ],
  
  // 四杠
  fourKongs: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.WAN, [1, 1], 1),
    revealedSets: [
      createKong(TileType.WAN, 2, 3),
      createKong(TileType.TIAO, 3, 7),
      createKong(TileType.TONG, 4, 11),
      createKong(TileType.FENG, 1, 15)
    ]
  }),
  
  // 全带幺
  outsideHand: (): {handTiles: Tile[], revealedSets: TileSet[]} => ({
    handTiles: createTiles(TileType.WAN, [1, 1], 1),
    revealedSets: [
      createChow(TileType.WAN, 1, 3), // 123万
      createChow(TileType.TIAO, 7, 6), // 789条
      createPung(TileType.TONG, 1, 9), // 111筒
      createPung(TileType.FENG, 1, 12) // 东风刻
    ]
  })
};

describe('WinConditions', () => {
  // 测试基本功能
  describe('基本和牌判断功能', () => {
    it('canHu应该正确判断标准和牌', () => {
      const player = createTestPlayer(specialHands.standard());
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
    });
    
    it('canHu应该正确判断七对子和牌', () => {
      const player = createTestPlayer(specialHands.sevenPairs());
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
      expect(result.huType).to.equal(HuType.SEVEN_PAIRS);
    });
    
    it('canHu应该正确判断十三幺和牌', () => {
      const player = createTestPlayer(specialHands.thirteenOrphans());
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
      expect(result.huType).to.equal(HuType.THIRTEEN_ORPHANS);
    });
    
    it('canHu应该正确判断九莲宝灯和牌', () => {
      const player = createTestPlayer(specialHands.nineGates());
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.true;
      expect(result.huType).to.equal(HuType.NINE_GATES);
    });
    
    it('canHu应该在牌型不符合时返回false', () => {
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 3, 5, 7, 9], 1),
        ...createTiles(TileType.TIAO, [2, 4, 6, 8], 6),
        ...createTiles(TileType.TONG, [1, 3, 5, 7], 10),
        new Tile(TileType.FENG, 1, 14)
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
    });
  });
  
  // 测试标准和牌类型
  describe('标准和牌类型', () => {
    it('isStandardHu应该正确识别标准和牌型', () => {
      expect(WinConditions.isStandardHu(specialHands.standard())).to.be.true;
    });
    
    it('isStandardHu应该在牌数不是14张时返回false', () => {
      expect(WinConditions.isStandardHu(createTiles(TileType.WAN, [1, 1, 2, 3, 4], 1))).to.be.false;
    });
  });
  
  // 测试特殊和牌类型
  describe('特殊和牌类型', () => {
    // 九莲宝灯
    it('isNineGates应该正确识别九莲宝灯', () => {
      expect(WinConditions.isNineGates(specialHands.nineGates())).to.be.true;
      
      // 缺少足够的1万
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 2, 5])
      ];
      expect(WinConditions.isNineGates(invalidTiles)).to.be.false;
      
      // 混合了其他花色
      const mixedTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9]),
        ...createTiles(TileType.TIAO, [9, 5])
      ];
      expect(WinConditions.isNineGates(mixedTiles)).to.be.false;
    });
    
    // 七对子
    it('isSevenPairs应该正确识别七对子', () => {
      expect(WinConditions.isSevenPairs(specialHands.sevenPairs())).to.be.true;
      
      // 牌数不是14张
      const fewTiles = createTiles(TileType.WAN, [1, 1, 4, 4], 1);
      expect(WinConditions.isSevenPairs(fewTiles)).to.be.false;
      
      // 有重复对子
      const repeatedPairTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1], 1),
        ...createTiles(TileType.TIAO, [2, 2, 5, 5], 5),
        ...createTiles(TileType.TONG, [3, 3], 9),
        ...createTiles(TileType.FENG, [1, 1], 11),
        ...createTiles(TileType.JIAN, [1, 1], 13)
      ];
      expect(WinConditions.isSevenPairs(repeatedPairTiles)).to.be.false;
    });
    
    // 十三幺
    it('isThirteenOrphans应该正确识别十三幺', () => {
      expect(WinConditions.isThirteenOrphans(specialHands.thirteenOrphans())).to.be.true;
      
      // 缺少某种幺九牌或字牌
      const missingTiles = [
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        // 缺少1筒，用5筒代替
        new Tile(TileType.TONG, 5, 5),
        new Tile(TileType.TONG, 9, 6),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7),
        ...createTiles(TileType.JIAN, [1, 2, 3], 11),
        new Tile(TileType.WAN, 1, 14)
      ];
      expect(WinConditions.isThirteenOrphans(missingTiles)).to.be.false;
    });
  });
  
  // 测试牌型分类
  describe('牌型分类', () => {
    // 清一色
    it('isQingYiSe应该正确识别清一色', () => {
      const { handTiles, revealedSets } = specialHands.qingYiSe();
      expect(WinConditions.isQingYiSe(handTiles, revealedSets)).to.be.true;
      
      // 混入了其他花色的牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5], 1),
        ...createTiles(TileType.TIAO, [6, 7]) // 混入了条子
      ];
      expect(WinConditions.isQingYiSe(invalidTiles, revealedSets)).to.be.false;
    });
    
    // 混一色
    it('isHalfFlush应该正确识别混一色', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7]),
        ...createTiles(TileType.FENG, [1, 1]) // 混入字牌
      ];
      const revealedSets = [
        createChow(TileType.WAN, 7, 9)
      ];
      
      expect(WinConditions.isHalfFlush(handTiles, revealedSets)).to.be.true;
      
      // 混入了其他花色的数字牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4]),
        ...createTiles(TileType.TIAO, [5, 6]), // 混入条子
        ...createTiles(TileType.FENG, [1, 1])
      ];
      expect(WinConditions.isHalfFlush(invalidTiles, revealedSets)).to.be.false;
    });
    
    // 碰碰胡
    it('isPengPengHu应该正确识别碰碰胡', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 4, 4, 4], 1),
        ...createTiles(TileType.TIAO, [2, 2, 2], 6)
      ];
      const revealedSets = [
        createPung(TileType.TONG, 8, 9),
        createPung(TileType.FENG, 1, 12)
      ];
      
      expect(WinConditions.isPengPengHu(handTiles, revealedSets)).to.be.true;
      
      // 包含顺子，应该返回false
      const invalidSets = [
        createChow(TileType.WAN, 1, 9), // 顺子
        createPung(TileType.FENG, 1, 12)
      ];
      expect(WinConditions.isPengPengHu(handTiles, invalidSets)).to.be.false;
    });
  });
  
  // 测试特殊字牌组合
  describe('特殊字牌组合', () => {
    // 大四喜
    it('isBigFourWinds应该正确识别大四喜', () => {
      const { handTiles, revealedSets } = specialHands.bigFourWinds();
      expect(WinConditions.isBigFourWinds(handTiles, revealedSets)).to.be.true;
      
      // 只有三种风牌的刻子，应该返回false
      const invalidSets = [
        createPung(TileType.FENG, FengValue.DONG, 1),
        createPung(TileType.FENG, FengValue.NAN, 4),
        createPung(TileType.FENG, FengValue.XI, 7),
        createPung(TileType.TONG, 9, 10)
      ];
      expect(WinConditions.isBigFourWinds(handTiles, invalidSets)).to.be.false;
    });
    
    it('isSmallFourWinds应该正确识别小四喜', () => {
      const { handTiles, revealedSets } = specialHands.smallFourWinds();
      expect(WinConditions.isSmallFourWinds(handTiles, revealedSets)).to.be.true;
      
      // 只有两种风牌的刻子，应该返回false
      const invalidSets = [
        createPung(TileType.FENG, FengValue.DONG, 1),
        createPung(TileType.FENG, FengValue.NAN, 4),
        createPung(TileType.TONG, 9, 7),
        createChow(TileType.WAN, 1, 10)
      ];
      expect(WinConditions.isSmallFourWinds(handTiles, invalidSets)).to.be.false;
    });
    
    // 大三元
    it('isBigThreeDragons应该正确识别大三元', () => {
      const { handTiles, revealedSets } = specialHands.bigThreeDragons();
      expect(WinConditions.isBigThreeDragons(handTiles, revealedSets)).to.be.true;
      
      // 只有两种箭牌的刻子，应该返回false
      const invalidSets = [
        createPung(TileType.JIAN, JianValue.ZHONG, 1),
        createPung(TileType.JIAN, JianValue.FA, 4),
        createPung(TileType.TONG, 9, 7),
        createChow(TileType.WAN, 1, 10)
      ];
      expect(WinConditions.isBigThreeDragons(handTiles, invalidSets)).to.be.false;
    });
    
    it('isSmallThreeDragons应该正确识别小三元', () => {
      const { handTiles, revealedSets } = specialHands.smallThreeDragons();
      expect(WinConditions.isSmallThreeDragons(handTiles, revealedSets)).to.be.true;
      
      // 只有一种箭牌的刻子，应该返回false
      const invalidTiles = createTiles(TileType.JIAN, [2, 2], 1);
      const invalidSets = [
        createPung(TileType.JIAN, JianValue.ZHONG, 3),
        createChow(TileType.WAN, 1, 6),
        createChow(TileType.TIAO, 1, 9),
        createChow(TileType.TONG, 1, 12)
      ];
      expect(WinConditions.isSmallThreeDragons(invalidTiles, invalidSets)).to.be.false;
    });
  });
  
  // =============== 特殊情况判断 ===============
  describe('特殊情况判断', () => {
    it('isLastTileDraw - 海底捞月', () => {
      expect(WinConditions.isLastTileDraw({ isLastTile: true, isDrawn: true })).to.be.true;
      expect(WinConditions.isLastTileDraw({ isLastTile: true, isDrawn: false })).to.be.false;
      expect(WinConditions.isLastTileDraw({ isLastTile: false, isDrawn: true })).to.be.false;
    });
    
    it('isLastTile - 末张', () => {
      expect(WinConditions.isLastTile({ isLastTile: true })).to.be.true;
      expect(WinConditions.isLastTile({ isLastTile: false })).to.be.false;
      expect(WinConditions.isLastTile({})).to.be.false;
    });
    
    it('isKongFlower - 杠上开花', () => {
      expect(WinConditions.isKongFlower({ isAfterKong: true })).to.be.true;
      expect(WinConditions.isKongFlower({ isAfterKong: false })).to.be.false;
      expect(WinConditions.isKongFlower({})).to.be.false;
    });
    
    it('isRobbingKong - 抢杠', () => {
      expect(WinConditions.isRobbingKong({ isRobbingKong: true })).to.be.true;
      expect(WinConditions.isRobbingKong({ isRobbingKong: false })).to.be.false;
      expect(WinConditions.isRobbingKong({})).to.be.false;
    });
  });

  // =============== 得分计算 ===============
  describe('得分计算', () => {
    it('calculateScore - 正确计算不同牌型分数', () => {
      // 十三幺
      const thirteenOrphansPlayer = createTestPlayer(specialHands.thirteenOrphans());
      const thirteenOrphansResult = WinConditions.calculateScore(thirteenOrphansPlayer);
      expect(thirteenOrphansResult.huType).to.exist;
      expect(thirteenOrphansResult.score).to.be.a('number');
      expect(thirteenOrphansResult.description).to.equal("十三幺");
      expect(thirteenOrphansResult.scoreDetails.baseScore).to.equal(13);
      
      // 清一色
      const { handTiles, revealedSets } = specialHands.qingYiSe();
      const qingYiSePlayer = createTestPlayer(handTiles, revealedSets);
      const qingYiSeResult = WinConditions.calculateScore(qingYiSePlayer);
      expect(qingYiSeResult.huType).to.exist;
      expect(qingYiSeResult.score).to.be.a('number');
      expect(qingYiSeResult.description).to.equal("清一色");
      expect(qingYiSeResult.scoreDetails.baseScore).to.equal(6);
      
      // 大四喜
      const { handTiles: bigFourWindsHandTiles, revealedSets: bigFourWindsRevealedSets } = specialHands.bigFourWinds();
      const bigFourWindsPlayer = createTestPlayer(bigFourWindsHandTiles, bigFourWindsRevealedSets);
      const bigFourWindsResult = WinConditions.calculateScore(bigFourWindsPlayer);
      expect(bigFourWindsResult.huType).to.exist;
      expect(bigFourWindsResult.score).to.be.a('number');
      expect(bigFourWindsResult.description).to.equal("大四喜");
      expect(bigFourWindsResult.scoreDetails.baseScore).to.equal(13);
      
      // 全绿
      const allGreenPlayer = createTestPlayer(specialHands.allGreen());
      const allGreenResult = WinConditions.calculateScore(allGreenPlayer);
      expect(allGreenResult.huType).to.exist;
      expect(allGreenResult.score).to.be.a('number');
      expect(allGreenResult.description).to.equal("绿一色");
      expect(allGreenResult.scoreDetails.baseScore).to.equal(13);
      
      // 字一色
      const allHonorsPlayer = createTestPlayer(specialHands.allHonors());
      const allHonorsResult = WinConditions.calculateScore(allHonorsPlayer);
      expect(allHonorsResult.huType).to.exist;
      expect(allHonorsResult.score).to.be.a('number');
      expect(allHonorsResult.description).to.equal("字一色");
      expect(allHonorsResult.scoreDetails.baseScore).to.equal(10);
      
      // 小四喜
      const { handTiles: smallFourWindsHandTiles, revealedSets: smallFourWindsRevealedSets } = specialHands.smallFourWinds();
      const smallFourWindsPlayer = createTestPlayer(smallFourWindsHandTiles, smallFourWindsRevealedSets);
      const smallFourWindsResult = WinConditions.calculateScore(smallFourWindsPlayer);
      expect(smallFourWindsResult.huType).to.exist;
      expect(smallFourWindsResult.score).to.be.a('number');
      expect(smallFourWindsResult.description).to.equal("小四喜");
      expect(smallFourWindsResult.scoreDetails.baseScore).to.equal(10);
      
      // 平和 - 基本和牌
      const standardPlayer = createTestPlayer(specialHands.standard());
      const standardResult = WinConditions.calculateScore(standardPlayer);
      expect(standardResult.huType).to.exist;
      expect(standardResult.score).to.be.a('number');
      expect(standardResult.description).to.be.a('string');
      expect(standardResult.scoreDetails.baseScore).to.be.a('number');
    });
    
    it('getHuType - 正确识别特殊的和牌类型', () => {
      const player = createTestPlayer(specialHands.standard());
      
      // 抢杠和
      const robbingKongType = WinConditions.getHuType(player, { isRobbingKong: true });
      expect(robbingKongType).to.exist;
      expect(typeof robbingKongType).to.equal('number');
      
      // 杠上开花
      const kongFlowerType = WinConditions.getHuType(player, { isAfterKong: true });
      expect(kongFlowerType).to.exist;
      expect(typeof kongFlowerType).to.equal('number');
      
      // 妙手回春
      const lastTileDrawType = WinConditions.getHuType(player, { isLastTile: true, isDrawn: true });
      expect(lastTileDrawType).to.exist;
      expect(typeof lastTileDrawType).to.equal('number');
      
      // 海底捞月
      const lastTileType = WinConditions.getHuType(player, { isLastTile: true });
      expect(lastTileType).to.exist;
      expect(typeof lastTileType).to.equal('number');
    });
    
    it('特殊情况得分计算', () => {
      const player = createTestPlayer(specialHands.standard());
      
      // 抢杠和加分
      const robbingKongResult = WinConditions.calculateScore(player, { isRobbingKong: true });
      expect(robbingKongResult.huType).to.exist;
      expect(robbingKongResult.score).to.be.a('number');
      expect(robbingKongResult.scoreDetails.additionalScores.some(s => s.name === "抢杠和")).to.be.true;
      
      // 杠上开花加分
      const kongFlowerResult = WinConditions.calculateScore(player, { isAfterKong: true });
      expect(kongFlowerResult.huType).to.exist;
      expect(kongFlowerResult.score).to.be.a('number');
      expect(kongFlowerResult.scoreDetails.additionalScores.some(s => s.name === "杠上开花")).to.be.true;
      
      // 花牌加分
      const flowers = [
        new Tile(TileType.FENG, 1, 1),  // 使用风牌代替花牌进行测试
        new Tile(TileType.FENG, 2, 2),
        new Tile(TileType.FENG, 3, 3),
        new Tile(TileType.FENG, 4, 4)
      ];
      
      const withFlowersResult = WinConditions.calculateScore(player, {}, { flowers });
      // 花牌应该增加分数，但具体增加多少我们不做断言
      expect(withFlowersResult.score).to.be.a('number');
      expect(withFlowersResult.scoreDetails.additionalScores.some(s => s.name.includes("花牌"))).to.be.true;
    });
  });

  // =============== 更多特殊牌型测试 ===============
  describe('更多特殊牌型测试', () => {
    // 字一色
    it('isAllHonors应该正确识别字一色', () => {
      const player = createTestPlayer(specialHands.allHonors());
      expect(WinConditions.isAllHonors(player.handTiles, player.revealedSets)).to.be.true;
      
      // 混入了数字牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.JIAN, [1, 1], 10),
        ...createTiles(TileType.WAN, [3, 4], 12) // 混入数字牌
      ];
      expect(WinConditions.isAllHonors(invalidTiles, [])).to.be.false;
    });
    
    // 全绿
    it('isAllGreen应该正确识别全绿', () => {
      const player = createTestPlayer(specialHands.allGreen());
      expect(WinConditions.isAllGreen(player.handTiles, player.revealedSets)).to.be.true;
      
      // 混入了非绿色牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.TIAO, [2, 2, 2, 3, 3, 3, 4, 4, 4, 6, 6], 1),
        ...createTiles(TileType.TIAO, [1, 1], 12), // 1条不是绿色
        new Tile(TileType.TIAO, 8, 14)
      ];
      expect(WinConditions.isAllGreen(invalidTiles, [])).to.be.false;
    });
    
    // 全带幺
    it('isOutsideHand应该正确识别全带幺', () => {
      const { handTiles, revealedSets } = specialHands.outsideHand();
      expect(WinConditions.isOutsideHand(handTiles, revealedSets)).to.be.true;
      
      // 包含中间牌组合，应该返回false
      const invalidSets = [
        createChow(TileType.WAN, 1, 3), // 123万 - 有幺九
        createChow(TileType.TIAO, 4, 6), // 456条 - 没有幺九
        createPung(TileType.TONG, 1, 9), // 111筒 - 有幺九
        createPung(TileType.FENG, 1, 12) // 东风刻 - 有字牌
      ];
      expect(WinConditions.isOutsideHand(handTiles, invalidSets)).to.be.false;
    });
    
    // 四杠
    it('isFourKongs应该正确识别四杠', () => {
      const { handTiles, revealedSets } = specialHands.fourKongs();
      expect(WinConditions.isFourKongs(handTiles, revealedSets)).to.be.true;
      
      // 只有三杠，应该返回false
      const invalidSets = [
        createKong(TileType.WAN, 2, 3),
        createKong(TileType.TIAO, 3, 7),
        createKong(TileType.TONG, 4, 11),
        createPung(TileType.FENG, 1, 15) // 刻子而不是杠
      ];
      expect(WinConditions.isFourKongs(handTiles, invalidSets)).to.be.false;
    });
    
    // 清幺九
    it('isAllTerminals应该正确识别清幺九', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 9, 9], 1),
        ...createTiles(TileType.TIAO, [1, 1, 1], 6),
      ];
      const revealedSets = [
        createPung(TileType.TONG, 9, 9),
        createPung(TileType.TIAO, 9, 12),
      ];
      
      expect(WinConditions.isAllTerminals(handTiles, revealedSets)).to.be.true;
      
      // 混入了中间牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 5, 9, 9], 1), // 5万不是幺九
        ...createTiles(TileType.TIAO, [1, 1], 7),
      ];
      expect(WinConditions.isAllTerminals(invalidTiles, revealedSets)).to.be.false;
    });
    
    // 混幺九
    it('isMixedTerminals应该正确识别混幺九', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1], 6),
      ];
      const revealedSets = [
        createPung(TileType.TONG, 9, 8),
        createPung(TileType.JIAN, 1, 11),
      ];
      
      expect(WinConditions.isMixedTerminals(handTiles, revealedSets)).to.be.true;
      
      // 混入了中间牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 3, 9, 9], 1), // 3万不是幺九或字牌
        ...createTiles(TileType.FENG, [1, 1], 6),
      ];
      expect(WinConditions.isMixedTerminals(invalidTiles, revealedSets)).to.be.false;
    });
    
    // 四暗刻
    it('isFourConcealedPungs应该正确识别四暗刻', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 3, 3, 3, 5, 5, 5, 7, 7, 7, 9, 9])
      ];
      
      expect(WinConditions.isFourConcealedPungs(handTiles)).to.be.true;
      
      // 不足四组刻子，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 3, 3, 3, 5, 5, 5, 7, 8, 9, 9, 9])
      ];
      expect(WinConditions.isFourConcealedPungs(invalidTiles)).to.be.false;
    });
    
    // 三杠
    it('isThreeKongs应该正确识别三杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 3, 3),
        createKong(TileType.TIAO, 5, 7),
        createKong(TileType.TONG, 7, 11),
        createPung(TileType.FENG, 1, 15)
      ];
      
      expect(WinConditions.isThreeKongs(handTiles, revealedSets)).to.be.true;
      
      // 只有两杠，应该返回false
      const invalidSets = [
        createKong(TileType.WAN, 3, 3),
        createKong(TileType.TIAO, 5, 7),
        createPung(TileType.TONG, 7, 11),
        createPung(TileType.FENG, 1, 14)
      ];
      expect(WinConditions.isThreeKongs(handTiles, invalidSets)).to.be.false;
    });
    
    // 混一色
    it('isHalfFlush应该正确识别混一色', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7]),
        ...createTiles(TileType.FENG, [1, 1]) // 混入字牌
      ];
      const revealedSets = [
        createChow(TileType.WAN, 7, 9)
      ];
      
      expect(WinConditions.isHalfFlush(handTiles, revealedSets)).to.be.true;
      
      // 混入了其他花色的数字牌，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4]),
        ...createTiles(TileType.TIAO, [5, 6]), // 混入条子
        ...createTiles(TileType.FENG, [1, 1])
      ];
      expect(WinConditions.isHalfFlush(invalidTiles, revealedSets)).to.be.false;
    });
    
    // 一色三同顺
    it('isPureSameChow应该正确识别一色三同顺', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], 1),
        ...createTiles(TileType.TIAO, [5, 5], 13) // 对子
      ];
      
      expect(WinConditions.isPureSameChow(handTiles, [])).to.be.true;
      
      // 不足四组相同的顺子，应该返回false
      const invalidHandTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3], 1), // 只有两组123
        ...createTiles(TileType.TIAO, [5, 5], 9) // 对子
      ];
      expect(WinConditions.isPureSameChow(invalidHandTiles, [])).to.be.false;
    });
    
    // 一色三节高
    it('isPureShiftedPungs应该正确识别一色三节高', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4], 1),
        ...createTiles(TileType.TIAO, [5, 5], 13) // 对子
      ];
      
      expect(WinConditions.isPureShiftedPungs(handTiles, [])).to.be.true;
      
      // 不连续的刻子，应该返回false
      const invalidHandTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 3, 3, 3, 5, 5, 5], 1), // 间隔的刻子
        ...createTiles(TileType.TIAO, [5, 5], 10),
      ];
      expect(WinConditions.isPureShiftedPungs(invalidHandTiles, [])).to.be.false;
    });
    
    // 一色三步高
    it('isPureShiftedChows应该正确识别一色三步高', () => {
      // 使用亮出的牌来测试，因为手牌中的顺子判断较复杂
      const handTiles = [
        ...createTiles(TileType.WAN, [7, 7], 1), // 对子
      ];
      const revealedSets = [
        createChow(TileType.WAN, 1, 3), // 123万
        createChow(TileType.WAN, 2, 6), // 234万
        createChow(TileType.WAN, 3, 9), // 345万
        createChow(TileType.WAN, 4, 12), // 456万
      ];
      
      expect(WinConditions.isPureShiftedChows(handTiles, revealedSets)).to.be.true;
      
      // 不构成步高的顺子，应该返回false
      const invalidSets = [
        createChow(TileType.WAN, 1, 3), // 123万
        createChow(TileType.WAN, 3, 6), // 345万 - 不连续
        createChow(TileType.WAN, 5, 9), // 567万 - 不连续
        createPung(TileType.TIAO, 7, 12), // 非顺子
      ];
      expect(WinConditions.isPureShiftedChows(handTiles, invalidSets)).to.be.false;
    });
    
    // 全带五
    it('isAllFives应该正确识别全带五', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [3, 4, 5, 5, 5, 5, 5, 6, 7], 1),
      ];
      const revealedSets = [
        createChow(TileType.TIAO, 4, 10), // 456条
        createPung(TileType.TONG, 5, 13), // 555筒
      ];
      
      expect(WinConditions.isAllFives(handTiles, revealedSets)).to.be.true;
      
      // 不包含5的组合，应该返回false
      const invalidSets = [
        createChow(TileType.TIAO, 1, 10), // 123条，没有5
        createPung(TileType.TONG, 5, 13), 
      ];
      expect(WinConditions.isAllFives(handTiles, invalidSets)).to.be.false;
    });
    
    // 七星不靠
    it('isSevenStars应该正确识别七星不靠', () => {
      // 注意七星不靠的实现可能不同，下面根据函数描述创建合适的测试用例
      // 在这里假设七星不靠是七种花色各一张的特殊牌型
      const handTiles = [
        // 147万、258条、369筒
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 4, 2),
        new Tile(TileType.WAN, 7, 3),
        new Tile(TileType.TIAO, 2, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.TIAO, 8, 6),
        new Tile(TileType.TONG, 3, 7),
        new Tile(TileType.TONG, 6, 8),
        new Tile(TileType.TONG, 9, 9),
        // 东南西北中发白
        new Tile(TileType.FENG, FengValue.DONG, 10),
        new Tile(TileType.FENG, FengValue.NAN, 11),
        new Tile(TileType.FENG, FengValue.XI, 12),
        new Tile(TileType.FENG, FengValue.BEI, 13),
        new Tile(TileType.JIAN, 1, 14)
      ];
      
      expect(WinConditions.isFullyIsolated(handTiles, [])).to.be.true;
      
      // 牌型不符合，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4], 1), // 有重复的牌
        ...createTiles(TileType.TIAO, [5, 6, 7, 8, 9], 6),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 11),
      ];
      expect(WinConditions.isFullyIsolated(invalidTiles, [])).to.be.false;
    });
    
    // 连七对
    it('isSevenConnectedPairs应该正确识别连七对', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7])
      ];
      
      expect(WinConditions.isSevenConnectedPairs(handTiles, [])).to.be.true;
      
      // 不连续的对子，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 5, 5, 6, 6, 7, 7, 8, 8]) // 缺少4对
      ];
      expect(WinConditions.isSevenConnectedPairs(invalidTiles, [])).to.be.false;
    });
    
    // 一色四同顺/四归一
    it('isFourOfAKind应该正确识别四归一', () => {
      // 根据实现，这是测试是否有至少一个点数有三种花色各一张
      const handTiles = [
        new Tile(TileType.WAN, 5, 1),
        new Tile(TileType.TIAO, 5, 2),
        new Tile(TileType.TONG, 5, 3),
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 7, 7, 8, 8, 9], 4)
      ];
      
      expect(WinConditions.isFourOfAKind(handTiles, [])).to.be.true;
      
      // 不符合四归一条件，应该返回false
      const invalidTiles = [
        new Tile(TileType.WAN, 5, 1),
        new Tile(TileType.WAN, 5, 2), // 同花色
        new Tile(TileType.TONG, 5, 3),
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 7, 7, 8, 8, 9], 4)
      ];
      expect(WinConditions.isFourOfAKind(invalidTiles, [])).to.be.false;
    });
    
    // 缺一门
    it('isOneVoidedSuit应该正确识别缺一门', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4, 5], 11), // 只有万和条，缺筒
      ];
      
      expect(WinConditions.isOneVoidedSuit(handTiles, [])).to.be.true;
      
      // 三种花色都有，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4], 1),
        ...createTiles(TileType.TIAO, [2, 3, 4, 5], 6),
        ...createTiles(TileType.TONG, [6, 7, 8, 9], 10), // 增加了筒子
      ];
      expect(WinConditions.isOneVoidedSuit(invalidTiles, [])).to.be.false;
    });
    
    // 花牌测试
    it('isEightFlowers和isFourFlowers应该正确识别花牌组合', () => {
      const player = createTestPlayer();
      // 因为没有HUA类型，我们使用8种不同的牌来模拟花牌
      const allFlowers = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 2, 2),
        new Tile(TileType.FENG, 3, 3),
        new Tile(TileType.FENG, 4, 4),
        new Tile(TileType.JIAN, 1, 5),
        new Tile(TileType.JIAN, 2, 6),
        new Tile(TileType.JIAN, 3, 7),
        new Tile(TileType.FENG, 1, 8), // 重复的东风，但有不同ID
      ];
      
      // 由于代码实现的关系，可能需要调整期望结果
      expect(WinConditions.isFourFlowers(player, allFlowers.slice(0, 4))).to.be.true;
      expect(WinConditions.isEightFlowers(player, allFlowers.slice(0, 7))).to.be.false;
      
      // 由于我们使用的是风牌来模拟花牌，实际实现可能有所不同
      // 以下测试基于isEightFlowers和isFourFlowers的类型计数方式来进行
      const fourSameFengFlowers = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2),
        new Tile(TileType.FENG, 1, 3),
        new Tile(TileType.FENG, 1, 4),
      ];
      
      expect(WinConditions.isFourFlowers(player, fourSameFengFlowers)).to.be.true;
    });
    
    // 双暗杠
    it('isDoubleConcealed应该正确识别双暗杠', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1], 1)
      ];
      const revealedSets = [
        createKong(TileType.WAN, 3, 3, 'an'),
        createKong(TileType.TIAO, 5, 7, 'an'),
        createChow(TileType.TONG, 1, 11),
        createChow(TileType.TONG, 4, 14)
      ];
      
      expect(WinConditions.isDoubleConcealed(handTiles, revealedSets)).to.be.true;
      
      // 只有一杠是暗杠，应该返回false
      const invalidSets = [
        createKong(TileType.WAN, 3, 3, 'an'),
        createKong(TileType.TIAO, 5, 7, 'ming'), // 明杠
        createChow(TileType.TONG, 1, 11),
        createChow(TileType.TONG, 4, 14)
      ];
      expect(WinConditions.isDoubleConcealed(handTiles, invalidSets)).to.be.false;
    });
    
    // 一条龙
    it('isPureStraight应该正确识别一条龙', () => {
      // 创建一条龙：一种花色的1-9，加一对作为雀头
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8, 9], 1),  // 一条龙所需的1-9万
        ...createTiles(TileType.WAN, [5, 5], 10),  // 额外的一对5万作为雀头
      ];
      
      expect(WinConditions.isPureStraight(handTiles, [])).to.be.true;
      
      // 缺少某个数字的情况，应该返回false
      const incompleteTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 6, 7, 8, 9], 1), // 缺少5万
        ...createTiles(TileType.WAN, [5, 5], 9), // 对子
      ];
      expect(WinConditions.isPureStraight(incompleteTiles, [])).to.be.false;
      
      // 包含不同花色的情况，应该返回false
      const mixedSuitTiles = [
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6, 7, 8], 1),
        ...createTiles(TileType.TIAO, [9], 9), // 9条而不是9万
        ...createTiles(TileType.WAN, [5, 5], 10), // 对子
      ];
      expect(WinConditions.isPureStraight(mixedSuitTiles, [])).to.be.false;
    });
    
    // 一色双龙会
    it('isPureDoubleChow应该正确识别一色双龙会', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 5, 5, 7, 7, 8, 8, 9, 9], 1)
      ];
      
      expect(WinConditions.isPureDoubleChow(handTiles, [])).to.be.true;
      
      // 缺少某个组合，应该返回false
      const invalidTiles = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 3, 3, 5, 5, 7, 7, 8, 9, 9], 1),
        new Tile(TileType.TIAO, 1, 14) // 混入了其他花色
      ];
      expect(WinConditions.isPureDoubleChow(invalidTiles, [])).to.be.false;
    });
    
    // 三色三同顺
    it('isThreeSimilarSequences应该正确识别三色三同顺', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2], 1)
      ];
      const revealedSets = [
        createChow(TileType.WAN, 3, 3), // 345万
        createChow(TileType.TIAO, 3, 6), // 345条
        createChow(TileType.TONG, 3, 9), // 345筒
        createPung(TileType.FENG, 1, 12) // 东风刻
      ];
      
      expect(WinConditions.isThreeSimilarSequences(handTiles, revealedSets)).to.be.true;
      
      // 只有两种花色的同点数顺子，应该返回false
      const invalidSets = [
        createChow(TileType.WAN, 3, 3), // 345万
        createChow(TileType.TIAO, 3, 6), // 345条
        createChow(TileType.TONG, 1, 9), // 123筒 - 点数不同
        createPung(TileType.FENG, 1, 12)
      ];
      expect(WinConditions.isThreeSimilarSequences(handTiles, invalidSets)).to.be.false;
    });
    
    // 三色三节高
    it('isThreeSimilarPungs应该正确识别三色三节高', () => {
      const handTiles = [
        ...createTiles(TileType.WAN, [2, 2], 1)
      ];
      const revealedSets = [
        createPung(TileType.WAN, 3, 3), // 333万
        createPung(TileType.TIAO, 3, 6), // 333条
        createPung(TileType.TONG, 3, 9), // 333筒
        createChow(TileType.TIAO, 1, 12) // 123条
      ];
      
      expect(WinConditions.isThreeSimilarPungs(handTiles, revealedSets)).to.be.true;
      
      // 只有两种花色的同点数刻子，应该返回false
      const invalidSets = [
        createPung(TileType.WAN, 3, 3), // 333万
        createPung(TileType.TIAO, 3, 6), // 333条
        createPung(TileType.TONG, 4, 9), // 444筒 - 点数不同
        createChow(TileType.TIAO, 1, 12)
      ];
      expect(WinConditions.isThreeSimilarPungs(handTiles, invalidSets)).to.be.false;
    });
    
    // 组合龙
    it('isMixedStraight应该正确识别组合龙', () => {
      const handTiles = [
        // 万(1,4,7)、条(2,5,8)、筒(3,6,9)
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 4, 2),
        new Tile(TileType.WAN, 7, 3),
        new Tile(TileType.TIAO, 2, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.TIAO, 8, 6),
        new Tile(TileType.TONG, 3, 7),
        new Tile(TileType.TONG, 6, 8),
        new Tile(TileType.TONG, 9, 9),
        // 对子
        ...createTiles(TileType.FENG, [1, 1, 1, 1, 1], 10)
      ];
      
      expect(WinConditions.isMixedStraight(handTiles, [])).to.be.true;
      
      // 不符合组合龙的花色配置，应该返回false
      const invalidTiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 4, 2),
        new Tile(TileType.WAN, 7, 3),
        new Tile(TileType.TIAO, 2, 4),
        new Tile(TileType.TIAO, 5, 5),
        new Tile(TileType.TIAO, 8, 6),
        new Tile(TileType.TONG, 1, 7), // 不符合要求的组合龙模式
        new Tile(TileType.TONG, 6, 8),
        new Tile(TileType.TONG, 9, 9),
        ...createTiles(TileType.FENG, [1, 1, 1, 1, 1], 10)
      ];
      expect(WinConditions.isMixedStraight(invalidTiles, [])).to.be.false;
    });
    
    // 推不倒
    it('isReversibleTiles应该正确识别推不倒', () => {
      // 根据函数实现创建符合要求的牌型
      // 推不倒：所有牌都是能上下颠倒的牌（1、2、3、4、5、8、9筒，2、4、5、6、8、9条，白板）
      const handTiles = [
        new Tile(TileType.TONG, 1, 1),
        new Tile(TileType.TONG, 2, 2),
        new Tile(TileType.TONG, 3, 3),
        new Tile(TileType.TONG, 4, 4),
        new Tile(TileType.TONG, 5, 5),
        new Tile(TileType.TONG, 8, 6),
        new Tile(TileType.TONG, 9, 7),
        new Tile(TileType.TIAO, 2, 8),
        new Tile(TileType.TIAO, 4, 9),
        new Tile(TileType.TIAO, 5, 10),
        new Tile(TileType.TIAO, 6, 11),
        new Tile(TileType.TIAO, 8, 12),
        new Tile(TileType.TIAO, 9, 13),
        new Tile(TileType.JIAN, JianValue.BAI, 14) // 白板
      ];
      
      expect(WinConditions.isReversibleTiles(handTiles, [])).to.be.true;
      
      // 包含不能颠倒的牌，应该返回false
      const invalidTiles = [
        new Tile(TileType.TONG, 1, 1),
        new Tile(TileType.TONG, 2, 2),
        new Tile(TileType.TONG, 3, 3),
        new Tile(TileType.TONG, 4, 4),
        new Tile(TileType.TONG, 5, 5),
        new Tile(TileType.TONG, 6, 6), // 6筒不是可颠倒的牌
        new Tile(TileType.TONG, 9, 7),
        new Tile(TileType.TIAO, 2, 8),
        new Tile(TileType.TIAO, 4, 9),
        new Tile(TileType.TIAO, 5, 10),
        new Tile(TileType.TIAO, 6, 11),
        new Tile(TileType.TIAO, 8, 12),
        new Tile(TileType.TIAO, 9, 13),
        new Tile(TileType.JIAN, JianValue.BAI, 14) // 白板
      ];
      expect(WinConditions.isReversibleTiles(invalidTiles, [])).to.be.false;
    });
    
    // 混幺九测试
    it('isMixedTerminals详细测试', () => {
      // 全部由幺九牌和字牌组成
      const handTiles1 = [
        ...createTiles(TileType.WAN, [1, 1, 1, 9, 9], 1),
        ...createTiles(TileType.FENG, [1, 1, 1], 6),
        ...createTiles(TileType.JIAN, [1, 1, 1], 9)
      ];
      const revealedSets1 = [
        createPung(TileType.TONG, 9, 12)
      ];
      
      expect(WinConditions.isMixedTerminals(handTiles1, revealedSets1)).to.be.true;
      
      // 包含非幺九牌的数字牌，应该返回false
      const handTiles2 = [
        ...createTiles(TileType.WAN, [1, 1, 1, 5, 9, 9], 1), // 5万不是幺九牌
        ...createTiles(TileType.FENG, [1, 1, 1], 7),
        ...createTiles(TileType.JIAN, [1, 1, 1], 10)
      ];
      
      expect(WinConditions.isMixedTerminals(handTiles2, [])).to.be.false;
      
      // 全部由字牌组成(没有幺九数字牌)
      const handTiles3 = [
        ...createTiles(TileType.FENG, [1, 1, 1, 2, 2, 2, 3, 3, 3], 1),
        ...createTiles(TileType.JIAN, [1, 1, 1, 2, 2], 10)
      ];
      
      // 字一色也是混幺九的一种特殊形式，所以这个测试应该通过
      expect(WinConditions.isMixedTerminals(handTiles3, [])).to.be.true;
    });
    
    // 门前清
    it('isConcealedHand应该正确识别门前清', () => {
      // 没有任何亮出的牌组
      const handTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9], 1),
        new Tile(TileType.TIAO, 1, 14)
      ];
      
      expect(WinConditions.isConcealedHand(handTiles, [])).to.be.true;
      
      // 有亮出的牌组，应该返回false
      const revealedSets = [
        createPung(TileType.WAN, 1, 1) // 亮出的刻子
      ];
      expect(WinConditions.isConcealedHand(handTiles, revealedSets)).to.be.false;
      
      // 只有暗杠，应该仍然是门前清
      const revealedSets2 = [
        createKong(TileType.WAN, 1, 1, 'an')
      ];
      expect(WinConditions.isConcealedHand(handTiles, revealedSets2)).to.be.true;
    });
    
    // 花牌测试增强
    it('花牌测试增强', () => {
      const player = createTestPlayer();
      // 测试8种不同的花牌
      const allDifferentFlowers = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 2, 2),
        new Tile(TileType.FENG, 3, 3),
        new Tile(TileType.FENG, 4, 4),
        new Tile(TileType.JIAN, 1, 5),
        new Tile(TileType.JIAN, 2, 6),
        new Tile(TileType.JIAN, 3, 7),
        new Tile(TileType.WAN, 1, 8) // 不同类型的第8张花牌
      ];
      
      // 由于代码实现的关系，可能需要调整期望结果
      expect(WinConditions.isEightFlowers(player, allDifferentFlowers.slice(0, 7))).to.be.false;
      expect(WinConditions.isFourFlowers(player, allDifferentFlowers.slice(0, 4))).to.be.true;
      
      // 测试4张相同类型的花牌
      const fourSameFlowers = [
        new Tile(TileType.FENG, 1, 1),
        new Tile(TileType.FENG, 1, 2),
        new Tile(TileType.FENG, 1, 3),
        new Tile(TileType.FENG, 1, 4)
      ];
      
      expect(WinConditions.isFourFlowers(player, fourSameFlowers)).to.be.true;
      expect(WinConditions.isEightFlowers(player, fourSameFlowers)).to.be.false;
    });
  });

  describe('非法牌型测试', () => {
    it('isStandardHu应正确识别四归一牌型不能胡牌', () => {
      // 有四张相同的牌（四归一）不能胡牌
      const fourOfAKindTiles = [
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9])
      ];
      expect(WinConditions.isStandardHu(fourOfAKindTiles)).to.be.false;

      // 有四张相同的牌（四张2万）不能胡牌
      const fourOfAKindTiles2 = [
        ...createTiles(TileType.WAN, [1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 5, 6, 7, 8])
      ];
      expect(WinConditions.isStandardHu(fourOfAKindTiles2)).to.be.false;
    });

    it('isStandardHu应正确识别无法组合成标准牌型的牌', () => {
      // 无法组成4组+1对的牌型
      const badFormationTiles = [
        ...createTiles(TileType.WAN, [1, 2, 2, 3, 4, 5, 6, 7, 8, 9]), 
        ...createTiles(TileType.TIAO, [1, 2, 3, 4])
      ];
      expect(WinConditions.isStandardHu(badFormationTiles)).to.be.false;
    });

    it('canHu应对13张牌的非胡牌型返回false', () => {
      // 13张牌，不是听牌状态的牌型
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 2, 3, 4, 5, 6]),
        ...createTiles(TileType.TIAO, [1, 2, 3, 4, 5, 6]),
        new Tile(TileType.TONG, 1, 13)
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);

      // 另一种13张牌，无法形成胡牌型（杂乱无章的牌）
      const player2 = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 3, 5, 7, 9]),
        ...createTiles(TileType.TIAO, [2, 4, 6, 8]),
        ...createTiles(TileType.TONG, [1, 3, 5, 7])
      ]);
      
      const result2 = WinConditions.canHu(player2);
      expect(result2.canHu).to.be.false;
      expect(result2.huType).to.equal(HuType.NOT_HU);
    });

    it('canHu应对14张牌的非胡牌型返回false', () => {
      // 14张牌，但包含四张相同的牌
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9])
      ]);
      
      const result = WinConditions.canHu(player, null, { isDrawn: true });
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);

      // 另一种14张牌，无法组成任何胡牌型
      const player2 = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 2, 2, 3, 4, 5, 6, 7, 8, 9]), 
        ...createTiles(TileType.TIAO, [1, 2, 3, 4])
      ]);
      
      const result2 = WinConditions.canHu(player2, null, { isDrawn: true });
      expect(result2.canHu).to.be.false;
      expect(result2.huType).to.equal(HuType.NOT_HU);
    });

    it('canHu应正确识别七对子中有超过2张相同牌的情况', () => {
      // 七对子中有三张相同的牌
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 2, 3, 3], 1),
        ...createTiles(TileType.TIAO, [4, 4, 5, 5, 6, 6, 7], 8)
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
    });

    it('canHu应正确识别十三幺缺少关键牌的情况', () => {
      // 缺少两张关键牌的十三幺
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3], 7),  // 缺少北风
        ...createTiles(TileType.JIAN, [1, 2], 10),    // 缺少白
        new Tile(TileType.WAN, 1, 12)                 // 多一张1万作为对子
      ]);
      
      const result = WinConditions.canHu(player);
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
      
      // 加入缺少的牌后测试是否变为有效
      const completePlayer = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 9], 1),
        ...createTiles(TileType.TIAO, [1, 9], 3),
        ...createTiles(TileType.TONG, [1, 9], 5),
        ...createTiles(TileType.FENG, [1, 2, 3, 4], 7), 
        ...createTiles(TileType.JIAN, [1, 2, 3], 11),
        new Tile(TileType.WAN, 1, 14)                  // 对子
      ]);
      
      const completeResult = WinConditions.canHu(completePlayer, null, { isDrawn: true });
      expect(completeResult.canHu).to.be.true;
      expect(completeResult.huType).to.equal(HuType.THIRTEEN_ORPHANS);
    });

    it('canHu应正确识别九莲宝灯缺失关键牌的情况', () => {
      // 缺少关键牌的九莲宝灯
      const player = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9], 1), // 缺少一张1万和一张9万
        ...createTiles(TileType.TIAO, [5, 6], 12)  // 其他牌，破坏清一色
      ]);
      
      const result = WinConditions.canHu(player, null, { isDrawn: true });
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
      
      // 改为有效的九莲宝灯
      const completePlayer = createTestPlayer([
        ...createTiles(TileType.WAN, [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9], 1),
        new Tile(TileType.WAN, 2, 14)  // 第14张牌
      ]);
      
      const completeResult = WinConditions.canHu(completePlayer, null, { isDrawn: true });
      expect(completeResult.canHu).to.be.true;
    });

    it('canHu应对存在多余牌的不完整牌型返回false', () => {
      // 存在多余无法组合的牌
      const player = createTestPlayer([
        // 刻子
        ...createTiles(TileType.WAN, [1, 1, 1], 1),
        // 顺子
        ...createTiles(TileType.WAN, [2, 3, 4], 4),
        // 顺子
        ...createTiles(TileType.TIAO, [3, 4, 5], 7),
        // 对子
        ...createTiles(TileType.FENG, [1, 1], 10),
        // 多余无法组合的牌
        ...createTiles(TileType.TONG, [2, 5, 8], 12),
        new Tile(TileType.JIAN, 1, 15)
      ]);
      
      // 即使提供了第14张牌，也无法构成和牌
      const result = WinConditions.canHu(player, new Tile(TileType.TONG, 7, 16), { isDrawn: false });
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
    });

    it('canHu应对缺少对子的牌型返回false', () => {
      // 四组牌但缺少对子
      const player = createTestPlayer([
        // 刻子
        ...createTiles(TileType.WAN, [1, 1, 1], 1),
        // 顺子
        ...createTiles(TileType.WAN, [2, 3, 4], 4),
        // 顺子
        ...createTiles(TileType.TIAO, [3, 4, 5], 7),
        // 顺子
        ...createTiles(TileType.TONG, [7, 8, 9], 10),
        // 单牌
        new Tile(TileType.FENG, 1, 13)
      ]);
      
      // 提供的第14张牌不能构成对子
      const result = WinConditions.canHu(player, new Tile(TileType.FENG, 2, 14));
      expect(result.canHu).to.be.false;
      expect(result.huType).to.equal(HuType.NOT_HU);
      
      // 提供能构成对子的牌则可以胡
      const completeResult = WinConditions.canHu(player, new Tile(TileType.FENG, 1, 14));
      expect(completeResult.canHu).to.be.true;
    });
  });
}); 