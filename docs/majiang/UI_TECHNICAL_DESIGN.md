# 麻将 UI 技术设计文档

> 最后更新: 2026-04-26
> 文档状态: 麻将首版 Web UI MVP 正式发布通过
> 适用范围: `codex/majiang-ui` 分支中的麻将 Web UI MVP 正式发布说明；正式发布门禁包含全仓 `npm run build` 与麻将专项验证

## 1. 文档目标

本文档用于约束麻将图形界面首版的最小可落地方案，重点回答以下问题：

- 当前麻将实现到底已经具备哪些能力
- 当前代码结构对 UI 落地的真实阻塞项是什么
- 首版 UI 的宿主形态、最小页面范围和交互边界是什么
- 在不重写规则引擎的前提下，首版 UI 需要先做哪些解耦工作
- 如何保证 UI 新增后，现有 CLI 模式不回归

本文档依据以下规范与代码事实整理：

- `AGENTS.md`
- `docs/standards/rules/development.md`
- `docs/majiang/FOLDER_STRUCTURE.md`
- `src/majiang/index.ts`
- `src/majiang/core/game.ts`
- `src/majiang/core/player.ts`
- `src/majiang/core/rule-types.ts`
- `src/majiang/ui/gameLoop.ts`
- `src/majiang/ui/game-event-handler.ts`
- `src/majiang/ui/display-manager.ts`
- `src/majiang/ui/input.ts`

## 2. 当前实现现状

本节只描述已经由代码证实的事实，不把目录规范目标或后续设计目标写成当前现状。

### 2.1 代码已具备的能力

当前麻将模块已经具备一套可运行的本地麻将 CLI 对局流程，主要能力如下：

- 支持 4 人对局
- 支持手动模式和自动模式
- 手动模式为 1 人类玩家 + 3 AI
- 自动模式为 4 AI 批量对局
- 支持发牌、摸牌、出牌、轮转
- 支持吃、碰、杠、胡等动作类型
- 支持牌山、庄家、局状态、胡牌判定、部分结算输出
- 支持较多胡牌/番型枚举与检测链路

对应代码事实：

- 程序入口与模式切换见 `src/majiang/index.ts`
- 游戏状态字段见 `src/majiang/core/game.ts`
- 玩家手牌、弃牌、明牌、状态、分数字段见 `src/majiang/core/player.ts`
- 动作与胡牌类型枚举见 `src/majiang/core/rule-types.ts`
- 自动/手动主循环见 `src/majiang/ui/gameLoop.ts`
- 发牌、摸牌、流程推进、结算处理见 `src/majiang/ui/game-event-handler.ts`

### 2.2 当前代码结构限制

虽然 `docs/majiang/FOLDER_STRUCTURE.md` 把 `core/` 描述为“纯游戏规则、不涉及 UI”，但这份文档提供的是目录规范目标，不等于当前代码已经达到该结构纯度。当前代码事实如下：

- `src/majiang/core/game.ts` 直接依赖：
  - `src/majiang/ui/display-manager.ts`
  - `src/majiang/ui/human-player.ts`
  - `src/majiang/strategy/agents/ai-player.ts`
- `src/majiang/core/player.ts` 内存在 `process.exit` 退出语义
- `src/majiang/index.ts`、`src/majiang/ui/gameLoop.ts`、`src/majiang/ui/game-event-handler.ts`、`src/majiang/ui/input.ts` 共同构成 CLI 驱动流程
- `src/majiang/ui/display-manager.ts` 大量直接调用 `console.log`
- `src/majiang/ui/input.ts` 直接使用 `readline`、倒计时和输入等待状态
- `src/majiang/ui/gameLoop.ts` 与 `src/majiang/index.ts` 中存在 `process.exit(...)`

结论：

- 当前不能把 `core/` 视为已经可直接安全接入图形界面的“纯净核心层”
- 当前也不能把自动模式视为已经存在的“图形界面可复用演示会话能力”
- 首版 UI 必须先识别并隔离核心流程中的 CLI 输入输出副作用和退出语义

### 2.3 首版 UI 落地的真实阻塞项

基于当前代码，首版 UI 落地前至少需要明确以下阻塞项：

1. CLI 输入输出副作用边界
   - 当前主流程直接依赖 `displayManager`、`readline`、倒计时打印和 `console`
   - UI 不能直接复用这套输入输出实现

2. 流程推进机制未解耦
   - 手动模式依赖 `runInteractiveGameLoop()` 的轮询 + 阻塞输入状态
   - 自动模式依赖 `runAutoGameLoop()` 的批量循环
   - UI 首版必须明确采用什么驱动方式推进回合

3. 核心层存在反向依赖
   - `Game` 当前会直接创建 `HumanPlayer` / `AIPlayer` 并打印信息
   - 这意味着“复用 core”之前，需要先识别哪些部分只能暂时包装、哪些必须先解耦

4. 退出语义不适合 UI 宿主
   - 当前若出现异常或非法状态，部分路径会直接 `process.exit`
   - 图形界面宿主不能接受核心流程直接终止整个进程

