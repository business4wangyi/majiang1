"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutoGameLoop = runAutoGameLoop;
exports.runInteractiveGameLoop = runInteractiveGameLoop;
const game_1 = require("./game");
const player_1 = require("./player");
const logger_1 = require("./logger");
const input_1 = require("./input");
const index_1 = require("./index");
const display_manager_1 = require("./display-manager");
const game_event_handler_1 = require("./game-event-handler");
const tile_manager_1 = require("./tile-manager");
const config_1 = require("./config/config");
// 游戏循环检查间隔（毫秒）
const GAME_LOOP_INTERVAL = 100;
// 游戏循环检查标志
let isProcessingGameLoop = false;
// 游戏流程控制器
let gameEventHandler;
// 添加标志变量，用于跟踪玩家是否执行过操作
let hasPlayerActed = false;
/**
 * 自动模式主循环：批量AI对弈
 */
async function runAutoGameLoop(game, rounds) {
    display_manager_1.displayManager.printSuccess(`自动模式主循环启动...`);
    const gameEventHandler = new game_event_handler_1.GameEventHandler(game, tile_manager_1.TileManager.getInstance());
    for (let i = 0; i < rounds; i++) {
        await gameEventHandler.safeStartGameAndEnd();
        // 只在不是最后一局时重置
        if (i < rounds - 1) {
            game.reset();
        }
    }
    // 统计与输出
    const players = game.getAllPlayers();
    // 只统计AI玩家
    const aiPlayers = players.filter(p => p.type === 1 || p.constructor.name === 'AIPlayer');
    let totalWinRate = 0;
    let totalAvgScore = 0;
    display_manager_1.displayManager.printTitle('【AI统计结果】');
    aiPlayers.forEach(ai => {
        const winRate = ai.totalGames > 0 ? ai.winCount / ai.totalGames : 0;
        const avgScore = ai.totalGames > 0 ? ai.score / ai.totalGames : 0;
        totalWinRate += winRate;
        totalAvgScore += avgScore;
        display_manager_1.displayManager.print(`AI玩家 ${ai.name}：胜率 ${(winRate * 100).toFixed(2)}%，平均得分 ${avgScore.toFixed(2)}，总局数 ${ai.totalGames}，流局数 ${ai.drawCount}，胜局数 ${ai.winCount}，总得分 ${ai.score}`);
    });
    if (aiPlayers.length > 0) {
        display_manager_1.displayManager.print('------------------------------');
        display_manager_1.displayManager.print(`所有AI平均胜率：${((totalWinRate / aiPlayers.length) * 100).toFixed(2)}%，所有AI平均得分：${(totalAvgScore / aiPlayers.length).toFixed(2)}`);
    }
}
/**
 * 人工交互模式主循环：定时器+输入检测
 */
