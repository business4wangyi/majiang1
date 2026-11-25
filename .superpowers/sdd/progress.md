# SDD Progress — majiang-ai-p2-ev-discard

Plan: docs/superpowers/plans/2026-11-20-majiang-ai-p2-ev-discard-plan.md
Workspace: in-place on develop（沿用 P1 SDD 惯例；无 commit unless user asks）
Started: 2026-11-21
Merge-base note: branch develop; task BASE = HEAD before each implementer
HEAD at start: 9cd390aa57414550503e25c251a100f72d4859e7

## Global Constraints (binding)

- 规格 SSOT：`docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md` §7.1 **P2**、§10.2
- 本计划只做 P2；P3 / 完整贝叶斯 / 蒙特卡洛局终模拟不在范围
- 禁止改 `src/majiang/core/` 权威；策略层只读调用已有 API
- 禁止新 npm 依赖；禁止改 `ai-alphazero/*`
- 禁止把日麻 Akochan / 国标权重直接当本仓规则权重
- 接受 `calculateShanten` 简化估算误差；测例绕开硬编码牌型
- 默认对局策略保持 `legacy`；`p2` 仅显式开关或 `MAJIANG_DISCARD_STRATEGY=p2`
- 提交说明中文；**仅当用户明确要求 commit 才提交**
- 规范：`docs/standards/rules/superpowers-artifacts.md`、`docs/standards/testing/quality.md`、`AGENTS.md`

## Tasks

- [x] Task 1: EV 评估器 · 进攻期望主序
- [x] Task 2: 点炮代价 · 现物与残牌加压
- [x] Task 3: AIPlayer 接入策略 `p2`
- [ ] Task 4: 对战评测脚本 · 1×P2 vs 3×legacy — **BLOCKED 等人拍板**
- [ ] Task 5: 规格收口与回归

## Ledger

Task 1: complete (no commit; working tree vs 9cd390a; review clean)
Note: brief 顺子手因向听下限改为刻子向（与 P1 同构）；mocha CJS runner 忽略文件参数，单测用内联 Mocha
Task 2: complete (no commit; review clean; tests-only lock of genbun + late risk)
Task 3: complete (no commit; review clean; AIPlayer p2 wired)
Task 4: BLOCKED → human chose **B** (2026-11-21): hard-shanten offense + gate ≥ P1 (~14.5%), ideal ≥20%

## Blocker note (2026-11-21)

P1 同构对战约 14.55%；计划闸 ≥25（均势）对「软 offense 公式 + 只调常数」不可达。
当前 risk 表曾偏离 plan（v3）；B 路径将改 offense 形态并复跑 1000。

## Minor findings roll-up

- T1: 测例未锁具体风牌/offense 分量；CJS runner 不能按文件过滤（工程债）
- T2: 用例名写「两张候选」实为三中张；brief 风反事实未保留；无单独 estimateDealInRisk 现物<中张单测
- T3: getAIMove 注释未提 p2；无 env=p2 测例；对战路径未注入 tilesLeft
