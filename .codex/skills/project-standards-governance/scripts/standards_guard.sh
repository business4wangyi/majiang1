#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_TEMPLATE="$SKILL_ROOT/templates/report.md"

MODE="${1:-scan}"
GATE_PHASE="${STANDARDS_GUARD_GATE_PHASE:-both}"
TASK_GOAL="${STANDARDS_GUARD_TASK:-}"
DESTRUCTIVE_CMD_REGEX='(^|[;&[:space:]])git[[:space:]]+(reset[[:space:]]+--hard|clean[[:space:]]+-fdx?)($|[;&[:space:]])'
MERGE_CONFLICT_REGEX='^(<<<<<<<[[:space:]]|=======|>>>>>>>[[:space:]])'

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || pwd)"
REPORT_OUT="${STANDARDS_GUARD_REPORT:-$ROOT/logs/standards-governance-report.md}"

AGENTS_FILE="$ROOT/AGENTS.md"
DEV_RULE="$ROOT/docs/standards/rules/development.md"
GIT_RULE="$ROOT/docs/standards/rules/git-mcp-automation.md"
MCP_RULE="$ROOT/docs/standards/rules/desktop-commander-mcp-priority.md"

mkdir -p "$(dirname "$REPORT_OUT")"

append_violation() {
  local out_file="$1"
  local file="$2"
  local rule_path="$3"
  local reason="$4"
  local level="$5"

  cat >> "$out_file" <<EOF_V
- 文件: $file
  规则路径: $rule_path
  原因: $reason
  严重级别: $level
EOF_V
}

append_conflict() {
  local out_file="$1"
  local point="$2"
  local adopted="$3"
  local reason="$4"

  cat >> "$out_file" <<EOF_C
- 冲突点: $point
  采用规则: $adopted
  理由: $reason
EOF_C
}

check_required_files() {
  local missing=0
  for file in "$AGENTS_FILE" "$DEV_RULE" "$GIT_RULE" "$MCP_RULE"; do
    if [[ ! -f "$file" ]]; then
      echo "缺少规则文件: $file"
      missing=1
    fi
  done
  return "$missing"
}

collect_changed_files() {
  local out_file="$1"
  : > "$out_file"

  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    {
      git -C "$ROOT" diff --name-only --cached
      git -C "$ROOT" diff --name-only
      git -C "$ROOT" ls-files --others --exclude-standard
    } | awk 'NF' | sort -u > "$out_file"
  fi
}

