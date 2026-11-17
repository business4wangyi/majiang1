# 波次蓝图：麻将双表面 · W9（账本 + 无头 Session 启动）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-dual-surface |
| 波次 | W9 |
| UI 层 | 流程 + 引擎（本波首刀不改大厅视觉大改；大厅属批序 6） |
| 施工状态 | Session 已关；Snapshot 另波/续刀 |
| 封顶任务 | `CAP-ARCH-LEDGER` → `CAP-ENG-SESSION`（本波默认开到 Session 可验） |
| 原型 / 引擎 | `docs/majiang/web-ui-prototype/` 本波可动桥接准备；权威仍在 `src/majiang/core/` |
| 关联旧视觉 | `majiang-webui-W8` 已关；本波不重开 COMP |

## 用户故事

作为协作者，我希望麻将同时服务 **CLI 训练** 与 **Web 人测**：两边共用同一引擎；先把无头 Session 从 CLI 显示/输入耦合中抽出，再接 API 与 Web。

## 终态效果（本波）

- 脊骨 / 封顶任务表 / 本蓝图 / 设计规格齐备且互链  
- 旧 `majiang-webui-cap-tasks` 标明只读防回退  
- `CAP-ENG-SESSION`：Node 可 headless 跑通至少一局关键路径（开局→若干动作→终局或可断言的步进）  
- 回写脊骨 G-D0/G-D1 状态

## 硬不做

- 不把 core 打进浏览器  
- 不重写胡吃碰杠规则  
- 不破坏现有 `npm start` / 自动对弈训练入口语义（可改为内部走 Session，对外行为等价）  
- 不重开 `CAP-UI-COMP` 整桌视觉冲顶  
- Agent 不得自批 `CAP-DUAL-GRAD`

## 本波切片

| 切片 | 状态 |
|------|------|
| `MJ-DUAL-LEDGER-01` | **已落地**（2026-11-17） |
| `MJ-ENG-SESSION-01` | **已落地** |

## 下波预告（不施工）

- W10：`CAP-ENG-SNAP` + `CAP-API-GAME` + `CAP-WEB-BRIDGE`（及可选 `CAP-WEB-LOBBY`）  
- W11：`CAP-ACC-DUAL` → 等人批 `CAP-DUAL-GRAD`
