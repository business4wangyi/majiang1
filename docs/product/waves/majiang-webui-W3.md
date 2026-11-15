# 波次蓝图：麻将 Web UI · W3（全量 UI 封顶任务账本）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W3 |
| UI 层 | 流程合同 + U2·视觉 **封顶定义**（无 DOM/CSS 施工） |
| 施工状态 | **封顶账本已落盘** |
| 脊骨 | `docs/product/spines/majiang-webui-target.md` |
| 任务队列 | `docs/product/caps/majiang-webui-cap-tasks.md` |
| 阶段验收 | `docs/product/caps/majiang-webui-acceptance-stages.md` |
| 设计定稿 | `docs/superpowers/specs/2026-11-15-majiang-webui-w3-cap-ledger-design.md` |

## 用户故事

作为协作者，我希望先钉齐全部 UI 封顶任务与 A/B/冲顶验收表，再按队列用人点名 + 日后 `/loop` 分批施工，避免边做边胀或用功能绿冒充视觉毕业。

## 终态效果

- 全量 `CAP-UI-*` 任务可查（含批序与现状）
- 阶段A / 阶段B / 冲顶收官验收表可查，并绑定封顶任务
- 脊骨 §6 指向：封顶账本已定；下一刀须人点名开实现波（默认 TILE）
- 本波零界面 diff；**不**启动 `/loop`

## 硬不做

- 不上牌面 sprite；不改 `web-ui-prototype` 牌面/动作层 DOM/CSS
- 不开移动端目标帧或实现帧（属 `CAP-UI-MOBILE`）
- 不改 `src/*/core/` 规则语义
- 不宣称「整桌视觉冲顶已毕业」或「无条件竞品级」
- 不启动 `/loop` / automate 施工拍（本波只写合同）
- 不引入 OpenSpec / Fast-lane
- Agent 不得自批 `CAP-UI-GRAD`

## 本波切片

| 切片 | 内容 | 状态 |
|------|------|------|
| `MJ-STD-CAP-01` | 全量封顶任务表 `cap-tasks` | **本波落地** |
| `MJ-STD-CAP-02` | 全阶段验收表 `acceptance-stages` | **本波落地** |
| `MJ-STD-CAP-03` | W3 蓝图 + 脊骨 §6 / W2 指针同步 | **本波落地** |

> 视觉切片 `MJ-UI-TILE-01` 等**不在本波施工**，只登记进队列。

## 下一波

已开 **W4**（`CAP-UI-TILE` / `MJ-UI-TILE-01`）：`docs/product/waves/majiang-webui-W4.md`。  
须人批 W4 后再上码；可按 `cap-tasks` 用 `/loop` 分批，**禁自批** `CAP-UI-GRAD`。
