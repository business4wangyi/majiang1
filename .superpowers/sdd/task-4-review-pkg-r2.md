# Review package — Task 4 re-review after ledger fix
## Ledger snippets
docs/product/spines/majiang-web-lobby-target.md:20:| GR-L4 | 绿毡金扣（V1）与局内桌材质同族；阶段 A 目标人批 + 阶段 B 对照 | 待做 |
docs/product/spines/majiang-web-lobby-target.md:24:| GR-L8 | 人明确批准「大厅商业观感毕业」；Agent/`/loop` 不得自批 | 待人批 |
docs/product/spines/majiang-web-lobby-target.md:34:- Agent 自批 GR-L8
docs/product/spines/majiang-web-lobby-target.md:43:| G-L3 | U2：V1 对照目标图落地 | U2·视觉 | `MJ-LOBBY-U2-01` | **已落地**（阶段 B 实现对照帧已入库；≠ GR-L8 视觉毕业） |
docs/product/spines/majiang-web-lobby-target.md:44:| G-L4 | 挂测/e2e 入口回归 | 验收 | `MJ-LOBBY-TEST-01` | 待做 |
docs/product/spines/majiang-web-lobby-target.md:47:## 5. 版式 / 观感合同
docs/product/spines/majiang-web-lobby-target.md:52:| 观感合同 · V1 绿毡金扣 | 阶段 A 已人批（2026-11-19）；阶段 B 对照帧已入库（仍待 Task 6 / GR-L8 人批毕业） |
docs/product/spines/majiang-web-lobby-target.md:55:## 6. 下一刀建议
docs/product/spines/majiang-web-lobby-target.md:57:`MJ-LOBBY-TEST-01`（挂测 + e2e）
docs/product/waves/majiang-web-lobby-W1.md:8:| 施工状态 | **施工中**（U2 已落地；下一刀 TEST） |
docs/product/waves/majiang-web-lobby-W1.md:22:- 阶段 A 目标人批 + 阶段 B 实现对照后，人批「大厅商业观感毕业」
docs/product/waves/majiang-web-lobby-W1.md:32:- Agent/`/loop` 不得自批 GR-L8
docs/product/waves/majiang-web-lobby-W1.md:42:| `MJ-LOBBY-U2-01` | V1 对照目标图 | **已落地**（阶段 B 实现对照帧 `stage-b-lobby-commercial/` 已入库；≠ GR-L8 视觉毕业） |
docs/product/waves/majiang-web-lobby-W1.md:43:| `MJ-LOBBY-TEST-01` | 挂测 + e2e 入口 | 待做 |
docs/product/waves/majiang-web-lobby-W1.md:46:## 下一刀
docs/product/waves/majiang-web-lobby-W1.md:48:`MJ-LOBBY-TEST-01`（挂测 + e2e）

## styles.css lobby-felt / lobby-cta excerpts
131:.lobby-felt {
132-  position: absolute;
133-  inset: 0;
134-  z-index: 0;
135-  pointer-events: none;
136-  background:
137-    radial-gradient(ellipse at 50% 48%, rgba(18, 138, 100, 0.35) 0%, transparent 58%),
--
143:.lobby-felt::before {
144-  content: "";
145-  position: absolute;
146-  inset: 18% 26%;
147-  border-radius: 50%;
148-  border: 2px solid rgba(226, 182, 58, 0.22);
149-  background: rgba(5, 46, 35, 0.18);
--
152:.lobby-brand,
153-.lobby-hero,
154:.lobby-drawer {
155-  position: relative;
156-  z-index: 1;
157-}
158-
159:.lobby-brand {
160-  text-align: center;
161-  padding: 7vh 16px 0;
162-}
163-
164:.lobby-brand-title {
165-  margin: 0;
166-  font-size: clamp(32px, 4.4vw, 64px);
167-  font-family: "Songti SC", "Noto Serif SC", serif;
168-  letter-spacing: 0.2em;
169-  font-weight: 700;
170-  color: #f7f1e6;
--
190:.lobby-cta {
191-  width: auto;
192-  min-width: 220px;
193-  padding: 0 48px;
194-}
195-
196-.lobby-config-chips {
--
206:.lobby-chip {
207-  border-radius: 999px;
208-  border: 1px solid rgba(255, 255, 255, 0.38);
209-  background: rgba(0, 0, 0, 0.25);
210-  padding: 4px 12px;
211-  font-size: 12px;
212-  color: rgba(247, 241, 230, 0.82);
--
215:.lobby-drawer {
216-  display: flex;
217-  flex-wrap: wrap;
218-  gap: 12px 24px;
219-  padding: 10px 16px 14px;
220-  border-top: 1px solid rgba(255, 255, 255, 0.14);
221-  background: rgba(8, 12, 10, 0.9);
--
279:.lobby-page .primary-btn.lobby-cta {
280-  width: auto;
281-  min-width: 220px;
282-  min-height: 54px;
283-  padding: 0 48px;
284-  font-size: 20px;
285-  border: 1px solid #f0d278;
--
294:.lobby-page .primary-btn.lobby-cta:disabled {
295-  opacity: 0.55;
296-  filter: grayscale(0.15);
297-}
298-
299-.table-page {
300-  display: grid;
