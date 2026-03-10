import { BRACKET_CONFIG, PLAY_IN_SLOTS } from "./nbaBracketConfig";

// ─── Bracket feed map ─────────────────────────────────────────────────────────
// Maps each later-round series to the two earlier-round series whose winners feed into it.
// Mirrors FEEDS_FROM in App.js — kept in sync manually.
const FEEDS_FROM = {
  s9:  { top: "s1",  bottom: "s4"  },   // East Semis: (1) vs (4/5)
  s10: { top: "s2",  bottom: "s3"  },   // East Semis: (2) vs (3/6)
  s11: { top: "s5",  bottom: "s8"  },   // West Semis: (1) vs (4/5)
  s12: { top: "s6",  bottom: "s7"  },   // West Semis: (2) vs (3/6)
  s13: { top: "s9",  bottom: "s10" },   // East Finals
  s14: { top: "s11", bottom: "s12" },   // West Finals
  s15: { top: "s13", bottom: "s14" },   // NBA Finals
};

// Reverse of PLAY_IN_SLOTS: maps series ID → seedKey (e.g. "s1" → "E8")
// Used to look up which actual play-in team occupies each R1 play-in slot.
const PI_SERIES_TO_SEED = {};
Object.entries(PLAY_IN_SLOTS).forEach(([key, sid]) => { PI_SERIES_TO_SEED[sid] = key; });

// Get a flat list of all series from results object
export function allSeries(results) {
  if (!results?.rounds) return [];

  // Firebase stores arrays as objects with numeric keys, so convert them
  const roundsArray = Array.isArray(results.rounds) ? results.rounds : Object.values(results.rounds);

  return roundsArray.flatMap((r, roundIdx) => {
    const seriesArray = Array.isArray(r.series) ? r.series : Object.values(r.series || {});
    // Get scoring from BRACKET_CONFIG since Firebase doesn't store it
    const roundConfig = BRACKET_CONFIG.rounds[roundIdx];
    const winnerPoints = roundConfig?.winnerPoints || 0;
    const gamesPoints  = roundConfig?.gamesPoints  || 0;
    return seriesArray.map(s => ({ ...s, winnerPoints, gamesPoints }));
  });
}

// Build a map of seriesId → winner from results
function buildResultWinners(results) {
  const winners = {};
  if (!results?.rounds) return winners;
  const roundsArr = Array.isArray(results.rounds) ? results.rounds : Object.values(results.rounds);
  roundsArr.forEach(r => {
    const seriesArr = Array.isArray(r.series) ? r.series : Object.values(r.series || {});
    seriesArr.forEach(s => { if (s?.id && s?.winner) winners[s.id] = s.winner; });
  });
  return winners;
}

// Get the set of all teams that have been eliminated based on current results.
// Pass playInSeeds ({ E7, E8, W7, W8 }) so that the actual play-in team filling
// each #7/#8 slot is used instead of the BRACKET_CONFIG placeholder name.
// This ensures teams like Sacramento Kings (seed 10 that won the play-in) are
// correctly marked eliminated when they lose R1, rather than the placeholder.
export function getEliminatedTeams(results, playInSeeds = null) {
  const eliminated = new Set();
  if (!results) return eliminated;

  const resultWinners = buildResultWinners(results);

  // R1: for play-in slots use the actual team if known; otherwise use BRACKET_CONFIG name.
  BRACKET_CONFIG.rounds[0].series.forEach(s => {
    const winner = resultWinners[s.id];
    if (winner) {
      const seedKey     = PI_SERIES_TO_SEED[s.id]; // e.g. "E8" for s1
      const actualBottom = (playInSeeds && seedKey)
        ? (playInSeeds[seedKey] || s.bottom)
        : s.bottom;
      const loser = winner === s.top ? actualBottom : s.top;
      if (loser) eliminated.add(loser);
    }
  });

  // R2–R4: use FEEDS_FROM to resolve which teams played each series,
  // then add the loser to the eliminated set
  ["s9","s10","s11","s12","s13","s14","s15"].forEach(sid => {
    const winner = resultWinners[sid];
    if (!winner) return;
    const feed = FEEDS_FROM[sid];
    if (!feed) return;
    const topTeam    = resultWinners[feed.top];
    const bottomTeam = resultWinners[feed.bottom];
    if (topTeam    && topTeam    !== winner) eliminated.add(topTeam);
    if (bottomTeam && bottomTeam !== winner) eliminated.add(bottomTeam);
  });

  return eliminated;
}

