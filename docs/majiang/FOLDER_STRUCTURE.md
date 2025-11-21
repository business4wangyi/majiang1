# 麻将项目架构文档

## 📁 目录结构

### 核心原则
1. **游戏逻辑分离**：游戏核心逻辑独立于AI、UI、服务器等
2. **功能模块化**：按功能类型组织文件
3. **可扩展性**：便于添加新功能而不破坏现有结构
4. **一致性**：与项目中其他游戏（黑白棋、井字棋）保持一致的规范

## 🗂️ 标准目录结构

```
src/majiang/
├── core/                    # 游戏核心逻辑（纯游戏规则，不涉及AI）
│   ├── game.ts             # 游戏类（Game）和核心逻辑
│   ├── rule-engine.ts      # 规则引擎
│   ├── rule-types.ts       # 规则类型定义
│   ├── tile.ts             # 牌类
│   ├── tile-manager.ts     # 牌管理器
│   ├── player.ts           # 玩家基类
│   ├── score-calculator.ts # 分数计算器
│   ├── win-conditions/     # 胡牌条件
│   │   ├── index.ts
│   │   ├── win-condition-detector.ts
│   │   └── win-conditions_*.ts (各种胡牌条件)
│   ├── types.ts            # 类型定义
│   └── index.ts            # 核心模块导出
│
├── strategy/                # AI策略和算法
│   ├── agents/             # AI智能体
│   │   └── ai-player.ts   # AI玩家实现
│   ├── ai-alphazero/       # AlphaZero AI实现
│   │   ├── majiang-alphazero-agent.ts
│   │   ├── majiang-alphazero-network.ts
│   │   ├── majiang-alphazero-network-tf.ts
│   │   ├── majiang-game-adapter.ts
│   │   ├── majiang-state-encoder.ts
│   │   ├── majiang-action-decoder.ts
│   │   ├── self-play-trainer.ts
│   │   ├── real-self-play-trainer.ts
│   │   ├── phase2-stability-trainer.ts
│   │   ├── phase3-neurosymbolic-trainer.ts
│   │   ├── phase4-super-optimizer.ts
│   │   ├── stability-optimizer.ts
│   │   ├── neural-symbolic-fusion.ts
│   │   ├── performance-config.ts
│   │   ├── integration-test.ts
│   │   ├── demo.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── index.ts            # 策略模块导出
│
├── ui/                     # 用户界面相关
│   ├── display.ts          # 显示相关
│   ├── display-manager.ts  # 显示管理器
│   ├── input.ts            # 输入处理
│   ├── gameLoop.ts         # 游戏循环
│   ├── game-event-handler.ts # 游戏事件处理
│   ├── countdown-manager.ts  # 倒计时管理器
│   └── human-player.ts     # 人类玩家
│
├── tools/                  # 工具和辅助脚本
│   ├── logger.ts           # 日志工具
│   ├── performance-monitor.ts # 性能监控
│   ├── performance-injector.ts # 性能注入器
│   └── time-utils.ts       # 时间工具
│
├── config/                 # 配置文件
│   └── config.ts           # 游戏配置
│
└── index.ts                # 主入口文件
```

## 📋 模块说明

### 1. `core/` - 游戏核心逻辑
**职责**：纯游戏规则实现，不涉及AI、UI、网络等
- `game.ts`: 游戏类（Game）和核心游戏逻辑
- `rule-engine.ts`: 规则引擎，处理游戏规则
- `rule-types.ts`: 规则相关的类型定义
- `tile.ts`: 牌类定义
- `tile-manager.ts`: 牌管理器
- `player.ts`: 玩家基类
- `score-calculator.ts`: 分数计算器
- `win-conditions/`: 各种胡牌条件实现
- `types.ts`: 游戏相关的类型定义
- `index.ts`: 核心模块的统一导出

**特点**：
- 无外部依赖（除了基础类型）
- 可被任何模块复用（训练、测试、UI等）

### 2. `strategy/` - AI策略和算法
**职责**：所有AI相关的实现
- `agents/`: AI智能体
  - `ai-player.ts`: AI玩家实现
- `ai-alphazero/`: AlphaZero AI完整实现
  - 智能体、网络、训练器等
- `index.ts`: 策略模块统一导出

**特点**：
- 依赖 `core/` 模块
- 可独立训练和测试

### 3. `ui/` - 用户界面
**职责**：用户交互相关的代码
- `display.ts`: 显示相关功能
- `display-manager.ts`: 显示管理器
- `input.ts`: 输入处理
- `gameLoop.ts`: 游戏主循环
- `game-event-handler.ts`: 游戏事件处理
- `countdown-manager.ts`: 倒计时管理
- `human-player.ts`: 人类玩家实现

**特点**：
- 依赖 `core/` 和 `strategy/` 模块
- 面向最终用户

### 4. `tools/` - 工具和辅助脚本
**职责**：辅助工具、日志、性能监控等
- `logger.ts`: 日志工具
- `performance-monitor.ts`: 性能监控
- `performance-injector.ts`: 性能注入器
- `time-utils.ts`: 时间工具函数

### 5. `config/` - 配置文件
**职责**：游戏配置
- `config.ts`: 游戏配置参数

## 🔗 依赖关系

```
ui/ ──┐
      ├──> strategy/ ──> core/ ──> config/
tools/┘
config/ ──> core/
```

## 📊 实际结构验证

本文档最后更新于：2024-11-21  
实际文件结构已验证：✅

**验证内容**：
- ✅ 所有目录结构符合文档描述
- ✅ strategy/ 子目录已创建（agents/, ai-alphazero/）
- ✅ 所有文件已移动到正确位置
- ✅ 导入路径已更新
- ✅ config/ 目录已存在并包含游戏配置

