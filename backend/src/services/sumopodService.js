import axios from 'axios';
import {
  getLanguageInstruction,
  getFallbackTitle,
  getTitleStyleRules,
  getReadabilityRules,
  getSystemPersona,
  getPillarPromptSection,
  getSupportingPromptSection
} from './promptStyle.js';

function getSumopodBaseUrl() {
  return (process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1').replace(/\/$/, '');
}

function getPositiveNumberEnv(name, fallback) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

// Returns a positive number, 0 (meaning "no limit / omit"), or the fallback when unset.
function getOptionalTokenEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || String(value).trim() === '') {
    return fallback;
  }
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 0) {
    return fallback;
  }
  return raw; // 0 means omit max_tokens (let the model use its maximum)
}

function hasUnclosedJsonObject(input) {
  const start = input.indexOf('{');
  if (start === -1) return false;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < input.length; index++) {
    const ch = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }

  return depth > 0;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeOutput(parsed, topic, language) {
  const fallbackTitle = getFallbackTitle(topic, language);

  const title = String(parsed?.title || fallbackTitle).trim();
  const slug = slugify(parsed?.slug || title || topic);

  let metaDescription = String(parsed?.metaDescription || '').trim();
  if (!metaDescription) {
    metaDescription = language === 'en'
      ? `Discover the best practices for ${topic}. Complete guide with tips and strategies.`
      : `Temukan praktik terbaik untuk ${topic}. Panduan lengkap dengan tips dan strategi.`;
  }
  if (metaDescription.length > 160) metaDescription = metaDescription.slice(0, 157).trim() + '...';

  let keywords = Array.isArray(parsed?.keywords) ? parsed.keywords : [topic];
  keywords = [...new Set(keywords.map(k => String(k).trim()).filter(Boolean))].slice(0, 6);
  if (keywords.length === 0) keywords = [topic];

  const seoScore = Number.isFinite(Number(parsed?.seoScore))
    ? Number(parsed.seoScore)
    : 75;

  return {
    title,
    slug,
    metaDescription,
    content: parsed?.content || '',
    imagePrompt: parsed?.imagePrompt || `professional ${topic.toLowerCase()} business illustration`,
    keywords,
    seoScore
  };
}

function extractFirstJsonObject(input) {
  const start = input.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }

  return null;
}

function normalizeModelText(content) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item?.text === 'string') return item.text;
        if (typeof item?.content === 'string') return item.content;
        return '';
      })
      .join('\n')
      .trim();
  }

  if (typeof content?.text === 'string') {
    return content.text.trim();
  }

  return '';
}

