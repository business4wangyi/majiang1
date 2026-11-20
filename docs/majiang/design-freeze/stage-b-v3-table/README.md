# 局内桌三抬顶 · 阶段 B（实现对照）

> 对照目标：`../stage-a-v3-table/2026-11-19-table-desktop-1440x900.png`  
> 本目录帧为实现截图，**不能**单独作为阶段 A 目标。

## 入库帧

| 视口 | 文件 |
|------|------|
| 桌面 1440×900 | `2026-11-19-table-impl-desktop-1440x900.png` |

## 对照清单

- [x] 方盘桌心可读（风向局/余牌）
- [x] 印章条 + 胡主路径
- [x] 手牌实体感 + 选中抬起
- [x] 牌河有序 + 最近牌高亮
- [x] 毡/金与大厅同族

## 人批栏

- [x] 人批视觉毕业 GR-T7（日期：2026-11-19「批准毕业」）

## 采证说明

- 源：`docs/majiang/web-ui-prototype/index.html?acceptance=1`
- 态：`window.majiangNextModelExample`（`response_window` / 可胡）；视觉门禁冻结 `remainingMs=6000` 并停倒计时 tick
- 移动 390×844 仅为防回退抽检，**不计入**视觉毕业
- 视觉防回退：`npm run majiang:web:visual`（金标=本目录实现帧；通过 ≠ 冲顶毕业）
- 金标重冻：`MAJIANG_VISUAL_UPDATE=1 npm run majiang:web:visual`（2026-11-20 为对齐确定性采集重写过本帧）
