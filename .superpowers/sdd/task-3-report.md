# Task 3 Report: AIPlayer 接入策略 `p2`

## Status

**DONE** — GREEN；未提交（binding: DO NOT commit）

## Changes

| File | Action |
| --- | --- |
| `src/majiang/strategy/agents/ai-player.ts` | Modify：`DiscardStrategy` 增加 `'p2'`；`resolveDiscardStrategy` 识别 explicit / env `p2`；`getAIMove` 在 legacy 后、p1 前走 `pickDiscardIndexByEv` |
| `tests/majiang/ai-player-p2.test.ts` | Create：策略解析 + 孤张字牌出牌断言 |

未改：`core/`、`GameEventHandler`、依赖；跳过可选 `tilesLeft` setter。

## TDD

```text
RED  → TS2345：'"p2"' 不在 DiscardStrategy 联合
GREEN → 5 passing（ai-player-p2 ×2 + ev-discard-evaluator ×3）
```

手牌：brief 顺子手因向听下限 0 会假失败，按 override 改为与 Task1/P1 / `ev-discard-evaluator` 同构的**刻子向**（三组刻 + 将 + 三张风孤张），断言仍为打出字牌（`TileType.FENG`）。

## Tests

```bash
node -e "
require('ts-node/register');
const Mocha = require('mocha');
const path = require('path');
const mocha = new Mocha({ timeout: 10000 });
mocha.addFile(path.resolve('tests/majiang/ai-player-p2.test.ts'));
mocha.addFile(path.resolve('tests/majiang/ev-discard-evaluator.test.ts'));
mocha.run((failures) => { process.exitCode = failures ? 1 : 0; });
"
```

结果：**5 passing**（exit 0）。说明：CJS `npm test` 忽略文件参数，故用内联 Mocha。

## Self-review

- p2 分支位置正确（legacy → p2 → p1 默认）
- 未注入 `tilesLeft`（本切片可选，未改 EventHandler）
- 未碰 core / 无新依赖

## Concerns

1. 对战路径尚未把残牌数传入 EV，残牌加压仅单测/ctx 覆盖有效。
2. `getAIMove` 顶注释仍写「P1 / legacy」，未同步提及 p2（文档小债）。
3. 冷启动 ts-node/Mocha 约 ~100s；用例本身 ~250ms。

## Commits

none
