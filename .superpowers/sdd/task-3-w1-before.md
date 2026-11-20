# 波次蓝图：麻将 Web UI · W1（规则/流程定封顶锚波）

| 字段 | 内容 |
|------|------|
| 主题 | majiang-webui |
| 波次 | W1 |
| UI 层 | 流程合同（非纯视觉刀） |
| 施工状态 | **规则与交付流程已落盘**；视觉冲顶切片仍按脊骨排队 |
| 脊骨 | `docs/product/spines/majiang-webui-target.md` |

## 用户故事

作为协作者，我希望仓库有一份与量化仓同构但更轻的「定封顶 + 落地」规则：Agent 知道读哪、人审知道批什么，麻将 Web UI 冲顶不跟功能绿混淆。

## 终态效果

- `docs/standards/rules/index.md` 可按任务触发读规则  
- `docs/product/delivery-flow.md` 可指导脊骨/波次/切片  
- 脊骨诚实记录毕业未达项（移动端、整桌观感）

## 硬不做

- 不引入 OpenSpec / Fast-lane  
- 不宣称视觉冲顶已毕业  
- 不改 `src/majiang/core/` 规则语义（本波）

## 本波切片

| 切片 | 内容 | 状态 |
|------|------|------|
| `MJ-STD-01` | 规则触发表 + E0/R1 正文 + AGENTS/薄入口 | 本波落地 |
| `MJ-STD-02` | delivery-flow + webui 脊骨 + 本蓝图 | 本波落地 |

## 下一波

按脊骨 G1/G4 开视觉/移动端波；须新人审蓝图后再施工。
