import { Player, PlayerType } from './player';
import { Tile, TileType } from './tile';

export class AIPlayer extends Player {
  private static idCounter = 1;

  constructor(name: string) {
    super(AIPlayer.idCounter++, name, PlayerType.AI);
  }

  // 获取AI出牌选择
  public getAIMove(): number {
    console.log(`AI玩家 ${this.name} 正在思考出牌...`);
    console.log(`当前手牌数量: ${this.handTiles.length}`);
    
    // 安全检查：如果手牌为空，返回-1
    if (this.handTiles.length === 0) {
      console.log(`警告: AI玩家 ${this.name} 没有手牌可出`);
      return -1;
    }
    
    try {
      // 打印手牌详情用于调试
      console.log(`AI玩家 ${this.name} 手牌详情: ${this.handTiles.map((t, idx) => `${idx}:${t.toString()}`).join(' ')}`);
      
      // 特殊处理：如果手牌超过13张，直接返回最后一张牌的索引
      if (this.handTiles.length > 13) {
        const lastIndex = this.handTiles.length - 1;
        console.log(`手牌超过13张(${this.handTiles.length})，强制出最后一张牌，索引=${lastIndex}, 牌=${this.handTiles[lastIndex].toString()}`);
        
        // 额外检查：确保索引有效且对应牌存在
        if (lastIndex >= 0 && lastIndex < this.handTiles.length && this.handTiles[lastIndex]) {
          console.log(`最后一张牌确认有效: ${this.handTiles[lastIndex].toString()}`);
          return lastIndex;
        } else {
          // 如果最后一张牌无效，尝试找一个有效的牌
          console.log(`警告: 最后一张牌索引(${lastIndex})无效，尝试找到一个有效牌`);
          
          // 从后向前找一个有效的牌
          for (let i = this.handTiles.length - 1; i >= 0; i--) {
            if (this.handTiles[i]) {
              console.log(`找到有效牌索引: ${i}, 牌=${this.handTiles[i].toString()}`);
              return i;
            }
          }
          
          // 如果仍然找不到，返回0（如果手牌不为空）
          console.log(`无法找到有效牌，返回首张牌索引0`);
          return 0;
        }
      }
      
      // 确保有足够的牌可供选择 - 这部分代码在之前可能导致问题
      // 如果手牌数量等于13，AI也应该正常出牌
      if (this.handTiles.length < 13) {
        console.log(`AI玩家 ${this.name} 手牌数量不足13张 (${this.handTiles.length})，无需出牌`);
        // 这种情况不应该出现，但如果出现，还是返回最后一张牌的索引
        return this.handTiles.length - 1;
      }
      
      // 获取每张牌的价值评分
      const tileValues: { index: number; value: number; tile: Tile }[] = this.handTiles.map((tile, index) => {
        return { 
          index, 
          value: this.evaluateTileValue(tile, index),
          tile  
        };
      });
      
      // 根据价值排序（升序），价值最低的牌最先打出
      tileValues.sort((a, b) => a.value - b.value);
      
      // 打印出评分结果用于调试
      console.log(`AI牌价值评分 (从低到高): ${tileValues.map(tv => `${tv.index}:${tv.tile.toString()}=${tv.value}`).join(', ')}`);
      
      // 安全检查：确保返回有效索引
      if (tileValues.length > 0) {
        const selectedIndex = tileValues[0].index;
        console.log(`AI选择打出索引 ${selectedIndex}: ${this.handTiles[selectedIndex].toString()}`);
        
        // 确保索引在有效范围内
        if (selectedIndex >= 0 && selectedIndex < this.handTiles.length) {
          return selectedIndex;
        } else {
          console.log(`错误: AI返回的索引 ${selectedIndex} 超出范围，改为使用默认策略`);
        }
      } else {
        console.log(`错误: 牌值评估结果为空，使用默认策略`);
      }
      
      // 如果评分系统出问题，使用默认策略
      // 策略1: 如果刚摸了一张牌，默认打出它（通常是最后一张）
      if (this.lastDrawnTile) {
        const lastDrawnIndex = this.handTiles.findIndex(t => t.id === this.lastDrawnTile?.id);
        if (lastDrawnIndex >= 0) {
          console.log(`使用默认策略: 打出刚摸到的牌，索引=${lastDrawnIndex}`);
          return lastDrawnIndex;
        }
      }
      
      // 策略2: 出最后一张牌
      if (this.handTiles.length > 0) {
        const lastIndex = this.handTiles.length - 1;
        console.log(`使用默认策略: 打出最后一张牌，索引=${lastIndex}`);
        return lastIndex;
      }
      
      // 策略3: 随机出一张牌
      const randomIndex = Math.floor(Math.random() * this.handTiles.length);
      console.log(`使用默认策略: 随机打出一张牌，索引=${randomIndex}`);
      return randomIndex;
    } catch (error) {
      console.error(`AI出牌决策发生错误: ${error instanceof Error ? error.message : error}`);
      console.error(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
      
      // 特别处理：如果手牌超过13张，确保返回一个有效索引
      if (this.handTiles.length > 13) {
        console.log(`错误恢复: 手牌超过13张，强制返回最后一张牌索引`);
        return this.handTiles.length - 1;
      }
      
      // 出错时的备选策略: 返回最后一张牌的索引
      if (this.handTiles.length > 0) {
        const fallbackIndex = this.handTiles.length - 1;
        console.log(`错误处理: 返回最后一张牌索引 ${fallbackIndex}`);
        return fallbackIndex;
      }
      
      // 如果连这个也失败，返回0（如果有牌）或-1（没有牌）
      console.log(`极端情况：无法确定合适的牌，返回首张牌索引或-1`);
      return this.handTiles.length > 0 ? 0 : -1;
    }
  }
  
  // 评估牌的价值
  private evaluateTileValue(tile: Tile, tileIndex: number): number {
    // 基础分数
    let value = 0;
    
    // 检查是否是风牌或字牌
    if (tile.type === TileType.FENG || tile.type === TileType.JIAN) {
      // 检查是否已经有相同的牌
      const sameTypeCount = this.handTiles.filter(t => 
        t.type === tile.type && t.value === tile.value
      ).length;
      
      // 如果已经有2张或以上相同的牌，增加价值（形成刻子的可能性）
      if (sameTypeCount >= 2) {
        value += 20;
      } else if (sameTypeCount === 1) {
        value += 8; // 对子有一定价值
      } else {
        value -= 5; // 单独的风牌或字牌价值较低
      }
    } else {
      // 数字牌的价值评估
      
      // 检查是否是刻子的一部分
      if (this.isPartOfSet(tile)) {
        value += 25; // 已经是刻子一部分的牌价值高
      }
      
      // 检查是否是对子的一部分
      if (this.isPartOfPair(tile)) {
        value += 10; // 对子有一定价值
      }
      
      // 检查是否可能形成顺子
      value += this.getSequenceValue(tile);
      
      // 考虑当前手牌中的主导类型
      const dominantType = this.getDominantType();
      if (tile.type === dominantType) {
        value += 5; // 属于主导类型的牌价值稍高
      }
    }
    
    return value;
  }
  
  // 检查牌是否是刻子的一部分
  private isPartOfSet(tile: Tile): boolean {
    const sameCount = this.handTiles.filter(t => 
      t.type === tile.type && t.value === tile.value
    ).length;
    
    return sameCount >= 3;
  }
  
  // 检查牌是否是对子的一部分
  private isPartOfPair(tile: Tile): boolean {
    const sameCount = this.handTiles.filter(t => 
      t.type === tile.type && t.value === tile.value
    ).length;
    
    return sameCount === 2;
  }
  
  // 计算牌在顺子中的价值
  private getSequenceValue(tile: Tile): number {
    if (tile.type !== TileType.WAN && tile.type !== TileType.TIAO && tile.type !== TileType.TONG) {
      return 0; // 非数字牌没有顺子价值
    }
    
    let value = 0;
    const tileValue = tile.value;
    
    // 检查是否有相邻的牌
    for (let i = Math.max(1, tileValue - 2); i <= Math.min(9, tileValue + 2); i++) {
      if (i === tileValue) continue; // 跳过自身
      
      const hasNeighbor = this.handTiles.some(t => 
        t.type === tile.type && t.value === i
      );
      
      if (hasNeighbor) {
        // 邻近牌价值随距离递减
        value += 5 - Math.abs(tileValue - i);
      }
    }
    
    return value;
  }
  
  // 获取当前手牌的主导类型
  private getDominantType(): TileType {
    const typeCounts = new Map<TileType, number>();
    
    for (const tile of this.handTiles) {
      const count = typeCounts.get(tile.type) || 0;
      typeCounts.set(tile.type, count + 1);
    }
    
    let maxCount = 0;
    let dominantType = TileType.WAN; // 默认值
    
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    return dominantType;
  }
} 