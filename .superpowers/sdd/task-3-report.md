# Task 3 Report: 简单危险度（现物安全）

## Status

**PASS** — TDD 完成；未提交。

## What changed

| File | Change |
| --- | --- |
| `tests/majiang/discard-ranker.test.ts` | 追加 `discard-ranker · 现物危险度`：同向听/ukeire 时断言优先打出现物 JIAN(中) |
| `src/majiang/strategy/heuristics/discard-ranker.ts` | 实现 `tileKey` / `scoreDanger`；`scoreDiscardCandidates` 用 `scoreDanger(tile, ctx.visibleDiscards)` 替代 placeholder `0` |

### Danger 规则（与 brief 一致）

```
visibleDiscards 中 type+value 匹配 → 0（现物）
else FENG / JIAN → 1
else → 2
```

排序仍为：`shantenAfter ↑` → `ukeire ↓` → `danger ↑` → `legacyValue ↓` → `index ↑`。

## TDD evidence

1. **红**：仅加测例、danger 仍为 0 → `AssertionError: expected '万' to equal '箭'`（索引平局打出万 1）
2. **绿**：接入 `scoreDanger` 后全套通过

```bash
node scripts/test/run-mocha-cjs.js tests/majiang/discard-ranker.test.ts
# 3374 passing (11s), 0 failing
```

## Test hand note

Brief 顺子手（123/456万 + 234条 + 789筒 + 南 + 中，中已现物）在本仓 `calculateShanten` 下限 0 / ukeire 恒 0 下，全员 sh/ukeire 并列，danger 成为有效破平键；**未改测例手牌**，现物 JIAN 即可胜出。

## Commits

**none**（Critical override：DO NOT git commit）

## Concerns / follow-ups

- Danger 为启发式，非对手听牌概率；P1 不做放铳模型。
- 现物判定仅 `type+value`，不区分自家/他家弃牌来源（与 brief `visibleDiscards?` 契约一致）。
- Task 1–2 工作树改动仍未提交；本任务 diff 叠在其上。
