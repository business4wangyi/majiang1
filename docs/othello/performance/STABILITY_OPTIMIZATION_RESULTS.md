# ✅ 稳定性优化结果报告（方案C）

## 🔔 当前基线结果（2026-04-23，唯一当前口径）

> 本文档仅顶部本章节表达“当前基线”。其余内容均为历史回溯，不构成当前默认配置。

### 当前基线复现实验口径

- 训练入口：`npm run -s othello:alphazero-fast-train`
- 关键环境变量：
  - `ALPHAZERO_TRAINING_PROFILE=scheme-c-doc-v1`
  - `ALPHAZERO_TOTAL_ITERATIONS=30`
  - `ALPHAZERO_EVALUATION_MODE=all-baselines`
  - `ALPHAZERO_EVALUATION_GAMES=30`
  - `ALPHAZERO_EVAL_SWAP_SIDES=true`
  - `ALPHAZERO_SEED=20260419`
- 日志证据：`/tmp/alphazero-exp-ss/schemec-docv1-aligned-30iter-20260422-rerun.log`

### 当前基线可复现结果（HEAD，2026-04-23）

| 指标 | 结果 |
|------|------|
| 总耗时 | 11.10 分钟 |
| 平均单轮耗时 | 0.37 分钟/迭代 |
| 迭代30 vs random | 26.7% |
| 迭代30 vs greedy | 40.0% |
| 迭代30 vs heuristic | 6.7% |
| 迭代30 加权分 | 20.7% |
| 最佳模型 | 迭代20（加权分 22.7%） |

### 当前结论

- 当前 `all-baselines` 加权评估分显著低于历史阶段记录中的“47.8%”类指标。
- 历史阶段的“自我对弈黑方胜率”与当前“多基线加权评估分”不是同一口径，禁止直接横向比较。

## 📚 历史阶段记录（仅回溯，非当前口径）

### 历史阶段结果摘要（2025-12-12）

- 历史阶段配置（方案C）：
  - `MCTS=250`
  - `selfPlayGames=10`
  - `lateEpochs=15`
  - `latePatience=1.5`
  - `lateMinDelta=0.006`
- 历史阶段观测结果（当时记录）：
  - 平均迭代时间：0.52 分钟
  - 100轮预估：52.1 分钟
  - 平均胜率：47.8%
  - 胜率标准差：13.94%

### 历史阶段说明

- 上述数据仅用于回溯“历史阶段优化过程”。
- 不代表当前默认参数，不作为当前基线复现实验依据。
- 任何“当前更优/更差”结论，必须以本文顶部“当前基线口径”复验结果为准。

## 📝 维护规则（强制）

1. 每次刷新当前最佳结果，必须同步更新本文件顶部“当前基线结果”章节。
2. 更新必须包含命令、环境变量、日期、日志路径与关键指标。
3. 宣称“稳定提升”前，至少完成同种子复验与多 seed 复验（不少于 3 个 seed）。
