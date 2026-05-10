# 麻将 Web UI 原型说明（阶段B实现验收文档）

## 范围与边界

- 仅改 `docs/majiang/web-ui-prototype/` 表现层、适配层、交互编排。
- 未改 `src/majiang/core/`、`src/majiang/strategy/`、CLI 路径。

> **当前状态**：冲顶进行中（B1/B2/B3 已解除）  
> **阻塞项**：无
> **顶级判定口径**：必须同时引用 `13.1 + 13.6 + 14.7 + 13.3/13.4 双否决项复核`，不得仅写单侧否决项。

## 冲顶阻塞项（Blocking）

- **B1：外部样本未齐**  
  未解除前禁止宣称最顶级通过。
- **B2：样本对照未回填**  
  未形成“样本卡 -> 差距 -> 验收证据”闭环前，不得进入顶级结论。
- **B3：否决项复核未完成**  
  `13.3 + 13.4` 任一未闭环即阻塞，不能用单侧否决项替代双侧复核。

### 阻塞项解除条件表

| 编号 | 解除条件 | 责任角色 | 证据路径 |
| --- | --- | --- | --- |
| B1 | 外部样本卡已齐备，且每个样本具备来源链接、样本类型、时间点/版本与证据形态 | 研究 | `研究 agent 参考样本卡` / 外部来源链接 |
| B2 | 参考样本卡已回填到设计差距，并逐条绑定可验收证据 | 设计 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md` / `差距项 -> 验收证据` 段落 |
| B3 | `13.3` 与 `13.4` 均完成复核且无未闭环否决项 | 编码 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md#13.3`、`#13.4` / `docs/majiang/WEB_UI_IMPLEMENTATION_BLUEPRINT.md#14.7` |

### 0.1 双否决项复核记录模板（B3）

| 复核项 | 目标章节 | 复核结论 | 证据路径 |
| --- | --- | --- | --- |
| 13.3 阶段A设计否决项 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md#13.3` | 待复核 / 通过 / 不通过 | 设计冻结稿、Figma/Pencil/线框图、差距回填矩阵 |
| 13.4 阶段B实现否决项 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md#13.4` | 待复核 / 通过 / 不通过 | 桌面/移动截图、关键交互录屏、DOM/状态校验 |
| 顶级判定口径 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md#13.2`、`#15.3` / `docs/majiang/WEB_UI_IMPLEMENTATION_BLUEPRINT.md#14.7` | 待复核 / 通过 / 不通过 | `13.1 + 13.6 + 14.7 + 13.3/13.4 双否决项复核` 同时满足 |

### 0.2 双否决项复核留档（2026-05-08）

| 复核项 | 复核结论 | 证据路径 |
| --- | --- | --- |
| 13.3 阶段A设计否决项 | 通过 | `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md#1.4.2`、设计冻结稿、差距回填矩阵 |
| 13.4 阶段B实现否决项 | 通过 | `.tmp/acceptance/final-evidence/desktop-1280x900.png`、`.tmp/acceptance/final-evidence/mobile-390x844.png`、`.tmp/acceptance/final-evidence/result-tsumo.png` |
| 顶级判定口径 | 通过 | `13.1 + 13.6 + 14.7 + 13.3/13.4 双否决项复核` |

## 阶段B证据产物（当前实现）

- 桌面首屏截图：
  - `.tmp/acceptance/final-evidence/desktop-1280x900.png`
- 移动端截图：
  - `.tmp/acceptance/final-evidence/mobile-375x812.png`
  - `.tmp/acceptance/final-evidence/mobile-390x844.png`
  - `.tmp/acceptance/final-evidence/mobile-414x896.png`
  - `.tmp/acceptance/final-evidence/mobile-768x1024.png`
- 四类结果页截图：
  - `.tmp/acceptance/final-evidence/result-tsumo.png`
  - `.tmp/acceptance/final-evidence/result-ron.png`
  - `.tmp/acceptance/final-evidence/result-draw.png`
  - `.tmp/acceptance/final-evidence/result-abort.png`
- 关键交互链路录屏：
  - `.tmp/acceptance/final-evidence/interaction-flow.webm`

> 说明：以上证据来自当前原型实现的自动化采集，不等同于核心规则层回归测试。

## 文档定位与阶段职责

