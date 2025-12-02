/**
 * AlphaZero网络Worker线程
 * 
 * 在独立线程中运行TensorFlow.js预测，避免阻塞主事件循环
 */

import { parentPort, workerData } from 'worker_threads';
import * as tf from '@tensorflow/tfjs-node';
import { initializeTFJSOptimization } from '../../../shared/utils/tfjs-optimizer';
import '../../../shared/utils/tfjs-compat-fix';

// 初始化TensorFlow.js优化
initializeTFJSOptimization();

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

let model: tf.LayersModel | null = null;
let modelPath: string | null = null;

/**
 * 将Tensor数据转换为可序列化的格式
 */
function tensorToSerializable(tensor: tf.Tensor): { shape: number[]; data: Float32Array } {
  const data = tensor.dataSync() as Float32Array;
  return {
    shape: tensor.shape,
    data: data
  };
}

/**
 * 从可序列化格式创建Tensor
 */
function tensorFromSerializable(serialized: { shape: number[]; data: Float32Array }): tf.Tensor {
  return tf.tensor(serialized.data, serialized.shape);
}

/**
 * 处理预测请求
 */
async function handlePredict(inputData: { shape: number[]; data: Float32Array }): Promise<{ policyProbs: Float32Array; value: number }> {
  if (!model) {
    throw new Error('模型未加载');
  }

  const inputTensor = tensorFromSerializable(inputData);
  
  try {
    const [policyTensor, valueTensor] = model.predict(inputTensor) as [tf.Tensor2D, tf.Tensor2D];
    
    const policyData = policyTensor.dataSync() as Float32Array;
    const valueData = valueTensor.dataSync() as Float32Array;
    const value = valueData[0];
    
    // 清理张量
    inputTensor.dispose();
    policyTensor.dispose();
    valueTensor.dispose();
    
    return {
      policyProbs: policyData,
      value: value
    };
  } catch (error) {
    inputTensor.dispose();
    throw error;
  }
}

/**
 * 处理批量预测请求
 */
async function handlePredictBatch(inputsData: Array<{ shape: number[]; data: Float32Array }>): Promise<Array<{ policyProbs: Float32Array; value: number }>> {
  if (!model) {
    throw new Error('模型未加载');
  }

  const results: Array<{ policyProbs: Float32Array; value: number }> = [];
  
  // 逐个预测（避免批量预测阻塞）
  for (const inputData of inputsData) {
    const result = await handlePredict(inputData);
    results.push(result);
  }
  
  return results;
}

/**
 * 处理加载模型请求
 */
async function handleLoadModel(path: string): Promise<void> {
  try {
    if (model) {
      model.dispose();
    }
    model = await tf.loadLayersModel(`file://${path}`);
    modelPath = path;
  } catch (error) {
    throw new Error(`模型加载失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 处理消息
 */
parentPort?.on('message', async (message: WorkerMessage) => {
  const response: WorkerResponse = {
    type: 'result',
    id: message.id
  };

  try {
    switch (message.type) {
      case 'loadModel':
        await handleLoadModel(message.data);
        response.data = { success: true };
        break;

      case 'predict':
        const predictResult = await handlePredict(message.data);
        response.data = predictResult;
        break;

      case 'predictBatch':
        const batchResult = await handlePredictBatch(message.data);
        response.data = batchResult;
        break;

      case 'dispose':
        if (model) {
          model.dispose();
          model = null;
        }
        response.data = { success: true };
        break;

      default:
        throw new Error(`未知的消息类型: ${message.type}`);
    }
  } catch (error) {
    response.type = 'error';
    response.error = error instanceof Error ? error.message : String(error);
  }

  parentPort?.postMessage(response);
});

// 如果提供了workerData，说明是初始化时加载模型
if (workerData && workerData.modelPath) {
  handleLoadModel(workerData.modelPath).catch(error => {
    parentPort?.postMessage({
      type: 'error',
      id: 'init',
      error: error instanceof Error ? error.message : String(error)
    });
  });
}

