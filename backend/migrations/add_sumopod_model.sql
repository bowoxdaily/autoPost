-- Migration: Add per-user Sumopod model preference

ALTER TABLE users ADD COLUMN IF NOT EXISTS sumopod_model TEXT DEFAULT 'gpt-4o-mini';

COMMENT ON COLUMN users.sumopod_model IS 'Preferred Sumopod model for per-user content generation';
