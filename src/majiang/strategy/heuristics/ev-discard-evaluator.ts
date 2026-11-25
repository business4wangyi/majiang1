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
  // Task4 option B: P1-like lexicographic via scaled EV —
  // shanten ≫ ukeire ≫ defense (genbutsu only breaks equal ukeire).
  WIN_PROXY: 1_000_000,
  UKEIRE_WEIGHT: 1_000,
  DEAL_IN_PENALTY: 100,
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
  // Plan risk table (restored): genbutsu / honor / terminal / mid
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
    // Option B: hard shanten primary — cannot prefer worse shanten for more ukeire.
    const offense =
      EV_CONSTANTS.WIN_PROXY / Math.pow(r.shantenAfter + 1, 2) +
      EV_CONSTANTS.UKEIRE_WEIGHT * r.ukeire;
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

  // Explicit P1-like order (ev is scaled to match; keep lex as source of truth).
  scores.sort((a, b) => {
    if (a.shantenAfter !== b.shantenAfter) return a.shantenAfter - b.shantenAfter;
    if (a.ukeire !== b.ukeire) return b.ukeire - a.ukeire;
    if (a.dealInRisk !== b.dealInRisk) return a.dealInRisk - b.dealInRisk;
    if (a.ev !== b.ev) return b.ev - a.ev;
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
