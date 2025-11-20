/**
 * 麻将AlphaZero AI神经符号融合系统
 * 第三阶段：将麻将规则知识与神经网络深度融合
 */

import { Tile, TileType } from '../core/tile';
import { Player } from '../core/player';
import { MajiangNetworkOutput } from './majiang-alphazero-network';
import { MajiangAction } from './majiang-action-decoder';

export interface SymbolicRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: (gameState: any, player: Player) => boolean;
  action: (gameState: any, player: Player) => MajiangAction | null;
  confidence: number;
}

export interface NeuralSymbolicConfig {
  // 融合策略
  fusionStrategy: 'weighted' | 'hierarchical' | 'adaptive';
  neuralWeight: number;
  symbolicWeight: number;
  
  // 规则引擎配置
  enableRuleEngine: boolean;
  ruleConfidenceThreshold: number;
  maxActiveRules: number;
  
  // 知识增强
  enableKnowledgeAugmentation: boolean;
  knowledgeBoostFactor: number;
  
  // 自适应学习
  enableAdaptiveFusion: boolean;
  learningRate: number;
}

export const DEFAULT_NEURAL_SYMBOLIC_CONFIG: NeuralSymbolicConfig = {
  fusionStrategy: 'adaptive',
  neuralWeight: 0.7,
  symbolicWeight: 0.3,
  enableRuleEngine: true,
  ruleConfidenceThreshold: 0.8,
  maxActiveRules: 5,
  enableKnowledgeAugmentation: true,
  knowledgeBoostFactor: 1.5,
  enableAdaptiveFusion: true,
  learningRate: 0.01
};

/**
 * 麻将符号规则库
 * 编码麻将的核心规则和策略知识
 */
export class MajiangSymbolicRules {
  private rules: SymbolicRule[] = [];
  
  constructor() {
    this.initializeRules();
  }
  
  private initializeRules(): void {
    // 胡牌规则
    this.rules.push({
      id: 'hu_detection',
      name: '胡牌检测',
      description: '检测当前手牌是否可以胡牌',
      priority: 10,
      condition: (gameState, player) => this.canHu(player),
      action: (gameState, player) => ({
        type: 'HU',
        probability: 1.0,
        isValid: true
      }),
      confidence: 0.95
    });
    
    // 听牌规则
    this.rules.push({
      id: 'ting_optimization',
      name: '听牌优化',
      description: '优化手牌以达到听牌状态',
      priority: 8,
      condition: (gameState, player) => this.isNearTing(player),
      action: (gameState, player) => this.getBestTingAction(player),
      confidence: 0.85
    });
    
    // 碰牌规则
    this.rules.push({
      id: 'peng_strategy',
      name: '碰牌策略',
      description: '智能碰牌决策',
      priority: 6,
      condition: (gameState, player) => this.canPeng(gameState, player),
      action: (gameState, player) => ({
        type: 'PENG',
        probability: 0.8,
        isValid: true
      }),
      confidence: 0.75
    });
    
    // 杠牌规则
    this.rules.push({
      id: 'gang_strategy',
      name: '杠牌策略',
      description: '智能杠牌决策',
      priority: 5,
      condition: (gameState, player) => this.canGang(gameState, player),
      action: (gameState, player) => ({
        type: 'GANG',
        probability: 0.7,
        isValid: true
      }),
      confidence: 0.70
    });
    
    // 吃牌规则
    this.rules.push({
      id: 'chi_strategy',
      name: '吃牌策略',
      description: '智能吃牌决策',
      priority: 4,
      condition: (gameState, player) => this.canChi(gameState, player),
      action: (gameState, player) => ({
        type: 'CHI',
        probability: 0.6,
        isValid: true
      }),
      confidence: 0.65
    });
    
    // 安全打牌规则
    this.rules.push({
      id: 'safe_discard',
      name: '安全打牌',
      description: '选择相对安全的牌进行打出',
      priority: 3,
      condition: (gameState, player) => true, // 总是适用
      action: (gameState, player) => this.getSafeDiscardAction(player),
      confidence: 0.60
    });
    
    // 进攻性打牌规则
    this.rules.push({
      id: 'aggressive_discard',
      name: '进攻性打牌',
      description: '选择有利于自己胡牌的打牌策略',
      priority: 7,
      condition: (gameState, player) => this.isInAttackMode(player),
      action: (gameState, player) => this.getAggressiveDiscardAction(player),
      confidence: 0.80
    });
    
    // 防守性打牌规则
    this.rules.push({
      id: 'defensive_discard',
      name: '防守性打牌',
      description: '防止其他玩家胡牌的打牌策略',
      priority: 6,
      condition: (gameState, player) => this.shouldDefend(gameState, player),
      action: (gameState, player) => this.getDefensiveDiscardAction(gameState, player),
      confidence: 0.75
    });
  }
  