5. 结算信息没有独立 ViewModel
   - 胡牌、自摸、输家、得分等结果分散在 `game-event-handler` 与规则/计分链路中
   - UI 首版必须先定义“只复用哪些结果字段”，而不是默认已有完整结算模型

## 3. 规范目标与当前代码事实的关系

`docs/majiang/FOLDER_STRUCTURE.md` 中的分层原则仍然有效，尤其是：

- 游戏逻辑应与 UI 分离
- UI 层应尽量保持薄
- 尽量复用既有规则引擎

但在当前分支中，应明确区分：

- 目录规范目标：未来理想结构
- 当前代码事实：仍存在 `core -> ui` 反向依赖和 CLI 副作用耦合

因此，首版 UI 的主原则应写成：

- 保持“复用 core/strategy、避免重写规则引擎”的方向不变
- 但必须先识别和隔离 `core` 对 `ui` 的反向依赖与流程副作用
- 在解耦完成前，不把当前 `core/` 当成已经纯净可直连图形界面的完成态

## 4. 首版 UI 建设目标

### 4.1 目标

首版目标不是建设完整麻将产品，而是在当前代码基础上做一个可落地、可验证、可持续迭代的图形界面 MVP。

首版目标限定为：

- 提供一个图形化牌桌页面
- 跑通 1 人 + 3 AI 的本地单机流程
- 不重写规则引擎
- 不破坏现有 CLI 手动/自动模式
- 为后续增强预留明确但克制的扩展点

### 4.2 非目标

首版明确不包含：

- 联网对战
- 房间系统
- 账号系统
- 服务端同步
- 多窗口桌面壳功能
- 回放系统
- AI 解说系统
- 调试面板正式化
- 规则说明抽屉等非阻塞页面

## 5. 首版 UI 宿主形态

首版 UI 需要先明确宿主形态，否则无法落目录、落入口、落构建方式。

本设计文档当前建议：

- 首版 UI 以仓内 Web 页面为宿主形态
- 范围限定为本仓库内新增前端模块或页面入口
- 不把 Electron、桌面壳或独立客户端列为首版目标

这样收敛的原因：

- 当前代码本身没有桌面壳基础设施
- Web 页面更容易承接牌桌布局、交互态和后续开发验证
- 可以先把“状态映射 + 回合驱动”问题解决，再讨论更外层宿主

本节结论是设计收敛，不代表仓库里当前已经存在该 Web 宿主。

## 6. 首版 MVP 页面范围

首版只保留最小必要页面和弹层，不把非阻塞能力与主流程并列。

### 6.1 MVP 必做页面

1. `Lobby`
2. `Table`
3. `ResultModal`

### 6.2 页面职责

#### Lobby

最小职责：

- 开始新对局
- 选择模式

首版模式建议只保留：

- 手动模式：1 人 + 3 AI
- 自动演示模式：仅在回合驱动方案明确后再纳入实现范围

说明：

- 当前代码确实有 4 AI 自动模式，但它基于 `src/majiang/ui/gameLoop.ts` 中的批量循环驱动
- 在 UI 首版里，只有当“自动演示如何推进 tick / session”被明确后，才能把它纳入 MVP
- 因此当前文档将其列为“有条件纳入项”，不是默认已具备的 UI 能力

#### Table

最小职责：

- 展示四家桌面布局
- 展示本人手牌
- 展示他家牌背数量或牌背区域
- 展示弃牌区与明牌区
- 展示当前轮转信息
- 接收玩家出牌与可响应动作

#### ResultModal

最小职责：

- 展示本局结束结果
- 展示首版可直接复用的结算信息
- 提供再来一局入口

### 6.3 非 MVP 项

以下能力不与首版主流程并列，统一降级为后续增强：

- `RuleDrawer`
- `DebugPanel`
- 最近一次对局摘要
- 最近动作时间线
- 倒计时视觉组件
- 胡牌特效和发牌动画

## 7. 首版界面草图

### 7.1 桌面端草图

```text
┌──────────────────────────────────────────────────────────────┐
│ 麻将对局                                                   设置 │
│ 当前玩家: 东家   牌山: 83   状态: 出牌中                      │
├──────────────────────────────────────────────────────────────┤
│                          北家(AI)                             │
│                     [牌背][牌背][牌背]...                     │
│                     明牌: 碰 8筒 8筒 8筒                       │
│                                                              │
│ 西家(AI)                               中央牌桌               │
│ [牌背]...[牌背]                         弃牌区                 │
│ 明牌: 无                                 东: ...              │
│                                         南: ...              │
│                                         西: ...              │
│                                         北: ...              │
│                                                              │
│                         南家(AI)                              │
│                    [牌背][牌背][牌背]...                      │
│                    明牌: 吃 3万 4万 5万                        │
├──────────────────────────────────────────────────────────────┤
│ 你（东家）                                                   │
│ 明牌: 杠 2条 2条 2条 2条                                      │
│ 手牌: [1万][2万][3万][4筒][4筒][7条][东][东][白]...[摸牌]      │
│ 操作: [出牌] [吃] [碰] [杠] [胡] [过]                         │
│ 提示: 请选择要打出的牌                                        │
└──────────────────────────────────────────────────────────────┘
```

