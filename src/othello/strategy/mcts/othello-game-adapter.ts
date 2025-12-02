/**
 * 黑白棋游戏适配器
 * 
 * 实现IGameAdapter接口，将通用MCTS适配到黑白棋游戏
 */

import { IGameAdapter, INetwork, NetworkPrediction } from '../../../ai/common/mcts/interfaces/game-adapter';
import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { getLegalActions, makeMove, isGameOver, countPieces } from '../../core/game';
import { IAlphaZeroNetwork } from '../networks/alphazero-network';

/**
 * 黑白棋游戏适配器实现
 */
export class OthelloGameAdapter implements IGameAdapter {
  private network: IAlphaZeroNetwork;

  constructor(network: IAlphaZeroNetwork) {
    this.network = network;
  }

  getState(): OthelloBoard {
    // 适配器不持有状态，状态由MCTS节点管理
    throw new Error('getState should not be called directly');
  }

  getCurrentPlayer(): OthelloPlayer {
    // 适配器不持有玩家，玩家由MCTS节点管理
    throw new Error('getCurrentPlayer should not be called directly');
  }

  getLegalActions(state: OthelloBoard, player: OthelloPlayer): OthelloAction[] {
    return getLegalActions(state, player);
  }

  makeMove(state: OthelloBoard, action: OthelloAction, player: OthelloPlayer): OthelloBoard {
    return makeMove(state, action, player);
  }

  switchPlayer(player: OthelloPlayer): OthelloPlayer {
    return player === 'B' ? 'W' : 'B';
  }

  isGameOver(state: OthelloBoard): boolean {
    return isGameOver(state);
  }

  evaluateTerminalState(state: OthelloBoard, player: OthelloPlayer): number {
    const { B, W } = countPieces(state);
    
    if (B > W) {
      return player === 'B' ? 1 : -1;
    } else if (W > B) {
      return player === 'W' ? 1 : -1;
    } else {
      return 0; // 平局
    }
  }

  getActionKey(action: OthelloAction): string {
    return `${action.row},${action.col}`;
  }

  cloneState(state: OthelloBoard): OthelloBoard {
    return state.map(row => [...row]);
  }

  getActionPrior(
    action: OthelloAction,
    legalActions: OthelloAction[],
    prediction: NetworkPrediction
  ): number {
    // 黑白棋：动作是 (row, col)，映射到 8x8=64 维概率向量的索引
    const actionIndex = action.row * 8 + action.col;
    
    if (prediction.policyProbs.length === 0) {
      // 如果没有预测结果，返回均匀分布
      return 1.0 / legalActions.length;
    }
    
    // 确保索引在有效范围内
    if (actionIndex >= 0 && actionIndex < prediction.policyProbs.length) {
      return prediction.policyProbs[actionIndex];
    }
    
    // 如果索引无效，返回均匀分布
    return 1.0 / legalActions.length;
  }

  /**
   * 生成状态哈希键（用于缓存）
   * 将棋盘状态和玩家转换为唯一字符串
   */
  getStateKey(state: OthelloBoard, player: OthelloPlayer): string {
    // 将8x8棋盘转换为字符串表示
    let boardStr = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = state[row][col];
        boardStr += cell === 'B' ? 'B' : cell === 'W' ? 'W' : '.';
      }
    }
    return `${boardStr}:${player}`;
  }
}

/**
 * 黑白棋网络适配器
 * 将IAlphaZeroNetwork适配到INetwork接口
 */
export class OthelloNetworkAdapter implements INetwork {
  private network: IAlphaZeroNetwork;

  constructor(network: IAlphaZeroNetwork) {
    this.network = network;
  }

  encodeState(state: OthelloBoard, player: OthelloPlayer): any {
    return this.network.boardToTensor(state, player);
  }

