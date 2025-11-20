// {{ AURA-X: Add - 经验回放机制实现，用于DQN训练. Approval: 寸止(ID:1735819200). }}
// {{ Source: 基于深度强化学习最佳实践设计 }}

import { OthelloBoard, OthelloPlayer, OthelloAction } from '../../core/types';

/**
 * 经验数据接口
 */
export interface Experience {
  /** 当前状态 */
  state: OthelloBoard;
  /** 当前玩家 */
  player: OthelloPlayer;
  /** 执行的动作 */
  action: OthelloAction;
  /** 获得的奖励 */
  reward: number;
  /** 下一个状态 */
  nextState: OthelloBoard;
  /** 下一个玩家 */
  nextPlayer: OthelloPlayer;
  /** 是否为终止状态 */
  done: boolean;
  /** 经验的时间戳 */
  timestamp: number;
}

/**
 * 经验回放缓冲区配置
 */
export interface ExperienceReplayConfig {
  /** 缓冲区最大容量 */
  maxSize: number;
  /** 批次大小 */
  batchSize: number;
  /** 是否使用优先经验回放 */
  usePrioritized: boolean;
  /** 优先级指数 */
  priorityAlpha: number;
  /** 重要性采样指数 */
  priorityBeta: number;
  /** 重要性采样指数增长率 */
  priorityBetaIncrement: number;
}

/**
 * 默认经验回放配置
 */
export const DEFAULT_EXPERIENCE_REPLAY_CONFIG: ExperienceReplayConfig = {
  maxSize: 100000,           // 10万条经验
  batchSize: 64,             // 批次大小64
  usePrioritized: false,     // 暂不使用优先经验回放
  priorityAlpha: 0.6,        // 优先级指数
  priorityBeta: 0.4,         // 重要性采样指数
  priorityBetaIncrement: 0.001 // 指数增长率
};

/**
 * 优先经验数据（用于优先经验回放）
 */
interface PrioritizedExperience extends Experience {
  /** 优先级（基于TD误差） */
  priority: number;
  /** 重要性采样权重 */
  weight: number;
}

/**
 * 经验回放缓冲区类
 */
export class ExperienceReplay {
  private config: ExperienceReplayConfig;
  private buffer: Experience[] = [];
  private priorities: number[] = []; // 用于优先经验回放
  private currentIndex: number = 0;
  private isFull: boolean = false;

  /**
   * 构造函数
   * @param config 经验回放配置
   */
  constructor(config: ExperienceReplayConfig = DEFAULT_EXPERIENCE_REPLAY_CONFIG) {
    this.config = { ...config };
  }

  /**
   * 添加经验到缓冲区
   * @param experience 经验数据
   * @param priority 优先级（可选，用于优先经验回放）
   */
  public addExperience(experience: Experience, priority?: number): void {
    const exp = { ...experience };
    
    if (this.buffer.length < this.config.maxSize) {
      // 缓冲区未满，直接添加
      this.buffer.push(exp);
      if (this.config.usePrioritized) {
        this.priorities.push(priority || 1.0);
      }
    } else {
      // 缓冲区已满，覆盖最旧的经验
      this.buffer[this.currentIndex] = exp;
      if (this.config.usePrioritized) {
        this.priorities[this.currentIndex] = priority || 1.0;
      }
      this.isFull = true;
    }
    
    this.currentIndex = (this.currentIndex + 1) % this.config.maxSize;
  }

  /**
   * 从缓冲区采样经验批次
   * @returns 经验批次
   */
  public sampleBatch(): Experience[] {
    const availableSize = this.isFull ? this.config.maxSize : this.buffer.length;
    
    if (availableSize < this.config.batchSize) {
      // 如果可用经验不足，返回所有可用经验
      return [...this.buffer.slice(0, availableSize)];
    }

    if (this.config.usePrioritized) {
      return this.samplePrioritizedBatch();
    } else {
      return this.sampleUniformBatch();
    }
  }

  /**
   * 均匀随机采样
   * @returns 经验批次
   */
  private sampleUniformBatch(): Experience[] {
    const availableSize = this.isFull ? this.config.maxSize : this.buffer.length;
    const batch: Experience[] = [];
    const indices = new Set<number>();

    while (indices.size < this.config.batchSize) {
      const randomIndex = Math.floor(Math.random() * availableSize);
      indices.add(randomIndex);
    }

    for (const index of indices) {
      batch.push({ ...this.buffer[index] });
    }

    return batch;
  }