说明：

- 草图只用于说明信息布局
- 不表示所有字段当前代码都已有稳定 UI 数据源
- 其中“提示文案”“最近动作”等应优先复用已有流程信息，不额外发明复杂状态树

## 8. 真实状态来源与首版映射范围

首版不应凭空设计完整状态模型，而应基于当前稳定字段做最小映射。

### 8.1 当前代码中已有的稳定状态来源

来自 `src/majiang/core/game.ts`：

- `state`
- `currentPlayerIndex`
- `lastDiscardedTile`
- `pendingAction`
- `bankerIndex`
- `windRound`
- `drawCount`
- `lastDrawCount`
- `getRemainingTiles()`
- `getAllPlayers()`

来自 `src/majiang/core/player.ts`：

- `handTiles`
- `discardedTiles`
- `revealedSets`
- `flowerTiles`
- `state`
- `lastDrawnTile`
- `score`
- `winCount`
- `drawCount`

来自 `src/majiang/core/rule-types.ts`：

- `PlayerAction`
- `TileSet`
- `GangType`
- `HuType`

### 8.2 首版需要派生但当前没有独立稳定对象的内容

以下内容需要由 UI 适配层派生或聚合，当前代码中没有单独封装好的稳定 ViewModel：

- 当前页面提示文案
- 本人可执行动作按钮集合
- 中央桌面最近一次动作描述
- 结算弹层直接展示的最终摘要
- 自动演示模式下的回放/节奏控制状态

### 8.3 首版不预设的状态抽象

当前不在文档中预设大而全的 `TableViewModel` 结构，以避免后续编码智能体根据文档自行脑补不存在的数据源。

首版只要求：

- 先列清楚“哪些字段直接取自 `Game` / `Player`”
- 再列清楚“哪些文案和按钮是派生结果”
- UI 适配层以最小必要字段输出为目标，不追求一次建成完整领域视图模型

## 9. 首版技术架构建议

### 9.1 总原则

技术路线保持以下约束：

- 不重写 `src/majiang/core/` 中的规则引擎
- 不把目录规范目标误写成当前已完成结构
- 先处理 CLI 副作用边界，再谈图形界面接入
- UI 与 CLI 在首版阶段允许共存

### 9.2 当前不是“直接接 UI”的状态

基于 `src/majiang/core/game.ts`、`src/majiang/ui/gameLoop.ts`、`src/majiang/ui/game-event-handler.ts`、`src/majiang/ui/input.ts` 的代码现实，当前不是“新增一个页面即可接入”的状态。

首版至少要先完成这些边界梳理：

- 哪些流程仍依赖 `DisplayManager`
- 哪些路径仍依赖 `readline`
- 哪些错误路径会直接 `process.exit`
- 哪些回合推进逻辑只能在 CLI 轮询中运行

### 9.3 application 层的最小职责

如果保留 `application/` 层，首版只保留最小必要职责，不一次性发明整套控制器体系。

首版 `application/` 建议只承担：

1. 会话启动
   - 创建或复用 `Game`
   - 设置玩家模式
   - 启动新局

2. 最小状态映射
   - 从 `Game` / `Player` 读取页面需要展示的数据
   - 把可展示字段与派生字段分开

3. 回合推进接口
   - 提供 UI 可调用的最小动作入口
   - 明确是“命令式 step 驱动”还是“动作后内部推进”

4. CLI 共存边界
   - 不要求 CLI 首轮也切到同一套适配层
   - 但新增 UI 逻辑不能反向破坏 CLI 入口

### 9.4 首版建议的最小模块

若新增目录，建议只从以下两个模块开始：

- `src/majiang/application/game-session.ts`
  - 职责：封装新局启动、当前局引用、最小动作入口

- `src/majiang/application/game-state-mapper.ts`
  - 职责：把 `Game` / `Player` 现有字段映射为页面可读状态

以下模块当前不作为首版硬性设计要求：

- `table-controller.ts`
- `action-dispatcher.ts`
- `ui-state-mapper.ts`

除非在实现阶段证明它们是必需的，否则不应先写进首版方案。

## 10. 回合推进机制收敛

当前 CLI 有两种推进方式：

- `runInteractiveGameLoop()`：基于轮询、输入等待状态和当前玩家状态推进
- `runAutoGameLoop()`：基于批量循环推进多局 AI 对战

因此，首版 UI 必须先收敛一种明确的推进机制。

本设计文档建议首版优先采用：

- 单局 session controller 驱动
- 由 UI 动作触发一次推进
- AI 回合由 session 内部继续推进直到再次需要人类输入或对局结束

这样收敛的原因：

