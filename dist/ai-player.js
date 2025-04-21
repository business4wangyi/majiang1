"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPlayer = void 0;
const logger_1 = require("./logger");
const player_1 = require("./player");
const tile_1 = require("./tile");
const display_manager_1 = require("./display-manager");
class AIPlayer extends player_1.Player {
    /**
     * 计算AI思考延迟时间
     * 在不同场景可能需要不同的延迟时间
     * @param isQuickDecision 是否为快速决策（如响应他人出牌）
     * @returns 毫秒数
     */
    static calculateDelay(isQuickDecision = false) {
        if (isQuickDecision) {
            return Math.floor(Math.random() * (600 - 300 + 1) + 300);
        }
        else {
            return Math.floor(Math.random() * (2000 - 800 + 1) + 800);
        }
    }
    /**
     * 使AI决策暂停一小段时间，模拟思考过程
     * @returns Promise<void>
     */
    static async pauseForThinking(isQuickDecision = false) {
        const delayTime = AIPlayer.calculateDelay(isQuickDecision);
        return new Promise(resolve => setTimeout(resolve, delayTime));
    }
    constructor(name) {
        super(AIPlayer.idCounter++, name, player_1.PlayerType.AI);
        this.aiStrategy = {
            chooseDiscardTile: (handTiles) => {
                if (handTiles.length === 0)
                    return null;
                // 确保手牌一致性
                // this.verifyHandConsistency();
                try {
                    // 使用现有的AI策略选择要打出的牌
                    const moveIndex = this.getAIMove();
                    // 确保索引有效
                    if (moveIndex >= 0 && moveIndex < handTiles.length) {
                        // 验证牌对象存在
                        if (handTiles[moveIndex]) {
                            return handTiles[moveIndex];
                        }
                        else {
                            (0, logger_1.debugLog)(`警告: AI选择的牌索引 ${moveIndex} 有效但牌对象不存在`);
                        }
                    }
                    else {
                        (0, logger_1.debugLog)(`警告: AI返回无效索引 ${moveIndex}，改用最后一张牌`);
                    }
                }
                catch (error) {
                    (0, logger_1.errorLog)(`AI策略选择牌时出错: ${error instanceof Error ? error.message : String(error)}`);
                }
                // 如果AI策略返回无效索引或发生错误，使用最后一张牌作为备选
                if (handTiles.length > 0) {
                    return handTiles[handTiles.length - 1];
                }
                // 如果所有尝试都失败，返回null
                (0, logger_1.debugLog)(`警告: AI策略无法选择牌，手牌数量: ${handTiles.length}`);
                return null;
            }
        };
    }
    /**
     * 处理AI玩家出牌流程
     * @param gameEventHandler 游戏事件处理器
     * @returns 出牌是否成功
     */
    async handleDiscard(gameEventHandler) {
        // 检查AI玩家是否需要出牌
        if (!this.needsToDiscard()) {
            (0, logger_1.debugLog)(`AI玩家 ${this.name} 不需要出牌，手牌数量：${this.handTiles.length}`);
            return false;
        }
        // 显示AI正在思考
        (0, logger_1.infoLog)(`AI玩家 ${this.name} 正在思考出牌..., 当前手牌数量: ${this.handTiles.length}`);
        display_manager_1.displayManager.printWarning(`AI玩家 ${this.name} 正在思考出牌...`);
        // 安全检查：确保手牌不为空
        if (this.handTiles.length === 0) {
            display_manager_1.displayManager.printError(`错误: AI玩家 ${this.name} 没有手牌可出`);
            return false;
        }
        // 模拟AI思考延迟
        await AIPlayer.pauseForThinking();
        try {
            // 使用AI方法获取出牌决策
            const discardIndex = this.getAIMove();
            // 验证索引是否有效
            if (discardIndex < 0 || discardIndex >= this.handTiles.length) {
                (0, logger_1.debugLog)(`AI玩家 ${this.name} 返回的索引 ${discardIndex} 无效`);
                display_manager_1.displayManager.printWarning(`AI玩家 ${this.name} 无法决定要打出哪张牌，随机选择`);
                // 随机选择一张牌出牌
                const randomIndex = Math.floor(Math.random() * this.handTiles.length);
                // 执行出牌
                const randomDiscard = gameEventHandler.currentPlayerDiscard(randomIndex);
                if (randomDiscard) {
                    display_manager_1.displayManager.printWarning(`AI玩家 ${this.name} 随机打出: ${randomDiscard.toString()}`);
                    return true;
                }
                else {
                    display_manager_1.displayManager.printError(`AI玩家 ${this.name} 随机出牌失败`);
                    return false;
                }
            }
            // 显示AI的思考过程
            const tileToDiscard = this.handTiles[discardIndex];
            if (!tileToDiscard) {
                // 手牌索引存在但牌对象不存在的情况
                display_manager_1.displayManager.printError(`错误: 索引 ${discardIndex} 处的牌对象不存在`);
                // 尝试找到一个有效的牌
                let validIndex = -1;
                for (let i = 0; i < this.handTiles.length; i++) {
                    if (this.handTiles[i]) {
                        validIndex = i;
                        break;
                    }
                }
                if (validIndex >= 0) {
                    display_manager_1.displayManager.printWarning(`使用备选有效索引 ${validIndex}`);
                    const fallbackTile = gameEventHandler.currentPlayerDiscard(validIndex);
                    return fallbackTile != null;
                }
                return false;
            }
            (0, logger_1.debugLog)(`AI玩家 ${this.name} 决定打出第${discardIndex + 1}张牌: ${tileToDiscard.toString()}`);
            display_manager_1.displayManager.print(`AI玩家 ${this.name} 分析完成，选择打出: ${tileToDiscard.toString()}`);
            // 执行出牌
            const discardedTile = gameEventHandler.currentPlayerDiscard(discardIndex);
            if (discardedTile) {
                (0, logger_1.infoLog)(`AI玩家 ${this.name} 成功打出: ${discardedTile.toString()}`);
                display_manager_1.displayManager.printSuccess(`AI玩家 ${this.name} 打出: ${discardedTile.toString()}`);
                display_manager_1.displayManager.addToTurnLog(`${this.name} 打出了 ${discardedTile.toString()}`);
                // 检查其他玩家是否可以对此牌进行操作
                await gameEventHandler.checkOtherPlayersResponse(discardedTile);
                return true;
            }
            else {
                display_manager_1.displayManager.printError(`AI玩家 ${this.name} 出牌失败`);
                return false;
            }
        }
        catch (error) {
            (0, logger_1.debugLog)(`AI玩家出牌出错: ${error instanceof Error ? error.message : String(error)}`);
            display_manager_1.displayManager.printError(`AI玩家出牌出错: ${error instanceof Error ? error.message : String(error)}`);
            try {
                // 出错时，随机选择一张牌出牌
                const fallbackIndex = Math.floor(Math.random() * this.handTiles.length);
                (0, logger_1.infoLog)(`出错后的备用策略: 使用随机索引 ${fallbackIndex} 出牌`);
                const fallbackTile = gameEventHandler.currentPlayerDiscard(fallbackIndex);
                if (fallbackTile) {
                    display_manager_1.displayManager.printWarning(`AI出错恢复：随机打出 ${fallbackTile.toString()}`);
                    return true;
                }
            }
            catch (fallbackError) {
                (0, logger_1.debugLog)(`AI出牌恢复策略也失败: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                display_manager_1.displayManager.printError(`AI玩家无法出牌，请检查游戏状态`);
            }
            return false;
        }
    }
    // 获取AI出牌选择（优化版）
    getAIMove() {
        (0, logger_1.debugLog)(`AI玩家 ${this.name} 正在思考出牌...`);
        (0, logger_1.debugLog)(`当前手牌数量: ${this.handTiles.length}`);
        // 安全检查：如果手牌为空，返回-1
        if (this.handTiles.length === 0) {
            (0, logger_1.debugLog)(`警告: AI玩家 ${this.name} 没有手牌可出`);
            return -1;
        }
        try {
            // 打印手牌详情用于调试
            (0, logger_1.debugLog)(`AI玩家 ${this.name} 手牌详情: ${this.handTiles.map((t, idx) => `${idx}:${t.toString()}`).join(' ')}`);
            // 使用needsToDiscard方法判断是否需要出牌
            if (this.needsToDiscard()) {
                // 获取每张牌的价值评分
                const tileValues = this.getAllTileValues();
                // 安全检查：确保有评分结果
                if (tileValues.length > 0) {
                    // 选择价值最低的牌
                    const lowestValueTile = tileValues[0];
                    // 验证索引有效性
                    if (lowestValueTile.index >= 0 && lowestValueTile.index < this.handTiles.length) {
                        (0, logger_1.debugLog)(`手牌数量超过预期(${this.getExpectedHandSize()})，实际(${this.handTiles.length})，选择价值最低的牌，索引=${lowestValueTile.index}, 牌=${lowestValueTile.tile.toString()}, 价值=${lowestValueTile.value}`);
                        return lowestValueTile.index;
                    }
                    else {
                        (0, logger_1.debugLog)(`警告: 评分结果索引无效 ${lowestValueTile.index}，使用备选策略`);
                    }
                }
                // 如果评分失败，使用安全的备选策略：打出最后一张牌
                const lastIndex = this.handTiles.length - 1;
                (0, logger_1.debugLog)(`评分失败，使用备选策略: 打出最后一张牌，索引=${lastIndex}`);
                return lastIndex;
            }
            // 获取每张牌的价值评分
            const tileValues = this.getAllTileValues();
            // 安全检查：确保有评分结果
            if (tileValues.length > 0) {
                const selectedIndex = tileValues[0].index;
                // 确保索引在有效范围内
                if (selectedIndex >= 0 && selectedIndex < this.handTiles.length) {
                    (0, logger_1.debugLog)(`AI选择打出索引 ${selectedIndex}: ${this.handTiles[selectedIndex].toString()}, 价值: ${tileValues[0].value}`);
                    return selectedIndex;
                }
                else {
                    (0, logger_1.debugLog)(`错误: AI返回的索引 ${selectedIndex} 超出范围，改为使用默认策略`);
                }
            }
            else {
                (0, logger_1.debugLog)(`错误: 牌值评估结果为空，使用默认策略`);
            }
            // 如果评分系统出问题，返回最后一张牌的索引（最安全）
            return this.handTiles.length - 1;
        }
        catch (error) {
            (0, logger_1.errorLog)(`AI出牌决策发生错误: ${error instanceof Error ? error.message : error}`);
            (0, logger_1.errorLog)(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
            // 发生错误时返回最后一张牌的索引（最安全）
            return this.handTiles.length > 0 ? this.handTiles.length - 1 : -1;
        }
    }
    // 获取所有手牌的价值评分，从低到高排序
    getAllTileValues() {
        try {
            // 获取每张牌的价值评分
            const tileValues = this.handTiles.map((tile, index) => {
                return {
                    index,
                    value: this.evaluateTileValue(tile, index),
                    tile
                };
            });
            // 根据价值排序（升序），价值最低的牌最先打出
            tileValues.sort((a, b) => a.value - b.value);
            // 打印出评分结果用于调试
            (0, logger_1.debugLog)(`AI牌价值评分 (从低到高): ${tileValues.map(tv => `${tv.index}:${tv.tile.toString()}=${tv.value}`).join(', ')}`);
            return tileValues;
        }
        catch (error) {
            (0, logger_1.errorLog)(`牌值评估发生错误: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    // 评估牌的价值 (扩展版)
    evaluateTileValue(tile, tileIndex) {
        try {
            // 基础分数
            let value = 0;
            // 检查是否是风牌或字牌
            if (tile.type === tile_1.TileType.FENG || tile.type === tile_1.TileType.JIAN) {
                // 检查是否已经有相同的牌
                const sameTypeCount = this.handTiles.filter(t => t.type === tile.type && t.value === tile.value).length;
                // 如果已经有2张或以上相同的牌，增加价值（形成刻子的可能性）
                if (sameTypeCount >= 3) {
                    value += AIPlayer.AI_STRATEGY.HONOR_TILE_VALUES.TRIPLET; // 刻子已形成，价值高
                }
                else if (sameTypeCount >= 2) {
                    value += AIPlayer.AI_STRATEGY.HONOR_TILE_VALUES.PAIR; // 可能形成刻子的对子，价值中高
                }
                else if (sameTypeCount === 1) {
                    value += AIPlayer.AI_STRATEGY.HONOR_TILE_VALUES.SINGLE_PAIR; // 对子有一定价值
                }
                else {
                    value += AIPlayer.AI_STRATEGY.HONOR_TILE_VALUES.ISOLATED; // 单独的风牌或字牌价值较低
                }
            }
            else {
                // 数字牌的价值评估
                // 检查是否是刻子的一部分
                if (this.isPartOfSet(tile)) {
                    value += AIPlayer.AI_STRATEGY.WEIGHTS.TRIPLET; // 已经是刻子一部分的牌价值高
                }
                // 检查是否是对子的一部分
                if (this.isPartOfPair(tile)) {
                    value += AIPlayer.AI_STRATEGY.WEIGHTS.PAIR; // 对子有一定价值
                }
                // 检查是否可能形成顺子
                value += this.getSequenceValue(tile);
                // 考虑当前手牌中的主导类型
                const dominantType = this.getDominantType();
                if (tile.type === dominantType) {
                    value += AIPlayer.AI_STRATEGY.WEIGHTS.DOMINANT_TYPE; // 属于主导类型的牌价值稍高
                }
                // 边张和孤张策略：边牌(1和9)如果没有形成搭子，价值更低
                if ((tile.value === 1 || tile.value === 9) && !this.hasAdjacentTiles(tile)) {
                    value += AIPlayer.AI_STRATEGY.WEIGHTS.EDGE_TILE; // 单独的边张价值降低
                }
                // 中间牌更有灵活性，略微提高价值
                if (tile.value >= 4 && tile.value <= 6) {
                    value += AIPlayer.AI_STRATEGY.WEIGHTS.MIDDLE_TILE; // 中间牌略微加分
                }
            }
            // 如果是最后摸的牌，稍微降低价值使其更容易被打出（优化流畅性）
            if (this.lastDrawnTile && tile.id === this.lastDrawnTile.id) {
                value += AIPlayer.AI_STRATEGY.WEIGHTS.LAST_DRAWN;
            }
            return value;
        }
        catch (error) {
            (0, logger_1.errorLog)(`评估牌值出错: ${error instanceof Error ? error.message : String(error)}`);
            return 0; // 出错时返回0值，使其更有可能被打出
        }
    }
    // 检查牌是否有相邻的牌（用于评估边张和孤张）
    hasAdjacentTiles(tile) {
        // 只针对数字牌
        if (tile.type !== tile_1.TileType.WAN && tile.type !== tile_1.TileType.TIAO && tile.type !== tile_1.TileType.TONG) {
            return false;
        }
        const value = tile.value;
        const adjacentValues = [];
        // 1的邻张是2，9的邻张是8，其他数字有两个邻张
        if (value === 1) {
            adjacentValues.push(2);
        }
        else if (value === 9) {
            adjacentValues.push(8);
        }
        else {
            adjacentValues.push(value - 1);
            adjacentValues.push(value + 1);
        }
        // 检查手牌中是否有邻接的牌
        return this.handTiles.some(t => t.type === tile.type && adjacentValues.includes(t.value));
    }
    // 检查牌是否是刻子的一部分
    isPartOfSet(tile) {
        const sameCount = this.handTiles.filter(t => t.type === tile.type && t.value === tile.value).length;
        return sameCount >= 3;
    }
    // 检查牌是否是对子的一部分
    isPartOfPair(tile) {
        const sameCount = this.handTiles.filter(t => t.type === tile.type && t.value === tile.value).length;
        return sameCount === 2;
    }
    // 计算牌在顺子中的价值
    getSequenceValue(tile) {
        if (tile.type !== tile_1.TileType.WAN && tile.type !== tile_1.TileType.TIAO && tile.type !== tile_1.TileType.TONG) {
            return 0; // 非数字牌没有顺子价值
        }
        let value = 0;
        const tileValue = tile.value;
        // 检查是否有相邻的牌
        for (let i = Math.max(1, tileValue - 2); i <= Math.min(9, tileValue + 2); i++) {
            if (i === tileValue)
                continue; // 跳过自身
            const hasNeighbor = this.handTiles.some(t => t.type === tile.type && t.value === i);
            if (hasNeighbor) {
                // 邻近牌价值随距离递减
                value += AIPlayer.AI_STRATEGY.WEIGHTS.SEQUENCE - Math.abs(tileValue - i);
            }
        }
        // 检查是否已经形成或接近顺子
        const possibleSequences = this.getPossibleSequences(tile);
        if (possibleSequences.length > 0) {
            // 每个可能的顺子增加价值
            value += possibleSequences.length * 3;
            // 检查有多少顺子只缺一张牌
            const almostComplete = possibleSequences.filter(seq => seq.count >= 2);
            value += almostComplete.length * AIPlayer.AI_STRATEGY.WEIGHTS.NEAR_COMPLETE;
        }
        return value;
    }
    // 获取可能形成的顺子
    getPossibleSequences(tile) {
        if (tile.type !== tile_1.TileType.WAN && tile.type !== tile_1.TileType.TIAO && tile.type !== tile_1.TileType.TONG) {
            return []; // 非数字牌没有顺子可能
        }
        const value = tile.value;
        const possibleSequences = [];
        // 牌可能在顺子中的位置：开头、中间或结尾
        // 例如：对于5万，可能的顺子是3-4-5, 4-5-6, 5-6-7
        // 作为顺子开头
        if (value <= 7) {
            let count = 1; // 开头算一张
            for (let i = 1; i <= 2; i++) {
                if (this.handTiles.some(t => t.type === tile.type && t.value === value + i)) {
                    count++;
                }
            }
            if (count > 1) { // 至少有一张连续牌
                possibleSequences.push({ start: value, count });
            }
        }
        // 作为顺子中间
        if (value >= 2 && value <= 8) {
            let count = 1; // 中间算一张
            if (this.handTiles.some(t => t.type === tile.type && t.value === value - 1)) {
                count++;
            }
            if (this.handTiles.some(t => t.type === tile.type && t.value === value + 1)) {
                count++;
            }
            if (count > 1) { // 至少有一张连续牌
                possibleSequences.push({ start: value - 1, count });
            }
        }
        // 作为顺子结尾
        if (value >= 3) {
            let count = 1; // 结尾算一张
            for (let i = 1; i <= 2; i++) {
                if (this.handTiles.some(t => t.type === tile.type && t.value === value - i)) {
                    count++;
                }
            }
            if (count > 1) { // 至少有一张连续牌
                possibleSequences.push({ start: value - 2, count });
            }
        }
        return possibleSequences;
    }
    // 获取当前手牌的主导类型
    getDominantType() {
        const typeCounts = new Map();
        for (const tile of this.handTiles) {
            const count = typeCounts.get(tile.type) || 0;
            typeCounts.set(tile.type, count + 1);
        }
        let maxCount = 0;
        let dominantType = tile_1.TileType.WAN; // 默认值
        typeCounts.forEach((count, type) => {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        });
        return dominantType;
    }
}
exports.AIPlayer = AIPlayer;
AIPlayer.idCounter = 1;
/**
 * AI策略相关常量
 */
AIPlayer.AI_STRATEGY = {
    // 牌的基础评分权重
    WEIGHTS: {
        PAIR: 10, // 对子
        TRIPLET: 25, // 刻子
        SEQUENCE: 8, // 顺子贡献
        NEAR_COMPLETE: 5, // 接近完成的组合
        DOMINANT_TYPE: 5, // 主导类型
        EDGE_TILE: -3, // 边张惩罚
        MIDDLE_TILE: 2, // 中间牌奖励
        LAST_DRAWN: -2 // 最后摸的牌略微降低价值，更容易打出
    },
    // 字牌和风牌的评分
    HONOR_TILE_VALUES: {
        TRIPLET: 30, // 刻子
        PAIR: 20, // 对子
        SINGLE_PAIR: 8, // 单个对子
        ISOLATED: -5 // 孤立的牌
    }
};
