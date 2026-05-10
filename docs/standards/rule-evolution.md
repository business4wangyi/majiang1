# 规则演进（需求 -> 规则 -> 验证）

## 目标
建立“需求到规则”的可追踪闭环，确保规则持续可执行、可验证、可迭代。

## 状态模型
- 草案：规则刚提出，尚未进入硬约束。
- 试行：规则在日常任务中试运行，收集问题。
- 强制：规则纳入门禁与每日治理。
- 废弃：规则被替换或不再适用，保留迁移说明。

## 映射矩阵（需求 -> 规则 -> 验证方式）

### 需求来源文档
- docs/requirements/majiang-web-ui-需求设计迭代.md

### 规范正文文档
- docs/standards/README.md
- docs/standards/rules/development.md
- docs/standards/rules/git-mcp-automation.md
- docs/standards/rules/desktop-commander-mcp-priority.md
- docs/standards/testing/quality.md

### 映射关系
1. 需求：统一规范入口与优先级
- 规则：docs/standards/README.md、docs/standards/rules/development.md
- 状态：强制
- 验证方式：每日 `scan` 检查规则分层与入口一致性

2. 需求：自动化任务的 Git 操作安全与提交流程
- 规则：docs/standards/rules/git-mcp-automation.md
- 状态：强制
- 验证方式：脚本扫描危险 Git 命令模式 + 人工 review

3. 需求：长时间任务执行工具优先级
- 规则：docs/standards/rules/desktop-commander-mcp-priority.md
- 状态：试行
- 验证方式：在任务报告中记录工具选择与替代原因

4. 需求：测试与质量保障闭环
- 规则：docs/standards/testing/quality.md
- 状态：强制
- 验证方式：`npm test` 回归记录 + 每日治理报告引用

## 迭代节奏
- 新需求进入前：先补映射，再开始实现。
- 每日扫描后：将中高优先级问题回写到本文件。
- 周度复盘：评估试行规则是否升级为强制，或进入废弃。

## 变更记录
- 2026-05-08：初次建立规则演进文档，补齐 fit 必需闭环结构。
