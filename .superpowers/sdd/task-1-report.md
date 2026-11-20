# Task 1 Report · 弃牌排序器 · 向听差主排序

## Status

**DONE**

Commits: none（Critical override：不执行 Step 5）

## What implemented

在 `src/majiang/strategy/heuristics/` 落地纯函数弃牌排序器（不改 `core/`、不改 `AIPlayer`）：

| 文件 | 动作 |
| --- | --- |
| `src/majiang/strategy/heuristics/discard-ranker.ts` | 新建：`scoreDiscardCandidates` / `pickDiscardIndex`；主键 `shantenAfter↑`，ukeire/danger 占位 0 |
| `src/majiang/strategy/heuristics/index.ts` | 新建：re-export |
| `src/majiang/strategy/index.ts` | 末尾增加 `export * from './heuristics'` |
| `tests/majiang/discard-ranker.test.ts` | 新建：向听主排序测例 |

排序键（与 brief 一致）：`shantenAfter ↑ → ukeire ↓ → danger ↑ → legacyValue ↑ → index ↑`。

探测手牌通过 `cloneProbe` 克隆后调用 `RuleEngine.calculateShanten`（消费 core，不改公式）。

## TDD evidence

### RED（模块不存在）

命令（与仓库默认 CJS 装载一致；brief 的裸 `npx mocha -r ts-node/register` 在本仓会走 ESM 解析失败，见 Concerns）：

```bash
node scripts/test/run-mocha-cjs.js
# 等价单测加载失败信号：
```

实际单文件 RED（实现前）：

```text
⨯ Unable to compile TypeScript:
tests/majiang/discard-ranker.test.ts(4,58): error TS2307: Cannot find module
'../../src/majiang/strategy/heuristics/discard-ranker' or its corresponding type declarations.
```

结论：FAIL，符合 Step 2 预期（模块 / `pickDiscardIndex` 不存在）。

### GREEN（实现后）

```bash
node -e "
require('ts-node/register');
const Mocha = require('mocha');
const mocha = new Mocha({ timeout: 10000 });
mocha.addFile(require('path').resolve('tests/majiang/discard-ranker.test.ts'));
mocha.run(failures => process.exit(failures ? 1 : 0));
"
```

```text
  discard-ranker · 向听主排序
    ✔ 有明显孤张字牌时，应优先打出该孤张而非拆万子顺子

  1 passing (19ms)
```

### 测例手牌调整（binding override #3）

原 brief 手牌（123/456/789 万 + 三条 + 东 + 5 筒）在 `calculateShanten` 近似下，打万边张 / 打东 / 打筒 多数 `shantenAfter === 0`，排序落到 `index ↑` 会优先拆万。

按约束**只改测例手牌、不改 core 向听公式**，改为刻子向结构：

- `111万 999万 111条 99条 + 东南西孤张`
- 实测：打字牌 `shantenAfter=1`，拆万刻 `shantenAfter=2` → 严格更优，断言通过。

## Self-review

- [x] 未触碰 `src/majiang/core/`
- [x] 未改 `AIPlayer` / `ai-alphazero/`
- [x] 无新 npm 依赖
- [x] 未 git commit
- [x] 接口与排序键与 brief 一致；ukeire/danger 占位留给 Task 2/3
- [x] 单测通过；实现为 brief 给定最小实现

## Concerns

1. **单测命令宿主差异**：brief 的 `npx mocha -r ts-node/register tests/...` 在本环境触发 ESM `ERR_MODULE_NOT_FOUND`（无 `.js` 扩展）。验收改用与 `npm test` 相同的 `ts-node` CJS 装载；语义等价。
2. **向听近似粗糙**：顺子向手牌易出现多弃牌同听，仅靠 `index` 平局；后续 Task 2（ukeire）会拉开差距。本任务测例已改为刻子向以稳定断言。
3. **`tsc --noEmit`** 仍报既有 `./ai-alphazero` 解析问题（与本任务无关）；heuristics 文件无新增报错命中。

## Report path

`.superpowers/sdd/task-1-report.md`
