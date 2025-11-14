/**
 * 强化学习自对弈训练系统
 * 基于深度根本原因分析，实施强化学习解决方案
 */

import * as tf from '@tensorflow/tfjs';
import { MajiangAlphaZeroNetworkTF } from '../../src/majiang/ai-alphazero/majiang-alphazero-network-tf';
import { MajiangStateEncoder } from '../../src/majiang/ai-alphazero/majiang-state-encoder';
import { MajiangActionDecoder, MajiangAction } from '../../src/majiang/ai-alphazero/majiang-action-decoder';
import { GameStateAdapter } from '../../src/majiang/ai-alphazero/types';
import { Game, GameState } from '../../src/majiang/game';
import { GameEventHandler } from '../../src/majiang/game-event-handler';
import { AIPlayer } from '../../src/majiang/ai-player';
import { Player, PlayerState } from '../../src/majiang/player';
import { TileManager } from '../../src/majiang/tile-manager';
import * as fs from 'fs';
import * as path from 'path';

interface SelfPlayExperience {
  state: Float32Array;
  actionProbabilities: Float32Array;
  gameResult: number; // -1, 0, 1 (输、平、赢)
  playerIndex: number;
  moveNumber: number;
  gameId: number;
}

interface MCTSNode {
  state: Float32Array;
  visits: number;
  totalValue: number;
  children: Map<number, MCTSNode>;
  parent: MCTSNode | null;
  action: number;
  priorProbability: number;
  isExpanded: boolean;
}

interface RLTrainingStats {
  selfPlayGames: number;
  totalExperiences: number;
  trainingIterations: number;
  averageGameLength: number;
  winRates: number[];
  networkUpdates: number;
  explorationRate: number;
  averageReward: number;
  startTime: number;
  // 训练监控数据（方案A优化）
  lossHistory: number[];
  rewardHistory: number[];
  confidenceHistory: number[];
  bestLoss: number;
  patience: number;
  noImprovementCount: number;
}

class ReinforcementLearningSelfPlay {
  private network: MajiangAlphaZeroNetworkTF;
  private experiences: SelfPlayExperience[] = [];
  private modelPath: string;
  private checkpointPath: string; // 检查点路径
  private stats: RLTrainingStats;
  private game: Game | null = null; // 真实游戏实例（方案A：完整集成）
  private gameEventHandler: GameEventHandler | null = null; // 游戏事件处理器（方案A：完整集成）
  private tileManager: TileManager; // 牌管理器（方案A：完整集成）
  private currentGameId: number = 0; // 当前游戏ID（用于优雅关闭）
  private isShuttingDown: boolean = false; // 关闭标志
  
  // 强化学习参数 - 优化版本（性能优化：批量前向传播+缓存）
  private readonly MCTS_SIMULATIONS = 180; // 从250减少到180（性能优化：减少28%，提升训练速度）
  private readonly EXPLORATION_CONSTANT = 1.4;
  private readonly INITIAL_TEMPERATURE = 1.0; // 初始温度
  private readonly FINAL_TEMPERATURE = 0.1; // 最终温度（方案A优化：温度衰减）
  private readonly EXPERIENCE_BUFFER_SIZE = 5000;
  private readonly TRAINING_BATCH_SIZE = 32;
  private readonly DISCOUNT_FACTOR = 0.99;
  private readonly TRAINING_PER_GAME = 2; // 每局游戏训练次数：从3次减少到2次（性能优化：减少33%，提升训练速度）
  private readonly MCTS_BATCH_SIZE = 32; // MCTS批量前向传播批次大小
  private readonly STATE_CACHE_SIZE = 10000; // 状态缓存大小
  private currentTemperature: number; // 当前温度（方案A优化：温度衰减）
  private stateCache: Map<string, { actionProbs: Float32Array; value: number }>; // 状态缓存

  constructor() {
    console.log('🎯 初始化强化学习自对弈训练系统...');
    this.stateCache = new Map();
    
    // 基于根本原因分析，增加网络容量（优化：调整网络结构）
    this.network = new MajiangAlphaZeroNetworkTF({
      hiddenLayers: [1024, 512, 256, 128], // 增加层数和神经元数量
      learningRate: 0.0008, // 优化：进一步提高初始学习率（从0.0005增加到0.0008，基于优秀奖励信号）
      batchSize: this.TRAINING_BATCH_SIZE,
      dropoutRate: 0.15 // 降低dropout以增加容量
    });
    
    this.modelPath = path.join(__dirname, '../../models/reinforcement-learning');
    this.checkpointPath = path.join(__dirname, '../../models/reinforcement-learning-checkpoint');
    this.ensureModelDirectory();
    this.ensureCheckpointDirectory();
    
    this.stats = {
      selfPlayGames: 0,
      totalExperiences: 0,
      trainingIterations: 0,
      averageGameLength: 0,
      winRates: [],
      networkUpdates: 0,
      explorationRate: 1.0,
      averageReward: 0,
      startTime: Date.now(),
      // 训练监控数据（方案A优化）
      lossHistory: [],
      rewardHistory: [],
      confidenceHistory: [],
      bestLoss: Infinity,
      patience: 30, // 优化：增加patience到30（对应10局游戏，更充分的观察窗口）
      noImprovementCount: 0
    };
    
    // 初始化温度（方案A优化：温度衰减）
    this.currentTemperature = this.INITIAL_TEMPERATURE;
    
    // 初始化真实游戏引擎（方案A：完整集成）
    this.tileManager = TileManager.getInstance();
    this.game = new Game();
    
    // 创建4个AI玩家
    const aiPlayers = [
      new AIPlayer('东家AI'),
      new AIPlayer('南家AI'),
      new AIPlayer('西家AI'),
      new AIPlayer('北家AI')
    ];
    
    for (const player of aiPlayers) {
      this.game.addPlayer(player);
    }
    
    // 创建游戏事件处理器
    this.gameEventHandler = new GameEventHandler(this.game, this.tileManager);
    
    console.log('✅ 强化学习自对弈系统创建成功（真实游戏引擎已集成）');
    console.log('📊 网络参数:', this.network.getParameterCount());
    console.log('🎮 MCTS模拟次数:', this.MCTS_SIMULATIONS);
    console.log('🔍 探索常数:', this.EXPLORATION_CONSTANT);
    console.log('🌡️ 温度范围:', this.INITIAL_TEMPERATURE, '→', this.FINAL_TEMPERATURE);
    console.log('🎯 真实游戏引擎: 已启用');
  }

  /**
   * 确保模型目录存在
   */
  private ensureModelDirectory(): void {
    const modelDir = path.dirname(this.modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
      console.log('📁 创建模型目录:', modelDir);
    }
  }

  /**
   * 确保检查点目录存在
   */
  private ensureCheckpointDirectory(): void {
    if (!fs.existsSync(this.checkpointPath)) {
      fs.mkdirSync(this.checkpointPath, { recursive: true });
      console.log('📁 创建检查点目录:', this.checkpointPath);
    }
  }

  /**
   * 创建真实游戏状态（方案B：直接替换为真实游戏引擎）
   */
  private createGameState(gamePhase: 'early' | 'middle' | 'late', playerIndex: number): Float32Array {
    if (!this.game || !this.gameEventHandler) {
      throw new Error('真实游戏引擎未初始化');
    }
    
    // 使用GameStateAdapter适配Game类
    const gameStateAdapter = new GameStateAdapter(this.game);
    const currentPlayer = this.game.getPlayerByIndex(playerIndex);
    
    // 使用MajiangStateEncoder编码真实游戏状态
    const stateVector = MajiangStateEncoder.encode(gameStateAdapter, currentPlayer);
    
    // 将状态向量转换为Float32Array
    const state = MajiangStateEncoder.flatten(stateVector);
    
    return state;
  }

  /**
   * MCTS搜索（优化版本：批量前向传播+状态缓存）
   */
  private async mctsSearch(rootState: Float32Array): Promise<Float32Array> {
    const root: MCTSNode = {
      state: rootState,
      visits: 0,
      totalValue: 0,
      children: new Map(),
      parent: null,
      action: -1,
      priorProbability: 1.0,
      isExpanded: false
    };
    
    // 批量扩展缓冲区
    const batchExpandNodes: MCTSNode[] = [];
    const batchExpandStates: Float32Array[] = [];
    
    // 执行MCTS模拟
    for (let simulation = 0; simulation < this.MCTS_SIMULATIONS; simulation++) {
      let node = root;
      const path: MCTSNode[] = [root];
      
      // 选择阶段
      while (node.isExpanded && node.children.size > 0) {
        node = this.selectBestChild(node);
        path.push(node);
      }
      
      // 扩展阶段（批量处理）
      if (!node.isExpanded) {
        batchExpandNodes.push(node);
        batchExpandStates.push(node.state);
        
        // 当批次达到批量大小时，批量扩展
        if (batchExpandNodes.length >= this.MCTS_BATCH_SIZE) {
          await this.batchExpandNodes(batchExpandNodes, batchExpandStates);
          batchExpandNodes.length = 0;
          batchExpandStates.length = 0;
        }
      }
      
      // 模拟阶段
      const value = await this.simulateGame(node.state);
      
      // 回传阶段
      this.backpropagate(path, value);
    }
    
    // 处理剩余的批量扩展
    if (batchExpandNodes.length > 0) {
      await this.batchExpandNodes(batchExpandNodes, batchExpandStates);
    }
    
    // 生成动作概率分布
    return this.getActionProbabilities(root);
  }

