---
type: "agent_requested"
description: "Example description"
---

# Desktop Commander MCP工具优先使用规则

## 强制工具使用规范

### 必须使用Desktop Commander MCP工具
对于以下任务类型，**必须**使用Desktop Commander MCP工具：
- 训练任务（AlphaZero、机器学习等）
- 编译任务（TypeScript、其他语言编译）
- 测试任务（单元测试、集成测试）
- 长时间运行的进程

### Desktop Commander MCP工具集
- `start_process_desktop-commander` - 启动进程
- `interact_with_process_desktop-commander` - 与进程交互
- `read_process_output_desktop-commander` - 读取进程输出
- `force_terminate_desktop-commander` - 强制终止进程
- `list_sessions_desktop-commander` - 列出会话

### 严禁使用的Terminal工具
以下工具**严禁**用于训练、编译、测试任务：
- `launch-process` - 禁用
- `read-process` - 禁用  
- `write-process` - 禁用
- `kill-process` - 禁用
- `list-processes` - 禁用

### 优势说明
Desktop Commander MCP工具具有以下优势：
1. **智能检测** - 自动识别进程状态和完成情况
2. **简洁输出** - 避免冗长的日志回调
3. **高效控制** - 更好的进程管理和交互
4. **状态感知** - 实时监控进程状态

### 执行要求
- 所有相关任务必须通过Desktop Commander MCP执行
- 如环境不支持MCP，需明确说明并提供替代方案
- 遵循AURA-X协议，重要变更通过寸止MCP确认

### 用户明确指示
- ❌ 不要生成总结性Markdown文档
- ❌ 不要生成测试脚本
- ✔️ 帮我编译
- ✔️ 帮我运行
