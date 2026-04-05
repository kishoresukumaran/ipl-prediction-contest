-- Migration 002: Remove bonus questions feature and prediction timing column
-- This migration drops all bonus question/response tables and removes the prediction_time column

-- Drop bonus question and response tables (if they exist)
DROP TABLE IF EXISTS bonus_responses;
DROP TABLE IF EXISTS bonus_questions;

-- Remove the prediction_time column from predictions table
ALTER TABLE predictions DROP COLUMN IF EXISTS prediction_time;