  async predict(input: any): Promise<NetworkPrediction> {
    // 检查网络是否支持异步预测（Worker模式）
    if ('predictAsync' in this.network && typeof (this.network as any).predictAsync === 'function') {
      // 使用异步预测（Worker模式）
      try {
        const prediction = await (this.network as any).predictAsync(input);
        return {
          policyProbs: prediction.policyProbs,
          value: prediction.value
        };
      } catch (error) {
        console.error('❌ [网络预测] 异步预测失败:', error);
        return {
          policyProbs: new Array(64).fill(0),
          value: 0
        };
      }
    } else {
      // 同步预测（传统模式），包装为异步以避免阻塞事件循环
      return Promise.race([
        new Promise<NetworkPrediction>((resolve, reject) => {
          setTimeout(() => {
            try {
              const prediction = this.network.predict(input);
              resolve({
                policyProbs: prediction.policyProbs,
                value: prediction.value
              });
            } catch (error) {
              console.error('❌ [网络预测] 预测失败:', error);
              reject(error);
            }
          }, 0); // 延迟0ms，确保在下一个事件循环中执行
        }),
        // 单次预测超时：5秒
        new Promise<NetworkPrediction>((_, reject) => 
          setTimeout(() => reject(new Error('单次预测超时（5秒）')), 5000)
        )
      ]).catch(error => {
        // 预测失败时返回零预测
        console.warn(`⚠️ [网络适配器] 预测失败，使用零预测: ${error instanceof Error ? error.message : String(error)}`);
        return {
          policyProbs: new Array(64).fill(0),
          value: 0
        };
      });
    }
  }

  async predictBatch(inputs: any[]): Promise<NetworkPrediction[]> {
    if (inputs.length === 0) {
      return [];
    }

    // 检查网络是否支持异步批量预测（Worker模式）
    if ('predictBatchAsync' in this.network && typeof (this.network as any).predictBatchAsync === 'function') {
      // 使用异步批量预测（Worker模式）
      try {
        const predictions = await (this.network as any).predictBatchAsync(inputs);
        return predictions.map((p: any) => ({
          policyProbs: p.policyProbs,
          value: p.value
        }));
      } catch (error) {
        console.error('❌ [网络适配器] 异步批量预测失败:', error);
        // 回退到单次预测
        return this.fallbackToSinglePredictions(inputs);
      }
    } else if (this.network.predictBatch) {
      // 同步批量预测（传统模式），改为单次预测以避免阻塞
      return this.fallbackToSinglePredictions(inputs);
    } else {
      // 回退到单次预测
      return this.fallbackToSinglePredictions(inputs);
    }
  }

  /**
   * 回退到单次预测（避免阻塞）
   */
  private async fallbackToSinglePredictions(inputs: any[]): Promise<NetworkPrediction[]> {
    const allPredictions: NetworkPrediction[] = [];
    
    // 逐个预测，每次预测后让出控制权
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      // 每个预测包装为异步，并添加超时保护
      const prediction = await Promise.race([
        new Promise<NetworkPrediction>((resolve, reject) => {
          // 使用setTimeout确保在下一个事件循环中执行
          setTimeout(() => {
            try {
              // 使用单次预测，避免批量预测阻塞
              const singlePrediction = this.network.predict(input);
              resolve({
                policyProbs: singlePrediction.policyProbs,
                value: singlePrediction.value
              });
            } catch (error) {
              reject(error);
            }
          }, 0);
        }),
        // 单次预测超时：5秒
        new Promise<NetworkPrediction>((_, reject) => 
          setTimeout(() => reject(new Error(`单次预测超时（5秒）`)), 5000)
        )
      ]).catch(error => {
        // 预测失败时返回零预测
        console.warn(`⚠️ [网络适配器] 预测失败，使用零预测: ${error instanceof Error ? error.message : String(error)}`);
        return {
          policyProbs: new Array(64).fill(0),
          value: 0
        };
      });
      
      allPredictions.push(prediction);
      
      // 在每个预测之间让出控制权，允许超时检查
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return allPredictions;
  }
}

