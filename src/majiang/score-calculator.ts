import { Player } from './player';
import { HuType } from './rule-types';


/**
 * 分数计算器 - 专门处理麻将游戏分数和番数计算
 */
export class ScoreCalculator {
  /**
   * 计算基本分数
   * @param huType 和牌类型
   * @param isSelfDrawn 是否自摸
   * @param isDealer 是否为庄家
   * @returns 基本分数
   */
  static calculateBaseScore(huType: HuType, isSelfDrawn: boolean, isDealer: boolean): number {
    let baseScore = 0;
    
    // 根据不同和牌类型赋予基本分数
    switch (huType) {
      case HuType.PING_HU:
        baseScore = 1;
        break;
      case HuType.PENG_PENG_HU:
        baseScore = 2;
        break;
      case HuType.QING_YI_SE:
        baseScore = 6;
        break;
      case HuType.SEVEN_PAIRS:
        baseScore = 4;
        break;
      case HuType.THIRTEEN_ORPHANS:
        baseScore = 13;
        break;
      case HuType.BIG_FOUR_WINDS:
        baseScore = 13;
        break;
      case HuType.BIG_THREE_DRAGONS:
        baseScore = 12;
        break;
      case HuType.NINE_GATES:
        baseScore = 13;
        break;
      case HuType.ALL_TERMINALS:
        baseScore = 10;
        break;
      case HuType.ALL_HONORS:
        baseScore = 10;
        break;
      case HuType.MIXED_TERMINALS:
        baseScore = 8;
        break;
      case HuType.ALL_GREEN:
        baseScore = 13;
        break;
      case HuType.OUTSIDE_HAND:
        baseScore = 4;
        break;
      case HuType.FOUR_KONGS:
        baseScore = 13;
        break;
      case HuType.SEVEN_STARS:
        baseScore = 13;
        break;
      case HuType.SMALL_FOUR_WINDS:
        baseScore = 10;
        break;
      case HuType.SMALL_THREE_DRAGONS:
        baseScore = 8;
        break;
      case HuType.HALF_FLUSH:
        baseScore = 4;
        break;
      case HuType.PURE_TERMINAL_CHOW:
        baseScore = 10;
        break;
      case HuType.ALL_EVEN_PUNGS:
        baseScore = 4;
        break;
      case HuType.ALL_HIGH_NUMBERS:
        baseScore = 3;
        break;
      case HuType.ALL_LOW_NUMBERS:
        baseScore = 3;
        break;
      case HuType.FOUR_CONCEALED_PUNGS:
        baseScore = 10;
        break;
      case HuType.THREE_KONGS:
        baseScore = 9;
        break;
      case HuType.DOUBLE_CONCEALED_KONGS:
        baseScore = 6;
        break;
      case HuType.CONCEALED_HAND:
        baseScore = 2;
        break;
      case HuType.PURE_STRAIGHT:
        baseScore = 5;
        break;
      case HuType.SELF_DRAWN:
        baseScore = 1;
        break;
      case HuType.ALL_TYPES:
        baseScore = 5;
        break;
      case HuType.PURE_SAME_CHOW:
        baseScore = 12;
        break;
      case HuType.PURE_SHIFTED_PUNGS:
        baseScore = 10;
        break;
      case HuType.PURE_SHIFTED_CHOWS:
        baseScore = 8;
        break;
      case HuType.PURE_DOUBLE_CHOW:
        baseScore = 12;
        break;
      case HuType.MIXED_STRAIGHT:
        baseScore = 4;
        break;
      case HuType.ALL_FIVES:
        baseScore = 7;
        break;
      case HuType.THREE_SIMILAR_SEQUENCES:
        baseScore = 6;
        break;
      case HuType.THREE_SIMILAR_PUNGS:
        baseScore = 8;
        break;
      case HuType.FULLY_ISOLATED:
        baseScore = 9;
        break;
      case HuType.REVERSIBLE_TILES:
        baseScore = 8;
        break;
      case HuType.SEVEN_CONNECTED_PAIRS:
        baseScore = 11;
        break;
      case HuType.FOUR_OF_A_KIND:
        baseScore = 7;
        break;
      case HuType.TWO_DRAGON_PUNGS:
        baseScore = 4;
        break;
      case HuType.TWO_IDENTICAL_PUNGS:
        baseScore = 2;
        break;
      case HuType.TWO_CONCEALED_PUNGS:
        baseScore = 2;
        break;
      case HuType.ONE_VOIDED_SUIT:
        baseScore = 1;
        break;
      case HuType.KNITTED_STRAIGHT:
        baseScore = 5;
        break;
      case HuType.LAST_TILE:
        baseScore = 1;
        break;
      case HuType.KONG_FLOWER:
        baseScore = 1;
        break;
      case HuType.ROBBING_KONG:
        baseScore = 1;
        break;
      case HuType.EIGHT_FLOWERS:
        baseScore = 4;
        break;
      case HuType.FOUR_FLOWERS:
        baseScore = 2;
        break;
      case HuType.NOT_HU:
        baseScore = 0;
        break;
      default:
        baseScore = 1;
    }
    
    // 自摸加分
    if (isSelfDrawn) {
      baseScore *= 2;
    }
    
    // 庄家加分
    if (isDealer) {
      baseScore += 1;
    }
    
    return baseScore;
  }
  
