"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.PlayerType = exports.PlayerState = void 0;
const tile_1 = require("./tile");
const display_1 = require("./display");
const logger_1 = require("./logger");
// 玩家状态
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["WAITING"] = 0] = "WAITING";
    PlayerState[PlayerState["ACTING"] = 1] = "ACTING";
    PlayerState[PlayerState["FINISHED"] = 2] = "FINISHED"; // 已完成回合
})(PlayerState || (exports.PlayerState = PlayerState = {}));
// 玩家类型
var PlayerType;
(function (PlayerType) {
    PlayerType[PlayerType["HUMAN"] = 0] = "HUMAN";
    PlayerType[PlayerType["AI"] = 1] = "AI"; // AI玩家
})(PlayerType || (exports.PlayerType = PlayerType = {}));
// 玩家类
class Player {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
        // 手牌
        this.handTiles = [];
        // 已打出的牌
        this.discardedTiles = [];
        // 已亮出的牌组（吃碰杠）
        this.revealedSets = [];
        // 当前状态
        this.state = PlayerState.WAITING;
        // 最后摸到的牌
        this.lastDrawnTile = null;
        // 分数
        this.score = 0;
    }
    // 添加一张牌到手牌
    drawTile(tile) {
        if (!tile) {
            (0, logger_1.debugLog)(`警告: 玩家 ${this.name} 尝试摸一张无效的牌`);
            return;
        }
        // 记录操作前手牌数量
        const beforeCount = this.handTiles.length;
        this.lastDrawnTile = tile;
        this.handTiles.push(tile);
        // 验证操作后手牌数量
        if (this.handTiles.length !== beforeCount + 1) {
            (0, logger_1.debugLog)(`警告: 摸牌后手牌数量异常，预期: ${beforeCount + 1}，实际: ${this.handTiles.length}`);
        }
        this.sortHand();
        this.verifyHandConsistency(); // 确保一致性
    }
    // 整理手牌（排序）
    sortHand() {
        this.handTiles = (0, tile_1.sortTiles)(this.handTiles);
    }
    // 添加手牌一致性检查方法
    verifyHandConsistency() {
        // 检查手牌中是否有null或undefined
        const invalidTiles = this.handTiles.filter(tile => !tile);
        if (invalidTiles.length > 0) {
            (0, logger_1.debugLog)(`警告: 玩家${this.name}手牌中有${invalidTiles.length}张无效牌，自动修复`);
            // 移除无效牌
            this.handTiles = this.handTiles.filter(tile => tile);
            return false;
        }
        return true;
    }
    // 打出一张牌
    discardTile(tileIndex) {
        (0, logger_1.debugLog)(`玩家${this.name}尝试打出索引${tileIndex}的牌，当前手牌数量: ${this.handTiles.length}`);
        // 确保手牌一致性
        this.verifyHandConsistency();
        // 如果手牌为空，无法打出
        if (this.handTiles.length === 0) {
            (0, logger_1.debugLog)(`错误: 玩家${this.name}没有手牌可出`);
            return null;
        }
        // 索引范围检查与修正（对所有玩家类型都进行修正）
        if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
            (0, logger_1.debugLog)(`无效的出牌索引: ${tileIndex}，有效范围: 0-${this.handTiles.length - 1}`);
            // 无论是AI还是人类玩家，都修正为最后一张牌的索引
            if (this.handTiles.length > 13) {
                // 修正为最后一张牌的索引
                const correctedIndex = Math.min(this.handTiles.length - 1, Math.max(0, tileIndex));
                (0, logger_1.debugLog)(`索引修正为: ${correctedIndex}`);
                tileIndex = correctedIndex;
            }
            else {
                return null;
            }
        }
        // 再次验证索引有效
        if (tileIndex < 0 || tileIndex >= this.handTiles.length) {
            (0, logger_1.debugLog)(`严重错误: 索引修正后仍然无效: ${tileIndex}`);
            return null;
        }
        // 特殊处理：确保选中的牌存在
        if (!this.handTiles[tileIndex]) {
            (0, logger_1.debugLog)(`错误: 索引${tileIndex}处的牌不存在`);
            // 对于AI玩家，尝试找到一个有效的牌
            if (this.type === PlayerType.AI) {
                // 从最后一张开始查找有效的牌
                let foundValidTile = false;
                for (let i = this.handTiles.length - 1; i >= 0; i--) {
                    if (this.handTiles[i]) {
                        (0, logger_1.debugLog)(`找到有效替代牌，索引: ${i}`);
                        tileIndex = i;
                        foundValidTile = true;
                        break;
                    }
                }
                // 再次检查修正后的索引是否有效
                if (!foundValidTile || !this.handTiles[tileIndex]) {
                    (0, logger_1.debugLog)(`严重错误: 无法找到有效的替代牌`);
                    return null;
                }
            }
            else {
                return null;
            }
        }
        try {
            // 克隆要打出的牌，确保有一个安全的副本
            const tileToDiscard = this.handTiles[tileIndex].clone();
            // 记录操作前手牌数量，用于验证
            const beforeCount = this.handTiles.length;
            // 使用splice安全地从手牌中移除这张牌
            const discarded = this.handTiles.splice(tileIndex, 1)[0];
            // 验证操作后手牌数量
            if (this.handTiles.length !== beforeCount - 1) {
                (0, logger_1.debugLog)(`警告: 出牌后手牌数量异常，预期: ${beforeCount - 1}，实际: ${this.handTiles.length}`);
                // 尝试修复手牌数组
                this.verifyHandConsistency();
            }
            // 如果splice返回了undefined或null，使用之前克隆的牌作为备份
            if (!discarded) {
                (0, logger_1.debugLog)(`警告: splice操作未返回牌，使用克隆的备份`);
                // 添加到弃牌区域
                this.discardedTiles.push(tileToDiscard);
                this.lastDrawnTile = null;
                return tileToDiscard;
            }
            // 常规流程：添加到弃牌区域并返回
            this.discardedTiles.push(discarded);
            this.lastDrawnTile = null;
            (0, logger_1.debugLog)(`玩家 ${this.name} 成功打出: ${discarded.toString()}`);
            return discarded;
        }
        catch (error) {
            console.error(`打牌过程发生错误: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
            // 不再使用任何非标准的备用方法，而是直接返回失败
            (0, logger_1.debugLog)(`出牌失败，玩家状态可能不一致`);
            return null;
        }
    }
    // 吃牌
    chi(tiles, targetTile) {
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
    peng(targetTile) {
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
    gang(targetTile) {
        if (targetTile) {
            // 明杠：需要手里有三张相同的牌
            const sameTiles = this.handTiles.filter(t => t.equals(targetTile)).slice(0, 3);
            if (sameTiles.length < 3) {
                (0, logger_1.debugLog)(`明杠失败: 手牌中没有足够的牌 (有${sameTiles.length}张, 需要3张)`);
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
        }
        else {
            // 暗杠或补杠：检查手牌中有没有四张相同的牌
            // 统计每种牌的数量
            const countMap = new Map();
            for (const tile of this.handTiles) {
                const key = `${tile.type}_${tile.value}`;
                if (!countMap.has(key)) {
                    countMap.set(key, []);
                }
                countMap.get(key).push(tile);
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
    getHandString() {
        return this.handTiles.map((tile, index) => {
            // 特别标记最后摸到的牌
            const isLastDrawn = this.lastDrawnTile && tile.id === this.lastDrawnTile.id;
            if (isLastDrawn) {
                // 使用Style添加颜色高亮，更醒目地标记新牌
                return `${index + 1}:${display_1.Style.BOLD}${display_1.Style.YELLOW}${tile.toString()}${display_1.Style.RESET}`;
            }
            else {
                return `${index + 1}:${tile.toString()}`;
            }
        }).join(' ');
    }
    // 获取弃牌的字符串表示
    getDiscardedString() {
        return this.discardedTiles.map(tile => tile.toString()).join(' ');
    }
    // 获取已亮出牌组的字符串表示
    getRevealedSetsString() {
        if (this.revealedSets.length === 0) {
            return '无';
        }
        return this.revealedSets.map(set => {
            const typeText = set.type === 'CHI' ? '吃' : (set.type === 'PENG' ? '碰' : '杠');
            return `${typeText}[${set.tiles.map(t => t.toString()).join(',')}]`;
        }).join(' ');
    }
    // AI玩家简单策略：随机出牌
    getAIMove() {
        return Math.floor(Math.random() * this.handTiles.length);
    }
}
exports.Player = Player;
