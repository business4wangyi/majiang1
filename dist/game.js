"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GameState = void 0;
const tile_1 = require("./tile");
const player_1 = require("./player");
const rules_1 = require("./rules");
const human_player_1 = require("./human-player");
const ai_player_1 = require("./ai-player");
// 从命令行参数判断是否处于调试模式
const DEBUG_MODE = process.argv.includes('--debug');
// 游戏状态
var GameState;
(function (GameState) {
    GameState[GameState["INIT"] = 0] = "INIT";
    GameState[GameState["DEALING"] = 1] = "DEALING";
    GameState[GameState["PLAYING"] = 2] = "PLAYING";
    GameState[GameState["WAITING_ACTION"] = 3] = "WAITING_ACTION";
    GameState[GameState["ENDED"] = 4] = "ENDED"; // 游戏结束
})(GameState || (exports.GameState = GameState = {}));
// 调试日志函数 - 输出带有[DEBUG]标识的调试信息
function debugLog(message) {
    // 只有在DEBUG_MODE为true时才输出日志
    if (DEBUG_MODE) {
        console.log(`\x1b[33m[DEBUG]\x1b[0m: ${message}`);
    }
}
// 游戏类
class Game {
    constructor(players) {
        // 牌山（所有牌）
        this.tiles = [];
        // 玩家列表
        this.players = [];
        // 当前游戏状态
        this.state = GameState.INIT;
        // 当前玩家索引
        this.currentPlayerIndex = 0;
        // 剩余牌数量
        this.remainingTiles = 0;
        // 总牌数
        this.totalTiles = 0;
        // 最后一张被打出的牌
        this.lastDiscardedTile = null;
        // 等待的动作信息
        this.pendingAction = null;
        // 庄家索引
        this.bankerIndex = 0;
        // 当前风圈
        this.windRound = 0; // 0:东风圈, 1:南风圈, 2:西风圈, 3:北风圈
        // 摸牌次数
        this.drawCount = 0;
        // 上一次的摸牌次数（用于追踪摸牌次数变化）
        this.lastDrawCount = 0;
        // 初始化游戏
        this.initGame(players);
    }
    // 初始化游戏
    initGame(players) {
        console.log("初始化游戏...");
        // 创建玩家
        if (players) {
            this.players = players;
        }
        else {
            this.players = [
                new human_player_1.HumanPlayer("玩家"),
                new ai_player_1.AIPlayer("AI 1"),
                new ai_player_1.AIPlayer("AI 2"),
                new ai_player_1.AIPlayer("AI 3")
            ];
        }
        // 创建并洗牌
        this.tiles = (0, tile_1.shuffleTiles)((0, tile_1.createFullTileSet)());
        this.totalTiles = 136; // 确保设置为标准麻将牌数136
        this.remainingTiles = this.tiles.length;
        // 重置摸牌次数
        this.drawCount = 0;
        this.lastDrawCount = 0; // 初始化上一次摸牌次数为0
        // 随机选择庄家（第一个出牌的玩家）
        this.bankerIndex = Math.floor(Math.random() * this.players.length);
        this.currentPlayerIndex = this.bankerIndex;
        // 设置游戏状态
        this.state = GameState.INIT;
        // 初始化风圈（从东风圈开始）
        this.windRound = 0;
        console.log(`游戏初始化完成。庄家: ${this.players[this.bankerIndex].name}`);
    }
    // 开始游戏
    startGame() {
        console.log("开始新游戏");
        this.state = GameState.PLAYING;
        // 初始化牌山
        this.resetCardCounts();
        // 创建和洗牌
        this.tiles = (0, tile_1.shuffleTiles)((0, tile_1.createFullTileSet)());
        this.totalTiles = this.tiles.length;
        this.remainingTiles = this.totalTiles;
        // 发牌
        this.dealInitialTiles();
        // 设置初始玩家
        this.currentPlayerIndex = this.bankerIndex;
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.state = player_1.PlayerState.ACTING;
        // 检查是否是特殊牌型测试模式
        const isSpecialPatternTest = process.argv.includes('--check-seven-pairs') ||
            process.argv.includes('--check-thirteen-orphans') ||
            process.argv.includes('--check-qing-yi-se') ||
            process.argv.includes('--check-peng-peng-hu');
        // 在特殊牌型测试模式下，跳过额外的摸牌操作
        if (!isSpecialPatternTest) {
            // 当前玩家摸一张牌
            this.currentPlayerDraw();
        }
        else {
            debugLog(`[startGame] 特殊牌型测试模式: 跳过额外的摸牌操作`);
        }
        // 健全性检查：确保所有玩家手牌数量正确
        this.ensureValidHandSizes();
        console.log("游戏初始化完成");
    }
    // 确保所有玩家手牌数量正确
    ensureValidHandSizes() {
        console.log("执行手牌健全性检查");
        debugLog(`[ensureValidHandSizes] 开始检查所有玩家手牌`);
        // 检查是否是特殊牌型测试模式
        const isSpecialPatternTest = process.argv.includes('--check-seven-pairs') ||
            process.argv.includes('--check-thirteen-orphans') ||
            process.argv.includes('--check-qing-yi-se') ||
            process.argv.includes('--check-peng-peng-hu');
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            // 如果是特殊牌型测试模式且是AI 2玩家，跳过检查
            if (isSpecialPatternTest && player.name === "AI 2") {
                debugLog(`[ensureValidHandSizes] 特殊牌型测试模式: 跳过AI 2玩家手牌数量检查`);
                continue;
            }
            // 庄家应该有14张牌，其他玩家13张
            const expectedCards = (i === this.bankerIndex) ? 14 : 13;
            // 检查手牌数量
            if (player.handTiles.length > expectedCards) {
                console.log(`玩家${player.name}手牌数量(${player.handTiles.length})超过预期(${expectedCards})，进行修正`);
                debugLog(`[ensureValidHandSizes] 玩家${player.name}手牌数量异常: ${player.handTiles.length} > ${expectedCards}`);
                // 移除多余的牌
                const extraCards = player.handTiles.length - expectedCards;
                const removedCards = player.handTiles.splice(expectedCards);
                console.log(`已移除${extraCards}张多余手牌: ${removedCards.map(t => t.toString()).join(', ')}`);
                debugLog(`[ensureValidHandSizes] 已移除${extraCards}张多余手牌`);
                // 将这些牌放回牌堆
                this.tiles.push(...removedCards);
                // 如果是当前玩家，设置最后一张为出牌
                if (i === this.currentPlayerIndex && removedCards.length > 0) {
                    const lastRemoved = removedCards[removedCards.length - 1];
                    player.discardedTiles.push(lastRemoved);
                    this.lastDiscardedTile = lastRemoved;
                    console.log(`记录${player.name}的${lastRemoved.toString()}为出牌`);
                    debugLog(`[ensureValidHandSizes] 记录${lastRemoved.toString()}为出牌`);
                }
            }
            // 如果手牌不足，补充牌
            else if (player.handTiles.length < expectedCards) {
                console.log(`玩家${player.name}手牌数量(${player.handTiles.length})不足预期(${expectedCards})，进行补充`);
                debugLog(`[ensureValidHandSizes] 玩家${player.name}手牌数量不足: ${player.handTiles.length} < ${expectedCards}`);
                const cardsNeeded = expectedCards - player.handTiles.length;
                for (let j = 0; j < cardsNeeded; j++) {
                    const tile = this.drawTileFromWall(false); // 显式指定这不是杠后摸牌
                    if (tile) {
                        player.drawTile(tile);
                        console.log(`为${player.name}补充了一张牌: ${tile.toString()}`);
                        debugLog(`[ensureValidHandSizes] 补充牌: ${tile.toString()}`);
                    }
                    else {
                        console.log(`警告: 牌山已空，无法为${player.name}补充牌`);
                        debugLog(`[ensureValidHandSizes] 警告: 牌山已空`);
                        break;
                    }
                }
            }
            // 确保手牌已排序
            player.sortHand();
        }
        console.log("手牌健全性检查完成");
        debugLog(`[ensureValidHandSizes] 检查完成`);
    }
    // 重置牌数计数器
    resetCardCounts() {
        // 确保标准的136张牌数量
        this.remainingTiles = 136;
    }
    // 发初始牌
    dealInitialTiles() {
        // 重置摸牌次数
        this.drawCount = 0;
        // 检查是否需要特殊牌型测试
        const CHECK_SEVEN_PAIRS = process.argv.includes('--check-seven-pairs');
        const CHECK_THIRTEEN_ORPHANS = process.argv.includes('--check-thirteen-orphans');
        const CHECK_QING_YI_SE = process.argv.includes('--check-qing-yi-se');
        const CHECK_PENG_PENG_HU = process.argv.includes('--check-peng-peng-hu');
        // 为所有玩家初始化手牌
        for (let player of this.players) {
            player.handTiles = [];
        }
        if (CHECK_SEVEN_PAIRS) {
            console.log("七对测试模式：为AI 2设置完整的七对牌型");
            debugLog(`[dealInitialTiles] 七对测试模式激活`);
            // 为AI 2玩家设置完整的七对牌型
            const aiPlayer = this.players.find(p => p.name === "AI 2");
            if (aiPlayer) {
                const pairs = [
                    new tile_1.Tile(tile_1.TileType.WAN, 1, 1), new tile_1.Tile(tile_1.TileType.WAN, 1, 2),
                    new tile_1.Tile(tile_1.TileType.WAN, 2, 3), new tile_1.Tile(tile_1.TileType.WAN, 2, 4),
                    new tile_1.Tile(tile_1.TileType.WAN, 3, 5), new tile_1.Tile(tile_1.TileType.WAN, 3, 6),
                    new tile_1.Tile(tile_1.TileType.WAN, 4, 7), new tile_1.Tile(tile_1.TileType.WAN, 4, 8),
                    new tile_1.Tile(tile_1.TileType.WAN, 5, 9), new tile_1.Tile(tile_1.TileType.WAN, 5, 10),
                    new tile_1.Tile(tile_1.TileType.WAN, 6, 11), new tile_1.Tile(tile_1.TileType.WAN, 6, 12),
                    // 直接完成最后一对
                    new tile_1.Tile(tile_1.TileType.WAN, 7, 13), new tile_1.Tile(tile_1.TileType.WAN, 7, 14)
                ];
                aiPlayer.handTiles = pairs;
                this.drawCount += 14; // 更新摸牌次数
                // 让AI 2的状态为ACTING，准备出牌
                aiPlayer.state = player_1.PlayerState.ACTING;
                this.currentPlayerIndex = this.players.indexOf(aiPlayer);
            }
            // 为其他玩家发牌
            for (let player of this.players) {
                if (player.name !== "AI 2" && player.handTiles.length === 0) {
                    for (let i = 0; i < 13; i++) {
                        const tile = this.drawTileFromWall(false);
                        if (tile) {
                            player.drawTile(tile);
                        }
                    }
                }
            }
        }
        else if (CHECK_THIRTEEN_ORPHANS) {
            console.log("十三幺测试模式：为AI 2设置完整的十三幺牌型");
            debugLog(`[dealInitialTiles] 十三幺测试模式激活`);
            // 为AI 2玩家设置完整的十三幺牌型（13种牌+1个对子）
            const aiPlayer = this.players.find(p => p.name === "AI 2");
            if (aiPlayer) {
                const orphans = [
                    new tile_1.Tile(tile_1.TileType.WAN, 1, 1), new tile_1.Tile(tile_1.TileType.WAN, 9, 2),
                    new tile_1.Tile(tile_1.TileType.TIAO, 1, 3), new tile_1.Tile(tile_1.TileType.TIAO, 9, 4),
                    new tile_1.Tile(tile_1.TileType.TONG, 1, 5), new tile_1.Tile(tile_1.TileType.TONG, 9, 6),
                    new tile_1.Tile(tile_1.TileType.FENG, 1, 7), new tile_1.Tile(tile_1.TileType.FENG, 2, 8),
                    new tile_1.Tile(tile_1.TileType.FENG, 3, 9), new tile_1.Tile(tile_1.TileType.FENG, 4, 10),
                    new tile_1.Tile(tile_1.TileType.JIAN, 1, 11), new tile_1.Tile(tile_1.TileType.JIAN, 2, 12),
                    new tile_1.Tile(tile_1.TileType.JIAN, 3, 13),
                    // 添加一个对子（把东风作为对子）
                    new tile_1.Tile(tile_1.TileType.FENG, 1, 14)
                ];
                aiPlayer.handTiles = orphans;
                this.drawCount += 14; // 更新摸牌次数
                // 让AI 2的状态为ACTING，准备出牌
                aiPlayer.state = player_1.PlayerState.ACTING;
                this.currentPlayerIndex = this.players.indexOf(aiPlayer);
            }
            // 为其他玩家发牌
            for (let player of this.players) {
                if (player.name !== "AI 2" && player.handTiles.length === 0) {
                    for (let i = 0; i < 13; i++) {
                        const tile = this.drawTileFromWall(false);
                        if (tile) {
                            player.drawTile(tile);
                        }
                    }
                }
            }
        }
        else if (CHECK_QING_YI_SE) {
            console.log("清一色测试模式：为AI 2设置接近清一色的牌型");
            debugLog(`[dealInitialTiles] 清一色测试模式激活`);
            // 为AI 2玩家设置接近清一色的牌型
            const aiPlayer = this.players.find(p => p.name === "AI 2");
            if (aiPlayer) {
                const qingYiSe = [
                    new tile_1.Tile(tile_1.TileType.WAN, 1, 1), new tile_1.Tile(tile_1.TileType.WAN, 1, 2), new tile_1.Tile(tile_1.TileType.WAN, 1, 3),
                    new tile_1.Tile(tile_1.TileType.WAN, 2, 4), new tile_1.Tile(tile_1.TileType.WAN, 3, 5), new tile_1.Tile(tile_1.TileType.WAN, 4, 6),
                    new tile_1.Tile(tile_1.TileType.WAN, 5, 7), new tile_1.Tile(tile_1.TileType.WAN, 6, 8), new tile_1.Tile(tile_1.TileType.WAN, 7, 9),
                    new tile_1.Tile(tile_1.TileType.WAN, 8, 10), new tile_1.Tile(tile_1.TileType.WAN, 9, 11), new tile_1.Tile(tile_1.TileType.WAN, 9, 12),
                    // 最后一张将在游戏中摸到
                    new tile_1.Tile(tile_1.TileType.WAN, 9, 13)
                ];
                aiPlayer.handTiles = qingYiSe;
                this.drawCount += 13; // 更新摸牌次数
                // 设置第14张牌为清一色的最后一张万牌
                const targetTile = new tile_1.Tile(tile_1.TileType.WAN, 2, 14);
                this.tiles[0] = targetTile; // 设置为首张牌，保证下一次会摸到
            }
            // 为其他玩家发牌
            for (let player of this.players) {
                if (player.name !== "AI 2" && player.handTiles.length === 0) {
                    for (let i = 0; i < 13; i++) {
                        const tile = this.drawTileFromWall(false);
                        if (tile) {
                            player.drawTile(tile);
                        }
                    }
                }
            }
        }
        else if (CHECK_PENG_PENG_HU) {
            console.log("碰碰胡测试模式：为AI 2设置接近碰碰胡的牌型");
            debugLog(`[dealInitialTiles] 碰碰胡测试模式激活`);
            // 为AI 2玩家设置接近碰碰胡的牌型
            const aiPlayer = this.players.find(p => p.name === "AI 2");
            if (aiPlayer) {
                const pengPengHu = [
                    new tile_1.Tile(tile_1.TileType.WAN, 1, 1), new tile_1.Tile(tile_1.TileType.WAN, 1, 2), new tile_1.Tile(tile_1.TileType.WAN, 1, 3),
                    new tile_1.Tile(tile_1.TileType.TIAO, 2, 4), new tile_1.Tile(tile_1.TileType.TIAO, 2, 5), new tile_1.Tile(tile_1.TileType.TIAO, 2, 6),
                    new tile_1.Tile(tile_1.TileType.TONG, 3, 7), new tile_1.Tile(tile_1.TileType.TONG, 3, 8), new tile_1.Tile(tile_1.TileType.TONG, 3, 9),
                    new tile_1.Tile(tile_1.TileType.FENG, 1, 10), new tile_1.Tile(tile_1.TileType.FENG, 1, 11), new tile_1.Tile(tile_1.TileType.FENG, 1, 12),
                    // 最后一张将在游戏中摸到
                    new tile_1.Tile(tile_1.TileType.JIAN, 1, 13)
                ];
                aiPlayer.handTiles = pengPengHu;
                this.drawCount += 13; // 更新摸牌次数
                // 设置第14张牌为碰碰胡的最后一张对子
                const targetTile = new tile_1.Tile(tile_1.TileType.JIAN, 1, 14);
                this.tiles[0] = targetTile; // 设置为首张牌，保证下一次会摸到
            }
            // 为其他玩家发牌
            for (let player of this.players) {
                if (player.name !== "AI 2" && player.handTiles.length === 0) {
                    for (let i = 0; i < 13; i++) {
                        const tile = this.drawTileFromWall(false);
                        if (tile) {
                            player.drawTile(tile);
                        }
                    }
                }
            }
        }
        else {
            // 常规发牌：每个玩家发13张牌
            for (let i = 0; i < 13; i++) {
                for (let player of this.players) {
                    const tile = this.drawTileFromWall(false); // 显式指定这不是杠后摸牌
                    if (tile) {
                        player.drawTile(tile);
                        // 这里不需要增加 drawCount，因为 drawTileFromWall 已经增加了
                    }
                }
            }
        }
        // 更新摸牌次数 = 4*13 = 52（正常情况）
        console.log(`发牌完成：摸牌次数=${this.drawCount}`);
        // 为每个玩家排序手牌
        for (let player of this.players) {
            player.sortHand();
        }
    }
    // 从牌山抓牌
    drawTileFromWall(isAfterGang = false) {
        debugLog(`[drawTileFromWall] 开始从牌山抓牌, 剩余牌数=${this.remainingTiles}, 杠后摸牌=${isAfterGang}, 当前游戏状态=${GameState[this.state]}`);
        if (this.remainingTiles <= 0) {
            debugLog(`[drawTileFromWall] 牌山已空，无法抓牌`);
            console.log("牌山已空，无法抓牌");
            this.state = GameState.ENDED;
            return null;
        }
        // 在摸牌前记录上一次的摸牌次数
        this.lastDrawCount = this.drawCount;
        debugLog(`[drawTileFromWall] 记录上一次摸牌次数=${this.lastDrawCount}, 当前玩家=${this.currentPlayerIndex}(${this.players[this.currentPlayerIndex].name})`);
        // 计算正确的索引：牌山尾部开始抓牌
        const tileIndex = this.tiles.length - this.remainingTiles;
        debugLog(`[drawTileFromWall] 计算抓牌索引=${tileIndex} (牌山长度=${this.tiles.length}, 剩余牌数=${this.remainingTiles})`);
        if (tileIndex < 0 || tileIndex >= this.tiles.length) {
            debugLog(`[drawTileFromWall] 抓牌错误: 索引越界 (${tileIndex}), 牌山长度=${this.tiles.length}, 剩余牌数=${this.remainingTiles}`);
            console.error(`抓牌错误: 索引越界 (${tileIndex}), 牌山长度 = ${this.tiles.length}, 剩余牌数 = ${this.remainingTiles}`);
            return null;
        }
        const tile = this.tiles[tileIndex];
        if (!tile) {
            debugLog(`[drawTileFromWall] 抓牌错误: 索引${tileIndex}处没有牌`);
            console.error(`抓牌错误: 索引 ${tileIndex} 处没有牌`);
            return null;
        }
        this.remainingTiles--;
        debugLog(`[drawTileFromWall] 剩余牌数减1，现在=${this.remainingTiles}`);
        // 每摸一张牌，增加摸牌次数
        this.drawCount++;
        debugLog(`[drawTileFromWall] 摸牌次数加1，现在=${this.drawCount}, 摸牌总计=${this.drawCount}+${this.remainingTiles}=${this.drawCount + this.remainingTiles}/${this.totalTiles}`);
        console.log(`摸牌: ${tile.toString()}, 当前摸牌次数: ${this.drawCount}, 上一次摸牌次数: ${this.lastDrawCount}`);
        debugLog(`[drawTileFromWall] 摸到牌=${tile.toString()}, 牌ID=${tile.id}`);
        // 确保剩余牌数不会变为负数
        if (this.remainingTiles < 0) {
            debugLog(`[drawTileFromWall] 警告: 剩余牌数变为负数, 重置为0`);
            console.error("剩余牌数变为负数, 重置为0");
            this.remainingTiles = 0;
        }
        // 检查摸牌后的牌平衡
        debugLog(`[drawTileFromWall] 摸牌后牌平衡: 摸牌次数=${this.drawCount}, 剩余牌数=${this.remainingTiles}, 总和=${this.drawCount + this.remainingTiles}/${this.totalTiles}`);
        return tile;
    }
    // 当前玩家摸牌
    currentPlayerDraw() {
        if (this.state !== GameState.PLAYING) {
            console.log(`摸牌失败：游戏状态不是PLAYING (${GameState[this.state]})`);
            return null;
        }
        // 检查是否在测试模式
        const isTestMode = process.argv.includes('--test');
        const currentPlayer = this.players[this.currentPlayerIndex];
        console.log(`玩家${currentPlayer.name}尝试摸牌`);
        if (currentPlayer.state !== player_1.PlayerState.ACTING) {
            console.log(`玩家${currentPlayer.name}不在行动状态，无法摸牌`);
            return null;
        }
        // 检查剩余牌数
        if (this.remainingTiles <= 0) {
            console.log("牌山已空，游戏结束");
            this.state = GameState.ENDED;
            return null;
        }
        // 从牌山抓一张牌
        const tile = this.drawTileFromWall();
        if (!tile) {
            console.log("摸牌失败，可能牌山已空");
            this.state = GameState.ENDED;
            return null;
        }
        // 将牌加入到玩家手牌
        currentPlayer.drawTile(tile);
        console.log(`${currentPlayer.name} 摸到了 ${tile.toString()}`);
        // 检查玩家是否可以自摸胡牌
        if (rules_1.RuleEngine.canHu(currentPlayer, null, isTestMode)) {
            console.log(`${currentPlayer.name} 摸牌后可以胡牌!`);
            // 如果是AI玩家，自动胡牌
            if (currentPlayer.type === player_1.PlayerType.AI) {
                console.log(`AI玩家${currentPlayer.name}选择自摸胡牌`);
                this.playerHu(this.currentPlayerIndex, null);
                return tile;
            }
            // 如果是人类玩家，让玩家选择是否胡牌
            // 这部分通常在UI层处理
        }
        // 检查是否可以杠
        const gangResult = rules_1.RuleEngine.canGang(currentPlayer);
        if (gangResult.canGang) {
            const gangTypeStr = gangResult.gangType === rules_1.GangType.AN_GANG ? "暗杠" : "补杠";
            console.log(`${currentPlayer.name} 摸牌后可以${gangTypeStr}!`);
            // 如果是AI玩家
            if (currentPlayer.type === player_1.PlayerType.AI) {
                console.log(`AI玩家${currentPlayer.name}选择执行${gangTypeStr}`);
                // AI总是选择杠
                this.playerGang(this.currentPlayerIndex, null, isTestMode);
                return tile;
            }
            // 如果是人类玩家，让玩家选择是否杠
            // 这部分通常在UI层处理
        }
        // 重要：移除AI自动出牌的逻辑，将由gameLoop处理
        if (currentPlayer.type === player_1.PlayerType.AI) {
            console.log(`AI玩家${currentPlayer.name}摸牌完成，等待gameLoop处理出牌`);
            // 确保AI玩家状态设置为ACTING，等待gameLoop处理
            currentPlayer.state = player_1.PlayerState.ACTING;
        }
        // 返回摸到的牌
        return tile;
    }
    // 当前玩家打出一张牌
    currentPlayerDiscard(tileIndex) {
        debugLog(`[game.currentPlayerDiscard] 开始处理, 牌索引=${tileIndex}`);
        // 检查游戏是否已结束
        if (this.state === GameState.ENDED) {
            debugLog(`[game.currentPlayerDiscard] 游戏已结束，无法出牌`);
            return null;
        }
        debugLog(`[game.currentPlayerDiscard] 当前游戏状态=${GameState[this.state]}, 当前玩家=${this.currentPlayerIndex}`);
        // 获取当前玩家
        const player = this.players[this.currentPlayerIndex];
        console.log(`玩家${player.name}状态: ${player_1.PlayerState[player.state]}`);
        console.log(`玩家手牌数量: ${player.handTiles.length}`);
        console.log(`玩家手牌: ${player.handTiles.map((t, i) => `${i}:${t.toString()}`).join(' ')}`);
        debugLog(`[game.currentPlayerDiscard] 玩家${player.name}状态=${player_1.PlayerState[player.state]}, 手牌数量=${player.handTiles.length}`);
        debugLog(`[game.currentPlayerDiscard] 玩家手牌: ${player.handTiles.map((t, i) => `${i}:${t.toString()}`).join(' ')}`);
        // 确保玩家处于行动状态
        if (player.state !== player_1.PlayerState.ACTING) {
            // 特殊处理：如果是AI玩家且手牌超过13张，强制允许出牌
            if (player.type === player_1.PlayerType.AI && player.handTiles.length > 13) {
                console.log(`AI玩家${player.name}手牌超过13张，强制设置状态为ACTING允许出牌`);
                debugLog(`[game.currentPlayerDiscard] AI玩家${player.name}手牌超过13张，强制设置状态: ${player_1.PlayerState[player.state]} -> 1`);
                player.state = player_1.PlayerState.ACTING;
            }
            else {
                debugLog(`[game.currentPlayerDiscard] 错误: 玩家${player.name}不处于行动状态(${player_1.PlayerState[player.state]})`);
                console.error(`错误: 玩家${player.name}不处于行动状态(${player_1.PlayerState[player.state]})`);
                return null;
            }
        }
        // 检查tile是否存在且在手牌中
        if (tileIndex < 0 || tileIndex >= player.handTiles.length) {
            debugLog(`[game.currentPlayerDiscard] 错误: 牌索引${tileIndex}超出范围(0-${player.handTiles.length - 1})`);
            console.error(`错误: 牌索引${tileIndex}超出范围(0-${player.handTiles.length - 1})`);
            return null;
        }
        // 获取要打出的牌
        const tile = player.handTiles[tileIndex];
        console.log(`准备打出的牌: ${tile.toString()}`);
        debugLog(`[game.currentPlayerDiscard] 准备打出的牌: ${tile.toString()}`);
        // 特殊处理：如果是AI玩家且手牌超过13张，强制确保出牌
        if (player.type === player_1.PlayerType.AI && player.handTiles.length > 13) {
            console.log(`AI玩家手牌数量${player.handTiles.length} > 13，强制确保出牌`);
            debugLog(`[game.currentPlayerDiscard] AI玩家手牌数量${player.handTiles.length} > 13，强制确保出牌`);
        }
        // 打出牌
        debugLog(`[game.currentPlayerDiscard] 调用player.discardTile(${tileIndex})前`);
        const discarded = player.discardTile(tileIndex);
        if (!discarded) {
            debugLog(`[game.currentPlayerDiscard] 出牌失败，返回null`);
            console.error(`出牌失败，返回null`);
            return null;
        }
        // 记录最后打出的牌
        this.lastDiscardedTile = discarded;
        debugLog(`[game.currentPlayerDiscard] 出牌成功，设置lastDiscardedTile=${discarded.toString()}`);
        // 检查其他玩家是否可以操作这张牌
        const waitingPlayerIds = this.checkOtherPlayersActions(discarded);
        debugLog(`[game.currentPlayerDiscard] 等待响应的玩家数量: ${waitingPlayerIds.length}`);
        // 如果有玩家可以操作，设置等待状态
        if (waitingPlayerIds.length > 0) {
            debugLog(`[game.currentPlayerDiscard] 设置游戏状态为WAITING_ACTION`);
            this.state = GameState.WAITING_ACTION;
            // 设置等待动作
            const allowedActions = this.getAvailableActions();
            const pendingAction = {
                tile: discarded,
                fromPlayerId: this.currentPlayerIndex,
                allowedActions,
                waitingPlayers: [...waitingPlayerIds]
            };
            this.pendingAction = pendingAction;
            debugLog(`[game.currentPlayerDiscard] 创建pendingAction: 等待玩家=[${waitingPlayerIds.join(',')}], 允许操作=[${allowedActions.join(',')}]`);
            // 如果有AI玩家需要决策，处理AI玩家的响应
            const waitingAIPlayers = waitingPlayerIds.filter(id => this.players[id].type === player_1.PlayerType.AI);
            if (waitingAIPlayers.length > 0) {
                debugLog(`[game.currentPlayerDiscard] 有${waitingAIPlayers.length}个AI玩家需要响应`);
                // 处理AI玩家的决策
                this.handleAIActions();
            }
        }
        else {
            // 如果没有玩家可以操作，进入下一回合
            debugLog(`[game.currentPlayerDiscard] 没有玩家可以操作，进入下一回合`);
            player.state = player_1.PlayerState.WAITING;
            this.nextTurn();
        }
        return discarded;
    }
    // 检查其他玩家是否可以吃碰杠胡
    checkOtherPlayersActions(tile) {
        const actionPlayers = [];
        const allAllowedActions = [];
        // 检查是否在测试模式
        const isTestMode = process.argv.includes('--test');
        // 检查每个玩家
        for (let i = 0; i < this.players.length; i++) {
            if (i === this.currentPlayerIndex) {
                continue; // 跳过当前玩家
            }
            const player = this.players[i];
            let canAction = false;
            const playerAllowedActions = [];
            // 检查胡
            if (rules_1.RuleEngine.canHu(player, null, isTestMode)) {
                canAction = true;
                playerAllowedActions.push(rules_1.PlayerAction.HU);
            }
            // 检查杠
            if (rules_1.RuleEngine.canGang(player, tile).canGang) {
                canAction = true;
                playerAllowedActions.push(rules_1.PlayerAction.GANG);
            }
            // 检查碰
            if (rules_1.RuleEngine.canPeng(player, tile)) {
                canAction = true;
                playerAllowedActions.push(rules_1.PlayerAction.PENG);
            }
            // 检查吃（只有下家可以吃）
            if ((i === (this.currentPlayerIndex + 1) % 4) && rules_1.RuleEngine.canChi(player, tile)) {
                canAction = true;
                playerAllowedActions.push(rules_1.PlayerAction.CHI);
            }
            if (canAction) {
                actionPlayers.push(i);
                // 将该玩家的动作添加到总动作列表中
                playerAllowedActions.forEach(action => {
                    if (!allAllowedActions.includes(action)) {
                        allAllowedActions.push(action);
                    }
                });
            }
        }
        if (actionPlayers.length > 0) {
            // 设置等待玩家动作
            this.pendingAction = {
                tile,
                fromPlayerId: this.currentPlayerIndex,
                allowedActions: [...new Set(allAllowedActions)], // 去重
                waitingPlayers: actionPlayers
            };
            // 如果只有AI玩家可以操作，自动处理
            if (actionPlayers.every(id => this.players[id].type === player_1.PlayerType.AI)) {
                this.handleAIActions();
            }
            else {
                // 设置超时处理（实际实现中可能需要添加）
                // this.pendingAction.timeoutId = setTimeout(() => this.handleActionTimeout(), 10000);
            }
        }
        return actionPlayers;
    }
    // 处理AI玩家的自动行动
    handleAIActions() {
        debugLog(`[handleAIActions] 开始处理AI玩家自动行动`);
        if (!this.pendingAction || !this.pendingAction.waitingPlayers || this.pendingAction.waitingPlayers.length === 0) {
            debugLog(`[handleAIActions] 没有待处理的AI动作, pendingAction=${!!this.pendingAction}, 游戏状态=${GameState[this.state]}`);
            console.log("没有待处理的AI动作");
            return;
        }
        // 检查是否在测试模式
        const isTestMode = process.argv.includes('--test');
        debugLog(`[handleAIActions] 待处理的玩家: ${this.pendingAction.waitingPlayers.join(', ')}`);
        console.log(`处理AI玩家自动行动，等待玩家数：${this.pendingAction.waitingPlayers.length}`);
        // 记录原始等待玩家列表，以避免在循环中修改它
        const waitingPlayerIds = [...this.pendingAction.waitingPlayers];
        debugLog(`[handleAIActions] 原始等待玩家列表: ${waitingPlayerIds.join(', ')}, 当前玩家=${this.currentPlayerIndex}`);
        debugLog(`[handleAIActions] 目标牌=${this.pendingAction.tile.toString()}, 来源玩家=${this.pendingAction.fromPlayerId}(${this.players[this.pendingAction.fromPlayerId].name})`);
        debugLog(`[handleAIActions] 允许的操作=${this.pendingAction.allowedActions.join(', ')}`);
        // 优先级：胡 > 杠 > 碰 > 吃 > 过
        for (const playerId of waitingPlayerIds) {
            // 检查pendingAction是否存在，如果之前的操作已清除pendingAction则退出循环
            if (!this.pendingAction) {
                debugLog(`[handleAIActions] 待处理动作已清除，终止处理`);
                console.log("待处理动作已清除，终止处理");
                return;
            }
            const player = this.players[playerId];
            debugLog(`[handleAIActions] 处理玩家${playerId} (${player.name}), 类型=${player_1.PlayerType[player.type]}, 手牌数=${player.handTiles.length}`);
            // 跳过人类玩家
            if (player.type !== player_1.PlayerType.AI) {
                debugLog(`[handleAIActions] 玩家${player.name}是人类玩家，跳过自动处理`);
                console.log(`玩家 ${playerId} 是人类玩家，跳过自动处理`);
                continue;
            }
            // 检查该玩家是否仍在等待列表中（可能已被之前的操作移除）
            if (!this.pendingAction.waitingPlayers.includes(playerId)) {
                debugLog(`[handleAIActions] 玩家${player.name}不再等待列表中，跳过处理`);
                console.log(`玩家 ${playerId} 不再等待列表中，跳过处理`);
                continue;
            }
            const targetTile = this.pendingAction.tile;
            debugLog(`[handleAIActions] AI玩家${player.name}处理对${targetTile.toString()}的响应`);
            console.log(`AI玩家 ${player.name} 处理对 ${targetTile.toString()} 的响应`);
            // 打印允许的动作
            debugLog(`[handleAIActions] 允许的动作: ${this.pendingAction.allowedActions.join(', ')}`);
            console.log(`允许的动作：${this.pendingAction.allowedActions.join(', ')}`);
            // 按优先级检查可执行的动作
            let actionTaken = false;
            // 胡
            if (this.pendingAction.allowedActions.includes(rules_1.PlayerAction.HU) && rules_1.RuleEngine.canHu(player, null, isTestMode)) {
                debugLog(`[handleAIActions] AI玩家${player.name}可以胡牌，选择胡牌`);
                console.log(`AI玩家 ${player.name} 选择胡牌`);
                if (this.playerHu(playerId, targetTile)) {
                    debugLog(`[handleAIActions] AI玩家${player.name}胡牌成功, 游戏状态=${GameState[this.state]}`);
                    console.log(`AI玩家 ${player.name} 胡牌成功`);
                    actionTaken = true;
                    break; // 胡牌后游戏可能结束，退出循环
                }
                else {
                    debugLog(`[handleAIActions] AI玩家${player.name}胡牌失败, 继续检查其他操作`);
                }
            }
            else if (this.pendingAction.allowedActions.includes(rules_1.PlayerAction.HU)) {
                debugLog(`[handleAIActions] 动作中包含胡牌，但检测到AI玩家${player.name}实际不能胡牌`);
            }
            // 杠
            if (!actionTaken &&
                this.pendingAction.allowedActions.includes(rules_1.PlayerAction.GANG) &&
                rules_1.RuleEngine.canGang(player, targetTile).canGang) {
                debugLog(`[handleAIActions] AI玩家${player.name}可以杠牌，选择杠牌`);
                console.log(`AI玩家 ${player.name} 选择杠牌`);
                if (this.playerGang(playerId, targetTile, isTestMode)) {
                    debugLog(`[handleAIActions] AI玩家${player.name}杠牌成功, 游戏状态=${GameState[this.state]}`);
                    console.log(`AI玩家 ${player.name} 杠牌成功`);
                    actionTaken = true;
                    break; // 杠牌后该AI玩家会继续行动，退出循环
                }
                else {
                    debugLog(`[handleAIActions] AI玩家${player.name}杠牌失败, 继续检查其他操作`);
                }
            }
            else if (this.pendingAction.allowedActions.includes(rules_1.PlayerAction.GANG)) {
                const gangResult = rules_1.RuleEngine.canGang(player, targetTile);
                debugLog(`[handleAIActions] 动作中包含杠牌，但检测到AI玩家${player.name}实际${gangResult.canGang ? '可以' : '不能'}杠牌，杠牌类型=${gangResult.gangType}`);
            }
            // 碰
            if (!actionTaken &&
                this.pendingAction.allowedActions.includes(rules_1.PlayerAction.PENG) &&
                rules_1.RuleEngine.canPeng(player, targetTile)) {
                debugLog(`[handleAIActions] AI玩家${player.name}可以碰牌，选择碰牌`);
                console.log(`AI玩家 ${player.name} 选择碰牌`);
                if (this.playerPeng(playerId, targetTile)) {
                    debugLog(`[handleAIActions] AI玩家${player.name}碰牌成功, 游戏状态=${GameState[this.state]}`);
                    console.log(`AI玩家 ${player.name} 碰牌成功`);
                    actionTaken = true;
                    // 碰完之后需要打出一张牌
                    debugLog(`[handleAIActions] AI玩家${player.name}碰牌后需要出牌, 手牌数=${player.handTiles.length}`);
                    const aiMoveIndex = player.getAIMove();
                    debugLog(`[handleAIActions] AI碰牌后选择出牌索引: ${aiMoveIndex}, 有效范围: 0-${player.handTiles.length - 1}`);
                    console.log(`AI碰牌后选择打出索引：${aiMoveIndex}`);
                    if (aiMoveIndex >= 0 && aiMoveIndex < player.handTiles.length) {
                        debugLog(`[handleAIActions] AI碰牌后选择的出牌索引有效，执行出牌`);
                        this.currentPlayerDiscard(aiMoveIndex);
                    }
                    else if (player.handTiles.length > 0) {
                        debugLog(`[handleAIActions] AI碰牌后选择的出牌索引无效，改为打出第一张牌`);
                        console.log(`索引无效，尝试打出第一张牌`);
                        this.currentPlayerDiscard(0);
                    }
                    else {
                        debugLog(`[handleAIActions] 警告: AI玩家${player.name}碰牌后手牌为空，无法出牌`);
                    }
                    break; // 碰牌后该AI玩家已行动，退出循环
                }
                else {
                    debugLog(`[handleAIActions] AI玩家${player.name}碰牌失败, 继续检查其他操作`);
                }
            }
            else if (this.pendingAction.allowedActions.includes(rules_1.PlayerAction.PENG)) {
                debugLog(`[handleAIActions] 动作中包含碰牌，但检测到AI玩家${player.name}实际${rules_1.RuleEngine.canPeng(player, targetTile) ? '可以' : '不能'}碰牌`);
            }
            // 吃（只有下家才能吃）
            const nextPlayerIndex = (this.pendingAction.fromPlayerId + 1) % this.players.length;
            if (!actionTaken &&
                playerId === nextPlayerIndex &&
                this.pendingAction.allowedActions.includes(rules_1.PlayerAction.CHI)) {
                // 查找所有可能的吃牌组合
                const chiCombinations = rules_1.RuleEngine.findChiCombinations(player.handTiles, targetTile);
                debugLog(`[handleAIActions] 检查AI玩家${player.name}是否可以吃牌, 找到${chiCombinations.length}种组合`);
                if (chiCombinations.length > 0) {
                    // 选择第一种组合方式
                    const selectedCombo = chiCombinations[0];
                    debugLog(`[handleAIActions] AI玩家${player.name}可以吃牌，选择第一种组合: ${selectedCombo.map(t => t.toString()).join(',')}`);
                    console.log(`AI玩家 ${player.name} 选择吃牌，组合：${selectedCombo.map(t => t.toString()).join(',')}`);
                    if (this.playerChi(playerId, selectedCombo, targetTile)) {
                        debugLog(`[handleAIActions] AI玩家${player.name}吃牌成功, 游戏状态=${GameState[this.state]}`);
                        console.log(`AI玩家 ${player.name} 吃牌成功`);
                        actionTaken = true;
                        // 吃完之后需要打出一张牌
                        debugLog(`[handleAIActions] AI玩家${player.name}吃牌后需要出牌, 手牌数=${player.handTiles.length}`);
                        const aiMoveIndex = player.getAIMove();
                        debugLog(`[handleAIActions] AI吃牌后选择出牌索引: ${aiMoveIndex}, 有效范围: 0-${player.handTiles.length - 1}`);
                        console.log(`AI吃牌后选择打出索引：${aiMoveIndex}`);
                        if (aiMoveIndex >= 0 && aiMoveIndex < player.handTiles.length) {
                            debugLog(`[handleAIActions] AI吃牌后选择的出牌索引有效，执行出牌`);
                            this.currentPlayerDiscard(aiMoveIndex);
                        }
                        else if (player.handTiles.length > 0) {
                            debugLog(`[handleAIActions] AI吃牌后选择的出牌索引无效，改为打出第一张牌`);
                            console.log(`索引无效，尝试打出第一张牌`);
                            this.currentPlayerDiscard(0);
                        }
                        else {
                            debugLog(`[handleAIActions] 警告: AI玩家${player.name}吃牌后手牌为空，无法出牌`);
                        }
                        break; // 吃牌后该AI玩家已行动，退出循环
                    }
                    else {
                        debugLog(`[handleAIActions] AI玩家${player.name}吃牌失败, 继续检查其他操作`);
                    }
                }
                else {
                    debugLog(`[handleAIActions] AI玩家${player.name}没有可行的吃牌组合`);
                }
            }
            else if (this.pendingAction.allowedActions.includes(rules_1.PlayerAction.CHI)) {
                debugLog(`[handleAIActions] 动作中包含吃牌，但检测到AI玩家${player.name}${playerId === nextPlayerIndex ? '是' : '不是'}下家，无法吃牌`);
            }
            // 如果没有选择特殊操作，则"过"
            if (!actionTaken) {
                debugLog(`[handleAIActions] AI玩家${player.name}没有执行任何特殊操作，选择"过"`);
                console.log(`AI玩家 ${player.name} 选择过`);
                this.playerPass(playerId);
            }
        }
        // 检查是否还有pendingAction（可能在处理过程中被清除）
        if (!this.pendingAction) {
            debugLog(`[handleAIActions] 处理完成，pendingAction已清除`);
            console.log("待处理动作已处理完成");
            return;
        }
        // 如果还有等待的玩家（人类玩家），不做其他处理
        if (this.pendingAction.waitingPlayers.length > 0) {
            const remainingAIPlayers = this.pendingAction.waitingPlayers.filter(id => this.players[id].type === player_1.PlayerType.AI);
            if (remainingAIPlayers.length > 0) {
                debugLog(`[handleAIActions] 还有${remainingAIPlayers.length}个AI玩家待处理，递归处理: ${remainingAIPlayers.join(',')}`);
                console.log(`还有 ${remainingAIPlayers.length} 个AI玩家待处理，递归处理`);
                // 递归处理剩余的AI玩家，但限制递归深度
                this.handleAIActions();
            }
            else {
                debugLog(`[handleAIActions] 还有${this.pendingAction.waitingPlayers.length}个人类玩家待处理: ${this.pendingAction.waitingPlayers.join(',')}`);
                console.log(`还有 ${this.pendingAction.waitingPlayers.length} 个玩家（人类）待处理`);
            }
            return;
        }
        // 所有AI玩家都处理完毕，如果还有pendingAction，表明所有人都选择了"过"
        if (this.pendingAction) {
            debugLog(`[handleAIActions] 所有玩家都选择了过，清除pendingAction并进入下一回合`);
            console.log("所有玩家都选择了过，清除待处理动作，进入下一回合");
            this.clearPendingAction();
            this.nextTurn();
        }
    }
    // 玩家选择吃
    playerChi(playerId, tiles, targetTile) {
        if (this.state !== GameState.WAITING_ACTION || !this.pendingAction) {
            return false;
        }
        const player = this.players[playerId];
        if (!player)
            return false;
        // 执行吃牌
        const success = player.chi(tiles, targetTile);
        if (success) {
            // 清除等待状态并确保游戏状态转为PLAYING
            this.clearPendingAction();
            // 设置当前玩家为吃牌的玩家
            this.currentPlayerIndex = playerId;
            player.state = player_1.PlayerState.ACTING;
            // 不需要摸牌，玩家需要打出一张牌
            // 如果是AI玩家，自动出牌
            if (player.type === player_1.PlayerType.AI) {
                const aiMove = player.getAIMove();
                this.currentPlayerDiscard(aiMove);
            }
            return true;
        }
        return false;
    }
    // 玩家选择碰
    playerPeng(playerId, targetTile) {
        if (this.state !== GameState.WAITING_ACTION || !this.pendingAction) {
            return false;
        }
        const player = this.players[playerId];
        if (!player)
            return false;
        // 执行碰牌
        const success = player.peng(targetTile);
        if (success) {
            // 清除等待状态并确保游戏状态转为PLAYING
            this.clearPendingAction();
            // 设置当前玩家为碰牌的玩家
            this.currentPlayerIndex = playerId;
            player.state = player_1.PlayerState.ACTING;
            // 不需要摸牌，玩家需要打出一张牌
            // 如果是AI玩家，自动出牌
            if (player.type === player_1.PlayerType.AI) {
                const aiMove = player.getAIMove();
                this.currentPlayerDiscard(aiMove);
            }
            return true;
        }
        return false;
    }
    // 玩家选择杠
    playerGang(playerId, targetTile, isTestMode = false) {
        debugLog(`[playerGang] 开始处理, 玩家=${playerId}, 目标牌=${targetTile?.toString() || 'null'}`);
        const player = this.players[playerId];
        if (!player) {
            debugLog(`[playerGang] 错误: 找不到玩家${playerId}`);
            return false;
        }
        let gangType = '杠';
        let gangSourceType = '';
        // 清除等待状态
        if (this.state === GameState.WAITING_ACTION && this.pendingAction) {
            debugLog(`[playerGang] 清除等待状态, 之前状态=${GameState[this.state]}`);
            this.clearPendingAction();
        }
        // 有目标牌，说明是明杠
        if (targetTile) {
            debugLog(`[playerGang] 明杠操作, 目标牌=${targetTile.toString()}`);
            gangType = '明杠';
            gangSourceType = '明';
            // 明杠需要从弃牌中移除目标牌
            const fromPlayerId = this.currentPlayerIndex;
            const fromPlayer = this.players[fromPlayerId];
            // 从弃牌堆中找到并移除这张牌
            if (fromPlayer && fromPlayer.discardedTiles.length > 0) {
                debugLog(`[playerGang] 尝试从玩家${fromPlayer.name}的弃牌中移除${targetTile.toString()}`);
                const index = fromPlayer.discardedTiles.findIndex(t => t.id === targetTile.id);
                if (index !== -1) {
                    fromPlayer.discardedTiles.splice(index, 1);
                    debugLog(`[playerGang] 成功从弃牌中移除目标牌`);
                }
                else {
                    debugLog(`[playerGang] 错误: 弃牌中找不到目标牌`);
                    console.error(`错误: 无法找到玩家${fromPlayer.name}弃牌堆中的${targetTile.toString()}`);
                    console.log(`当前弃牌: ${fromPlayer.discardedTiles.map(t => t.toString()).join(', ')}`);
                }
            }
        }
        else {
            // 没有目标牌，是暗杠或补杠
            debugLog(`[playerGang] 暗杠或补杠操作`);
            // 具体是暗杠还是补杠，会在player.gang()中确定
            gangType = '暗杠或补杠';
            gangSourceType = '自';
        }
        // 玩家执行杠操作
        debugLog(`[playerGang] 执行玩家${player.name}的杠操作`);
        const success = player.gang(targetTile);
        if (!success) {
            debugLog(`[playerGang] 玩家${player.name}杠牌失败`);
            return false;
        }
        debugLog(`[playerGang] 玩家${player.name}杠牌成功`);
        // 获取杠的类型（明杠、暗杠或补杠）
        const gangSet = player.revealedSets[player.revealedSets.length - 1];
        if (gangSet && gangSet.source) {
            gangSourceType = gangSet.source;
            if (gangSet.source === 'an') {
                gangType = '暗杠';
            }
            else if (gangSet.source === 'bu') {
                gangType = '补杠';
            }
            debugLog(`[playerGang] 杠牌类型=${gangType}, 来源=${gangSourceType}`);
        }
        if (isTestMode) {
            console.log(`${player.name}成功执行${gangType}(${gangSourceType})操作`);
            console.log(`杠后手牌: ${player.handTiles.map(t => t.toString()).join(', ')}`);
            console.log(`杠后亮出牌组: ${player.revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]${set.source ? `(${set.source})` : ''}`).join(', ')}`);
        }
        // 清除等待状态
        this.clearPendingAction();
        // 设置当前玩家为杠牌的玩家
        this.currentPlayerIndex = playerId;
        player.state = player_1.PlayerState.ACTING;
        debugLog(`[playerGang] 将玩家${player.name}设置为当前玩家, 状态=ACTING`);
        // 杠后需要从牌墙摸一张牌
        debugLog(`[playerGang] 杠后摸牌开始`);
        const tile = this.drawTileFromWall();
        if (tile) {
            debugLog(`[playerGang] 杠后摸牌成功=${tile.toString()}`);
            player.drawTile(tile);
            debugLog(`[playerGang] 已将摸到的牌加入到玩家手牌`);
            if (isTestMode) {
                console.log(`${player.name}${gangType}后摸牌: ${tile.toString()}`);
                // 再次重新计算牌的总数（摸牌后）
                let totalHandTiles = this.players.reduce((sum, p) => sum + p.handTiles.length, 0);
                let totalDiscardTiles = this.players.reduce((sum, p) => sum + p.discardedTiles.length, 0);
                let totalRevealedTiles = this.players.reduce((sum, p) => sum + p.revealedSets.reduce((setSum, set) => setSum + set.tiles.length, 0), 0);
                let totalRemainingTiles = this.remainingTiles;
                console.log(`摸牌后牌数统计: 手牌=${totalHandTiles}, 弃牌=${totalDiscardTiles}, 亮出=${totalRevealedTiles}, 剩余=${totalRemainingTiles}`);
                console.log(`总计: ${totalHandTiles + totalDiscardTiles + totalRevealedTiles + totalRemainingTiles}`);
                console.log(`杠后验证: ${this.checkCardBalance(true)}`);
            }
            // 检查杠后是否可以胡
            debugLog(`[playerGang] 检查杠后是否可以胡牌`);
            if (rules_1.RuleEngine.canHu(player)) {
                debugLog(`[playerGang] 玩家${player.name}杠上开花!`);
                if (isTestMode) {
                    console.log(`${player.name}杠上开花!`);
                }
                // 使用合适的胡牌类型
                const huType = rules_1.HuType.PING_HU;
                debugLog(`[playerGang] 执行杠上开花胡牌`);
                this.playerHu(playerId, null, huType);
                return true;
            }
            // 如果是AI玩家，自动出牌
            if (player.type === player_1.PlayerType.AI) {
                debugLog(`[playerGang] AI玩家${player.name}自动出牌`);
                const aiMove = player.getAIMove();
                if (isTestMode) {
                    console.log(`AI玩家${player.name}自动出牌`);
                }
                debugLog(`[playerGang] AI选择出牌索引=${aiMove}`);
                this.currentPlayerDiscard(aiMove);
            }
            return true;
        }
        else {
            debugLog(`[playerGang] 杠后摸牌失败，可能牌山已空`);
            console.log("杠后摸牌失败，可能牌山已空");
            // 设置游戏状态为结束
            debugLog(`[playerGang] 设置游戏状态为ENDED`);
            this.state = GameState.ENDED;
            return false;
        }
    }
    // 结束游戏
    endGame(winner) {
        this.state = GameState.ENDED;
        // 更新风圈和庄家
        if (winner && winner.id === this.bankerIndex) {
            // 如果庄家胡牌，庄家连庄
        }
        else {
            // 否则庄家向下移动
            this.bankerIndex = (this.bankerIndex + 1) % 4;
            // 如果一圈结束，风圈向下移动
            if (this.bankerIndex === 0) {
                this.windRound = (this.windRound + 1) % 4;
            }
        }
    }
    // 获取游戏状态信息
    getGameStateInfo(isTestMode = false, checkUpdates = false) {
        // 验证牌数是否正确（摸牌次数 + 剩余牌数应该等于总牌数）
        const drawPlusRemaining = this.drawCount + this.remainingTiles;
        // 严格验证，不允许任何误差
        const isDrawCountValid = drawPlusRemaining === this.totalTiles;
        // 只有当checkUpdates为true时才进行检查，但不更新lastDrawCount
        if (checkUpdates) {
            // 检查摸牌次数是否正常递增
            if (this.drawCount < this.lastDrawCount) {
                console.error(`警告: 当前摸牌次数(${this.drawCount})小于上一次的摸牌次数(${this.lastDrawCount})!`);
            }
            // 检查当前摸牌次数是否与上一次相同
            if (this.drawCount === this.lastDrawCount && this.lastDrawCount !== 0 && this.drawCount !== 0) {
                console.warn(`警告: 当前摸牌次数(${this.drawCount})与上一次的摸牌次数相同!`);
            }
        }
        // 输出消息
        let output = "\n==== 游戏状态 ====\n";
        output += "==== 玩家分数 ====\n";
        // 玩家分数
        for (const player of this.players) {
            output += `${player.name}: ${player.score}分  `;
        }
        output += "\n\n";
        // 添加上一次摸牌次数的DEBUG信息
        output += `上一次摸牌次数: ${this.lastDrawCount}\n`;
        // 添加摸牌次数验证
        output += `摸牌次数: ${this.drawCount} (剩余牌数 + 摸牌次数 = ${this.remainingTiles} + ${this.drawCount} = ${drawPlusRemaining}) [应等于${this.totalTiles}  ${isDrawCountValid ? '✓' : '✗'}]\n\n`;
        // 只有当checkUpdates为true时才更新lastDrawCount
        if (checkUpdates) {
            // 更新 lastDrawCount 以便下次比较
            this.lastDrawCount = this.drawCount;
        }
        // 添加总牌数信息
        output += `总牌数: ${this.totalTiles}\n`;
        output += `剩余牌数: ${this.remainingTiles}/${this.totalTiles}\n`;
        // 计算各种牌的数量
        let handTilesCount = this.players.reduce((sum, player) => sum + player.handTiles.length, 0);
        let discardedTilesCount = this.players.reduce((sum, player) => sum + player.discardedTiles.length, 0);
        let revealedTilesCount = this.players.reduce((sum, player) => {
            return sum + player.revealedSets.reduce((setSum, set) => setSum + set.tiles.length, 0);
        }, 0);
        // 计算各种杠牌调整
        const anGangCount = this.players.reduce((sum, player) => sum + player.revealedSets.filter(set => set.type === 'GANG' && set.source === 'an').length, 0);
        const mingGangCount = this.players.reduce((sum, player) => sum + player.revealedSets.filter(set => set.type === 'GANG' && set.source === 'ming').length, 0);
        const buGangCount = this.players.reduce((sum, player) => sum + player.revealedSets.filter(set => set.type === 'GANG' && set.source === 'bu').length, 0);
        // 杠牌调整值 - 每个补杠应该减去1（补杠时比实际牌数多出1张）
        const totalGangAdjustment = -buGangCount; // 补杠牌数调整为-1
        // 计算所有牌的总数（包含杠牌调整）
        const totalCalc = handTilesCount + discardedTilesCount + revealedTilesCount + this.remainingTiles + totalGangAdjustment;
        // 检查是否与总牌数一致
        const isBalanced = totalCalc === this.totalTiles;
        // 格式化输出
        output += `牌数分布: 手牌${handTilesCount}+弃牌${discardedTilesCount}+亮出${revealedTilesCount}+剩余${this.remainingTiles}=${handTilesCount + discardedTilesCount + revealedTilesCount + this.remainingTiles}/${this.totalTiles} [实际=${totalCalc}/${this.totalTiles} ${isBalanced ? '✓' : '✗'}] [杠牌调整=${totalGangAdjustment} (明杠${mingGangCount}, 暗杠${anGangCount}, 补杠${buGangCount})]\n`;
        output += ` [实际=${totalCalc}/${this.totalTiles} ${isBalanced ? '✓' : '✗'}] [杠牌调整=${totalGangAdjustment} (明杠${mingGangCount}, 暗杠${anGangCount}, 补杠${buGangCount})]\n`;
        output += `当前玩家: ${this.players[this.currentPlayerIndex].name}\n`;
        output += `当前风圈: ${['东风圈', '南风圈', '西风圈', '北风圈'][this.windRound]}\n`;
        output += `庄家: ${this.players[this.bankerIndex].name}\n`;
        output += `游戏状态: ${GameState[this.state]}\n\n`;
        // 输出每个玩家的信息
        output += "\n玩家信息:\n";
        for (let player of this.players) {
            output += `${player.name}\n`;
            output += `  已亮出: ${player.revealedSets.length > 0 ? player.getRevealedSetsString() : '无'} \n`;
            output += `  弃牌: ${player.discardedTiles.length > 0 ? player.getDiscardedString() : '无'} \n`;
            output += `  手牌数量: ${player.handTiles.length}  弃牌数量: ${player.discardedTiles.length}  亮出牌组: ${player.revealedSets.length}组\n`;
            // 如果是测试模式，显示手牌详情
            if (isTestMode || player.type === player_1.PlayerType.HUMAN) {
                output += `  手牌: ${player.getHandString()} \n`;
            }
            output += "\n";
        }
        return output;
    }
    // 检查牌数平衡
    checkCardBalance(isTestMode = false) {
        // 计算手牌总数
        let handTilesCount = 0;
        for (const player of this.players) {
            handTilesCount += player.handTiles.length;
        }
        // 计算弃牌总数
        let discardedTilesCount = 0;
        for (const player of this.players) {
            discardedTilesCount += player.discardedTiles.length;
        }
        // 计算已亮出的牌组总数
        let revealedTilesCount = 0;
        let anGangCount = 0; // 暗杠数量
        let mingGangCount = 0; // 明杠数量
        let buGangCount = 0; // 补杠数量
        for (const player of this.players) {
            for (const set of player.revealedSets) {
                revealedTilesCount += set.tiles.length;
                // 统计不同类型的杠
                if (set.type === 'GANG') {
                    if (set.source === 'an') {
                        anGangCount++;
                    }
                    else if (set.source === 'ming') {
                        mingGangCount++;
                    }
                    else if (set.source === 'bu') {
                        buGangCount++;
                    }
                }
            }
        }
        // 计算总牌数（所有玩家手牌 + 所有玩家弃牌 + 亮出的牌 + 剩余牌山）
        const calculatedTotal = handTilesCount + discardedTilesCount + revealedTilesCount + this.remainingTiles;
        // 杠牌调整总和 - 现在知道不需要额外调整，所有牌已经被计算到手牌或亮出的组合中
        const totalGangAdjustment = 0;
        // 生成调试信息
        let debugInfo = `手牌${handTilesCount}+弃牌${discardedTilesCount}+亮出${revealedTilesCount}+剩余${this.remainingTiles}=${calculatedTotal}/${this.totalTiles}`;
        // 检查总牌数
        const adjustedTotal = calculatedTotal + totalGangAdjustment;
        // 严格验证：总牌数必须等于136，不允许任何误差（即使在测试模式下）
        const isValidTotal = adjustedTotal === this.totalTiles;
        // 显示调试信息
        debugInfo += ` [实际=${adjustedTotal}/${this.totalTiles} ${isValidTotal ? "✓" : "✗"}]`;
        debugInfo += ` [杠牌调整=${totalGangAdjustment} (明杠${mingGangCount}, 暗杠${anGangCount}, 补杠${buGangCount})]`;
        // 如果牌数不正确，记录警告并终止程序
        if (!isValidTotal) {
            const errorMessage = `牌数不平衡：手牌=${handTilesCount}, 弃牌=${discardedTilesCount}, 亮出=${revealedTilesCount}, 剩余=${this.remainingTiles}, 总计=${adjustedTotal}, 预期=${this.totalTiles}`;
            console.error(errorMessage);
            // 打印详细的牌数信息，帮助排查问题
            this.players.forEach((player, idx) => {
                console.error(`玩家${idx} (${player.name})：`);
                console.error(`- 手牌(${player.handTiles.length}): ${player.handTiles.map(t => t.toString()).join(', ')}`);
                console.error(`- 弃牌(${player.discardedTiles.length}): ${player.discardedTiles.map(t => t.toString()).join(', ')}`);
                console.error(`- 亮出(${player.revealedSets.reduce((sum, set) => sum + set.tiles.length, 0)}): ${player.revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]${set.source ? `(${set.source})` : ''}`).join(', ')}`);
            });
            console.error(`剩余牌(${this.remainingTiles})`);
            // 在非测试环境或强制严格检查时终止程序
            if (process.env.IGNORE_TILE_BALANCE_CHECK !== 'true' || process.env.FORCE_STRICT_TILE_CHECK === 'true') {
                console.error("严重错误：牌数不平衡，游戏终止");
                process.exit(1);
            }
        }
        return debugInfo;
    }
    // 获取当前可用的动作
    getAvailableActions() {
        if (this.state === GameState.WAITING_ACTION && this.pendingAction) {
            const humanWaitingIndex = this.pendingAction.waitingPlayers.find(id => this.players[id].type === player_1.PlayerType.HUMAN);
            if (humanWaitingIndex !== undefined) {
                return this.pendingAction.allowedActions;
            }
        }
        return [];
    }
    // 在测试模式下自动为人类玩家打出一张牌
    autoPlayForHumanInTestMode() {
        // 确保游戏状态是PLAYING且当前是人类玩家的回合
        if (this.state !== GameState.PLAYING) {
            console.log(`测试模式: 自动出牌失败，当前游戏状态不是PLAYING: ${GameState[this.state]}`);
            return false;
        }
        const player = this.players[this.currentPlayerIndex];
        if (player.type !== player_1.PlayerType.HUMAN) {
            console.log(`测试模式: 自动出牌失败，当前玩家不是人类玩家: ${player.name}`);
            return false;
        }
        if (player.state !== player_1.PlayerState.ACTING) {
            console.log(`测试模式: 自动出牌失败，当前玩家状态不是ACTING: ${player_1.PlayerState[player.state]}`);
            return false;
        }
        try {
            console.log(`测试模式: 为人类玩家(${player.name})自动选择一张牌打出`);
            console.log(`当前手牌数量: ${player.handTiles.length}`);
            console.log(`玩家手牌: ${player.handTiles.map((t, i) => `${i}:${t.toString()}`).join(' ')}`);
            if (player.handTiles.length === 0) {
                console.log(`测试模式: 手牌为空，无法出牌`);
                return false;
            }
            // 随机选择一张牌打出
            const randomIndex = Math.floor(Math.random() * player.handTiles.length);
            const tileToDiscard = player.handTiles[randomIndex];
            console.log(`测试模式: 自动选择打出 ${tileToDiscard.toString()} (索引: ${randomIndex})`);
            // 调用打牌方法
            console.log(`测试模式: 开始执行currentPlayerDiscard方法`);
            const result = this.currentPlayerDiscard(randomIndex);
            if (result) {
                console.log(`测试模式: 玩家${player.name}自动打出${result.toString()}成功`);
                console.log(`游戏状态: ${GameState[this.state]}, 当前玩家ID: ${this.currentPlayerIndex}`);
                return true;
            }
            else {
                console.log(`测试模式: 自动出牌失败，currentPlayerDiscard返回null`);
                console.log(`出牌失败原因可能是索引无效: ${randomIndex} (最大索引: ${player.handTiles.length - 1})`);
                // 如果随机选择失败，尝试使用第一张牌
                if (randomIndex !== 0 && player.handTiles.length > 0) {
                    console.log(`尝试打出第一张牌`);
                    const firstResult = this.currentPlayerDiscard(0);
                    if (firstResult) {
                        console.log(`测试模式: 使用第一张牌成功: ${firstResult.toString()}`);
                        return true;
                    }
                }
                return false;
            }
        }
        catch (error) {
            console.error(`测试模式自动出牌出错: ${error}`);
            console.error(`错误详情: ${error instanceof Error ? error.stack : '未知错误'}`);
            return false;
        }
    }
    // 直接从牌山取牌（不增加摸牌次数，用于特殊情况如庄家起牌）
    drawTileDirectly() {
        if (this.remainingTiles <= 0) {
            console.log("牌山已空，无法抓牌");
            this.state = GameState.ENDED;
            return null;
        }
        // 记录上一次摸牌次数，用于追踪
        this.lastDrawCount = this.drawCount;
        // 计算正确的索引：牌山尾部开始抓牌
        const tileIndex = this.tiles.length - this.remainingTiles;
        if (tileIndex < 0 || tileIndex >= this.tiles.length) {
            console.error(`抓牌错误: 索引越界 (${tileIndex}), 牌山长度 = ${this.tiles.length}, 剩余牌数 = ${this.remainingTiles}`);
            return null;
        }
        const tile = this.tiles[tileIndex];
        if (!tile) {
            console.error(`抓牌错误: 索引 ${tileIndex} 处没有牌`);
            return null;
        }
        this.remainingTiles--;
        // 特殊处理：虽然不通过常规渠道增加摸牌次数，
        // 但为了保持牌数平衡，仍需要增加摸牌次数
        this.drawCount++;
        // 确保剩余牌数不会变为负数
        if (this.remainingTiles < 0) {
            console.error("剩余牌数变为负数, 重置为0");
            this.remainingTiles = 0;
        }
        return tile;
    }
    // 在Game类中增加一个紧急修复方法
    forceAIPlayerDiscard() {
        debugLog(`[forceAIPlayerDiscard] 检查所有AI玩家手牌状态`);
        console.log("执行AI玩家强制出牌检查");
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            // 只处理AI玩家且手牌数超过13张的情况
            if (player.type === player_1.PlayerType.AI && player.handTiles.length > 13) {
                console.log(`发现AI玩家${player.name}手牌数量(${player.handTiles.length})超过13张，强制执行出牌`);
                debugLog(`[forceAIPlayerDiscard] 发现AI(${player.name})手牌数量${player.handTiles.length} > 13`);
                // 设置当前玩家状态
                const originalCurrentPlayer = this.currentPlayerIndex;
                this.currentPlayerIndex = i;
                player.state = player_1.PlayerState.ACTING;
                this.state = GameState.PLAYING;
                // 强制出最后一张牌
                const lastIndex = player.handTiles.length - 1;
                const lastTile = player.handTiles[lastIndex];
                if (lastTile) {
                    // 直接从手牌中移除
                    player.handTiles.splice(lastIndex, 1);
                    player.discardedTiles.push(lastTile);
                    this.lastDiscardedTile = lastTile;
                    console.log(`强制AI玩家${player.name}出牌: ${lastTile.toString()}`);
                    debugLog(`[forceAIPlayerDiscard] 强制出牌: ${lastTile.toString()}`);
                    // 重置玩家状态和当前玩家
                    player.state = player_1.PlayerState.WAITING;
                    this.currentPlayerIndex = (i + 1) % this.players.length;
                    this.players[this.currentPlayerIndex].state = player_1.PlayerState.ACTING;
                    // 让下一个玩家摸牌
                    this.currentPlayerDraw();
                    console.log(`强制切换到下一玩家${this.players[this.currentPlayerIndex].name}`);
                    debugLog(`[forceAIPlayerDiscard] 切换到玩家${this.players[this.currentPlayerIndex].name}`);
                    return true; // 成功执行了强制出牌
                }
            }
        }
        return false; // 没有需要强制出牌的AI玩家
    }
    /**
     * 运行游戏周期，执行各种状态检查和处理AI玩家行动
     */
    runGameCycle() {
        // 检查游戏是否已结束
        if (this.state === GameState.ENDED) {
            debugLog(`[runGameCycle] 游戏已结束，不执行游戏循环`);
            return;
        }
        debugLog(`[runGameCycle] 开始执行，当前状态=${GameState[this.state]}, 当前玩家=${this.currentPlayerIndex}(${this.players[this.currentPlayerIndex].name})`);
        // 清理无效的pendingAction
        if (this.pendingAction) {
            debugLog(`[runGameCycle] 检查pendingAction有效性`);
            console.log("检查pendingAction有效性...");
            // 修复：检查waitingPlayers是否为空
            if (!this.pendingAction.waitingPlayers || this.pendingAction.waitingPlayers.length === 0) {
                debugLog(`[runGameCycle] pendingAction的waitingPlayers为空，清除pendingAction`);
                console.log("pendingAction的waitingPlayers为空，清除pendingAction");
                this.pendingAction = null;
            }
            // 修复：检查游戏状态是否与pendingAction匹配
            else if (this.state !== GameState.WAITING_ACTION) {
                debugLog(`[runGameCycle] 游戏状态(${GameState[this.state]})与pendingAction不匹配，修正为WAITING_ACTION`);
                console.log(`游戏状态(${GameState[this.state]})与pendingAction不匹配，修正为WAITING_ACTION`);
                this.state = GameState.WAITING_ACTION;
            }
        }
        // 1. 强制修复：检查并解决AI玩家手牌超过13张的问题
        debugLog(`[runGameCycle] 检查AI玩家手牌是否超过13张`);
        if (this.forceAIPlayerDiscard()) {
            // 如果执行了强制出牌，直接返回
            debugLog(`[runGameCycle] 执行了AI强制出牌，退出循环`);
            return;
        }
        // 如果有待处理的操作，等待处理完成
        if (this.pendingAction) {
            debugLog(`[runGameCycle] 有待处理的操作(waitingPlayers=${this.pendingAction.waitingPlayers.length})，等待处理完成`);
            console.log("有待处理的操作，等待处理完成");
            return;
        }
        // 获取当前玩家
        const currentPlayer = this.players[this.currentPlayerIndex];
        debugLog(`[runGameCycle] 当前玩家: ${currentPlayer.name}, 类型=${player_1.PlayerType[currentPlayer.type]}, 状态=${player_1.PlayerState[currentPlayer.state]}, 手牌=${currentPlayer.handTiles.length}`);
        console.log(`当前玩家: ${currentPlayer.name}, 类型: ${player_1.PlayerType[currentPlayer.type]}, 状态: ${player_1.PlayerState[currentPlayer.state]}, 手牌: ${currentPlayer.handTiles.length}`);
        // 修正游戏状态为PLAYING（如果需要）
        if (this.state !== GameState.PLAYING) {
            debugLog(`[runGameCycle] 强制修正游戏状态: ${GameState[this.state]} -> PLAYING`);
            console.log(`强制修正游戏状态: ${GameState[this.state]} -> PLAYING`);
            this.state = GameState.PLAYING;
        }
        // 检查当前玩家状态
        if (currentPlayer.state === player_1.PlayerState.WAITING) {
            // 如果玩家处于等待状态，改变为行动状态
            debugLog(`[runGameCycle] 强制修正玩家${currentPlayer.name}状态: WAITING -> ACTING`);
            console.log(`强制修正玩家${currentPlayer.name}状态: WAITING -> ACTING`);
            currentPlayer.state = player_1.PlayerState.ACTING;
            // 如果玩家只有13张牌，需要摸一张牌
            if (currentPlayer.handTiles.length === 13) {
                debugLog(`[runGameCycle] 玩家${currentPlayer.name}需要摸牌(当前手牌=${currentPlayer.handTiles.length})`);
                console.log(`玩家${currentPlayer.name}摸牌`);
                const tile = this.currentPlayerDraw();
                if (tile) {
                    debugLog(`[runGameCycle] 玩家摸牌成功: ${tile.toString()}`);
                    console.log(`摸牌成功: ${tile.toString()}`);
                }
                else {
                    debugLog(`[runGameCycle] 玩家摸牌失败，可能牌山已空`);
                    console.log(`摸牌失败`);
                }
            }
            else {
                debugLog(`[runGameCycle] 玩家${currentPlayer.name}手牌=${currentPlayer.handTiles.length}，不需要摸牌`);
            }
            // 如果是人类玩家，摸牌后等待用户输入行动
            if (currentPlayer.type === player_1.PlayerType.HUMAN) {
                debugLog(`[runGameCycle] 当前是人类玩家回合，等待用户操作`);
                console.log(`当前是人类玩家回合，等待用户操作`);
                return;
            }
        }
        // 根据玩家类型处理行动
        if (currentPlayer.type === player_1.PlayerType.AI) {
            // 处理AI玩家行动
            debugLog(`[runGameCycle] 处理AI玩家${currentPlayer.name}行动`);
            this.handleAIAction(currentPlayer);
        }
        else {
            debugLog(`[runGameCycle] 当前是人类玩家${currentPlayer.name}回合，不自动处理`);
        }
    }
    /**
     * 处理AI玩家的行动
     */
    handleAIAction(player) {
        debugLog(`[handleAIAction] 开始处理AI玩家${player.name}的行动, 玩家ID=${this.currentPlayerIndex}, 游戏状态=${GameState[this.state]}`);
        console.log(`执行AI玩家${player.name}的行动处理`);
        // 确保AI玩家处于行动状态
        if (player.state !== player_1.PlayerState.ACTING) {
            debugLog(`[handleAIAction] 强制修正AI玩家${player.name}状态: ${player_1.PlayerState[player.state]} -> ACTING`);
            console.log(`强制修正AI玩家${player.name}状态: ${player_1.PlayerState[player.state]} -> ACTING`);
            player.state = player_1.PlayerState.ACTING;
        }
        // 如果AI手牌不足14张，摸一张牌
        if (player.handTiles.length === 13) {
            debugLog(`[handleAIAction] AI玩家${player.name}手牌数为13，需要摸牌`);
            console.log(`AI玩家${player.name}摸牌，当前手牌:${player.handTiles.length}`);
            const tile = this.currentPlayerDraw();
            if (tile) {
                debugLog(`[handleAIAction] AI玩家摸牌成功: ${tile.toString()}, 现有手牌=${player.handTiles.length}`);
                console.log(`AI玩家摸牌成功: ${tile.toString()}`);
            }
            else {
                debugLog(`[handleAIAction] AI玩家摸牌失败，可能牌山已空或游戏已结束`);
                console.log(`AI玩家摸牌失败`);
            }
            return; // 摸完牌后结束本次行动
        }
        // 如果AI手牌超过13张，需要打出一张牌
        if (player.handTiles.length > 13) {
            debugLog(`[handleAIAction] AI玩家${player.name}手牌数为${player.handTiles.length} > 13，需要出牌`);
            console.log(`AI玩家${player.name}选择出牌，当前手牌:${player.handTiles.length}`);
            // 获取AI决策的出牌索引
            debugLog(`[handleAIAction] 开始AI决策选择出牌`);
            const aiMoveIndex = player.getAIMove();
            debugLog(`[handleAIAction] AI决策完成，选择出牌索引=${aiMoveIndex}, 有效范围=0-${player.handTiles.length - 1}`);
            console.log(`AI选择出牌索引: ${aiMoveIndex}`);
            if (aiMoveIndex >= 0 && aiMoveIndex < player.handTiles.length) {
                debugLog(`[handleAIAction] AI选择的出牌索引有效，准备出牌: ${player.handTiles[aiMoveIndex].toString()}`);
                console.log(`AI玩家${player.name}出牌，索引:${aiMoveIndex}, 牌:${player.handTiles[aiMoveIndex].toString()}`);
                const discarded = this.currentPlayerDiscard(aiMoveIndex);
                if (discarded) {
                    debugLog(`[handleAIAction] AI出牌成功: ${discarded.toString()}, 游戏状态=${GameState[this.state]}`);
                    console.log(`AI出牌成功: ${discarded.toString()}`);
                }
                else {
                    debugLog(`[handleAIAction] AI出牌失败，尝试使用最后一张牌`);
                    console.log(`AI出牌失败，尝试使用最后一张牌`);
                    const lastIndex = player.handTiles.length - 1;
                    debugLog(`[handleAIAction] 尝试出最后一张牌，索引=${lastIndex}, 牌=${player.handTiles[lastIndex]?.toString() || '未知'}`);
                    const lastResult = this.currentPlayerDiscard(lastIndex);
                    if (lastResult) {
                        debugLog(`[handleAIAction] AI成功出最后一张牌: ${lastResult.toString()}, 游戏状态=${GameState[this.state]}`);
                        console.log(`AI成功出最后一张牌: ${lastResult.toString()}`);
                    }
                    else {
                        debugLog(`[handleAIAction] AI出最后一张牌也失败，直接移除最后一张牌并进入下一回合`);
                        console.log(`AI出最后一张牌也失败，直接移除最后一张牌并进入下一回合`);
                        // 强制移除最后一张牌
                        const lastTile = player.handTiles.pop();
                        if (lastTile) {
                            debugLog(`[handleAIAction] 强制移除最后一张牌: ${lastTile.toString()}`);
                            player.discardedTiles.push(lastTile);
                            this.lastDiscardedTile = lastTile;
                            console.log(`强制移除并打出: ${lastTile.toString()}`);
                        }
                        else {
                            debugLog(`[handleAIAction] 手牌为空，无法强制移除`);
                        }
                        debugLog(`[handleAIAction] 调用nextTurn进入下一回合`);
                        this.nextTurn();
                    }
                }
            }
            else {
                // 如果AI返回的索引无效，选择最后一张牌打出
                debugLog(`[handleAIAction] AI玩家返回的索引${aiMoveIndex}无效，改为出最后一张牌`);
                console.log(`AI玩家返回的索引无效，改为出最后一张牌`);
                const lastIndex = player.handTiles.length - 1;
                debugLog(`[handleAIAction] 尝试出最后一张牌，索引=${lastIndex}, 牌=${player.handTiles[lastIndex]?.toString() || '未知'}`);
                const result = this.currentPlayerDiscard(lastIndex);
                if (result) {
                    debugLog(`[handleAIAction] AI成功出最后一张牌: ${result.toString()}, 游戏状态=${GameState[this.state]}`);
                    console.log(`AI成功出最后一张牌: ${result.toString()}`);
                }
                else {
                    debugLog(`[handleAIAction] AI出最后一张牌失败，直接移除最后一张牌并进入下一回合`);
                    console.log(`AI出最后一张牌失败，直接移除最后一张牌并进入下一回合`);
                    // 强制移除最后一张牌
                    const lastTile = player.handTiles.pop();
                    if (lastTile) {
                        debugLog(`[handleAIAction] 强制移除最后一张牌: ${lastTile.toString()}`);
                        player.discardedTiles.push(lastTile);
                        this.lastDiscardedTile = lastTile;
                        console.log(`强制移除并打出: ${lastTile.toString()}`);
                    }
                    else {
                        debugLog(`[handleAIAction] 手牌为空，无法强制移除`);
                    }
                    debugLog(`[handleAIAction] 调用nextTurn进入下一回合`);
                    this.nextTurn();
                }
            }
            return;
        }
        // 如果进行到这里，说明AI玩家的状态异常，直接进入下一回合
        debugLog(`[handleAIAction] AI玩家${player.name}状态异常，手牌数=${player.handTiles.length}，强制进入下一回合`);
        console.log(`AI玩家${player.name}状态异常，强制进入下一回合`);
        debugLog(`[handleAIAction] 调用nextTurn进入下一回合`);
        this.nextTurn();
    }
    /**
     * 玩家选择"过"，放弃本次操作
     * @param playerId 玩家ID
     */
    playerPass(playerId) {
        debugLog(`[playerPass] 开始处理，玩家ID=${playerId}`);
        // 检查游戏状态是否为等待操作
        if (this.state !== GameState.WAITING_ACTION) {
            debugLog(`[playerPass] 错误: 游戏状态(${GameState[this.state]})不是等待操作`);
            console.error(`错误：当前游戏状态不是等待操作，无法执行"过"操作`);
            // 修复：如果游戏状态不对但有待处理操作，强制更正状态
            if (this.pendingAction && this.pendingAction.waitingPlayers.includes(playerId)) {
                debugLog(`[playerPass] 修复: 强制设置游戏状态为WAITING_ACTION`);
                console.log(`修复：强制将游戏状态设为WAITING_ACTION以处理pendingAction`);
                this.state = GameState.WAITING_ACTION;
            }
            else {
                return false;
            }
        }
        if (!this.pendingAction) {
            debugLog(`[playerPass] 错误: 没有待处理的操作`);
            console.error("错误：没有待处理的操作");
            return false;
        }
        // 检查玩家是否在待操作列表中
        const waitingIndex = this.pendingAction.waitingPlayers.indexOf(playerId);
        if (waitingIndex === -1) {
            debugLog(`[playerPass] 错误: 玩家${playerId}不在等待列表中`);
            console.error(`错误：玩家 ${playerId} 不在等待列表中`);
            return false;
        }
        // 从等待列表中移除玩家
        this.pendingAction.waitingPlayers.splice(waitingIndex, 1);
        debugLog(`[playerPass] 已从等待列表移除玩家${playerId}`);
        console.log(`玩家 ${playerId} (${this.players[playerId].name}) 选择"过"`);
        // 如果没有更多等待的玩家，恢复游戏状态为PLAYING
        if (this.pendingAction.waitingPlayers.length === 0) {
            debugLog(`[playerPass] 没有更多等待的玩家，恢复游戏状态为PLAYING`);
            this.state = GameState.PLAYING;
            this.pendingAction = null;
            // 确保玩家状态正确
            this.players[this.currentPlayerIndex].state = player_1.PlayerState.ACTING;
            debugLog(`[playerPass] 确保玩家${this.players[this.currentPlayerIndex].name}状态为ACTING`);
            console.log(`所有玩家都已做出选择，恢复游戏状态为PLAYING`);
        }
        else {
            debugLog(`[playerPass] 还有${this.pendingAction.waitingPlayers.length}个玩家在等待`);
        }
        return true;
    }
    // 在clearPendingAction方法中添加调试日志
    clearPendingAction() {
        debugLog(`[clearPendingAction] 开始清除pendingAction`);
        if (this.pendingAction && this.pendingAction.timeoutId) {
            debugLog(`[clearPendingAction] 清除timeoutId=${this.pendingAction.timeoutId}`);
            clearTimeout(this.pendingAction.timeoutId);
        }
        this.pendingAction = null;
        debugLog(`[clearPendingAction] pendingAction已设置为null`);
        this.state = GameState.PLAYING; // 确保状态转为PLAYING而不是WAITING_ACTION
        debugLog(`[clearPendingAction] 游戏状态已设置为PLAYING`);
    }
    // 添加缺少的playerHu方法
    playerHu(playerId, targetTile, huType = rules_1.HuType.PING_HU) {
        const player = this.players[playerId];
        if (!player) {
            debugLog(`[playerHu] 错误: 找不到玩家${playerId}`);
            return false;
        }
        debugLog(`[playerHu] 玩家${player.name}胡牌开始, 目标牌=${targetTile?.toString() || '自摸'}, 胡牌类型=${huType}`);
        console.log(`===== 玩家 ${player.name} 胡牌！=====`);
        console.log(`胡牌方式: ${targetTile ? '点炮' : '自摸'}`);
        // 检查具体的胡牌类型
        // 如果传入的是PING_HU，则分析具体牌型
        const finalHand = targetTile ? [...player.handTiles, targetTile] : player.handTiles;
        let actualHuType = huType;
        if (huType === rules_1.HuType.PING_HU) {
            // 重新分析牌型
            if (rules_1.RuleEngine.isSevenPairs(finalHand)) {
                actualHuType = rules_1.HuType.SEVEN_PAIRS;
                console.log(`检测到特殊牌型: 七对`);
            }
            else if (rules_1.RuleEngine.isThirteenOrphans(finalHand)) {
                actualHuType = rules_1.HuType.THIRTEEN_ORPHANS;
                console.log(`检测到特殊牌型: 十三幺`);
            }
            else if (rules_1.RuleEngine.isQingYiSe(finalHand, player.revealedSets)) {
                actualHuType = rules_1.HuType.QING_YI_SE;
                console.log(`检测到特殊牌型: 清一色`);
            }
            else if (rules_1.RuleEngine.isPengPengHu(finalHand, player.revealedSets)) {
                actualHuType = rules_1.HuType.PENG_PENG_HU;
                console.log(`检测到特殊牌型: 碰碰胡`);
            }
            else {
                console.log(`标准和牌: 4组刻子/顺子 + 1对`);
            }
        }
        console.log(`胡牌类型: ${rules_1.HuType[actualHuType]}`);
        // 显示可视化牌型概要
        console.log(rules_1.RuleEngine.getHandPatternVisualization(finalHand));
        // 输出详细的牌型分析
        if (DEBUG_MODE) {
            const handAnalysis = rules_1.RuleEngine.analyzeHandTiles(finalHand);
            console.log(`--- 胡牌详细分析 ---`);
            console.log(`对子数量: ${handAnalysis.pairCount}`);
            console.log(`刻子数量: ${handAnalysis.tripleCount}`);
            console.log(`顺子可能性: ${handAnalysis.sequencePossibility}`);
            if (handAnalysis.pairs.length > 0) {
                console.log(`找到的对子: ${handAnalysis.pairs.map(pair => pair.map(t => t.toString()).join(',')).join(' | ')}`);
            }
            if (handAnalysis.triples.length > 0) {
                console.log(`找到的刻子: ${handAnalysis.triples.map(triple => triple.map(t => t.toString()).join(',')).join(' | ')}`);
            }
        }
        // 清除等待状态
        if (this.state === GameState.WAITING_ACTION && this.pendingAction) {
            debugLog(`[playerHu] 清除等待状态, 之前状态=${GameState[this.state]}`);
            this.clearPendingAction();
        }
        // 计算得分
        debugLog(`[playerHu] 计算得分开始`);
        const scoreInfo = rules_1.RuleEngine.calculateScore(player);
        player.score += scoreInfo.score;
        debugLog(`[playerHu] 得分计算完成: ${scoreInfo.score}, 玩家总分: ${player.score}`);
        console.log(`得分: ${scoreInfo.score} (${rules_1.HuType[scoreInfo.huType]})`);
        console.log(`总分: ${player.score}`);
        // 输出胡牌手牌信息
        console.log(`胡牌手牌: ${player.handTiles.map(t => t.toString()).join(', ')}`);
        if (targetTile) {
            console.log(`胡牌目标牌: ${targetTile.toString()}`);
        }
        // 显示玩家已亮出的牌组
        if (player.revealedSets.length > 0) {
            console.log(`已亮出牌组: ${player.revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]`).join(' ')}`);
        }
        // 结束游戏
        debugLog(`[playerHu] 结束游戏, 胡牌玩家=${player.name}`);
        console.log("===== 游戏结束 =====");
        this.endGame(player);
        return true;
    }
    // 添加缺少的nextTurn方法
    nextTurn() {
        debugLog(`[nextTurn] 开始执行nextTurn, 当前玩家=${this.currentPlayerIndex}`);
        // 清除任何待处理的动作
        this.clearPendingAction();
        // 重要：手动设置游戏状态为PLAYING
        if (this.state !== GameState.PLAYING) {
            console.log(`将游戏状态从 ${GameState[this.state]} 更改为 PLAYING`);
            debugLog(`[nextTurn] 修正游戏状态: ${GameState[this.state]} -> PLAYING`);
            this.state = GameState.PLAYING;
        }
        // 设置当前玩家状态为WAITING，并移动到下一个玩家
        const currentPlayer = this.players[this.currentPlayerIndex];
        console.log(`当前玩家ID: ${this.currentPlayerIndex} (${currentPlayer.name}), 状态: ${player_1.PlayerState[currentPlayer.state]}`);
        debugLog(`[nextTurn] 当前玩家: ${currentPlayer.name}, 状态=${player_1.PlayerState[currentPlayer.state]}`);
        // 设置当前玩家为等待状态
        currentPlayer.state = player_1.PlayerState.WAITING;
        // 检查每个玩家手牌是否正确
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.type === player_1.PlayerType.AI && player.handTiles.length > 13) {
                console.log(`玩家 ${player.name} 手牌数量 ${player.handTiles.length} > 13，需要修正`);
                debugLog(`[nextTurn] 发现${player.name}手牌(${player.handTiles.length})>13, 执行修正`);
                // 从手牌中移除最后一张牌
                const lastCard = player.handTiles.pop();
                if (lastCard) {
                    player.discardedTiles.push(lastCard);
                    console.log(`已移除最后一张牌 ${lastCard.toString()} 并加入弃牌堆`);
                    debugLog(`[nextTurn] 已移除${player.name}的最后一张牌${lastCard.toString()}`);
                    // 如果是当前玩家，设置最后打出的牌
                    if (i === this.currentPlayerIndex) {
                        this.lastDiscardedTile = lastCard;
                    }
                }
            }
        }
        // 更新到下一个玩家
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const nextPlayer = this.players[this.currentPlayerIndex];
        console.log(`下一个玩家ID: ${this.currentPlayerIndex} (${nextPlayer.name})`);
        debugLog(`[nextTurn] 更新到下一玩家: ${nextPlayer.name}, 索引=${this.currentPlayerIndex}`);
        // 设置新的当前玩家为行动状态
        nextPlayer.state = player_1.PlayerState.ACTING;
        // 调用currentPlayerDraw，允许玩家摸牌
        console.log(`让玩家 ${nextPlayer.name} 摸牌`);
        nextPlayer.lastDrawnTile = null; // 重置最后摸到的牌
        // 添加详细调试信息，检查摸牌前状态
        console.log(`摸牌前，游戏状态: ${GameState[this.state]}`);
        console.log(`摸牌前，下一玩家状态: ${player_1.PlayerState[nextPlayer.state]}`);
        console.log(`摸牌前，下一玩家手牌数: ${nextPlayer.handTiles.length}`);
        debugLog(`[nextTurn] 摸牌前状态检查: 游戏=${GameState[this.state]}, 玩家=${player_1.PlayerState[nextPlayer.state]}, 手牌=${nextPlayer.handTiles.length}`);
        // 安全检查：如果下一个玩家已经有超过13张牌，不再摸牌
        if (nextPlayer.handTiles.length > 13) {
            console.log(`注意: 玩家 ${nextPlayer.name} 已有 ${nextPlayer.handTiles.length} 张牌 > 13张，跳过摸牌`);
            debugLog(`[nextTurn] 跳过摸牌: ${nextPlayer.name}已有${nextPlayer.handTiles.length}张牌`);
        }
        else {
            // 尝试摸牌
            let drawnTile = null;
            try {
                drawnTile = this.currentPlayerDraw();
                if (drawnTile) {
                    console.log(`玩家 ${nextPlayer.name} 成功摸到牌: ${drawnTile.toString()}`);
                    debugLog(`[nextTurn] ${nextPlayer.name}摸到牌: ${drawnTile.toString()}`);
                }
                else {
                    console.log(`玩家 ${nextPlayer.name} 摸牌失败，返回null`);
                    debugLog(`[nextTurn] ${nextPlayer.name}摸牌失败`);
                }
            }
            catch (error) {
                console.error(`摸牌过程中发生错误: ${error instanceof Error ? error.message : error}`);
                console.error(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
                debugLog(`[nextTurn] 摸牌异常: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // 检查游戏是否已经结束
        console.log(`当前游戏状态: ${GameState[this.state]}`);
        if (GameState[this.state] === 'ENDED') {
            console.log("游戏已结束，不再继续");
            debugLog(`[nextTurn] 游戏已结束，退出nextTurn`);
            return;
        }
        // 确保新当前玩家状态正确
        if (nextPlayer.state !== player_1.PlayerState.ACTING) {
            console.log(`警告：摸牌后当前玩家状态不是ACTING，强制设置为ACTING`);
            debugLog(`[nextTurn] 修正当前玩家状态: ${player_1.PlayerState[nextPlayer.state]} -> ACTING`);
            nextPlayer.state = player_1.PlayerState.ACTING;
        }
        // 如果是AI玩家并且有足够的牌，立即执行出牌操作
        if (nextPlayer.type === player_1.PlayerType.AI && nextPlayer.handTiles.length > 13) {
            debugLog(`[nextTurn] AI玩家自动出牌处理开始`);
            this.handleAIAction(nextPlayer);
        }
    }
}
exports.Game = Game;
