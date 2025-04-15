import { Game, GameState } from './game';
import { PlayerState } from './player';
import { saveGameLogToFile, infoLog, warnLog, errorLog } from './logger';
import { askQuestion } from './input';
import { displayManager } from './display-manager';
import { InputState } from './input';

/**
 * 生成游戏状态哈希，用于检测循环
 */
export function generateGameStateHash(game: Game): string {
  const parts = [];
  
  // 当前玩家和状态
  parts.push(`P${game.currentPlayerIndex}S${game.state}`);
  
  // 玩家手牌状态 - 使用更加稳定的表示方法：按牌型分类并计数
  for (const player of game.getAllPlayers()) {
    // 创建一个映射来统计每种牌的数量
    const tileCounts = new Map<string, number>();
    for (const tile of player.handTiles) {
      const tileKey = tile.toString();
      tileCounts.set(tileKey, (tileCounts.get(tileKey) || 0) + 1);
    }
    
    // 将统计结果转换为排序后的字符串
    const handStatus = Array.from(tileCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tile, count]) => `${tile}x${count}`)
      .join(',');
    
    parts.push(`${player.id}:${handStatus}`);
  }
  
  // 最后打出的牌
  if (game.lastDiscardedTile) {
    parts.push(`L:${game.lastDiscardedTile.toString()}`);
  }
  
  // 添加更多游戏状态指标以提高检测准确性
  parts.push(`D${game.drawCount}`); // 摸牌次数
  parts.push(`R${game.remainingTiles}`); // 剩余牌数
  
  return parts.join('|');
}

/**
 * 检查游戏状态健康度
 */
