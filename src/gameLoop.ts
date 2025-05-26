import { Game, GameState } from './game';
import { PlayerState } from './player';
import { 
  debugLog, 
  saveGameLogToFile,
  errorLog,
  infoLog
} from './logger';
import {
  askQuestion, InputState
} from './input';
import { DEBUG_MODE } from './index';
import { displayManager } from './display-manager';
import { CountdownManager } from './countdown-manager';
import { GameEventHandler } from './game-event-handler';
import { TileManager } from './tile-manager';

// 游戏循环检查间隔（毫秒）
const GAME_LOOP_INTERVAL = 100;

// 游戏循环检查标志
let isProcessingGameLoop = false;

// 游戏流程控制器
let gameEventHandler: GameEventHandler;

// 添加标志变量，用于跟踪玩家是否执行过操作
let hasPlayerActed = false;

/**
 * 游戏主循环 - 负责游戏的主循环逻辑和输入处理
 */
export async function gameLoop(game: Game): Promise<void> {

  displayManager.printSuccess(`游戏主循环启动...`);
  
  // 初始化游戏流程控制器
  gameEventHandler = new GameEventHandler(
    game,
    TileManager.getInstance()
  );
  
  // 确保玩家状态正确
  gameEventHandler.prepareGameStart();

  // 开始游戏
  gameEventHandler.startGame();

  // 显示初始游戏状态
  displayManager.displayFullGameState(game);
  
  // 重置玩家行动标志
  hasPlayerActed = false;
  
  // 上一个玩家状态缓存，用于检测变化
  let previousPlayerState: PlayerState = PlayerState.WAITING;
  
  // 上一个游戏状态缓存，用于检测变化
  let previousGameState: GameState  = GameState.INIT;
  
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
        if (DEBUG_MODE) {
          displayManager.print(`游戏状态变化: ${previousGameState} -> ${game.state}`);
        }
        previousGameState = game.state;
        
        // 如果状态变为ENDED，进行结算
        if (game.state === GameState.ENDED) {
          const result = await gameEventHandler.handleGameEnd();
          switch (result) {
            case 0: // GameEndResult.RESTART_AUTO_GAME
              InputState.isWaitingForUserInput = false;
              game.reset();
              gameEventHandler.startGame();
              displayManager.displayFullGameState(game);
              gameEventHandler.prepareGameStart();
              hasPlayerActed = false;
              break;
            case 1: // GameEndResult.AUTO_PLAY_COMPLETED
            case 2: // GameEndResult.USER_EXIT
              if (gameLoopInterval) {
                clearInterval(gameLoopInterval);
                gameLoopInterval = null;
              }
              isProcessingGameLoop = false;
              process.exit(0);
              return;
            case 3: // GameEndResult.NORMAL_END
            default:
              break;
          }
          isProcessingGameLoop = false;
          return;
        }
      }
      
      // 仅在调试模式下打印游戏状态信息
      if (DEBUG_MODE) {
        debugLog(`当前游戏状态: 玩家=${game.currentPlayerIndex}, 阶段=${game.state}`);
      }
      
      // 只有在玩家已经执行过操作后才检查游戏是否结束
      if (hasPlayerActed && gameEventHandler.checkGameEnd()) {
        // 设置游戏状态为结束
        game.setState(GameState.ENDED);
        // 等待下一个循环游戏状态变更处理
        return;
      }
      
      // 检查剩余牌数，可能需要结束游戏
      if (game.getRemainingTiles() <= 0) {
        // 牌山已空，结束游戏
        if (await GameEventHandler.handleEmptyTileDeck(game)) {
          // 如果用户选择继续游戏，则重置状态和游戏
          InputState.isWaitingForUserInput = false;
          // 重置游戏状态但不重新发牌
          game.reset();
          // 开始游戏
          gameEventHandler.startGame();
          // 显示初始游戏状态
          displayManager.displayFullGameState(game);
          // 继续游戏流程
          gameEventHandler.prepareGameStart();
          // 重置玩家行动标志
          hasPlayerActed = false;
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
      
      // 获取当前玩家
      const currentPlayer = game.getCurrentPlayer();
      
      // 检查当前玩家状态变化
      if (previousPlayerState !== currentPlayer.state) {

        if (DEBUG_MODE) {
          displayManager.print(`玩家状态变化: ${previousPlayerState} -> ${currentPlayer.state}`);
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
          let noNeedsToDiscard = await gameEventHandler.checkSpecialActions(currentPlayer);
          
          // 执行玩家的回合操作
          if (!noNeedsToDiscard) await gameEventHandler.handleCurrentPlayerDiscard();
          
          // 标记玩家已经执行过操作
          hasPlayerActed = true;

          // 重置状态
          InputState.isWaitingForUserInput = false;

          // 下一回合
          debugLog('gameLoopInterval')
          gameEventHandler.nextTurn()
        }
      }
    } catch (error) {
      errorLog(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}\n${error instanceof Error ? error.stack : ''}`, error instanceof Error ? error : undefined);
      displayManager.printError(`游戏循环发生错误: ${error instanceof Error ? error.message : String(error)}\n${error instanceof Error ? error.stack : ''}`);
      // 游戏循环出错，保存日志
      await saveGameLogToFile(game, `game loop error-${error}`);
      // 错误发生时，判断是否为特殊终止错误
      if (error instanceof Error && error.message === 'TILE_DECK_EMPTY') {
        await gameEventHandler.handleGameEnd();
        if (gameLoopInterval) {
          clearInterval(gameLoopInterval);
          gameLoopInterval = null;
        }
        return;
      }

      // 其它错误，直接退出
      if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
      }
      process.exit(1);
    } finally {
      // 标记为处理完毕
      isProcessingGameLoop = false;
    }
  }, GAME_LOOP_INTERVAL);
}