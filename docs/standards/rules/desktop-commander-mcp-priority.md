# Desktop Commander MCP 优先规则（共享正文）

## 核心要求
以下任务类型优先使用 Desktop Commander MCP 工具执行：
- 训练任务（如 AlphaZero、机器学习训练）
- 编译任务
- 测试任务
- 长时间运行进程

## 推荐工具集
- `start_process_desktop-commander`
- `interact_with_process_desktop-commander`
- `read_process_output_desktop-commander`
- `force_terminate_desktop-commander`
- `list_sessions_desktop-commander`

## 限制项
对上述任务，避免使用不具备同等会话管理能力的普通终端进程工具。

## 执行要求
- 相关任务默认采用 Desktop Commander MCP。
- 若环境不支持 MCP，需要明确说明并提供替代方案。
- 重要变更遵循仓库统一冲突处理与确认规则（见根 `AGENTS.md`）。

## 说明
- 历史入口文件：`.cursor/rules/desktop-commander-mcp-priority.mdc`
- 该入口文件应仅做引读，不再承载完整正文。
