// ─── Masters 2026 Pool Config ─────────────────────────────────────────────────
// Defines the player field, tier structure, and scoring rules for the pool.
// Edit this file each year to update the player list and scoring.

export const MASTERS_CONFIG = {
  sport:      "Golf",
  event:      "The Masters",
  season:     "2026",
  venue:      "Augusta National Golf Club",
  dates:      "April 9–12, 2026",

  // ── Scoring Rules ────────────────────────────────────────────────────────────
  // Each participant picks one golfer per tier. Their score = sum of all picks'
  // finishing positions (lower is better, like golf). Ties broken by tier 1 finish.
  scoring: {
    pickPerTier:     true,   // participant picks exactly one golfer per tier
    scoringType:     "position", // "position" = finishing place (1st=1pt, 2nd=2pt, ...)
    // Alternative: "strokes" = sum of actual strokes (raw score)
    tiebreakerField: "t1Finish", // field on participant used to break ties
  },

  // ── Tiers / Groups ───────────────────────────────────────────────────────────
  // Participants pick one golfer from each tier.
  // Adjust tiers, labels, and players each year before the event.
  tiers: [
    {
      id:    "t1",
      label: "Tier 1 — The Favourites",
      players: [
        "Scottie Scheffler",
        "Rory McIlroy",
        "Jon Rahm",
        "Xander Schauffele",
        "Collin Morikawa",
      ],
    },
    {
      id:    "t2",
      label: "Tier 2 — Contenders",
      players: [
        "Viktor Hovland",
        "Patrick Cantlay",
        "Tony Finau",
        "Shane Lowry",
        "Tommy Fleetwood",
        "Hideki Matsuyama",
      ],
    },
    {
      id:    "t3",
      label: "Tier 3 — Dark Horses",
      players: [
        "Justin Thomas",
        "Jordan Spieth",
        "Brooks Koepka",
        "Dustin Johnson",
        "Adam Scott",
        "Cameron Smith",
        "Jason Day",
      ],
    },
    {
      id:    "t4",
      label: "Tier 4 — Longshots",
      players: [
        "Max Homa",
        "Tyrrell Hatton",
        "Corey Conners",
        "Sungjae Im",
        "Tom Kim",
        "Sepp Straka",
        "Harris English",
        "Taylor Pendrith",
      ],
    },
  ],
};

// Flat list of all players across all tiers (useful for validation)
export const ALL_PLAYERS = MASTERS_CONFIG.tiers.flatMap(t => t.players);

// Map: player name → tier id (for quick lookup)
export const PLAYER_TIER_MAP = {};
MASTERS_CONFIG.tiers.forEach(tier => {
  tier.players.forEach(player => {
    PLAYER_TIER_MAP[player] = tier.id;
  });
});