function recoverStructuredJson(jsonStr, topic) {
  const grab = (key) => {
    const match = jsonStr.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,|\\n|\\}|$)`));
    return match?.[1];
  };

  const titleMatch = grab('title');
  const slugMatch = grab('slug');
  const descMatch = grab('metaDescription');
  const imageMatch = grab('imagePrompt');
  const scoreMatch = jsonStr.match(/"seoScore"\s*:\s*(\d+)/);
  const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[(.*?)\]/s);

  // content can be very large and may be truncated (no closing quote)
  let content = '';
  const contentKey = '"content"';
  const contentIndex = jsonStr.indexOf(contentKey);
  if (contentIndex !== -1) {
    const firstQuote = jsonStr.indexOf('"', contentIndex + contentKey.length);
    if (firstQuote !== -1) {
      let escaped = false;
      let closed = false;
      for (let index = firstQuote + 1; index < jsonStr.length; index++) {
        const ch = jsonStr[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          content = jsonStr.slice(firstQuote + 1, index);
          closed = true;
          break;
        }
      }
      if (!closed) {
        // Truncated mid-content: keep whatever was produced.
        content = jsonStr.slice(firstQuote + 1);
      }
    }
  }

  // Drop a trailing unfinished HTML tag from truncated content.
  content = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/<[^>]*$/, '')
    .trim();

  const parsedKeywords = keywordsMatch
    ? keywordsMatch[1]
      .split(',')
      .map((keyword) => keyword.replace(/^\s*"|"\s*$/g, '').trim())
      .filter(Boolean)
    : [topic];

  return {
    title: titleMatch?.replace(/\\"/g, '"') || `Cara Tepat Memahami ${topic}`,
    slug: slugMatch?.replace(/\\"/g, '"') || slugify(topic),
    metaDescription: descMatch?.replace(/\\"/g, '"') || '',
    content,
    imagePrompt: imageMatch?.replace(/\\"/g, '"') || undefined,
    keywords: parsedKeywords,
    seoScore: scoreMatch?.[1] ? Number(scoreMatch[1]) : 75
  };
}

function hasUsableContent(parsed) {
  const plain = String(parsed?.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length >= 200;
}

// Parses a model response and reports status instead of throwing, so callers can
// decide whether to retry, salvage, or fail.
function parseGeneratedPayload(rawContent, topic) {
  const text = normalizeModelText(rawContent);
  if (!text) {
    return { ok: false, reason: 'empty', text: '' };
  }

  const jsonCandidate = extractFirstJsonObject(text);
  if (!jsonCandidate) {
    return {
      ok: false,
      reason: hasUnclosedJsonObject(text) ? 'truncated' : 'nojson',
      text
    };
  }

  const cleanJson = jsonCandidate
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return { ok: true, value: JSON.parse(cleanJson), text };
  } catch (parseError) {
    return { ok: true, value: recoverStructuredJson(cleanJson, topic), text };
  }
}

function buildMessages(prompt, language = 'id') {
  return [
    {
      role: 'system',
      content: getSystemPersona(language)
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function errorMessageOf(error) {
  return String(
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    ''
  ).toLowerCase();
}

// Single chat-completion call with a specific parameter profile.
async function callChatCompletion({ endpoint, apiKey, model, maxTokens, timeoutMs, prompt, profile, language = 'id' }) {
  const payload = {
    model,
    messages: buildMessages(prompt, language)
  };

  if (profile.includeTemperature) {
    payload.temperature = 0.7;
  }

  if (Number(maxTokens) > 0) {
    payload[profile.tokenParam] = Number(maxTokens);
  }

  if (profile.useJsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await axios.post(
    endpoint,
    payload,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    }
  );

  return response?.data?.choices?.[0]?.message?.content;
}

// Adaptive request: progressively drops/swaps parameters that a given model
// rejects (JSON mode, temperature, max_tokens vs max_completion_tokens) so that
// any OpenAI-compatible Sumopod model can be used.
async function requestSumopodContent({ endpoint, apiKey, model, maxTokens, timeoutMs, prompt, language = 'id' }) {
  const profile = {
    useJsonMode: true,
    includeTemperature: true,
    tokenParam: 'max_tokens'
  };
  let effectiveMaxTokens = maxTokens;

  // Bounded number of adaptations to avoid infinite loops.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await callChatCompletion({
        endpoint,
        apiKey,
        model,
        maxTokens: effectiveMaxTokens,
        timeoutMs,
        prompt,
        profile,
        language
      });
    } catch (error) {
      const status = error?.response?.status;
      const message = errorMessageOf(error);
      const isParamError = status === 400 || status === 404 || status === 422;

      if (isParamError && profile.useJsonMode &&
        (message.includes('response_format') || message.includes('json_object') || message.includes('json mode'))) {
        profile.useJsonMode = false;
        continue;
      }

      if (isParamError && profile.includeTemperature && message.includes('temperature')) {
        profile.includeTemperature = false;
        continue;
      }

      if (isParamError && profile.tokenParam === 'max_tokens' &&
        (message.includes('max_tokens') || message.includes('max_completion_tokens'))) {
        profile.tokenParam = 'max_completion_tokens';
        continue;
      }

      if (isParamError && profile.tokenParam === 'max_completion_tokens' &&
        message.includes('max_completion_tokens')) {
        // Model rejects an explicit token cap entirely; let it use its default.
        effectiveMaxTokens = 0;
        profile.tokenParam = 'max_tokens';
        continue;
      }

      throw error;
    }
  }

  // Last resort: minimal payload with no optional parameters.
  return await callChatCompletion({
    endpoint,
    apiKey,
    model,
    maxTokens: 0,
    timeoutMs,
    prompt,
    language,
    profile: { useJsonMode: false, includeTemperature: false, tokenParam: 'max_tokens' }
  });
}

export async function generatePostContent(apiKey, topic, language = 'id', refinementHint = '', options = {}) {
  if (!apiKey) {
    throw new Error('Sumopod API key is missing. Please configure it in User Credentials.');
  }

  if (String(apiKey).trim().length < 20) {
    throw new Error('Invalid Sumopod API key format.');
  }

  const baseUrl = getSumopodBaseUrl();
  const endpoint = `${baseUrl}/chat/completions`;
  const model = String(options?.model || process.env.SUMOPOD_MODEL || 'gpt-4o-mini').trim();
  const timeoutMs = getPositiveNumberEnv('SUMOPOD_TIMEOUT_MS', 180000);
  // Default 0 = do not cap output tokens (let the model produce full content).
  // Set SUMOPOD_MAX_TOKENS to a positive number to enforce a cap.
  const maxTokens = getOptionalTokenEnv('SUMOPOD_MAX_TOKENS', 0);
  const retryMaxTokens = getOptionalTokenEnv('SUMOPOD_RETRY_MAX_TOKENS', 0);

  const languageInstruction = getLanguageInstruction(language);
  const clusterContext = options.clusterContext || null;

  // Build cluster section if context provided
  let clusterSection = '';
  if (clusterContext) {
    if (clusterContext.mode === 'pillar') {
      clusterSection = getPillarPromptSection(clusterContext.niche, language);
    } else if (clusterContext.mode === 'supporting') {
      clusterSection = getSupportingPromptSection(
        clusterContext.niche,
        clusterContext.pillarTitle,
        clusterContext.pillarUrl,
        clusterContext.supportingIndex,
        language
      );
    }
  }

  const prompt = `Write a blog post about "${topic}".

