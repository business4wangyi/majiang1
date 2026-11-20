# Task 3 Report · MJ-T3-CENTER-01

**Status:** DONE（结构合同绿；视觉毕业仍待 GR-T4/GR-T7 人眼）  
**Commits:** none（按 Binding overrides）  
**Date:** 2026-11-19

## TDD evidence

| 阶段 | 命令 | 结果 |
|------|------|------|
| RED | `npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v` | 3 pass / 1 fail：`\.action-seal-bar` 在 CSS 中缺失 |
| GREEN | 同上 | **4 passing** |

## Changes

| 文件 | 动作 |
|------|------|
| `tests/majiang/web-table-v3.test.ts` | 新建（brief 原文） |
| `docs/majiang/web-ui-prototype/index.html` | 桌心收敛：`center-public-info.hidden`；说明文案入 `secondaryContext`；抽屉类 `center-detail-drawer table-aux`；保留 `latest-action-wrap` 别名与全部关键 id |
| `docs/majiang/web-ui-prototype/styles.css` | 方盘 220×220 合同；`.action-seal-bar`；印章钮非 pill；胡主路径金扣；抽屉弱化 |
| `docs/majiang/web-ui-prototype/app.js` | 未改（仍用 id / `.table-center`） |
| 脊骨 / W1 / caps | G-T2 · CENTER · `CAP-T3-CENTER` → **已落地**；下一刀 TILE；**未关 GR-T7 / GR-T4** |

## Concerns

- 方盘从旧八角形大盘缩到 220 合同方盘，分数字号需人眼对照阶段 A PNG。
- `primaryFocusHint` / `stageMainPath` 默认藏在折叠抽屉内，展开才见长文案。
- 功能自动化绿 ≠ 视觉冲顶；GR-T4 / GR-T7 仍待人批。

## Review fix · 胡最大回退（2026-11-19）

**Finding:** 胡钮曾用 `1.35rem`+96×56，但兄弟印章字号/高度更大（碰/杠/过 ~30px、基钮更高），未对齐阶段 A「胡最大」。

**Change:** 仅改 `docs/majiang/web-ui-prototype/styles.css`
- `.action-btn.action-seal` 兄弟基线：`16px` / min `72×44`
- 碰/杠/过显式锁同尺寸，避免被旧 `action-pass` / `action-secondary-choice` 抬高
- 胡主路径（`.action-seal[data-action-id="hu"].action-main-path|.action-primary`）：`22px` / min `96×56`，并设 `--seal-*` + 金扣背景，特异性压过 `.action-main-path` 金属大钮
- 移动帧同步：兄弟 ~14px/40×64，胡 ~20px/88×52
- 未动 lobby/core；**未关 GR-T7**；未 commit

**Verify:**
```
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
→ 4 passing (3ms)
```
