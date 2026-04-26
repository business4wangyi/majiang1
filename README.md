# 🎮 AI辅助游戏系统

一个集成了多种游戏的AI辅助系统，包含麻将游戏、井字棋AI助手和Othello AI助手。

## 🌟 项目特色

### 🤖 AI辅助井字棋系统
- **智能分析**：集成多种AI策略（Minimax、Q-Learning、防守、贪心）
- **用户友好**：直观的命令行界面和多种输入格式
- **教学工具**：详细的策略解释和学习建议
- **可扩展**：模块化架构，支持扩展到其他游戏

### ⚫ Othello AI助手系统（新增）
- **多种AI策略**：随机、贪心、启发式、极小极大、Q学习策略
- **多种游戏模式**：人机对战、AI对战、演示模式
- **智能分析**：实时AI建议和详细策略解释
- **API服务器**：完整的RESTful API接口
- **统一架构**：与井字棋AI助手保持一致的TypeScript架构

### 🀄 麻将游戏
- **Web UI 子系统正式发布**：提供仓内 Web 页面入口，支持 `Lobby`、`Table`、`ResultModal`
- **本地单机流程**：支持 1 人 + 3 AI 的本地麻将对局
- **经典规则复用**：复用现有 `src/majiang/core/` 与 AI 策略能力，不新增平行规则引擎
- **CLI 共存**：保留原有命令行手动模式与自动模式

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 🎯 AI辅助井字棋（推荐）
```bash
# 启动AI辅助井字棋MVP工具
npm run ai-assistant:mvp
```

### ⚫ Othello AI助手（新增）
```bash
# 启动Othello CLI界面
npm run othello:cli

# 启动Othello API服务器
npm run othello:api-server

# AlphaZero训练（标准模式）
npm run othello:alphazero-train

# AlphaZero快速训练（性能优化，100轮约2小时）
npm run othello:alphazero-fast-train
```

### 🀄 麻将 Web UI（正式交付入口）
本仓库当前正式发布口径是“麻将 Web UI 子系统发布”，不是整个仓库发布。

```bash
# 启动麻将 Web UI
npm run majiang:web
```

启动后访问：

```text
http://127.0.0.1:4010/majiang-web
```

发布范围：

- `Lobby`：选择手动模式并开始新对局；自动演示模式显示为暂未开放
- `Table`：展示四家牌桌、本人手牌、弃牌区、明牌区、当前轮转与可行动作
- `ResultModal`：展示最小结算信息并支持“再来一局”

发布检查：

```bash
# 麻将 Web UI 子系统正式发布门禁
npm run majiang:release-check
```

该命令会执行发布范围 TypeScript 检查、CLI smoke 与 Web smoke。当前全仓 `npm run build` 仍存在历史 TypeScript 编译债务，主要位于本次发布范围外的 `src/ai-assistant/`、`src/majiang/strategy/ai-alphazero/`、`src/othello/`，因此不能把本结论理解为整个仓库正式发布。

### 🀄 麻将 CLI
```bash
# 正常模式
npm start

# 测试模式
npm start -- --test

# 当前源码 CLI 手动模式
npm run majiang:ai

# 当前源码 CLI 自动模式
npm run majiang:auto
```

## 📚 文档导航

### 👤 用户文档
- 📖 **[AI井字棋用户指南](docs/MVP_USER_GUIDE.md)** - 完整的使用教程和学习指南
- 🎯 **[文档中心](docs/README.md)** - 所有文档的导航入口

