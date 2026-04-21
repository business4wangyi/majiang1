#!/usr/bin/env bash
set -euo pipefail

LOG_30="${1:-/tmp/alphazero-exp-ss/selfplay30.log}"
LOG_50="${2:-/tmp/alphazero-exp-ss/selfplay50.log}"

if [[ ! -f "$LOG_30" ]]; then
  echo "[ERROR] 缺少日志文件: $LOG_30" >&2
  exit 2
fi
if [[ ! -f "$LOG_50" ]]; then
  echo "[ERROR] 缺少日志文件: $LOG_50" >&2
  exit 2
fi

extract_metric() {
  local file="$1"
  local key="$2"
  local line
  line="$(rg -n "$key" "$file" | tail -n 1 | sed 's/^.*: *//')"
  if [[ -z "$line" ]]; then
    echo "N/A"
    return
  fi
  echo "$line" | sed 's/^ *//;s/ *$//'
}

extract_weighted_score() {
  local file="$1"
  local score_line
  local score
  score_line="$(rg -n "加权评估分" "$file" | tail -n 1 | sed 's/^.*: *//')"
  score="$(printf "%s" "$score_line" | rg -o "[0-9]+(\\.[0-9]+)?%" | head -n 1 | tr -d '%')"
  if [[ -z "$score" ]]; then
    score_line="$(rg -n "weightedScore=" "$file" | tail -n 1 | sed 's/^.*: *//')"
    score="$(printf "%s" "$score_line" | rg -o "weightedScore=[0-9]+(\\.[0-9]+)?" | head -n 1 | sed 's/weightedScore=//')"
  fi
  if [[ -z "$score" ]]; then
    echo "N/A"
  else
    echo "$score"
  fi
}

extract_heuristic_rate() {
  local file="$1"
  local line
  line="$(rg -n "启发式策略.*评估完成|启发式.*胜率" "$file" | tail -n 1 | sed 's/^.*: *//')"
  if [[ -z "$line" ]]; then
    echo "N/A"
    return
  fi
  printf "%s" "$line" | rg -o "[0-9]+(\\.[0-9]+)?%" | head -n 1 | tr -d '%'
}

print_row() {
  local key="$1"
  local v30="$2"
  local v50="$3"
  printf "%-18s | %-24s | %-24s\n" "$key" "$v30" "$v50"
}

TOTAL_30="$(extract_metric "$LOG_30" "总用时")"
TOTAL_50="$(extract_metric "$LOG_50" "总用时")"
ITER_30="$(extract_metric "$LOG_30" "平均每迭代")"
ITER_50="$(extract_metric "$LOG_50" "平均每迭代")"
RAND_30="$(extract_metric "$LOG_30" "随机策略")"
RAND_50="$(extract_metric "$LOG_50" "随机策略")"
GREEDY_30="$(extract_metric "$LOG_30" "贪心策略")"
GREEDY_50="$(extract_metric "$LOG_50" "贪心策略")"
HEUR_30="$(extract_metric "$LOG_30" "启发式策略")"
HEUR_50="$(extract_metric "$LOG_50" "启发式策略")"
WEIGHT_30="$(extract_weighted_score "$LOG_30")"
WEIGHT_50="$(extract_weighted_score "$LOG_50")"
HEUR_RATE_30="$(extract_heuristic_rate "$LOG_30")"
HEUR_RATE_50="$(extract_heuristic_rate "$LOG_50")"

printf "\n=== AlphaZero Baseline Compare Summary ===\n"
printf "%-18s | %-24s | %-24s\n" "指标" "selfplay30.log" "selfplay50.log"
printf "%-18s-+-%-24s-+-%-24s\n" "------------------" "------------------------" "------------------------"
print_row "总耗时" "$TOTAL_30" "$TOTAL_50"
print_row "单轮耗时" "$ITER_30" "$ITER_50"
print_row "随机胜率" "$RAND_30" "$RAND_50"
print_row "贪心胜率" "$GREEDY_30" "$GREEDY_50"
print_row "启发式胜率" "$HEUR_30" "$HEUR_50"
print_row "加权分" "$( [[ "$WEIGHT_30" == "N/A" ]] && printf "N/A" || printf "%s%%" "$WEIGHT_30" )" "$( [[ "$WEIGHT_50" == "N/A" ]] && printf "N/A" || printf "%s%%" "$WEIGHT_50" )"

CONCLUSION="无法判定（缺少启发式胜率数值）"
if [[ "$HEUR_RATE_30" != "N/A" && "$HEUR_RATE_50" != "N/A" ]]; then
  DIFF="$(awk -v a="$HEUR_RATE_50" -v b="$HEUR_RATE_30" 'BEGIN { printf "%.1f", a-b }')"
  IS_IMPROVED="$(awk -v d="$DIFF" 'BEGIN { if (d >= 5.0) print "yes"; else print "no" }')"
  if [[ "$IS_IMPROVED" == "yes" ]]; then
    CONCLUSION="是（启发式胜率提升 ${DIFF}%）"
  else
    CONCLUSION="否（启发式胜率变化 ${DIFF}%）"
  fi
fi

printf "\n程序化结论: 启发式是否明显提升 = %s\n" "$CONCLUSION"
