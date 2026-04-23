# 🎯 AlphaZero训练当前状态总结

## 🚨 当前生效基线（2026-04-23）

> 本节覆盖旧“当前状态”描述。历史内容保留用于回溯，不代表当前成熟效果。

### 当前推荐复现实验配置

```bash
ALPHAZERO_TRAINING_PROFILE=scheme-c-doc-v1 \
ALPHAZERO_TOTAL_ITERATIONS=30 \
ALPHAZERO_EVALUATION_MODE=all-baselines \
ALPHAZERO_EVALUATION_GAMES=30 \
ALPHAZERO_EVAL_SWAP_SIDES=true \
ALPHAZERO_SEED=20260419 \
npm run -s othello:alphazero-fast-train
```

### 当前可复现效果（HEAD，2026-04-23）

- 日志：`/tmp/alphazero-exp-ss/schemec-docv1-aligned-30iter-20260422-rerun.log`
- 总耗时：11.10 分钟（平均 0.37 分钟/迭代）
- 迭代30评估：
  - vs random：26.7%
  - vs greedy：40.0%
  - vs heuristic：6.7%
  - 加权分：20.7%
- 最佳模型：迭代20（加权分 22.7%）

### 当前结论

- 以 `all-baselines` 加权口径衡量，当前结果尚未达到历史文档中“稳定成熟”的描述水平。
- 后续所有“更强”结论必须基于同口径复验，并同步更新本文件与 `performance/STABILITY_OPTIMIZATION_RESULTS.md`。

### 更新纪律（强制）

1. 每次实验若刷新最佳加权分，必须在文档顶部更新“当前可复现效果”。
2. 文档更新必须附：日期、命令、环境变量、日志路径、关键指标（random/greedy/heuristic/weighted）。
3. 未复验（至少同种子重跑一次）的结果，不得写为“当前基线”。

### 多 seed 复验与门禁（新增）

- 批量复验命令：
  - `npm run othello:alphazero-multiseed-run`
- 汇总与门禁命令：
  - `npm run othello:alphazero-multiseed-summary`
  - `npm run othello:alphazero-multiseed-gate`
- 默认输出目录：`/tmp/alphazero-exp-ss/multiseed`
  - `manifest.tsv`：每个 seed 的执行状态与日志路径
  - `summary.tsv`：按 seed 并排汇总（总耗时、random/greedy/heuristic/weighted）
  - `gate-result.txt`：程序化门禁结论（PASS/FAIL）

门禁默认规则（可通过环境变量覆盖）：
- 样本数 `>= 3`（`MIN_SAMPLES`）
- `weighted` 均值 `> 22.7`（`BASELINE_WEIGHTED`）
- `heuristic` 均值 `> 6.7`（`BASELINE_HEURISTIC`）
- `weighted` 标准差 `<= 6.0`（`MAX_STD_WEIGHTED`）
- `heuristic` 标准差 `<= 8.0`（`MAX_STD_HEURISTIC`）

## 📊 当前基准配置（2025-12-12）

### 推荐配置

```typescript
{
  // MCTS配置
  mctsBatchSize: 16,                    // MCTS批量推理批次大小
  initialMCTSSimulations: 300,          // MCTS模拟次数（固定）
  finalMCTSSimulations: 300,            // MCTS模拟次数（固定）
  earlyTerminationThreshold: 0.90,      // 提前终止阈值
  minSimulations: 0.18,                 // 最小模拟比例（18%）
  
  // 训练配置
  trainingBatchSize: 48,                // 训练批次大小
  earlyTrainingEpochs: 5,               // 早期训练轮数
  lateTrainingEpochs: 20,                // 后期训练轮数上限
  batchStateEncoding: true,             // 批量状态编码
  
  // 并行化配置
  parallelGames: 4,                     // 并行游戏数（GitHub Actions限制）
  selfPlayGames: 12,                    // 自我对弈局数/迭代
  evaluationFrequency: 10,              // 评估频率
  
  // 早停配置（分阶段）
  earlyStoppingEnabled: true,           // 早停机制
  stagedEarlyStopping: true,            // 分阶段早停
  earlyIterationPatience: 3,            // 早期迭代(1-10)：patience=3
  earlyIterationMinDelta: 0.01,         // 早期迭代：minDelta=0.01
  lateIterationPatience: 2,             // 后期迭代(11+)：patience=2
  lateIterationMinDelta: 0.005,         // 后期迭代：minDelta=0.005
  
  // 优化功能
  preSampleBatches: true,               // 预采样训练批次
  warmupTraining: true,                 // 预热训练
  optimizedDataSampling: true,          // 优化数据采样
  optimizedNetworkTraining: true,       // 优化网络训练
}
```

### GitHub Actions 运行方式

- **workflow**: `.github/workflows/alphazero-perf.yml`
- **触发**: `workflow_dispatch`（可选输入 `iterations`，`selfplay_games`）
- **Runner**: `ubuntu-latest`，4核限制（`ALPHAZERO_PARALLEL_GAMES=4`）
- **默认参数**: 5轮迭代，12局自我对弈，MCTS 300次固定，评估频率10
- **日志**: `/tmp/alphazero-perf.log` 作为artifact上传

## 📈 性能基准（10轮稳定测试，2025-12-12）

