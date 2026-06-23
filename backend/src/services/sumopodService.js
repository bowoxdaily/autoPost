import axios from 'axios';

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
  const fallbackTitle = language === 'en'
    ? `Best ${topic}: Complete Guide`
    : `Panduan Lengkap ${topic} Terbaik`;

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

export async function generatePostContent(apiKey, topic, language = 'id', refinementHint = '') {
  if (!apiKey) {
    throw new Error('Sumopod API key is missing. Please configure it in User Credentials.');
  }

  if (String(apiKey).trim().length < 20) {
    throw new Error('Invalid Sumopod API key format.');
  }

  const baseUrl = (process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1').replace(/\/$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const model = process.env.SUMOPOD_MODEL || 'gpt-4o-mini';

  const languageInstruction =
    language === 'en'
      ? 'Write the entire output in English.'
      : 'Tulis seluruh output dalam Bahasa Indonesia.';

  const prompt = `Generate a SEO-optimized blog post about "${topic}".

LANGUAGE REQUIREMENT:
${languageInstruction}

Return ONLY valid JSON (no markdown):
{
  "title": "SEO title (50-60 chars, timeless)",
  "slug": "url-friendly-slug",
  "metaDescription": "150-160 chars",
  "content": "Full HTML content with <h2>, <h3>, <p>, <strong>, <em> tags. Must be 1200+ words.",
  "imagePrompt": "professional business image search query",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "seoScore": 85
}

${refinementHint ? `REVISION INSTRUCTIONS (MUST FOLLOW):\n${refinementHint}` : ''}`;

  try {
    const response = await axios.post(
      endpoint,
      {
        model,
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO content writer. Always return clean JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const text = response?.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from Sumopod');
    }

    const jsonCandidate = extractFirstJsonObject(text);
    if (!jsonCandidate) {
      throw new Error('Sumopod did not return JSON content');
    }

    const parsed = JSON.parse(jsonCandidate);
    return normalizeOutput(parsed, topic, language);
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

    throw new Error(`Sumopod generation failed: ${message}`);
  }
}

export default { generatePostContent };
