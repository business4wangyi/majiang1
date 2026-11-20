# 麻将 Web e2e / 视觉回归矩阵

> SSOT 场景目录：`scripts/test/majiang-web-e2e-catalog.js`  
> 规格镜像：`docs/superpowers/specs/2026-11-18-majiang-web-e2e-catalog-design.md`

## 命令

| 命令 | 含义 |
|------|------|
| `npm run majiang:web:e2e` | smoke（E01–E08） |
| `npm run majiang:web:e2e:full` | full（含 smoke + E09–E17） |
| `npm run majiang:web:visual` | 阶段 B 金标像素防回退（大厅+局内桌 1440×900） |
| `npm run regression:web` | **独立** Web 回归：`e2e:full` → `visual`（不并入 `regression:daily`） |

重写金标（慎用）：`MAJIANG_VISUAL_UPDATE=1 npm run majiang:web:visual`

## e2e 场景

| ID | 标题 | tier | 备注 |
|----|------|------|------|
| E01 | 静态拒开局 | smoke | |
| E02 | 演示假对局 | smoke | |
| E03 | 结果四态示意 | smoke | |
| E04 | API 完局烟雾 | smoke | |
| E05 | 非法出牌 | smoke | |
| E06 | 必现碰 | smoke | fixture `peng-ready` |
| E07 | 必现吃 | smoke | fixture `chi-ready` |
| E08 | 点炮胡+分数 | smoke | fixture `hu-ready` |
| E09 | 必现过 | full | |
| E10 | 必现明杠 | full | |
| E11 | 自摸胡+分数 | full | |
| E12 | 真流局 | full | |
| E13 | 合法出牌 | full | |
| E14 | 非法动作 ID | full | |
| E15 | 广东术语文案 | full | |
| E16 | 暗杠/补杠 | full | |
| E17 | 异常终止 abort | full | **defer**（无真 abort API） |

## 视觉金标（阶段 B 实现帧）

| 帧 | 基线 | 准备态 |
|----|------|--------|
| lobby | `docs/majiang/design-freeze/stage-b-lobby-commercial/2026-11-19-lobby-impl-desktop-1440x900.png` | 默认大厅 |
| table | `docs/majiang/design-freeze/stage-b-v3-table/2026-11-19-table-impl-desktop-1440x900.png` | `?acceptance=1` + `majiangNextModelExample`（可胡响应） |

硬边界：**visual / e2e 通过 ≠ 视觉冲顶毕业**。

默认阈值：通道差 `12`、不同像素占比 `0.2%`（可用 `MAJIANG_VISUAL_CHANNEL_TOL` / `MAJIANG_VISUAL_MAX_DIFF` 覆盖）。局内桌截帧前会停倒计时 tick，并固定 `remainingMs=6000`。
