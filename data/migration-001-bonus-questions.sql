-- Migration 001: Add bonus questions per match
-- This is ADDITIVE ONLY - no existing tables are modified, no data loss
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bonus_questions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_responses (
  id SERIAL PRIMARY KEY,
  bonus_question_id INTEGER REFERENCES bonus_questions(id) ON DELETE CASCADE,
  participant_id TEXT REFERENCES participants(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  UNIQUE(bonus_question_id, participant_id)
);

-- Enable RLS
ALTER TABLE bonus_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_responses ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read bonus_questions" ON bonus_questions FOR SELECT USING (true);
CREATE POLICY "Public read bonus_responses" ON bonus_responses FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access bonus_questions" ON bonus_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bonus_responses" ON bonus_responses FOR ALL USING (true) WITH CHECK (true);