// Build a substitution map for picks that were stored using BRACKET_CONFIG placeholder
// names before admin set play-in results (e.g. "Miami Heat" stored instead of
// "Detroit Pistons" for the E8 slot).  Maps configBottom → actualPlayInTeam.
// Used by maxPossible and auto-fill to correctly identify eliminated picks.
function buildPicksSubMap(playInSeeds) {
  const subMap = {};
  if (!playInSeeds) return subMap;
  Object.entries(PI_SERIES_TO_SEED).forEach(([sid, seedKey]) => {
    const actualTeam = playInSeeds[seedKey];
    if (!actualTeam) return;
    const r1Series = BRACKET_CONFIG.rounds[0].series.find(s => s.id === sid);
    if (!r1Series || actualTeam === r1Series.bottom) return;
    subMap[r1Series.bottom] = actualTeam; // old placeholder name → real play-in team
  });
  return subMap;
}

// Calculate earned points for a set of picks against known results
export function calcPoints(picks, results) {
  if (!picks || !results) return 0;
  let total = 0;
  allSeries(results).forEach(series => {
    if (!series.winner) return;
    const pick = picks[series.id];
    if (!pick?.winner) return;

    // Only award points if winner is correct
    if (pick.winner === series.winner) {
      total += series.winnerPoints;
      // Bonus for exact games ONLY if winner was correct
      if (pick.games === series.games) {
        total += series.gamesPoints;
      }
    }
  });
  return total;
}

// Calculate max points still achievable.
// Excludes future series where the picked team has already been eliminated.
// Pass playInSeeds so that getEliminatedTeams correctly identifies actual
// play-in team losers when computing the eliminated set.
//
// IMPORTANT: picks passed here must already be pre-substituted via
// virtualSubstitutePicksForPlayIn before calling buildLeaderboard.
// flatParticipants in NBAPlayoffPool.js does this. Applying buildPicksSubMap
// again here would double-substitute — e.g. turning the correctly-resolved
// "Miami Heat" (the actual E7 seed) into "Atlanta Hawks" (the E8 seed) just
// because "Miami Heat" was the BRACKET_CONFIG placeholder for the E8 slot,
// causing settled correct-winner checks to fail and losing points.
export function maxPossible(picks, results, playInSeeds = null) {
  if (!picks) return 0;

  const eliminatedTeams = getEliminatedTeams(results, playInSeeds);

  // Build a set of series IDs that are confirmed settled in Firebase results.
  // We use this to distinguish genuinely settled series from series that only
  // appear settled because the BRACKET_CONFIG skeleton has all IDs defined.
  const settledIds = new Set(allSeries(results).filter(s => s.winner).map(s => s.id));

  let potential = 0;

  // Loop through ALL series in the bracket (not just ones with results)
  BRACKET_CONFIG.rounds.forEach(round => {
    round.series.forEach(series => {
      const pick = picks[series.id];
      if (!pick?.winner) return; // No pick = no potential

      // Find if this series has an admin-confirmed result
      const resultSeries = settledIds.has(series.id)
        ? allSeries(results).find(s => s.id === series.id)
        : null;

      if (!resultSeries?.winner) {
        // Series not settled yet — add full potential if pick team is still alive
        if (!eliminatedTeams.has(pick.winner)) {
          potential += round.winnerPoints + round.gamesPoints;
        }
      } else if (pick.winner === resultSeries.winner) {
        // Correct winner — add full winner + games potential.
        // MAX PTS represents the best-case score: if the winner pick is right,
        // the games pick could also be right (or for already-settled series,
        // counts what was earned + what remained possible).
        potential += round.winnerPoints + round.gamesPoints;
      }
      // Wrong pick = 0 potential
    });
  });

  return potential;
}

// Count how many series a participant got the winner correct
export function countCorrect(picks, results) {
  if (!picks || !results) return 0;
  return allSeries(results).filter(s => s.winner && picks[s.id]?.winner === s.winner).length;
}

// Count how many series a participant got BOTH winner AND games correct
export function countCorrectGames(picks, results) {
  if (!picks || !results) return 0;
  return allSeries(results).filter(s =>
    s.winner && s.games &&
    picks[s.id]?.winner === s.winner &&
    picks[s.id]?.games  === s.games
  ).length;
}

// Build the leaderboard from a participants map.
// Pass playInSeeds (admin-confirmed) so maxPossible correctly excludes
// eliminated play-in teams (seed 9/10 that won their way into the bracket).
export function buildLeaderboard(participants, results, playInSeeds = null) {
  return Object.entries(participants || {})
    .map(([id, p]) => ({
      id, ...p,
      points:       calcPoints(p.picks, results),
      maxPts:       maxPossible(p.picks, results, playInSeeds),
      correct:      countCorrect(p.picks, results),
      correctGames: countCorrectGames(p.picks, results),
    }))
    .sort((a, b) => b.points - a.points || b.maxPts - a.maxPts);
}
