#!/usr/bin/env bash
set -euo pipefail

IN_DIR="${1:-/tmp/alphazero-exp-ss/multiseed}"
MANIFEST="$IN_DIR/manifest.tsv"
OUT_SUMMARY="${2:-$IN_DIR/summary.tsv}"
GATE_REPORT="${3:-$IN_DIR/gate-result.txt}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "[ERROR] 缺少 manifest: $MANIFEST" >&2
  exit 2
fi

for dep in python3 awk; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    echo "[ERROR] 缺少依赖: $dep" >&2
    exit 2
  fi
done

tmp_rows="$(mktemp)"
tmp_missing_metrics="$(mktemp)"
trap 'rm -f "$tmp_rows"' EXIT
trap 'rm -f "$tmp_rows" "$tmp_missing_metrics"' EXIT

echo -e "seed\tstatus\telapsedMin\trandomRate\tgreedyRate\theuristicRate\tweightedScore" > "$OUT_SUMMARY"

while IFS=$'\t' read -r seed status log_path; do
  if [[ "$seed" == "seed" ]]; then
    continue
  fi
  if [[ "$status" != "ok" || ! -f "$log_path" ]]; then
    echo -e "${seed}\t${status}\tN/A\tN/A\tN/A\tN/A\tN/A" >> "$OUT_SUMMARY"
    continue
  fi

  metrics="$(python3 - "$log_path" <<'PY'
import re, sys
path = sys.argv[1]
elapsed = ""
random_rate = ""
greedy_rate = ""
heur_rate = ""
weighted = ""

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for ln in lines:
    m = re.search(r"总用时:\s*([0-9]+(?:\.[0-9]+)?)分钟", ln)
    if m:
        elapsed = m.group(1)
    m = re.search(r"vs 随机策略:\s*([0-9]+(?:\.[0-9]+)?)%", ln)
    if m:
        random_rate = m.group(1)
    m = re.search(r"vs 贪心策略:\s*([0-9]+(?:\.[0-9]+)?)%", ln)
    if m:
        greedy_rate = m.group(1)
    m = re.search(r"vs 启发式策略:\s*([0-9]+(?:\.[0-9]+)?)%", ln)
    if m:
        heur_rate = m.group(1)
    m = re.search(r"加权评估分:\s*([0-9]+(?:\.[0-9]+)?)%", ln)
    if m:
        weighted = m.group(1)
    m = re.search(r"weightedScore=([0-9]+(?:\.[0-9]+)?)", ln)
    if m:
        weighted = m.group(1)

def n(v):
    return v if v else "N/A"

print("\t".join([n(elapsed), n(random_rate), n(greedy_rate), n(heur_rate), n(weighted)]))
PY
)"

  echo -e "${seed}\t${status}\t${metrics}" >> "$OUT_SUMMARY"
done < "$MANIFEST"

awk -F '\t' 'NR>1 && $2=="ok" && ($7=="N/A" || $6=="N/A") {print $1}' "$OUT_SUMMARY" > "$tmp_missing_metrics"
missing_metrics_count="$(wc -l < "$tmp_missing_metrics" | tr -d ' ')"

if (( missing_metrics_count > 0 )); then
  missing_list="$(paste -sd ',' "$tmp_missing_metrics")"
  {
    echo "结论: FAIL"
    echo "原因: 以下 seed 状态为 ok 但缺少关键指标(weighted/heuristic): ${missing_list}"
  } > "$GATE_REPORT"
  cat "$OUT_SUMMARY"
  cat "$GATE_REPORT"
  exit 1
fi

awk -F '\t' 'NR>1 && $2=="ok" && $7!="N/A" && $6!="N/A" {print}' "$OUT_SUMMARY" > "$tmp_rows"

ok_count="$(wc -l < "$tmp_rows" | tr -d ' ')"
if [[ "$ok_count" -eq 0 ]]; then
  {
    echo "结论: FAIL"
    echo "原因: 没有可用的成功样本（weighted/heuristic 数据缺失）"
  } > "$GATE_REPORT"
  cat "$OUT_SUMMARY"
  cat "$GATE_REPORT"
  exit 1
fi

stats="$(awk -F '\t' '
function abs(v){return v<0?-v:v}
{
  w=$7+0; h=$6+0;
  n++;
  sw+=w; s2w+=w*w;
  sh+=h; s2h+=h*h;
  if (n==1 || w>maxw) maxw=w;
  if (n==1 || w<minw) minw=w;
}
END{
  if(n==0){exit 1}
  mw=sw/n; mh=sh/n;
  vw=s2w/n-mw*mw; if(vw<0) vw=0;
  vh=s2h/n-mh*mh; if(vh<0) vh=0;
  sdw=sqrt(vw); sdh=sqrt(vh);
  printf "count=%d meanW=%.2f stdW=%.2f minW=%.2f maxW=%.2f meanH=%.2f stdH=%.2f\n", n,mw,sdw,minw,maxw,mh,sdh;
}' "$tmp_rows")"

eval "$stats"

BASELINE_WEIGHTED="${BASELINE_WEIGHTED:-22.7}"
BASELINE_HEURISTIC="${BASELINE_HEURISTIC:-6.7}"
MIN_SAMPLES="${MIN_SAMPLES:-3}"
MAX_STD_WEIGHTED="${MAX_STD_WEIGHTED:-6.0}"
MAX_STD_HEURISTIC="${MAX_STD_HEURISTIC:-8.0}"

pass="yes"
reason=""
if (( count < MIN_SAMPLES )); then
  pass="no"; reason="${reason}样本数${count}<${MIN_SAMPLES};"
fi
awk -v mw="$meanW" -v bw="$BASELINE_WEIGHTED" 'BEGIN{exit !(mw > bw)}' || { pass="no"; reason="${reason}weighted均值${meanW}<=基线${BASELINE_WEIGHTED};"; }
awk -v mh="$meanH" -v bh="$BASELINE_HEURISTIC" 'BEGIN{exit !(mh > bh)}' || { pass="no"; reason="${reason}heuristic均值${meanH}<=基线${BASELINE_HEURISTIC};"; }
awk -v sd="$stdW" -v mx="$MAX_STD_WEIGHTED" 'BEGIN{exit !(sd <= mx)}' || { pass="no"; reason="${reason}weighted标准差${stdW}>${MAX_STD_WEIGHTED};"; }
awk -v sd="$stdH" -v mx="$MAX_STD_HEURISTIC" 'BEGIN{exit !(sd <= mx)}' || { pass="no"; reason="${reason}heuristic标准差${stdH}>${MAX_STD_HEURISTIC};"; }

{
  echo "=== Multi-seed Baseline Summary ==="
  echo "summary_tsv: $OUT_SUMMARY"
  echo "samples: $count"
  echo "weighted mean/std/min/max: $meanW / $stdW / $minW / $maxW"
  echo "heuristic mean/std: $meanH / $stdH"
  echo "baseline weighted: $BASELINE_WEIGHTED"
  echo "baseline heuristic: $BASELINE_HEURISTIC"
  echo "manifest ok samples: $(awk -F '\t' 'NR>1 && $2=="ok" {n++} END{print n+0}' "$OUT_SUMMARY")"
  echo ""
  if [[ "$pass" == "yes" ]]; then
    echo "结论: PASS"
    echo "说明: 结果达到“可更新当前基线文档”门禁条件。"
  else
    echo "结论: FAIL"
    echo "说明: ${reason}"
  fi
} | tee "$GATE_REPORT"

if [[ "$pass" != "yes" ]]; then
  exit 1
fi