- 更接近当前手动模式的真实需要
- 不要求 UI 首版先解决多局批量自动统计
- 可以先把“人类行动点”和“AI 连续推进”边界跑通

这是一条设计建议，不代表当前代码已经具备该 controller。

## 11. 结算数据来源约束

首版 `ResultModal` 不应预设复杂领域模型，而应从当前已有链路中收敛最小展示范围。

当前相关信息分散在：

- `src/majiang/ui/game-event-handler.ts`
- 规则计算链路
- 计分相关链路

因此首版结算建议只要求：

- 赢家
- 是否自摸（若当前链路可稳定提供）
- 首版可稳定取得的胡牌类型名称
- 首版可稳定取得的得分文本

如果某些字段当前无法稳定从代码中统一取得，不要求在文档中预设完整结算域模型。

## 12. 分阶段实施计划

### Phase 0: 事实核对与边界梳理

进入条件：

- 已确认首版宿主形态为仓内 Web UI
- 已确认首版以单机牌桌为范围

主要任务：

- 梳理 `DisplayManager`、`readline`、倒计时、`process.exit` 的影响范围
- 梳理 `Game` 对 `ui`/`strategy` 的反向依赖点
- 梳理手动模式与自动模式的推进差异
- 明确 CLI 共存策略

完成标志：

- 输出一份可供实现使用的边界清单
- 明确 UI 首版不会直接依赖 `readline` / `DisplayManager` / `process.exit`

### Phase 1: 最小会话适配层

进入条件：

- Phase 0 已明确边界与共存口径

主要任务：

- 建立最小 `game-session`
- 建立最小状态映射
- 明确 UI 如何触发玩家动作
- 明确 AI 回合如何继续推进到下一个人类行动点或结算点

完成标志：

- 页面可以在不接 CLI 输入输出的前提下读取局面状态
- 页面可以调用最小动作接口推进对局

### Phase 2: 牌桌 MVP

进入条件：

- Phase 1 已提供最小会话与状态读取能力

主要任务：

- 实现 `Lobby`
- 实现 `Table`
- 实现 `ResultModal`
- 跑通 1 人 + 3 AI 对局主流程

完成标志：

- UI 首版可玩
- 可以完成至少一整局本地对局

### Phase 3: CLI 共存验证与增强项评估

进入条件：

- Phase 2 已跑通 UI 主流程

主要任务：

- 回归验证 CLI 手动模式
- 回归验证 CLI 自动模式
- 评估自动演示模式是否值得进入 UI
- 评估是否需要后续调试面板和规则说明页

完成标志：

- 明确 UI 与 CLI 可共存
- 非 MVP 增强项有单独排期，不混入首版交付

## 13. CLI 共存策略

首版必须明确“不影响 CLI”的具体含义。

本设计文档将其定义为：

- 现有 CLI 入口 `src/majiang/index.ts` 仍可运行
- CLI 手动模式仍可运行
- CLI 自动模式仍可运行
- 首版 UI 不要求立即让 CLI 和 UI 共用同一套完整 application 适配层
- 但新增 UI 改造不得破坏现有规则语义与 CLI 行为

这一定义优先保证首版可落地，避免把“先统一所有入口”作为不必要前提。

## 14. 验收标准

验收标准必须覆盖“UI 首版可玩”“CLI 不回归”“规则引擎不重写”三类结果。

### 14.1 UI 首版可玩

- 存在可进入的图形界面入口
- 可以开始一局 1 人 + 3 AI 对局
- 可以看到四家基础桌面信息
- 可以完成至少一条完整的人类出牌交互链路
- AI 可以继续推进回合直到再次轮到人类或游戏结束
- 对局结束时可以展示最小结算结果

### 14.2 CLI 不回归

- `src/majiang/index.ts` 入口仍可运行
- CLI 手动模式仍可进入并推进
- CLI 自动模式仍可进入并推进
- 新增 UI 不要求替换现有 CLI 主流程

### 14.3 规则引擎不被重写

- 不新建一套平行麻将规则引擎
- 继续复用 `src/majiang/core/` 中已有规则与状态结构
- 若为适配 UI 做局部重构，应以隔离副作用和抽边界为主，不改变核心规则语义

## 15. 风险与注意事项

### 15.1 结构性风险

当前最主要的风险不是页面样式，而是结构性解耦成本被低估：

- `core` 存在反向依赖 `ui` 的事实
- 流程控制依赖 CLI 副作用
- 玩家输入依赖 `readline`
- 多处路径依赖 `process.exit`
- 自动模式依赖批量循环，不是天然可视化 session

这些问题如果不先写清楚，后续编码智能体很容易把改造复杂度误判成“新增页面 + 接状态”。

### 15.2 交付风险

- 若过早加入 `RuleDrawer`、`DebugPanel`、时间线等增强项，MVP 范围会失控
- 若过早预设完整状态模型，容易诱导实现阶段脑补不存在的数据源
- 若在首版要求 CLI 与 UI 同时彻底统一，会显著抬高改造成本

### 15.3 口径风险

