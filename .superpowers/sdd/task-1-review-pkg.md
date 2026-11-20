# Review package — Task 1 (working tree; no commits)
BASE: 628b5b410a27259ca40f1b7237d2fec64db45138 (HEAD unchanged; commits forbidden)
HEAD: 628b5b410a27259ca40f1b7237d2fec64db45138

## Status
?? docs/product/spines/majiang-web-lobby-target.md
?? docs/product/waves/majiang-web-lobby-W1.md

## Stat

## Diff: docs/product/waves/majiang-web-lobby-W1.md (new)
diff --git a/docs/product/waves/majiang-web-lobby-W1.md b/docs/product/waves/majiang-web-lobby-W1.md
new file mode 100644
index 0000000..971369d
--- /dev/null
+++ b/docs/product/waves/majiang-web-lobby-W1.md
@@ -0,0 +1,48 @@
+# 波次蓝图：麻将 Web 大厅商业启动页 · W1
+
+| 字段 | 内容 |
+|------|------|
+| 主题 | majiang-web-lobby |
+| 波次 | W1 |
+| UI 层 | 流程账本 → U2·视觉(阶段A) → U0 → U2·视觉(阶段B) → 验收 → 收官 |
+| 施工状态 | **施工中**（账本已落；阶段 A 待冻） |
+| 脊骨 | `docs/product/spines/majiang-web-lobby-target.md` |
+| 规格 | `docs/superpowers/specs/2026-11-19-majiang-web-lobby-commercial-design.md` |
+| 封顶切片 | `MJ-LOBBY-LEDGER-01` … `MJ-LOBBY-GRAD-01` |
+
+## 用户故事
+
+作为玩家，我打开 Web 大厅第一眼应是绿毡金扣的商业启动页：「广东麻将」品牌 +「开始对局」，而不是居中表单卡。
+
+## 终态效果（本波）
+
+- 桌面 1440×900：A3 构图 + V1 材质 + S1 底栏双折叠
+- 配置只读芯片；能力不扩
+- 空闲/忙碌/失败状态诚实；诊断 JSON 默认不倾倒
+- 阶段 A 目标人批 + 阶段 B 实现对照后，人批「大厅商业观感毕业」
+- `web-lobby` 挂测与 `MJ-ACC-WEB-01` 入口不回归
+
+## 硬不做
+
+- 不改 `src/majiang/core/` 规则/计分
+- 不扩选房/改规则/人设（U1）
+- 不重开整桌 `CAP-UI-COMP`
+- 本波不把移动端纳入毕业
+- 无阶段 A 高保真人批不得宣称视觉通过
+- Agent/`/loop` 不得自批 GR-L8
+- 功能自动化绿 ≠ 视觉毕业
+
+## 本波切片
+
+| 切片 | 内容 | 状态 |
+|------|------|------|
+| `MJ-LOBBY-LEDGER-01` | 脊骨 + 本蓝图落盘 | **施工中→本任务关闭** |
+| `MJ-LOBBY-STAGEA-01` | 1440×900 高保真目标冻结人批 | 待做 |
+| `MJ-LOBBY-U0-01` | `#lobbyPage` A3 + S1 | 待做 |
+| `MJ-LOBBY-U2-01` | V1 对照目标图 | 待做 |
+| `MJ-LOBBY-TEST-01` | 挂测 + e2e 入口 | 待做 |
+| `MJ-LOBBY-GRAD-01` | 人批大厅观感毕业 | 待做 |
+
+## 下一刀
+
+`MJ-LOBBY-STAGEA-01`：先冻目标图并等人批，再改原型 DOM。

