// ─── Masters 2026 Scoring Logic ───────────────────────────────────────────────
// Handles scoring, leaderboard building, and standings for the golf pool.
// Each participant picks one golfer per tier; the pool is scored by finish position
// (or strokes, depending on mastersConfig.scoring.scoringType).

import { MASTERS_CONFIG } from "./mastersConfig";

// ── Leaderboard ───────────────────────────────────────────────────────────────
// participants: { [key]: { name, email, picks: { t1: "Player Name", t2: ..., ... } } }
// results:      { [playerName]: { position: 1, score: -18, thru: 72, status: "F" } }
//               position = finishing place (1 = winner). null if not yet posted.
export function buildMastersLeaderboard(participants, results) {
  return Object.entries(participants || {})
    .map(([id, p]) => {
      const scored = scorePicks(p.picks || {}, results);
      return {
        id,
        ...p,
        ...scored,
      };
    })
    .sort((a, b) => {
      // Lower total position = better (like golf: lower score wins)
      if (a.totalPosition !== b.totalPosition) return a.totalPosition - b.totalPosition;
      // Tiebreaker: best tier 1 finish
      return (a.t1Position ?? 999) - (b.t1Position ?? 999);
    });
}

// ── Score a single participant's picks against current results ─────────────
// Returns { totalPosition, t1Position, tierScores: { t1: {...}, t2: {...}, ... }, complete }
export function scorePicks(picks, results) {
  let totalPosition = 0;
  let complete      = true;
  const tierScores  = {};

  MASTERS_CONFIG.tiers.forEach(tier => {
    const player   = picks[tier.id];
    const result   = player ? (results?.[player] ?? null) : null;
    const position = result?.position ?? null;

    tierScores[tier.id] = {
      player,
      position,
      score:  result?.score  ?? null,
      thru:   result?.thru   ?? null,
      status: result?.status ?? null,
    };

    if (position == null) {
      complete = false;
    } else {
      totalPosition += position;
    }
  });

  const t1Position = tierScores["t1"]?.position ?? null;

  return { totalPosition: complete ? totalPosition : null, t1Position, tierScores, complete };
}

// ── Max possible score (best still-achievable position total) ─────────────────
// For each tier pick: if the player is still active, assume they could win (pos=1).
// If they've finished, use their actual position.
export function mastersMaxPossible(picks, results) {
  let best = 0;
  MASTERS_CONFIG.tiers.forEach(tier => {
    const player = picks?.[tier.id];
    if (!player) return;
    const result = results?.[player] ?? null;
    if (result?.status === "CUT" || result?.status === "WD") {
      // Missed cut or withdrew — use their position (last place ish) or a penalty
      best += result.position ?? 99;
    } else if (result?.position != null) {
      // Finished — locked in position
      best += result.position;
    } else {
      // Still playing — best case is winning (1st)
      best += 1;
    }
  });
  return best;
}