- 本文档仅承担**阶段B：实现一致性验收**职责。
- 阶段A（设计冻结验收）不在本文执行，请直接查阅：
  - `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md` 的 `1.1/1.2/13.0/13.3/14.0`。
- 阶段切换闸门：
  - 必须先通过阶段A，才允许进入本文档执行阶段B验收。
  - 若阶段B发现设计缺口，必须回流阶段A补冻结，再继续实现验收。

## 本轮冲顶优化重点

- 桌心主舞台强化：中心区新增“动作主句 + 目标牌 + 响应对象”舞台条，提升第一眼关注聚焦。
- 牌面系统升级：手牌、牌河、目标牌、副露统一采用牌面资产化渲染，默认隐藏文字牌；文字牌仅作为调试/占位/降级态（`window.setMajiangTextTileFallback(true)`）。
- 四家辨识增强：座位新增风位标签与最近动作摘要，当前行动高亮语义保持一致。
- 响应链路直观化：响应阶段可直读“谁打了什么牌、目标牌是什么、我为何可响应”。
- ResultModal 产品化：区分自摸/荣和/流局/异常终止的结果语气、赢家与支付关系摘要。
- 动作主路径收敛：默认仅保留一个强主动作（出牌阶段为主动作，响应阶段为主响应动作），其余动作进入“更多动作”。
- 侧栏默认弱化：事件流/诊断默认折叠为轻量摘要，按需展开完整面板，首屏重心回到牌桌。
- 移动端继续收敛：保持手牌主视觉，次要说明进入抽屉，减少垂向挤压并避免多层 sticky 叠压。
- 终局精修：关键事件动效分级 + 结果角色 chips + 移动端底部操作黏性。

## 验收矩阵（步骤 + 预期 DOM/状态变化）

> 本章全部属于阶段B实现验收，要求实现证据（截图、录屏、DOM/状态校验）。

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

4. 桌心舞台与目标牌链路：
- 步骤：保持 `response_window`，观察 `#stageActor/#stageVerb/#responseTargetTile/#stageToYou` 和 `#responseLinkHint`。
- 预期：能直接读出“谁打牌→目标牌→你可响应”，且目标牌与牌河高亮牌一致强化。

5. 不可用说明折叠与移动端抽屉：
- 步骤：观察桌面点击 `#toggleDisabledReasonBtn`；移动端宽度下点击 `#openActionExplainDrawerBtn`。
- 预期：桌面默认隐藏不可用说明面板，按需展开；移动端通过抽屉查看“可用/不可用动作说明”，不挤压手牌区。

6. 结算弹窗语气分层：
- 步骤：分别执行 `window.showMajiangResultExample(\"tsumo\") / (\"ron\") / (\"draw\") / (\"abort\")`。
- 预期：`#resultHero` 与 `#resultTypeBadge/#resultHeadline/#resultSubline` 随结果类型切换不同语气和角色关系摘要。

7. 终局精修验证：
- 步骤：构造关键事件（碰/杠/胡）并切换普通事件；观察 `#latestActionMain`。
- 预期：关键事件触发更强提示动效，普通事件保持轻量提示。
- 步骤：移动端宽度下滚动牌桌，观察手牌区/动作区/反馈区。
- 预期：底部关键操作保持粘底可达，不需要频繁回滚。

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

3. 键盘主链路（新增）：
- 步骤：进入牌桌页后，不用鼠标，仅用键盘：
`ArrowLeft/ArrowRight` 选择手牌，`Enter` 执行当前阶段主动作，`1-9` 触发动作栏中当前可见动作，`Esc` 取消选牌/收起二级说明。
- 预期：可仅用键盘完成“选牌 -> 主动作 -> 反馈提示 -> Esc 取消/关闭浮层”的主链路。

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

3. 一键演示主链路（补充）：
- 步骤：
```js
window.runMajiangDemoFlow()
```
- 预期：自动执行 `Lobby -> 创建 -> 出牌 -> 结算(tsumo)`，可快速确认主链路可运行。

## 其他章节映射（3/7/9/13/14/15）

