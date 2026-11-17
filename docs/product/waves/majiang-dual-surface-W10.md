# 波次蓝图：麻将双表面 · W10（大厅 U0）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-dual-surface |
| 波次 | W10 |
| UI 层 | Web·U0（大厅骨架；禁视觉冲顶） |
| 施工状态 | `CAP-WEB-LOBBY` **已关** |
| 封顶任务 | `CAP-WEB-LOBBY` |
| 原型 | `docs/majiang/web-ui-prototype/` 大厅入口；权威仍在 `src/majiang/core/` |
| 前置 | W9 · `CAP-WEB-BRIDGE` 已关 |

## 用户故事

作为人测玩家，我希望打开 Web 原型先看到清晰的**产品大厅**：一个「开始对局」主按钮和固定配置摘要，而不是三栏调试仪表盘；诊断 JSON 默认折叠。

## 终态效果（本波）

- 大厅主视觉：一主 CTA「开始对局」+ 固定配置摘要  
- 最近对局 / 诊断为次级折叠区；JSON 默认不倾倒  
- `MJ-ACC-WEB-01` 依赖链注明大厅入口；挂测 `tests/majiang/web-lobby.test.ts`  
- 脊骨 G-D6 / GR-D6 回写已关

## 硬不做

- 不重开整桌竞品视觉冲顶 / `CAP-UI-COMP`  
- 不改 `src/*/core/` 权威规则  
- 不自批 `CAP-DUAL-GRAD` / 双表面已毕业  
- 不把本刀冒充视觉冲顶通过

## 本波切片

| 切片 | 状态 |
|------|------|
| `MJ-WEB-LOBBY-01` | **已落地**（2026-11-17） |

## 下波预告（不施工）

- W11：`CAP-ACC-DUAL` **已关** → 见 `majiang-dual-surface-W11.md`；收官等人批 `CAP-DUAL-GRAD`
