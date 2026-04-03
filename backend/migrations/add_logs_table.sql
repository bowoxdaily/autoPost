-- Migration: Add logs table for per-user post logging
-- Date: 2026-03-31

CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  post_id BIGINT,
  link TEXT,
  seo_score INTEGER DEFAULT 0,
  keywords TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_created ON logs(user_id, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own logs
CREATE POLICY "users_view_own_logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own logs
CREATE POLICY "users_insert_own_logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own logs
CREATE POLICY "users_delete_own_logs" ON logs
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logs_updated_at_trigger
BEFORE UPDATE ON logs
FOR EACH ROW
EXECUTE FUNCTION update_logs_updated_at();
