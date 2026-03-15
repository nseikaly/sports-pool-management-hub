// ─── Masters 2026 Scoring Logic ───────────────────────────────────────────────
// Points-based: each participant picks 6 golfers under $500 salary cap.
// Total score = sum of each golfer's points (hole scoring + finish bonus + bonuses).
// Higher total points wins.

import { getFinishBonus } from "./mastersConfig";

// ── Results shape ─────────────────────────────────────────────────────────────
// results: {
//   [playerName]: {
//     status:      "active" | "CUT" | "WD" | "F"
//     position:    number | null          // final finish position
//     holePoints:  number                 // sum of per-hole scoring
//     bonusPoints: number                 // streak + special bonuses
//     finishBonus: number                 // auto-calc from position
//     totalPoints: number                 // holePoints + finishBonus + bonusPoints
//   }
// }
//
// Participants shape:
// { [pushId]: { name, email, picks: ["Player1", ...], totalSalary, timestamp } }

// ── Leaderboard ───────────────────────────────────────────────────────────────
export function buildMastersLeaderboard(participants, results) {
  const entries = Object.entries(participants || {}).map(([id, p]) => {
    const scored = scoreEntry(p.picks || [], results);
    return { id, ...p, ...scored };
  });

  // Sort: highest totalPoints first; tiebreak by pick[0] points then pick[1], etc.
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    for (let i = 0; i < 6; i++) {
      const ap = a.pickDetails?.[i]?.totalPoints ?? -999;
      const bp = b.pickDetails?.[i]?.totalPoints ?? -999;
      if (bp !== ap) return bp - ap;
    }
    return 0;
  });

  // Assign ranks (handle ties)
  let rank = 1;
  entries.forEach((e, i) => {
    if (i > 0 && e.totalPoints === entries[i - 1].totalPoints) {
      e.rank = entries[i - 1].rank;
    } else {
      e.rank = rank;
    }
    rank++;
  });

  return entries;
}

// ── Score one entry ───────────────────────────────────────────────────────────
// picks: array of player name strings (up to 6)
// returns: { totalPoints, pickDetails, complete }
export function scoreEntry(picks, results) {
  let totalPoints = 0;
  let complete    = true;

  const pickDetails = (picks || []).map(player => {
    const r   = results?.[player] ?? null;
    const pts = r?.totalPoints ?? 0;

    // Not complete if any pick is still active or has no result
    if (!r || r.status === "active" || r.status == null) complete = false;

    return {
      player,
      status:      r?.status      ?? null,
      position:    r?.position    ?? null,
      holePoints:  r?.holePoints  ?? null,
      finishBonus: r?.finishBonus ?? null,
      bonusPoints: r?.bonusPoints ?? null,
      totalPoints: pts,
    };
  });

  totalPoints = pickDetails.reduce((sum, d) => sum + (d.totalPoints ?? 0), 0);

  return { totalPoints, pickDetails, complete };
}

// ── Calculate a golfer's total points ────────────────────────────────────────
// Call this when the admin enters/updates a result to keep totalPoints in sync.
export function calcGolferTotal(holePoints, position, bonusPoints) {
  return (Number(holePoints) || 0)
       + getFinishBonus(position)
       + (Number(bonusPoints) || 0);
}

// ── Best-case score for an entry ─────────────────────────────────────────────
// For players still active, assume they can earn 30 pts (win the tournament + big hole day).
// Used to show "max possible" on the leaderboard during the tournament.
export function mastersMaxPossible(picks, results) {
  return (picks || []).reduce((sum, player) => {
    const r = results?.[player] ?? null;
    if (r?.status === "CUT" || r?.status === "WD") return sum + (r.totalPoints ?? 0);
    if (r?.status === "F") return sum + (r.totalPoints ?? 0);
    // Still active or no result yet: optimistic ceiling
    return sum + (r?.totalPoints ?? 60); // rough ceiling
  }, 0);
}
