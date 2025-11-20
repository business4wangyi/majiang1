import { debugLog } from "../tools/logger";

// 牌的类型
export enum TileType {
  WAN = '万',   // 万
  TIAO = '条',  // 条
  TONG = '筒',  // 筒
  FENG = '风',  // 风牌
  JIAN = '箭'   // 箭牌
}

// 风牌值
export enum FengValue {
  DONG = 1,  // 东风
  NAN = 2,   // 南风
  XI = 3,    // 西风
  BEI = 4    // 北风
}

// 箭牌值
export enum JianValue {
  ZHONG = 1, // 红中
  FA = 2,    // 发财
  BAI = 3    // 白板
}

// 风牌名称映射
const fengNames = {
  [FengValue.DONG]: '东',
  [FengValue.NAN]: '南',
  [FengValue.XI]: '西',
  [FengValue.BEI]: '北'
};

// 箭牌名称映射
const jianNames = {
  [JianValue.ZHONG]: '中',
  [JianValue.FA]: '发',
  [JianValue.BAI]: '白'
};

// 牌的数据结构
export class Tile {
  constructor(
    public type: TileType,
    public value: number,
    public id: number
  ) {}

  // 获取牌的文本表示
  toString(): string {
    if (this.type === TileType.FENG) {
      return `${fengNames[this.value as FengValue]}${this.type}`;
    } else if (this.type === TileType.JIAN) {
      return `${jianNames[this.value as JianValue]}${this.type}`;
    } else {
      return `${this.value}${this.type}`;
    }
  }

  // 检查两张牌是否相同（花色和点数）
  equals(other: Tile): boolean {
    return this.type === other.type && this.value === other.value;
  }

  // 创建当前牌的副本
  clone(): Tile {
    return new Tile(this.type, this.value, this.id);
  }
}

// 创建一副完整的麻将牌（包含风牌和箭牌）
// 标准广东麻将牌：万、条、筒各9个数字，每个数字4张，共计108张牌
// 风牌：东南西北风，每种4张，共16张
// 箭牌：中发白，每种4张，共12张
// 总计：108 + 16 + 12 = 136张
export function createFullTileSet(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  // 创建数字牌：万、条、筒
  for (const type of [TileType.WAN, TileType.TIAO, TileType.TONG]) {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        tiles.push(new Tile(type, value, id++));
      }
    }
  }

  // 创建风牌：东南西北
  for (let value = 1; value <= 4; value++) {
    for (let i = 0; i < 4; i++) {
      tiles.push(new Tile(TileType.FENG, value, id++));
    }
  }

  // 创建箭牌：中发白
  for (let value = 1; value <= 3; value++) {
    for (let i = 0; i < 4; i++) {
      tiles.push(new Tile(TileType.JIAN, value, id++));
    }
  }

  debugLog(`创建了 ${tiles.length} 张麻将牌`); // 调试信息，确认牌的总数

  return tiles;
}

// 洗牌函数
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  
  // Fisher-Yates 洗牌算法
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// 对牌进行排序（按类型和点数）
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    // 按类型排序
    if (a.type !== b.type) {
      const typeOrder = [TileType.WAN, TileType.TIAO, TileType.TONG, TileType.FENG, TileType.JIAN];
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    }
    // 同类型按点数排序
    return a.value - b.value;
  });
} 