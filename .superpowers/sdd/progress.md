# SDD Progress — majiang-ai-p1-heuristic

Plan: docs/superpowers/plans/2026-11-20-majiang-ai-p1-heuristic-plan.md
Workspace: in-place on develop（沿用 SDD 惯例；无 commit unless user asks）
Started: 2026-11-20
Merge-base note: branch develop; task BASE = HEAD before each implementer
HEAD at start: 62dc73fe33b11ee4ff7178f7a3a5e96d15244d82

## Global Constraints (binding)

- 规格 SSOT：`docs/superpowers/specs/2026-11-20-majiang-ai-algorithms-survey-design.md` §7.2
- 本计划只做 P1；P2/P3 不在范围
- 禁止改 `src/majiang/core/` 权威；策略层只读 `RuleEngine.calculateShanten`
- 禁止新 npm 依赖；禁止改 `ai-alphazero/*`
- 禁止把日麻/国标权重当本仓规则权重
- `calculateShanten` 简化估算误差接受；测例冲突只改测例不改 core
- 提交说明中文；**仅当用户明确要求 commit 才提交**
- 规范：`docs/standards/rules/superpowers-artifacts.md`、`docs/standards/testing/quality.md`、`AGENTS.md`

## Tasks

- [x] Task 1: 弃牌排序器 · 向听差主排序
- [x] Task 2: 有效牌（ukeire）破平
- [x] Task 3: 简单危险度（现物安全）
- [x] Task 4: 接入 AIPlayer.getAIMove
- [x] Task 5: 出牌前注入桌上可见弃牌
- [x] Task 6: 回归与规格回写

## Ledger

Task 1: complete (no commit; working tree vs 62dc73f; review clean)
Note: mocha via CJS loader (same as npm test); bare `npx mocha` ESM fails in this repo
Task 2: complete (no commit; review clean; DONE_WITH_CONCERNS: tenpai ukeire=0 due to shanten floor — accepted)
Task 3: complete (no commit; review clean)
Task 4: complete (no commit; review clean)
Task 5: complete (no commit; review clean)
Task 6: complete (no commit; review clean; 3376 passing; P1 human-accept unchecked)

## Minor findings roll-up

- T1: test title still says 顺子 but hand is 刻子向; unused imports; TONG branch unused in assert
- T2: unused Player/PlayerType imports; optional assert ukeire>0; tenpai ukeire ceiling noted
- T3: hoist seen-Set; optional direct danger matrix tests; producer wiring is Task 5
- T4: optional scoreDiscardCandidates debug summary; getAllTileValues now dead private
- T5: no handleDiscard E2E glue test (brief didn't require); double clone nit

## Final review

Ready to merge (2026-11-20); no Critical/Important; all Minors deferred.
Awaiting user: commit / PR / keep as-is / discard.
