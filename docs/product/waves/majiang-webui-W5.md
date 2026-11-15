# 波次蓝图：麻将 Web UI · W5（CAP-UI-LAYOUT / 桌心与角区）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W5 |
| UI 层 | **U2·结构**（桌心主舞台 + 角区减噪） |
| 施工状态 | **已落地**（角区稀疏 + 侧栏默认收起 + 无教学层；证据 `design-freeze/stage-b-w5-layout/2026-11-15-layout-1440x900.png`；决策默认先过） |
| 封顶任务 | `CAP-UI-LAYOUT` · 切片 `MJ-UI-LAYOUT-01` · 脊骨 G3 |
| 任务队列 | `docs/product/caps/majiang-webui-cap-tasks.md` |
| 阶段验收 | `docs/product/caps/majiang-webui-acceptance-stages.md`（B-01 布局占比 / B-03） |
| 原型目录 | `docs/majiang/web-ui-prototype/`（勿动 `src/*/core/`） |

## 用户故事

作为玩家，我希望一进桌就先看到牌局主舞台（手牌/牌河/响应），角区只留头像+分数+至多一短状态，不再被侧栏/教学层抢走视线。

## 终态效果

1. 桌心主舞台视觉权重高于角区与侧栏。
2. 角区稀疏：头像 + 分数 + 至多一短状态；无教学大箭头/气泡/桌心说明条回流（B-03 保持）。
3. 不借本波重做牌面资产、不开移动目标帧、不宣称 GRAD。
4. `cap-tasks` / 脊骨 G3 可回写为已落地或可证据的「部分→收敛」。

## 硬不做

- 不上新牌面 sprite 大改（属已关 TILE；仅防回退）
- 不开 390×844 移动目标帧（属 `CAP-UI-MOBILE`）
- 不退回圆钮 HUD / 深色 Web 工具条
- 不改 `src/*/core/`；不自批 `CAP-UI-GRAD`
- 不引入日式术语 / OpenSpec / Fast-lane

## 本波切片

| 切片 | 内容 | 状态 |
|------|------|------|
| `MJ-UI-LAYOUT-01` | 桌心占比与角区减噪对照验收并回写 | **已落地** |

## 下一波

默认 **`CAP-UI-MOBILE`**（G4 / 须 390×844 目标帧策略）；或人点名 RESULT 缺口。`CAP-UI-GRAD` 仍仅人批。
