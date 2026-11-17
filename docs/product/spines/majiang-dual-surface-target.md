# 麻将双表面 — 目标差距脊骨（封顶）

> **状态**：人批抬顶（2026-11-17 · 路径 A）· 账本施工中  
> **关联**：`docs/product/caps/majiang-dual-surface-cap-tasks.md`、`docs/product/waves/majiang-dual-surface-W9.md`  
> **规格**：`docs/superpowers/specs/2026-11-17-majiang-dual-surface-design.md`  
> **流程**：`docs/product/delivery-flow.md`  
> **与旧脊骨关系**：`majiang-webui-target.md` 视觉一段/二段已毕业；本脊骨另立「CLI+Web 共用引擎」天花板，不重开 `CAP-UI-COMP`

## 1. 当前天花板（一句话）

同一游戏引擎支撑两条表面：**CLI 用于训练模型**，**Web 用于人测**；规则权威只在 `core` / 无头 Session，前端不重写胡吃碰杠。

## 2. 毕业标准（须人批；Agent 不得自批）

| ID | 标准 | 状态 |
|----|------|------|
| GR-D1 | 无头 Session 可驱动开局→出牌→响应→AI 步→终局，不依赖 readline/console 显示 | **已关**（`tests/majiang/game-session.test.ts`） |
| GR-D2 | 快照合同可映射现有 `view-model-adapter`；动作可用性来自引擎 | **已关**（`tests/majiang/table-snapshot.test.ts` / `MJ-ACC-SNAP-01`） |
| GR-D3 | CLI 自动对弈/训练主路径改走 Session，训练统计可回归 | 待做 |
| GR-D4 | 本机对局 API（HTTP，可选 WS）权威在 Node；Web 只提交动作与渲染 | 待做 |
| GR-D5 | Web 原型去掉假 `waiting_ai` 死循环；人测可打完一局到结算 | 待做 |
| GR-D6 | 大厅为可落地产品入口（主 CTA + 固定配置；诊断折叠） | 待做 |
| GR-D7 | 双表面验收：引擎契约测 + Web 人测主链路可自动化 | 待做（矩阵+smoke/nightly 脚手架已挂；能力跟 CAP 批序变绿） |
| GR-D8 | 人明确批准「双表面毕业」；Agent / `/loop` 不得自批 | 待人批 |

## 3. 硬不做

- Web / 适配层重写胡、吃、碰、杠、计分权威  
- 为接 Web 破坏 CLI 训练主路径或偷偷改训练语义  
- 用功能自动化绿冒充视觉再冲顶（视觉 `CAP-UI-*` 已关，本波不重开 COMP）  
- Agent / `/loop` 自批 `CAP-DUAL-GRAD`  
- 把 core 整包打进浏览器作为默认方案（已否决路径 B）

## 4. 差距 → 切片

| 差距 | 摘要 | 层 | 切片 | 封顶任务 | 状态 |
|------|------|----|------|----------|------|
| G-D0 | 新脊骨/任务表/W9 落盘；旧 UI 队列标只读 | 流程 | `MJ-DUAL-LEDGER-01` | `CAP-ARCH-LEDGER` | **已落地** |
| G-D1 | 无头 Session 从 CLI 耦合中抽出 | 引擎 | `MJ-ENG-SESSION-01` | `CAP-ENG-SESSION` | **已落地** |
| G-D2 | Snapshot 合同 | 契约 | `MJ-ENG-SNAP-01` | `CAP-ENG-SNAP` | **已落地** |
| G-D3 | CLI 训练接 Session | CLI | `MJ-CLI-TRAIN-01` | `CAP-CLI-TRAIN` | 待做 |
| G-D4 | 对局 API | API | `MJ-API-GAME-01` | `CAP-API-GAME` | 待做 |
| G-D5 | Web handlers 接 API | Web·U1 | `MJ-WEB-BRIDGE-01` | `CAP-WEB-BRIDGE` | 待做 |
| G-D6 | 大厅产品入口 | Web·U0 | `MJ-WEB-LOBBY-01` | `CAP-WEB-LOBBY` | 待做 |
| G-D7 | 双表面验收 | 验收 | `MJ-ACC-DUAL-01` | `CAP-ACC-DUAL` | 待做 |
| G-D8 | 人批双表面毕业 | 收官 | — | `CAP-DUAL-GRAD` | 待人批 |

## 5. 版式 / 观感合同

| 合同 | 状态 |
|------|------|
| 局内视觉 · 一段/二段 | **沿用已毕业**（防回退；本脊骨不施工视觉冲顶） |
| 大厅 U0 | 待 `CAP-WEB-LOBBY` |
| 引擎/API 契约 | Snapshot **已落地**；API 待 `CAP-API-GAME` |

## 6. 下一刀建议

默认队列下一切片：`CAP-CLI-TRAIN`（可与 `CAP-API-GAME` 并行）。  
自动化：`/loop` 只从 `majiang-dual-surface-cap-tasks.md` 取下一条 `CAP-*`。  
验收账本：`docs/product/caps/majiang-dual-surface-acceptance-matrix.md`；命令：`npm run majiang:dual:smoke` / `majiang:dual:nightly`。
