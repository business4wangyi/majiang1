### Task 6: 挂测回归 + 阶段 B 对照帧 · 防回退

**Files:**
- Create: `docs/majiang/design-freeze/stage-b-v3-table/README.md`
- Create: `docs/majiang/design-freeze/stage-b-v3-table/2026-11-19-table-impl-desktop-1440x900.png`
- Modify: 无逻辑变更则不改原型；失败则回 Task 3–5 修

**Interfaces:**
- Consumes: 实现后的 `#tablePage`
- Produces: 阶段 B 对照 PNG；e2e smoke 绿

- [ ] **Step 1: 写阶段 B README**

```markdown
# 局内桌三抬顶 · 阶段 B（实现对照）

> 对照目标：`../stage-a-v3-table/2026-11-19-table-desktop-1440x900.png`  
> 本目录帧为实现截图，**不能**单独作为阶段 A 目标。

## 入库帧

| 视口 | 文件 |
|------|------|
| 桌面 1440×900 | `2026-11-19-table-impl-desktop-1440x900.png` |

## 对照清单

- [ ] 方盘桌心可读（风向局/余牌）
- [ ] 印章条 + 胡主路径
- [ ] 手牌实体感 + 选中抬起
- [ ] 牌河有序 + 最近牌高亮
- [ ] 毡/金与大厅同族
```

- [ ] **Step 2: 截实现帧**

优先用既有验收/e2e 截图能力；若无，则本地起原型后 Playwright 打开对局页截 1440×900 存到阶段 B 路径。验收模式若提供固定响应态，优先截「可胡」态。

- [ ] **Step 3: 跑回归**

```bash
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts tests/majiang/web-lobby.test.ts -v
npm run majiang:web:e2e
```

Expected: 挂测 PASS；e2e smoke 绿。大厅挂测不得回归。

- [ ] **Step 4: 移动防回退抽检（不计入毕业）**

浏览器 390×844 打开 `#tablePage`，目视不比现网明显恶化（可参考旧 W8 mobile 实现帧作「不恶化」下限，**不是**本波目标）。

- [ ] **Step 5: Commit（仅用户要求）**

```bash
git add docs/majiang/design-freeze/stage-b-v3-table \
  tests/majiang/web-table-v3.test.ts
git commit -m "$(cat <<'EOF'
test(table-v3): 入库阶段 B 对照帧并回归挂测 e2e

功能绿仅作防回退，不宣称视觉毕业。
EOF
)"
```

---

