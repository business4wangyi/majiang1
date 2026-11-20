# Review package Task 3 re-review (hu size fix)
## Hu / seal CSS hunks
2208:.action-seal-bar {
2209-  display: flex;
2210-  align-items: flex-end;
2211-  justify-content: center;
2212-  gap: 12px;
2213-  border-radius: 16px;
2214-}
2215-
2216-.action-bar::before {
2217-  content: "";
2218-  position: absolute;
2219-  left: 6%;
2220-  right: 6%;
--
2287:.action-main-path,
2288-.action-primary {
2289-  --seal-h: 76px;
2290-  --seal-min-w: 176px;
2291-  padding: 0 44px;
2292-  font-size: 48px;
2293-  color: #2a1708;
2294-  border-color: rgba(255, 232, 170, 0.98);
2295-  background:
2296-    linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.14) 26%, transparent 40%),
2297-    linear-gradient(180deg, #ffe9b0 0%, #f2bc4e 40%, #d07e16 76%, #8a4a0e 100%);
2298-  text-shadow:
2299-    0 1px 0 rgba(255, 245, 210, 0.65),
--
2374:.action-btn.action-seal {
2375-  --seal-h: 44px;
2376-  --seal-min-w: 72px;
2377-  min-height: 44px;
2378-  min-width: 72px;
2379-  padding: 0 14px;
2380-  font-size: 16px;
2381-  border-radius: 10px;
2382-  letter-spacing: 0.12em;
2383-  background: linear-gradient(180deg, #1c3328, #0f1c16);
2384-  border: 1px solid rgba(244, 214, 138, 0.35);
2385-}
2386-
2387:.action-btn.action-seal[data-action-id="peng"],
2388:.action-btn.action-seal[data-action-id="gang"],
2389:.action-btn.action-seal[data-action-id="pass"],
2390:.action-btn.action-seal.action-pass,
2391:.action-btn.action-seal.action-secondary-choice {
2392-  --seal-h: 44px;
2393-  --seal-min-w: 72px;
2394-  min-height: 44px;
2395-  min-width: 72px;
2396-  font-size: 16px;
2397-}
2398-
2399:/* 胡最大：阶段 A ~22px / 96×56；特异性压过 .action-main-path 金属大钮 */
2400:.action-btn.action-seal[data-action-id="hu"].action-main-path,
2401:.action-btn.action-seal[data-action-id="hu"].action-primary,
2402:.action-btn[data-action-id="hu"].action-main-path,
2403:.action-btn[data-action-id="hu"].action-primary {
2404-  --seal-h: 56px;
2405-  --seal-min-w: 96px;
2406-  min-width: 96px;
2407-  min-height: 56px;
2408-  padding: 0 18px;
2409-  font-size: 22px;
2410-  background: linear-gradient(180deg, var(--gold-1), var(--gold-2));
2411-  color: #1b1306;
2412-  border-color: var(--gold-1);
2413-  text-shadow: 0 1px 0 rgba(255, 245, 210, 0.55);
2414-  box-shadow: 0 8px 18px rgba(216, 159, 64, 0.45);
2415-}
--
2726:  .action-main-path,
2727-  .action-primary {
2728-    --seal-h: 60px;
2729-    --seal-min-w: 132px;
2730-    font-size: 36px;
2731-    padding: 0 28px;
2732-  }
2733-}
2734-

## Report tail (fix)
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