| 指标 | 平均值 | 最小值 | 最大值 | 标准差 | 备注 |
|------|--------|--------|--------|--------|------|
| **平均迭代时间** | 0.55分钟/迭代 | 0.48分钟 | 0.73分钟 | 0.08分钟 | 稳定基准 |
| **平均自我对弈时间** | 0.26分钟/迭代 | 0.26分钟 | 0.27分钟 | 0.01分钟 | 非常稳定 |
| **平均训练时间** | 0.28分钟/迭代 | 0.22分钟 | 0.39分钟 | 0.06分钟 | 经验池增长影响 |
| **平均训练轮数** | 5.4 epoch/迭代 | 4.0 epoch | 8.0 epoch | 1.5 epoch | 经验池增长导致轮数增加 |
| **单epoch时间** | 3.1秒/epoch | - | - | - | 基于平均训练时间和轮数 |
| **100轮预估** | 0.92小时（55.2分钟） | - | - | - | 基于10轮稳定测试 |
| **目标** | ≤ 30分钟 | - | - | - | 需减少45.6% |

## 🎮 训练质量基准（10轮测试）

| 指标 | 数值 | 备注 |
|------|------|------|
| **平均自我对弈黑方胜率** | 47.5% | 范围25.0%-66.7%，标准差13.05% |
| **平均游戏长度** | 60.4步 | 范围60.3-60.8步 |
| **策略损失趋势** | 1.0657 → 1.2440 (+0.1783) | 略有上升，需关注 |
| **价值损失趋势** | 0.8329 → 0.9283 (+0.0954) | 略有上升，需关注 |

## 🔍 关键发现

### 性能特点
- ✅ **自我对弈时间非常稳定**：标准差仅0.01分钟，MCTS 300次配置稳定
- ✅ **10轮测试数据更可靠**：包含更多数据点，更能反映长期训练趋势
- ⚠️ **训练轮数随经验池增长**：从4.5 epoch增加到5.4 epoch（+20%），需要关注
- ⚠️ **训练时间波动较大**：标准差0.06分钟，可能受经验池大小影响

### 训练质量特点
- ✅ **胜率波动正常**：标准差13.05%，在合理范围内
- ⚠️ **损失趋势略有上升**：策略损失和价值损失都有上升趋势，需要关注
- ✅ **游戏长度稳定**：平均60.4步，说明训练过程稳定

## 📊 性能瓶颈分析

### 时间分布
- **自我对弈时间**: 0.26分钟（47.3%）- 最大瓶颈
- **训练时间**: 0.28分钟（50.9%）- 第二大瓶颈
- **其他时间**: 0.01分钟（1.8%）- 已优化

### 优化空间
1. **自我对弈时间**（47.3%）：优化空间10-20%
   - MCTS模拟次数：300次（固定）
   - 并行游戏数：4核（限制）
   - 优化方向：MCTS提前终止、批量推理优化

2. **训练时间**（50.9%）：优化空间5-15%
   - 平均训练轮数：5.4 epoch
   - 单epoch时间：3.1秒
   - 优化方向：早停参数微调、单epoch时间优化

## 🚀 优化历史

### 已完成的优化
1. ✅ **分阶段早停机制**：早期迭代更保守，后期迭代更激进
2. ✅ **MCTS提前终止**：阈值0.90，最小模拟18%
3. ✅ **批量状态编码**：减少训练时间
4. ✅ **优化数据采样**：使用Set避免重复
5. ✅ **优化网络训练**：减少重复预测调用

### 已回滚的优化
1. ❌ **阶段1优化（A1+A2+A3）**：已回滚
   - A1: MCTS提前终止（0.88阈值，16%最小模拟）- 效果不明显
   - A2: 训练批次大小（64批次）- 导致训练时间增加
   - A3: 早停参数（patience=1.5, minDelta=0.004）- 导致训练轮数增加

## 🎯 优化目标（更新：2025-12-12）

### 性能目标（优先级：高）⭐⭐⭐⭐⭐
- **100轮总时间**: ≤ 30分钟（当前55.2分钟，优化后46.8分钟，需减少16.8分钟）
- **平均迭代时间**: ≤ 0.30分钟/迭代（当前0.55分钟，优化后0.47分钟）
- **质量要求**: 保证训练质量不下降（胜率≥45%，优化后48.6% ✅）

### ⚠️ 当前优化状态（更新：2025-12-12）

**方案C（稳定性优化）：MCTS 250次 + 10局/迭代**

- ✅ **性能优化成功**：迭代时间减少5.3%（0.55 → 0.52分钟）
- ✅ **效果保持良好**：平均胜率47.8%（≥45%）
- ✅ **训练稳定性问题已解决**：胜率标准差13.94%（≤15%，从26.84%降低48.0%）
- ⚠️ **距离目标仍有差距**：还需减少22.1分钟（42.4%）

**推荐配置**：方案C（MCTS 250次 + 10局/迭代）
- 解决了训练稳定性问题
- 保持了训练质量和性能优势
- 在性能、效果和稳定性之间取得了良好平衡

详见：[稳定性优化结果报告](performance/STABILITY_OPTIMIZATION_RESULTS.md)

**详细优化方案**: [30分钟目标优化方案](performance/PERFORMANCE_OPTIMIZATION_30MIN_TARGET.md)  
**性能与效果平衡分析**: [平衡分析报告](performance/PERFORMANCE_EFFECT_BALANCE_ANALYSIS.md) ⭐ **重要**

## 📝 相关文档

- [性能基准详细报告](performance/ALPHAZERO_PERFORMANCE_BASELINE.md)
- [30分钟目标优化方案](performance/PERFORMANCE_OPTIMIZATION_30MIN_TARGET.md) ⭐ **推荐**
- [下一步优化方案](performance/NEXT_OPTIMIZATION_RECOMMENDATIONS.md)
- [优化空间分析](performance/OPTIMIZATION_SPACE_ANALYSIS.md)
- [方案B实施报告](performance/SCHEME_B_IMPLEMENTATION.md)
- [历史优化计划](performance/NEXT_OPTIMIZATION_PLAN.md)
