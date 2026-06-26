import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getLanguageInstruction,
  getFallbackTitle,
  getTitleStyleRules,
  getReadabilityRules,
  getSystemPersona,
  getPillarPromptSection,
  getSupportingPromptSection
} from './promptStyle.js';

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

export async function generatePostContent(apiKey, topic, language = 'id', refinementHint = '', clusterContext = null) {
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

    const languageInstruction = getLanguageInstruction(language);

    const systemPersona = getSystemPersona(language);

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

    const prompt = `${systemPersona}

Write a blog post about "${topic}".

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
   - Minimum 1 real or realistic example per section ("Imagine you run a small store...", "A client once told me...").
   - At least one <ul> and one <ol> somewhere in the body — but make them feel natural, not formulaic.
   - Use <strong> to emphasize 1-2 genuinely important phrases per section, not decoration.
   - H3 subsections are optional — only use them when the section genuinely needs it.

3. CLOSING (H2): A direct, opinionated wrap-up. No "In conclusion" or "Sebagai kesimpulan". Share what you actually think the most important takeaway is. A short CTA that sounds human.

4. FAQ (H2, 3-4 questions): Real questions real readers would ask. Answers should be direct and confident, 2-3 sentences each. Not academic.

━━━ SEO REQUIREMENTS ━━━
- SLUG: URL-friendly (lowercase, hyphens, no dates). Example: "email-marketing-yang-benar-benar-jalan"
- META DESCRIPTION (150-160 chars): Start with keyword, give a real benefit, end with action. No clickbait.
- KEYWORDS: 3-5 relevant keywords or phrases (not just single words).
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
  "metaDescription": "150-160 char description: keyword + real benefit + action, no dates",
  "content": "Full HTML content. 1500+ words. Uses <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>. Sounds human.",
  "imagePrompt": "specific descriptive image query (5-8 words, e.g. 'small business owner reviewing marketing analytics')",
  "keywords": ["specific phrase 1", "keyword 2", "phrase 3"],
  "seoScore": 80
}

JSON must be valid. Content must be 1500+ actual words of HTML.
${refinementHint ? `\n━━━ REVISION INSTRUCTIONS (FOLLOW EXACTLY) ━━━\n${refinementHint}\n` : ''}`;

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
