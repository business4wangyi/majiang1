/**
 * 麻将通用MCTS适配器
 * 
 * 将麻将游戏逻辑适配到通用MCTS框架
 * 实现IGameAdapter接口，使麻将可以使用通用MCTS
 */

import { IGameAdapter, INetwork, NetworkPrediction } from '../../../ai/common/mcts/interfaces/game-adapter';
import { GameSnapshot } from './majiang-game-adapter';
import { MajiangAction } from './majiang-action-decoder';
import { MajiangAlphaZeroNetworkTF, MajiangNetworkOutput } from './majiang-alphazero-network-tf';
import { MajiangStateVector, MajiangStateEncoder } from './majiang-state-encoder';
import { GameStateAdapter } from './types';

/**
 * 麻将游戏状态包装器
 * 将GameSnapshot包装为通用MCTS可以使用的状态
 */
export class MajiangGameState {
  constructor(public snapshot: GameSnapshot) {}
}

/**
 * 麻将通用MCTS游戏适配器
 */
export class MajiangUniversalMCTSAdapter implements IGameAdapter {
  private currentSnapshot: GameSnapshot | null = null;
  private gameAdapter: any; // MajiangGameAdapter实例，用于执行动作

  constructor(snapshot: GameSnapshot, gameAdapter?: any) {
    this.currentSnapshot = snapshot;
    this.gameAdapter = gameAdapter;
  }

  /**
   * 更新当前状态快照
   */
  updateSnapshot(snapshot: GameSnapshot): void {
    this.currentSnapshot = snapshot;
  }

  /**
   * 设置游戏适配器（用于执行动作）
   */
  setGameAdapter(gameAdapter: any): void {
    this.gameAdapter = gameAdapter;
  }

  getState(): MajiangGameState {
    if (!this.currentSnapshot) {
      throw new Error('No current snapshot available');
    }
    return new MajiangGameState(this.currentSnapshot);
  }

  getCurrentPlayer(): number {
    if (!this.currentSnapshot) {
      throw new Error('No current snapshot available');
    }
    // 返回当前玩家的索引（0-3）
    const gameState = this.currentSnapshot.gameState;
    return gameState.getCurrentPlayerIndex();
  }

  getLegalActions(state: MajiangGameState, player: number): MajiangAction[] {
    // 验证玩家索引
    if (player !== state.snapshot.gameState.getCurrentPlayerIndex()) {
      // 如果不是当前玩家，返回空动作列表
      return [];
    }
    
    // 返回快照中的可用动作
    return state.snapshot.availableActions.filter(action => action.isValid);
  }

  makeMove(state: MajiangGameState, action: MajiangAction, player: number): MajiangGameState {
    // 如果有gameAdapter，通过它执行动作并创建新快照
    if (this.gameAdapter) {
      try {
        // 执行动作
        const success = this.gameAdapter.executeAction(action);
        if (success) {
          // 创建新快照
          const newSnapshot = this.gameAdapter.createSnapshot();
          return new MajiangGameState(newSnapshot);
        }
      } catch (error) {
        console.warn(`[MajiangUniversalMCTSAdapter] Error executing action: ${error}`);
      }
    }
    
    // 如果没有gameAdapter或执行失败，返回当前状态的拷贝
    // 注意：这不会真正改变游戏状态，仅用于MCTS模拟
    const newSnapshot: GameSnapshot = {
      ...state.snapshot,
      timestamp: Date.now()
    };
    
    return new MajiangGameState(newSnapshot);
  }

  switchPlayer(player: number): number {
    // 麻将4人游戏，玩家索引循环
    return (player + 1) % 4;
  }

  isGameOver(state: MajiangGameState): boolean {
    const status = state.snapshot.gameState.getStatus();
    return status === 'FINISHED';
  }

  evaluateTerminalState(state: MajiangGameState, player: number): number {
    // 简化实现：返回0（平局）
    // 实际应该根据游戏结果计算价值
    // TODO: 实现真实的终端状态评估
    return 0;
  }

  getActionKey(action: MajiangAction): string {
    // 生成动作的唯一键
    if (action.type === 'DISCARD' && action.tile) {
      return `DISCARD_${action.tile.type}_${action.tile.value}`;
    }
    return `${action.type}_${action.tileIndex || 0}`;
  }

  cloneState(state: MajiangGameState): MajiangGameState {
    // 深拷贝快照
    const newSnapshot: GameSnapshot = {
      gameState: state.snapshot.gameState, // GameState是接口，可能需要特殊处理
      currentPlayer: state.snapshot.currentPlayer,
      availableActions: [...state.snapshot.availableActions],
      stateVector: {
        handTiles: new Float32Array(state.snapshot.stateVector.handTiles),
        visibleTiles: new Float32Array(state.snapshot.stateVector.visibleTiles),
        playerStates: new Float32Array(state.snapshot.stateVector.playerStates),
        gameContext: new Float32Array(state.snapshot.stateVector.gameContext)
      },
      timestamp: state.snapshot.timestamp
    };
    
    return new MajiangGameState(newSnapshot);
  }

  getActionPrior(
    action: MajiangAction,
    legalActions: MajiangAction[],
    prediction: NetworkPrediction
  ): number {
    // 将MajiangAction映射到39维概率向量的索引
    // 动作空间：34种打牌动作 + 5种特殊动作 = 39维
    
    if (action.type === 'DISCARD' && action.tileIndex !== undefined) {
      // 打牌动作：索引0-33
      if (action.tileIndex >= 0 && action.tileIndex < 34) {
        return prediction.policyProbs[action.tileIndex] || 0;
      }
    } else {
      // 特殊动作：索引34-38
      const specialActionIndex = this.getSpecialActionIndex(action.type);
      if (specialActionIndex >= 0) {
        const index = 34 + specialActionIndex;
        if (index < prediction.policyProbs.length) {
          return prediction.policyProbs[index] || 0;
        }
      }
    }
    
    // 如果没有找到对应的概率，返回均匀分布
    return 1.0 / legalActions.length;
  }

  /**
   * 获取特殊动作的索引
   */
  private getSpecialActionIndex(actionType: MajiangAction['type']): number {
    switch (actionType) {
      case 'CHI': return 0;
      case 'PENG': return 1;
      case 'GANG': return 2;
      case 'HU': return 3;
      case 'PASS': return 4;
      default: return -1;
    }
  }
}

/**
 * 麻将网络适配器
 * 将MajiangAlphaZeroNetworkTF适配到INetwork接口
 */
export class MajiangUniversalNetworkAdapter implements INetwork {
  private network: MajiangAlphaZeroNetworkTF;

  constructor(network: MajiangAlphaZeroNetworkTF) {
    this.network = network;
  }

  encodeState(state: MajiangGameState, player: number): MajiangStateVector {
    // 使用快照中的状态向量
    return state.snapshot.stateVector;
  }

  async predict(input: MajiangStateVector): Promise<NetworkPrediction> {
    // 调用网络进行预测
    const output: MajiangNetworkOutput = await this.network.forward(input);
    
    return {
      policyProbs: output.actionProbabilities,
      value: output.valueEstimation
    };
  }
}

