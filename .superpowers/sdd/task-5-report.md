# Task 5 Report: 出牌前注入桌上可见弃牌

## Status
**DONE**

## Commits
none（按 Critical overrides 未提交）

## Changes
| File | Change |
| --- | --- |
| `src/majiang/ui/game-event-handler.ts` | 新增窄 API `collectVisibleDiscards(): Tile[]`，clone 汇总各家 `discardedTiles` |
| `src/majiang/strategy/agents/ai-player.ts` | `handleDiscard` 在 `pauseForThinking` 后、`getAIMove` 前调用 `setVisibleDiscards(gameEventHandler.collectVisibleDiscards())` |
| `tests/majiang/discard-ranker.test.ts` | 追加 `GameEventHandler · 可见弃牌`；建局沿用 `game.test.ts` 的 `addPlayer` + `new GameEventHandler(..., getAllPlayers())` |

## Test summary
```bash
node scripts/test/run-mocha-cjs.js tests/majiang/discard-ranker.test.ts
```
- 注：`run-mocha-cjs.js` 固定 glob `tests/**/*.test.ts`，CLI 路径参数无效；实跑为全量 mocha
- TDD：先红（TS2339 `collectVisibleDiscards` 不存在）→ 实现后绿
- Result: **3376 passing**（含 `GameEventHandler · 可见弃牌`）

## Concerns
- `handleDiscard` 内既有 `process.exit` 未动（按任务要求）
- 未加 `handleDiscard` 端到端注入测例；仅覆盖 `collectVisibleDiscards` 汇总 + clone，注入点为直接接线
- `bare new Game()` 玩家为空：测例已按仓库既有 factory 先 `addPlayer` 再建 handler

## Layering
- 策略层只消费 `Tile[]`；未把整局 `Game` 塞进 strategy
- 未改 `core/` 规则权威
