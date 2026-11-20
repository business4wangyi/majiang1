# Task 2 Report · 阶段 A 自绘冻结 · `MJ-T3-STAGEA-01`

**Status:** DONE（资产就绪，等人批冻结；**未**宣称 STAGEA 已落地）  
**Branch:** develop（in-place）  
**Date:** 2026-11-19  
**Commits:** 无（binding：DO NOT commit）

## 产出路径

| 产物 | 路径 | 状态 |
|------|------|------|
| README | `docs/majiang/design-freeze/stage-a-v3-table/README.md` | 已写；人批栏 **未勾选** |
| 高保真 HTML | `docs/majiang/design-freeze/stage-a-v3-table/hifi-table-desktop-1440x900.html` | 已写（brief 定稿原文） |
| 主帧 PNG | `docs/majiang/design-freeze/stage-a-v3-table/2026-11-19-table-desktop-1440x900.png` | Playwright 截帧；**1440×900** PNG |

## 未改（按 binding）

- **未**改 `docs/majiang/web-ui-prototype/`
- **未**把脊骨 GR-T3 / G-T1、波次 `MJ-T3-STAGEA-01`、`CAP-T3-STAGEA` 标为已落地（仍待人批「批准/冻结」）
- **未**勾选 README 人批栏
- **未** commit
- **未**用 W8 / 竞品截图顶替 PNG

## Step 3 截帧

- 工具：`require('playwright')` + Chromium
- viewport / clip：`1440 × 900`
- 校验：
  - `file` → `PNG image data, 1440 x 900, 8-bit/color RGB, non-interlaced`
  - `sips` → `pixelWidth: 1440` / `pixelHeight: 900`

## Step 4 自检

```
OK: 方盘
OK: 胡最大
OK: png exists
STOP: 等人批阶段A。聊天确认「批准/冻结」前禁止改原型宣称视觉通过。
```

## 观感合同自审（对照 README）

| 项 | 判定 | 证据 |
|----|------|------|
| 构图：桌心方盘 + 底动作/手牌；顶栏弱化 | 通过 | 方盘居中；顶栏 opacity 0.42 |
| 桌心方盘；风向局+余牌；非说明墙 | 通过 | 「东风局」「余牌 36」；无半透明说明墙 |
| 动作：印章贴手牌上方；胡最大高亮 | 通过 | `.seal.hu` 更大金底；过/碰/杠次级 |
| 实体手牌 + 四方牌河；最近一张高亮 | 通过 | 四方 `.river`；东家「三万」`.latest` |
| 角区稀疏 | 通过 | 头像+风/昵称+分数胶囊 |
| 绿毡金；禁紫霓虹/平板灰 | 通过 | `--table-felt-*` / `--gold-*` |
| 自绘非竞品 | 通过 | HTML 自绘截帧 |

## 闸门（停）

- 已向父会话交付 PNG 路径，**等人确认「批准 / 冻结」**。
- 未批准前：禁止改原型宣称视觉通过；禁止进入 Task 3 实现。
- 批准后（非本 Task）：勾选人批栏填日期；脊骨/波次/CAP → 已落地；再允许 commit（仅用户要求时）。

## Concerns

无阻断项。可选备注：角区南家头像与底栏手牌在垂直空间上较近（规格 HTML 如此），人审时可决定是否微调间距——**未擅自改 brief 定稿 HTML**。
