### Task 4: 手牌 / 牌河 / 最近牌 · `MJ-T3-TILE-01`

**前置：** STAGEA 已批；建议 CENTER 已合入。

**Files:**
- Modify: `docs/majiang/web-ui-prototype/styles.css`（`.hand-tiles` / `.tile` / `.river-grid` / `.tile-mini--latest`）
- Modify: `docs/majiang/web-ui-prototype/index.html`（仅当牌河 DOM 层级阻碍布局）
- Modify: `docs/majiang/web-ui-prototype/app.js`（选中态 class：保持 `sel` / `is-selected` / `tile-mini--latest` 之一与现逻辑一致）
- Modify: `tests/majiang/web-table-v3.test.ts`（补 TILE 断言）
- Modify: 脊骨 G-T3 / caps `CAP-T3-TILE`

**Interfaces:**
- Consumes: 既有图集钩子 `has-tile-atlas`；阶段 A 手牌尺寸节奏
- Produces: 手牌主角感；选中抬起；最近弃牌高亮

- [ ] **Step 1: 扩展挂测**

在 `tests/majiang/web-table-v3.test.ts` 追加：

```typescript
  it('手牌与最近牌高亮钩子在 CSS 合同内', () => {
    expect(css).to.match(/\.hand-tiles\s*\{/);
    expect(css).to.match(/\.tile\.sel|\.tile\.is-selected|\.hand-tiles\s+\.sel/);
    expect(css).to.match(/tile-mini--latest|\.mini\.latest|\.river-grid[\s\S]*latest/);
    expect(css).to.match(/has-tile-atlas/);
  });
```

- [ ] **Step 2: 跑测确认新断言失败**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
```

Expected: 新 TILE 断言 FAIL 或已部分满足；记录缺口再改。

- [ ] **Step 3: CSS 收敛手牌/牌河（禁止色点矩形）**

```css
/* MJ-T3-TILE-01 */
.hand-tiles {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px 16px;
}

.hand-tiles .tile {
  width: 52px;
  height: 72px;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--tile-face-cream) 0%, var(--tile-face-mid) 70%, var(--tile-face-base) 100%);
  border: 1px solid rgba(90, 70, 40, 0.4);
  box-shadow: 2px 3px 0 rgba(40, 90, 60, 0.4), 0 8px 14px rgba(0, 0, 0, 0.28);
}

.hand-tiles .tile.sel,
.hand-tiles .tile.is-selected {
  transform: translateY(-10px);
  border-color: var(--gold-2);
}

.river-grid .tile-mini--latest,
.river-grid .mini.latest {
  outline: 2px solid var(--gold-2);
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.35);
}
```

若已有 `has-tile-atlas` 图集路径：保持启用，禁止退回纯色块文字牌。核对 `app.js` 给最近弃牌加 `tile-mini--latest`（或现有等价类）的逻辑仍在。

- [ ] **Step 4: 跑挂测 PASS**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
```

Expected: PASS。

- [ ] **Step 5: Commit（仅用户要求）**

```bash
git add docs/majiang/web-ui-prototype/styles.css \
  docs/majiang/web-ui-prototype/index.html \
  docs/majiang/web-ui-prototype/app.js \
  tests/majiang/web-table-v3.test.ts \
  docs/product/spines/majiang-web-table-v3-target.md \
  docs/product/waves/majiang-web-table-v3-W1.md \
  docs/product/caps/majiang-web-table-v3-cap-tasks.md
git commit -m "$(cat <<'EOF'
feat(table-v3): 强化手牌主角感与牌河最近牌高亮

对照阶段 A 抬选中态，禁色点矩形回潮。
EOF
)"
```

---

