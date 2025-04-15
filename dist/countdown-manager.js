"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountdownManager = void 0;
const display_1 = require("./display");
const logger_1 = require("./logger");
const display_manager_1 = require("./display-manager");
/**
 * 倒计时管理器类
 * 统一管理游戏中的所有倒计时相关功能
 */
class CountdownManager {
    /**
     * 启动倒计时
     * @param seconds 倒计时总秒数
     * @param onComplete 倒计时结束时执行的回调函数
     * @param onTick 倒计时每秒触发的回调函数
     * @returns 倒计时定时器
     */
    static startCountdown(seconds, onComplete, onTick) {
        // 输入验证
        if (seconds <= 0) {
            (0, logger_1.warnLog)(`尝试启动无效的倒计时: ${seconds}秒`);
            return null;
        }
        // 清除已存在的倒计时
        this.clearCountdown();
        // 记录当前时间
        this.lastUpdateTime = Date.now();
        // 初始化倒计时状态
        this.remainingSeconds = seconds;
        this.onCompleteCallback = onComplete;
        this.onTickCallback = onTick || null;
        this.isPaused = false;
        // 设置等待用户输入状态
        this._isWaitingForUserInput = true;
        if (this.debugMode) {
            (0, logger_1.infoLog)(`倒计时开始: ${seconds}秒`);
        }
        // 通知状态监听器
        this.notifyListeners();
        // 创建新的倒计时
        this.activeCountdown = setInterval(() => {
            // 防止在清除倒计时后回调仍然执行
            if (!this.activeCountdown || this.isPaused) {
                return;
            }
            // 检查自上次更新后是否已经过了1秒
            const now = Date.now();
            const elapsed = (now - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = now;
            // 更新倒计时显示
            this.updateCountdownMessage(`${display_1.Style.YELLOW}倒计时: ${this.remainingSeconds}秒${display_1.Style.RESET}`);
            // 执行每秒回调
            if (this.onTickCallback) {
                try {
                    this.onTickCallback(this.remainingSeconds);
                }
                catch (error) {
                    (0, logger_1.warnLog)(`倒计时onTick回调执行出错: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // 减少倒计时
            this.remainingSeconds--;
            // 通知状态监听器
            this.notifyListeners();
            // 倒计时结束
            if (this.remainingSeconds < 0) {
                if (this.debugMode) {
                    (0, logger_1.infoLog)(`倒计时结束`);
                }
                this.clearCountdown();
                display_manager_1.displayManager.printWarning(`倒计时结束`);
                // 重置等待用户输入的状态
                this._isWaitingForUserInput = false;
                // 缓存回调引用，防止清除倒计时时回调被置空
                const callback = this.onCompleteCallback;
                // 执行完成回调
                if (callback) {
                    // 使用setTimeout来确保回调在主事件循环的下一个周期执行
                    // 这有助于防止可能的递归调用
                    setTimeout(() => {
                        try {
                            if (callback)
                                callback();
                        }
                        catch (error) {
                            (0, logger_1.warnLog)(`倒计时onComplete回调执行出错: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }, 0);
                }
            }
        }, 1000);
        return this.activeCountdown;
    }
    /**
     * 清除当前倒计时
     */
    static clearCountdown() {
        if (this.activeCountdown) {
            clearInterval(this.activeCountdown);
            this.activeCountdown = null;
            if (this.debugMode) {
                (0, logger_1.infoLog)(`倒计时已清除，剩余${this.remainingSeconds}秒`);
            }
            this.remainingSeconds = 0;
            this.onCompleteCallback = null;
            this.onTickCallback = null;
            this.isPaused = false;
            // 清除倒计时显示
            this.clearCountdownDisplay();
            // 通知状态监听器
            this.notifyListeners();
        }
    }
    /**
     * 清除倒计时显示
     */
    static clearCountdownDisplay() {
        process.stdout.write('\r                                                                      \r');
    }
    /**
     * 更新倒计时消息
     * @param message 要显示的消息
     */
    static updateCountdownMessage(message) {
        process.stdout.write(`\r${message}`);
    }
    /**
     * 检查倒计时是否活跃
     */
    static isCountdownActive() {
        return this.activeCountdown !== null;
    }
    /**
     * 获取等待用户输入的状态
     */
    static get isWaitingForUserInput() {
        return this._isWaitingForUserInput;
    }
    /**
     * 设置等待用户输入的状态
     */
    static set isWaitingForUserInput(value) {
        if (this._isWaitingForUserInput !== value) {
            this._isWaitingForUserInput = value;
            if (this.debugMode) {
                (0, logger_1.infoLog)(`等待用户输入状态更改为: ${value}`);
            }
            // 如果不再等待用户输入，确保倒计时被清除
            if (!value && this.activeCountdown) {
                this.clearCountdown();
            }
        }
    }
    /**
     * 启用或禁用调试模式
     */
    static setDebugMode(enabled) {
        this.debugMode = enabled;
        (0, logger_1.infoLog)(`倒计时管理器调试模式: ${enabled ? '开启' : '关闭'}`);
    }
    /**
     * 获取当前倒计时剩余时间
     */
    static getRemainingSeconds() {
        return this.remainingSeconds;
    }
    /**
     * 暂停当前倒计时
     * @returns 是否成功暂停
     */
    static pauseCountdown() {
        if (!this.activeCountdown || this.isPaused) {
            return false;
        }
        this.isPaused = true;
        this.pausedRemainingTime = this.remainingSeconds;
        if (this.debugMode) {
            (0, logger_1.infoLog)(`倒计时已暂停，当前剩余${this.pausedRemainingTime}秒`);
        }
        // 通知监听器
        this.notifyListeners();
        return true;
    }
    /**
     * 恢复暂停的倒计时
     * @returns 是否成功恢复
     */
    static resumeCountdown() {
        if (!this.activeCountdown || !this.isPaused) {
            return false;
        }
        this.isPaused = false;
        this.lastUpdateTime = Date.now(); // 重置时间戳
        if (this.debugMode) {
            (0, logger_1.infoLog)(`倒计时已恢复，当前剩余${this.remainingSeconds}秒`);
        }
        // 通知监听器
        this.notifyListeners();
        return true;
    }
    /**
     * 增加倒计时时间
     * @param seconds 要增加的秒数
     * @returns 操作是否成功
     */
    static addTime(seconds) {
        if (!this.activeCountdown || seconds <= 0) {
            return false;
        }
        this.remainingSeconds += seconds;
        if (this.debugMode) {
            (0, logger_1.infoLog)(`倒计时增加了${seconds}秒，当前剩余${this.remainingSeconds}秒`);
        }
        // 通知监听器
        this.notifyListeners();
        return true;
    }
    /**
     * 减少倒计时时间
     * @param seconds 要减少的秒数
     * @returns 操作是否成功
     */
    static reduceTime(seconds) {
        if (!this.activeCountdown || seconds <= 0) {
            return false;
        }
        this.remainingSeconds = Math.max(1, this.remainingSeconds - seconds);
        if (this.debugMode) {
            (0, logger_1.infoLog)(`倒计时减少了${seconds}秒，当前剩余${this.remainingSeconds}秒`);
        }
        // 通知监听器
        this.notifyListeners();
        return true;
    }
    /**
     * 添加倒计时状态监听器
     * @param listener 监听器函数
     */
    static addListener(listener) {
        this.listeners.push(listener);
    }
    /**
     * 移除倒计时状态监听器
     * @param listener 要移除的监听器函数
     */
    static removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
     * 通知所有状态监听器
     */
    static notifyListeners() {
        const state = {
            active: this.isCountdownActive() && !this.isPaused,
            remaining: this.remainingSeconds
        };
        for (const listener of this.listeners) {
            try {
                listener(state);
            }
            catch (error) {
                (0, logger_1.warnLog)(`通知倒计时监听器时出错: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * 重置计时器管理器的所有状态（主要用于测试）
     */
    static reset() {
        this.clearCountdown();
        this._isWaitingForUserInput = false;
        this.isPaused = false;
        this.pausedRemainingTime = 0;
        this.listeners = [];
        this.debugMode = false;
    }
}
exports.CountdownManager = CountdownManager;
// 当前活跃的倒计时定时器
CountdownManager.activeCountdown = null;
// 当前倒计时剩余秒数
CountdownManager.remainingSeconds = 0;
// 倒计时结束回调
CountdownManager.onCompleteCallback = null;
// 每秒触发的回调
CountdownManager.onTickCallback = null;
// 是否正在等待用户输入
CountdownManager._isWaitingForUserInput = false;
// 上次倒计时更新时间
CountdownManager.lastUpdateTime = 0;
// 调试模式标志
CountdownManager.debugMode = false;
// 定时器暂停状态
CountdownManager.isPaused = false;
// 暂停时的剩余时间
CountdownManager.pausedRemainingTime = 0;
// 倒计时状态监听器
CountdownManager.listeners = [];
