### Task 5: 出牌前注入桌上可见弃牌

**Files:**
- Modify: `src/majiang/strategy/agents/ai-player.ts`（`handleDiscard`）
- Modify: `src/majiang/ui/game-event-handler.ts`（仅当 AI 无 Game 引用时的最小桥；优先在 `handleDiscard` 内用已有 `gameEventHandler`）

**Interfaces:**
- Consumes: `GameEventHandler` 上可读的 `game.getAllPlayers()`（若当前为 `protected game`，在 handler 增加窄方法，禁止把整个 Game 塞进策略层乱调用）
- Produces:
  - `GameEventHandler.collectVisibleDiscards(): Tile[]` — 拼接所有玩家 `discardedTiles` 的 clone 列表
  - `AIPlayer.handleDiscard` 在 `getAIMove` 前调用：`this.setVisibleDiscards(gameEventHandler.collectVisibleDiscards())`

- [ ] **Step 1: 写失败测例（handler 收集）**

新建短测或追加到 `tests/majiang/discard-ranker.test.ts`：

```typescript
import { Game } from '../../src/majiang/core/game';
import { TileManager } from '../../src/majiang/core/tile-manager';
import { GameEventHandler } from '../../src/majiang/ui/game-event-handler';

describe('GameEventHandler · 可见弃牌', () => {
  it('collectVisibleDiscards 汇总各家弃牌', () => {
    const game = new Game();
    // 按仓库现有测例方式塞玩家与 discardedTiles；若 Game 构造已带 AI，直接取 getAllPlayers()
    const players = game.getAllPlayers();
    expect(players.length).to.be.greaterThan(0);
    players[0].discardedTiles = [new Tile(TileType.WAN, 1, 1)];
    if (players[1]) players[1].discardedTiles = [new Tile(TileType.TIAO, 9, 2)];
    const handler = new GameEventHandler(game, new TileManager());
    const visible = handler.collectVisibleDiscards();
    expect(visible.some(t => t.type === TileType.WAN && t.value === 1)).to.equal(true);
  });
});
```

若 `Game` 构造/玩家初始化与上文不符，以 `tests/majiang/game-session.test.ts` 或 `game.test.ts` 里**已有**建局方式为准改写本测例，禁止新造第二套 Game 工厂。

- [ ] **Step 2: 跑测确认失败**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: FAIL（`collectVisibleDiscards` 不存在）

- [ ] **Step 3: 实现收集 + 注入**

`game-event-handler.ts`:

```typescript
public collectVisibleDiscards(): Tile[] {
  const out: Tile[] = [];
  for (const p of this.game.getAllPlayers()) {
    for (const t of p.discardedTiles ?? []) {
      out.push(t.clone());
    }
  }
  return out;
}
```

`ai-player.ts` `handleDiscard` 在 `await AIPlayer.pauseForThinking()` 之后、`getAIMove()` 之前：

```typescript
this.setVisibleDiscards(gameEventHandler.collectVisibleDiscards());
```

- [ ] **Step 4: 跑测确认通过**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: PASS

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/majiang/strategy/agents/ai-player.ts \
  src/majiang/ui/game-event-handler.ts \
  tests/majiang/discard-ranker.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): 出牌前注入桌上可见弃牌供危险度评估

打通 GameEventHandler 到 AIPlayer 的现物信号，不改规则权威。
EOF
)"
```

---

