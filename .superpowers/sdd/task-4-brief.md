### Task 4: 接入 `AIPlayer.getAIMove`

**Files:**
- Modify: `src/majiang/strategy/agents/ai-player.ts`
- Modify: `tests/majiang/discard-ranker.test.ts`（可增 AIPlayer 烟测，或新建极短 describe）

**Interfaces:**
- Consumes: `pickDiscardIndex`；保留现有 `evaluateTileValue` 作为 `legacyValueAt`
- Produces:
  - `AIPlayer` 实例字段 `private visibleDiscards: Tile[] = []`
  - `public setVisibleDiscards(tiles: Tile[]): void`（防御拷贝）
  - `getAIMove(): number` 改为：空手 → `-1`；否则 `pickDiscardIndex({ handTiles, revealedSets, visibleDiscards: this.visibleDiscards }, (i,t) => this.evaluateTileValue(t,i))`
  - **保留** `getAllTileValues` / `evaluateTileValue` 私有方法供 legacy 破平与调试日志；可在 `getAIMove` 打一条 debug：最终索引与 `scoreDiscardCandidates` 首项摘要

- [ ] **Step 1: 写失败烟测（AIPlayer 走排序器）**

在 `tests/majiang/discard-ranker.test.ts` 追加：

```typescript
import { AIPlayer } from '../../src/majiang/strategy/agents/ai-player';

describe('AIPlayer · P1 接入', () => {
  it('getAIMove 在现物场景下打出安全字牌', () => {
    const id = tid();
    const ai = new AIPlayer('测AI');
    ai.handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 3, id.next()),
      new Tile(TileType.WAN, 4, id.next()),
      new Tile(TileType.WAN, 5, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.TIAO, 2, id.next()),
      new Tile(TileType.TIAO, 3, id.next()),
      new Tile(TileType.TIAO, 4, id.next()),
      new Tile(TileType.TONG, 7, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 9, id.next()),
      new Tile(TileType.FENG, 2, id.next()),
      new Tile(TileType.JIAN, 1, id.next()),
    ];
    ai.setVisibleDiscards([new Tile(TileType.JIAN, 1, id.next())]);
    const idx = ai.getAIMove();
    expect(ai.handTiles[idx].type).to.equal(TileType.JIAN);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: FAIL（`setVisibleDiscards` 不存在，或仍走旧权重打出非中）

- [ ] **Step 3: 改 AIPlayer**

在 `ai-player.ts` 顶部增加：

```typescript
import { pickDiscardIndex } from '../heuristics/discard-ranker';
```

类内增加：

```typescript
private visibleDiscards: Tile[] = [];

public setVisibleDiscards(tiles: Tile[]): void {
  this.visibleDiscards = tiles.map(t => t.clone());
}
```

将 `getAIMove` 的核心选牌（`needsToDiscard` 为真的分支与正常分支）收敛为：

```typescript
const index = pickDiscardIndex(
  {
    handTiles: this.handTiles,
    revealedSets: this.revealedSets ?? [],
    visibleDiscards: this.visibleDiscards
  },
  (i, tile) => this.evaluateTileValue(tile, i)
);
if (index >= 0 && index < this.handTiles.length) {
  debugLog(`AI P1排序选择索引 ${index}: ${this.handTiles[index].toString()}`);
  return index;
}
return this.handTiles.length - 1;
```

删除或绕开「仅 `getAllTileValues()[0]`」作为唯一决策的路径；异常 fallback 仍打最后一张。**不要**改 `handleDiscard` 的 `process.exit` 行为（本计划不修该历史问题）。

- [ ] **Step 4: 跑测确认通过**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: PASS

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/majiang/strategy/agents/ai-player.ts tests/majiang/discard-ranker.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): AIPlayer 出牌接入向听启发式排序

人机主路径弃牌改为向听/有效牌/现物优先，旧权重仅作破平。
EOF
)"
```

---

