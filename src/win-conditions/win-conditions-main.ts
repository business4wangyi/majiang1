import { Tile } from '../tile';
import { TileSet, HuType } from '../rule-types';
import { Player } from '../player';
import { WinConditionRegistry } from './win-condition-detector';

// 导入所有胡牌检测器
import './index'; // 这会自动注册所有检测器

/**
 * 胡牌条件主类
 * 负责协调和使用所有独立的胡牌检测器
 */
export class WinConditions {
  /**
   * 检测玩家是否可以胡牌
   * @param player 玩家
   * @param targetTile 目标牌（可选）
   * @param gameState 游戏状态
   * @param extraOptions 额外选项
   * @param excludeDetectors 排除的检测器
   * @returns 胡牌检测结果
   */
  static canHu(
    player: Player, 
    targetTile: Tile | null = null,
    gameState: {
      isLastTile?: boolean,
      isDrawn?: boolean,
      isAfterKong?: boolean,
      isRobbingKong?: boolean
    } = {},
    extraOptions: {
      flowers?: Tile[]
    } = {},
    excludeDetectors: Function[] = []
  ): { 
    canHu: boolean, 
    huType: HuType,
    description?: string
  } {
    let handTiles = [...player.handTiles];
    const revealedSets = player.revealedSets || [];
    
    // 如果有目标牌，将其添加到手牌中进行检测
    if (targetTile) {
      handTiles.push(targetTile);
    }

    // 验证基本条件
    // 1. 检查总牌数是否正确（考虑杠牌）
    const totalTiles = handTiles.length + revealedSets.reduce((sum, set) => {
      // 杠牌算作3张，因为第4张是额外的
      if (set.type === 'GANG') {
        return sum + 3;
      }
      return sum + set.tiles.length;
    }, 0);

    if (totalTiles !== 14) {
      return {
        canHu: false,
        huType: HuType.NOT_HU,
        description: "牌数不正确"
      };
    }

    // 2. 检查明牌组合是否合法
    for (const set of revealedSets) {
      if (!this.isValidSet(set)) {
        return {
          canHu: false,
          huType: HuType.NOT_HU,
          description: "明牌组合不合法"
        };
      }
    }

    // 3. 检查是否有超过4张相同的牌
    const tileCount = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCount.set(key, (tileCount.get(key) || 0) + 1);
    }
    for (const set of revealedSets) {
      for (const tile of set.tiles) {
        const key = `${tile.type}-${tile.value}`;
        if (set.type === 'GANG') {
          // 杠牌的第四张牌不计入总数
          if (tileCount.get(key) === 3) continue;
        }
        tileCount.set(key, (tileCount.get(key) || 0) + 1);
      }
    }
    for (const count of tileCount.values()) {
      if (count > 4) {
        return {
          canHu: false,
          huType: HuType.NOT_HU,
          description: "存在超过4张的相同牌"
        };
      }
    }

    // 4. 检查杠的数量是否合法
    const gangCount = revealedSets.filter(set => set.type === 'GANG').length;
    if (gangCount > 4) {
      return {
        canHu: false,
        huType: HuType.NOT_HU,
        description: "杠的数量超过限制"
      };
    }

    // 获取所有适用的胡牌检测器
    const matchedDetectors = WinConditionRegistry.detectAll(
      handTiles,
      revealedSets,
      player,
      gameState,
      extraOptions,
      excludeDetectors
    );
    
    // 如果没有匹配的检测器，返回不能胡牌
    if (matchedDetectors.length === 0) {
      return {
        canHu: false,
        huType: HuType.NOT_HU,
        description: "不能和牌"
      };
    }
    
    // 根据分数排序，选择分数最高的胡牌类型
    matchedDetectors.sort((a, b) => b.getScore() - a.getScore());
    const bestDetector = matchedDetectors[0];
    
