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
    // IAlphaZeroNetwork.predict是同步方法，直接调用并立即返回Promise
    try {
      const prediction = this.network.predict(input);
      return Promise.resolve({
        policyProbs: prediction.policyProbs,
        value: prediction.value
      });
    } catch (error) {
      console.error('❌ [网络预测] 预测失败:', error);
      throw error;
    }
  }

  async predictBatch(inputs: any[]): Promise<NetworkPrediction[]> {
    if (this.network.predictBatch && inputs.length > 0) {
      try {
        // 关键修复：将大批次拆分成小批次（每次2个），避免长时间阻塞事件循环
        // 这样超时机制可以在每个小批次之间检查，及时中断长时间运行的预测
        const BATCH_CHUNK_SIZE = 2; // 每个小批次的大小（减少阻塞时间）
        const allPredictions: NetworkPrediction[] = [];
        
        // 将输入拆分成多个小批次
        for (let i = 0; i < inputs.length; i += BATCH_CHUNK_SIZE) {
          const chunk = inputs.slice(i, i + BATCH_CHUNK_SIZE);
          
          // 每个小批次包装为异步，确保不阻塞事件循环
          const chunkPredictions = await new Promise<NetworkPrediction[]>((resolve, reject) => {
            // 使用setTimeout确保在下一个事件循环中执行，不阻塞当前事件循环
            // 这允许Promise.race中的超时Promise有机会执行
            setTimeout(() => {
              try {
                // predictBatch是同步方法，但在异步上下文中执行
                // 由于批次较小（2个），阻塞时间较短，超时机制可以正常工作
                const syncPredictions = this.network.predictBatch!(chunk);
                if (!syncPredictions || syncPredictions.length !== chunk.length) {
                  reject(new Error(`批量预测返回结果数量不匹配: 期望${chunk.length}，实际${syncPredictions?.length || 0}`));
                  return;
                }
                const mappedPredictions = syncPredictions.map(p => ({
                  policyProbs: p.policyProbs,
                  value: p.value
                }));
                resolve(mappedPredictions);
              } catch (error) {
                reject(error);
              }
            }, 0); // 延迟0ms，确保在下一个事件循环中执行
          });
          
          allPredictions.push(...chunkPredictions);
          
          // 在每个小批次之间让出控制权，允许超时检查
          // 使用setImmediate确保事件循环有机会执行超时检查
          await new Promise(resolve => setImmediate(resolve));
        }
        
        return allPredictions;
      } catch (error) {
        // 批量预测出错，回退到单次预测
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ [网络适配器] 批量预测失败，回退到单次预测: ${errorMsg}`);
        const fallbackPredictions: NetworkPrediction[] = [];
        for (const input of inputs) {
          fallbackPredictions.push(await this.predict(input));
        }
        return fallbackPredictions;
      }
    } else {
      // 回退到单次预测
      const predictions: NetworkPrediction[] = [];
      for (const input of inputs) {
        predictions.push(await this.predict(input));
      }
      return predictions;
    }
  }
}

