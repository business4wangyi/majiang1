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
exports.LogLevel = void 0;
exports.setLogLevel = setLogLevel;
exports.getLogLevel = getLogLevel;
exports.log = log;
exports.debugLog = debugLog;
exports.infoLog = infoLog;
exports.warnLog = warnLog;
exports.errorLog = errorLog;
exports.aiThinkingLog = aiThinkingLog;
exports.saveGameLogToFile = saveGameLogToFile;
exports.flushLogs = flushLogs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const display_manager_1 = require("./display-manager");
/**
 * 日志系统 - 提供全面的日志记录功能
 * 支持不同日志级别、文件记录和内存缓冲
 */
// 日志级别枚举
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARNING"] = 2] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 100] = "NONE"; // 不记录日志
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// 配置参数
const CONFIG = {
    // 当前日志级别 - 可以通过setLogLevel函数修改
    currentLogLevel: LogLevel.DEBUG,
    // 日志文件相关配置
    logDir: path.join(process.cwd(), 'logs'),
    logFilePrefix: 'game-log-',
    // 缓冲区大小
    maxLogBuffer: 1000,
    // 日志前缀
    debugPrefix: ''
};
// 日志前缀样式 - 使用ANSI转义序列直接定义颜色
const LOG_STYLES = {
    [LogLevel.DEBUG]: `\x1b[2m[DEBUG] ${CONFIG.debugPrefix}\x1b[0m`,
    [LogLevel.INFO]: `\x1b[32m[INFO] ${CONFIG.debugPrefix}\x1b[0m`,
    [LogLevel.WARNING]: `\x1b[33m[WARNING] ${CONFIG.debugPrefix}\x1b[0m`,
    [LogLevel.ERROR]: `\x1b[31m[ERROR] ${CONFIG.debugPrefix}\x1b[0m`,
    [LogLevel.NONE]: ``
};
// 当前日志文件名
const currentLogFile = `${CONFIG.logFilePrefix}${new Date().toISOString().replace(/:/g, '-')}.log`;
// 日志缓冲区
let logBuffer = [];
/**
 * 设置日志级别
 * @param level 新的日志级别
 */
function setLogLevel(level) {
    CONFIG.currentLogLevel = level;
    log(LogLevel.INFO, `日志级别已设置为 ${LogLevel[level]}`);
}
/**
 * 获取当前日志级别
 * @returns 当前日志级别
 */
function getLogLevel() {
    return CONFIG.currentLogLevel;
}
/**
 * 通用的日志记录器
 * @param level 日志级别
 * @param message 日志消息
 * @param includeTimestamp 是否包含时间戳
 */
function log(level, message, includeTimestamp = true) {
    // 如果日志级别低于当前设置，则不记录
    // 打印level和CONFIG.currentLogLevel
    if (level < CONFIG.currentLogLevel) {
        return;
    }
    const prefix = LOG_STYLES[level] || '';
    const timestamp = includeTimestamp ? `${new Date().toISOString()} ` : '';
    const logMessage = `${timestamp}${prefix} ${message}`;
    // 控制台输出（根据级别）
    console.log(logMessage);
    // 添加到日志缓冲区
    logBuffer.push(logMessage);
    // 如果缓冲区过大，写入文件并清空
    if (logBuffer.length >= CONFIG.maxLogBuffer) {
        flushLogBuffer();
    }
}
/**
 * 调试日志
 * @param message 日志消息
 */
function debugLog(message) {
    log(LogLevel.DEBUG, message);
}
/**
 * 信息日志
 * @param message 日志消息
 */
function infoLog(message) {
    log(LogLevel.INFO, message);
}
/**
 * 警告日志
 * @param message 日志消息
 */
function warnLog(message) {
    log(LogLevel.WARNING, message);
}
/**
 * 错误日志
 * @param message 日志消息
 * @param error 错误对象（可选）
 */
function errorLog(message, error) {
    let logMessage = message;
    // 如果提供了错误对象，添加错误信息和堆栈
    if (error) {
        logMessage += `\n错误: ${error.message}`;
        if (error.stack) {
            logMessage += `\n堆栈: ${error.stack}`;
        }
    }
    log(LogLevel.ERROR, logMessage);
}
/**
 * AI思考日志 - 专门用于记录AI的思考过程
 * @param aiName AI名称
 * @param message 思考信息
 */
