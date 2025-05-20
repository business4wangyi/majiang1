"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEventHandler = void 0;
const game_1 = require("./game");
const display_manager_1 = require("./display-manager");
const input_1 = require("./input");
const player_1 = require("./player");
const logger_1 = require("./logger");
const tile_1 = require("./tile");
const tile_manager_1 = require("./tile-manager");
const index_1 = require("./win-conditions/index");
const rule_types_1 = require("./rule-types");
const rule_engine_1 = require("./rule-engine");
const ai_player_1 = require("./ai-player");
/**
 * 游戏事件处理器类
 * 负责处理游戏中的特殊事件，如牌山空、手牌数量异常等
 * 同时也负责游戏流程控制
 */
class GameEventHandler {
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
        // 为庄家（第一个玩家）摸一张牌
        const firstPlayer = this.players[0];
        display_manager_1.displayManager.printTitle(`庄家 ${firstPlayer.name} 开局摸牌`);
        const drawnTile = this.drawTileForPlayer(firstPlayer, {
            notify: true,
            incrementCount: true
        });
        // 游戏启动时摸牌必定有牌
        display_manager_1.displayManager.printSuccess(`庄家 ${firstPlayer.name} 摸了一张牌: ${firstPlayer.type === player_1.PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
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
                    // 游戏启动时摸牌必定有牌
                    const tile = this.drawTileForPlayer(player, {
                        notify: false,
                        validate: false,
                        incrementCount: false
                    });
                    (0, logger_1.debugLog)(`给玩家 ${player.name} 发牌: ${tile.toString()}, 当前手牌数量: ${player.handTiles.length}`);
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
     * 为指定玩家摸一张牌。gameLoop在摸牌前已经确保了牌山有牌
     * @param player 要摸牌的玩家
     * @param options 摸牌选项
     * @returns 摸到的牌，或null表示没有摸到
     */
    drawTileForPlayer(player, options = {}) {
        (0, logger_1.debugLog)('为指定玩家摸一张牌');
        // 设置默认选项
        const { notify = true, validate = false, incrementCount = false } = options;
        // 验证手牌数量
        if (validate && !player.hasValidHandSize(false)) {
            const expectedHandSize = player.getExpectedHandSize(false);
            (0, logger_1.errorLog)(`玩家 ${player.name} 手牌数量不正确: ${player.handTiles.length}，预期: ${expectedHandSize}`);
            display_manager_1.displayManager.displayPlayerHand(player);
            (0, logger_1.errorLog)(`退出游戏排查问题`);
            process.exit(0);
        }
        // 检查牌山是否还有牌
        if (this.tileManager.getRemainingTiles() === 0) {
            (0, logger_1.errorLog)(`牌山已空，无法摸牌,gameLoop没有确保牌山有牌`);
            (0, logger_1.errorLog)(`退出游戏排查问题`);
            process.exit(0);
        }
        // 摸牌
        const tile = this.tileManager.drawTile();
        player.drawTile(tile);
        // 更新计数器
        if (incrementCount) {
            this.game.incrementDrawCount();
        }
        // 通知显示
        if (notify) {
            display_manager_1.displayManager.addToTurnLog(`${player.name} 摸了一张牌[${tile?.toString()}]`);
        }
        return tile;
    }
    /**
     * 当前玩家摸牌.gameLoop在摸牌前已经确保了牌山有牌
     */
    currentPlayerDraw() {
        (0, logger_1.debugLog)('当前玩家摸牌');
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 检查是否是海底捞月的情况（剩余一张牌）
        // if (this.tileManager.getRemainingTiles() === 1) {
        //   // 尝试海底捞月
        //   if (this.checkHaiDiLaoYue(currentPlayer)) {
        //     return currentPlayer.lastDrawnTile!;
        //   }
        // }
        // 正常摸牌
        const drawnTile = this.drawTileForPlayer(currentPlayer, {
            notify: true,
            validate: true,
            incrementCount: true
        });
        // 摸牌后，检查当前玩家是否可以自摸胡牌
        (0, logger_1.debugLog)(`玩家 ${currentPlayer.name} 摸到了 ${drawnTile.toString()}`);
        // 检查当前玩家是否可以自摸胡牌
        const huResult = rule_engine_1.RuleEngine.getHuDetails(currentPlayer, null, { isDrawn: true, isLastTile: this.tileManager.getRemainingTiles() === 0 });
        if (huResult.canHu) {
            (0, logger_1.debugLog)(`玩家 ${currentPlayer.name} 自摸胡牌！`);
            // 显示胡牌信息
            display_manager_1.displayManager.printSuccess(`${currentPlayer.name} 胡牌类型: ${huResult.description}`);
            // 计算得分
            const scoreResult = rule_engine_1.RuleEngine.calculateScore(currentPlayer, huResult.huType, { isSelfDrawn: true });
            display_manager_1.displayManager.printSuccess(`得分: ${scoreResult.score}`);
            display_manager_1.displayManager.printSuccess(`得分详情: ${JSON.stringify(scoreResult.details)}`);
            // 设置玩家状态为胡牌
            currentPlayer.state = player_1.PlayerState.WON;
            display_manager_1.displayManager.printSuccess(`${currentPlayer.name} 自摸胡牌！游戏结束！`);
            // 设置游戏状态为结束
            this.game.setState(game_1.GameState.ENDED);
        }
        return drawnTile;
    }
    /**
     * 当前玩家打出一张牌
     */
    currentPlayerDiscard(tileIndex) {
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 验证玩家状态
        if (currentPlayer.state !== player_1.PlayerState.ACTING) {
            display_manager_1.displayManager.printWarning(`玩家 ${currentPlayer.name} 不处于ACTING状态，当前状态: ${player_1.PlayerState[currentPlayer.state]}`);
            (0, logger_1.errorLog)('游戏错误，排查问题');
            process.exit(0);
        }
        // 使用player.discardTile方法，该方法已经增强了安全性和错误处理
        const discardedTile = currentPlayer.discardTile(tileIndex);
        // 如果成功打出，更新游戏状态
        this.game.setLastDiscardedTile(discardedTile);
        display_manager_1.displayManager.printSuccess(`玩家 ${currentPlayer.name} 成功打出: ${discardedTile.toString()}`);
        return discardedTile;
    }
    /**
     * 进入下一个玩家的回合
     * @param skipDraw 是否跳过摸牌步骤，在吃碰杠后切换玩家时应设为true
     */
    nextTurn(skipDraw = false) {
        (0, logger_1.debugLog)('进入下一个玩家的回合');
        if (this.game.state != game_1.GameState.PLAYING) {
            display_manager_1.displayManager.printWarning(`游戏已结束，不再执行回合。准备进入结算`);
            return;
        }
        if (this.tileManager.getRemainingTiles() === 0) {
            display_manager_1.displayManager.printWarning(`牌山已空，不再执行回合。准备进入结算`);
            return;
        }
        // 获取当前玩家并更新状态
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        currentPlayer.state = player_1.PlayerState.WAITING;
        display_manager_1.displayManager.print(`玩家 ${currentPlayer.name} 出牌结束，状态变为 WAITING`);
        // 计算下一个玩家
        const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % this.players.length;
        this.game.setCurrentPlayerIndex(nextPlayerIndex);
        // 更新下一个玩家的状态
        const nextPlayer = this.players[nextPlayerIndex];
        this.updatePlayerState(nextPlayerIndex);
        // 显示下一个玩家信息
        display_manager_1.displayManager.printDivider();
        display_manager_1.displayManager.printTitle(`轮到 ${nextPlayer.name} 行动 [手牌: ${nextPlayer.handTiles.length}张] [已亮出牌： ${nextPlayer.revealedSets.flatMap(set => set.tiles).length}张] [合计${nextPlayer.getTotalTileCount()}张]`);
        // 只有在非跳过摸牌的情况下才为下一个玩家摸牌
        if (!skipDraw) {
            this.currentPlayerDraw();
        }
    }
    /**
     * 强制AI玩家出牌
     */
    async forceAIPlayerDiscard() {
        // 获取当前玩家
        const currentPlayer = this.players[this.game.currentPlayerIndex];
        // 检查是否为AI玩家
        if (currentPlayer.type !== player_1.PlayerType.AI) {
            display_manager_1.displayManager.printWarning(`当前玩家不是AI，无法强制出牌`);
        }
        // 确保玩家处于可以出牌的状态
        currentPlayer.state = player_1.PlayerState.ACTING;
        // 优先使用AIPlayer的handleDiscard方法
        if (currentPlayer instanceof ai_player_1.AIPlayer) {
            await currentPlayer.handleDiscard(this);
            return;
        }
        // 如果不是AIPlayer实例，使用基本方法
        // 使用AI决策获取出牌索引
        const discardIndex = currentPlayer.getRandomMove();
        display_manager_1.displayManager.printWarning(`强制AI玩家 ${currentPlayer.name} 出牌，选择索引: ${discardIndex}`);
        // 执行出牌
        const discarded = this.currentPlayerDiscard(discardIndex);
        display_manager_1.displayManager.printSuccess(`AI玩家 ${currentPlayer.name} 成功打出: ${discarded.toString()}`);
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
    /**
     * 检查游戏是否应该结束
     * 只负责检查，不修改游戏状态
     * @returns 是否应该结束游戏
     */
    checkGameEnd() {
        // 检查是否有玩家胡牌
        const players = this.game.getAllPlayers();
        // 只检查已经被标记为胜利的玩家，而不主动检查所有玩家是否可以胡牌
        const wonPlayer = players.find(player => player.state === player_1.PlayerState.WON);
        if (wonPlayer) {
            (0, logger_1.debugLog)(`检测到玩家 ${wonPlayer.name} 已经胡牌，游戏结束`);
            display_manager_1.displayManager.printSuccess(`${wonPlayer.name} 胡牌了！游戏结束！`);
            // 设置游戏状态为结束
            this.game.setState(game_1.GameState.ENDED);
            return true;
        }
        // 检查牌山是否为空且所有玩家都过牌
        if (this.tileManager.getRemainingTiles() === 0) {
            const allPlayersPassed = players.every(player => player.state === player_1.PlayerState.FINISHED);
            if (allPlayersPassed) {
                (0, logger_1.debugLog)(`牌山已空且所有玩家都已过牌，游戏流局`);
                // 设置游戏状态为结束
                this.game.setState(game_1.GameState.ENDED);
                return true;
            }
        }
        return false;
    }
    /**
     * 检查玩家是否胡牌
     * @param player 要检查的玩家
     * @returns 是否胡牌
     */
    checkHu(player, tile = null) {
        // 使用 RuleEngine 的 getHuDetails 方法判断是否可以胡牌
        const result = rule_engine_1.RuleEngine.getHuDetails(player, tile);
        // 如果可以胡牌，记录胡牌类型
        if (result.canHu) {
            const huType = result.huType;
            const description = result.description || index_1.WinConditions.getHuTypeDescription(huType);
            display_manager_1.displayManager.printSuccess(`${player.name} 胡牌类型: ${description}`);
            // 计算得分
            const scoreResult = rule_engine_1.RuleEngine.calculateScore(player, huType, { isSelfDrawn: tile === null });
            display_manager_1.displayManager.printSuccess(`得分: ${scoreResult.score}`);
            display_manager_1.displayManager.printSuccess(`得分详情: ${JSON.stringify(scoreResult.details)}`);
            // 设置玩家状态为胡牌
            player.state = player_1.PlayerState.WON;
        }
        return result.canHu;
    }
    /**
     * 处理牌山为空的情况
     * 负责显示状态、设置游戏状态和询问用户是否开始新局
     * @returns Promise<boolean> 是否开始新局
     */
    static async handleEmptyTileDeck(game) {
        // 显示警告信息
        display_manager_1.displayManager.printWarning(`牌山已空，无法继续摸牌！`);
        display_manager_1.displayManager.printDivider();
        // 记录游戏状态
        (0, logger_1.infoLog)(`牌山已空，总共摸牌次数: ${game.drawCount}`);
        // 设置游戏状态为结束
        game.state = game_1.GameState.ENDED;
        // 显示游戏总结
        this.displayGameSummary(game);
        // 询问用户是否开始新局
        process.exit(0);
        return await (0, input_1.askConfirmation)("牌山已空，是否开始新局？", true, 10000);
    }
    /**
     * 显示游戏总结
     */
    static displayGameSummary(game) {
        display_manager_1.displayManager.printTitle("游戏总结");
        // 显示玩家信息
        const players = game.getAllPlayers();
        for (const player of players) {
            display_manager_1.displayManager.print(`玩家 ${player.name}:`);
            display_manager_1.displayManager.print(`- 手牌数量: ${player.handTiles.length}: ${player.handTiles.map(t => t.toString()).join(' ')}`);
            display_manager_1.displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组: ${player.revealedSets.map(set => `${set.tiles.map(t => t.toString()).join(' ')} (${set.type})`).join(' ')}`);
            display_manager_1.displayManager.print(`- 状态: ${player_1.PlayerState[player.state]}`);
        }
        display_manager_1.displayManager.print(`总摸牌次数: ${game.drawCount}`);
        display_manager_1.displayManager.printDivider();
    }
    /**
     * 处理玩家碰牌
     * @param player 要碰牌的玩家
     * @param tile 要碰的牌
     * @returns 是否成功碰牌
     */
    async handlePeng(player, tile) {
        // 使用 RuleEngine 检查是否可以碰
        if (!rule_engine_1.RuleEngine.canPeng(player, tile)) {
            display_manager_1.displayManager.printError(`${player.name} 没有足够的牌进行碰牌`);
            return false;
        }
        // 使用 player.peng 方法执行碰牌操作
        const result = player.peng(tile);
        if (result) {
            display_manager_1.displayManager.printSuccess(`${player.name} 碰了 ${tile.toString()}`);
            // 碰牌成功后，设置该玩家为当前玩家
            const playerIndex = this.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
                this.game.setCurrentPlayerIndex(playerIndex);
                // 更新玩家状态
                player.state = player_1.PlayerState.ACTING;
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "碰");
            }
        }
        else {
            display_manager_1.displayManager.printError(`${player.name} 碰牌失败`);
        }
        return result;
    }
    /**
     * 处理玩家杠牌
     * @param player 要杠牌的玩家
     * @param tile 要杠的牌
     * @returns 是否成功杠牌
     */
    async handleGang(player, tile = null) {
        // 准备游戏状态信息
        const gameState = {
            currentPlayer: this.game.getCurrentPlayer(),
            allPlayers: this.game.getAllPlayers()
        };
        // 使用 RuleEngine 检查是否可以杠
        const gangResult = rule_engine_1.RuleEngine.canGang(player, tile, gameState);
        if (!gangResult.canGang) {
            display_manager_1.displayManager.printError(`${player.name} 无法进行杠牌操作`);
            return false;
        }
        let gangSuccess = false;
        // 根据杠牌类型调用对应的处理方法
        switch (gangResult.gangType) {
            case rule_types_1.GangType.MING:
                // 明杠
                gangSuccess = await this.handleMingGang(player, tile);
                break;
            case rule_types_1.GangType.AN:
                // 暗杠
                gangSuccess = await this.handleAnGang(player);
                break;
            case rule_types_1.GangType.BU:
                // 补杠
                gangSuccess = await this.handleBuGang(player);
                break;
            case rule_types_1.GangType.QIANG:
                // 抢杠
                gangSuccess = await this.handleQiangGang(player, gangResult.tiles || []);
                break;
            default:
                display_manager_1.displayManager.printError(`未知的杠牌类型`);
                return false;
        }
        return gangSuccess;
    }
    /**
     * 执行明杠操作
     * 只处理杠牌逻辑，不包含杠上开花的检查
     * @param player 要杠牌的玩家
     * @param tile 要杠的牌
     * @returns 是否成功杠牌
     */
    executeMingGang(player, tile) {
        // 使用 player.gang 方法进行明杠
        const result = player.gang(tile);
        if (result) {
            display_manager_1.displayManager.printSuccess(`${player.name} 明杠了 ${tile.toString()}`);
            return true;
        }
        else {
            display_manager_1.displayManager.printError(`${player.name} 没有足够的牌进行明杠`);
            return false;
        }
    }
    /**
     * 处理明杠
     * @param player 要杠牌的玩家
     * @param tile 要杠的牌
     * @returns 是否成功杠牌（包括杠上开花检查）
     */
    async handleMingGang(player, tile) {
        // 执行明杠
        const gangSuccess = this.executeMingGang(player, tile);
        // 明杠成功后，检查杠上开花
        if (gangSuccess) {
            // 设置该玩家为当前玩家
            const playerIndex = this.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
                this.game.setCurrentPlayerIndex(playerIndex);
                // 更新玩家状态
                this.updatePlayerState(playerIndex);
            }
            // 如果牌山为空，直接返回成功，但仍需出牌
            if (this.tileManager.getRemainingTiles() === 0) {
                display_manager_1.displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "杠");
                return true;
            }
            // 杠上开花
            const huResult = await this.checkGangShangKaiHua(player);
            // 如果没有胡牌，需要出牌
            if (!huResult) {
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "杠");
            }
            return true;
        }
        return false;
    }
    /**
     * 处理暗杠
     * @param player 要暗杠的玩家
     * @returns 是否成功暗杠
     */
    async handleAnGang(player) {
        // 暗杠使用 player.gang(null) 方法
        if (player.gang(null)) {
            display_manager_1.displayManager.printSuccess(`${player.name} 暗杠了一组牌`);
            // 如果牌山为空，直接返回成功，但仍需出牌
            if (this.tileManager.getRemainingTiles() === 0) {
                display_manager_1.displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "杠");
                return true;
            }
            // 暗杠成功后，应该摸牌
            this.drawTileForPlayer(player, { notify: true });
            // 检查是否可以胡牌
            const huResult = rule_engine_1.RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
            if (huResult.canHu) {
                display_manager_1.displayManager.printSuccess(`${player.name} 暗杠后胡牌！类型：${huResult.description}`);
                // 设置玩家状态为胡牌
                player.state = player_1.PlayerState.WON;
                // 设置游戏状态为结束
                this.game.setState(game_1.GameState.ENDED);
                return true;
            }
            // 暗杠后需要出牌
            await this.requirePlayerToDiscard(player, "暗杠");
            return true;
        }
        return false;
    }
    /**
     * 检查杠上开花
     * 在成功杠牌后调用，检查摸到的牌是否可以胡牌
     * @param player 要检查的玩家
     * @returns 是否成功胡牌
     */
    async checkGangShangKaiHua(player) {
        (0, logger_1.debugLog)('检查杠上开花');
        // 记录杠牌成功
        display_manager_1.displayManager.printSuccess(`${player.name} 杠牌成功，摸一张新牌`);
        // 摸一张牌
        const drawnTile = this.drawTileForPlayer(player, { notify: true });
        // 检查是否可以胡牌，并指定游戏状态为杠上开花
        const huResult = rule_engine_1.RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
        if (huResult.canHu) {
            display_manager_1.displayManager.printSuccess(`${player.name} 杠上开花胡牌！类型：${huResult.description}`);
            // 设置玩家状态为胡牌
            player.state = player_1.PlayerState.WON;
            // 设置游戏状态为结束
            this.game.setState(game_1.GameState.ENDED);
            return true;
        }
        else {
            display_manager_1.displayManager.print(`${player.name} 摸了一张牌：${player.type === player_1.PlayerType.HUMAN ? drawnTile.toString() : '[暗牌]'}`);
        }
        return false;
    }
    // /**
    //  * 检查海底捞月
    //  * 在摸最后一张牌时调用，检查是否可以胡牌
    //  * @param player 要检查的玩家
    //  * @returns 是否成功海底捞月
    //  */
    // private checkHaiDiLaoYue(player: Player): boolean {
    //   debugLog('检查海底捞月')
    //   // 检查牌山是否只剩一张牌
    //   if (this.tileManager.getRemainingTiles() !== 1) return false;
    //   // 摸最后一张牌（不实际摸牌，只是模拟能否海底捞月）
    //   // this.drawTileForPlayer(player, { notify: true });
    //   // 检查是否可以胡牌，并指定游戏状态为海底捞月
    //   const huResult = RuleEngine.getHuDetails(player, null, { isDrawn: true, isLastTile: true });
    //   if (huResult.canHu) {
    //     displayManager.printSuccess(`${player.name} 海底捞月胡牌！类型：${huResult.description}`);
    //     // 设置玩家状态为胡牌
    //     player.state = PlayerState.WON;
    //     // 设置游戏状态为结束
    //     this.game.setState(GameState.ENDED);
    //     return true;
    //   }
    //   return false;
    // }
    /**
     * 处理玩家吃牌
     * @param player 要吃牌的玩家
     * @param tile 要吃的牌
     * @returns 是否成功吃牌
     */
    async handleChi(player, tile) {
        // 使用 RuleEngine 检查玩家是否可以吃
        if (!rule_engine_1.RuleEngine.canChi(player, tile)) {
            display_manager_1.displayManager.printError(`${player.name} 不能吃 ${tile.toString()}`);
            return false;
        }
        // 获取所有可能的吃牌组合
        const possibleCombinations = rule_engine_1.RuleEngine.findChiCombinations(player.handTiles, tile);
        if (possibleCombinations.length === 0) {
            display_manager_1.displayManager.printError(`${player.name} 没有可以吃的牌组合`);
            return false;
        }
        let selectedCombination;
        // 根据玩家类型选择吃牌组合
        if (player.type === player_1.PlayerType.HUMAN) {
            display_manager_1.displayManager.print(`请选择要吃的组合：`);
            possibleCombinations.forEach((combo, index) => {
                display_manager_1.displayManager.print(`${index + 1}. ${combo.map(t => t.toString()).join(' ')}`);
            });
            // 等待玩家输入
            const choice = parseInt(await (0, input_1.askQuestion)("请输入选择的组合编号："));
            if (isNaN(choice) || choice < 1 || choice > possibleCombinations.length) {
                display_manager_1.displayManager.printError("无效的选择");
                return false;
            }
            selectedCombination = possibleCombinations[choice - 1];
        }
        else {
            // AI玩家自动选择第一个可用的组合
            selectedCombination = possibleCombinations[0];
        }
        // 筛选出不包含目标牌的组合部分（即玩家手牌部分）
        const handTilesToUse = selectedCombination.filter(t => t.id !== tile.id);
        // 使用 player.chi 方法来处理吃牌逻辑
        const result = player.chi(handTilesToUse, tile);
        if (result) {
            display_manager_1.displayManager.printSuccess(`${player.name} 吃了 ${tile.toString()}`);
            // 吃牌成功后，设置该玩家为当前玩家
            const playerIndex = this.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
                this.game.setCurrentPlayerIndex(playerIndex);
                // 更新玩家状态
                player.state = player_1.PlayerState.ACTING;
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "吃");
            }
        }
        else {
            display_manager_1.displayManager.printError(`${player.name} 吃牌失败`);
        }
        return result;
    }
    /**
     * 处理人类玩家出牌
     * @param player 人类玩家
     * @param tileIndex 要打出的牌的索引
     * @returns 是否成功出牌
     */
    handleHumanPlayerDiscard(player, tileIndex) {
        if (player.type !== player_1.PlayerType.HUMAN) {
            display_manager_1.displayManager.printError("只有人类玩家可以使用此方法");
            return false;
        }
        // 使用 player.discardTile 方法
        const tile = player.discardTile(tileIndex);
        // 更新游戏状态
        if (tile) {
            this.game.setLastDiscardedTile(tile);
            display_manager_1.displayManager.printSuccess(`${player.name} 打出了 ${tile.toString()}`);
            return true;
        }
        else {
            display_manager_1.displayManager.printError("打出的牌为 null");
            return false;
        }
    }
    /**
     * 处理玩家补杠
     * @param player 要补杠的玩家
     * @returns 是否成功补杠
     */
    async handleBuGang(player) {
        // 补杠使用 player.gang(null) 方法
        if (player.gang(null)) {
            display_manager_1.displayManager.printSuccess(`${player.name} 补杠了一组牌`);
            // 设置该玩家为当前玩家
            const playerIndex = this.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
                this.game.setCurrentPlayerIndex(playerIndex);
                // 更新玩家状态
                this.updatePlayerState(playerIndex);
            }
            // 如果牌山为空，直接返回成功，但仍需出牌
            if (this.tileManager.getRemainingTiles() === 0) {
                display_manager_1.displayManager.printWarning(`牌山已空，无法摸牌进行杠上开花`);
                // 要求玩家出牌
                await this.requirePlayerToDiscard(player, "杠");
                return true;
            }
            // 补杠成功后，应该摸牌
            this.drawTileForPlayer(player, { notify: true });
            // 检查是否可以胡牌
            const huResult = rule_engine_1.RuleEngine.getHuDetails(player, null, { isDrawn: true, isAfterKong: true });
            if (huResult.canHu) {
                display_manager_1.displayManager.printSuccess(`${player.name} 补杠后胡牌！类型：${huResult.description}`);
                return true;
            }
            // 补杠后需要出牌
            await this.requirePlayerToDiscard(player, "补杠");
            return true;
        }
        return false;
    }
    /**
     * 处理抢杠
     * @param player 要抢杠的玩家
     * @param tiles 被抢杠的牌
     * @returns 是否成功抢杠
     */
    async handleQiangGang(player, tiles) {
        if (tiles.length === 0)
            return false;
        // 抢杠的处理比较特殊，需要获取当前玩家正在补杠的牌
        const currentPlayer = this.game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer === player)
            return false;
        // 检查玩家是否能胡这张牌
        if (!this.checkHu(player, tiles[0]))
            return false;
        // 如果玩家可以胡牌，则执行抢杠操作
        display_manager_1.displayManager.printSuccess(`${player.name} 抢杠了 ${tiles[0].toString()}`);
        // 抢杠成功后，设置游戏状态
        this.game.setLastDiscardedTile(tiles[0]);
        return true;
    }
    /**
     * 处理花牌
     * @param player 摸到花牌的玩家
     * @param tile 花牌
     * @returns 是否成功处理花牌
     */
    handleHuaPai(player, tile) {
        // 检查是否是花牌
        if (tile.type !== tile_1.TileType.FENG && tile.type !== tile_1.TileType.JIAN) {
            return false;
        }
        // 从手牌中移除花牌
        const index = player.handTiles.findIndex(t => t.id === tile.id);
        if (index === -1) {
            return false;
        }
        // 从手牌中移除并添加到花牌集合
        const flowerTile = player.handTiles.splice(index, 1)[0];
        player.flowerTiles.push(flowerTile);
        display_manager_1.displayManager.printSuccess(`${player.name} 摸到花牌: ${tile.toString()}`);
        if (this.tileManager.getRemainingTiles() === 0) {
            display_manager_1.displayManager.printWarning(`牌山已空，不再执行回合。准备进入结算`);
            return true;
        }
        // 摸一张新牌
        this.drawTileForPlayer(player, { notify: true });
        // 检查补到的牌是否可以胡牌
        if (rule_engine_1.RuleEngine.canHu(player, null, { isDrawn: true })) {
            display_manager_1.displayManager.printSuccess(`${player.name} 补花后胡牌！`);
            // 设置玩家状态为胡牌
            player.state = player_1.PlayerState.WON;
            // 设置游戏状态为结束
            this.game.setState(game_1.GameState.ENDED);
            return true;
        }
        return true;
    }
    /**
     * 检查当前玩家是否可以进行特殊操作
     */
    async checkSpecialActions(player) {
        (0, logger_1.debugLog)('检查当前玩家是否可以进行特殊操作');
        // 准备可能的操作
        const possibleActions = [rule_types_1.PlayerAction.PASS];
        // 检查是否可以胡牌
        if (rule_engine_1.RuleEngine.canHu(player, null)) {
            possibleActions.push(rule_types_1.PlayerAction.HU);
        }
        // 检查是否可以杠牌
        if (rule_engine_1.RuleEngine.canGang(player, null, { currentPlayer: player, allPlayers: this.game.getAllPlayers() }).canGang) {
            possibleActions.push(rule_types_1.PlayerAction.GANG);
        }
        // 如果只有"过"这一个选项，则直接返回
        if (possibleActions.length === 1) {
            return false;
        }
        // 提示玩家可以进行的操作
        display_manager_1.displayManager.printWarning(`玩家 ${player.name} 可以对 ${player.lastDrawnTile.toString()} 进行以下操作:`);
        let selectedAction;
        // 如果是AI玩家，自动选择操作
        if (player.type === player_1.PlayerType.AI) {
            // AI逻辑：优先胡牌，其次杠牌，再次碰牌，最后吃牌或过
            if (possibleActions.includes(rule_types_1.PlayerAction.HU)) {
                selectedAction = rule_types_1.PlayerAction.HU;
            }
            else if (possibleActions.includes(rule_types_1.PlayerAction.GANG)) {
                selectedAction = rule_types_1.PlayerAction.GANG;
            }
            else {
                selectedAction = rule_types_1.PlayerAction.PASS;
            }
            display_manager_1.displayManager.printWarning(`AI玩家 ${player.name} 选择了: ${selectedAction}`);
        }
        else {
            // 人类玩家，等待用户选择
            const options = possibleActions.map(action => {
                switch (action) {
                    case rule_types_1.PlayerAction.PASS: return "过";
                    case rule_types_1.PlayerAction.GANG: return "杠";
                    case rule_types_1.PlayerAction.HU: return "胡";
                    default: return action;
                }
            });
            const selectedIndex = await (0, input_1.askMultipleChoice)("请选择操作:", options);
            selectedAction = possibleActions[selectedIndex];
        }
        // 执行选择的操作
        switch (selectedAction) {
            case rule_types_1.PlayerAction.HU:
                this.handlePlayerHu(player, null);
                return true;
            case rule_types_1.PlayerAction.GANG:
                await this.handleGang(player, null);
                return true;
            default:
                // 玩家选择"过"，不做任何操作
                display_manager_1.displayManager.print(`玩家 ${player.name} 选择了"过"`);
                break;
        }
        return false;
    }
    /**
     * 处理玩家胡牌
     */
    handlePlayerHu(player, tile) {
        // 获取胡牌详情
        const huDetails = rule_engine_1.RuleEngine.getHuDetails(player, tile);
        if (huDetails.canHu) {
            display_manager_1.displayManager.printSuccess(`${player.name} 胡牌！胡牌类型: ${huDetails.description}`);
            // 计算得分
            const scoreResult = rule_engine_1.RuleEngine.calculateScore(player, huDetails.huType, { isSelfDrawn: false });
            display_manager_1.displayManager.printSuccess(`得分: ${scoreResult.score}`);
            // 设置玩家状态为赢
            player.state = player_1.PlayerState.WON;
            // 设置游戏状态为结束
            this.game.setState(game_1.GameState.ENDED);
        }
        else {
            display_manager_1.displayManager.printError(`${player.name} 不能胡牌`);
        }
    }
    /**
     * 处理当前玩家的出牌行动
     */
    async handleCurrentPlayerDiscard() {
        (0, logger_1.debugLog)('处理当前玩家的出牌行动');
        const currentPlayer = this.game.getCurrentPlayer();
        // 显示当前玩家的手牌
        display_manager_1.displayManager.displayPlayerHand(currentPlayer);
        // 如果是AI玩家，则使用AI策略处理
        if (currentPlayer.type === player_1.PlayerType.AI) {
            let discardedTile = null;
            // 使用AIPlayer的处理方法
            if (currentPlayer instanceof ai_player_1.AIPlayer) {
                discardedTile = await currentPlayer.handleDiscard(this);
            }
            else {
                // 如果不是AIPlayer实例但类型是AI，使用基本AI逻辑
                (0, logger_1.infoLog)(`AI玩家 ${currentPlayer.name} 不是AIPlayer实例，使用基本AI逻辑处理`);
                const discardIndex = currentPlayer.getRandomMove();
                discardedTile = this.currentPlayerDiscard(discardIndex);
            }
            display_manager_1.displayManager.printSuccess(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
            display_manager_1.displayManager.addToTurnLog(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
            // 检查其他玩家是否可以对此牌进行操作
            await this.checkOtherPlayersResponse(discardedTile);
        }
        else if (currentPlayer.type === player_1.PlayerType.HUMAN) {
            // 人类玩家
            await this.handleHumanPlayerAction(currentPlayer);
        }
    }
    /**
       * 处理人类玩家行动
       */
    async handleHumanPlayerAction(player) {
        display_manager_1.displayManager.printWarning(`轮到您出牌，请选择要打出的牌(输入序号1-${player.handTiles.length})`);
        display_manager_1.displayManager.printWarning(`输入h查看手牌详情，输入q退出游戏\n`);
        // 获取玩家输入
        display_manager_1.displayManager.printWarning('请输入您要打出的牌的序号:');
        // 获取用户输入的索引
        (0, input_1.getNextDiscardIndex)(player.handTiles.length, async (tileIndex) => {
            if (tileIndex !== -1) {
                const discardedTile = this.currentPlayerDiscard(tileIndex);
                display_manager_1.displayManager.printSuccess(`${player.name} 打出了 ${discardedTile.toString()}`);
                display_manager_1.displayManager.addToTurnLog(`${player.name} 打出了 ${discardedTile.toString()}`);
                // 检查其他玩家是否可以对此牌进行操作
                await this.checkOtherPlayersResponse(discardedTile);
            }
            else {
                (0, logger_1.errorLog)('程序错误排查问题');
                process.exit(0);
            }
        });
    }
    /**
     * 检查其他玩家是否可以对打出的牌进行响应
     * @returns 是否有玩家进行了响应（吃碰杠胡）
     */
    async checkOtherPlayersResponse(discardedTile) {
        (0, logger_1.debugLog)('检查其他玩家是否可以对打出的牌进行响应');
        if (!discardedTile)
            return false;
        const currentPlayer = this.game.getCurrentPlayer();
        const allPlayers = this.game.getAllPlayers();
        const otherPlayers = allPlayers.filter(p => p.id !== currentPlayer.id);
        (0, logger_1.debugLog)(`检查其他玩家对 ${discardedTile.toString()} 的响应`);
        // 按照优先级检查响应：胡 > 杠 > 碰 > 吃
        // 先检查是否有人可以胡牌
        const canHuPlayers = otherPlayers.filter(p => rule_engine_1.RuleEngine.canHu(p, discardedTile));
        if (canHuPlayers.length > 0) {
            (0, logger_1.debugLog)(`发现 ${canHuPlayers.length} 名玩家可以胡 ${discardedTile.toString()}`);
            // 根据座次顺序获取胡牌玩家顺序
            const huPlayer = canHuPlayers.find(player => player.id === this.game.currentPlayerIndex);
            (0, logger_1.debugLog)(`选择 ${huPlayer.name} 进行胡牌处理`);
            if (huPlayer.type === player_1.PlayerType.AI) {
                // AI玩家自动胡牌
                (0, logger_1.debugLog)(`AI玩家 ${huPlayer.name} 自动选择胡牌`);
                this.handlePlayerHu(huPlayer, discardedTile);
                return true;
            }
            else {
                // 人类玩家选择是否胡牌
                display_manager_1.displayManager.printWarning(`${huPlayer.name}，您可以胡 ${discardedTile.toString()}`);
                const want = await (0, input_1.askQuestion)("是否胡牌？(y/n)");
                if (want.toLowerCase() === 'y') {
                    (0, logger_1.debugLog)(`人类玩家 ${huPlayer.name} 选择胡牌`);
                    this.handlePlayerHu(huPlayer, discardedTile);
                    return true;
                }
                else {
                    (0, logger_1.debugLog)(`人类玩家 ${huPlayer.name} 选择不胡牌`);
                }
            }
        }
        // 检查是否有人可以杠牌
        const canGangPlayers = otherPlayers.filter(p => rule_engine_1.RuleEngine.canGang(p, discardedTile, { currentPlayer: currentPlayer, allPlayers: allPlayers }).canGang);
        if (canGangPlayers.length > 0) {
            (0, logger_1.debugLog)(`发现 ${canGangPlayers.length} 名玩家可以杠 ${discardedTile.toString()}`);
            const gangPlayer = canGangPlayers[0];
            if (gangPlayer.type === player_1.PlayerType.AI) {
                // AI玩家自动杠牌
                (0, logger_1.debugLog)(`AI玩家 ${gangPlayer.name} 自动选择杠牌`);
                const gangSuccess = await this.handleGang(gangPlayer, discardedTile);
                if (gangSuccess) {
                    return true;
                }
            }
            else {
                // 人类玩家选择是否杠牌
                display_manager_1.displayManager.printWarning(`${gangPlayer.name}，您可以杠 ${discardedTile.toString()}`);
                const want = await (0, input_1.askQuestion)("是否杠牌？(y/n)");
                if (want.toLowerCase() === 'y') {
                    (0, logger_1.debugLog)(`人类玩家 ${gangPlayer.name} 选择杠牌`);
                    const gangSuccess = await this.handleGang(gangPlayer, discardedTile);
                    if (gangSuccess) {
                        return true;
                    }
                }
                else {
                    (0, logger_1.debugLog)(`人类玩家 ${gangPlayer.name} 选择不杠牌`);
                }
            }
        }
        // 检查是否有人可以碰牌
        const canPengPlayers = otherPlayers.filter(p => rule_engine_1.RuleEngine.canPeng(p, discardedTile));
        if (canPengPlayers.length > 0) {
            (0, logger_1.debugLog)(`发现 ${canPengPlayers.length} 名玩家可以碰 ${discardedTile.toString()}`);
            const pengPlayer = canPengPlayers[0];
            if (pengPlayer.type === player_1.PlayerType.AI) {
                // AI玩家自动碰牌
                (0, logger_1.debugLog)(`AI玩家 ${pengPlayer.name} 自动选择碰牌`);
                const pengSuccess = await this.handlePeng(pengPlayer, discardedTile);
                if (pengSuccess) {
                    return true;
                }
            }
            else {
                // 人类玩家选择是否碰牌
                display_manager_1.displayManager.printWarning(`${pengPlayer.name}，您可以碰 ${discardedTile.toString()}`);
                const want = await (0, input_1.askQuestion)("是否碰牌？(y/n)");
                if (want.toLowerCase() === 'y') {
                    (0, logger_1.debugLog)(`人类玩家 ${pengPlayer.name} 选择碰牌`);
                    const pengSuccess = await this.handlePeng(pengPlayer, discardedTile);
                    if (pengSuccess) {
                        return true;
                    }
                }
                else {
                    (0, logger_1.debugLog)(`人类玩家 ${pengPlayer.name} 选择不碰牌`);
                }
            }
        }
        // 检查是否有人可以吃牌（仅下家可以吃）
        const nextPlayerIndex = (this.game.currentPlayerIndex + 1) % allPlayers.length;
        const nextPlayer = allPlayers[nextPlayerIndex];
        if (rule_engine_1.RuleEngine.canChi(nextPlayer, discardedTile)) {
            (0, logger_1.debugLog)(`下家 ${nextPlayer.name} 可以吃 ${discardedTile.toString()}`);
            if (nextPlayer.type === player_1.PlayerType.AI) {
                // AI玩家自动吃牌
                (0, logger_1.debugLog)(`AI玩家 ${nextPlayer.name} 自动选择吃牌`);
                const chiSuccess = await this.handleChi(nextPlayer, discardedTile);
                if (chiSuccess) {
                    return true;
                }
            }
            else {
                // 人类玩家选择是否吃牌
                display_manager_1.displayManager.printWarning(`${nextPlayer.name}，您可以吃 ${discardedTile.toString()}`);
                const want = await (0, input_1.askQuestion)("是否吃牌？(y/n)");
                if (want.toLowerCase() === 'y') {
                    (0, logger_1.debugLog)(`人类玩家 ${nextPlayer.name} 选择吃牌`);
                    const chiSuccess = await this.handleChi(nextPlayer, discardedTile);
                    if (chiSuccess) {
                        return true;
                    }
                }
                else {
                    (0, logger_1.debugLog)(`人类玩家 ${nextPlayer.name} 选择不吃牌`);
                }
            }
        }
        (0, logger_1.debugLog)(`所有玩家对 ${discardedTile.toString()} 的响应检查完成, 无人操作，下一步`);
        return false;
    }
    /**
     * 处理超时情况下的动作
     */
    async handleTimeoutAction(player) {
        display_manager_1.displayManager.printWarning(`玩家 ${player.name} 操作超时，自动选择"过"`);
        // 如果是当前玩家，可能需要强制出牌
        if (player.id === this.game.currentPlayerIndex) {
            // 如果有超出张数的手牌，需要强制出牌
            if (player.needsToDiscard()) {
                // 如果是AI玩家，使用forceAIPlayerDiscard方法
                if (player.type === player_1.PlayerType.AI) {
                    await this.forceAIPlayerDiscard();
                }
                else {
                    // 随机选择一张牌
                    const discardIndex = player.getRandomMove();
                    const discardedTile = this.currentPlayerDiscard(discardIndex);
                    display_manager_1.displayManager.printWarning(`由于超时，系统为玩家 ${player.name} 自动打出: ${discardedTile.toString()}`);
                    // 检查其他玩家是否可以对此牌进行操作
                    await this.checkOtherPlayersResponse(discardedTile);
                }
            }
        }
        else {
            (0, logger_1.errorLog)('程序错误，排查问题');
            process.exit(0);
        }
    }
    /**
     * 处理游戏结束
     */
    async handleGameEnd() {
        display_manager_1.displayManager.printTitle("游戏结束");
        // 检查是否有玩家胡牌
        const players = this.game.getAllPlayers();
        let winningPlayer = null;
        for (const player of players) {
            if (player.state === player_1.PlayerState.WON) {
                winningPlayer = player;
                break;
            }
        }
        if (winningPlayer) {
            display_manager_1.displayManager.printSuccess(`恭喜 ${winningPlayer.name} 胡牌获胜！`);
            // 可以添加胡牌类型和分数的显示
        }
        else {
            display_manager_1.displayManager.printWarning("游戏流局，无人胡牌");
        }
        // 显示游戏结算
        this.displayGameSummary();
        // 询问是否开始新局
        const startNewGame = await (0, input_1.askQuestion)("是否开始新一局游戏？(y/n)");
        if (startNewGame.toLowerCase() === 'y') {
            // 重置游戏状态
            this.game.reset();
            // 重置输入状态
            input_1.InputState.isWaitingForUserInput = false;
            // 启动新游戏
            this.startGame();
            return true;
        }
        else {
            display_manager_1.displayManager.printWarning("游戏结束，感谢参与！");
            process.exit(0);
        }
    }
    /**
     * 显示游戏总结
     */
    displayGameSummary() {
        display_manager_1.displayManager.printTitle("游戏总结");
        // 显示玩家信息
        const players = this.game.getAllPlayers();
        for (const player of players) {
            display_manager_1.displayManager.print(`玩家 ${player.name}:`);
            display_manager_1.displayManager.print(`- 手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
            display_manager_1.displayManager.print(`- 手牌数量: ${player.handTiles.length}: ${player.handTiles.map(t => t.toString()).join(' ')}`);
            display_manager_1.displayManager.print(`- 已亮出牌组: ${player.revealedSets.length}组: ${player.revealedSets.map(set => `${set.tiles.map(t => t.toString()).join(' ')} (${set.type})`).join(' ')}`);
            display_manager_1.displayManager.print(`- 状态: ${player_1.PlayerState[player.state]}`);
        }
        display_manager_1.displayManager.print(`总摸牌次数: ${this.game.drawCount}`);
        display_manager_1.displayManager.print(`剩余牌数: ${this.game.getRemainingTiles()}`);
        display_manager_1.displayManager.printDivider();
    }
    /**
     * 要求玩家打出一张牌
     * 在吃碰杠操作后调用，确保玩家完成出牌动作
     * @param player 需要出牌的玩家
     * @param actionType 之前执行的动作类型（吃/碰/杠）
     */
    async requirePlayerToDiscard(player, actionType) {
        (0, logger_1.debugLog)('在吃碰杠操作后调用，确保玩家完成出牌动作');
        // 要求玩家出牌
        if (player.type === player_1.PlayerType.AI) {
            // AI玩家自动出牌
            display_manager_1.displayManager.printWarning(`AI玩家 ${player.name} ${actionType}后需要打出一张牌`);
            // 等待100毫秒，让界面有时间更新
            await new Promise(resolve => setTimeout(resolve, 100));
            // 使用AI策略选择一张牌打出
            await this.handleCurrentPlayerDiscard();
        }
        else {
            // 人类玩家选择出牌
            display_manager_1.displayManager.printWarning(`${player.name}，${actionType}后请选择一张牌打出`);
            // 人类玩家的出牌会在游戏循环中处理
        }
    }
}
exports.GameEventHandler = GameEventHandler;
