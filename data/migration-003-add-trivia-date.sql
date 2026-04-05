-- Migration 003: Add date column to trivia table
-- This migration adds the date column which was missing from the trivia table

ALTER TABLE trivia ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
