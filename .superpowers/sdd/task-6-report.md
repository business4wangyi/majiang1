# Task 6 报告：挂测回归 + 阶段 B 对照帧 · 防回退

**状态：PASS（功能防回退绿；不宣称视觉毕业 / 不关闭 GR-T7）**  
**日期：2026-11-19**

## 结论

| 项 | 结果 |
|----|------|
| 阶段 B 桌面实现帧 1440×900 | 已入库 |
| Mocha `web-table-v3` + `web-lobby` | **8 passing** |
| `npm run majiang:web:e2e` smoke | **8 pass / 0 fail** |
| 移动 390×844 | 仅抽检（**不计入毕业**） |
| 视觉毕业 / GR-T7 | **未宣称、未关闭** |
| Commit | **未执行**（按 override） |

## 阶段 B 产物

| 路径 | 说明 |
|------|------|
| `docs/majiang/design-freeze/stage-b-v3-table/README.md` | 对照说明 + 清单 |
| `docs/majiang/design-freeze/stage-b-v3-table/2026-11-19-table-impl-desktop-1440x900.png` | 实现帧 **1440×900** |
| 对照目标 | `../stage-a-v3-table/2026-11-19-table-desktop-1440x900.png`（未冒充为本帧） |

采证：`index.html?acceptance=1` + `window.majiangNextModelExample`（`response_window` / 可胡）。  
移动抽检帧（非入库）：`.tmp/stage-b-v3-table-smoke/2026-11-19-table-impl-mobile-390x844-smoke.png` — 目视可胡主路径仍在，未见相对现网明显恶化；**不作毕业门槛**。

## 回归命令与计数

```bash
npx mocha --require ts-node/register \
  tests/majiang/web-table-v3.test.ts tests/majiang/web-lobby.test.ts -v
# → 8 passing

npm run majiang:web:e2e
# → smoke pass=8 fail=0（E01–E08）
```

另复验：`tests/majiang/meld-fixture.test.ts` 含 chi-ready → 与挂测合计 **15 passing**（非 brief 硬门槛，作夹具修复证据）。

## 夹具修复（e2e 根因，非 UI 三刀回退）

首跑 e2e：**E07 必现吃** 失败  
`page.waitForFunction` 等 `player_turn` 超时 30s（`.tmp/acceptance/majiang-web-e2e.json`）。

根因：`installChiReadyFixture` 只清 4/5/6 万，手牌残留 **3/7 万** → `findChiCombinations` 多组 → `handleChi` 走 CLI 选组 → API 下超时/`chi failed`。单元测同失败。

修复：`src/majiang/session/game-session.ts` 吃夹具一并清 **3–7 万**，只植入唯一 4+6 组合。  
**未改** `docs/majiang/web-ui-prototype/` 视觉实现。

## 关注点（Concerns）

1. 阶段 B 对照清单仍为未勾选人审项；功能绿 ≠ 视觉冲顶。
2. `handleChi` 多组合仍依赖 CLI；API/e2e 依赖夹具保证单组合（已知天花板）。
3. 移动帧仅 smoke，窄屏信息密度需另波评估。

## 规范引用

- `docs/standards/testing/quality.md`
- `docs/product/delivery-flow.md`（阶段 A/B 分验；功能自动化 ≠ 视觉毕业）
- `docs/standards/rules/communication-for-beginners.md`