  /**
   * 计算和牌得分
   * @param player 玩家对象
   * @param huType 和牌类型
   * @param gameState 游戏状态
   * @returns 总分和详细信息
   */
  static calculateScore(
    player: Player,
    huType: HuType,
    gameState: {
      isSelfDrawn?: boolean,
      isDealer?: boolean,
      isLastTile?: boolean,
      isKongFlower?: boolean,
      isRobbingKong?: boolean
    } = {}
  ): {
    score: number,
    details: {factor: string, value: number}[]
  } {
    const details: {factor: string, value: number}[] = [];
    
    // 计算基本分
    const baseScore = this.calculateBaseScore(
      huType, 
      gameState.isSelfDrawn || false, 
      gameState.isDealer || false
    );
    details.push({factor: "基本分", value: baseScore});
    
    let totalScore = baseScore;
    
    // 计算番数加成
    let fan = 0;
    
    // 特殊和牌情况加番
    if (gameState.isLastTile) {
      fan += 1;
      details.push({factor: "海底捞月", value: 1});
    }
    
    if (gameState.isKongFlower) {
      fan += 1;
      details.push({factor: "杠上开花", value: 1});
    }
    
    if (gameState.isRobbingKong) {
      fan += 1;
      details.push({factor: "抢杠和", value: 1});
    }
    
    // 手牌、杠的情况加番
    const gangCount = player.revealedSets.filter(set => set.type === 'GANG').length;
    if (gangCount > 0) {
      const gangFan = gangCount;
      fan += gangFan;
      details.push({factor: `杠(${gangCount}个)`, value: gangFan});
    }
    
    // 根据番数计算总分
    let multiplier = 1;
    if (fan >= 1) {
      multiplier = Math.pow(2, fan);
      details.push({factor: `番数(${fan}番)`, value: multiplier});
    }
    
    totalScore *= multiplier;
    
    return {
      score: totalScore,
      details
    };
  }
  
