# Handoff: 麻将 Web UI 保真进度评估与下一闸门

## 目标
用户要求：查看此前麻将 UI 功能保真相关代码与文档，**评估当前开发进度**；本会话续作 P0 竞品级复审 + 验收复跑 + 文档口径统一。

## 已完成（截至 2026-09-17 续作）
- 进度评估（前会话）：基线功能保真基本落地；竞品级卡在目标图闸门；未接 `core`。
- **P0 竞品级复审（本会话）**：`…-review.png` vs `riichi-city/steam-shot-2.jpg` → **打回**。
  - 结论文档：`docs/majiang/design-freeze/stage-a-2026-05-10/14_HIFI_TARGET_COMPETITOR_REVIEW_20260917.md`
  - 简报已回填：`13_RIICHI_CITY_HIFI_TARGET_REDRAW_BRIEF.md`
- **P0 验收复跑**：`npm run majiang:web:acceptance` → **11/11**，产出 `.tmp/acceptance/majiang-webui-acceptance.json`。
  - 发现：脚本**不生成** `.tmp/acceptance/final-evidence/`；文档声称的截图/录屏证据链仍缺失（无对应采集脚本）。
- **P1 文档口径**：三份主文档状态头改为「冲顶进行中 · 目标图待审（打回）」；旧「顶级判定通过」留档标注为已被覆盖。

## 进行中 / 未完成
- 目标图按复审改稿单**重绘**后复审（设计职责，非编码）。
- `final-evidence/` 截图/录屏：仍缺；若需要需另补采集脚本或手工采集（当前非冲顶阻塞的主路径——主阻塞是目标图）。
- 原型未接真实核心层；生产 UI 仍是 CLI。
- **禁止**：在目标图通过前派大块视觉编码。

## 关键决策与约定
- **两层标准不可混判**：基线合格 ≠ 竞品级；自动化 11/11 ≠ 视觉通过。
- **冲突取舍**：以 `13_…BRIEF` + `14_…REVIEW_20260917` + `majiang-ui-review` 为准。
- 冲顶主参考唯一：Riichi City `steam-shot-2.jpg`；术语中文广东麻将。
- 打回根因：说明型叠加层（大箭头/气泡/说明条）+ 动作层偏 Web 按钮条 + 角区信息偏密；骨架（实体牌/中心盘/透视桌）可保留。
- Codegraph：本仓库无 `.codegraph/`，勿调。

## 关键路径
- 复审结论：`docs/majiang/design-freeze/stage-a-2026-05-10/14_HIFI_TARGET_COMPETITOR_REVIEW_20260917.md`
- 重绘简报：`…/13_RIICHI_CITY_HIFI_TARGET_REDRAW_BRIEF.md`
- 审核主图：`…/target-assets/guangdong-hifi-target-desktop-1440x900-review.png`
- 验收 JSON：`.tmp/acceptance/majiang-webui-acceptance.json`
- 验收脚本：`scripts/test/majiang-webui-acceptance.js`（仅 JSON，无截图）

## 建议下一步
1. **P0（设计）**：按 `14_…REVIEW` 改稿单重绘目标图 → 再并排复审。
2. **P1（可选）**：若需补齐截图证据链，另写采集脚本生成 `final-evidence/`（与冲顶视觉闸门解耦）。
3. **P2**：仅目标图通过后，按 `IMPLEMENTATION_TASK_BREAKDOWN` 视觉落地 + `view-model-adapter` 接 `core`。

## 本会话改动
- 新增复审结论文档；更新简报与三份主文档状态口径。
- `npm install` 以恢复 `playwright-core`；复跑验收 JSON。
- **未**改原型/核心代码；**未**提交 git。
