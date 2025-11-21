# 井字棋项目架构文档

## 📁 目录结构

### 核心原则
1. **游戏逻辑分离**：游戏核心逻辑独立于AI、UI、服务器等
2. **功能模块化**：按功能类型组织文件
3. **可扩展性**：便于添加新功能而不破坏现有结构
4. **一致性**：与项目中其他游戏（黑白棋、麻将）保持一致的规范

## 🗂️ 标准目录结构

```
src/tic-tac-toe/
├── core/                    # 游戏核心逻辑（纯游戏规则，不涉及AI）
│   ├── game.ts             # 游戏核心函数
│   ├── types.ts            # 类型定义
│   └── index.ts            # 核心模块导出
│
├── strategy/                # AI策略和算法
│   ├── agents/             # AI智能体
│   │   ├── random-agent.ts     # 随机策略
│   │   ├── greedy-agent.ts     # 贪心策略
│   │   ├── minimax-agent.ts    # Minimax算法
│   │   ├── defensive-agent.ts  # 防守策略
│   │   └── qlearning-agent.ts  # Q-Learning算法
│   ├── trainers/           # 训练器
│   │   ├── train-qlearning-agent.ts # Q-Learning训练
│   │   └── train-qlearning-logged.ts # Q-Learning训练（带日志）
│   ├── utils/              # 工具函数
│   │   ├── analyze-qtable.ts   # Q表分析
│   │   ├── compare-ai-batch.ts # AI批量比较
│   │   ├── evaluate-agents-batch.ts # 智能体批量评估
│   │   ├── test-tic-tac-toe-ai.ts # AI测试
│   │   └── visualize-strategy.ts # 策略可视化
│   └── index.ts            # 策略模块导出
│
└── ui/                     # 用户界面相关
    └── demo.ts             # 演示程序
```

## 📋 模块说明

### 1. `core/` - 游戏核心逻辑
**职责**：纯游戏规则实现，不涉及AI、UI、网络等
- `game.ts`: 游戏核心函数（createBoard, getLegalActions, makeMove等）
- `types.ts`: 游戏相关的类型定义（Player, Board, Action等）
- `index.ts`: 核心模块的统一导出

**特点**：
- 无外部依赖（除了基础类型）
- 可被任何模块复用（训练、测试、UI等）

### 2. `strategy/` - AI策略和算法
**职责**：所有AI相关的实现
- `agents/`: AI智能体
  - `random-agent.ts`: 随机策略智能体
  - `greedy-agent.ts`: 贪心策略智能体
  - `minimax-agent.ts`: Minimax算法智能体
  - `defensive-agent.ts`: 防守策略智能体
  - `qlearning-agent.ts`: Q-Learning算法智能体
- `trainers/`: 训练器
  - `train-qlearning-agent.ts`: Q-Learning训练脚本
  - `train-qlearning-logged.ts`: Q-Learning训练脚本（带日志）
- `utils/`: 工具函数
  - `analyze-qtable.ts`: Q表分析工具
  - `compare-ai-batch.ts`: AI批量比较工具
  - `evaluate-agents-batch.ts`: 智能体批量评估工具
  - `test-tic-tac-toe-ai.ts`: AI测试脚本
  - `visualize-strategy.ts`: 策略可视化工具
- `index.ts`: 策略模块统一导出

**特点**：
- 依赖 `core/` 模块
- 可独立训练和测试

### 3. `ui/` - 用户界面
**职责**：用户交互相关的代码
- `demo.ts`: 演示程序

**特点**：
- 依赖 `core/` 和 `strategy/` 模块
- 面向最终用户

## 🔗 依赖关系

```
ui/ ──> strategy/ ──> core/
```

## 📊 实际结构验证

本文档最后更新于：2024-11-21  
实际文件结构已验证：✅

**验证内容**：
- ✅ 所有目录结构符合文档描述
- ✅ strategy/ 子目录已创建（agents/, trainers/, utils/）
- ✅ strategy/index.ts 已创建
- ✅ 所有文件已移动到正确位置
- ✅ 导入路径已更新
- ✅ 架构符合项目统一规范

