/**
 * 麻将动作解码器 - 将神经网络39维输出转换为麻将游戏动作
 * 基于AlphaZero传说级技术栈，适配广东麻将规则
 */

import { Tile, TileType, Player, GameState } from './types';

export interface MajiangActionSpace {
  // 打牌动作 (34维) - 34种牌型的打出概率
  discardActions: Float32Array;
  
  // 特殊动作 (5维) - [吃, 碰, 杠, 胡, 过]
  specialActions: Float32Array;
  
  // 总维度：39维输出向量
}

export interface MajiangAction {
  type: 'DISCARD' | 'CHI' | 'PENG' | 'GANG' | 'HU' | 'PASS';
  tile?: Tile;
  tileIndex?: number;
  probability: number;
  isValid: boolean;
}

export class MajiangActionDecoder {
  private static readonly TILE_TYPES = 34; // 万条筒风箭牌总类型数
  private static readonly SPECIAL_ACTIONS = 5; // 特殊动作数量
  
  /**
   * 将39维神经网络输出解码为麻将动作
   */
  public static decode(
    networkOutput: Float32Array,
    gameState: GameState,
    currentPlayer: Player
  ): MajiangAction[] {
    if (networkOutput.length !== this.getActionDimension()) {
      throw new Error(`Invalid network output dimension: ${networkOutput.length}, expected: ${this.getActionDimension()}`);
    }
    
    const actions: MajiangAction[] = [];
    
    // 解码打牌动作 (0-33)
    const discardActions = this.decodeDiscardActions(
      networkOutput.slice(0, this.TILE_TYPES),
      gameState,
      currentPlayer
    );
    actions.push(...discardActions);
    
    // 解码特殊动作 (34-38)
    const specialActions = this.decodeSpecialActions(
      networkOutput.slice(this.TILE_TYPES, this.TILE_TYPES + this.SPECIAL_ACTIONS),
      gameState,
      currentPlayer
    );
    actions.push(...specialActions);
    
    // 按概率排序
    actions.sort((a, b) => b.probability - a.probability);
    
    return actions;
  }
  
  /**
   * 解码打牌动作 (34维)
   */
  private static decodeDiscardActions(
    discardProbs: Float32Array,
    gameState: GameState,
    currentPlayer: Player
  ): MajiangAction[] {
    const actions: MajiangAction[] = [];
    const handTiles = currentPlayer.getHandTiles();
    
    // 统计手牌中每种牌的数量
    const tileCounts = new Map<string, number>();
    const tileInstances = new Map<string, Tile[]>();
    
    handTiles.forEach(tile => {
      const key = this.getTileKey(tile);
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
      if (!tileInstances.has(key)) {
        tileInstances.set(key, []);
      }
      tileInstances.get(key)!.push(tile);
    });
    
    // 为每种可打出的牌创建动作
    for (let i = 0; i < this.TILE_TYPES; i++) {
      const tileKey = this.getTileKeyByIndex(i);
      if (tileKey && tileCounts.has(tileKey)) {
        const tile = tileInstances.get(tileKey)![0]; // 取第一张同类牌
        const probability = this.applySoftmax(discardProbs[i]);
        
        actions.push({
          type: 'DISCARD',
          tile,
          tileIndex: i,
          probability,
          isValid: this.isDiscardValid(tile, gameState, currentPlayer)
        });
      }
    }
    
    return actions;
  }
  
  /**
   * 解码特殊动作 (5维)
   */
  private static decodeSpecialActions(
    specialProbs: Float32Array,
    gameState: GameState,
    currentPlayer: Player
  ): MajiangAction[] {
    const actions: MajiangAction[] = [];
    const actionTypes: Array<'CHI' | 'PENG' | 'GANG' | 'HU' | 'PASS'> = ['CHI', 'PENG', 'GANG', 'HU', 'PASS'];
    
    actionTypes.forEach((actionType, index) => {
      const probability = this.applySoftmax(specialProbs[index]);
      const isValid = this.isSpecialActionValid(actionType, gameState, currentPlayer);
      
      actions.push({
        type: actionType,
        probability,
        isValid
      });
    });
    
    return actions;
  }
  
