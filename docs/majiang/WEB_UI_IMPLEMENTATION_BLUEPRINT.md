# 麻将 Web UI 实施蓝图（P0 收敛版）

## 本轮修复点

1. Ended / TableLoading 禁止操作
- `app.js renderActionBar()/renderHand()/submitAction()/renderFeedback()`
- 结果：`phase === ended` 或 `appState.phase === table_loading` 时，动作与手牌均不可操作。

2. Replay 四家摘要补齐
- `app.js majiangNextModelExample.replay.timeline`
- 结果：所有 key 节点均含 `north/west/east/south` 摘要。

3. 错误恢复步骤与可点击动作对齐
- 以 `majiangWinningModelExample + majiangActionHandlerExample` 后点击“过”作为稳定失败复核。

4. 全局同步错误直接触发入口
- 新增 `window.triggerMajiangGlobalSyncErrorExample()` 与 `window.majiangSyncFailureActionHandlerExample`。
- 结果：可稳定显示 `#globalSyncError` 并验证重试/诊断。

5. 按 phase 收敛动作区（消除按钮台风险）
- `index.html data-phase-scope` + `app.js renderActionBar()`
- 结果：`response_window` 仅显示响应动作；`player_turn` 仅显示出牌动作；其他动作按阶段隐藏。

6. 诊断入口默认折叠（弱化调试感）
- `index.html #toggleDiagnosticsBtn/#diagnosticsContent` + `app.js rerender()/bindEvents()`
- 结果：默认只显示“展开诊断内容”按钮，避免诊断内容首屏抢占。

7. 中心主提示层优先（降低信息过载）
- `index.html #primaryFocusHint/#secondaryContext` + `app.js renderStatus()`
- 结果：先展示一条关键提示，局势细节按需展开。

8. 侧栏分栏降噪（事件流/分数变化 Tab）
- `index.html tab 结构` + `app.js renderSidePanelTabs()`
- 结果：同屏噪声下降，保留可追踪链路。

## 复核矩阵（步骤 + 预期）

- `creating_game -> table_loading -> table`
  - 步骤：Lobby 点击开始
  - 预期：`#tableLoadingPanel` 独占显示，加载完成后恢复真实桌面

- `lobby_error`
  - 步骤：设置 `window.setMajiangGameCreationHandler(window.majiangGameCreationFailureExample)` 后开始对局
  - 预期：错误提示 + 重试按钮 + 诊断输出

- `hu` 成功结算（ron/tsumo）
  - 步骤：注入 `majiangWinningModelExample`，点击“胡”
  - 预期：ResultModal 打开并进入结束态禁用

- `pass` 失败恢复
  - 步骤：注册 `majiangActionHandlerExample` 后点击“过”
  - 预期：toast 自动消失，`#inlineError` 保留

- `tsumo/ron/draw/abort` 全覆盖
  - 步骤：执行 `showMajiangResultExample(...)`
  - 预期：表格字段完整，`abort` 含错误上下文

- Replay 四家摘要
  - 步骤：打开复盘点击每个 key 节点
  - 预期：`#replayStateDetail` 展示四家摘要

- Global Sync Error
  - 步骤：执行 `triggerMajiangGlobalSyncErrorExample()`
  - 预期：错误条显示；诊断可见 `diagnosticContext`；重试可清除错误条

- Phase 动作收敛
  - 步骤：分别切到 `response_window` 与 `player_turn`
  - 预期：动作按钮仅显示当前阶段相关集合，不出现同屏拥挤的按钮台

- 诊断折叠默认
  - 步骤：刷新后观察侧栏，再点击“展开诊断内容”
  - 预期：默认折叠；点击后显示 `openSnapshot/copyLogs/diagnosticsOutput`

- 中心主提示层
  - 步骤：在 `response_window/waiting_ai/player_turn/ended` 间切换
  - 预期：`#primaryFocusHint` 随阶段变化，`#secondaryContext` 仅按需展开