- `docs/majiang/FOLDER_STRUCTURE.md` 是目标结构，不等于当前代码事实
- README 中对规则口径的描述后续可能需要与代码实现进一步对齐

## 16. 结论

当前麻将模块的价值在于：已经存在可运行的规则与对局流程。

当前麻将模块的现实问题在于：这套流程仍然主要建立在 CLI 输入输出、副作用打印、轮询推进和部分直接退出语义之上。

因此，首版 UI 的正确路线不是“直接把现有 core 当纯净引擎接页面”，而是：

- 保持复用 `core/strategy`、避免重写规则引擎
- 先识别和隔离 CLI 输入输出副作用、流程推进机制和 `core -> ui` 反向依赖
- 在此基础上实现最小 Web 牌桌 UI
- 同时保证现有 CLI 手动/自动模式不回归

只有在这个前提下，这份设计文档才适合作为后续麻将 UI 开发落地的基础。

## 17. 当前实现落点与状态

截至本次发布收口，本文档的正式发布口径采用方案 A：麻将首版 Web UI MVP 正式发布，发布门禁包含全仓 `npm run build` 与麻将专项验证。

发布范围包含：

- Web 服务入口：`src/majiang/web/server.ts`
- 静态页面：`src/majiang/web/public/`
- 会话适配层：`src/majiang/application/game-session.ts`
- 状态映射层：`src/majiang/application/game-state-mapper.ts`
- 运行时边界控制：`src/majiang/runtime/runtime-context.ts`
- CLI 共存 smoke：`scripts/demo/majiang-cli-smoke.ts`
- Web API / 静态入口 smoke：`scripts/demo/majiang-web-smoke.ts`
- 麻将 Web UI 专项 TypeScript 检查：`tsconfig.majiang-web-release.json`
- 全仓 TypeScript 构建：`npm run build`

不纳入本次 MVP 发布范围：

- 非 MVP 页面与能力，例如 `RuleDrawer`、`DebugPanel`、时间线、动画、自动演示模式开放

这些边界用于避免把正式发布误读为非 MVP 体验增强已完成；全仓 TypeScript 编译本轮已作为发布门禁处理并通过。

### 17.1 已完成项

以下内容已经按真实代码落地，可视为当前已完成范围：

- Phase 0:
  - 已把 Web 会话路径从 CLI 顶层输入链路中隔离出来
  - `src/majiang/ui/game-event-handler.ts` 不再顶层依赖 `src/majiang/ui/input.ts`
  - `src/majiang/ui/game-event-handler.ts` 不再顶层依赖 `src/majiang/ui/gameLoop.ts`
  - `src/majiang/runtime/runtime-context.ts` 已用于收口静默输出、fatal 处理、Web 路径文件日志关闭与 Web 会话 console 日志静默
- Phase 1:
  - `src/majiang/application/game-session.ts` 已提供单局 session 驱动
  - `src/majiang/application/game-state-mapper.ts` 已基于 `Game` / `Player` 输出首版页面最小状态
  - 会话已支持 1 人 + 3 AI 建局、出牌、响应动作、AI 自动推进直到再次轮到人类或游戏结束
- Phase 2:
  - 仓内 Web 宿主已落地在 `src/majiang/web/server.ts`
  - MVP 页面已收敛为 `Lobby`、`Table`、`ResultModal`
  - `Lobby` 已提供真实模式选择控件：`manual` 可用，`auto-demo` 显示为暂未开放
  - `src/majiang/web/app.ts` 已显式接收并校验建局 `mode`，当前只允许 `manual`
  - 当前实现仍复用 `src/majiang/core/`、`src/majiang/strategy/` 与 `GameEventHandler`，未新增平行规则引擎

### 17.2 正式发布状态与边界

以下内容为当前代码状态下的正式发布结论：

- Web 端到端闭环验收已在当前代码状态下复核完成
  - 当前环境曾出现 `listen EPERM`，这属于运行环境限制，不直接等同于代码缺陷
  - 当前 `src/majiang/web/server.ts` 已关闭 Web 路径文件日志，避免监听失败时额外混入 `logs/majiang` 权限噪音
  - 当前 `src/majiang/application/game-session.ts` 已关闭 Web session 的底层麻将 console/file 日志输出，本轮确认 `majiang:web-smoke` 输出不再夹带底层麻将流程日志
  - `Lobby -> Table -> 人类出牌 -> AI 自动推进 -> 再次回到人类回合` 已有真实浏览器快照支撑
  - 本轮已通过 Codex 内置浏览器重新确认 `ResultModal`、 “再来一局”与麻将页面控制台错误/警告为 0
- 正式发布构建/验证门禁已固化为 `npm run majiang:release-check`
  - `npm run build` 已纳入发布门禁，并确认通过
  - `npm run majiang:web-typecheck` 使用 `tsconfig.majiang-web-release.json` 检查麻将 Web UI 发布路径
  - `npm run majiang:verify` 顺序执行 CLI smoke 与 Web smoke
