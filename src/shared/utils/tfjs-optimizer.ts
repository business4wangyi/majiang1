/**
 * TensorFlow.js性能优化配置
 * 
 * 提供TensorFlow.js的性能优化设置，包括：
 * - 启用生产模式
 * - 优化内存管理
 * - 配置后端设置
 * - 内存清理策略
 */

import * as tf from '@tensorflow/tfjs-node';

/**
 * TensorFlow.js优化配置选项
 */
export interface TFJSOptimizationConfig {
  /** 启用生产模式（禁用调试检查） */
  enableProdMode: boolean;
  /** 启用内存优化 */
  enableMemoryOptimization: boolean;
  /** 内存清理阈值（MB） */
  memoryThresholdMB: number;
  /** 自动清理间隔（毫秒） */
  autoCleanupInterval: number;
  /** 启用WebGL后端（浏览器环境） */
  enableWebGL: boolean;
}

/**
 * 默认优化配置
 */
export const DEFAULT_TFJS_OPTIMIZATION_CONFIG: TFJSOptimizationConfig = {
  enableProdMode: true,
  enableMemoryOptimization: true,
  memoryThresholdMB: 500, // 500MB阈值
  autoCleanupInterval: 30000, // 30秒自动清理
  enableWebGL: false // Node.js环境不使用WebGL
};

/**
 * TensorFlow.js优化器类
 */
export class TFJSOptimizer {
  private config: TFJSOptimizationConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private lastCleanupTime: number = 0;

  constructor(config: TFJSOptimizationConfig = DEFAULT_TFJS_OPTIMIZATION_CONFIG) {
    this.config = { ...config };
    this.initialize();
  }

  /**
   * 初始化TensorFlow.js优化
   */
  private initialize(): void {
    // 启用生产模式（禁用调试检查，提升性能）
    if (this.config.enableProdMode) {
      tf.enableProdMode();
      console.log('🚀 TensorFlow.js生产模式已启用');
    }

    // 配置内存管理
    if (this.config.enableMemoryOptimization) {
      this.setupMemoryOptimization();
      console.log('💾 TensorFlow.js内存优化已启用');
    }

    // 显示当前后端信息
    this.logBackendInfo();
  }

  /**
   * 设置内存优化
   */
  private setupMemoryOptimization(): void {
    // 设置内存清理阈值
    const originalMemory = tf.memory();
    console.log(`📊 TensorFlow.js初始内存: ${(originalMemory.numBytes / 1024 / 1024).toFixed(2)}MB`);

    // 定期清理内存
    if (this.config.autoCleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupMemory();
      }, this.config.autoCleanupInterval);
    }
  }

  /**
   * 清理内存
   */
  cleanupMemory(): void {
    const beforeMemory = tf.memory();
    const beforeMB = beforeMemory.numBytes / 1024 / 1024;

    // 如果内存超过阈值，执行清理
    if (beforeMB > this.config.memoryThresholdMB) {
      // 清理未使用的张量
      tf.engine().startScope();
      tf.engine().endScope();
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const afterMemory = tf.memory();
      const afterMB = afterMemory.numBytes / 1024 / 1024;
      const freedMB = beforeMB - afterMB;

      if (freedMB > 10) { // 只记录释放超过10MB的情况
        console.log(`🧹 TensorFlow.js内存清理: ${beforeMB.toFixed(2)}MB → ${afterMB.toFixed(2)}MB (释放 ${freedMB.toFixed(2)}MB)`);
      }
    }

    this.lastCleanupTime = Date.now();
  }

  /**
   * 记录后端信息
   */
  private logBackendInfo(): void {
    const backend = tf.getBackend();
    const memory = tf.memory();
    console.log(`🔧 TensorFlow.js后端: ${backend}`);
    console.log(`   内存使用: ${(memory.numBytes / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   张量数量: ${memory.numTensors}`);
  }

  /**
   * 获取内存使用情况
   */
  getMemoryInfo(): {
    numBytes: number;
    numTensors: number;
    numBytesMB: number;
  } {
    const memory = tf.memory();
    return {
      numBytes: memory.numBytes,
      numTensors: memory.numTensors,
      numBytesMB: memory.numBytes / 1024 / 1024
    };
  }

  /**
   * 手动触发内存清理
   */
  forceCleanup(): void {
    this.cleanupMemory();
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

/**
 * 全局TensorFlow.js优化器实例
 */
let globalOptimizer: TFJSOptimizer | null = null;

/**
 * 初始化全局TensorFlow.js优化
 */
export function initializeTFJSOptimization(
  config?: Partial<TFJSOptimizationConfig>
): TFJSOptimizer {
  if (!globalOptimizer) {
    const fullConfig = { ...DEFAULT_TFJS_OPTIMIZATION_CONFIG, ...config };
    globalOptimizer = new TFJSOptimizer(fullConfig);
  }
  return globalOptimizer;
}

/**
 * 获取全局优化器实例
 */
export function getTFJSOptimizer(): TFJSOptimizer | null {
  return globalOptimizer;
}

/**
 * 清理全局优化器
 */
export function disposeTFJSOptimization(): void {
  if (globalOptimizer) {
    globalOptimizer.dispose();
    globalOptimizer = null;
  }
}

