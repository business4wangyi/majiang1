# Task 4 返工报告 · MJ-LOBBY-U2-01（GR-L8 驳回后）

状态：返工完成，**仍待人批 GR-L8，≠毕业**；未提交。

## 改动
- `docs/majiang/web-ui-prototype/index.html`：芯片移出 `.lobby-hero` 改为页面级绝对定位；删除 `.fixed-config`；规则芯片去「规则」前缀。
- `docs/majiang/web-ui-prototype/styles.css`：绝对叠放（品牌 11% / hero 36% / 芯片 bottom 18% / 抽屉贴底）；毡渐变与桌椭圆按 Stage A；CTA 纯金 #e2b63a、16px 64px、0.14em、8px；品牌 56px/0.22em；抽屉 rgba(8,12,10,.9)，summary 加 ▾。
- `docs/majiang/web-ui-prototype/app.js`：`renderLobby` 芯片可见文本为短文案（固定 / 广东推倒胡 / 25000）；`appState.lobby` 未改。
- Stage B PNG 重截；stage-b README、脊骨、波次已更新。

## 验证
- mocha web-lobby：3 passing。
- 目视对照 Stage A：布局/芯片/CTA/毡色基本一致。

## 遗留
- Stage A 抽屉右侧「桌面 1440×900 · A3+V1+S1」为标注文字，未实装。
- 芯片文案为硬编码展示值，与 `createDefaultLobbyState`（baseScore 100 等）不一致；后续接配置需统一。
- 未运行 `majiang:web:e2e`。
