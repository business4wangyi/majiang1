### Task 2: 点炮代价 · 现物与残牌加压

**Files:**
- Modify: `tests/majiang/ev-discard-evaluator.test.ts`
- Modify: `src/majiang/strategy/heuristics/ev-discard-evaluator.ts`（若 Task1 已含完整 `estimateDealInRisk`，本任务只锁测例）

**Interfaces:**
- Consumes: `estimateDealInRisk`、`pickDiscardIndexByEv`、`EV_CONSTANTS`
- Produces: 行为契约——现物风险低于中张；残牌不足时风险上升；两张同向听候选时优先打现物

- [ ] **Step 1: 写失败测例（现物优先于危险中张）**

```typescript
describe('ev-discard-evaluator · 点炮代价', () => {
  it('两张候选进攻接近时，应优先打出现物（可见弃牌中已有同型）', () => {
    const id = tid();
    // 构造：两张孤张风 + 一张中张孤张；把中张做成「可见现物」应打现物中张，
    // 若未注入 visibleDiscards 则倾向打风；注入后应打出已现物的中张。
    const mid = new Tile(TileType.TONG, 5, id.next());
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
      new Tile(TileType.TIAO, 2, id.next()),
      new Tile(TileType.TIAO, 3, id.next()),
      new Tile(TileType.TIAO, 4, id.next()),
      mid
    ];
    const visibleDiscards = [new Tile(TileType.TONG, 5, 9999)];
    const idx = pickDiscardIndexByEv({
      handTiles,
      revealedSets: [],
      visibleDiscards,
      tilesLeft: 20
    });
    expect(handTiles[idx].type).to.equal(TileType.TONG);
    expect(handTiles[idx].value).to.equal(5);
  });

  it('残牌加压：tilesLeft 小时 dealInRisk 不小于无加压', () => {
    const t = new Tile(TileType.TONG, 5, 1);
    const base = estimateDealInRisk(t, [], 80);
    const late = estimateDealInRisk(t, [], 20);
    expect(late).to.be.greaterThan(base);
  });
});
```

- [ ] **Step 2: 跑测**

Run: `npx mocha -r ts-node/register tests/majiang/ev-discard-evaluator.test.ts --timeout 10000`  
Expected: 若实现已完整则 PASS；若现物分支缺失则 FAIL 后按 Task1 公式补全

- [ ] **Step 3: 必要时微调公式常数（禁止改 core）**

仅允许改 `EV_CONSTANTS` 数值使上述测例稳定通过；禁止为过测硬编码「若是 5 筒就返回」。

- [ ] **Step 4: Commit（仅用户明确要求时）**

```bash
git add tests/majiang/ev-discard-evaluator.test.ts src/majiang/strategy/heuristics/ev-discard-evaluator.ts
git commit -m "$(cat <<'EOF'
test(majiang): 锁定 P2 现物与残牌点炮加压行为

EOF
)"
```

---

