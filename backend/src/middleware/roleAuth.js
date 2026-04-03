import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase.js';

// Middleware: Check if user is SUPERUSER
export function requireSuperuser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can access this endpoint' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
}

// Middleware: API Key Authentication (alternative to JWT)
// Usage: Instead of Bearer token, use: Authorization: ApiKey ap_xxxxx
export async function apiKeyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Optional API key, continue with req.user = null
    }

    if (!authHeader.startsWith('ApiKey ')) {
      return next(); // Not API key auth, let other middleware handle
    }

    const apiKey = authHeader.substring(7);
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    // Hash the provided key
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find the key in database
    const { data: keyRecord, error } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active')
      .eq('key_hash', apiKeyHash)
      .single();

    if (error || !keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!keyRecord.is_active) {
      return res.status(401).json({ error: 'API key is revoked' });
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', keyRecord.user_id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Update last_used_at
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', apiKeyHash)
      .catch(err => console.log('Failed to update last_used_at:', err));

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authType: 'api_key'
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({ error: 'API key authentication failed' });
  }
}

// Optional: Combine JWT and API Key auth
export async function flexibleAuth(req, res, next) {
  try {
    // First try JWT
    const jwtAuth = require('./auth.js').authMiddleware;
    
    const authHeader = req.headers.authorization;
    
    // If it's API key auth, use apiKeyAuth
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return apiKeyAuth(req, res, next);
    }

    // Otherwise use JWT
    return jwtAuth(req, res, next);
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
