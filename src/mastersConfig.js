// ─── Masters 2026 Pool Config ─────────────────────────────────────────────────
// Salary-cap fantasy format: pick 6 golfers under $500 cap.
// UPDATE `players` array when the official field is announced.
// Players can also be managed via the Admin panel (stored in Firebase).

export const MASTERS_CONFIG = {
  sport:    "Golf",
  event:    "The Masters",
  season:   "2026",
  venue:    "Augusta National Golf Club",
  dates:    "April 9–12, 2026",

  // Deadline: Thursday April 9 at 5:00 AM PDT = 12:00 UTC
  deadline:    "Thursday, April 9th at 5:00 AM PDT",
  deadlineISO: "2026-04-09T12:00:00Z",

  buyin:              20,   // $ per entry
  maxEntriesPerPerson: 2,
  venmo:  "@NICKSEIKALY",
  zelle:  "818-395-4928",

  pool: {
    picksPerEntry: 6,
    salaryCap:     500,
  },

  // ── Scoring Rules ────────────────────────────────────────────────────────────
  scoring: {
    // Per-hole
    doubleEagle:       13,
    eagle:              8,
    birdie:             3,
    par:              0.5,
    bogey:           -0.5,
    doubleBogeyOrWorse: -1,

    // Tournament finish bonus (top-10 exact, then ranges)
    finishBonus: {
      1: 30, 2: 20, 3: 18, 4: 16, 5: 14,
      6: 12, 7: 10, 8: 9,  9: 8,  10: 7,
    },
    finishBonusRanges: [
      { from: 11, to: 15, pts: 6 },
      { from: 16, to: 20, pts: 5 },
      { from: 21, to: 25, pts: 4 },
      { from: 26, to: 30, pts: 3 },
      { from: 31, to: 40, pts: 2 },
      { from: 41, to: 50, pts: 1 },
    ],

    // Bonus scoring
    birdieStreakPerRound: 3,  // 3+ consecutive birdies in a round (max 1 per round)
    bogeyFreeRound:       3,
    allRoundsUnder70:     5,
    holeInOne:            5,
  },

  // ── Player Field ─────────────────────────────────────────────────────────────
  // Edit salaries / add / remove players here before the tournament.
  // The Admin panel can also push updates to Firebase to override this list
  // without a redeployment.
  players: [
    { name: "Scottie Scheffler",       salary: 124, wr: 1    },
    { name: "Rory McIlroy",            salary: 111, wr: 2    },
    { name: "Ludvig Aberg",            salary: 108, wr: 5    },
    { name: "Collin Morikawa",         salary: 105, wr: 4    },
    { name: "Jon Rahm",                salary: 104, wr: 75   },
    { name: "Bryson DeChambeau",       salary: 99,  wr: 19   },
    { name: "Xander Schauffele",       salary: 97,  wr: 3    },
    { name: "Justin Thomas",           salary: 96,  wr: 9    },
    { name: "Hideki Matsuyama",        salary: 95,  wr: 6    },
    { name: "Brooks Koepka",           salary: 94,  wr: 231  },
    { name: "Joaquin Niemann",         salary: 93,  wr: 84   },
    { name: "Viktor Hovland",          salary: 92,  wr: 8    },
    { name: "Tommy Fleetwood",         salary: 91,  wr: 11   },
    { name: "Jordan Spieth",           salary: 90,  wr: 66   },
    { name: "Shane Lowry",             salary: 88,  wr: 15   },
    { name: "Patrick Cantlay",         salary: 87,  wr: 16   },
    { name: "Tyrrell Hatton",          salary: 86,  wr: 18   },
    { name: "Min Woo Lee",             salary: 85,  wr: 22   },
    { name: "Russell Henley",          salary: 84,  wr: 7    },
    { name: "Will Zalatoris",          salary: 83,  wr: 63   },
    { name: "Cameron Smith",           salary: 82,  wr: 123  },
    { name: "Akshay Bhatia",           salary: 81,  wr: 23   },
    { name: "Robert MacIntyre",        salary: 80,  wr: 17   },
    { name: "Corey Conners",           salary: 79,  wr: 21   },
    { name: "Tony Finau",              salary: 78,  wr: 33   },
    { name: "Sahith Theegala",         salary: 77,  wr: 25   },
    { name: "Wyndham Clark",           salary: 77,  wr: 10   },
    { name: "Jason Day",               salary: 76,  wr: 36   },
    { name: "Sepp Straka",             salary: 76,  wr: 13   },
    { name: "Dustin Johnson",          salary: 75,  wr: 649  },
    { name: "Tom Kim",                 salary: 75,  wr: 31   },
    { name: "Matt Fitzpatrick",        salary: 74,  wr: 70   },
    { name: "Sam Burns",               salary: 74,  wr: 35   },
    { name: "Patrick Reed",            salary: 73,  wr: 112  },
    { name: "Sungjae Im",              salary: 73,  wr: 24   },
    { name: "Adam Scott",              salary: 72,  wr: 32   },
    { name: "Justin Rose",             salary: 72,  wr: 38   },
    { name: "Daniel Berger",           salary: 71,  wr: 44   },
    { name: "Maverick McNealy",        salary: 71,  wr: 16   },
    { name: "Sergio Garcia",           salary: 71,  wr: 386  },
    { name: "Cameron Young",           salary: 70,  wr: 59   },
    { name: "Davis Thompson",          salary: 70,  wr: 47   },
    { name: "Keegan Bradley",          salary: 70,  wr: 14   },
    { name: "Billy Horschel",          salary: 69,  wr: 20   },
    { name: "Nicolai Hojgaard",        salary: 69,  wr: 79   },
    { name: "Thomas Detry",            salary: 69,  wr: 26   },
    { name: "Aaron Rai",               salary: 68,  wr: 27   },
    { name: "Brian Harman",            salary: 68,  wr: 49   },
    { name: "J.J. Spaun",              salary: 68,  wr: 28   },
    { name: "Byeong Hun An",           salary: 67,  wr: 34   },
    { name: "Cameron Davis",           salary: 67,  wr: 58   },
    { name: "Michael Kim",             salary: 67,  wr: 50   },
    { name: "Phil Mickelson",          salary: 67,  wr: 905  },
    { name: "Rasmus Hojgaard",         salary: 67,  wr: 55   },
    { name: "Taylor Pendrith",         salary: 67,  wr: 39   },
    { name: "Chris Kirk",              salary: 66,  wr: 73   },
    { name: "Christiaan Bezuidenhout", salary: 66,  wr: 56   },
    { name: "Laurie Canter",           salary: 66,  wr: 48   },
    { name: "Lucas Glover",            salary: 66,  wr: 29   },
    { name: "Max Greyserman",          salary: 66,  wr: 43   },
    { name: "Denny McCarthy",          salary: 65,  wr: 40   },
    { name: "Harris English",          salary: 65,  wr: 37   },
    { name: "J.T. Poston",             salary: 65,  wr: 45   },
    { name: "Max Homa",                salary: 65,  wr: 78   },
    { name: "Nick Dunlap",             salary: 65,  wr: 41   },
    { name: "Austin Eckroat",          salary: 64,  wr: 54   },
    { name: "Davis Riley",             salary: 64,  wr: 104  },
    { name: "Matthieu Pavon",          salary: 64,  wr: 52   },
    { name: "Nick Taylor",             salary: 64,  wr: 30   },
    { name: "Nicolas Echavarria",      salary: 64,  wr: 46   },
    { name: "Tom Hoge",                salary: 64,  wr: 53   },
    { name: "Adam Schenk",             salary: 63,  wr: 140  },
    { name: "Jhonattan Vegas",         salary: 63,  wr: 65   },
    { name: "Joe Highsmith",           salary: 63,  wr: 74   },
    { name: "Kevin Yu",                salary: 63,  wr: 75   },
    { name: "Matt McCarty",            salary: 63,  wr: 57   },
    { name: "Stephan Jaeger",          salary: 63,  wr: 42   },
    { name: "Brian Campbell",          salary: 62,  wr: 111  },
    { name: "Charl Schwartzel",        salary: 62,  wr: 420  },
    { name: "Danny Willett",           salary: 62,  wr: 383  },
    { name: "Patton Kizzire",          salary: 62,  wr: 136  },
    { name: "Thriston Lawrence",       salary: 62,  wr: 82   },
    { name: "Zach Johnson",            salary: 62,  wr: 333  },
    { name: "Bernhard Langer",         salary: 61,  wr: 4566 },
    { name: "Bubba Watson",            salary: 61,  wr: 1819 },
    { name: "Evan Beck",               salary: 61,  wr: null },
    { name: "Jose Luis Ballester",     salary: 61,  wr: 1172 },
    { name: "Justin Hastings",         salary: 61,  wr: 979  },
    { name: "Vijay Singh",             salary: 61,  wr: 1637 },
    { name: "Angel Cabrera",           salary: 60,  wr: 2795 },
    { name: "Fred Couples",            salary: 60,  wr: 3717 },
    { name: "Hiroshi Tai",             salary: 60,  wr: 4566 },
    { name: "Jose Maria Olazabal",     salary: 60,  wr: 1346 },
    { name: "Mike Weir",               salary: 60,  wr: 3146 },
    { name: "Noah Kent",               salary: 60,  wr: 4566 },
    { name: "Rafael Campos",           salary: 60,  wr: 201  },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Finish-position → bonus points */
export function getFinishBonus(position) {
  if (!position || position <= 0) return 0;
  const { finishBonus, finishBonusRanges } = MASTERS_CONFIG.scoring;
  if (finishBonus[position] !== undefined) return finishBonus[position];
  for (const r of finishBonusRanges) {
    if (position >= r.from && position <= r.to) return r.pts;
  }
  return 0;
}

/** Default player map built from config (name → { salary, wr }) */
export function buildDefaultPlayerMap(players) {
  const map = {};
  (players || MASTERS_CONFIG.players).forEach(p => { map[p.name] = { salary: p.salary, wr: p.wr }; });
  return map;
}