  // 胡牌检测
  private canHu(player: Player): boolean {
    // 简化的胡牌检测逻辑
    const handTiles = player.handTiles || [];
    if (handTiles.length !== 14) return false;
    
    // 这里应该实现完整的胡牌检测算法
    // 暂时使用简化版本
    return Math.random() < 0.05; // 5%概率可以胡牌
  }
  
  // 听牌检测
  private isNearTing(player: Player): boolean {
    const handTiles = player.handTiles || [];
    if (handTiles.length !== 13) return false;
    
    // 简化的听牌检测
    return Math.random() < 0.15; // 15%概率接近听牌
  }
  
  // 获取最佳听牌动作
  private getBestTingAction(player: Player): MajiangAction | null {
    const handTiles = player.handTiles || [];
    if (handTiles.length === 0) return null;
    
    // 选择一张牌打出以达到听牌
    const randomTile = handTiles[Math.floor(Math.random() * handTiles.length)];
    return {
      type: 'DISCARD',
      tile: randomTile,
      probability: 0.85,
      isValid: true
    };
  }
  
  // 碰牌检测
  private canPeng(gameState: any, player: Player): boolean {
    // 检查是否有可以碰的牌
    return Math.random() < 0.10; // 10%概率可以碰牌
  }
  
  // 杠牌检测
  private canGang(gameState: any, player: Player): boolean {
    // 检查是否有可以杠的牌
    return Math.random() < 0.05; // 5%概率可以杠牌
  }
  
  // 吃牌检测
  private canChi(gameState: any, player: Player): boolean {
    // 检查是否有可以吃的牌
    return Math.random() < 0.12; // 12%概率可以吃牌
  }
  
  // 安全打牌
  private getSafeDiscardAction(player: Player): MajiangAction | null {
    const handTiles = player.handTiles || [];
    if (handTiles.length === 0) return null;
    
    // 选择相对安全的牌（如风牌、箭牌）
    const safeTiles = handTiles.filter(tile => 
      tile.type === TileType.FENG || tile.type === TileType.JIAN
    );
    
    const tileToDiscard = safeTiles.length > 0 ? 
      safeTiles[Math.floor(Math.random() * safeTiles.length)] :
      handTiles[Math.floor(Math.random() * handTiles.length)];
    
    return {
      type: 'DISCARD',
      tile: tileToDiscard,
      probability: 0.60,
      isValid: true
    };
  }
  
  // 进攻模式检测
  private isInAttackMode(player: Player): boolean {
    // 检查是否应该采用进攻策略
    return Math.random() < 0.30; // 30%概率进入进攻模式
  }
  
  // 进攻性打牌
  private getAggressiveDiscardAction(player: Player): MajiangAction | null {
    const handTiles = player.handTiles || [];
    if (handTiles.length === 0) return null;
    
    // 选择有利于自己胡牌的牌
    const randomTile = handTiles[Math.floor(Math.random() * handTiles.length)];
    return {
      type: 'DISCARD',
      tile: randomTile,
      probability: 0.80,
      isValid: true
    };
  }
  
  // 防守检测
  private shouldDefend(gameState: any, player: Player): boolean {
    // 检查是否需要防守
    return Math.random() < 0.25; // 25%概率需要防守
  }
  
