### Task 3: AIPlayer 接入策略 `p2`

**Files:**
- Modify: `src/majiang/strategy/agents/ai-player.ts`
- Create: `tests/majiang/ai-player-p2.test.ts`

**Interfaces:**
- Consumes: `pickDiscardIndexByEv`
- Produces: `DiscardStrategy = 'p1' | 'p2' | 'legacy'`；`resolveDiscardStrategy` 识别 `p2` / env `MAJIANG_DISCARD_STRATEGY=p2`；`getAIMove` 在 `p2` 时走 EV

- [ ] **Step 1: 写失败测例**

```typescript
import { expect } from 'chai';
import { AIPlayer } from '../../src/majiang/strategy/agents/ai-player';
import { Tile, TileType } from '../../src/majiang/core/tile';

describe('AIPlayer · P2 接入', () => {
  it('显式 p2 策略时 getDiscardStrategy 为 p2', () => {
    const ai = new AIPlayer('测P2', 'p2');
    expect(ai.getDiscardStrategy()).to.equal('p2');
  });

  it('p2 在孤张字牌局面应打出字牌', () => {
    const ai = new AIPlayer('测P2出牌', 'p2');
    let n = 1;
    ai.handTiles = [
      new Tile(TileType.WAN, 1, n++),
      new Tile(TileType.WAN, 2, n++),
      new Tile(TileType.WAN, 3, n++),
      new Tile(TileType.WAN, 4, n++),
      new Tile(TileType.WAN, 5, n++),
      new Tile(TileType.WAN, 6, n++),
      new Tile(TileType.WAN, 7, n++),
      new Tile(TileType.WAN, 8, n++),
      new Tile(TileType.WAN, 9, n++),
      new Tile(TileType.TIAO, 1, n++),
      new Tile(TileType.TIAO, 2, n++),
      new Tile(TileType.TIAO, 3, n++),
      new Tile(TileType.FENG, 1, n++)
    ];
    const idx = ai.getAIMove();
    expect(ai.handTiles[idx].type).to.equal(TileType.FENG);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx mocha -r ts-node/register tests/majiang/ai-player-p2.test.ts --timeout 10000`  
Expected: FAIL（`'p2'` 不在类型联合 / 未分支）

- [ ] **Step 3: 最小改动接入**

在 `ai-player.ts`：

1. `export type DiscardStrategy = 'p1' | 'p2' | 'legacy';`
2. `resolveDiscardStrategy`：`explicit === 'p2'` 或 env `=== 'p2'` → `'p2'`
3. `getAIMove`：在 `legacy` 分支后、`p1` 默认分支前增加：

```typescript
if (this.discardStrategy === 'p2') {
  const index = pickDiscardIndexByEv(
    {
      handTiles: this.handTiles,
      revealedSets: this.revealedSets ?? [],
      visibleDiscards: this.visibleDiscards
      // tilesLeft：本切片不强制注入；后续可在 EventHandler 设可选 setter
    },
    (i, tile) => this.evaluateTileValue(tile, i)
  );
  if (index >= 0 && index < this.handTiles.length) {
    debugLog(`AI P2期望值选择索引 ${index}: ${this.handTiles[index].toString()}`);
    return index;
  }
  return this.handTiles.length - 1;
}
```

4. import：`import { pickDiscardIndex } from '../heuristics/discard-ranker';` 旁增加 `pickDiscardIndexByEv` from `../heuristics/ev-discard-evaluator`（或从 `../heuristics`）。

可选（同一 Task 内若改动仍小）：增加 `private tilesLeft?: number` + `setTilesLeft(n: number)`，`getAIMove` 传入 `tilesLeft`；**不**强制改 `GameEventHandler`——残牌加压在单测用 ctx 覆盖即可，对战切片可后补。

- [ ] **Step 4: 跑测通过**

Run: `npx mocha -r ts-node/register tests/majiang/ai-player-p2.test.ts tests/majiang/ev-discard-evaluator.test.ts --timeout 10000`  
Expected: PASS

- [ ] **Step 5: Commit（仅用户明确要求时）**

```bash
git add src/majiang/strategy/agents/ai-player.ts tests/majiang/ai-player-p2.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): AIPlayer 接入 P2 期望值弃牌策略

EOF
)"
```

---

