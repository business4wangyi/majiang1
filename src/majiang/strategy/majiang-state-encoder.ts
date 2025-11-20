/**
 * 麻将状态编码器 - 将麻将游戏状态转换为320维神经网络输入向量
 * 基于AlphaZero传说级技术栈，适配广东麻将规则
 */

import { Tile, TileType, Player, GameState } from './types';

export interface MajiangStateVector {
  // 手牌编码 (34×4 = 136维) - 每种牌的数量分布
  handTiles: Float32Array;
  
  // 可见信息编码 (34×4 = 136维) - 打出牌 + 明牌
  visibleTiles: Float32Array;
  
  // 玩家状态编码 (4×8 = 32维) - 每个玩家的基础状态
  playerStates: Float32Array;
  
  // 游戏状态编码 (16维) - 风圈、局数、剩余牌数等
  gameContext: Float32Array;
  
  // 总维度：320维输入向量
}

export class MajiangStateEncoder {
  private static readonly TILE_TYPES = 34; // 万条筒风箭牌总类型数
  private static readonly MAX_SAME_TILES = 4; // 每种牌最多4张
  private static readonly PLAYER_COUNT = 4; // 4人麻将
  private static readonly PLAYER_STATE_DIM = 8; // 每个玩家状态维度
  private static readonly GAME_CONTEXT_DIM = 16; // 游戏上下文维度
  
  /**
   * 将麻将游戏状态编码为320维向量
   */
  public static encode(gameState: GameState, currentPlayer: Player): MajiangStateVector {
    const handTiles = new Float32Array(this.TILE_TYPES * this.MAX_SAME_TILES);
    const visibleTiles = new Float32Array(this.TILE_TYPES * this.MAX_SAME_TILES);
    const playerStates = new Float32Array(this.PLAYER_COUNT * this.PLAYER_STATE_DIM);
    const gameContext = new Float32Array(this.GAME_CONTEXT_DIM);
    
    // 编码手牌信息
    this.encodeHandTiles(currentPlayer, handTiles);
    
    // 编码可见信息（打出牌 + 明牌）
    this.encodeVisibleTiles(gameState, visibleTiles);
    
    // 编码玩家状态
    this.encodePlayerStates(gameState, currentPlayer, playerStates);
    
    // 编码游戏上下文
    this.encodeGameContext(gameState, gameContext);
    
    return {
      handTiles,
      visibleTiles,
      playerStates,
      gameContext
    };
  }
  
  /**
   * 编码当前玩家手牌 (136维)
   */
  private static encodeHandTiles(player: Player, output: Float32Array): void {
    const handTiles = player.getHandTiles();
    const revealedSets = player.getRevealedSets();
    
    // 统计手牌中每种牌的数量
    const tileCounts = new Map<string, number>();
    
    // 统计暗牌
    handTiles.forEach(tile => {
      const key = this.getTileKey(tile);
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
    });
    
    // 统计明牌
    revealedSets.forEach(set => {
      set.tiles.forEach(tile => {
        const key = this.getTileKey(tile);
        tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
      });
    });
    
    // 将统计结果编码到向量中
    tileCounts.forEach((count, tileKey) => {
      const tileIndex = this.getTileIndex(tileKey);
      if (tileIndex >= 0 && tileIndex < this.TILE_TYPES) {
        // 使用one-hot编码表示数量 [0,1,2,3,4]
        for (let i = 0; i < Math.min(count, this.MAX_SAME_TILES); i++) {
          output[tileIndex * this.MAX_SAME_TILES + i] = 1.0;
        }
      }
    });
  }
  
