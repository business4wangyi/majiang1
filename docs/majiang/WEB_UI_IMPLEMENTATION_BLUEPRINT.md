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

6. 主路径优先 + 次要动作折叠（进一步降噪）
- `index.html #actionStageSummary/#toggleMoreActionsBtn` + `app.js appState.showMoreActions/renderActionBar()`
- 结果：默认优先呈现主路径动作（响应阶段：主响应 + 过；出牌阶段：出牌/确认/取消），次要动作通过“更多动作”展开。

7. 不可用说明默认折叠（进一步信息减法）
- `index.html #toggleDisabledReasonBtn/#disabledReasonPanel` + `app.js appState.disabledReasonExpanded/rerender()`
- 结果：默认不占据主视图空间，仅在用户主动查看原因时展开。

8. 诊断入口默认折叠（弱化调试感）
- `index.html #toggleDiagnosticsBtn/#diagnosticsContent` + `app.js rerender()/bindEvents()`
- 结果：默认只显示“展开诊断内容”按钮，避免诊断内容首屏抢占。

9. 中心主提示层优先（降低信息过载）
- `index.html #primaryFocusHint/#secondaryContext` + `app.js renderStatus()`
- 结果：先展示一条关键提示，局势细节按需展开。

10. 侧栏分栏降噪（事件流/分数变化 Tab）
- `index.html tab 结构` + `app.js renderSidePanelTabs()`
- 结果：同屏噪声下降，保留可追踪链路。

11. 移动端动作说明抽屉（保留手牌主视觉）
- `index.html #actionExplainDrawer` + `styles.css @media(max-width:820px)` + `app.js appState.actionExplainDrawerOpen`
- 结果：移动端说明信息进入抽屉，不再和手牌区竞争垂向空间。

12. 最近动作高亮衰减（增强瞬时可读性）
- `styles.css .latest-action.recent-hit/@keyframes recentHitPulse` + `app.js appState.lastLatestActionKey/renderStatus()`
- 结果：最近动作变化时短暂强化提示，帮助用户快速锁定“谁刚打了什么牌”。

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

- 主路径优先 + 更多动作
  - 步骤：在 `response_window` 下观察动作区，再点击“更多动作”
  - 预期：默认只突出主路径和“过”；展开后才显示次要动作，收起后恢复低噪声布局

- 不可用说明折叠
  - 步骤：观察默认态并点击“为什么不能做？”
  - 预期：默认不展示不可用说明；点击后展开并可收起

- 移动端说明抽屉
  - 步骤：切换到窄屏，点击“动作说明”
  - 预期：抽屉展示可用/不可用说明，主页面手牌与主操作区保持可见

- 最近动作高亮衰减
  - 步骤：注入新的 `latestEvent`
  - 预期：`#latestActionMain` 出现短暂高亮脉冲，随后恢复常态

- 诊断折叠默认
  - 步骤：刷新后观察侧栏，再点击“展开诊断内容”
  - 预期：默认折叠；点击后显示 `openSnapshot/copyLogs/diagnosticsOutput`

- 中心主提示层
  - 步骤：在 `response_window/waiting_ai/player_turn/ended` 间切换
  - 预期：`#primaryFocusHint` 随阶段变化，`#secondaryContext` 仅按需展开
