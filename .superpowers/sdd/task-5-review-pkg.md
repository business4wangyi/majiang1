# Review package Task 5 FELT
# Task 5 报告 · MJ-T3-FELT-01

## 结论

局内绿毡光影已对齐大厅同族 `--table-felt-*` / 金扣；去掉整桌截图毡纹理硬叠。挂测绿。未 commit；未关 GR-T7。

## 改动

| 面 | 内容 |
|----|------|
| CSS | `.table-page` / `.table-stage-frame` 复用毡变量渐变 + 金边内阴影；`::before` 去掉 `table-felt-texture.png`；`.table-zone` 毡底改变量、外圈去冷灰回潮 |
| 账本 | G-T4 / `MJ-T3-FELT-01` / `CAP-T3-FELT` → **已落地**；下一刀 GRAD |
| 未关 | GR-T6（视觉人批）、GR-T7 |

## 验证

```text
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
→ 5 passing
```

目视建议：原型 `#tablePage` @ 1440×900，对照大厅绿毡金扣同族、无紫霓虹/灰面板。

## 硬边界

- 未碰 `#lobbyPage` / `src/majiang/core/`
- 未 commit（按 overrides）

## CSS felt hunks
8-   filter: grayscale(0.15);
9- }
10- 
11:+/* MJ-T3-FELT-01：与大厅同族绿毡金扣（加深可，禁换灰紫） */
12: .table-page {
13-   display: grid;
14-   grid-template-rows: minmax(0, 1fr) auto;
15-   gap: 0;
--
17-   padding: 0 2px 0;
18-+  background:
19-+    radial-gradient(ellipse at 50% 42%, rgba(40, 120, 80, 0.35) 0%, transparent 52%),
20:+    linear-gradient(165deg, var(--table-felt-a) 0%, var(--table-felt-b) 45%, var(--table-felt-c) 100%);
21- }
22- 
23- .table-bottom-anchor {
--
25-   margin-top: -56px;
26-@@ -380,59 +384,62 @@ body {
27- 
28: .table-stage-frame {
29-   position: absolute;
30-   inset: 0 0 58px;
31-   border-radius: 56px;
--
35-     radial-gradient(circle at 50% 10%, rgba(255, 224, 154, 0.12), transparent 26%),
36--    radial-gradient(circle at 50% 58%, rgba(0, 0, 0, 0.18), transparent 54%);
37-+    radial-gradient(circle at 50% 58%, rgba(0, 0, 0, 0.22), transparent 54%),
38:+    linear-gradient(165deg, var(--table-felt-a) 0%, var(--table-felt-b) 45%, var(--table-felt-c) 100%);
39-+  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.35);
40-   pointer-events: none;
41-   z-index: 0;
42-   overflow: hidden;
43- }
44- 
45:+/* table-felt-texture.png 含牌/中控整桌截图，不可当纯毡；局内用渐变+内阴影（同大厅） */
46: .table-stage-frame::before {
47-   content: "";
48-   position: absolute;
49-   inset: 0;
--
57-     url("assets/table-edge-left.png"),
58-     url("assets/table-edge-right.png"),
59--    url("assets/table-rim-top.png"),
60:-    url("assets/table-felt-texture.png");
61-+    url("assets/table-rim-top.png");
62-   background-size:
63-     cover,
--
79-   mix-blend-mode: normal;
80- }
81- 
82: .table-stage-frame::after {
83-   content: "";
84-   position: absolute;
85-   inset: 12px 12px 54px;
--
104-     radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.08), transparent 39%),
105-     radial-gradient(circle at 18% 88%, rgba(0, 0, 0, 0.42), transparent 46%),
106--    radial-gradient(ellipse at 50% 44%, #149368 0%, #0b5c45 46%, #052e23 76%, #021510 100%);
107:+    radial-gradient(ellipse at 50% 44%, var(--table-felt-a) 0%, var(--table-felt-b) 46%, var(--table-felt-c) 76%, #021510 100%);
108-   box-shadow:
109--    0 0 0 12px rgba(58, 64, 76, 0.98),
110--    0 0 0 15px rgba(148, 157, 168, 0.64),
--
246--    0 0 6px rgba(91, 240, 255, 0.82),
247--    0 0 16px rgba(91, 240, 255, 0.42),
248--    0 2px 8px rgba(0, 0, 0, 0.55);
249:+  color: var(--gold-2);
250-+  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
251-   font-weight: 800;
252- }
--
289-+.river-grid .mini.latest,
290- .tile-mini--latest {
291--  border-color: rgba(118, 174, 255, 0.82);
292:+  outline: 2px solid var(--gold-2);
293-+  outline-offset: 1px;
294-+  transform: translateY(-3px);
295:+  border-color: var(--gold-2);
296-   box-shadow:
297--    0 0 0 2px rgba(118, 174, 255, 0.4),
298-+    0 6px 10px rgba(0, 0, 0, 0.35),
--
362- .tile.selected {
363--  transform: translateY(-8px) translateZ(8px);
364-+  transform: translateY(-10px) translateZ(8px);
365:+  border-color: var(--gold-2);
366-   box-shadow:
367--    0 0 0 2px rgba(255, 184, 59, 0.55),
368--    inset 0 -12px 14px rgba(160, 140, 100, 0.3),
--
383-+.hand-tiles .tile.has-tile-atlas.selected,
384-+.tile.has-tile-atlas.selected {
385-+  border-color: transparent;
386:+  outline: 2px solid var(--gold-2);
387-+  outline-offset: 1px;
388-+  filter: drop-shadow(0 14px 12px rgba(0, 0, 0, 0.42));
389- }
--
## Ledger
docs/product/waves/majiang-web-table-v3-W1.md:8:| 施工状态 | **STAGEA 已人批**；CENTER / TILE / FELT 已落地；下一刀 GRAD |
docs/product/waves/majiang-web-table-v3-W1.md:42:| `MJ-T3-FELT-01` | 毡光影与大厅连续 | **已落地** |
docs/product/spines/majiang-web-table-v3-target.md:23:| GR-T6 | 毡/光影与大厅绿毡金扣同族 | 待做 |
docs/product/spines/majiang-web-table-v3-target.md:45:| G-T4 | 毡光影整桌 | U2·视觉 | `MJ-T3-FELT-01` | **已落地** |
docs/product/caps/majiang-web-table-v3-cap-tasks.md:36:| `CAP-T3-FELT` | G-T4 / GR-T6 | `MJ-T3-FELT-01` | U2·视觉 | STAGEA 已批 | **已落地** |
