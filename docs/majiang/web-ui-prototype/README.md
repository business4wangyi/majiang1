# 麻将 Web UI 原型说明（复核增强版）

## 范围与边界

- 仅改 `docs/majiang/web-ui-prototype/` 表现层、适配层、交互编排。
- 未改 `src/majiang/core/`、`src/majiang/strategy/`、CLI 路径。

## 本轮 P0 收敛重点

- 动作区按 phase 收敛显示，降低“按钮台”风险。
- 动作区新增“阶段摘要 + 更多动作”机制：默认只保留主路径，次要动作按需展开。
- 不可用动作说明默认折叠，避免与主操作抢视觉。
- 诊断入口默认折叠，避免首屏调试化。
- 中心区改为“主提示优先，细节按需展开”。
- 侧栏改为 Tab（事件流 / 分数变化），降低信息噪声。
- 移动端增加“动作说明抽屉”，减少底部拥挤并保持手牌优先。
- 最近动作增加短暂高亮衰减，提升瞬时局势可读性。

## 验收矩阵（步骤 + 预期 DOM/状态变化）

### 第6章 状态机
1. 创建链路：点击“开始对局”
- 预期：`creating_game -> table_loading -> table`。
- DOM：`#tableLoadingPanel` 在 `table_loading` 可见；`.topbar/.table-layout/.hand-panel/.action-bar` 隐藏。

2. 结束态禁止继续操作：
- 步骤：执行 `window.showMajiangResultExample("tsumo")`。
- 预期：`model.phase === ended` 后所有手牌按钮与动作按钮不可点击；`#interactionFeedback` 显示“本局已结束，请查看结算/复盘”。

3. 响应阶段主路径优先展示：
- 步骤：执行 `window.updateMajiangTableViewModel(window.majiangNextModelExample)`。
- 预期：`#actionStageSummary` 显示“响应阶段”提示；动作区默认只突出主响应动作 + `过`；点击 `#toggleMoreActionsBtn` 后展开次要动作。

4. 不可用说明折叠与移动端抽屉：
- 步骤：观察桌面点击 `#toggleDisabledReasonBtn`；移动端宽度下点击 `#openActionExplainDrawerBtn`。
- 预期：桌面默认隐藏不可用说明面板，按需展开；移动端通过抽屉查看“可用/不可用动作说明”，不挤压手牌区。

### 第8章 复盘
1. 关键节点与四家摘要：
- 步骤：执行 `window.updateMajiangTableViewModel(window.majiangNextModelExample)`，打开复盘后逐个点击 key 节点。
- 预期：`#replayStateDetail` 每个 key 节点都包含 `north/west/east/south` 四家摘要（可含 `system.error` 附加字段但不可替代四家）。

### 第10章 错误恢复
1. 可点击失败动作（稳定复核）：
- 步骤：
```js
window.updateMajiangTableViewModel(window.majiangWinningModelExample)
window.setMajiangActionHandler(window.majiangActionHandlerExample)
```
点击“过”。
- 预期：出现 toast（自动消失）+ `#inlineError` 保留；下一次成功动作后 `#inlineError` 清除。

2. 全局同步错误：
- 步骤：执行 `window.triggerMajiangGlobalSyncErrorExample()`。
- 预期：`#globalSyncError` 显示；点击“查看诊断”后 `#diagnosticsOutput` 含 `diagnosticContext`；点击“重试同步”后错误条消失。

### 第11章 场景闭环
1. LobbyError：
- 步骤：
```js
window.setMajiangGameCreationHandler(window.majiangGameCreationFailureExample)
```
回 Lobby 点击“开始对局”。
- 预期：进入 `lobby_error`，按钮为“重试创建”，显示错误提示和诊断输出。

2. 多结果结算：
- 步骤：
```js
window.showMajiangResultExample("tsumo")
window.showMajiangResultExample("ron")
window.showMajiangResultExample("draw")
window.showMajiangResultExample("abort")
```
- 预期：ResultModal 表格字段完整（玩家/本局变化/总分/角色/原因）；`abort` 显示异常上下文与诊断线索。

## 其他章节映射（3/7/9/13/14/15）

- 第3章：`#lobbyPage/#tablePage/#resultModal` + `createGame()/renderResult()`。
- 第7章：`#primaryFocusHint/#latestActionMain/#latestActionSub/#responseCountdown/#availableActionReasons`。
- 第7章（动作区降噪补充）：`#actionStageSummary/#toggleMoreActionsBtn + appState.showMoreActions`。
- 第7章（信息层级补充）：`#toggleDisabledReasonBtn/#disabledReasonPanel/#actionExplainDrawer`。
- 第9章：`view-model-adapter.js createTableViewModelFromSnapshot()`，`app.js getCurrentViewModel()`。
- 第13/14/15：四方桌面、中心公共区、phase 动作收敛、诊断弱化入口、边界保护均可在现有 DOM 与交互中复核。
