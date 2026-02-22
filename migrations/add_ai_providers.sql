-- Migration: Add multi-provider AI key pool support
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS equivalent)

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ai_providers JSONB DEFAULT '{}'::jsonb;