  /**
   * 批量扩展节点（性能优化：批量网络前向传播）
   */
  private async batchExpandNodes(nodes: MCTSNode[], states: Float32Array[]): Promise<void> {
    if (nodes.length === 0) return;

    try {
      // 检查缓存并准备批量网络调用
      const uncachedNodes: MCTSNode[] = [];
      const uncachedStates: Float32Array[] = [];
      const cachedResults: Array<{ actionProbs: Float32Array; value: number } | null> = [];

      for (let i = 0; i < nodes.length; i++) {
        const stateHash = this.getStateHash(states[i]);
        const cached = this.stateCache.get(stateHash);
        
        if (cached) {
          cachedResults[i] = cached;
        } else {
          cachedResults[i] = null;
          uncachedNodes.push(nodes[i]);
          uncachedStates.push(states[i]);
        }
      }

      // 批量网络前向传播（未缓存的状态）
      if (uncachedStates.length > 0) {
        // 将所有状态展平成2D数组
        const stateArray: number[][] = [];
        for (const state of uncachedStates) {
          const stateVector = {
            handTiles: state.slice(0, 136),
            visibleTiles: state.slice(136, 272),
            playerStates: state.slice(272, 304),
            gameContext: state.slice(304, 320)
          };
          stateArray.push(Array.from(MajiangStateEncoder.flatten(stateVector)));
        }
        
        // 创建批量tensor
        const stateBatch = tf.tensor2d(stateArray, [uncachedStates.length, 320]);

        const batchOutput = await this.network.forwardBatch(stateBatch);
        const actionProbsArray = await batchOutput.actionProbs.array();
        const valuesArray = await batchOutput.values.array();

        // 清理tensor
        stateBatch.dispose();
        batchOutput.actionProbs.dispose();
        batchOutput.values.dispose();

        // 处理批量结果并更新缓存
        let uncachedIndex = 0;
        for (let i = 0; i < nodes.length; i++) {
          if (cachedResults[i] === null) {
            const actionProbs = new Float32Array(actionProbsArray[uncachedIndex]);
            const value = valuesArray[uncachedIndex][0];
            
            cachedResults[i] = { actionProbs, value };
            
            // 更新缓存
            const stateHash = this.getStateHash(states[i]);
            this.stateCache.set(stateHash, { actionProbs, value });
            
            // 清理缓存（如果超过大小限制）
            if (this.stateCache.size > this.STATE_CACHE_SIZE) {
              const firstKey = this.stateCache.keys().next().value;
              if (firstKey !== undefined) {
                this.stateCache.delete(firstKey);
              }
            }
            
            uncachedIndex++;
          }
        }
      }

      // 使用缓存或批量结果扩展节点
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const result = cachedResults[i];
        
        if (result) {
          const actionProbs = result.actionProbs;
          
          // 为每个可能的动作创建子节点
          for (let action = 0; action < 39; action++) {
            if (actionProbs[action] > 0.001) { // 只扩展有意义的动作
              const childState = this.applyAction(node.state, action);
              const child: MCTSNode = {
                state: childState,
                visits: 0,
                totalValue: 0,
                children: new Map(),
                parent: node,
                action,
                priorProbability: actionProbs[action],
                isExpanded: false
              };
              node.children.set(action, child);
            }
          }
          
          node.isExpanded = true;
        }
      }
    } catch (error) {
      // 如果批量扩展失败，回退到单节点扩展
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.warn('⚠️ 批量扩展失败，回退到单节点扩展:', errorMessage);
      if (errorStack && process.env.DEBUG) {
        console.debug('错误堆栈:', errorStack);
      }
      
      // 回退到单节点扩展
      for (const node of nodes) {
        if (!node.isExpanded) {
          await this.expandNode(node);
        }
      }
    }
  }

  /**
   * 获取状态哈希（用于缓存）
   */
  private getStateHash(state: Float32Array): string {
    // 使用状态的前64个值作为哈希（减少计算开销）
    const hashValues = Array.from(state.slice(0, 64));
    return hashValues.join(',');
  }

  /**
   * 选择最佳子节点 (UCB1)
   */
  private selectBestChild(node: MCTSNode): MCTSNode {
    let bestChild: MCTSNode | null = null;
    let bestValue = -Infinity;
    
    for (const child of node.children.values()) {
      const exploitation = child.totalValue / (child.visits + 1e-8);
      const exploration = this.EXPLORATION_CONSTANT * child.priorProbability * 
        Math.sqrt(node.visits) / (child.visits + 1);
      const ucbValue = exploitation + exploration;
      
      if (ucbValue > bestValue) {
        bestValue = ucbValue;
        bestChild = child;
      }
    }
    
    return bestChild!;
  }

  /**
   * 扩展节点
   */
  private async expandNode(node: MCTSNode): Promise<void> {
    try {
      const networkOutput = await this.network.forward({
        handTiles: node.state.slice(0, 136),
        visibleTiles: node.state.slice(136, 272),
        playerStates: node.state.slice(272, 304),
        gameContext: node.state.slice(304, 320)
      });
      
      const actionProbs = Array.from(networkOutput.actionProbabilities);
      
      // 为每个可能的动作创建子节点
      for (let action = 0; action < 39; action++) {
        if (actionProbs[action] > 0.001) { // 只扩展有意义的动作
          const childState = this.applyAction(node.state, action);
          const child: MCTSNode = {
            state: childState,
            visits: 0,
            totalValue: 0,
            children: new Map(),
            parent: node,
            action,
            priorProbability: actionProbs[action],
            isExpanded: false
          };
          node.children.set(action, child);
        }
      }
      
      node.isExpanded = true;
      
    } catch (error) {
      // 如果网络前向传播失败，创建随机子节点
      for (let action = 0; action < 39; action++) {
        if (Math.random() < 0.1) { // 随机选择一些动作
          const childState = this.applyAction(node.state, action);
          const child: MCTSNode = {
            state: childState,
            visits: 0,
            totalValue: 0,
            children: new Map(),
            parent: node,
            action,
            priorProbability: 1.0 / 39,
            isExpanded: false
          };
          node.children.set(action, child);
        }
      }
      node.isExpanded = true;
    }
  }

  /**
   * 应用动作到状态
   */
  private applyAction(state: Float32Array, action: number): Float32Array {
    const newState = new Float32Array(state);
    
    // 简化的状态转换
    if (action < 34) {
      // 打牌动作
      const tileIndex = action * 4;
      if (tileIndex < 136) {
        newState[tileIndex] = Math.max(0, newState[tileIndex] - 0.5);
      }
      
      // 更新可见牌
      const visibleIndex = 136 + tileIndex;
      if (visibleIndex < 272) {
        newState[visibleIndex] = Math.min(1, newState[visibleIndex] + 0.3);
      }
    }
    
    // 更新游戏进度
    newState[304] = Math.min(1, newState[304] + 0.02);
    
    return newState;
  }

  /**
   * 模拟游戏到结束
   */
  private async simulateGame(state: Float32Array): Promise<number> {
    // 简化的游戏模拟
    const gameProgress = state[304];
    const handQuality = this.evaluateHandQuality(state);
    
    let value = handQuality * 0.6;
    
    // 基于游戏进度调整
    if (gameProgress > 0.8) {
      value += 0.3; // 后期加成
    }
    
    // 添加随机性
    value += (Math.random() - 0.5) * 0.4;
    
    return Math.max(-1, Math.min(1, value));
  }

  /**
   * 评估手牌质量
   */
  private evaluateHandQuality(state: Float32Array): number {
    let quality = 0;
    
    // 统计手牌
    for (let i = 0; i < 136; i += 4) {
      let tileCount = 0;
      for (let j = 0; j < 4; j++) {
        if (state[i + j] > 0.5) tileCount++;
      }
      
      if (tileCount >= 2) quality += 0.1; // 对子
      if (tileCount >= 3) quality += 0.2; // 刻子
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * 回传价值
   */
  private backpropagate(path: MCTSNode[], value: number): void {
    for (const node of path) {
      node.visits++;
      node.totalValue += value;
      value *= -1; // 对手视角
    }
  }

  /**
   * 获取动作概率分布（方案A优化：使用动态温度）
   */
  private getActionProbabilities(root: MCTSNode): Float32Array {
    const probs = new Float32Array(39);
    let totalVisits = 0;
    
    for (const [action, child] of root.children) {
      totalVisits += child.visits;
    }
    
    if (totalVisits > 0) {
      // 使用当前温度（方案A优化：温度衰减）
      const temperature = Math.max(this.currentTemperature, this.FINAL_TEMPERATURE);
      for (const [action, child] of root.children) {
        probs[action] = Math.pow(child.visits / totalVisits, 1 / temperature);
      }
      
      // 归一化
      const sum = Array.from(probs).reduce((a, b) => a + b, 0);
      if (sum > 0) {
        for (let i = 0; i < probs.length; i++) {
          probs[i] /= sum;
        }
      }
    } else {
      // 如果没有访问记录，使用均匀分布
      probs.fill(1 / 39);
    }
    
    return probs;
  }

  /**
   * 执行真实自对弈游戏（方案B：直接替换为真实游戏引擎）
   */
  private async playSelfPlayGame(gameId: number): Promise<SelfPlayExperience[]> {
    if (!this.game || !this.gameEventHandler) {
      throw new Error('真实游戏引擎未初始化');
    }

    const experiences: SelfPlayExperience[] = [];
    const gameStates: Float32Array[] = [];
    const actionProbabilities: Float32Array[] = [];
    const playerIndices: number[] = [];

    // 重置游戏（方案B：训练模式，禁用交互）
    this.game.reset();
    
    // 设置游戏为训练模式（禁用所有交互）
    // 通过直接初始化游戏状态，跳过用户交互
    this.game.setState(GameState.INIT);
    
    // 手动初始化游戏（跳过交互）
    this.initializeGameForTraining();

    console.log(`🎮 真实自对弈游戏 ${gameId}`);

    let moveCount = 0;
    const maxMoves = 200; // 最大步数限制

    // 真实游戏循环
    while (moveCount < maxMoves) {
      // 检查游戏是否结束
      if (this.game.state === GameState.ENDED || this.game.getRemainingTiles() <= 0) {
        if (this.game.state !== GameState.ENDED) {
          this.game.setState(GameState.ENDED);
        }
        break;
      }
      
      try {
        const currentPlayerIndex = this.game.currentPlayerIndex;
        const currentPlayer = this.game.getCurrentPlayer();

        // 使用GameStateAdapter适配Game类
        const gameStateAdapter = new GameStateAdapter(this.game);
        
        // 使用MajiangStateEncoder编码真实游戏状态
        const stateVector = MajiangStateEncoder.encode(gameStateAdapter, currentPlayer);
        const encodedState = MajiangStateEncoder.flatten(stateVector);

      // 使用MCTS搜索最佳动作
        const actionProbs = await this.mctsSearch(encodedState);

      // 记录状态和动作概率
        gameStates.push(encodedState);
      actionProbabilities.push(actionProbs);
        playerIndices.push(currentPlayerIndex);

        // 使用MajiangActionDecoder解码动作
        const actions = MajiangActionDecoder.decode(actionProbs, gameStateAdapter, currentPlayer);
        
        // 选择有效且概率最高的动作
        const validActions = actions.filter(a => a.isValid);
        const bestAction = validActions.length > 0 ? validActions[0] : actions[0];

        // 执行动作（方案B：使用真实游戏引擎）
        const actionExecuted = await this.executeAction(bestAction, currentPlayer);
        
        if (!actionExecuted) {
          // 如果动作执行失败，推进到下一回合
          if (this.game.state === GameState.PLAYING) {
            this.gameEventHandler.nextTurn(true);
          }
        }

        moveCount++;
      } catch (error) {
        console.error(`⚠️ 游戏 ${gameId} 第 ${moveCount} 步出错:`, error);
        // 优化：游戏出错时返回空经验，避免训练中断
        return [];
      }
    }

    // 计算游戏结果（使用真实游戏结果）
    const gameResults = this.calculateRealGameResults();

    // 创建经验
    for (let i = 0; i < gameStates.length; i++) {
      experiences.push({
        state: gameStates[i],
        actionProbabilities: actionProbabilities[i],
        gameResult: gameResults[playerIndices[i]],
        playerIndex: playerIndices[i],
        moveNumber: i,
        gameId
      });
    }

    console.log(`   收集到 ${experiences.length} 条真实自对弈经验`);
    return experiences;
  }

  /**
   * 初始化游戏用于训练（方案B：跳过交互，直接初始化）
   */
  private initializeGameForTraining(): void {
    if (!this.game || !this.gameEventHandler) {
      return;
    }

    // 重置所有玩家状态
    for (const player of this.game.getAllPlayers()) {
      player.state = PlayerState.WAITING;
      player.handTiles = [];
      player.discardedTiles = [];
      player.revealedSets = [];
      player.flowerTiles = [];
      player.lastDrawnTile = null;
    }

    // 重置牌管理器
    this.tileManager.reset();

    // 发牌（直接调用，跳过交互）
    this.gameEventHandler.dealInitialTiles();

    // 设置第一个玩家为当前玩家
    this.game.setCurrentPlayerIndex(0);
    
    // 更新玩家状态
    for (let i = 0; i < this.game.getAllPlayers().length; i++) {
      this.gameEventHandler.updatePlayerState(i);
    }

    // 设置游戏状态为PLAYING
    this.game.setState(GameState.PLAYING);

    // 为庄家摸一张牌
    const firstPlayer = this.game.getAllPlayers()[0];
    this.gameEventHandler.drawTileForPlayer(firstPlayer, { 
      notify: false, 
      incrementCount: true 
    });
  }

  /**
   * 执行动作（方案B：使用真实游戏引擎，类型安全优化）
   */
  private async executeAction(action: MajiangAction, player: Player): Promise<boolean> {
    if (!this.game || !this.gameEventHandler) {
      return false;
    }

    try {
      switch (action.type) {
        case 'DISCARD':
          // 打牌动作
          if (action.tile) {
            // 找到手牌中对应的牌
            const handTiles = player.getHandTiles();
            const tileIndex = handTiles.findIndex(t => 
              t.type === action.tile!.type && t.value === action.tile!.value
            );
            
            if (tileIndex >= 0) {
              const discardedTile = this.gameEventHandler.currentPlayerDiscard(tileIndex);
              // 检查其他玩家是否可以对此牌进行操作
              await this.gameEventHandler.checkOtherPlayersResponse(discardedTile);
              return true;
            }
          }
          return false;

        case 'CHI':
          // 吃牌动作
          if (this.game.lastDiscardedTile) {
            const success = await this.gameEventHandler.handleChi(player, this.game.lastDiscardedTile);
            if (success) {
              // 吃牌后继续当前玩家回合
              this.gameEventHandler.nextTurn(false);
            }
            return success;
          }
          return false;

        case 'PENG':
          // 碰牌动作
          if (this.game.lastDiscardedTile) {
            const success = await this.gameEventHandler.handlePeng(player, this.game.lastDiscardedTile);
            if (success) {
              // 碰牌后继续当前玩家回合
              this.gameEventHandler.nextTurn(false);
            }
            return success;
          }
          return false;

        case 'GANG':
          // 杠牌动作
          const gangSuccess = await this.gameEventHandler.handleGang(player, this.game.lastDiscardedTile);
          if (gangSuccess) {
            // 杠牌后继续当前玩家回合
            this.gameEventHandler.nextTurn(false);
          }
          return gangSuccess;

        case 'HU':
          // 胡牌动作
          if (this.game.lastDiscardedTile) {
            this.gameEventHandler.handlePlayerHu(player, this.game.lastDiscardedTile);
            this.game.setState(GameState.ENDED);
            return true;
          }
          // 自摸胡
          if (player.lastDrawnTile) {
            this.gameEventHandler.handlePlayerHu(player, null);
            this.game.setState(GameState.ENDED);
            return true;
          }
          return false;

        case 'PASS':
          // 过牌动作，推进到下一回合
          this.gameEventHandler.nextTurn(true);
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error(`⚠️ 执行动作 ${action.type} 失败:`, error);
      return false;
    }
  }

  /**
   * 计算真实游戏结果（改进：使用真实游戏结果）
   */
  private calculateRealGameResults(): number[] {
    if (!this.game) {
      return [0, 0, 0, 0];
    }

    const results = [0, 0, 0, 0];
    const players = this.game.getAllPlayers();

    // 检查游戏结束状态
    const winningPlayer = players.find(p => p.state === PlayerState.WON);
    const isDraw = this.game.state === GameState.ENDED && !winningPlayer && 
                   this.game.getRemainingTiles() <= 0;

    if (winningPlayer) {
      // 有人胡牌：基于胜负结果计算奖励
      const winnerIndex = players.indexOf(winningPlayer);
      
      // 获取游戏结束时的得分信息
      const winnerScore = winningPlayer.score || 0;
      
      // 计算基础奖励（基于胜负结果）
      for (let i = 0; i < players.length; i++) {
        if (i === winnerIndex) {
          // 胡牌玩家：+1.0（主要奖励）
          results[i] = 1.0;
        } else {
          // 其他玩家：基于得分差异计算惩罚（优化：扩大奖励信号范围）
          const playerScore = players[i].score || 0;
          const scoreDiff = winnerScore - playerScore;
          
          // 优化：调整基础惩罚（-0.33 → -0.5），增加得分差异影响（0.01 → 0.05）
          const basePenalty = -0.5; // 优化：更明显的惩罚
          // 优化：扩大scorePenalty范围（[-0.67, 0] → [-1.0, 0.33]），增加系数（0.01 → 0.05）
          const scorePenalty = Math.max(-1.0, Math.min(0.33, scoreDiff * 0.05));
          results[i] = basePenalty + scorePenalty;
        }
      }
    } else if (isDraw) {
      // 流局：所有玩家奖励为0，但根据得分差异微调
      const scores = players.map(p => p.score || 0);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const scoreRange = maxScore - minScore;
      
      if (scoreRange > 0.001) {
        // 优化：扩大流局奖励范围（-0.1到+0.1 → -0.2到+0.2），更明显的差异
        for (let i = 0; i < players.length; i++) {
          const normalizedScore = (scores[i] - minScore) / scoreRange;
          results[i] = (normalizedScore - 0.5) * 0.4; // 优化：映射到[-0.2, 0.2]
        }
      } else {
        // 得分相同，所有玩家奖励为0
        results.fill(0);
      }
    } else {
      // 游戏未结束：基于手牌质量和游戏进度估算奖励（辅助）
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const handTiles = player.getHandTiles();
        const revealedSets = player.getRevealedSets();
        
        // 基于手牌质量计算分数（辅助信号）
        const handQuality = this.evaluateHandQualityForPlayer(player);
        const setBonus = revealedSets.length * 0.1;
        
        // 优化：扩大辅助信号范围（[-0.5, 0.5] → [-0.8, 0.8]），更明显的中间奖励
        results[i] = Math.max(-0.8, Math.min(0.8, (handQuality + setBonus - 0.5) * 1.6));
      }
    }

    // 应用奖励归一化（确保在[-1, 1]范围）
    return this.normalizeRewards(results);
  }

  /**
   * 评估玩家手牌质量（用于辅助奖励计算）
   */
  private evaluateHandQualityForPlayer(player: Player): number {
    const handTiles = player.getHandTiles();
    const revealedSets = player.getRevealedSets();
    
    let quality = 0;
    
    // 统计手牌分布
    const tileCounts = new Map<string, number>();
    for (const tile of handTiles) {
      const key = `${tile.type}-${tile.value}`;
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
    }
    
    // 评估对子、刻子
    for (const count of tileCounts.values()) {
      if (count >= 2) quality += 0.1; // 对子
      if (count >= 3) quality += 0.2; // 刻子
    }
    
    // 明牌加成
    quality += revealedSets.length * 0.1;
    
    // 归一化到[0, 1]
    return Math.max(0, Math.min(1, quality / 2));
  }

  /**
   * 计算游戏结果（方案A优化：改进奖励函数，减少波动）
   */
  private calculateGameResults(gameStates: Float32Array[], playerIndices: number[]): number[] {
    const results = [0, 0, 0, 0]; // 4个玩家的结果

    // 改进的游戏结果计算（方案A优化）
    const playerScores = [0, 0, 0, 0];
    const playerMoveCounts = [0, 0, 0, 0]; // 记录每个玩家的行动次数

    for (let i = 0; i < gameStates.length; i++) {
      const state = gameStates[i];
      const player = playerIndices[i];
      playerMoveCounts[player]++;

      // 基于手牌质量计算分数（方案A优化：改进评估）
      const handQuality = this.evaluateHandQuality(state);

      // 基于游戏进度加成（方案A优化：改进）
      const gameProgress = state[304];
      const progressBonus = gameProgress * 0.2; // 从0.1增加到0.2，更平滑
      
      // 基于手牌完整度加成（方案A优化：新增）
      const handCompleteness = this.evaluateHandCompleteness(state);
      const completenessBonus = handCompleteness * 0.3;
      
      // 基于动作价值加成（方案A优化：新增，更准确评估）
      const actionValue = this.evaluateActionValue(state, player);
      const actionValueBonus = actionValue * 0.2;
      
      // 综合评分（方案A优化：改进）
      playerScores[player] += handQuality * 0.4 + progressBonus + completenessBonus * 0.3 + actionValueBonus;
    }

    // 归一化分数（方案A优化：减少波动）
    const maxScore = Math.max(...playerScores);
    const minScore = Math.min(...playerScores);
    const scoreRange = maxScore - minScore;

    // 使用归一化分数计算奖励（改进）
    for (let i = 0; i < 4; i++) {
      if (scoreRange > 0.001) {
        // 归一化到[-1, 1]范围
        const normalizedScore = (playerScores[i] - minScore) / scoreRange;
        results[i] = (normalizedScore - 0.5) * 2; // 映射到[-1, 1]
      } else {
        // 分数相近时，使用平局奖励
        results[i] = 0;
      }
    }

    // 应用奖励归一化（方案A优化：减少波动）
    return this.normalizeRewards(results);
  }

  /**
   * 评估手牌完整度（方案A优化：新增）
   */
  private evaluateHandCompleteness(state: Float32Array): number {
    let completeness = 0;
    const handTiles = state.slice(0, 136);
    
    // 统计手牌分布
    const tileCounts = new Array(34).fill(0);
    for (let i = 0; i < 136; i += 4) {
      let count = 0;
      for (let j = 0; j < 4; j++) {
        if (handTiles[i + j] > 0.5) count++;
      }
      tileCounts[Math.floor(i / 4)] = count;
    }
    
    // 评估完整度（对子、刻子、顺子）
    for (let i = 0; i < 34; i++) {
      if (tileCounts[i] >= 2) completeness += 0.1; // 对子
      if (tileCounts[i] >= 3) completeness += 0.2; // 刻子
      
      // 顺子检测（简化）
      if (i < 27 && i % 9 < 7) {
        if (tileCounts[i] > 0 && tileCounts[i + 1] > 0 && tileCounts[i + 2] > 0) {
          completeness += 0.15;
        }
      }
    }
    
    return Math.max(0, Math.min(1, completeness));
  }

  /**
   * 评估动作价值（方案A优化：新增，更准确评估）
   */
  private evaluateActionValue(state: Float32Array, playerIndex: number): number {
    let actionValue = 0;
    
    // 评估当前玩家的行动价值
    const handTiles = state.slice(0, 136);
    const visibleTiles = state.slice(136, 272);
    const playerStates = state.slice(272, 304);
    const gameContext = state.slice(304, 320);
    
    // 基于手牌分布评估
    const tileDistribution = this.evaluateTileDistribution(handTiles);
    actionValue += tileDistribution * 0.3;
    
    // 基于可见信息评估
    const visibleInfo = this.evaluateVisibleInfo(visibleTiles);
    actionValue += visibleInfo * 0.2;
    
    // 基于游戏上下文评估
    const contextValue = this.evaluateContextValue(gameContext, playerIndex);
    actionValue += contextValue * 0.2;
    
    return Math.max(0, Math.min(1, actionValue));
  }

  /**
   * 评估手牌分布（方案A优化：新增）
   */
  private evaluateTileDistribution(handTiles: Float32Array): number {
    let distribution = 0;
    const tileCounts = new Array(34).fill(0);
    
    for (let i = 0; i < 136; i += 4) {
      let count = 0;
      for (let j = 0; j < 4; j++) {
        if (handTiles[i + j] > 0.5) count++;
      }
      tileCounts[Math.floor(i / 4)] = count;
    }
    
    // 评估分布的多样性
    const uniqueTiles = tileCounts.filter(c => c > 0).length;
    distribution += (uniqueTiles / 34) * 0.3;
    
    // 评估对子、刻子、顺子
    for (let i = 0; i < 34; i++) {
      if (tileCounts[i] >= 2) distribution += 0.05; // 对子
      if (tileCounts[i] >= 3) distribution += 0.1; // 刻子
    }
    
    return Math.max(0, Math.min(1, distribution));
  }

  /**
   * 评估可见信息（方案A优化：新增）
   */
  private evaluateVisibleInfo(visibleTiles: Float32Array): number {
    let visibleInfo = 0;
    
    // 统计可见牌数量
    const visibleCount = Array.from(visibleTiles).filter(v => v > 0.1).length;
    visibleInfo += (visibleCount / 136) * 0.5;
    
    // 评估可见信息的价值
    const visibleSum = Array.from(visibleTiles).reduce((a, b) => a + b, 0);
    visibleInfo += Math.min(1, visibleSum / 136) * 0.3;
    
    return Math.max(0, Math.min(1, visibleInfo));
  }

  /**
   * 评估上下文价值（方案A优化：新增）
   */
  private evaluateContextValue(gameContext: Float32Array, playerIndex: number): number {
    let contextValue = 0;
    
    // 基于游戏进度
    const gameProgress = gameContext[0] || 0;
    contextValue += gameProgress * 0.3;
    
    // 基于风圈
    const windCircle = gameContext[1] || 0;
    contextValue += windCircle * 0.2;
    
    // 基于摸牌进度
    const drawProgress = gameContext[2] || 0;
    contextValue += drawProgress * 0.2;
    
    return Math.max(0, Math.min(1, contextValue));
  }

  /**
   * 归一化奖励（方案A优化：减少波动）
   */
  private normalizeRewards(rewards: number[]): number[] {
    const maxReward = Math.max(...rewards);
    const minReward = Math.min(...rewards);
    const range = maxReward - minReward;
    
    if (range < 0.001) {
      // 奖励相近时，返回平局奖励
      return rewards.map(() => 0);
    }
    
    // 优化：改进归一化策略，避免过度压缩奖励范围
    // 如果奖励已经在合理范围内（[-2, 2]），仅做轻微缩放，保持原始差异
    const maxAbsReward = Math.max(Math.abs(maxReward), Math.abs(minReward));
    if (maxAbsReward <= 2.0) {
      // 奖励在合理范围内，轻微缩放保持原始差异
      const scaleFactor = 1.0 / Math.max(1.0, maxAbsReward);
      return rewards.map(r => r * scaleFactor);
    } else {
      // 奖励超出范围，归一化到[-1, 1]
      return rewards.map(r => {
        const normalized = (r - minReward) / range;
        return (normalized - 0.5) * 2;
      });
    }
  }

  /**
   * 经验优先回放采样（方案A优化：优先重要经验）
   */
  private prioritizedExperienceReplay(batchSize: number): number[] {
    // 计算每个经验的重要性（优化：增强优先级计算）
    const priorities = this.experiences.map((exp, idx) => {
      // 奖励重要性（绝对值越大越重要）
      const rewardScore = Math.abs(exp.gameResult);
      
      // 时间重要性（终局步骤更重要，因为直接关联最终结果）
      const timeScore = exp.moveNumber > 100 ? 1.5 : 1.0; // 终局步骤权重更高
      
      // 游戏阶段重要性（终局经验更重要）
      const phaseScore = exp.moveNumber > 120 ? 1.3 : 1.0;
      
      // 综合重要性计算
      const importance = rewardScore * timeScore * phaseScore * (1 + exp.moveNumber * 0.01);
      
      return { idx, importance, rewardScore };
    });
    
    // 按重要性排序
    priorities.sort((a, b) => b.importance - a.importance);
    
    // 采样：75%重要经验 + 25%随机经验（优化：提高重要经验比例）
    const importantCount = Math.floor(batchSize * 0.75);
    const randomCount = batchSize - importantCount;
    
    const batchIndices: number[] = [];
    
    // 选择重要经验（使用加权随机，避免总是选择相同的）
    const topK = Math.min(importantCount * 2, priorities.length);
    for (let i = 0; i < importantCount && i < topK; i++) {
      // 在topK中选择，使用softmax采样
      const weights = priorities.slice(0, topK).map(p => p.importance);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let random = Math.random() * totalWeight;
      let selectedIdx = 0;
      for (let j = 0; j < topK; j++) {
        random -= weights[j];
        if (random <= 0) {
          selectedIdx = j;
          break;
        }
      }
      batchIndices.push(priorities[selectedIdx].idx);
    }
    
    // 随机采样补充（确保探索）
    for (let i = 0; i < randomCount; i++) {
      batchIndices.push(Math.floor(Math.random() * this.experiences.length));
    }
    
    return batchIndices;
  }

  /**
   * 训练网络
   */
  private async trainNetwork(): Promise<void> {
    if (this.experiences.length < this.TRAINING_BATCH_SIZE) return;

    console.log('🧠 训练神经网络...');

    // 经验优先回放采样（方案A优化：优先重要经验）
    const batchIndices = this.prioritizedExperienceReplay(this.TRAINING_BATCH_SIZE);

    const batch = batchIndices.map(i => this.experiences[i]);

    const states = tf.tensor2d(
      batch.map(exp => Array.from(exp.state)),
      [this.TRAINING_BATCH_SIZE, 320]
    );

    const actionProbs = tf.tensor2d(
      batch.map(exp => Array.from(exp.actionProbabilities)),
      [this.TRAINING_BATCH_SIZE, 39]
    );

    // 计算折扣奖励（方案A优化：添加奖励归一化和重要性权重）
    const rawRewards = batch.map(exp => {
      let discountedReward = exp.gameResult;
      // 应用时间折扣
      const timeFactor = Math.pow(this.DISCOUNT_FACTOR, exp.moveNumber);
      return discountedReward * timeFactor;
    });
    
    // 奖励归一化（方案A优化：减少波动）
    const maxReward = Math.max(...rawRewards);
    const minReward = Math.min(...rawRewards);
    const rewardRange = maxReward - minReward;
    
    const discountedRewards = rawRewards.map(r => {
      if (rewardRange < 0.001) return 0;
      // 归一化到[-1, 1]范围
      const normalized = (r - minReward) / rewardRange;
      return (normalized - 0.5) * 2;
    });

    const values = tf.tensor1d(discountedRewards);

    try {
      const loss = await this.network.trainBatch({ states, actionProbs, values });

      // 更新统计
      this.stats.trainingIterations++;
      this.stats.networkUpdates++;

      const avgReward = discountedRewards.reduce((sum, r) => sum + r, 0) / discountedRewards.length;
      const alpha = 0.1;
      this.stats.averageReward = this.stats.averageReward * (1 - alpha) + avgReward * alpha;

      // 记录训练曲线数据（方案A优化）
      this.stats.lossHistory.push(loss.totalLoss);
      this.stats.rewardHistory.push(avgReward);
      if (this.stats.lossHistory.length > 100) {
        this.stats.lossHistory = this.stats.lossHistory.slice(-100);
        this.stats.rewardHistory = this.stats.rewardHistory.slice(-100);
      }

      // 检查loss是否改善（早停机制，优化：考虑损失波动）
      const improvementThreshold = this.stats.bestLoss * 0.01; // 1%的改善阈值
      if (loss.totalLoss < this.stats.bestLoss - improvementThreshold) {
        // 显著改善：超过1%才认为是真正的改善
        this.stats.bestLoss = loss.totalLoss;
        this.stats.noImprovementCount = 0;
      } else if (loss.totalLoss <= this.stats.bestLoss * 1.05) {
        // 损失在最佳值的5%范围内波动，不增加计数（优化：避免正常波动触发早停）
        // noImprovementCount保持不变
      } else {
        // 损失明显恶化，增加计数
        this.stats.noImprovementCount++;
      }

      console.log(`   训练损失: ${loss.totalLoss.toFixed(4)} (最佳: ${this.stats.bestLoss.toFixed(4)})`);
      console.log(`   平均奖励: ${this.stats.averageReward.toFixed(3)}`);

    } finally {
      states.dispose();
      actionProbs.dispose();
      values.dispose();
    }
  }

  /**
   * 保存强化学习模型（增强版：包含检查点功能）
   */
  private async saveRLModel(): Promise<void> {
    try {
      const modelData = {
        stats: this.stats,
        networkConfig: this.network.getConfig(),
        parameterCount: this.network.getParameterCount(),
        rlConfig: {
          mctsSimulations: this.MCTS_SIMULATIONS,
          explorationConstant: this.EXPLORATION_CONSTANT,
          initialTemperature: this.INITIAL_TEMPERATURE,
          finalTemperature: this.FINAL_TEMPERATURE,
          currentTemperature: this.currentTemperature,
          discountFactor: this.DISCOUNT_FACTOR
        },
        // 训练监控数据（方案A优化）
        monitoring: {
          lossHistory: this.stats.lossHistory,
          rewardHistory: this.stats.rewardHistory,
          confidenceHistory: this.stats.confidenceHistory,
          bestLoss: this.stats.bestLoss,
          noImprovementCount: this.stats.noImprovementCount
        },
        timestamp: new Date().toISOString(),
        version: 'reinforcement-learning-1.2' // 版本更新：添加检查点功能
      };

      const modelFile = `${this.modelPath}.json`;
      fs.writeFileSync(modelFile, JSON.stringify(modelData, null, 2));

      console.log(`💾 强化学习模型已保存: ${modelFile}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ 模型保存失败:', errorMessage);
    }
  }

  /**
   * 保存训练检查点（新增：支持断点续训）
   */
  private async saveCheckpoint(gameId: number): Promise<void> {
    try {
      // 保存检查点元数据
      const checkpointData = {
        gameId: gameId,
        stats: this.stats,
        networkConfig: this.network.getConfig(),
        rlConfig: {
          mctsSimulations: this.MCTS_SIMULATIONS,
          explorationConstant: this.EXPLORATION_CONSTANT,
          initialTemperature: this.INITIAL_TEMPERATURE,
          finalTemperature: this.FINAL_TEMPERATURE,
          currentTemperature: this.currentTemperature,
          discountFactor: this.DISCOUNT_FACTOR
        },
        monitoring: {
          lossHistory: this.stats.lossHistory,
          rewardHistory: this.stats.rewardHistory,
          confidenceHistory: this.stats.confidenceHistory,
          bestLoss: this.stats.bestLoss,
          noImprovementCount: this.stats.noImprovementCount
        },
        timestamp: new Date().toISOString(),
        version: 'reinforcement-learning-1.2'
      };

      const checkpointFile = path.join(this.checkpointPath, `checkpoint-${gameId}.json`);
      fs.writeFileSync(checkpointFile, JSON.stringify(checkpointData, null, 2));

      // 保存网络权重
      const weightsPath = path.join(this.checkpointPath, `weights-${gameId}`);
      await this.network.saveModel(weightsPath);

      // 保存最新检查点引用
      const latestCheckpointFile = path.join(this.checkpointPath, 'latest-checkpoint.json');
      fs.writeFileSync(latestCheckpointFile, JSON.stringify({ gameId, timestamp: checkpointData.timestamp }, null, 2));

      // 清理旧检查点（保留最近10个检查点）
      this.cleanupOldCheckpoints(10);

      console.log(`💾 检查点已保存: 游戏 ${gameId} (权重: ${weightsPath})`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ 检查点保存失败 (游戏 ${gameId}):`, errorMessage);
    }
  }

  /**
   * 清理旧检查点（新增：避免检查点文件过多）
   */
  private cleanupOldCheckpoints(keepCount: number = 10): void {
    try {
      // 获取所有检查点文件
      const checkpointFiles = fs.readdirSync(this.checkpointPath)
        .filter(file => file.startsWith('checkpoint-') && file.endsWith('.json'))
        .map(file => {
          const match = file.match(/checkpoint-(\d+)\.json/);
          if (match) {
            const gameId = parseInt(match[1]);
            const filePath = path.join(this.checkpointPath, file);
            const stats = fs.statSync(filePath);
            return { file, gameId, filePath, mtime: stats.mtime };
          }
          return null;
        })
        .filter((item): item is { file: string; gameId: number; filePath: string; mtime: Date } => item !== null)
        .sort((a, b) => b.gameId - a.gameId); // 按游戏ID降序排序

      // 如果检查点数量超过保留数量，删除旧的
      if (checkpointFiles.length > keepCount) {
        const toDelete = checkpointFiles.slice(keepCount);
        for (const checkpoint of toDelete) {
          try {
            // 删除检查点元数据文件
            fs.unlinkSync(checkpoint.filePath);
            
            // 删除对应的权重目录
            const weightsDir = path.join(this.checkpointPath, `weights-${checkpoint.gameId}`);
            if (fs.existsSync(weightsDir)) {
              fs.rmSync(weightsDir, { recursive: true, force: true });
            }
            
            console.log(`🧹 清理旧检查点: 游戏 ${checkpoint.gameId}`);
          } catch (error) {
            // 忽略删除失败的错误
          }
        }
      }
    } catch (error) {
      // 忽略清理失败的错误
    }
  }

  /**
   * 加载训练检查点（新增：支持断点续训）
   */
  private async loadCheckpoint(gameId?: number): Promise<{ gameId: number; stats: RLTrainingStats } | null> {
    try {
      let checkpointFile: string;
      
      if (gameId !== undefined) {
        // 加载指定游戏ID的检查点
        checkpointFile = path.join(this.checkpointPath, `checkpoint-${gameId}.json`);
      } else {
        // 加载最新检查点
        const latestCheckpointFile = path.join(this.checkpointPath, 'latest-checkpoint.json');
        if (!fs.existsSync(latestCheckpointFile)) {
          return null;
        }
        const latest = JSON.parse(fs.readFileSync(latestCheckpointFile, 'utf8'));
        checkpointFile = path.join(this.checkpointPath, `checkpoint-${latest.gameId}.json`);
        gameId = latest.gameId;
      }

      if (!fs.existsSync(checkpointFile)) {
        return null;
      }

      const checkpointData = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));

      // 加载网络权重
      const weightsPath = path.join(this.checkpointPath, `weights-${checkpointData.gameId}`);
      if (fs.existsSync(weightsPath)) {
        await this.network.loadModel(weightsPath);
      }

      // 恢复统计信息（排除早停相关统计，避免立即早停）
      const { patience, noImprovementCount, bestLoss, ...statsToLoad } = checkpointData.stats;
      const restoredStats: RLTrainingStats = {
        ...this.stats,
        ...statsToLoad,
        patience: 30, // 重置patience
        noImprovementCount: 0, // 重置noImprovementCount
        bestLoss: checkpointData.monitoring?.bestLoss || Infinity,
        startTime: Date.now() // 重置开始时间
      };

      console.log(`📥 检查点加载成功: 游戏 ${checkpointData.gameId}`);
      console.log(`   已训练游戏: ${restoredStats.selfPlayGames}`);
      console.log(`   平均奖励: ${restoredStats.averageReward.toFixed(3)}`);
      console.log(`   最佳损失: ${restoredStats.bestLoss.toFixed(4)}`);

      return {
        gameId: checkpointData.gameId,
        stats: restoredStats
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ 检查点加载失败:', errorMessage);
      return null;
    }
  }

  /**
   * 加载强化学习模型
   */
  private loadRLModel(): boolean {
    try {
      const modelFile = `${this.modelPath}.json`;
      if (fs.existsSync(modelFile)) {
        const modelData = JSON.parse(fs.readFileSync(modelFile, 'utf8'));

        if (modelData.stats) {
          // 修复startTime问题（方案A优化）
          const savedStats = modelData.stats;
          // 排除早停相关统计，避免从旧模型加载导致立即早停（修复：防止patience和noImprovementCount被覆盖）
          const { patience, noImprovementCount, bestLoss, ...statsToLoad } = savedStats;
          this.stats = { 
            ...this.stats, 
            ...statsToLoad,
            startTime: savedStats.startTime || Date.now() // 修复startTime
          };
          
          // 如果startTime是旧时间，重置为当前时间（方案A优化）
          const savedTime = savedStats.startTime;
          const daysDiff = (Date.now() - savedTime) / (1000 * 60 * 60 * 24);
          if (daysDiff > 1) {
            this.stats.startTime = Date.now();
            console.log('   ⚠️ 修复startTime（旧时间超过1天）');
          }
        }

        console.log('📥 强化学习模型加载成功');
        console.log(`   已训练游戏: ${this.stats.selfPlayGames}`);
        console.log(`   平均奖励: ${this.stats.averageReward.toFixed(3)}`);

        return true;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ 模型加载失败:', errorMessage);
    }
    return false;
  }

  /**
   * 验证训练配置（新增：配置验证）
   */
  private validateTrainingConfig(): boolean {
    const errors: string[] = [];

    // 验证学习率范围
    const learningRate = this.network.getConfig().learningRate || 0.0008;
    if (learningRate < 0.0001 || learningRate > 0.01) {
      errors.push(`学习率超出合理范围: ${learningRate} (建议: 0.0001 - 0.01)`);
    }

    // 验证批次大小
    if (![16, 32, 64, 128].includes(this.TRAINING_BATCH_SIZE)) {
      errors.push(`批次大小不在推荐值: ${this.TRAINING_BATCH_SIZE} (建议: 16, 32, 64, 128)`);
    }

    // 验证MCTS模拟次数
    if (this.MCTS_SIMULATIONS <= 0) {
      errors.push(`MCTS模拟次数必须大于0: ${this.MCTS_SIMULATIONS}`);
    }

    // 验证经验缓冲区大小
    if (this.EXPERIENCE_BUFFER_SIZE < this.TRAINING_BATCH_SIZE) {
      errors.push(`经验缓冲区大小 (${this.EXPERIENCE_BUFFER_SIZE}) 必须大于批次大小 (${this.TRAINING_BATCH_SIZE})`);
    }

    // 验证早停patience
    if (this.stats.patience <= 0) {
      errors.push(`早停patience必须大于0: ${this.stats.patience}`);
    }

    if (errors.length > 0) {
      console.error('❌ 训练配置验证失败:');
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    console.log('✅ 训练配置验证通过');
    return true;
  }

  /**
   * 评估强化学习模型
   */
  private async evaluateRLModel(): Promise<void> {
    console.log('🔍 评估强化学习模型...');

    const testGames = 5;
    let totalReward = 0;
    let totalConfidence = 0;

    for (let i = 0; i < testGames; i++) {
      const testState = this.createGameState('middle', 0);

      // 使用MCTS搜索
      const actionProbs = await this.mctsSearch(testState);
      const confidence = Math.max(...Array.from(actionProbs));
      totalConfidence += confidence;

      // 模拟游戏结果
      const reward = await this.simulateGame(testState);
      totalReward += reward;
    }

    const avgReward = totalReward / testGames;
    const avgConfidence = totalConfidence / testGames;

    console.log(`   平均奖励: ${avgReward.toFixed(3)}`);
    console.log(`   平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);

    // 记录评估曲线数据（方案A优化）
    this.stats.confidenceHistory.push(avgConfidence);
    if (this.stats.confidenceHistory.length > 100) {
      this.stats.confidenceHistory = this.stats.confidenceHistory.slice(-100);
    }

    // 更新统计
    this.stats.winRates.push(avgReward > 0 ? 1 : 0);
    if (this.stats.winRates.length > 10) {
      this.stats.winRates = this.stats.winRates.slice(-10);
    }
  }

  /**
   * 检查是否应该早停（方案A优化：改进早停逻辑）
   */
  private shouldEarlyStop(): boolean {
    // 基于loss改善的早停
    const lossBasedStop = this.stats.noImprovementCount >= this.stats.patience;
    
    // 基于置信度下降的早停（修复：增加历史数据要求，避免过早触发）
    const minGamesForConfidenceCheck = 50; // 至少训练50局后才检查置信度下降（修复：从20增加到50）
    const minConfidenceHistoryLength = 30; // 需要至少30个历史数据点（修复：从10增加到30）
    const confidenceBasedStop = this.stats.confidenceHistory.length >= minConfidenceHistoryLength && // 需要更多历史数据
      this.stats.selfPlayGames >= minGamesForConfidenceCheck && // 至少训练50局
      this.stats.confidenceHistory.slice(-10).reduce((a, b) => a + b, 0) / 10 < // 最近10个平均值（修复：从5增加到10）
      this.stats.confidenceHistory.slice(0, 10).reduce((a, b) => a + b, 0) / 10 * 0.5; // 前10个平均值 * 0.5（修复：从0.7放宽到0.5）
    
    // 综合判断：loss无改善或置信度持续下降
    return lossBasedStop || confidenceBasedStop;
  }

  /**
   * 更新学习率（优化：改进学习率衰减策略）
   * 使用更平滑的衰减策略，提高训练稳定性
   */
  private updateLearningRate(gameId: number, totalGames: number): void {
    // 优化：使用更平滑的衰减策略
    const initialLearningRate = 0.0008; // 优化：进一步提高初始学习率（从0.0005增加到0.0008，基于优秀奖励信号）
    const minLearningRate = 0.0001; // 最小学习率
    const decayRate = 0.98; // 优化：降低衰减率（从0.95增加到0.98），更平滑
    const decayStep = totalGames / 10; // 优化：增加衰减步数（从5增加到10），更平滑
    
    // 指数衰减：learningRate = initial * decayRate ^ (gameId / decayStep)
    const newLearningRate = Math.max(
      minLearningRate,
      initialLearningRate * Math.pow(decayRate, Math.floor(gameId / decayStep))
    );
    
    // 更新网络学习率（如果支持）
    if (this.network && typeof (this.network as any).setLearningRate === 'function') {
      (this.network as any).setLearningRate(newLearningRate);
    }
    
    // 记录学习率变化（每10局记录一次）
    if (gameId % 10 === 0) {
      console.log(`   📉 学习率: ${newLearningRate.toFixed(6)}`);
    }
  }

  /**
   * 更新温度（方案A优化：温度衰减，提升置信度）
   */
  private updateTemperature(gameId: number, totalGames: number): void {
    const progress = gameId / totalGames;
    
    // 线性温度衰减：从初始温度衰减到最终温度
    const temperatureRange = this.INITIAL_TEMPERATURE - this.FINAL_TEMPERATURE;
    this.currentTemperature = this.INITIAL_TEMPERATURE - (temperatureRange * progress);
    
    // 确保温度不低于最终温度
    this.currentTemperature = Math.max(this.currentTemperature, this.FINAL_TEMPERATURE);
    
    // 每10局记录温度变化
    if (gameId % 10 === 0) {
      console.log(`🌡️ 温度调整: ${this.currentTemperature.toFixed(3)} (进度: ${(progress * 100).toFixed(1)}%)`);
    }
  }

  /**
   * 开始强化学习自对弈训练（增强版：支持检查点恢复）
   */
  public async startReinforcementLearning(resumeFromCheckpoint: boolean = false, resumeGameId?: number): Promise<void> {
    console.log('🎯 开始强化学习自对弈训练');
    console.log('🚀 特性: MCTS搜索 + 自对弈 + 强化学习 + 经验回放 + 检查点恢复');
    console.log('');

    // 验证训练配置
    if (!this.validateTrainingConfig()) {
      throw new Error('训练配置验证失败，请修正配置后重试');
    }

    let startGame = 1;
    const targetGames = 50; // 测试优化效果：训练50局获得更准确的性能数据

    // 尝试从检查点恢复
    if (resumeFromCheckpoint) {
      const checkpoint = await this.loadCheckpoint(resumeGameId);
      if (checkpoint) {
        this.stats = checkpoint.stats;
        startGame = checkpoint.gameId + 1; // 从下一局开始
        console.log(`🔄 从检查点恢复训练: 从第 ${startGame} 局开始`);
        console.log(`   已训练游戏: ${checkpoint.stats.selfPlayGames}`);
        console.log(`   平均奖励: ${checkpoint.stats.averageReward.toFixed(3)}`);
      } else {
        console.log('⚠️ 未找到检查点，从头开始训练');
        // 加载已有模型（但不使用已有进度，从新开始）
        this.loadRLModel();
        // 重置训练进度
        this.stats.selfPlayGames = 0;
        this.stats.totalExperiences = 0;
        this.stats.trainingIterations = 0;
        this.stats.networkUpdates = 0;
        this.stats.startTime = Date.now();
        this.stats.noImprovementCount = 0;
        this.stats.bestLoss = Infinity;
        this.stats.patience = 30;
      }
    } else {
      // 加载已有模型（但不使用已有进度，从新开始）
      this.loadRLModel();
      // 重置训练进度，从第1局开始（修复早停问题）
      this.stats.selfPlayGames = 0;
      this.stats.totalExperiences = 0;
      this.stats.trainingIterations = 0;
      this.stats.networkUpdates = 0;
      this.stats.startTime = Date.now();
      // 重置早停相关统计（修复：防止从旧模型加载的noImprovementCount导致立即早停）
      this.stats.noImprovementCount = 0;
      this.stats.bestLoss = Infinity;
      this.stats.patience = 30; // 优化：增加patience到30（对应10局游戏，更充分的观察窗口）
    }

    const totalGames = targetGames; // 目标总局数：200局（完整训练，所有优化已应用）

    // 记录训练开始时间
    const trainingStartTime = Date.now();
    const gameStartTimes: number[] = []; // 记录每局开始时间

    console.log(`📊 强化学习配置: 从第${startGame}局开始，训练${targetGames}局（验证修复）`);
    console.log(`🎮 MCTS模拟: ${this.MCTS_SIMULATIONS}次`);
    console.log(`🔍 探索常数: ${this.EXPLORATION_CONSTANT}`);
    console.log(`🌡️ 温度范围: ${this.INITIAL_TEMPERATURE} → ${this.FINAL_TEMPERATURE} (当前: ${this.currentTemperature.toFixed(3)})`);
    console.log(`💰 折扣因子: ${this.DISCOUNT_FACTOR}`);
    console.log('');

    for (let gameId = startGame; gameId <= totalGames; gameId++) {
      // 检查是否正在关闭
      if (this.isShuttingDown) {
        console.log('\n⚠️ 检测到关闭信号，正在保存检查点...');
        await this.saveCheckpoint(gameId - 1);
        console.log('✅ 检查点已保存，训练已安全退出');
        break;
      }

      // 更新当前游戏ID（用于优雅关闭）
      this.currentGameId = gameId;

      // 记录单局开始时间
      const gameStartTime = Date.now();
      gameStartTimes.push(gameStartTime);
      
      // 执行自对弈游戏
      // 优化：加强错误处理，避免游戏引擎错误导致训练中断
      let experiences: SelfPlayExperience[] = [];
      try {
        experiences = await this.playSelfPlayGame(gameId);
      } catch (error) {
        console.error(`⚠️ 游戏 ${gameId} 出错，跳过该局:`, error);
        // 重置游戏状态，继续下一局
        if (this.game) {
          this.game.reset();
        }
        // 跳过该局，继续训练
        continue;
      }
      
      // 计算单局耗时（用于性能监控）
      const gameElapsed = (Date.now() - gameStartTime) / 1000;
      
      // 性能监控：记录耗时较长的游戏
      if (gameElapsed > 10) {
        console.warn(`⚠️ 游戏 ${gameId} 耗时较长: ${gameElapsed.toFixed(2)}秒`);
      }

      // 添加到经验缓冲区
      this.experiences.push(...experiences);
      this.stats.totalExperiences += experiences.length;

      // 限制经验缓冲区大小（优化：基于优先级的保留策略）
      if (this.experiences.length > this.EXPERIENCE_BUFFER_SIZE) {
        // 计算每个经验的优先级（基于奖励、时间、置信度）
        const priorities = this.experiences.map((exp, idx) => {
          const rewardScore = Math.abs(exp.gameResult); // 奖励绝对值
          const timeScore = 1 - (exp.moveNumber / 200); // 时间衰减（越早的步骤权重越高）
          const importance = rewardScore * (1 + timeScore * 0.5); // 综合重要性
          return { idx, importance, experience: exp };
        });
        
        // 按重要性排序
        priorities.sort((a, b) => b.importance - a.importance);
        
        // 保留最重要的经验
        this.experiences = priorities.slice(0, this.EXPERIENCE_BUFFER_SIZE)
          .map(p => p.experience);
      }

      // 训练网络（每局训练多次）
      if (this.experiences.length >= this.TRAINING_BATCH_SIZE) {
        for (let trainingRound = 0; trainingRound < this.TRAINING_PER_GAME; trainingRound++) {
        await this.trainNetwork();
        }
      }

      this.stats.selfPlayGames = gameId;
      this.stats.averageGameLength = this.stats.totalExperiences / this.stats.selfPlayGames;

      // 每5局评估一次（优化：减少评估频率提升性能）
      if (gameId % 5 === 0) {
        await this.evaluateRLModel();
      }

      // 定期保存（每5局保存一次）
      if (gameId % 5 === 0) {
        await this.saveRLModel();
        // 保存检查点（支持断点续训）
        await this.saveCheckpoint(gameId);
        
        // 计算总耗时和平均单局耗时
        const totalElapsed = (Date.now() - trainingStartTime) / 1000;
        const completedGames = gameStartTimes.length;
        const avgGameElapsed = completedGames > 0 
          ? gameStartTimes.map((start, idx) => {
              const nextStart = gameStartTimes[idx + 1] || Date.now();
              return (nextStart - start) / 1000;
            }).reduce((a, b) => a + b, 0) / completedGames
          : 0;
        
        this.logRLProgress(gameId, totalGames, totalElapsed, avgGameElapsed);
      }

      // 早停检查（优化：改进早停逻辑）
      // 至少训练20局后才检查早停（优化：从50减少到20，但增加patience到30，平衡早停和训练时间）
      if (gameId >= 20 && this.shouldEarlyStop()) {
        const avgRecentConfidence = this.stats.confidenceHistory.length >= 3 ?
          this.stats.confidenceHistory.slice(-3).reduce((a, b) => a + b, 0) / 3 : 0;
        const avgEarlyConfidence = this.stats.confidenceHistory.length >= 3 ?
          this.stats.confidenceHistory.slice(0, 3).reduce((a, b) => a + b, 0) / 3 : 0;
        
        console.log(`\n⚠️ 早停触发：${this.stats.noImprovementCount}局无改善（耐心值: ${this.stats.patience}）`);
        console.log(`   最佳损失: ${this.stats.bestLoss.toFixed(4)}`);
        if (avgRecentConfidence < avgEarlyConfidence * 0.8) {
          console.log(`   置信度下降: ${(avgEarlyConfidence * 100).toFixed(1)}% → ${(avgRecentConfidence * 100).toFixed(1)}%`);
        }
        break;
      }

      // 学习率衰减（方案A优化）
      this.updateLearningRate(gameId, totalGames);
      
      // 温度衰减（方案A优化：提升置信度）
      this.updateTemperature(gameId, totalGames);
    }

    // 最终保存和评估
    await this.saveRLModel();
    await this.evaluateRLModel();
    
    // 计算最终总耗时和平均单局耗时
    const finalTotalElapsed = (Date.now() - trainingStartTime) / 1000;
    const finalAvgGameElapsed = gameStartTimes.length > 0 
      ? gameStartTimes.map((start, idx) => {
          const nextStart = gameStartTimes[idx + 1] || Date.now();
          return (nextStart - start) / 1000;
        }).reduce((a, b) => a + b, 0) / gameStartTimes.length
      : 0;

    console.log('🎉 强化学习自对弈训练完成！');
    // 使用实际训练的局数进行统计（修复统计显示问题：使用实际完成的gameId）
    const actualGamesPlayed = gameStartTimes.length; // 使用实际完成的游戏数量
    this.printRLStats(finalTotalElapsed, finalAvgGameElapsed, actualGamesPlayed);
  }

  /**
   * 记录强化学习进度（添加耗时统计）
   */
  private logRLProgress(gameId: number, totalGames: number, totalElapsed: number, avgGameElapsed: number): void {
    const progress = (gameId / totalGames * 100).toFixed(1);
    const elapsed = (Date.now() - this.stats.startTime) / 1000;

    console.log(`📊 强化学习进度 ${progress}% | 游戏 ${gameId}/${totalGames}`);
    console.log(`   总经验数: ${this.stats.totalExperiences}条`);
    console.log(`   训练迭代: ${this.stats.trainingIterations}次`);
    console.log(`   网络更新: ${this.stats.networkUpdates}次`);
    console.log(`   平均游戏长度: ${this.stats.averageGameLength.toFixed(1)}步`);
    console.log(`   平均奖励: ${this.stats.averageReward.toFixed(3)}`);
    console.log(`   探索率: ${this.stats.explorationRate.toFixed(2)}`);
    console.log(`   训练时间: ${(elapsed/60).toFixed(1)}分钟`);
    console.log(`   ⏱️ 本次训练总耗时: ${(totalElapsed / 60).toFixed(2)}分钟 (${totalElapsed.toFixed(1)}秒)`);
    console.log(`   ⏱️ 平均单局耗时: ${avgGameElapsed.toFixed(2)}秒`);
    console.log(`   ⚡ 训练速度: ${(gameId / totalElapsed).toFixed(2)}局/秒`);
    console.log('');
  }

  /**
   * 打印强化学习统计（添加耗时统计）
   */
  private printRLStats(totalElapsed: number, avgGameElapsed: number, actualGamesPlayed?: number): void {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;
    const recentWinRate = this.stats.winRates.length > 0 ?
      this.stats.winRates.reduce((sum, wr) => sum + wr, 0) / this.stats.winRates.length : 0;

    console.log('📈 强化学习自对弈最终统计:');
    // 使用实际训练的局数（如果提供），否则使用累积值
    const gamesPlayed = actualGamesPlayed !== undefined ? actualGamesPlayed : this.stats.selfPlayGames;
    console.log(`   本次训练游戏数: ${gamesPlayed}`);
    console.log(`   累积游戏总数: ${this.stats.selfPlayGames}`);
    console.log(`   总经验数: ${this.stats.totalExperiences}`);
    console.log(`   训练迭代次数: ${this.stats.trainingIterations}`);
    console.log(`   网络更新次数: ${this.stats.networkUpdates}`);
    console.log(`   平均游戏长度: ${this.stats.averageGameLength.toFixed(1)}步`);
    console.log(`   最终平均奖励: ${this.stats.averageReward.toFixed(3)}`);
    console.log(`   近期胜率: ${(recentWinRate * 100).toFixed(1)}%`);
    console.log(`   总训练时间: ${(totalTime/60).toFixed(1)}分钟 (${totalTime.toFixed(1)}秒)`);
    console.log(`   ⏱️ 本次训练总耗时: ${(totalElapsed / 60).toFixed(2)}分钟 (${totalElapsed.toFixed(1)}秒)`);
    console.log(`   ⏱️ 平均单局耗时: ${avgGameElapsed.toFixed(2)}秒`);
    // 使用实际训练的局数计算训练速度
    const gamesForSpeed = actualGamesPlayed !== undefined ? actualGamesPlayed : this.stats.selfPlayGames;
    console.log(`   ⚡ 训练速度: ${(gamesForSpeed / totalElapsed).toFixed(2)}局/秒`);
    console.log('');
    console.log('🎯 强化学习自对弈特性:');
    console.log('   ✅ MCTS树搜索算法');
    console.log('   ✅ 自对弈数据生成');
    console.log('   ✅ 强化学习训练');
    console.log('   ✅ 经验回放机制');
    console.log('   ✅ UCB1探索策略');
    console.log('   ✅ 时间折扣奖励');
    console.log('   ✅ 动态温度控制');
    console.log('   ✅ 增强网络容量');
    console.log('');
    console.log('🚀 核心突破:');
    console.log('   🧠 从监督学习转向强化学习');
    console.log('   🎮 实现真正的自对弈训练');
    console.log('   🔍 集成MCTS搜索算法');
    console.log('   📊 建立完整的RL训练流程');
    console.log('   💡 解决多玩家博弈问题');

    // 性能分析
    console.log('');
    console.log('📊 性能分析:');

    if (this.stats.averageReward > 0.1) {
      console.log('   ✅ 平均奖励为正，学习效果良好');
    } else if (this.stats.averageReward > -0.1) {
      console.log('   📈 平均奖励接近零，学习进展中等');
    } else {
      console.log('   ⚠️ 平均奖励为负，需要更多训练');
    }

    if (recentWinRate > 0.6) {
      console.log('   🏆 近期胜率优秀，强化学习效果显著');
    } else if (recentWinRate > 0.4) {
      console.log('   ✅ 近期胜率良好，强化学习有效');
    } else {
      console.log('   📈 近期胜率有待提升，继续优化');
    }

    // 使用实际训练的局数计算效率（如果提供）
    const gamesForEfficiency = actualGamesPlayed !== undefined ? actualGamesPlayed : this.stats.selfPlayGames;
    const experienceEfficiency = this.stats.totalExperiences / gamesForEfficiency;
    console.log(`   📚 经验效率: ${experienceEfficiency.toFixed(1)}条/游戏`);

    const trainingEfficiency = this.stats.networkUpdates / gamesForEfficiency;
    console.log(`   🧠 训练效率: ${trainingEfficiency.toFixed(1)}次更新/游戏`);

    // 与之前方法对比
    console.log('');
    console.log('🔄 与监督学习对比:');
    console.log('   ✅ 解决了数据质量问题（自对弈生成真实数据）');
    console.log('   ✅ 解决了标签质量问题（基于真实游戏结果）');
    console.log('   ✅ 解决了多玩家博弈问题（MCTS处理对手策略）');
    console.log('   ✅ 解决了探索问题（UCB1探索机制）');
    console.log('   ✅ 增加了网络容量（4层网络，更多参数）');
  }

  /**
   * 优雅关闭处理（新增：支持信号处理）
   */
  public async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return; // 已经在关闭中
    }

    this.isShuttingDown = true;
    console.log('\n⚠️ 收到关闭信号，正在保存检查点...');

    try {
      // 保存当前检查点
      if (this.currentGameId > 0) {
        await this.saveCheckpoint(this.currentGameId);
        console.log(`✅ 检查点已保存: 游戏 ${this.currentGameId}`);
      }

      // 保存模型
      await this.saveRLModel();

      // 清理资源
      this.dispose();

      console.log('✅ 资源已清理，训练已安全退出');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('⚠️ 关闭过程中出错:', errorMessage);
    }
  }

  /**
   * 释放资源（增强版：完整清理）
   */
  public dispose(): void {
    try {
      // 清理网络资源
      if (this.network) {
        this.network.dispose();
      }

      // 清理状态缓存
      if (this.stateCache) {
        this.stateCache.clear();
      }

      // 清理游戏资源
      if (this.game) {
        this.game = null;
      }

      if (this.gameEventHandler) {
        this.gameEventHandler = null;
      }

      // 清理经验缓冲区
      this.experiences = [];

      console.log('🧹 资源已清理');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ 资源清理过程中出错:', errorMessage);
    }
  }
}

// 主函数（增强版：支持检查点恢复和优雅关闭）
async function main() {
  let rlTrainer: ReinforcementLearningSelfPlay | null = null;

  // 优雅关闭处理（新增：信号处理）
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ 收到 ${signal} 信号，正在优雅关闭...`);
    if (rlTrainer) {
      await rlTrainer.gracefulShutdown();
    }
    process.exit(0);
  };

  // 注册信号处理器
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // 处理未捕获的异常
  process.on('uncaughtException', async (error) => {
    console.error('❌ 未捕获的异常:', error);
    if (rlTrainer) {
      await rlTrainer.gracefulShutdown();
    }
    process.exit(1);
  });

  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    if (rlTrainer) {
      await rlTrainer.gracefulShutdown();
    }
    process.exit(1);
  });

  try {
    console.log('🀄 麻将AlphaZero强化学习自对弈训练');
    console.log('='.repeat(60));

    // 解析命令行参数
    const args = process.argv.slice(2);
    const resumeFromCheckpoint = args.includes('--resume') || args.includes('-r');
    const resumeGameIdArg = args.find(arg => arg.startsWith('--resume-from=') || arg.startsWith('--game-id='));
    const resumeGameId = resumeGameIdArg ? parseInt(resumeGameIdArg.split('=')[1]) : undefined;

    if (resumeFromCheckpoint) {
      console.log('🔄 检查点恢复模式已启用');
      if (resumeGameId !== undefined) {
        console.log(`   从游戏 ${resumeGameId} 的检查点恢复`);
      } else {
        console.log('   从最新检查点恢复');
      }
      console.log('');
    }

    rlTrainer = new ReinforcementLearningSelfPlay();
    await rlTrainer.startReinforcementLearning(resumeFromCheckpoint, resumeGameId);
    rlTrainer.dispose();

    console.log('✅ 强化学习自对弈训练成功完成！');

  } catch (error) {
    console.error('❌ 强化学习训练失败:', error);
    if (rlTrainer) {
      await rlTrainer.gracefulShutdown();
    }
    process.exit(1);
  }
}

main();
