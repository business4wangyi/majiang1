"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGameStateHash = generateGameStateHash;
/**
 * 生成游戏状态哈希，用于检测循环
 */
function generateGameStateHash(game) {
    const parts = [];
    // 当前玩家和状态
    parts.push(`P${game.currentPlayerIndex}S${game.state}`);
    // 玩家手牌状态 - 使用更加稳定的表示方法：按牌型分类并计数
    for (const player of game.getAllPlayers()) {
        // 创建一个映射来统计每种牌的数量
        const tileCounts = new Map();
        for (const tile of player.handTiles) {
            const tileKey = tile.toString();
            tileCounts.set(tileKey, (tileCounts.get(tileKey) || 0) + 1);
        }
        // 将统计结果转换为排序后的字符串
        const handStatus = Array.from(tileCounts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([tile, count]) => `${tile}x${count}`)
            .join(',');
        parts.push(`${player.id}:${handStatus}`);
    }
    // 最后打出的牌
    if (game.lastDiscardedTile) {
        parts.push(`L:${game.lastDiscardedTile.toString()}`);
    }
    // 添加更多游戏状态指标以提高检测准确性
    parts.push(`D${game.drawCount}`); // 摸牌次数
    parts.push(`R${game.remainingTiles}`); // 剩余牌数
    return parts.join('|');
}
