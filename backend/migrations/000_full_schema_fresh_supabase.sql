-- Full schema migration for a fresh Supabase project
-- Safe to run multiple times (idempotent)

BEGIN;

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- TABLES
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  api_usage BIGINT NOT NULL DEFAULT 0,
  api_limit BIGINT NOT NULL DEFAULT 100,

  -- Per-user AI + WordPress credentials (encrypted at app level)
  ai_provider VARCHAR(20) NOT NULL DEFAULT 'gemini',
  gemini_api_key TEXT,
  sumopod_api_key TEXT,
  sumopod_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  chatgpt_api_key TEXT,
  claude_api_key TEXT,
  wordpress_url TEXT,
  wordpress_username TEXT,
  wordpress_password TEXT,
  content_language VARCHAR(5) NOT NULL DEFAULT 'id',
  trending_enabled BOOLEAN NOT NULL DEFAULT true,
  trending_niche TEXT NOT NULL DEFAULT '',
  include_images BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_role_check CHECK (role IN ('user', 'superuser')),
  CONSTRAINT users_subscription_plan_check CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
  CONSTRAINT users_ai_provider_check CHECK (ai_provider IN ('gemini', 'sumopod', 'chatgpt', 'claude')),
  CONSTRAINT users_content_language_check CHECK (content_language IN ('id', 'en'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Default API Key',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Legacy/compat settings table still used by cron interval endpoint
  gemini_key_hash TEXT,
  wp_url VARCHAR(500),
  wp_user VARCHAR(255),
  wp_pass_hash TEXT,
  interval_waktu INTEGER NOT NULL DEFAULT 12,
  automation_enabled BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  wordpress_post_id BIGINT,
  wordpress_link VARCHAR(1000),
  seo_score INTEGER DEFAULT 0,
  keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT posts_status_check CHECK (status IN ('draft', 'published', 'failed'))
);

CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  post_id BIGINT,
  link TEXT,
  seo_score INTEGER NOT NULL DEFAULT 0,
  keywords TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT logs_status_check CHECK (status IN ('success', 'failed', 'pending'))
);

CREATE TABLE IF NOT EXISTS branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  logo_url VARCHAR(1000),
  favicon_url VARCHAR(1000),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  terms_url VARCHAR(1000),
  privacy_url VARCHAR(1000),
  support_email VARCHAR(255),
  website_url VARCHAR(1000),
  social_twitter VARCHAR(500),
  social_linkedin VARCHAR(500),
  social_facebook VARCHAR(500),
  custom_css TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- BACKWARD-COMPAT ALTERs
-- =========================

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_usage BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_limit BIGINT NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(20) NOT NULL DEFAULT 'gemini';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sumopod_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sumopod_model TEXT NOT NULL DEFAULT 'gpt-4o-mini';
ALTER TABLE users ADD COLUMN IF NOT EXISTS chatgpt_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS content_language VARCHAR(5) NOT NULL DEFAULT 'id';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trending_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trending_niche TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS include_images BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_ai_provider_check;
ALTER TABLE users ADD CONSTRAINT users_ai_provider_check CHECK (ai_provider IN ('gemini', 'sumopod', 'chatgpt', 'claude'));

-- api_keys
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gemini_key_hash TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wp_url VARCHAR(500);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wp_user VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wp_pass_hash TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS interval_waktu INTEGER NOT NULL DEFAULT 12;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_post_id BIGINT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_link VARCHAR(1000);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- logs
ALTER TABLE logs ADD COLUMN IF NOT EXISTS post_id BIGINT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS seo_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- branding
ALTER TABLE branding ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1000);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(1000);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS terms_url VARCHAR(1000);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS privacy_url VARCHAR(1000);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS support_email VARCHAR(255);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS website_url VARCHAR(1000);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS social_twitter VARCHAR(500);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS social_linkedin VARCHAR(500);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(500);
ALTER TABLE branding ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================
-- INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_gemini_key ON users(id) WHERE gemini_api_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_created ON logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_user_id ON branding(user_id);
CREATE INDEX IF NOT EXISTS idx_branding_active_updated ON branding(is_active, updated_at DESC);

-- =========================
-- UPDATED_AT TRIGGERS
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS api_keys_set_updated_at ON api_keys;
CREATE TRIGGER api_keys_set_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS settings_set_updated_at ON settings;
CREATE TRIGGER settings_set_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS posts_set_updated_at ON posts;
CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS logs_set_updated_at ON logs;
CREATE TRIGGER logs_set_updated_at
BEFORE UPDATE ON logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS branding_set_updated_at ON branding;
CREATE TRIGGER branding_set_updated_at
BEFORE UPDATE ON branding
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- =========================
-- RLS + POLICIES
-- =========================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- api_keys
DROP POLICY IF EXISTS api_keys_select_own ON api_keys;
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_insert_own ON api_keys;
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_update_own ON api_keys;
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS api_keys_delete_own ON api_keys;
CREATE POLICY api_keys_delete_own ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- settings
DROP POLICY IF EXISTS settings_select_own ON settings;
CREATE POLICY settings_select_own ON settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS settings_insert_own ON settings;
CREATE POLICY settings_insert_own ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS settings_update_own ON settings;
CREATE POLICY settings_update_own ON settings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- posts
DROP POLICY IF EXISTS posts_select_own ON posts;
CREATE POLICY posts_select_own ON posts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS posts_insert_own ON posts;
CREATE POLICY posts_insert_own ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS posts_update_own ON posts;
CREATE POLICY posts_update_own ON posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS posts_delete_own ON posts;
CREATE POLICY posts_delete_own ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- logs
DROP POLICY IF EXISTS users_view_own_logs ON logs;
CREATE POLICY users_view_own_logs ON logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_insert_own_logs ON logs;
CREATE POLICY users_insert_own_logs ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_delete_own_logs ON logs;
CREATE POLICY users_delete_own_logs ON logs
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_update_own_logs ON logs;
CREATE POLICY users_update_own_logs ON logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- branding
DROP POLICY IF EXISTS branding_select_own ON branding;
CREATE POLICY branding_select_own ON branding
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS branding_insert_own ON branding;
CREATE POLICY branding_insert_own ON branding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS branding_update_own ON branding;
CREATE POLICY branding_update_own ON branding
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS branding_delete_own ON branding;
CREATE POLICY branding_delete_own ON branding
  FOR DELETE USING (auth.uid() = user_id);

-- Public read for active branding (optional for direct client reads)
DROP POLICY IF EXISTS branding_public_read_active ON branding;
CREATE POLICY branding_public_read_active ON branding
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- =========================
-- STORAGE BUCKET (LOGOS)
-- =========================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS logos_public_read ON storage.objects;
CREATE POLICY logos_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS logos_authenticated_upload ON storage.objects;
CREATE POLICY logos_authenticated_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND name LIKE 'logos/' || auth.uid()::text || '-%'
  );

DROP POLICY IF EXISTS logos_authenticated_update ON storage.objects;
CREATE POLICY logos_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND name LIKE 'logos/' || auth.uid()::text || '-%'
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND name LIKE 'logos/' || auth.uid()::text || '-%'
  );

DROP POLICY IF EXISTS logos_authenticated_delete ON storage.objects;
CREATE POLICY logos_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND name LIKE 'logos/' || auth.uid()::text || '-%'
  );

COMMIT;