  /**
   * 检查打牌动作是否有效
   */
  private static isDiscardValid(
    tile: Tile,
    gameState: GameState,
    currentPlayer: Player
  ): boolean {
    const handTiles = currentPlayer.getHandTiles();
    
    // 检查手牌中是否有这张牌
    const hasTile = handTiles.some(t => 
      t.type === tile.type && t.value === tile.value
    );
    
    if (!hasTile) {
      return false;
    }
    
    // 检查是否是当前玩家的回合
    const currentPlayerIndex = gameState.getCurrentPlayerIndex();
    const players = gameState.getPlayers();
    const isCurrentTurn = players[currentPlayerIndex] === currentPlayer;
    
    if (!isCurrentTurn) {
      return false;
    }
    
    // 检查玩家状态
    if (currentPlayer.getStatus() !== 'ACTING') {
      return false;
    }
    
    // 检查手牌数量（打牌前应该是14张）
    const totalTiles = handTiles.length + 
      currentPlayer.getRevealedSets().reduce((sum, set) => sum + set.tiles.length, 0);
    
    return totalTiles === 14;
  }
  
  /**
   * 检查特殊动作是否有效
   */
  private static isSpecialActionValid(
    actionType: 'CHI' | 'PENG' | 'GANG' | 'HU' | 'PASS',
    gameState: GameState,
    currentPlayer: Player
  ): boolean {
    const handTiles = currentPlayer.getHandTiles();
    const lastDiscardedTile = gameState.getLastDiscardedTile();
    
    switch (actionType) {
      case 'CHI':
        return this.canChi(handTiles, lastDiscardedTile, gameState, currentPlayer);
      
      case 'PENG':
        return this.canPeng(handTiles, lastDiscardedTile);
      
      case 'GANG':
        return this.canGang(handTiles, lastDiscardedTile, currentPlayer);
      
      case 'HU':
        return this.canHu(handTiles, lastDiscardedTile, currentPlayer);
      
      case 'PASS':
        return true; // 过牌总是有效的
      
      default:
        return false;
    }
  }
  
  /**
   * 检查是否可以吃牌
   */
  private static canChi(
    handTiles: Tile[],
    targetTile: Tile | null,
    gameState: GameState,
    currentPlayer: Player
  ): boolean {
    if (!targetTile) return false;
    
    // 只能吃上家的牌
    const players = gameState.getPlayers();
    const currentIndex = players.indexOf(currentPlayer);
    const lastPlayerIndex = gameState.getLastDiscardPlayerIndex();
    const expectedPrevIndex = (currentIndex - 1 + players.length) % players.length;
    
    if (lastPlayerIndex !== expectedPrevIndex) {
      return false;
    }
    
    // 只能吃数字牌（万条筒）
    if (targetTile.type === TileType.FENG || targetTile.type === TileType.JIAN) {
      return false;
    }
    
    // 检查是否有相邻的牌可以组成顺子
    const sameTypeTiles = handTiles.filter(t => t.type === targetTile.type);
    const values = sameTypeTiles.map(t => t.value).sort((a, b) => a - b);
    
    // 检查是否可以组成顺子
    const targetValue = targetTile.value;
    
    // 检查 [target-2, target-1, target] 或 [target-1, target, target+1] 或 [target, target+1, target+2]
    const patterns = [
      [targetValue - 2, targetValue - 1], // 吃左边
      [targetValue - 1, targetValue + 1], // 吃中间
      [targetValue + 1, targetValue + 2]  // 吃右边
    ];
    
    return patterns.some(pattern => 
      pattern.every(val => val >= 1 && val <= 9 && values.includes(val))
    );
  }
  
  /**
   * 检查是否可以碰牌
   */
  private static canPeng(handTiles: Tile[], targetTile: Tile | null): boolean {
    if (!targetTile) return false;
    
    // 检查手牌中是否有至少2张相同的牌
    const sameTypeTiles = handTiles.filter(t => 
      t.type === targetTile.type && t.value === targetTile.value
    );
    
    return sameTypeTiles.length >= 2;
  }
  
