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
exports.InputState = void 0;
exports.askQuestion = askQuestion;
exports.askQuestionWithOptions = askQuestionWithOptions;
exports.askConfirmation = askConfirmation;
exports.getNextDiscardIndex = getNextDiscardIndex;
exports.getPlayerChiChoice = getPlayerChiChoice;
exports.getPlayerActionChoice = getPlayerActionChoice;
exports.handlePlayerAction = handlePlayerAction;
exports.getNumberInput = getNumberInput;
exports.getSelectionFromList = getSelectionFromList;
const display_1 = require("./display");
const rule_types_1 = require("./rule-types");
const logger_1 = require("./logger");
const countdown_manager_1 = require("./countdown-manager");
const display_manager_1 = require("./display-manager");
const readline = __importStar(require("readline"));
const rule_engine_1 = require("./rule-engine");
/**
 * 默认输入选项
 */
const DEFAULT_INPUT_OPTIONS = {
    timeoutInMs: 5000,
    showCountdown: true,
    defaultValue: '',
    silentMode: false
};
/**
 * 向用户提问并获取回答
 * @param question 问题文本
 * @param timeout 超时时间（毫秒），默认5000ms
 * @param defaultValue 超时后的默认值
 * @returns Promise<string> 用户的回答，超时返回默认值
 */
async function askQuestion(question, timeout = 5000, defaultValue = '') {
    // 设置等待用户输入状态
    InputState.isWaitingForUserInput = true;
    return askQuestionWithOptions(question, {
        timeoutInMs: timeout,
        showCountdown: true,
        defaultValue,
        silentMode: false
    });
}
/**
 * 向用户提问并获取回答（高级版本，带选项）
 * @param question 问题文本
 * @param options 输入选项
 * @returns Promise<string> 用户的回答
 */
async function askQuestionWithOptions(question, options = {}) {
    // 合并默认选项
    const mergedOptions = {
        ...DEFAULT_INPUT_OPTIONS,
        ...options
    };
    // 创建readline接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        let userResponded = false;
        // 设置超时定时器
        const timeoutId = setTimeout(() => {
            if (!userResponded) {
                userResponded = true; // 标记为已响应，防止后续输入触发处理
                // 关闭rl接口前确保清除输入缓冲区
                rl.close();
                if (!mergedOptions.silentMode) {
                    countdown_manager_1.CountdownManager.clearCountdownDisplay();
                    display_manager_1.displayManager.printColored(`时间到，自动选择默认选项`, display_1.Style.YELLOW);
                }
                (0, logger_1.infoLog)(`用户输入超时，返回默认值: "${mergedOptions.defaultValue}"`);
                // 重置等待用户输入状态
                InputState.isWaitingForUserInput = false;
                resolve(mergedOptions.defaultValue); // 返回默认值
            }
        }, mergedOptions.timeoutInMs);
        // 设置倒计时显示
        let countdownInterval = null;
        if (mergedOptions.showCountdown && !mergedOptions.silentMode) {
            // 计算总秒数（向上取整以确保显示完整的秒数）
            let countdown = Math.ceil(mergedOptions.timeoutInMs / 1000);
            // 立即显示第一个倒计时数字
            display_manager_1.displayManager.printColored(`倒计时: ${countdown}秒`, display_1.Style.YELLOW);
            countdownInterval = setInterval(() => {
                // 如果用户已响应，清除定时器并返回
                if (userResponded) {
                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }
                    return;
                }
                // 先减少计数
                countdown--;
                // 如果倒计时结束，清除定时器
                if (countdown < 0) {
                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }
                    return;
                }
                // 显示当前倒计时（包括0秒）
                display_manager_1.displayManager.printColored(`倒计时: ${countdown}秒`, display_1.Style.YELLOW);
            }, 1000);
        }
        // 提示用户输入
        rl.question(question, (answer) => {
            // 检查是否已经因超时而处理过
            if (!userResponded) {
                userResponded = true;
                clearTimeout(timeoutId);
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                if (!mergedOptions.silentMode) {
                    countdown_manager_1.CountdownManager.clearCountdownDisplay();
                }
                rl.close();
                (0, logger_1.infoLog)(`用户输入: "${answer}"`);
                // 重置等待用户输入状态
                InputState.isWaitingForUserInput = false;
                resolve(answer.trim());
            }
            // 如果已经因超时而处理过，这里不做额外处理
        });
    });
}
/**
 * 从用户获取确认（是/否）
 * @param prompt 提示信息
 * @param defaultYes 默认是否为"是"
 * @param timeout 超时时间（毫秒）
 * @returns Promise<boolean> 用户的选择
 */
