# 规则清单（R2 任务触发表）

> 按任务类型读取对应规则。E0 = 强制 MUST Read；R1 = 常用 SHOULD/按触发 MUST。  
> 正文均在本目录或 `docs/standards/testing/`、`docs/product/`；`.cursor/rules/*.mdc` 仅薄引读。

## 任务触发表

| 任务类型 | 触发规则 | Agent 义务 | tier |
| --- | --- | --- | --- |
| 解释 / 说明 / 设计 / 交接 / brainstorming / 给用户结论 | [communication-for-beginners.md](communication-for-beginners.md) | **MUST Read** | E0 |
| commit / git commit / 提交 | [commit-policy.md](commit-policy.md) | **MUST Read** | E0 |
| 抬天花板 / 波次 / 脊骨 / 页级毕业 / UI 层 U0·U1·U2 / 冲顶收官 | [../../product/delivery-flow.md](../../product/delivery-flow.md) | **MUST Read** | E0 |
| security / 敏感 / 密钥 / Token | [security-baseline.md](security-baseline.md) | **MUST Read** | R1 |
| coding / Write / 改 `src/**` / 分层 | [development.md](development.md) | **MUST Read** | R1 |
| 测试 / 回归 / 验收测例 | [../testing/quality.md](../testing/quality.md) | **MUST Read** | R1 |
| spec / superpowers / brainstorm / SDD 产物入库 | [superpowers-artifacts.md](superpowers-artifacts.md) | **SHOULD Read**；提交产物时 **MUST** | R1 |
| mermaid / 流程图 / 架构图 | [mermaid-rules.md](mermaid-rules.md) | **SHOULD Read** | R1 |
| git MCP / gh pr / 自动化提交 | [git-mcp-automation.md](git-mcp-automation.md) | **SHOULD Read** | R1 |
| 长任务 / Desktop Commander / 进程工具 | [desktop-commander-mcp-priority.md](desktop-commander-mcp-priority.md) | **SHOULD Read** | R1 |

## 规则清单

| 规则文件 | tier | 说明 |
| --- | --- | --- |
| [communication-for-beginners.md](communication-for-beginners.md) | E0 | 面向非工程读者的说明与决策卡 |
| [commit-policy.md](commit-policy.md) | E0 | 何时可提交、中文提交说明 |
| [../../product/delivery-flow.md](../../product/delivery-flow.md) | E0 | 目标封顶 → 波次 → 切片落地流程 |
| [development.md](development.md) | R1 | 分层、IDE 入口、冲突处理 |
| [security-baseline.md](security-baseline.md) | R1 | 安全红线（本仓 Node/TS/Web） |
| [mermaid-rules.md](mermaid-rules.md) | R1 | 图语法硬约束 |
| [git-mcp-automation.md](git-mcp-automation.md) | R1 | Git 自动化提交流程 |
| [superpowers-artifacts.md](superpowers-artifacts.md) | R1 | spec / plans / `.superpowers` 产物入库 |
| [desktop-commander-mcp-priority.md](desktop-commander-mcp-priority.md) | R1 | 长任务工具优先级 |
| [../testing/quality.md](../testing/quality.md) | R1 | 测试与质量保障 |

## 定封顶说明

本清单即本仓**规则面封顶**：新增规则须先写入本表与 `docs/standards/rule-evolution.md`，再改 IDE 薄入口。  
禁止把规范正文直接堆进 `.cursor/rules/*.mdc`。