  /**
   * 编码可见信息 (136维)
   */
  private static encodeVisibleTiles(gameState: GameState, output: Float32Array): void {
    const players = gameState.getPlayers();
    const tileCounts = new Map<string, number>();
    
    // 统计所有玩家的弃牌
    players.forEach(player => {
      const discardedTiles = player.getDiscardedTiles();
      discardedTiles.forEach(tile => {
        const key = this.getTileKey(tile);
        tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
      });
      
      // 统计明牌
      const revealedSets = player.getRevealedSets();
      revealedSets.forEach(set => {
        set.tiles.forEach(tile => {
          const key = this.getTileKey(tile);
          tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
        });
      });
    });
    
    // 编码到向量中
    tileCounts.forEach((count, tileKey) => {
      const tileIndex = this.getTileIndex(tileKey);
      if (tileIndex >= 0 && tileIndex < this.TILE_TYPES) {
        for (let i = 0; i < Math.min(count, this.MAX_SAME_TILES); i++) {
          output[tileIndex * this.MAX_SAME_TILES + i] = 1.0;
        }
      }
    });
  }
  
  /**
   * 编码玩家状态 (32维)
   */
  private static encodePlayerStates(gameState: GameState, currentPlayer: Player, output: Float32Array): void {
    const players = gameState.getPlayers();
    const currentPlayerIndex = players.indexOf(currentPlayer);
    
    players.forEach((player, index) => {
      const baseIndex = index * this.PLAYER_STATE_DIM;
      
      // 相对位置编码 (当前玩家为0，下家为1，对家为2，上家为3)
      const relativePosition = (index - currentPlayerIndex + this.PLAYER_COUNT) % this.PLAYER_COUNT;
      output[baseIndex] = relativePosition / (this.PLAYER_COUNT - 1); // 归一化到[0,1]
      
      // 手牌数量
      output[baseIndex + 1] = player.getHandTiles().length / 14.0; // 归一化
      
      // 明牌数量
      const revealedCount = player.getRevealedSets().reduce((sum, set) => sum + set.tiles.length, 0);
      output[baseIndex + 2] = revealedCount / 12.0; // 最多12张明牌
      
      // 弃牌数量
      output[baseIndex + 3] = player.getDiscardedTiles().length / 20.0; // 估计最多20张弃牌
      
      // 是否是当前玩家
      output[baseIndex + 4] = (index === currentPlayerIndex) ? 1.0 : 0.0;
      
      // 玩家状态 (WAITING=0, ACTING=1)
      output[baseIndex + 5] = (player.getStatus() === 'ACTING') ? 1.0 : 0.0;
      
      // 听牌状态 (简化判断)
      const isListening = this.isPlayerListening(player);
      output[baseIndex + 6] = isListening ? 1.0 : 0.0;
      
      // 危险度评估 (基于弃牌分析)
      const dangerLevel = this.calculateDangerLevel(player);
      output[baseIndex + 7] = dangerLevel;
    });
  }
  
  /**
   * 编码游戏上下文 (16维)
   */
  private static encodeGameContext(gameState: GameState, output: Float32Array): void {
    // 当前局数
    output[0] = gameState.getCurrentRound() / 4.0; // 假设最多4局
    
    // 当前玩家索引
    output[1] = gameState.getCurrentPlayerIndex() / 3.0; // 0-3归一化
    
    // 剩余牌数
    const remainingTiles = gameState.getRemainingTilesCount();
    output[2] = remainingTiles / 136.0; // 总牌数136
    
    // 游戏阶段 (开局=0, 中局=0.5, 终局=1.0)
    const gamePhase = this.calculateGamePhase(gameState);
    output[3] = gamePhase;
    
    // 风圈 (东风=0, 南风=0.33, 西风=0.67, 北风=1.0)
    output[4] = 0.0; // 简化为东风局
    
    // 庄家位置
    output[5] = 0.0; // 简化为东家做庄
    
    // 连庄次数
    output[6] = 0.0; // 简化处理
    
    // 是否有人听牌
    const hasListeningPlayer = gameState.getPlayers().some(p => this.isPlayerListening(p));
    output[7] = hasListeningPlayer ? 1.0 : 0.0;
    
    // 最近打出的牌类型
    const lastDiscardedTile = gameState.getLastDiscardedTile();
    if (lastDiscardedTile) {
      const tileIndex = this.getTileIndex(this.getTileKey(lastDiscardedTile));
      output[8] = tileIndex / (this.TILE_TYPES - 1); // 归一化
    }
    
    // 预留维度 (9-15) 用于未来扩展
    for (let i = 9; i < this.GAME_CONTEXT_DIM; i++) {
      output[i] = 0.0;
    }
  }
  
