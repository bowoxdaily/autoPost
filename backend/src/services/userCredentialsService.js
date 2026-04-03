import { supabaseAdmin } from '../utils/supabase.js';
import { decrypt } from '../utils/encryption.js';

/**
 * Get decrypted user credentials for posting/operations
 * @param {string} userId - User ID from JWT token
 * @returns {object} - Decrypted credentials
 */
export async function getUserCredentialsForPosting(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('gemini_api_key, wordpress_url, wordpress_username, wordpress_password')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to fetch user credentials: ${error.message}`);
    }

    if (!data) {
      throw new Error('User not found');
    }

    // Decrypt credentials
    const decryptedCredentials = {
      geminiKey: data.gemini_api_key ? decrypt(data.gemini_api_key) : null,
      wpUrl: data.wordpress_url ? decrypt(data.wordpress_url) : null,
      wpUser: data.wordpress_username ? decrypt(data.wordpress_username) : null,
      wpPass: data.wordpress_password ? decrypt(data.wordpress_password) : null
    };

    // Validate required credentials
    if (!decryptedCredentials.geminiKey) {
      throw new Error('Gemini API Key not configured');
    }
    if (!decryptedCredentials.wpUrl || !decryptedCredentials.wpUser || !decryptedCredentials.wpPass) {
      throw new Error('WordPress credentials not fully configured');
    }

    return decryptedCredentials;
  } catch (error) {
    console.error('[UserCredentials] Error:', error.message);
    throw error;
  }
}

/**
 * Get only WordPress credentials for posting
 * @param {string} userId - User ID from JWT token
 * @returns {object} - Decrypted WordPress credentials
 */
export async function getWordPressCredentials(userId) {
  try {
    const credentials = await getUserCredentialsForPosting(userId);
    return {
      wpUrl: credentials.wpUrl,
      wpUser: credentials.wpUser,
      wpPass: credentials.wpPass
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get only Gemini API Key
 * @param {string} userId - User ID from JWT token
 * @returns {string} - Decrypted Gemini API Key
 */
export async function getGeminiApiKey(userId) {
  try {
    const credentials = await getUserCredentialsForPosting(userId);
    return credentials.geminiKey;
  } catch (error) {
    throw error;
  }
}
