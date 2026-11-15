# 共享研发规范（Single Source of Truth）

本目录是跨 IDE 共享的研发规范正文入口，避免规则耦合在单一 IDE 私有目录中。

## 优先级（高 → 低）

1. 仓库根 `AGENTS.md`
2. `docs/standards/overrides/`（若存在）
3. `docs/standards/rules/`（含 E0）与 `docs/product/`
4. `docs/standards/testing/`
5. `.cursor/rules/*.mdc` 等 IDE 薄入口

## 规则分级

| tier | 含义 | 落点 |
| --- | --- | --- |
| **E0** | 强制 MUST Read | `commit-policy` / `communication-for-beginners` / `delivery-flow` |
| **R1** | 触发或常用 | `development` / `security` / `testing` / `git` / `mermaid` 等 |
| **触发表** | 按任务装载 | [`rules/index.md`](rules/index.md) |

## 规范索引

- 任务触发表：`docs/standards/rules/index.md`
- 研发分层：`docs/standards/rules/development.md`
- 提交判定：`docs/standards/rules/commit-policy.md`
- Git 自动化：`docs/standards/rules/git-mcp-automation.md`
- 安全红线：`docs/standards/rules/security-baseline.md`
- 沟通与决策卡：`docs/standards/rules/communication-for-beginners.md`
- Mermaid：`docs/standards/rules/mermaid-rules.md`
- 长任务工具：`docs/standards/rules/desktop-commander-mcp-priority.md`
- 测试质量：`docs/standards/testing/quality.md`
- 规则演进：`docs/standards/rule-evolution.md`
- **定封顶落地流程**：`docs/product/delivery-flow.md`

## 使用约定

- `AGENTS.md`、`.cursor/rules/*.mdc` 只做引读，不重复正文
- 新增/升级规则：先改触发表 + `rule-evolution.md`，再改薄入口
- 日常门禁：`project-standards-governance` 的 `gate` / `scan` / `fit`
