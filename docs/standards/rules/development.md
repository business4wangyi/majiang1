# 研发规则与协作约定

本文件汇聚项目现有“研发规范”来源，作为 IDE 共享正文入口。

## 适用范围
- 适用于本仓库中的开发、重构、测试、文档与提交流程。
- 不包含业务运行规则（例如麻将胡牌判定等运行时规则）。

## 规范来源（当前生效）
- 总体架构与模块分层：`docs/ARCHITECTURE.md`
- 麻将目录结构约定：`docs/majiang/FOLDER_STRUCTURE.md`
- 黑白棋目录结构约定：`docs/othello/FOLDER_STRUCTURE.md`
- 井字棋架构决策：`docs/tic-tac-toe/ARCHITECTURE_DECISION.md`
- 井字棋目录结构与用户流程：`docs/tic-tac-toe/FOLDER_STRUCTURE.md`、`docs/tic-tac-toe/MVP_USER_GUIDE.md`
- 云端自动化与交付流程：`docs/cloud-automation/CLOUD_DEVELOPMENT_AUTOMATION_GUIDE.md`、`docs/cloud-automation/SETUP_GUIDE.md`、`docs/cloud-automation/DEPLOYMENT_GUIDE.md`
- Git 提交流程规范：`docs/standards/rules/git-mcp-automation.md`
- Desktop Commander 使用优先级：`docs/standards/rules/desktop-commander-mcp-priority.md`

## 入口文件职责约束
- IDE 入口文件（如 `AGENTS.md`、`.cursor/rules/*.mdc`）只做引读和冲突处理声明，不重复整段规范正文。
- 共享规范优先维护在 `docs/standards/`，以减少多处漂移。

## 冲突处理原则
1. 以仓库根 `AGENTS.md` 定义的优先级为准。
2. 同一层级冲突时，优先采用作用域更小、更具体的规则。
3. 遇到高风险操作，优先采用更保守规则并记录理由。
