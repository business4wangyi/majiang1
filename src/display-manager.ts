import { Style, groupTilesByType, TileTypeNames, TileTypeOrder, analyzeHand, formatTileSet } from './display';
import { Player } from './player';
import { Tile, sortTiles } from './tile';
import { GameState } from './game';
import { Game } from './game';
import { infoLog, warnLog, errorLog } from './logger';
import { TileSet } from './rule-types';

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
  public print(message: string, logToFile: boolean = false): void {
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
  public printColored(message: string, style: string, logToFile: boolean = false): void {
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
  public printTitle(title: string, logToFile: boolean = false): void {
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
  public printDivider(char: string = '-', length: number = 50, logToFile: boolean = false): void {
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
  public printPrompt(message: string, logToFile: boolean = false): void {
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
  public printActionPrompt(message: string, logToFile: boolean = false): void {
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
   * 显示玩家手牌（详细版）
   * @param player 玩家对象
   * @param showIndices 是否显示索引
   * @param logToFile 是否记录到日志文件
   */
  public displayPlayerHand(player: Player, showIndices: boolean = false, logToFile: boolean = false): void {
    console.log(`\n${Style.BOLD}${Style.CYAN}${player.name}的手牌:${Style.RESET}`);
    
    // 使用display.ts中的函数按类型分组
    const tilesByType = groupTilesByType(player.handTiles);
    
    // 按照类型顺序显示牌
    for (const type of TileTypeOrder) {
      const typeString = type as string;
      const tiles = tilesByType.get(typeString);
      if (tiles && tiles.length > 0) {
        const sortedTiles = sortTiles(tiles);
        
        console.log(`${Style.BOLD}${TileTypeNames[typeString]}:${Style.RESET} ${
          sortedTiles.map((tile, index) => {
            const isLastDrawn = player.lastDrawnTile && tile.id === player.lastDrawnTile.id;
            const displayIndex = player.handTiles.indexOf(tile) + 1;
            if (isLastDrawn) {
              return `${showIndices ? displayIndex + ':' : ''}${Style.BOLD}${Style.YELLOW}${tile.toString()}${Style.RESET}`;
            }
            return `${showIndices ? displayIndex + ':' : ''}${tile.toString()}`;
          }).join(' ')
        }`);
      }
    }
    
    // 显示最后摸到的牌（如果存在）
    if (player.lastDrawnTile) {
      console.log(`\n${Style.BOLD}${Style.YELLOW}最后摸到的牌: ${player.lastDrawnTile.toString()}${Style.RESET}`);
    }
    
    console.log('');
    
    if (logToFile) {
      // 记录无样式的版本到日志
      infoLog(`${player.name}的手牌: ${player.handTiles.map(t => t.toString()).join(' ')}`);
      if (player.lastDrawnTile) {
        infoLog(`最后摸到的牌: ${player.lastDrawnTile.toString()}`);
      }
    }
  }
  
  /**
   * 显示玩家手牌（简版）
   * @param player 玩家对象
   * @param showIndices 是否显示索引
   * @param highlightLast 是否高亮最后一张牌
   * @param logToFile 是否同时记录到日志文件
   */
  public displayHand(player: Player, showIndices: boolean = false, highlightLast: boolean = false, logToFile: boolean = false): void {
    const handTiles = player.handTiles;
    
    if (handTiles.length === 0) {
      this.print(`${player.name}的手牌: 无`, logToFile);
      return;
    }
    
    let handDisplay = `${player.name}的手牌: `;
    
    handTiles.forEach((tile: Tile, index: number) => {
      let tileDisplay = tile.toString();
      
      // 为最后一张牌添加高亮（如果指定）
      if (highlightLast && index === handTiles.length - 1) {
        tileDisplay = `${Style.YELLOW}${tileDisplay}${Style.RESET}`;
      }
      
      // 添加索引（如果指定）
      if (showIndices) {
        handDisplay += `[${index}]${tileDisplay} `;
      } else {
        handDisplay += `${tileDisplay} `;
      }
    });
    
    this.print(handDisplay);
    
    if (logToFile) {
      // 记录无样式的版本到日志
      const logHandDisplay = `${player.name}的手牌: ${handTiles.map(t => t.toString()).join(' ')}`;
      infoLog(logHandDisplay);
    }
  }
  
  /**
   * 显示玩家弃牌
   * @param player 玩家对象
   * @param logToFile 是否同时记录到日志文件
   */
  public displayDiscardedTiles(player: Player, logToFile: boolean = false): void {
    const discardedTiles = player.discardedTiles;
    
    if (discardedTiles.length === 0) {
      this.print(`${player.name}的弃牌: 无`, logToFile);
      return;
    }
    
    let discardDisplay = `${player.name}的弃牌: `;
    discardDisplay += discardedTiles.map((tile: Tile) => tile.toString()).join(' ');
    
    this.print(discardDisplay, logToFile);
  }
  
  /**
   * 显示玩家副露（鸣牌）
   * @param player 玩家对象
   * @param logToFile 是否记录到日志文件
   */
  public displayPlayerMelds(player: Player, logToFile: boolean = false): void {
    if (player.revealedSets.length === 0) {
      return;
    }
    
    this.print(`${player.name}的副露:`);
    
    player.revealedSets.forEach((set: TileSet) => {
      const setDisplay = formatTileSet(set);
      this.print(`  ${setDisplay}`);
      
      if (logToFile) {
        infoLog(`${player.name}的副露: ${setDisplay}`);
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
    console.log(`${Style.CYAN}${Style.BOLD}AI玩家 ${player.name} ${action}${Style.RESET}`);
    
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
    console.log(`${Style.DIM}AI玩家 ${player.name} 思考中: ${handDescription}${Style.RESET}`);
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
    
    this.print(`\n${player.name}的手牌分析:`);
    analysis.forEach(item => {
      this.print(`  - ${item}`);
    });
    this.print('');
  }
  
  /**
   * 显示玩家操作选项
   * @param player 玩家对象
   */
  public displayActionPrompt(player: Player): void {
    console.log(`\n${player.name}，请选择操作:`);
    console.log('1. 摸牌');
    console.log('2. 吃');
    console.log('3. 碰');
    console.log('4. 杠');
    console.log('5. 胡');
    console.log('q. 退出游戏');
    console.log('请输入选项:');
  }
  
  /**
   * 显示游戏完整状态
   * @param game 游戏对象
   * @param logToTurnLog 是否记录到回合日志
   */
  public displayFullGameState(game: Game, logToTurnLog: boolean = false): void {
    this.printTitle('游戏状态', true);
    
    const stateInfo = [
      `当前玩家: ${game.getAllPlayers()[game.currentPlayerIndex].name}`,
      `游戏阶段: ${game.state}`,
      `剩余牌数: ${game.getRemainingTiles()}`,
      `摸牌次数: ${game.drawCount}`,
      `最后打出的牌: ${game.lastDiscardedTile ? game.lastDiscardedTile.toString() : '无'}`
    ];
    
    stateInfo.forEach(info => {
      this.print(info, true);
      if (logToTurnLog) {
        this.addToTurnLog(info);
      }
    });
    
    this.print('');
    
    // 显示每个玩家的信息
    game.getAllPlayers().forEach(player => {
      this.displayHand(player, false, false, true);
      this.displayPlayerMelds(player, true);
      this.displayDiscardedTiles(player, true);
    });
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
    this.printTitle('游戏状态', true); // 总是记录到日志文件
    
    const stateInfo = [
      `当前玩家: ${currentPlayerName}`,
      `剩余牌数: ${remainingTiles}`,
      `游戏状态: ${gameState}`,
      `最后打出的牌: ${lastDiscardedTile ? lastDiscardedTile.toString() : '无'}`
    ];
    
    stateInfo.forEach(info => {
      this.print(info, true); // 总是记录到日志文件
      if (logToTurnLog) {
        this.addToTurnLog(info);
      }
    });
    
    this.print(''); // 空行
  }
}

// 导出单例实例，方便使用
export const displayManager = DisplayManager.getInstance(); 