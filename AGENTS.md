# 智能体工作约定

## 规范读取要求
- 优先读取 `docs/standards/` 下的规范正文。
- IDE 私有规则文件（如 `.cursor/rules/*.mdc`、`.codex/AGENTS.md`）仅作为入口与补充，不应替代正文规范。

## 规范优先级
1. 本文件 `AGENTS.md`
2. `docs/standards/`（共享规范正文，单一事实源）
3. IDE 私有入口（`.cursor/rules/*.mdc`、`.codex/AGENTS.md`、`.augment/rules/*`）
4. 其他参考文档（`README.md`、各子目录使用指南）

## 冲突处理
- 若共享规范与 IDE 私有规则冲突：以本文件和 `docs/standards/` 为准。
- 若同层级规范冲突：优先采用“更具体、作用域更小”的规则，并在输出中说明取舍原因。
- 涉及安全、破坏性操作或高风险改动时，优先采用更保守规则。

## 输出要求
- 在方案说明、代码说明、评审结论中，需明确引用所依据的规范路径（例如：`docs/standards/rules/development.md`）。
- 若存在规范冲突，必须在输出中给出冲突点、采用规则和理由。