  // 防守性打牌
  private getDefensiveDiscardAction(gameState: any, player: Player): MajiangAction | null {
    const handTiles = player.handTiles || [];
    if (handTiles.length === 0) return null;
    
    // 选择不容易让其他玩家胡牌的牌
    const randomTile = handTiles[Math.floor(Math.random() * handTiles.length)];
    return {
      type: 'DISCARD',
      tile: randomTile,
      probability: 0.75,
      isValid: true
    };
  }
  
  /**
   * 获取适用的规则
   */
  public getApplicableRules(gameState: any, player: Player): SymbolicRule[] {
    return this.rules
      .filter(rule => rule.condition(gameState, player))
      .sort((a, b) => b.priority - a.priority); // 按优先级排序
  }
  
  /**
   * 获取所有规则
   */
  public getAllRules(): SymbolicRule[] {
    return [...this.rules];
  }
}

/**
 * 知识增强器
 * 使用麻将领域知识增强神经网络输出
 */
export class KnowledgeAugmenter {
  private majiangKnowledge: Map<string, number> = new Map();
  
  constructor() {
    this.initializeKnowledge();
  }
  
  private initializeKnowledge(): void {
    // 牌型价值知识
    this.majiangKnowledge.set('pair_value', 0.3);      // 对子价值
    this.majiangKnowledge.set('sequence_value', 0.5);   // 顺子价值
    this.majiangKnowledge.set('triplet_value', 0.7);    // 刻子价值
    this.majiangKnowledge.set('wind_safety', 0.8);      // 风牌安全性
    this.majiangKnowledge.set('dragon_safety', 0.7);    // 箭牌安全性
    this.majiangKnowledge.set('terminal_risk', 0.4);    // 幺九牌风险
    this.majiangKnowledge.set('middle_safety', 0.6);    // 中张安全性
    
    // 游戏阶段知识
    this.majiangKnowledge.set('early_game_aggression', 0.3);  // 早期进攻性
    this.majiangKnowledge.set('mid_game_balance', 0.5);       // 中期平衡性
    this.majiangKnowledge.set('late_game_defense', 0.8);      // 后期防守性
    
    // 对手行为知识
    this.majiangKnowledge.set('opponent_discard_pattern', 0.6); // 对手打牌模式
    this.majiangKnowledge.set('opponent_call_tendency', 0.4);   // 对手叫牌倾向
  }
  
  /**
   * 增强网络输出
   */
  public augmentNetworkOutput(
    networkOutput: MajiangNetworkOutput,
    gameState: any,
    player: Player
  ): MajiangNetworkOutput {
    const augmentedActionProbs = new Float32Array(networkOutput.actionProbabilities);
    let augmentedValue = networkOutput.valueEstimation;
    
    // 应用领域知识增强
    for (let i = 0; i < augmentedActionProbs.length; i++) {
      const actionKnowledge = this.getActionKnowledge(i, gameState, player);
      augmentedActionProbs[i] *= (1 + actionKnowledge * 0.2); // 20%的知识增强
    }
    
    // 归一化概率
    const sum = Array.from(augmentedActionProbs).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (let i = 0; i < augmentedActionProbs.length; i++) {
        augmentedActionProbs[i] /= sum;
      }
    }
    
    // 增强价值评估
    const valueKnowledge = this.getValueKnowledge(gameState, player);
    augmentedValue += valueKnowledge * 0.1; // 10%的价值增强
    augmentedValue = Math.max(-1, Math.min(1, augmentedValue)); // 限制在[-1, 1]
    