async function askConfirmation(prompt, defaultYes = true, timeout = 5000) {
    const defaultChoice = defaultYes ? 'y' : 'n';
    const yesNoPrompt = `${prompt} (y/n) [默认: ${defaultChoice}]: `;
    const answer = await askQuestion(yesNoPrompt, timeout, defaultChoice);
    if (!answer || answer === '') {
        return defaultYes;
    }
    // 只检查第一个字符
    const firstChar = answer.toLowerCase().charAt(0);
    return firstChar === 'y';
}
// 输入状态管理
class InputState {
    // 代理到CountdownManager的方法和属性
    static get isWaitingForUserInput() {
        return countdown_manager_1.CountdownManager.isWaitingForUserInput;
    }
    static set isWaitingForUserInput(value) {
        countdown_manager_1.CountdownManager.isWaitingForUserInput = value;
    }
    // 为了保持向后兼容性，保留countdownInterval和currentCountdown的getter/setter
    static get countdownInterval() {
        return countdown_manager_1.CountdownManager.isCountdownActive() ? {} : null;
    }
    static get currentCountdown() {
        return countdown_manager_1.CountdownManager.getRemainingSeconds();
    }
    static set countdownInterval(value) {
        // 空方法，实际值由CountdownManager管理
        if (value === null && countdown_manager_1.CountdownManager.isCountdownActive()) {
            countdown_manager_1.CountdownManager.clearCountdown();
        }
    }
    static set currentCountdown(value) {
        // 简单处理，如果当前有活跃的倒计时，则更新其剩余时间
        if (countdown_manager_1.CountdownManager.isCountdownActive() && value >= 0) {
            // 通过减少当前时间和目标时间的差值来实现设置
            const currentValue = countdown_manager_1.CountdownManager.getRemainingSeconds();
            const diff = currentValue - value;
            if (diff > 0) {
                countdown_manager_1.CountdownManager.reduceTime(diff);
            }
            else if (diff < 0) {
                countdown_manager_1.CountdownManager.addTime(Math.abs(diff));
            }
        }
    }
    // 清除倒计时
    static clearCountdown() {
        countdown_manager_1.CountdownManager.clearCountdown();
    }
    // 启动倒计时
    static startCountdown(seconds, onTimeout = null) {
        // 先清除可能存在的倒计时
        this.clearCountdown();
        // 在启动新倒计时前记录日志
        (0, logger_1.infoLog)(`启动倒计时: ${seconds}秒, 回调状态: ${onTimeout ? '已设置' : '未设置'}`);
        // 确保onTimeout非空
        const safeCallback = onTimeout || (() => {
            (0, logger_1.warnLog)(`倒计时结束，执行默认回调（空操作）`);
        });
        // 启动新的倒计时
        countdown_manager_1.CountdownManager.startCountdown(seconds, () => {
            try {
                (0, logger_1.infoLog)(`倒计时结束，执行回调函数`);
                // 确保无论如何，都会重置等待输入状态
                InputState.isWaitingForUserInput = false;
                // 执行回调
                safeCallback();
            }
            catch (error) {
                // 捕获并记录回调执行时的错误
                (0, logger_1.warnLog)(`倒计时回调执行出错: ${error instanceof Error ? error.message : String(error)}`);
                (0, logger_1.warnLog)(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
                // 确保重置等待输入状态
                InputState.isWaitingForUserInput = false;
            }
        });
    }
    // 判断倒计时是否处于活跃状态
    static isCountdownActive() {
        return countdown_manager_1.CountdownManager.isCountdownActive();
    }
    // 暂停倒计时
    static pauseCountdown() {
        return countdown_manager_1.CountdownManager.pauseCountdown();
    }
    // 恢复倒计时
    static resumeCountdown() {
        return countdown_manager_1.CountdownManager.resumeCountdown();
    }
    // 重置所有状态
    static reset() {
        countdown_manager_1.CountdownManager.reset();
    }
    // 设置调试模式
    static setDebugMode(enabled) {
        countdown_manager_1.CountdownManager.setDebugMode(enabled);
    }
}
exports.InputState = InputState;
/**
 * 获取用户选择的下一个出牌索引
 * @param handTilesLength 手牌数量
 * @param timeout 超时时间（毫秒）
 * @returns Promise<number> 用户选择的索引（0-based），错误返回-1，查看手牌返回-2
 */
async function getNextDiscardIndex(handTilesLength, timeout = 5000) {
    try {
        // 验证手牌数量
        if (handTilesLength <= 0) {
            display_manager_1.displayManager.printError('错误：手牌数量为0或负数');
            return -1;
        }
        // 用户输入1-14，转换为0-13
        // 这里不设置timeout，因为倒计时已经在gameLoop中处理
        const input = await askQuestion("", 999999); // 设置一个超长时间
        // 如果输入为空，返回-1
        if (!input || input.trim() === '') {
            display_manager_1.displayManager.printWarning('未收到有效输入，请重新选择');
            return -1;
        }
        // 处理特殊指令
        if (input.toLowerCase() === 'q') {
            display_manager_1.displayManager.print('退出游戏');
            process.exit(0);
        }
        if (input.toLowerCase() === 'h') {
            return -2; // 特殊值，表示查看手牌
        }
        // 转换输入为数字
        const index = parseInt(input) - 1;
        // 严格检查输入是否有效
        if (isNaN(index)) {
            display_manager_1.displayManager.printError(`无效的输入 "${input}"，请输入数字`);
            return -1; // 表示输入无效
        }
        if (index < 0 || index >= handTilesLength) {
            display_manager_1.displayManager.printError(`索引超出范围，有效范围: 1-${handTilesLength}，您输入了: ${index + 1}`);
            return -1; // 表示输入无效
        }
        // 验证通过，返回有效索引
        return index;
    }
    catch (error) {
        (0, logger_1.errorLog)(`获取用户输入时出错: ${error instanceof Error ? error.message : String(error)}`);
        display_manager_1.displayManager.printError(`获取用户输入时出错: ${error instanceof Error ? error.message : String(error)}`);
        return -1; // 出错时返回-1
    }
}
/**
 * 获取玩家的"吃"选择
 * @param combinations 可选的吃牌组合
 * @param timeout 超时时间（毫秒）
 * @returns Promise<number> 选择的索引，取消返回-1
 */
async function getPlayerChiChoice(combinations, timeout = 5000) {
    if (!combinations || combinations.length === 0) {
        (0, logger_1.warnLog)('无效的吃牌组合数组');
        return -1;
    }
    display_manager_1.displayManager.printTitle('选择要吃的组合');
    // 显示所有可能的吃组合
    combinations.forEach((combo, index) => {
        display_manager_1.displayManager.print(`${index + 1}: ${combo.map(t => t.toString()).join(', ')}`);
    });
    // 添加"取消"选项
    display_manager_1.displayManager.print(`0: 取消吃`);
    // 获取用户选择
    const input = await askQuestion(`请选择(0-${combinations.length}): `, timeout, '0');
    const choice = parseInt(input);
    // 验证选择
    if (isNaN(choice) || choice < 0 || choice > combinations.length) {
        display_manager_1.displayManager.printWarning("无效的选择，取消操作");
        return -1;
    }
    if (choice === 0) {
        return -1; // 取消
    }
    // 返回用户选择的索引（减1，因为显示是从1开始的）
    return choice - 1;
}
/**
 * 获取玩家的动作选择
 * @param actions 可用的动作列表
 * @param timeout 超时时间（毫秒）
 * @returns Promise<PlayerAction | null> 选择的动作，或null表示取消
 */
async function getPlayerActionChoice(actions, timeout = 5000) {
    if (!actions || actions.length === 0) {
        return null;
    }
    // 构建选项提示
    let prompt = '请选择动作:\n';
    const actionMap = {};
    // 添加可用操作
    actions.forEach((action, index) => {
        const key = (index + 1).toString();
        actionMap[key] = action;
        switch (action) {
            case rule_types_1.PlayerAction.CHI:
                prompt += `${key}: 吃\n`;
                break;
            case rule_types_1.PlayerAction.PENG:
                prompt += `${key}: 碰\n`;
                break;
            case rule_types_1.PlayerAction.GANG:
                prompt += `${key}: 杠\n`;
                break;
            case rule_types_1.PlayerAction.HU:
                prompt += `${key}: 胡\n`;
                break;
            default:
                prompt += `${key}: ${action}\n`;
        }
    });
    // 添加取消选项
    prompt += '0: 取消\n';
    prompt += '请输入选项数字: ';
    // 获取用户输入
    const input = await askQuestion(prompt, timeout, '0');
    // 默认或取消
    if (input === '0' || input === '') {
        return null;
    }
    // 查找选择的动作
    const action = actionMap[input];
    if (action === undefined) {
        display_manager_1.displayManager.printWarning('无效的选择，操作已取消');
        return null;
    }
    return action;
}
/**
 * 处理玩家的动作选择（吃碰杠胡）
 * @param game 游戏实例
 * @param timeout 超时时间（毫秒）
 * @returns Promise<boolean> 操作是否成功
 */
async function handlePlayerAction(game, timeout = 5000) {
    // 获取可用操作
    const allowedActions = game.getAvailableActions();
    // 如果没有可用操作，直接返回
    if (allowedActions.length === 0) {
        (0, logger_1.debugLog)("当前没有可用的操作");
        game.playerPass(game.currentPlayerIndex);
        return false;
    }
    // 检查当前玩家是否有动作可以执行
    const currentPlayer = game.getCurrentPlayer();
    const waitingPlayerId = game.currentPlayerIndex;
    const lastDiscardedTile = game.lastDiscardedTile;
    (0, logger_1.debugLog)(`处理玩家动作: playerId=${waitingPlayerId}, 允许的动作=${allowedActions.join(',')}`);
    // 构建选项文本和有效选项数组
    const validOptions = [];
    // 构建选项文本
    if (allowedActions.includes(rule_types_1.PlayerAction.CHI)) {
        display_manager_1.displayManager.printColored(`1: 吃  `, display_1.Style.GREEN);
        validOptions.push(rule_types_1.PlayerAction.CHI);
    }
    if (allowedActions.includes(rule_types_1.PlayerAction.PENG)) {
        display_manager_1.displayManager.printColored(`2: 碰  `, display_1.Style.BLUE);
        validOptions.push(rule_types_1.PlayerAction.PENG);
    }
    if (allowedActions.includes(rule_types_1.PlayerAction.GANG)) {
        display_manager_1.displayManager.printColored(`3: 杠  `, display_1.Style.MAGENTA);
        validOptions.push(rule_types_1.PlayerAction.GANG);
    }
    if (allowedActions.includes(rule_types_1.PlayerAction.HU)) {
        display_manager_1.displayManager.printColored(`4: 胡  `, display_1.Style.RED + display_1.Style.BOLD);
        validOptions.push(rule_types_1.PlayerAction.HU);
    }
    // 始终提供"过"选项
    display_manager_1.displayManager.printColored(`0: 过`, display_1.Style.DIM);
    // 提示用户输入选择
    display_manager_1.displayManager.printPrompt(`请输入选项数字(0-${validOptions.length})进行选择，或等待${timeout / 1000}秒自动选择"过"...`);
    // 获取用户选择
    const inputStr = await askQuestion("", timeout, '0');
    // 处理退出游戏
    if (inputStr.toLowerCase() === 'q') {
        display_manager_1.displayManager.print('退出游戏');
        process.exit(0);
    }
    // 处理无效输入或超时
    if (!inputStr || inputStr === '0') {
        display_manager_1.displayManager.print('选择了"过"');
        game.playerPass(waitingPlayerId);
        return false;
    }
    const choice = parseInt(inputStr);
    // 验证选择是否有效
    if (isNaN(choice) || choice <= 0 || choice > validOptions.length) {
        display_manager_1.displayManager.printError('无效的选择，自动选择"过"');
        game.playerPass(waitingPlayerId);
        return false;
    }
    // 获取选择的动作
    const selectedAction = validOptions[choice - 1];
    // 根据RuleEngine和Game类的实际方法执行选择的动作
    switch (selectedAction) {
        case rule_types_1.PlayerAction.CHI:
            // 处理吃牌
            if (!lastDiscardedTile) {
                display_manager_1.displayManager.printError('没有可用的吃牌组合，操作取消');
                game.playerPass(waitingPlayerId);
                return false;
            }
            // 使用RuleEngine查找可能的吃牌组合
            const chiCombinations = rule_engine_1.RuleEngine.findChiCombinations(currentPlayer.handTiles, lastDiscardedTile);
            if (!chiCombinations || chiCombinations.length === 0) {
                display_manager_1.displayManager.printError('没有可用的吃牌组合，操作取消');
                game.playerPass(waitingPlayerId);
                return false;
            }
            const chiChoice = await getPlayerChiChoice(chiCombinations);
            if (chiChoice === -1) {
                display_manager_1.displayManager.print('取消吃牌');
                game.playerPass(waitingPlayerId);
                return false;
            }
            display_manager_1.displayManager.printSuccess(`选择了吃牌组合: ${chiCombinations[chiChoice].map((t) => t.toString()).join(', ')}`);
            // 记录成功的信息
            (0, logger_1.infoLog)(`玩家 ${currentPlayer.name} 选择了吃牌`);
            // 将实现委托给Game类适当的方法
            try {
                // 使用Player类的chi方法
                const success = currentPlayer.chi(
                // 过滤掉lastDiscardedTile，因为它应该是别人打出的
                chiCombinations[chiChoice].filter(t => t.type !== lastDiscardedTile.type ||
                    t.value !== lastDiscardedTile.value ||
                    t.id !== lastDiscardedTile.id), lastDiscardedTile);
                if (!success) {
                    display_manager_1.displayManager.printError('吃牌操作失败');
                    game.playerPass(waitingPlayerId);
                    return false;
                }
                return true;
            }
            catch (error) {
                (0, logger_1.errorLog)(`执行吃牌操作时出错: ${error instanceof Error ? error.message : String(error)}`);
                display_manager_1.displayManager.printError(`吃牌失败: ${error instanceof Error ? error.message : String(error)}`);
                game.playerPass(waitingPlayerId);
                return false;
            }
        case rule_types_1.PlayerAction.PENG:
            // 处理碰牌
            if (!lastDiscardedTile) {
                display_manager_1.displayManager.printError('没有可用的碰牌，操作取消');
                game.playerPass(waitingPlayerId);
                return false;
            }
            display_manager_1.displayManager.printSuccess('选择了碰牌');
            (0, logger_1.infoLog)(`玩家 ${currentPlayer.name} 选择了碰牌`);
            try {
                // 使用Player类的peng方法
                const success = currentPlayer.peng(lastDiscardedTile);
                if (!success) {
                    display_manager_1.displayManager.printError('碰牌操作失败');
                    game.playerPass(waitingPlayerId);
                    return false;
                }
                return true;
            }
            catch (error) {
                (0, logger_1.errorLog)(`执行碰牌操作时出错: ${error instanceof Error ? error.message : String(error)}`);
                display_manager_1.displayManager.printError(`碰牌失败: ${error instanceof Error ? error.message : String(error)}`);
                game.playerPass(waitingPlayerId);
                return false;
            }
        case rule_types_1.PlayerAction.GANG:
            // 处理杠牌
            display_manager_1.displayManager.printSuccess('选择了杠牌');
            (0, logger_1.infoLog)(`玩家 ${currentPlayer.name} 选择了杠牌`);
            // 使用Game类的杠牌方法
            return game.playerGang(waitingPlayerId, lastDiscardedTile);
        case rule_types_1.PlayerAction.HU:
            // 处理胡牌
            display_manager_1.displayManager.printSuccess('选择了胡牌');
            (0, logger_1.infoLog)(`玩家 ${currentPlayer.name} 选择了胡牌！`);
            // 这里应该调用Game类的胡牌方法，但现在只标记状态
            display_manager_1.displayManager.printSuccess(`${currentPlayer.name} 胡牌了！游戏结束`);
            return true;
        default:
            // 未知操作，直接过
            display_manager_1.displayManager.printWarning(`未知操作: ${selectedAction}，自动选择"过"`);
            game.playerPass(waitingPlayerId);
            return false;
    }
}
/**
 * 获取数字输入
 * @param prompt 提示信息
 * @param min 最小值
 * @param max 最大值
 * @param defaultValue 默认值
 * @param timeout 超时时间（毫秒）
 * @returns Promise<number> 用户输入的数字
 */
async function getNumberInput(prompt, min, max, defaultValue, timeout = 5000) {
    const rangeStr = min === max ? `${min}` : `${min}-${max}`;
    const fullPrompt = `${prompt} (${rangeStr}) [默认: ${defaultValue}]: `;
    const input = await askQuestion(fullPrompt, timeout, defaultValue.toString());
    if (!input || input === '') {
        return defaultValue;
    }
    const num = parseInt(input);
    if (isNaN(num)) {
        display_manager_1.displayManager.printWarning(`输入不是有效的数字，使用默认值: ${defaultValue}`);
        return defaultValue;
    }
    if (num < min || num > max) {
        display_manager_1.displayManager.printWarning(`输入超出范围 ${rangeStr}，使用默认值: ${defaultValue}`);
        return defaultValue;
    }
    return num;
}
/**
 * 从列表中获取选择
 * @param prompt 提示信息
 * @param options 选项列表
 * @param defaultIndex 默认选项索引
 * @param timeout 超时时间（毫秒）
 * @returns Promise<number> 选择的索引
 */
async function getSelectionFromList(prompt, options, defaultIndex = 0, timeout = 5000) {
    if (!options || options.length === 0) {
        (0, logger_1.warnLog)('选项列表为空');
        return -1;
    }
    // 显示选项列表
    display_manager_1.displayManager.print(prompt);
    options.forEach((option, index) => {
        const defaultMark = index === defaultIndex ? ' (默认)' : '';
        display_manager_1.displayManager.print(`${index + 1}: ${option}${defaultMark}`);
    });
    // 获取用户选择
    const input = await askQuestion(`请选择(1-${options.length}): `, timeout, (defaultIndex + 1).toString());
    if (!input || input === '') {
        return defaultIndex;
    }
    const choice = parseInt(input) - 1; // 转换为0-based索引
    if (isNaN(choice) || choice < 0 || choice >= options.length) {
        display_manager_1.displayManager.printWarning(`无效的选择，使用默认选项: ${options[defaultIndex]}`);
        return defaultIndex;
    }
    return choice;
}
