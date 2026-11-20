### Task 1: 账本核验 · `MJ-T3-LEDGER-01`

**Files:**
- Read-only: `docs/product/spines/majiang-web-table-v3-target.md`
- Read-only: `docs/product/waves/majiang-web-table-v3-W1.md`
- Read-only: `docs/product/caps/majiang-web-table-v3-cap-tasks.md`
- Read-only: `docs/superpowers/specs/2026-11-19-majiang-web-table-v3-design.md`
- Modify（仅当状态未对齐）: 上述账本中 `MJ-T3-LEDGER-01` / `CAP-T3-LEDGER` / G-T0 标为已落地；下一刀指向 STAGEA

**Interfaces:**
- Consumes: 规格 §2–§9；脊骨切片 ID
- Produces: 确认账本可查；下一刀仅为 `MJ-T3-STAGEA-01`

- [ ] **Step 1: 核验四件套存在且 LEDGER 已落地**

```bash
test -f docs/superpowers/specs/2026-11-19-majiang-web-table-v3-design.md
test -f docs/product/spines/majiang-web-table-v3-target.md
test -f docs/product/waves/majiang-web-table-v3-W1.md
test -f docs/product/caps/majiang-web-table-v3-cap-tasks.md
rg -n 'MJ-T3-LEDGER-01|已落地|STAGEA' docs/product/spines/majiang-web-table-v3-target.md docs/product/waves/majiang-web-table-v3-W1.md docs/product/caps/majiang-web-table-v3-cap-tasks.md
echo "OK: ledger files present"
```

Expected: 四文件存在；脊骨/波次/任务表显示 LEDGER **已落地**，下一刀 STAGEA。

- [ ] **Step 2: 若规格文首仍写「待人审」，向用户确认一句**

聊天决策卡结论：本计划按规格施工；若用户对落盘规格有修改点，先改规格再继续 Task 2。用户回「规格 OK / 继续」即可进入 STAGEA。

- [ ] **Step 3: Commit（仅用户要求时）**

```bash
git add docs/product/spines/majiang-web-table-v3-target.md \
  docs/product/waves/majiang-web-table-v3-W1.md \
  docs/product/caps/majiang-web-table-v3-cap-tasks.md
git commit -m "$(cat <<'EOF'
docs(table-v3): 核验局内桌三抬顶账本已落地

确认 LEDGER 完成，下一刀指向阶段 A 自绘冻结。
EOF
)"
```

若无文件变更：跳过 commit，直接 Task 2。

---

