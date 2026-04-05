# IPL Prediction Contest - Architecture & Data Flow

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │  Google Sheet    │  │  Google Sheet    │  │  Google Sheet   │   │
│  │  (Matches Tab)   │  │ (Predictions Tab)│  │(Trivia_Points)  │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘   │
│           │                     │                     │             │
│           └─────────────────────┼─────────────────────┘             │
│                                 │                                    │
│                    ┌────────────▼────────────┐                      │
│                    │  Google Apps Script    │                      │
│                    │  (Sync Engine)         │                      │
│                    │  - readMatches()       │                      │
│                    │  - readPredictions()   │                      │
│                    │  - readTriviaPoints()  │                      │
│                    └────────────┬────────────┘                      │
│                                 │                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                                  │ HTTP POST /api/sync
                                  │ (JSON Payload)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VERCEL API LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│         ┌──────────────────────────────────────────────────┐        │
│         │     src/app/api/sync/route.ts                   │        │
│         │  (Data Validation & Persistence)                │        │
│         │  - Validates API key                            │        │
│         │  - Resolves player/team names                   │        │
│         │  - Upserts to Supabase tables                   │        │
│         └──────────────────────────────────────────────────┘        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   matches    │  │ predictions  │  │   jokers     │               │
│  │  ────────    │  │  ──────────  │  │  ──────────  │               │
│  │  id          │  │  id          │  │  id          │               │
│  │  match_date  │  │  match_id    │  │  participant │               │
│  │  winner      │  │  participant │  │  match_id    │               │
│  │  match_type  │  │  predicted_  │  │  declared_at │               │
│  │  is_power    │  │    team      │  │              │               │
│  │  underdog    │  │              │  │              │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │trivia_points │  │ participants │                                 │
│  │ ──────────── │  │ ──────────── │                                 │
│  │  id          │  │  id          │                                 │
│  │  player      │  │  name        │                                 │
│  │  trivia_id   │  │  avatar_     │                                 │
│  │  prediction  │  │    color     │                                 │
│  │  correct_    │  │              │                                 │
│  │    answer    │  │              │                                 │
│  │  points_     │  │              │                                 │
│  │    earned    │  │              │                                 │
│  └──────────────┘  └──────────────┘                                 │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  CALCULATION LAYER (APIs)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │ /api/leaderboard    │  │ /api/players        │                   │
│  │ ───────────────────│  │ ───────────────────│                   │
│  │ • Queries: matches, │  │ • Queries: matches, │                   │
│  │   predictions,      │  │   predictions,      │                   │
│  │   jokers,           │  │   jokers,           │                   │
│  │   trivia_points     │  │   trivia_points     │                   │
│  │ • Calculates:       │  │ • Calculates:       │                   │
│  │   - Total points    │  │   - Team affinity   │                   │
│  │   - Base points     │  │   - Hated teams     │                   │
│  │   - Bonuses         │  │   - Prediction hist │                   │
│  │   - Streaks         │  │   - Profitable      │                   │
│  │   - Accuracy        │  │     teams           │                   │
│  │   - Trivia points   │  │   - Stats per match │                   │
│  │ • Returns: Sorted   │  │ • Returns: Player   │                   │
│  │   leaderboard       │  │   detailed profile  │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │            /api/insights (COMPLEX)                   │           │
│  │ ────────────────────────────────────────────────────│           │
│  │  Queries all tables, then calculates:               │           │
│  │                                                      │           │
│  │  ✓ Points Race          - Cumulative points/player  │           │
│  │  ✓ Team Popularity      - Team accuracy metrics     │           │
│  │  ✓ Weekly Points        - Points per week           │           │
│  │  ✓ Crowd Wisdom         - Majority vote accuracy    │           │
│  │  ✓ Contrarian Data      - Anti-crowd voting stats   │           │
│  │  ✓ Match Difficulty     - Group accuracy per match  │           │
│  │  ✓ Form Data            - 5-match rolling accuracy  │           │
│  │  ✓ Win Rate by Team     - Team-specific accuracy    │           │
│  │  ✓ Double Header Data   - DH match performance      │           │
│  │  ✓ Double Header Heroes - DH sweep details          │           │
│  │  ✓ Heatmap Data         - Match prediction matrix   │           │
│  │  ✓ Wall of Shame        - Wasted jokers, jinxers    │           │
│  │  ✓ Points Matrix        - Per-match point breakdown │           │
│  │  ✓ Ghost Voters         - Participation tracking    │           │
│  │  ✓ Team Vote Totals     - Vote counts per team      │           │
│  │  ✓ Vote Splits          - Home/away vote breakdown  │           │
│  │  ✓ Participation Rate   - Vote participation over   │           │
│  │  ✓ Home/Away Bias       - Team selection patterns   │           │
│  │                                                      │           │
│  │  Returns: Comprehensive analytics object            │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (Next.js)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /leaderboard     │  │ /players         │  │ /insights        │  │
│  │ ────────────────│  │ ───────────────  │  │ ───────────────  │  │
│  │ • Fetches:      │  │ • Fetches:       │  │ • Fetches:       │  │
│  │   /api/leaderbd │  │   /api/players   │  │   /api/insights  │  │
│  │ • Displays:     │  │ • Displays:      │  │ • Displays:      │  │
│  │   - Rankings    │  │   - Profile      │  │   - Points race  │  │
│  │   - Points      │  │   - Stats cards  │  │   - Team charts  │  │
│  │   - Last 5      │  │   - Pred history │  │   - Accuracy     │  │
│  │     results     │  │   - Team stats   │  │   - Form data    │  │
│  │   - Avatar      │  │                  │  │   - Wall of shame│  │
│  │     colors      │  │                  │  │   - Heatmaps     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                        │
│  All pages use:                                                      │
│  • src/lib/scoring.ts  - calculatePlayerPoints()                    │
│  • src/lib/constants.ts - PARTICIPANTS, POINTS_CONFIG              │
│  • Charts: Recharts library                                         │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow for Insights Page (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSIGHTS PAGE LOAD                           │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: GET /api/insights                                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  API: src/app/api/insights/route.ts                             │
│                                                                  │
│  Step 1: Query Supabase (Parallel)                              │
│  ├─ matches table (all records)                                 │
│  ├─ predictions table (all records)                             │
│  ├─ jokers table (all records)                                  │
│  └─ trivia_points table (all records)                           │
│                                                                  │
│  Step 2: Build Leaderboard (using scoring.ts)                  │
│  ├─ calculateAllPlayerPoints()                                  │
│  ├─ Returns sorted players with:                                │
│  │  ├─ totalPoints                                              │
│  │  ├─ basePoints, powerMatchPoints, bonuses                    │
│  │  ├─ triviaPoints (sum from DB)                               │
│  │  ├─ accuracy, streaks                                        │
│  │  └─ rank                                                     │
│  │                                                              │
│  Step 3: Calculate Analytics (Using queried data)               │
│  ├─ buildPointsRace()        → Cumulative points timeline       │
│  ├─ buildTeamPopularity()    → Team vote accuracy               │
│  ├─ buildWeeklyPoints()      → Week-by-week breakdown           │
│  ├─ buildCrowdWisdom()       → Majority vote analysis           │
│  ├─ buildContrarianData()    → Anti-crowd voting                │
│  ├─ buildMatchDifficulty()   → Group accuracy per match         │
│  ├─ buildFormData()          → Rolling 5-match accuracy         │
│  ├─ buildWinRateByTeam()     → Team-specific accuracy           │
│  ├─ buildDoubleHeaderData()  → DH performance metrics           │
│  ├─ buildDoubleHeaderHeroes()→ DH sweep details                 │
│  ├─ buildHeatmapData()       → Match/player matrix              │
│  ├─ buildWallOfShame()       → Wasted jokers & streaks          │
│  ├─ buildPointsMatrix()      → Per-match point attribution      │
│  ├─ buildGhostVoters()       → Participation patterns           │
│  ├─ buildTeamVoteTotals()    → Vote counts by team              │
│  ├─ buildVoteSplits()        → Vote distribution per match      │
│  ├─ buildParticipationRate() → Voting participation %           │
│  └─ buildHomeAwayBias()      → Home vs away selection bias      │
│                                                                  │
│  Step 4: Build Response Object                                  │
│  └─ Return JSON with all calculations                           │
│                                                                  │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ▼ (JSON Response)
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: src/app/insights/page.tsx                            │
│                                                                  │
│  Receives JSON and renders components:                          │
│  ├─ Points Race Chart        (Recharts LineChart)               │
│  ├─ Team Popularity Chart    (Recharts BarChart)                │
│  ├─ Accuracy by Player       (Recharts Table)                   │
│  ├─ Weekly Points            (Recharts AreaChart)               │
│  ├─ Crowd Wisdom             (Recharts LineChart)               │
│  ├─ Contrarian Stats         (Recharts ScatterChart)            │
│  ├─ Form Data                (Recharts LineChart)               │
│  ├─ Win Rate by Team         (Recharts HeatmapChart)            │
│  ├─ Double Header Heroes     (Recharts BarChart)                │
│  ├─ Points Matrix            (Custom Table)                     │
│  ├─ Wall of Shame            (Wasted Jokers, Jinxers)           │
│  ├─ Heatmap                  (Prediction correctness matrix)    │
│  └─ Other metrics            (Various formats)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scoring Calculation Flow

```
┌──────────────────────────────────────────────────────┐
│  calculateAllPlayerPoints(PARTICIPANTS, ScoringData) │
└──────────────────────┬───────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────────┐    ┌─────────────────────┐
│  For each player:    │    │  ScoringData:       │
│  calculatePlayer     │    │  - matches[]        │
│    Points()          │    │  - predictions[]    │
└──────────────┬───────┘    │  - jokers[]         │
               │            │  - triviaPoints[]   │
               │            └─────────────────────┘
               │
        ┌──────┴──────────────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ For each completed match:│  │ Calculate Trivia Points: │
│ ├─ Is prediction correct?│  │ ├─ Filter trivia_points  │
│ │  ├─ YES: Add points    │  │ │  by player name        │
│ │  │       + bonuses     │  │ │                        │
│ │  │       (underdog,    │  │ │ ├─ Sum all             │
│ │  │        joker)       │  │ │   points_earned        │
│ │  │                     │  │ │                        │
│ │  └─ NO: Break streak   │  │ └─ Total = triviaPoints  │
│ │                        │  └──────────────────────────┘
│ ├─ Update streak count   │
│ ├─ Track predictions     │
│ └─ Track accuracy        │
│                          │
│ Final calculations:      │
│ ├─ Double header bonus   │
│ │  (2+ correct on date)  │
│ ├─ Streak bonus          │
│ │  (3+ consecutive)      │
│ └─ Longest streak        │
│                          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Return PlayerPointsBreakdown:           │
│  ├─ totalPoints (sum of all)             │
│  ├─ basePoints                           │
│  ├─ powerMatchPoints                     │
│  ├─ underdogBonus                        │
│  ├─ jokerBonus                           │
│  ├─ doubleHeaderBonus                    │
│  ├─ streakBonus                          │
│  ├─ triviaPoints (from DB)               │
│  ├─ accuracy %                           │
│  ├─ currentStreak                        │
│  ├─ longestStreak                        │
│  └─ rank (assigned after sorting)        │
│                                          │
└──────────────────────────────────────────┘
```

---

## Key Points

### Data Immutability
- **Supabase** = Single source of truth (raw data)
- **APIs** = Transform and aggregate data
- **Frontend** = Display calculated results

### Calculation Strategy
- Scoring uses **in-memory calculations** (no DB queries during scoring)
- All data loaded at once for performance
- Trivia points are **summed directly from DB** (pre-calculated)

### API Response Caching
- Each page fetch triggers fresh API call (no caching)
- Allows real-time updates as data changes
- Frontend components are optimized with React.useMemo

### Scaling Consideration
- As player/match count grows, /api/insights may become slow
- Future optimization: Cache insights for 5 minutes
- Or: Compute analytics in background jobs and store results
