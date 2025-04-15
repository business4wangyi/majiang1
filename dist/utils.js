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
exports.askQuestion = askQuestion;
const readline = __importStar(require("readline"));
const display_1 = require("./display");
/**
 * 向用户提问并获取回答
 * @param question 问题文本
 * @param timeout 超时时间（毫秒），默认5000ms
 * @returns Promise<string> 用户的回答，超时返回空字符串
 */
async function askQuestion(question, timeout = 5000) {
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
                clearInterval(countdownInterval);
                // 关闭rl接口前确保清除输入缓冲区
                rl.close();
                process.stdout.write('\r                                          \r');
                console.log(`${display_1.Style.YELLOW}时间到，自动选择默认选项${display_1.Style.RESET}`);
                resolve(''); // 返回空字符串表示超时
            }
        }, timeout);
        // 设置倒计时显示
        let countdown = Math.floor(timeout / 1000);
        const countdownInterval = setInterval(() => {
            if (userResponded) {
                clearInterval(countdownInterval);
                return;
            }
            // 使用process.stdout.write尝试实时更新倒计时
            process.stdout.write(`\r${display_1.Style.YELLOW}倒计时: ${countdown}秒${display_1.Style.RESET}     `);
            countdown--;
            if (countdown < 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        // 提示用户输入
        rl.question(question, (answer) => {
            // 检查是否已经因超时而处理过
            if (!userResponded) {
                userResponded = true;
                clearTimeout(timeoutId);
                clearInterval(countdownInterval);
                process.stdout.write('\r                                          \r');
                rl.close();
                resolve(answer);
            }
            // 如果已经因超时而处理过，这里不做额外处理
        });
    });
}
