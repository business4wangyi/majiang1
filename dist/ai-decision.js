"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_ACTION_DELAY = void 0;
exports.aiDecisionPause = aiDecisionPause;
exports.aiDecideDiscard = aiDecideDiscard;
exports.handleAIDiscard = handleAIDiscard;
const ai_player_1 = require("./ai-player");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
// AI行动间的延迟（毫秒），使自动对战有一定节奏感
exports.AI_ACTION_DELAY = 500;
/**
 * AI决策暂停，给一个短暂的延迟让界面显示更加平滑
 */
function aiDecisionPause(ms = exports.AI_ACTION_DELAY) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * AI决策选择要打出的牌
 * @param player AI玩家
 * @returns 包含索引和名称的牌信息
 */
async function aiDecideDiscard(player) {
    try {
        if (player.handTiles.length === 0) {
            (0, logger_1.warnLog)(`AI玩家 ${player.name} 没有手牌可出`);
            return null;
        }
        // 打印当前手牌信息，帮助调试
        (0, logger_1.debugLog)(`AI玩家 ${player.name} (ID:${player.id}) 当前手牌: ${player.handTiles.map((t, idx) => `${idx}:${t.toString()}`).join(' ')}`);
        // 使用AIPlayer的决策逻辑或备选随机策略
        let selectedIndex;
        if (player instanceof ai_player_1.AIPlayer) {
            selectedIndex = player.getAIMove();
            (0, logger_1.debugLog)(`AIPlayer.getAIMove() 返回索引: ${selectedIndex}`);
        }
        else {
            // 如果是默认Player类但类型为AI，使用简单策略
            selectedIndex = player.getAIMove();
            (0, logger_1.debugLog)(`Player.getAIMove() 返回索引: ${selectedIndex}`);
        }
        // 验证选择的索引是否有效
        if (selectedIndex < 0 || selectedIndex >= player.handTiles.length) {
            (0, logger_1.warnLog)(`AI返回的索引 ${selectedIndex} 无效，调整为最后一张牌`);
            selectedIndex = player.handTiles.length - 1;
        }
        // 确保索引处有有效的牌
        if (!player.handTiles[selectedIndex]) {
            (0, logger_1.warnLog)(`索引 ${selectedIndex} 处无有效牌，尝试寻找有效牌`);
            // 寻找一个有效的牌
            for (let i = 0; i < player.handTiles.length; i++) {
                if (player.handTiles[i]) {
                    selectedIndex = i;
                    (0, logger_1.infoLog)(`找到有效牌，索引: ${i}`);
                    break;
                }
            }
        }
        // 最终安全检查
        if (selectedIndex >= 0 && selectedIndex < player.handTiles.length && player.handTiles[selectedIndex]) {
            return {
                index: selectedIndex,
                name: player.handTiles[selectedIndex].toString()
            };
        }
        else {
            (0, logger_1.warnLog)(`无法为AI玩家 ${player.name} 找到有效牌，手牌数量: ${player.handTiles.length}`);
            return null;
        }
    }
    catch (error) {
        (0, logger_1.errorLog)(`AI决策出错: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
/**
 * 处理AI玩家出牌
 */
async function handleAIDiscard(game, player) {
    // 查询游戏的当前活动玩家
    const currentPlayerIndex = game.currentPlayerIndex;
    const currentPlayer = game.getCurrentPlayer();
    if (!currentPlayer) {
        (0, logger_1.errorLog)(`错误: 游戏中当前没有活动玩家`);
        await (0, logger_1.saveGameLogToFile)(game, `ai出牌-无活动玩家`);
        return;
    }
    // 检查请求出牌的玩家是否是当前游戏的活动玩家
    if (player.id !== currentPlayer.id) {
        (0, logger_1.errorLog)(`错误: handleAIDiscard 被调用时玩家不匹配，当前游戏玩家: ${currentPlayer.name}(ID:${currentPlayer.id})，请求出牌的玩家: ${player.name}(ID:${player.id})`);
        await (0, logger_1.saveGameLogToFile)(game, `ai出牌玩家不匹配-${player.name}-${currentPlayer.name}`);
        return;
    }
    (0, logger_1.infoLog)(`AI玩家 ${currentPlayer.name} (ID:${currentPlayer.id}) 执行出牌决策...`);
    // 调用AI决策逻辑（使用当前活动玩家）
    const cardToDiscard = await aiDecideDiscard(currentPlayer);
    if (cardToDiscard !== null) {
        (0, logger_1.infoLog)(`AI玩家 ${currentPlayer.name} (ID:${currentPlayer.id}) 选择打出: ${cardToDiscard.name}`);
        (0, logger_1.debugLog)(`玩家${currentPlayer.name}尝试打出索引${cardToDiscard.index}的牌，当前手牌数量: ${currentPlayer.handTiles.length}`);
        // 执行出牌动作
        const discardSuccess = game.currentPlayerDiscard(cardToDiscard.index);
        if (discardSuccess) {
            (0, logger_1.infoLog)(`AI玩家 ${currentPlayer.name} (ID:${currentPlayer.id}) 成功打出: ${cardToDiscard.name}`);
            display_manager_1.displayManager.addToTurnLog(`${currentPlayer.name} 打出了 ${discardSuccess.toString()}`);
        }
        else {
            (0, logger_1.errorLog)(`AI玩家 ${currentPlayer.name} (ID:${currentPlayer.id}) 打出失败: ${cardToDiscard.name}`);
            await (0, logger_1.saveGameLogToFile)(game, `ai出牌失败-${currentPlayer.name}`);
        }
    }
    else {
        (0, logger_1.errorLog)(`AI玩家 ${currentPlayer.name} (ID:${currentPlayer.id}) 无法选择要打出的牌`);
        await (0, logger_1.saveGameLogToFile)(game, `ai决策失败-${currentPlayer.name}`);
    }
}
