# Task 4 Report · MJ-T3-TILE-01

**Status:** DONE（钩子合同绿；视觉毕业仍待 GR-T5/GR-T7 人眼）  
**Commits:** none（按 Binding overrides）  
**Date:** 2026-11-19

## TDD evidence

| 阶段 | 命令 | 结果 |
|------|------|------|
| RED | `npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v` | 新 TILE 断言 **已部分满足**（钩子本就在 CSS）：5 passing；缺口在观感尺寸/选中抬起/最近牌金高亮 |
| GREEN | 同上 | **5 passing** |

## Changes

| 文件 | 动作 |
|------|------|
| `tests/majiang/web-table-v3.test.ts` | 追加「手牌与最近牌高亮钩子在 CSS 合同内」 |
| `docs/majiang/web-ui-prototype/styles.css` | MJ-T3-TILE-01：手牌 52×72 节奏；`sel`/`is-selected`/`selected` 抬起 −10px；最近牌金 outline（替蓝霓虹）；保留 `has-tile-atlas` |
| `docs/majiang/web-ui-prototype/index.html` | 未改（牌河 DOM 层级无需动） |
| `docs/majiang/web-ui-prototype/app.js` | 未改（仍写 `selected` + `tile-mini--latest`） |
| 脊骨 / W1 / caps | G-T3 · TILE · `CAP-T3-TILE` → **已落地**；下一刀 FELT；**未关 GR-T5 / GR-T7** |

## Concerns

- 功能自动化绿 ≠ 阶段 B 视觉冲顶；GR-T5（手牌/牌河对照）与 GR-T7 仍待人批。
- 图集启用时选中/最近牌靠 `outline` + 抬起，需对照阶段 A PNG 人眼确认厚度与金环是否够主角感。
- 移动帧手牌尺寸仍由既有 `@media` 覆盖；本刀主合同为桌面 1440×900。
