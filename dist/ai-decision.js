"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDecisionPause = aiDecisionPause;
exports.handleAIDiscard = handleAIDiscard;
const player_1 = require("./player");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
/**
 * 模拟AI思考延迟的时间范围（毫秒）
 */
const AI_DECISION_DELAY = {
    MIN: 300,
    MAX: 800
};
/**
 * 使AI决策暂停一小段时间，模拟思考过程
 * @returns Promise<void>
 */
async function aiDecisionPause() {
    // 生成一个随机延迟时间
    const delayTime = Math.floor(Math.random() * (AI_DECISION_DELAY.MAX - AI_DECISION_DELAY.MIN + 1) + AI_DECISION_DELAY.MIN);
    // 返回一个Promise，在指定的延迟时间后解析
    return new Promise(resolve => setTimeout(resolve, delayTime));
}
/**
 * 处理AI玩家出牌
 * @param game 游戏实例
 * @param player AI玩家
 * @param gameFlow 游戏流程控制器
 */
async function handleAIDiscard(game, player, gameEventHandler) {
    // 检查AI玩家是否需要出牌
    if (!player.needsToDiscard()) {
        (0, logger_1.debugLog)(`AI玩家 ${player.name} 不需要出牌，手牌数量：${player.handTiles.length}`);
        return;
    }
    // 确保这是一个AI玩家
    if (player.type !== player_1.PlayerType.AI) {
        (0, logger_1.debugLog)(`错误: 尝试让非AI玩家 ${player.name} 自动出牌`);
        return;
    }
    // 显示AI正在思考
    (0, logger_1.infoLog)(`AI玩家 ${player.name} 正在分析手牌...`);
    try {
        // 使用玩家的AI方法获取出牌决策
        const discardIndex = player.getAIMove();
        if (discardIndex < 0 || discardIndex >= player.handTiles.length) {
            (0, logger_1.debugLog)(`AI玩家 ${player.name} 返回的索引 ${discardIndex} 无效`);
            display_manager_1.displayManager.printWarning(`AI玩家 ${player.name} 无法决定要打出哪张牌，随机选择`);
            // 随机选择一张牌出牌
            const randomIndex = Math.floor(Math.random() * player.handTiles.length);
            // 执行出牌
            const randomDiscard = gameEventHandler.currentPlayerDiscard(randomIndex);
            if (randomDiscard) {
                display_manager_1.displayManager.printWarning(`AI玩家 ${player.name} 随机打出: ${randomDiscard.toString()}`);
            }
            else {
                display_manager_1.displayManager.printError(`AI玩家 ${player.name} 随机出牌失败`);
            }
            return;
        }
        // 显示AI的思考过程
        const tileToDiscard = player.handTiles[discardIndex];
        (0, logger_1.debugLog)(`AI玩家 ${player.name} 决定打出第${discardIndex + 1}张牌: ${tileToDiscard.toString()}`);
        display_manager_1.displayManager.print(`AI玩家 ${player.name} 分析完成，选择打出: ${tileToDiscard.toString()}`);
        // 执行出牌
        const discardSuccess = gameEventHandler.currentPlayerDiscard(discardIndex);
        if (discardSuccess) {
            (0, logger_1.infoLog)(`AI玩家 ${player.name} 成功打出: ${discardSuccess.toString()}`);
            display_manager_1.displayManager.printSuccess(`AI玩家 ${player.name} 打出: ${discardSuccess.toString()}`);
        }
        else {
            display_manager_1.displayManager.printError(`AI玩家 ${player.name} 出牌失败`);
        }
    }
    catch (error) {
        (0, logger_1.debugLog)(`AI玩家出牌出错: ${error instanceof Error ? error.message : String(error)}`);
        display_manager_1.displayManager.printError(`AI玩家出牌出错: ${error instanceof Error ? error.message : String(error)}`);
        try {
            // 出错时，随机选择一张牌出牌
            const fallbackIndex = Math.floor(Math.random() * player.handTiles.length);
            (0, logger_1.infoLog)(`出错后的备用策略: 使用随机索引 ${fallbackIndex} 出牌`);
            const fallbackTile = gameEventHandler.currentPlayerDiscard(fallbackIndex);
            if (fallbackTile) {
                display_manager_1.displayManager.printWarning(`AI出错恢复：随机打出 ${fallbackTile.toString()}`);
            }
        }
        catch (fallbackError) {
            (0, logger_1.debugLog)(`AI出牌恢复策略也失败: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            display_manager_1.displayManager.printError(`AI玩家无法出牌，请检查游戏状态`);
        }
    }
}
