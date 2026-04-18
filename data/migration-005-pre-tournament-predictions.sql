-- Migration 005: Pre-Tournament ("Crystal Ball") prediction tables
--
-- Stores each player's preseason predictions for 6 questions:
--   1. IPL Champion 2026          (10 pts)
--   2. Orange Cap winner          (5  pts)
--   3. Purple Cap winner          (5  pts)
--   4. Top 4 Play-off teams       (3 / 6 / 9 / 15 pts based on # correct out of 4)
--   5. Table Topper in playoffs   (3  pts)
--   6. Our Contest Winner         (3  pts)
--
-- Source of truth: "Pre_Tournament_Points" tab in the Google Sheet, synced via
-- google-apps-script.gs -> POST /api/sync.
--
-- Two tables so we can phased-reveal actuals (admin updates one column at a time).

-- =============================================================
-- 1. Per-player predictions (one row per participant)
-- =============================================================
CREATE TABLE IF NOT EXISTS pre_tournament_predictions (
  id              BIGSERIAL PRIMARY KEY,
  player          TEXT        NOT NULL UNIQUE,        -- sheet display name e.g. "Kishore"
  champion        TEXT,                                -- team abbr e.g. "CSK"
  orange_cap      TEXT,                                -- team abbr
  purple_cap      TEXT,                                -- team abbr
  playoff_teams   TEXT,                                -- CSV of 4 team abbrs e.g. "CSK,MI,RCB,SRH"
  table_topper    TEXT,                                -- team abbr
  contest_winner  TEXT,                                -- participant_id e.g. "kishore"
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pre_tournament_predictions_player
  ON pre_tournament_predictions(player);

-- =============================================================
-- 2. Actual / verified results (singleton row, id = 1)
-- =============================================================
CREATE TABLE IF NOT EXISTS pre_tournament_actuals (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  champion        TEXT,
  orange_cap      TEXT,
  purple_cap      TEXT,
  playoff_teams   TEXT,                                -- CSV of 4 team abbrs
  table_topper    TEXT,
  contest_winner  TEXT,                                -- participant_id
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pre_tournament_actuals_singleton CHECK (id = 1)
);

-- Seed the singleton row (no-op if it already exists)
INSERT INTO pre_tournament_actuals (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 3. Disable RLS so the service-role API routes can read/write
--    (matches the trivia_points convention; reads use admin client)
-- =============================================================
ALTER TABLE pre_tournament_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pre_tournament_actuals     DISABLE ROW LEVEL SECURITY;
