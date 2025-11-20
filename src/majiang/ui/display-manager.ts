import { Style, groupTilesByType, TileTypeNames, TileTypeOrder, analyzeHand, formatTileSet } from '../ui/display';
import { Player } from '../core/player';
import { Tile, sortTiles } from '../core/tile';
import { GameState } from '../core/game';
import { Game } from '../core/game';
import { infoLog, warnLog, errorLog } from '../tools/logger';
import { TileSet } from '../core/rule-types';

/**
 * DisplayManager类 - 负责处理所有UI相关的打印功能
 * 所有UI输出应该通过这个类进行，以保持一致性
 */
export class DisplayManager {
  private static instance: DisplayManager;
  
  // 回合日志记录
  private turnLogs: string[] = [];
  
  /**
   * 获取DisplayManager的单例实例
   */
  public static getInstance(): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }
  
  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {}
  
  //=== 基础UI输出方法 ===
  
  /**
   * 打印普通消息
   * @param message 要显示的消息
   * @param logToFile 是否同时记录到日志文件
   */
  public print(message: string, logToFile: boolean = true): void {
    console.log(message);
    if (logToFile) {
      infoLog(message);
    }
  }
  
  /**
   * 打印带颜色的消息
   * @param message 要显示的消息
   * @param style 应用的样式（来自Style枚举）
   * @param logToFile 是否同时记录到日志文件
   */
  public printColored(message: string, style: string, logToFile: boolean = true): void {
    console.log(`${style}${message}${Style.RESET}`);
    if (logToFile) {
      infoLog(message);
    }
  }
  
  /**
   * 打印标题（带有装饰性边框）
   * @param title 标题文本
   * @param logToFile 是否同时记录到日志文件
   */
  public printTitle(title: string, logToFile: boolean = true): void {
    const separator = '='.repeat(title.length + 4);
    console.log(`\n${Style.BOLD}${separator}${Style.RESET}`);
    console.log(`${Style.BOLD}= ${title} =${Style.RESET}`);
    console.log(`${Style.BOLD}${separator}${Style.RESET}\n`);
    
    if (logToFile) {
      infoLog(`=== ${title} ===`);
    }
  }
  
  /**
   * 打印分隔线
   * @param char 分隔线字符，默认为'-'
   * @param length 分隔线长度，默认为50
   * @param logToFile 是否同时记录到日志文件
   */
  public printDivider(char: string = '-', length: number = 50, logToFile: boolean = true): void {
    const divider = `\n${char.repeat(length)}\n`;
    this.print(divider);
    
    if (logToFile) {
      infoLog(divider);
    }
  }
  
  //=== 特殊消息类型 ===
  
  /**
   * 打印提示消息
   * @param message 提示消息
   * @param logToFile 是否同时记录到日志文件
   */
  public printPrompt(message: string, logToFile: boolean = true): void {
    console.log(`${Style.CYAN}> ${message}${Style.RESET}`);
    if (logToFile) {
      infoLog(`提示: ${message}`);
    }
  }
  
  /**
   * 打印操作提示消息
   * @param message 提示消息
   * @param logToFile 是否同时记录到日志文件
   */
  public printActionPrompt(message: string, logToFile: boolean = true): void {
    this.print('');
    this.printColored(`➤ ${message}`, Style.CYAN);
    
    if (logToFile) {
      infoLog(`操作提示: ${message}`);
    }
  }
  
  /**
   * 打印错误消息
   * @param message 错误消息
   * @param logToFile 是否记录到日志文件
   */
  public printError(message: string, logToFile: boolean = true): void {
    console.log(`${Style.RED}错误: ${message}${Style.RESET}`);
    if (logToFile) {
      errorLog(message);
    }
  }
  
  /**
   * 打印警告消息
   * @param message 警告消息
   * @param logToFile 是否记录到日志文件
   */
  public printWarning(message: string, logToFile: boolean = true): void {
    console.log(`${Style.YELLOW}警告: ${message}${Style.RESET}`);
    if (logToFile) {
      warnLog(message);
    }
  }
  
  /**
   * 打印成功消息
   * @param message 成功消息
   * @param logToFile 是否记录到日志文件
   */
  public printSuccess(message: string, logToFile: boolean = true): void {
    console.log(`${Style.GREEN}✓ ${message}${Style.RESET}`);
    if (logToFile) {
      infoLog(message);
    }
  }
  
  /**
   * 显示重要事件信息
   * @param message 事件消息
   * @param logToFile 是否记录到日志文件
   */
  public displayImportantEvent(message: string, logToFile: boolean = true): void {
    console.log(`${Style.BOLD}${Style.YELLOW}>>> ${message} <<<${Style.RESET}`);
    if (logToFile) {
      infoLog(`[重要事件] ${message}`);
    }
  }
  
  //=== 回合日志管理 ===
  
  /**
   * 添加回合日志
   * @param message 日志消息
   */
  public addToTurnLog(message: string): void {
    this.turnLogs.push(message);
    
    // 同时记录到主日志中
    infoLog(message);
  }
  
  /**
   * 显示回合日志
   */
  public displayTurnLog(): void {
    if (this.turnLogs.length === 0) {
      return;
    }
    
    console.log(`\n${Style.BOLD}==== 回合记录 =====${Style.RESET}`);
    this.turnLogs.forEach((logEntry, index) => {
      console.log(`${index + 1}. ${logEntry}`);
    });
    console.log(`${Style.BOLD}=================\n${Style.RESET}`);
  }
  
  /**
   * 获取当前记录的回合日志
   * @returns 回合日志数组
   */
  public getTurnLogs(): string[] {
    return [...this.turnLogs]; // 返回副本以避免外部修改
  }
  
  /**
   * 清空回合日志
   */
  public clearTurnLog(): void {
    this.turnLogs = [];
  }
  
  //=== 游戏状态显示方法 ===
  
  /**
   * 打印调试消息
   */
  public printDebug(message: string, logToFile: boolean = true): void {
    this.printColored(message, Style.DIM, logToFile);
  }
  /**
   * 打印信息消息
   */
  public printInfo(message: string, logToFile: boolean = true): void {
    this.printColored(message, Style.RESET, logToFile);
  }
  
  /**
   * 显示玩家手牌（详细版）
   * @param player 玩家对象
   * @param showIndices 是否显示索引
   * @param logToFile 是否记录到日志文件
   */
  public displayPlayerHand(player: Player, showIndices: boolean = false, logToFile: boolean = true): void {
    const revealedTiles = player.revealedSets.flatMap(set => set.tiles);
    // 显示得到的牌（如果存在）
    if (player.lastDrawnTile) {
      this.printColored(`\n${player.name}得到的牌: ${player.lastDrawnTile.toString()}`, Style.BOLD + Style.YELLOW);
    }

    this.printColored(`\n${player.name}的手牌（${player.handTiles.length}张）: ${player.handTiles.map(t => t.toString()).join(' ')}`, Style.BOLD + Style.CYAN);
    this.print(`\n已亮出的手牌（${revealedTiles.length}张）: ${revealedTiles.join(' ')}`);
    this.print(`\n杠牌副数（${player.getGangCount()}副）`);

    // const tilesByType = groupTilesByType(player.handTiles);
    // for (const type of TileTypeOrder) {
    //   const typeString = type as string;
    //   const tiles = tilesByType.get(typeString);
    //   if (tiles && tiles.length > 0) {
    //     const sortedTiles = sortTiles(tiles);
    //     this.printColored(`${TileTypeNames[typeString]}: ${sortedTiles.map((tile, index) => {
    //       const isLastDrawn = player.lastDrawnTile && tile.id === player.lastDrawnTile.id;
    //       const displayIndex = player.handTiles.indexOf(tile) + 1;
    //       if (isLastDrawn) {
    //         return `${showIndices ? displayIndex + ':' : ''}${Style.BOLD}${Style.YELLOW}${tile.toString()}${Style.RESET}`;
    //       }
    //       return `${showIndices ? displayIndex + ':' : ''}${tile.toString()}`;
    //     }).join(' ')}`, Style.BOLD);
    //   }
    // }
  }
  
  /**
   * 显示玩家手牌（简版）
   * @param player 玩家对象
   * @param showIndices 是否显示索引
   * @param highlightLast 是否高亮最后一张牌
   * @param logToFile 是否同时记录到日志文件
   */
  public displayHand(player: Player, showIndices: boolean = false, highlightLast: boolean = false, logToFile: boolean = true): void {
    const handTiles = player.handTiles;
    if (handTiles.length === 0) {
      this.print(`${player.name}的手牌（0张）: 无`, logToFile);
      return;
    }
    let handDisplay = `${player.name}的手牌（${handTiles.length}张）: `;
    handTiles.forEach((tile: Tile, index: number) => {
      let tileDisplay = tile.toString();
      if (highlightLast && index === handTiles.length - 1) {
        tileDisplay = `${Style.YELLOW}${tileDisplay}${Style.RESET}`;
      }
      if (showIndices) {
        handDisplay += `[${index}]${tileDisplay} `;
      } else {
        handDisplay += `${tileDisplay} `;
      }
    });
    this.print(handDisplay);
    if (logToFile) {
      const logHandDisplay = `${player.name}的手牌: ${handTiles.map(t => t.toString()).join(' ')}`;
      infoLog(logHandDisplay);
    }
  }
  
  /**
   * 显示玩家弃牌
   * @param player 玩家对象
   * @param logToFile 是否同时记录到日志文件
   */
  public displayDiscardedTiles(player: Player, logToFile: boolean = true): void {
    const discardedTiles = player.discardedTiles;
    if (discardedTiles.length === 0) {
      this.print(`${player.name}的弃牌（0张）: 无`, logToFile);
      return;
    }
    let discardDisplay = `${player.name}的弃牌（${discardedTiles.length}张）: `;
    discardDisplay += discardedTiles.map((tile: Tile) => tile.toString()).join(' ');
    this.print(discardDisplay, logToFile);
  }
  
  /**
   * 显示玩家副露（鸣牌）
   * @param player 玩家对象
   * @param logToFile 是否记录到日志文件
   */
  public displayPlayerMelds(player: Player, logToFile: boolean = true): void {
    if (player.revealedSets.length === 0) {
      return;
    }
    this.print(`${player.name}的副露（${player.revealedSets.length}组）:`);
    player.revealedSets.forEach((set: TileSet) => {
      const setDisplay = formatTileSet(set);
      this.print(`  ${setDisplay}`);
      if (logToFile) {
        infoLog(`${player.name}的副露（${player.revealedSets.length}组）: ${setDisplay}`);
      }
    });
    this.print('');
  }
  
  /**
   * 显示AI玩家行动
   * @param player 玩家对象
   * @param action 行动描述
   * @param logToFile 是否记录到日志文件
   */
  public displayAIAction(player: Player, action: string, logToFile: boolean = true): void {
    this.printColored(`AI玩家 ${player.name} ${action}`, Style.CYAN + Style.BOLD);
    if (logToFile) {
      infoLog(`AI玩家 ${player.name} ${action}`);
      this.addToTurnLog(`AI玩家 ${player.name} ${action}`);
    }
  }
  
  /**
   * 显示AI思考过程
   * @param player 玩家对象
   * @param handDescription 手牌描述
   */
  public displayAIThinking(player: Player, handDescription: string): void {
    this.printColored(`AI玩家 ${player.name} 思考中: ${handDescription}`, Style.DIM);
  }
  
  /**
   * 显示AI手牌分析
   * @param player 玩家对象
   */
  public displayHandAnalysis(player: Player): void {
    const analysis = analyzeHand(player);
    if (analysis.length === 0) {
      return;
    }
    this.printTitle('手牌分析');
    analysis.forEach(line => this.print(line));
  }
  
  /**
   * 显示玩家操作选项
   * @param player 玩家对象
   */
  public displayActionPrompt(player: Player): void {
    this.printTitle(`${player.name}，请选择操作:`);
    this.print('1. 摸牌');
    this.print('2. 吃');
    this.print('3. 碰');
    this.print('4. 杠');
    this.print('5. 胡');
    this.print('q. 退出游戏');
    this.print('请输入选项:');
  }
  
  /**
   * 显示游戏完整状态
   * @param game 游戏对象
   * @param logToTurnLog 是否记录到回合日志
   */
  public displayFullGameState(game: Game, logToTurnLog: boolean = false): void {
    infoLog('=== 完整游戏状态 ===');
    const stateInfo = [
      `当前玩家: ${game.getAllPlayers()[game.currentPlayerIndex].name}`,
      `游戏阶段: ${game.state}`,
      `剩余牌数: ${game.getRemainingTiles()}`,
      `摸牌次数: ${game.drawCount}`,
      `上次打出的牌: ${game.lastDiscardedTile ? game.lastDiscardedTile.toString() : '无'}`
    ];
    stateInfo.forEach(info => {
      infoLog(info);
      if (logToTurnLog) {
        this.addToTurnLog(info);
      }
    });

    // 显示每个玩家的信息
    game.getAllPlayers().forEach(player => {
      infoLog(`${player.name}的手牌（${player.handTiles.length}张）: ${player.handTiles.map(t => t.toString()).join(' ')}`);
      if (player.revealedSets.length > 0) {
        infoLog(`${player.name}的副露（${player.revealedSets.length}组）: ${player.revealedSets.map(set => set.tiles.map(t => t.toString()).join(',')).join(' | ')}`);
      }
      if (player.discardedTiles.length > 0) {
        infoLog(`${player.name}的弃牌（${player.discardedTiles.length}张）: ${player.discardedTiles.map(t => t.toString()).join(' ')}`);
      }
    });
    infoLog('========================');
  }
  
  /**
   * 显示游戏状态信息（简版）
   * @param currentPlayerName 当前玩家名称
   * @param remainingTiles 剩余牌数
   * @param lastDiscardedTile 最后打出的牌
   * @param gameState 游戏状态
   * @param logToTurnLog 是否记录到回合日志
   */
  public displayGameState(
    currentPlayerName: string, 
    remainingTiles: number, 
    lastDiscardedTile: Tile | null,
    gameState: GameState,
    logToTurnLog: boolean = false
  ): void {
    this.printTitle('游戏状态');
    
    const stateInfo = [
      `当前玩家: ${currentPlayerName}`,
      `剩余牌数: ${remainingTiles}`,
      `游戏状态: ${gameState}`,
      `上次打出的牌: ${lastDiscardedTile ? lastDiscardedTile.toString() : '无'}`
    ];
    
    stateInfo.forEach(info => {
      this.print(info, true);
      if (logToTurnLog) {
        this.addToTurnLog(info);
      }
    });
  }
}

// 导出单例实例，方便使用
export const displayManager = DisplayManager.getInstance(); 