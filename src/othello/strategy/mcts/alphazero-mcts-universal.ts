/**
 * 黑白棋通用MCTS包装器
 * 
 * 使用通用MCTS框架，提供与原MCTS相同的接口
 * 用于渐进式迁移
 */

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';
import { AlphaZeroMCTS, MCTSConfig, DEFAULT_MCTS_CONFIG, MCTSSearchResult } from '../../../ai/common/mcts';
import { OthelloGameAdapter, OthelloNetworkAdapter } from './othello-game-adapter';
import { IAlphaZeroNetwork } from '../networks/alphazero-network';
import { getLegalActions } from '../../core/game';

/**
 * 通用MCTS包装器类
 * 提供与原AlphaZeroMCTS相同的接口
 */
export class AlphaZeroMCTSUniversal {
  public readonly universalMCTS: AlphaZeroMCTS<OthelloBoard, OthelloAction, OthelloPlayer>;
  private config: MCTSConfig;

  constructor(network: IAlphaZeroNetwork, config: MCTSConfig = DEFAULT_MCTS_CONFIG, batchSize: number = 8) {
    this.config = { ...config };
    
    // 创建适配器
    const gameAdapter = new OthelloGameAdapter(network);
    const networkAdapter = new OthelloNetworkAdapter(network);
    
    // 创建通用MCTS（启用缓存，缓存大小10000，批量大小可配置）
    this.universalMCTS = new AlphaZeroMCTS(
      networkAdapter, 
      gameAdapter, 
      this.config,
      true,  // enableCache: true
      10000, // maxCacheSize: 10000（从5000增加到10000以进一步提升性能）
      batchSize  // batchSize: 可配置（优化：支持更大的批量推理批次）
    );
  }

  /**
   * 执行MCTS搜索
   * 返回格式与原实现兼容（同步接口）
   * 
   * 注意：通用MCTS的search是async，这里使用同步等待机制
   * 在实际使用中，如果性能有问题，可以考虑将agent改为async
   */
  search(board: OthelloBoard, player: OthelloPlayer): { actionProbs: number[]; rootValue: number } {
    // 使用同步方式调用（通用MCTS的search是async，但这里需要同步接口）
    let result: MCTSSearchResult | null = null;
    let error: any = null;
    let resolved = false;
    
    // 启动异步搜索
    this.universalMCTS.search(board, player).then(
      (res) => {
        result = res;
        resolved = true;
      },
      (err) => {
        error = err;
        resolved = true;
      }
    );
    
    // 同步等待Promise完成
    // 使用改进的等待机制，确保事件循环能够执行Promise回调
    const startTime = Date.now();
    const timeout = 60000; // 60秒超时
    
    // 尝试使用deasync（如果已安装）
    try {
      const deasync = require('deasync');
      // 使用runLoopOnce来确保事件循环有机会执行
      let iterations = 0;
      const maxIterations = timeout / 10; // 每10ms检查一次
      while (!resolved && iterations < maxIterations) {
        deasync.runLoopOnce();
        iterations++;
        if (Date.now() - startTime > timeout) {
          throw new Error('MCTS search timeout');
        }
      }
      if (!resolved && iterations >= maxIterations) {
        throw new Error('MCTS search timeout (max iterations reached)');
      }
    } catch (e) {
      // deasync不可用或出错，使用改进的循环等待
      // 使用process.nextTick和setImmediate来确保事件循环能够执行Promise回调
      const { setImmediate } = require('timers');
      
      while (!resolved) {
        if (Date.now() - startTime > timeout) {
          throw new Error('MCTS search timeout');
        }
        
        // 使用process.nextTick和setImmediate让出控制权
        // 确保事件循环有机会执行Promise回调
        let tickDone = false;
        let immediateDone = false;
        
        process.nextTick(() => {
          tickDone = true;
        });
        
        setImmediate(() => {
          immediateDone = true;
        });
        
        // 等待nextTick和setImmediate回调执行（最多等待20ms）
        const waitStart = Date.now();
        while ((!tickDone || !immediateDone) && Date.now() - waitStart < 20) {
          // 空循环等待，但时间更短
        }
        
        // 如果回调执行了，说明事件循环有机会运行
        // 此时Promise回调可能已经执行，检查resolved状态
        if (resolved) {
          break;
        }
        
        // 如果仍未解决，短暂休眠后继续
        const sleepStart = Date.now();
        while (Date.now() - sleepStart < 5) {
          // 短暂休眠，避免CPU占用过高
        }
      }
    }
    
    if (error) {
      throw error;
    }
    
    if (!result) {
      throw new Error('MCTS search returned null result');
    }
    
    // TypeScript类型断言：此时result一定不为null
    const searchResult: MCTSSearchResult = result;
    
    // 将Map转换为数组格式（与原实现兼容）
    const actionProbs = new Array(64).fill(0);
    const legalActions = getLegalActions(board, player);
    
    for (const action of legalActions) {
      const actionKey = `${action.row},${action.col}`;
      const prob = searchResult.actionProbs.get(actionKey) || 0;
      const actionIndex = action.row * 8 + action.col;
      actionProbs[actionIndex] = prob;
    }
    
    return {
      actionProbs,
      rootValue: searchResult.rootValue
    };
  }

  /**
   * 根据温度选择动作索引
   */
  selectActionByTemperature(actionProbs: number[], temperature: number): number {
    if (temperature === 0) {
      // 贪婪选择
      return actionProbs.indexOf(Math.max(...actionProbs));
    }
    
    // 应用温度
    const adjustedProbs = actionProbs.map(prob => Math.pow(prob, 1 / temperature));
    const sum = adjustedProbs.reduce((a, b) => a + b, 0);
    const normalizedProbs = adjustedProbs.map(prob => prob / sum);
    
    // 采样
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < normalizedProbs.length; i++) {
      cumulative += normalizedProbs[i];
      if (random <= cumulative) {
        return i;
      }
    }
    
    return actionProbs.indexOf(Math.max(...actionProbs));
  }
}

