### Task 2: 有效牌（ukeire）破平

**Files:**
- Modify: `src/majiang/strategy/heuristics/discard-ranker.ts`
- Modify: `tests/majiang/discard-ranker.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `scoreDiscardCandidates` / `cloneProbe`
- Produces: `ukeire` = 打出后，对「剩余牌种类」枚举一张加入手牌能使 `calculateShanten` **严格下降**的种类数（每种最多计 1；不乘剩余张数，避免依赖牌山状态）
- 辅助：`function countUkeire(probeHand: Player): number`（内部，可不 export）

- [ ] **Step 1: 写失败测例（同向听时选有效牌更多的打法）**

```typescript
describe('discard-ranker · 有效牌破平', () => {
  it('向听差相同时，应选择 ukeire 更大的弃牌', () => {
    const id = tid();
    // 构造两张都「打出后向听不变」的候选；其中一张打出后进张种类更多
    // 具体牌面：在实现后用 scoreDiscardCandidates 断言 max ukeire 的那张被 pick
    const handTiles = [
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
      new Tile(TileType.FENG, 2, id.next()), // 南 · 孤张
      new Tile(TileType.FENG, 4, id.next()), // 北 · 孤张
    ];
    const scores = scoreDiscardCandidates({ handTiles, revealedSets: [] });
    const best = scores[0];
    // 两张风牌孤张中，至少应打风牌；且 best.ukeire >= 同 shantenAfter 组内其他候选
    expect(best.tile.type).to.equal(TileType.FENG);
    const sameShanten = scores.filter(s => s.shantenAfter === best.shantenAfter);
    const maxUkeire = Math.max(...sameShanten.map(s => s.ukeire));
    expect(best.ukeire).to.equal(maxUkeire);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 10000
```

Expected: FAIL（`ukeire` 仍为 0 导致破平断言失败，或行为未区分）

- [ ] **Step 3: 实现 countUkeire 并写入 score**

在 `discard-ranker.ts` 增加（贴进文件，替换 `ukeire: 0`）：

```typescript
import { TileType } from '../../core/tile';

const SUIT_MAX: Partial<Record<TileType, number>> = {
  [TileType.WAN]: 9,
  [TileType.TIAO]: 9,
  [TileType.TONG]: 9,
  [TileType.FENG]: 4,
  [TileType.JIAN]: 3
};

function countUkeire(probe: Player): number {
  const base = RuleEngine.calculateShanten(probe);
  let kinds = 0;
  let syntheticId = 10_000;
  for (const type of Object.values(TileType)) {
    const max = SUIT_MAX[type as TileType] ?? 0;
    for (let value = 1; value <= max; value++) {
      const drawn = new Tile(type as TileType, value, syntheticId++);
      const trial = new Player(0, 'ukeire', PlayerType.AI);
      trial.handTiles = [...probe.handTiles.map(t => t.clone()), drawn];
      trial.revealedSets = probe.revealedSets.map(s => ({
        type: s.type,
        tiles: s.tiles.map(t => t.clone()),
        source: s.source
      }));
      if (RuleEngine.calculateShanten(trial) < base) kinds += 1;
    }
  }
  return kinds;
}
```

在 `scoreDiscardCandidates` 的 map 内：

```typescript
const shantenAfter = RuleEngine.calculateShanten(probe);
const ukeire = countUkeire(probe);
```

- [ ] **Step 4: 跑测确认通过**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 10000
```

Expected: PASS。单测内 `countUkeire` 对最多约 34 种牌 × 手牌候选，应在数秒内结束；若超时将 `--timeout` 提到 `20000`，禁止改为异步训练式搜索。

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/majiang/strategy/heuristics/discard-ranker.ts tests/majiang/discard-ranker.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): 弃牌排序器用有效牌种类数破平

同向听时优先保留进张面更宽的打法。
EOF
)"
```

---

