# 波次蓝图：麻将双表面 · W11（双表面验收收束）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-dual-surface |
| 波次 | W11 |
| UI 层 | 验收（不施工视觉冲顶） |
| 施工状态 | `CAP-ACC-DUAL` **已关**；`CAP-DUAL-GRAD` 待人批 |
| 封顶任务 | `CAP-ACC-DUAL` → 人批 `CAP-DUAL-GRAD` |
| 前置 | W10 · `CAP-WEB-LOBBY` 已关 |

## 用户故事

作为协作者，我希望用可重复的 smoke 证明：CLI 训练与 Web/API 人测共用同一无头 Session 契约，且关键 default 子集已绿——而不是只靠一次手工演示。

## 终态效果（本波）

- `MJ-ACC-DUAL-01` smoke 真绿（禁止 skip 装绿）
- 约定 default 子集 `MJ-ACC-ENG-01` / `SNAP-01` / `CLI-01` catalog 已绿
- smoke 可重复跑通 `MJ-ACC-API-01` / `MJ-ACC-WEB-01` / `MJ-ACC-DUAL-01`
- 脊骨 G-D7 / 一本账 `CAP-ACC-DUAL` 回写已关
- **不**宣称双表面已毕业（等人批 `CAP-DUAL-GRAD`）

## 硬不做

- 不改 `src/*/core/` 权威规则  
- 不自批 `CAP-DUAL-GRAD` / 「双表面已毕业」  
- 不重开 `CAP-UI-COMP` 视觉冲顶  
- 不以手工一次通过关项

## 本波切片

| 切片 | 状态 |
|------|------|
| `MJ-ACC-DUAL-01` | **已落地**（2026-11-17） |

## 下波预告（不施工）

- 收官：人批 `CAP-DUAL-GRAD`