  /**
   * 获取和牌类型的详细信息
   * @param huType 和牌类型
   * @returns 和牌类型信息
   */
  static getWinTypeInfo(huType: HuType): { 
    name: string, 
    description: string, 
    baseScore: number 
  } {
    switch (huType) {
      case HuType.PING_HU:
        return {
          name: "平胡",
          description: "平胡",
          baseScore: 1
        };
      case HuType.PENG_PENG_HU:
        return {
          name: "碰碰胡",
          description: "碰碰胡",
          baseScore: 2
        };
      case HuType.QING_YI_SE:
        return {
          name: "清一色",
          description: "清一色",
          baseScore: 6
        };
      case HuType.SEVEN_PAIRS:
        return {
          name: "七对子",
          description: "七对子",
          baseScore: 4
        };
      case HuType.THIRTEEN_ORPHANS:
        return {
          name: "十三幺",
          description: "十三幺",
          baseScore: 13
        };
      case HuType.BIG_FOUR_WINDS:
        return {
          name: "大四喜",
          description: "大四喜",
          baseScore: 13
        };
      case HuType.BIG_THREE_DRAGONS:
        return {
          name: "大三元",
          description: "大三元",
          baseScore: 12
        };
      case HuType.NINE_GATES:
        return {
          name: "九莲宝灯",
          description: "九莲宝灯",
          baseScore: 13
        };
      case HuType.OUTSIDE_HAND:
        return {
          name: "全带幺",
          description: "全带幺",
          baseScore: 4
        };
      case HuType.ALL_HONORS:
        return {
          name: "字一色",
          description: "字一色",
          baseScore: 10
        };
      case HuType.MIXED_TERMINALS:
        return {
          name: "混幺九",
          description: "混幺九",
          baseScore: 8
        };
      case HuType.ALL_TERMINALS:
        return {
          name: "清幺九",
          description: "清幺九",
          baseScore: 10
        };
      case HuType.ALL_GREEN:
        return {
          name: "绿一色",
          description: "绿一色",
          baseScore: 13
        };
      case HuType.SMALL_FOUR_WINDS:
        return {
          name: "小四喜",
          description: "小四喜",
          baseScore: 10
        };
      case HuType.SMALL_THREE_DRAGONS:
        return {
          name: "小三元",
          description: "小三元",
          baseScore: 8
        };
      case HuType.HALF_FLUSH:
        return {
          name: "混一色",
          description: "混一色",
          baseScore: 4
        };
      case HuType.PURE_TERMINAL_CHOW:
        return {
          name: "清幺九",
          description: "清幺九",
          baseScore: 10
        };
      case HuType.ALL_EVEN_PUNGS:
        return {
          name: "全双刻",
          description: "全双刻",
          baseScore: 4
        };
      case HuType.ALL_HIGH_NUMBERS:
        return {
          name: "大于五",
          description: "大于五",
          baseScore: 3
        };
      case HuType.ALL_LOW_NUMBERS:
        return {
          name: "小于五",
          description: "小于五",
          baseScore: 3
        };
      case HuType.FOUR_CONCEALED_PUNGS:
        return {
          name: "四暗刻",
          description: "四暗刻",
          baseScore: 10
        };
      case HuType.THREE_KONGS:
        return {
          name: "三杠子",
          description: "三杠子",
          baseScore: 9
        };
      case HuType.DOUBLE_CONCEALED_KONGS:
        return {
          name: "双暗杠",
          description: "双暗杠",
          baseScore: 6
        };
      case HuType.CONCEALED_HAND:
        return {
          name: "门前清",
          description: "门前清",
          baseScore: 2
        };
      case HuType.PURE_STRAIGHT:
        return {
          name: "一条龙",
          description: "一条龙",
          baseScore: 5
        };
      case HuType.SELF_DRAWN:
        return {
          name: "自摸",
          description: "自摸",
          baseScore: 1
        };
      case HuType.ALL_TYPES:
        return {
          name: "五门齐",
          description: "五门齐",
          baseScore: 5
        };
      case HuType.PURE_SAME_CHOW:
        return {
          name: "一色四同顺",
          description: "一色四同顺",
          baseScore: 12
        };
      case HuType.PURE_SHIFTED_PUNGS:
        return {
          name: "一色四节高",
          description: "一色四节高",
          baseScore: 10
        };
      case HuType.PURE_SHIFTED_CHOWS:
        return {
          name: "一色四步高",
          description: "一色四步高",
          baseScore: 8
        };
      case HuType.PURE_DOUBLE_CHOW:
        return {
          name: "一色双龙会",
          description: "一色双龙会",
          baseScore: 12
        };
      case HuType.MIXED_STRAIGHT:
        return {
          name: "组合龙",
          description: "组合龙",
          baseScore: 4
        };
      case HuType.ALL_FIVES:
        return {
          name: "全带五",
          description: "全带五",
          baseScore: 7
        };
      case HuType.THREE_SIMILAR_SEQUENCES:
        return {
          name: "三色三同顺",
          description: "三色三同顺",
          baseScore: 6
        };
      case HuType.THREE_SIMILAR_PUNGS:
        return {
          name: "三色三节高",
          description: "三色三节高",
          baseScore: 8
        };
      case HuType.FULLY_ISOLATED:
        return {
          name: "全不靠",
          description: "全不靠",
          baseScore: 9
        };
      case HuType.SEVEN_STARS:
        return {
          name: "七星不靠",
          description: "七星不靠",
          baseScore: 13
        };
      case HuType.REVERSIBLE_TILES:
        return {
          name: "推不倒",
          description: "推不倒",
          baseScore: 8
        };
      case HuType.SEVEN_CONNECTED_PAIRS:
        return {
          name: "连七对",
          description: "连七对",
          baseScore: 11
        };
      case HuType.FOUR_OF_A_KIND:
        return {
          name: "四归一",
          description: "四归一",
          baseScore: 7
        };
      case HuType.TWO_DRAGON_PUNGS:
        return {
          name: "双箭刻",
          description: "双箭刻",
          baseScore: 4
        };
      case HuType.TWO_IDENTICAL_PUNGS:
        return {
          name: "双同刻",
          description: "双同刻",
          baseScore: 2
        };
      case HuType.TWO_CONCEALED_PUNGS:
        return {
          name: "双暗刻",
          description: "双暗刻",
          baseScore: 2
        };
      case HuType.ONE_VOIDED_SUIT:
        return {
          name: "缺一门",
          description: "缺一门",
          baseScore: 1
        };
      case HuType.KNITTED_STRAIGHT:
        return {
          name: "组合龙特殊形式",
          description: "组合龙特殊形式",
          baseScore: 5
        };
      case HuType.LAST_TILE:
        return {
          name: "海底捞月",
          description: "海底捞月",
          baseScore: 1
        };
      case HuType.KONG_FLOWER:
        return {
          name: "杠上开花",
          description: "杠上开花",
          baseScore: 1
        };
      case HuType.ROBBING_KONG:
        return {
          name: "抢杠和",
          description: "抢杠和",
          baseScore: 1
        };
      case HuType.EIGHT_FLOWERS:
        return {
          name: "花牌全",
          description: "花牌全",
          baseScore: 4
        };
      case HuType.FOUR_FLOWERS:
        return {
          name: "花牌杠",
          description: "花牌杠",
          baseScore: 2
        };
      case HuType.FOUR_KONGS:
        return {
          name: "四杠子",
          description: "四杠子",
          baseScore: 13
        };
      case HuType.NOT_HU:
        return {
          name: "未成和",
          description: "未成和",
          baseScore: 0
        };
      default:
        return {
          name: "未知牌型",
          description: "未知牌型",
          baseScore: 1
        };
    }
  }
  