  /**
   * 优先经验回放采样
   * @returns 经验批次
   */
  private samplePrioritizedBatch(): Experience[] {
    const availableSize = this.isFull ? this.config.maxSize : this.buffer.length;
    const batch: Experience[] = [];
    
    // 计算优先级总和
    const totalPriority = this.priorities.slice(0, availableSize)
      .reduce((sum, p) => sum + Math.pow(p, this.config.priorityAlpha), 0);

    for (let i = 0; i < this.config.batchSize; i++) {
      const randomValue = Math.random() * totalPriority;
      let cumulativePriority = 0;
      let selectedIndex = 0;

      for (let j = 0; j < availableSize; j++) {
        cumulativePriority += Math.pow(this.priorities[j], this.config.priorityAlpha);
        if (cumulativePriority >= randomValue) {
          selectedIndex = j;
          break;
        }
      }

      // 计算重要性采样权重
      const probability = Math.pow(this.priorities[selectedIndex], this.config.priorityAlpha) / totalPriority;
      const weight = Math.pow(1.0 / (availableSize * probability), this.config.priorityBeta);

      const experience = { ...this.buffer[selectedIndex] };
      (experience as any).weight = weight; // 添加权重信息

      batch.push(experience);
    }

    // 更新beta值
    this.config.priorityBeta = Math.min(1.0, this.config.priorityBeta + this.config.priorityBetaIncrement);

    return batch;
  }

  /**
   * 更新经验的优先级（用于优先经验回放）
   * @param indices 经验索引数组
   * @param priorities 新的优先级数组
   */
  public updatePriorities(indices: number[], priorities: number[]): void {
    if (!this.config.usePrioritized) return;

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (index >= 0 && index < this.priorities.length) {
        this.priorities[index] = Math.max(priorities[i], 1e-6); // 避免优先级为0
      }
    }
  }

  /**
   * 获取缓冲区大小
   */
  public size(): number {
    return this.isFull ? this.config.maxSize : this.buffer.length;
  }

  /**
   * 检查是否有足够的经验进行训练
   */
  public canSample(): boolean {
    return this.size() >= this.config.batchSize;
  }

  /**
   * 清空缓冲区
   */
  public clear(): void {
    this.buffer = [];
    this.priorities = [];
    this.currentIndex = 0;
    this.isFull = false;
  }

  /**
   * 获取配置信息
   */
  public getConfig(): ExperienceReplayConfig {
    return { ...this.config };
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    size: number;
    maxSize: number;
    batchSize: number;
    usePrioritized: boolean;
    canSample: boolean;
    fillRatio: number;
  } {
    const size = this.size();
    return {
      size,
      maxSize: this.config.maxSize,
      batchSize: this.config.batchSize,
      usePrioritized: this.config.usePrioritized,
      canSample: this.canSample(),
      fillRatio: size / this.config.maxSize
    };
  }

  /**
   * 获取最近的经验（用于调试）
   * @param count 获取数量
   */
  public getRecentExperiences(count: number = 10): Experience[] {
    const size = this.size();
    const actualCount = Math.min(count, size);
    const recent: Experience[] = [];

    for (let i = 0; i < actualCount; i++) {
      const index = (this.currentIndex - 1 - i + this.config.maxSize) % this.config.maxSize;
      if (index < this.buffer.length) {
        recent.push({ ...this.buffer[index] });
      }
    }

    return recent;
  }

  /**
   * 计算奖励统计信息
   */
  public getRewardStats(): {
    meanReward: number;
    maxReward: number;
    minReward: number;
    positiveRatio: number;
  } {
    const size = this.size();
    if (size === 0) {
      return { meanReward: 0, maxReward: 0, minReward: 0, positiveRatio: 0 };
    }

    const rewards = this.buffer.slice(0, size).map(exp => exp.reward);
    const sum = rewards.reduce((a, b) => a + b, 0);
    const positive = rewards.filter(r => r > 0).length;

    return {
      meanReward: sum / size,
      maxReward: Math.max(...rewards),
      minReward: Math.min(...rewards),
      positiveRatio: positive / size
    };
  }
}
