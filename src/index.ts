import { Game } from './game';
import { AIPlayer } from './ai-player';
import { HumanPlayer } from './human-player';
import { gameLoop } from './gameLoop';
import { Style } from './display';
import * as readline from 'readline';
import { InputState } from './input';
import { errorLog, setLogLevel, LogLevel } from './logger';
import { displayManager } from './display-manager';

// 自动打牌模式标志（导出以在其他模块中使用）
export let AUTO_PLAY_MODE = false; // 默认关闭自动打牌模式

// 调试模式开关（导出以在其他模块中使用）
export let DEBUG_MODE = false; // 默认关闭调试模式

/**
 * 提示用户选择是否启用自动打牌模式
 * 5秒内无选择则自动启用人工模式
 */
async function promptAutoPlayMode(): Promise<boolean> {
  return new Promise((resolve) => {
    displayManager.printTitle(`欢迎来到麻将游戏！`);
    displayManager.printColored(`是否启用自动打牌模式？在此模式下，4个AI玩家将自动对弈。`, Style.CYAN);
    displayManager.printColored(`输入 'y' 启用自动模式，'n' 进入手动模式 [默认: n]`, Style.YELLOW);
    displayManager.printColored(`5秒内无选择将自动启用人工模式`, Style.RED);
    
    // 使用InputState启动倒计时
    InputState.startCountdown(
      5, // 5秒倒计时
      () => {
        // 倒计时结束回调
        process.stdout.write('\n');
        displayManager.printSuccess(`已自动选择: 启用人工模式`);
        resolve(false); // 默认启用人工模式
      }
    );
    
    // 创建readline接口监听用户输入
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', (answer) => {
      // 清除倒计时
      InputState.clearCountdown();
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        displayManager.printSuccess(`已选择: 启用自动打牌模式，AI将自动对弈`);
        resolve(true);
      } else {
        displayManager.printSuccess(`已选择: 关闭自动打牌模式，将由您亲自上场！`);
        resolve(false);
      }
    });
  });
}

/**
 * 提示用户选择是否启用调试模式
 */
async function promptDebugMode(): Promise<boolean> {
  return new Promise((resolve) => {
    displayManager.printColored(`是否启用调试模式？在此模式下，将显示更多日志详情。`, Style.CYAN);
    displayManager.printColored(`输入 'd' 启用调试模式，其他键不启用 [默认: 不启用]`, Style.YELLOW);
    displayManager.printColored(`5秒内无选择将不启用调试模式`, Style.RED);
    
    // 使用InputState启动倒计时
    InputState.startCountdown(
      5, // 5秒倒计时
      () => {
        // 倒计时结束回调
        process.stdout.write('\n');
        displayManager.printSuccess(`已自动选择: 不启用调试模式`);
        resolve(false); // 默认不启用调试模式
      }
    );
    
    // 创建readline接口监听用户输入
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', (answer) => {
      // 清除倒计时
      InputState.clearCountdown();
      rl.close();
      
      if (answer.toLowerCase() === 'd') {
        displayManager.printSuccess(`已选择: 启用调试模式，将显示更多日志详情`);
        resolve(true);
      } else {
        displayManager.printSuccess(`已选择: 不启用调试模式`);
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
    AUTO_PLAY_MODE = await promptAutoPlayMode();
    
    // 提示用户选择是否启用调试模式
    DEBUG_MODE = await promptDebugMode();
    
    // 根据调试模式设置日志级别
    if (DEBUG_MODE) {
      setLogLevel(LogLevel.DEBUG);
      displayManager.printColored(`已启用调试模式，将记录详细日志信息`, Style.BOLD + Style.CYAN);
      InputState.setDebugMode(true);
    } else {
      setLogLevel(LogLevel.INFO);
      InputState.setDebugMode(false);
    }
    
    // 初始化游戏
    const game = new Game();
    
    // 检查自动打牌模式
    if (AUTO_PLAY_MODE) {
      // 自动模式下，禁用倒计时的调试输出
      InputState.setDebugMode(DEBUG_MODE);
      
      // 确保清除任何可能存在的倒计时
      InputState.clearCountdown();
      
      // 自动模式：4个AI玩家
      displayManager.printTitle(`初始化游戏：4个AI玩家对弈`);
      
      // 添加1个AI玩家
      game.addPlayer(new AIPlayer('东家(AI)'));
    } else {
      // 手动模式：1个人类玩家 + 3个AI玩家
      displayManager.printTitle(`初始化游戏：1个人类玩家 + 3个AI玩家`);
      
      // 添加1个人类玩家
      game.addPlayer(new HumanPlayer('东家(玩家)'));
    }

    // 添加3个AI玩家
    game.addPlayer(new AIPlayer('南家(AI)'));
    game.addPlayer(new AIPlayer('西家(AI)'));
    game.addPlayer(new AIPlayer('北家(AI)'));
    
    // 开始游戏
    game.startGame();
    
    // 显示初始游戏状态
    displayManager.displayFullGameState(game);
    
    // 启动游戏主循环
    await gameLoop(game);
    
  } catch (error) {
    errorLog("游戏启动发生错误:", error instanceof Error ? error : new Error(String(error)));

    // 如果发生错误，退出程序
    process.exit(1);
  }
}

// 启动游戏
startGame();