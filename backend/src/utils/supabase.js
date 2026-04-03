import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found in .env');
}

// Anon client (for public operations)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Service role client (for admin operations like password hashing)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default supabase;
