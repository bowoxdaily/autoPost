-- Migration: Add user credentials columns for Gemini API and WordPress
-- This migration adds columns to store encrypted user credentials

ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS content_language TEXT DEFAULT 'id';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trending_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trending_niche TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS include_images BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_gemini_key ON users(id) WHERE gemini_api_key IS NOT NULL;

COMMENT ON COLUMN users.gemini_api_key IS 'Encrypted Gemini API Key for per-user API calls';
COMMENT ON COLUMN users.wordpress_url IS 'Encrypted WordPress site URL';
COMMENT ON COLUMN users.wordpress_username IS 'Encrypted WordPress username';
COMMENT ON COLUMN users.wordpress_password IS 'Encrypted WordPress application password';
COMMENT ON COLUMN users.content_language IS 'Preferred content language: id (Bahasa Indonesia) or en (English)';
COMMENT ON COLUMN users.trending_enabled IS 'Whether to use Google Trends for choosing post topic';
COMMENT ON COLUMN users.trending_niche IS 'Optional niche keyword to filter trending results';
COMMENT ON COLUMN users.include_images IS 'Whether posts should include featured image upload flow';
