import { supabaseAdmin } from './supabase.js';

/**
 * Run database migrations
 * Adds user credential columns and logs table if they don't exist
 */
export async function runMigrations() {
  try {
    console.log('🔄 Checking database schema...');

    // Check if user credential columns exist
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('gemini_api_key, wordpress_url, wordpress_username, wordpress_password')
      .limit(1);

    if (userError && userError.code === '42703') {
      console.log('⚠️  User credential columns not found. Adding them...');
      console.log('📝 Please run migration: migrations/add_user_credentials.sql');
    } else if (userError) {
      console.log('⚠️  Could not verify user schema:', userError.message);
    }

    // Check if logs table exists
    const { data: logsData, error: logsError } = await supabaseAdmin
      .from('logs')
      .select('id')
      .limit(1);

    if (logsError && logsError.code === '42P01') {
      // Table doesn't exist
      console.log('⚠️  Logs table not found. Adding it...');
      console.log('📝 Please run migration: migrations/add_logs_table.sql');
    } else if (logsError && logsError.code !== '42703') {
      // Other errors
      console.log('⚠️  Could not verify logs schema:', logsError.message);
    } else {
      // Table exists - all good
      console.log('✅ Database schema is up to date');
    }
  } catch (error) {
    console.warn('⚠️  Migration check failed:', error.message);
    console.log('📝 You may need to run migrations manually from migrations/ folder');
  }
}

/**
 * Alternative: Direct SQL execution (if RPC not available)
 */
export async function runMigrationsSQL() {
  try {
    console.log('🔄 Running SQL migrations...');

    const credentialsMigration = `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wordpress_password TEXT;
    `;

    const logsMigration = `
      CREATE TABLE IF NOT EXISTS logs (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        post_id BIGINT,
        link TEXT,
        seo_score INTEGER DEFAULT 0,
        keywords TEXT,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('📝 Please run migrations manually via Supabase UI or using:');
    console.log('   1. migrations/add_user_credentials.sql');
    console.log('   2. migrations/add_logs_table.sql');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

export default { runMigrations, runMigrationsSQL };