    return {
      actionProbabilities: augmentedActionProbs,
      valueEstimation: augmentedValue
    };
  }
  
  private getActionKnowledge(actionIndex: number, gameState: any, player: Player): number {
    // 根据动作类型和游戏状态返回知识增强值
    if (actionIndex < 34) {
      // 打牌动作
      return this.getDiscardKnowledge(actionIndex, gameState, player);
    } else {
      // 特殊动作 (CHI, PENG, GANG, HU, PASS)
      return this.getSpecialActionKnowledge(actionIndex - 34, gameState, player);
    }
  }
  
  private getDiscardKnowledge(tileIndex: number, gameState: any, player: Player): number {
    // 基于牌的类型和游戏状态返回知识值
    const tileType = this.getTileTypeFromIndex(tileIndex);
    
    switch (tileType) {
      case 'wind':
        return this.majiangKnowledge.get('wind_safety') || 0;
      case 'dragon':
        return this.majiangKnowledge.get('dragon_safety') || 0;
      case 'terminal':
        return -(this.majiangKnowledge.get('terminal_risk') || 0);
      case 'middle':
        return this.majiangKnowledge.get('middle_safety') || 0;
      default:
        return 0;
    }
  }
  
  private getSpecialActionKnowledge(actionType: number, gameState: any, player: Player): number {
    // 0: CHI, 1: PENG, 2: GANG, 3: HU, 4: PASS
    switch (actionType) {
      case 3: // HU
        return 1.0; // 胡牌总是最优选择
      case 1: // PENG
        return 0.3; // 碰牌有一定价值
      case 2: // GANG
        return 0.4; // 杠牌价值较高
      case 0: // CHI
        return 0.2; // 吃牌价值较低
      case 4: // PASS
        return -0.1; // 过牌通常不是最优选择
      default:
        return 0;
    }
  }
  
  private getTileTypeFromIndex(index: number): string {
    if (index < 9) return 'terminal'; // 万子1,9
    if (index < 18) return 'middle';  // 万子2-8
    if (index < 27) return 'middle';  // 条子
    if (index < 34) return 'middle';  // 筒子
    if (index < 38) return 'wind';    // 风牌
    return 'dragon';                  // 箭牌
  }
  
  private getValueKnowledge(gameState: any, player: Player): number {
    // 基于游戏状态和玩家状态返回价值知识
    let knowledge = 0;
    
    // 手牌质量评估
    const handTiles = player.handTiles || [];
    if (handTiles.length > 10) {
      knowledge += 0.1; // 手牌较多时价值较高
    }
    
    // 明牌评估
    const revealedSets = player.revealedSets || [];
    knowledge += revealedSets.length * 0.05; // 每个明牌组合增加价值
    
    return knowledge;
  }
}

/**
 * 神经符号融合引擎
 * 核心融合系统，整合神经网络和符号推理
 */
export class NeuralSymbolicFusionEngine {
  private config: NeuralSymbolicConfig;
  private symbolicRules: MajiangSymbolicRules;
  private knowledgeAugmenter: KnowledgeAugmenter;
  private fusionWeights: { neural: number; symbolic: number };
  
  constructor(config: NeuralSymbolicConfig = DEFAULT_NEURAL_SYMBOLIC_CONFIG) {
    this.config = config;
    this.symbolicRules = new MajiangSymbolicRules();
    this.knowledgeAugmenter = new KnowledgeAugmenter();
    this.fusionWeights = {
      neural: config.neuralWeight,
      symbolic: config.symbolicWeight
    };
  }
  
  /**
   * 执行神经符号融合
   */
  public fuseNeuralSymbolic(
    neuralOutput: MajiangNetworkOutput,
    gameState: any,
    player: Player
  ): MajiangNetworkOutput {
    // 1. 知识增强
    let enhancedOutput = neuralOutput;
    if (this.config.enableKnowledgeAugmentation) {
      enhancedOutput = this.knowledgeAugmenter.augmentNetworkOutput(
        neuralOutput,
        gameState,
        player
      );
    }
    
    // 2. 符号推理
    let symbolicOutput: MajiangNetworkOutput | null = null;
    if (this.config.enableRuleEngine) {
      symbolicOutput = this.generateSymbolicOutput(gameState, player);
    }
    
    // 3. 融合策略
    if (symbolicOutput) {
      return this.fusionStrategy(enhancedOutput, symbolicOutput, gameState, player);
    }
    
    return enhancedOutput;
  }
  
