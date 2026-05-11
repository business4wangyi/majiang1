# 竞品高保真参考板（阶段A重构基准）

## 依据规范
- `AGENTS.md`
- `docs/standards/rules/development.md`
- `docs/majiang/WEB_UI_PRODUCT_INTERACTION_DESIGN.md`
- `docs/majiang/FOLDER_STRUCTURE.md`

## 目标
建立“先参考、后重构”的高保真锚点，避免继续主观调风格。

## 竞品样本与官方来源

### S-A 雀魂 Mahjong Soul
- Steam（含商店截图/视频）：https://store.steampowered.com/app/2739990/Mahjong_Soul/
- App Store（iOS 截图）：https://apps.apple.com/jp/app/%E9%9B%80%E9%AD%82-%E3%81%98%E3%82%83%E3%82%93%E3%81%9F%E3%81%BE/id1469186379
- Google Play（Android 截图）：https://play.google.com/store/apps/details?id=com.YoStarEN.MahjongSoul

### S-B 麻雀一番街 Riichi City
- Steam（含商店截图/视频）：https://store.steampowered.com/app/1954420/Riichi_City__Japanese_Mahjong/
- App Store（iOS 截图）：https://apps.apple.com/jp/app/%E9%BA%BB%E9%9B%80%E4%B8%80%E7%95%AA%E8%A1%97-%E6%9C%AC%E6%A0%BC%E9%BA%BB%E9%9B%80%E3%82%B2%E3%83%BC%E3%83%A0/id1578816591
- Google Play（Android 截图）：https://play.google.com/store/apps/details?id=com.riichicity.happywoods

### S-C セガNET麻雀 MJ
- 官方站点：https://sega-mj.com/
- 版本公告（Ver10.5.0，2026-03-24）：https://pl.sega-mj.com/official_view/page?news_id=8919
- App Store（iOS 截图）：https://apps.apple.com/jp/app/%E3%82%BB%E3%82%ACnet%E9%BA%BB%E9%9B%80-mj/id666206963
- Google Play（Android 截图）：https://play.google.com/store/apps/details?id=jp.co.sega.am2.MJMobile

## 参考板采集清单（逐屏）

### 桌面端（至少每个样本2张）
1. 主牌桌常态（可见四家座位、牌河、手牌、动作区）
2. 响应窗口态（可见目标牌和可响应动作）
3. 结果弹窗态（可见赢家/关系/分差）

### 移动端（至少每个样本2张）
1. 主牌桌常态（手牌可达 + 主动作区可达）
2. 结果弹窗态（解释闭环）
3. 若可获得：错误/忙碌态

## 可量化对标参数（用于下一轮重构）

### 1) 空间占比
- 桌心主舞台占比：目标 `56%~64%`（当前我方稿偏低）。
- 侧栏可视权重：目标 `<=18%`，默认低对比。
- 底部手牌+动作区占比：目标 `24%~30%`。

### 2) 牌面系统
- 手牌宽高比：目标接近 `0.68~0.72`。
- 牌体边缘与阴影：必须形成“实体牌”而非平面方块。
- 最近目标牌高亮：亮度与描边需显著高于历史牌河。

### 3) 信息层级
- 首眼路径必须落在：`目标牌 -> 可响应原因 -> 主动作`。
- 日志/诊断默认态对比度需低于主链路信息至少一个层级。
- 当前行动玩家高亮需持续存在，不可仅瞬时动画。

### 4) 结果页结构
- 标题层：结果类型（tsumo/ron/draw/abort）
- 关系层：赢家+点炮/支付关系
- 数值层：四家分差与累计分
- 行动层：再来一局/回大厅/复盘

## 我方当前稿 vs 竞品差距（关键）
1. 桌毡和桌体材质感仍偏弱，缺少“竞技台”氛围。
2. 牌面仍存在占位块观感，缺少真实牌体细节。
3. 结果页的“赛事播报感”层级不够强。
4. 移动端手牌与动作区的压缩策略还不够像成熟麻将产品。

## Batch-3 执行口径（基于本参考板）
1. 先完成竞品参考截图采集并放入同目录 `competitor-assets/`（仅参考，不入实现产物）。
2. 再重绘 `hifi-html/index.html`，优先修正：桌心占比、牌体比例、目标牌高亮、结果页层级。
3. 每次重绘后按 `13.3` 和 `14.0` 快检，不满足则不得标注“阶段A可入B”。

## 阶段A证据边界声明
- 本文档为设计参考与冻结输入，不包含实现截图/DOM/运行态脚本结果。
- 不改核心规则，不改 CLI 路径。