  /**
   * 获取牌的唯一标识
   */
  private static getTileKey(tile: Tile): string {
    return `${tile.type}${tile.value}`;
  }
  
  /**
   * 获取牌在编码中的索引 (0-33)
   */
  private static getTileIndex(tileKey: string): number {
    // 万子牌: 万1-万9 (0-8)
    if (tileKey.startsWith('万')) {
      const value = parseInt(tileKey.substring(1));
      return value - 1;
    }
    
    // 条子牌: 条1-条9 (9-17)
    if (tileKey.startsWith('条')) {
      const value = parseInt(tileKey.substring(1));
      return 8 + value;
    }
    
    // 筒子牌: 筒1-筒9 (18-26)
    if (tileKey.startsWith('筒')) {
      const value = parseInt(tileKey.substring(1));
      return 17 + value;
    }
    
    // 风牌: 东南西北 (27-30)
    if (tileKey.startsWith('风')) {
      const value = parseInt(tileKey.substring(1));
      return 26 + value;
    }
    
    // 箭牌: 中发白 (31-33)
    if (tileKey.startsWith('箭')) {
      const value = parseInt(tileKey.substring(1));
      return 30 + value;
    }
    
    return -1; // 无效牌
  }
  
  /**
   * 简化的听牌判断
   */
  private static isPlayerListening(player: Player): boolean {
    const handTiles = player.getHandTiles();
    const revealedSets = player.getRevealedSets();
    
    // 简化判断：手牌数量接近胡牌要求
    const totalTiles = handTiles.length + revealedSets.reduce((sum, set) => sum + set.tiles.length, 0);
    return totalTiles >= 13; // 13张牌时可能听牌
  }
  
  /**
   * 计算玩家危险度
   */
  private static calculateDangerLevel(player: Player): number {
    const discardedTiles = player.getDiscardedTiles();
    const handTiles = player.getHandTiles();
    
    // 基于弃牌和手牌数量的简化危险度计算
    const discardRatio = discardedTiles.length / 20.0;
    const handRatio = handTiles.length / 14.0;
    
    return Math.min(1.0, discardRatio + (1.0 - handRatio));
  }
  
  /**
   * 计算游戏阶段
   */
  private static calculateGamePhase(gameState: GameState): number {
    const remainingTiles = gameState.getRemainingTilesCount();
    const totalTiles = 136;
    const usedTiles = totalTiles - remainingTiles;
    
    // 开局: 0-40张牌 -> 0-0.3
    // 中局: 40-80张牌 -> 0.3-0.7  
    // 终局: 80-136张牌 -> 0.7-1.0
    return Math.min(1.0, usedTiles / totalTiles);
  }
  
  /**
   * 获取完整的状态向量维度
   */
  public static getStateDimension(): number {
    return (this.TILE_TYPES * this.MAX_SAME_TILES * 2) + // handTiles + visibleTiles
           (this.PLAYER_COUNT * this.PLAYER_STATE_DIM) +   // playerStates
           this.GAME_CONTEXT_DIM;                          // gameContext
  }
  
  /**
   * 将状态向量转换为扁平数组
   */
  public static flatten(stateVector: MajiangStateVector): Float32Array {
    const totalDim = this.getStateDimension();
    const result = new Float32Array(totalDim);
    
    let offset = 0;
    
    // 复制手牌编码
    result.set(stateVector.handTiles, offset);
    offset += stateVector.handTiles.length;
    
    // 复制可见信息编码
    result.set(stateVector.visibleTiles, offset);
    offset += stateVector.visibleTiles.length;
    
    // 复制玩家状态编码
    result.set(stateVector.playerStates, offset);
    offset += stateVector.playerStates.length;
    
    // 复制游戏上下文编码
    result.set(stateVector.gameContext, offset);
    
    return result;
  }
}