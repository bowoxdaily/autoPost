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
      .select('ai_provider, gemini_api_key, chatgpt_api_key, claude_api_key, wordpress_url, wordpress_username, wordpress_password, content_language, trending_enabled, trending_niche, include_images')
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
    const aiProvider = data.ai_provider || 'gemini'; // Default to gemini for backward compatibility
    const decryptedCredentials = {
      aiProvider,
      geminiKey: data.gemini_api_key ? decrypt(data.gemini_api_key) : null,
      chatgptKey: data.chatgpt_api_key ? decrypt(data.chatgpt_api_key) : null,
      claudeKey: data.claude_api_key ? decrypt(data.claude_api_key) : null,
      wpUrl: data.wordpress_url ? decrypt(data.wordpress_url) : null,
      wpUser: data.wordpress_username ? decrypt(data.wordpress_username) : null,
      wpPass: data.wordpress_password ? decrypt(data.wordpress_password) : null,
      contentLanguage: data.content_language || 'id',
      trendingEnabled: data.trending_enabled ?? true,
      trendingNiche: data.trending_niche || '',
      includeImages: data.include_images ?? true
    };

    // Validate required credentials based on provider
    const providerApiKey = 
      aiProvider === 'gemini' ? decryptedCredentials.geminiKey :
      aiProvider === 'chatgpt' ? decryptedCredentials.chatgptKey :
      aiProvider === 'claude' ? decryptedCredentials.claudeKey :
      null;

    if (!providerApiKey) {
      throw new Error(`${aiProvider} API Key not configured`);
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
 * Get AI provider and its API key for content generation
 * @param {string} userId - User ID from JWT token
 * @returns {object} - { provider, apiKey }
 */
export async function getAiProviderAndKey(userId) {
  try {
    const credentials = await getUserCredentialsForPosting(userId);
    
    const providerApiKey = 
      credentials.aiProvider === 'gemini' ? credentials.geminiKey :
      credentials.aiProvider === 'chatgpt' ? credentials.chatgptKey :
      credentials.aiProvider === 'claude' ? credentials.claudeKey :
      null;

    if (!providerApiKey) {
      throw new Error(`No API key found for provider: ${credentials.aiProvider}`);
    }

    return {
      provider: credentials.aiProvider,
      apiKey: providerApiKey
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get only Gemini API Key (deprecated - use getAiProviderAndKey instead)
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
