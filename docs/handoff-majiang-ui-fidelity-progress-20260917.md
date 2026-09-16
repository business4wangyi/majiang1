# Handoff: 麻将 Web UI 保真 · 目标图闸门

> 更新时间：2026-09-17（动作层已提交 · 桌心/角区弱高亮落地中）  
> 规范：`AGENTS.md` · `docs/standards/rules/development.md` · Skill `majiang-ui-review`（档位 B）

## 一句话状态
**桌面目标图 R2 有条件通过；视觉落地推进中——动作层胶囊已提交；教学层/角区标签墙已收敛为弱高亮链路。acceptance 11/11；实现截图尚未做档位 B 并排终审。**

```mermaid
flowchart TD
  A[打回稿] --> B[按改稿单重绘 v2/v3]
  B --> C{R2 并排复审}
  C -->|基本符合| D[有条件交付]
  D --> E[编码视觉落地]
  E --> E1[动作层胶囊/印章条]
  E --> E2[去教学层 + 角区稀疏]
  E --> E3[桌心/牌面继续贴目标图]
  E1 --> F[实现截图再审]
  E2 --> F
  E3 --> F
  C -->|否| B
  G[acceptance 11/11] -.->|不可替代视觉| F
```

## 目标 / 用户意图
- 已完成：打回 → 重绘 → R2 复审 → 文档闸门回填 → 动作层胶囊 commit。
- 进行中：按 `15_…R2` 改稿单做原型视觉落地（改稿单 1–3 条实现侧已推进）。
- 可选并行：补移动端目标帧 / `final-evidence` 截图链。

## 已完成
| 项 | 结果 | 产物 |
|---|---|---|
| 改稿重绘 | v2 去教学层；v3 保留并升采样为审核主图 | `target-assets/…-review.png`（1440×900） |
| 打回留档 | 旧审核主图保全 | `…-review-rejected-20260917.png` |
| R2 竞品复审 | **基本符合 · 有条件通过** | `15_HIFI_TARGET_COMPETITOR_REVIEW_20260917_R2.md` |
| 简报/主文档口径 | 「有条件通过 · 进入视觉落地」 | `13_…BRIEF` + 三份主文档 |
| 闸门文档提交 | `5e22a0f` | docs + target-assets |
| 动作层形态 | Web 矩形条 → **胶囊/印章字效条** | `4027d4d` · `web-ui-prototype/` |
| 去教学层 + 角区稀疏 | 关 beam/气泡/桌心说明条；角区仅头像+分数+南位轻量「可胡」；中心盘右缘脉冲 + 目标牌光效 | `styles.css` + `app.js` + `index.html` |

### 相对打回稿的收敛
1. 说明型叠加层（大箭头/气泡/说明条）→ **目标图已移除**；实现层 beam/callout/桌心文案条亦已关闭。
2. 动作层 Web 矩形条 → **胶囊/印章字效条**（`4027d4d`；**勿再退回圆钮或深色工具条**）。
3. 角区标签墙 → **已压缩**为头像+分数+南位轻量「可胡」。

## 未完成 / 阻塞
| 优先级 | 事项 | 责任 | 阻塞编码？ |
|---|---|---|---|
| P1 | 牌面/桌心材质与透视继续贴目标图（实体感冲顶） | 编码 | 否 |
| P1 | 实现截图 vs `steam-shot-2.jpg` 档位 B 并排复审 | 审核 | 否 |
| P2 | 补 390×844 移动端同局势目标图并复审 | 设计 | 否 |
| P2 | 补 `final-evidence/` 截图采集（可选） | 工程 | 否 |
| P1 | 后续 adapter/`core` 接线（任务包 2+） | 编码 | 闸门已开 |

## 关键决策（勿推翻）
- 两层标准不可混判：基线合格 ≠ 竞品级；**11/11 ≠ 视觉终审通过**。
- 权威闸门：`13_…BRIEF` + `15_…R2`（覆盖 `14_…` 打回与旧「顶级已通过」）。
- 唯一主参考：`…/competitor-assets/riichi-city/steam-shot-2.jpg`。
- 术语：中文广东麻将；禁止荣和/立直/听牌等日式 UI 词。
- 固定局势：右家打出 → 可胡；主动作「胡」、次「过」、弱「碰/杠」。
- 旧打回稿 / 旧 Batch = 不可作效果图交付；原型仍非无约束终态。
- 动作层终态 = 胶囊/印章字效条；禁止圆钮 HUD、禁止深色 Web 工具条。
- 局势表达 = 牌光效 + 中心盘右缘脉冲 + 座位轻高亮；**禁止**大箭头/气泡/桌心说明条/多座位标签墙。
- 无 `.codegraph/`，勿调 codegraph。
- Glob 可能扫不到 `target-assets/`；用 `ls` 确认。

## 关键路径

### 必读
- `docs/majiang/design-freeze/stage-a-2026-05-10/15_HIFI_TARGET_COMPETITOR_REVIEW_20260917_R2.md`
- `docs/majiang/design-freeze/stage-a-2026-05-10/13_RIICHI_CITY_HIFI_TARGET_REDRAW_BRIEF.md`
- Skill：`~/.claude/skills/majiang-ui-review/SKILL.md`

### 图
- 审核主图：`…/target-assets/guangdong-hifi-target-desktop-1440x900-review.png`
- 打回留档：`…/target-assets/guangdong-hifi-target-desktop-1440x900-review-rejected-20260917.png`
- 主参考：`…/competitor-assets/riichi-city/steam-shot-2.jpg`

### 原型（视觉落地进行中）
- `docs/majiang/web-ui-prototype/`（动作层胶囊 + 弱高亮链路已落地；牌面实体感仍待冲顶）

## 工作区未提交改动（下一会话注意）
- 本轮：`web-ui-prototype/{styles.css,app.js,index.html}` + 本 handoff（去教学层/角区稀疏）
- `node_modules` / `.tmp` 勿提交。
- 已提交：`4027d4d` 动作层胶囊；闸门文档 `5e22a0f`。

## 建议下一会话动作
1. **继续编码**：牌面/桌材质/透视贴目标图；保持动作层与弱高亮约束。
2. **审核**：桌面实现截图 + `steam-shot-2.jpg` 档位 B 并排，关 `15_…R2` 改稿单验收。
3. **设计**：补移动端 390×844 同局势目标图 → 档位 B 复审。
4. **证据链（可选）**：截图采集脚本，与视觉落地并行。

## 坑
1. 不要信旧文「顶级判定口径：通过」或仅信 `14_…` 打回——以 `15_…R2` 为准。
2. 勿用局部 CSS 微调冒充已达成本图；动作层/角区收敛 ≠ 整桌冲顶完成。
3. `final-evidence/` 缺失 ≠ 功能失败。
4. 生成图像素源多为 1280×720；审核主图已 `sips` 到 1440×900，实现勿依赖低清源稿细节。
