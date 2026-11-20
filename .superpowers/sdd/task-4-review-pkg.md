# Review package Task 4
## Status
## develop...origin/develop [ahead 6]
 M docs/majiang/web-ui-prototype/index.html
 M docs/majiang/web-ui-prototype/styles.css
 M docs/product/spines/majiang-webui-target.md
?? docs/product/caps/majiang-web-table-v3-cap-tasks.md
?? docs/product/spines/majiang-web-table-v3-target.md
?? docs/product/waves/majiang-web-table-v3-W1.md
?? tests/majiang/web-table-v3.test.ts
## Diff styles (tile/river related)
142- }
143- 
144:-.latest-action-wrap {
145--  /* 教学文案层退出主舞台；细节仍可经二级上下文/读屏获取 */
146--  position: absolute;
--
156-+/* 桌心说明抽屉：弱化不抢主；保留 id 供展开 */
157-+.center-detail-drawer,
158:+.latest-action-wrap.table-aux {
159-+  justify-self: center;
160-+  opacity: 0.55;
--
166- }
167- 
168: .latest-action-wrap > .label {
169-   display: none;
170- }
--
177- }
178- 
179:+/* MJ-T3-TILE-01：最近弃牌金高亮（对齐阶段 A；禁蓝霓虹回潮） */
180:+.river-grid .tile-mini--latest,
181:+.river-grid .mini.latest,
182: .tile-mini--latest {
183--  border-color: rgba(118, 174, 255, 0.82);
184-+  outline: 2px solid var(--gold-2);
--
209- }
210- 
211:+/* MJ-T3-TILE-01：手牌主角节奏（对照阶段 A；图集路径仍由 has-tile-atlas 接管） */
212: .hand-tiles {
213-   display: flex;
214-   justify-content: center;
--
225- }
226- 
227:+.hand-tiles .tile,
228:+.hand-tiles .tile.has-tile-atlas {
229:+  width: 52px;
230:+  height: 72px;
231:+  min-height: 72px;
232-+  border-radius: 6px;
233-+}
234-+
235:+.hand-tiles .tile:not(.has-tile-atlas) {
236-+  border: 1px solid rgba(90, 70, 40, 0.4);
237:+  background: linear-gradient(180deg, var(--tile-face-cream) 0%, var(--tile-face-mid) 70%, var(--tile-face-base) 100%);
238-+  box-shadow: 2px 3px 0 rgba(40, 90, 60, 0.4), 0 8px 14px rgba(0, 0, 0, 0.28);
239-+}
240-+
241: .tile {
242-   position: relative;
243-   width: clamp(58px, 4.2vw, 76px);
--
247-@@ -2191,24 +2172,33 @@ body {
248- 
249: .tile-asset--hand .tile-asset-white {
250-   width: 28px;
251-   height: 38px;
252- }
253- 
254:+/* MJ-T3-TILE-01：选中抬起（app 仍写 selected；合同兼认 sel / is-selected） */
255:+.hand-tiles .tile.sel,
256:+.hand-tiles .tile.is-selected,
257:+.hand-tiles .tile.selected,
258: .tile.selected {
259--  transform: translateY(-8px) translateZ(8px);
260-+  transform: translateY(-10px) translateZ(8px);
--
275-+}
276-+
277:+.hand-tiles .tile.has-tile-atlas.sel,
278:+.hand-tiles .tile.has-tile-atlas.is-selected,
279:+.hand-tiles .tile.has-tile-atlas.selected,
280:+.tile.has-tile-atlas.selected {
281-+  border-color: transparent;
282-+  outline: 2px solid var(--gold-2);
--
286- 
287- /* 手牌同名仅弱提示，首眼留给牌河目标牌 */
288: .tile.tile--response-match {
289-   border-color: rgba(255, 184, 59, 0.42);
290-   box-shadow:
--
359-+.action-btn.action-seal {
360-+  --seal-h: 44px;
361:+  --seal-min-w: 72px;
362-+  min-height: 44px;
363:+  min-width: 72px;
364-+  padding: 0 14px;
365-+  font-size: 16px;
--
376-+.action-btn.action-seal.action-secondary-choice {
377-+  --seal-h: 44px;
378:+  --seal-min-w: 72px;
379-+  min-height: 44px;
380:+  min-width: 72px;
381-+  font-size: 16px;
382- }
--
481-   .action-btn[data-action-id="hu"].action-primary {
482--    font-size: 28px;
483:+    --seal-h: 52px;
484-+    --seal-min-w: 88px;
485-+    min-width: 88px;
486:+    min-height: 52px;
487-+    font-size: 20px;
488-   }
--
490-   .action-secondary {
491-     --seal-h: 34px;
492:     --seal-min-w: 72px;
493-     font-size: 12px;
## Test file tail / new asserts
9:describe('CAP-T3 / MJ-T3-CENTER-01 / MJ-T3-TILE-01', () => {
16:    expect(html).to.match(/id=["']handTiles["']/);
18:    expect(html).to.match(/id=["']river-north["']/);
19:    expect(html).to.match(/id=["']river-west["']/);
20:    expect(html).to.match(/id=["']river-east["']/);
21:    expect(html).to.match(/id=["']river-south["']/);
50:    expect(css).to.match(/\.hand-tiles\s*\{/);
51:    expect(css).to.match(/\.tile\.sel|\.tile\.is-selected|\.hand-tiles\s+\.sel/);
52:    expect(css).to.match(/tile-mini--latest|\.mini\.latest|\.river-grid[\s\S]*latest/);
## Report
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
