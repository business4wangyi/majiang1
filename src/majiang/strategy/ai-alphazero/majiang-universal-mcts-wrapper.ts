/**
 * 麻将通用MCTS包装器
 * 
 * 使用通用MCTS框架，提供与原MCTS相同的接口
 * 用于渐进式迁移
 */

import { GameSnapshot } from './majiang-game-adapter';
import { MajiangAction } from './majiang-action-decoder';
import { AlphaZeroMCTS, MCTSConfig, DEFAULT_MCTS_CONFIG, MCTSSearchResult } from '../../../ai/common/mcts';
import { MajiangUniversalMCTSAdapter, MajiangUniversalNetworkAdapter, MajiangGameState } from './majiang-universal-mcts-adapter';
import { MajiangAlphaZeroNetworkTF } from './majiang-alphazero-network-tf';

/**
 * 通用MCTS包装器类
 * 提供与原MajiangAlphaZeroAgent MCTS相同的接口
 */
export class MajiangUniversalMCTSWrapper {
  private universalMCTS: AlphaZeroMCTS<MajiangGameState, MajiangAction, number>;
  private config: MCTSConfig;
  private gameAdapter: MajiangUniversalMCTSAdapter;
  private networkAdapter: MajiangUniversalNetworkAdapter;

  constructor(
    network: MajiangAlphaZeroNetworkTF,
    snapshot: GameSnapshot,
    config: MCTSConfig = DEFAULT_MCTS_CONFIG,
    gameAdapter?: any // 可选的MajiangGameAdapter，用于执行动作
  ) {
    this.config = { ...config };
    
    // 创建适配器
    this.gameAdapter = new MajiangUniversalMCTSAdapter(snapshot, gameAdapter);
    this.networkAdapter = new MajiangUniversalNetworkAdapter(network);
    
    // 创建通用MCTS
    this.universalMCTS = new AlphaZeroMCTS(
      this.networkAdapter,
      this.gameAdapter,
      this.config
    );
  }

  /**
   * 设置游戏适配器（用于执行动作）
   */
  setGameAdapter(gameAdapter: any): void {
    this.gameAdapter.setGameAdapter(gameAdapter);
  }

  /**
   * 更新游戏快照
   */
  updateSnapshot(snapshot: GameSnapshot): void {
    this.gameAdapter.updateSnapshot(snapshot);
  }

  /**
   * 执行MCTS搜索
   * 返回格式与原实现兼容（异步接口）
   */
  async search(snapshot: GameSnapshot): Promise<Map<string, number>> {
    // 更新适配器的快照
    this.gameAdapter.updateSnapshot(snapshot);
    
    // 获取当前状态和玩家
    const state = this.gameAdapter.getState();
    const player = this.gameAdapter.getCurrentPlayer();
    
    // 执行MCTS搜索
    const result = await this.universalMCTS.search(state, player);
    
    // 返回动作概率Map（格式与原实现兼容）
    return result.actionProbs;
  }

  /**
   * 根据温度选择动作
   */
  selectActionByTemperature(
    actionProbs: Map<string, number>,
    legalActions: MajiangAction[],
    temperature: number
  ): MajiangAction | null {
    if (legalActions.length === 0) {
      return null;
    }

    if (temperature === 0) {
      // 贪婪选择：选择概率最高的动作
      let bestAction: MajiangAction | null = null;
      let bestProb = -1;
      
      for (const action of legalActions) {
        const actionKey = this.gameAdapter.getActionKey(action);
        const prob = actionProbs.get(actionKey) || 0;
        if (prob > bestProb) {
          bestProb = prob;
          bestAction = action;
        }
      }
      
      return bestAction;
    }

    // 应用温度采样
    const adjustedProbs: Array<{ action: MajiangAction; prob: number }> = [];
    let sum = 0;
    
    for (const action of legalActions) {
      const actionKey = this.gameAdapter.getActionKey(action);
      const prob = actionProbs.get(actionKey) || 0;
      const adjustedProb = Math.pow(prob, 1 / temperature);
      adjustedProbs.push({ action, prob: adjustedProb });
      sum += adjustedProb;
    }
    
    // 归一化
    const normalizedProbs = adjustedProbs.map(item => ({
      action: item.action,
      prob: item.prob / sum
    }));
    
    // 采样
    const random = Math.random();
    let cumulative = 0;
    
    for (const item of normalizedProbs) {
      cumulative += item.prob;
      if (random <= cumulative) {
        return item.action;
      }
    }
    
    // 如果采样失败，返回第一个动作
    return legalActions[0];
  }
}

