import { Game, GameState } from './game';
import { Player, PlayerState, PlayerType } from './player';
import { Style } from './display';
import { 
  debugLog, 
  saveGameLogToFile,
  errorLog,
  infoLog
} from './logger';
import {
  askQuestion, InputState
} from './input';
import { AUTO_PLAY_MODE, DEBUG_MODE } from './index';
import { displayManager } from './display-manager';
import { CountdownManager } from './countdown-manager';
import { GameEventHandler } from './game-event-handler';
import { TileManager } from './tile-manager';

// 导入重构后的模块
import {
  handleEmptyTileDeck,
} from './game-event-handler';

// 游戏循环检查间隔（毫秒）
const GAME_LOOP_INTERVAL = 100;

// 游戏循环检查标志
let isProcessingGameLoop = false;

// 游戏流程控制器
let gameEventHandler: GameEventHandler;

/**
 * 游戏主循环 - 负责游戏的主循环逻辑和输入处理
 */
export async function gameLoop(game: Game): Promise<void> {
  infoLog(`游戏主循环启动...`);
  displayManager.printSuccess(`游戏主循环启动...`);
  
  // 初始化游戏流程控制器
  gameEventHandler = new GameEventHandler(
    game,
    TileManager.getInstance(),
    game.getAllPlayers()
  );
  
  // 游戏启动时的初始化工作
  gameEventHandler.prepareGameStart();
  
  // 开始第一局游戏
  gameEventHandler.startGame();
  
  // 上一个玩家状态缓存，用于检测变化
  let previousPlayerState: PlayerState | null = null;
  
  // 上一个游戏状态缓存，用于检测变化
  let previousGameState: GameState | null = null;
  
  // 初始化游戏循环计时器
  let gameLoopInterval: NodeJS.Timeout | null = null;
  
  // 游戏循环主函数
  gameLoopInterval = setInterval(async () => {
    // 防止多个循环同时执行
    if (isProcessingGameLoop) {
      return;
    }
    
    // 标记为正在处理
    isProcessingGameLoop = true;
    
    try {
      // 检查游戏状态变化
      if (previousGameState !== game.state) {
        debugLog(`游戏状态变化: ${previousGameState} -> ${game.state}`);
        if (DEBUG_MODE) {
          displayManager.printWarning(`游戏状态变化: ${previousGameState} -> ${game.state}`);
        }
        previousGameState = game.state;
        
        // 如果状态变为ENDED，进行结算
        if (game.state === GameState.ENDED) {
          await gameEventHandler.handleGameEnd();
          isProcessingGameLoop = false;
          return;
        }
      }
      
      // 仅在调试模式下打印游戏状态信息
      if (DEBUG_MODE) {
        debugLog(`当前游戏状态: 玩家=${game.currentPlayerIndex}, 阶段=${game.state}`);
      }
      
      // 检查游戏是否结束
      if (gameEventHandler.checkGameEnd()) {
        // 设置游戏状态为结束
        game.setState(GameState.ENDED);
        // 处理游戏结束事件
        await gameEventHandler.handleGameEnd();
        isProcessingGameLoop = false;
        return;
      }
      
      // 如果是自动模式，检查剩余牌数，可能需要结束游戏
      if (AUTO_PLAY_MODE && game.getRemainingTiles() <= 0) {
        // 牌山已空，结束游戏
        if (await handleEmptyTileDeck(game)) {
          // 如果用户选择继续游戏，则重置状态
          InputState.isWaitingForUserInput = false;
          // 重新启动游戏
          gameEventHandler.startGame();
        } else {
          // 用户选择结束游戏
          if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
          }
          isProcessingGameLoop = false;
          return;
        }
      }
      
      // 如果当前正在等待用户输入，则跳过本次循环
      if (InputState.isWaitingForUserInput) {
        isProcessingGameLoop = false;
        return;
      }
      
      // 如果启用了自动打牌模式，检查是否有超出张数的玩家
      if (AUTO_PLAY_MODE) {
        const playersWithExcessTiles = game.getPlayersWithExcessTiles();
        if (playersWithExcessTiles.length > 0) {
          // 有玩家已摸牌，需要出牌
          for (const player of playersWithExcessTiles) {
            if (player.id === game.currentPlayerIndex) {
              infoLog(`自动模式: 检测到当前玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
              displayManager.printWarning(`自动模式: 检测到当前玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
              // 强制AI玩家出牌
              await gameEventHandler.forceAIPlayerDiscard();
              break;
            }
          }
        }
      }
      
      // 获取当前玩家
      const currentPlayer = game.getCurrentPlayer();
      
      // 检查当前玩家状态变化
      if (previousPlayerState !== currentPlayer.state) {
        debugLog(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
        if (DEBUG_MODE) {
          displayManager.printWarning(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
        }
        previousPlayerState = currentPlayer.state;
      }
      
      // 处理当前玩家的回合
      if (currentPlayer.state === PlayerState.ACTING) {
        // 如果未设置玩家为等待输入状态，需要处理当前玩家的操作
        if (!InputState.isWaitingForUserInput) {
          // 设置为正在等待输入，防止多次处理
          InputState.isWaitingForUserInput = true;
          
          // 检查是否可以进行特殊操作（胡、杠等）
          await gameEventHandler.checkSpecialActions(currentPlayer);
          
          // 执行玩家的回合操作
          await gameEventHandler.handleCurrentPlayerAction();
        }
      }
    } catch (error) {
      errorLog(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
      displayManager.printError(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}`);
      
      // 游戏循环出错，保存日志
      await saveGameLogToFile(game, `游戏循环出错-${error}`);
      
      // 错误发生时，询问用户是否继续
      if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
      }
      
      const continueGame = await askQuestion("游戏发生错误，是否尝试继续？(y/n)");
      if (continueGame.toLowerCase() === 'y') {
        // 如果继续，重置一些状态并重新启动循环
        InputState.isWaitingForUserInput = false;
        CountdownManager.clearCountdownDisplay();
        gameLoop(game);
      } else {
        // 退出程序
        process.exit(1);
      }
    } finally {
      // 标记为处理完毕
      isProcessingGameLoop = false;
    }
  }, GAME_LOOP_INTERVAL);
}