## Diff: docs/product/spines/majiang-web-lobby-target.md
diff --git a/docs/product/spines/majiang-web-lobby-target.md b/docs/product/spines/majiang-web-lobby-target.md
new file mode 100644
index 0000000..5aef359
--- /dev/null
+++ b/docs/product/spines/majiang-web-lobby-target.md
@@ -0,0 +1,57 @@
+# 麻将 Web 大厅商业启动页 — 目标差距脊骨（封顶）
+
+> **状态**：设计已批 · W1 施工中（2026-11-19）  
+> **规格**：`docs/superpowers/specs/2026-11-19-majiang-web-lobby-commercial-design.md`  
+> **流程**：`docs/product/delivery-flow.md`  
+> **原型**：`docs/majiang/web-ui-prototype/` `#lobbyPage`  
+> **与旧脊骨**：不重开 `majiang-webui-target` 整桌 COMP；不改 `majiang-dual-surface-target` 引擎毕业事实；本脊骨只抬**大厅观感**天花板
+
+## 1. 当前天花板（一句话）
+
+大厅 U0 可开局，但非商业启动页；本脊骨毕业 = 桌面 1440×900 上，A3+V1+S1 大厅达到阶段 A 人批目标并实现对照通过。
+
+## 2. 毕业标准（须人批；Agent 不得自批）
+
+| ID | 标准 | 状态 |
+|----|------|------|
+| GR-L1 | 主链路仍可：大厅开局 → 对局 → 结算；动作权威在 core/API | 待验（防回退） |
+| GR-L2 | 桌面 1440×900 呈现全幅英雄启动页（非居中表单卡三栏仪表盘） | 待做 |
+| GR-L3 | 品牌英雄级 + 单主 CTA「开始对局」+ 只读配置芯片 | 待做 |
+| GR-L4 | 绿毡金扣（V1）与局内桌材质同族；阶段 A 目标人批 + 阶段 B 对照 | 待做 |
+| GR-L5 | 底栏最近对局/诊断默认折叠；诊断 JSON 默认不倾倒 | 待做 |
+| GR-L6 | 空闲/忙碌/失败状态可观察；失败可重试 | 待做 |
+| GR-L7 | `web-lobby` 挂测与 WEB-01 入口不回归 | 待做 |
+| GR-L8 | 人明确批准「大厅商业观感毕业」；Agent/`/loop` 不得自批 | 待人批 |
+| GR-L9 | 功能自动化绿 ≠ 可宣称本脊骨视觉毕业 | 强制口径 |
+
+## 3. 硬不做
+
+- 重写 `src/majiang/core/` 规则/计分  
+- 本波扩选房/改规则/人设等 U1  
+- 重开整桌 `CAP-UI-COMP`  
+- 本波将移动端纳入毕业  
+- 无阶段 A 高保真人批即宣称视觉通过  
+- Agent 自批 GR-L8
+
+## 4. 差距 → 切片
+
+| 差距 | 摘要 | UI 层 | 切片 | 状态 |
+|------|------|-------|------|------|
+| G-L0 | 本脊骨 + 规格 + 首波蓝图落盘 | 流程 | `MJ-LOBBY-LEDGER-01` | **已落地**（本波蓝图已建） |
+| G-L1 | 阶段 A：1440×900 高保真目标冻结人批 | U2·视觉 | `MJ-LOBBY-STAGEA-01` | 待做 |
+| G-L2 | U0：A3 骨架 + S1 底栏 | U0 | `MJ-LOBBY-U0-01` | 待做 |
+| G-L3 | U2：V1 对照目标图落地 | U2·视觉 | `MJ-LOBBY-U2-01` | 待做 |
+| G-L4 | 挂测/e2e 入口回归 | 验收 | `MJ-LOBBY-TEST-01` | 待做 |
+| G-L5 | 人批大厅观感毕业 | 收官 | `MJ-LOBBY-GRAD-01` | 待做 |
+
+## 5. 版式 / 观感合同
+
+| 合同 | 状态 |
+|------|------|
+| 版式合同 · 桌面大厅 A3+S1 | 设计已批；实现未开 |
+| 观感合同 · V1 绿毡金扣 | 待阶段 A 高保真人批 |
+| 移动端大厅 | **本脊骨外**（另波） |
+
+## 6. 下一刀建议
+
+`MJ-LOBBY-STAGEA-01`（先冻 1440×900 目标图，人批后再改 DOM）
