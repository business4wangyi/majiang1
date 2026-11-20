### Task 5: 毡光影与大厅色板连续 · `MJ-T3-FELT-01`

**Files:**
- Modify: `docs/majiang/web-ui-prototype/styles.css`（`.table-page` / `.table-stage` / 毡纹理）
- Modify: 脊骨 G-T4 / GR-T6；W1；caps `CAP-T3-FELT`
- Test: `tests/majiang/web-table-v3.test.ts`（已含 `--table-felt-a` / `--gold-2`）

**Interfaces:**
- Consumes: 大厅已毕业色板变量；阶段 A 毡氛围
- Produces: 局内毡与大厅同族；无紫霓虹/灰面板回潮

- [ ] **Step 1: 确认大厅变量未被局内覆盖成另一套**

```bash
rg -n '--table-felt-a|--gold-2' docs/majiang/web-ui-prototype/styles.css | head -40
```

Expected: `:root` 与 `.table-page` / `.table-stage` 使用同族值（允许局内加深，禁止换成灰紫）。

- [ ] **Step 2: 收敛 `.table-stage` 毡光影**

```css
/* MJ-T3-FELT-01：与大厅同族绿毡金扣 */
.table-page {
  background:
    radial-gradient(ellipse at 50% 42%, rgba(40, 120, 80, 0.35) 0%, transparent 52%),
    linear-gradient(165deg, var(--table-felt-a) 0%, var(--table-felt-b) 45%, var(--table-felt-c) 100%);
}

.table-stage-frame {
  border: 3px solid rgba(244, 214, 138, 0.22);
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.35);
}

/* 若叠加 table-felt-texture.png：仅当资产为纯毡；含牌/中控的截图不得当纹理 */
```

对照大厅注释：若 `assets/table-felt-texture.png` 是整桌截图，局内也**不要**硬叠；用渐变+内阴影即可。

- [ ] **Step 3: 跑挂测 + 快速目视 1440×900**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
```

用浏览器打开原型进入 `#tablePage`，视口 1440×900，确认毡色与大厅同族。

- [ ] **Step 4: Commit（仅用户要求）**

```bash
git add docs/majiang/web-ui-prototype/styles.css \
  docs/product/spines/majiang-web-table-v3-target.md \
  docs/product/waves/majiang-web-table-v3-W1.md \
  docs/product/caps/majiang-web-table-v3-cap-tasks.md
git commit -m "$(cat <<'EOF'
feat(table-v3): 对齐局内绿毡光影与大厅色板

复用毡/金变量，避免灰面板与紫霓虹回潮。
EOF
)"
```

---

