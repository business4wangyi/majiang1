import { Tile, sortTiles } from './tile';
import { TileSet } from './rule-types';
import { Style } from './display';
import { debugLog, errorLog } from './logger';

// 玩家状态
export enum PlayerState {
  WAITING,    // 等待回合
  ACTING,     // 行动中
  FINISHED,   // 已完成回合
  WON         // 胡牌获胜
}

// 玩家类型
export enum PlayerType {
  HUMAN,   // 人类玩家
  AI       // AI玩家
}

// 玩家类
export class Player {
  // 手牌
  handTiles: Tile[] = [];
  // 已打出的牌
  discardedTiles: Tile[] = [];
  // 已亮出的牌组（吃碰杠）
  revealedSets: TileSet[] = [];
  // 花牌集合
  flowerTiles: Tile[] = [];
  // 当前状态
  state: PlayerState = PlayerState.WAITING;
  // 最后摸到的牌
  lastDrawnTile: Tile | null = null;
  // 分数
  score: number = 0;
  
  constructor(
    public id: number,
    public name: string,
    public type: PlayerType
  ) {}

  // 添加一张牌到手牌
  drawTile(tile: Tile): void {
    if (!tile) {
      debugLog(`警告: 玩家 ${this.name} 尝试摸一张无效的牌`);
      return;
    }
    
    // 记录操作前手牌数量
    const beforeCount = this.handTiles.length;
    
    this.lastDrawnTile = tile;
    this.handTiles.push(tile);
    
    // 验证操作后手牌数量
    if (this.handTiles.length !== beforeCount + 1) {
      debugLog(`警告: 摸牌后手牌数量异常，预期: ${beforeCount + 1}，实际: ${this.handTiles.length}`);
    }
    
    this.sortHand();
  }

  // 整理手牌（排序）
  sortHand(): void {
    this.handTiles = sortTiles(this.handTiles);
  }

  // 打出一张牌
  discardTile(tileIndex: number): Tile {
    debugLog(`玩家${this.name}尝试打出索引${tileIndex}的牌，当前手牌数量: ${this.handTiles.length}`);
    
    // 如果手牌为空，无法打出
    if (this.handTiles.length === 0) {
      errorLog(`错误: 玩家${this.name}没有手牌可出`);
      errorLog(`游戏错误，排查原因`);
      process.exit(0)
    }

    // 验证索引是否有效（加强验证和错误处理）
    if (tileIndex === undefined || tileIndex === null) {
      errorLog(`严重错误: 出牌索引为undefined或null`);
      process.exit(0);
    }
    
    // 索引范围检查与修正（对所有玩家类型都进行修正）
    if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
      debugLog(`无效的出牌索引: ${tileIndex}，有效范围: 0-${this.handTiles.length-1}`);
      
      // 无论是AI还是人类玩家，都修正为最后一张牌的索引
      // 修正为最后一张牌的索引
      const correctedIndex = Math.min(this.handTiles.length - 1, Math.max(0, tileIndex));
      debugLog(`索引修正为: ${correctedIndex}`);
      tileIndex = correctedIndex;
    }
    
