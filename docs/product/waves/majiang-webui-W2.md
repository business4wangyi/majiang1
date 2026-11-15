# 波次蓝图：麻将 Web UI · W2（G1 动作层账本收口）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W2 |
| UI 层 | U2·视觉 · **账本收口**（无 DOM/CSS 施工） |
| 施工状态 | **账本已落盘** |
| 脊骨 | `docs/product/spines/majiang-webui-target.md` |
| 证据 | `docs/majiang/design-freeze/stage-a-2026-05-10/16_HIFI_IMPL_COMPETITOR_REVIEW_20260917.md`（动作层 R2 实现验收已关） |

## 用户故事

作为协作者，我希望脊骨上的 G1 与实现验收一致：动作层胶囊/印章条已关闭，不再被误开成大改视觉刀。

## 终态效果

- 脊骨差距表 G1 = **已落地**；切片 `MJ-UI-ACT-01` 账本关闭
- 本文件硬不做可查：禁止退回圆钮 HUD / 深色 Web 工具条；禁止宣称整桌视觉毕业
- 下一刀默认排队 G2 或 G4，**须人点名开波**后再施工

## 硬不做

- 不改 `docs/majiang/web-ui-prototype/` 动作层样式 / DOM / 键盘绑定
- 不退回圆钮 HUD 或深色 Web 工具条
- 不上牌面 sprite（属 G2）；不开移动端目标帧（属 G4）
- 不改 `src/*/core/` 规则语义
- 不宣称「整桌视觉冲顶已毕业」或「无条件竞品级」
- 不引入 OpenSpec / Fast-lane

## 本波切片

| 切片 | 内容 | 状态 |
|------|------|------|
| `MJ-UI-ACT-01` | 动作层向竞品胶囊/印章条收敛 — 账本对齐 16_IMPL 通过结论 | **账本关闭** |

## 下一波

默认候选：**G2** `MJ-UI-TILE-01`（牌面）或 **G4** `MJ-UI-MOBILE-01`（移动端）；须新人审蓝图后再施工。