  /**
   * 计算完整得分（包含更多详细信息）
   * @param player 玩家对象
   * @param huType 和牌类型
   * @param gameState 游戏状态
   * @returns 完整得分信息
   */
  static calculateFullScore(
    player: Player, 
    huType: HuType,
    gameState: {
      isSelfDrawn?: boolean,
      isDealer?: boolean,
      isLastTile?: boolean,
      isKongFlower?: boolean,
      isRobbingKong?: boolean
    } = {}
  ): { 
    huType: HuType,
    score: number,
    description: string,
    scoreDetails: {
      baseScore: number,
      additionalScores: Array<{name: string, score: number}>
    }
  } {
    // 获取基本信息
    const winTypeInfo = this.getWinTypeInfo(huType);
    const basicScore = this.calculateScore(player, huType, gameState);
    
    // 构建附加分数详情
    const additionalScores: Array<{name: string, score: number}> = basicScore.details
      .filter(d => d.factor !== "基本分" && d.factor !== `番数(${basicScore.details.find(d => d.factor.includes('番数'))?.value || 0}番)`)
      .map(d => ({
        name: d.factor,
        score: d.value
      }));
    
    return {
      huType,
      score: basicScore.score,
      description: winTypeInfo.description,
      scoreDetails: {
        baseScore: winTypeInfo.baseScore,
        additionalScores
      }
    };
  }
} 