# Review package Task 6
## spec diff
(spec was untracked at branch start — show §9/§10)
152:## 9. 验收（本文件本身）
153-
154-- [x] 算法族 + 代表系统表完整  
155-- [x] 本仓模块对照表完整  
156-- [x] 推荐路径写死为 P1→P2，P3 单独立项  
157-- [x] 硬不做与规则边界明确  
158-- [x] 用户要求写计划后，已开 `writing-plans`（P1）：`docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md`
159-- [ ] P1 实现交付验收（人确认）：计划已执行、代码在工作区、回归测绿；**未**勾「已交付」——待用户确认后再勾
160-- [ ] P2 期望值审牌层：P1 落地后再另开 plan（独立 plan，不并入本 P1）
161-- [ ] P3 深度 RL：须单独立项 brainstorm，不在本调研包施工
162-
163:## 10. 后续闸门
164-
165-1. **P1**：按 `docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md` 执行（向听 / 有效牌 / 现物危险度）  
166-   - 事实备注（2026-11-20 Task 6）：plan 已执行；`discard-ranker` / `rule-engine` / `game-session` 相关回归经 `node scripts/test/run-mocha-cjs.js` 全绿（3376 passing）；代码仍在工作区、未 commit；**人验收未勾**
167-2. **P2**：P1 验收后再开独立 plan（期望值审牌层）；不与本 P1 plan 合并  
168-3. **P3**：先开新 brainstorm（算力、许可、规则变体）再写 plan  
169-4. 提交时机按 `commit-policy.md`：用户明确要求提交时再 commit

## report head
# Task 6 Report：回归与规格回写

**Status:** PASS  
**Commits:** none（按 Critical overrides / brief Step 3：仅用户要求时才 commit）  
**Date:** 2026-11-20

## 1. 回归命令

```bash
node scripts/test/run-mocha-cjs.js \
  tests/majiang/discard-ranker.test.ts \
  tests/majiang/rule-engine.test.ts \
  tests/majiang/game-session.test.ts
```

说明：`scripts/test/run-mocha-cjs.js` 当前实现会 `glob.sync('tests/**/*.test.ts')` 装载全量测例，**忽略** CLI 传入的路径参数；等价于全仓 Mocha 回归（含上述三文件）。

## 2. 测试结果摘要

| 项 | 值 |
|----|----|
| Exit code | `0` |
| Summary line | `3376 passing (15s)` |
| Failures | `0` |
| Duration | ~15s（墙钟约 24s） |
| game-session 脆弱断言 | 未触发；**未**改测例、**未**回退 ranker |

关键套件（节选，均 PASS）：

- `discard-ranker · 向听主排序`
- `discard-ranker · 有效牌破平`（含 ukeire 破平）
- `discard-ranker · 现物危险度`
- `AIPlayer · P1 接入`
- `GameSession (CAP-ENG-SESSION / MJ-ACC-ENG-01)` 及相关 dual/session 烟测
- `rule-engine` 相关向听 / 胡牌条件等（含在全量 3376 内）

末行原文：

```
  3376 passing (15s)
```

## 3. 规格回写

文件：`docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md`

| 条目 | 动作 |
|------|------|
| §9 writing-plans | 已核：`[x]` 已开并链到 `docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md` |
| §9 P1 人验收 | **新增未勾项**：计划已执行 / 工作区有码 / 测绿；**不**勾成已交付 |
| §10.1 P1 | 补充事实备注：plan 已执行、测绿、未 commit、人验收未勾 |
| §10.2 P2 | 保持「另开独立 plan」，明确不并入本 P1 |

## 4. Concerns

1. `run-mocha-cjs.js` 不按文件参数过滤，Task brief 中的「只跑三文件」实际变成全量回归；结果仍绿，但若日后需要窄跑，脚本需另改（本 Task 未改脚本）。
2. P1 实现仍在工作区、无人确认勾选；提交须等用户明确要求（brief Step 3）。
3. 未宣称补齐「对手听牌概率」等 Bakuuchi 级模型；现物危险度仅为 P1 范围。

## 5. Out of scope（本 Task 遵守）
