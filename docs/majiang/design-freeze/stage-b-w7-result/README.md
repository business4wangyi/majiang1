# 阶段B · W7 结果四态入库证据

> 对应封顶任务：`CAP-UI-RESULT` / `MJ-UI-RESULT-01`  
> 合同：`docs/majiang/design-freeze/stage-a-2026-05-10/03_RESULT_MODAL_TYPES.md`  
> 采证日：2026-11-16 · 视口 1440×900 · 入口 `window.showMajiangResultExample(<type>)`

## 帧清单

| 态 | 文件 | 可核要点 |
|----|------|----------|
| tsumo 自摸 | `2026-11-16-result-tsumo-1440x900.png` | 赢家 vs 三家共同支付；分差表；再来一局/回大厅/复盘 |
| ron 点炮 | `2026-11-16-result-ron-1440x900.png` | 赢家 + 放炮 + 旁家并列；仅点炮方支付 |
| draw 流局 | `2026-11-16-result-draw-1440x900.png` | 流局原因 + 各家变化（本例 0） |
| abort 中止 | `2026-11-16-result-abort-1440x900.png` | 终止原因 · 本局不计分 · 重开建议 + 诊断文案 |

结构化抽检：`audit-2026-11-16.json`。

## 复现

```bash
# 原型需已在 8765（或任意静态服）打开
# 控制台：
window.showMajiangResultExample("tsumo")
window.showMajiangResultExample("ron")
window.showMajiangResultExample("draw")
window.showMajiangResultExample("abort")
```

正式证据以本目录为准；勿只依赖 `.tmp/acceptance/final-evidence/result-*.png`。
