# Supabase Setup untuk AutoPost SaaS

## 1. Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with email atau GitHub
4. Create new project (pilih region terdekat)
5. Tunggu provisioning (~2 menit)

## 2. Get Credentials
Dari Supabase Dashboard:
- Project Settings → API
- Copy: `Project URL` dan `anon public key`
- Keep `service_role secret` safe (jangan share)

## 3. Database Schema

Paste kode ini di SQL Editor (Supabase Dashboard → SQL Editor → New Query):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  stripe_customer_id VARCHAR(255),
  api_usage BIGINT DEFAULT 0,
  api_limit BIGINT DEFAULT 10000, -- requests per month
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (per user)
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gemini_key_hash VARCHAR(255), -- encrypted
  wp_url VARCHAR(255),
  wp_user VARCHAR(255),
  wp_pass_hash VARCHAR(255), -- encrypted
  interval_waktu INTEGER DEFAULT 12,
  automation_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table (per user)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, failed
  wordpress_post_id BIGINT,
  wordpress_link VARCHAR(255),
  seo_score INTEGER,
  keywords TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs table (per user)
CREATE TABLE logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50), -- success, failed
  post_id UUID REFERENCES posts(id),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);

-- Row Level Security (RLS) - Users can only see their own data
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own posts" ON posts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can see own logs" ON logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can see own settings" ON settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can see own api keys" ON api_keys
  FOR SELECT USING (user_id = auth.uid());
```

## 4. Setup Environment Variables

Create `.env.local` di backend:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=generate_random_secret_here
GEMINI_API_KEY=already_have_this
```

## 5. Test Connection
```bash
npm run test-supabase
```

Selesai! Database sudah siap untuk multi-user. ✅
