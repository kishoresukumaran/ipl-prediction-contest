-- Migration 004: Create trivia_points table
-- This table stores the calculated trivia points for each player
-- Source: Trivia_Points sheet maintained by admin

CREATE TABLE IF NOT EXISTS trivia_points (
  id BIGSERIAL PRIMARY KEY,
  player TEXT NOT NULL,
  trivia_id INTEGER NOT NULL,
  prediction TEXT,
  correct_answer TEXT,
  correct_check INTEGER NOT NULL DEFAULT 0, -- 1 for correct, 0 for incorrect
  points_earned INTEGER NOT NULL DEFAULT 0, -- Points awarded (1, 2, or other values)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player, trivia_id) -- One entry per player per trivia question
);

CREATE INDEX idx_trivia_points_player ON trivia_points(player);
CREATE INDEX idx_trivia_points_trivia_id ON trivia_points(trivia_id);
