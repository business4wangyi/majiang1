### Task 1: EV 评估器 · 进攻期望主序

**Files:**
- Create: `src/majiang/strategy/heuristics/ev-discard-evaluator.ts`
- Create: `tests/majiang/ev-discard-evaluator.test.ts`
- Modify: `src/majiang/strategy/heuristics/index.ts`

**Interfaces:**
- Consumes: `scoreDiscardCandidates` / `DiscardRankContext` from `./discard-ranker`；`Tile` / `TileType`
- Produces:
  - `export interface EvDiscardContext extends DiscardRankContext { tilesLeft?: number; }`
  - `export interface EvDiscardScore { index: number; tile: Tile; shantenAfter: number; ukeire: number; dealInRisk: number; offense: number; defense: number; ev: number; }`
  - `export const EV_CONSTANTS: { WIN_PROXY: number; DEAL_IN_PENALTY: number; LATE_TILES_LEFT: number; LATE_RISK_MULT: number; }`
  - `export function estimateDealInRisk(tile: Tile, visibleDiscards?: Tile[], tilesLeft?: number): number`
  - `export function scoreDiscardByEv(ctx: EvDiscardContext, legacyValueAt?: (index: number, tile: Tile) => number): EvDiscardScore[]`
  - `export function pickDiscardIndexByEv(ctx: EvDiscardContext, legacyValueAt?: (index: number, tile: Tile) => number): number`

- [ ] **Step 1: 写失败测例（同向听时，有效牌更宽者 EV 更高并被选中）**

```typescript
import { expect } from 'chai';
import { Tile, TileType } from '../../src/majiang/core/tile';
import {
  pickDiscardIndexByEv,
  scoreDiscardByEv
} from '../../src/majiang/strategy/heuristics/ev-discard-evaluator';

function tid() {
  let n = 1;
  return { next: () => n++ };
}

describe('ev-discard-evaluator · 进攻期望', () => {
  it('有明显孤张字牌时，应优先打出该孤张（offense 主导）', () => {
    const id = tid();
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
      new Tile(TileType.TIAO, 2, id.next()),
      new Tile(TileType.TIAO, 3, id.next()),
      new Tile(TileType.FENG, 1, id.next()) // 东风孤张
    ];
    const idx = pickDiscardIndexByEv({ handTiles, revealedSets: [] });
    expect(handTiles[idx].type).to.equal(TileType.FENG);
    const scores = scoreDiscardByEv({ handTiles, revealedSets: [] });
    expect(scores[0].tile.type).to.equal(TileType.FENG);
    expect(scores[0].ev).to.be.greaterThan(scores[scores.length - 1].ev);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx mocha -r ts-node/register tests/majiang/ev-discard-evaluator.test.ts --timeout 10000`  
Expected: FAIL（模块不存在 / 导出名未定义）

- [ ] **Step 3: 最小实现（进攻项 + 基础点炮风险；先让孤张字牌测例绿）**

`src/majiang/strategy/heuristics/ev-discard-evaluator.ts`:

```typescript
import { Tile, TileType } from '../../core/tile';
import {
  DiscardRankContext,
  scoreDiscardCandidates
} from './discard-ranker';

export interface EvDiscardContext extends DiscardRankContext {
  tilesLeft?: number;
}

export interface EvDiscardScore {
  index: number;
  tile: Tile;
  shantenAfter: number;
  ukeire: number;
  dealInRisk: number;
  offense: number;
  defense: number;
  ev: number;
}

export const EV_CONSTANTS = {
  WIN_PROXY: 100,
  DEAL_IN_PENALTY: 120,
  LATE_TILES_LEFT: 30,
  LATE_RISK_MULT: 1.4
};

function tileKey(t: Tile): string {
  return `${t.type}-${t.value}`;
}

export function estimateDealInRisk(
  tile: Tile,
  visibleDiscards?: Tile[],
  tilesLeft?: number
): number {
  const seen = new Set((visibleDiscards ?? []).map(tileKey));
  let risk: number;
  if (seen.has(tileKey(tile))) risk = 0.05;
  else if (tile.type === TileType.FENG || tile.type === TileType.JIAN) risk = 0.25;
  else if (tile.value === 1 || tile.value === 9) risk = 0.35;
  else risk = 0.55;

  if (
    tilesLeft != null &&
    tilesLeft < EV_CONSTANTS.LATE_TILES_LEFT
  ) {
    risk = Math.min(1, risk * EV_CONSTANTS.LATE_RISK_MULT);
  }
  return risk;
}

export function scoreDiscardByEv(
  ctx: EvDiscardContext,
  legacyValueAt?: (index: number, tile: Tile) => number
): EvDiscardScore[] {
  const ranked = scoreDiscardCandidates(ctx, legacyValueAt);
  const scores: EvDiscardScore[] = ranked.map(r => {
    const dealInRisk = estimateDealInRisk(
      r.tile,
      ctx.visibleDiscards,
      ctx.tilesLeft
    );
    const offense =
      (EV_CONSTANTS.WIN_PROXY / Math.pow(r.shantenAfter + 1, 2)) *
      (r.ukeire + 1);
    const defense = dealInRisk * EV_CONSTANTS.DEAL_IN_PENALTY;
    return {
      index: r.index,
      tile: r.tile,
      shantenAfter: r.shantenAfter,
      ukeire: r.ukeire,
      dealInRisk,
      offense,
      defense,
      ev: offense - defense
    };
  });

  scores.sort((a, b) => {
    if (a.ev !== b.ev) return b.ev - a.ev;
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    if (a.ukeire !== b.ukeire) return b.ukeire - a.ukeire;
    return a.index - b.index;
  });
  return scores;
}

export function pickDiscardIndexByEv(
  ctx: EvDiscardContext,
  legacyValueAt?: (index: number, tile: Tile) => number
): number {
  if (ctx.handTiles.length === 0) return -1;
  return scoreDiscardByEv(ctx, legacyValueAt)[0].index;
}
```

`index.ts` 增加：

```typescript
export {
  scoreDiscardByEv,
  pickDiscardIndexByEv,
  estimateDealInRisk,
  EV_CONSTANTS,
  EvDiscardContext,
  EvDiscardScore
} from './ev-discard-evaluator';
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx mocha -r ts-node/register tests/majiang/ev-discard-evaluator.test.ts --timeout 10000`  
Expected: PASS

- [ ] **Step 5: Commit（仅用户明确要求时）**

```bash
# 用户要求提交后再执行
git add src/majiang/strategy/heuristics/ev-discard-evaluator.ts \
  src/majiang/strategy/heuristics/index.ts \
  tests/majiang/ev-discard-evaluator.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): 新增 P2 弃牌期望值评估器进攻主序

EOF
)"
```

---

