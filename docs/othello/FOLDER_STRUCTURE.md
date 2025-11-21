# 黑白棋项目架构文档

## 📁 目录结构

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
├── config/                  # 游戏核心配置
│   └── config.ts           # 游戏配置参数
│
├── strategy/                # AI策略和算法
│   ├── agents/             # AI智能体
│   │   ├── random-agent.ts
│   │   ├── greedy-agent.ts
│   │   ├── heuristic-agent.ts
│   │   ├── minimax-agent.ts
│   │   ├── qlearning-agent.ts
│   │   ├── dqn-agent.ts
│   │   ├── a3c-agent.ts
│   │   ├── alphazero-agent.ts
│   │   └── alphazero-agent-optimized.ts
│   ├── networks/           # 神经网络实现
│   │   ├── dqn-network.ts
│   │   ├── a3c-network.ts
│   │   ├── alphazero-network.ts
│   │   └── alphazero-network-advanced.ts
│   ├── trainers/           # 训练器
│   │   ├── dqn-trainer.ts
│   │   ├── a3c-trainer.ts
│   │   ├── alphazero-trainer.ts
│   │   ├── alphazero-trainer-optimized.ts
│   │   └── alphazero-training-manager.ts
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
└── models/                 # 训练好的模型
    └── ...
```

## 📋 模块说明

### 1. `core/` - 游戏核心逻辑
**职责**：纯游戏规则实现，不涉及AI、UI、网络等
- `game.ts`: 游戏类（OthelloGame）和核心游戏函数
- `types.ts`: 游戏相关的类型定义
- `index.ts`: 核心模块的统一导出

**特点**：
- 无外部依赖（除了基础类型）
- 可被任何模块复用（训练、测试、UI等）

### 2. `config/` - 游戏核心配置
**职责**：游戏核心配置参数
- `config.ts`: 游戏配置（棋盘大小、初始棋子数等）

**特点**：
- 游戏级配置，不涉及AI
- 可被 core/ 和 strategy/ 模块使用

### 3. `strategy/` - AI策略和算法
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

### 4. `ui/` - 用户界面
**职责**：用户交互相关的代码
- `cli.ts`: 命令行界面
- `demo.ts`: 演示程序
- `api-server.ts`: HTTP API服务器

**特点**：
- 依赖 `core/` 和 `strategy/` 模块
- 面向最终用户

### 5. `tools/` - 工具和辅助脚本
**职责**：辅助工具、指南、配置等
- `config-guide.ts`: 配置指南
- `program-guide.ts`: 程序指南
- `run-commands.ts`: 命令运行工具

### 6. `tests/` - 测试文件
**职责**：各种测试脚本
- `model-test.ts`: 模型测试
- `performance-test.ts`: 性能测试

### 7. `models/` - 训练好的模型
**职责**：存储训练好的模型文件

## 🔗 依赖关系

```
ui/ ──┐
      ├──> strategy/ ──> core/ ──> config/
tools/┘
tests/ ──> core/ ──> config/
```

## 📊 实际结构验证

本文档最后更新于：2024-11-21  
实际文件结构已验证：✅

**验证内容**：
- ✅ 所有目录结构符合文档描述
- ✅ 所有文件已移动到正确位置
- ✅ 导入路径已更新
- ✅ 导出文件已创建
- ✅ config/ 目录已创建并包含游戏核心配置
