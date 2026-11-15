# 波次蓝图：麻将 Web UI · W4（CAP-UI-TILE / 牌面资产化）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W4 |
| UI 层 | **U2·视觉**（牌面正式态） |
| 施工状态 | **蓝图待人批**（本文件落盘 ≠ 已开工码） |
| 封顶任务 | `CAP-UI-TILE` · 切片 `MJ-UI-TILE-01` · 脊骨 G2 |
| 任务队列 | `docs/product/caps/majiang-webui-cap-tasks.md` |
| 阶段验收 | `docs/product/caps/majiang-webui-acceptance-stages.md`（A-02 / B-01） |
| 原型目录 | `docs/majiang/web-ui-prototype/`（仅此薄层；勿动 `src/*/core/`） |
| 证据锚 | `docs/majiang/design-freeze/stage-a-2026-05-10/16_HIFI_IMPL_COMPETITOR_REVIEW_20260917.md`；`docs/handoff-majiang-ui-fidelity-progress-20260917.md` |

## 用户故事

作为协作者，我希望正式对局态的主牌面读起来像实体麻将牌（图案/资产主表达），而不是色点矩形或调试文字牌；手牌、牌河、副露、目标牌同一套语义，且不借本波重排整桌或宣称冲顶毕业。

## 终态效果（人可观察）

1. **阶段A 合同可验**：正式态资产形态、降级/占位触发写死（见下节）。
2. **阶段B**：1440×900 近距实现帧上，主牌面不再以「色点矩形」为主表达；手牌·牌河·副露·目标牌同语义。
3. `cap-tasks` 中 `CAP-UI-TILE` 状态可从「待施工」改为「已落地」或「施工中」的可证据回写；脊骨 G2 同步。
4. **不**关闭 `CAP-UI-LAYOUT` / `CAP-UI-MOBILE` / `CAP-UI-GRAD`。

## 阶段A 合同（本波必须先钉死再大改）

| 项 | 合同 |
|----|------|
| 正式态主表达 | 图案/资产牌（PNG 或 SVG sprite / 图集切片均可）；**禁止**以色点矩形或纯文字牌作为正式对局主表达 |
| 既有 CSS 陶瓷/经典印花 | 可作为过渡与厚度底座；若并排仍判「偏 CSS 印花」，必须落到 sprite/图集，不得用更多 CSS 花活冒充关项 |
| 同语义范围 | **手牌、牌河、副露、目标牌**共用同一套牌面语义与命名；保持既有格位语义（筒/条经典格位方向不回退） |
| 文字牌允许场景 | 仅 **调试 / 占位 / 资产加载失败降级**；正式可玩路径默认不露文字牌 |
| 降级触发 | 缺资产、加载失败、或显式 `?debugTiles=1`（或既有等价开关）→ 可降级文字/简图，并在诊断可见 |
| 目标图 | 桌面近距特写可复用阶段A 冻结图方向；本波可不新绘全桌，但须有可对照的牌面特写/同向帧 |

## 阶段B 施工边界（人批蓝图后）

| 做 | 不做 |
|----|------|
| 在 `web-ui-prototype` 接 sprite/图集或等价资产管道 | 整桌重排、角区大改（属 `CAP-UI-LAYOUT`） |
| 四区域同语义替换/对齐 | 390×844 移动目标帧（属 `CAP-UI-MOBILE`） |
| 对照 B-01 留实现帧证据并回写账本 | 改 `src/*/core/` 规则 |
| 可选 `gate pre/post` | 退回圆钮 HUD / 深色 Web 工具条 |
| | 宣称整桌 GRAD / 无条件竞品级 |
| | 功能 `acceptance` 绿冒充本项关闭 |

## 硬不做

- 不开 `CAP-UI-LAYOUT` / `CAP-UI-MOBILE` / `CAP-UI-RESULT` 大刀（除非人改序点名）
- 不自批、不由 `/loop` / Automation 关闭 `CAP-UI-GRAD`
- 不引入日式术语；不引入 OpenSpec / Fast-lane
- 本蓝图未获人批前：**不上** sprite 大 diff

## 本波切片

| 切片 | 内容 | 状态 |
|------|------|------|
| `MJ-UI-TILE-01` | 阶段A 资产/降级合同 → 阶段B 四区域同语义资产化 → 对照 A-02/B-01 回写 | **蓝图待人批** |

## `/loop` 与 Automation（人批本蓝图后）

- 本机：固定 **15m** sentinel，每拍只推进 `CAP-UI-TILE` 直至人审可关或人改序。
- Cloud Automation：定时唤醒，提示词只取 `cap-tasks` 下一条可施工项；**禁止**关 GRAD；引用已提交路径。
- TILE 未关：**不**自动开 LAYOUT。

## 下一波

TILE 阶段B 人审可关后，默认开 **`CAP-UI-LAYOUT`**（须新人审蓝图）；或人点名 MOBILE。
