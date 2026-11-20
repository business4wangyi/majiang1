### Task 3: 简单危险度（现物安全）

**Files:**
- Modify: `src/majiang/strategy/heuristics/discard-ranker.ts`
- Modify: `tests/majiang/discard-ranker.test.ts`

**Interfaces:**
- Consumes: `ctx.visibleDiscards?: Tile[]`（桌上已见弃牌，含各家 `discardedTiles`）
- Produces: `danger` 数值：
  - 若存在 `visibleDiscards` 中 `type+value` 与候选相同 → `danger = 0`（现物，相对安全）
  - 否则字牌/箭牌孤张 → `danger = 1`
  - 否则数牌 → `danger = 2`
  - （P1 不做对手听牌概率模型）

- [ ] **Step 1: 写失败测例**

```typescript
describe('discard-ranker · 现物危险度', () => {
  it('向听与 ukeire 相同时，优先打出现物安全牌', () => {
    const id = tid();
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
      new Tile(TileType.FENG, 2, id.next()),
      new Tile(TileType.JIAN, 1, id.next()), // 中
    ];
    const visibleDiscards = [new Tile(TileType.JIAN, 1, id.next())]; // 中已现物
    const idx = pickDiscardIndex({ handTiles, revealedSets: [], visibleDiscards });
    expect(handTiles[idx].type).to.equal(TileType.JIAN);
    expect(handTiles[idx].value).to.equal(1);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: FAIL（`danger` 未区分现物）

- [ ] **Step 3: 实现 danger**

```typescript
function tileKey(t: Tile): string {
  return `${t.type}-${t.value}`;
}

function scoreDanger(tile: Tile, visibleDiscards: Tile[] | undefined): number {
  const seen = new Set((visibleDiscards ?? []).map(tileKey));
  if (seen.has(tileKey(tile))) return 0;
  if (tile.type === TileType.FENG || tile.type === TileType.JIAN) return 1;
  return 2;
}
```

在 `scoreDiscardCandidates`：

```typescript
danger: scoreDanger(tile, ctx.visibleDiscards),
```

- [ ] **Step 4: 跑测确认通过**

```bash
npx mocha -r ts-node/register tests/majiang/discard-ranker.test.ts --timeout 20000
```

Expected: PASS

- [ ] **Step 5: Commit（仅用户要求时）**

```bash
git add src/majiang/strategy/heuristics/discard-ranker.ts tests/majiang/discard-ranker.test.ts
git commit -m "$(cat <<'EOF'
feat(majiang): 弃牌排序加入现物安全危险度

同向听/有效牌时优先打出已见弃牌，避免无对手模型时的盲目危牌。
EOF
)"
```

---

