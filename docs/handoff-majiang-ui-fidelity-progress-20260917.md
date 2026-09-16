# Handoff: 麻将 Web UI 保真 · 目标图闸门

> 更新时间：2026-09-17（R2 重绘 + 复审后）  
> 规范：`AGENTS.md` · `docs/standards/rules/development.md` · Skill `majiang-ui-review`（档位 B）

## 一句话状态
**桌面目标图 R2 基本符合 · 有条件通过；可开始视觉落地（动作层须做成胶囊/印章条，禁止照抄圆钮）。acceptance 仍为 11/11，不等于视觉终审通过。**

```mermaid
flowchart TD
  A[打回稿] --> B[按改稿单重绘 v2/v3]
  B --> C{R2 并排复审}
  C -->|基本符合| D[有条件交付]
  D --> E[编码视觉落地]
  E --> F[实现截图再审]
  C -->|否| B
  G[acceptance 11/11] -.->|不可替代视觉| F
```

## 目标 / 用户意图
- 已完成：打回 → 重绘 → R2 复审 → 文档闸门回填。
- 用户可能下一步：按 `15_…R2` 改稿单做原型/产品视觉落地；或补移动端目标帧。

## 已完成
| 项 | 结果 | 产物 |
|---|---|---|
| 改稿重绘 | v2 去教学层；v3 保留并升采样为审核主图 | `target-assets/…-review.png`（1440×900） |
| 打回留档 | 旧审核主图保全 | `…-review-rejected-20260917.png` |
| R2 竞品复审 | **基本符合 · 有条件通过** | `15_HIFI_TARGET_COMPETITOR_REVIEW_20260917_R2.md` |
| 简报/主文档口径 | 改为「有条件通过 · 进入视觉落地」 | `13_…BRIEF` + 三份主文档 |

### 相对打回稿的收敛
1. 说明型叠加层（大箭头/气泡/说明条）→ **已移除**；改为目标牌光效。
2. 动作层 Web 矩形条 → **已去 Web 化**；仍偏圆形浮钮 → **实现时再贴胶囊/印章条**。
3. 角区标签墙 → **已压缩**为头像+分数+轻量「可胡」。

## 未完成 / 阻塞
| 优先级 | 事项 | 责任 | 阻塞编码？ |
|---|---|---|---|
| P1 | 落地时动作层做成竞品式胶囊/印章字效条（勿照抄圆钮） | 编码 | 否（约束项） |
| P2 | 补 390×844 移动端同局势目标图并复审 | 设计 | 否 |
| P2 | 补 `final-evidence/` 截图采集（可选） | 工程 | 否 |
| P1 | 按 `IMPLEMENTATION_TASK_BREAKDOWN` 视觉落地 + 后续 adapter/`core` | 编码 | 闸门已开（受约束） |

## 关键决策（勿推翻）
- 两层标准不可混判：基线合格 ≠ 竞品级；**11/11 ≠ 视觉终审通过**。
- 权威闸门：`13_…BRIEF` + `15_…R2`（覆盖 `14_…` 打回与旧「顶级已通过」）。
- 唯一主参考：`…/competitor-assets/riichi-city/steam-shot-2.jpg`。
- 术语：中文广东麻将；禁止荣和/立直/听牌等日式 UI 词。
- 固定局势：右家打出 → 可胡；主动作「胡」、次「过」、弱「碰/杠」。
- 旧打回稿 / 旧 Batch / 当前原型 CSS = 不可作无约束效果图交付。
- 无 `.codegraph/`，勿调 codegraph。
- Glob 可能扫不到 `target-assets/`；用 `ls` 确认。

## 关键路径

### 必读
- `docs/majiang/design-freeze/stage-a-2026-05-10/15_HIFI_TARGET_COMPETITOR_REVIEW_20260917_R2.md` ← **下一会话先读**
- `docs/majiang/design-freeze/stage-a-2026-05-10/13_RIICHI_CITY_HIFI_TARGET_REDRAW_BRIEF.md`
- Skill：`~/.claude/skills/majiang-ui-review/SKILL.md`

### 图
- 审核主图：`…/target-assets/guangdong-hifi-target-desktop-1440x900-review.png`
- 打回留档：`…/target-assets/guangdong-hifi-target-desktop-1440x900-review-rejected-20260917.png`
- 主参考：`…/competitor-assets/riichi-city/steam-shot-2.jpg`

### 原型（待按目标图重做视觉，非交付终态）
- `docs/majiang/web-ui-prototype/`

## 工作区未提交改动（下一会话注意）
- 文档：`13`/`14`/`15`、三份主文档、本 handoff、原型 README
- 图：`…-review.png`（已替换）、`…-review-v2/v3.png`、`…-review-rejected-20260917.png`
- `node_modules` / `.tmp` 勿提交。
- **尚未 git commit**；用户未要求提交则不要主动 commit。

## 建议下一会话动作
1. **若继续编码**：读 `15_…R2` 改稿单 → 按 `IMPLEMENTATION_TASK_BREAKDOWN` 视觉落地；动作层禁止圆钮终态。
2. **若继续设计**：补移动端 390×844 同局势目标图 → 档位 B 复审。
3. **若要证据链**：另写截图采集脚本；与视觉落地可并行。

## 坑
1. 不要信旧文「顶级判定口径：通过」或仅信 `14_…` 打回——以 `15_…R2` 为准。
2. 勿用 CSS 微调旧原型冒充已达成本图。
3. `final-evidence/` 缺失 ≠ 功能失败。
4. 生成图像素源多为 1280×720；审核主图已 `sips` 到 1440×900，实现勿依赖低清源稿细节。
