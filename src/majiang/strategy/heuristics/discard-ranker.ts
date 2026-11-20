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

function tileKey(t: Tile): string {
  return `${t.type}-${t.value}`;
}

function scoreDanger(tile: Tile, visibleDiscards: Tile[] | undefined): number {
  const seen = new Set((visibleDiscards ?? []).map(tileKey));
  if (seen.has(tileKey(tile))) return 0;
  if (tile.type === TileType.FENG || tile.type === TileType.JIAN) return 1;
  return 2;
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
      danger: scoreDanger(tile, ctx.visibleDiscards),
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
