### Task 6: 回归与规格回写

**Files:**
- Modify: `docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md`（§9/§10：标注 P1 plan 已落盘；**不**把 P1 实现勾成已交付，除非本 Task 测绿且用户确认）
- Read-only 验证：既有 `tests/majiang/rule-engine.test.ts`、`tests/majiang/game-session.test.ts`

**Interfaces:**
- Consumes: Task 1–5 交付物
- Produces: 回归绿；规格闸门句子更新为「P1 计划：`docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md`」

- [ ] **Step 1: 跑弃牌测 + 规则/会话烟测**

```bash
npx mocha -r ts-node/register \
  tests/majiang/discard-ranker.test.ts \
  tests/majiang/rule-engine.test.ts \
  tests/majiang/game-session.test.ts \
  --timeout 20000
```

Expected: 全部 PASS。若 `game-session` 因 AI 出牌选择变化导致脆弱断言失败：只放宽「具体打哪张」类断言，**禁止**为过测回退排序器。

- [ ] **Step 2: 规格闸门回写（文档）**

在调研规格 §9 将「方可开 writing-plans」改为已开，并链到本 plan；§10.1 保持「P2 另开 plan」。

- [ ] **Step 3: Commit（仅用户要求时）**

```bash
git add docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md \
  docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md
git commit -m "$(cat <<'EOF'
docs(majiang): 登记 P1 启发式 AI 实现计划与规格闸门

调研结论落地为可执行 P1 计划，P2/P3 仍单独立项。
EOF
)"
```

---

## Self-Review（对照规格）

| 规格条目 | 本计划任务 |
|----------|------------|
| §7.1 P1 向听数、有效牌、简单危险度 | Task 1–3 |
| §7.1 可选轻量蒙特卡洛 | **刻意不做**（YAGNI；需另开刀） |
| §7.2 P1→P2，P3 单独立项 | Global Constraints；无 P2/P3 施工 Task |
| §3 / §7 不碰 core 权威、不引入依赖、不抄权重 | Global Constraints + Task 1 只读 `calculateShanten` |
| §6 本仓 `agents/ai-player` 对照 | Task 4–5 |
| §6 差距「对手听牌概率」 | 仅现物危险度，**不**宣称已补 Bakuuchi 级模型 |
| 验收可观察「不像瞎打」 | Task 1/4 测例 + 人机主观仍属上线后观察，不在自动化内自批 |

**Placeholder scan:** 无 TBD；测例牌面若与简化向听冲突，步骤已要求改测例不改 core。  
**类型一致性:** `DiscardRankContext` / `pickDiscardIndex` / `setVisibleDiscards` / `collectVisibleDiscards` 命名在 Task 1–5 一致。
