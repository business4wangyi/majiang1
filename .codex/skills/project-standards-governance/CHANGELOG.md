# Changelog

## 2026-04-19

### Added
- Initial release of `project-standards-governance` skill.
- Added `guardian` orchestration logic in `SKILL.md` with rule loading priority and conflict handling.
- Added `scan`, `gate`, and `refactor` mode definitions.
- Added required report output schema with mandatory rule-path references.
- Added executable checker entrypoint: `scripts/standards_guard.sh`.
- Added report template: `templates/report.md`.
- Added usage guide: `USAGE.md` for task-level and daily-level integration.

### Changed
- `scripts/standards_guard.sh` now auto-detects `project-root` at runtime (prefers Git top-level, falls back to current directory).
- Removed hardcoded project paths from skill docs and usage examples to support global skill reuse.
- Report template now renders dynamic absolute rule-reference paths from the detected project.
- Report output path is project-isolated by default: `<project-root>/logs/standards-governance-report.md`.
- Added optional `STANDARDS_GUARD_REPORT` environment variable for custom per-run report targets.
- Report content is now fully localized in Chinese, including section titles, field labels, default messages, mode text, and decision text.
- Failure gating now uses Chinese severity labels (`高`/`中`) and Chinese decision values (`通过`/`失败`).

### Behavior Notes
- `scan` and `gate` both generate `<project-root>/logs/standards-governance-report.md` unless overridden.
- If medium/high violations exist, script exits non-zero to support pipeline gating.

## 2026-04-20

### Changed
- `scripts/standards_guard.sh` distinguishes `scan` and `gate` execution semantics: `scan` performs repository-wide巡检 while `gate` enforces task pre/post checks.
- `scan` now scans the repository root (with common exclusions) for destructive git command patterns instead of only `scripts/` and `src/`.
- `gate pre` now outputs explicit task-goal mapping and risk boundaries; when `STANDARDS_GUARD_TASK` is missing it emits a medium-severity finding to prevent false-pass.
- `gate post` now validates the real changed-file set (staged + unstaged + untracked) and performs file-level checks for destructive commands and unresolved merge markers.
- Rule-conflict section is now dynamically generated from detected signals instead of static template text.
- Report template adds `门禁明细` section and dynamic placeholders for conflict block and fix actions.

### Behavior Notes
- `gate` defaults to `both` phase and can be narrowed with `STANDARDS_GUARD_GATE_PHASE=pre|post`.
- If medium/high findings exist in violations or conflict-derived governance checks, the script exits non-zero to support blocking gates.

## 2026-04-20 (误报修复补充)

### Changed
- `gate post` 的冲突标记检测从宽泛子串匹配改为行首 Git 合并标记匹配（`<<<<<<< ` / `=======` / `>>>>>>> `），降低普通分隔线文本误报。
- `scan` 的破坏性命令检测默认排除文档语料（`docs/**`, `*.md`, `*.mdx`, `*.txt`），避免将说明文档中的示例命令判定为高危违规。

### Behavior Notes
- `scan` 仍对可执行脚本与源码文件执行高风险命令检测，但不再因文档示例导致失败。
- `gate post` 仅对更接近真实未解决合并冲突的标记形态告警，减少正常日志/文本分隔符误判。
- Strengthened `gate post` with high-severity blocking when core paths (`src/main.py`, `src/agents/`, `src/telemetry/`, `src/services/`) change without corresponding `tests/` changes.
- Restricted destructive-command and conflict-marker content scans in `gate post` to executable/source files only (`.sh/.bash/.zsh/.py/.js/.ts/.tsx/.jsx`).
- Corrected default conflict-priority wording to `AGENTS.md > docs/standards/rules > .cursor/rules > IDE 其他私有入口` to match project AGENTS hierarchy.
- Improved `gate pre` task mapping with concrete core-path and domain keywords (`src/main.py`, `telemetry`, `services`, `agents`, `tests/`, `api`, `安全`, `性能`), so rule mapping is input-driven rather than generic fallback.
- Reworked `scripts/standards_guard.sh` as a deterministic baseline to eliminate legacy behavior drift between report output and gate logic.
- Removed non-project-specific hard checks for `docs/standards/testing` and `docs/standards/workflow`; governance now aligns with project `AGENTS.md` and `docs/standards/rules/*` requirements.
- Ensured `gate post` destructive-command scanning only targets executable/source files in the changed set, preventing markdown policy text from false high-risk hits.
- Aligned conflict output priority with project hierarchy: `AGENTS.md > docs/standards/rules > .cursor/rules > IDE 其他私有入口`.
