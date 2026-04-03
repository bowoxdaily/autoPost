import { GoogleGenerativeAI } from '@google/generative-ai';

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

export async function generatePostContent(apiKey, topic, language = 'id', refinementHint = '') {
  try {
    // Validate API key format
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please configure it in User Credentials.');
    }
    
    if (apiKey.length < 20) {
      throw new Error('Invalid Gemini API key format. Please verify the key length and format.');
    }
    
    console.log(`🔑 [Gemini] Initializing with API key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Prefer free-tier friendly flash models first
    let model;
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 [Gemini] Testing model: ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a quick test to verify the model works
        const testResult = await model.generateContent('Test');
        console.log(`✅ [Gemini] Using model: ${modelName}`);
        break;
      } catch (testError) {
        lastError = testError;
        const errorMsg = testError.message || testError.toString();
        console.log(`⚠️  [Gemini] Model ${modelName} not available: ${errorMsg}`);
        
        // Check for specific error patterns
        const invalidKeyPatterns = [
          'api key not valid',
          'invalid api key',
          'api_key_invalid'
        ];
        if (invalidKeyPatterns.some(p => errorMsg.toLowerCase().includes(p))) {
          throw new Error(`❌ Gemini API key is invalid or incorrect. Error: ${errorMsg}`);
        }
        if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
          throw new Error(`❌ API quota exceeded. Please check your Gemini API quota and billing. Error: ${errorMsg}`);
        }
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          // Model may be unavailable for this account/region, keep trying next fallback model.
          continue;
        }
        if (errorMsg.includes('permission') || errorMsg.includes('403')) {
          throw new Error(`❌ Permission denied. Make sure your Gemini API has access enabled. Error: ${errorMsg}`);
        }
        continue;
      }
    }
    
    if (!model) {
      const errorDetails = lastError ? `Last error: ${lastError.message}` : 'Unknown error';
      throw new Error(`❌ No compatible Gemini model available. Tried models: ${modelsToTry.join(', ')}. ${errorDetails}. 
      
      💡 Solutions:
      1. Verify your Gemini API key is correct (User Credentials)
      2. Check your API quota at https://console.cloud.google.com
      3. Enable billing in your Google Cloud project
      4. Ensure API is enabled in: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`);
    }

    const languageInstruction =
      language === 'en'
        ? 'Write the entire output in English.'
        : 'Tulis seluruh output dalam Bahasa Indonesia.';

    const prompt = `Generate a SEO-optimized blog post about "${topic}".

LANGUAGE REQUIREMENT:
${languageInstruction}

CRITICAL: NO DATES OR "LATEST" IN TITLE - Make it timeless for long-term ranking!

REQUIREMENTS FOR SEO PAGE 1 RANKING:
1. TITLE (50-60 chars, include keyword at start):
   - Use power words: How, Best, Complete, Guide, Tips, Proven, Essential, Definitive
   - Include "${topic}" naturally and early in title
   - NO dates (no 2024, 2025, 3/31, etc) - dates age content
   - NO "Latest", "New", "Updated" - not SEO-friendly
   - Example: "Best ${topic}: Complete Guide" or "How to Master ${topic}"
   - Make it TIMELESS - should rank well in 2+ years

2. SLUG: Generate URL-friendly slug (lowercase, hyphens)
   - Reflect the main keyword, no dates
   - Example: "best-digital-marketing-strategy" not "digital-marketing-2024"

3. META DESCRIPTION (150-160 chars):
   - Include keyword clearly at start
   - Include benefit/value proposition
   - Call to action
   - NO dates or "latest" keywords
   - Compelling, click-worthy

4. CONTENT (1500+ words):
   - Use H2 headers for main sections
   - Use H3 headers for subsections
   - Include at least one bullet list (<ul><li>) and one numbered list (<ol><li>)
   - Add a short FAQ section with 3-5 questions at the end (H2 + H3)
   - Include target keyword in first 100 words
   - Keyword density 1-2%
   - Include actionable, proven tips
   - Add related topic suggestions
   - Write for readers, optimize for search
   - DO NOT reference specific dates or "latest trends" - focus on evergreen content
   - Use phrases like "current best practices" not "2024 trends"

5. IMAGE PROMPT:
   - Create a professional, descriptive image search query (5-10 words)
   - The query should visually represent the blog post topic
   - Use terms suitable for searching stock photo sites
   - Make it inspiring and professional
   - Example: "professional business team collaboration meeting"

6. STRUCTURE:
   - Introduction (200 words) - explain why this topic matters NOW and ALWAYS
   - 4-5 main sections with H2 headers
   - Each section 200+ words with practical insights
   - Conclusion with CTA (timeless, not date-based)
   - FAQ section (timeless questions)

Return ONLY valid JSON (no markdown):
{
  "title": "SEO-optimized title (50-60 chars, TIMELESS no dates)",
  "slug": "url-friendly-slug-no-dates",
  "metaDescription": "150-160 char description with keyword, no dates",
  "content": "Full HTML content with <h2>, <h3>, <p>, <strong>, <em> tags. Must be 1500+ words. TIMELESS content, no specific dates.",
  "imagePrompt": "professional business image search query",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "seoScore": 85-90
}

Make sure JSON is valid. Content must be actual 1500+ words.
${refinementHint ? `\nREVISION INSTRUCTIONS (MUST FOLLOW):\n${refinementHint}\n` : ''}`;

    console.log(`📝 [Gemini] Generating SEO-optimized content for: ${topic}`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
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

    // Parse JSON from response - more robust extraction
    try {
      const jsonCandidate = extractFirstJsonObject(text);
      if (jsonCandidate) {
        let jsonStr = jsonCandidate;

        // Remove any markdown code block markers (defensive)
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try parsing
        try {
          const parsed = JSON.parse(jsonStr);
          console.log(`✅ [Gemini] SEO Content generated: "${parsed.title}" (${parsed.seoScore}/100)`);
          return normalizeOutput(parsed, topic, language);
        } catch (parseError) {
          console.log(`⚠️  [Gemini] JSON parse error: ${parseError.message}. Attempting to recover...`);
          
          // Extract sections more carefully
          const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]+)"/);
          const slugMatch = jsonStr.match(/"slug"\s*:\s*"([^"]+)"/);
          const descMatch = jsonStr.match(/"metaDescription"\s*:\s*"([^"]+)"/);
          const scoreMatch = jsonStr.match(/"seoScore"\s*:\s*(\d+)/);
          const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[(.*?)\]/);
          
          // Extract content more carefully using position-based approach
          let content = 'Unable to parse content';
          
          try {
            const indexOfAny = (str, patterns, startIdx = 0) => {
              let best = -1;
              for (const p of patterns) {
                const i = str.indexOf(p, startIdx);
                if (i !== -1 && (best === -1 || i < best)) best = i;
              }
              return best;
            };

            const contentKeyIdx = indexOfAny(jsonStr, ['"content"', '“content”']);
            const imagePromptKeyIdx = indexOfAny(jsonStr, ['"imagePrompt"', '“imagePrompt”'], contentKeyIdx === -1 ? 0 : contentKeyIdx + 1);
            const keywordsKeyIdx = indexOfAny(jsonStr, ['"keywords"', '“keywords”'], contentKeyIdx === -1 ? 0 : contentKeyIdx + 1);

            // We prefer slicing until imagePrompt because prompt order is content -> imagePrompt -> keywords
            const endIdx = imagePromptKeyIdx !== -1 ? imagePromptKeyIdx : keywordsKeyIdx;

            if (contentKeyIdx !== -1 && endIdx !== -1 && endIdx > contentKeyIdx) {
              const colonIdx = jsonStr.indexOf(':', contentKeyIdx);
              if (colonIdx !== -1 && colonIdx < endIdx) {
                let rawValue = jsonStr.slice(colonIdx + 1, endIdx).trim();

                // Remove trailing comma if present
                if (rawValue.endsWith(',')) rawValue = rawValue.slice(0, -1).trim();

                // Remove wrapping quotes (either straight or smart quotes)
                if (
                  (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
                  (rawValue.startsWith('“') && rawValue.endsWith('”'))
                ) {
                  rawValue = rawValue.slice(1, -1);
                }

                // Unescape common escape sequences inside JSON string
                rawValue = rawValue
                  .replace(/\\n/g, '\n')
                  .replace(/\\t/g, '\t')
                  .replace(/\\"/g, '"')
                  .replace(/\\\//g, '/')
                  .replace(/\\\\/g, '\\');

                content = rawValue;
              }
            }
          } catch (extractError) {
            console.log(`⚠️  [Gemini] Content extraction error: ${extractError.message}`);
            // Keep the fallback value
          }
          
          if (titleMatch) {
            console.log(`✅ [Gemini] Partially recovered content for: "${titleMatch[1]}"`);
            
            // Parse keywords array
            let keywords = [topic];
            if (keywordsMatch) {
              try {
                keywords = JSON.parse('[' + keywordsMatch[1] + ']');
              } catch (e) {
                keywords = keywordsMatch[1].split(',').map(k => k.trim().replace(/"/g, ''));
              }
            }

            // If content extraction failed, fallback to the full raw response text.
            // This prevents the post from being published with "Unable to parse content".
            if (!content || content === 'Unable to parse content') {
              content = text;
            }

            return normalizeOutput({
              title: titleMatch[1],
              slug: slugMatch ? slugMatch[1] : topic.toLowerCase().replace(/\s+/g, '-'),
              metaDescription: descMatch ? descMatch[1] : `Learn about ${topic}`,
              content: content,
              imagePrompt: `professional ${topic.toLowerCase()} business illustration`,
              keywords: keywords,
              seoScore: scoreMatch ? parseInt(scoreMatch[1]) : 75
            }, topic, language);
          }
          
          throw parseError;
        }
      }
    } catch (parseError) {
      console.log(`⚠️  [Gemini] Failed to parse JSON response: ${parseError.message}`);
      console.log(`📋 Raw response preview: ${text.substring(0, 200)}...`);
    }

    console.log(`⚠️  [Gemini] No valid JSON found, using fallback format`);
    return normalizeOutput({
      title: language === 'en' ? `Best ${topic}: Complete Guide` : `Panduan Lengkap ${topic} Terbaik`,
      slug: topic.toLowerCase().replace(/\s+/g, '-'),
      metaDescription: language === 'en'
        ? `Discover the best practices for ${topic}. Complete guide with tips and strategies.`
        : `Temukan praktik terbaik untuk ${topic}. Panduan lengkap dengan tips dan strategi.`,
      content: text,
      imagePrompt: `professional ${topic.toLowerCase()} business illustration`,
      keywords: [topic],
      seoScore: 0
    }, topic, language);
  } catch (error) {
    console.error(`❌ [Gemini] Error: ${error.message}`);
    
    const errorMsg = error.message || error.toString();
    
    const invalidKeyPatterns = [
      'api key not valid',
      'invalid api key',
      'api_key_invalid'
    ];
    if (invalidKeyPatterns.some(p => errorMsg.toLowerCase().includes(p))) {
      throw new Error(`❌ Gemini API Configuration Error: Invalid API key. 
      
Steps to fix:
1. Go to Dashboard → Account (top right)
2. Update your Gemini API key
3. Verify the key at: https://aistudio.google.com/apikey
4. Make sure to enable billing: https://console.cloud.google.com/billing`);
    }
    
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('limit exceeded')) {
      throw new Error(`❌ API Quota Exceeded: Your Gemini API quota is exhausted.

Steps to fix:
1. Check your quota at: https://console.cloud.google.com/iam-admin/quotas
2. Review pricing: https://ai.google.dev/pricing
3. Enable billing if not already enabled
4. Request quota increase if needed`);
    }
    
    if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('No compatible')) {
      throw new Error(`❌ No Available Gemini Models: Unable to access any compatible model.

Steps to fix:
1. Verify model availability: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Ensure API is enabled
3. Check region availability
4. Try regenerating after a few minutes
5. Contact Google Cloud Support if issue persists`);
    }
    
    if (errorMsg.includes('permission') || errorMsg.includes('403')) {
      throw new Error(`❌ Permission Denied: Your API key doesn't have permission to access Gemini models.

Steps to fix:
1. Verify your API key has necessary permissions
2. Regenerate API key: https://aistudio.google.com/apikey
3. Update key in Dashboard → Account
4. Ensure your Google Cloud project has the API enabled`);
    }
    
    // Generic error with helpful debug info
    throw new Error(`❌ Failed to generate content: ${errorMsg}
    
This could be due to:
- Invalid API key (verify in Dashboard → Account)
- Quota exceeded (check https://console.cloud.google.com/iam-admin/quotas)
- No billing setup (enable at https://console.cloud.google.com/billing)
- API not enabled (enable at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)
- Connection issues (try again in a few moments)

Debug info: ${errorMsg}`);
  }
}
