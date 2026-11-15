# 智能体工作约定

## 规范读取要求

1. **首先**读取 `docs/standards/rules/index.md`（任务触发表），按任务加载对应规则正文  
2. **涉及解释 / 设计 / brainstorming / 给用户结论**：须 **MUST Read** `docs/standards/rules/communication-for-beginners.md`（E0）  
3. **涉及 git commit / 用户要求提交**：须 **MUST Read** `docs/standards/rules/commit-policy.md`（E0）  
4. **涉及抬天花板 / 波次 / 脊骨 / UI 层 U0·U1·U2 / 冲顶**：须 **MUST Read** `docs/product/delivery-flow.md`（E0）  
5. **涉及 security / 密钥**：须 **MUST Read** `docs/standards/rules/security-baseline.md`（R1）  
6. **涉及改码 / 分层**：须 **MUST Read** `docs/standards/rules/development.md`（R1）  
7. **涉及测试 / 回归**：须 **MUST Read** `docs/standards/testing/quality.md`（R1）  
8. Cursor 可同时读 `.cursor/rules/00-standards-index.mdc`（薄入口，**不替代**第 1 步）  
9. **涉及规则/规范/IDE 入口修改**：`.cursor/rules/*.mdc` 只做薄引读；正文只写在 `docs/standards/` 或 `docs/product/`

## 规范源（SSOT）

- **正文源**：`docs/standards/rules/`、`docs/standards/testing/`、`docs/product/`  
- **注册入口**：`docs/standards/rules/index.md`  
- **演进闭环**：`docs/standards/rule-evolution.md`

禁止把 IDE 私有目录当作唯一规范来源。

## 规范优先级（高 → 低）

1. 本文件 `AGENTS.md` 项目专属约束  
2. `docs/standards/overrides/`（若存在）  
3. `docs/standards/rules/` 与 `docs/product/`（含 E0）  
4. `docs/standards/testing/`  
5. `.cursor/rules/*.mdc`、`.codex/AGENTS.md`、`.augment/rules/*`（薄入口）  
6. 其他参考文档

## 冲突处理

- 按上述优先级裁决；同层取更具体、作用域更小者  
- 安全与破坏性操作取更保守规则  
- 输出须注明冲突点、采用路径与理由

## 本仓硬边界

- 麻将 / 棋类 **UI 不重写** `src/*/core/` 权威规则判定  
- 功能自动化通过 **≠** 视觉冲顶通过  
- 说明优先图表；主语言中文；专业英文名词首次中文解释  
- 提交说明使用中文（见 `commit-policy.md`）

## 输出要求

- 规范决策须引用具体路径（优先 `docs/standards/rules/` 或 `docs/product/`）  
- 对人确认默认用决策卡（见 `communication-for-beginners.md`）
