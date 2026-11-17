# 麻将双表面 — 功能验收矩阵（SSOT）

> **角色**：目标态能力清单与封顶标准；测试/脚本/报告统一引用 `MJ-ACC-*`。  
> **施工账本**：缺口升格只写入 `majiang-dual-surface-cap-tasks.md`（一本账）。  
> **规格**：`docs/superpowers/specs/2026-11-17-majiang-dual-surface-acceptance-design.md`  
> **脊骨**：`docs/product/spines/majiang-dual-surface-target.md`  
> **质量**：`docs/standards/testing/quality.md`

## 1. 字段说明

| 字段 | 含义 |
|------|------|
| `MJ-ACC-*` | 能力 ID |
| 能力 | 人话一句话 |
| 封顶标准 | 可观察通过条件 |
| 档位 | `default` / `smoke` / `nightly` |
| 依赖 CAP | 未绿则 skip 或标待实现 |
| 状态 | `待实现` / `已挂测` / `已绿` / `人批` |

## 2. 总表

| ID | 能力 | 档位 | 依赖 CAP | 状态 |
|----|------|------|----------|------|
| `MJ-ACC-ENG-01` | 无头 Session 开局→步进→终局 | default | `CAP-ENG-SESSION` | 已绿 |
| `MJ-ACC-SNAP-01` | 快照可喂 view-model；动作来自引擎 | default | `CAP-ENG-SNAP` | 已绿 |
| `MJ-ACC-CLI-01` | 自动对弈入口走 Session | default | `CAP-CLI-TRAIN` | 已绿 |
| `MJ-ACC-CLI-02` | N 局统计可重复 | nightly | `CAP-CLI-TRAIN` | 已绿 |
| `MJ-ACC-API-01` | 对局 API 权威在服务端 | smoke | `CAP-API-GAME` | 已绿 |
| `MJ-ACC-WEB-01` | 人测主链路完局 | smoke | `CAP-WEB-BRIDGE` + `CAP-WEB-LOBBY`（大厅主 CTA） | 已绿 |
| `MJ-ACC-WEB-02` | 非法动作被拒且不脏写 | smoke | `CAP-API-GAME` + `CAP-WEB-BRIDGE` | 已绿 |
| `MJ-ACC-DUAL-01` | 双表面同引擎契约可重复 | smoke | `CAP-ACC-DUAL` | 已绿 |

## 3. 封顶标准正文

### `MJ-ACC-ENG-01`

- **通过**：`GameSession.create({ mode: 'auto' })` 后 `runFullRound()`，`getState() === ENDED`；无 readline 硬耦合。
- **挂测**：`tests/majiang/game-session.test.ts`；档位 default（含于 `npm test`）。
- **依赖**：`CAP-ENG-SESSION` 已落地。

### `MJ-ACC-SNAP-01`

- **通过**：快照含 phase、seats、selfHand、discardRiver、availableActions、resultSummary 等可喂 `createTableViewModelFromSnapshot`；`availableActions` 非前端自造。
- **挂测**：`tests/majiang/table-snapshot.test.ts`；档位 default（含于 `npm test`）。
- **依赖**：`CAP-ENG-SNAP` 已落地。

### `MJ-ACC-CLI-01`

- **通过**：自动对弈短路径走 Session，可断言终局；不依赖 readline 硬耦合。
- **挂测**：`tests/majiang/cli-train.test.ts`；档位 default（含于 `npm test`）。
- **依赖**：`CAP-CLI-TRAIN` 已落地。

### `MJ-ACC-CLI-02`

- **通过**：固定配置下 N 局输出含局数与统计字段形状稳定（可固定种子）；不进 `npm test`。
- **挂测**：`npm run majiang:dual:nightly`（`scripts/test/majiang-dual-nightly.js` runner）；默认 N=`MAJIANG_DUAL_NIGHTLY_ROUNDS` 或 2。
- **依赖**：`CAP-CLI-TRAIN` 已落地。

### `MJ-ACC-API-01`

- **通过**：`POST /games`、`GET /games/:id`、`POST /games/:id/actions` 可用；状态以服务端 Session 为准。
- **挂测**：`npm run majiang:dual:smoke`（runner 已注册；非法动作须 400 且不脏写）。
- **依赖**：`CAP-API-GAME` 已落地。

### `MJ-ACC-WEB-01`

- **通过**：大厅开局→出牌→AI 回手→结算；无假 `waiting_ai` 死等。
- **挂测**：`npm run majiang:dual:smoke`（HTTP 主链路至 `ended` + `resultSummary`；`tests/majiang/web-bridge.test.ts`）；大厅 U0 结构挂测 `tests/majiang/web-lobby.test.ts`（主 CTA + 固定配置 + 诊断默认折叠）；禁止前端自造规则。
- **依赖**：`CAP-WEB-BRIDGE` + `CAP-WEB-LOBBY` 已落地。

### `MJ-ACC-WEB-02`

- **通过**：提交非法动作被拒后，服务端/会话状态不脏写。
- **挂测**：`npm run majiang:dual:smoke`；`tests/majiang/web-bridge.test.ts`。
- **依赖**：`CAP-API-GAME` + `CAP-WEB-BRIDGE` 已落地。

### `MJ-ACC-DUAL-01`

- **通过**：同一 Session 契约被 CLI 与 API 共用的可观察证据 + smoke 可重复；且约定 default 子集（至少 ENG-01，落地后含 SNAP/CLI-01）已绿。
- **挂测**：`npm run majiang:dual:smoke`（`MJ-ACC-DUAL-01` runner：catalog 子集绿 + CLI `runAutoTraining` / API store 均为 `GameSession` + 同快照键）；轻断言 `tests/majiang/dual-acc.test.ts`；`CAP-ACC-DUAL` 收束；不替代各能力 CAP。  
- **收官**：`CAP-DUAL-GRAD` **已人批**（2026-11-18）；本矩阵防回退，不替代人批记录。

## 4. 跳过 / 失败

| 情况 | 行为 |
|------|------|
| 依赖 CAP 未落地 | skip；矩阵 `待实现`；不算回归红 |
| 已落地但断言失败 | 必须红 |
| 随机 / 多局长训 | 仅 nightly |
| `npm test` | 只跑 default |

## 5. 脚本入口

| 档位 | 命令 |
|------|------|
| default | `npm test` |
| smoke | `npm run majiang:dual:smoke` |
| nightly | `npm run majiang:dual:nightly` |
