# 编码任务切分清单（基于标注冻结稿）

## 依据
- `annotated-reference/ANNOTATED_REFERENCE.html`
- `annotated-reference/ANNOTATED_SPEC.md`
- `annotated-reference/STATE_MAPPING_APPENDIX.md`
- `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md`（13.0/13.3/14.0）

## 任务包 1：布局骨架（桌面+移动）
### 目标
实现 A/B/C/D/E/F/G 与 M1/M2/M3/M4 的固定空间关系。

### 开发项
1. 桌面三段布局：桌心A、底部D+G、侧栏E。
2. 移动四段布局：M1/M2/M3/M4。
3. 断点策略：Desktop-L / Desktop-M / Tablet / Mobile。

### 验收
1. 桌心占比 `58%~64%`。
2. 侧栏权重 `<=16%`，默认弱化。
3. 移动端 M3 与 M4 紧邻。

## 任务包 2：Table 状态渲染
### 目标
覆盖 WaitingAI / PlayerTurn / ResponseWindow / Submitting / ActionError / Ended。

### 开发项
1. WaitingAI：显示等待态，无强提交动作。
2. PlayerTurn：D/M3 可选牌，主动作=出牌。
3. ResponseWindow：F/M2 显示响应原因，主动作=过（默认）。
4. Submitting：锁定手牌与按钮。
5. ActionError：错误反馈 + 恢复到可操作。
6. Ended：主动作=查看结果。

### 验收
1. 每个状态仅 1 个强主动作。
2. F/M2 都能直读“目标牌+可响应原因”。
3. Submitting 期间无重复提交入口。

## 任务包 3：手牌与动作区交互
### 目标
完成选牌、主动作、次级动作与误触防护。

### 开发项
1. 选牌态：位移 + 描边双反馈。
2. 主动作区：固定位置，不乱跳。
3. 次级动作收纳：更多按钮/抽屉。
4. 点击热区：移动端 >= 44x44。

### 验收
1. ResponseWindow 默认主动作恒为“过”。
2. PlayerTurn 默认主动作恒为“出牌”。
3. 误触后可撤销或恢复。

## 任务包 4：ResultModal 四类型
### 目标
覆盖 tsumo / ron / draw / abort，统一解释结构。

### 开发项
1. 公共骨架：类型 -> 关系 -> 分差 -> 下一步。
2. tsumo：三家支付关系。
3. ron：点炮者关系。
4. draw/abort：原因与计分说明。

### 验收
1. 四类型都包含“谁赢/为什么/分数变化”。
2. 无缺层，无只给结论不解释情况。

## 任务包 5：Replay/Diagnostics
### 目标
保留诊断能力但不抢主视觉。

### 开发项
1. 桌面：E 默认弱化，展开显示 L1-L4。
2. 移动：诊断进入抽屉，不覆盖 M3/M4 主操作。

### 验收
1. 默认态下 E 对比度低于 A/F。
2. 展开后仍不影响主链路操作。

## 任务包 6：边界与契约
### 目标
保证 UI 层只消费核心层结果，不重写规则。

### 开发项
1. 胡牌/吃碰杠判定完全来自核心层。
2. UI 仅映射状态，不做替代推导。
3. 保持 CLI 路径不变。

### 验收
1. 无前端自定义规则分支。
2. CLI 行为与原路径一致。

## 任务包 7：测试与验收清单
### 目标
将阶段A冻结规则转换为阶段B可执行验收。

### 开发项
1. 场景测试：六状态+四结果。
2. 视觉检查：主动作唯一、桌心优先、移动可达。
3. 异常测试：Submitting失败恢复链路。

### 验收
1. 覆盖 `13.3` 对应风险点。
2. 满足 `14.0` 到 `14.6` 对应实现项。

## 建议开发顺序
1. 任务包1 -> 任务包2 -> 任务包3
2. 任务包4 -> 任务包5
3. 任务包6 -> 任务包7

## 交接说明
- 本清单可直接拆为开发工单。
- 工单验收必须回链到 `ANNOTATED_SPEC.md` 与 `STATE_MAPPING_APPENDIX.md`。
