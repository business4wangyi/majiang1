# Coding Agent Pilot Task（试点实现）

## 目的
验证“竞品图直接标注法”是否能被编码 agent 稳定执行。

## 输入资料（必须使用）
1. `annotated-reference/ANNOTATED_REFERENCE.html`
2. `annotated-reference/ANNOTATED_SPEC.md`
3. `annotated-reference/STATE_MAPPING_APPENDIX.md`
4. `annotated-reference/IMPLEMENTATION_TASK_BREAKDOWN.md`

## 试点范围（只做一小部分）
- 页面：Table
- 状态：`ResponseWindow`（桌面端）
- 结构范围：A/B/C/D/E/F/G
- 不做：移动端、结果页、诊断展开态

## 实现要求（试点）
1. 桌心 A 为首视觉锚点（占比 58%-64%）。
2. F 显示：目标牌 + 可响应原因。
3. G 默认强主动作为 `过`，`碰` 为次级。
4. D+G 紧邻，避免跨区跳视。
5. E 存在但默认弱化。

## 验收标准（通过/不通过）
1. 用户第一眼可读到“谁打牌 -> 目标牌 -> 我可响应 -> 过”。
2. 页面上不存在两个同级强主动作。
3. 侧栏 E 不抢主视觉（对比度和面积均低于 A/F）。
4. 不修改核心规则逻辑，不改 CLI 路径。

## 期望交付
1. 一张桌面端 `ResponseWindow` 实现截图。
2. 一段实现说明，逐条对应上述 4 条验收标准。
3. 若不通过，指出具体失败点和回改项。
