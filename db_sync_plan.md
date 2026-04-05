# Google Sheet → Supabase Sync

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                         │
│                                                                                │
│  ┌──────────────┐    IMPORTRANGE     ┌──────────────────┐                      │
│  │ Source Sheet  │ ─────────────────► │  Mirrored Sheet  │                      │
│  │ (Friend edits │                   │  (Your copy)     │                      │
│  │  predictions) │                   │                  │                      │
│  └──────────────┘                    └────────┬─────────┘                      │
│                                               │                                │
│                                    Google Apps Script                           │
│                                    (every 5 min trigger                         │
│                                     or manual "Sync All")                       │
│                                               │                                │
│                                   Cherry-picks only:                            │
│                                   • Match ID, Winner,                           │
│                                     Underdog, Match Type                        │
│                                   • Player, Prediction,                         │
│                                     Joker                                       │
│                                               │                                │
│                              Sends raw sheet values                             │
│                              (full team names,                                  │
│                               display player names)                             │
│                                               │                                │
│                                               ▼                                │
│                               ┌───────────────────────────┐                    │
│                               │   POST /api/sync          │                    │
│                               │   (Next.js on Vercel)     │                    │
│                               │                           │                    │
│                               │   Auth: x-api-key header  │                    │
│                               │                           │                    │
│                               │   Transforms:             │                    │
│                               │   "Royal Challengers      │                    │
│                               │    Bengaluru" → "RCB"     │                    │
│                               │   "Manick" → "panicking"  │                    │
│                               │   "Normal" → "league"     │                    │
│                               └─────────────┬─────────────┘                    │
│                                             │                                  │
│                                    Upserts (never deletes)                      │
│                                             │                                  │
│                                             ▼                                  │
│                               ┌───────────────────────────┐                    │
│                               │   Supabase (PostgreSQL)   │                    │
│                               │                           │                    │
│                               │   • matches (winner,      │                    │
│                               │     is_completed,         │                    │
│                               │     underdog_team)        │                    │
│                               │   • predictions           │                    │
│                               │     (participant_id,      │                    │
│                               │      predicted_team)      │                    │
│                               │   • jokers                │                    │
│                               │     (participant_id,      │                    │
│                               │      match_id)            │                    │
│                               └─────────────┬─────────────┘                    │
│                                             │                                  │
│                                    Points computed                              │
│                                    on-the-fly                                   │
│                                             │                                  │
│                                             ▼                                  │
│                               ┌───────────────────────────┐                    │
│                               │   IPL Prediction App      │                    │
│                               │   (Next.js frontend)      │                    │
│                               │                           │                    │
│                               │   Leaderboard, Player     │                    │
│                               │   Profiles, Insights,     │                    │
│                               │   Match Details — all     │                    │
│                               │   auto-updated            │                    │
│                               └───────────────────────────┘                    │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WHAT STAYS ADMIN-ONLY                                  │
│                                                                                │
│   These are NOT synced from the sheet — managed via Admin Panel:               │
│   • is_power_match (toggle on match)                                           │
│   • Bonus questions & responses                                                │
│   • Trivia questions & responses                                               │
│   • Creating new matches (playoffs)                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Context
You currently enter match results and predictions manually via the admin panel. Your friend tracks the same data in a Google Sheet. This plan creates an auto-sync pipeline: **Google Sheet → Apps Script → Next.js API → Supabase**, eliminating manual admin entry for matches, predictions, and jokers.

