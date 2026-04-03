import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase.js';

// Helper: Generate API key
function generateApiKey() {
  return 'ap_' + crypto.randomBytes(32).toString('hex');
}

// Helper: Hash API key
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Get all API keys for user
export async function getUserApiKeys(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, last_used_at, is_active, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      keys: keys || []
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({ error: 'Failed to fetch API keys' });
  }
}

// Create new API key
export async function createApiKey(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API key name required' });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert([
        {
          user_id: req.user.userId,
          key_hash: apiKeyHash,
          name
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'API key created successfully',
      key: {
        id: data.id,
        name: data.name,
        created_at: data.created_at
      },
      api_key: apiKey // Hanya sekali kali kelihatan!
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({ error: 'Failed to create API key' });
  }
}

// Revoke API key
export async function revokeApiKey(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { keyId } = req.params;

    if (!keyId) {
      return res.status(400).json({ error: 'Key ID required' });
    }

    // Check if key belongs to user
    const { data: key, error: checkError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();

    if (checkError || !key || key.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update is_active to false
    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return res.status(500).json({ error: 'Failed to revoke API key' });
  }
}

// Update API key name
export async function updateApiKey(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { keyId } = req.params;
    const { name } = req.body;

    if (!keyId) {
      return res.status(400).json({ error: 'Key ID required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }

    // Check if key belongs to user
    const { data: key, error: checkError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('id', keyId)
      .single();

    if (checkError || !key || key.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update name
    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({ name })
      .eq('id', keyId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'API key updated successfully'
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return res.status(500).json({ error: 'Failed to update API key' });
  }
}
