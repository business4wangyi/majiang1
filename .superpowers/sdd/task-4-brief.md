### Task 4: 对战评测脚本 · 1×P2 vs 3×legacy

**Files:**
- Create: `scripts/training/majiang/battle-p2-vs-legacy-1000.ts`
- Runtime out: `models/majiang/battle-p2-vs-legacy-1000.json`

**Interfaces:**
- Consumes: 复制 `battle-p1-vs-legacy-1000.ts` 结构；`setDiscardStrategy(idx === p2Seat ? 'p2' : 'legacy')`
- Produces: JSON 字段 `algorithm: "1xP2-vs-3xlegacy"`；`matchup.p2Wins` / `legacyWins` / `p2WinRateAmongDecidedPct`；`expectedP2WinRatePct: 25`

- [ ] **Step 1: 以 P1 对战脚本为模板新建文件**

从 `scripts/training/majiang/battle-p1-vs-legacy-1000.ts` 复制后全局替换：

- 注释 / 用法中的 P1 → P2
- `setDiscardStrategy(... 'p1' ...)` → `'p2'`
- 变量名 `p1Wins` → `p2Wins`，`p1Seat` → `p2Seat`，`p1Won` → `p2Won`
- `algorithm` / `outPath` 默认改为 `battle-p2-vs-legacy-1000.json`
- `expectedP1WinRatePct` → `expectedP2WinRatePct`

禁止改 GameEventHandler 主循环逻辑（与 P1 脚本保持同构，保证可比）。

- [ ] **Step 2: 冒烟 20 局**

Run: `npx ts-node scripts/training/majiang/battle-p2-vs-legacy-1000.ts 20 models/majiang/battle-p2-vs-legacy-smoke-20.json`  
Expected: 进程退出码 0；JSON `roundsCompleted: 20`；无未捕获崩溃

- [ ] **Step 3: 完整 1000 局（验收闸）**

Run: `npx ts-node scripts/training/majiang/battle-p2-vs-legacy-1000.ts 1000 models/majiang/battle-p2-vs-legacy-1000.json`  
Expected: `roundsCompleted: 1000`；**人话验收**：`p2WinRateAmongDecidedPct` **≥ 25**（不低于均势）；理想 **≥ 30**（明显强于 legacy）。若 &lt; 25，回到 Task1/2 只调 `EV_CONSTANTS` 或 risk 表，不改 core，再复测冒烟+1000。

对照基线：P1 同脚本形态曾得约 **14.55%**（`models/majiang/battle-p1-vs-legacy-1000.json`）——P2 必须显著高于该值。

- [ ] **Step 4: Commit（仅用户明确要求时）**

```bash
git add scripts/training/majiang/battle-p2-vs-legacy-1000.ts \
  models/majiang/battle-p2-vs-legacy-1000.json \
  models/majiang/battle-p2-vs-legacy-smoke-20.json
git commit -m "$(cat <<'EOF'
test(majiang): 增加 P2 对战 legacy 的 1000 局评测

EOF
)"
```

---

