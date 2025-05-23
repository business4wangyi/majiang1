"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG_MODE = exports.AUTO_PLAY_MODE = void 0;
const game_1 = require("./game");
const gameLoop_1 = require("./gameLoop");
const display_1 = require("./display");
const input_1 = require("./input");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
const countdown_manager_1 = require("./countdown-manager");
const game_event_handler_1 = require("./game-event-handler");
// 自动打牌模式标志（导出以在其他模块中使用）
exports.AUTO_PLAY_MODE = false; // 默认关闭自动打牌模式
// 调试模式开关（导出以在其他模块中使用）
exports.DEBUG_MODE = false; // 默认关闭调试模式
/**
 * 启动游戏
 */
async function startGame() {
    try {
        // 清除控制台
        console.clear();
        // 提示用户选择模式
        display_manager_1.displayManager.printTitle(`欢迎来到麻将游戏！`);
        display_manager_1.displayManager.printColored(`是否启用自动打牌模式？在此模式下，4个AI玩家将自动对弈。`, display_1.Style.CYAN);
        display_manager_1.displayManager.printColored(`输入 'y' 启用自动模式，'n' 进入手动模式 [默认: y]`, display_1.Style.YELLOW);
        display_manager_1.displayManager.printColored(`1秒内无选择将自动启用自动模式`, display_1.Style.RED);
        // 直接使用简单的askQuestion，避免使用askConfirmation可能引入的复杂性
        const autoModeInput = await (0, input_1.askQuestion)("", 1000, "y");
        // 手动清理倒计时显示
        countdown_manager_1.CountdownManager.clearCountdownDisplay();
        // 解析用户选择
        exports.AUTO_PLAY_MODE = autoModeInput.toLowerCase() === 'y';
        // 显示用户选择的结果
        if (exports.AUTO_PLAY_MODE) {
            display_manager_1.displayManager.printSuccess(`已选择: 启用自动打牌模式，AI将自动对弈`);
        }
        else {
            display_manager_1.displayManager.printSuccess(`已选择: 关闭自动打牌模式，将由您亲自上场！`);
        }
        // 短暂延迟，确保显示正确
        await new Promise(resolve => setTimeout(resolve, 500));
        // 提示用户选择是否启用调试模式
        display_manager_1.displayManager.printColored(`是否启用调试模式？在此模式下，将显示更多日志详情。`, display_1.Style.CYAN);
        display_manager_1.displayManager.printColored(`输入 'd' 启用调试模式，其他键不启用 [默认: 启用]`, display_1.Style.YELLOW);
        display_manager_1.displayManager.printColored(`1秒内无选择将启用调试模式`, display_1.Style.RED);
        // 直接使用askQuestion
        const debugModeInput = await (0, input_1.askQuestion)("", 1000, "d");
        // 手动清理倒计时显示
        countdown_manager_1.CountdownManager.clearCountdownDisplay();
        // 解析用户选择
        exports.DEBUG_MODE = debugModeInput.toLowerCase() === 'd';
        // 显示用户选择的结果
        // 根据调试模式设置日志级别
        if (exports.DEBUG_MODE) {
            display_manager_1.displayManager.printSuccess(`已选择: 启用调试模式，将显示更多日志详情`);
            (0, logger_1.setLogLevel)(logger_1.LogLevel.INFO);
            display_manager_1.displayManager.printColored(`已启用调试模式，将记录详细日志信息`, display_1.Style.BOLD + display_1.Style.CYAN);
            input_1.InputState.setDebugMode(true);
        }
        else {
            display_manager_1.displayManager.printSuccess(`已选择: 不启用调试模式`);
            (0, logger_1.setLogLevel)(logger_1.LogLevel.NONE);
            input_1.InputState.setDebugMode(false);
        }
        // 确保清除任何可能存在的倒计时
        input_1.InputState.clearCountdown();
        // 短暂延迟，确保显示正确
        await new Promise(resolve => setTimeout(resolve, 500));
        // 初始化游戏
        const game = new game_1.Game();
        // 检查自动打牌模式
        if (exports.AUTO_PLAY_MODE) {
            // 自动模式下，禁用倒计时的调试输出
            input_1.InputState.setDebugMode(exports.DEBUG_MODE);
        }
        // 使用新的方法设置玩家
        game.setupPlayers(exports.AUTO_PLAY_MODE);
        // 创建游戏流程控制器
        const gameEventHandler = new game_event_handler_1.GameEventHandler(game, game.getTileManager(), game.getAllPlayers());
        // 启动游戏主循环
        await (0, gameLoop_1.gameLoop)(game);
    }
    catch (error) {
        (0, logger_1.errorLog)("游戏启动发生错误:", error instanceof Error ? error : new Error(String(error)));
        // 如果发生错误，退出程序
        process.exit(1);
    }
}
// 启动游戏
startGame();