function aiThinkingLog(aiName, message) {
    debugLog(`[${aiName}思考] ${message}`);
}
// ANSI颜色去除工具
function removeAnsiColors(str) {
    // 匹配所有ANSI转义序列
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}
/**
 * 将缓冲区中的日志写入文件
 */
function flushLogBuffer() {
    if (logBuffer.length === 0) {
        return;
    }
    try {
        // 确保日志目录存在
        if (!fs.existsSync(CONFIG.logDir)) {
            fs.mkdirSync(CONFIG.logDir, { recursive: true });
        }
        // 写入日志文件前，去除所有颜色控制符
        const logPath = path.join(CONFIG.logDir, currentLogFile);
        const plainLog = logBuffer.map(removeAnsiColors).join('\n') + '\n';
        fs.appendFileSync(logPath, plainLog);
        // 清空缓冲区
        logBuffer = [];
    }
    catch (error) {
        errorLog(`${CONFIG.debugPrefix} 无法写入日志文件: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * 记录游戏状态信息
 * @param game 游戏实例
 * @returns 游戏状态日志字符串
 */
function getGameStateLog(game) {
    const allPlayers = game.getAllPlayers();
    let log = `\n=== 游戏状态 ===\n`;
    log += `当前玩家: ${game.currentPlayerIndex}\n`;
    log += `游戏状态: ${game.state}\n`;
    log += `剩余牌数: ${game.getRemainingTiles()}\n`;
    log += `摸牌次数: ${game.drawCount}\n`;
    if (game.lastDiscardedTile) {
        log += `上次打出的牌: ${game.lastDiscardedTile.toString()}\n`;
    }
    log += `\n=== 玩家信息 ===\n`;
    allPlayers.forEach((player, index) => {
        log += `玩家 ${index}: ${player.name}, 状态: ${player.state}, 手牌: ${player.handTiles.length}张\n`;
        log += `手牌: ${player.handTiles.map(t => t.toString()).join(' ')}\n`;
        log += `弃牌: ${player.discardedTiles.map(t => t.toString()).join(' ')}\n\n`;
    });
    return log;
}
/**
 * 保存游戏日志到文件
 * @param game 游戏实例
 * @param reason 保存原因
 */
function saveGameLogToFile(game, reason) {
    try {
        // 确保日志目录存在
        if (!fs.existsSync(CONFIG.logDir)) {
            fs.mkdirSync(CONFIG.logDir, { recursive: true });
        }
        // 创建日志文件名（包含日期和原因）
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const errorLogFile = `game-${reason.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.log`;
        const logPath = path.join(CONFIG.logDir, errorLogFile);
        // 收集游戏状态信息
        let gameLog = `${CONFIG.debugPrefix} 日志原因: ${reason}\n`;
        gameLog += `${CONFIG.debugPrefix} 记录时间: ${new Date().toISOString()}\n`;
        gameLog += getGameStateLog(game);
        // 添加回合记录（从DisplayManager获取）
        gameLog += `\n=== 回合记录 ===\n`;
        const turnLogs = display_manager_1.displayManager.getTurnLogs();
        turnLogs.forEach((logEntry, index) => {
            gameLog += `${CONFIG.debugPrefix} ${index + 1}. ${logEntry}\n`;
        });
        // 添加当前缓冲区中的所有日志
        gameLog += `\n=== 详细日志 ===\n`;
        gameLog += logBuffer.join('\n');
        // 写入文件
        fs.writeFileSync(logPath, gameLog);
        console.log(`${CONFIG.debugPrefix} 游戏日志已保存到: ${logPath}`);
        // 清空缓冲区
        logBuffer = [];
    }
    catch (error) {
        errorLog(`${CONFIG.debugPrefix} 保存游戏日志失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// 立即刷新日志的方法
function flushLogs() {
    flushLogBuffer();
}
// 在程序退出前保存所有日志
process.on('exit', () => {
    flushLogBuffer();
});
// 捕获未处理的异常，记录日志并退出
process.on('uncaughtException', (error) => {
    errorLog('未捕获的异常', error);
    flushLogBuffer();
    process.exit(1);
});
// 捕获未处理的Promise拒绝，记录日志但不退出
process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        errorLog('未处理的Promise拒绝', reason);
    }
    else {
        errorLog(`未处理的Promise拒绝: ${String(reason)}`);
    }
    flushLogBuffer();
});
