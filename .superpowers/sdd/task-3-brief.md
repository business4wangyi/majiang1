### Task 3: 桌心盘 + 动作印章条 · `MJ-T3-CENTER-01`

**前置：** Task 2 人批完成。未批则禁止本 Task。

**Files:**
- Create: `tests/majiang/web-table-v3.test.ts`
- Modify: `docs/majiang/web-ui-prototype/index.html`（`#tablePage` 内桌心与动作区）
- Modify: `docs/majiang/web-ui-prototype/styles.css`（`.table-center` / `.center-score-disk` / `.action-seal-bar`）
- Modify: `docs/majiang/web-ui-prototype/app.js`（仅当类名/选择器断裂）
- Modify: 脊骨 G-T2 / W1 / caps `CAP-T3-CENTER`

**Interfaces:**
- Consumes: 阶段 A 方盘合同；既有 `score*` / `data-action-id` id
- Produces: 桌心无说明墙；印章条贴手牌；胡主路径视觉可辨

- [ ] **Step 1: 先写失败挂测（TDD）**

创建 `tests/majiang/web-table-v3.test.ts`：

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

- [ ] **Step 2: 跑测确认失败点可定位**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
```

Expected: 至少有与「说明墙/印章/变量」相关的 FAIL，或结构断言已绿而视觉钩子 FAIL；不得整文件空过。

- [ ] **Step 3: 收敛桌心 DOM（去掉抢主说明墙）**

在 `index.html` 的 `.table-center` 内：

1. **保留** `.center-score-disk` 及全部 `score*` / `centerRoundInfo` / `centerWallCount` id。
2. 将 `.center-public-info`（若与方盘重复）改为 `hidden` 或并入顶栏次级，避免双份大字抢桌心。
3. 将 `.latest-action-wrap` 内长文案（`primaryFocusHint` / `stageMainPath` / `secondaryContext`）默认收入可折叠区：外层加 `class="table-aux center-detail-drawer"`，默认不加展开态；`toggleContextBtn` 仍负责展开。
4. **不要**删除 id；只调整可见性与层级。
5. 确认 `.action-seal-bar` 仍在 `.table-bottom-anchor` 内、紧贴 `.hand-panel` 上方。

示意（保留 id，收敛结构）：

```html
<section class="table-center">
  <div class="center-score-disk" aria-hidden="false">
    <!-- 既有 score-wind / score-core 不变 -->
  </div>
  <div class="center-detail-drawer table-aux">
    <div class="stage-keyline">
      <span id="stageActor" class="stage-actor">玩家4</span>
      <span id="stageVerb" class="stage-verb">打出</span>
      <span id="responseTargetTile" class="tile-face tile-face--target">三万</span>
      <span id="stageToYou" class="stage-to-you">→ 可胡</span>
      <span id="stagePriorityTag" class="stage-priority-tag">主动作：胡</span>
    </div>
    <div id="secondaryContext" class="secondary-context hidden">
      <p id="primaryFocusHint" class="primary-focus-hint"></p>
      <p id="stageMainPath" class="stage-main-path"></p>
      <p id="latestActionMain" class="latest-action"></p>
      <p id="latestActionSub" class="latest-action-sub"></p>
      <p id="responseLinkHint" class="response-link-hint"></p>
      <p id="responseCountdown" class="response-countdown"></p>
    </div>
    <button id="toggleContextBtn" type="button" class="ghost-inline-btn table-aux">展开局势细节</button>
  </div>
  <div class="river-board">
    <!-- 既有 river-* 不变 -->
  </div>
  <div id="responseCallout" class="response-callout hidden">右家打出</div>
</section>
```

若 `app.js` 依赖 `.latest-action-wrap` 选择器：同步改选择器为 `.center-detail-drawer`，或保留空壳 class `latest-action-wrap` 作别名。

- [ ] **Step 4: CSS 对齐方盘 + 印章条（对照阶段 A）**

在 `styles.css` 调整（数值以阶段 A PNG 为准，下列为最小合同）：

```css
/* MJ-T3-CENTER-01：方盘桌心 + 印章条主路径 */
.center-score-disk {
  width: 220px;
  height: 220px;
  border-radius: 18px; /* 方盘圆角，非圆形大盘冒充 */
  border: 2px solid rgba(244, 214, 138, 0.45);
  background: linear-gradient(145deg, rgba(20, 48, 36, 0.95), rgba(8, 24, 18, 0.98));
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45), inset 0 0 24px rgba(244, 214, 138, 0.08);
}

.center-detail-drawer,
.latest-action-wrap.table-aux {
  opacity: 0.55;
  max-width: 320px;
}

.action-seal-bar {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
}

.action-btn.action-seal[data-action-id="hu"].action-main-path,
.action-btn.action-seal[data-action-id="hu"].action-primary {
  min-width: 96px;
  min-height: 56px;
  font-size: 1.35rem;
  background: linear-gradient(180deg, var(--gold-1), var(--gold-2));
  color: #1b1306;
  border-color: var(--gold-1);
  box-shadow: 0 8px 18px rgba(216, 159, 64, 0.45);
}

.action-btn.action-seal {
  border-radius: 10px;
  letter-spacing: 0.12em;
  background: linear-gradient(180deg, #1c3328, #0f1c16);
  border: 1px solid rgba(244, 214, 138, 0.35);
}
```

禁止把动作钮改回大圆 pill 工具条。

- [ ] **Step 5: 再跑挂测至本 Task 相关断言通过**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
```

Expected: PASS（若 TILE 断言尚未改 CSS 可暂留，但 CENTER 相关须绿）。

- [ ] **Step 6: 回写账本 + Commit（仅用户要求）**

脊骨 G-T2 / GR-T4 → 施工中或已落地（以人眼对照阶段 A 桌心+动作为准；未 GRAD 前勿关 GR-T7）。

```bash
git add tests/majiang/web-table-v3.test.ts \
  docs/majiang/web-ui-prototype/index.html \
  docs/majiang/web-ui-prototype/styles.css \
  docs/majiang/web-ui-prototype/app.js \
  docs/product/spines/majiang-web-table-v3-target.md \
  docs/product/waves/majiang-web-table-v3-W1.md \
  docs/product/caps/majiang-web-table-v3-cap-tasks.md
git commit -m "$(cat <<'EOF'
feat(table-v3): 收敛方盘桌心与印章动作条

对照阶段 A 去掉说明墙抢主，胡钮主路径放大。
EOF
)"
```

---

