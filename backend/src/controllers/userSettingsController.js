import { supabaseAdmin } from '../utils/supabase.js';
import { encrypt, decrypt } from '../utils/encryption.js';

/**
 * Get user's credentials (Gemini API Key and WordPress settings)
 */
export async function getUserSettings(req, res) {
  try {
    const userId = req.user?.id;

    // Validate userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or ID missing' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('gemini_api_key, wordpress_url, wordpress_username, wordpress_password, content_language, trending_enabled, trending_niche, include_images')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrypt the credentials before sending
    const decryptedSettings = {
      gemini_api_key: data.gemini_api_key ? decrypt(data.gemini_api_key) : '',
      wordpress_url: data.wordpress_url ? decrypt(data.wordpress_url) : '',
      wordpress_username: data.wordpress_username ? decrypt(data.wordpress_username) : '',
      wordpress_password: data.wordpress_password ? decrypt(data.wordpress_password) : '',
      content_language: data.content_language || 'id',
      trending_enabled: data.trending_enabled ?? true,
      trending_niche: data.trending_niche || '',
      include_images: data.include_images ?? true
    };

    res.json({
      success: true,
      settings: decryptedSettings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

/**
 * Update user's credentials (Gemini API Key and WordPress settings)
 */
export async function updateUserSettings(req, res) {
  try {
    const userId = req.user?.id;

    // Validate userId
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated or ID missing' });
    }

    const { gemini_api_key, wordpress_url, wordpress_username, wordpress_password, content_language, trending_enabled, trending_niche, include_images } = req.body;

    // Validate input
    const noUsefulInput =
      gemini_api_key === undefined &&
      wordpress_url === undefined &&
      content_language === undefined &&
      trending_enabled === undefined &&
      trending_niche === undefined &&
      include_images === undefined;

    if (noUsefulInput) {
      return res.status(400).json({ 
        error: 'At least one setting must be provided' 
      });
    }

    if (content_language && !['id', 'en'].includes(content_language)) {
      return res.status(400).json({
        error: 'Invalid language. Allowed values: id or en'
      });
    }

    if (trending_enabled !== undefined && typeof trending_enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid trending_enabled value. Must be boolean.'
      });
    }
    if (include_images !== undefined && typeof include_images !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid include_images value. Must be boolean.'
      });
    }

    // Build partial update object (do not overwrite existing values with null)
    const encryptedSettings = {};
    if (gemini_api_key !== undefined) {
      encryptedSettings.gemini_api_key = gemini_api_key ? encrypt(gemini_api_key) : null;
    }
    if (wordpress_url !== undefined) {
      encryptedSettings.wordpress_url = wordpress_url ? encrypt(wordpress_url) : null;
    }
    if (wordpress_username !== undefined) {
      encryptedSettings.wordpress_username = wordpress_username ? encrypt(wordpress_username) : null;
    }
    if (wordpress_password !== undefined) {
      encryptedSettings.wordpress_password = wordpress_password ? encrypt(wordpress_password) : null;
    }
    if (content_language !== undefined) {
      encryptedSettings.content_language = content_language;
    }
    if (trending_enabled !== undefined) {
      encryptedSettings.trending_enabled = trending_enabled;
    }
    if (trending_niche !== undefined) {
      encryptedSettings.trending_niche = trending_niche;
    }
    if (include_images !== undefined) {
      encryptedSettings.include_images = include_images;
    }

    // Update user settings
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(encryptedSettings)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        gemini_api_key: data.gemini_api_key ? '***' : '',
        wordpress_url: data.wordpress_url ? decrypt(data.wordpress_url) : '',
        wordpress_username: data.wordpress_username ? '***' : '',
        wordpress_password: data.wordpress_password ? '***' : '',
        content_language: data.content_language || 'id',
        trending_enabled: data.trending_enabled ?? true,
        trending_niche: data.trending_niche || '',
        include_images: data.include_images ?? true
      }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

/**
 * Get user's Gemini API Key for service use
 * @param {string} userId - The user ID
 * @returns {string|null} - Decrypted API key or null
 */
export async function getUserGeminiKey(userId) {
  try {
    if (!userId) {
      console.error('getUserGeminiKey: No userId provided');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('gemini_api_key')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getUserGeminiKey error:', error);
      return null;
    }

    if (!data || !data.gemini_api_key) {
      return null;
    }

    return decrypt(data.gemini_api_key);
  } catch (error) {
    console.error('Error getting user Gemini key:', error);
    return null;
  }
}

/**
 * Get user's WordPress credentials for service use
 * @param {string} userId - The user ID
 * @returns {object|null} - Decrypted WordPress credentials or null
 */
export async function getUserWordPressCredentials(userId) {
  try {
    if (!userId) {
      console.error('getUserWordPressCredentials: No userId provided');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('wordpress_url, wordpress_username, wordpress_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('getUserWordPressCredentials error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      url: data.wordpress_url ? decrypt(data.wordpress_url) : null,
      username: data.wordpress_username ? decrypt(data.wordpress_username) : null,
      password: data.wordpress_password ? decrypt(data.wordpress_password) : null
    };
  } catch (error) {
    console.error('Error getting user WordPress credentials:', error);
    return null;
  }
}

/**
 * Verify user's credentials (test connection)
 */
export async function verifyUserCredentials(req, res) {
  try {
    const userId = req.user?.id;

    // Validate userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated or ID missing' });
    }

    const { credentialType } = req.body;

    if (credentialType === 'gemini') {
      // Test Gemini API key
      const apiKey = await getUserGeminiKey(userId);
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'No Gemini API key found' 
        });
      }
      // Simple validation - check if key format is correct
      if (!apiKey.startsWith('AIza')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Gemini API key format' 
        });
      }
      res.json({ success: true, message: 'Gemini API key format is valid' });
    } else if (credentialType === 'wordpress') {
      // Test WordPress credentials
      const creds = await getUserWordPressCredentials(userId);
      if (!creds || !creds.url || !creds.username || !creds.password) {
        return res.status(400).json({ 
          success: false, 
          error: 'WordPress credentials are incomplete' 
        });
      }
      // Could add actual connection test here later
      res.json({ success: true, message: 'WordPress credentials format is valid' });
    } else {
      res.status(400).json({ error: 'Invalid credential type' });
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({ success: false, error: 'Failed to verify credentials' });
  }
}
