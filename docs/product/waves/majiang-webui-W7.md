# 波次蓝图：麻将 Web UI · W7（合同满分 · 抬封顶一段）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W7 |
| UI 层 | **U1**（结果四态闭环）+ 账本回写；**不开** U2·视觉竞品重抬 |
| 施工状态 | **一段收官完成**（RESULT+LEDGER+GRAD 人重批 · 2026-11-16） |
| 封顶任务 | `CAP-UI-RESULT` + `CAP-UI-LEDGER` 已关；`CAP-UI-GRAD` **人重批通过** |
| 阶段验收 | A-05 / B-05 须可核证据；A-04 与 W6 对齐回写；C-* 仅人重批后关 |
| 原型 | `docs/majiang/web-ui-prototype/` |
| 结果合同 | `docs/majiang/design-freeze/stage-a-2026-05-10/03_RESULT_MODAL_TYPES.md` |

## 用户故事

作为协作者，我希望毕业线抬到「现有冻结合同全部可观察关闭」：结果四态语气与支付关系有入库证据，验收表与脊骨无「基本有」尾巴，再允许人重批视觉冲顶；竞品级再抬留给下一段。

## 终态效果

- `tsumo` / `ron` / `draw` / `abort` 四态实现帧入库（建议 `design-freeze/stage-b-w7-result/`）
- 每态可读：结果类型语气、角色关系、分数变化、下一步入口（对齐 `03_RESULT_MODAL_TYPES.md`）
- 脊骨 / `cap-tasks` / `acceptance-stages` 中 RESULT、A-04、B-05 不得残留「基本有 / 未审」与已关事实矛盾
- `CAP-UI-GRAD` 已由人重批通过（2026-11-16）；二段已另开 **W8**（见 `majiang-webui-W8.md`）

## 硬不做

- 不借本波重开 TILE / LAYOUT / 动作层大改视觉
- 不重绘竞品级整桌目标图（方案 C **第二段**；须另开波次蓝图）
- 不改 `src/*/core/` 权威规则
- Agent / `/loop` **不得自批** `CAP-UI-GRAD`
- 功能 acceptance 绿 **不得**单独关闭 B-05 / C-*

## 本波切片

| 切片 | 状态 |
|------|------|
| `MJ-UI-RESULT-01` | **已落地**（语气补齐 + `stage-b-w7-result/` 四态入库） |
| `MJ-STD-LEDGER-01` | **已落地**（活文档对齐 W6/W7；清「移动未审/基本有」毕业挡板） |
| `CAP-UI-GRAD` | **已毕业**（人重批 2026-11-16） |

## 抬封顶（相对 W6 后旧毕业）

| 旧口径 | 新口径（本波生效） |
|--------|-------------------|
| 人批 GRAD + 允许 RESULT「基本有」 | **禁止**用「基本有」关闭毕业相关行 |
| 默认停施工拍 | 打开 W7：RESULT 满分 + 账本一致后，才进人重批 GRAD |
| 竞品再抬未立项 | 明确为 **二段**；本波硬不做 |
