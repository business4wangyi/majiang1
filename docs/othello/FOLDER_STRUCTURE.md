# 黑白棋项目文件夹结构规范

## 📁 目录结构规范

### 核心原则
1. **游戏逻辑分离**：游戏核心逻辑独立于AI、UI、服务器等
2. **功能模块化**：按功能类型组织文件
3. **可扩展性**：便于添加新功能而不破坏现有结构
4. **一致性**：与项目中其他游戏（麻将、井字棋）保持一致的规范

## 🗂️ 标准目录结构

```
src/othello/
├── core/                    # 游戏核心逻辑（纯游戏规则，不涉及AI）
│   ├── game.ts             # 游戏类（OthelloGame）和核心函数
│   ├── types.ts            # 类型定义
│   └── index.ts            # 核心模块导出
│
├── strategy/                # AI策略和算法（已存在）
│   ├── agents/             # AI智能体
│   │   ├── random-agent.ts
│   │   ├── greedy-agent.ts
│   │   ├── heuristic-agent.ts
│   │   ├── minimax-agent.ts
│   │   ├── qlearning-agent.ts
│   │   ├── dqn-agent.ts
│   │   ├── a3c-agent.ts
│   │   └── alphazero-agent.ts
│   ├── networks/           # 神经网络实现
│   │   ├── dqn-network.ts
│   │   ├── a3c-network.ts
│   │   ├── alphazero-network.ts
│   │   └── alphazero-network-advanced.ts
│   ├── trainers/           # 训练器
│   │   ├── qlearning-trainer.ts (如果存在)
│   │   ├── dqn-trainer.ts
│   │   ├── a3c-trainer.ts
│   │   ├── alphazero-trainer.ts
│   │   └── alphazero-trainer-optimized.ts
│   ├── mcts/               # MCTS相关
│   │   ├── alphazero-mcts.ts
│   │   └── alphazero-mcts-optimized.ts
│   ├── configs/            # 配置相关
│   │   ├── alphazero-configs.ts
│   │   └── alphazero-configs-advanced.ts
│   ├── utils/              # 工具函数
│   │   ├── strategy-utils.ts
│   │   ├── experience-replay.ts
│   │   └── rng.ts
│   ├── benchmark.ts        # 基准测试
│   ├── hyperopt.ts         # 超参数优化
│   └── index.ts            # 策略模块导出
│
├── ui/                     # 用户界面相关
│   ├── cli.ts              # 命令行界面
│   ├── demo.ts             # 演示程序
│   └── api-server.ts       # API服务器
│
├── tools/                  # 工具和辅助脚本
│   ├── config-guide.ts     # 配置指南
│   ├── program-guide.ts    # 程序指南
│   └── run-commands.ts     # 命令运行工具
│
├── tests/                  # 测试文件
│   ├── model-test.ts       # 模型测试
│   └── performance-test.ts # 性能测试
│
└── models/                 # 训练好的模型（已存在）
    └── ...
```

## 📋 文件分类说明

### 1. `core/` - 游戏核心逻辑
**职责**：纯游戏规则实现，不涉及AI、UI、网络等
- `game.ts`: 游戏类（OthelloGame）和核心游戏函数
- `types.ts`: 游戏相关的类型定义
- `index.ts`: 核心模块的统一导出

**特点**：
- 无外部依赖（除了基础类型）
- 可被任何模块复用（训练、测试、UI等）
- 类似 `src/majiang/game.ts` 和 `src/tic-tac-toe/game.ts`

### 2. `strategy/` - AI策略和算法
**职责**：所有AI相关的实现
- `agents/`: 各种AI智能体实现
- `networks/`: 神经网络实现
- `trainers/`: 训练器实现
- `mcts/`: MCTS算法实现
- `configs/`: 配置管理
- `utils/`: 工具函数

**特点**：
- 依赖 `core/` 模块
- 可独立训练和测试
- 类似 `src/majiang/ai-alphazero/` 和 `src/tic-tac-toe/strategy/`

### 3. `ui/` - 用户界面
**职责**：用户交互相关的代码
- `cli.ts`: 命令行界面
- `demo.ts`: 演示程序
- `api-server.ts`: HTTP API服务器

**特点**：
- 依赖 `core/` 和 `strategy/` 模块
- 面向最终用户
- 类似 `src/ai-assistant/tic-tac-toe/`

### 4. `tools/` - 工具和辅助脚本
**职责**：辅助工具、指南、配置等
- `config-guide.ts`: 配置指南
- `program-guide.ts`: 程序指南
- `run-commands.ts`: 命令运行工具

**特点**：
- 提供辅助功能
- 帮助用户理解和使用系统

### 5. `tests/` - 测试文件
**职责**：各种测试脚本
- `model-test.ts`: 模型测试
- `performance-test.ts`: 性能测试

**特点**：
- 用于验证功能
- 可独立运行

### 6. `models/` - 训练好的模型
**职责**：存储训练好的模型文件
- 已存在的模型文件夹

## 🔄 迁移状态

### ✅ 迁移已完成（2024-11-20）

**阶段1：创建新结构** ✅
- ✅ 创建 `core/` 文件夹
- ✅ 创建 `ui/` 文件夹
- ✅ 创建 `tools/` 文件夹
- ✅ 创建 `tests/` 文件夹
- ✅ 重组 `strategy/` 文件夹为子文件夹结构

**阶段2：移动文件** ✅
- ✅ 移动游戏核心文件到 `core/`（game.ts, types.ts）
- ✅ 移动UI相关文件到 `ui/`（cli.ts, demo.ts, api-server.ts）
- ✅ 移动工具文件到 `tools/`（config-guide.ts, program-guide.ts, run-commands.ts）
- ✅ 移动测试文件到 `tests/`（model-test.ts, performance-test.ts）
- ✅ 重组 `strategy/` 子文件夹（agents/, networks/, trainers/, mcts/, configs/, utils/）

**阶段3：更新导入** ✅
- ✅ 更新所有文件的导入路径
- ✅ 更新 `core/index.ts` 和 `strategy/index.ts` 导出文件
- ✅ 更新 `scripts/` 中的脚本导入路径
- ✅ 修复导出冲突问题

**阶段4：验证** ✅
- ✅ 运行基准测试确保功能正常
- ✅ 检查所有导入路径
- ✅ 更新文档

### 📊 迁移结果

- **文件总数**：39个TypeScript文件
- **新文件夹结构**：6个主要目录（core, strategy, ui, tools, tests, models）
- **策略子文件夹**：6个子目录（agents, networks, trainers, mcts, configs, utils）
- **测试状态**：✅ 所有测试通过

## 📝 注意事项

1. **向后兼容**：尽量保持公共API不变
2. **渐进式迁移**：可以分阶段进行，不需要一次性完成
3. **测试优先**：每次移动后都要运行测试
4. **文档更新**：及时更新相关文档和README

## 🔗 参考规范

- `src/majiang/`: 麻将游戏结构
- `src/tic-tac-toe/`: 井字棋游戏结构
- `src/ai-assistant/`: AI助手框架结构

