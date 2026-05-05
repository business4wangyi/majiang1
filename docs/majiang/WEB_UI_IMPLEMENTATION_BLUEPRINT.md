# 麻将 Web UI 实施蓝图（双层口径 + 冲顶优化版）

## 交付口径声明（13/15）

- 本蓝图用于“实现与复核对齐”，不等同于“审核已通过”声明。
- 在 `WEB_UI_PRODUCT_INTERACTION_DESIGN.md` 第 `13/14/15` 未逐条通过前，不得使用“已完全可交付/可直接交给编码 agent”口径。
- 明确区分两层标准：
  - **普通合格麻将 UI（基线合规）**：满足四方牌桌、底部手牌、基础响应链路、结算解释。
  - **最顶级麻将 UI（冲顶合规）**：在基线上额外满足“图案牌面、唯一主动作、低堆叠强桌心、成品级品牌完成度”。
- **基线通过 ≠ 顶级通过**。若命中 `13.3` 否决项（文字牌面默认主表达 / 多主按钮并列 / 堆叠感明显），不得宣称顶级成品。
- 不得把“功能完整 / 文档齐全 / 自动化通过”当作顶级通过依据。

## 冲顶实现优先级（P0）

1. 牌面图形化（图案牌面作为正式主表达）
2. 打牌主路径收敛为唯一主动作
3. 消除堆叠感并强化桌心主舞台
4. 再做动效、语气和品牌化 polish

## 最顶级麻将 UI 快检（执行闸门）

- [ ] 正式主牌面已切换为图案牌面（文字牌仅调试/占位/降级）。
- [ ] 默认主路径仅一个强主动作（非 `出牌/确认/取消` 长期并列）。
- [ ] 首屏不存在桌心与侧栏/底部同时高密度抢主视觉。
- [ ] 第一眼可直读“谁打牌 -> 目标牌 -> 我该执行哪个主动作”。
- [ ] 未把“功能完整 / 文档齐全 / 自动化通过”当作顶级通过依据。
- [ ] 命中任一否决项（文字牌面默认主表达 / 多主按钮并列 / 堆叠感明显）即禁止宣称最顶级麻将 UI。

## 本轮修复点（在已达基线前提下）

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
- 结果：默认优先呈现主路径动作（响应阶段：主响应 + 过）；若出牌阶段仍存在 `出牌/确认/取消` 并列，仅可视为过渡态，冲顶验收前必须收敛为“唯一强主动作 + 条件性次动作”。

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

13. 桌心主舞台强化（冲顶）
- `index.html .stage-keyline/#responseTargetTile/#responseLinkHint` + `styles.css .latest-action-wrap/.tile-face--target` + `app.js renderStatus()`
- 结果：第一眼聚焦“谁打牌 + 哪张牌 + 是否可响应”，响应链路理解速度提升。

14. 牌面系统升级（冲顶）
- `styles.css .tile/.tile-mini/.tile-face/.tile-mini--latest/.tile-mini--response-target`
- 结果：手牌、牌河、副露、目标牌视觉层次统一，显著降低“普通按钮块”观感。

15. 四家座位辨识增强（冲顶）
- `index.html .seat-wind/.seat-latest-action` + `app.js renderSeats()` + `view-model-adapter.js windLabel`
- 结果：风位识别、最近动作和当前高亮语义统一，座位可识别性增强。

16. ResultModal 产品化语气升级（P1）
- `index.html #resultHero/#resultTypeBadge/#resultHeadline/#resultSubline` + `styles.css .result-hero.*` + `app.js renderResult()`
- 结果：自摸/荣和/流局/异常终止语气区分清晰，赢家与支付关系可直读。

17. 终局精修：关键事件动效分级
- `styles.css .latest-action.recent-hit-strong/@keyframes recentHitStrong` + `app.js renderStatus()`
- 结果：关键事件（胡/杠/碰）与普通事件提示节奏分离，注意力分配更接近顶级产品。

18. 终局精修：结果角色 chips
- `index.html #resultRoleChips` + `styles.css .result-role-chip*` + `app.js renderResult()`
- 结果：赢家、点炮者、支付方、异常状态以结构化标签呈现，减少纯文本阅读成本。

19. 终局精修：移动端底部操作黏性
- `styles.css @media(max-width:820px)` 中 `hand-panel/action-bar/interaction-feedback` 粘底
- 结果：窄屏下单手操作链路更顺滑，手牌与主操作始终可达。

