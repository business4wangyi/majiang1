"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG_MODE = exports.AUTO_PLAY_MODE = void 0;
const game_1 = require("./game");
const ai_player_1 = require("./ai-player");
const human_player_1 = require("./human-player");
const gameLoop_1 = require("./gameLoop");
const display_1 = require("./display");
const readline = __importStar(require("readline"));
const input_1 = require("./input");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
// 自动打牌模式标志（导出以在其他模块中使用）
exports.AUTO_PLAY_MODE = false; // 默认关闭自动打牌模式
// 调试模式开关（导出以在其他模块中使用）
exports.DEBUG_MODE = false; // 默认关闭调试模式
/**
 * 提示用户选择是否启用自动打牌模式
 * 5秒内无选择则自动启用人工模式
 */
async function promptAutoPlayMode() {
    return new Promise((resolve) => {
        display_manager_1.displayManager.printTitle(`欢迎来到麻将游戏！`);
        display_manager_1.displayManager.printColored(`是否启用自动打牌模式？在此模式下，4个AI玩家将自动对弈。`, display_1.Style.CYAN);
        display_manager_1.displayManager.printColored(`输入 'y' 启用自动模式，'n' 进入手动模式 [默认: n]`, display_1.Style.YELLOW);
        display_manager_1.displayManager.printColored(`5秒内无选择将自动启用人工模式`, display_1.Style.RED);
        // 使用InputState启动倒计时
        input_1.InputState.startCountdown(5, // 5秒倒计时
        () => {
            // 倒计时结束回调
            process.stdout.write('\n');
            display_manager_1.displayManager.printSuccess(`已自动选择: 启用人工模式`);
            resolve(false); // 默认启用人工模式
        });
        // 创建readline接口监听用户输入
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('', (answer) => {
            // 清除倒计时
            input_1.InputState.clearCountdown();
            rl.close();
            if (answer.toLowerCase() === 'y') {
                display_manager_1.displayManager.printSuccess(`已选择: 启用自动打牌模式，AI将自动对弈`);
                resolve(true);
            }
            else {
                display_manager_1.displayManager.printSuccess(`已选择: 关闭自动打牌模式，将由您亲自上场！`);
                resolve(false);
            }
        });
    });
}
/**
 * 提示用户选择是否启用调试模式
 */
async function promptDebugMode() {
    return new Promise((resolve) => {
        display_manager_1.displayManager.printColored(`是否启用调试模式？在此模式下，将显示更多日志详情。`, display_1.Style.CYAN);
        display_manager_1.displayManager.printColored(`输入 'd' 启用调试模式，其他键不启用 [默认: 不启用]`, display_1.Style.YELLOW);
        display_manager_1.displayManager.printColored(`5秒内无选择将不启用调试模式`, display_1.Style.RED);
        // 使用InputState启动倒计时
        input_1.InputState.startCountdown(5, // 5秒倒计时
        () => {
            // 倒计时结束回调
            process.stdout.write('\n');
            display_manager_1.displayManager.printSuccess(`已自动选择: 不启用调试模式`);
            resolve(false); // 默认不启用调试模式
        });
        // 创建readline接口监听用户输入
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('', (answer) => {
            // 清除倒计时
            input_1.InputState.clearCountdown();
            rl.close();
            if (answer.toLowerCase() === 'd') {
                display_manager_1.displayManager.printSuccess(`已选择: 启用调试模式，将显示更多日志详情`);
                resolve(true);
            }
            else {
                display_manager_1.displayManager.printSuccess(`已选择: 不启用调试模式`);
                resolve(false);
            }
        });
    });
}
/**
 * 启动游戏
 */
async function startGame() {
    try {
        // 提示用户选择模式
        exports.AUTO_PLAY_MODE = await promptAutoPlayMode();
        // 提示用户选择是否启用调试模式
        exports.DEBUG_MODE = await promptDebugMode();
        // 根据调试模式设置日志级别
        if (exports.DEBUG_MODE) {
            (0, logger_1.setLogLevel)(logger_1.LogLevel.DEBUG);
            display_manager_1.displayManager.printColored(`已启用调试模式，将记录详细日志信息`, display_1.Style.BOLD + display_1.Style.CYAN);
            input_1.InputState.setDebugMode(true);
        }
        else {
            (0, logger_1.setLogLevel)(logger_1.LogLevel.INFO);
            input_1.InputState.setDebugMode(false);
        }
        // 初始化游戏
        const game = new game_1.Game();
        // 检查自动打牌模式
        if (exports.AUTO_PLAY_MODE) {
            // 自动模式下，禁用倒计时的调试输出
            input_1.InputState.setDebugMode(exports.DEBUG_MODE);
            // 确保清除任何可能存在的倒计时
            input_1.InputState.clearCountdown();
            // 自动模式：4个AI玩家
            display_manager_1.displayManager.printTitle(`初始化游戏：4个AI玩家对弈`);
            // 添加1个AI玩家
            game.addPlayer(new ai_player_1.AIPlayer('东家(AI)'));
        }
        else {
            // 手动模式：1个人类玩家 + 3个AI玩家
            display_manager_1.displayManager.printTitle(`初始化游戏：1个人类玩家 + 3个AI玩家`);
            // 添加1个人类玩家
            game.addPlayer(new human_player_1.HumanPlayer('东家(玩家)'));
        }
        // 添加3个AI玩家
        game.addPlayer(new ai_player_1.AIPlayer('南家(AI)'));
        game.addPlayer(new ai_player_1.AIPlayer('西家(AI)'));
        game.addPlayer(new ai_player_1.AIPlayer('北家(AI)'));
        // 开始游戏
        game.startGame();
        // 显示初始游戏状态
        display_manager_1.displayManager.displayFullGameState(game);
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