- 为满足方案 A，已最小修复全仓 TypeScript 编译债务
  - `src/tic-tac-toe/` 补充历史导入路径兼容导出
  - `src/majiang/strategy/ai-alphazero/` 补齐当前编译所需导出与初始化字段
  - `src/othello/` 修复已漂移的测试/工具导入与 API 调用
  - 这些修复属于构建兼容性收口，不改变麻将 Web UI/CLI 主流程语义，也不重写麻将规则引擎

### 17.3 后续非发布阻塞事项

以下事项不阻塞本次麻将首版 Web UI MVP 正式发布，但若后续进入对应范围，需要单独立项：

- 非 MVP 体验增强，例如牌桌视觉、动画、调试面板、规则抽屉
- 自动演示模式的 Web session tick 方案与开放

### 17.4 已补充的回归验证记录

截至本次更新，CLI 共存已补充最小 smoke 验证路径：

- `scripts/demo/majiang-cli-smoke.ts`
  - 验证 CLI 手动模式起局后仍能进入“人类玩家需要出牌”的首轮状态
  - 验证 CLI 自动模式仍可跑通 `runAutoGameLoop(..., 1)` 的单局 AI 对战
- `package.json`
  - 新增脚本 `npm run majiang:smoke`

这组 smoke 验证用于压实“UI 增量改造未破坏现有 CLI 入口方向”的结论，但它仍不替代后续在真实终端环境中的完整人工回归。

### 17.5 已补充的 Web 无端口验收记录

考虑到当前环境禁止监听本地端口，Web 路径已补充无端口 smoke 验证：

- `src/majiang/web/app.ts`
  - 将 Web API 路由解析从 `server.ts` 中抽出为可直接调用的最小处理器
- `scripts/demo/majiang-web-smoke.ts`
  - 验证 `health`
  - 验证 `create-session`
  - 验证 `get-session`
  - 验证 `discard`
  - 验证 `restart`
  - 验证 `index.html` 与 `app.js` 的静态路由解析
- `package.json`
  - 新增脚本 `npm run majiang:web-smoke`

这组校验不能替代真实浏览器访问，但可以在当前端口受限环境中验证 Web 宿主的核心 API 和静态入口主路径仍然可用。

### 17.6 已补充的页面交互收敛项

在不扩大 MVP 范围的前提下，当前页面还补充了以下交互收敛项：

- `src/majiang/web/public/index.html`
  - 追加状态横幅、桌面提示文案、最小结果细节字段
- `src/majiang/web/public/app.js`
  - 为开始对局、出牌、响应动作、再来一局增加统一请求错误处理
  - 增加进行中状态，避免连续重复点击
  - 将当前行动玩家、庄家、圈数、摸牌次数展示到页面头部
  - 将“最近摸牌”“当前该做什么”以页面文案显式给出
- `src/majiang/web/public/styles.css`
  - 增加状态横幅、忙碌态、结果文案与移动端信息栅格适配

这些改动属于首版 MVP 内的交互清晰化，不新增 `RuleDrawer`、`DebugPanel`、时间线或动画等非 MVP 内容。

### 17.7 页面级交互验收矩阵

以下验收矩阵已在可监听端口环境中通过真实浏览器主流程验证；无端口 smoke 仍作为保底回归链路。

#### 17.7.1 Lobby

- 验收项：页面初始只展示 `Lobby`
  - 预期结果：显示“手动模式（1 人 + 3 AI）”与“开始新对局”按钮
  - 当前支撑：`src/majiang/web/public/index.html`
- 验收项：点击“开始新对局”
  - 预期结果：按钮进入忙碌态，状态横幅显示“正在创建对局...”，随后切换到 `Table`
  - 当前支撑：`src/majiang/web/public/app.js` 中 `startBtn` 处理逻辑

#### 17.7.2 Table

- 验收项：进入牌桌后显示四家布局
  - 预期结果：上/左/右为 AI，底部为人类玩家；中央展示最后弃牌与四家弃牌区
  - 当前支撑：`src/majiang/web/public/index.html`、`src/majiang/web/public/app.js`
- 验收项：头部显示最小对局状态
  - 预期结果：可见当前阶段、当前行动、庄家、圈数、摸牌次数、剩余牌数、当前提示
  - 当前支撑：`src/majiang/web/public/index.html`、`src/majiang/web/public/app.js`
- 验收项：轮到人类出牌时点击手牌
  - 预期结果：状态横幅显示提交中，成功后显示“出牌成功，AI 正在继续推进回合。”
  - 当前支撑：`src/majiang/web/public/app.js` 中 `discard` 逻辑
- 验收项：出现响应动作时点击 `吃/碰/杠/胡/过`
  - 预期结果：动作按钮提交成功后刷新牌桌，状态横幅显示已提交的动作
  - 当前支撑：`src/majiang/web/public/app.js` 中 `respond` 逻辑
- 验收项：请求进行中禁止重复点击
  - 预期结果：开始按钮、再来一局按钮禁用；手牌按钮不可重复触发
  - 当前支撑：`src/majiang/web/public/app.js` 中 `setPending()` 与 `body.is-busy`
