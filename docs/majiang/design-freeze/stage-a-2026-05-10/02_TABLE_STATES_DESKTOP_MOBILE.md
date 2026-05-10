# Table 状态图样冻结（桌面+移动）

```mermaid
stateDiagram-v2
    [*] --> WaitingAI
    WaitingAI --> PlayerTurn: 轮到我方
    WaitingAI --> ResponseWindow: 他家出牌触发可响应
    PlayerTurn --> Submitting: 出牌/主动作提交
    ResponseWindow --> Submitting: 吃碰杠胡过提交
    Submitting --> WaitingAI: 成功
    Submitting --> ActionError: 失败
    ActionError --> PlayerTurn: 返回可操作
    WaitingAI --> Ended: 对局结束
    PlayerTurn --> Ended: 自摸结束
    ResponseWindow --> Ended: 荣和结束
```

## Desktop-L/M 结构图样
```mermaid
flowchart TB
    T[顶部状态栏: 局数/圈风/牌山/当前行动] --> M[桌心主舞台]
    M --> M1[最近目标牌]
    M --> M2[可响应原因]
    M --> M3[唯一主动作提示]
    M --- L[左家/上家/右家座位]
    M --- B[底部: 我方手牌区]
    B --> A[主操作区: 单强主动作 + 次级动作收纳]
    R[右侧栏: 事件流/诊断入口 默认弱化]
```

## Mobile 结构图样
```mermaid
flowchart TB
    T[顶部: 当前行动+牌山+最近动作] --> C[中部简化牌桌]
    C --> O[其他三家压缩座位状态]
    C --> D[牌河简化栅格]
    D --> H[底部吸附手牌]
    H --> A[紧贴主操作区]
    X[抽屉: 事件流/诊断/完整座位信息]
```

## 状态到UI映射
- WaitingAI：桌心显示 `等待AI动作`，主操作区仅保留 `过(禁用)` 占位。
- PlayerTurn：手牌可选，默认强主动作为 `出牌`。
- ResponseWindow：默认强主动作为 `过`，仅当选中可执行动作时主动作切换到对应动作。
- Submitting：冻结按钮与手牌点击，桌心显示提交进度。
- ActionError：内联错误条 + 自动回到上一次可操作态，保留上下文牌。
- Ended：主操作区隐藏，仅保留 `查看结果` 入口。
