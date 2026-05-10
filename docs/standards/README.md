# 共享研发规范（Single Source of Truth）

本目录是跨 IDE 共享的研发规范正文入口，避免规则耦合在单一 IDE 私有目录中。

## 规范索引
- 研发规则与协作约定：`docs/standards/rules/development.md`
- Git 提交流程约定：`docs/standards/rules/git-mcp-automation.md`
- 进程执行工具优先级：`docs/standards/rules/desktop-commander-mcp-priority.md`
- 测试与质量保障：`docs/standards/testing/quality.md`
- 规则演进与需求映射：`docs/standards/rule-evolution.md`

## 使用约定
- `AGENTS.md`、`.cursor/rules/*.mdc` 等 IDE 入口文件应优先引读本目录内容。
- 若更新本目录规范，应同步检查 IDE 入口文件是否仍然有效且不冲突。
