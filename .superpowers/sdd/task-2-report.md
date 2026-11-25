# Task 2 Report: 点炮代价 · 现物与残牌加压

## What you implemented

仅加测锁定 Task 1 已落地的 `estimateDealInRisk` / `pickDiscardIndexByEv` 行为契约；**未改** `ev-discard-evaluator.ts`、`core/`、依赖或 runner。

新增 `describe('ev-discard-evaluator · 点炮代价')`：

1. **现物优先于危险中张**：可见弃牌注入同型后，进攻接近时应打出现物中张  
2. **残牌加压**：`tilesLeft` 小于 `LATE_TILES_LEFT` 时 `dealInRisk` 严格大于无加压基线  

保留 Task 1 进攻期望套件不动。

## What you tested and results

| 场景 | 命令 | 结果 |
| --- | --- | --- |
| 单文件 GREEN | 见下方 TDD Evidence | **3 passing**（进攻 1 + 点炮 2） |

说明：`scripts/test/run-mocha-cjs.js` 仍忽略文件参数；聚焦验证继续用内联 Mocha + `ts-node/register`（与 Task 1 相同）。

## TDD Evidence

### Fixture note（brief 顺子手 / 中张+风 不绿）

1. brief 顺子手（123456789万+234条+5筒）与 Task 1 同类：向听下限 0 下 offense 虚高，无法验证 defense/现物主导。  
2. 首版适配「刻子向 + 5筒 + 两孤张风」时：打风 `ukeire=15` / 打现物筒 `ukeire=11`，offense 差约 100，现有 `DEAL_IN_PENALTY=120` 下 defense 差不足，仍选风。  
3. **最终手牌**：刻子向 + 三张孤张中张（5万/5条/5筒）。无现物打危险中张；注入 5 筒现物后 offense 仍接近，defense 拉开打现物 5 筒。断言意图不变；**未调** `EV_CONSTANTS`。

### GREEN

Command:

```bash
node -e "
const Mocha = require('mocha');
require('ts-node/register');
const mocha = new Mocha({ timeout: 10000 });
mocha.addFile(require('path').resolve('tests/majiang/ev-discard-evaluator.test.ts'));
mocha.run(f => { process.exitCode = f ? 1 : 0; });
"
```

Output:

```
  ev-discard-evaluator · 进攻期望
    ✔ 有明显孤张字牌时，应优先打出该孤张（offense 主导）

  ev-discard-evaluator · 点炮代价
    ✔ 两张候选进攻接近时，应优先打出现物（可见弃牌中已有同型）
    ✔ 残牌加压：tilesLeft 小时 dealInRisk 不小于无加压

  3 passing (55ms)
```

## Files changed

| 路径 | 动作 |
| --- | --- |
| `tests/majiang/ev-discard-evaluator.test.ts` | Modify（加点炮代价套件；导入 `estimateDealInRisk`） |
| `.superpowers/sdd/task-2-report.md` | Create（本报告） |

未改：`src/majiang/strategy/heuristics/ev-discard-evaluator.ts`、`src/majiang/core/**`

## Self-review findings

- 行为契约已由测例锁定；实现侧现物风险 0.05、字牌/幺九/中张分层与 `LATE_RISK_MULT` 与 Task 1 一致，无需常数微调。  
- 测例相对 brief 手牌有意偏离并注释根因；额外断言「无现物不选 5 筒」强化「现物改变选择」而非仅碰巧选中张。  
- 禁止硬编码「若是 5 筒返回」——本任务无生产代码改动，合规。  
- Commit 按 controller 跳过。

## Issues / concerns

1. **CJS mocha runner 仍不支持按文件过滤** — 与 Task 1 相同；本任务未改 runner。  
2. **Plan/brief 顺子手与向听下限不兼容** — 建议后续同步更新 P2 plan/Task brief 手牌为刻子向，避免执行者反复踩坑。  
3. **现物 vs 风在 ukeire 差距大时可能仍选风** — 当前常数下「进攻接近」是前提；若产品期望「现物绝对优先」，需另议抬高 `DEAL_IN_PENALTY`（本次未改，以免扰动 offense 主序）。