20. 14.3/10 可访问性落地
- `index.html`：`aria-live` 状态反馈区域（`#interactionFeedback/#inlineError/#globalSyncError/#toast/#screenReaderAnnouncements`）
- `app.js`：`Esc` 关闭弹窗与抽屉 + 焦点回退 + 轮次/提交/错误读屏播报
- `styles.css`：`@media (prefers-reduced-motion: reduce)` 关闭强动画
- 结果：不是仅视觉完整，而是键盘与读屏路径可用。

21. 9.2 状态契约收敛
- `view-model-adapter.js createTableViewModelFromSnapshot()`
- 输出统一字段：`submitting/globalError/recoverable/retryAction/diagnosticContext`
- `response_window/player_turn` 动作集合按阶段收敛（phase-scoped）
- 结果：状态字段与展示字段在 Adapter 层集中定义，避免散落在 UI 局部状态。

22. 10 / 14.3 键盘主链路补齐
- `app.js`：方向键选牌、`Enter` 主动作、数字键 `1-9` 触发可见动作、`Esc` 在无浮层时取消选牌/收起说明，在有浮层时关闭并回焦。
- `index.html`：手牌区与动作栏补键盘可读语义。
- 结果：键盘可独立完成桌面主流程，不依赖鼠标。

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

- 键盘主链路
  - 步骤：进入牌桌后按 `ArrowLeft/ArrowRight` 选牌，按 `Enter` 执行主动作，按数字键 `1-9` 执行动作栏可见动作，按 `Esc` 取消当前选牌
  - 预期：不使用鼠标可完成“选牌 -> 动作 -> 反馈 -> 取消/收起”链路

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

- 桌心主舞台链路
  - 步骤：保持 `response_window`，观察 `stage-keyline` 与 `responseLinkHint`
  - 预期：能直接读出“谁打牌 -> 目标牌 -> 我可响应”的链路

- 座位辨识增强
  - 步骤：观察四家位置信息和当前高亮切换
  - 预期：风位标签、最近动作摘要、当前行动高亮同时成立且不形成文字墙

- ResultModal 语气分层
  - 步骤：执行 `showMajiangResultExample(\"tsumo|ron|draw|abort\")`
  - 预期：结果头部语气和关系摘要随类型切换

- 诊断折叠默认
  - 步骤：刷新后观察侧栏，再点击“展开诊断内容”
  - 预期：默认折叠；点击后显示 `openSnapshot/copyLogs/diagnosticsOutput`

- 中心主提示层
  - 步骤：在 `response_window/waiting_ai/player_turn/ended` 间切换
  - 预期：`#primaryFocusHint` 随阶段变化，`#secondaryContext` 仅按需展开

## 冲顶收官清单（冻结版）

1. 实机密度验证（必须）
- 视口：`375 / 390 / 414 / 768 / 1024`。
- 每个视口都要走完整链路：响应窗口 -> 出牌 -> 结算 -> 回大厅。
- 记录指标：
  - 手牌可视面积是否连续可见；
  - 误触情况（是否频繁点到非主路径）；
  - 单次链路中的额外滚动次数。
- 通过标准：主链路可在可见区完成，误触不构成主要抱怨点，滚动次数可控。

2. 关键事件节奏参数（必须）
- 普通事件：`recentHitPulse`（轻提示）。
- 关键事件（胡/杠/碰/荣和/自摸）：`recentHitStrong`（强提示）。
- 参数冻结：
  - 普通事件时长约 `1.4s`；
  - 关键事件时长约 `1.0s`；
  - 不可全局统一使用强动效。

3. 结果叙事模板（必须）
- `tsumo`：标题 + 赢家 + 支付方 chips。
- `ron`：标题 + 赢家 + 点炮者 chips。
- `draw`：标题 + 听牌/罚则摘要 chips。
- `abort`：标题 + 异常终止 chips + 诊断引导。
- 通过标准：不依赖长段文字即可理解主要角色关系。

4. 座位状态语义（必须）
- `is-active`：当前行动位。
- `is-risk`：当前响应目标牌来源位（response 窗口）。
- `is-opportunity`：自己可响应位（response 窗口）。
- 通过标准：状态语义不冲突，可同时与风位标签共存，不形成文字墙。

5. “最顶级麻将 UI”冻结口径（必须）
- 必须同时满足：
  - `13.1 + 13.5`（基线）已通过；
  - `13.3` 冲顶否决项全部未命中；
  - `14.6` 顶级档专项清单全部通过；
  - 本章节 `1~4` 收官清单验证通过。
- 未满足任一项，不得宣称“最顶级麻将 UI”。

- 一键演示入口
  - `window.runMajiangDemoFlow()`：自动跑通 Lobby->创建->出牌->结算(tsumo) 主链路，便于快速复核。
