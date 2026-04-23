#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-/tmp/alphazero-exp-ss/multiseed}"
SEEDS_CSV="${ALPHAZERO_SEEDS:-20260419,20260420,20260421}"
PROFILE="${ALPHAZERO_TRAINING_PROFILE:-scheme-c-doc-v1}"
ITERATIONS="${ALPHAZERO_TOTAL_ITERATIONS:-30}"
EVAL_GAMES="${ALPHAZERO_EVALUATION_GAMES:-30}"
EVAL_MODE="${ALPHAZERO_EVALUATION_MODE:-all-baselines}"
EVAL_SWAP_SIDES="${ALPHAZERO_EVAL_SWAP_SIDES:-true}"

mkdir -p "$OUT_DIR"
MANIFEST="$OUT_DIR/manifest.tsv"
if [[ ! -f "$MANIFEST" ]]; then
  echo -e "seed\tstatus\tlog_path" > "$MANIFEST"
fi

IFS=',' read -r -a SEED_LIST <<< "$SEEDS_CSV"
if [[ "${#SEED_LIST[@]}" -eq 0 ]]; then
  echo "[ERROR] ALPHAZERO_SEEDS 为空" >&2
  exit 2
fi

echo "🚀 开始多 seed 复验"
echo "   输出目录: $OUT_DIR"
echo "   seeds: $SEEDS_CSV"
echo "   profile: $PROFILE"
echo "   iterations: $ITERATIONS"
echo "   eval games: $EVAL_GAMES"
echo "   eval mode: $EVAL_MODE"
echo "   eval swap sides: $EVAL_SWAP_SIDES"
echo ""

FAILED=0

upsert_manifest_row() {
  local seed="$1"
  local status="$2"
  local log_file="$3"
  local tmp_file
  tmp_file="$(mktemp)"
  awk -F '\t' -v s="$seed" 'NR==1 || $1 != s' "$MANIFEST" > "$tmp_file"
  echo -e "${seed}\t${status}\t${log_file}" >> "$tmp_file"
  mv "$tmp_file" "$MANIFEST"
}

for seed in "${SEED_LIST[@]}"; do
  seed="$(echo "$seed" | xargs)"
  if [[ -z "$seed" ]]; then
    continue
  fi

  log_file="$OUT_DIR/seed-${seed}.log"
  echo "▶️ 运行 seed=${seed} ..."

  if ALPHAZERO_TRAINING_PROFILE="$PROFILE" \
    ALPHAZERO_TOTAL_ITERATIONS="$ITERATIONS" \
    ALPHAZERO_EVALUATION_MODE="$EVAL_MODE" \
    ALPHAZERO_EVALUATION_GAMES="$EVAL_GAMES" \
    ALPHAZERO_EVAL_SWAP_SIDES="$EVAL_SWAP_SIDES" \
    ALPHAZERO_SEED="$seed" \
    npm run -s othello:alphazero-fast-train | tee "$log_file"; then
    upsert_manifest_row "$seed" "ok" "$log_file"
  else
    upsert_manifest_row "$seed" "fail" "$log_file"
    FAILED=1
    echo "❌ seed=${seed} 运行失败，已记录到 manifest"
  fi

  echo ""
done

echo "📄 manifest: $MANIFEST"
if [[ "$FAILED" -ne 0 ]]; then
  echo "❌ 多 seed 复验存在失败任务" >&2
  exit 1
fi
echo "✅ 多 seed 复验完成"