    return {
      canHu: true,
      huType: bestDetector.getHuType(),
      description: bestDetector.getDescription()
    };
  }
  
  /**
   * 检查明牌组合是否合法
   */
  private static isValidSet(set: TileSet): boolean {
    if (set.type === 'CHI') {
      // 检查顺子
      if (set.tiles.length !== 3) return false;
      const [t1, t2, t3] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type &&
             t2.value === t1.value + 1 && t3.value === t2.value + 1;
    } else if (set.type === 'PENG') {
      // 检查刻子
      if (set.tiles.length !== 3) return false;
      const [t1, t2, t3] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type &&
             t1.value === t2.value && t2.value === t3.value;
    } else if (set.type === 'GANG') {
      // 检查杠
      if (set.tiles.length !== 4) return false;
      const [t1, t2, t3, t4] = set.tiles;
      return t1.type === t2.type && t2.type === t3.type && t3.type === t4.type &&
             t1.value === t2.value && t2.value === t3.value && t3.value === t4.value;
    }
    return false;
  }

  /**
   * 获取胡牌类型描述
   * @param huType 胡牌类型
   * @returns 胡牌类型描述
   */
  static getHuTypeDescription(huType: HuType): string {
    // 查找对应的检测器
    for (const detector of WinConditionRegistry.getAllDetectors()) {
      if (detector.getHuType() === huType) {
        return detector.getDescription();
      }
    }
    
    // 如果没有找到，返回默认描述
    return '未知胡牌类型';
  }
  
  /**
   * 计算胡牌分数
   * @param player 玩家
   * @param gameState 游戏状态
   * @param extraOptions 额外选项
   * @returns 胡牌分数和详情
   */
  static calculateScore(
    player: Player, 
    gameState: {
      isLastTile?: boolean,
      isDrawn?: boolean,
      isAfterKong?: boolean,
      isRobbingKong?: boolean
    } = {},
    extraOptions: {
      flowers?: Tile[]
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
    // 检测胡牌类型
    const huResult = this.canHu(player, null, gameState, extraOptions);
    
    if (!huResult.canHu) {
      return {
        huType: HuType.NOT_HU,
        score: 0,
        description: '未胡牌',
        scoreDetails: {
          baseScore: 0,
          additionalScores: []
        }
      };
    }
    
    // 找到对应的检测器
    let detector = null;
    for (const d of WinConditionRegistry.getAllDetectors()) {
      if (d.getHuType() === huResult.huType) {
        detector = d;
        break;
      }
    }
    
    if (!detector) {
      return {
        huType: huResult.huType,
        score: 0,
        description: huResult.description || '未知胡牌类型',
        scoreDetails: {
          baseScore: 0,
          additionalScores: []
        }
      };
    }
    
    // 计算基础分数
    const baseScore = detector.getScore();
    
    // 计算额外分数（例如自摸、杠上开花等）
    const additionalScores: Array<{name: string, score: number}> = [];
    
    // 自摸加分
    if (gameState.isDrawn) {
      additionalScores.push({ name: '自摸', score: 2 });
    }
    
    // 杠上开花加分
    if (gameState.isAfterKong) {
      additionalScores.push({ name: '杠上开花', score: 4 });
    }
    
    // 抢杠和加分
    if (gameState.isRobbingKong) {
      additionalScores.push({ name: '抢杠和', score: 4 });
    }
    
    // 海底捞月或妙手回春加分
    if (gameState.isLastTile) {
      const bonusName = gameState.isDrawn ? '妙手回春' : '海底捞月';
      additionalScores.push({ name: bonusName, score: 4 });
    }
    
    // 计算总分
    const totalScore = baseScore + additionalScores.reduce((sum, item) => sum + item.score, 0);
    
    return {
      huType: huResult.huType,
      score: totalScore,
      description: huResult.description || detector.getDescription(),
      scoreDetails: {
        baseScore,
        additionalScores
      }
    };
  }
} 