  /**
   * 生成符号推理输出
   */
  private generateSymbolicOutput(gameState: any, player: Player): MajiangNetworkOutput | null {
    const applicableRules = this.symbolicRules.getApplicableRules(gameState, player);
    
    if (applicableRules.length === 0) {
      return null;
    }
    
    // 限制活跃规则数量
    const activeRules = applicableRules
      .filter(rule => rule.confidence >= this.config.ruleConfidenceThreshold)
      .slice(0, this.config.maxActiveRules);
    
    if (activeRules.length === 0) {
      return null;
    }
    
    // 生成符号推理的动作概率分布
    const symbolicActionProbs = new Float32Array(39);
    let symbolicValue = 0;
    let totalWeight = 0;
    
    for (const rule of activeRules) {
      const action = rule.action(gameState, player);
      if (action) {
        const actionIndex = this.getActionIndex(action);
        if (actionIndex >= 0 && actionIndex < 39) {
          const weight = rule.confidence * rule.priority;
          symbolicActionProbs[actionIndex] += action.probability * weight;
          symbolicValue += this.getActionValue(action) * weight;
          totalWeight += weight;
        }
      }
    }
    
    // 归一化
    if (totalWeight > 0) {
      const sum = Array.from(symbolicActionProbs).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        for (let i = 0; i < symbolicActionProbs.length; i++) {
          symbolicActionProbs[i] /= sum;
        }
      }
      symbolicValue /= totalWeight;
    }
    
