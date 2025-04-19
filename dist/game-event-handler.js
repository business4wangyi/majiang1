"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEmptyTileDeck = handleEmptyTileDeck;
exports.ensureCorrectHandSizes = ensureCorrectHandSizes;
exports.prepareGameStart = prepareGameStart;
const player_1 = require("./player");
const display_1 = require("./display");
const logger_1 = require("./logger");
const input_1 = require("./input");
const display_manager_1 = require("./display-manager");
/**
 * 处理牌山为空的情况
 */
async function handleEmptyTileDeck(game) {
    (0, logger_1.infoLog)(`牌山已空，结算当前牌局`);
    display_manager_1.displayManager.printTitle(`牌山已空，结算当前牌局`);
    // 显示所有玩家的手牌和得分
    display_manager_1.displayManager.printTitle(`牌局结算`);
    const players = game.getAllPlayers();
    // 去掉计算得分的逻辑，直接显示每个玩家的当前得分和手牌
    for (const player of players) {
        display_manager_1.displayManager.printColored(`${player.name}: ${player.score}分`, display_1.Style.BOLD);
        display_manager_1.displayManager.print(`手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
        display_manager_1.displayManager.print(`打出的牌: ${player.discardedTiles.map(t => t.toString()).join(' ')}`);
        display_manager_1.displayManager.print(``);
    }
    // 保存游戏日志
    (0, logger_1.saveGameLogToFile)(game, "牌山已空，游戏结束");
    // 询问是否继续新的一局
    display_manager_1.displayManager.printColored(`\n是否开始新的一局? (y/n) [5秒内未回答默认为否]`, display_1.Style.YELLOW);
    // 获取用户输入，5秒超时，使用异步readline
    const answer = await (0, input_1.askQuestion)("", 5000);
    // 处理用户选择
    if (answer.toLowerCase() === 'y') {
        (0, logger_1.infoLog)(`准备开始新的一局...`);
        display_manager_1.displayManager.printSuccess(`准备开始新的一局...`);
        game.startGame(); // 重新开始游戏
        return true; // 继续新的一局
    }
    else {
        (0, logger_1.infoLog)(`游戏结束，玩家选择不继续`);
        display_manager_1.displayManager.printError(`游戏结束，感谢您的参与!`);
        return false; // 不继续，结束游戏
    }
}
/**
 * 确保玩家手牌数量正确
 */
function ensureCorrectHandSizes(game) {
    const players = game.getAllPlayers();
    let allCorrect = true;
    for (const player of players) {
        // 确定是否是当前玩家
        const isCurrentPlayer = player.id === game.currentPlayerIndex;
        // 检查当前玩家是否缺少一张牌（应该是14张但只有13张）
        if (isCurrentPlayer) {
            const expectedHandSize = player.getExpectedHandSize(true); // 当前玩家应该有14张牌
            if (player.handTiles.length < expectedHandSize) {
                (0, logger_1.infoLog)(`当前玩家 ${player.name} 手牌不足，当前: ${player.handTiles.length}，预期: ${expectedHandSize}，自动摸牌`);
                const tile = game.drawTileForPlayer(player);
                if (tile) {
                    display_manager_1.displayManager.printSuccess(`当前玩家 ${player.name} 摸了一张牌: ${tile.toString()}`);
                }
                else {
                    (0, logger_1.warnLog)(`当前玩家摸牌失败，牌山可能已空`);
                    return false;
                }
            }
        }
        // 使用Player类的方法判断手牌是否合理
        if (!player.hasValidHandSize(isCurrentPlayer)) {
            const expectedSize = player.getExpectedHandSize(isCurrentPlayer);
            (0, logger_1.warnLog)(`检测到玩家 ${player.name} 手牌数量不正确，当前: ${player.handTiles.length}, 预期: ${expectedSize}`);
            allCorrect = false;
            // 移除修复逻辑，直接报错并通知
            display_manager_1.displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/${expectedSize})，游戏无法继续`);
            (0, logger_1.infoLog)(`游戏即将退出，请检查程序逻辑`);
            // 不立即退出，等待游戏逻辑处理
        }
    }
    return allCorrect;
}
/**
 * 处理游戏启动时的初始化工作
 */
function prepareGameStart(game) {
    (0, logger_1.infoLog)(`准备游戏启动...`);
    // 确保所有玩家手牌正确
    ensureCorrectHandSizes(game);
    // 确保当前玩家状态为ACTING，其他玩家为WAITING
    const players = game.getAllPlayers();
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (i === game.currentPlayerIndex) {
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
    // 为当前玩家摸一张牌，确保手牌数量正确 - 使用Player类方法
    const currentPlayer = game.getCurrentPlayer();
    const expectedHandSize = currentPlayer.getExpectedHandSize(true); // 摸牌阶段应该有14张牌
    if (currentPlayer.handTiles.length < expectedHandSize) {
        (0, logger_1.infoLog)(`为当前玩家 ${currentPlayer.name} 自动摸牌，当前: ${currentPlayer.handTiles.length}，预期: ${expectedHandSize}`);
        const drawnTile = game.currentPlayerDraw();
        if (drawnTile) {
            display_manager_1.displayManager.printSuccess(`当前玩家 ${currentPlayer.name} 摸了一张牌: ${drawnTile.toString()}`);
        }
        else {
            display_manager_1.displayManager.printError(`为当前玩家摸牌失败，牌山可能已空`);
        }
    }
    // 如果有AI玩家手牌超过预期，强制其出牌
    for (const player of players) {
        if (player.type === player_1.PlayerType.AI && player.needsToDiscard()) {
            (0, logger_1.warnLog)(`检测到AI玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
            // 而是标记一个需要处理的状态，在游戏循环中处理
            (0, logger_1.infoLog)(`已标记AI玩家 ${player.name} 需要在游戏开始时出牌`);
        }
    }
    (0, logger_1.infoLog)(`游戏准备就绪`);
}
