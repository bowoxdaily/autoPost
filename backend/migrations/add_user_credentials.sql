-- Migration: Add user credentials columns for Gemini API and WordPress
-- This migration adds columns to store encrypted user credentials

ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_password TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_gemini_key ON users(id) WHERE gemini_api_key IS NOT NULL;

COMMENT ON COLUMN users.gemini_api_key IS 'Encrypted Gemini API Key for per-user API calls';
COMMENT ON COLUMN users.wordpress_url IS 'Encrypted WordPress site URL';
COMMENT ON COLUMN users.wordpress_username IS 'Encrypted WordPress username';
COMMENT ON COLUMN users.wordpress_password IS 'Encrypted WordPress application password';
