import { generatePostContent as generateWithGemini } from './geminiService.js';

// Placeholder untuk ChatGPT
async function generateWithChatGPT(apiKey, topic, language = 'id', refinementHint = '') {
  if (!apiKey) {
    throw new Error('ChatGPT API key is missing');
  }

  // TODO: Implement OpenAI ChatGPT integration
  // For now, throw not implemented
  throw new Error('ChatGPT provider is not yet implemented. Please use Gemini for now.');
}

// Placeholder untuk Claude
async function generateWithClaude(apiKey, topic, language = 'id', refinementHint = '') {
  if (!apiKey) {
    throw new Error('Claude API key is missing');
  }

  // TODO: Implement Anthropic Claude integration
  throw new Error('Claude provider is not yet implemented. Please use Gemini for now.');
}

/**
 * Generate post content using selected AI provider
 * @param {string} provider - AI provider: 'gemini', 'chatgpt', 'claude'
 * @param {string} apiKey - API key for the provider
 * @param {string} topic - Topic for the post
 * @param {string} language - Language: 'id' or 'en'
 * @param {string} refinementHint - Optional hint for content refinement
 * @returns {object} - Generated post content
 */
export async function generatePostContent(provider, apiKey, topic, language = 'id', refinementHint = '') {
  console.log(`🤖 [ContentGeneration] Using provider: ${provider}`);

  switch (provider?.toLowerCase()) {
    case 'gemini':
      return await generateWithGemini(apiKey, topic, language, refinementHint);
    
    case 'chatgpt':
      return await generateWithChatGPT(apiKey, topic, language, refinementHint);
    
    case 'claude':
      return await generateWithClaude(apiKey, topic, language, refinementHint);
    
    default:
      throw new Error(`Unknown AI provider: ${provider}. Supported: gemini, chatgpt, claude`);
  }
}

/**
 * Get list of available providers with status
 */
export function getAvailableProviders() {
  return [
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Fast and cost-effective AI content generation',
      status: 'available',
      getKeyUrl: 'https://aistudio.google.com/app/apikey',
      keyFormat: 'AIza...',
      docs: 'https://ai.google.dev'
    },
    {
      id: 'chatgpt',
      name: 'OpenAI ChatGPT',
      description: 'Powerful and advanced AI content generation',
      status: 'coming-soon',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      keyFormat: 'sk-...',
      docs: 'https://openai.com/docs'
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      description: 'Advanced AI with strong reasoning capabilities',
      status: 'coming-soon',
      getKeyUrl: 'https://console.anthropic.com',
      keyFormat: 'sk-ant-...',
      docs: 'https://docs.anthropic.com'
    }
  ];
}

/**
 * Validate provider and API key format
 */
export function validateProviderKey(provider, apiKey) {
  if (!provider || !apiKey) {
    return { valid: false, error: 'Provider and API key are required' };
  }

  const keyChecks = {
    gemini: {
      minLength: 20,
      pattern: /^AIza[a-zA-Z0-9_-]{67,}$/,
      message: 'Invalid Gemini API key format. Should start with AIza'
    },
    chatgpt: {
      minLength: 20,
      pattern: /^sk-[a-zA-Z0-9]+$/,
      message: 'Invalid ChatGPT API key format. Should start with sk-'
    },
    claude: {
      minLength: 20,
      pattern: /^sk-ant-[a-zA-Z0-9]+$/,
      message: 'Invalid Claude API key format. Should start with sk-ant-'
    }
  };

  const check = keyChecks[provider?.toLowerCase()];
  if (!check) {
    return { valid: false, error: `Unknown provider: ${provider}` };
  }

  if (apiKey.length < check.minLength) {
    return { valid: false, error: `API key too short (min ${check.minLength} chars)` };
  }

  if (!check.pattern.test(apiKey)) {
    return { valid: false, error: check.message };
  }

  return { valid: true };
}