LANGUAGE: ${languageInstruction}

━━━ HUMAN WRITING — THIS IS THE MOST IMPORTANT REQUIREMENT ━━━
This post MUST pass AI content detection tools (GPTZero, Turnitin, Originality.ai).
Write exactly as an experienced human blogger would — with genuine personality, rhythm variation, and real opinions.

${getTitleStyleRules(topic)}

${getReadabilityRules()}
${clusterSection ? `
${clusterSection}
` : ''}
━━━ CONTENT STRUCTURE (1500+ words) ━━━

1. OPENING (no H2 yet): Start with 1-2 punchy sentences that hook the reader. NOT with "In today's world" or "Di era digital ini". Maybe a surprising fact, a question, or a bold statement about ${topic}. Then a short paragraph that sets up why this matters.

2. BODY (4-5 H2 sections, each 250-350 words):
   - Each section must start differently — question, statement, fact, or contrast opener.
   - Minimum 1 real or realistic example per section.
   - At least one <ul> and one <ol> somewhere in the body — but make them feel natural, not formulaic.
   - Use <strong> to emphasize 1-2 genuinely important phrases per section.
   - H3 subsections are optional — only use them when the section genuinely needs it.

3. CLOSING (H2): A direct, opinionated wrap-up. No "In conclusion" or "Sebagai kesimpulan". Share what you actually think the most important takeaway is. A short CTA that sounds human.

4. FAQ (H2, 3-4 questions): Real questions real readers would ask. Direct and confident answers, 2-3 sentences each.

━━━ SEO REQUIREMENTS ━━━
- SLUG: URL-friendly (lowercase, hyphens, no dates). Example: "email-marketing-yang-benar-benar-jalan"
- META DESCRIPTION (150-160 chars): Start with keyword, give a real benefit, end with action. No clickbait.
- KEYWORDS: 3-5 relevant keyword phrases.
- Mention the primary keyword naturally in the first 120 words.
- NO dates in any part of the content.

━━━ QUALITY CHECKLIST (before you output) ━━━
- [ ] Title sounds like a human wrote it, not a content template
- [ ] Opening does NOT start with a banned AI phrase
- [ ] At least 3 different paragraph openers across the article
- [ ] At least one concrete example or scenario in the content
- [ ] No banned transition phrases anywhere in the content
- [ ] Contractions used at least 2-3 times naturally
- [ ] FAQ answers are direct and specific, not vague

