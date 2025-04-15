import { Game } from './game';
import { PlayerState, PlayerType } from './player';
import { Style } from './display';
import { saveGameLogToFile, infoLog, warnLog } from './logger';
import { askQuestion } from './input';
import { displayManager } from './display-manager';

/**
 * 处理牌山为空的情况
 */
export async function handleEmptyTileDeck(game: Game): Promise<boolean> {
  infoLog(`牌山已空，结算当前牌局`);
  displayManager.printTitle(`牌山已空，结算当前牌局`);
  
  // 显示所有玩家的手牌和得分
  displayManager.printTitle(`牌局结算`);
  const players = game.getAllPlayers();
  
  // 去掉计算得分的逻辑，直接显示每个玩家的当前得分和手牌
  for (const player of players) {
    displayManager.printColored(`${player.name}: ${player.score}分`, Style.BOLD);
    displayManager.print(`手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
    displayManager.print(`打出的牌: ${player.discardedTiles.map(t => t.toString()).join(' ')}`);
    displayManager.print(``);
  }
  
  // 保存游戏日志
  saveGameLogToFile(game, "牌山已空，游戏结束");
  
  // 询问是否继续新的一局
  displayManager.printColored(`\n是否开始新的一局? (y/n) [5秒内未回答默认为否]`, Style.YELLOW);
  
  // 获取用户输入，5秒超时，使用异步readline
  const answer = await askQuestion("", 5000);
  
  // 处理用户选择
  if (answer.toLowerCase() === 'y') {
    infoLog(`准备开始新的一局...`);
    displayManager.printSuccess(`准备开始新的一局...`);
    game.startGame(); // 重新开始游戏
    return true; // 继续新的一局
  } else {
    infoLog(`游戏结束，玩家选择不继续`);
    displayManager.printError(`游戏结束，感谢您的参与!`);
    return false; // 不继续，结束游戏
  }
}

/**
 * 确保玩家手牌数量正确
 */
export function ensureCorrectHandSizes(game: Game): boolean {
  const players = game.getAllPlayers();
  let allCorrect = true;
  
  for (const player of players) {
    // 确保手牌一致性
    player.verifyHandConsistency();
    
    const isCurrentPlayer = player.id === game.currentPlayerIndex;
    const expectedSize = isCurrentPlayer && player.state === PlayerState.ACTING ? 14 : 13;
    
    if (player.handTiles.length !== expectedSize) {
      warnLog(`检测到玩家 ${player.name} 手牌数量不正确，当前: ${player.handTiles.length}, 预期: ${expectedSize}`);
      allCorrect = false;
      
      // 移除修复逻辑，直接报错并通知
      displayManager.printError(`严重错误: 玩家 ${player.name} 手牌数量不正确 (${player.handTiles.length}/${expectedSize})，游戏无法继续`);
      infoLog(`游戏即将退出，请检查程序逻辑`);
      
      // 在实际应用中，这里可以添加退出程序的代码
      // 如 process.exit(1);
    }
  }
  
  return allCorrect;
}

/**
 * 处理游戏启动时的初始化工作
 */
export function prepareGameStart(game: Game): void {
  infoLog(`准备游戏启动...`);
  
  // 确保所有玩家手牌正确
  ensureCorrectHandSizes(game);
  
  // 确保当前玩家状态为ACTING，其他玩家为WAITING
  const players = game.getAllPlayers();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (i === game.currentPlayerIndex) {
      if (player.state !== PlayerState.ACTING) {
        infoLog(`将当前玩家 ${player.name} 状态设置为 ACTING`);
        player.state = PlayerState.ACTING;
      }
    } else {
      if (player.state !== PlayerState.WAITING) {
        infoLog(`将玩家 ${player.name} 状态设置为 WAITING`);
        player.state = PlayerState.WAITING;
      }
    }
  }
  
  // 如果有AI玩家手牌超过13张，强制其出牌
  for (const player of players) {
    if (player.type === PlayerType.AI && player.handTiles.length > 13) {
      warnLog(`检测到AI玩家 ${player.name} 手牌数量为 ${player.handTiles.length}，需要出牌`);
      // 这里不直接调用handleAIDiscard，因为那需要异步处理
      // 而是标记一个需要处理的状态，在游戏循环中处理
      infoLog(`已标记AI玩家 ${player.name} 需要在游戏开始时出牌`);
    }
  }
  
  infoLog(`游戏准备就绪`);
} 