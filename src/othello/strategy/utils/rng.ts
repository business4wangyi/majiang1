// 简单的可复现随机数生成器（LCG）
export class LCG {
  private seed: number;
  constructor(seed: number) {
    // 避免种子为0
    this.seed = (seed >>> 0) || 1;
  }
  // 返回 [0,1) 的浮点随机数
  random(): number {
    // 32位线性同余生成器参数（Numerical Recipes）
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }
  // 返回 [0, n) 的整数
  randint(n: number): number {
    return Math.floor(this.random() * n);
  }
}

// 全局rng实例（可选）
let globalRng: LCG | null = null;

export function initGlobalRng(seed?: number): void {
  globalRng = typeof seed === 'number' ? new LCG(seed) : null;
}

export function rngRandom(): number {
  return globalRng ? globalRng.random() : Math.random();
}

export function rngRandInt(n: number): number {
  return globalRng ? globalRng.randint(n) : Math.floor(Math.random() * n);
}

