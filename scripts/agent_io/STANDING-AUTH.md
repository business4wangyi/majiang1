# 双表面队列 · 编排常设授权（人批）

> 生效：2026-11-17 · 人口头：「后续不需再人审，直接都 1 合入再武装」

## 授权范围

对队列 `majiang-dual-surface` 中 **非人闸门** 刀（`kind` ≠ seal / 非 `CAP-DUAL-GRAD`）：

1. 刀完成后若在 `feat/*` worktree：自动 **merge 进 `develop`**（可 stash 主仓无关脏文件）
2. 合入后跑 `npm test` + 相关 dual smoke/nightly（够用即停）
3. 清理 worktree / 删功能分支
4. **重新武装** `/loop` 并 `queue once` 下一刀

## 人闸门

- `CAP-DUAL-GRAD`：**已人批**（2026-11-18 · 「批准毕业并回写账本」）；此后本队列默认无下一施工刀
- 视觉冲顶、合入 `main`/远程 push：未另授权则不做

## 编排会话义务

收到 loop 拍或 `queue once` 完成通知时：若上一刀 done 且未合入 develop → **直接执行上述 1–4**，不再出 1/2/3 决策卡（GRAD 除外）。