Return ONLY valid JSON (no markdown, no explanation before or after):
{
  "title": "Human-sounding, specific title (50-60 chars, no clichés, no dates)",
  "slug": "url-friendly-slug-no-dates",
  "metaDescription": "150-160 char: keyword + real benefit + action, no dates",
  "content": "Full HTML content. 1500+ words. Uses <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>. Sounds human.",
  "imagePrompt": "specific descriptive image query (5-8 words)",
  "keywords": ["specific phrase 1", "keyword 2", "phrase 3"],
  "seoScore": 80
}

${refinementHint ? `━━━ REVISION INSTRUCTIONS (FOLLOW EXACTLY) ━━━\n${refinementHint}` : ''}`;

  try {
    let rawContent = await requestSumopodContent({
      endpoint,
      apiKey,
      model,
      maxTokens,
      timeoutMs,
      prompt,
      language
    });

    let result = parseGeneratedPayload(rawContent, topic);

    // If the JSON was cut off, retry once with a larger budget when that can help.
    if (!result.ok && result.reason === 'truncated') {
      const firstCap = Number(maxTokens) > 0 ? Number(maxTokens) : 0;
      let retryCap = Number(retryMaxTokens) > 0 ? Number(retryMaxTokens) : 0;
      if (retryCap === 0 && firstCap > 0) {
        retryCap = Math.max(firstCap * 2, 6000);
      }

      const canRetryHelp = firstCap > 0 || retryCap > 0;
      if (canRetryHelp) {
        console.warn(`⚠️  [Sumopod] Truncated JSON for model ${model}. Retrying with max_tokens=${retryCap || 'uncapped'}.`);
        rawContent = await requestSumopodContent({
          endpoint,
          apiKey,
          model,
          maxTokens: retryCap,
          timeoutMs,
          prompt,
          language
        });
        result = parseGeneratedPayload(rawContent, topic);
      }
    }

    if (result.ok) {
      return normalizeOutput(result.value, topic, language);
    }

    // Final fallback: salvage usable content from an incomplete/non-standard response.
    if (result.reason === 'truncated' || result.reason === 'nojson') {
      const salvaged = recoverStructuredJson(normalizeModelText(rawContent), topic);
      if (hasUsableContent(salvaged)) {
        console.warn(`⚠️  [Sumopod] Using salvaged content from a partial response for model ${model}.`);
        return normalizeOutput(salvaged, topic, language);
      }
    }

    throw new Error(`Sumopod did not return usable content. Response preview: ${(result.text || '').slice(0, 200)}`);
  } catch (error) {
    const status = error?.response?.status;
    const apiError = error?.response?.data?.error?.message || error?.response?.data?.message;
    const message = apiError || error.message;

    if (status === 401 || status === 403) {
      throw new Error(`Sumopod authentication failed: ${message}`);
    }

    if (status === 429) {
      throw new Error(`Sumopod rate limit exceeded: ${message}`);
    }

    if (error?.code === 'ECONNABORTED') {
      throw new Error(`Sumopod request timed out after ${timeoutMs}ms for model ${model}. Increase SUMOPOD_TIMEOUT_MS or use a faster model.`);
    }

    throw new Error(`Sumopod generation failed: ${message}`);
  }
}

export async function getAvailableModels(apiKey) {
  if (!apiKey) {
    throw new Error('Sumopod API key is missing. Please configure it in User Credentials.');
  }

  const endpoint = `${getSumopodBaseUrl()}/models`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const models = Array.isArray(response?.data?.data) ? response.data.data : [];

    return models
      .map((model) => ({
        id: String(model?.id || '').trim(),
        ownedBy: model?.owned_by || model?.ownedBy || '',
        created: model?.created || null
      }))
      .filter((model) => model.id);
  } catch (error) {
    const status = error?.response?.status;
    const apiError = error?.response?.data?.error?.message || error?.response?.data?.message;
    const message = apiError || error.message;

    if (status === 401 || status === 403) {
      throw new Error(`Sumopod authentication failed: ${message}`);
    }

    throw new Error(`Failed to fetch Sumopod models: ${message}`);
  }
}

export default { generatePostContent, getAvailableModels };
