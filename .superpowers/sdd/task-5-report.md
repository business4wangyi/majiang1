# Task 5 报告 · MJ-T3-FELT-01

## 结论

局内绿毡光影已对齐大厅同族 `--table-felt-*` / 金扣；去掉整桌截图毡纹理硬叠。挂测绿。未 commit；未关 GR-T7。

## 改动

| 面 | 内容 |
|----|------|
| CSS | `.table-page` / `.table-stage-frame` 复用毡变量渐变 + 金边内阴影；`::before` 去掉 `table-felt-texture.png`；`.table-zone` 毡底改变量、外圈去冷灰回潮 |
| 账本 | G-T4 / `MJ-T3-FELT-01` / `CAP-T3-FELT` → **已落地**；下一刀 GRAD |
| 未关 | GR-T6（视觉人批）、GR-T7 |

## 验证

```text
npx mocha --require ts-node/register tests/majiang/web-table-v3.test.ts -v
→ 5 passing
```

目视建议：原型 `#tablePage` @ 1440×900，对照大厅绿毡金扣同族、无紫霓虹/灰面板。

## 硬边界

- 未碰 `#lobbyPage` / `src/majiang/core/`
- 未 commit（按 overrides）
