"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameLoop = gameLoop;
const player_1 = require("./player");
const display_1 = require("./display");
const logger_1 = require("./logger");
const input_1 = require("./input");
const index_1 = require("./index");
const display_manager_1 = require("./display-manager");
const countdown_manager_1 = require("./countdown-manager");
// 导入重构后的模块
const game_health_1 = require("./game-health");
const ai_decision_1 = require("./ai-decision");
const game_event_handler_1 = require("./game-event-handler");
// 游戏循环检查间隔（毫秒）
const GAME_LOOP_INTERVAL = 100;
// 游戏循环检查标志
let isProcessingGameLoop = false;
/**
 * 游戏主循环
 */
async function gameLoop(game) {
    (0, logger_1.infoLog)(`游戏主循环启动...`);
    display_manager_1.displayManager.printSuccess(`游戏主循环启动...`);
    if (index_1.AUTO_PLAY_MODE) {
        (0, logger_1.infoLog)(`自动打牌模式已启用，AI将自动进行对弈`);
        display_manager_1.displayManager.printWarning(`自动打牌模式已启用，AI将自动进行对弈`);
    }
    if (index_1.DEBUG_MODE) {
        display_manager_1.displayManager.printColored(`调试模式已启用，将显示更多日志信息`, display_1.Style.CYAN);
    }
    // 游戏启动时的初始化工作
    (0, game_event_handler_1.prepareGameStart)(game);
    // 上一个玩家状态缓存，用于检测变化
    let previousPlayerState = null;
    // 初始化游戏循环计时器
    let gameLoopInterval = null;
    // 用于检测游戏状态循环的历史记录
    const lastGameStates = [];
    // 游戏循环主函数
    gameLoopInterval = setInterval(async () => {
        // 防止多个循环同时执行
        if (isProcessingGameLoop) {
            return;
        }
        // 标记为正在处理
        isProcessingGameLoop = true;
        try {
            // 获取当前游戏状态
            const currentGameState = (0, game_health_1.generateGameStateHash)(game);
            // 仅在调试模式下打印游戏状态哈希
            if (index_1.DEBUG_MODE) {
                (0, logger_1.debugLog)(`当前游戏状态哈希: ${currentGameState}`);
            }
            // 检测游戏状态循环
            // const { isLoop, repeatedState } = detectStateLoop(lastGameStates, currentGameState, 20);
            // if (isLoop) {
            //   warnLog(`检测到游戏状态可能循环: ${repeatedState}`);
            //   displayManager.printWarning(`检测到游戏状态可能循环，尝试恢复...`);
            //   // 游戏状态循环通常是由于某些玩家手牌数量异常导致的
            //   // 检查并修复玩家手牌
            //   if (!await recoverGameState(game)) {
            //     await handleHealthCheckFailure(game, gameLoopInterval);
            //     isProcessingGameLoop = false;
            //     return;
            //   }
            // }
            // 如果是自动模式，检查剩余牌数，可能需要结束游戏
            if (index_1.AUTO_PLAY_MODE && game.remainingTiles <= 0) {
                // 牌山已空，结束游戏
                if (await (0, game_event_handler_1.handleEmptyTileDeck)(game)) {
                    // 如果用户选择继续游戏，则重置状态
                    input_1.InputState.isWaitingForUserInput = false;
                }
                else {
                    // 用户选择结束游戏
                    if (gameLoopInterval) {
                        clearInterval(gameLoopInterval);
                        gameLoopInterval = null;
                    }
                    isProcessingGameLoop = false;
                    return;
                }
            }
            // 如果当前正在等待用户输入，则跳过本次循环
            if (input_1.InputState.isWaitingForUserInput) {
                isProcessingGameLoop = false;
                return;
            }
            // 如果启用了自动打牌模式，检查是否有超出张数的玩家
            if (index_1.AUTO_PLAY_MODE) {
                const playersWithExcessTiles = game.getPlayersWithExcessTiles();
                if (playersWithExcessTiles.length > 0) {
                    // 有玩家已摸牌，需要出牌
                    for (const player of playersWithExcessTiles) {
                        if (player.id === game.currentPlayerIndex) {
                            (0, logger_1.infoLog)(`自动模式: 检测到当前玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
                            display_manager_1.displayManager.printWarning(`自动模式: 检测到当前玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
                            // 强制AI玩家出牌
                            game.forceAIPlayerDiscard();
                            break;
                        }
                    }
                }
            }
            // 获取当前玩家
            const currentPlayer = game.getCurrentPlayer();
            // 检查当前玩家状态变化
            if (previousPlayerState !== currentPlayer.state) {
                (0, logger_1.debugLog)(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
                if (index_1.DEBUG_MODE) {
                    display_manager_1.displayManager.printWarning(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
                }
                previousPlayerState = currentPlayer.state;
            }
            // 处理当前玩家的回合
            if (currentPlayer.state === player_1.PlayerState.ACTING) {
                // 如果未设置玩家为等待输入状态，需要处理当前玩家的操作
                if (!input_1.InputState.isWaitingForUserInput) {
                    // 设置为正在等待输入，防止多次处理
                    input_1.InputState.isWaitingForUserInput = true;
                    // 执行玩家的回合操作
                    await handleCurrentPlayerAction(game);
                }
            }
        }
        catch (error) {
            (0, logger_1.errorLog)(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
            display_manager_1.displayManager.printError(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}`);
            // 游戏循环出错，保存日志
            await (0, logger_1.saveGameLogToFile)(game, `游戏循环出错-${error}`);
            // 错误发生时，询问用户是否继续
            if (gameLoopInterval) {
                clearInterval(gameLoopInterval);
                gameLoopInterval = null;
            }
            const continueGame = await (0, input_1.askQuestion)("游戏发生错误，是否尝试继续？(y/n)");
            if (continueGame.toLowerCase() === 'y') {
                // 如果继续，重置一些状态并重新启动循环
                input_1.InputState.isWaitingForUserInput = false;
                countdown_manager_1.CountdownManager.clearCountdownDisplay();
                gameLoop(game);
            }
            else {
                // 退出程序
                process.exit(1);
            }
        }
        finally {
            // 标记为处理完毕
            isProcessingGameLoop = false;
        }
    }, GAME_LOOP_INTERVAL);
}
async function handleCurrentPlayerAction(game) {
    const currentPlayer = game.getCurrentPlayer();
    // 显示当前玩家的手牌，除非是自动对战模式
    if (!index_1.AUTO_PLAY_MODE || currentPlayer.type === player_1.PlayerType.HUMAN || index_1.DEBUG_MODE) {
        display_manager_1.displayManager.displayPlayerHand(currentPlayer);
    }
    // 标记正在等待用户输入
    input_1.InputState.isWaitingForUserInput = true;
    // 如果是AI玩家，则使用AI策略处理
    if (currentPlayer.type === player_1.PlayerType.AI) {
        try {
            // 在自动对战模式下或调试模式下，显示AI思考过程
            if (index_1.AUTO_PLAY_MODE || index_1.DEBUG_MODE) {
                (0, logger_1.infoLog)(`AI玩家 ${currentPlayer.name} 正在思考出牌..., 当前手牌数量: ${currentPlayer.handTiles.length}`);
                display_manager_1.displayManager.printWarning(`AI玩家 ${currentPlayer.name} 正在思考出牌...`);
                display_manager_1.displayManager.printWarning(`当前手牌数量: ${currentPlayer.handTiles.length}`);
                // 在调试模式下，显示更详细的手牌分析
                if (index_1.DEBUG_MODE) {
                    display_manager_1.displayManager.printWarning(`${display_1.Style.CYAN}当前手牌: ${currentPlayer.handTiles.map(t => t.toString()).join(' ')}${display_1.Style.RESET}`);
                    display_manager_1.displayManager.displayAIThinking(currentPlayer, "分析手牌结构");
                    display_manager_1.displayManager.displayHandAnalysis(currentPlayer);
                }
                else {
                    display_manager_1.displayManager.displayAIThinking(currentPlayer, "分析最佳出牌策略");
                }
            }
            // 为AI玩家的动作加入一点延迟，使游戏过程不会太快
            await (0, ai_decision_1.aiDecisionPause)();
            // 处理AI玩家出牌
            await (0, ai_decision_1.handleAIDiscard)(game, currentPlayer);
        }
        catch (error) {
            (0, logger_1.errorLog)(`AI玩家行动出错: ${error instanceof Error ? error.message : String(error)}`);
            display_manager_1.displayManager.printError(`AI玩家行动出错: ${error instanceof Error ? error.message : String(error)}`);
        }
        // 重置状态
        input_1.InputState.isWaitingForUserInput = false;
        // 确保游戏继续进行
        game.nextTurn();
    }
    else if (currentPlayer.type === player_1.PlayerType.HUMAN) {
        // 人类玩家
        display_manager_1.displayManager.printWarning(`${display_1.Style.CYAN}${display_1.Style.BOLD}轮到您出牌，请选择要打出的牌(输入序号1-${currentPlayer.handTiles.length})${display_1.Style.RESET}`);
        display_manager_1.displayManager.printWarning(`${display_1.Style.DIM}输入h查看手牌详情，输入q退出游戏${display_1.Style.RESET}\n`);
        // 获取玩家输入
        display_manager_1.displayManager.printWarning('请输入您要打出的牌的序号:');
        // 如果是自动对战模式，自动选择出牌
        if (index_1.AUTO_PLAY_MODE) {
            // 确保清除任何可能存在的倒计时
            input_1.InputState.clearCountdown();
            (0, logger_1.infoLog)(`自动模式下，自动为人类玩家选择出牌...`);
            display_manager_1.displayManager.printWarning(`自动模式下，自动为人类玩家选择出牌...`);
            // 设置等待状态，防止游戏循环继续处理
            input_1.InputState.isWaitingForUserInput = true;
            // 延迟1秒模拟思考
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                // 自动选择最后一张牌
                const tileIndex = currentPlayer.handTiles.length - 1;
                const discardedTile = game.currentPlayerDiscard(tileIndex);
                if (discardedTile) {
                    (0, logger_1.infoLog)(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
                    display_manager_1.displayManager.printSuccess(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
                    display_manager_1.displayManager.addToTurnLog(`${currentPlayer.name} 打出了 ${discardedTile.toString()}`);
                    game.nextTurn();
                }
            }
            catch (error) {
                (0, logger_1.errorLog)(`自动模式人类玩家出牌错误: ${error instanceof Error ? error.message : String(error)}`);
                display_manager_1.displayManager.printError(`自动模式人类玩家出牌错误: ${error instanceof Error ? error.message : String(error)}`);
                // 尝试保持游戏继续
                game.nextTurn();
            }
            finally {
                // 无论成功与否，都要重置等待状态
                input_1.InputState.isWaitingForUserInput = false;
            }
        }
        else {
            // 清除之前可能存在的倒计时
            input_1.InputState.clearCountdown();
            // 设置一个标志，如果倒计时结束则自动出牌
            let hasProcessedDiscard = false;
            // 启动倒计时
            input_1.InputState.startCountdown(10, // 10秒倒计时
            () => {
                // 如果已经处理过出牌，不再执行
                if (hasProcessedDiscard) {
                    (0, logger_1.infoLog)(`倒计时结束回调：已经处理过出牌，跳过处理`);
                    return;
                }
                // 标记为已经处理
                hasProcessedDiscard = true;
                // 直接执行自动出牌
                (0, logger_1.infoLog)(`倒计时结束，执行自动出牌`);
                display_manager_1.displayManager.printWarning(`倒计时结束，执行自动出牌`);
                try {
                    // 异步调用可能导致问题，所以直接使用同步方式处理
                    handleTimeoutAction(game, currentPlayer);
                }
                catch (timeoutError) {
                    (0, logger_1.errorLog)(`倒计时结束处理出错: ${timeoutError instanceof Error ? timeoutError.message : String(timeoutError)}`);
                    display_manager_1.displayManager.printError(`处理超时出牌时出错，尝试恢复...`);
                    // 确保重置等待状态
                    input_1.InputState.isWaitingForUserInput = false;
                    // 确保游戏继续
                    try {
                        game.nextTurn();
                    }
                    catch (nextTurnError) {
                        (0, logger_1.errorLog)(`进入下一回合出错: ${nextTurnError instanceof Error ? nextTurnError.message : String(nextTurnError)}`);
                    }
                }
            });
            try {
                // 获取用户输入
                const userInput = await (0, input_1.getNextDiscardIndex)(currentPlayer.handTiles.length);
                // 如果已经因为倒计时超时处理过出牌，直接返回
                if (hasProcessedDiscard) {
                    (0, logger_1.infoLog)(`已自动出牌，忽略当前输入`);
                    display_manager_1.displayManager.printWarning(`已自动出牌，忽略当前输入`);
                    return;
                }
                // 清除倒计时并标记为已处理
                input_1.InputState.clearCountdown();
                hasProcessedDiscard = true;
                // 处理特殊输入
                if (userInput === -2) {
                    // 查看手牌详情
                    display_manager_1.displayManager.printWarning(`${display_1.Style.BOLD}${display_1.Style.CYAN}=== 您的手牌详情 ===${display_1.Style.RESET}`);
                    display_manager_1.displayManager.displayHandAnalysis(currentPlayer);
                    display_manager_1.displayManager.printWarning(`请继续选择要打出的牌:`);
                    input_1.InputState.isWaitingForUserInput = false;
                    return handleCurrentPlayerAction(game); // 递归调用，让玩家重新选择
                }
                else if (userInput === -1) {
                    // 输入无效，让玩家重新选择
                    (0, logger_1.infoLog)(`输入无效，请重新选择`);
                    display_manager_1.displayManager.printError(`输入无效，请重新选择`);
                    input_1.InputState.isWaitingForUserInput = false;
                    return handleCurrentPlayerAction(game); // 递归调用，让玩家重新选择
                }
                // 执行出牌 - 注意：用户界面索引从1开始，但数组索引从0开始
                (0, logger_1.infoLog)(`玩家选择了索引 ${userInput + 1}`);
                display_manager_1.displayManager.printSuccess(`你选择了索引 ${userInput + 1}`);
                const discarded = game.currentPlayerDiscard(userInput);
                if (discarded) {
                    (0, logger_1.infoLog)(`成功打出: ${discarded.toString()}`);
                    display_manager_1.displayManager.printSuccess(`成功打出: ${discarded.toString()}`);
                    display_manager_1.displayManager.addToTurnLog(`${currentPlayer.name} 打出了 ${discarded.toString()}`);
                    // 人类玩家出牌后，进入下一个玩家的回合
                    game.nextTurn();
                    input_1.InputState.isWaitingForUserInput = false; // 确保状态重置
                }
                else {
                    (0, logger_1.warnLog)(`出牌失败，请重新选择`);
                    display_manager_1.displayManager.printError(`出牌失败，请重新选择`);
                    // 出牌失败，让玩家重新选择
                    input_1.InputState.isWaitingForUserInput = false;
                    return handleCurrentPlayerAction(game); // 递归调用，让玩家重新选择
                }
            }
            catch (error) {
                (0, logger_1.errorLog)(`处理玩家输入时出错: ${error instanceof Error ? error.message : String(error)}`);
                display_manager_1.displayManager.printError(`处理玩家输入时出错: ${error instanceof Error ? error.message : String(error)}`);
                // 确保清除倒计时
                input_1.InputState.clearCountdown();
                // 确保状态重置
                input_1.InputState.isWaitingForUserInput = false;
                // 自动出牌
                handleTimeoutAction(game, currentPlayer);
            }
            // 重置等待用户输入的状态
            input_1.InputState.isWaitingForUserInput = false;
        }
    }
}
/**
 * 处理倒计时结束后的自动出牌
 */
function handleTimeoutAction(game, player) {
    (0, logger_1.infoLog)(`时间到，自动选择出牌`);
    display_manager_1.displayManager.printWarning(`时间到，自动选择出牌`);
    try {
        // 确保InputState状态正确，防止gameLoop进入等待状态
        input_1.InputState.isWaitingForUserInput = false;
        // 找到最后一张牌的索引
        const lastIndex = player.handTiles.length - 1;
        // 确保玩家有手牌
        if (lastIndex < 0 || !player.handTiles[lastIndex]) {
            (0, logger_1.warnLog)(`玩家没有手牌可以出，强制进入下一回合`);
            display_manager_1.displayManager.printError(`玩家没有手牌可以出，强制进入下一回合`);
            game.nextTurn();
            return;
        }
        // 使用game的方法打出最后一张牌
        (0, logger_1.infoLog)(`自动打出最后一张牌: ${player.handTiles[lastIndex].toString()}`);
        display_manager_1.displayManager.printSuccess(`自动打出最后一张牌: ${player.handTiles[lastIndex].toString()}`);
        const discardedTile = game.currentPlayerDiscard(lastIndex);
        if (discardedTile) {
            (0, logger_1.infoLog)(`成功打出: ${discardedTile.toString()}`);
            display_manager_1.displayManager.printSuccess(`成功打出: ${discardedTile.toString()}`);
            display_manager_1.displayManager.addToTurnLog(`${player.name} 自动打出了 ${discardedTile.toString()}`);
            // 人类玩家出牌后，进入下一个玩家的回合
            (0, logger_1.infoLog)(`玩家 ${player.name} 出牌完成，进入下一个玩家的回合`);
            display_manager_1.displayManager.printSuccess(`玩家 ${player.name} 出牌完成，进入下一个玩家的回合`);
            game.nextTurn();
        }
        else {
            (0, logger_1.warnLog)(`自动出牌失败，强制进入下一回合`);
            display_manager_1.displayManager.printError(`自动出牌失败，强制进入下一回合`);
            game.nextTurn();
        }
        // 清除可能存在的倒计时显示
        countdown_manager_1.CountdownManager.clearCountdownDisplay();
    }
    catch (error) {
        (0, logger_1.errorLog)(`自动出牌出错: ${error instanceof Error ? error.message : String(error)}`);
        (0, logger_1.errorLog)(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈'}`);
        display_manager_1.displayManager.printError(`自动出牌出错: ${error instanceof Error ? error.message : String(error)}`);
        // 清除可能存在的倒计时显示
        countdown_manager_1.CountdownManager.clearCountdownDisplay();
        try {
            // 出错后的备用方案：直接使用player.discardTile方法
            if (player.handTiles.length > 0) {
                const lastIndex = player.handTiles.length - 1;
                const backupTile = player.discardTile(lastIndex);
                if (backupTile) {
                    (0, logger_1.infoLog)(`使用备用方法出牌: ${backupTile.toString()}`);
                    display_manager_1.displayManager.printWarning(`使用备用方法出牌: ${backupTile.toString()}`);
                    // 设置为最后打出的牌
                    game.setLastDiscardedTile(backupTile);
                }
            }
        }
        catch (backupError) {
            (0, logger_1.errorLog)(`备用出牌方法也失败: ${backupError instanceof Error ? backupError.message : String(backupError)}`);
        }
        // 确保游戏继续
        game.nextTurn();
    }
    finally {
        // 无论成功或失败，都确保重置等待状态，这是关键步骤
        input_1.InputState.isWaitingForUserInput = false;
        // 再次确保倒计时已清除
        input_1.InputState.clearCountdown();
    }
}
