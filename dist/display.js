"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TileTypeOrder = exports.TileTypeNames = exports.TILE_TYPE_JIAN = exports.TILE_TYPE_FENG = exports.TILE_TYPE_TONG = exports.TILE_TYPE_TIAO = exports.TILE_TYPE_WAN = exports.Style = void 0;
exports.clearScreen = clearScreen;
exports.clearLine = clearLine;
exports.analyzeHand = analyzeHand;
exports.groupTilesByTypeAndValue = groupTilesByTypeAndValue;
exports.groupTilesByType = groupTilesByType;
exports.createProgressBar = createProgressBar;
exports.formatTileSet = formatTileSet;
/**
 * 显示基础库 - 提供基础的显示常量和工具函数
 * 不直接处理显示逻辑，由 DisplayManager 调用这些工具
 */
// 颜色和样式常量
exports.Style = {
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    UNDERLINE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    // 颜色
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    // 背景色
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m'
};
// TileType枚举值的直接字符串表示
exports.TILE_TYPE_WAN = '万';
exports.TILE_TYPE_TIAO = '条';
exports.TILE_TYPE_TONG = '筒';
exports.TILE_TYPE_FENG = '风';
exports.TILE_TYPE_JIAN = '箭';
/**
 * 牌类型名称映射
 */
exports.TileTypeNames = {
    [exports.TILE_TYPE_WAN]: '万子',
    [exports.TILE_TYPE_TIAO]: '条子',
    [exports.TILE_TYPE_TONG]: '筒子',
    [exports.TILE_TYPE_FENG]: '风牌',
    [exports.TILE_TYPE_JIAN]: '箭牌'
};
/**
 * 牌类型顺序（用于排序和显示）
 */
exports.TileTypeOrder = [
    exports.TILE_TYPE_WAN,
    exports.TILE_TYPE_TIAO,
    exports.TILE_TYPE_TONG,
    exports.TILE_TYPE_FENG,
    exports.TILE_TYPE_JIAN
];
/**
 * 清屏函数
 */
function clearScreen() {
    process.stdout.write('\x1Bc');
}
/**
 * 清除当前行并将光标移到行首
 */
function clearLine() {
    process.stdout.write('\r\x1b[K'); // 清除当前行
}
/**
 * 分析AI手牌
 * @param player 玩家对象
 * @returns 分析结果数组
 */
function analyzeHand(player) {
    const analysis = [];
    // 按类型和数值分组牌
    const groups = groupTilesByTypeAndValue(player.handTiles);
    // 分析对子和刻子
    groups.forEach((tiles, key) => {
        if (tiles.length === 2) {
            analysis.push(`对子: ${tiles[0].toString()} x2`);
        }
        else if (tiles.length === 3) {
            analysis.push(`刻子: ${tiles[0].toString()} x3`);
        }
        else if (tiles.length === 4) {
            analysis.push(`杠子候选: ${tiles[0].toString()} x4`);
        }
    });
    // 这里可以添加更多分析逻辑，如顺子分析等
    return analysis;
}
/**
 * 按类型和数值对牌进行分组
 * @param tiles 牌数组
 * @returns 分组后的Map
 */
function groupTilesByTypeAndValue(tiles) {
    const groups = new Map();
    for (const tile of tiles) {
        const key = `${tile.type}-${tile.value}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(tile);
    }
    return groups;
}
/**
 * 按类型分组手牌
 * @param tiles 牌数组
 * @returns 按类型分组的Map
 */
function groupTilesByType(tiles) {
    const tilesByType = new Map();
    for (const tile of tiles) {
        // 获取牌类型对应的字符串
        const typeString = tile.type;
        if (!tilesByType.has(typeString)) {
            tilesByType.set(typeString, []);
        }
        tilesByType.get(typeString).push(tile);
    }
    return tilesByType;
}
/**
 * 创建进度条字符串
 * @param current 当前值
 * @param total 总值
 * @param length 进度条长度
 * @param filledChar 填充字符
 * @param emptyChar 空白字符
 * @returns 进度条字符串
 */
function createProgressBar(current, total, length = 20, filledChar = '█', emptyChar = '░') {
    const filled = Math.round((current / total) * length);
    return filledChar.repeat(filled) + emptyChar.repeat(length - filled);
}
/**
 * 格式化牌组数据为格式化字符串
 * @param set 牌组
 * @returns 格式化的字符串
 */
function formatTileSet(set) {
    return set.tiles.map(tile => tile.toString()).join(' ');
}