export function checkGameStateHealth(game: Game): boolean {
  try {
    // 检查玩家数量
    const players = game.getAllPlayers();
    if (players.length < 4) {
      warnLog(`玩家数量不足，当前只有${players.length}个玩家`);
      return false;
    }
    
    // 检查当前玩家索引
    const currentPlayerIndex = game.currentPlayerIndex;
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
      warnLog(`当前玩家索引无效: ${currentPlayerIndex}`);
      return false;
    }
    
    // 检查处于ACTING状态的玩家数量
    const actingPlayers = players.filter(p => p.state === PlayerState.ACTING);
    if (actingPlayers.length !== 1) {
      warnLog(`ACTING状态的玩家数量异常: ${actingPlayers.length}，应为1`);
      return false;
    }
    
    // 检查手牌数量一致性
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const handSize = player.handTiles.length;
      
      // 修改这里：活动玩家可以有13或14张牌（游戏刚开始可能还没摸牌）
      if (player.state === PlayerState.ACTING) {
        if (handSize !== 13 && handSize !== 14) {
          warnLog(`活动玩家 ${player.name} 手牌数量异常: ${handSize}, 预期: 13或14`);
          return false;
        }
      } else {
        // 非活动玩家必须有13张牌
        if (handSize !== 13) {
          warnLog(`非活动玩家 ${player.name} 手牌数量异常: ${handSize}, 预期: 13`);
          return false;
        }
      }
    }
    
    // 如果没有任何异常情况，则认为健康状态良好
    infoLog(`游戏状态健康检查通过`);
    return true;
  } catch (error) {
    errorLog(`游戏状态健康检查发生错误: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * 恢复游戏状态至健康状态
 */
export async function recoverGameState(game: Game): Promise<boolean> {
  infoLog("开始恢复游戏状态...");
  const players = game.getAllPlayers();
  let recoverySuccessful = true;
  
  try {
    // 步骤1: 确保当前玩家索引有效
    if (game.currentPlayerIndex < 0 || game.currentPlayerIndex >= players.length) {
      infoLog(`修复: 重置当前玩家索引为0`);
      game.setCurrentPlayerIndex(0);
    }
    
    // 步骤2: 确保只有一个玩家处于ACTING状态，其他玩家处于WAITING状态
    let actingPlayersCount = 0;
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const shouldBeActing = i === game.currentPlayerIndex;
      
      if (shouldBeActing) {
        if (player.state !== PlayerState.ACTING) {
          infoLog(`修复: 将玩家 ${player.name} 状态设置为 ACTING`);
          player.state = PlayerState.ACTING;
        }
        actingPlayersCount++;
      } else if (player.state !== PlayerState.WAITING) {
        infoLog(`修复: 将玩家 ${player.name} 状态设置为 WAITING`);
        player.state = PlayerState.WAITING;
      }
    }
    
    // 如果没有玩家处于ACTING状态，强制将当前玩家设为ACTING
    if (actingPlayersCount === 0) {
      const currentPlayer = game.getCurrentPlayer();
      infoLog(`修复: 将当前玩家 ${currentPlayer.name} 状态设置为 ACTING`);
      currentPlayer.state = PlayerState.ACTING;
    }
    
    // 步骤3: 调整玩家手牌数量
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const isCurrentPlayer = i === game.currentPlayerIndex;
      const expectedTiles = isCurrentPlayer && player.state === PlayerState.ACTING ? 14 : 13;
      
      // 确保手牌一致性
      player.verifyHandConsistency();
      
      if (player.handTiles.length < expectedTiles) {
        // 需要补充手牌
        infoLog(`修复: 玩家 ${player.name} 手牌不足，当前: ${player.handTiles.length}, 预期: ${expectedTiles}`);
        
        // 记录详细手牌信息以便排查根本原因
        infoLog(`详细手牌信息: ${player.handTiles.map(t => t.toString()).join(', ')}`);
        saveGameLogToFile(game, `玩家${player.name}手牌不足-${player.handTiles.length}`);
        
        // 尝试从牌山补充
        const cardsNeeded = expectedTiles - player.handTiles.length;
        
        for (let j = 0; j < cardsNeeded; j++) {
          if (game.remainingTiles > 0) {
            const tile = game.drawTileForPlayer(player);
            if (tile) {
              infoLog(`补充手牌: ${tile.toString()}`);
            } else {
              warnLog(`无法从牌山补充手牌，牌山可能已空`);
              recoverySuccessful = false;
              break;
            }
          } else {
            // 牌山已空，记录详细信息
            warnLog(`牌山已空，无法补充手牌到正确数量`);
            warnLog(`分析手牌异常原因:`);
            warnLog(`1. 当前游戏状态: ${GameState[game.state]}`);
            warnLog(`2. 当前玩家索引: ${game.currentPlayerIndex}, 玩家: ${game.getCurrentPlayer().name}`);
            warnLog(`3. 牌山情况: 总牌数=${game.getTotalTiles()}, 剩余牌数=${game.remainingTiles}`);
            warnLog(`4. 所有玩家手牌统计:`);
            
            let totalHandTiles = 0;
            let totalDiscardedTiles = 0;
            let totalRevealedTiles = 0;
            
            for (const p of players) {
              warnLog(`   - 玩家 ${p.name}: 手牌=${p.handTiles.length}, 弃牌=${p.discardedTiles.length}, 亮出=${p.revealedSets.reduce((count, set) => count + set.tiles.length, 0)}`);
              totalHandTiles += p.handTiles.length;
              totalDiscardedTiles += p.discardedTiles.length;
              totalRevealedTiles += p.revealedSets.reduce((count, set) => count + set.tiles.length, 0);
            }
            
            warnLog(`5. 牌总数统计: 手牌=${totalHandTiles}, 弃牌=${totalDiscardedTiles}, 亮出=${totalRevealedTiles}, 牌山=${game.remainingTiles}, 总计=${totalHandTiles + totalDiscardedTiles + totalRevealedTiles + game.remainingTiles}`);
            warnLog(`6. 理论总牌数应为: 136`);
            
            // 记录更详细的信息到游戏日志
            saveGameLogToFile(game, "手牌数量异常-牌山耗尽");
            
            // 由于无法补充正确数量的牌，恢复失败
            recoverySuccessful = false;
            break;
          }
        }
      } else if (player.handTiles.length > expectedTiles) {
        // 需要减少手牌
        infoLog(`修复: 玩家 ${player.name} 手牌过多，当前: ${player.handTiles.length}, 预期: ${expectedTiles}`);
        
        // 记录详细手牌信息以便排查原因
        infoLog(`详细手牌信息: ${player.handTiles.map(t => t.toString()).join(', ')}`);
        saveGameLogToFile(game, `玩家${player.name}手牌过多-${player.handTiles.length}`);
        
        const excessCards = player.handTiles.length - expectedTiles;
        for (let j = 0; j < excessCards; j++) {
          try {
            // 从手牌末尾移除多余的牌
            const discarded = player.discardTile(player.handTiles.length - 1);
            if (discarded) {
              infoLog(`移除多余手牌: ${discarded.toString()}`);
            } else {
              warnLog(`无法移除多余手牌`);
              recoverySuccessful = false;
              break;
            }
          } catch (error) {
            errorLog(`移除多余手牌时出错: ${error instanceof Error ? error.message : String(error)}`);
            recoverySuccessful = false;
            break;
          }
        }
      }
    }
    
    // 步骤4: 确保当前玩家可以行动
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.state !== PlayerState.ACTING) {
      infoLog(`修复: 将当前玩家 ${currentPlayer.name} 状态设置为 ACTING`);
      currentPlayer.state = PlayerState.ACTING;
    }
    
    return recoverySuccessful;
  } catch (error) {
    errorLog(`恢复游戏状态时发生错误: ${error instanceof Error ? error.message : String(error)}`);
    errorLog(`错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`);
    return false;
  }
}

/**
 * 处理健康检查失败
 */
export async function handleHealthCheckFailure(game: Game, gameLoopInterval: NodeJS.Timeout | null): Promise<boolean> {
  try {
    errorLog("游戏状态健康检查失败，保存日志并结束游戏");
    displayManager.printError("游戏状态健康检查失败，保存日志并结束游戏");
    
    // 保存游戏日志
    await saveGameLogToFile(game, "健康检查失败");

    // 询问用户是否要结束游戏
    const shouldExit = await askQuestion("游戏状态错误，是否结束游戏？(y/n)，默认结束", 10000);
    
    if (shouldExit.toLowerCase() !== 'n') {
      // 清理游戏循环
      if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
      }
      
      // 结束游戏
      errorLog("游戏结束，进程退出");
      displayManager.printError("游戏结束，进程退出");
      process.exit(1);
    } else {
      // 用户选择继续，尝试恢复游戏状态
      return await recoverGameState(game);
    }
  } catch (error) {
    // 确保程序不会崩溃
    errorLog(`处理健康检查失败时出错: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  
  return false;
}

/**
 * 检测游戏状态是否循环
 */
export function detectStateLoop(lastStates: string[], currentState: string, maxRepeatThreshold: number): {isLoop: boolean, repeatedState: string} {
  // 如果正在等待用户输入，不执行循环检测
  if (InputState.isWaitingForUserInput) {
    return {
      isLoop: false,
      repeatedState: ""
    };
  }

  // 添加到历史状态
  lastStates.push(currentState);
  if (lastStates.length > maxRepeatThreshold * 2) {
    lastStates.shift();
  }
  
  // 检查循环 - 循环检测算法
  if (lastStates.length >= maxRepeatThreshold) {
    // 对历史状态进行统计和分析
    const stateCounts = new Map<string, number>();
    
    for (const state of lastStates) {
      const count = stateCounts.get(state) || 0;
      stateCounts.set(state, count + 1);
    }
    
    // 计算重复状态的比例
    let maxRepeat = 0;
    let mostFrequentState = "";
    
    stateCounts.forEach((count, state) => {
      if (count > maxRepeat) {
        maxRepeat = count;
        mostFrequentState = state;
      }
    });
    
    // 如果某个状态重复次数超过阈值，认为游戏可能卡死
    const repeatThreshold = maxRepeatThreshold * 0.5; // 50%的重复率视为卡死
    
    if (maxRepeat > repeatThreshold) {
      return {
        isLoop: true,
        repeatedState: mostFrequentState
      };
    }
  }
  
  return {
    isLoop: false,
    repeatedState: ""
  };
} 