"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = exports.JianValue = exports.FengValue = exports.TileType = void 0;
exports.createFullTileSet = createFullTileSet;
exports.shuffleTiles = shuffleTiles;
exports.sortTiles = sortTiles;
const logger_1 = require("./logger");
// 牌的类型
var TileType;
(function (TileType) {
    TileType["WAN"] = "\u4E07";
    TileType["TIAO"] = "\u6761";
    TileType["TONG"] = "\u7B52";
    TileType["FENG"] = "\u98CE";
    TileType["JIAN"] = "\u7BAD"; // 箭牌
})(TileType || (exports.TileType = TileType = {}));
// 风牌值
var FengValue;
(function (FengValue) {
    FengValue[FengValue["DONG"] = 1] = "DONG";
    FengValue[FengValue["NAN"] = 2] = "NAN";
    FengValue[FengValue["XI"] = 3] = "XI";
    FengValue[FengValue["BEI"] = 4] = "BEI"; // 北风
})(FengValue || (exports.FengValue = FengValue = {}));
// 箭牌值
var JianValue;
(function (JianValue) {
    JianValue[JianValue["ZHONG"] = 1] = "ZHONG";
    JianValue[JianValue["FA"] = 2] = "FA";
    JianValue[JianValue["BAI"] = 3] = "BAI"; // 白板
})(JianValue || (exports.JianValue = JianValue = {}));
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
class Tile {
    constructor(type, value, id) {
        this.type = type;
        this.value = value;
        this.id = id;
    }
    // 获取牌的文本表示
    toString() {
        // 打印Tile的type和value
        (0, logger_1.debugLog)(`Tile: ${this.type}, ${this.value}`);
        if (this.type === TileType.FENG) {
            return `${fengNames[this.value]}${this.type}`;
        }
        else if (this.type === TileType.JIAN) {
            return `${jianNames[this.value]}${this.type}`;
        }
        else {
            return `${this.value}${this.type}`;
        }
    }
    // 检查两张牌是否相同（花色和点数）
    equals(other) {
        return this.type === other.type && this.value === other.value;
    }
    // 创建当前牌的副本
    clone() {
        return new Tile(this.type, this.value, this.id);
    }
}
exports.Tile = Tile;
// 创建一副完整的麻将牌（包含风牌和箭牌）
// 标准广东麻将牌：万、条、筒各9个数字，每个数字4张，共计108张牌
// 风牌：东南西北风，每种4张，共16张
// 箭牌：中发白，每种4张，共12张
// 总计：108 + 16 + 12 = 136张
function createFullTileSet() {
    const tiles = [];
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
    (0, logger_1.debugLog)(`创建了 ${tiles.length} 张麻将牌`); // 调试信息，确认牌的总数
    return tiles;
}
// 洗牌函数
function shuffleTiles(tiles) {
    const shuffled = [...tiles];
    // Fisher-Yates 洗牌算法
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// 对牌进行排序（按类型和点数）
function sortTiles(tiles) {
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