- 验收项：当前无须人类操作时显示明确提示
  - 预期结果：底部提示区给出“当前无需你的直接操作”或 AI 推进相关文案
  - 当前支撑：`src/majiang/web/public/app.js` 中 `renderTableHint()`

#### 17.7.3 ResultModal

- 验收项：对局结束后展示结果弹层
  - 预期结果：显示赢家标题、最小结算类型文本、分数摘要、“再来一局”按钮
  - 当前支撑：`src/majiang/web/public/index.html`、`src/majiang/web/public/app.js`
- 验收项：点击“再来一局”
  - 预期结果：重新开始对局并返回可玩状态，状态横幅提示“已重新开始新一局。”
  - 当前支撑：`src/majiang/web/public/app.js` 中 `restart` 逻辑

#### 17.7.4 建议执行方式

- 在可监听端口环境执行：
  - `npm run majiang:web`
- 在真实浏览器访问：
  - `http://127.0.0.1:4010/majiang-web`
- 在当前受限环境继续保底执行：
  - `npm run majiang:web-smoke`
  - `npm run majiang:verify`

### 17.8 已完成的真实页面验收记录

在可监听端口环境中，已完成以下真实浏览器验收：

- 访问 `http://127.0.0.1:4010/majiang-web`
- 确认 `Lobby` 初始展示正常
- 点击“开始新对局”后成功进入 `Table`
- 确认头部状态区已显示：
  - 当前阶段
  - 当前行动
  - 庄家
  - 圈数
  - 摸牌次数
  - 剩余牌数
  - 当前提示
- 确认 `Table` 已展示：
  - 四家布局
  - AI 牌背
  - 中央牌桌
  - 弃牌区
  - 人类手牌可点击
- 已真实点击一张人类手牌，成功跑通：
  - 人类出牌
  - 状态横幅提示“出牌成功，AI 正在继续推进回合。”
  - AI 自动推进
  - 页面再次回到人类回合

本轮已补充 `favicon.ico` 静态资源，并通过 Codex 内置浏览器确认麻将页面控制台错误/警告为 0。

验收产物：

- `.playwright-cli/page-2026-04-25T09-34-06-999Z.png`
- `.playwright-cli/page-2026-04-25T09-50-39-902Z.png`
- `.playwright-cli/page-2026-04-25T09-46-16-761Z.yml`
- `.playwright-cli/page-2026-04-25T09-50-01-956Z.yml`
- `.playwright-cli/page-2026-04-25T12-25-51-851Z.yml`
- `.playwright-cli/page-2026-04-25T12-28-14-901Z.yml`
- `.playwright-cli/page-2026-04-25T12-28-40-458Z.png`

本轮补充验收结果：

- 在 `http://127.0.0.1:4011/majiang-web` 继续真实浏览器验收
- `Lobby` 已补齐真实模式选择：
  - 可选择项包含“手动模式（1 人 + 3 AI）”
  - “自动演示模式”作为已识别但暂未开放的禁用选项展示
  - 建局请求会提交 `mode: "manual"`
  - Web API 对 `mode: "auto-demo"` 明确返回暂未开放，而不是静默忽略
- 通过页面交互循环推进到 `ResultModal`
  - 结果弹层展示赢家，例如“西家(AI) 获胜”
  - 结果细节展示“结算类型：胡牌”
  - 页面状态进入 `ENDED`
  - 头部提示展示赢家已胡牌、当前对局结束
  - 状态横幅展示“本局已经结束，可以查看结果并再次开始。”
- 点击“再来一局”后确认：
  - `ResultModal` 关闭
  - 页面恢复到 `PLAYING`
  - 状态横幅展示“已重新开始新一局。”
  - 人类玩家手牌恢复为可点击出牌状态

本轮顺手修复的页面验收问题：

- `src/majiang/application/game-state-mapper.ts`
  - 当存在待响应动作时，头部“当前提示”优先显示 `请选择动作：...`，避免只显示当前 AI 行动造成提示不一致
- `src/majiang/web/public/app.js`
  - 出牌/响应动作后若本局已经结束，不再用普通成功文案覆盖结果态状态横幅

### 17.9 发布构建与验证门禁

本次正式发布采用方案 A：全仓 `npm run build` 必须通过，并与麻将 Web UI 专项检查、CLI/Web smoke 共同构成正式发布门禁。

发布门禁：

- `npm run majiang:release-check`

该脚本顺序执行：

- `npm run build`
  - 基于仓库默认 `tsconfig.json`
  - 覆盖全仓 TypeScript 编译
  - 本轮已修复阻断构建的历史导入/API 漂移问题
