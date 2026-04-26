/**
 * AlphaZero网络Worker包装器
 * 
 * 在主线程中使用Worker线程进行预测，避免阻塞事件循环
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { OthelloBoard, OthelloPlayer } from '../../core/types';
import { IAlphaZeroNetwork, AlphaZeroPrediction } from './alphazero-network';

interface WorkerMessage {
  type: 'predict' | 'predictBatch' | 'loadModel' | 'dispose';
  id: string;
  data?: any;
}

interface WorkerResponse {
  type: 'result' | 'error';
  id: string;
  data?: any;
  error?: string;
}

/**
 * Worker包装的网络实现
 */
export class AlphaZeroNetworkWorkerWrapper implements IAlphaZeroNetwork {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }> = new Map();
  private requestIdCounter: number = 0;
  private modelPath: string | null = null;

  constructor(modelPath?: string) {
    this.initializeWorker(modelPath);
  }

  /**
   * 初始化Worker线程
   */
  private initializeWorker(modelPath?: string): void {
    // 直接使用TypeScript文件路径，通过execArgv让Worker进程支持TypeScript
    const workerTsPath = path.join(__dirname, 'alphazero-network-worker.ts');
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(workerTsPath)) {
      throw new Error(`Worker脚本文件不存在: ${workerTsPath}`);
    }
    
    // 使用ts-node直接加载TypeScript文件
    // 通过execArgv传递ts-node参数
    this.worker = new Worker(workerTsPath, {
      workerData: modelPath ? { modelPath } : undefined,
      execArgv: ['-r', 'ts-node/register'] // 在Worker进程中启用ts-node
    });
    
    // 当前实现直接加载 TypeScript worker 文件，不再创建临时文件。
    const cleanup = () => {};
    
    this.worker.on('exit', cleanup);
    
    // 进程退出时也清理
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    this.worker.on('message', (response: WorkerResponse) => {
      const pending = this.pendingRequests.get(response.id);
      if (pending) {
        this.pendingRequests.delete(response.id);
        if (response.type === 'error') {
          pending.reject(new Error(response.error || 'Worker错误'));
        } else {
          pending.resolve(response.data);
        }
      }
    });

    this.worker.on('error', (error) => {
      console.error('❌ [Worker] Worker线程错误:', error);
      // 清理所有待处理的请求
      for (const [id, pending] of this.pendingRequests.entries()) {
        pending.reject(error);
      }
      this.pendingRequests.clear();
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ [Worker] Worker线程异常退出，代码: ${code}`);
      }
      // 清理所有待处理的请求
      for (const [id, pending] of this.pendingRequests.entries()) {
        pending.reject(new Error(`Worker线程退出，代码: ${code}`));
      }
      this.pendingRequests.clear();
    });

    if (modelPath) {
      this.modelPath = modelPath;
    }
  }

  /**
   * 发送消息到Worker并等待响应
   */
  private async sendMessage(message: Omit<WorkerMessage, 'id'>): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker线程未初始化');
    }

    const id = `req_${++this.requestIdCounter}_${Date.now()}`;
    const messageWithId: WorkerMessage = { ...message, id };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // 添加超时保护（30秒）
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Worker请求超时（30秒）: ${message.type}`));
        }
      }, 30000);

      // 修改resolve/reject以清理超时
      const pending = this.pendingRequests.get(id);
      if (pending) {
        const originalResolve = pending.resolve;
        const originalReject = pending.reject;
        
        this.pendingRequests.set(id, {
          resolve: (value) => {
            clearTimeout(timeout);
            originalResolve(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            originalReject(error);
          }
        });
      }

      if (this.worker) {
        this.worker.postMessage(messageWithId);
      } else {
        clearTimeout(timeout);
        reject(new Error('Worker线程未初始化'));
      }
    });
  }

  /**
   * 将Tensor转换为可序列化格式
   */
  private tensorToSerializable(tensor: tf.Tensor): { shape: number[]; data: Float32Array } {
    const data = tensor.dataSync() as Float32Array;
    return {
      shape: tensor.shape,
      data: data
    };
  }

  /**
   * 从可序列化格式创建Tensor
   */
  private tensorFromSerializable(serialized: { shape: number[]; data: Float32Array }): tf.Tensor {
    return tf.tensor(serialized.data, serialized.shape);
  }

  boardToTensor(board: OthelloBoard, player: OthelloPlayer): tf.Tensor4D {
    // 这个方法在主线程中执行（快速操作）
    const boardArray = new Float32Array(8 * 8 * 3);
    let index = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = board[row][col];
        // 通道0: 当前玩家
        boardArray[index++] = cell === player ? 1 : 0;
        // 通道1: 对手
        boardArray[index++] = cell === (player === 'B' ? 'W' : 'B') ? 1 : 0;
        // 通道2: 空位
        boardArray[index++] = cell === null ? 1 : 0;
      }
    }

    return tf.tensor4d(boardArray, [1, 8, 8, 3]);
  }

  // 同步接口（为了兼容IAlphaZeroNetwork接口）
  // 注意：Worker模式实际上是异步的，但为了兼容接口，这里返回一个立即resolve的Promise
  // 实际使用中，网络适配器会检测predictAsync方法并使用它
  predict(boardTensor: tf.Tensor4D): AlphaZeroPrediction {
    // Worker模式不支持真正的同步调用
    // 这里返回一个零预测作为fallback，但实际应该使用predictAsync
    console.warn('⚠️ [Worker包装器] 检测到同步predict调用，Worker模式应使用异步方法');
    return {
      policyProbs: new Float32Array(64).fill(0),
      value: 0
    };
  }

  // 异步预测方法（Worker模式）- 这是实际使用的方法
  async predictAsync(boardTensor: tf.Tensor4D): Promise<AlphaZeroPrediction> {
    const serialized = this.tensorToSerializable(boardTensor);
    boardTensor.dispose(); // 立即释放主线程中的张量

    try {
      const result = await this.sendMessage({
        type: 'predict',
        data: serialized
      });

      return {
        policyProbs: result.policyProbs,
        value: result.value
      };
    } catch (error) {
      console.error('❌ [Worker包装器] 预测失败:', error);
      // 返回零预测作为fallback
      return {
        policyProbs: new Float32Array(64).fill(0),
        value: 0
      };
    }
  }

  // 同步接口（为了兼容IAlphaZeroNetwork接口）
  // 注意：Worker模式实际上是异步的，但为了兼容接口，这里返回零预测数组
  // 实际使用中，网络适配器会检测predictBatchAsync方法并使用它
  predictBatch(boardTensors: tf.Tensor4D[]): AlphaZeroPrediction[] {
    // Worker模式不支持真正的同步调用
    // 这里返回零预测数组作为fallback，但实际应该使用predictBatchAsync
    console.warn('⚠️ [Worker包装器] 检测到同步predictBatch调用，Worker模式应使用异步方法');
    return boardTensors.map(() => ({
      policyProbs: new Float32Array(64).fill(0),
      value: 0
    }));
  }

  // 异步批量预测方法（Worker模式）- 这是实际使用的方法
  async predictBatchAsync(boardTensors: tf.Tensor4D[]): Promise<AlphaZeroPrediction[]> {
    const serialized = boardTensors.map(t => this.tensorToSerializable(t));
    // 立即释放主线程中的张量
    boardTensors.forEach(t => t.dispose());

    try {
      const results = await this.sendMessage({
        type: 'predictBatch',
        data: serialized
      });

      return results.map((r: any) => ({
        policyProbs: r.policyProbs,
        value: r.value
      }));
    } catch (error) {
      console.error('❌ [Worker包装器] 批量预测失败:', error);
      // 返回零预测作为fallback
      return boardTensors.map(() => ({
        policyProbs: new Float32Array(64).fill(0),
        value: 0
      }));
    }
  }

  async train(statesBatch: tf.Tensor4D, targetPolicies: tf.Tensor2D, targetValues: tf.Tensor2D): Promise<{ policyLoss: number; valueLoss: number; totalLoss: number }> {
    // 训练仍在主线程中执行（因为需要优化器状态）
    throw new Error('Worker模式不支持训练，训练应在主线程中进行');
  }

  async loadModel(path: string): Promise<void> {
    this.modelPath = path;
    await this.sendMessage({
      type: 'loadModel',
      data: path
    });
  }

  async saveModel(path: string): Promise<void> {
    // Worker模式不支持保存（模型在Worker线程中）
    throw new Error('Worker模式不支持保存模型，请使用主线程网络进行保存');
  }

  dispose(): void {
    if (this.worker) {
      this.sendMessage({ type: 'dispose' }).finally(() => {
        this.worker?.terminate();
        this.worker = null;
      });
    }
  }

  getModelSummary(): void {
    console.warn('⚠️ Worker模式不支持getModelSummary');
  }

  getParameterCount(): number {
    console.warn('⚠️ Worker模式不支持getParameterCount');
    return 0;
  }
}