  /**
   * 检查是否可以杠牌
   */
  private static canGang(
    handTiles: Tile[],
    targetTile: Tile | null,
    currentPlayer: Player
  ): boolean {
    if (!targetTile) {
      // 检查暗杠：手牌中是否有4张相同的牌
      const tileCounts = new Map<string, number>();
      handTiles.forEach(tile => {
        const key = this.getTileKey(tile);
        tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
      });
      
      return Array.from(tileCounts.values()).some(count => count >= 4);
    } else {
      // 检查明杠：手牌中是否有3张相同的牌
      const sameTypeTiles = handTiles.filter(t => 
        t.type === targetTile.type && t.value === targetTile.value
      );
      
      return sameTypeTiles.length >= 3;
    }
  }
  
  /**
   * 检查是否可以胡牌
   */
  private static canHu(
    handTiles: Tile[],
    targetTile: Tile | null,
    currentPlayer: Player
  ): boolean {
    // 简化的胡牌判断 - 实际应该调用完整的胡牌判定逻辑
    const revealedSets = currentPlayer.getRevealedSets();
    const totalTiles = handTiles.length + 
      revealedSets.reduce((sum, set) => sum + set.tiles.length, 0) +
      (targetTile ? 1 : 0);
    
    // 基本条件：总牌数为14张
    if (totalTiles !== 14) {
      return false;
    }
    
    // 这里应该调用完整的胡牌判定逻辑
    // 暂时返回false，等待集成完整的胡牌判定
    return false;
  }
  
  /**
   * 应用Softmax激活函数
   */
  private static applySoftmax(value: number): number {
    return Math.exp(value) / (Math.exp(value) + 1);
  }
  
  /**
   * 获取牌的唯一标识
   */
  private static getTileKey(tile: Tile): string {
    return `${tile.type}${tile.value}`;
  }
  
  /**
   * 根据索引获取牌的标识
   */
  private static getTileKeyByIndex(index: number): string | null {
    // 万子牌: 万1-万9 (0-8)
    if (index >= 0 && index <= 8) {
      return `万${index + 1}`;
    }
    
    // 条子牌: 条1-条9 (9-17)
    if (index >= 9 && index <= 17) {
      return `条${index - 8}`;
    }
    
    // 筒子牌: 筒1-筒9 (18-26)
    if (index >= 18 && index <= 26) {
      return `筒${index - 17}`;
    }
    
    // 风牌: 东南西北 (27-30)
    if (index >= 27 && index <= 30) {
      return `风${index - 26}`;
    }
    
    // 箭牌: 中发白 (31-33)
    if (index >= 31 && index <= 33) {
      return `箭${index - 30}`;
    }
    
    return null;
  }
  
  /**
   * 获取动作空间维度
   */
  public static getActionDimension(): number {
    return this.TILE_TYPES + this.SPECIAL_ACTIONS; // 34 + 5 = 39
  }
  
  /**
   * 选择最佳有效动作
   */
  public static selectBestValidAction(actions: MajiangAction[]): MajiangAction | null {
    const validActions = actions.filter(action => action.isValid);
    
    if (validActions.length === 0) {
      return null;
    }
    
    // 返回概率最高的有效动作
    return validActions[0];
  }
  
  /**
   * 应用温度参数进行动作采样
   */
  public static sampleAction(actions: MajiangAction[], temperature: number = 1.0): MajiangAction | null {
    const validActions = actions.filter(action => action.isValid);
    
    if (validActions.length === 0) {
      return null;
    }
    
    if (temperature === 0) {
      // 贪婪选择
      return validActions[0];
    }
    
    // 应用温度参数
    const adjustedProbs = validActions.map(action => 
      Math.exp(Math.log(action.probability) / temperature)
    );
    
    const sum = adjustedProbs.reduce((a, b) => a + b, 0);
    const normalizedProbs = adjustedProbs.map(prob => prob / sum);
    
    // 轮盘赌选择
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < validActions.length; i++) {
      cumulative += normalizedProbs[i];
      if (random <= cumulative) {
        return validActions[i];
      }
    }
    
    return validActions[validActions.length - 1];
  }
}