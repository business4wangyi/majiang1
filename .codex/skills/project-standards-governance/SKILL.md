---
name: project-standards-governance
description: 持续扫描工程规范并对新任务执行前后门禁。用户提到规范治理、规则扫描、合规检查、任务守规、提交前校验、自动修复、重构对齐规范时必须使用。
---

# Project Standards Governance

用于在本项目中持续执行规则治理:
- `guardian`: 规则装载与冲突裁决
- `scan`: 全量巡检与债务盘点
- `gate`: 任务前后门禁
- `refactor`: 违规后的结构化修复

## Rule Source And Priority

按以下顺序装载并裁决规则:
1. `<project-root>/AGENTS.md`
2. `<project-root>/docs/standards/`
3. IDE 私有入口（仅补充）:
   - `<project-root>/.cursor/rules/*.mdc`
   - `<project-root>/.codex/AGENTS.md`
4. 其他文档（仅参考）

如果规则冲突:
- 优先采用更具体、作用域更小的规则
- 涉及安全或破坏性操作时采用更保守规则
- 在输出中明确记录冲突点、采用规则、理由

## Modes

### 1) `scan` (Periodic Full Scan)

用于巡检存量代码与流程:
- 结构与分层是否符合 `docs/standards/rules/development.md`
- Git 自动化与提交流程是否符合 `docs/standards/rules/git-mcp-automation.md`
- 工具优先级是否符合 `docs/standards/rules/desktop-commander-mcp-priority.md`

执行:
```bash
bash <skill-root>/scripts/standards_guard.sh scan
```

### 2) `gate` (Task Pre/Post Gate)

用于新任务守规:
- `pre`:
  - 将任务目标映射到具体规则条目
  - 给出执行边界和风险提示
- `post`:
  - 检查变更文件是否违反规则
  - 若不通过，给出自动修复或手动修复动作

执行:
```bash
bash <skill-root>/scripts/standards_guard.sh gate
```

### 3) `refactor` (Repair Path)

当出现违规项时:
- 优先做小范围重构，避免大爆炸改动
- 先修高风险违规，再修低风险风格问题
- 每次修复后重新执行 `gate`，直到 `pass`

## Required Output

每次运行都输出统一报告，字段不可省略，且报告内容必须使用中文:

```markdown
# 规范治理报告
## 运行模式
扫描 | 门禁
## 检查结论
通过 | 失败
## 违规项
- 文件:
  规则路径:
  原因:
  严重级别: 高 | 中 | 低
## 规则冲突
- 冲突点:
  采用规则:
  理由:
## 修复方案
- 自动修复:
- 手动修复:
## 规则依据
- <project-root>/AGENTS.md
- <project-root>/docs/standards/rules/development.md
- <project-root>/docs/standards/rules/git-mcp-automation.md
- <project-root>/docs/standards/rules/desktop-commander-mcp-priority.md
```

## Automation Guidance

推荐两层节奏:
1. 任务级: 每次任务结束后执行 `gate`
2. 周期级: 每天一次执行 `scan`

若 `gate` 为 `fail`:
- 阻断自动提交
- 先修复再提交

## Notes

- 此 skill 是治理编排层，不替代具体重构能力。
- 执行修复时可配合 `code-refactoring` skill。
- `project-root` 由脚本在运行时自动识别（优先 Git 根目录，其次当前目录）。
