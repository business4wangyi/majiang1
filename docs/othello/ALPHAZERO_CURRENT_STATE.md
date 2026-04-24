# 🎯 AlphaZero训练当前状态总结

## 🚨 当前生效基线（2026-04-23）

> 本文件只保留“当前基线”口径。历史细节已迁移为索引入口，避免双口径误读。

### 当前推荐复现实验配置（唯一口径）

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
- 后续所有“更强”结论必须基于同口径复验，并同步更新本文件与 `performance/STABILITY_OPTIMIZATION_RESULTS.md` 顶部“当前基线”章节。

### 更新纪律（强制）

1. 每次实验若刷新最佳加权分，必须更新本文件“当前可复现效果”。
2. 更新必须附：日期、命令、环境变量、日志路径、关键指标（random/greedy/heuristic/weighted）。
3. 未复验（至少同种子重跑一次）的结果，不得写为“当前基线”。

### 多 seed 复验与门禁

- 批量复验命令：
  - `npm run othello:alphazero-multiseed-run`
- 汇总与门禁命令：
  - `npm run othello:alphazero-multiseed-summary`
  - `npm run othello:alphazero-multiseed-gate`
- 默认输出目录：`/tmp/alphazero-exp-ss/multiseed`
  - `manifest.tsv`：每个 seed 的最新执行状态与日志路径（同一 seed 复跑会覆盖旧状态）
  - `summary.tsv`：按 seed 并排汇总（总耗时、random/greedy/heuristic/weighted）
  - `gate-result.txt`：程序化门禁结论（PASS/FAIL）

门禁默认规则（可通过环境变量覆盖）：
- 样本数 `>= 3`（`MIN_SAMPLES`）
- `weighted` 均值 `> 22.7`（`BASELINE_WEIGHTED`）
- `heuristic` 均值 `> 6.7`（`BASELINE_HEURISTIC`）
- `weighted` 标准差 `<= 6.0`（`MAX_STD_WEIGHTED`）
- `heuristic` 标准差 `<= 8.0`（`MAX_STD_HEURISTIC`）

## 📚 历史记录索引（仅回溯，非当前口径）

- 历史稳定性阶段记录：`docs/othello/performance/STABILITY_OPTIMIZATION_RESULTS.md`（历史章节）
- 历史性能基准：`docs/othello/performance/ALPHAZERO_PERFORMANCE_BASELINE.md`
- 历史30分钟优化方案：`docs/othello/performance/PERFORMANCE_OPTIMIZATION_30MIN_TARGET.md`
- 历史平衡分析：`docs/othello/performance/PERFORMANCE_EFFECT_BALANCE_ANALYSIS.md`
- 历史后续计划：`docs/othello/performance/NEXT_OPTIMIZATION_PLAN.md`
