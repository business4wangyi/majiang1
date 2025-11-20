import { perfMonitor } from '../tools/performance-monitor';
import { GameEventHandler } from '../ui/game-event-handler';
import { AIPlayer } from '../strategy/ai-player';
import { AUTO_PLAY_MODE } from './index';
import { AUTO_PLAY_ROUNDS } from './config/config';
import { debugLog } from '../tools/logger';

// 0. 注入 GameEventHandler.startGame，自动开启新一局统计
const origStartGame = GameEventHandler.prototype.startGame;
GameEventHandler.prototype.startGame = function(...args: any[]) {
  this.currentRound++;
  // debug输出当前局号和总局数
  debugLog(`[DEBUG] startGame: currentRound=${this.currentRound}, AUTO_PLAY_ROUNDS=${AUTO_PLAY_ROUNDS}`);
  perfMonitor.startNewRound();
  return origStartGame.apply(this, []);
};

// 1. 注入 updatePlayerState，玩家回合开始计时
const originalUpdatePlayerState = GameEventHandler.prototype.updatePlayerState;
GameEventHandler.prototype.updatePlayerState = function(...args: any[]) {
  const playerIndex = args[0];
  const player = this.game.getAllPlayers()[playerIndex];
  if (playerIndex === this.game.currentPlayerIndex) {
    perfMonitor.startPlayerRound(player.name);
  }
  // @ts-ignore
  return originalUpdatePlayerState.apply(this, args);
};

// 2. 注入 handleCurrentPlayerDiscard，玩家回合结束计时
const originalHandleCurrentPlayerDiscard = GameEventHandler.prototype.handleCurrentPlayerDiscard;
GameEventHandler.prototype.handleCurrentPlayerDiscard = async function(...args: any[]) {
  const currentPlayer = this.game.getCurrentPlayer();
  // @ts-ignore
  const result = await originalHandleCurrentPlayerDiscard.apply(this, args);
  perfMonitor.endPlayerRound(currentPlayer.name);
  return result;
};

// 3. 注入 AIPlayer.getAIMove，AI决策耗时（如果方法存在）
if (AIPlayer && AIPlayer.prototype && typeof AIPlayer.prototype.getAIMove === 'function') {
  const origGetAIMove = AIPlayer.prototype.getAIMove;
  AIPlayer.prototype.getAIMove = function(...args) {
    perfMonitor.mark(`AI决策-${this.name}`);
    try {
      return origGetAIMove.apply(this, args);
    } finally {
      perfMonitor.measure(`AI决策-${this.name}`);
    }
  };
}

// 4. 注入 GameEventHandler.dealInitialTiles，发牌流程耗时
const origDealInitialTiles = GameEventHandler.prototype.dealInitialTiles;
GameEventHandler.prototype.dealInitialTiles = function(...args) {
  perfMonitor.mark('发牌流程');
  try {
    return origDealInitialTiles.apply(this, args);
  } finally {
    perfMonitor.measure('发牌流程');
  }
};

// 5. 注入 GameEventHandler.drawTileForPlayer，摸牌耗时
const origDrawTileForPlayer = GameEventHandler.prototype.drawTileForPlayer;
GameEventHandler.prototype.drawTileForPlayer = function(player, options) {
  perfMonitor.mark(`摸牌-${player.name}`);
  try {
    return origDrawTileForPlayer.call(this, player, options);
  } finally {
    perfMonitor.measure(`摸牌-${player.name}`);
  }
};

// 6. 注入 savePerformanceLogToFile，日志写入耗时
import { savePerformanceLogToFile } from '../tools/logger';
const origSavePerfLog = savePerformanceLogToFile;
// @ts-ignore
(global as any).savePerformanceLogToFile = function(log: string) {
  perfMonitor.mark('日志写入');
  try {
    return origSavePerfLog.call(this, log);
  } finally {
    perfMonitor.measure('日志写入');
  }
};

// 7. monkey patch handleGameEnd，自动模式下最后一局输出总计
const origHandleGameEnd = GameEventHandler.prototype.handleGameEnd;
GameEventHandler.prototype.handleGameEnd = async function(...args: any[]) {
  perfMonitor.endGame();
  // debug输出当前局号和总局数
  debugLog(`[DEBUG] handleGameEnd: currentRound=${this.currentRound}, AUTO_PLAY_ROUNDS=${AUTO_PLAY_ROUNDS}`);
  // 判断是否为自动模式最后一局
  if (AUTO_PLAY_MODE) {
    if (this.currentRound >= AUTO_PLAY_ROUNDS) {
      perfMonitor.safePrintStats(true); // 输出总计
    } else {
      perfMonitor.safePrintStats(false); // 只输出本局
    }
  } else {
    // 人工模式下，只有退出时才输出总计
    // 这里无法直接判断是否退出，但 safePrintStats(true) 多次调用也有保护
    perfMonitor.safePrintStats(true);
  }
  // @ts-ignore
  return await origHandleGameEnd.apply(this, args);
};

// 删除自动调用 startGame 和 handleGameEnd 的 monkey patch 
// ... existing code ... 