map_task_rules_and_risk() {
  local task="$1"
  local rules=()
  local risks=()

  if [[ "$task" =~ 提交|commit|git|门禁|发布|上线 ]]; then
    rules+=("$GIT_RULE")
    risks+=("提交链路须避免破坏性 Git 命令并满足提交前校验")
  fi

  if [[ "$task" =~ 训练|编译|测试|长时间|long[[:space:]-]*run|mcp ]]; then
    rules+=("$MCP_RULE")
    risks+=("训练/编译/测试/长任务需校验 MCP 工具优先与可观测性")
  fi

  if [[ "$task" =~ 架构|重构|目录|分层|模块|开发|src/main\.py|telemetry|services|agents|数据库|安全|权限|性能|监控|接口|api|tests/ ]]; then
    rules+=("$DEV_RULE")
    risks+=("涉及核心链路改动，需满足分层约束并补齐关联测试或验证")
  fi

  if [[ ${#rules[@]} -eq 0 ]]; then
    rules+=("$DEV_RULE" "$GIT_RULE")
    risks+=("任务目标未命中关键词，按保守策略映射开发与提交流程规则")
  fi

  printf '%s\n' "${rules[@]}" | awk '!seen[$0]++'
  printf '%s\n' '---'
  printf '%s\n' "${risks[@]}" | awk '!seen[$0]++'
}

build_scan_violations() {
  local out_file="$1"

  if [[ ! -d "$ROOT/docs/standards" ]]; then
    append_violation "$out_file" "docs/standards" "$AGENTS_FILE" "共享规范目录缺失" "高"
  fi

  local risky
  risky="$(rg -n --hidden --no-ignore \
    -g '!.git' -g '!node_modules' -g '!dist' -g '!build' -g '!coverage' -g '!logs' \
    -g '!**/*.md' -g '!**/*.mdx' -g '!**/*.txt' -g '!**/docs/**' \
    -e "$DESTRUCTIVE_CMD_REGEX" "$ROOT" 2>/dev/null | head -n 8 || true)"

  if [[ -n "$risky" ]]; then
    local risky_files
    risky_files="$(printf '%s\n' "$risky" | cut -d: -f1 | sed "s|$ROOT/||g" | sort -u | paste -sd ', ' -)"
    append_violation "$out_file" "${risky_files:-全仓库}" "$GIT_RULE" "全仓扫描发现潜在破坏性 Git 命令（示例：$(printf '%s' "$risky" | head -n 1)）" "高"
  fi
}

build_gate_violations_and_details() {
  local violations_file="$1"
  local details_file="$2"

  : > "$details_file"

  local goal="${TASK_GOAL:-未提供（可通过 STANDARDS_GUARD_TASK 指定）}"
  local mappings_output mapping_block risk_block
  mappings_output="$(map_task_rules_and_risk "$goal")"
  mapping_block="$(printf '%s\n' "$mappings_output" | awk 'BEGIN{sep=0} /^---$/{sep=1; next} sep==0 {print}')"
  risk_block="$(printf '%s\n' "$mappings_output" | awk 'BEGIN{sep=0} /^---$/{sep=1; next} sep==1 {print}')"

  local mapping_line risk_line
  mapping_line="$(printf '%s\n' "$mapping_block" | paste -sd '; ' -)"
  risk_line="$(printf '%s\n' "$risk_block" | paste -sd '; ' -)"

  if [[ "$GATE_PHASE" == "pre" || "$GATE_PHASE" == "both" ]]; then
    if [[ "$goal" == "未提供（可通过 STANDARDS_GUARD_TASK 指定）" ]]; then
      append_violation "$violations_file" "任务上下文" "$AGENTS_FILE" "gate pre 未提供任务目标，规则映射精度受限" "中"
    fi
  fi

  local changed_count=0
  local checked_scope="无"
  local post_result="未执行（phase=pre）"

  if [[ "$GATE_PHASE" == "post" || "$GATE_PHASE" == "both" ]]; then
    local changed_tmp
    changed_tmp="$(mktemp)"
    collect_changed_files "$changed_tmp"

    changed_count="$(wc -l < "$changed_tmp" | tr -d ' ')"

    if [[ "$changed_count" -eq 0 ]]; then
      append_violation "$violations_file" "变更集" "$DEV_RULE" "gate post 未检测到变更文件，无法执行文件级门禁" "中"
      post_result="失败（无可检查变更）"
    else
      checked_scope="$(head -n 20 "$changed_tmp" | paste -sd ', ' -)"
      post_result="已执行（检查变更文件中的高风险命令与冲突标记）"

      local has_core_change=0
      local has_test_change=0
      local core_files=()
      local scan_targets=()
      local rel_path

      while IFS= read -r rel_path; do
        [[ -z "$rel_path" ]] && continue

        if [[ "$rel_path" =~ ^tests/ ]]; then
          has_test_change=1
        fi

        if [[ "$rel_path" =~ ^src/(main\.py|agents/|telemetry/|services/) ]]; then
          has_core_change=1
          core_files+=("$rel_path")
        fi

        if [[ "$rel_path" =~ \.(sh|bash|zsh|py|js|ts|tsx|jsx)$ ]] && [[ -f "$ROOT/$rel_path" ]]; then
          scan_targets+=("$ROOT/$rel_path")
        fi
      done < "$changed_tmp"

      if [[ "$has_core_change" -eq 1 && "$has_test_change" -eq 0 ]]; then
        append_violation "$violations_file" "$(printf '%s\n' "${core_files[@]}" | paste -sd ';' -)" "$GIT_RULE" "检测到核心链路变更但未发现 tests/ 相关改动，未满足提交前关联校验要求" "高"
      fi

      if [[ "${#scan_targets[@]}" -gt 0 ]]; then
        local risky_in_changed
        risky_in_changed="$(rg -n -e "$DESTRUCTIVE_CMD_REGEX" "${scan_targets[@]}" 2>/dev/null | head -n 5 || true)"
        if [[ -n "$risky_in_changed" ]]; then
          append_violation "$violations_file" "$(printf '%s\n' "$risky_in_changed" | cut -d: -f1 | sed "s|$ROOT/||g" | sort -u | paste -sd ', ' -)" "$GIT_RULE" "变更文件中存在潜在破坏性 Git 命令（示例：$(printf '%s' "$risky_in_changed" | head -n 1)）" "高"
        fi

        local unresolved
        unresolved="$(rg -n -e "$MERGE_CONFLICT_REGEX" "${scan_targets[@]}" 2>/dev/null | head -n 5 || true)"
        if [[ -n "$unresolved" ]]; then
          append_violation "$violations_file" "$(printf '%s\n' "$unresolved" | cut -d: -f1 | sed "s|$ROOT/||g" | sort -u | paste -sd ', ' -)" "$DEV_RULE" "变更文件存在未解决冲突标记" "高"
        fi
      fi
    fi

    rm -f "$changed_tmp"
  fi

  cat > "$details_file" <<EOF_D
- pre:
  - 任务目标: $goal
  - 规则映射: ${mapping_line:-无}
  - 执行边界与风险: ${risk_line:-无}
- post:
  - 变更文件数量: $changed_count
  - 检查范围: $checked_scope
  - 检查结果: $post_result
EOF_D
}

build_conflicts() {
  local out_file="$1"
  : > "$out_file"
  append_conflict "$out_file" "无" "AGENTS.md > docs/standards/rules > .cursor/rules > IDE 其他私有入口" "未检测到可机器判定的规则冲突"
}

ensure_default_violation() {
  local out_file="$1"
  if [[ ! -s "$out_file" ]]; then
    append_violation "$out_file" "无" "无" "未发现违规项" "低"
  fi
}

decide_result() {
  local violations_file="$1"
  if rg -n '严重级别: 高|严重级别: 中' "$violations_file" >/dev/null 2>&1; then
    echo "失败"
  else
    echo "通过"
  fi
}

run_mode() {
  local mode="$1"
  local violations_tmp conflicts_tmp gate_details_tmp
  violations_tmp="$(mktemp)"
  conflicts_tmp="$(mktemp)"
  gate_details_tmp="$(mktemp)"

  : > "$violations_tmp"

  case "$mode" in
    scan)
      build_scan_violations "$violations_tmp"
      cat > "$gate_details_tmp" <<'EOF_G'
- 不适用: scan 模式不输出 pre/post 门禁明细
EOF_G
      ;;
    gate)
      build_gate_violations_and_details "$violations_tmp" "$gate_details_tmp"
      ;;
    *)
      append_violation "$violations_tmp" "模式" "$AGENTS_FILE" "不支持的检查模式: $mode" "高"
      ;;
  esac

  build_conflicts "$conflicts_tmp"
  ensure_default_violation "$violations_tmp"

  local decision
  decision="$(decide_result "$violations_tmp")"

  local mode_zh="$mode"
  if [[ "$mode" == "scan" ]]; then
    mode_zh="扫描"
  elif [[ "$mode" == "gate" ]]; then
    mode_zh="门禁"
  fi

  local auto_fix manual_fix
  if [[ "$decision" == "通过" ]]; then
    auto_fix="维持当前状态，按周期继续执行 scan 并在任务收尾执行 gate。"
    manual_fix="如任务目标发生变化，补充 STANDARDS_GUARD_TASK 提升 pre 映射准确性。"
  else
    auto_fix="优先修复高/中风险项后重跑。"
    manual_fix="依据违规项中的规则路径逐项整改，并记录冲突裁决理由。"
  fi

  awk \
    -v mode="$mode_zh" \
    -v decision="$decision" \
    -v vf="$violations_tmp" \
    -v cf="$conflicts_tmp" \
    -v gf="$gate_details_tmp" \
    -v auto_fix="$auto_fix" \
    -v manual_fix="$manual_fix" \
    -v agents_file="$AGENTS_FILE" \
    -v dev_rule="$DEV_RULE" \
    -v git_rule="$GIT_RULE" \
    -v mcp_rule="$MCP_RULE" \
    '
    BEGIN {
      while ((getline line < vf) > 0) { violations = violations line "\n" }
      close(vf)
      while ((getline line < cf) > 0) { conflicts = conflicts line "\n" }
      close(cf)
      while ((getline line < gf) > 0) { gate_details = gate_details line "\n" }
      close(gf)
    }
    {
      gsub("{{MODE}}", mode)
      gsub("{{DECISION}}", decision)
      gsub("{{AUTO_FIX}}", auto_fix)
      gsub("{{MANUAL_FIX}}", manual_fix)
      gsub("{{AGENTS_FILE}}", agents_file)
      gsub("{{DEV_RULE}}", dev_rule)
      gsub("{{GIT_RULE}}", git_rule)
      gsub("{{MCP_RULE}}", mcp_rule)

      if (index($0, "{{VIOLATIONS_BLOCK}}") > 0) {
        printf "%s", violations
      } else if (index($0, "{{CONFLICTS_BLOCK}}") > 0) {
        printf "%s", conflicts
      } else if (index($0, "{{GATE_DETAILS_BLOCK}}") > 0) {
        printf "%s", gate_details
      } else {
        print $0
      }
    }
  ' "$REPORT_TEMPLATE" > "$REPORT_OUT"

  rm -f "$violations_tmp" "$conflicts_tmp" "$gate_details_tmp"

  echo "报告已生成: $REPORT_OUT"
  if [[ "$decision" == "失败" ]]; then
    exit 2
  fi
}

main() {
  check_required_files

  case "$MODE" in
    scan|gate)
      run_mode "$MODE"
      ;;
    *)
      echo "不支持的模式: $MODE（仅支持 scan 或 gate）"
      exit 1
      ;;
  esac
}

main
