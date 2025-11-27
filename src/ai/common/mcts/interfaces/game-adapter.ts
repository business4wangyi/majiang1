/**
 * 游戏适配器接口
 * 
 * 用于将通用MCTS算法适配到不同的游戏
 * 游戏特定的逻辑通过实现此接口注入到通用MCTS中
 */

/**
 * 游戏状态类型（泛型）
 */
export type GameState = any;

/**
 * 游戏动作类型（泛型）
 */
export type GameAction = any;

/**
 * 游戏玩家类型（泛型）
 */
export type GamePlayer = any;

/**
 * 神经网络预测结果
 */
export interface NetworkPrediction {
  /** 动作概率分布 */
  policyProbs: Float32Array | number[];
  /** 状态价值评估 */
  value: number;
}

/**
 * 神经网络接口
 */
export interface INetwork {
  /**
   * 将游戏状态编码为神经网络输入
   */
  encodeState(state: GameState, player: GamePlayer): any;
  
  /**
   * 预测动作概率和状态价值
   */
  predict(input: any): NetworkPrediction | Promise<NetworkPrediction>;
  
  /**
   * 批量预测（可选，用于性能优化）
   */
  predictBatch?(inputs: any[]): NetworkPrediction[] | Promise<NetworkPrediction[]>;
}

/**
 * 游戏适配器接口
 */
export interface IGameAdapter {
  /**
   * 获取当前游戏状态
   */
  getState(): GameState;
  
  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): GamePlayer;
  
  /**
   * 获取合法动作列表
   */
  getLegalActions(state: GameState, player: GamePlayer): GameAction[];
  
  /**
   * 执行动作，返回新状态
   */
  makeMove(state: GameState, action: GameAction, player: GamePlayer): GameState;
  
  /**
   * 切换玩家
   */
  switchPlayer(player: GamePlayer): GamePlayer;
  
  /**
   * 判断游戏是否结束
   */
  isGameOver(state: GameState): boolean;
  
  /**
   * 评估终端状态的价值（从当前玩家视角）
   */
  evaluateTerminalState(state: GameState, player: GamePlayer): number;
  
  /**
   * 生成动作的唯一键（用于Map存储）
   */
  getActionKey(action: GameAction): string;
  
  /**
   * 深拷贝游戏状态
   */
  cloneState(state: GameState): GameState;
  
  /**
   * 获取动作的先验概率索引
   * 将游戏动作映射到神经网络输出的概率索引
   * @param action 游戏动作
   * @param legalActions 合法动作列表
   * @param prediction 神经网络预测结果
   * @returns 该动作对应的先验概率值
   */
  getActionPrior(
    action: GameAction,
    legalActions: GameAction[],
    prediction: NetworkPrediction
  ): number;
}

