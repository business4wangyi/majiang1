import './performance-injector';
import { Game } from '../core/game';
import { runAutoGameLoop, runInteractiveGameLoop } from '../ui/gameLoop';
import { Style } from '../ui/display';
import { InputState, askQuestion } from '../ui/input';
import { errorLog, setLogLevel, LogLevel } from '../tools/logger';
import { displayManager } from '../ui/display-manager';
import { CountdownManager } from '../ui/countdown-manager';
import { GameEventHandler } from '../ui/game-event-handler';
import { PerformanceMonitor } from '../tools/performance-monitor';
import { AUTO_PLAY_ROUNDS } from './config/config';

// 自动打牌模式标志（导出以在其他模块中使用）
export let AUTO_PLAY_MODE = false; // 默认关闭自动打牌模式

// 调试模式开关（导出以在其他模块中使用）
export let DEBUG_MODE = false; // 默认关闭调试模式

// 程序启动时记录全局启动时间
PerformanceMonitor.markProgramStart();

/**
 * 启动游戏
 */
async function startGame() {
  try {
    // 清除控制台
    console.clear();
    
    // 提示用户选择模式
    displayManager.printTitle(`欢迎来到麻将游戏！`);
    displayManager.printColored(`是否启用自动打牌模式？在此模式下，4个AI玩家将自动对弈。`, Style.CYAN);
    displayManager.printColored(`输入 'y' 启用自动模式，'n' 进入手动模式 [默认: y]`, Style.YELLOW);
    displayManager.printColored(`1秒内无选择将自动启用自动模式`, Style.RED);
    
    // 直接使用简单的askQuestion，避免使用askConfirmation可能引入的复杂性
    const autoModeInput = await askQuestion("", 1000, "y");
    
    // 手动清理倒计时显示
    CountdownManager.clearCountdownDisplay();

    // 解析用户选择
    AUTO_PLAY_MODE = autoModeInput.toLowerCase() === 'y';
    
    // 显示用户选择的结果
    if (AUTO_PLAY_MODE) {
      displayManager.printSuccess(`已选择: 启用自动打牌模式，AI将自动对弈`);
    } else {
      displayManager.printSuccess(`已选择: 关闭自动打牌模式，将由您亲自上场！`);
    }
    
    // 短暂延迟，确保显示正确
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 提示用户选择是否启用调试模式
    displayManager.printColored(`是否启用调试模式？在此模式下，将显示更多日志详情。`, Style.CYAN);
    displayManager.printColored(`输入 'd' 启用调试模式，其他键不启用 [默认: 不启用]`, Style.YELLOW);
    displayManager.printColored(`1秒内无选择将启用调试模式`, Style.RED);
    
    // 直接使用askQuestion
    const debugModeInput = await askQuestion("", 1000, "d");
    
    // 手动清理倒计时显示
    CountdownManager.clearCountdownDisplay();
    
    // 解析用户选择
    DEBUG_MODE = debugModeInput.toLowerCase() === 'd';
    
    // 显示用户选择的结果
    // 根据调试模式设置日志级别
    if (DEBUG_MODE) {
      displayManager.printSuccess(`已选择: 启用调试模式，将显示更多日志详情`);

      setLogLevel(LogLevel.DEBUG);
      displayManager.printColored(`已启用调试模式，将记录详细日志信息`, Style.BOLD + Style.CYAN);
      InputState.setDebugMode(true);
    } else {
      displayManager.printSuccess(`已选择: 不启用调试模式`);

      setLogLevel(LogLevel.INFO);
      InputState.setDebugMode(false);
    }
    
    // 确保清除任何可能存在的倒计时
    InputState.clearCountdown();
    
    // 短暂延迟，确保显示正确
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 初始化游戏
    const game = new Game();
    
    // 检查自动打牌模式
    if (AUTO_PLAY_MODE) {
      // 自动模式下，禁用倒计时的调试输出
      InputState.setDebugMode(DEBUG_MODE);
    } 
    
    // 使用新的方法设置玩家
    game.setupPlayers(AUTO_PLAY_MODE);
    
    // 创建游戏流程控制器
    const gameEventHandler = new GameEventHandler(
      game,
      game.getTileManager()
    );
    
    // 启动游戏主循环
    if (AUTO_PLAY_MODE) {
      await runAutoGameLoop(game, AUTO_PLAY_ROUNDS);
    } else {
      await runInteractiveGameLoop(game);
    }
    
  } catch (error) {
    errorLog("游戏启动发生错误:", error instanceof Error ? error : new Error(String(error)));

    // 如果发生错误，退出程序
    PerformanceMonitor.markProgramEnd();
    process.exit(1);
  }
}

// 启动游戏
startGame();