- `npm run majiang:web-typecheck`
  - 基于 `tsconfig.majiang-web-release.json`
  - 覆盖 `src/majiang/web/server.ts`
  - 覆盖 `src/majiang/web/app.ts`
  - 覆盖 `src/majiang/application/game-session.ts`
  - 覆盖 `src/majiang/application/game-state-mapper.ts`
  - 覆盖 `scripts/demo/majiang-cli-smoke.ts`
  - 覆盖 `scripts/demo/majiang-web-smoke.ts`
  - TypeScript 会继续检查这些入口真实导入到的麻将 `core/`、`ui/`、`strategy/agents/ai-player.ts`、`GameEventHandler` 等发布路径
- `npm run majiang:verify`
  - 顺序执行 `npm run majiang:smoke`
  - 顺序执行 `npm run majiang:web-smoke`

截至 2026-04-26 的实际执行结果：

- `npm run build` 通过
- `npm run majiang:release-check` 通过
- `npm run majiang:web-typecheck` 通过
- `npm run majiang:smoke` 通过
  - 覆盖 CLI 手动模式起局
  - 覆盖 CLI 自动模式单局推进
- `npm run majiang:web-smoke` 通过
  - 覆盖 `health`
  - 覆盖 `manual` 建局
  - 覆盖 `auto-demo` 被识别但返回暂未开放
  - 覆盖非法模式返回 400
  - 覆盖 `get-session`
  - 覆盖 `discard`
  - 覆盖 `restart`
  - 覆盖 `index.html`
  - 覆盖 `app.js`
  - 覆盖 `styles.css`
  - 覆盖 `favicon.ico`
- Python Playwright 真实页面验收通过
  - 启动 `npm run majiang:web` 于 `http://127.0.0.1:4012/majiang-web`
  - 确认 `manual` 模式默认选中
  - 确认 `auto-demo` 模式禁用
  - 点击“开始新对局”后进入 `Table`
  - 点击一张人类手牌后页面仍保持 `PLAYING`
  - 页面控制台错误/警告为 0

全仓构建现状：

- 已按用户授权执行过 `npm install`，用于补齐本地依赖
- `npm run build` 已通过
- 为让全仓构建恢复绿灯，本轮只做兼容性修复：
  - `src/tic-tac-toe/` 增加历史路径 re-export
  - `src/majiang/core/player.ts` 增加历史训练/分析模块需要的只读访问器
  - `src/majiang/strategy/ai-alphazero/` 修复缺失入口与初始化字段
  - `src/othello/` 修复已漂移的测试/工具引用
- 这些修复不改变麻将规则语义，不新增平行麻将规则引擎，不扩展 Web UI 非 MVP 能力

影响判断：

- 对“麻将首版 Web UI MVP 正式发布”没有构建阻断
  - `npm run majiang:release-check` 已包含并通过 `npm run build`
  - Web UI 仍复用现有 `core/`、`strategy/agents/ai-player.ts`、`GameEventHandler`
  - 未新增平行麻将规则引擎

当前发布口径：

- 麻将首版 Web UI MVP 正式发布通过
- 采用方案 A，不使用方案 B
- 全仓 `npm run build` 已通过并纳入发布门禁
- CLI 手动/自动 smoke 已通过，当前 UI 增量未破坏 CLI 基本入口
- 规则引擎未重写，仍复用现有 `core` / `strategy` 能力

### 17.10 正式发布验收清单

本清单用于审核智能体判断“麻将首版 Web UI MVP 是否达到正式发布标准”。

- 发布边界
  - 结论：通过
  - 证据：本文档第 17 节明确采用方案 A；正式发布门禁包含全仓 `npm run build` 与麻将专项验证
- Web 启动方式
  - 结论：通过
  - 证据：`npm run majiang:web` 启动 `src/majiang/web/server.ts`，默认访问 `http://127.0.0.1:4010/majiang-web`
- Web 主流程可用
  - 结论：通过
  - 证据：真实浏览器已验证 `Lobby -> Table -> 人类出牌 -> AI 推进 -> 再次回到人类回合`
- `Lobby -> Table -> ResultModal -> 再来一局` 闭环
  - 结论：通过
  - 证据：真实浏览器已推进到 `ResultModal`，点击“再来一局”后回到 `PLAYING`
- CLI 不回归
  - 结论：通过
  - 证据：`npm run majiang:smoke` 通过，覆盖 CLI 手动模式起局与 CLI 自动模式推进
- 规则引擎未重写
  - 结论：通过
  - 证据：Web 会话仍经 `src/majiang/application/game-session.ts` 复用 `src/majiang/core/`、`src/majiang/strategy/agents/ai-player.ts`、`GameEventHandler`
- 静态资源主路径可访问
  - 结论：通过
  - 证据：`npm run majiang:web-smoke` 覆盖 `index.html`、`app.js`、`styles.css`、`favicon.ico`
- 页面控制台无错误
  - 结论：通过
  - 证据：Codex 内置浏览器真实页面验收确认麻将页面控制台错误/警告为 0
- 构建/验证门禁
  - 结论：通过
  - 证据：`npm run build` 通过；`npm run majiang:release-check` 通过，且该脚本已顺序包含 `npm run build`、`npm run majiang:web-typecheck`、`npm run majiang:verify`