    // 再次验证索引有效
    if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
      errorLog(`严重错误: 索引修正后仍然无效: ${tileIndex}`);
      process.exit(1);
    }

        // 确保选择的牌有效
    if (!this.handTiles[tileIndex]) {
      errorLog(`错误: 索引${tileIndex}处的牌无效`);
      process.exit(0);
    }
    
    try {
      // 克隆要打出的牌，确保有一个安全的副本
      const tileToDiscard = this.handTiles[tileIndex].clone();
      
      // 使用splice安全地从手牌中移除这张牌
      const discarded = this.handTiles.splice(tileIndex, 1)[0];
      
      // 如果splice返回了undefined或null，使用之前克隆的牌作为备份
      if (!discarded) {
        debugLog(`警告: splice操作未返回牌，使用克隆的备份`);
        
        // 添加到弃牌区域
        this.discardedTiles.push(tileToDiscard);
        this.lastDrawnTile = null;
        
        return tileToDiscard;
      }
      
      // 常规流程：添加到弃牌区域并返回
      this.discardedTiles.push(discarded);
      this.lastDrawnTile = null;
      
      debugLog(`玩家 ${this.name} 成功打出: ${discarded.toString()}`);
      return discarded;
    } catch (error) {
      errorLog(`打牌过程发生错误: ${error instanceof Error ? error.message : String(error)}`);
      errorLog(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
      errorLog(`退出游戏排查问题`);
      // 不再使用任何非标准的备用方法，而是直接返回失败
      debugLog(`出牌失败，玩家状态可能不一致`);
      process.exit(0)
    }
  }

  // 吃牌
  chi(tiles: Tile[], targetTile: Tile): boolean {
    // 确保tiles中的牌在手牌中
    for (const tile of tiles) {
      const index = this.handTiles.findIndex(t => t.id === tile.id);
      if (index === -1) {
        return false;
      }
    }
    
    // 从手牌中移除这些牌
    for (const tile of tiles) {
      const index = this.handTiles.findIndex(t => t.id === tile.id);
      this.handTiles.splice(index, 1);
    }
    
    // 添加到已亮出的牌组
    this.revealedSets.push({
      type: 'CHI',
      tiles: [...tiles, targetTile]
    });
    
    return true;
  }
  
  // 碰牌
  peng(targetTile: Tile): boolean {
    // 找到手牌中相同的两张牌
    const sameTiles = this.handTiles.filter(t => t.equals(targetTile)).slice(0, 2);
    if (sameTiles.length < 2) {
      return false;
    }
    
    // 从手牌中移除这两张牌
    for (const tile of sameTiles) {
      const index = this.handTiles.findIndex(t => t.id === tile.id);
      if (index !== -1) {
        this.handTiles.splice(index, 1);
      }
    }
    
    // 添加到已亮出的牌组
    this.revealedSets.push({
      type: 'PENG',
      tiles: [...sameTiles, targetTile]
    });
    
    return true;
  }
  
  // 杠牌
  gang(targetTile: Tile | null): boolean {
    if (targetTile) {
      // 明杠：需要手里有三张相同的牌
      const sameTiles = this.handTiles.filter(t => t.equals(targetTile)).slice(0, 3);
      if (sameTiles.length < 3) {
        debugLog(`明杠失败: 手牌中没有足够的牌 (有${sameTiles.length}张, 需要3张)`);
        return false;
      }
      
      // 从手牌中移除这三张牌
      for (const tile of sameTiles) {
        const index = this.handTiles.findIndex(t => t.id === tile.id);
        if (index !== -1) {
          this.handTiles.splice(index, 1);
        }
      }
      
      // 添加到已亮出的牌组，并标记为明杠
      // 注意：虽然在UI上是四张牌，但实际上在计算总牌数时，我们需要确保不会重复计数
      // 以防止重复计数或引用同一个对象
      this.revealedSets.push({
        type: 'GANG',
        tiles: [...sameTiles, targetTile],
        source: 'ming' // 明杠
      });
      
      return true;
    } else {
      // 暗杠或补杠：检查手牌中有没有四张相同的牌
      // 统计每种牌的数量
      const countMap = new Map<string, Tile[]>();
      for (const tile of this.handTiles) {
        const key = `${tile.type}_${tile.value}`;
        if (!countMap.has(key)) {
          countMap.set(key, []);
        }
        countMap.get(key)!.push(tile);
      }
      
      // 找到第一组有四张的牌
      for (const [_, tiles] of countMap) {
        if (tiles.length === 4) {
          // 暗杠
          // 从手牌中移除这四张牌
          const tileIds = tiles.map(t => t.id);
          this.handTiles = this.handTiles.filter(t => !tileIds.includes(t.id));
          
          // 添加到已亮出的牌组，并标记为暗杠
          this.revealedSets.push({
            type: 'GANG',
            tiles: [...tiles],
            source: 'an' // 暗杠
          });
          
          return true;
        }
      }
      
      // 检查补杠：已经碰了的牌，手里有第四张
      for (const set of this.revealedSets) {
        if (set.type === 'PENG') {
          const pengTile = set.tiles[0];
          const fourthTile = this.handTiles.find(t => t.equals(pengTile));
          
          if (fourthTile) {
            // 从手牌中移除这张牌
            const index = this.handTiles.findIndex(t => t.id === fourthTile.id);
            if (index !== -1) {
              this.handTiles.splice(index, 1);
            }
            
            // 修改已有的碰牌组为杠，并标记为补杠
            set.type = 'GANG';
            set.tiles.push(fourthTile);
            set.source = 'bu'; // 补杠
            
            return true;
          }
        }
      }
      
      return false;
    }
  }

  // 获取手牌的字符串表示
  getHandString(): string {
    return this.handTiles.map((tile, index) => {
      // 特别标记最后摸到的牌
      const isLastDrawn = this.lastDrawnTile && tile.id === this.lastDrawnTile.id;
      if (isLastDrawn) {
        // 使用Style添加颜色高亮，更醒目地标记新牌
        return `${index + 1}:${Style.BOLD}${Style.YELLOW}${tile.toString()}${Style.RESET}`;
      } else {
        return `${index + 1}:${tile.toString()}`;
      }
    }).join(' ');
  }

  // 获取弃牌的字符串表示
  getDiscardedString(): string {
    return this.discardedTiles.map(tile => tile.toString()).join(' ');
  }
  
  // 获取已亮出牌组的字符串表示
  getRevealedSetsString(): string {
    if (this.revealedSets.length === 0) {
      return '无';
    }
    
    return this.revealedSets.map(set => {
      const typeText = set.type === 'CHI' ? '吃' : (set.type === 'PENG' ? '碰' : '杠');
      return `${typeText}[${set.tiles.map(t => t.toString()).join(',')}]`;
    }).join(' ');
  }

  // 玩家简单策略：摸到的牌
  getRandomMove(): number {
    // 打出最后摸到的牌Index
    return this.handTiles.length - 1
  }

  /**
   * 计算玩家当前应该拥有的手牌数量（不包括已亮出的牌组）
   * 考虑吃碰杠的影响：
   * - 杠：每个杠会增加1张额外的牌
   * - 吃：会减少2张手牌（1张来自其他玩家）
   * - 碰：会减少2张手牌（1张来自其他玩家）
   * @param isMahjong 是否在判断和牌状态，和牌时基础牌数为14张
   * @returns 预期的手牌数量
   */
  public getExpectedHandSize(isMahjong: boolean = false): number {
    // 基础应有牌数，正常为13张，摸牌/准备胡牌时为14张
    const baseHandSize = isMahjong ? 14 : 13;
    
    // 杠会增加一张牌(3张手牌+1张额外的)
    const gangCount = this.getGangCount();
    
    // 吃和碰都会各减少3张手牌
    const chiCount = this.revealedSets.filter(set => set.type === 'CHI').length;
    const pengCount = this.revealedSets.filter(set => set.type === 'PENG').length;
    
    // 调整预期手牌数量
    return baseHandSize - (gangCount * 3) - (chiCount * 3) - (pengCount * 3);
  }

  /**
   * 计算玩家实际持有的总牌数（手牌+已亮出的牌组）
   * 注意：对于明杠、暗杠和补杠，要正确计算牌的数量
   * @returns 总牌数
   */
  public getTotalTileCount(): number {
    const handTileCount = this.handTiles.length;
    
    // 计算已亮出牌组的牌数，需要考虑不同类型的亮牌
    let revealedTileCount = 0;
    
    for (const set of this.revealedSets) {
      if (set.type === 'CHI') {
        // 吃：2张自己的 + 1张别人的
        revealedTileCount += 3;
      } else if (set.type === 'PENG') {
        // 碰：2张自己的 + 1张别人的
        revealedTileCount += 3;
      } else if (set.type === 'GANG') {
        if (set.source === 'ming') {
          // 明杠：3张自己的 + 1张别人的
          revealedTileCount += 4;
        } else if (set.source === 'an') {
          // 暗杠：4张都是自己的
          revealedTileCount += 4;
        } else if (set.source === 'bu') {
          // 补杠：之前碰了3张（2自己+1别人），现在加上自己的1张
          revealedTileCount += 4;
        } else {
          // 未指定来源的杠，按4张计算
          revealedTileCount += 4;
        }
      }
    }
    
    return handTileCount + revealedTileCount;
  }

  /**
   * 获取玩家已杠的牌副数
   * @returns 杠牌副数
   */
  public getGangCount(): number {
    return this.revealedSets.filter(set => set.type === 'GANG').length;
  }

  /**
   * 判断玩家当前手牌数量是否合理
   * @param isMahjong 是否在判断和牌状态
   * @returns 手牌数量是否合理
   */
  public hasValidHandSize(isMahjong: boolean = false): boolean {
    // 获取预期的手牌数量
    const expectedHandSize = this.getExpectedHandSize(isMahjong);
    
    // 检查实际手牌数量是否符合预期
    // 常规情况：手牌数 = 预期数 或 预期数+1（刚摸牌）
    // 和牌判断：需要考虑总牌数
    if (isMahjong) {
      // 和牌状态下比较总牌数
      const totalTileCount = this.getTotalTileCount();
      return totalTileCount === expectedHandSize || totalTileCount === expectedHandSize + 1;
    } else {
      // 常规状态下只比较手牌数
      return this.handTiles.length === expectedHandSize || this.handTiles.length === expectedHandSize + 1;
    }
  }

  /**
   * 判断玩家是否需要打出一张牌
   * @returns 是否需要打出一张牌
   */
  public needsToDiscard(): boolean {
    const expectedHandSize = this.getExpectedHandSize(false);
    // 如果手牌数量超过预期，需要打出
    return (this.handTiles.length + this.revealedSets.length) > expectedHandSize;
  }
} 