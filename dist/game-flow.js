"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameFlow = void 0;
exports.drawTile = drawTile;
const player_1 = require("./player");
const game_1 = require("./game");
const tile_manager_1 = require("./tile-manager");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
/**
 * GameFlow类 - 专注于游戏流程控制
 *
 * 负责：
 * 1. 管理游戏的回合进行
 * 2. 处理游戏阶段的转换
 * 3. 控制玩家行动顺序
 */
class GameFlow {
    constructor(game, tileManager, players) {
        this.game = game;
        this.tileManager = tileManager;
        this.players = players;
    }
    /**
     * 启动游戏
     */
    startGame() {
        display_manager_1.displayManager.print("开始初始化游戏...");
        // 检查玩家数量
        display_manager_1.displayManager.print(`游戏中共有 ${this.players.length} 名玩家`);
        // 初始化游戏状态
        this.game.setState(game_1.GameState.INIT);
        display_manager_1.displayManager.print("重置牌山...");
        // 确保使用的是 TileManager 单例
        this.tileManager = tile_manager_1.TileManager.getInstance();
        this.tileManager.reset();
        display_manager_1.displayManager.print("开始发牌...");
        this.dealInitialTiles();
        // 设置第一个玩家为当前玩家，并设置状态为ACTING
        this.game.setCurrentPlayerIndex(0);
        // 确保所有玩家状态正确
        for (let i = 0; i < this.players.length; i++) {
            this.updatePlayerState(i);
        }
        // 切换游戏状态为PLAYING
        this.game.setState(game_1.GameState.PLAYING);
        display_manager_1.displayManager.printSuccess("游戏初始化完成，状态转为 PLAYING");
    }
    /**
     * 处理游戏启动时的初始化工作
     */
    prepareGameStart() {
        (0, logger_1.infoLog)(`准备游戏启动...`);
        // 确保当前玩家状态为ACTING，其他玩家为WAITING
        const players = this.game.getAllPlayers();
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (i === this.game.currentPlayerIndex) {
                if (player.state !== player_1.PlayerState.ACTING) {
                    (0, logger_1.infoLog)(`将当前玩家 ${player.name} 状态设置为 ACTING`);
                    player.state = player_1.PlayerState.ACTING;
                }
            }
            else {
                if (player.state !== player_1.PlayerState.WAITING) {
                    (0, logger_1.infoLog)(`将玩家 ${player.name} 状态设置为 WAITING`);
                    player.state = player_1.PlayerState.WAITING;
                }
            }
        }
        (0, logger_1.infoLog)(`游戏准备就绪`);
    }
    /**
     * 为所有玩家发初始手牌
     */
    dealInitialTiles() {
        // 每个玩家发13张牌
        display_manager_1.displayManager.print(`开始为 ${this.players.length} 名玩家发初始手牌...`);
        // 确保所有玩家的手牌和弃牌数组都已初始化并清空
        for (const player of this.players) {
            player.handTiles = [];
            player.discardedTiles = [];
            (0, logger_1.debugLog)(`重置玩家 ${player.name} 的手牌和弃牌堆`);
        }
        // 优化发牌逻辑：按照麻将传统方式每次每人4张，最后一张
        display_manager_1.displayManager.print("开始发牌：每人13张初始手牌");
        // 发牌轮数 (4+4+4+1)
        const rounds = [4, 4, 4, 1];
        for (const [roundIndex, cardsPerPlayer] of rounds.entries()) {
            display_manager_1.displayManager.print(`第${roundIndex + 1}轮发牌: 每人${cardsPerPlayer}张`);
            // 每轮为每个玩家发指定数量的牌
            for (const player of this.players) {
                for (let i = 0; i < cardsPerPlayer; i++) {
                    const tile = this.tileManager.drawTile();
                    if (tile) {
                        player.drawTile(tile);
                        (0, logger_1.debugLog)(`给玩家 ${player.name} 发牌: ${tile.toString()}, 当前手牌数量: ${player.handTiles.length}`);
                    }
                    else {
                        display_manager_1.displayManager.printError(`给玩家 ${player.name} 发牌失败，牌山已空，无法继续游戏`);
                        (0, logger_1.errorLog)(`给玩家 ${player.name} 发牌失败，牌山已空，无法继续游戏`);
                        // 在实际应用中，这里可以添加退出程序的代码
                        process.exit(1);
                    }
                }
            }
        }
        // 验证每位玩家手牌数量
        display_manager_1.displayManager.printTitle("发牌完成，最终玩家手牌状态");
        for (const player of this.players) {
            // 使用Player类的方法判断手牌数量是否合理
            const expectedHandSize = player.getExpectedHandSize(false);
            if (!player.hasValidHandSize(false)) {
                display_manager_1.displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/${expectedHandSize})，游戏无法继续`);
                return;
            }
            // 排序玩家手牌
            player.sortHand();
            display_manager_1.displayManager.print(`玩家 ${player.name} 最终手牌数量: ${player.handTiles.length}`);
        }
        display_manager_1.displayManager.printDivider();
    }
    /**
     * 为指定玩家摸一张牌
     * @param game 游戏实例
     * @param player 要摸牌的玩家
     * @param notify 是否通知显示
     * @param validate 是否验证手牌数量
     * @param incrementCount 是否增加摸牌计数
     * @returns 摸到的牌，或null表示没有摸到
     */
    drawTileForPlayer(player, options = {}) {
        // 设置默认选项
        const { notify = true, validate = false, incrementCount = false } = options;
        // 验证手牌数量
        if (validate && !player.hasValidHandSize(false)) {
            const expectedHandSize = player.getExpectedHandSize(false);
            (0, logger_1.debugLog)(`玩家 ${player.name} 手牌数量不正确: ${player.handTiles.length}，预期: ${expectedHandSize}`);
            return null;
        }
        // 摸牌
        const tile = this.tileManager.drawTile();
        if (tile) {
            player.drawTile(tile);
            // 更新计数器
            if (incrementCount) {
                this.game.incrementDrawCount();
            }
            // 通知显示
            if (notify) {
                display_manager_1.displayManager.addToTurnLog(`${player.name} 摸了一张牌`);
            }
            return tile;
        }
        return null;
    }
    /**
     * 当前玩家摸牌
     */
    currentPlayerDraw() {
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 使用新的通用方法
        return this.drawTileForPlayer(currentPlayer, {
            notify: true,
            validate: true,
            incrementCount: true
        });
    }
    /**
     * 当前玩家打出一张牌
     */
    currentPlayerDiscard(tileIndex) {
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 验证玩家状态
        if (currentPlayer.state !== player_1.PlayerState.ACTING) {
            display_manager_1.displayManager.printWarning(`玩家 ${currentPlayer.name} 不处于ACTING状态，当前状态: ${player_1.PlayerState[currentPlayer.state]}`);
            // 如果是AI玩家且手牌超过预期数量，强制允许出牌以保持游戏流畅
            if (currentPlayer.type === player_1.PlayerType.AI && currentPlayer.needsToDiscard()) {
                display_manager_1.displayManager.printWarning(`AI玩家手牌超过预期数量，强制允许出牌以维持游戏状态正确性`);
                currentPlayer.state = player_1.PlayerState.ACTING;
            }
            else {
                return null;
            }
        }
        // 验证索引是否有效（加强验证和错误处理）
        if (tileIndex === undefined || tileIndex === null) {
            display_manager_1.displayManager.printError(`严重错误: 出牌索引为undefined或null`);
            return null;
        }
        if (tileIndex < 0 || tileIndex >= currentPlayer.handTiles.length) {
            display_manager_1.displayManager.printError(`无效的出牌索引: ${tileIndex}，有效范围: 0-${currentPlayer.handTiles.length - 1}`);
            // 对于AI玩家，自动修正索引
            if (currentPlayer.type === player_1.PlayerType.AI && currentPlayer.handTiles.length > 0) {
                const correctedIndex = Math.min(currentPlayer.handTiles.length - 1, Math.max(0, tileIndex));
                display_manager_1.displayManager.printWarning(`AI玩家索引已修正为有效值: ${correctedIndex}`);
                tileIndex = correctedIndex;
            }
            else {
                // 人类玩家输入无效索引，直接返回null
                display_manager_1.displayManager.printError(`请输入有效的牌索引（1-${currentPlayer.handTiles.length}）`);
                return null;
            }
        }
        // 确保选择的牌有效
        if (!currentPlayer.handTiles[tileIndex]) {
            display_manager_1.displayManager.printError(`错误: 索引${tileIndex}处的牌无效`);
            // 对于AI玩家，尝试找到一个有效的牌索引
            if (currentPlayer.type === player_1.PlayerType.AI && currentPlayer.handTiles.length > 0) {
                // 遍历寻找有效的牌
                let foundValidTile = false;
                for (let i = 0; i < currentPlayer.handTiles.length; i++) {
                    if (currentPlayer.handTiles[i]) {
                        tileIndex = i;
                        display_manager_1.displayManager.printSuccess(`找到有效牌索引: ${tileIndex}`);
                        foundValidTile = true;
                        break;
                    }
                }
                // 再次检查
                if (!foundValidTile || !currentPlayer.handTiles[tileIndex]) {
                    display_manager_1.displayManager.printError(`严重错误: 无法找到有效的牌索引`);
                    return null;
                }
            }
            else {
                // 人类玩家选择的牌无效，直接返回null
                return null;
            }
        }
        try {
            // 使用player.discardTile方法，该方法已经增强了安全性和错误处理
            const discardedTile = currentPlayer.discardTile(tileIndex);
            // 如果成功打出，更新游戏状态
            if (discardedTile) {
                this.game.setLastDiscardedTile(discardedTile);
                display_manager_1.displayManager.printSuccess(`玩家 ${currentPlayer.name} 成功打出: ${discardedTile.toString()}`);
            }
            else {
                display_manager_1.displayManager.printError(`玩家 ${currentPlayer.name} 出牌失败`);
            }
            return discardedTile;
        }
        catch (error) {
            display_manager_1.displayManager.printError(`出牌过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * 进入下一个玩家的回合
     */
    nextTurn() {
        // 获取当前玩家并更新状态
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        currentPlayer.state = player_1.PlayerState.WAITING;
        display_manager_1.displayManager.print(`玩家 ${currentPlayer.name} 出牌结束，状态变为 WAITING`);
        // 计算下一个玩家
        const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % this.players.length;
        this.game.setCurrentPlayerIndex(nextPlayerIndex);
        // 更新下一个玩家的状态
        const nextPlayer = this.players[nextPlayerIndex];
        nextPlayer.state = player_1.PlayerState.ACTING;
        // 显示下一个玩家信息
        display_manager_1.displayManager.printDivider();
        display_manager_1.displayManager.printTitle(`轮到 ${nextPlayer.name} 行动 [手牌: ${nextPlayer.handTiles.length}张]`);
        // 为下一个玩家摸牌
        const drawnTile = this.currentPlayerDraw();
        if (drawnTile) {
            display_manager_1.displayManager.printSuccess(`玩家 ${nextPlayer.name} 摸了一张牌: ${nextPlayer.type === player_1.PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
        }
        else {
            display_manager_1.displayManager.printWarning(`无法摸牌，牌山已空`);
        }
    }
    /**
     * 强制AI玩家出牌
     */
    forceAIPlayerDiscard() {
        // 获取当前玩家
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 检查是否为AI玩家
        if (currentPlayer.type !== player_1.PlayerType.AI) {
            display_manager_1.displayManager.printWarning(`当前玩家不是AI，无法强制出牌`);
            return false;
        }
        // 确保玩家处于可以出牌的状态
        currentPlayer.state = player_1.PlayerState.ACTING;
        // 使用AI决策获取出牌索引
        const discardIndex = currentPlayer.getAIMove();
        display_manager_1.displayManager.printWarning(`强制AI玩家 ${currentPlayer.name} 出牌，选择索引: ${discardIndex}`);
        // 执行出牌
        const discarded = this.currentPlayerDiscard(discardIndex);
        if (discarded) {
            display_manager_1.displayManager.printSuccess(`AI玩家 ${currentPlayer.name} 成功打出: ${discarded.toString()}`);
            return true;
        }
        return false;
    }
    /**
     * 更新指定玩家的状态
     */
    updatePlayerState(playerIndex) {
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            return;
        }
        const player = this.players[playerIndex];
        // 如果是当前玩家，设置为正在行动状态
        if (playerIndex === this.game.currentPlayerIndex) {
            player.state = player_1.PlayerState.ACTING;
        }
        else {
            // 否则设置为等待状态
            player.state = player_1.PlayerState.WAITING;
        }
        (0, logger_1.debugLog)(`更新玩家 ${player.name} 状态为 ${player_1.PlayerState[player.state]}`);
    }
}
exports.GameFlow = GameFlow;
/**
 * 为指定玩家摸一张牌
 * @param game 游戏实例
 * @param player 要摸牌的玩家
 * @param notify 是否通知显示
 * @param validate 是否验证手牌数量
 * @param incrementCount 是否增加摸牌计数
 * @returns 摸到的牌，或null表示没有摸到
 */
function drawTile(game, player, notify = true, validate = false, incrementCount = false) {
    try {
        // 验证游戏和玩家实例
        if (!game) {
            (0, logger_1.errorLog)(`摸牌错误: 无效的游戏实例`);
            return null;
        }
        if (!player) {
            (0, logger_1.errorLog)(`摸牌错误: 无效的玩家实例`);
            return null;
        }
        // 验证手牌数量
        if (validate && !player.hasValidHandSize(false)) {
            const expectedHandSize = player.getExpectedHandSize(false);
            (0, logger_1.debugLog)(`玩家 ${player.name} 手牌数量不正确: ${player.handTiles.length}，预期: ${expectedHandSize}`);
            return null;
        }
        // 摸牌前记录日志
        (0, logger_1.debugLog)(`尝试为玩家 ${player.name} 摸牌，当前手牌数量: ${player.handTiles.length}`);
        // 从牌山摸牌
        const tileManager = game.getTileManager();
        if (!tileManager) {
            (0, logger_1.errorLog)(`摸牌错误: 无法获取牌管理器`);
            return null;
        }
        const tile = tileManager.drawTile();
        // 检查是否成功摸到牌
        if (!tile) {
            if (notify) {
                display_manager_1.displayManager.printWarning(`牌山已空，${player.name} 无法摸牌`);
            }
            (0, logger_1.debugLog)(`玩家 ${player.name} 摸牌失败，牌山已空`);
            return null;
        }
        // 将牌添加到玩家手中
        player.drawTile(tile);
        // 更新计数器
        if (incrementCount) {
            game.incrementDrawCount();
            (0, logger_1.debugLog)(`游戏摸牌计数增加，当前总计: ${game.drawCount}`);
        }
        // 通知显示
        if (notify) {
            display_manager_1.displayManager.addToTurnLog(`${player.name} 摸了一张牌`);
            (0, logger_1.debugLog)(`玩家 ${player.name} 摸到牌: ${tile.toString()}`);
        }
        return tile;
    }
    catch (error) {
        // 处理异常情况
        (0, logger_1.errorLog)(`摸牌过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
        if (notify) {
            display_manager_1.displayManager.printError(`摸牌失败: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
    }
}