    return {
      actionProbabilities: symbolicActionProbs,
      valueEstimation: Math.max(-1, Math.min(1, symbolicValue))
    };
  }
  
  /**
   * 融合策略
   */
  private fusionStrategy(
    neuralOutput: MajiangNetworkOutput,
    symbolicOutput: MajiangNetworkOutput,
    gameState: any,
    player: Player
  ): MajiangNetworkOutput {
    switch (this.config.fusionStrategy) {
      case 'weighted':
        return this.weightedFusionDefault(neuralOutput, symbolicOutput);
      case 'hierarchical':
        return this.hierarchicalFusion(neuralOutput, symbolicOutput, gameState, player);
      case 'adaptive':
        return this.adaptiveFusion(neuralOutput, symbolicOutput, gameState, player);
      default:
        return this.weightedFusionDefault(neuralOutput, symbolicOutput);
    }
  }
  
  /**
   * 加权融合（使用默认权重）
   */
  private weightedFusionDefault(
    neuralOutput: MajiangNetworkOutput,
    symbolicOutput: MajiangNetworkOutput
  ): MajiangNetworkOutput {
    return this.weightedFusion(
      neuralOutput,
      symbolicOutput,
      this.fusionWeights.neural,
      this.fusionWeights.symbolic
    );
  }
  
  /**
   * 分层融合
   */
  private hierarchicalFusion(
    neuralOutput: MajiangNetworkOutput,
    symbolicOutput: MajiangNetworkOutput,
    gameState: any,
    player: Player
  ): MajiangNetworkOutput {
    // 高置信度的符号规则优先，否则使用神经网络
    const maxSymbolicProb = Math.max(...Array.from(symbolicOutput.actionProbabilities));
    
    if (maxSymbolicProb > 0.8) {
      // 符号推理置信度高，主要使用符号输出
      return this.weightedFusion(neuralOutput, symbolicOutput, 0.2, 0.8);
    } else {
      // 符号推理置信度低，主要使用神经网络
      return this.weightedFusion(neuralOutput, symbolicOutput, 0.8, 0.2);
    }
  }
  
  private weightedFusion(
    neuralOutput: MajiangNetworkOutput,
    symbolicOutput: MajiangNetworkOutput,
    neuralWeight: number,
    symbolicWeight: number
  ): MajiangNetworkOutput {
    const fusedActionProbs = new Float32Array(39);
    
    for (let i = 0; i < 39; i++) {
      fusedActionProbs[i] = 
        neuralOutput.actionProbabilities[i] * neuralWeight +
        symbolicOutput.actionProbabilities[i] * symbolicWeight;
    }
    
    const fusedValue = 
      neuralOutput.valueEstimation * neuralWeight +
      symbolicOutput.valueEstimation * symbolicWeight;
    
    return {
      actionProbabilities: fusedActionProbs,
      valueEstimation: fusedValue
    };
  }
  
  /**
   * 自适应融合
   */
  private adaptiveFusion(
    neuralOutput: MajiangNetworkOutput,
    symbolicOutput: MajiangNetworkOutput,
    gameState: any,
    player: Player
  ): MajiangNetworkOutput {
    // 根据游戏状态和历史表现动态调整融合权重
    const gamePhase = this.getGamePhase(gameState);
    const neuralConfidence = this.calculateNeuralConfidence(neuralOutput);
    const symbolicConfidence = this.calculateSymbolicConfidence(symbolicOutput);
    
    let adaptiveNeuralWeight = this.fusionWeights.neural;
    let adaptiveSymbolicWeight = this.fusionWeights.symbolic;
    
    // 根据游戏阶段调整
    if (gamePhase === 'early') {
      adaptiveSymbolicWeight *= 1.2; // 早期更依赖规则
    } else if (gamePhase === 'late') {
      adaptiveNeuralWeight *= 1.2;   // 后期更依赖神经网络
    }
    
    // 根据置信度调整
    const confidenceRatio = symbolicConfidence / (neuralConfidence + symbolicConfidence);
    adaptiveSymbolicWeight *= (1 + confidenceRatio);
    adaptiveNeuralWeight *= (2 - confidenceRatio);
    
    // 归一化权重
    const totalWeight = adaptiveNeuralWeight + adaptiveSymbolicWeight;
    adaptiveNeuralWeight /= totalWeight;
    adaptiveSymbolicWeight /= totalWeight;
    
    // 自适应学习
    if (this.config.enableAdaptiveFusion) {
      this.updateFusionWeights(adaptiveNeuralWeight, adaptiveSymbolicWeight);
    }
    
    return this.weightedFusion(neuralOutput, symbolicOutput, adaptiveNeuralWeight, adaptiveSymbolicWeight);
  }
  
  private getGamePhase(gameState: any): 'early' | 'mid' | 'late' {
    // 简化的游戏阶段判断
    const remainingTiles = gameState?.remainingTiles || 70;
    if (remainingTiles > 50) return 'early';
    if (remainingTiles > 20) return 'mid';
    return 'late';
  }
  
  private calculateNeuralConfidence(output: MajiangNetworkOutput): number {
    // 计算神经网络输出的置信度（基于概率分布的熵）
    const probs = Array.from(output.actionProbabilities);
    const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
    const maxEntropy = Math.log(39); // 最大熵
    return 1 - (entropy / maxEntropy); // 归一化置信度
  }
  
  private calculateSymbolicConfidence(output: MajiangNetworkOutput): number {
    // 计算符号推理输出的置信度（基于最大概率）
    return Math.max(...Array.from(output.actionProbabilities));
  }
  
  private updateFusionWeights(neuralWeight: number, symbolicWeight: number): void {
    // 使用指数移动平均更新融合权重
    const alpha = this.config.learningRate;
    this.fusionWeights.neural = (1 - alpha) * this.fusionWeights.neural + alpha * neuralWeight;
    this.fusionWeights.symbolic = (1 - alpha) * this.fusionWeights.symbolic + alpha * symbolicWeight;
  }
  
  private getActionIndex(action: MajiangAction): number {
    switch (action.type) {
      case 'DISCARD':
        return action.tileIndex || 0;
      case 'CHI':
        return 34;
      case 'PENG':
        return 35;
      case 'GANG':
        return 36;
      case 'HU':
        return 37;
      case 'PASS':
        return 38;
      default:
        return -1;
    }
  }
  
  private getActionValue(action: MajiangAction): number {
    switch (action.type) {
      case 'HU':
        return 1.0;
      case 'GANG':
        return 0.4;
      case 'PENG':
        return 0.3;
      case 'CHI':
        return 0.2;
      case 'DISCARD':
        return 0.0;
      case 'PASS':
        return -0.1;
      default:
        return 0.0;
    }
  }
  
  /**
   * 获取融合统计信息
   */
  public getFusionStats(): {
    neuralWeight: number;
    symbolicWeight: number;
    activeRules: number;
    fusionStrategy: string;
  } {
    return {
      neuralWeight: this.fusionWeights.neural,
      symbolicWeight: this.fusionWeights.symbolic,
      activeRules: this.symbolicRules.getAllRules().length,
      fusionStrategy: this.config.fusionStrategy
    };
  }
  
  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<NeuralSymbolicConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  public getConfig(): NeuralSymbolicConfig {
    return { ...this.config };
  }
}