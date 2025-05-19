import { expect } from 'chai';
import { ScoreCalculator } from '../src/score-calculator';
import { Player, PlayerType } from '../src/player';
import { Tile, TileType } from '../src/tile';
import { HuType, GangType, TileSet } from '../src/rule-types';

describe('ScoreCalculator', () => {
  describe('calculateBaseScore', () => {
    it('应该根据和牌类型正确计算基本分数 - 基本牌型', () => {
      // 测试基本牌型
      expect(ScoreCalculator.calculateBaseScore(HuType.PING_HU, false, false)).to.equal(1);
      expect(ScoreCalculator.calculateBaseScore(HuType.PENG_PENG_HU, false, false)).to.equal(2);
      expect(ScoreCalculator.calculateBaseScore(HuType.QING_YI_SE, false, false)).to.equal(6);
      expect(ScoreCalculator.calculateBaseScore(HuType.SEVEN_PAIRS, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.THIRTEEN_ORPHANS, false, false)).to.equal(13);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 特殊牌型', () => {
      // 测试高分特殊牌型
      expect(ScoreCalculator.calculateBaseScore(HuType.BIG_FOUR_WINDS, false, false)).to.equal(13);
      expect(ScoreCalculator.calculateBaseScore(HuType.BIG_THREE_DRAGONS, false, false)).to.equal(12);
      expect(ScoreCalculator.calculateBaseScore(HuType.NINE_GATES, false, false)).to.equal(13);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_GREEN, false, false)).to.equal(13);
      expect(ScoreCalculator.calculateBaseScore(HuType.FOUR_KONGS, false, false)).to.equal(13);
      expect(ScoreCalculator.calculateBaseScore(HuType.SEVEN_STARS, false, false)).to.equal(13);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 中等分数牌型', () => {
      // 测试中等分值牌型
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_TERMINALS, false, false)).to.equal(10);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_HONORS, false, false)).to.equal(10);
      expect(ScoreCalculator.calculateBaseScore(HuType.MIXED_TERMINALS, false, false)).to.equal(8);
      expect(ScoreCalculator.calculateBaseScore(HuType.SMALL_FOUR_WINDS, false, false)).to.equal(10);
      expect(ScoreCalculator.calculateBaseScore(HuType.SMALL_THREE_DRAGONS, false, false)).to.equal(8);
      expect(ScoreCalculator.calculateBaseScore(HuType.FOUR_CONCEALED_PUNGS, false, false)).to.equal(10);
      expect(ScoreCalculator.calculateBaseScore(HuType.THREE_KONGS, false, false)).to.equal(9);
      expect(ScoreCalculator.calculateBaseScore(HuType.PURE_SHIFTED_PUNGS, false, false)).to.equal(10);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 低分牌型', () => {
      // 测试低分值牌型
      expect(ScoreCalculator.calculateBaseScore(HuType.OUTSIDE_HAND, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.HALF_FLUSH, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_EVEN_PUNGS, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_HIGH_NUMBERS, false, false)).to.equal(3);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_LOW_NUMBERS, false, false)).to.equal(3);
      expect(ScoreCalculator.calculateBaseScore(HuType.DOUBLE_CONCEALED_KONGS, false, false)).to.equal(6);
      expect(ScoreCalculator.calculateBaseScore(HuType.CONCEALED_HAND, false, false)).to.equal(2);
      expect(ScoreCalculator.calculateBaseScore(HuType.PURE_STRAIGHT, false, false)).to.equal(5);
      expect(ScoreCalculator.calculateBaseScore(HuType.SELF_DRAWN, false, false)).to.equal(1);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 特殊组合型', () => {
      // 测试特殊组合型
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_TYPES, false, false)).to.equal(5);
      expect(ScoreCalculator.calculateBaseScore(HuType.PURE_SAME_CHOW, false, false)).to.equal(12);
      expect(ScoreCalculator.calculateBaseScore(HuType.PURE_SHIFTED_CHOWS, false, false)).to.equal(8);
      expect(ScoreCalculator.calculateBaseScore(HuType.PURE_DOUBLE_CHOW, false, false)).to.equal(12);
      expect(ScoreCalculator.calculateBaseScore(HuType.MIXED_STRAIGHT, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.ALL_FIVES, false, false)).to.equal(7);
      expect(ScoreCalculator.calculateBaseScore(HuType.THREE_SIMILAR_SEQUENCES, false, false)).to.equal(6);
      expect(ScoreCalculator.calculateBaseScore(HuType.THREE_SIMILAR_PUNGS, false, false)).to.equal(8);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 特殊牌型附加', () => {
      // 测试其他特殊组合
      expect(ScoreCalculator.calculateBaseScore(HuType.FULLY_ISOLATED, false, false)).to.equal(9);
      expect(ScoreCalculator.calculateBaseScore(HuType.REVERSIBLE_TILES, false, false)).to.equal(8);
      expect(ScoreCalculator.calculateBaseScore(HuType.SEVEN_CONNECTED_PAIRS, false, false)).to.equal(11);
      expect(ScoreCalculator.calculateBaseScore(HuType.FOUR_OF_A_KIND, false, false)).to.equal(7);
      expect(ScoreCalculator.calculateBaseScore(HuType.TWO_DRAGON_PUNGS, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.TWO_IDENTICAL_PUNGS, false, false)).to.equal(2);
      expect(ScoreCalculator.calculateBaseScore(HuType.TWO_CONCEALED_PUNGS, false, false)).to.equal(2);
      expect(ScoreCalculator.calculateBaseScore(HuType.ONE_VOIDED_SUIT, false, false)).to.equal(1);
      expect(ScoreCalculator.calculateBaseScore(HuType.KNITTED_STRAIGHT, false, false)).to.equal(5);
    });
    
    it('应该根据和牌类型正确计算基本分数 - 特殊情况', () => {
      // 测试特殊情况
      expect(ScoreCalculator.calculateBaseScore(HuType.LAST_TILE, false, false)).to.equal(1);
      expect(ScoreCalculator.calculateBaseScore(HuType.KONG_FLOWER, false, false)).to.equal(1);
      expect(ScoreCalculator.calculateBaseScore(HuType.ROBBING_KONG, false, false)).to.equal(1);
      expect(ScoreCalculator.calculateBaseScore(HuType.EIGHT_FLOWERS, false, false)).to.equal(4);
      expect(ScoreCalculator.calculateBaseScore(HuType.FOUR_FLOWERS, false, false)).to.equal(2);
      expect(ScoreCalculator.calculateBaseScore(HuType.NOT_HU, false, false)).to.equal(0);
    });
    
    it('应该为未知的HuType返回默认分数', () => {
      // 测试未知的HuType值
      expect(ScoreCalculator.calculateBaseScore(999 as HuType, false, false)).to.equal(1);
    });
    
    it('自摸应该翻倍基本分', () => {
      // 测试不同牌型的自摸翻倍效果
      const testCases = [
        { huType: HuType.PING_HU, baseScore: 1 },
        { huType: HuType.QING_YI_SE, baseScore: 6 },
        { huType: HuType.BIG_FOUR_WINDS, baseScore: 13 },
        { huType: HuType.PURE_STRAIGHT, baseScore: 5 }
      ];
      
      testCases.forEach(({ huType, baseScore }) => {
        expect(ScoreCalculator.calculateBaseScore(huType, false, false)).to.equal(baseScore);
        expect(ScoreCalculator.calculateBaseScore(huType, true, false)).to.equal(baseScore * 2);
      });
    });
    
    it('庄家应该获得额外1分', () => {
      // 测试不同牌型的庄家加分效果
      const testCases = [
        { huType: HuType.PING_HU, baseScore: 1 },
        { huType: HuType.QING_YI_SE, baseScore: 6 },
        { huType: HuType.THREE_KONGS, baseScore: 9 }
      ];
      
      testCases.forEach(({ huType, baseScore }) => {
        expect(ScoreCalculator.calculateBaseScore(huType, false, false)).to.equal(baseScore);
        expect(ScoreCalculator.calculateBaseScore(huType, false, true)).to.equal(baseScore + 1);
      });
    });
    
    it('自摸和庄家组合应该正确计算', () => {
      // 测试不同牌型的自摸+庄家组合效果
      const testCases = [
        { huType: HuType.PING_HU, baseScore: 1, expected: 1 * 2 + 1 },
        { huType: HuType.QING_YI_SE, baseScore: 6, expected: 6 * 2 + 1 },
        { huType: HuType.OUTSIDE_HAND, baseScore: 4, expected: 4 * 2 + 1 }
      ];
      
      testCases.forEach(({ huType, baseScore, expected }) => {
        expect(ScoreCalculator.calculateBaseScore(huType, true, true)).to.equal(expected);
      });
    });
  });
  
  describe('calculateScore', () => {
    let player: Player;
    
    beforeEach(() => {
      player = new Player(1, '测试玩家', PlayerType.HUMAN);
    });
    
    it('应该正确计算基本分（无额外番数）', () => {
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU);
      
      expect(result.score).to.equal(1); // 只有基本分
      expect(result.details).to.be.an('array');
      expect(result.details.find(d => d.factor === '基本分')?.value).to.equal(1);
      expect(result.details.length).to.equal(1); // 只有基本分项
    });
    
    it('应该正确计算自摸和庄家加分', () => {
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isSelfDrawn: true,
        isDealer: true
      });
      
      expect(result.score).to.equal(3); // 平胡(1) + 自摸(x2) + 庄家(+1) = 3
      expect(result.details).to.be.an('array');
      expect(result.details.find(d => d.factor === '基本分')?.value).to.equal(3);
    });
    
    it('应该正确处理单个特殊和牌情况', () => {
      // 测试海底捞月
      const lastTileResult = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isLastTile: true
      });
      
      expect(lastTileResult.score).to.equal(2); // 基本分1 * 2^1 = 2 (一个番)
      expect(lastTileResult.details.some(d => d.factor === '海底捞月')).to.be.true;
      expect(lastTileResult.details.some(d => d.factor === `番数(1番)`)).to.be.true;
      
      // 测试杠上开花
      const kongFlowerResult = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isKongFlower: true
      });
      
      expect(kongFlowerResult.score).to.equal(2); // 基本分1 * 2^1 = 2 (一个番)
      expect(kongFlowerResult.details.some(d => d.factor === '杠上开花')).to.be.true;
      
      // 测试抢杠和
      const robbingKongResult = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isRobbingKong: true
      });
      
      expect(robbingKongResult.score).to.equal(2); // 基本分1 * 2^1 = 2 (一个番)
      expect(robbingKongResult.details.some(d => d.factor === '抢杠和')).to.be.true;
    });
    
    it('应该正确处理多个特殊和牌情况', () => {
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isSelfDrawn: false,
        isDealer: false,
        isLastTile: true,
        isKongFlower: true,
        isRobbingKong: true
      });
      
      // 基本分1 + 三种特殊情况各加1番，所以是1 * 2^3 = 8
      expect(result.score).to.equal(8);
      expect(result.details.some(d => d.factor === '海底捞月')).to.be.true;
      expect(result.details.some(d => d.factor === '杠上开花')).to.be.true;
      expect(result.details.some(d => d.factor === '抢杠和')).to.be.true;
      expect(result.details.some(d => d.factor === `番数(3番)`)).to.be.true;
    });
    
    it('应该正确计算单个杠的加分', () => {
      player.revealedSets = [
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 1 }) }
      ];
      
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU);
      
      // 基本平胡分1 * 2^1 = 2 (因为有1个杠，1番)
      expect(result.score).to.equal(2);
      expect(result.details.some(d => d.factor === '杠(1个)')).to.be.true;
      expect(result.details.some(d => d.factor === `番数(1番)`)).to.be.true;
    });
    
    it('应该正确计算多个杠的加分', () => {
      player.revealedSets = [
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 1 }) },
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 2 }) },
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 3 }) }
      ];
      
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU);
      
      // 基本平胡分1 * 2^3 = 8 (因为有3个杠，3番)
      expect(result.score).to.equal(8);
      expect(result.details.some(d => d.factor === '杠(3个)')).to.be.true;
      expect(result.details.some(d => d.factor === `番数(3番)`)).to.be.true;
    });
    
    it('应该正确处理杠和特殊情况的组合', () => {
      player.revealedSets = [
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 1 }) },
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 2 }) }
      ];
      
      const result = ScoreCalculator.calculateScore(player, HuType.PING_HU, {
        isLastTile: true,
        isKongFlower: true
      });
      
      // 基本平胡分1 * 2^4 = 16 (因为有2个杠和2个特殊情况，共4番)
      expect(result.score).to.equal(16);
      expect(result.details.some(d => d.factor === '杠(2个)')).to.be.true;
      expect(result.details.some(d => d.factor === '海底捞月')).to.be.true;
      expect(result.details.some(d => d.factor === '杠上开花')).to.be.true;
      expect(result.details.some(d => d.factor === `番数(4番)`)).to.be.true;
    });
    
    it('应该正确计算高分和牌类型的得分', () => {
      const result = ScoreCalculator.calculateScore(player, HuType.BIG_FOUR_WINDS);
      
      // 大四喜基本分13，无额外番数
      expect(result.score).to.equal(13);
      expect(result.details.find(d => d.factor === '基本分')?.value).to.equal(13);
    });
  });
  
  describe('getWinTypeInfo', () => {
    it('应该返回正确的和牌类型信息 - 基本牌型', () => {
      const types = [
        { type: HuType.PING_HU, name: '平胡', baseScore: 1 },
        { type: HuType.PENG_PENG_HU, name: '碰碰胡', baseScore: 2 },
        { type: HuType.QING_YI_SE, name: '清一色', baseScore: 6 },
        { type: HuType.SEVEN_PAIRS, name: '七对子', baseScore: 4 },
        { type: HuType.THIRTEEN_ORPHANS, name: '十三幺', baseScore: 13 }
      ];
      
      types.forEach(({ type, name, baseScore }) => {
        const info = ScoreCalculator.getWinTypeInfo(type);
        expect(info.name).to.equal(name);
        expect(info.baseScore).to.equal(baseScore);
        expect(info.description).to.be.a('string');
      });
    });
    
    it('应该返回正确的和牌类型信息 - 特殊高分牌型', () => {
      const types = [
        { type: HuType.BIG_FOUR_WINDS, name: '大四喜', baseScore: 13 },
        { type: HuType.BIG_THREE_DRAGONS, name: '大三元', baseScore: 12 },
        { type: HuType.NINE_GATES, name: '九莲宝灯', baseScore: 13 },
        { type: HuType.ALL_GREEN, name: '绿一色', baseScore: 13 },
        { type: HuType.FOUR_KONGS, name: '四杠子', baseScore: 13 }
      ];
      
      types.forEach(({ type, name, baseScore }) => {
        const info = ScoreCalculator.getWinTypeInfo(type);
        expect(info.name).to.equal(name);
        expect(info.baseScore).to.equal(baseScore);
      });
    });
    
    it('应该返回正确的和牌类型信息 - 特殊情况', () => {
      const types = [
        { type: HuType.LAST_TILE, name: '海底捞月', baseScore: 1 },
        { type: HuType.KONG_FLOWER, name: '杠上开花', baseScore: 1 },
        { type: HuType.ROBBING_KONG, name: '抢杠和', baseScore: 1 },
        { type: HuType.EIGHT_FLOWERS, name: '花牌全', baseScore: 4 },
        { type: HuType.FOUR_FLOWERS, name: '花牌杠', baseScore: 2 }
      ];
      
      types.forEach(({ type, name, baseScore }) => {
        const info = ScoreCalculator.getWinTypeInfo(type);
        expect(info.name).to.equal(name);
        expect(info.baseScore).to.equal(baseScore);
      });
    });
    
    it('对于未知的和牌类型应返回默认信息', () => {
      const unknownInfo = ScoreCalculator.getWinTypeInfo(999 as HuType);
      expect(unknownInfo.name).to.equal('未知牌型');
      expect(unknownInfo.description).to.equal('未知牌型');
      expect(unknownInfo.baseScore).to.equal(1);
    });
  });
  
  describe('calculateFullScore', () => {
    let player: Player;
    
    beforeEach(() => {
      player = new Player(1, '测试玩家', PlayerType.HUMAN);
    });
    
    it('应该返回正确的基本得分信息', () => {
      const result = ScoreCalculator.calculateFullScore(player, HuType.PING_HU);
      
      expect(result.huType).to.equal(HuType.PING_HU);
      expect(result.score).to.equal(1);
      expect(result.description).to.equal('平胡');
      expect(result.scoreDetails).to.be.an('object');
      expect(result.scoreDetails.baseScore).to.equal(1);
      expect(result.scoreDetails.additionalScores).to.be.an('array');
      expect(result.scoreDetails.additionalScores.length).to.equal(0); // 无额外加分项
    });
    
    it('应该返回高分牌型的得分信息', () => {
      const result = ScoreCalculator.calculateFullScore(player, HuType.BIG_FOUR_WINDS);
      
      expect(result.huType).to.equal(HuType.BIG_FOUR_WINDS);
      expect(result.score).to.equal(13);
      expect(result.description).to.equal('大四喜');
      expect(result.scoreDetails.baseScore).to.equal(13);
    });
    
    it('应该包含自摸和庄家得分信息', () => {
      const result = ScoreCalculator.calculateFullScore(player, HuType.PING_HU, {
        isSelfDrawn: true,
        isDealer: true
      });
      
      expect(result.score).to.equal(3); // 平胡(1) + 自摸(x2) + 庄家(+1) = 3
      // 注意：自摸和庄家是计入基本分的，不在additionalScores中
      expect(result.scoreDetails.baseScore).to.equal(1); // 仍然是平胡的基本分
    });
    
    it('应该包含特殊情况得分信息', () => {
      const result = ScoreCalculator.calculateFullScore(player, HuType.PING_HU, {
        isLastTile: true,
        isKongFlower: true
      });
      
      expect(result.score).to.equal(4); // 平胡(1) * 2^2 = 4 (2个特殊情况)
      expect(result.scoreDetails.additionalScores.length).to.equal(3);
      expect(result.scoreDetails.additionalScores.map(s => s.name)).to.include.members(['海底捞月', '杠上开花']);
    });
    
    it('应该包含杠牌得分信息', () => {
      player.revealedSets = [
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 1 }) },
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 2 }) }
      ];
      
      const result = ScoreCalculator.calculateFullScore(player, HuType.PING_HU);
      
      expect(result.score).to.equal(4); // 平胡(1) * 2^2 = 4 (2个杠)
      expect(result.scoreDetails.additionalScores.length).to.equal(2);
      expect(result.scoreDetails.additionalScores[0].name).to.equal('杠(2个)');
    });
    
    it('应该包含所有额外得分因素的复杂情况', () => {
      player.revealedSets = [
        { type: 'GANG', tiles: Array(4).fill({ type: TileType.WAN, value: 1 }) }
      ];
      
      const result = ScoreCalculator.calculateFullScore(player, HuType.QING_YI_SE, {
        isSelfDrawn: true,
        isDealer: true,
        isLastTile: true,
        isKongFlower: true,
        isRobbingKong: true
      });
      
      // 清一色(6) * 自摸(x2) + 庄家(+1) = 13 (基本分)
      // 13 * 2^5 = 416 (5番：1杠、海底捞月、杠上开花、抢杠和)
      expect(result.score).to.be.greaterThan(0);
      
      // 检查额外得分因素是否都包含了
      const additionalFactors = result.scoreDetails.additionalScores.map(s => s.name);
      expect(additionalFactors).to.include.members(['杠(1个)', '海底捞月', '杠上开花', '抢杠和']);
    });
  });
}); 