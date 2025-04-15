"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandAnalyzer = void 0;
const tile_1 = require("./tile");
/**
 * 手牌分析工具类
 */
class HandAnalyzer {
    /**
     * 分析手牌结构
     * @returns 对子数量、刻子数量、顺子可能性等信息
     */
    static analyzeHandTiles(tiles) {
        // 对结果进行初始化
        const result = {
            pairCount: 0,
            tripleCount: 0,
            sequencePossibility: 0,
            pairs: [],
            triples: []
        };
        if (tiles.length === 0) {
            return result;
        }
        // 按类型和点数对牌进行分组
        const tileGroups = new Map();
        for (const tile of tiles) {
            const key = `${tile.type}-${tile.value}`;
            if (!tileGroups.has(key)) {
                tileGroups.set(key, []);
            }
            tileGroups.get(key).push(tile);
        }
        // 分析对子和刻子
        for (const [key, group] of tileGroups) {
            if (group.length >= 2) {
                result.pairs.push(group.slice(0, 2));
                result.pairCount++;
            }
            if (group.length >= 3) {
                result.triples.push(group.slice(0, 3));
                result.tripleCount++;
            }
        }
        // 分析顺子可能性
        for (const type of [tile_1.TileType.WAN, tile_1.TileType.TIAO, tile_1.TileType.TONG]) {
            // 为每个数字牌类型创建一个长度为10的数组（索引0不使用）
            const values = new Array(10).fill(0);
            // 统计每个点数的数量
            for (const tile of tiles) {
                if (tile.type === type && tile.value >= 1 && tile.value <= 9) {
                    values[tile.value]++;
                }
            }
            // 检查连续三个点数是否都存在
            for (let i = 1; i <= 7; i++) {
                if (values[i] > 0 && values[i + 1] > 0 && values[i + 2] > 0) {
                    result.sequencePossibility++;
                }
            }
        }
        return result;
    }
    /**
     * 获取手牌的可视化表示
     */
    static getHandPatternVisualization(tiles) {
        if (tiles.length === 0) {
            return "空手牌";
        }
        // 按类型和点数排序
        const sortedTiles = [...tiles].sort((a, b) => {
            if (a.type !== b.type) {
                const typeOrder = {
                    [tile_1.TileType.WAN]: 1,
                    [tile_1.TileType.TIAO]: 2,
                    [tile_1.TileType.TONG]: 3,
                    [tile_1.TileType.FENG]: 4,
                    [tile_1.TileType.JIAN]: 5
                };
                return typeOrder[a.type] - typeOrder[b.type];
            }
            return a.value - b.value;
        });
        // 构建可视化字符串
        let visualization = "";
        let currentType = sortedTiles[0].type;
        let typeChunks = [];
        for (const tile of sortedTiles) {
            if (tile.type !== currentType) {
                visualization += `[${currentType}:${typeChunks.join(',')}] `;
                typeChunks = [];
                currentType = tile.type;
            }
            typeChunks.push(tile.value.toString());
        }
        visualization += `[${currentType}:${typeChunks.join(',')}]`;
        return visualization;
    }
    /**
     * 计算手牌的模式分数
     * 根据手牌中的组合模式（顺子、刻子、对子等）来评估手牌价值
     * @param tiles 手牌
     * @returns 分数
     */
    static calculatePatternScore(tiles) {
        if (tiles.length === 0)
            return 0;
        // 按类型分组
        const groupedTiles = this.groupTilesByType(tiles);
        let totalScore = 0;
        // 评估每种类型的牌
        for (const [tileType, typeTiles] of groupedTiles) {
            // 找出相同牌的组合（潜在的刻子）
            const valueCounts = new Map();
            for (const tile of typeTiles) {
                const count = valueCounts.get(tile.value) || 0;
                valueCounts.set(tile.value, count + 1);
            }
            // 计算刻子（三张相同的牌）
            let tripletScore = 0;
            for (const [value, count] of valueCounts.entries()) {
                if (count >= 3) {
                    // 刻子得分
                    tripletScore += 6;
                    // 如果是字牌或风牌，额外加分
                    if (tileType === tile_1.TileType.FENG || tileType === tile_1.TileType.JIAN) {
                        tripletScore += 2;
                    }
                }
                else if (count === 2) {
                    // 对子得分
                    tripletScore += 2;
                }
            }
            // 计算顺子（三张连续的牌，仅适用于万、条、筒）
            let sequenceScore = 0;
            if (tileType === tile_1.TileType.WAN || tileType === tile_1.TileType.TIAO || tileType === tile_1.TileType.TONG) {
                // 转换为数组以便排序和处理
                const values = Array.from(typeTiles).map(t => t.value).sort((a, b) => a - b);
                // 检查连续的三张牌
                for (let i = 0; i < values.length - 2; i++) {
                    if (values[i + 1] === values[i] + 1 && values[i + 2] === values[i] + 2) {
                        sequenceScore += 4;
                        // 跳过这个顺子已经使用的牌
                        i += 2;
                    }
                }
            }
            totalScore += tripletScore + sequenceScore;
        }
        // 额外检查整体手牌的平衡性和灵活性
        const typeVariety = groupedTiles.size;
        if (typeVariety === 3) {
            // 理想的花色分布
            totalScore += 3;
        }
        else if (typeVariety === 1) {
            // 清一色加分
            totalScore += 5;
        }
        return totalScore;
    }
    /**
     * 按照牌的类型对手牌进行分组
     */
    static groupTilesByType(tiles) {
        const grouped = new Map();
        for (const tile of tiles) {
            if (!grouped.has(tile.type)) {
                grouped.set(tile.type, []);
            }
            grouped.get(tile.type).push(tile);
        }
        return grouped;
    }
}
exports.HandAnalyzer = HandAnalyzer;