### 👨‍💻 开发者文档
- 🏗️ **[架构决策文档](docs/ARCHITECTURE_DECISION.md)** - 系统设计和架构分析
- 🎮 **[井字棋实现](src/ai-assistant/tic-tac-toe/README.md)** - 井字棋具体实现
- ⚫ **[Othello实现](src/othello/README.md)** - Othello AI助手完整文档
- 🚀 **[Othello快速开始](docs/OTHELLO_QUICK_START.md)** - Othello快速使用指南
- ⚡ **[AlphaZero快速训练指南](docs/ALPHAZERO_FAST_TRAINING.md)** - 高性能训练优化指南
- 📊 **[性能基准报告](docs/ALPHAZERO_PERFORMANCE_BASELINE.md)** - 性能基准和优化路线图
- ☁️ **[云端训练自动化文档中心](docs/cloud-automation/README.md)** - 所有云端训练和自动化方案（推荐）
  - 🤖 [AI调度训练指南](docs/cloud-automation/AI_SCHEDULING_GUIDE.md) - AI直接调度GitHub Actions（研发阶段首选）
  - 🤖 [云端训练自动化方案指南](docs/cloud-automation/CLOUD_DEVELOPMENT_AUTOMATION_GUIDE.md) - 完全自动化方案对比
  - ☁️ [云端开发环境指南](docs/cloud-automation/CLOUD_DEVELOPMENT_GUIDE.md) - 免费方案优先
  - 🤖 [Augment Remote Agent使用指南](docs/cloud-automation/AUGMENT_REMOTE_AGENT_GUIDE.md) - AI辅助开发工具
- 🧠 **[策略系统](src/tic-tac-toe/strategy/)** - AI算法实现和训练工具

## 🎯 项目亮点

### AI辅助井字棋系统
- ✅ **多策略AI分析**：Minimax、Q-Learning、防守、贪心等策略
- ✅ **用户友好界面**：美观的ASCII艺术界面和直观操作
- ✅ **多种输入格式**：支持字母坐标、数字坐标、数字位置
- ✅ **实时分析**：每步后自动提供AI建议和策略解释
- ✅ **教学功能**：详细的决策理由和策略学习建议
- ✅ **TypeScript实现**：类型安全和现代化代码架构

### Othello AI助手系统
- ✅ **5种AI策略**：随机、贪心、启发式、极小极大、Q学习策略
- ✅ **3种游戏模式**：人机对战、AI对战、演示模式
- ✅ **智能分析系统**：实时AI建议和详细策略解释
- ✅ **多种输入格式**：字母坐标、数字坐标、位置编号
- ✅ **API服务器**：完整的RESTful API接口
- ✅ **完整测试覆盖**：API测试、策略测试、游戏流程测试
- ✅ **统一TypeScript架构**：与井字棋AI助手保持一致

### 技术架构
- 🏗️ **模块化设计**：清晰的组件分离和职责定义
- 🔌 **可扩展架构**：支持添加新游戏和AI策略
- 🎯 **策略适配器**：统一的策略接口和类型转换
- 📊 **性能优化**：高效的算法实现和缓存机制

## 🔧 开发环境

### 环境要求
- Node.js (16.x以上)
- TypeScript 4.5+
- 现代终端支持（用于最佳显示效果）

### 开发工具
```bash
# 安装依赖
npm install

# 编译TypeScript（全仓，当前存在历史债务）
npm run build

# 麻将 Web UI 子系统发布检查
npm run majiang:release-check

# 运行测试
npm test

# 开发模式（自动重编译）
npm run dev
```

### 麻将游戏调试
麻将游戏支持调试模式，用于分析和修复游戏问题：

```bash
# 启用调试模式
npm start -- --debug

# 启用调试和单步执行模式
npm start -- --debug --step
```

调试日志以 `[DEBUG]:` 开头，帮助追踪游戏状态变化和定位问题。

## 🤝 贡献指南

欢迎贡献代码和改进建议！请查看各个子项目的文档了解具体的开发指南。

### 项目结构
- `src/majiang/` - 麻将游戏核心实现
- `src/tic-tac-toe/` - 井字棋游戏和AI策略
- `src/othello/` - Othello AI助手系统
- `src/ai-assistant/` - AI辅助游戏框架
- `scripts/tic-tac-toe/` - 井字棋MVP工具和适配器
- `docs/` - 用户文档和架构说明
