// ─── Pool Registry ────────────────────────────────────────────────────────────
// Static definition of all sports and their pools.
// The `active` field here is the DEFAULT. The admin can override any pool's
// active state in Firebase at /admin/poolSettings/{poolId}/active.
// The `component` field names the React component to render (null = not built yet).

export const SPORTS = [
  {
    id: "nba",
    name: "NBA",
    icon: "🏀",
    color: "#C8102E",
    pools: [
      {
        id: "nba-2026",
        name: "2026 Playoffs",
        season: "2026",
        dbPath: "pools/nba-2026",
        active: false,
        component: "NBAPlayoffPool",
      },
    ],
  },
  {
    id: "nfl",
    name: "NFL",
    icon: "🏈",
    color: "#013369",
    pools: [
      { id: "nfl-playoff-2026", name: "2026 Playoffs",   active: false, component: null },
      { id: "nfl-pickem-2025",  name: "2025-26 Pick'Em", active: false, component: null },
    ],
  },
  {
    id: "mlb",
    name: "MLB",
    icon: "⚾",
    color: "#002D72",
    pools: [
      { id: "mlb-2026", name: "2026 Playoffs", active: false, component: null },
    ],
  },
  {
    id: "nhl",
    name: "NHL",
    icon: "🏒",
    color: "#C8102E",
    pools: [
      { id: "nhl-2026", name: "2026 Playoffs", active: false, component: null },
    ],
  },
  {
    id: "golf",
    name: "Golf",
    icon: "⛳",
    color: "#1A6B3A",
    pools: [
      { id: "masters-2026", name: "The Masters 2026", season: "2026", dbPath: "pools/masters-2026", active: false, component: "MastersPool" },
    ],
  },
  {
    id: "soccer",
    name: "Soccer",
    icon: "⚽",
    color: "#006400",
    pools: [
      { id: "worldcup-2026", name: "2026 World Cup", active: false, component: null },
    ],
  },
  {
    id: "ncaaf",
    name: "NCAAF",
    icon: "🏈",
    color: "#8B0000",
    pools: [
      { id: "ncaaf-2025", name: "2025-26 CFP", active: false, component: null },
    ],
  },
];

// Flat lookup map: poolId → { pool, sport }
// Useful for quickly resolving any poolId without iterating SPORTS.
export const POOL_MAP = {};
SPORTS.forEach(sport => {
  sport.pools.forEach(pool => {
    POOL_MAP[pool.id] = { pool, sport };
  });
});
