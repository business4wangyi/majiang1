### Task 1: 弃牌排序器 · 向听差主排序

**Files:**
- Create: `src/majiang/strategy/heuristics/discard-ranker.ts`
- Create: `src/majiang/strategy/heuristics/index.ts`
- Create: `tests/majiang/discard-ranker.test.ts`
- Modify: `src/majiang/strategy/index.ts`（末尾增加一行 re-export）

**Interfaces:**
- Consumes: `RuleEngine.calculateShanten(player: Player): number`；`Player` / `Tile` / `TileSet`
- Produces:
  - `export interface DiscardRankContext { handTiles: Tile[]; revealedSets: TileSet[]; visibleDiscards?: Tile[]; }`
  - `export interface DiscardCandidateScore { index: number; tile: Tile; shantenAfter: number; ukeire: number; danger: number; legacyValue: number; }`
  - `export function scoreDiscardCandidates(ctx: DiscardRankContext, legacyValueAt?: (index: number, tile: Tile) => number): DiscardCandidateScore[]`
  - `export function pickDiscardIndex(ctx: DiscardRankContext, legacyValueAt?: (index: number, tile: Tile) => number): number`
  - 排序键（升序优先打出）：`shantenAfter` ↑ → `ukeire` ↓ → `danger` ↑ → `legacyValue` ↑ → `index` ↑

- [ ] **Step 1: 写失败测例（向听：打孤张优于拆完整面子）**

```typescript
import { expect } from 'chai';
import { Player, PlayerType } from '../../src/majiang/core/player';
import { Tile, TileType } from '../../src/majiang/core/tile';
import { pickDiscardIndex, scoreDiscardCandidates } from '../../src/majiang/strategy/heuristics/discard-ranker';

function tid(): { next: () => number } {
  let n = 1;
  return { next: () => n++ };
}

describe('discard-ranker · 向听主排序', () => {
  it('有明显孤张字牌时，应优先打出该孤张而非拆万子顺子', () => {
    const id = tid();
    // 123万 456万 789万 + 东风孤张（13 张听前形态的简化：12 张面子向 + 1 孤张）
    const handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 3, id.next()),
      new Tile(TileType.WAN, 4, id.next()),
      new Tile(TileType.WAN, 5, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.WAN, 7, id.next()),
      new Tile(TileType.WAN, 8, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.FENG, 1, id.next()), // 东 · 孤张
      new Tile(TileType.TONG, 5, id.next()), // 摸进后第 14 张：另一张孤立筒
    ];
    const idx = pickDiscardIndex({ handTiles, revealedSets: [] });
    const picked = handTiles[idx];
    expect(picked.type === TileType.FENG || picked.type === TileType.TONG).to.equal(true);
    // 不应拆 123/456/789 万中的一张
    expect(picked.type === TileType.WAN).to.equal(false);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 10000
```

Expected: FAIL（模块不存在 / `pickDiscardIndex` 未定义）

- [ ] **Step 3: 最小实现（仅向听差 + 占位 ukeire/danger）**

`src/majiang/strategy/heuristics/discard-ranker.ts`:

```typescript
import { Player, PlayerType } from '../../core/player';
import { Tile } from '../../core/tile';
import { TileSet } from '../../core/rule-types';
import { RuleEngine } from '../../core/rule-engine';

export interface DiscardRankContext {
  handTiles: Tile[];
  revealedSets: TileSet[];
  visibleDiscards?: Tile[];
}

export interface DiscardCandidateScore {
  index: number;
  tile: Tile;
  shantenAfter: number;
  ukeire: number;
  danger: number;
  legacyValue: number;
}

function cloneProbe(handTiles: Tile[], revealedSets: TileSet[], dropIndex: number): Player {
  const p = new Player(0, 'probe', PlayerType.AI);
  p.handTiles = handTiles.filter((_, i) => i !== dropIndex).map(t => t.clone());
  p.revealedSets = revealedSets.map(s => ({
    type: s.type,
    tiles: s.tiles.map(t => t.clone()),
    source: s.source
  }));
  return p;
}

export function scoreDiscardCandidates(
  ctx: DiscardRankContext,
  legacyValueAt: (index: number, tile: Tile) => number = () => 0
): DiscardCandidateScore[] {
  const { handTiles, revealedSets } = ctx;
  const scores: DiscardCandidateScore[] = handTiles.map((tile, index) => {
    const probe = cloneProbe(handTiles, revealedSets, index);
    const shantenAfter = RuleEngine.calculateShanten(probe);
    return {
      index,
      tile,
      shantenAfter,
      ukeire: 0, // Task 2 填充
      danger: 0, // Task 3 填充
      legacyValue: legacyValueAt(index, tile)
    };
  });

  scores.sort((a, b) => {
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    if (a.ukeire !== b.ukeire) return b.ukeire - a.ukeire;
    if (a.danger !== b.danger) return a.danger - b.danger;
    if (a.legacyValue !== b.legacyValue) return a.legacyValue - b.legacyValue;
    return a.index - b.index;
  });
  return scores;
}

export function pickDiscardIndex(
  ctx: DiscardRankContext,
  legacyValueAt?: (index: number, tile: Tile) => number
): number {
  if (ctx.handTiles.length === 0) return -1;
  return scoreDiscardCandidates(ctx, legacyValueAt)[0].index;
}
```

`src/majiang/strategy/heuristics/index.ts`:

```typescript
export {
  scoreDiscardCandidates,
  pickDiscardIndex,
  DiscardRankContext,
  DiscardCandidateScore
} from './discard-ranker';
```

`src/majiang/strategy/index.ts` 在 agents 导出后增加：

```typescript
export * from './heuristics';
```

- [ ] **Step 4: 跑测确认通过**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 10000
```

Expected: PASS。若因 `calculateShanten` 估算误差导致「万子被拆」，调整测例手牌使「打东/筒后 shantenAfter 严格更小」，**不要**改 core 向听公式。

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/majiang/strategy/heuristics/discard-ranker.ts \
  src/majiang/strategy/heuristics/index.ts \
  src/majiang/strategy/index.ts \
  tests/majiang/discard-ranker.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): 新增弃牌排序器并以向听差为主键

为 P1 启发式加固提供可单测的纯函数入口，暂不改 AIPlayer 行为。
EOF
)"
```

---

