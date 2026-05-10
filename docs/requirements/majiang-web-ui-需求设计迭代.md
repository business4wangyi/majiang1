# 麻将 Web UI 需求设计迭代说明

## 文档定位
- 类型：需求/设计/迭代文档
- 目标：为规范适配度（fit）提供可追踪的需求输入
- 关联模块：`docs/majiang/`

## 需求摘要
1. 需要确保麻将 Web UI 与核心规则层解耦，UI 不重写规则判定。
2. 需要明确测试入口与每日回归证据链，保证改动可验证。
3. 需要建立规范演进闭环，避免规则孤岛。

## 设计与实现约束
- 采用共享规范正文作为唯一事实源：`docs/standards/`。
- IDE 入口文件仅引读，不重复承载规范正文。
- 高风险操作遵循保守策略，禁止破坏性 Git 命令。

## 迭代计划
- 迭代 1：补齐规则演进文档与映射矩阵。
- 迭代 2：按每日扫描结果修复中高优先级债务。
- 迭代 3：将高频问题沉淀为可执行检查项。

## 验证方式
- 命令：`bash /Users/felixfan/.codex/skills/project-standards-governance/scripts/standards_guard.sh fit`
- 命令：`bash /Users/felixfan/.codex/skills/project-standards-governance/scripts/standards_guard.sh scan`
- 验收标准：`fit` 与 `scan` 退出码均为 `0`。
