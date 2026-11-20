# Review package Task 2 (ukeire)
Note: no commits; package is Task-2-relevant working tree snapshot after Task 1 approved.
Focus: countUkeire + ukeire fill + new test describe.

## discard-ranker.ts (full current)
```typescript
import { Player, PlayerType } from '../../core/player';
import { Tile, TileType } from '../../core/tile';
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

const SUIT_MAX: Partial<Record<TileType, number>> = {
  [TileType.WAN]: 9,
  [TileType.TIAO]: 9,
  [TileType.TONG]: 9,
  [TileType.FENG]: 4,
  [TileType.JIAN]: 3
};

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

export function scoreDiscardCandidates(
  ctx: DiscardRankContext,
  legacyValueAt: (index: number, tile: Tile) => number = () => 0
): DiscardCandidateScore[] {
  const { handTiles, revealedSets } = ctx;
  const scores: DiscardCandidateScore[] = handTiles.map((tile, index) => {
    const probe = cloneProbe(handTiles, revealedSets, index);
    const shantenAfter = RuleEngine.calculateShanten(probe);
    const ukeire = countUkeire(probe);
    return {
      index,
      tile,
      shantenAfter,
      ukeire,
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

## discard-ranker.test.ts (full current)
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
    // 刻子向听估算下：111/999万 + 111条 + 99条将 + 东南西孤张；
    // 打字牌后 shantenAfter 严格小于拆万子刻子（原 brief 顺子手在近似公式下并列 0 听，索引平局会误拆万）。
    const handTiles = [
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 1, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.WAN, 9, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 1, id.next()),
      new Tile(TileType.TIAO, 9, id.next()),
      new Tile(TileType.TIAO, 9, id.next()),
      new Tile(TileType.FENG, 1, id.next()), // 东 · 孤张
      new Tile(TileType.FENG, 2, id.next()), // 南 · 孤张
      new Tile(TileType.FENG, 3, id.next()), // 西 · 第 14 张孤张
    ];
    const idx = pickDiscardIndex({ handTiles, revealedSets: [] });
    const picked = handTiles[idx];
    expect(picked.type === TileType.FENG || picked.type === TileType.TONG).to.equal(true);
    // 不应拆 111/999 万刻子中的一张
    expect(picked.type === TileType.WAN).to.equal(false);
  });
});

describe('discard-ranker · 有效牌破平', () => {
  it('向听差相同时，应选择 ukeire 更大的弃牌', () => {
    const id = tid();
    // brief 顺子手在 calculateRegularShanten（向听下限 0）下全员 sh=0、ukeire 恒 0，无法破平；
    // 改用刻子向：打出后 sh≥1，同 shanten 组内风孤张 ukeire 高于孤张条。
    const handTiles = [
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.WAN, 2, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TIAO, 5, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.TONG, 8, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.WAN, 6, id.next()),
      new Tile(TileType.TIAO, 1, id.next()), // 孤张条 · 同向听但 ukeire 较低
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

## Implementer report excerpt
# Task 2 Report: 有效牌（ukeire）破平

## Status

**DONE_WITH_CONCERNS**

## Commits

none（按 critical override 跳过 Step 5）

## TDD Evidence

### RED

1. Appended `describe('discard-ranker · 有效牌破平')` with brief 顺子手（123456万 + 234条 + 789筒 + 南北）。
2. Command: `node scripts/test/run-mocha-cjs.js tests/majiang/discard-ranker.test.ts --timeout 20000`
3. Result: **FAIL** — `expected '万' to equal '风'`（`ukeire` 仍为占位 0，排序落到更小 `index` 的万）。

### GREEN（实现）

1. In `discard-ranker.ts`: added `SUIT_MAX`、`countUkeire(probe)`；`scoreDiscardCandidates` 写入 `ukeire = countUkeire(probe)`。
2. Re-ran same command with brief 顺子手：**仍 FAIL** — 全员 `shantenAfter=0`、`ukeire=0`。
   - 根因：`RuleEngine.calculateRegularShanten` 对向听做了 `Math.max(0, …)`，听牌（sh=0）后无法出现严格下降，故 `countUkeire` 恒为 0。
3. Per override「若 shanten 近似破坏测例手牌，仅调整测例构造」：改用刻子向手牌  
   `222万 / 555条 / 888筒 / 66万 / 1条 / 南 / 北`。
   - 同 `shantenAfter=1` 组：风孤张 `ukeire=17` > 孤张条 `ukeire=16`（若 ukeire 全 0 会因 index 误选条）。
4. Re-ran: **3373 passing (11s)**，两段 `discard-ranker` describe 均 ✔。

## Files Changed

| File | Change |
| --- | --- |
| `src/majiang/strategy/heuristics/discard-ranker.ts` | `countUkeire` + 填充 `ukeire` |
| `tests/majiang/discard-ranker.test.ts` | Task 2 describe；测例手牌改为刻子向 |
| `.superpowers/sdd/task-2-report.md` | 本报告 |

## Self-review

- 未改 `core/`、未加依赖、未动 `AIPlayer`。
- 排序仍：`shantenAfter ↑` → `ukeire ↓` → `danger ↑` → `legacyValue ↓` → `index`。
- `countUkeire`：枚举种类（不乘剩余张数），与 brief 一致。
- 测试跑法遵循仓库 CJS loader，未用 bare `npx mocha -r ts-node/register`。

## Concerns

1. **向听下限 0**：听牌局面 `ukeire` 恒 0，破平失效；后续若要真听牌进张面，需允许 shanten=-1（或单独判定和了）。
2. **测例与 brief 牌面不同**：为适配现有近似公式而改构造；语义仍覆盖「同向听选更大 ukeire」。
3. **性能**：每候选 × ~34 种试摸 × `calculateShanten`；本单测约数秒级，可接受，但全量对局热路径若频繁调用需再缓存/剪枝。