- 第3章：`#lobbyPage/#tablePage/#resultModal` + `createGame()/renderResult()`。
- 第7章：`#primaryFocusHint/#latestActionMain/#latestActionSub/#responseCountdown/#availableActionReasons`。
- 第7章（动作区降噪补充）：`#actionStageSummary/#toggleMoreActionsBtn + appState.showMoreActions`。
- 第7章（桌心链路补充）：`#stageActor/#responseTargetTile/#responseLinkHint`。
- 第7章（唯一主动作补充）：`getPhasePrimaryActionId()/getPrimaryActionForPhase()` + `.action-main-path`。
- 第7章（信息层级补充）：`#toggleDisabledReasonBtn/#disabledReasonPanel/#actionExplainDrawer`。
- 第8章（侧栏弱化补充）：`#sidePanel/#sidePanelPeek/#toggleSidePanelBtn` 默认弱化，按需展开。
- 第11章（结果语气补充）：`#resultHero/#resultTypeBadge/#resultSubline`。
- 第11章（结果角色结构补充）：`#resultRoleChips + .result-role-chip*`。
- 第9章：`view-model-adapter.js createTableViewModelFromSnapshot()`，`app.js getCurrentViewModel()`。
- 第9.2（状态契约）：统一输出 `submitting/globalError/recoverable/retryAction/diagnosticContext`，并按 `phase` 收敛动作集合。
- 第10/14.3（可访问性）：`aria-live` 状态反馈、`Esc` 关闭弹窗/抽屉、焦点回退、`prefers-reduced-motion` 低动效模式。
- 第13/14/15：四方桌面、中心公共区、phase 动作收敛、诊断弱化入口、边界保护均可在现有 DOM 与交互中复核。
- 第13.3（正式态牌面补充）：`applyTileVisual()/createTileAssetNode()` 默认资产牌面，`window.setMajiangTextTileFallback(true)` 仅作降级态。

> 阶段A冻结责任说明：本节仅映射实现落点，不承担设计冻结结论。设计冻结请回到 `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md` 的阶段A章节执行。

## 冲顶收官验收（冻结版）

### 1) 实机密度矩阵（必须）
- 视口：`375 / 390 / 414 / 768 / 1024`
- 每个视口执行：响应窗口 -> 出牌 -> 结算 -> 回大厅
- 记录：
  - 手牌区是否持续可见；
  - 是否出现高频误触；
  - 主链路额外滚动次数。

### 2) 关键事件节奏（必须）
- 普通事件：轻提示动效（`recentHitPulse`）。
- 关键事件（胡/杠/碰/荣和/自摸）：强提示动效（`recentHitStrong`）。
- 验收重点：关键事件与普通事件节奏必须有明确分层。

### 3) 结果叙事模板（必须）
- `tsumo / ron / draw / abort` 都要能在结果头部直接读出核心关系。
- 使用 `resultTypeBadge + resultSubline + resultRoleChips` 验证“谁赢、谁付、为什么”。

### 4) 座位状态语义（必须）
- `is-active / is-risk / is-opportunity` 同时可见且不冲突。
- 与风位标签、最近动作摘要协同，不退化为文字墙。

### 5) 最顶级麻将 UI 判定口径（必须）
- 仅当以下条件同时满足，才可宣称“最顶级麻将 UI”：
  - 已通过阶段A设计冻结验收；
  - 满足 `13.1 + 13.6`（基线）；
  - `13.3`（阶段A）与 `13.4`（阶段B）双否决项复核全部未命中；
  - `14.7` 顶级档专项清单全部通过；
  - 顶级判定必须同时引用 `13.1 + 13.6 + 14.7 + 13.3/13.4 双否决项复核`，不得仅写单侧否决项。
  - 本 README 的 `1~4` 收官验收全部通过。
- 无外部样本对照证据时，仅可写“冲顶进行中”或“冲顶暂定”。

### 6) 可访问性专项复核（14.3/10）
- 打开 `ResultModal / Replay / 动作说明抽屉` 后按 `Esc`，应关闭当前浮层并回到触发按钮焦点。
- `提交中/错误/等待/轮次变化` 会更新 `#interactionFeedback` 与 `#screenReaderAnnouncements`（读屏可感知）。
- 开启系统低动效偏好后，最近动作强动画不应继续闪烁（`prefers-reduced-motion` 生效）。
- 手牌读屏语义：读屏应可读出“牌名 + 是否选中”（`aria-label` + `aria-pressed`）。
