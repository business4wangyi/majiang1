# SDD Progress — majiang-web-table-v3

Plan: docs/superpowers/plans/2026-11-19-majiang-web-table-v3.md
Workspace: in-place on develop（沿用上一波 SDD 惯例；无 commit unless user asks）
Started: 2026-11-19
Merge-base note: branch develop; task BASE = HEAD before each implementer
HEAD at start: 8e02a4ceb45b63fd98c378af226d2e84652d9c7b

## Global Constraints (binding)

- 规格 SSOT: docs/superpowers/specs/2026-11-19-majiang-web-table-v3-design.md
- 脊骨/波次/封顶: docs/product/spines|waves|caps/majiang-web-table-v3-*
- 禁止改 #lobbyPage / 重开大厅毕业；禁止改 src/majiang/core/
- 禁止旧 W8/竞品图冒充阶段 A；禁止无 STAGEA 人批大改视觉；Agent 不得自批 GR-T7
- 功能绿 ≠ 视觉毕业；桌心方盘；材质 --table-felt-* / --gold-*；印章条胡最大
- 保留关键 DOM id（见计划 Global Constraints 列表）
- 仅当用户明确要求 commit 才提交

## Tasks

- [x] Task 1: 账本核验 · MJ-T3-LEDGER-01
- [x] Task 2: 阶段 A 自绘冻结 · MJ-T3-STAGEA-01 ✅ 人批「批准」2026-11-19
- [x] Task 3: 桌心盘 + 动作印章条 · MJ-T3-CENTER-01
- [x] Task 4: 手牌 / 牌河 · MJ-T3-TILE-01
- [x] Task 5: 毡光影 · MJ-T3-FELT-01
- [x] Task 6: 挂测 + Stage B · 防回退
- [x] Task 7: 人批毕业 · MJ-T3-GRAD-01 ✅ 「批准毕业」2026-11-19

## Ledger

Task 1: complete (no commit / no file change; LEDGER+G-T0+CAP-T3-LEDGER 已落地 → STAGEA; controller verified; 规格文首仍「待人审」→ 等人拍板)

Human: 2026-11-19 「继续」= 规格 OK，进入 Task 2 STAGEA

Task 2: assets ready (no commit; PNG 1440×900; review Approved); ⛔ awaiting human 「批准/冻结」 before STAGEA 已落地
Task 2: complete (no commit; human「批准」2026-11-19; STAGEA/GR-T3/G-T1/CAP 已落地; review clean)
Task 3: complete (no commit; CENTER 4/4; hu size fix re-review Approved; Minor: stale .action-main-path vars)
Task 4: complete (no commit; TILE 5/5; review Approved; Minor: hook-only asserts plan-mandated)
Task 5: complete (no commit; FELT 5/5; ledger header fix re-review Approved)
Task 6: complete (no commit; mocha 8/8 e2e 8/0; Stage B PNG; review Approved; chi fixture Necessary)
Task 7: complete (no commit; human「批准毕业」2026-11-19; GR-T4…T7 / CAP-T3-GRAD / W1 收官)

Final review: Ready to merge; no Critical/Important; follow-ups: stale action-main-path vars, hook-only asserts, chi fixture, don't commit .superpowers/ scratch
