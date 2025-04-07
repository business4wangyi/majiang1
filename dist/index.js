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
exports.debugLog = debugLog;
const readline = __importStar(require("readline-sync"));
const nodeReadline = __importStar(require("readline"));
const game_1 = require("./game");
const player_1 = require("./player");
const rules_1 = require("./rules");
const tile_1 = require("./tile");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 颜色和样式常量
const Style = {
    // 重置所有样式
    RESET: "\x1b[0m",
    // 文本颜色
    BLACK: "\x1b[30m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
    CYAN: "\x1b[36m",
    WHITE: "\x1b[37m",
    // 背景颜色
    BG_BLACK: "\x1b[40m",
    BG_RED: "\x1b[41m",
    BG_GREEN: "\x1b[42m",
    BG_YELLOW: "\x1b[43m",
    BG_BLUE: "\x1b[44m",
    BG_MAGENTA: "\x1b[45m",
    BG_CYAN: "\x1b[46m",
    BG_WHITE: "\x1b[47m",
    // 文本样式
    BOLD: "\x1b[1m",
    DIM: "\x1b[2m",
    ITALIC: "\x1b[3m",
    UNDERLINE: "\x1b[4m",
    BLINK: "\x1b[5m",
    REVERSE: "\x1b[7m",
    HIDDEN: "\x1b[8m",
};
// 调试模式相关常量
const DEBUG_MODE = process.argv.includes('--debug');
const STEP_BY_STEP = process.argv.includes('--step');
const MAX_DEBUG_STEPS = 10; // 默认步数限制
let currentDebugStep = 0; // 当前调试步数
let debugStepMode = false; // 是否启用单步调试模式
// 特殊牌型测试模式标志
const CHECK_SEVEN_PAIRS = process.argv.includes('--check-seven-pairs');
const CHECK_THIRTEEN_ORPHANS = process.argv.includes('--check-thirteen-orphans');
const CHECK_QING_YI_SE = process.argv.includes('--check-qing-yi-se');
const CHECK_PENG_PENG_HU = process.argv.includes('--check-peng-peng-hu');
const CHECK_STANDARD_HU = process.argv.includes('--check-standard-hu');
// 添加命令行参数处理
const CHECK_BIG_FOUR_WINDS = process.argv.includes('--check-big-four-winds');
const CHECK_BIG_THREE_DRAGONS = process.argv.includes('--check-big-three-dragons');
const CHECK_SMALL_FOUR_WINDS = process.argv.includes('--check-small-four-winds');
const CHECK_SMALL_THREE_DRAGONS = process.argv.includes('--check-small-three-dragons');
const CHECK_ALL_HONORS = process.argv.includes('--check-all-honors');
// 调试日志函数
function debugLog(message) {
    if (DEBUG_MODE) {
        console.log(`${Style.CYAN}[DEBUG]:${Style.RESET} ${message}`);
    }
}
// 操作图标
const ActionIcons = {
    DRAW: "🎴", // 摸牌
    DISCARD: "👉", // 打牌
    CHI: "🍴", // 吃
    PENG: "👊", // 碰
    GANG: "🔄", // 杠
    HU: "🎉", // 胡
    PASS: "⏭️", // 过
    START_TURN: "🔄", // 回合开始
    THINKING: "🤔", // 思考中
};
// 全局变量区域
// 用于记录当前回合的操作日志
let currentTurnLog = [];
let currentDrawPlayerIndex = -1;
// 测试模式相关配置
const isTestMode = process.argv.includes('--test');
const testModeDelay = 100; // 测试模式下的延迟（毫秒）
const maxTestTurns = 100; // 测试模式下的最大回合数
// 记录已经过了多少次循环没有状态变化，用于检测死锁
let noActionCounter = 0;
// 记录上一次游戏状态的快照，用于比较游戏是否进行
let lastGameState = "";
// 暂时默认测试模式开启
// isTestMode = true;
// 全局变量，记录已处理的特殊操作（吃碰杠胡）
const processedActionKeys = new Set();
// 设置全局未捕获异常处理
process.on('uncaughtException', (error) => {
    console.error('\n===== 未捕获的异常 =====');
    console.error(`错误: ${error.message}`);
    console.error(error.stack);
    try {
        // 尝试获取当前正在运行的游戏实例（如果有）
        // 这需要游戏实例是全局可访问的
        if (typeof globalGame !== 'undefined') {
            saveGameLogToFile(globalGame, `未捕获异常: ${error.message}`);
        }
        else {
            // 如果没有可用的游戏实例，至少记录错误信息
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const logFile = path.join(logDir, `error-${timestamp}.log`);
            fs.writeFileSync(logFile, [
                "=== 麻将游戏错误日志 ===",
                `时间: ${new Date().toLocaleString()}`,
                `错误: 未捕获异常 - ${error.message}`,
                `堆栈: ${error.stack}`
            ].join('\n'));
            console.error(`错误日志已保存至: ${logFile}`);
        }
    }
    catch (logError) {
        console.error(`记录错误日志时出错: ${logError}`);
    }
    console.log("\n程序将在3秒后退出...");
    setTimeout(() => {
        process.exit(1);
    }, 3000);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n===== 未处理的Promise拒绝 =====');
    console.error('Promise:', promise);
    console.error('原因:', reason);
    try {
        // 与上面类似，尝试记录错误
        if (typeof globalGame !== 'undefined') {
            saveGameLogToFile(globalGame, `未处理的Promise拒绝: ${reason}`);
        }
        else {
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const logFile = path.join(logDir, `rejection-${timestamp}.log`);
            fs.writeFileSync(logFile, [
                "=== 麻将游戏错误日志 ===",
                `时间: ${new Date().toLocaleString()}`,
                `错误: 未处理的Promise拒绝`,
                `原因: ${reason}`,
                `Promise: ${promise}`
            ].join('\n'));
            console.error(`错误日志已保存至: ${logFile}`);
        }
    }
    catch (logError) {
        console.error(`记录错误日志时出错: ${logError}`);
    }
});
// 添加SIGINT处理
// 处理用户按下Ctrl+C的情况
process.on('SIGINT', () => {
    console.log('\n\n===== 用户中断游戏 =====');
    // 如果游戏正在运行，保存日志
    if (typeof globalGame !== 'undefined') {
        console.log('正在保存游戏状态...');
        saveGameLogToFile(globalGame, "用户主动中断游戏");
        // 显示游戏最终状态
        displayGameState(globalGame);
        // 如果游戏有得分，显示得分
        if (globalGame.players.some(p => p.score > 0)) {
            console.log("\n=== 游戏得分 ===");
            const sortedPlayers = [...globalGame.players].sort((a, b) => b.score - a.score);
            sortedPlayers.forEach((player, index) => {
                console.log(`${index + 1}. ${player.name}: ${player.score}分`);
            });
        }
    }
    console.log("感谢您的游玩，再见！");
    process.exit(0);
});
// 声明一个全局变量来存储当前游戏实例，以便错误处理能访问
let globalGame;
// 清屏函数
function clearScreen() {
    console.clear();
    if (isTestMode) {
        console.log(`${Style.BOLD}${Style.YELLOW}==== 广东麻将命令行游戏 [测试模式] ====${Style.RESET}\n`);
    }
    else {
        console.log(`${Style.BOLD}${Style.GREEN}==== 广东麻将命令行游戏 ====${Style.RESET}\n`);
    }
}
// 显示回合操作日志
function displayTurnLog() {
    if (currentTurnLog.length > 0) {
        console.log(`\n${Style.BOLD}${Style.CYAN}========== 当前回合操作 ==========${Style.RESET}`);
        for (const logItem of currentTurnLog) {
            console.log(logItem);
        }
        console.log(`${Style.BOLD}${Style.CYAN}==================================${Style.RESET}\n`);
    }
}
// 根据操作类型为日志添加样式和图标
function formatLogMessage(message) {
    if (message.includes('摸到了牌')) {
        return `${ActionIcons.DRAW} ${Style.CYAN}${message}${Style.RESET}`;
    }
    else if (message.includes('打出了')) {
        return `${ActionIcons.DISCARD} ${Style.YELLOW}${message}${Style.RESET}`;
    }
    else if (message.includes('吃了')) {
        return `${ActionIcons.CHI} ${Style.GREEN}${message}${Style.RESET}`;
    }
    else if (message.includes('碰了')) {
        return `${ActionIcons.PENG} ${Style.BLUE}${message}${Style.RESET}`;
    }
    else if (message.includes('杠了')) {
        return `${ActionIcons.GANG} ${Style.MAGENTA}${message}${Style.RESET}`;
    }
    else if (message.includes('胡了')) {
        return `${ActionIcons.HU} ${Style.BOLD}${Style.BG_RED}${Style.WHITE}${message}${Style.RESET}`;
    }
    else if (message.includes('选择过')) {
        return `${ActionIcons.PASS} ${Style.DIM}${message}${Style.RESET}`;
    }
    else if (message.includes('的回合开始')) {
        return `${ActionIcons.START_TURN} ${Style.BOLD}${Style.WHITE}${message}${Style.RESET}`;
    }
    else if (message.includes('思考')) {
        return `${ActionIcons.THINKING} ${Style.DIM}${Style.ITALIC}${message}${Style.RESET}`;
    }
    return `• ${message}`;
}
// 添加操作到当前回合日志
function addToTurnLog(message) {
    // 检查消息是否为空
    if (!message || message.trim() === '')
        return;
    // 格式化消息
    const formattedMessage = formatLogMessage(message);
    // 检查是否已经有完全相同的日志
    if (currentTurnLog.some(log => log === formattedMessage)) {
        // 如果已经存在相同的消息，跳过
        return;
    }
    // 检查是否有类似的消息（只比较文本内容，忽略样式）
    const plainMessage = message.replace(/\s+/g, ' ').trim();
    const similarExists = currentTurnLog.some(log => {
        // 移除样式代码后比较
        const plainLog = log.replace(/\x1b\[\d+(;\d+)*m/g, '').replace(/\s+/g, ' ').trim();
        return plainLog.includes(plainMessage);
    });
    if (similarExists) {
        // 如果有类似的消息，跳过
        return;
    }
    // 添加到日志
    currentTurnLog.push(formattedMessage);
}
// 显示AI操作信息
function displayAIAction(player, action) {
    console.log(`\n${Style.BOLD}${Style.BLUE}------------- AI操作信息 -------------${Style.RESET}`);
    console.log(`${Style.CYAN}${player.name}${Style.RESET}: ${action}`);
    console.log(`${Style.BOLD}${Style.BLUE}---------------------------------------${Style.RESET}\n`);
}
// 显示AI思考过程
function displayAIThinking(player, handDescription) {
    // 只在测试模式且有手牌描述时显示
    if (isTestMode && handDescription) {
        addToTurnLog(`${player.name} 思考中...`);
        // 将思考过程添加到日志，但使用不同的样式
        console.log(`\n${Style.DIM}${Style.ITALIC}${ActionIcons.THINKING} AI思考过程: ${player.name}${Style.RESET}`);
        console.log(`${Style.DIM}${Style.ITALIC}当前手牌状态: ${handDescription}${Style.RESET}`);
    }
}
// 显示重要事件通知
function displayImportantEvent(message) {
    console.log(`\n${Style.BOLD}${Style.BG_RED}${Style.WHITE}!!! ${message} !!!${Style.RESET}\n`);
    // 添加一个短暂的停顿，让玩家注意到这个重要事件
    sleep(isTestMode ? 100 : 1000);
}
// 设置自动打牌索引，确保按顺序打出手牌
function getNextAutoDiscardIndex(handTilesLength) {
    // 如果是第一次打牌，从第1张开始（索引0）
    if (currentDrawPlayerIndex >= handTilesLength) {
        currentDrawPlayerIndex = 0;
    }
    // 返回当前索引，并增加索引，为下次做准备
    const currentIndex = currentDrawPlayerIndex;
    currentDrawPlayerIndex++;
    return currentIndex;
}
// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 获取玩家选择的吃牌组合
async function getPlayerChiChoice(combinations) {
    try {
        // 测试模式下，自动选择第一个组合
        if (isTestMode) {
            if (combinations.length === 0) {
                console.log(`\n测试模式：没有可用的吃牌组合，自动放弃`);
                await sleep(50);
                return -1;
            }
            console.log(`\n测试模式：自动选择第一个吃牌组合: ${combinations[0].map(t => t.toString()).join(', ')}`);
            await sleep(50);
            return 0;
        }
        // 如果只有一种组合，直接返回
        if (combinations.length === 1) {
            console.log(`\n只有一种组合，自动选择: ${combinations[0].map(t => t.toString()).join(', ')}`);
            await sleep(1000);
            return 0;
        }
        // 如果没有组合，返回-1
        if (combinations.length === 0) {
            console.log(`\n没有可用的吃牌组合，自动放弃`);
            await sleep(1000);
            return -1;
        }
        console.log('\n请选择吃牌组合:');
        combinations.forEach((combo, index) => {
            console.log(`${index + 1}: ${combo.map(t => t.toString()).join(', ')}`);
        });
        // 提示玩家有5秒钟做出选择
        console.log('\n您有5秒钟时间做出选择，否则将自动放弃吃牌...');
        // 创建Promise表示用户输入或超时
        return new Promise((resolve) => {
            // 设置超时
            const timeoutId = setTimeout(() => {
                console.log('\n时间到，自动放弃吃牌');
                resolve(-1); // 放弃吃牌
            }, 5000);
            try {
                // 使用cancel选项禁用默认的[0] CANCEL
                const choice = readline.questionInt(`\n请选择组合 (1-${combinations.length}), 或输入0放弃吃牌: `);
                clearTimeout(timeoutId);
                if (choice === 0) {
                    console.log('您选择了放弃吃牌');
                    resolve(-1);
                    return;
                }
                if (choice < 1 || choice > combinations.length) {
                    console.log('无效选择，自动放弃吃牌');
                    resolve(-1);
                    return;
                }
                console.log(`您选择了组合: ${combinations[choice - 1].map(t => t.toString()).join(', ')}`);
                resolve(choice - 1);
            }
            catch (e) {
                clearTimeout(timeoutId);
                console.log('输入错误，自动放弃吃牌');
                console.error('选择吃牌组合时出错：', e);
                resolve(-1); // 出错时放弃吃牌
            }
        });
    }
    catch (error) {
        console.error('获取吃牌选择过程中出错：', error);
        return -1; // 出错时放弃吃牌
    }
}
// 游戏主循环
async function gameLoop(game) {
    // 设置循环计数器和状态跟踪
    let turnCounter = 0;
    let stuckCounter = 0;
    let forcedInterventionCounter = 0;
    let lastStateHash = "";
    const MAX_STUCK_TURNS = 3; // 连续相同状态的最大容忍次数
    debugLog(`游戏循环初始化，开始执行`);
    // 在游戏开始时检查是否有AI玩家手牌超过13张
    for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        if (player.type === player_1.PlayerType.AI && player.handTiles.length > 13) {
            debugLog(`游戏开始时发现AI玩家${player.name}手牌数量异常(${player.handTiles.length})`);
            debugLog(`对AI玩家${player.name}执行强制出牌干预`);
            const lastTile = player.handTiles.pop();
            if (lastTile) {
                player.discardedTiles.push(lastTile);
                game.lastDiscardedTile = lastTile;
                debugLog(`已强制移除${player.name}的最后一张牌: ${lastTile.toString()}`);
            }
        }
    }
    // 继续循环直到游戏结束
    while (game.state !== game_1.GameState.ENDED) {
        turnCounter++;
        // 在调试步骤模式下限制执行次数
        if (STEP_BY_STEP && currentDebugStep >= MAX_DEBUG_STEPS) {
            debugLog(`已达到最大调试步数(${MAX_DEBUG_STEPS})，暂停执行`);
            break;
        }
        if (DEBUG_MODE) {
            currentDebugStep++;
            debugLog(`当前执行第${currentDebugStep}步，轮次计数器=${turnCounter}`);
        }
        try {
            // 生成当前状态的哈希，用于检测是否陷入循环
            const currentStateHash = generateGameStateHash(game);
            // 检查游戏是否卡住
            if (currentStateHash === lastStateHash) {
                stuckCounter++;
                if (stuckCounter >= MAX_STUCK_TURNS) {
                    debugLog(`警告: 游戏可能已卡住，连续${stuckCounter}个回合状态未变化`);
                    debugLog(`状态哈希: ${currentStateHash}`);
                    debugLog(`执行强制干预措施...`);
                    // 对当前玩家执行干预
                    const currentPlayer = game.players[game.currentPlayerIndex];
                    debugLog(`当前玩家: ${currentPlayer.name}, 类型: ${player_1.PlayerType[currentPlayer.type]}, 状态: ${player_1.PlayerState[currentPlayer.state]}`);
                    if (currentPlayer.type === player_1.PlayerType.AI) {
                        debugLog(`处理AI玩家${currentPlayer.name}卡住的情况`);
                        // 强制设置游戏状态为PLAYING
                        if (game.state !== game_1.GameState.PLAYING) {
                            debugLog(`强制修正游戏状态: ${game_1.GameState[game.state]} -> PLAYING`);
                            game.state = game_1.GameState.PLAYING;
                        }
                        // 强制设置玩家状态为ACTING
                        if (currentPlayer.state !== player_1.PlayerState.ACTING) {
                            debugLog(`强制修正玩家状态: ${player_1.PlayerState[currentPlayer.state]} -> ACTING`);
                            currentPlayer.state = player_1.PlayerState.ACTING;
                        }
                        if (currentPlayer.handTiles.length > 13) {
                            debugLog(`处理AI手牌超出情况，调用handleAIDiscard`);
                            // 调用handleAIDiscard处理AI出牌
                            await handleAIDiscard(game, currentPlayer);
                        }
                        else {
                            debugLog(`AI手牌数量正常，强制进入下一回合`);
                            game.nextTurn();
                        }
                        stuckCounter = 0; // 重置卡住计数器
                        forcedInterventionCounter++;
                    }
                    else if (currentPlayer.type === player_1.PlayerType.HUMAN) {
                        debugLog(`当前是人类玩家回合，等待人类玩家操作`);
                        if (currentPlayer.handTiles.length > 13) {
                            debugLog(`提醒人类玩家出牌`);
                            displayImportantEvent(`请出牌，您当前有${currentPlayer.handTiles.length}张牌，需要打出一张`);
                        }
                    }
                }
            }
            else {
                // 状态已改变，重置计数器
                stuckCounter = 0;
                lastStateHash = currentStateHash;
            }
            // 处理游戏中的各种状态
            if (game.state === game_1.GameState.PLAYING) {
                const currentPlayer = game.players[game.currentPlayerIndex];
                // 检测AI玩家是否有超过13张手牌但不处于行动状态
                if (currentPlayer.type === player_1.PlayerType.AI &&
                    currentPlayer.handTiles.length > 13 &&
                    currentPlayer.state !== player_1.PlayerState.ACTING) {
                    debugLog(`发现AI玩家${currentPlayer.name}手牌数量(${currentPlayer.handTiles.length})>13但状态不正确`);
                    debugLog(`强制设置AI玩家状态为ACTING`);
                    currentPlayer.state = player_1.PlayerState.ACTING;
                }
                // 如果当前玩家是AI且手牌超过13张，处理其出牌
                if (currentPlayer.type === player_1.PlayerType.AI &&
                    currentPlayer.handTiles.length > 13 &&
                    currentPlayer.state === player_1.PlayerState.ACTING) {
                    debugLog(`当前是AI玩家${currentPlayer.name}回合，手牌数量${currentPlayer.handTiles.length}>13，处理出牌`);
                    await handleAIDiscard(game, currentPlayer);
                }
            }
            else if (game.state === game_1.GameState.WAITING_ACTION) {
                // 如果等待动作但没有pendingAction或等待玩家，则强制设置为PLAYING并进入下一回合
                if (!game.pendingAction || !game.pendingAction.waitingPlayers || game.pendingAction.waitingPlayers.length === 0) {
                    debugLog(`游戏状态为WAITING_ACTION，但没有待处理的动作或等待的玩家，强制恢复`);
                    game.state = game_1.GameState.PLAYING;
                    game.nextTurn();
                }
            }
            // 控制显示游戏状态的频率，避免刷屏
            if (turnCounter % 5 === 0 || stuckCounter > 0) {
                displayGameState(game);
            }
            // 在调试模式下适当暂停
            if (DEBUG_MODE) {
                await sleep(100); // 稍微暂停以便查看日志
            }
        }
        catch (error) {
            debugLog(`游戏循环异常: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`游戏循环发生错误：${error instanceof Error ? error.message : String(error)}`);
            // 尝试恢复游戏状态
            try {
                game.state = game_1.GameState.PLAYING;
                game.nextTurn();
                debugLog(`已尝试恢复游戏状态并进入下一回合`);
            }
            catch (recoveryError) {
                debugLog(`恢复失败: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
            }
        }
    }
    debugLog(`游戏循环结束: 状态=${game_1.GameState[game.state]}, 总轮次=${turnCounter}, 干预次数=${forcedInterventionCounter}`);
}
// 生成游戏状态哈希，用于检测循环
function generateGameStateHash(game) {
    const { currentPlayerIndex, state } = game;
    // 基本状态信息
    let stateStr = `player=${currentPlayerIndex},state=${state},`;
    // 捕获当前玩家的手牌大小和状态
    const currentPlayer = game.players[currentPlayerIndex];
    stateStr += `handSize=${currentPlayer.handTiles.length},playerState=${currentPlayer.state},`;
    // 捕获弃牌堆大小和剩余牌数
    stateStr += `discardedCount=${currentPlayer.discardedTiles.length},remainingTiles=${game.remainingTiles},`;
    // 使用手牌的简单哈希
    const handHash = currentPlayer.handTiles.map(t => `${t.type}${t.value}`).join('');
    const discardedHash = currentPlayer.discardedTiles.map(t => `${t.type}${t.value}`).join('');
    return `${stateStr}turn=${game.drawCount},handHash=${handHash},discardedHash=${discardedHash}`;
}
// 分析AI手牌中的可能组合
function analyzeAIHand(player) {
    const result = [];
    // 按牌型和点数对手牌进行分组
    const groupedTiles = groupTilesByTypeAndValue(player.handTiles);
    // 检查对子
    let pairCount = 0;
    for (const [key, tiles] of groupedTiles) {
        if (tiles.length === 2) {
            result.push(`${Style.CYAN}对子[${tiles[0].toString()}]${Style.RESET}`);
            pairCount++;
        }
        // 检查刻子
        else if (tiles.length === 3) {
            result.push(`${Style.MAGENTA}刻子[${tiles[0].toString()}]${Style.RESET}`);
        }
        // 检查暗杠（手牌中的4张相同牌）
        else if (tiles.length === 4) {
            result.push(`${Style.RED}暗杠[${tiles[0].toString()}]${Style.RESET}`);
        }
    }
    // 检查可能的顺子 (只检查数字牌)
    let sequenceCount = 0;
    let partialSequenceCount = 0;
    for (const type of [tile_1.TileType.WAN, tile_1.TileType.TIAO, tile_1.TileType.TONG]) {
        // 获取该类型的所有牌
        const typeTiles = player.handTiles.filter(t => t.type === type);
        // 按值排序
        const sortedValues = typeTiles.map(t => t.value).sort((a, b) => a - b);
        // 检查连续的值
        for (let startValue = 1; startValue <= 7; startValue++) {
            const hasStartValue = typeTiles.some(t => t.value === startValue);
            const hasMiddleValue = typeTiles.some(t => t.value === startValue + 1);
            const hasEndValue = typeTiles.some(t => t.value === startValue + 2);
            if (hasStartValue && hasMiddleValue && hasEndValue) {
                result.push(`${Style.GREEN}顺子[${startValue}-${startValue + 2}${type}]${Style.RESET}`);
                sequenceCount++;
            }
            // 如果只有部分顺子，也显示
            else if ((hasStartValue && hasMiddleValue) ||
                (hasMiddleValue && hasEndValue) ||
                (hasStartValue && hasEndValue)) {
                result.push(`${Style.DIM}${Style.GREEN}部分顺子[${type}:${(hasStartValue ? startValue : '') +
                    (hasMiddleValue ? (hasStartValue ? ',' : '') + (startValue + 1) : '') +
                    (hasEndValue ? (hasStartValue || hasMiddleValue ? ',' : '') + (startValue + 2) : '')}]${Style.RESET}`);
                partialSequenceCount++;
            }
        }
    }
    // 检查听牌状态
    const tingCheckResult = rules_1.RuleEngine.canTing(player);
    if (tingCheckResult.canTing) {
        const tingTilesStr = tingCheckResult.tingTiles.map(t => t.toString()).join(', ');
        result.push(`${Style.BOLD}${Style.BG_YELLOW}${Style.BLACK} 听牌[${tingTilesStr}] ${Style.RESET}`);
    }
    // 添加手牌分析总结
    if (result.length > 0) {
        result.unshift(`${Style.BOLD}${Style.BLUE}===== 手牌分析 =====${Style.RESET}`);
        // 添加组合统计
        const stats = `${Style.DIM}(对子:${pairCount} 顺子:${sequenceCount} 部分顺子:${partialSequenceCount} 总组合:${result.length - 1})${Style.RESET}`;
        result.push(stats);
    }
    return result;
}
// 按牌型和点数对牌进行分组
function groupTilesByTypeAndValue(tiles) {
    const result = new Map();
    for (const tile of tiles) {
        const key = `${tile.type}_${tile.value}`;
        if (!result.has(key)) {
            result.set(key, []);
        }
        result.get(key).push(tile);
    }
    return result;
}
// 处理玩家动作
async function handlePlayerAction(game) {
    // 如果没有待处理的操作，则结束
    if (!game.pendingAction) {
        console.log("没有待处理的操作");
        return;
    }
    try {
        // 处理所有等待中的玩家
        for (const waitingPlayerId of game.pendingAction.waitingPlayers) {
            const waitingPlayer = game.players[waitingPlayerId];
            const targetTile = game.pendingAction.tile;
            const fromPlayer = game.players[game.pendingAction.fromPlayerId];
            const allowedActions = game.pendingAction.allowedActions;
            // 显示信息
            console.log(`\n${Style.YELLOW}${fromPlayer.name} 打出了 ${targetTile.toString()}${Style.RESET}`);
            // 创建操作的唯一标识符
            const actionKey = `${waitingPlayer.id}_${fromPlayer.id}_${targetTile.id}_${allowedActions.join('_')}`;
            // 检查是否已经处理过这个操作
            if (processedActionKeys.has(actionKey)) {
                console.log(`${Style.DIM}已处理过此操作，自动选择\"过\"${Style.RESET}`);
                game.playerPass(waitingPlayerId);
                continue;
            }
            // 记录此操作已被处理
            processedActionKeys.add(actionKey);
            // 测试模式下，总是选择"过"以快速推进游戏
            if (isTestMode) {
                console.log(`测试模式：玩家 ${waitingPlayer.name} 自动选择\"过\"`);
                await sleep(50);
                // 记录到当前轮次
                addToTurnLog(`${waitingPlayer.name} 选择\"过\"`);
                game.playerPass(waitingPlayerId);
            }
            else if (waitingPlayer.type === player_1.PlayerType.AI) {
                // AI玩家的处理逻辑
                console.log(`AI玩家 ${waitingPlayer.name} 自动选择\"过\"`);
                // 记录到当前轮次
                addToTurnLog(`${waitingPlayer.name} 选择\"过\"`);
                game.playerPass(waitingPlayerId);
            }
            // 正常模式下人类玩家的处理逻辑保持不变
            else {
                // ... [保留原有的正常模式处理逻辑]
            }
        }
    }
    catch (error) {
        console.error("\n处理玩家操作出错：", error);
        // 如果出错，让所有等待的玩家选择"过"
        if (game.pendingAction) {
            for (const waitingPlayerId of game.pendingAction.waitingPlayers) {
                console.log(`由于错误，玩家 ${game.players[waitingPlayerId].name} 自动选择\"过\"`);
                game.playerPass(waitingPlayerId);
            }
        }
    }
}
// 显示游戏状态
function displayGameState(game) {
    console.log(game.getGameStateInfo(isTestMode, false)); // 显示状态但不检查摸牌次数
}
// 保存游戏日志到文件
function saveGameLogToFile(game, errorMessage) {
    try {
        const logDir = path.join(__dirname, '../logs');
        // 确保日志目录存在
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // 创建带时间戳的日志文件名
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const logFile = path.join(logDir, `game-error-${timestamp}.log`);
        // 构建日志内容
        const logContent = [
            "=== 麻将游戏错误日志 ===",
            `时间: ${new Date().toLocaleString()}`,
            `错误: ${errorMessage}`,
            "\n=== 游戏状态 ===",
            `游戏状态: ${game_1.GameState[game.state]}`,
            `当前玩家索引: ${game.currentPlayerIndex}`,
            `总牌数: ${game.totalTiles}`,
            `剩余牌数: ${game.remainingTiles}`,
            `摸牌次数: ${game.drawCount}`,
            "\n=== 玩家信息 ==="
        ];
        // 添加每个玩家的信息
        game.players.forEach((player, index) => {
            logContent.push(`\n--- 玩家 ${index}: ${player.name} (${player_1.PlayerType[player.type]}) ---`);
            logContent.push(`状态: ${player_1.PlayerState[player.state]}`);
            logContent.push(`手牌数量: ${player.handTiles.length}`);
            logContent.push(`手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
            logContent.push(`弃牌: ${player.discardedTiles.map(t => t.toString()).join(' ')}`);
            logContent.push(`已亮出牌组: ${player.revealedSets.map(set => `${set.type}[${set.tiles.map(t => t.toString()).join(',')}]`).join(' ')}`);
        });
        // 如果有待处理的动作，也记录下来
        if (game.state === game_1.GameState.WAITING_ACTION) {
            // @ts-ignore - 直接访问私有属性用于调试
            const pendingAction = game.pendingAction;
            if (pendingAction) {
                logContent.push("\n=== 待处理动作 ===");
                logContent.push(`来源玩家: ${pendingAction.fromPlayerId}`);
                logContent.push(`等待玩家: ${pendingAction.waitingPlayers.join(', ')}`);
                logContent.push(`动作牌: ${pendingAction.tile.toString()}`);
                logContent.push(`允许动作: ${pendingAction.allowedActions.join(', ')}`);
            }
        }
        // 写入日志文件
        fs.writeFileSync(logFile, logContent.join('\n'));
        console.log(`游戏错误日志已保存至: ${logFile}`);
    }
    catch (error) {
        console.error(`保存日志时出错: ${error}`);
    }
}
// 添加一个新的辅助函数来处理AI出牌
async function handleAIDiscard(game, player) {
    console.log(`执行AI玩家 ${player.name} 的出牌操作`);
    debugLog(`=== AI出牌处理开始 ===`);
    // 确保是AI玩家且有足够的牌
    if (player.type !== player_1.PlayerType.AI || player.handTiles.length <= 13) {
        console.log(`不需要处理出牌：玩家类型=${player_1.PlayerType[player.type]}，手牌数量=${player.handTiles.length}`);
        debugLog(`跳过处理: 玩家类型=${player_1.PlayerType[player.type]}或手牌数量不足(${player.handTiles.length})`);
        return false;
    }
    // 输出详细的手牌信息用于调试
    console.log(`AI玩家 ${player.name} 的手牌详情:`);
    player.handTiles.forEach((tile, idx) => {
        console.log(`  ${idx}: ${tile.toString()} (ID: ${tile.id})`);
    });
    debugLog(`AI手牌: ${player.handTiles.map((t, i) => `${i}:${t.toString()}`).join(', ')}`);
    // 先检查玩家状态
    if (player.state !== player_1.PlayerState.ACTING) {
        console.log(`AI玩家状态不对，当前状态: ${player_1.PlayerState[player.state]}，强制设置为ACTING`);
        debugLog(`修正玩家状态: ${player_1.PlayerState[player.state]} -> ${player_1.PlayerState.ACTING}`);
        player.state = player_1.PlayerState.ACTING;
    }
    // 检查游戏状态
    if (game.state !== game_1.GameState.PLAYING) {
        console.log(`游戏状态不是PLAYING，当前状态: ${game_1.GameState[game.state]}，强制设置为PLAYING`);
        debugLog(`修正游戏状态: ${game_1.GameState[game.state]} -> ${game_1.GameState.PLAYING}`);
        game.state = game_1.GameState.PLAYING;
    }
    // 确保当前玩家索引正确
    const playerIndex = game.players.indexOf(player);
    if (game.currentPlayerIndex !== playerIndex) {
        console.log(`当前玩家索引不正确(${game.currentPlayerIndex})，设置为AI玩家的索引(${playerIndex})`);
        debugLog(`修正当前玩家索引: ${game.currentPlayerIndex} -> ${playerIndex}`);
        game.currentPlayerIndex = playerIndex;
    }
    try {
        // 1. 获取AI的出牌选择
        console.log(`正在获取AI出牌选择...`);
        debugLog(`调用player.getAIMove()前`);
        const aiMoveIndex = player.getAIMove();
        debugLog(`player.getAIMove()返回: ${aiMoveIndex}`);
        console.log(`AI选择出牌索引: ${aiMoveIndex}`);
        // 2. 尝试使用AI选择的索引出牌
        let discarded = false;
        if (aiMoveIndex >= 0 && aiMoveIndex < player.handTiles.length) {
            const tileToDiscard = player.handTiles[aiMoveIndex];
            console.log(`尝试出牌：索引=${aiMoveIndex}, 牌=${tileToDiscard.toString()}`);
            debugLog(`调用game.currentPlayerDiscard(${aiMoveIndex})前`);
            const result = game.currentPlayerDiscard(aiMoveIndex);
            debugLog(`game.currentPlayerDiscard(${aiMoveIndex})返回: ${result ? result.toString() : 'null'}`);
            if (result) {
                console.log(`AI成功出牌: ${result.toString()}`);
                debugLog(`出牌成功，操作完成`);
                return true;
            }
            else {
                console.log(`使用AI选择的索引出牌失败，原因可能是游戏状态或玩家状态限制`);
                debugLog(`出牌失败，将尝试其他策略`);
            }
        }
        else {
            console.log(`AI返回的索引 ${aiMoveIndex} 无效`);
            debugLog(`AI返回的索引 ${aiMoveIndex} 无效或超出范围`);
        }
        // 3. 如果AI选择的索引不可用，尝试出最后一张牌
        console.log(`AI出牌失败，尝试出最后一张牌`);
        debugLog(`尝试使用最后一张牌策略`);
        const lastIndex = player.handTiles.length - 1;
        if (lastIndex >= 0) {
            const lastTile = player.handTiles[lastIndex];
            console.log(`尝试出最后一张牌：索引=${lastIndex}, 牌=${lastTile.toString()}`);
            debugLog(`调用game.currentPlayerDiscard(${lastIndex})前`);
            const lastResult = game.currentPlayerDiscard(lastIndex);
            debugLog(`game.currentPlayerDiscard(${lastIndex})返回: ${lastResult ? lastResult.toString() : 'null'}`);
            if (lastResult) {
                console.log(`AI成功出最后一张牌: ${lastResult.toString()}`);
                debugLog(`出最后一张牌成功，操作完成`);
                return true;
            }
            else {
                console.log(`出最后一张牌失败`);
                debugLog(`出最后一张牌失败，将尝试其他策略`);
            }
        }
        // 4. 如果仍然失败，尝试循环出每一张牌
        console.log(`出最后一张牌失败，尝试循环每一张牌`);
        debugLog(`尝试循环每一张牌策略`);
        for (let i = 0; i < player.handTiles.length; i++) {
            const tile = player.handTiles[i];
            console.log(`尝试出第${i + 1}张牌：${tile.toString()}`);
            debugLog(`尝试出牌，索引=${i}, 牌=${tile.toString()}`);
            const result = game.currentPlayerDiscard(i);
            if (result) {
                console.log(`AI成功出第${i + 1}张牌: ${result.toString()}`);
                debugLog(`成功出牌，操作完成`);
                return true;
            }
            else {
                console.log(`出第${i + 1}张牌失败`);
                debugLog(`出牌失败，继续尝试下一张`);
            }
        }
        // 5. 如果所有尝试都失败，检查游戏和玩家状态
        console.log(`所有出牌尝试都失败，检查游戏状态: ${game_1.GameState[game.state]}, 玩家状态: ${player_1.PlayerState[player.state]}`);
        debugLog(`所有常规出牌策略失败`);
        // 6. 尝试重新设置状态后再出牌
        console.log(`重新设置游戏和玩家状态后尝试出牌`);
        debugLog(`强制重置状态后再次尝试`);
        game.state = game_1.GameState.PLAYING;
        player.state = player_1.PlayerState.ACTING;
        // 更新当前玩家索引（确保与player一致）
        game.currentPlayerIndex = game.players.indexOf(player);
        // 再次尝试出牌
        if (player.handTiles.length > 0) {
            const emergencyIndex = player.handTiles.length - 1; // 使用最后一张牌
            console.log(`最后尝试：出第${emergencyIndex + 1}张牌`);
            debugLog(`最后尝试, 索引=${emergencyIndex}, 牌=${player.handTiles[emergencyIndex].toString()}`);
            const finalResult = game.currentPlayerDiscard(emergencyIndex);
            if (finalResult) {
                console.log(`紧急情况下成功出牌: ${finalResult.toString()}`);
                debugLog(`最后尝试成功，操作完成`);
                return true;
            }
            else {
                debugLog(`最后尝试失败`);
            }
        }
        // 7. 如果所有尝试都失败，直接调用nextTurn
        console.log(`所有出牌尝试都失败，强制进入下一回合`);
        debugLog(`所有策略失败，强制调用nextTurn()`);
        debugLog(`调用nextTurn()前 - 当前玩家: ${game.currentPlayerIndex}`);
        game.nextTurn();
        debugLog(`调用nextTurn()后 - 当前玩家: ${game.currentPlayerIndex}`);
        return false;
    }
    catch (error) {
        console.error(`AI出牌过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
        debugLog(`AI出牌过程异常: ${error instanceof Error ? error.stack : String(error)}`);
        // 发生错误时，强制进入下一回合
        console.log(`由于错误，强制进入下一回合`);
        debugLog(`错误恢复: 强制调用nextTurn()`);
        game.nextTurn();
        return false;
    }
    finally {
        debugLog(`=== AI出牌处理结束 ===`);
    }
}
// 主函数
async function main() {
    console.log("欢迎来到麻将游戏！");
    // 检查是否在测试模式
    const isTestMode = process.argv.includes('--test');
    // 专门测试特殊牌型
    if (process.argv.includes('--test-special-patterns')) {
        console.log("\n测试大四喜牌型:");
        const bigFourWindsResult = rules_1.RuleEngine.testBigFourWinds();
        console.log(`大四喜测试结果: ${bigFourWindsResult ? '通过' : '失败'}`);
        console.log("\n测试小四喜牌型:");
        const smallFourWindsResult = rules_1.RuleEngine.testSmallFourWinds();
        console.log(`小四喜测试结果: ${smallFourWindsResult ? '通过' : '失败'}`);
        console.log("\n测试大三元牌型:");
        const bigThreeDragonsResult = rules_1.RuleEngine.testBigThreeDragons();
        console.log(`大三元测试结果: ${bigThreeDragonsResult ? '通过' : '失败'}`);
        console.log("\n测试小三元牌型:");
        const smallThreeDragonsResult = rules_1.RuleEngine.testSmallThreeDragons();
        console.log(`小三元测试结果: ${smallThreeDragonsResult ? '通过' : '失败'}`);
        console.log("\n测试字一色牌型:");
        const allHonorsResult = rules_1.RuleEngine.testAllHonors();
        console.log(`字一色测试结果: ${allHonorsResult ? '通过' : '失败'}`);
        process.exit(0);
    }
    if (isTestMode) {
        // 测试十三幺逻辑
        console.log("测试国士无双逻辑:");
        rules_1.RuleEngine.testThirteenOrphans();
        // 测试七对逻辑
        console.log("\n测试七对逻辑:");
        rules_1.RuleEngine.testSevenPairs();
        // 测试风牌牌型
        console.log("\n测试风牌处理逻辑:");
        rules_1.RuleEngine.testWindTiles();
        // 测试箭牌牌型
        console.log("\n测试箭牌处理逻辑:");
        rules_1.RuleEngine.testArrowTiles();
        // 测试所有特殊牌型胡牌功能
        console.log("\n测试所有特殊牌型胡牌功能:");
        rules_1.RuleEngine.testAllSpecialHuFunctions();
    }
    // 检查是否是特殊牌型测试模式
    if (CHECK_SEVEN_PAIRS || CHECK_THIRTEEN_ORPHANS || CHECK_QING_YI_SE || CHECK_PENG_PENG_HU || CHECK_STANDARD_HU) {
        console.log("\n==== 特殊牌型测试模式 ====");
        if (CHECK_SEVEN_PAIRS) {
            console.log("\n=== 测试七对牌型 ===");
            const sevenPairsResult = rules_1.RuleEngine.testSevenPairs();
            console.log(`七对牌型测试结果: ${sevenPairsResult ? '✓ 通过' : '✗ 失败'}`);
        }
        if (CHECK_THIRTEEN_ORPHANS) {
            console.log("\n=== 测试十三幺牌型 ===");
            const thirteenOrphansResult = rules_1.RuleEngine.testThirteenOrphans();
            console.log(`十三幺牌型测试结果: ${thirteenOrphansResult ? '✓ 通过' : '✗ 失败'}`);
        }
        if (CHECK_QING_YI_SE) {
            console.log("\n=== 测试清一色牌型 ===");
            const qingYiSeResult = rules_1.RuleEngine.testQingYiSe();
            console.log(`清一色牌型测试结果: ${qingYiSeResult ? '✓ 通过' : '✗ 失败'}`);
        }
        if (CHECK_PENG_PENG_HU) {
            console.log("\n=== 测试碰碰胡牌型 ===");
            const pengPengHuResult = rules_1.RuleEngine.testPengPengHu();
            console.log(`碰碰胡牌型测试结果: ${pengPengHuResult ? '✓ 通过' : '✗ 失败'}`);
        }
        if (CHECK_STANDARD_HU) {
            console.log("\n=== 测试标准和牌牌型 ===");
            const standardHuResult = rules_1.RuleEngine.testStandardHu();
            console.log(`标准和牌牌型测试结果: ${standardHuResult ? '✓ 通过' : '✗ 失败'}`);
        }
        console.log("\n特殊牌型测试完成，返回 0 表示测试通过，返回 1 表示测试失败");
        process.exit(0);
    }
    // 检查大四喜牌型
    if (CHECK_BIG_FOUR_WINDS) {
        console.log("\n🎮 麻将游戏 - 特殊牌型测试 - 大四喜");
        const result = rules_1.RuleEngine.testBigFourWinds();
        console.log(`大四喜牌型测试结果: ${result ? '✓ 通过' : '✗ 失败'}`);
        process.exit(0);
    }
    // 检查大三元牌型
    if (CHECK_BIG_THREE_DRAGONS) {
        console.log("\n🎮 麻将游戏 - 特殊牌型测试 - 大三元");
        const result = rules_1.RuleEngine.testBigThreeDragons();
        console.log(`大三元牌型测试结果: ${result ? '✓ 通过' : '✗ 失败'}`);
        process.exit(0);
    }
    // 检查小四喜牌型
    if (CHECK_SMALL_FOUR_WINDS) {
        console.log("\n🎮 麻将游戏 - 特殊牌型测试 - 小四喜");
        const result = rules_1.RuleEngine.testSmallFourWinds();
        console.log(`小四喜牌型测试结果: ${result ? '✓ 通过' : '✗ 失败'}`);
        process.exit(0);
    }
    // 检查小三元牌型
    if (CHECK_SMALL_THREE_DRAGONS) {
        console.log("\n🎮 麻将游戏 - 特殊牌型测试 - 小三元");
        const result = rules_1.RuleEngine.testSmallThreeDragons();
        console.log(`小三元牌型测试结果: ${result ? '✓ 通过' : '✗ 失败'}`);
        process.exit(0);
    }
    // 检查字一色牌型
    if (CHECK_ALL_HONORS) {
        console.log("\n🎮 麻将游戏 - 特殊牌型测试 - 字一色");
        const result = rules_1.RuleEngine.testAllHonors();
        console.log(`字一色牌型测试结果: ${result ? '✓ 通过' : '✗ 失败'}`);
        process.exit(0);
    }
    // 创建游戏实例
    const game = new game_1.Game();
    globalGame = game; // 保存到全局变量
    // 增加计时器，定期检查AI玩家状态
    const aiCheckInterval = 500; // 毫秒
    const gameLoopTimer = setInterval(() => {
        // 如果游戏处于运行状态或等待动作状态
        if (game.state === game_1.GameState.PLAYING || game.state === game_1.GameState.WAITING_ACTION) {
            // 运行游戏循环，处理AI玩家行动
            game.runGameCycle();
            // 如果有待处理的操作，处理它 - 特别是针对人类玩家的待处理操作
            if (game.pendingAction) {
                handlePlayerAction(game);
            }
            // 在测试模式下，如果是人类玩家回合且需要出牌，自动出牌
            if (isTestMode) {
                const currentPlayer = game.players[game.currentPlayerIndex];
                if (game.state === game_1.GameState.PLAYING &&
                    currentPlayer.type === player_1.PlayerType.HUMAN &&
                    currentPlayer.state === player_1.PlayerState.ACTING &&
                    currentPlayer.handTiles.length > 13) {
                    console.log(`测试模式：人类玩家 ${currentPlayer.name} 自动出牌`);
                    // 打出最后摸到的牌，如果没有则打出最后一张牌
                    let cardIndex = -1;
                    if (currentPlayer.lastDrawnTile) {
                        // 找到最后摸到的牌的索引
                        cardIndex = currentPlayer.handTiles.findIndex(t => t.id === currentPlayer.lastDrawnTile?.id);
                    }
                    // 如果没有找到最后摸到的牌，使用最后一张牌
                    if (cardIndex === -1) {
                        cardIndex = currentPlayer.handTiles.length - 1;
                    }
                    console.log(`自动选择出牌索引: ${cardIndex}, 牌: ${currentPlayer.handTiles[cardIndex].toString()}`);
                    const result = game.currentPlayerDiscard(cardIndex);
                    if (result) {
                        console.log(`成功为人类玩家打出: ${result.toString()}`);
                        addToTurnLog(`${currentPlayer.name} 打出了 ${result.toString()}`);
                    }
                    else {
                        console.log(`人类玩家自动出牌失败，将尝试出最后一张牌`);
                        const lastIndex = currentPlayer.handTiles.length - 1;
                        const lastResult = game.currentPlayerDiscard(lastIndex);
                        if (lastResult) {
                            console.log(`成功为人类玩家打出最后一张牌: ${lastResult.toString()}`);
                            addToTurnLog(`${currentPlayer.name} 打出了 ${lastResult.toString()}`);
                        }
                    }
                }
            }
        }
        // 如果游戏已结束，清除计时器
        if (game.state === game_1.GameState.ENDED) {
            clearInterval(gameLoopTimer);
        }
    }, aiCheckInterval);
    // 为人类玩家创建输入接口
    const rl = nodeReadline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // 为输入接口创建监听
    rl.on('line', (input) => {
        const currentPlayer = game.players[game.currentPlayerIndex];
        // 如果游戏已经结束，关闭输入接口
        if (game.state === game_1.GameState.ENDED) {
            console.log("游戏已结束，感谢您的参与！");
            rl.close();
            return;
        }
        // 只处理当前回合是人类玩家的情况
        if (game.state === game_1.GameState.PLAYING &&
            currentPlayer.type === player_1.PlayerType.HUMAN &&
            currentPlayer.state === player_1.PlayerState.ACTING &&
            currentPlayer.handTiles.length > 13) {
            try {
                // 将输入转换为数字（1-indexed）
                const choice = parseInt(input, 10);
                // 验证输入范围有效（1到手牌数量）
                if (!isNaN(choice) && choice >= 1 && choice <= currentPlayer.handTiles.length) {
                    // 转换为0-indexed
                    const index = choice - 1;
                    console.log(`您选择了第${choice}张牌: ${currentPlayer.handTiles[index].toString()}`);
                    // 出牌
                    const discarded = game.currentPlayerDiscard(index);
                    if (discarded) {
                        console.log(`成功打出: ${discarded.toString()}`);
                        addToTurnLog(`${currentPlayer.name} 打出了 ${discarded.toString()}`);
                    }
                    else {
                        console.log("出牌失败，请再试一次");
                    }
                }
                else {
                    console.log(`请输入有效的牌号（1-${currentPlayer.handTiles.length}）`);
                }
            }
            catch (error) {
                console.error(`处理输入时出错: ${error}`);
            }
        }
        // 如果游戏处于等待动作状态，检查是否需要处理人类玩家的操作（吃碰杠胡）
        else if (game.state === game_1.GameState.WAITING_ACTION) {
            // 这部分逻辑已经在handlePlayerAction中处理了
            handlePlayerAction(game);
        }
    });
}
// 运行游戏
main().catch(console.error);
