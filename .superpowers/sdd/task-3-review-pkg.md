# Review package Task 3 (uncommitted)
BASE: 8e02a4ceb45b63fd98c378af226d2e84652d9c7b
HEAD: working tree

## Stat (prototype + test + ledger touches for CENTER)
## develop...origin/develop [ahead 6]
 M docs/majiang/web-ui-prototype/index.html
 M docs/majiang/web-ui-prototype/styles.css
?? docs/product/caps/majiang-web-table-v3-cap-tasks.md
?? docs/product/spines/majiang-web-table-v3-target.md
?? docs/product/waves/majiang-web-table-v3-W1.md
?? tests/majiang/web-table-v3.test.ts

## Diff vs HEAD (tracked files only)
 docs/majiang/web-ui-prototype/index.html |  11 ++-
 docs/majiang/web-ui-prototype/styles.css | 147 ++++++++++++++-----------------
 2 files changed, 71 insertions(+), 87 deletions(-)
diff --git a/docs/majiang/web-ui-prototype/index.html b/docs/majiang/web-ui-prototype/index.html
index b7064e7..38570bb 100644
--- a/docs/majiang/web-ui-prototype/index.html
+++ b/docs/majiang/web-ui-prototype/index.html
@@ -98,48 +98,47 @@
               <span class="score">88</span>
             </div>
             <div class="seat-meta hidden"></div>
             <div class="seat-latest-action hidden"></div>
             <div class="meld-list"></div>
           </article>
 
           <section class="table-center">
-            <div class="center-public-info">
+            <div class="center-public-info hidden" aria-hidden="true">
               <div class="center-info-item">
                 <span class="label">圈风 / 局数</span>
                 <span id="centerRoundInfo" class="center-info-value">东风局</span>
               </div>
               <div class="center-info-item">
                 <span class="label">牌山余量</span>
                 <span id="centerWallCount" class="center-info-value">36</span>
               </div>
             </div>
-            <div class="center-score-disk" aria-hidden="true">
+            <div class="center-score-disk" aria-hidden="false">
               <div class="score-wind score-wind-n">北<br /><span id="scoreNorth">24200</span></div>
               <div class="score-wind score-wind-e">东<br /><span id="scoreEast">25600</span></div>
               <div class="score-wind score-wind-s">南<br /><span id="scoreSouth">28400</span></div>
               <div class="score-wind score-wind-w">西<br /><span id="scoreWest">21800</span></div>
               <div class="score-core">
                 <div class="score-round">东风局</div>
                 <div class="score-wall"><span class="score-wall-label">余牌</span><span id="scoreCoreWall">36</span></div>
               </div>
             </div>
-            <div class="latest-action-wrap">
+            <div class="latest-action-wrap center-detail-drawer table-aux">
               <div class="stage-keyline">
                 <span id="stageActor" class="stage-actor">玩家4</span>
                 <span id="stageVerb" class="stage-verb">打出</span>
                 <span id="responseTargetTile" class="tile-face tile-face--target">三万</span>
                 <span id="stageToYou" class="stage-to-you">→ 可胡</span>
                 <span id="stagePriorityTag" class="stage-priority-tag">主动作：胡</span>
               </div>
-              <span class="label">当前关键提示</span>
-              <p id="primaryFocusHint" class="primary-focus-hint">右家打出三万，可胡</p>
-              <p id="stageMainPath" class="stage-main-path">主路径：点【胡】；次动作【过】。</p>
               <div id="secondaryContext" class="secondary-context hidden">
+                <p id="primaryFocusHint" class="primary-focus-hint"></p>
+                <p id="stageMainPath" class="stage-main-path"></p>
                 <p id="latestActionMain" class="latest-action"></p>
                 <p id="latestActionSub" class="latest-action-sub"></p>
                 <p id="responseLinkHint" class="response-link-hint"></p>
                 <p id="responseCountdown" class="response-countdown"></p>
               </div>
               <button id="toggleContextBtn" type="button" class="ghost-inline-btn table-aux">展开局势细节</button>
             </div>
             <div class="river-board">
diff --git a/docs/majiang/web-ui-prototype/styles.css b/docs/majiang/web-ui-prototype/styles.css
index f7a7f32..8c0eb77 100644
--- a/docs/majiang/web-ui-prototype/styles.css
+++ b/docs/majiang/web-ui-prototype/styles.css
@@ -666,68 +666,43 @@ body {
 }
 
 .center-info-value {
   color: #d9ebdf;
   font-size: 12px;
   font-weight: 700;
 }
 
