# 高保真原型（HTML/CSS 免费方案）

## 当前版本
- `index.html`：**Batch-3（S-C 主锚点）**

## 预览
```bash
python3 -m http.server 9030
```
访问：
- `http://127.0.0.1:9030/docs/majiang/design-freeze/stage-a-2026-05-10/hifi-html/index.html`

## Batch-3 变化要点
1. 按真实对局样本重构围桌关系与桌心占比。
2. 强化牌河秩序与目标牌高亮，提升可响应链路直读性。
3. 维持单强主动作策略（PlayerTurn=出牌，ResponseWindow=过）。
4. 结果弹窗固定四层解释结构（类型/关系/分差/下一步）。
5. 继续保持阶段A边界：不涉及实现代码、DOM、运行态脚本证据。

## 样本来源（当前）
- 主锚点：`competitor-assets/sega-mj/*.jpg`（真实对局图）
- 辅锚点：`competitor-assets/riichi-city/*.jpg`
- S-A/S-B 仍在继续筛选“非广告”真对局图。
