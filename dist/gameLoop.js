"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameLoop = gameLoop;
const game_1 = require("./game");
const player_1 = require("./player");
const logger_1 = require("./logger");
const input_1 = require("./input");
const index_1 = require("./index");
const display_manager_1 = require("./display-manager");
const countdown_manager_1 = require("./countdown-manager");
const game_event_handler_1 = require("./game-event-handler");
const tile_manager_1 = require("./tile-manager");
// 游戏循环检查间隔（毫秒）
const GAME_LOOP_INTERVAL = 100;
// 游戏循环检查标志
let isProcessingGameLoop = false;
// 游戏流程控制器
let gameEventHandler;
// 添加标志变量，用于跟踪玩家是否执行过操作
let hasPlayerActed = false;
/**
 * 游戏主循环 - 负责游戏的主循环逻辑和输入处理
 */
async function gameLoop(game) {
    (0, logger_1.infoLog)(`游戏主循环启动...`);
    display_manager_1.displayManager.printSuccess(`游戏主循环启动...`);
    // 初始化游戏流程控制器
    gameEventHandler = new game_event_handler_1.GameEventHandler(game, tile_manager_1.TileManager.getInstance(), game.getAllPlayers());
    // 确保玩家状态正确
    gameEventHandler.prepareGameStart();
    // 重置玩家行动标志
    hasPlayerActed = false;
    // 上一个玩家状态缓存，用于检测变化
    let previousPlayerState = player_1.PlayerState.WAITING;
    // 上一个游戏状态缓存，用于检测变化
    let previousGameState = game_1.GameState.INIT;
    // 初始化游戏循环计时器
    let gameLoopInterval = null;
    // 游戏循环主函数
    gameLoopInterval = setInterval(async () => {
        // 防止多个循环同时执行
        if (isProcessingGameLoop) {
            return;
        }
        // 标记为正在处理
        isProcessingGameLoop = true;
        try {
            // 检查游戏状态变化
            if (previousGameState !== game.state) {
                if (index_1.DEBUG_MODE) {
                    display_manager_1.displayManager.printWarning(`游戏状态变化: ${previousGameState} -> ${game.state}`);
                }
                previousGameState = game.state;
                // 如果状态变为ENDED，进行结算
                if (game.state === game_1.GameState.ENDED) {
                    await gameEventHandler.handleGameEnd();
                    isProcessingGameLoop = false;
                    return;
                }
            }
            // 仅在调试模式下打印游戏状态信息
            if (index_1.DEBUG_MODE) {
                (0, logger_1.debugLog)(`当前游戏状态: 玩家=${game.currentPlayerIndex}, 阶段=${game.state}`);
            }
            // 只有在玩家已经执行过操作后才检查游戏是否结束
            if (hasPlayerActed && gameEventHandler.checkGameEnd()) {
                // 设置游戏状态为结束
                game.setState(game_1.GameState.ENDED);
                // 等待下一个循环游戏状态变更处理
                return;
            }
            // 检查剩余牌数，可能需要结束游戏
            if (game.getRemainingTiles() <= 0) {
                // 牌山已空，结束游戏
                if (await game_event_handler_1.GameEventHandler.handleEmptyTileDeck(game)) {
                    // 如果用户选择继续游戏，则重置状态和游戏
                    input_1.InputState.isWaitingForUserInput = false;
                    // 重置游戏状态但不重新发牌
                    game.reset();
                    // 继续游戏流程
                    gameEventHandler.prepareGameStart();
                    // 重置玩家行动标志
                    hasPlayerActed = false;
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
                    // 检查是否可以进行特殊操作（胡、杠等）
                    await gameEventHandler.checkSpecialActions(currentPlayer);
                    // 执行玩家的回合操作
                    await gameEventHandler.handleCurrentPlayerAction();
                    // 标记玩家已经执行过操作
                    hasPlayerActed = true;
                    // 重置状态
                    input_1.InputState.isWaitingForUserInput = false;
                    // 下一回合
                    gameEventHandler.nextTurn();
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