**Important caveat:** Your sheet uses `IMPORTRANGE` (it's a mirror of a source sheet). Google's `onEdit` trigger does **not** fire for IMPORTRANGE changes. Instead, we'll use a **time-driven trigger (every 5 minutes)** for auto-sync, plus a manual "Sync All" menu button.

**Schema independence:** The Google Sheet schema does NOT need to match the Supabase DB schema. The approach is:
1. **Apps Script cherry-picks** only the values we need from specific columns in the sheet (Match ID, Winner, Player, Prediction, Joker) — ignoring all other columns and tabs (Points, Leaderboard, Entered by, Validated by, etc.)
2. **Apps Script sends raw sheet values** as-is — full team names ("Royal Challengers Bengaluru"), display player names ("Manick"), match types ("Normal"). No transformation needed on the sheet side.
3. **The API endpoint handles all translation** — converts full team names → DB abbreviations (RCB), player display names → DB IDs (panicking), match types → DB values (league), and upserts into Supabase in the correct schema.

This means your friend can structure his sheet however he wants. If columns move or new tabs are added, only the Apps Script column references need updating — the API and DB are unaffected.

---

## What We'll Build

### 1. New API Endpoint: `POST /api/sync`
**File:** `src/app/api/sync/route.ts`

- **Auth:** `x-api-key` header checked against new `SYNC_API_KEY` env var
- **Payload:** Raw sheet data (full team names, display player names)
- **All mapping happens server-side** — your friend doesn't need to worry about abbreviations or DB IDs

**Payload format:**
```json
{
  "matches": [
    { "id": 1, "winner": "Royal Challengers Bengaluru", "match_type": "Normal", "underdog_team": "Sunrisers Hyderabad" }
  ],
  "predictions": [
    { "player": "Manick", "match_id": 1, "prediction": "Sunrisers Hyderabad", "joker": false }
  ]
}
```

**Processing logic:**
1. Validate API key (401 if wrong)
2. Map team names → abbreviations (e.g. "Royal Challengers Bengaluru" → "RCB")
3. Map player names → DB IDs (e.g. "Manick" → "panicking", "Sathish" → "satish")
4. Map match types ("Normal" → "league")
5. **Matches:** Update winner, is_completed, underdog_team for each match. Does NOT touch is_power_match (admin-only). Sets `result_updated_at` when completed.
6. **Predictions:** Upsert per match (additive only — never deletes predictions absent from sheet)
7. **Jokers:** Upsert participant_id + match_id for flagged predictions
8. Uses `getSupabaseAdmin()` (service role) for writes

**Safety guarantees:**
- Empty winner in sheet does NOT clear an existing winner in DB
- Predictions missing from sheet are NOT deleted
- `is_power_match` and bonus questions are untouched
- Unknown player/team names logged as errors but don't crash the sync

**Response:**
```json
{
  "success": true,
  "summary": { "matches": { "updated": 5, "skipped": 65 }, "predictions": { "upserted": 145 }, "jokers": { "upserted": 2 } },
  "errors": ["Unknown player: 'Xyz' in match 15"]
}
```

### 2. Mapping Utilities
**File:** `src/lib/sync-mappings.ts`

- `TEAM_NAME_TO_ABBR` — auto-derived from existing `TEAMS` constant (stays in sync if teams change)
- `resolvePlayerId(sheetName)` — handles "Manick"→"panicking", "Sathish"→"satish", "Safeer"→"safer", others→lowercase. Validates against `PARTICIPANTS` list.
- `MATCH_TYPE_MAP` — "Normal"→"league", "Qualifier 1"→"qualifier1", etc.

### 3. Google Apps Script
Script goes on the mirrored Google Sheet (Extensions > Apps Script).

**Functions:**
- `syncAll()` — reads Matches + Predictions tabs, builds payload, POSTs to API
- `onOpen()` — adds "IPL Sync > Sync All Now" menu
- `setupTrigger()` — one-time setup for 5-minute auto-sync

**Data reading:**
- Matches tab: reads columns A (Match ID), E (Match Type), F (Underdog Team), G (Winner). Skips rows without a winner.
- Predictions tab: reads columns A (Player), B (Match ID), C (Prediction), D (Joker). Skips empty predictions.

**Config stored in Script Properties** (not hardcoded):
- `SYNC_API_URL` — your Vercel deployment URL + `/api/sync`
- `SYNC_API_KEY` — same key as in Vercel env vars

### 4. Environment Variables
Add to `.env.local` and Vercel:
- `SYNC_API_KEY` — a random secret (generate with `openssl rand -hex 32`)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/api/sync/route.ts` | Create — sync endpoint |
| `src/lib/sync-mappings.ts` | Create — name mapping utilities |
| `.env.local` | Add `SYNC_API_KEY` |

Plus a separate Google Apps Script (provided as code to copy-paste into the sheet).

---

## Setup: Complete Step-by-Step Guide

### Step 1: Deploy the Sync API (done by Kishore)

1. **Generate an API key:**
   ```bash
   openssl rand -hex 32
   ```
   Save this value — you'll need it in two places.

2. **Add the key to your local environment:**
   - Open `.env.local` in the project root
   - Add: `SYNC_API_KEY=<paste-your-generated-key>`

3. **Add the key to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com) → your project → Settings → Environment Variables
   - Add `SYNC_API_KEY` with the same value
   - Redeploy (or it picks up on next push to `main`)

4. **Verify the endpoint is live:**
   ```bash
   # Should return 401 (no key)
   curl -X POST https://<YOUR_VERCEL_URL>/api/sync

   # Should return 200 with empty summary
   curl -X POST https://<YOUR_VERCEL_URL>/api/sync \
     -H "Content-Type: application/json" \
     -H "x-api-key: <YOUR_SYNC_API_KEY>" \
     -d '{"matches":[],"predictions":[]}'
   ```

**Placeholders to fill:**
- `<YOUR_VERCEL_URL>` — your Vercel deployment URL (e.g. `ipl-prediction-contest.vercel.app`)
- `<YOUR_SYNC_API_KEY>` — the key you generated above

---

### Step 2: Create the Google Apps Script

1. **Open your mirrored Google Sheet:**
   - Go to: `<YOUR_MIRRORED_SHEET_URL>`

2. **Open Apps Script editor:**
   - In the sheet menu bar, click **Extensions → Apps Script**
   - This opens a new browser tab with the Apps Script editor
   - You'll see a default `Code.gs` file with an empty `myFunction()`

3. **Replace the code:**
   - Select all the default code in `Code.gs` and delete it
   - Paste the entire Apps Script code (provided during implementation)
   - Click **Save** (Ctrl+S / Cmd+S) — name the project "IPL Sync" when prompted

4. **Set Script Properties (your config):**
   - In the Apps Script editor, click the **gear icon** (⚙️ Project Settings) in the left sidebar
   - Scroll down to **Script Properties**
   - Click **Add script property** and add these two:

   | Property | Value |
   |----------|-------|
   | `SYNC_API_URL` | `https://<YOUR_VERCEL_URL>/api/sync` |
   | `SYNC_API_KEY` | `<YOUR_SYNC_API_KEY>` |

   - Click **Save script properties**

**Placeholders to fill:**
- `<YOUR_MIRRORED_SHEET_URL>` — the URL of your mirrored Google Sheet
- `<YOUR_VERCEL_URL>` — same as Step 1
- `<YOUR_SYNC_API_KEY>` — same key from Step 1

---

### Step 3: Authorize the Script

The first time the script runs, Google will ask for permissions.

1. In the Apps Script editor, select `syncAll` from the function dropdown (top toolbar)
2. Click the **Run** button (▶️)
3. A popup appears: **"Authorization required"** — click **Review permissions**
4. Select your Google account
5. You may see **"Google hasn't verified this app"** — click **Advanced → Go to IPL Sync (unsafe)**
   - This is normal for personal scripts — it's your own code running on your own sheet
6. Click **Allow** to grant permissions:
   - "See, edit, create, and delete spreadsheets" (to read sheet data)
   - "Connect to an external service" (to call your API)
7. The script runs — check the **Execution log** at the bottom for results

---

### Step 4: Set Up the Auto-Sync Trigger (every 5 minutes)

1. In the Apps Script editor, select `setupTrigger` from the function dropdown
2. Click **Run** (▶️)
3. This creates a time-driven trigger that calls `syncAll()` every 5 minutes
4. **Verify the trigger was created:**
   - Click the **clock icon** (⏰ Triggers) in the left sidebar
   - You should see an entry: `syncAll` | `Time-driven` | `Every 5 minutes`

Alternatively, you can set up the trigger manually:
1. Click the **clock icon** (⏰ Triggers) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - Choose which function: `syncAll`
   - Choose which deployment: `Head`
   - Select event source: `Time-driven`
   - Select type of time: `Minutes timer`
   - Select interval: `Every 5 minutes`
4. Click **Save**

---

### Step 5: Verify the Manual Sync Button

1. Go back to your Google Sheet (close/switch tabs from Apps Script)
2. **Reload the sheet** (F5 / Cmd+R)
3. After a few seconds, a new menu appears in the menu bar: **IPL Sync**
4. Click **IPL Sync → Sync All Now**
5. A toast notification appears: "Starting sync..." then "Sync complete" with a summary
6. Check your app — predictions and match results should be updated

---

### Step 6: Confirm Everything Works

| Check | How |
|-------|-----|
| Auto-sync is running | Apps Script editor → Triggers (⏰) → see `syncAll` with "Last run" timestamp |
| Sync succeeded | Apps Script editor → Executions (📋) → check latest run status is "Completed" |
| Data is in the app | Open your IPL app → check a match that has a winner in the sheet |
| Errors logged | Apps Script editor → Executions → click a run → expand to see logs and any error messages |

---

### Troubleshooting

| Problem | Fix |
|---------|-----|
| "401 Unauthorized" in execution log | API key mismatch — verify `SYNC_API_KEY` matches between Script Properties and Vercel env vars |
| "Exception: Request failed" | Check your Vercel URL is correct in Script Properties, and the app is deployed |
| Trigger stopped running | Google disables triggers after repeated failures — check Executions log, fix the error, re-run `setupTrigger()` |
| "Unknown player: 'XYZ'" in sync response | A player name in the sheet doesn't match the mapping — update the `SHEET_PLAYER_OVERRIDES` map in `sync-mappings.ts` |
| Menu doesn't appear | Reload the sheet; `onOpen()` only runs when the sheet is opened/refreshed |
| Sheet data not updating | The mirrored sheet updates via IMPORTRANGE — check that the source sheet has the latest data |

---

## Verification
1. **curl test locally** — POST to `localhost:3000/api/sync` with test payload, verify DB updates
2. **Apps Script dry run** — log payload without calling API, verify data reads correctly
3. **End-to-end** — deploy to Vercel, run syncAll() from Apps Script, verify app reflects changes
4. **Non-destructive check** — confirm existing is_power_match, bonus questions, and trivia are untouched
