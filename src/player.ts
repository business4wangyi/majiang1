import { Tile, sortTiles } from './tile';
import { TileSet } from './rules';

// 玩家状态
export enum PlayerState {
  WAITING,    // 等待回合
  ACTING,     // 行动中
  FINISHED    // 已完成回合
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
    this.lastDrawnTile = tile;
    this.handTiles.push(tile);
    this.sortHand();
  }

  // 整理手牌（排序）
  sortHand(): void {
    this.handTiles = sortTiles(this.handTiles);
  }

  // 打出一张牌
  discardTile(tileIndex: number): Tile | null {
    console.log(`玩家${this.name}尝试打出索引${tileIndex}的牌，当前手牌数量: ${this.handTiles.length}`);
    
    // 如果手牌为空，无法打出
    if (this.handTiles.length === 0) {
      console.log(`错误: 玩家${this.name}没有手牌可出`);
      return null;
    }
    
    // 索引范围检查与修正
    if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
      console.log(`错误: 索引${tileIndex}超出范围(0-${this.handTiles.length-1})`);
      
      // 对于AI玩家且手牌超过13张的情况，特殊处理
      if (this.type === PlayerType.AI && this.handTiles.length > 13) {
        // 修正为最后一张牌的索引
        const correctedIndex = this.handTiles.length - 1;
        console.log(`AI玩家手牌>13，自动修正索引: ${tileIndex} -> ${correctedIndex}`);
        tileIndex = correctedIndex;
      } else {
        return null;
      }
    }
    
    // 再次验证索引有效
    if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
      console.log(`严重错误: 索引修正后仍然无效: ${tileIndex}`);
      return null;
    }
    
    // 特殊处理：确保选中的牌存在
    if (!this.handTiles[tileIndex]) {
      console.log(`错误: 索引${tileIndex}处的牌不存在`);
      
      // 对于AI玩家，尝试找到一个有效的牌
      if (this.type === PlayerType.AI) {
        // 从最后一张开始查找有效的牌
        for (let i = this.handTiles.length - 1; i >= 0; i--) {
          if (this.handTiles[i]) {
            console.log(`找到有效替代牌，索引: ${i}`);
            tileIndex = i;
            break;
          }
        }
        
        // 再次检查修正后的索引是否有效
        if (!this.handTiles[tileIndex]) {
          console.log(`严重错误: 无法找到有效的替代牌`);
          return null;
        }
      } else {
        return null;
      }
    }
    
    try {
      // 从手牌中移除并获取这张牌
      const discarded = this.handTiles.splice(tileIndex, 1)[0];
      if (!discarded) {
        console.log(`严重错误: splice操作后未获取到牌`);
        
        // 对于AI玩家且手牌超过13张的情况，强制移除一张牌
        if (this.type === PlayerType.AI && this.handTiles.length > 13) {
          console.log(`强制移除AI玩家最后一张牌`);
          const forcedDiscard = this.handTiles.pop();
          if (forcedDiscard) {
            this.discardedTiles.push(forcedDiscard);
            this.lastDrawnTile = null;
            return forcedDiscard;
          }
        }
        
        return null;
      }
      
      // 正常流程：添加到弃牌区并返回
      console.log(`玩家${this.name}成功打出了${discarded.toString()}`);
      this.discardedTiles.push(discarded);
      this.lastDrawnTile = null; // 重置最后摸到的牌
      return discarded;
    } catch (error) {
      console.error(`打牌过程发生错误: ${error instanceof Error ? error.message : String(error)}`);
      
      // 异常恢复：对于AI玩家且手牌超过13张的情况
      if (this.type === PlayerType.AI && this.handTiles.length > 13) {
        try {
          console.log(`异常恢复: 尝试强制移除AI玩家最后一张牌`);
          const emergencyDiscard = this.handTiles.pop();
          if (emergencyDiscard) {
            this.discardedTiles.push(emergencyDiscard);
            this.lastDrawnTile = null;
            return emergencyDiscard;
          }
        } catch (e) {
          console.error(`异常恢复也失败: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      return null;
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
        console.log(`明杠失败: 手牌中没有足够的牌 (有${sameTiles.length}张, 需要3张)`);
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
      // targetTile是从另一个玩家的弃牌中移除的，因此我们需要使用其克隆版本
      // 以防止重复计数或引用同一个对象
      this.revealedSets.push({
        type: 'GANG',
        tiles: [...sameTiles, targetTile.clone()], // 使用克隆避免可能的引用问题
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
      return `${index + 1}:${tile.toString()}${isLastDrawn ? '(新)' : ''}`;
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

  // AI玩家简单策略：随机出牌
  getAIMove(): number {
    return Math.floor(Math.random() * this.handTiles.length);
  }
} 