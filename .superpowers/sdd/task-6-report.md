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

- 无 git commit  
- 无 core 公式修复  
- 无 P2 / P3 施工  
