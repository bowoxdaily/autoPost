import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function getSupabaseAdminClient() {
  const mod = await import('./supabase.js');
  return mod.supabaseAdmin;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'db.json');

// Default data structure (for legacy settings only)
const defaultData = {
  settings: {
    geminiKey: '',
    wpUrl: '',
    wpUser: '',
    wpPass: '',
    intervalWaktu: 12
  },
  cronActive: false,
  logs: [] // Deprecated - now using Supabase logs table
};

// Ensure data directory exists
export function initializeDatabase() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return defaultData;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

export async function updateSettings(settings) {
  const data = readDB();
  data.settings = { ...data.settings, ...settings };
  writeDB(data);
  return data.settings;
}

export async function getSettings() {
  const data = readDB();
  return data.settings;
}

export async function getSettingsForUser(userId) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient();
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      console.warn(`Could not fetch settings for user ${userId}, using defaults`);
      return {
        interval_waktu: 12
      };
    }

    return settings;
  } catch (error) {
    console.warn(`Error fetching settings for user ${userId}:`, error.message);
    return {
      interval_waktu: 12
    };
  }
}

export async function setCronActive(isActive) {
  const data = readDB();
  data.cronActive = isActive;
  writeDB(data);
  return isActive;
}

export async function getCronActive() {
  const data = readDB();
  return data.cronActive;
}

/**
 * Add a log entry to Supabase (per-user)
 * @param {string} userId - User ID from JWT token
 * @param {object} logEntry - Log data (title, status, postId, link, etc)
 * @returns {object} - Created log entry
 */
export async function addLog(userId, logEntry) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient();
    if (!userId) {
      throw new Error('User ID is required to add log');
    }

    const timestamp = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('logs')
      .insert([
        {
          user_id: userId,
          title: logEntry.title,
          status: logEntry.status,
          post_id: logEntry.postId || null,
          link: logEntry.link || null,
          seo_score: logEntry.seoScore || 0,
          keywords: logEntry.keywords ? (Array.isArray(logEntry.keywords) ? logEntry.keywords.join(', ') : logEntry.keywords) : null,
          error: logEntry.error || null,
          created_at: timestamp
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[Logs] Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[Logs] Failed to add log:', error.message);
    throw error;
  }
}

/**
 * Get logs for a specific user
 * @param {string} userId - User ID from JWT token
 * @param {number} limit - Maximum number of logs to return
 * @returns {array} - Array of log entries
 */
export async function getLogs(userId, limit = 100) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient();
    if (!userId) {
      throw new Error('User ID is required to fetch logs');
    }

    const { data, error } = await supabaseAdmin
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Logs] Database error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Logs] Failed to fetch logs:', error.message);
    throw error;
  }
}

/**
 * Clear all logs for a specific user
 * @param {string} userId - User ID from JWT token
 * @returns {object} - Result
 */
export async function clearLogs(userId) {
  try {
    const supabaseAdmin = await getSupabaseAdminClient();
    if (!userId) {
      throw new Error('User ID is required to clear logs');
    }

    const { error } = await supabaseAdmin
      .from('logs')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Logs] Database error:', error);
      throw error;
    }

    return { success: true, message: 'Logs cleared' };
  } catch (error) {
    console.error('[Logs] Failed to clear logs:', error.message);
    throw error;
  }
}