async function runInteractiveGameLoop(game) {
    display_manager_1.displayManager.printSuccess(`人工交互模式主循环启动...`);
    // 以下为原有gameLoop主循环逻辑
    gameEventHandler = new game_event_handler_1.GameEventHandler(game, tile_manager_1.TileManager.getInstance());
    gameEventHandler.prepareGameStart();
    gameEventHandler.startGame();
    display_manager_1.displayManager.displayFullGameState(game);
    hasPlayerActed = false;
    let previousPlayerState = player_1.PlayerState.WAITING;
    let previousGameState = game_1.GameState.INIT;
    let gameLoopInterval = null;
    gameLoopInterval = setInterval(async () => {
        if (isProcessingGameLoop)
            return;
        isProcessingGameLoop = true;
        try {
            if (previousGameState !== game.state) {
                if (index_1.DEBUG_MODE)
                    display_manager_1.displayManager.print(`游戏状态变化: ${previousGameState} -> ${game.state}`);
                previousGameState = game.state;
                if (game.state === game_1.GameState.ENDED) {
                    const result = await gameEventHandler.handleGameEnd();
                    switch (result) {
                        case 0: // GameEndResult.RESTART_AUTO_GAME
                            if (typeof gameEventHandler !== 'undefined') {
                                if (index_1.AUTO_PLAY_MODE) {
                                    const rounds = config_1.AUTO_PLAY_ROUNDS || 0;
                                    const round = gameEventHandler.currentRound;
                                    console.log(`[DEBUG] 自动模式: 当前局号: ${round}, 总局数: ${rounds}`);
                                }
                            }
                            input_1.InputState.isWaitingForUserInput = false;
                            game.reset();
                            gameEventHandler.startGame();
                            display_manager_1.displayManager.displayFullGameState(game);
                            gameEventHandler.prepareGameStart();
                            hasPlayerActed = false;
                            break;
                        case 1: // GameEndResult.AUTO_PLAY_COMPLETED
                        case 2: // GameEndResult.USER_EXIT
                            if (gameLoopInterval) {
                                clearInterval(gameLoopInterval);
                                gameLoopInterval = null;
                            }
                            isProcessingGameLoop = false;
                            process.exit(0);
                            return;
                        case 3: // GameEndResult.NORMAL_END
                        default:
                            break;
                    }
                    isProcessingGameLoop = false;
                    return;
                }
            }
            if (index_1.DEBUG_MODE)
                (0, logger_1.debugLog)(`当前游戏状态: 玩家=${game.currentPlayerIndex}, 阶段=${game.state}`);
            if (hasPlayerActed && gameEventHandler.checkGameEnd()) {
                game.setState(game_1.GameState.ENDED);
                return;
            }
            if (game.getRemainingTiles() <= 0) {
                if (await game_event_handler_1.GameEventHandler.handleEmptyTileDeck(game)) {
                    input_1.InputState.isWaitingForUserInput = false;
                    game.reset();
                    gameEventHandler.startGame();
                    display_manager_1.displayManager.displayFullGameState(game);
                    gameEventHandler.prepareGameStart();
                    hasPlayerActed = false;
                }
                else {
                    if (gameLoopInterval) {
                        clearInterval(gameLoopInterval);
                        gameLoopInterval = null;
                    }
                    isProcessingGameLoop = false;
                    return;
                }
            }
            if (input_1.InputState.isWaitingForUserInput) {
                isProcessingGameLoop = false;
                return;
            }
            const currentPlayer = game.getCurrentPlayer();
            if (previousPlayerState !== currentPlayer.state) {
                if (index_1.DEBUG_MODE)
                    display_manager_1.displayManager.print(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
                previousPlayerState = currentPlayer.state;
            }
            if (currentPlayer.state === player_1.PlayerState.ACTING) {
                if (!input_1.InputState.isWaitingForUserInput) {
                    input_1.InputState.isWaitingForUserInput = true;
                    let noNeedsToDiscard = await gameEventHandler.checkSpecialActions(currentPlayer);
                    if (!noNeedsToDiscard)
                        await gameEventHandler.handleCurrentPlayerDiscard();
                    hasPlayerActed = true;
                    input_1.InputState.isWaitingForUserInput = false;
                    (0, logger_1.debugLog)('gameLoopInterval');
                    gameEventHandler.nextTurn();
                }
            }
        }
        catch (error) {
            (0, logger_1.errorLog)(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}\n${error instanceof Error ? error.stack : ''}`, error instanceof Error ? error : undefined);
            display_manager_1.displayManager.printError(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}\n${error instanceof Error ? error.stack : ''}`);
            await (0, logger_1.saveGameLogToFile)(game, `game loop error-${error}`);
            if (error instanceof Error && error.message === 'TILE_DECK_EMPTY') {
                await gameEventHandler.handleGameEnd();
                if (gameLoopInterval) {
                    clearInterval(gameLoopInterval);
                    gameLoopInterval = null;
                }
                return;
            }
            if (gameLoopInterval) {
                clearInterval(gameLoopInterval);
                gameLoopInterval = null;
            }
            process.exit(1);
        }
        finally {
            isProcessingGameLoop = false;
        }
    }, GAME_LOOP_INTERVAL);
}
