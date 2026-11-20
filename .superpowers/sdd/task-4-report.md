# Task 4 Report：接入 AIPlayer.getAIMove

## Status

**PASS** — `getAIMove` 已接入 `pickDiscardIndex`；烟测通过。未 commit。

## Changes

| 文件 | 变更 |
| --- | --- |
| `src/majiang/strategy/agents/ai-player.ts` | 新增 `visibleDiscards` + `setVisibleDiscards`；`getAIMove` 改走 `pickDiscardIndex`，`evaluateTileValue` 作 `legacyValueAt`；保留 `getAllTileValues` / `evaluateTileValue` |
| `tests/majiang/discard-ranker.test.ts` | 追加 `AIPlayer · P1 接入` 现物烟测 |

## TDD

1. 追加烟测 → FAIL（`setVisibleDiscards` 不存在 / TS2339）
2. 实现接入 → PASS

## Tests

```bash
node scripts/test/run-mocha-cjs.js tests/majiang/discard-ranker.test.ts
```

- `discard-ranker · 向听主排序` ✔
- `discard-ranker · 有效牌破平` ✔
- `discard-ranker · 现物危险度` ✔
- `AIPlayer · P1 接入` · `getAIMove 在现物场景下打出安全字牌` ✔
- 汇总：3375 passing（该 runner 会装载全量 `tests/**/*.test.ts`）

## Commits

none（按 Critical override：DO NOT git commit）

## Out of scope（刻意未做）

- 未从 `GameEventHandler` 注入 visible discards（Task 5）
- 未改 `handleDiscard` 的 `process.exit` 行为
- 未改 `core/`

## Concerns

1. `visibleDiscards` 目前仅能靠测试/`setVisibleDiscards` 写入；对局主路径仍为空，现物安全排序要等 Task 5 才生效。
2. `getAllTileValues` 现为私有未引用（仅供调试/遗留破平配套保留）；若 lint 严格可后续标 `@ts-expect-error` 或挂到 debug 分支。
3. `getAIMove` 内原「手牌超预期 + process.exit」分支已随旧路径移除；`handleDiscard` 内同类 exit 仍在。
