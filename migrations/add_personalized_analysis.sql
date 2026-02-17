-- Migration to add personalized_analysis column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS personalized_analysis JSONB DEFAULT NULL;
