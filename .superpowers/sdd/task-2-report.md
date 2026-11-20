# Task 2 Report: 有效牌（ukeire）破平

## Status

**DONE_WITH_CONCERNS**

## Commits

none（按 critical override 跳过 Step 5）

## TDD Evidence

### RED

1. Appended `describe('discard-ranker · 有效牌破平')` with brief 顺子手（123456万 + 234条 + 789筒 + 南北）。
2. Command: `node scripts/test/run-mocha-cjs.js tests/majiang/discard-ranker.test.ts --timeout 20000`
3. Result: **FAIL** — `expected '万' to equal '风'`（`ukeire` 仍为占位 0，排序落到更小 `index` 的万）。

### GREEN（实现）

1. In `discard-ranker.ts`: added `SUIT_MAX`、`countUkeire(probe)`；`scoreDiscardCandidates` 写入 `ukeire = countUkeire(probe)`。
2. Re-ran same command with brief 顺子手：**仍 FAIL** — 全员 `shantenAfter=0`、`ukeire=0`。
   - 根因：`RuleEngine.calculateRegularShanten` 对向听做了 `Math.max(0, …)`，听牌（sh=0）后无法出现严格下降，故 `countUkeire` 恒为 0。
3. Per override「若 shanten 近似破坏测例手牌，仅调整测例构造」：改用刻子向手牌  
   `222万 / 555条 / 888筒 / 66万 / 1条 / 南 / 北`。
   - 同 `shantenAfter=1` 组：风孤张 `ukeire=17` > 孤张条 `ukeire=16`（若 ukeire 全 0 会因 index 误选条）。
4. Re-ran: **3373 passing (11s)**，两段 `discard-ranker` describe 均 ✔。

## Files Changed

| File | Change |
| --- | --- |
| `src/majiang/strategy/heuristics/discard-ranker.ts` | `countUkeire` + 填充 `ukeire` |
| `tests/majiang/discard-ranker.test.ts` | Task 2 describe；测例手牌改为刻子向 |
| `.superpowers/sdd/task-2-report.md` | 本报告 |

## Self-review

- 未改 `core/`、未加依赖、未动 `AIPlayer`。
- 排序仍：`shantenAfter ↑` → `ukeire ↓` → `danger ↑` → `legacyValue ↓` → `index`。
- `countUkeire`：枚举种类（不乘剩余张数），与 brief 一致。
- 测试跑法遵循仓库 CJS loader，未用 bare `npx mocha -r ts-node/register`。

## Concerns

1. **向听下限 0**：听牌局面 `ukeire` 恒 0，破平失效；后续若要真听牌进张面，需允许 shanten=-1（或单独判定和了）。
2. **测例与 brief 牌面不同**：为适配现有近似公式而改构造；语义仍覆盖「同向听选更大 ukeire」。
3. **性能**：每候选 × ~34 种试摸 × `calculateShanten`；本单测约数秒级，可接受，但全量对局热路径若频繁调用需再缓存/剪枝。
