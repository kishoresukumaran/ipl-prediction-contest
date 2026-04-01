@AGENTS.md

# IPL Prediction League 2026

## Overview
A mobile-friendly web app for an IPL 2026 prediction contest among a group of 29 friends. Predictions are collected via WhatsApp polls, and the admin (Kishore, based in Ireland) manually enters them into the app. Points are computed on-the-fly and never stored — changing a match result automatically recalculates everything.

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL) — project URL: `https://nwjfzjhaypumjvquzpod.supabase.co`
- **Charts**: Recharts (lazy-loaded, SSR disabled)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel (auto-deploys from GitHub `main` branch)
- **Repo**: github.com/kishoresukumaran/ipl-prediction-contest

## Key Architecture Decisions
- **Admin-only prediction entry** — no self-service. Admin enters from WhatsApp.
- **All times displayed in Irish timezone** (Europe/Dublin). Match start times are stored as IST in the DB but converted via `matchTimeToIrish()` in `src/lib/utils.ts` for display. Prediction timestamps are entered in the admin's local Ireland time, converted to UTC before saving.
- **Points computed on-the-fly** — the scoring engine in `src/lib/scoring.ts` recalculates from raw data every time. Never stored in DB.
- **Streak bonus**: awarded once when streak breaks, equals final streak length (min 3). Example: 5 correct then wrong = +5 total, NOT incremental.
- **Participant IDs are decoupled from display names** — some participants were renamed (Safer→Safeer, Panicking→Manikbasha) but their DB IDs stay as `safer` and `panicking`. See `ID_OVERRIDES` in `src/lib/constants.ts`. Always keep original IDs when renaming to avoid breaking data linkage.

## Points System
| Scenario | Points |
|----------|--------|
| Normal match correct | +2 |
| Power match correct | +4 (replaces 2) |
| Qualifier 1 correct | +8 |
| Eliminator correct | +10 |
| Qualifier 2 correct | +10 |
| Final correct | +15 |
| Underdog bonus | +3 |
| Joker bonus | +10 (one per tournament) |
| Double header bonus | +2 (both correct same day) |
| Streak bonus | = streak length when broken (min 3) |
| Trivia correct | +1 |
| Bonus question correct | configurable (default +1) |

## Database Tables
- `participants` — 29 players, id/name/avatar_color
- `matches` — 70 league + playoff matches added later via admin
- `predictions` — one per participant per match
- `jokers` — one per participant for entire tournament
- `trivia` / `trivia_responses` — Sunday trivia questions
- `bonus_questions` / `bonus_responses` — per-match bonus questions (added via `data/migration-001-bonus-questions.sql`)

Schema: `data/schema.sql` (initial), `data/migration-001-bonus-questions.sql` (additive, no data loss)

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Dashboard/Home
│   ├── leaderboard/page.tsx        # Full standings
│   ├── matches/page.tsx            # Match list
│   ├── matches/[matchId]/page.tsx  # Match detail
│   ├── players/page.tsx            # Player grid
│   ├── players/[playerId]/page.tsx # Player profile
│   ├── insights/page.tsx           # 16+ charts across 8 tabs
│   ├── admin/                      # Admin panel (login, matches, predictions, jokers, trivia, playoffs)
│   └── api/                        # API routes (matches, predictions, leaderboard, players, insights, bonus, jokers, trivia, admin)
├── components/
│   ├── charts/                     # 16+ Recharts components (lazy-loaded)
│   ├── layout/BottomNav.tsx        # Mobile bottom navigation
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── constants.ts                # Teams (10), participants (29), colors, points config
│   ├── scoring.ts                  # Points calculation engine — the heart of the app
│   ├── supabase.ts                 # Supabase client
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # cn(), matchTimeToIrish(), matchDateTimeUTC()
└── hooks/
```

## Participants (29)
BK, Dharaneesh, Dinesh, Gerard, Haroon, Kerun, Kishore, Krish, Naina, Ramnath, Safeer (id: safer), Shakthi, Vijay, Jaya, Yal, Alphonse, Guhan, Jessinth, Kesh, Manikbasha (id: panicking), Ranjith, Selva, Vamsi, Shahul, Venkat, Satish, Azhar, Siva, Sriram

## IPL Teams
SRH, KKR, CSK, GT, DC, PBKS, MI, RR, LSG, RCB — colors and config in `src/lib/constants.ts`

## Admin Workflow
1. **After each match**: Go to Admin > Matches, set winner, toggle completed, optionally set power match / underdog / bonus question
2. **Enter predictions**: Go to Admin > Predictions, select match, click team buttons for each participant, optionally set prediction timestamps
3. **Bonus responses**: If match has a bonus question, the bonus section appears below predictions — select each participant's answer
4. **Playoffs**: When playoff teams are known, go to Admin > Playoffs to add Q1/Eliminator/Q2/Final matches

## Common Pitfalls
- When renaming participants, **never change the DB id** — only change the display name in `constants.ts` and use `ID_OVERRIDES`. Changing the id breaks all foreign key references.
- The `ScoringData` interface in `scoring.ts` has optional `bonusQuestions` and `bonusResponses` fields — all API routes must pass these for bonus points to be counted.
- Charts are lazy-loaded with `dynamic(() => import(...), { ssr: false })` — SSR will crash because Recharts needs the DOM.
- Supabase client uses placeholder URL for build time — real credentials are in `.env.local` (gitignored).

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
```
Set in both `.env.local` (local dev) and Vercel (production). Never commit real values.