+/* MJ-T3-CENTER-01：方盘桌心合同（非圆形大盘冒充） */
 .center-score-disk {
   justify-self: center;
   margin-top: 18px;
-  width: 364px;
-  height: 260px;
+  width: 220px;
+  height: 220px;
   position: relative;
   border-radius: 18px;
-  clip-path: polygon(14% 0, 86% 0, 100% 16%, 100% 84%, 86% 100%, 14% 100%, 0 84%, 0 16%);
-  border: 1px solid rgba(232, 192, 109, 0.62);
-  background:
-    linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0 6%, transparent 7% 84%, rgba(0, 0, 0, 0.32) 85%),
-    linear-gradient(90deg, rgba(255, 216, 132, 0.18) 0 2%, transparent 4% 96%, rgba(255, 216, 132, 0.16) 98%),
-    linear-gradient(135deg, rgba(255, 244, 204, 0.18), transparent 18%, rgba(255, 255, 255, 0.06) 32%, transparent 48%),
-    radial-gradient(circle at 50% 42%, rgba(101, 145, 168, 0.18), transparent 46%),
-    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.025) 0 2px, transparent 2px 9px),
-    linear-gradient(145deg, #31485f, #172637 58%, #0b1522),
-    linear-gradient(90deg, rgba(233, 186, 99, 0.1), rgba(233, 186, 99, 0) 45%, rgba(233, 186, 99, 0.08));
+  border: 2px solid rgba(244, 214, 138, 0.45);
+  background: linear-gradient(145deg, rgba(20, 48, 36, 0.95), rgba(8, 24, 18, 0.98));
   box-shadow:
-    inset 0 0 0 1px rgba(255, 247, 214, 0.22),
-    inset 0 0 0 4px rgba(24, 34, 48, 0.92),
-    inset 0 0 0 7px rgba(233, 186, 99, 0.33),
-    inset 0 0 0 10px rgba(6, 12, 20, 0.35),
-    inset 0 -26px 36px rgba(3, 9, 16, 0.64),
-    0 0 0 2px rgba(46, 62, 83, 0.75),
-    0 0 0 4px rgba(12, 19, 28, 0.92),
-    0 16px 26px rgba(0, 0, 0, 0.52);
+    0 12px 28px rgba(0, 0, 0, 0.45),
+    inset 0 0 24px rgba(244, 214, 138, 0.08);
 }
 
 .center-score-disk::before {
   content: "";
   position: absolute;
   inset: 10px;
   border-radius: 14px;
-  clip-path: polygon(13% 0, 87% 0, 100% 16%, 100% 84%, 87% 100%, 13% 100%, 0 84%, 0 16%);
-  border: 1px solid rgba(255, 238, 183, 0.28);
-  background:
-    linear-gradient(90deg, rgba(255, 206, 115, 0.1) 0 1px, transparent 2px calc(100% - 2px), rgba(255, 206, 115, 0.1) calc(100% - 1px)),
-    linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent 24%),
-    linear-gradient(300deg, rgba(78, 235, 255, 0.08), transparent 34%);
+  border: 1px solid rgba(244, 214, 138, 0.22);
+  background: linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 28%);
   pointer-events: none;
 }
 
 .center-score-disk::after {
-  content: "";
-  position: absolute;
-  left: 25px;
-  right: 25px;
-  top: 12px;
-  height: 20px;
-  border-radius: 999px;
-  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
-  pointer-events: none;
+  content: none;
 }
 
 /* 响应窗口：中心盘右缘弱脉冲（替代教学箭头/说明条） */
 @keyframes diskEastPulse {
   0%,
   100% {
     box-shadow:
       inset -10px 0 22px rgba(255, 186, 74, 0.12),
@@ -801,39 +776,31 @@ body {
 .score-wind-w {
   top: 50%;
   left: 8px;
   transform: translateY(-50%);
 }
 
 .score-core {
   position: absolute;
-  inset: 50px 62px 46px;
-  border-radius: 13px;
-  clip-path: polygon(12% 0, 88% 0, 100% 15%, 100% 85%, 88% 100%, 12% 100%, 0 85%, 0 15%);
-  border: 1px solid rgba(217, 180, 104, 0.66);
-  background:
-    radial-gradient(circle at 50% 78%, rgba(91, 240, 255, 0.18), transparent 32%),
-    linear-gradient(145deg, rgba(255, 255, 255, 0.12), transparent 24%),
-    linear-gradient(180deg, rgba(6, 12, 18, 0.98), rgba(4, 9, 15, 0.94));
+  inset: 44px 40px 40px;
+  border-radius: 12px;
+  border: 1px solid rgba(244, 214, 138, 0.4);
+  background: linear-gradient(180deg, rgba(10, 28, 20, 0.96), rgba(6, 16, 12, 0.98));
   display: grid;
   align-content: center;
   justify-items: center;
-  gap: 8px;
+  gap: 6px;
   box-shadow:
-    inset 0 0 0 1px rgba(255, 238, 178, 0.1),
-    inset 0 0 0 4px rgba(15, 25, 38, 0.9),
-    inset 0 0 18px rgba(91, 240, 255, 0.08),
-    inset 0 -18px 28px rgba(7, 24, 38, 0.72),
-    0 0 0 1px rgba(255, 214, 123, 0.25),
-    0 10px 16px rgba(0, 0, 0, 0.36);
+    inset 0 0 0 1px rgba(255, 238, 178, 0.08),
+    inset 0 -12px 20px rgba(0, 0, 0, 0.35);
 }
 
 .score-round {
-  font-size: 34px;
+  font-size: 22px;
   font-weight: 800;
   color: #f5d481;
   text-shadow: 0 2px 8px rgba(0, 0, 0, 0.52);
 }
 
 .score-wall {
   display: grid;
   justify-items: center;
@@ -842,38 +809,33 @@ body {
 
 .score-wall-label {
   color: #d8c28c;
   font-size: 15px;
   font-weight: 700;
 }
 
 #scoreCoreWall {
-  font-size: 48px;
+  font-size: 28px;
   line-height: 1;
-  color: #5bf0ff;
-  text-shadow:
-    0 0 6px rgba(91, 240, 255, 0.82),
-    0 0 16px rgba(91, 240, 255, 0.42),
-    0 2px 8px rgba(0, 0, 0, 0.55);
+  color: var(--gold-2);
+  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
   font-weight: 800;
 }
 
-.latest-action-wrap {
-  /* 教学文案层退出主舞台；细节仍可经二级上下文/读屏获取 */
-  position: absolute;
-  width: 1px;
-  height: 1px;
-  padding: 0;
-  margin: -1px;
-  overflow: hidden;
-  clip: rect(0, 0, 0, 0);
-  white-space: nowrap;
-  border: 0;
-  pointer-events: none;
+/* 桌心说明抽屉：弱化不抢主；保留 id 供展开 */
+.center-detail-drawer,
+.latest-action-wrap.table-aux {
+  justify-self: center;
+  opacity: 0.55;
+  max-width: 320px;
+  margin-top: 6px;
+  text-align: center;
+  pointer-events: auto;
+  z-index: 2;
 }
 
 .latest-action-wrap > .label {
   display: none;
 }
 
 .stage-keyline {
   display: flex;
@@ -2217,35 +2179,43 @@ body {
     0 1px 0 #d9caa8,
     0 2px 0 #c9ba95,
     0 4px 0 #b6a57e,
     0 6px 0 #9a8964,
     0 8px 0 #6f6246,
     0 14px 14px -3px rgba(0, 0, 0, 0.48);
 }
 
-/* 动作层：竞品式胶囊/印章字效条（非 Web 矩形条、非圆钮 HUD） */
+/* 动作层：印章条（非大圆 pill 工具条） */
 .action-bar {
   grid-row: auto;
   justify-self: center;
   width: auto;
   max-width: min(920px, 96%);
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   align-items: center;
   gap: 14px 18px;
   padding: 10px 18px 12px;
   margin-top: -28px;
   margin-bottom: 2px;
   position: relative;
   z-index: 3;
-  /* W8-B：动作条落在桌面阴影盘上，更接近竞品印章条 */
   background: radial-gradient(ellipse at center, rgba(6, 18, 14, 0.55) 0%, rgba(6, 18, 14, 0.22) 55%, transparent 78%);
-  border-radius: 999px;
+  border-radius: 16px;
+}
+
+/* MJ-T3-CENTER-01：印章动作条贴手牌 */
+.action-seal-bar {
+  display: flex;
+  align-items: flex-end;
+  justify-content: center;
+  gap: 12px;
+  border-radius: 16px;
 }
 
 .action-bar::before {
   content: "";
   position: absolute;
   left: 6%;
   right: 6%;
   bottom: -10px;
@@ -2272,17 +2242,17 @@ body {
 .action-btn {
   --seal-h: 56px;
   --seal-min-w: 118px;
   position: relative;
   isolation: isolate;
   min-height: var(--seal-h);
   min-width: var(--seal-min-w);
   padding: 0 28px;
-  border-radius: 999px;
+  border-radius: 10px;
   border: 2.5px solid rgba(214, 190, 140, 0.55);
   background:
     linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 28%, transparent 42%),
     linear-gradient(180deg, #d8c29a 0%, #a88958 48%, #6e5330 100%);
   color: #f8f0dc;
   font-size: 34px;
   font-weight: 900;
   line-height: 1;
@@ -2401,19 +2371,34 @@ body {
 }
 
 .action-btn[data-action-id="peng"],
 .action-btn[data-action-id="gang"],
 .action-btn[data-action-id="pass"] {
   font-size: 30px;
 }
 
+.action-btn.action-seal {
+  border-radius: 10px;
+  letter-spacing: 0.12em;
+  background: linear-gradient(180deg, #1c3328, #0f1c16);
+  border: 1px solid rgba(244, 214, 138, 0.35);
+}
+
+.action-btn.action-seal[data-action-id="hu"].action-main-path,
+.action-btn.action-seal[data-action-id="hu"].action-primary,
 .action-btn[data-action-id="hu"].action-main-path,
 .action-btn[data-action-id="hu"].action-primary {
-  font-size: 48px;
+  min-width: 96px;
+  min-height: 56px;
+  font-size: 1.35rem;
+  background: linear-gradient(180deg, var(--gold-1), var(--gold-2));
+  color: #1b1306;
+  border-color: var(--gold-1);
+  box-shadow: 0 8px 18px rgba(216, 159, 64, 0.45);
 }
 
 .action-btn-aux {
   display: none !important;
 }
 
 .acceptance-mode .action-btn-aux {
   display: inline-flex !important;
@@ -2672,30 +2657,30 @@ td {
     padding: 10px;
   }
 
   .table-center {
     inset: 80px 60px 122px;
   }
 
   .center-score-disk {
-    width: 250px;
-    height: 190px;
+    width: 180px;
+    height: 180px;
   }
 
   .score-round {
-    font-size: 38px;
+    font-size: 18px;
   }
 
   .score-wall-label {
-    font-size: 24px;
+    font-size: 12px;
   }
 
   #scoreCoreWall {
-    font-size: 50px;
+    font-size: 24px;
   }
 
   .primary-focus-hint {
     font-size: 36px;
   }
 
   .seat {
     width: 180px;
@@ -2783,18 +2768,18 @@ td {
     transform: none;
   }
 
   .center-public-info {
     width: min(260px, 90%);
   }
 
   .center-score-disk {
-    width: 178px;
-    height: 134px;
+    width: 148px;
+    height: 148px;
     margin-top: 8px;
   }
 
   .score-wind {
     width: 50px;
     font-size: 11px;
   }
 

## New test file
```typescript
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * 局内桌三抬顶：结构合同 + 关键 id 防回退
 * 契约：方盘桌心、印章动作条、手牌/牌河槽位在场；禁止说明墙抢桌心。
 */
describe('CAP-T3 / MJ-T3-CENTER-01 / MJ-T3-TILE-01', () => {
  const protoRoot = path.resolve(__dirname, '../../docs/majiang/web-ui-prototype');
  const html = fs.readFileSync(path.join(protoRoot, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(protoRoot, 'styles.css'), 'utf8');

  it('tablePage 关键 id 与四方座位/牌河在场', () => {
    expect(html).to.match(/id=["']tablePage["']/);
    expect(html).to.match(/id=["']handTiles["']/);
    expect(html).to.match(/id=["']scoreCoreWall["']/);
    expect(html).to.match(/id=["']river-north["']/);
    expect(html).to.match(/id=["']river-west["']/);
    expect(html).to.match(/id=["']river-east["']/);
    expect(html).to.match(/id=["']river-south["']/);
    expect(html).to.match(/id=["']seat-north["']/);
    expect(html).to.match(/id=["']seat-south["']/);
    expect(html).to.match(/data-action-id=["']hu["']/);
    expect(html).to.match(/data-action-id=["']pass["']/);
    expect(html).to.match(/data-action-id=["']peng["']/);
    expect(html).to.match(/data-action-id=["']gang["']/);
  });

  it('桌心为方盘合同类名，动作条为印章条', () => {
    expect(html).to.match(/class=["'][^"']*\bcenter-score-disk\b/);
    expect(html).to.match(/class=["'][^"']*\baction-seal-bar\b/);
    expect(css).to.match(/\.center-score-disk\s*\{/);
    expect(css).to.match(/\.action-seal-bar/);
  });

  it('禁止桌心半透明说明墙回潮（primaryFocusHint 不得常驻抢主）', () => {
    // 允许节点存在，但默认应可折叠/弱化：须带 table-aux 或 hidden 父级策略类
    expect(html).to.match(/id=["']primaryFocusHint["']/);
    expect(css, '须复用大厅同族毡色变量').to.match(/--table-felt-a/);
    expect(css).to.match(/--gold-2/);
    expect(css, '禁紫霓虹主强调').to.not.match(/#a855f7|#8b5cf6|purple\s*!important/i);
  });

  it('胡钮具备主路径类钩子', () => {
    expect(css).to.match(/data-action-id=["']hu["'].*action-main-path|action-main-path[\s\S]*data-action-id=["']hu["']|\.action-btn\[data-action-id=["']hu["']\]\.action-main-path/);
  });
});
```

## Report excerpt
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
