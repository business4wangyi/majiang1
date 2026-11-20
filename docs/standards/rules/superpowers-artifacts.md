# Superpowers / Spec 产物入库

> **R1** — 涉及设计规格（spec）、实现计划、brainstorm / SDD 工作区时 **SHOULD Read**；提交相关产物时 **MUST** 遵守。

## 目标

把可复用的设计与过程产物写入仓库，便于跨会话、跨 Agent 管理与追溯。  
**入库 ≠ 交付验收**：companion mockup 仍可不计入视觉冲顶，但应可版本管理。

## 必须入库（SSOT / 过程可追溯）

| 路径 | 含义 |
| --- | --- |
| `docs/superpowers/specs/` | 设计规格 SSOT（Single Source of Truth，唯一事实来源） |
| `docs/superpowers/plans/` | 实现计划与任务切片 |
| `.superpowers/sdd/` | SDD（Subagent-Driven Development）brief / report / review 包 |
| `.superpowers/brainstorm/**/content/` | brainstorm companion HTML / 示意稿 |

完成设计批准、计划落盘或 SDD 任务收口后，上述变更须随功能/文档一并提交（用户明确要求阶段性保存时同）。

## 禁止入库（运行时 / 敏感）

由 `.superpowers/.gitignore` 拦截，Agent **不得** `git add -f` 强加：

- `**/state/`（本地预览服务状态）
- `.last-token`、`.last-port`
- `*.pid`、`*.log`
- 其他 Token / 密钥明文（见 `security-baseline.md`）

## 与提交判定的关系

- 判定权威仍是 [`commit-policy.md`](commit-policy.md)（E0）
- 本文件只补充：**允许且应当**提交的产物范围，以及**禁止**提交的运行时文件
- 产品文档中「不入交付验收」**不**等于「不入 Git」

## 冲突裁决

- 旧计划/评论写「don't commit `.superpowers/`」→ 以本文件为准（2026-11-20 起强制入库可管理产物）
